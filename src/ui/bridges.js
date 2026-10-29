// Bridges screens (setup and play), from the Bridges Mockup v1
// (2026-10-24; DESIGN.md "Bridges"). The rules, solvers, hints and
// progress live in src/core/bridges.js, the board's drawing in
// src/ui/brboard.js; this file only draws, keeps time and handles taps
// and drags. The puzzles come from data/bridges.json
// (tools/bridges-puzzles.js).

import {
  SIZES, SIZE_NAMES, DOTS, PROGRESS_KEY, decode, stockAt, createGame, cycle, undo, canUndo, clear, canClear, standing,
  useHint, walkStep, walkLength, fillRest, endGame, snapshotGame, restoreGame, readProgress, takeNext, recordTime, clock,
} from '../core/bridges.js';
import { mergeSetup } from '../core/resume.js';
import { largestFitting } from '../core/fit.js';
import { boardContent, miniSvg, viewBox } from './brboard.js';
import { STAR } from './hfboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen, fitEitherWay, setWide, wideRoom } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const STOCK_FILE = 'data/bridges.json';
const WIN_MS = 600;      // the last bridge drawn, then the result and the end buttons
const NOTE_MS = 2500;    // a moment's words in the hint bar
// The board's size in px: at least 180 (a 320 x 568 phone fits Medium
// with a 188 px board; 240 scrolled it 52 px), at most 520 (big screens).
const MIN_BOARD = 180, MAX_BOARD = 520, MAX_BOARD_WIDE = 780;
const DRAG = 0.4;        // squares a finger moves from an island before it's a drag
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('bridges', msg, data);

// Setup screen picks: Small (the kids') to start with (developer,
// 2026-10-24). "New game" comes back here with the last pick kept.
const setup = { size: 'small' };

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing remembered */ }
// The next puzzle per size and the best times, kept on the device.
let prog = readProgress(null);
try { prog = readProgress(storage?.getItem(PROGRESS_KEY)); } catch { /* unreadable: start fresh */ }
function saveProgress() {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(prog)); } catch (e) { L('progress not kept', { error: String(e) }); }
}

let stock = null;      // { size: [entry, ...] } (decoded as each is played)
let G = null;          // the game being played, with the screen's extras (k, t0, paused, end, walk)
let clockTimer = null;
let lastFit = '';
// The hint or step on show: { h (nextHint's), fresh: its bridges blink
// on the next draw }. It goes with the next change to the board.
let shown = null;
let note = null, noteTimer = null;

// Kept after every change, and picked up when the page opens again in the
// same visit (DESIGN.md "Coming back to a game"): the puzzle (size, number
// and seed), the board and Undo, the hints, the clock, the hint on show,
// Show me how's step and the result.
const resume = resumable('bridges', 1, () => ({
  screen: G ? 'play' : 'setup', setup,
  game: G && {
    ...snapshotGame(G), k: G.k, ms: G.end?.ms ?? G.walk?.ms ?? elapsed(), end: G.end,
    walk: G.walk && !G.result ? { step: G.walk.step, total: G.walk.total } : null,
    hint: shown && !G.result ? { h: shown.h } : null,
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
    if (SIZES.some(s => !data[s]?.length)) throw new Error('a size has no puzzles');
    stock = Object.fromEntries(SIZES.map(s => [s, data[s]]));
    L('puzzles loaded', { counts: SIZES.map(s => `${s}:${stock[s].length}`).join(' '), ms: Math.round(performance.now() - t0), next: prog.next });
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
  if (!$('rulesPic').firstChild) $('rulesPic').innerHTML = miniSvg('brmini');
  for (const b of $('sizes').children) b.setAttribute('aria-pressed', String(b.dataset.size === setup.size));
  $('playBtn').disabled = !stock;
  if (!stock && !$('why').textContent) $('why').textContent = 'Getting the puzzles…';
  if (stock) $('why').textContent = '';
  if (!resuming) resume.keep();
}
for (const b of $('sizes').children) b.onclick = () => { setup.size = b.dataset.size; L('size', { size: setup.size }); renderSetup(); };
$('playBtn').onclick = () => {
  if (!stock) return;
  showPlay();
  startNext(setup.size);
};
function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
}

/* ---------- play screen ---------- */

// A puzzle of the size not yet started (Play, Next): counted as used as
// it starts (DESIGN.md "Puzzle order"), so leaving it or giving up doesn't
// bring it back; only Try again does. After the last they come round
// again (stockAt).
function startNext(size) {
  const k = takeNext(prog, size);
  saveProgress();
  L('puzzle used', { size, puzzle: k + 1, of: stock[size].length, round: Math.floor(k / stock[size].length) + 1, next: prog.next[size] + 1 });
  startGame(size, k);
}

// Puzzle number k (0-based, counting on past the end of the stock) of a
// size. `kept`: that puzzle's game as kept last time, picked up where it
// was left.
function startGame(size, k, kept = null) {
  const p = decode(size, stockAt(stock[size], k));
  G = kept ? restoreGame(p, kept) : createGame(p);
  Object.assign(G, { k, t0: Date.now() - (kept?.ms ?? 0), paused: null, end: kept?.end ?? null, walk: null });
  if (!kept) L('game started', { size, puzzle: k + 1, stock: k % stock[size].length + 1, seed: p.seed, islands: p.islands.length, edges: G.g.edges.length });
  shown = null;
  stopNote();
  $('askTools').hidden = true;
  $('endTools').hidden = true;
  clearInterval(clockTimer);
  lastFit = '';
  render();
  fit();
  if (G.result) {
    G.end ??= endFor(G.result, 0);
    $('clock').textContent = clock(G.end.ms);
    render();
    showEnd();
    return;
  }
  if (kept?.walk && walkAgain(kept)) return;
  clockTimer = setInterval(tick, 1000);
  tick();
  if (kept?.hint?.h) { shown = { h: kept.hint.h, fresh: false }; render(); }
}

const elapsed = () => (G.paused ?? Date.now()) - G.t0;
function tick() { if (G && !G.result && !G.walk) $('clock').textContent = clock(elapsed()); }
// The clock stops while the page is hidden (another app, the phone locked).
document.addEventListener('visibilitychange', () => {
  if (!G || G.result) return;
  if (document.visibilityState === 'hidden' && G.paused == null) { G.paused = Date.now(); L('clock paused', { at: clock(elapsed()) }); }
  if (document.visibilityState === 'visible' && G.paused != null) { G.t0 += Date.now() - G.paused; G.paused = null; L('clock resumed', { at: clock(elapsed()) }); tick(); }
});

// Draws the board alone (also while a finger drags a bridge). `ghost`:
// the bridge a drag would lay, faint.
function drawBoard(ghost = null) {
  const h = shown?.h;
  const b = $('board');
  b.setAttribute('viewBox', viewBox(G.p.n));
  b.innerHTML = boardContent(G.p, G.g, G.board, {
    dots: DOTS[G.size], ghost, ring: h && h.island >= 0 ? h.island : -1,
    lit: h && shown.fresh ? h.put.map(f => f.edge) : [], pale: G.end?.pale ?? [], cheer: G.end?.how === 'solved' && G.end.cheer,
  });
}

// Draws the board, the status line, the hint bar and the rows of buttons.
function render() {
  drawBoard();
  if (shown) shown.fresh = false;
  if (G.end) G.end.cheer = false;
  const st = standing(G);
  $('turn').textContent = `${SIZE_NAMES[G.size]} · puzzle ${G.k + 1}`;
  $('found').textContent = G.walk && !G.result ? `Step ${G.walk.step} of ${G.walk.total}` : `${st.done} of ${st.total} islands`;
  $('hintsUsed').textContent = G.hints ? `💡 ${G.hints}` : '';
  $('hintsUsed').setAttribute('aria-label', `${G.hints} hints used`);
  buttons();
  paintBar(st);
  fitTurn();
  resume.keep();
}

// The rows of buttons: the tools (Undo, Hint, Clear, Give up); Give up's
// question; Show me how's (⏩ The rest, Next ▸); the end's.
function buttons() {
  const asking = !$('askTools').hidden;
  if (G.result) {
    for (const id of ['tools', 'walkTools', 'askTools']) $(id).hidden = true;
    return;
  }
  if (G.walk) {
    $('tools').hidden = true;
    $('walkTools').hidden = false;
    const last = G.walk.won;
    $('walkNext').textContent = last ? 'Finish ▸' : 'Next ▸';
    $('walkRest').disabled = !!last;
    return;
  }
  $('walkTools').hidden = true;
  $('tools').hidden = asking;
  $('undoBtn').disabled = !canUndo(G);
  $('clearBtn').disabled = !canClear(G);
  if (!$('tools').hidden) fitTools();
}

// The hint bar's words: a note for a moment, the hint or step on show,
// "every island right but not all joined", or nothing (hidden, its space
// kept so the board never moves). At the end, the result.
function paintBar(st) {
  if (G.result && G.end?.shown) return;   // the result, drawn by showEnd()
  const bar = $('hintbar');
  bar.classList.remove('idle', 'past', 'notice', 'result', 'solved', 'lost', 'shown');
  if (note) {
    bar.textContent = note;
    bar.classList.add('notice');
  } else if (shown) {
    bar.textContent = `💡 ${shown.h.text}`;
  } else if (st.notJoined && !G.result) {
    bar.textContent = 'Every island has its bridges, but they aren’t all joined up. Some bridges must go elsewhere.';
    bar.classList.add('notice');
  } else {
    bar.textContent = '';
    bar.classList.add('idle');
  }
}
function showNote(text) {
  stopNote();
  note = text;
  paintBar(standing(G));
  const game = G;
  noteTimer = setTimeout(() => { note = null; if (G === game && !G.result) paintBar(standing(G)); }, NOTE_MS);
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

// The turn line beside the 🏠 as big as fits, not cut ("Medium · puzzle
// 200" at 320 px wide): from 20px down to 12px, in half pixels; once per
// line and screen width.
let turnFitFor = null;
function fitTurn() {
  const t = $('turn');
  const key = `${t.textContent}|${innerWidth}`;
  if (!t.offsetParent || turnFitFor === key) return;
  turnFitFor = key;
  t.style.removeProperty('font-size');
  if (t.scrollWidth <= t.clientWidth + 0.5) return;
  const r = largestFitting(h => { t.style.fontSize = `${h / 2}px`; return t.scrollWidth <= t.clientWidth + 0.5; }, 24, 40);
  L('turn line fit', { font: r.size / 2, fitted: r.fitted, width: t.clientWidth, screen: innerWidth });
}

// The board as big as fits: the whole page on the screen, no scrolling.
function fit() {
  if (!G || $('play').hidden) return;
  const main = document.querySelector('main');
  // On a screen wider than tall, beside the rest if that gives a bigger
  // board (DESIGN.md "Sideways screens").
  const r = fitEitherWay(wide => {
    fitTools();
    const widest = Math.min(wide ? MAX_BOARD_WIDE : MAX_BOARD, wide ? wideRoom() : main.clientWidth);
    if (wide && widest < MIN_BOARD) return null;
    return fitPlayScreen(px => $('play').style.setProperty('--bw', `${px}px`), MIN_BOARD, Math.max(MIN_BOARD, widest));
  });
  const key = `${r.size}@${innerWidth}x${innerHeight}/${r.layout}`;
  if (key !== lastFit) {
    lastFit = key;
    L('fit', { board: r.size, square: Math.round(r.size / G.p.n), fitted: r.fitted, tries: r.tries, layout: r.layout, tall: r.tall, wide: r.wide, page: r.page, screen: r.screen, mainW: main.clientWidth });
  }
}
addEventListener('resize', fit);

/* ---------- taps and drags ---------- */

const svg = $('board');
let down = null;   // { x, y, from: the island under the finger or -1, ghost }

// A point on the board in squares: island (r, c) at x = c, y = r.
function at(ev) {
  const r = svg.getBoundingClientRect(), n = G.p.n;
  return { x: (ev.clientX - r.left) / r.width * n - 0.5, y: (ev.clientY - r.top) / r.height * n - 0.5 };
}
const islandAt = ({ x, y }) => G.p.islands.findIndex(s => Math.hypot(s.c - x, s.r - y) < 0.45);

// The edge a drag from island i points along, or -1.
function edgeToward(i, dx, dy) {
  const s = G.p.islands[i];
  return G.g.of[i].find(e => {
    const E = G.g.edges[e], o = G.p.islands[E.a === i ? E.b : E.a];
    return Math.abs(dx) > Math.abs(dy)
      ? o.r === s.r && Math.sign(o.c - s.c) === Math.sign(dx)
      : o.c === s.c && Math.sign(o.r - s.r) === Math.sign(dy);
  }) ?? -1;
}

// The edge nearest a point, within half a square (Dots and Boxes' taps).
function edgeNear({ x, y }) {
  let best = -1, bestD = 0.5;
  G.g.edges.forEach((e, i) => {
    const A = G.p.islands[e.a], B = G.p.islands[e.b];
    const px = Math.max(Math.min(x, Math.max(A.c, B.c)), Math.min(A.c, B.c));
    const py = Math.max(Math.min(y, Math.max(A.r, B.r)), Math.min(A.r, B.r));
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) { best = i; bestD = d; }
  });
  return best;
}

const playing = () => G && !G.result && !G.walk;
svg.addEventListener('pointerdown', ev => {
  if (!playing()) return;
  ev.preventDefault();
  if (!$('askTools').hidden) { L('give up: no (the board touched)'); hideAsk(); }
  try { svg.setPointerCapture(ev.pointerId); } catch { /* no capture: the drag still ends here */ }
  const pt = at(ev);
  down = { ...pt, from: islandAt(pt), ghost: -1 };
});
svg.addEventListener('pointermove', ev => {
  if (!down || down.from < 0 || !playing()) return;
  const pt = at(ev), dx = pt.x - down.x, dy = pt.y - down.y;
  const e = Math.hypot(dx, dy) > DRAG ? edgeToward(down.from, dx, dy) : -1;
  if (e === down.ghost) return;
  down.ghost = e;
  drawBoard(e >= 0 ? { edge: e, count: (G.board[e] + 1) % 3 || 0 } : null);
});
svg.addEventListener('pointerup', ev => {
  if (!down || !playing()) { down = null; return; }
  const pt = at(ev), d = down;
  down = null;
  if (d.from >= 0) {
    const e = Math.hypot(pt.x - d.x, pt.y - d.y) > DRAG ? edgeToward(d.from, pt.x - d.x, pt.y - d.y) : -1;
    if (e >= 0) bridge(e, 'drag');
    else drawBoard();
    return;
  }
  const e = edgeNear(pt);
  if (e >= 0) bridge(e, 'tap');
});
svg.addEventListener('pointercancel', () => { down = null; if (G) drawBoard(); });
// Two quick taps zoomed the iPhone in on Find the Stars' board
// (2026-10-13), despite its touch-action: cancelling each touch's end
// stops the double-tap zoom. Nothing inside the board takes touches
// (brboard.js), so every touch's end reaches the board itself.
let lastEnd = 0;
svg.addEventListener('touchend', e => {
  if (!e.cancelable) return;
  e.preventDefault();
  if (e.timeStamp - lastEnd < 400) L('quick second tap: zoom blocked', { ms: Math.round(e.timeStamp - lastEnd) });
  lastEnd = e.timeStamp;
}, { passive: false });

// The next count on edge e (0, 1, 2, then 0), or the board shakes: a
// bridge that would cross another.
function bridge(e, how) {
  const E = G.g.edges[e];
  const r = cycle(G, e);
  if (!r.ok) {
    if (r.why !== 'crosses') return;
    L('refused: would cross', { edge: e, how, by: r.by });
    sound.play('uhoh');
    svg.classList.remove('shake'); void svg.getBoundingClientRect(); svg.classList.add('shake');
    showNote('That bridge would cross another one.');
    drawBoard();
    return;
  }
  const st = standing(G);
  L('bridge', { edge: e, from: [G.p.islands[E.a].r, G.p.islands[E.a].c], to: [G.p.islands[E.b].r, G.p.islands[E.b].c], count: r.count, how, done: `${st.done}/${st.total}`, won: r.won });
  if (st.notJoined && !r.won) L('all islands right, not joined');
  sound.play('tick');
  shown = null;
  stopNote();
  render();
  if (r.won) win();
}

$('undoBtn').onclick = () => {
  if (!G || !undo(G).ok) return;
  L('undo', { left: G.undo.length });
  shown = null;
  stopNote();
  render();
};
$('clearBtn').onclick = () => {
  if (!G || !clear(G).ok) return;
  L('clear');
  shown = null;
  stopNote();
  render();
};

/* ---------- hints ---------- */

// 💡 Hint: the next step in words, and taken (as Find the Stars' and
// Colour Sudoku's): a bridge not in the answer comes off, or the ringed
// island's forced bridges go down, blinking. No limit; the end counts them.
$('hintBtn').onclick = () => {
  if (!playing()) return;
  const r = useHint(G);
  if (!r.ok) { L('no hint', { why: r.why }); return; }
  L('hint', { kind: r.h.kind, island: r.h.island, put: r.h.put, hints: G.hints, won: r.won, text: r.h.text });
  stopNote();
  shown = { h: r.h, fresh: true };
  sound.play('ping');
  render();
  if (r.won) win();
};

/* ---------- Give up ---------- */

// Asks first, in place of the tools (developer, 2026-10-24, after v1: "a
// 'give up' option to show the solution"): Show me how walks through the
// rest, Just show it shows the answer at once, No (or a touch on the
// board) goes back. Either way it counts as given up: no best time.
$('giveUpBtn').onclick = () => {
  if (!playing()) return;
  L('give up?', { done: standing(G).done, time: clock(elapsed()) });
  $('askTools').hidden = false;
  buttons();
};
$('giveUpNo').onclick = () => { L('give up: no'); hideAsk(); };
function hideAsk() {
  $('askTools').hidden = true;
  if (G) buttons();
}
$('giveUpYes').onclick = () => {
  if (!playing()) return;
  $('askTools').hidden = true;
  clearInterval(clockTimer);
  const ms = elapsed();
  const pale = fillRest(G);
  endGame(G, 'gaveup');
  L('give up: just show it', { size: G.size, puzzle: G.k + 1, bridgesShown: pale.length, time: clock(ms) });
  shown = null;
  stopNote();
  G.end = { ...endFor('gaveup'), ms, pale };
  render();
  showEnd();
};
// Show me how: the rest of the puzzle from the player's board, a step at
// a time, each shown and taken as a hint is, with no hint used. "Step 3
// of 9" in place of the islands; the clock stops; the board takes no
// taps.
$('giveUpHow').onclick = () => {
  if (!playing()) return;
  $('askTools').hidden = true;
  clearInterval(clockTimer);
  stopNote();
  shown = null;
  G.walk = { step: 0, total: walkLength(G), ms: elapsed(), won: false };
  L('give up: show me how', { done: standing(G).done, steps: G.walk.total, time: clock(G.walk.ms) });
  walkNext();
};
function walkNext() {
  if (!G?.walk || G.result) return;
  if (G.walk.won) { walkEnd(); return; }
  const r = walkStep(G);
  if (!r.ok) { L('show me how: stuck', { why: r.why }); walkRest(); return; }
  G.walk.step++;
  G.walk.won = r.won;
  L('show me how: step', { step: G.walk.step, of: G.walk.total, kind: r.h.kind, island: r.h.island, put: r.h.put, text: r.h.text });
  shown = { h: r.h, fresh: true };
  sound.play('ping');
  render();
}
function walkRest() {
  const k = fillRest(G).length;
  L('show me how: the rest', { bridges: k });
  G.walk.step = G.walk.total;
  walkEnd();
}
function walkEnd() {
  const { total, ms } = G.walk;
  endGame(G, 'shown');
  shown = null;
  G.end = { ...endFor('shown', total), ms };
  L('show me how: done', { size: G.size, puzzle: G.k + 1, steps: total, time: clock(ms) });
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
    if (![step, total].every(v => Number.isInteger(v) && v >= 0)) throw new Error('bad walk-through');
    clearInterval(clockTimer);
    G.walk = { step, total, ms: kept.ms ?? 0, won: standing(G).done === G.p.islands.length && !standing(G).notJoined };
    shown = kept.hint?.h ? { h: kept.hint.h, fresh: false } : null;
    $('clock').textContent = clock(G.walk.ms);
    render();
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
// The end's words for a game that ended without a win (or picked up again
// ended).
function endFor(how, steps) {
  if (how === 'won') return { how: 'solved', title: 'Solved!', line: '', ms: elapsed() };
  if (how === 'shown') return { how: 'shown', title: 'Shown step by step', line: steps ? plural(steps, 'step') : '', ms: elapsed() };
  return { how: 'lost', title: 'You gave up', line: 'The pale bridges are the rest of the answer.', ms: elapsed() };
}

// Solved: one big star in the hint bar with the time, the hints and the
// best time for this size; every island wiggles.
function win() {
  const ms = elapsed();
  clearInterval(clockTimer);
  $('clock').textContent = clock(ms);
  const { best, newBest } = recordTime(prog, G.size, ms);
  saveProgress();
  L('solved', { size: G.size, puzzle: G.k + 1, time: clock(ms), hints: G.hints, newBest, best: best && clock(best) });
  shown = null;
  stopNote();
  sound.play('win');
  const bits = [plural(G.hints, 'hint'), newBest ? 'New best!' : `Best ${clock(best)}`];
  G.end = { how: 'solved', title: `Solved in ${clock(ms)}!`, line: bits.join(' · '), ms, cheer: true };
  render();
  const game = G;
  setTimeout(() => { if (G === game) showEnd(); }, WIN_MS);
}

// The result in the hint bar beside one big star (sparkles for a win,
// pale otherwise), and Next / Try again / New game in place of the tools.
function showEnd() {
  const { how, title, line } = G.end;
  const sparks = how === 'solved' ? [0, 60, 120, 180, 240, 300].map((a, k) => `<i class="spark" style="--a:${a}deg;--d:${k * 60}ms">${STAR}</i>`).join('') : '';
  stopNote();
  G.end.shown = true;
  const bar = $('hintbar');
  bar.innerHTML = `<span class="bigstar">${STAR}${sparks}</span><span class="res"><b>${title}</b><span>${line}</span></span>`;
  bar.classList.remove('idle', 'past', 'notice');
  bar.classList.add('result', how);
  for (const id of ['tools', 'walkTools', 'askTools']) $(id).hidden = true;
  $('endTools').hidden = false;
  resume.keep();
  L('end buttons', { how, size: G.size, puzzle: G.k + 1 });
}
$('nextBtn').onclick = () => { L('next'); startNext(G.size); };
$('againBtn').onclick = () => { L('try again', { puzzle: G.k + 1 }); startGame(G.size, G.k); };
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
    const list = stock[g?.size];
    if (!list) throw new Error(`no ${g?.size} puzzles`);
    if (!Number.isInteger(g.k) || stockAt(list, g.k)?.[0] !== g.seed) throw new Error('not the same puzzle (the puzzles changed)');
    showPlay();
    if (g.end) g.end.shown = false;
    startGame(g.size, g.k, g);
    L('resumed', { size: G.size, puzzle: G.k + 1, seed: G.seed, done: standing(G).done, hints: G.hints, time: clock(elapsed()), result: G.result, hint: !!shown, walk: G.walk?.step ?? null });
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

startLog('bridges');
mergeSetup(setup, resume.saved?.setup);
if (!SIZES.includes(setup.size)) setup.size = 'small';
if (resuming) $('setup').hidden = true;
else renderSetup();
