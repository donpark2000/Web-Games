// Colour Sudoku screens (setup and play), from the mockup v3.1
// (2026-10-19; DESIGN.md "Colour Sudoku"). The rules, solver and hints
// live in src/core/colour-sudoku.js; this file only draws, keeps time and
// handles taps and keys. The puzzles come from data/colour-sudoku.json
// (tools/colour-sudoku-puzzles.js).

import {
  LEVELS, LEVEL_NAMES, HEARTS, PROGRESS_KEY, DEMO, NN, decode, stockAt, createGame, enter, toggleNote, undo, canUndo,
  endGame, useHint, walkStep, walkLength, fillRest, emptyCount, digitCounts, snapshotGame, restoreGame,
  readProgress, takeNext, recordTime, clock, coloursFor, rowOf, colOf,
} from '../core/colour-sudoku.js';
import { mergeSetup } from '../core/resume.js';
import { largestFitting } from '../core/fit.js';
import { STAR } from './hfboard.js';
import { boxLines, miniBoard } from './csboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen, fitEitherWay, setWide, wideRoom } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const STOCK_FILE = 'data/colour-sudoku.json';
const WIN_MS = 500;      // the last digit pops in, then the result and the end buttons
const LOSE_MS = 700;
const NOTE_MS = 2500;    // a moment's words in the hint bar
const MIN_CELL = 24, MAX_CELL = 58, MAX_CELL_WIDE = 87;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('colour-sudoku', msg, data);
const at = i => ({ square: i, row: rowOf(i) + 1, col: colOf(i) + 1 });

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { level: 'easy', tidy: true };

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing remembered */ }
// The next puzzle per level and the best times, kept on the device.
let prog = readProgress(null);
try { prog = readProgress(storage?.getItem(PROGRESS_KEY)); } catch { /* unreadable: start fresh */ }
function saveProgress() {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(prog)); } catch (e) { L('progress not kept', { error: String(e) }); }
}

let stock = null;      // { level: [entry, ...] } (decoded as each is played)
let G = null;          // the game being played, with the screen's extras (k, t0, col, sel, ...)
let clockTimer = null;
let lastFit = '';
// The last hint: { h (findHint's), deep: its Why? showing, lit: on the
// board }. Put out, its words stay in the bar, greyed; a tap lights it again.
let shown = null;
let note = null, noteTimer = null;

// Kept after every change, and picked up when the page opens again in the
// same visit (DESIGN.md "Coming back to a game"): the puzzle (level,
// number and seed), the board, the clock, the hint on show, Show me how's
// step and the result.
const resume = resumable('colour-sudoku', 1, () => ({
  screen: G ? 'play' : 'setup', setup,
  game: G && {
    ...snapshotGame(G), k: G.k, seed: G.seed, sel: G.sel, ms: G.end?.ms ?? G.walk?.ms ?? elapsed(), end: G.end,
    walk: G.walk && !G.result ? { step: G.walk.step, total: G.walk.total } : null,
    hint: shown && !G.result ? shown : null,
  },
}));
// A game kept from last time waits for the puzzles, with neither screen
// showing (and nothing kept over it meanwhile).
let resuming = resume.saved?.screen === 'play';

/* ---------- the puzzles ---------- */

const t0 = performance.now();
fetch(STOCK_FILE)
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(data => {
    if (LEVELS.some(lv => !data[lv]?.length)) throw new Error('a level has no puzzles');
    stock = Object.fromEntries(LEVELS.map(lv => [lv, data[lv]]));
    L('puzzles loaded', { counts: LEVELS.map(lv => `${lv}:${stock[lv].length}`).join(' '), ms: Math.round(performance.now() - t0), next: prog.next });
    if (resuming) { resuming = false; if (restore()) return; }
    renderSetup();
  })
  .catch(e => {
    stock = null;
    L('puzzles not loaded', { error: String(e) });
    if (resuming) { resuming = false; $('setup').hidden = false; setWide(false); renderSetup(); }
    $('why').textContent = 'The puzzles didn\'t load. Check the connection, then reload the page.';
  });

/* ---------- setup screen ---------- */

function renderSetup() {
  $('rulesPic').innerHTML = miniBoard(DEMO, DEMO.sol);
  for (const b of $('levels').children) b.setAttribute('aria-pressed', String(b.dataset.level === setup.level));
  for (const b of $('tidies').children) b.setAttribute('aria-pressed', String((b.dataset.tidy === 'on') === setup.tidy));
  $('playBtn').disabled = !stock;
  if (!stock && !$('why').textContent) $('why').textContent = 'Getting the puzzles…';
  if (stock) $('why').textContent = '';
  if (!resuming) resume.keep();
}
for (const b of $('levels').children) b.onclick = () => { setup.level = b.dataset.level; L('level', { level: setup.level }); renderSetup(); };
for (const b of $('tidies').children) b.onclick = () => { setup.tidy = b.dataset.tidy === 'on'; L('notes', { tidy: setup.tidy }); renderSetup(); };
$('playBtn').onclick = () => {
  if (!stock) return;
  showPlay();
  startNext(setup.level);
};
function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
}

/* ---------- play screen ---------- */

// A puzzle of the level not yet started (Play, Next): counted as used as
// it starts (DESIGN.md "Colour Sudoku": no repeats when you start again),
// so leaving it, giving up or running out of hearts doesn't bring it back;
// only Try again does. After the last they come round again (stockAt).
function startNext(level) {
  const k = takeNext(prog, level);
  saveProgress();
  L('puzzle used', { level, puzzle: k + 1, of: stock[level].length, round: Math.floor(k / stock[level].length) + 1, next: prog.next[level] + 1 });
  startGame(level, k);
}

// Puzzle number k (0-based, counting on past the end of the stock) of a
// level. `kept`: that puzzle's game as kept last time, picked up where it
// was left.
function startGame(level, k, kept = null) {
  const p = decode(level, stockAt(stock[level], k));
  G = kept ? restoreGame(p, kept) : createGame(p, { tidy: setup.tidy });
  const sky = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim() || '#E4F1EE';
  Object.assign(G, {
    k, col: coloursFor(p.reg, p.seed, sky), sel: kept && Number.isInteger(kept.sel) ? kept.sel : -1,
    t0: Date.now() - (kept?.ms ?? 0), paused: null, end: kept?.end ?? null, walk: null, popAt: -1, oopsAt: -1,
  });
  if (!kept) L('game started', { level, puzzle: k + 1, stock: k % stock[level].length + 1, seed: p.seed, givens: p.givens.filter(Boolean).length, tidy: G.tidy });
  shown = null;
  stopNote();
  $('askTools').hidden = true;
  $('endTools').hidden = true;
  clearInterval(clockTimer);
  render();
  lastFit = '';
  fit();
  if (G.result) {
    G.end ??= endFor(G.result, G.result === 'shown' ? 0 : null);
    $('clock').textContent = clock(G.end.ms);
    showEnd();
    return;
  }
  if (kept?.walk && walkAgain(kept)) return;
  clockTimer = setInterval(tick, 1000);
  tick();
  if (kept?.hint?.h) { shown = { h: kept.hint.h, deep: !!kept.hint.deep && !!kept.hint.h.why, lit: kept.hint.lit !== false }; render(); }
}

const elapsed = () => (G.paused ?? Date.now()) - G.t0;
function tick() { if (G && !G.result && !G.walk) $('clock').textContent = clock(elapsed()); }
// The clock stops while the page is hidden (another app, the phone locked).
document.addEventListener('visibilitychange', () => {
  if (!G || G.result) return;
  if (document.visibilityState === 'hidden' && G.paused == null) { G.paused = Date.now(); L('clock paused', { at: clock(elapsed()) }); }
  if (document.visibilityState === 'visible' && G.paused != null) { G.t0 += Date.now() - G.paused; G.paused = null; L('clock resumed', { at: clock(elapsed()) }); tick(); }
});

// Draws the board, the status line, the digits and the rows of buttons.
function render() {
  const h = shown?.lit && !G.result ? shown.h : null;
  const lit = new Set(h?.lit), pre = new Set(h?.pre), tags = new Map(shown?.deep && h ? h.tags : []), blockers = new Set(shown?.deep && h ? h.blockers : []);
  const b = $('board');
  b.classList.toggle('spot', !!h);
  $('dock').classList.toggle('lit', !!h);
  const selOn = G.sel >= 0 && !G.result && !G.walk && !h;
  const selD = selOn ? G.grid[G.sel] : 0;
  let html = '';
  for (let i = 0; i < NN; i++) {
    const c = G.col[G.reg[i]], d = G.grid[i], cls = ['sq'];
    let inner = '';
    if (d) {
      cls.push({ given: 'given', hint: 'hinted', pale: 'pale' }[G.kind[i]] ?? 'mine');
      inner = `<span class="d">${d}</span>`;
      if (selD && d === selD) cls.push('same');
    } else if (G.bad[i]) {
      cls.push('bad');
      if (i === G.oopsAt) cls.push('oops');
      inner = `<span class="d">${G.bad[i]}</span>`;
    } else if (G.notes[i]) {
      inner = `<span class="notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => {
        const has = G.notes[i] & (1 << k);
        return `<span${has && selD === k ? ' class="hl"' : ''}>${has ? k : ''}</span>`;
      }).join('')}</span>`;
    }
    if (selOn && i === G.sel) cls.push('sel');
    if (h && i === h.cell) cls.push('tgt');
    if (lit.has(i) || pre.has(i)) cls.push('lit');
    if (pre.has(i)) cls.push('pre');
    if (blockers.has(i)) cls.push('blocker');
    if (i === G.popAt) cls.push('pop');
    if (tags.has(i)) inner += `<span class="tag">${tags.get(i)}</span>`;
    const label = `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}, ${c.name}: ${d || (G.bad[i] ? `${G.bad[i]}, wrong` : 'empty')}`;
    html += `<div class="${cls.join(' ')}" role="gridcell" aria-label="${label}" data-i="${i}" style="--rc:${c.c};--fc:${c.fc};${boxLines(i)}">${inner}</div>`;
  }
  b.innerHTML = html;
  G.popAt = -1;
  G.oopsAt = -1;

  $('turn').textContent = `${LEVEL_NAMES[G.level]} · puzzle ${G.k + 1}`;
  const hearts = Math.max(0, G.hearts);
  $('hearts').textContent = '❤️'.repeat(hearts) + '🤍'.repeat(HEARTS - hearts);
  $('hearts').setAttribute('aria-label', `${hearts} of ${HEARTS} hearts left`);
  $('found').textContent = G.walk && !G.result ? `Step ${G.walk.step} of ${G.walk.total}` : `${emptyCount(G)} to go`;
  const cnt = digitCounts(G), off = !!(G.result || G.walk);
  const keyRow = asNote => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k =>
    `<button type="button" class="key" data-k="${k}"${asNote ? ' data-note="1"' : ''} aria-label="${asNote ? 'Note ' : ''}${k}"${cnt[k] === 9 || off ? ' disabled' : ''}>${k}</button>`).join('');
  $('keys').innerHTML = keyRow(false);
  $('noteKeys').innerHTML = keyRow(true);
  buttons();
  paintBar();
  resume.keep();
}

// The rows of buttons under the digits: the tools (Undo, Hint, Give up);
// while a hint is lit, its own (❓ Why?, ✓ Got it); Give up's question;
// Show me how's (❓ Why?, ⏩ The rest, Next ▸); the end's.
function buttons() {
  const lit = !!shown?.lit && !G.result;
  const asking = !$('askTools').hidden;
  if (G.result) {
    for (const id of ['tools', 'hintTools', 'walkTools', 'askTools']) $(id).hidden = true;
    return;
  }
  if (G.walk) {
    $('tools').hidden = true;
    $('hintTools').hidden = true;
    $('walkTools').hidden = false;
    const w = $('walkWhy');
    w.disabled = !shown?.h.why;
    w.textContent = shown?.deep ? '💡 The step' : '❓ Why?';
    w.classList.toggle('pressed', !!shown?.deep);
    const last = emptyCount(G) === 0;
    $('walkNext').textContent = last ? 'Finish ▸' : 'Next ▸';
    $('walkRest').disabled = last;
    return;
  }
  $('walkTools').hidden = true;
  $('tools').hidden = lit || asking;
  $('hintTools').hidden = !lit || asking;
  const w = $('whyBtn');
  w.hidden = !(lit && shown.h.why);
  w.textContent = shown?.deep ? '💡 The hint' : '❓ Why?';
  w.classList.toggle('pressed', !!shown?.deep);
  $('hintBtn').innerHTML = `💡 Hint <span class="left" id="hintsLeft">${G.hints}</span>`;
  $('hintBtn').disabled = !G.hints;
  $('undoBtn').disabled = !canUndo(G);
  if (!$('tools').hidden) fitTools();
}

// The hint bar's words: a note for a moment, the hint lit (or its Why?),
// the last hint greyed (tap to light it again), or nothing (hidden, its
// space kept so the board never moves). At the end, the result.
const AGAIN = '(tap to light it again)';
function paintBar() {
  if (G.result && G.end) return;   // the result, drawn by ending()
  const bar = $('hintbar');
  bar.classList.remove('idle', 'past', 'notice', 'result', 'solved', 'lost', 'shown');
  bar.removeAttribute('role');
  if (note) {
    bar.textContent = note;
    bar.classList.add('notice');
  } else if (shown) {
    bar.textContent = shown.deep ? `❓ ${shown.h.why}` : `💡 ${shown.h.text}`;
    if (!shown.lit) {
      bar.classList.add('past');
      bar.setAttribute('role', 'button');
      const again = document.createElement('span');
      again.className = 'relight';
      again.textContent = AGAIN;
      bar.append(again);
    }
  } else {
    bar.textContent = '';
    bar.classList.add('idle');
  }
}
function showNote(text) {
  stopNote();
  note = text;
  paintBar();
  const game = G;
  noteTimer = setTimeout(() => { note = null; if (G === game && !G.result) paintBar(); }, NOTE_MS);
}
function stopNote() {
  clearTimeout(noteTimer);
  note = null;
}

// The tools row's words as big as fit, none cut (Find the Stars,
// 2026-10-16: in the iPhone's fonts its row was wider than the screen).
// From the CSS's size down to 10px, in half pixels; once per screen width.
let toolsFitFor = null;
function fitTools() {
  const t = $('tools');
  if (!t.offsetParent || toolsFitFor === innerWidth) return;
  toolsFitFor = innerWidth;
  const bs = [...t.children];
  t.style.removeProperty('--tf');
  const base = parseFloat(getComputedStyle(bs[0]).fontSize);
  const cut = () => bs.filter(b => b.scrollWidth > b.clientWidth).map(b => b.id);
  const before = cut();
  const r = largestFitting(h => { t.style.setProperty('--tf', `${h / 2}px`); return cut().length === 0; }, 20, Math.max(20, Math.round(base * 2)));
  L('tools fit', { font: r.size / 2, base, cutAtBase: before, fitted: r.fitted, row: t.clientWidth, screen: innerWidth });
}

// The turn line and the status beside the 🏠 as big as fit, none cut (at
// 320 px wide "Harder · puzzle 200" ran under the 🔊): from 20px down to
// 10px, in half pixels. Measured with the widest status it will show
// ("Step 64 of 64" during Show me how, "64 to go" otherwise, "59:59"),
// once per puzzle, screen width and mode.
let infoFitFor = null;
function fitInfo() {
  const info = document.querySelector('.topinfo'), f = $('found'), c = $('clock');
  const n = walkLength(G) || 1, widest = G.walk ? `Step ${G.walk.total} of ${G.walk.total}` : `${Math.max(n, 10)} to go`;
  const key = `${$('turn').textContent}|${widest}|${innerWidth}`;
  if (!info.offsetParent || infoFitFor === key) return;
  infoFitFor = key;
  const keep = [f.textContent, c.textContent];
  f.textContent = widest;
  c.textContent = '59:59';
  const parts = [$('turn'), $('hearts'), f, c];
  const cut = () => parts.filter(e => e.scrollWidth > e.clientWidth + 0.5).map(e => e.id);
  info.style.removeProperty('--tif');
  const before = cut();
  const r = largestFitting(h => { info.style.setProperty('--tif', `${h / 2}px`); return cut().length === 0 && info.scrollWidth <= info.clientWidth + 0.5; }, 20, 40);
  [f.textContent, c.textContent] = keep;
  L('turn line fit', { font: r.size / 2, cutAt20: before, fitted: r.fitted, width: info.clientWidth, screen: innerWidth });
}

// The board as big as fits: the whole page on the screen, no scrolling.
// Then the dock's height without a hint lit, which a lit hint's words get.
function fit() {
  if (!G || $('play').hidden) return;
  const b = $('board'), main = document.querySelector('main');
  const dock = $('dock'), lit = dock.classList.contains('lit');
  dock.classList.remove('lit');
  // On a screen wider than tall, beside the rest if that gives a bigger
  // board (DESIGN.md "Sideways screens").
  const r = fitEitherWay(wide => {
    fitInfo();
    fitTools();
    const widest = Math.min(wide ? MAX_CELL_WIDE : MAX_CELL, Math.floor(((wide ? wideRoom() : main.clientWidth) - 6) / 9));
    if (wide && widest < MIN_CELL) return null;
    return fitPlayScreen(px => b.style.setProperty('--cell', `${px}px`), MIN_CELL, Math.max(MIN_CELL, widest));
  });
  dock.style.setProperty('--dockH', `${dock.offsetHeight}px`);
  dock.classList.toggle('lit', lit);
  const key = `${r.size}@${innerWidth}x${innerHeight}/${r.layout}`;
  if (key !== lastFit) {
    lastFit = key;
    L('fit', { cell: r.size, fitted: r.fitted, tries: r.tries, layout: r.layout, tall: r.tall, wide: r.wide, page: r.page, screen: r.screen, dock: dock.style.getPropertyValue('--dockH'), mainW: main.clientWidth, playW: Math.round($('play').getBoundingClientRect().width) });
  }
}
addEventListener('resize', fit);

/* ---------- taps and keys ---------- */

// Two quick taps zoomed the iPhone in on Find the Stars' board
// (2026-10-13), despite its touch-action: cancelling each touch's end
// stops the double-tap zoom. The board and the digits take pointer
// events (not clicks, which the cancelled touch end would stop).
// A touch's end goes to the element it started on, and a tap redraws the
// board and the digits, so that square or key is out of the page by then
// and its end never reaches `el`: the end is caught on the element
// itself, from its pointer down (3.7; Laser Lab's pieces let a double tap
// zoom this way with 3.6).
for (const el of [$('board'), $('dock')]) {
  let last = 0;
  const end = e => {
    if (!e.cancelable) return;
    e.preventDefault();
    if (e.timeStamp - last < 400) L('quick second tap: zoom blocked', { ms: Math.round(e.timeStamp - last), on: el.id, redrawn: !e.target.isConnected });
    last = e.timeStamp;
  };
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' && !e.target.closest('#hintbar')) e.target.addEventListener('touchend', end, { once: true, passive: false });
  }, { capture: true });
}

// A tap on a square selects it (any square: one with a digit rings the
// same digits). With a hint lit, it puts the hint out instead.
$('board').addEventListener('pointerdown', e => {
  const sq = e.target.closest('.sq');
  if (!sq || !G || G.result || G.walk) return;
  e.preventDefault();
  if (!$('askTools').hidden) { L('give up: no (the board touched)'); hideAsk(); }
  if (shown?.lit) { dimHint('the board'); return; }
  G.sel = Number(sq.dataset.i);
  render();
});

// The digits: a big one puts the digit in the selected square, a small
// dashed one writes a note (pointer up for touch and mouse; a click with
// no pointer for the keyboard's Enter or Space).
function keyPressed(e) {
  const k = e.target.closest('.key');
  if (!k || k.disabled || !G || G.result || G.walk) return;
  digit(Number(k.dataset.k), !!k.dataset.note, 'key');
}
$('dock').addEventListener('pointerup', e => { if (e.button === 0) keyPressed(e); });
$('dock').addEventListener('click', e => { if (e.detail === 0) keyPressed(e); });
// Digits typed on a keyboard work too; Shift + a digit writes a note.
addEventListener('keydown', e => {
  const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
  if (!m || !G || G.result || G.walk || $('play').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  digit(Number(m[1]), e.shiftKey, 'keyboard');
});

const NOTICES = {
  done: 'That square is done: tap an empty one.',
  'wrong digit': 'That square has a wrong digit: put the right one, or Undo.',
};
function digit(d, asNote, how) {
  if (shown?.lit) dimHint(how);
  const i = G.sel;
  if (i < 0) { showNote('Tap a square first, then a digit.'); return; }
  if (asNote) {
    const r = toggleNote(G, i, d);
    if (!r.ok) { showNote(NOTICES[r.why] ?? ''); return; }
    L(r.on ? 'note' : 'note off', { ...at(i), d, how });
    sound.play('tick');
    stopNote();
    render();
    return;
  }
  const r = enter(G, i, d);
  if (!r.ok) {
    if (NOTICES[r.why]) showNote(NOTICES[r.why]);
    return;
  }
  stopNote();
  if (r.right) {
    L('digit', { ...at(i), d, how, left: emptyCount(G), won: r.won });
    sound.play(r.won ? 'ding' : 'thud');
    G.popAt = i;
    render();
    if (r.won) win();
    return;
  }
  L('wrong digit', { ...at(i), d, how, hearts: G.hearts, mistakes: G.mistakes });
  sound.play('uhoh');
  G.oopsAt = i;
  render();
  if (r.lost) lose('lost');
}

$('undoBtn').onclick = () => {
  const r = undo(G);
  if (!r.ok) return;
  L(r.heart ? 'undo: a wrong digit taken back, the heart back' : 'undo: a note', { ...at(r.i), hearts: G.hearts });
  if (shown?.lit) dimHint('Undo');
  G.sel = r.i;
  render();
};

/* ---------- hints ---------- */

// 💡 Hint: the next step in words, and taken (Find the Stars' hints, since
// 2026-10-15): a wrong digit taken out, or the next digit put in, white
// with a black edge.
$('hintBtn').onclick = () => {
  const r = useHint(G, G.col);
  if (!r.ok) { if (r.why) L('no hint', { why: r.why }); return; }
  const { h } = r;
  L('hint', { kind: h.kind, ...at(h.cell), d: h.d, dashed: h.pre.length, left: G.hints, won: r.won, text: h.text });
  stopNote();
  shown = { h, deep: false, lit: true };
  G.sel = -1;
  if (h.kind !== 'bad') G.popAt = h.cell;
  sound.play('ping');
  render();
  if (r.won) win();
};
$('whyBtn').onclick = () => toggleWhy();
$('walkWhy').onclick = () => toggleWhy();
function toggleWhy() {
  if (!shown?.lit || !shown.h.why) return;
  shown.deep = !shown.deep;
  L(shown.deep ? 'why' : 'why: back to the hint', { kind: shown.h.kind, ...at(shown.h.cell), step: G.walk?.step });
  render();
}
$('gotItBtn').onclick = () => dimHint('Got it');
// Puts the hint out: off the board, its words greyed in the bar, with
// "(tap to light it again)".
function dimHint(by) {
  if (!shown?.lit) return;
  L('hint put out, its words kept', { kind: shown.h.kind, by });
  shown.lit = false;
  shown.deep = false;
  render();
}
$('hintbar').addEventListener('click', () => {
  if (!G || G.result || G.walk || !shown || shown.lit) return;
  L('hint lit again', { kind: shown.h.kind, ...at(shown.h.cell) });
  shown.lit = true;
  stopNote();
  render();
});

/* ---------- Give up ---------- */

// Asks first, in place of the tools: Show me how walks through the rest,
// Just end it ends the game, No (or a touch on the board) goes back.
$('giveUpBtn').onclick = () => {
  if (!G || G.result) return;
  L('give up?', { left: emptyCount(G), time: clock(elapsed()) });
  $('askTools').hidden = false;
  buttons();
};
$('giveUpNo').onclick = () => { L('give up: no'); hideAsk(); };
function hideAsk() {
  $('askTools').hidden = true;
  if (G) buttons();
}
$('giveUpYes').onclick = () => {
  if (!G || G.result) return;
  L('give up: just end it');
  $('askTools').hidden = true;
  lose('gaveup');
};
// Show me how: the rest of the puzzle from the player's board, a step at
// a time, each shown and taken as a hint is, with no hint used. "Step 3
// of 40" in place of "to go"; the clock stops; the board takes no taps.
// The end counts as given up: no best time.
$('giveUpHow').onclick = () => {
  if (!G || G.result) return;
  $('askTools').hidden = true;
  clearInterval(clockTimer);
  stopNote();
  shown = null;
  G.walk = { step: 0, total: walkLength(G), ms: elapsed() };
  L('give up: show me how', { left: emptyCount(G), steps: G.walk.total, time: clock(G.walk.ms) });
  walkNext();
  fitInfo();
};
function walkNext() {
  if (!G?.walk || G.result) return;
  if (emptyCount(G) === 0) { walkEnd(); return; }
  const r = walkStep(G, G.col);
  if (!r) { L('show me how: stuck'); walkRest(); return; }
  G.walk.step++;
  L('show me how: step', { step: G.walk.step, of: G.walk.total, kind: r.h.kind, ...at(r.h.cell), d: r.h.d, text: r.h.text });
  shown = { h: r.h, deep: false, lit: true };
  if (r.h.kind !== 'bad') G.popAt = r.h.cell;
  sound.play('ping');
  render();
}
function walkRest() {
  const k = fillRest(G);
  G.bad.fill(0);
  L('show me how: the rest', { squares: k });
  G.walk.step = G.walk.total;
  walkEnd();
}
function walkEnd() {
  const { total, ms } = G.walk;
  endGame(G, 'shown');
  shown = null;
  G.end = endFor('shown', total);
  G.end.ms = ms;
  L('show me how: done', { level: G.level, puzzle: G.k + 1, steps: total, time: clock(ms) });
  render();
  showEnd();
}
$('walkNext').onclick = () => walkNext();
$('walkRest').onclick = () => { if (G?.walk && !G.result) walkRest(); };
// A walk-through kept last time: its step on show again, the clock
// stopped where it was. False (logged) if it can't be.
function walkAgain(kept) {
  try {
    const { step, total } = kept.walk;
    if (![step, total].every(v => Number.isInteger(v) && v >= 0) || !kept.hint?.h) throw new Error('bad walk-through');
    clearInterval(clockTimer);
    G.walk = { step, total, ms: kept.ms ?? 0 };
    shown = { h: kept.hint.h, deep: !!kept.hint.deep && !!kept.hint.h.why, lit: true };
    $('clock').textContent = clock(G.walk.ms);
    render();
    fitInfo();
    return true;
  } catch (e) {
    L('kept walk-through not shown', { error: String(e) });
    G.walk = null;
    shown = null;
    return false;
  }
}

/* ---------- the end ---------- */

const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;
const PALE = 'The pale digits are the rest of the answer.';
const ENDS = { lost: 'Out of hearts', gaveup: 'You gave up', shown: 'Shown step by step' };
// The end's words for a game that ended without a win (or picked up
// again ended).
function endFor(how, steps) {
  if (how === 'won') return { how: 'solved', title: 'Solved!', line: '', ms: elapsed() };
  if (how === 'shown') return { how: 'shown', title: ENDS.shown, line: steps ? plural(steps, 'step') : '', ms: elapsed() };
  return { how: 'lost', title: ENDS[how], line: PALE, ms: elapsed() };
}

// Solved: one big star in the hint bar with the time, mistakes and hints
// and the best time for this level.
function win() {
  const ms = elapsed();
  clearInterval(clockTimer);
  $('clock').textContent = clock(ms);
  const { best, newBest } = recordTime(prog, G.level, ms);
  saveProgress();
  L('solved', { level: G.level, puzzle: G.k + 1, time: clock(ms), mistakes: G.mistakes, hints: G.hintsUsed, newBest, best: best && clock(best) });
  shown = null;
  stopNote();
  sound.play('win');
  const bits = [plural(G.mistakes, 'mistake'), plural(G.hintsUsed, 'hint'), newBest ? 'New best!' : `Best ${clock(best)}`];
  G.end = { how: 'solved', title: `Solved in ${clock(ms)}!`, line: bits.join(' · '), ms };
  render();
  const game = G;
  setTimeout(() => { if (G === game) showEnd(); }, WIN_MS);
}

// Out of hearts or given up: the rest of the answer pale.
function lose(how) {
  clearInterval(clockTimer);
  if (!G.result) endGame(G, how);
  L({ lost: 'out of hearts', gaveup: 'gave up' }[how], { level: G.level, puzzle: G.k + 1, left: G.kind.filter(k => k === 'pale').length, hearts: G.hearts, time: clock(elapsed()) });
  shown = null;
  stopNote();
  G.end = endFor(how);
  render();
  if (how === 'lost') sound.play('aww');
  const game = G;
  setTimeout(() => { if (G === game) showEnd(); }, LOSE_MS);
}

// The result in the hint bar beside one big star (sparkles for a win,
// pale otherwise), and Next / Try again / New game in place of the tools.
function showEnd() {
  const { how, title, line } = G.end;
  const sparks = how === 'solved' ? [0, 60, 120, 180, 240, 300].map((a, k) => `<i class="spark" style="--a:${a}deg;--d:${k * 60}ms">${STAR}</i>`).join('') : '';
  stopNote();
  const bar = $('hintbar');
  bar.innerHTML = `<span class="bigstar">${STAR}${sparks}</span><span class="res"><b>${title}</b><span>${line}</span></span>`;
  bar.classList.remove('idle', 'past', 'notice');
  bar.removeAttribute('role');
  bar.classList.add('result', how);
  for (const id of ['tools', 'hintTools', 'walkTools', 'askTools']) $(id).hidden = true;
  $('endTools').hidden = false;
  L('end buttons', { how, level: G.level, puzzle: G.k + 1 });
}
$('nextBtn').onclick = () => { L('next'); startNext(G.level); };
$('againBtn').onclick = () => { L('try again', { puzzle: G.k + 1 }); startGame(G.level, G.k); };
$('newBtn').onclick = () => {
  clearInterval(clockTimer);
  L('new game');
  G = null;
  shown = null;
  stopNote();
  $('play').hidden = true;
  $('setup').hidden = false;
  setWide(false);
  renderSetup();
  scrollTo(0, 0);
};

// The game kept last time (once the puzzles are in): the same puzzle, if
// it's still there, as it was left.
function restore() {
  const g = resume.saved.game;
  try {
    mergeSetup(setup, resume.saved.setup);
    const list = stock[g?.level];
    if (!list) throw new Error(`no ${g?.level} puzzles`);
    if (!Number.isInteger(g.k) || stockAt(list, g.k)?.[0] !== g.seed) throw new Error('not the same puzzle (the puzzles changed)');
    showPlay();
    startGame(g.level, g.k, g);
    L('resumed', { level: G.level, puzzle: G.k + 1, seed: G.seed, left: emptyCount(G), hearts: G.hearts, time: clock(elapsed()), result: G.result, hint: !!shown, walk: G.walk?.step ?? null });
    return true;
  } catch (e) {
    L('resume failed: a new game', { error: String(e) });
    resume.clear();
    clearInterval(clockTimer);
    G = null;
    shown = null;
    $('play').hidden = true;
    $('setup').hidden = false;
    setWide(false);
    return false;
  }
}

startLog('colour-sudoku');
mergeSetup(setup, resume.saved?.setup);
if (!LEVELS.includes(setup.level)) setup.level = 'easy';
if (resuming) $('setup').hidden = true;
else renderSetup();
