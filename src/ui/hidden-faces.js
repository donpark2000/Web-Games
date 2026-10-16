// Find the Stars screens (setup and play; called Hidden Faces until
// 2026-10-14), from the agreed mockup v2 (2026-10-13). The rules, solver and hints live in
// src/core/hidden-faces.js; this file only draws, keeps time and handles
// taps and drags. The puzzles come from data/hidden-faces.json
// (tools/hidden-faces-puzzles.js).

import {
  SIZES, DEFAULT_SIZE, HEARTS, DEMO, PROGRESS_KEY, decode, createGame, foundCount, tap, startStroke, strokeTo,
  endStroke, undo, canUndo, showOne, useHint, explainHint, readProgress, recordTime, clock, snapshotGame, restoreGame,
} from '../core/hidden-faces.js';
import { mergeSetup } from '../core/resume.js';
import { STAR, XMARK, HXMARK, borderStyle, miniBoard } from './hfboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const STOCK_FILE = 'data/hidden-faces.json';
const WIN_MS = 500;     // the last star pops in, then the result and the end buttons
const LOSE_MS = 700;
const MIN_CELL = 28, MAX_BOARD = 600;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('hidden-faces', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { size: DEFAULT_SIZE, auto: true };

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing remembered */ }
// The next puzzle per size and the best times, kept on the device.
let prog = readProgress(null);
try { prog = readProgress(storage?.getItem(PROGRESS_KEY)); } catch { /* unreadable: start fresh */ }
function saveProgress() {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(prog)); } catch (e) { L('progress not kept', { error: String(e) }); }
}

let stock = null;      // { size: [puzzle, ...] }, once loaded
let G = null;          // the game being played, with the screen's extras (k, t0, ...)
let clockTimer = null;
let lastFit = '';

// Kept on the device after every change, and picked up when the page
// opens (DESIGN.md "Coming back to a game"): the puzzle (size, number and
// seed), the board, the clock, the hint on show and the result.
const resume = resumable('hidden-faces', 1, () => ({
  screen: G ? 'play' : 'setup', setup,
  game: G && {
    ...snapshotGame(G), k: G.k, seed: G.seed, ms: G.end?.ms ?? elapsed(), end: G.end,
    hint: shown && !G.result ? { h: shown.h, deep: shown.deep, lit: shown.lit } : null,
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
    stock = Object.fromEntries(SIZES.map(n => [n, (data[n] ?? []).map(e => decode(n, e))]));
    if (SIZES.some(n => !stock[n].length)) throw new Error('a size has no puzzles');
    L('puzzles loaded', { counts: SIZES.map(n => `${n}:${stock[n].length}`).join(' '), ms: Math.round(performance.now() - t0), next: prog.next });
    if (resuming) { resuming = false; if (restore()) return; }
    renderSetup();
  })
  .catch(e => {
    stock = null;
    L('puzzles not loaded', { error: String(e) });
    if (resuming) { resuming = false; $('setup').hidden = false; renderSetup(); }
    $('why').textContent = 'The puzzles didn\'t load. Check the connection, then reload the page.';
  });

/* ---------- setup screen ---------- */

function renderSetup() {
  $('rulesPic').innerHTML = miniBoard(DEMO, DEMO.faces);
  $('sizes').replaceChildren(...SIZES.map(n => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size';
    b.setAttribute('aria-pressed', String(n === setup.size));
    b.innerHTML = `<span class="sg" style="background-size:${34 / n}px ${34 / n}px"></span>${n}×${n}`;
    b.onclick = () => { setup.size = n; L('size', { size: n }); renderSetup(); };
    return b;
  }));
  for (const b of $('autos').children) b.setAttribute('aria-pressed', String((b.dataset.auto === 'on') === setup.auto));
  $('playBtn').disabled = !stock;
  if (!stock && !$('why').textContent) $('why').textContent = 'Getting the puzzles…';
  if (stock) $('why').textContent = '';
  if (!resuming) resume.keep();
}
for (const b of $('autos').children) {
  b.onclick = () => { setup.auto = b.dataset.auto === 'on'; L('auto', { auto: setup.auto }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (!stock) return;
  showPlay();
  startGame(setup.size, prog.next[setup.size] ?? 0);
};
function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
}

/* ---------- play screen ---------- */

// Puzzle number k (0-based, counting on past the end of the stock: it
// starts over) of size n. `kept`: that puzzle's game as kept last time
// (resume's), picked up where it was left.
function startGame(n, k, kept = null) {
  const list = stock[n];
  const p = list[k % list.length];
  G = kept ? restoreGame(p, kept, { colorSeed: p.seed }) : createGame(p, { auto: setup.auto, colorSeed: p.seed });
  Object.assign(G, { k, seed: p.seed, t0: Date.now() - (kept?.ms ?? 0), paused: null, end: kept?.end ?? null });
  if (!kept) L('game started', { size: n, puzzle: k + 1, seed: p.seed, auto: G.auto });
  const b = $('board');
  b.style.setProperty('--n', n);
  b.innerHTML = p.reg.map((g, i) => `<div class="cell" role="gridcell" data-i="${i}" style="--rc:${G.col[g].c};${borderStyle(n, p.reg, i)}"><span class="mk"></span></div>`).join('');
  $('tools').hidden = false;
  $('endTools').hidden = true;
  clearHint();
  draw();
  lastFit = '';
  fit();
  clearInterval(clockTimer);
  if (G.result) {
    G.end ??= G.result === 'won' ? { how: 'solved', title: 'Solved!', line: '', ms: elapsed() }
      : { how: 'lost', title: 'Out of hearts', line: 'The pale stars show where they were.', ms: elapsed() };
    $('clock').textContent = `⏱ ${clock(G.end.ms)}`;
    showEnd();
    return;
  }
  clockTimer = setInterval(tick, 1000);
  tick();
  if (kept?.hint) {
    try {
      // Kept before 2026-10-15: no `lit` (a kept hint was on the board).
      shown = { h: kept.hint.h, why: explainHint(G, kept.hint.h), deep: !!kept.hint.deep, lit: kept.hint.lit ?? true };
      shown.deep &&= !!shown.why && shown.lit;
      if (shown.lit) paintHint();
      else { paintBar(); hintTool(); }
    } catch (e) { L('kept hint not shown', { error: String(e) }); clearHint(); }
  }
}

const elapsed = () => (G.paused ?? Date.now()) - G.t0;
function tick() { if (G && !G.result) $('clock').textContent = `⏱ ${clock(elapsed())}`; }
// The clock stops while the page is hidden (another app, the phone locked).
document.addEventListener('visibilitychange', () => {
  if (!G || G.result) return;
  if (document.visibilityState === 'hidden' && G.paused == null) { G.paused = Date.now(); L('clock paused', { at: clock(elapsed()) }); }
  if (document.visibilityState === 'visible' && G.paused != null) { G.t0 += Date.now() - G.paused; G.paused = null; L('clock resumed', { at: clock(elapsed()) }); tick(); }
});

const cells = () => $('board').children;

// Draws the marks, the status line and the tools. `pop`: a square whose
// mark pops in.
function draw(pop = -1) {
  const cs = cells();
  G.marks.forEach((m, i) => {
    const mk = cs[i].firstChild;
    const cls = `mk${m ? ` mk-${m}` : ''}${i === pop ? ' pop' : ''}`;
    if (mk.className !== cls || i === pop) {
      mk.className = cls;
      mk.innerHTML = m === 'x' || m === 'bad' ? XMARK : m === 'hx' ? HXMARK : m === 'face' || m === 'ghost' ? STAR : '';
    }
    cs[i].classList.toggle('ghost', m === 'ghost');
  });
  $('turn').innerHTML = `<span class="chip">${STAR}</span><span>${G.n}×${G.n} · puzzle ${G.k + 1}</span>`;
  $('found').textContent = `${foundCount(G)} of ${G.n} found`;
  $('hearts').textContent = '❤️'.repeat(Math.max(0, G.hearts)) + '🤍'.repeat(HEARTS - Math.max(0, G.hearts));
  $('hearts').setAttribute('aria-label', `${Math.max(0, G.hearts)} of ${HEARTS} hearts left`);
  $('showsLeft').textContent = G.shows;
  hintTool();
  $('showBtn').disabled = !G.shows || !!G.result;
  $('undoBtn').disabled = !canUndo(G);
  resume.keep();
}

// The board as big as fits: the whole page on the screen, no scrolling.
function fit() {
  if (!G || $('play').hidden) return;
  const b = $('board');
  const width = Math.min(document.querySelector('main').clientWidth, MAX_BOARD);
  const widest = Math.max(MIN_CELL, Math.floor((width - 6) / G.n));
  const r = fitPlayScreen(px => b.style.setProperty('--cell', `${px}px`), MIN_CELL, widest);
  const key = `${G.n}@${r.size}`;
  if (key !== lastFit) { lastFit = key; L('fit', { size: G.n, cell: r.size, fitted: r.fitted, tries: r.tries, screen: r.screen }); }
  if (shown?.lit) paintHint();
}
addEventListener('resize', fit);

/* ---------- taps and drags ---------- */

let drag = null;
function cellAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('.cell');
  return el && $('board').contains(el) ? Number(el.dataset.i) : null;
}

$('board').addEventListener('pointerdown', e => {
  if (!G || G.result) return;
  const i = cellAt(e.clientX, e.clientY);
  if (i == null) return;
  e.preventDefault();
  dimHint();
  drag = { start: i, last: i, x: e.clientX, y: e.clientY, moved: false, stroke: startStroke(G, i) };
  try { $('board').setPointerCapture(e.pointerId); } catch { /* the pointer already went */ }
});
$('board').addEventListener('pointermove', e => {
  if (!drag || !drag.stroke.mode) return;
  // Every square between the last point and this one, so a quick drag
  // misses none.
  const steps = Math.ceil(Math.hypot(e.clientX - drag.x, e.clientY - drag.y) / 8) || 1;
  let changed = false;
  for (let t = 1; t <= steps; t++) {
    const i = cellAt(drag.x + (e.clientX - drag.x) * t / steps, drag.y + (e.clientY - drag.y) * t / steps);
    if (i == null || i === drag.last) continue;
    if (!drag.moved) { drag.moved = true; changed = strokeTo(G, drag.stroke, drag.start) || changed; }
    drag.last = i;
    if (strokeTo(G, drag.stroke, i)) { changed = true; sound.play('tick'); }
  }
  drag.x = e.clientX;
  drag.y = e.clientY;
  if (changed) draw();
});
addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (d.moved) {
    const k = endStroke(G, d.stroke);
    if (k) L(d.stroke.mode === 'mark' ? 'drag: ✕' : 'drag: rubbed out', { squares: k });
    draw();
    return;
  }
  const r = tap(G, d.start);
  if (!r.ok) return;
  if (r.did === 'x') { sound.play('tick'); draw(); return; }
  afterLook(d.start, r, 'look');
});
addEventListener('pointercancel', () => {
  if (drag?.moved) endStroke(G, drag.stroke);
  drag = null;
  if (G) draw();
});
// Two quick taps (✕, then look) zoomed the iPhone in on the board, despite
// its touch-action: none (developer, 2026-10-13). Cancelling each touch's
// end stops the double-tap zoom; the pointer events above still come.
let lastTouchEnd = 0;
$('board').addEventListener('touchend', e => {
  if (!e.cancelable) return;
  e.preventDefault();
  const now = e.timeStamp;
  if (now - lastTouchEnd < 400) L('quick second tap: zoom blocked', { ms: Math.round(now - lastTouchEnd) });
  lastTouchEnd = now;
}, { passive: false });

// A look's result on the screen: a star pops in (and the ✕s around it),
// or a red ✕ shakes and a heart goes. Where there's known to be no star
// (a found star or a hint rules it out), the ✕ wiggles and the hint bar
// says why for a moment; nothing is counted.
function afterLook(i, r, how) {
  const at = { square: i, row: Math.floor(i / G.n) + 1, col: (i % G.n) + 1 };
  if (r.known) {
    L(`${how}: known to be empty, not counted`, { ...at, why: r.known });
    sound.play('tick');
    const c = cells()[i];
    c.classList.remove('nope');
    void c.offsetWidth;
    c.classList.add('nope');
    showNote(r.known);
    return;
  }
  if (r.face) {
    L(`${how}: star`, { ...at, found: foundCount(G), autoX: r.autoX.length });
    sound.play('ding');
    draw(i);
    if (r.won) win();
    return;
  }
  L(`${how}: no star`, { ...at, hearts: G.hearts });
  sound.play('uhoh');
  const c = cells()[i];
  c.classList.remove('oops');
  void c.offsetWidth;
  c.classList.add('oops');
  draw(i);
  if (r.lost) lose();
}

$('undoBtn').onclick = () => {
  const hearts = G.hearts;
  const k = undo(G);
  L(G.hearts > hearts ? 'undo: a wrong look taken back, the heart back' : 'undo', { squares: k, hearts: G.hearts });
  dimHint();
  draw();
};
$('showBtn').onclick = () => {
  const r = showOne(G);
  if (!r.ok) return;
  clearHint();
  afterLook(r.square, r, 'show');
};

/* ---------- hints ---------- */

// The last hint: { h (findHint's), why (its explainHint, or null), deep:
// the Why? showing, lit: on the board }. While a hint with a Why? is lit,
// the 💡 Hint button is ❓ Why?, and switches between the two. A touch on
// the board (or Undo) puts it out, but its words stay in the bar, greyed,
// until the next hint, Show or the end (developer, 2026-10-15: to check it
// was understood after following it); a tap on them lights it again.
let shown = null;
// A moment's words in the hint bar (why a look wasn't counted), over the
// last hint's, then the bar as it was.
const NOTE_MS = 2500;
let note = null, noteTimer = null;

$('hintBtn').onclick = () => {
  if (shown?.lit && shown.why) {
    shown.deep = !shown.deep;
    L(shown.deep ? 'why' : 'why: back to the hint', { kind: shown.h.kind, tgt: shown.h.tgt, tags: shown.why.tags.map(t => t[1]).join(' ') });
    paintHint();
    return;
  }
  // The hint takes its step on the board (a star, hint ✕s); its words and
  // Why? don't depend on the board, so they read the same after it.
  const h = useHint(G);
  if (!h.ok) return;
  L('hint', { kind: h.kind, tgt: h.tgt, why: h.why.length, out: h.out.length, left: G.hints, text: h.text });
  if (h.star != null || h.hx.length) {
    const at = h.star == null ? {} : { row: Math.floor(h.star / G.n) + 1, col: (h.star % G.n) + 1 };
    L('hint applied', { kind: h.kind, star: h.star, ...at, hintX: h.hx.length, squares: h.hx.join(' '), found: foundCount(G), won: h.won });
  }
  clearHint();
  shown = { h, why: explainHint(G, h), deep: false, lit: true };
  sound.play('ping');
  paintHint();
  draw(h.star ?? -1);
  if (h.won) { clearHint(); win(); }
};
$('hintbar').addEventListener('click', () => {
  if (!G || G.result || !shown || shown.lit) return;
  L('hint lit again', { kind: shown.h.kind, tgt: shown.h.tgt });
  shown.lit = true;
  stopNote();
  paintHint();
  resume.keep();
});

const TAGS = { touch: 'touch', row: 'row', col: 'col', colour: 'colour' };

// The hint (or its Why?) on the board and in the bar.
function paintHint() {
  unpaint(true);
  const { h, why, deep } = shown;
  const cs = cells();
  for (const i of h.why) cs[i].classList.add('why');
  for (const i of h.out) cs[i].classList.add('out');
  if (h.tgt != null) cs[h.tgt].classList.add('tgt');
  if (h.kind !== 'none') $('board').classList.add('spot');
  if (deep) {

    // The pretend star stands in place of the hint's ✕ on the ringed square.
    if (why.pretend != null) { cs[why.pretend].classList.add('pretending'); cs[why.pretend].insertAdjacentHTML('beforeend', `<span class="pretend">${STAR}</span>`); }
    for (const [i, tag] of why.tags) cs[i].insertAdjacentHTML('beforeend', `<span class="tag">${TAGS[tag]}</span>`);
    drawRings(why.rings);
  }
  paintBar();
  hintTool();
}

// The hint bar's words: a note, the last hint (greyed when put out), or
// nothing (hidden, its space kept).
function paintBar() {
  const bar = $('hintbar');
  bar.classList.remove('idle', 'past', 'notice', 'result', 'solved', 'lost');
  bar.removeAttribute('role');
  if (note) {
    bar.textContent = note;
    bar.classList.add('notice');
  } else if (shown) {
    bar.textContent = shown.deep ? `❓ ${shown.why.text}` : `💡 ${shown.h.text}`;
    if (!shown.lit) { bar.classList.add('past'); bar.setAttribute('role', 'button'); }
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

// Puts the hint out: off the board, its words greyed in the bar.
function dimHint() {
  if (!shown?.lit) return;
  L('hint put out, its words kept', { kind: shown.h.kind });
  shown.lit = false;
  shown.deep = false;
  unpaint();
  paintBar();
  hintTool();
}

// Outlines round whole rows, columns or colours, over the board (so the
// spotlight's fading doesn't fade them). The squares' offsets are from the
// board's frame (.boardwrap), which the outlines cover.
function drawRings(rings) {
  const wrap = $('board').parentElement, cs = cells(), n = G.n;
  const W = wrap.offsetWidth, H = wrap.offsetHeight;
  let paths = '';
  for (const { cells: set, style } of rings) {
    const inSet = new Set(set);
    let d = '';
    for (const i of set) {
      const c = cs[i], x = c.offsetLeft, y = c.offsetTop, w = c.offsetWidth, hh = c.offsetHeight;
      const r = Math.floor(i / n), k = i % n, e = style === 'reach' ? 5 : 2;
      const x0 = x + e, y0 = y + e, x1 = x + w - e, y1 = y + hh - e;
      if (r === 0 || !inSet.has(i - n)) d += `M${x0 - e} ${y0}H${x1 + e}`;
      if (r === n - 1 || !inSet.has(i + n)) d += `M${x0 - e} ${y1}H${x1 + e}`;
      if (k === 0 || !inSet.has(i - 1)) d += `M${x0} ${y0 - e}V${y1 + e}`;
      if (k === n - 1 || !inSet.has(i + 1)) d += `M${x1} ${y0 - e}V${y1 + e}`;
    }
    paths += `<path class="ring ring-${style}" d="${d}"/>`;
  }
  $('rings').setAttribute('viewBox', `0 0 ${W} ${H}`);
  Object.assign($('rings').style, { width: `${W}px`, height: `${H}px` });
  $('rings').innerHTML = paths;
  $('rings').removeAttribute('hidden'); // an <svg> has no .hidden
}

// The 💡 Hint button: ❓ Why? while a hint with one shows.
function hintTool() {
  const b = $('hintBtn');
  if (shown?.lit && shown.why && !G.result) {
    b.innerHTML = shown.deep ? '💡 The hint' : '❓ Why?';
    b.classList.toggle('pressed', shown.deep);
    b.disabled = false;
    return;
  }
  b.classList.remove('pressed');
  b.innerHTML = `💡 Hint <span class="left" id="hintsLeft">${G.hints}</span>`;
  b.disabled = !G.hints || !!G.result;
}

// Takes the hint off the board. `again`: it's about to be painted again,
// so the spotlight stays (taking it off and on would flash the board).
function unpaint(again = false) {
  for (const c of cells()) {
    c.classList.remove('why', 'out', 'tgt', 'pretending');
    for (const el of c.querySelectorAll('.pretend, .tag')) el.remove();
  }

  if (!again) $('board').classList.remove('spot');
  $('rings').setAttribute('hidden', '');
  $('rings').innerHTML = '';
}
// No hint: the bar empty and hidden, but keeping its place (developer,
// 2026-10-13: "Tap 💡 for the next step" stayed after the last hint, with
// nothing left to tap, and the 💡 Hint button says it already).
function clearHint() {
  shown = null;
  stopNote();
  unpaint();
  paintBar();
  if (G) hintTool();
}

/* ---------- the end ---------- */

const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;

// Solved: one big star in the hint bar with the time, mistakes and hints
// and the best time for this size (developer, 2026-10-14: faces wiggling
// on a big board were hard to see; nothing moves on the board now).
function win() {
  const ms = elapsed();
  clearInterval(clockTimer);
  $('clock').textContent = `⏱ ${clock(ms)}`;
  const { best, newBest } = recordTime(prog, G.n, ms);
  prog.next[G.n] = G.k + 1;
  saveProgress();
  L('solved', { size: G.n, puzzle: G.k + 1, time: clock(ms), mistakes: G.mistakes, hints: G.hintsUsed, shows: G.showsUsed, newBest, best: best && clock(best) });
  sound.play('win');
  const bits = [plural(G.mistakes, 'mistake'), plural(G.hintsUsed, 'hint')];
  if (G.showsUsed) bits.push(`${G.showsUsed} shown`);
  bits.push(newBest ? 'New best!' : `Best ${clock(best)}`);
  G.end = { how: 'solved', title: `Solved in ${clock(ms)}!`, line: bits.join(' · '), ms };
  resume.keep();
  const game = G;
  setTimeout(() => { if (G === game) showEnd(); }, WIN_MS);
}

// Out of hearts: the stars not found show pale where they were.
function lose() {
  clearInterval(clockTimer);
  L('out of hearts', { size: G.n, puzzle: G.k + 1, found: foundCount(G), time: clock(elapsed()) });
  G.marks.forEach((m, i) => { if (G.sol.has(i) && m !== 'face') G.marks[i] = 'ghost'; });
  G.end = { how: 'lost', title: 'Out of hearts', line: 'The pale stars show where they were.', ms: elapsed() };
  draw();
  sound.play('aww');
  const game = G;
  setTimeout(() => { if (G === game) showEnd(); }, LOSE_MS);
}

// The end's result and buttons (G.end), after a win or a loss, or for a
// finished game picked up again.
function showEnd() {
  const { how, title, line } = G.end, { n, k } = G;
  if (how === 'solved') {
    const up = Math.min(10, n + 1);
    ending(how, title, line,
      n < 10 ? `Next: ${up}×${up}` : 'Next', () => startGame(up, prog.next[up] ?? 0),
      'Same size', () => startGame(n, prog.next[n] ?? 0));
  } else {
    ending(how, title, line,
      'Try again', () => startGame(n, k),
      'Another', () => { prog.next[n] = k + 1; saveProgress(); startGame(n, k + 1); });
  }
}

// The result in the hint bar, beside one big star (with sparkles for a
// win, pale when out of hearts), and the end buttons in place of the
// tools.
function ending(how, title, line, againText, again, sameText, same) {
  const sparks = how === 'solved' ? [0, 60, 120, 180, 240, 300].map((a, k) => `<i class="spark" style="--a:${a}deg;--d:${k * 60}ms">${STAR}</i>`).join('') : '';
  stopNote();
  $('hintbar').innerHTML = `<span class="bigstar">${STAR}${sparks}</span><span class="res"><b>${title}</b><span>${line}</span></span>`;
  $('hintbar').classList.remove('idle', 'past', 'notice');
  $('hintbar').removeAttribute('role');
  $('hintbar').classList.add('result', how);
  $('againBtn').textContent = againText;
  $('againBtn').onclick = () => { L(againText); again(); };
  $('sameBtn').textContent = sameText;
  $('sameBtn').onclick = () => { L(sameText); same(); };
  $('tools').hidden = true;
  $('endTools').hidden = false;
}

$('newBtn').onclick = () => {
  clearInterval(clockTimer);
  L('new game');
  G = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

// The game kept last time (once the puzzles are in): the same puzzle, if
// it's still there, as it was left.
function restore() {
  const g = resume.saved.game;
  try {
    mergeSetup(setup, resume.saved.setup);
    const list = stock[g?.n];
    if (!list) throw new Error(`no ${g?.n} x ${g?.n} puzzles`);
    if (list[g.k % list.length]?.seed !== g.seed) throw new Error('not the same puzzle (the puzzles changed)');
    showPlay();
    startGame(g.n, g.k, g);
    L('resumed', { size: G.n, puzzle: G.k + 1, seed: G.seed, found: foundCount(G), hearts: G.hearts, time: clock(elapsed()), result: G.result, hint: !!shown });
    return true;
  } catch (e) {
    L('resume failed: a new game', { error: String(e) });
    resume.clear();
    clearInterval(clockTimer);
    G = null;
    $('play').hidden = true;
    $('setup').hidden = false;
    return false;
  }
}

startLog('hidden-faces');
mergeSetup(setup, resume.saved?.setup);
if (resuming) $('setup').hidden = true;
else renderSetup();

