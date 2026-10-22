// Laser Lab screens (setup and play), from the mockup v7 (2026-10-22;
// DESIGN.md "Laser Lab"). The rules, solver, hints and runs live in
// src/core/laser-lab.js; this file only draws, keeps time and handles
// taps. The puzzles come from data/laser-lab.json
// (tools/laser-lab-puzzles.js).

import {
  SETUPS, RUN, PRICE, HEARTS, setupOf, parseSetup, decode, stockAt, puzzleNumber, trace, boardOf, gemColours, checkLamp,
  createGame, placedOf, budgetLeft, nextHintPrice, tapSquare, clearBoard, switchLamp, readyLamps, failedBefore,
  missWords, rightWords, lampName, coins, answersFor, useHint, giveUp, tryAgain, snapshotGame, restoreGame, spent,
  PROGRESS_KEY, readProgress, runOf, keepCurrent, finishPuzzle, DEMO, clock,
} from '../core/laser-lab.js';
import { mergeSetup } from '../core/resume.js';
import { largestFitting } from '../core/fit.js';
import { STAR } from './hfboard.js';
import { pieceSvg, lampSvg, gemSvg, wallSvg, cellSvg, lampColour, miniSvg } from './llboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const STOCK_FILE = 'data/laser-lab.json';
const STEP_MS = 90;      // a beam runs out a square per step
const HINTED_MS = 3300;  // the ring round a hint's square
const MIN_CELL = 24, MAX_CELL = 72;
const RIM = .7;          // the lasers' rim, in squares, each side
const NAME = { m: 'Mirror', s: 'Splitter' };
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('laser-lab', msg, data);
const at = (p, i) => ({ square: i, row: Math.floor(i / p.n) + 1, col: i % p.n + 1 });

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { size: 6, lasers: 1 };
const setupKey = () => setupOf(setup.size, setup.lasers);

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing remembered */ }
// The runs per size and lasers, with the puzzle under way, kept on the device.
let prog = readProgress(null);
try { prog = readProgress(storage?.getItem(PROGRESS_KEY)); } catch { /* unreadable: start fresh */ }
function saveProgress() {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(prog)); } catch (e) { L('progress not kept', { error: String(e) }); }
}

let stock = null;     // { setup: [entry, ...] } (decoded as each is played)
let P = null;         // the puzzle being played
let G = null;         // its game (src/core), kept as JSON
// The screen's own: the piece a tap puts down, a beam running out, the
// bar's words, the end's words, the clock, the cheapest ways (worked out
// at the first hint or Show answer), and the question asked in place of
// the tools ('answer' or 'again').
const ui = { sel: 'm', busy: false, lighting: null, bar: { kind: 'idle', words: '' }, end: null, t0: 0, paused: null, answers: null, hinted: -1, asking: null };
let clockTimer = null;
let lastFit = '';

// Kept after every change, and picked up when the page opens again in the
// same visit (DESIGN.md "Coming back to a game"): the puzzle, the board,
// the lasers on, the clock, the bar's words and the end.
const resume = resumable('laser-lab', 1, () => ({
  screen: G ? 'play' : 'setup', setup,
  game: G && { ...snapshotGame(G), ms: elapsed() }, sel: ui.sel, bar: ui.bar, end: ui.end,
}));
let resuming = resume.saved?.screen === 'play';

/* ---------- the puzzles ---------- */

const t0 = performance.now();
fetch(STOCK_FILE)
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then(data => {
    if (SETUPS.some(s => !data[s]?.length)) throw new Error('a size and lasers with no puzzles');
    stock = Object.fromEntries(SETUPS.map(s => [s, data[s]]));
    L('puzzles loaded', { counts: SETUPS.map(s => `${s}:${stock[s].length}`).join(' '), ms: Math.round(performance.now() - t0), runs: JSON.stringify(Object.fromEntries(Object.entries(prog.runs).map(([s, r]) => [s, `${r.no}/${r.at}${r.cur ? '+' : ''}`]))) });
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

$('mirrorIco').innerHTML = pieceSvg('m', 0);
$('splitIco').innerHTML = pieceSvg('s', 0);
$('wallIco').innerHTML = wallSvg();
$('oneIco').innerHTML = `<span class="lico">${lampSvg(0, true)}</span>`;
$('twoIco').innerHTML = `<span class="lico">${lampSvg(1, true)}</span><span class="lico">${lampSvg(2, true)}</span>`;
$('gemIcos').innerHTML = [1, 2, 3].map(k => `<span class="gico">${gemSvg(k, true)}</span>`).join('');
$('rulesPic').innerHTML = miniSvg(DEMO);

function renderSetup() {
  for (const b of $('sizes').children) b.setAttribute('aria-pressed', String(Number(b.dataset.n) === setup.size));
  for (const b of $('lampBtns').children) b.setAttribute('aria-pressed', String(Number(b.dataset.l) === setup.lasers));
  // under Play!: the run under way for this size and lasers
  const r = runOf(prog, setupKey()), best = prog.best[setupKey()];
  const savings = k => `<b class="${k < 0 ? 'neg' : ''}">${coins(k)}</b>`;
  $('runLine').innerHTML = (r.at || r.cur || r.hearts < HEARTS ? `Puzzle ${r.at + 1} of ${RUN}${r.cur ? ' (under way)' : ''} · savings ${savings(r.savings)} · ${heartsOf(r.hearts)}` : `A run of ${RUN} puzzles`)
    + (best !== undefined ? ` · best run ${savings(best)}` : '');
  $('playBtn').disabled = !stock;
  if (!stock && !$('why').textContent) $('why').textContent = 'Getting the puzzles…';
  if (stock) $('why').textContent = '';
  if (!resuming) resume.keep();
}
// ❤️ for the run's Try agains left, 🤍 for those used
const heartsOf = h => '❤️'.repeat(h) + '🤍'.repeat(HEARTS - h);
for (const b of $('sizes').children) b.onclick = () => { setup.size = Number(b.dataset.n); L('size', { size: setup.size }); renderSetup(); };
for (const b of $('lampBtns').children) b.onclick = () => { setup.lasers = Number(b.dataset.l); L('lasers', { lasers: setup.lasers }); renderSetup(); };
$('playBtn').onclick = () => {
  if (!stock) return;
  showPlay();
  startRun(setupKey());
};
function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
}

/* ---------- play screen ---------- */

// The run's next puzzle (Play!, Next): the one under way as it was left
// (DESIGN.md "Laser Lab": a puzzle left unfinished waits), or a new one.
function startRun(s) {
  const r = runOf(prog, s), k = puzzleNumber(r.no, r.at);
  const p = decode(s, stockAt(stock[s], k));
  let kept = r.cur ? restoreGame(p, r.cur) : null;
  if (r.cur && !kept) L('puzzle under way not picked up (not this puzzle)', { seed: p.seed, kept: r.cur.seed });
  if (kept) { kept.on = []; kept.broken = []; kept.failed = []; kept.miss = null; }
  startGame(s, k, p, kept, null);
  if (kept) L('puzzle picked up', { setup: s, run: r.no + 1, puzzle: r.at + 1, seed: p.seed, pieces: placedOf(G).size, left: budgetLeft(G, P), time: clock(G.ms) });
  else {
    L('puzzle started', { setup: s, run: r.no + 1, puzzle: r.at + 1, stock: k % stock[s].length + 1, seed: p.seed, budget: p.budget, cheapest: p.cheapest, savings: r.savings });
    keep();
  }
}

// Puzzle number k of setup s. `kept`: its game as left, `saved`: the
// screen's own as kept for a reload.
function startGame(s, k, p, kept, saved) {
  P = p;
  G = kept ?? createGame(p, s, k);
  Object.assign(ui, { busy: false, lighting: null, answers: null, hinted: -1, sel: saved?.sel === 's' ? 's' : 'm', paused: null });
  ui.bar = saved?.bar && typeof saved.bar.words === 'string' ? saved.bar : { kind: 'idle', words: '' };
  ui.end = saved?.end ?? null;
  ui.t0 = Date.now() - (G.ms ?? 0);
  $('askTools').hidden = true;
  ui.asking = null;
  clearInterval(clockTimer);
  buildBoard();
  render();
  // The tools back in place of the end's buttons (3.0: Next ▸ started the
  // next puzzle with them still hidden; only New game showed them), before
  // the fit (3.2: their two rows are taller than the end's one).
  const over = !!G.result;
  $('tools').hidden = over;
  $('endTools').hidden = !over;
  lastFit = '';
  fit();
  if (G.result) {
    $('clock').textContent = clock(G.ms);
    showEnd();
    return;
  }
  L('play buttons', { tools: !$('tools').hidden, end: !$('endTools').hidden, page: document.documentElement.scrollHeight, screen: innerHeight });
  clockTimer = setInterval(tick, 1000);
  tick();
}

const elapsed = () => (G.result ? G.ms : (ui.paused ?? Date.now()) - ui.t0);
function tick() { if (G && !G.result) $('clock').textContent = clock(elapsed()); }
// The clock stops while the page is hidden (another app, the phone locked).
document.addEventListener('visibilitychange', () => {
  if (!G || G.result) return;
  if (document.visibilityState === 'hidden' && ui.paused == null) { ui.paused = Date.now(); keep(); L('clock paused', { at: clock(elapsed()) }); }
  if (document.visibilityState === 'visible' && ui.paused != null) { ui.t0 += Date.now() - ui.paused; ui.paused = null; L('clock resumed', { at: clock(elapsed()) }); tick(); }
});
addEventListener('pagehide', () => keep());

// After every change: the puzzle under way kept in its run (the device)
// and the screen for a reload (this visit).
function keep() {
  if (!G) return;
  if (!G.result) {
    G.ms = elapsed();
    keepCurrent(prog, G.setup, G);
    saveProgress();
  }
  resume.keep();
}

// The board's squares, the beams' frame and the lasers beside it.
function buildBoard() {
  const n = P.n, wrap = $('boardwrap');
  wrap.style.setProperty('--n', n);
  wrap.classList.toggle('two', P.lamps.length > 1);
  let html = '';
  for (let i = 0; i < n * n; i++) html += `<div class="llcell" data-i="${i}" role="gridcell"></div>`;
  $('board').innerHTML = html;
  $('lamps').innerHTML = P.lamps.map((l, li) =>
    `<div class="lampbox s${l.side} k${lampColour(P, l)}" data-li="${li}" role="button" style="--k:${l.k}">${lampSvg(lampColour(P, l))}</div>`).join('');
  $('beam').setAttribute('viewBox', `0 0 ${n} ${n}`);
}

// Draws the squares, the lasers, the shop, the status, the beams that are
// on (in full) and the last one that wasn't right (faint, its misses
// ringed), and the bar.
function render() {
  const n = P.n, cells = $('board').children, placed = placedOf(G);
  for (let i = 0; i < n * n; i++) {
    const c = cells[i];
    c.innerHTML = cellSvg(P, i, placed, G.fixed);
    c.classList.remove('unlit', 'lit', 'lit1', 'lit2');
    c.classList.toggle('hinted', i === ui.hinted);
    const pc = placed.get(i), code = boardOf(P)[i];
    c.setAttribute('aria-label', `Row ${Math.floor(i / n) + 1}, column ${i % n + 1}: ${code === '#' ? 'wall' : code === 'G' ? 'gem' : pc ? `${NAME[pc.t].toLowerCase()} ${pc.o ? '\\' : '/'}` : 'empty'}`);
  }
  const ready = new Set(ui.busy ? [] : readyLamps(G, P));
  for (const e of $('lamps').children) {
    const li = Number(e.dataset.li), on = G.on.includes(li) || ui.lighting === li, broken = G.broken.includes(li);
    e.classList.toggle('on', on && !broken);
    e.classList.toggle('broken', broken);
    e.classList.toggle('ready', ready.has(li));
    const nm = lampName(P, li);
    e.setAttribute('aria-label', `${nm ? `${nm[0].toUpperCase()}${nm.slice(1)} laser` : 'Laser'}: ${broken ? 'broken' : on ? 'on' : 'off'}`);
  }
  $('tray').innerHTML = ['m', 's'].map(t => `<button type="button" class="piecebtn" data-t="${t}" aria-pressed="${ui.sel === t}" aria-label="${NAME[t]}: ${coins(PRICE[t])} each"${G.result ? ' disabled' : ''}>`
    + `<span class="pico">${pieceSvg(t, 0)}</span><span class="pn"><b>${NAME[t]}</b><span>${coins(PRICE[t])} each</span></span></button>`).join('');
  const r = runOf(prog, G.setup);
  // just the puzzle's place in the run (3.2: no board size, so it isn't
  // shrunk), the run's hearts under it
  $('turn').textContent = `Puzzle ${(G.result ? (ui.end?.at ?? r.at) : r.at) + 1} of ${RUN}`;
  const hearts = G.result ? (ui.end?.hearts ?? r.hearts) : r.hearts;
  $('hearts').textContent = heartsOf(hearts);
  $('hearts').setAttribute('aria-label', `${hearts} of ${HEARTS} hearts left for Try again`);
  // the budget and the savings in words (the puzzle's overspend shown
  // coming out of the savings); at the end, what the puzzle put into the
  // savings (or took out)
  const k = G.result ? G.saved : budgetLeft(G, P), sv = G.result ? (ui.end?.savings ?? r.savings) : r.savings + Math.min(0, k);
  const neg = v => `<b class="neg">−${Math.abs(v)}</b>`;
  $('budget').innerHTML = G.result === 'gaveup' ? `Answer ${neg(k)}`
    : G.result ? (k >= 0 ? `Saved <b>${k}</b>` : `<span class="neg">Over</span> <b class="neg">${-k}</b>`)
      : k >= 0 ? `Budget <b>${k}</b> of ${P.budget} left` : `Budget <b class="neg">${-k}</b> <span class="neg">over</span>`;
  $('savings').innerHTML = `Savings ${sv < 0 ? neg(sv) : `<b>${sv}</b>`}`;
  $('hintPrice').textContent = coins(nextHintPrice(G));
  for (const id of ['hintBtn', 'clearBtn', 'answerBtn', 'playNewBtn']) $(id).disabled = !!G.result;
  $('againBtn').disabled = !!G.result || hearts <= 0;
  const t = G.on.length ? trace(P, placed, G.on) : null;
  const miss = G.miss && !G.result ? checkLamp(P, placed, G.miss.li, G.miss.others) : null;
  drawSegs(t ? t.segs : [], miss ? miss.segs : []);
  if (t) for (const [i, got] of t.lit) cells[i].classList.add(gemLit(i, got));
  if (miss) for (const i of [...miss.unlit, ...miss.wrong]) cells[i].classList.add('unlit');
  paintBar();
}
// a gem's look for the colours on it: lit, or (purple, one colour) half lit
function gemLit(i, got) {
  const k = gemColours(P).get(i);
  return (got & k) === k || got & ~k ? 'lit' : `lit${got & k}`;
}

// The beams: two colours run side by side, a little apart, so both show
// where they share a line. `segs` drawn at once, `faint` faint, `grow`
// growing a step at a time (cb.gem and cb.lamp as a beam reaches one, then
// cb.done).
let growTimers = [];
function drawSegs(segs, faint, grow, cb = {}) {
  for (const t of growTimers) clearTimeout(t);
  growTimers = [];
  const beam = $('beam'), two = P.lamps.length > 1, cols = two ? [1, 2] : [0];
  beam.innerHTML = ['glow', 'core'].flatMap(k => cols.flatMap(c => [`<g class="${k} c${c} ghost"></g>`, `<g class="${k} c${c} full"></g>`])).join('');
  const ns = 'http://www.w3.org/2000/svg';
  const add = (g, isFaint, growing) => {
    const off = two ? (g.col === 1 ? -.06 : .06) : 0, h = g.y1 === g.y2;
    for (const grp of beam.querySelectorAll(`.c${two ? g.col : 0}.${isFaint ? 'ghost' : 'full'}`)) {
      const l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', g.x1 + (h ? 0 : off)); l.setAttribute('y1', g.y1 + (h ? off : 0));
      l.setAttribute('x2', g.x2 + (h ? 0 : off)); l.setAttribute('y2', g.y2 + (h ? off : 0));
      l.setAttribute('pathLength', '1');
      if (growing) l.setAttribute('class', 'grow');
      grp.appendChild(l);
    }
  };
  segs.forEach(g => add(g, false, false));
  faint.forEach(g => add(g, true, false));
  if (!grow) return;
  const last = Math.max(0, ...grow.map(g => g.step)), n = P.n, b = boardOf(P);
  for (let k = 0; k <= last; k++) growTimers.push(setTimeout(() => {
    for (const g of grow) if (g.step === k) {
      add(g, false, true);
      if (g.end === 'stop' && g.x2 % 1) { const i = Math.floor(g.y2) * n + Math.floor(g.x2); if (b[i] === 'G') growTimers.push(setTimeout(() => cb.gem(i), STEP_MS)); }
      if (g.end === 'lamp') growTimers.push(setTimeout(() => cb.lamp(g.lamp), STEP_MS));
    }
  }, k * STEP_MS));
  growTimers.push(setTimeout(cb.done, (last + 2) * STEP_MS));
}

// The hint bar's words (3 lines, its space kept so the board never
// moves): a notice, a beam that wasn't right, a hint, or nothing. At the
// end, the result (showEnd).
function paintBar() {
  if (G.result) return;
  const bar = $('hintbar');
  bar.className = `hintbar ${ui.bar.kind}`;
  bar.textContent = ui.bar.words;
}
function setBar(kind, words = '') { ui.bar = { kind, words }; if (G && !G.result) paintBar(); }

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

// The turn line and the status beside the 🏠 (the hearts and the clock)
// as big as fit, none cut (Colour Sudoku's fitInfo; journal Q27): from
// 20px down to 10px, in half pixels. Measured with the widest they will
// show ("Puzzle 10 of 10", "59:59"), once per screen width. The budget
// row under them stays at 17px (3.2); measured with its widest words, it
// goes on two lines, without its dot, when one is too narrow.
let infoFitFor = null;
function fitInfo() {
  const info = document.querySelector('.topinfo'), t = $('turn'), c = $('clock'), money = $('money');
  if (!info.offsetParent || infoFitFor === innerWidth) return;
  infoFitFor = innerWidth;
  const keep = [t.textContent, c.textContent];
  t.textContent = `Puzzle ${RUN} of ${RUN}`;
  c.textContent = '59:59';
  const parts = [t, $('hearts'), c];
  const cut = () => parts.filter(e => e.scrollWidth > e.clientWidth + 0.5).map(e => e.id);
  info.style.removeProperty('--tif');
  const before = cut();
  const r = largestFitting(h => { info.style.setProperty('--tif', `${h / 2}px`); return cut().length === 0 && info.scrollWidth <= info.clientWidth + 0.5; }, 20, 40);
  [t.textContent, c.textContent] = keep;
  const b = $('budget'), s = $('savings'), mk = [b.innerHTML, s.innerHTML];
  b.innerHTML = `Budget <b>${P.budget}</b> of ${P.budget} left`;
  s.innerHTML = 'Savings <b class="neg">−99</b>';
  money.classList.remove('wrap');
  const need = [...money.children].reduce((w, e) => w + e.getBoundingClientRect().width, 0);
  money.classList.toggle('wrap', need > money.clientWidth + 0.5);
  [b.innerHTML, s.innerHTML] = mk;
  L('turn line fit', { font: r.size / 2, cutAt20: before, fitted: r.fitted, width: info.clientWidth, screen: innerWidth,
    budgetRow: { font: parseFloat(getComputedStyle(money).fontSize), need: Math.round(need), width: money.clientWidth, wrapped: money.classList.contains('wrap') } });
}

// The board as big as fits: the whole page on the screen, no scrolling.
// Its width is n squares and the lasers' rim each side.
function fit() {
  if (!G || $('play').hidden) return;
  fitInfo();
  fitTools();
  if (G.result) fitEnd();
  const wrap = $('boardwrap'), main = document.querySelector('main'), n = P.n;
  const widest = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor((main.clientWidth - 6) / (n + 2 * RIM))));
  const r = fitPlayScreen(px => wrap.style.setProperty('--cell', `${px}px`), MIN_CELL, widest);
  const key = `${r.size}@${innerWidth}x${innerHeight}`;
  if (key !== lastFit) {
    lastFit = key;
    L('fit', { cell: r.size, fitted: r.fitted, tries: r.tries, page: r.page, screen: r.screen, mainW: main.clientWidth, playW: Math.round($('play').getBoundingClientRect().width) });
  }
}
addEventListener('resize', fit);

/* ---------- taps ---------- */

// Two quick taps zoomed the iPhone in on Find the Stars' board
// (2026-10-13), despite its touch-action: cancelling each touch's end
// stops the double-tap zoom. The board, the lasers and the shop take
// pointer events (not clicks, which the cancelled touch end would stop).
for (const el of [$('boardwrap'), $('tray')]) {
  let last = 0;
  el.addEventListener('touchend', e => {
    if (!e.cancelable) return;
    e.preventDefault();
    if (e.timeStamp - last < 400) L('quick second tap: zoom blocked', { ms: Math.round(e.timeStamp - last), on: el.id });
    last = e.timeStamp;
  }, { passive: false });
}

const shake = el => { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); };

// A square: put the picked piece down, turn it, take it off.
$('board').addEventListener('pointerdown', e => {
  const c = e.target.closest('.llcell');
  if (!c || !G || G.result || ui.busy) return;
  e.preventDefault();
  if (!$('askTools').hidden) { L(`${ui.asking}: no (the board touched)`); hideAsk(); }
  const i = Number(c.dataset.i), r = tapSquare(G, P, i, ui.sel);
  if (!r.ok) { shake(c); L('square refused', { ...at(P, i), why: r.why }); return; }
  sound.play('tick');
  L('piece', { ...at(P, i), did: r.did, piece: r.t, spent: spent(G), left: budgetLeft(G, P) });
  ui.hinted = -1;
  if (['notice', 'wrong'].includes(ui.bar.kind)) setBar('idle');
  render();
  keep();
});

// A laser: on goes off (free); off goes on, and its beam runs out. Right,
// it stays on; not, it costs 1 coin and goes off, its beam left faint.
$('lamps').addEventListener('pointerdown', e => {
  const box = e.target.closest('.lampbox');
  if (!box || !G || G.result || ui.busy) return;
  e.preventDefault();
  if (!$('askTools').hidden) hideAsk();
  const li = Number(box.dataset.li), name = lampName(P, li);
  const ready = readyLamps(G, P).includes(li);
  const r = switchLamp(G, P, li);
  if (r.refused) {
    shake(box);
    setBar('notice', r.refused === 'broken' ? 'That laser is broken. Move a piece and it\'s mended.' : 'Nothing has moved since that beam: move a piece first.');
    L('laser refused', { laser: li, why: r.refused });
    return;
  }
  if (r.did === 'off') {
    L('laser off', { laser: li });
    if (ui.bar.kind === 'notice') setBar('idle');
    render();
    keep();
    return;
  }
  const { res, others } = r;
  L('laser on', { laser: li, colour: name || 'yellow', others, ready, ok: res.ok, solved: res.solved, unlit: res.unlit.length, wrong: res.wrong.length, hits: [...res.hits], left: budgetLeft(G, P) });
  // the beam runs out over the beams already on; the game has moved on
  ui.busy = true;
  ui.lighting = li;
  setBar('idle');
  const placed = placedOf(G), before = trace(P, placed, others), lit = new Map(before.lit), cells = $('board').children, bit = P.lamps[li].c || 1;
  const show = { ...G, on: others, miss: null, broken: G.broken.filter(h => !res.hits.has(h)), result: null };
  const real = G;
  G = show;
  render();
  G = real;
  drawSegs(before.segs, [], res.segs, {
    gem: i => { lit.set(i, (lit.get(i) || 0) | bit); cells[i].classList.remove('lit1', 'lit2'); cells[i].classList.add(gemLit(i, lit.get(i))); },
    lamp: burst,
    done: () => {
      ui.busy = false;
      ui.lighting = null;
      if (res.solved) { win(); return; }
      if (res.ok) {
        sound.play('ding');
        render();
        setBar('notice', rightWords(G, P, li));
      } else {
        sound.play('uhoh');
        render();
        setBar('wrong', missWords(P, res, li));
      }
      keep();
    },
  });
  keep();
});

// a laser a beam shone into: a small burst, then dark and cracked
function burst(li) {
  const e = $('lamps').children[li];
  e.classList.remove('on', 'ready');
  e.classList.add('broken', 'burst');
  for (let k = 0; k < 8; k++) {
    const s = document.createElement('span');
    s.className = 'shard';
    s.style.setProperty('--a', `${k * 45 + 20}deg`);
    e.appendChild(s);
  }
  setTimeout(() => { e.classList.remove('burst'); e.querySelectorAll('.shard').forEach(x => x.remove()); }, 900);
}

// The shop: the piece a tap puts down (pointer up for touch and mouse; a
// click with no pointer for the keyboard's Enter or Space).
function pickPiece(e) {
  const b = e.target.closest('.piecebtn');
  if (!b || b.disabled || !G || G.result) return;
  ui.sel = b.dataset.t;
  sound.play('tick');
  L('piece picked', { piece: ui.sel });
  render();
  resume.keep();
}
$('tray').addEventListener('pointerup', e => { if (e.button === 0) pickPiece(e); });
$('tray').addEventListener('click', e => { if (e.detail === 0) pickPiece(e); });

// ↺ Clear: every piece off but a hint's, their prices back.
$('clearBtn').onclick = () => {
  if (!G || G.result || ui.busy) return;
  const k = clearBoard(G);
  L('clear', { pieces: k, left: budgetLeft(G, P) });
  if (!k) return;
  sound.play('tick');
  ui.hinted = -1;
  setBar('idle');
  render();
  keep();
};

/* ---------- hints, Try again, Show answer, New game ---------- */

// The cheapest ways hints and Show answer choose from, worked out on the
// device the first time one is needed (a search of up to 2,000,000
// choices: about a quarter of a second on a computer).
function ensureAnswers() {
  if (ui.answers) return ui.answers;
  const t = performance.now(), r = answersFor(P);
  ui.answers = r.answers.length ? r.answers : [P.answer];
  L('cheapest ways worked out', { ways: r.answers.length, choices: r.nodes, ms: Math.round(performance.now() - t), over: r.over });
  return ui.answers;
}

// 💡 Hint: 1, then 2, then 3... It follows the cheapest way closest to
// the player's pieces; the piece it leaves is fixed there.
$('hintBtn').onclick = () => {
  if (!G || G.result || ui.busy) return;
  hideAsk();
  const h = useHint(G, P, ensureAnswers());
  if (!h.ok) return;
  L('hint', { kind: h.kind, ...(h.i !== undefined ? at(P, h.i) : {}), price: h.price, hints: G.hintsUsed, left: budgetLeft(G, P), text: h.text });
  if (h.kind === 'none') { setBar('notice', h.text); return; }
  sound.play('ping');
  ui.hinted = h.i;
  setBar('hint', h.text);
  render();
  const game = G;
  setTimeout(() => { if (G === game && ui.hinted === h.i) { ui.hinted = -1; $('board').children[h.i]?.classList.remove('hinted'); } }, HINTED_MS);
  keep();
};

// Show answer and Try again ask first, in place of the tools: Yes, or No
// (or a touch on the board).
function ask(what, q) {
  ui.asking = what;
  $('askQ').textContent = q;
  $('tools').hidden = true;
  $('askTools').hidden = false;
}
function hideAsk() {
  ui.asking = null;
  $('askTools').hidden = true;
  if (G && !G.result) $('tools').hidden = false;
}
$('askNo').onclick = () => { L(`${ui.asking}: no`); hideAsk(); };
$('askYes').onclick = () => {
  if (!G || G.result || ui.busy) return;
  const what = ui.asking;
  hideAsk();
  if (what === 'answer') showAnswer();
  if (what === 'again') again();
};

// 🔑 Show answer (🏳 Give up until 3.2; developer: "give up" sounded like
// a retry): a cheapest way with its beams; the whole budget off the
// savings.
$('answerBtn').onclick = () => {
  if (!G || G.result || ui.busy) return;
  L('answer?', { left: budgetLeft(G, P), budget: P.budget, time: clock(elapsed()) });
  ask('answer', `Show answer: ${coins(-P.budget)}?`);
};
function showAnswer() {
  const answers = ensureAnswers();
  G.ms = elapsed();
  giveUp(G, P, answers);
  clearInterval(clockTimer);
  const f = finish();
  L('answer shown', { setup: G.setup, seed: P.seed, cost: G.saved, savings: f.savings, runDone: f.done, time: clock(G.ms) });
  ui.end = { ...endOf(f), at: f.at, savings: f.savings, done: f.done, hearts: f.hearts };
  ui.hinted = -1;
  render();
  showEnd();
  keep();
}

// ❤️ Try again (3.2, 3 per run): the board cleared, hint pieces too, and
// everything the puzzle cost given back, for one of the run's hearts.
// Nothing to give back: no heart used, and the bar says so.
$('againBtn').onclick = () => {
  if (!G || G.result || ui.busy) return;
  const r = runOf(prog, G.setup), back = spent(G) + G.fees;
  if (!back) { refuseAgain('nothing spent'); return; }
  L('again?', { hearts: r.hearts, back, left: budgetLeft(G, P) });
  ask('again', 'Try again: uses a ❤️?');
};
function refuseAgain(why) {
  L('try again refused', { why, hearts: runOf(prog, G.setup).hearts });
  setBar('notice', why === 'no hearts' ? 'No ❤️ left in this run.' : 'Nothing to give back yet: Try again starts the puzzle over with all it cost given back.');
}
function again() {
  const r = tryAgain(prog, G);
  if (!r.ok) { refuseAgain(r.why); return; }
  sound.play('tick');
  L('try again', { back: r.back, pieces: r.pieces, fees: r.fees, hearts: r.hearts, left: budgetLeft(G, P), savings: runOf(prog, G.setup).savings });
  ui.hinted = -1;
  setBar('notice', `Started over: ${coins(r.back)} back. ${r.hearts ? `${r.hearts} ❤️ left in this run.` : 'No ❤️ left in this run.'}`);
  render();
  keep();
}

/* ---------- the end ---------- */

// The puzzle's end in the run: what's left of its budget (or, its answer
// shown, minus all of it) into the savings; the run moves on.
function finish() {
  const r = runOf(prog, G.setup), f = finishPuzzle(prog, G.setup, G.saved);
  saveProgress();
  L(f.done ? 'run over' : 'puzzle done', { setup: G.setup, run: r.no + 1, puzzle: r.at + 1, saved: G.saved, savings: f.savings, best: f.best, hearts: r.hearts });
  return { ...f, at: r.at, hearts: r.hearts };
}

// The end's words: the bar has room for a head and one line; at the end
// of a run the head is the run's savings.
function endOf(f) {
  const saved = G.saved;
  let how, head, line, short;
  if (G.result === 'solved') {
    const pieces = spent(G), fees = [G.hintsUsed ? `hints ${G.hintsUsed * (G.hintsUsed + 1) / 2}` : '', G.wrongLamps ? `lasers ${G.wrongLamps}` : ''].filter(Boolean);
    how = 'solved';
    head = saved >= 0 ? `Solved! Saved ${coins(saved)}` : `Solved, ${coins(-saved)} over`;
    line = `Pieces ${pieces}, cheapest ${P.cheapest}${pieces === P.cheapest ? ' ✓' : ''}${fees.length ? ` · ${fees.join(' · ')}` : ''}`;
    short = saved >= 0 ? `This one: saved ${coins(saved)}` : `This one: ${coins(-saved)} over`;
  } else {
    how = 'lost';
    head = `Answer shown: ${coins(saved)}`;
    line = `A cheapest way: ${coins(P.cheapest)}`;
    short = `This one: ${coins(saved)}`;
  }
  if (f.done) { head = `Run over! Savings ${coins(f.savings)}`; line = `${short}${f.best ? ' · Best run!' : ''}`; }
  return { how, head, line };
}

// Solved: the last beam right. The sparkle, the result in the bar.
function win() {
  clearInterval(clockTimer);
  G.ms = elapsed();
  $('clock').textContent = clock(G.ms);
  const f = finish();
  L('solved', { setup: G.setup, seed: P.seed, pieces: spent(G), cheapest: P.cheapest, hints: G.hintsUsed, wrongLasers: G.wrongLamps, saved: G.saved, savings: f.savings, time: clock(G.ms) });
  ui.end = { ...endOf(f), at: f.at, savings: f.savings, done: f.done, hearts: f.hearts };
  sound.play('win');
  render();
  showEnd();
  keep();
}

// The result in the hint bar beside one big star (sparkles for a solve,
// grey for an answer shown), and Next ▸ (New run after a run's 10th) / New game
// in place of the tools.
function showEnd() {
  const e = ui.end ?? { how: G.result === 'solved' ? 'solved' : 'lost', head: G.result === 'solved' ? 'Solved!' : 'Answer shown', line: '' };
  const sparks = e.how === 'solved' ? [0, 60, 120, 180, 240, 300].map((a, k) => `<i class="spark" style="--a:${a}deg;--d:${k * 60}ms">${STAR}</i>`).join('') : '';
  const bar = $('hintbar');
  bar.className = `hintbar result ${e.how}`;
  bar.innerHTML = `<span class="bigstar">${STAR}${sparks}</span><span class="res"><b>${e.head}</b><span>${e.line}</span></span>`;
  $('tools').hidden = true;
  $('askTools').hidden = true;
  $('endTools').hidden = false;
  $('nextBtn').textContent = e.done ? 'New run' : 'Next ▸';
  L('end buttons', { how: e.how, next: $('nextBtn').textContent });
  endFitFor = null;
  fitEnd();
}

// The end's words as big as fit in the bar's 3 lines (3.2: in coins they
// were cut at 320 px wide; so were 3.1's gave-up words, by 33 px): the
// head and the line shrink together, from their full size to 60%, in
// 2.5% steps. Once per end and screen width.
let endFitFor = null;
function fitEnd() {
  const bar = $('hintbar'), res = bar.querySelector('.res');
  if (!res || !bar.offsetParent || endFitFor === innerWidth) return;
  endFitFor = innerWidth;
  const cs = getComputedStyle(bar), room = bar.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const r = largestFitting(k => { res.style.setProperty('--rf', k / 40); return res.getBoundingClientRect().height <= room + 0.5; }, 24, 40);
  L('end words fit', { scale: r.size / 40, fitted: r.fitted, height: Math.round(res.getBoundingClientRect().height), room: Math.round(room), screen: innerWidth });
}
$('nextBtn').onclick = () => { L('next', { run: runOf(prog, G.setup).no + 1 }); startRun(G.setup); };
// New game, at the end or during play (3.2; developer: "New game is the
// quit"): back to setup, the run kept.
$('newBtn').onclick = () => newGame();
$('playNewBtn').onclick = () => { if (G && !G.result && !ui.busy) newGame(); };
function newGame() {
  clearInterval(clockTimer);
  const during = !G.result;
  if (during) keep();
  L('new game', { during, setup: G.setup, puzzle: runOf(prog, G.setup).at + 1, kept: !!runOf(prog, G.setup).cur });
  hideAsk();
  G = null;
  P = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  $('tools').hidden = false;
  $('endTools').hidden = true;
  renderSetup();
  scrollTo(0, 0);
}

// The game kept last time (once the puzzles are in): the same puzzle, if
// it's still there, as it was left.
function restore() {
  const saved = resume.saved, g = saved.game;
  try {
    mergeSetup(setup, saved.setup);
    const list = stock[g?.setup];
    if (!list) throw new Error(`no ${g?.setup} puzzles`);
    if (!Number.isInteger(g.k) || stockAt(list, g.k)?.[0] !== g.seed) throw new Error('not the same puzzle (the puzzles changed)');
    const p = decode(g.setup, stockAt(list, g.k)), kept = restoreGame(p, g);
    if (!kept) throw new Error('not a game of this puzzle');
    showPlay();
    startGame(g.setup, g.k, p, kept, saved);
    L('resumed', { setup: G.setup, seed: P.seed, pieces: placedOf(G).size, on: G.on, left: budgetLeft(G, P), time: clock(elapsed()), result: G.result });
    return true;
  } catch (e) {
    L('resume failed: a new game', { error: String(e) });
    resume.clear();
    clearInterval(clockTimer);
    G = null;
    P = null;
    $('play').hidden = true;
    $('setup').hidden = false;
    return false;
  }
}

startLog('laser-lab');
mergeSetup(setup, resume.saved?.setup);
if (!SETUPS.includes(setupKey())) Object.assign(setup, { size: 6, lasers: 1 });
if (resuming) $('setup').hidden = true;
else renderSetup();
