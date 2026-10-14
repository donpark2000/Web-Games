// Hidden Faces screens (setup and play), from the agreed mockup v2
// (2026-10-13). The rules, solver and hints live in
// src/core/hidden-faces.js; this file only draws, keeps time and handles
// taps and drags. The puzzles come from data/hidden-faces.json
// (tools/hidden-faces-puzzles.js).

import {
  SIZES, DEFAULT_SIZE, HEARTS, DEMO, PROGRESS_KEY, decode, createGame, foundCount, tap, startStroke, strokeTo,
  endStroke, undo, canUndo, showOne, useHint, readProgress, recordTime, clock,
} from '../core/hidden-faces.js';
import { FACE_NAMES, nameOf } from '../core/players.js';
import { svg, pickerFace } from './faces.js';
import { borderStyle, miniBoard } from './hfboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

const STOCK_FILE = 'data/hidden-faces.json';
const WIN_MS = 1200;    // the faces wiggle, then the result and the end buttons
const LOSE_MS = 700;
const CHEER_STEP_MS = 90;   // the faces start wiggling one after another
const MIN_CELL = 28, MAX_BOARD = 600;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('hidden-faces', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { face: 'bear', size: DEFAULT_SIZE, auto: true };

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing remembered */ }
// The next puzzle per size and the best times, kept on the device.
let prog = readProgress(null);
try { prog = readProgress(storage?.getItem(PROGRESS_KEY)); } catch { /* unreadable: start fresh */ }
function saveProgress() {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(prog)); } catch (e) { L('progress not kept', { error: String(e) }); }
}

let stock = null;      // { size: [puzzle, ...] }, once loaded
let G = null;          // the game being played, with the screen's extras (k, face, t0, ...)
let clockTimer = null;
let lastFit = '';

/* ---------- the puzzles ---------- */

const t0 = performance.now();
fetch(STOCK_FILE)
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(data => {
    stock = Object.fromEntries(SIZES.map(n => [n, (data[n] ?? []).map(e => decode(n, e))]));
    if (SIZES.some(n => !stock[n].length)) throw new Error('a size has no puzzles');
    L('puzzles loaded', { counts: SIZES.map(n => `${n}:${stock[n].length}`).join(' '), ms: Math.round(performance.now() - t0), next: prog.next });
    renderSetup();
  })
  .catch(e => {
    stock = null;
    L('puzzles not loaded', { error: String(e) });
    $('why').textContent = 'The puzzles didn\'t load. Check the connection, then reload the page.';
  });

/* ---------- setup screen ---------- */

function renderSetup() {
  $('p1Faces').replaceChildren(...FACE_NAMES.map(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'face';
    b.innerHTML = pickerFace(f);
    b.setAttribute('aria-label', nameOf(f));
    b.setAttribute('aria-pressed', String(f === setup.face));
    b.onclick = () => { setup.face = f; L('face picked', { face: f }); renderSetup(); };
    return b;
  }));
  $('p1Chip').innerHTML = svg(setup.face);
  $('rulesPic').innerHTML = miniBoard(DEMO, setup.face, DEMO.faces);
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
}
for (const b of $('autos').children) {
  b.onclick = () => { setup.auto = b.dataset.auto === 'on'; L('auto', { auto: setup.auto }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (!stock) return;
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startGame(setup.size, prog.next[setup.size] ?? 0);
};

/* ---------- play screen ---------- */

// Puzzle number k (0-based, counting on past the end of the stock: it
// starts over) of size n.
function startGame(n, k) {
  const list = stock[n];
  const p = list[k % list.length];
  G = createGame(p, { auto: setup.auto, colorSeed: p.seed });
  Object.assign(G, { k, face: setup.face, t0: Date.now(), paused: null, mood: 'normal', ms: 0 });
  L('game started', { size: n, puzzle: k + 1, seed: p.seed, auto: G.auto, face: G.face });
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
  clockTimer = setInterval(tick, 1000);
  tick();
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
    // A face is drawn again when the mood changes (smiling at a win, sad
    // when out of hearts), not only when the mark does.
    const mood = m === 'face' || m === 'ghost' ? G.mood : '';
    if (mk.className !== cls || i === pop || mk.dataset.mood !== mood) {
      mk.className = cls;
      mk.dataset.mood = mood;
      mk.innerHTML = m === 'x' || m === 'bad' ? '✕' : m === 'face' || m === 'ghost' ? svg(G.face, G.mood) : '';
    }
  });
  $('turn').innerHTML = `<span class="chip">${svg(G.face)}</span><span>${G.n}×${G.n} · puzzle ${G.k + 1}</span>`;
  $('found').textContent = `${foundCount(G)} of ${G.n} found`;
  $('hearts').textContent = '❤️'.repeat(Math.max(0, G.hearts)) + '🤍'.repeat(HEARTS - Math.max(0, G.hearts));
  $('hearts').setAttribute('aria-label', `${Math.max(0, G.hearts)} of ${HEARTS} hearts left`);
  $('hintsLeft').textContent = G.hints;
  $('showsLeft').textContent = G.shows;
  $('hintBtn').disabled = !G.hints || !!G.result;
  $('showBtn').disabled = !G.shows || !!G.result;
  $('undoBtn').disabled = !canUndo(G);
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
  clearHint();
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
  const r = tap(G, d.start, e.timeStamp);
  if (r.why === 'quick') L('quick second tap on a new ✕: a slip, not a look', { square: d.start });
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

// A look's result on the screen: a face pops in (and the ✕s around it),
// or a red ✕ shakes and a heart goes.
function afterLook(i, r, how) {
  const at = { square: i, row: Math.floor(i / G.n) + 1, col: (i % G.n) + 1 };
  if (r.face) {
    L(`${how}: face`, { ...at, found: foundCount(G), autoX: r.autoX.length });
    sound.play('ding');
    draw(i);
    if (r.won) win();
    return;
  }
  L(`${how}: no face`, { ...at, hearts: G.hearts });
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
  clearHint();
  draw();
};
$('showBtn').onclick = () => {
  const r = showOne(G);
  if (!r.ok) return;
  clearHint();
  afterLook(r.square, r, 'show');
};

/* ---------- hints ---------- */

$('hintBtn').onclick = () => {
  const h = useHint(G);
  if (!h.ok) return;
  L('hint', { kind: h.kind, tgt: h.tgt, why: h.why.length, out: h.out.length, left: G.hints });
  clearHint();
  sound.play('ping');
  const cs = cells();
  for (const i of h.why) cs[i].classList.add('why');
  for (const i of h.out) cs[i].classList.add('out');
  if (h.tgt != null) cs[h.tgt].classList.add('tgt');
  if (h.kind !== 'none') $('board').classList.add('spot');
  $('hintbar').textContent = `💡 ${h.text}`;
  $('hintbar').classList.remove('idle');
  draw();
};
function clearHint() {
  for (const c of cells()) c.classList.remove('why', 'out', 'tgt');
  $('board').classList.remove('spot');
  // Empty and hidden between hints, but keeping its place (developer,
  // 2026-10-13: "Tap 💡 for the next step" stayed after the last hint, with
  // nothing left to tap, and the 💡 Hint button says it already).
  $('hintbar').textContent = '';
  $('hintbar').classList.remove('result');
  $('hintbar').classList.add('idle');
}

/* ---------- the end ---------- */

const plural = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`;

// Solved: the faces smile and wiggle; the time, mistakes and hints, and
// the best time for this size.
function win() {
  const ms = elapsed();
  clearInterval(clockTimer);
  $('clock').textContent = `⏱ ${clock(ms)}`;
  const { best, newBest } = recordTime(prog, G.n, ms);
  prog.next[G.n] = G.k + 1;
  saveProgress();
  L('solved', { size: G.n, puzzle: G.k + 1, time: clock(ms), mistakes: G.mistakes, hints: G.hintsUsed, shows: G.showsUsed, newBest, best: best && clock(best) });
  G.mood = 'winner';
  draw();
  sound.play('win');
  [...G.sol].forEach((i, k) => setTimeout(() => cells()[i]?.classList.add('cheer'), k * CHEER_STEP_MS));
  const bits = [clock(ms), plural(G.mistakes, 'mistake'), plural(G.hintsUsed, 'hint')];
  if (G.showsUsed) bits.push(`${G.showsUsed} shown`);
  const n = G.n, up = Math.min(10, n + 1);
  const game = G;
  setTimeout(() => {
    if (G !== game) return;
    ending(`<b>Solved!</b> ${bits.join(' · ')}. ${newBest ? 'Your best for this size!' : `Best: ${clock(best)}.`}`,
      n < 10 ? `Next: ${up}×${up}` : 'Next', () => startGame(up, prog.next[up] ?? 0),
      'Same size', () => startGame(n, prog.next[n] ?? 0));
  }, WIN_MS);
}

// Out of hearts: the faces not found show pale and sad.
function lose() {
  clearInterval(clockTimer);
  L('out of hearts', { size: G.n, puzzle: G.k + 1, found: foundCount(G), time: clock(elapsed()) });
  G.mood = 'sad';
  G.marks.forEach((m, i) => { if (G.sol.has(i) && m !== 'face') G.marks[i] = 'ghost'; });
  draw();
  for (const i of G.sol) if (G.marks[i] === 'ghost') cells()[i].classList.add('ghost');
  sound.play('aww');
  const { n, k } = G;
  const game = G;
  setTimeout(() => {
    if (G !== game) return;
    ending('<b>Out of hearts.</b> The pale faces show where they were.',
      'Try again', () => startGame(n, k),
      'Another', () => { prog.next[n] = k + 1; saveProgress(); startGame(n, k + 1); });
  }, LOSE_MS);
}

// The result in the hint bar, and the end buttons in place of the tools.
function ending(html, againText, again, sameText, same) {
  $('hintbar').innerHTML = html;
  $('hintbar').classList.remove('idle');
  $('hintbar').classList.add('result');
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

startLog('hidden-faces');
renderSetup();
