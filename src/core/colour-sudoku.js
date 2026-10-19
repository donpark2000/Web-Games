// Colour Sudoku: rules, solver, puzzle maker and a game. No DOM or UI
// code: the screen lives in src/ui/colour-sudoku.js.
//
// The puzzle (DESIGN.md "Colour Sudoku"; Extra Regions, developer
// 2026-10-19, journal Q29): a 9 x 9 Sudoku (1 to 9 once in every row,
// column and 3 x 3 box) whose squares are also split into nine joined
// coloured shapes of 9 squares, each also holding 1 to 9 once.
//
// A puzzle is { level, seed, reg, givens, sol }: reg the colour (0-8) of
// each square, givens the digits shown at the start (0 = empty), sol the
// answer; square i = row * 9 + col. The solver works only by steps a
// person can see, one at a time, so the same steps are the hints; a
// puzzle it finishes has exactly one answer.
//
// A game is a plain object (the puzzle, the board, notes, hearts, hints,
// undo); the functions below change only the game passed in.
//
// From the mockup's core (cs-core.js, mockup v3.1, 2026-10-19), which
// made the puzzles the developer tried.

import { mulberry32, colorsFor, fadedColor, clock } from './hidden-faces.js';

export { mulberry32, fadedColor, clock };

export const N = 9, NN = 81;
export const HEARTS = 3;   // wrong digits allowed: the third ends the game
export const HINTS = 3;    // per puzzle

// The levels (the setup's "How hard?") and the solver's rules each is
// made with: 1 singles only ("the only place a digit can go", "the only
// digit left"), 2 also "all inside" (a unit's digit confined to another
// unit). Hints may use rule 3 too (pairs), though a stock puzzle never
// needs it.
export const LEVELS = ['easy', 'harder'];
export const LEVEL_NAMES = { easy: 'Easy', harder: 'Harder' };
export const RULE = { easy: 1, harder: 2 };
export const HINT_RULE = 3;

function shuffled(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const rowOf = i => Math.floor(i / N);
export const colOf = i => i % N;
export const boxOf = i => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
const bit = d => 1 << d;
const pop = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
export const digitsOf = m => { const r = []; for (let d = 1; d <= 9; d++) if (m & bit(d)) r.push(d); return r; };

/* ---------- the maker ---------- */

// A full grid, box rules only (the colours are drawn round it after).
export function randomSolution(rnd) {
  const g = new Array(NN).fill(0);
  const ok = (i, d) => {
    for (let j = 0; j < NN; j++) if (g[j] === d && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) return false;
    return true;
  };
  const fill = i => {
    if (i === NN) return true;
    for (const d of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) if (ok(i, d)) { g[i] = d; if (fill(i + 1)) return true; g[i] = 0; }
    return false;
  };
  fill(0);
  return g;
}

export function nbrs(i) {
  const r = rowOf(i), c = colOf(i), o = [];
  if (r > 0) o.push(i - N);
  if (r < N - 1) o.push(i + N);
  if (c > 0) o.push(i - 1);
  if (c < N - 1) o.push(i + 1);
  return o;
}
export function connected(reg, g) {
  const cells = [];
  for (let i = 0; i < NN; i++) if (reg[i] === g) cells.push(i);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const i = st.pop(); for (const j of nbrs(i)) if (reg[j] === g && !seen.has(j)) { seen.add(j); st.push(j); } }
  return seen.size === cells.length;
}
export function perimeter(reg) {
  let p = 0;
  for (let i = 0; i < NN; i++) {
    if (colOf(i) < N - 1 && reg[i] !== reg[i + 1]) p++;
    if (rowOf(i) < N - 1 && reg[i] !== reg[i + N]) p++;
  }
  return p;
}
// Every colour spread over SPREAD+ rows, columns and boxes, with at most
// MOST+1 squares in any one (a colour that is nearly a row or a box adds
// little). A stricter aim (3+, at most 5) failed in 23 of 23 runs
// (journal, "Extra Regions chosen").
const SPREAD = 2, MOST = 6;
export function regionsOk(reg) {
  for (let g = 0; g < N; g++) {
    const cs = [];
    for (let i = 0; i < NN; i++) if (reg[i] === g) cs.push(i);
    for (const f of [rowOf, colOf, boxOf]) {
      const k = new Array(9).fill(0);
      for (const i of cs) k[f(i)]++;
      if (k.filter(Boolean).length < SPREAD || Math.max(...k) > MOST + 1) return false;
    }
  }
  return true;
}
// One colour's part of the annealing cost: spread over SPREAD+ rows,
// columns and boxes, at most MOST squares in one row, column or box, and
// joined (each extra piece costs W, so a split colour is allowed on the
// way but not at the end).
function colourCost(reg, g, W) {
  const cs = [];
  for (let i = 0; i < NN; i++) if (reg[i] === g) cs.push(i);
  const rs = new Set(cs.map(rowOf)), cl = new Set(cs.map(colOf)), bx = new Array(9).fill(0);
  for (const i of cs) bx[boxOf(i)]++;
  const nb = bx.filter(Boolean).length;
  const left = new Set(cs);
  let pieces = 0;
  while (left.size) {
    pieces++;
    const s0 = left.values().next().value;
    left.delete(s0);
    const st = [s0];
    while (st.length) { const i = st.pop(); for (const j of nbrs(i)) if (left.has(j)) { left.delete(j); st.push(j); } }
  }
  const rc = new Array(9).fill(0), ccn = new Array(9).fill(0);
  for (const i of cs) { rc[rowOf(i)]++; ccn[colOf(i)]++; }
  return 4 * (Math.max(0, SPREAD - rs.size) + Math.max(0, SPREAD - cl.size) + Math.max(0, SPREAD - nb))
    + 3 * (Math.max(0, Math.max(...bx) - MOST) + Math.max(0, Math.max(...rc) - MOST) + Math.max(0, Math.max(...ccn) - MOST)) + W * (pieces - 1);
}
const joinedAll = reg => [...Array(N).keys()].every(g => connected(reg, g));
// Nine joined colours of 9 squares, each holding 1-9 once in `sol`:
// grown from one square per box (growRegions; often stuck, so tried
// again), then wandered (simulated annealing) by swapping two squares
// with the same digit between colours, towards a boundary of about
// `target` lines (boxes have 36, rows 72) and a colourCost of 0. Null if
// it doesn't get there.
export function makeRegions(sol, rnd, iters = 100000, target = 56, W = 14, T0 = 6) {
  let reg = null;
  for (let k = 0; k < 3000 && !reg; k++) reg = growRegions(sol, rnd);
  if (!reg) return null;
  const where = Array.from({ length: N }, () => []);
  for (let i = 0; i < NN; i++) where[reg[i]][sol[i]] = i;
  const cc = Array.from({ length: N }, (_, g) => colourCost(reg, g, W));
  let per = perimeter(reg), E = Math.abs(per - target) + cc.reduce((x, y) => x + y, 0);
  const edges = i => nbrs(i).reduce((n, j) => n + (reg[j] !== reg[i]), 0);
  for (let t = 0; t < iters; t++) {
    const a = Math.floor(rnd() * NN), A = reg[a];
    const ns = nbrs(a).filter(j => reg[j] !== A);
    if (!ns.length) continue;
    const B = reg[ns[Math.floor(rnd() * ns.length)]], b = where[B][sol[a]];
    const before = edges(a) + edges(b) - (nbrs(a).includes(b) ? 1 : 0);
    reg[a] = B; reg[b] = A;
    const np = per - before + edges(a) + edges(b) - (nbrs(a).includes(b) ? 1 : 0);
    const ca = colourCost(reg, A, W), cb = colourCost(reg, B, W);
    const nE = E - Math.abs(per - target) + Math.abs(np - target) - cc[A] - cc[B] + ca + cb;
    const temp = T0 * Math.pow(0.02, t / iters);
    if (nE > E && rnd() > Math.exp((E - nE) / temp)) { reg[a] = A; reg[b] = B; continue; }
    E = nE; per = np; cc[A] = ca; cc[B] = cb; where[A][sol[b]] = b; where[B][sol[a]] = a;
    if (cc.every(c => c < W) && Math.abs(per - target) <= 6 && t > iters / 2 && joinedAll(reg) && regionsOk(reg)) return reg;
  }
  return joinedAll(reg) && regionsOk(reg) ? reg : null;
}
// Colours grown around a filled grid: one square per box to start, then
// the colour with the fewest choices takes a neighbouring square whose
// digit it lacks. Null when one gets stuck.
export function growRegions(sol, rnd) {
  const reg = new Array(NN).fill(-1), has = Array.from({ length: N }, () => new Set()), size = new Array(N).fill(0);
  for (let b = 0; b < N; b++) {
    const c = (Math.floor(b / 3) * 3 + Math.floor(rnd() * 3)) * N + (b % 3) * 3 + Math.floor(rnd() * 3);
    reg[c] = b; has[b].add(sol[c]); size[b] = 1;
  }
  for (let k = N; k < NN; k++) {
    let best = -1, bo = null;
    for (let g = 0; g < N; g++) {
      if (size[g] === N) continue;
      const fr = new Set();
      for (let i = 0; i < NN; i++) if (reg[i] === g) for (const j of nbrs(i)) if (reg[j] < 0 && !has[g].has(sol[j])) fr.add(j);
      if (!fr.size) return null;
      if (!bo || fr.size < bo.length) { best = g; bo = [...fr]; }
    }
    const c = bo[Math.floor(rnd() * bo.length)];
    reg[c] = best; has[best].add(sol[c]); size[best]++;
  }
  return reg;
}

/* ---------- the solver ---------- */

// Units: rows 0-8, columns 9-17, boxes 18-26, colours 27-35.
const unitsMemo = new Map();
export function unitsFor(reg) {
  const key = reg.join('');
  if (unitsMemo.has(key)) return unitsMemo.get(key);
  const units = Array.from({ length: 36 }, () => []);
  for (let i = 0; i < NN; i++) { units[rowOf(i)].push(i); units[9 + colOf(i)].push(i); units[18 + boxOf(i)].push(i); units[27 + reg[i]].push(i); }
  const cellUnits = Array.from({ length: NN }, (_, i) => [rowOf(i), 9 + colOf(i), 18 + boxOf(i), 27 + reg[i]]);
  const peers = Array.from({ length: NN }, (_, i) => {
    const s = new Set();
    for (const u of cellUnits[i]) for (const j of units[u]) if (j !== i) s.add(j);
    return [...s];
  });
  const U = { units, cellUnits, peers };
  if (unitsMemo.size > 50) unitsMemo.clear();
  unitsMemo.set(key, U);
  return U;
}
export const unitKind = u => (u < 9 ? 'row' : u < 18 ? 'col' : u < 27 ? 'box' : 'colour');

// Solver state: the grid (0 = empty) and each square's candidates as a
// bit mask.
export function newState(reg, grid) {
  const U = unitsFor(reg);
  const s = { U, grid: grid.slice(), cand: new Array(NN).fill(0) };
  for (let i = 0; i < NN; i++) if (!s.grid[i]) {
    let m = 0b1111111110;
    for (const j of U.peers[i]) if (s.grid[j]) m &= ~bit(s.grid[j]);
    s.cand[i] = m;
  }
  return s;
}
function place(s, i, d) { s.grid[i] = d; s.cand[i] = 0; for (const j of s.U.peers[i]) s.cand[j] &= ~bit(d); }
// Boxes first, then colours, then rows and columns: a person scans boxes
// and colours for "the only place" most easily.
const UNIT_ORDER = [...Array(9).keys()].map(k => 18 + k).concat([...Array(9).keys()].map(k => 27 + k), [...Array(18).keys()]);

// The next step a person could take, easiest first: 'hidden' (the only
// place for d in a unit), 'naked' (the only digit left for a square);
// rule 2 adds 'inside' (all of a unit's places for d inside another
// unit, so d goes nowhere else in that one); rule 3 'pair' (two squares
// of a unit that can only be the same two digits). Null if stuck.
export function nextStep(s, rule = HINT_RULE) {
  const { units, cellUnits } = s.U;
  for (const u of UNIT_ORDER) {
    for (let d = 1; d <= 9; d++) {
      if (units[u].some(i => s.grid[i] === d)) continue;
      const L = units[u].filter(i => s.cand[i] & bit(d));
      if (L.length === 1) return { kind: 'hidden', unit: u, d, cell: L[0] };
    }
  }
  for (let i = 0; i < NN; i++) if (!s.grid[i] && pop(s.cand[i]) === 1) return { kind: 'naked', cell: i, d: digitsOf(s.cand[i])[0] };
  if (rule >= 2) {
    for (const u of UNIT_ORDER) for (let d = 1; d <= 9; d++) {
      if (units[u].some(i => s.grid[i] === d)) continue;
      const L = units[u].filter(i => s.cand[i] & bit(d));
      if (L.length < 2) continue;
      for (const v of cellUnits[L[0]]) {
        if (v === u || !L.every(i => cellUnits[i].includes(v))) continue;
        const elim = units[v].filter(i => !L.includes(i) && (s.cand[i] & bit(d)));
        if (elim.length) return { kind: 'inside', unit: u, other: v, d, cells: L, elim };
      }
    }
  }
  if (rule >= 3) {
    for (const u of UNIT_ORDER) {
      const two = units[u].filter(i => pop(s.cand[i]) === 2);
      for (let x = 0; x < two.length; x++) for (let y = x + 1; y < two.length; y++) {
        const a = two[x], b = two[y];
        if (s.cand[a] !== s.cand[b]) continue;
        const m = s.cand[a], elim = units[u].filter(i => i !== a && i !== b && (s.cand[i] & m));
        if (elim.length) return { kind: 'pair', unit: u, cells: [a, b], ds: digitsOf(m), elim };
      }
    }
  }
  return null;
}
export function apply(s, st) {
  if (st.kind === 'hidden' || st.kind === 'naked') place(s, st.cell, st.d);
  else if (st.kind === 'inside') for (const i of st.elim) s.cand[i] &= ~bit(st.d);
  else if (st.kind === 'pair') { const m = st.ds.reduce((a, d) => a | bit(d), 0); for (const i of st.elim) s.cand[i] &= ~m; }
}
// Solves from `grid` with steps up to `rule`: { solved, steps, grid,
// counts (steps per kind) }.
export function solve(reg, grid, rule = HINT_RULE) {
  const s = newState(reg, grid), steps = [];
  for (let k = 0; k < 2000; k++) { const st = nextStep(s, rule); if (!st) break; steps.push(st); apply(s, st); }
  const counts = {};
  for (const st of steps) counts[st.kind] = (counts[st.kind] || 0) + 1;
  return { solved: s.grid.every(Boolean), steps, grid: s.grid, counts };
}

// A puzzle made from `seed` with the solver's steps up to `rule`: a
// solution, its colours, and givens taken out one at a time while the
// solver still finishes it (so it has exactly one answer). Null when 20
// tries make no colours. 0.2-2.2 s each (journal, "Extra Regions
// chosen").
export function generate(seed, rule = 1) {
  const rnd = mulberry32(seed);
  for (let tries = 0; tries < 20; tries++) {
    const sol = randomSolution(rnd);
    const reg = makeRegions(sol, rnd);
    if (!reg || !regionsOk(reg)) continue;
    const grid = sol.slice();
    for (const i of shuffled([...Array(NN).keys()], rnd)) {
      const d = grid[i];
      grid[i] = 0;
      if (!solve(reg, grid, rule).solved) grid[i] = d;
    }
    const r = solve(reg, grid, rule);
    return { seed, reg, sol, givens: grid, nGivens: grid.filter(Boolean).length, counts: r.counts, tries };
  }
  return null;
}

/* ---------- the puzzle stock (data/colour-sudoku.json) ---------- */

// The stock file (tools/colour-sudoku-puzzles.js): { "easy": [[seed,
// reg, givens], ...], "harder": [...] }; reg a string of 81 colour
// digits (0-8), givens of 81 digits (0 = empty). A level's puzzles are
// the first STOCK seeds from firstSeed(level) on whose puzzle is kept
// (stockPuzzle), in the order stockOrder gives them.
export const STOCK = 200;
export const firstSeed = level => (LEVELS.indexOf(level) + 1) * 100000;
// The puzzle made from `seed` for a level, or null when that seed's
// isn't kept: none made, or (Harder) none of its steps needs "all
// inside", so the Easy rules would do.
export function stockPuzzle(level, seed) {
  const p = generate(seed, RULE[level]);
  if (!p) return null;
  if (level === 'harder' && !p.counts.inside) return null;
  return p;
}
// The order a level's stock is played in (DESIGN.md "Colour Sudoku": no
// repeats when you start again): seed order shuffled once with a fixed
// seed, so the tool always makes the same file.
export function stockOrder(level, list) {
  return shuffled(list, mulberry32(firstSeed(level) + 1));
}
// The puzzle numbered k (0-based): after the last they come round again.
export const stockAt = (list, k) => list[k % list.length];
export const encode = (seed, p) => [seed, p.reg.join(''), p.givens.join('')];
// A stock entry as a puzzle, its answer worked out by the solver. Throws
// when it isn't one (problems says why).
export function decode(level, [seed, reg, givens]) {
  const p = { level, seed, reg: [...String(reg)].map(Number), givens: [...String(givens)].map(Number) };
  const why = problems(p);
  if (why.length) throw new Error(`colour sudoku ${level} ${seed}: ${why.join('; ')}`);
  p.sol = solve(p.reg, p.givens, RULE[level]).grid;
  return p;
}

// Everything wrong with a puzzle, as words ([] when it's fine): the
// shape, the colours (nine joined shapes of 9, spread), the givens, that
// the level's rules finish it (so one answer), that Harder needs "all
// inside", and the answer (1-9 once in every row, column, box and
// colour; the givens in it). `sol` is checked when given.
export function problems(p) {
  const { level, reg, givens } = p;
  const out = [];
  if (!LEVELS.includes(level)) return [`bad level ${level}`];
  if (!Array.isArray(reg) || reg.length !== NN || reg.some(g => !(Number.isInteger(g) && g >= 0 && g < N))) return ['bad colours'];
  if (!Array.isArray(givens) || givens.length !== NN || givens.some(d => !(Number.isInteger(d) && d >= 0 && d <= 9))) return ['bad givens'];
  for (let g = 0; g < N; g++) {
    const k = reg.filter(x => x === g).length;
    if (k !== N) out.push(`colour ${g} has ${k} squares`);
    else if (!connected(reg, g)) out.push(`colour ${g} not joined`);
  }
  if (out.length) return out;
  if (!regionsOk(reg)) out.push('a colour not spread out');
  const r = solve(reg, givens, RULE[level]);
  if (!r.solved) out.push(`the ${level} rules can't finish it`);
  else {
    if (level === 'harder' && !r.counts.inside) out.push('no step needs "all inside"');
    const U = unitsFor(reg);
    if (!U.units.every(u => new Set(u.map(i => r.grid[i])).size === N)) out.push('the answer repeats a digit');
    if (givens.some((d, i) => d && d !== r.grid[i])) out.push('a given not in the answer');
    if (p.sol && p.sol.join('') !== r.grid.join('')) out.push('the solver finds another answer');
  }
  return out;
}

// A puzzle for the pictures (the home page's button, the setup's rules):
// stock Easy seed 100003, solved.
export const DEMO = {
  seed: 100003,
  reg: [...'333332222333322222110000000111110057144415557666444557666488557666448577888888777'].map(Number),
  sol: [...'984653271312784956675192438891536742256947183437821695569418327128379564743265819'].map(Number),
};

/* ---------- colours ---------- */

// The puzzle's colours, [{ name, c, fc }] by colour: neighbouring shapes
// in colours that don't look alike where possible (Find the Stars'
// colorsFor), the same every time for a seed; fc is the colour faded for
// the squares a hint isn't about, over `sky` (the page's background).
export function coloursFor(reg, seed, sky = '#E4F1EE') {
  return colorsFor(N, reg, seed).map(c => ({ ...c, fc: fadedColor(c.c, sky) }));
}

/* ---------- a game ---------- */

// kind[i]: 'given', 'mine' (a right digit the player put), 'hint' (put
// by a hint or Show me how), 'pale' (the rest of the answer, shown after
// giving up or running out of hearts), '' (empty). bad[i]: a wrong digit
// on an empty square (red; it stays until replaced, undone or taken out
// by a hint). notes[i]: a bit mask of the digits noted (bit d for d).

// A new game of puzzle p. `tidy` (the setup's "Your notes": Auto tidy):
// a digit placed comes out of the notes it rules out.
export function createGame(p, { tidy = true } = {}) {
  if (!p.sol || p.sol.length !== NN) throw new Error('createGame: no answer');
  return {
    level: p.level, seed: p.seed, reg: p.reg, sol: p.sol, givens: p.givens, tidy: !!tidy,
    grid: p.givens.slice(), kind: p.givens.map(d => (d ? 'given' : '')), bad: new Array(NN).fill(0), notes: new Array(NN).fill(0),
    hearts: HEARTS, hints: HINTS, mistakes: 0, hintsUsed: 0, undo: [], result: null,
  };
}
export const emptyCount = g => g.grid.filter(d => !d).length;
const full = g => g.grid.every(Boolean);
// How many of each digit are on the board (index 1-9): a digit with 9 is
// done, and its keys are greyed.
export function digitCounts(g) {
  const c = new Array(10).fill(0);
  for (const d of g.grid) if (d) c[d]++;
  return c;
}

function tidyFrom(g, i, d) {
  for (const j of unitsFor(g.reg).peers[i]) g.notes[j] &= ~bit(d);
}
function putDigit(g, i, d, kind) {
  g.grid[i] = d;
  g.kind[i] = kind;
  g.bad[i] = 0;
  g.notes[i] = 0;
  if (g.tidy) tidyFrom(g, i, d);
  // A right digit is certain (like a found star): nothing on this square
  // can be undone any more.
  g.undo = g.undo.filter(u => u.i !== i);
}

// A digit d on square i. Right: it stays (with Auto tidy, out of the
// notes it rules out); { ok, right, won }. Wrong: red on the square, a
// heart and a mistake; { ok, wrong, lost }. Not ok (why): the game is
// over, the square isn't empty, or it already shows that wrong digit.
export function enter(g, i, d) {
  if (g.result) return { ok: false, why: 'over' };
  if (!(i >= 0 && i < NN) || !(d >= 1 && d <= 9)) return { ok: false, why: 'bad' };
  if (g.grid[i]) return { ok: false, why: 'done' };
  if (g.bad[i] === d) return { ok: false, why: 'same' };
  if (g.sol[i] === d) {
    putDigit(g, i, d, 'mine');
    const won = full(g);
    if (won) g.result = 'won';
    return { ok: true, right: true, won };
  }
  g.undo.push({ t: 'bad', i, before: g.bad[i] });
  g.bad[i] = d;
  g.hearts--;
  g.mistakes++;
  const lost = g.hearts <= 0;
  if (lost) endGame(g, 'lost');
  return { ok: true, wrong: true, lost };
}

// A note d on square i, on or off. Not on a square with a digit, right or
// wrong.
export function toggleNote(g, i, d) {
  if (g.result) return { ok: false, why: 'over' };
  if (!(i >= 0 && i < NN) || !(d >= 1 && d <= 9)) return { ok: false, why: 'bad' };
  if (g.grid[i]) return { ok: false, why: 'done' };
  if (g.bad[i]) return { ok: false, why: 'wrong digit' };
  g.undo.push({ t: 'note', i, before: g.notes[i] });
  g.notes[i] ^= bit(d);
  return { ok: true, on: !!(g.notes[i] & bit(d)) };
}

// Takes back the last note or wrong digit (a wrong digit's heart comes
// back; the mistake still counts). Never a right digit or a hint's.
// { ok, t, i, heart }.
export function undo(g) {
  if (g.result) return { ok: false };
  const u = g.undo.pop();
  if (!u) return { ok: false };
  if (u.t === 'note') g.notes[u.i] = u.before;
  else { g.bad[u.i] = u.before; g.hearts = Math.min(HEARTS, g.hearts + 1); }
  return { ok: true, t: u.t, i: u.i, heart: u.t === 'bad' };
}
export const canUndo = g => !g.result && g.undo.length > 0;

// Ends the game: 'lost' (out of hearts), 'gaveup' (Just end it), 'shown'
// (Show me how to the end) or 'won'. After lost or given up, the rest of
// the answer shows pale.
export function endGame(g, how) {
  if (g.result && g.result !== how) return { ok: false };
  g.result = how;
  if (how === 'lost' || how === 'gaveup') {
    for (let i = 0; i < NN; i++) if (!g.grid[i]) { g.grid[i] = g.sol[i]; g.kind[i] = 'pale'; g.bad[i] = 0; g.notes[i] = 0; }
  }
  return { ok: true };
}

/* ---------- hints ---------- */

const BOXNAMES = ['top-left', 'top', 'top-right', 'left', 'middle', 'right', 'bottom-left', 'bottom', 'bottom-right'];
// A unit's name in words: "row 3", "column 4", "the top-left box", or the
// colour's name ("Pink").
export function unitName(col, u, cap = false) {
  const k = unitKind(u), n = u % 9;
  const s = k === 'row' ? `row ${n + 1}` : k === 'col' ? `column ${n + 1}` : k === 'box' ? `the ${BOXNAMES[n]} box` : col[u - 27].name;
  return cap ? s[0].toUpperCase() + s.slice(1) : s;
}
const an = d => (d === 8 ? `an ${d}` : `a ${d}`);
const where = i => `row ${rowOf(i) + 1}, column ${colOf(i) + 1}`;
const tagFor = (col, u) => (unitKind(u) === 'colour' ? col[u - 27].name : unitKind(u));

// The next placement from the player's board (their notes aside), with
// the "all inside" or "pair" steps it needed first (only those that bear
// on it, the last two).
export function nextPlacement(reg, grid) {
  const s = newState(reg, grid), pre = [];
  for (let k = 0; k < 200; k++) {
    const st = nextStep(s, HINT_RULE);
    if (!st) return null;
    if (st.kind === 'hidden' || st.kind === 'naked') {
      const rel = pre.filter(e => e.elim.some(i => i === st.cell || (st.kind === 'hidden' && s.U.units[st.unit].includes(i)))
        && (e.kind === 'pair' || e.d === st.d || st.kind === 'naked'));
      return { ...st, pre: rel.slice(-2) };
    }
    pre.push(st);
    apply(s, st);
  }
  return null;
}

// For a hint's Why?: what stops d on each other empty square of unit u
// (the unit and the square holding d that it shares; by null when only
// the dashed squares rule it out).
export function blockers(reg, grid, u, d, cell) {
  const U = unitsFor(reg), out = [];
  for (const i of U.units[u]) {
    if (i === cell || grid[i]) continue;
    let by = null;
    for (const v of U.cellUnits[i]) {
      const j = U.units[v].find(k => grid[k] === d);
      if (j !== undefined) { by = { unit: v, at: j }; break; }
    }
    out.push({ cell: i, by });
  }
  return out;
}

// The next hint for game g, as plain data (kept with the game): { kind
// ('bad': a wrong digit to take out; 'hidden'; 'naked'), cell (ringed),
// d, lit (squares lit), pre (dashed: the squares of steps it needed
// first), tags ([square, label] for the Why?), blockers (the digits doing
// the ruling out, ringed in the Why?), text, why (null for 'bad') }.
// `col`: the puzzle's colours, for their names. Null when the solver is
// stuck (it shouldn't be).
export function findHint(g, col) {
  const badAt = g.bad.findIndex(Boolean);
  if (badAt >= 0) {
    return { kind: 'bad', cell: badAt, d: g.bad[badAt], lit: [], pre: [], tags: [], blockers: [],
      text: `The red ${g.bad[badAt]} on the ringed square (${where(badAt)}) is wrong. The hint takes it out.`, why: null };
  }
  const st = nextPlacement(g.reg, g.grid);
  if (!st) return null;
  const U = unitsFor(g.reg), { d, cell: i } = st;
  const h = { kind: st.kind, cell: i, d, lit: [], pre: [], tags: [], blockers: [], text: '', why: '' };
  let first = '';
  for (const e of st.pre) {
    h.pre.push(...e.cells);
    first += e.kind === 'inside'
      ? `${unitName(col, e.unit, true)}'s ${e.d} is on a dashed square, all in ${unitName(col, e.other)}: so no other ${e.d} in ${unitName(col, e.other)}. `
      : `In ${unitName(col, e.unit)} the dashed squares can only be ${e.ds[0]} or ${e.ds[1]}: so no other ${e.ds[0]} or ${e.ds[1]} there. `;
  }
  h.pre = [...new Set(h.pre)];
  if (st.kind === 'hidden') {
    h.lit = U.units[st.unit].slice();
    h.text = first ? `${first}Then the ringed square (${where(i)}) is the only place left for ${d} in ${unitName(col, st.unit)}.`
      : `The ringed square (${where(i)}) is the only place for ${d} in ${unitName(col, st.unit)}: every other empty square there sees ${an(d)}.`;
    const bl = blockers(g.reg, g.grid, st.unit, d, i);
    for (const x of bl) {
      if (x.by) { h.tags.push([x.cell, tagFor(col, x.by.unit)]); h.blockers.push(x.by.at); } else h.tags.push([x.cell, 'dashed']);
    }
    h.blockers = [...new Set(h.blockers)];
    h.lit.push(...h.blockers.filter(j => !h.lit.includes(j)));
    h.why = `Each lit empty square in ${unitName(col, st.unit)} has a label: its row, column, box or colour already has ${an(d)} (ringed in red dots)`
      + (bl.some(x => !x.by) ? ', or the dashed squares rule it out.' : '.') + ' That leaves only the ringed square.';
  } else {
    h.lit = U.peers[i].filter(j => g.grid[j]);
    const parts = U.cellUnits[i].map(u => {
      const ds = [...new Set(U.units[u].map(j => g.grid[j]).filter(Boolean))].sort();
      return ds.length ? `${unitName(col, u, true)} has ${ds.join(', ')}` : null;
    }).filter(Boolean);
    h.text = `${first}The ringed square (${where(i)}) sees every digit but ${d} in its row, column, box and colour. So it's ${d}.`;
    for (const j of h.lit) h.tags.push([j, tagFor(col, U.cellUnits[i].find(v => U.units[v].includes(j)))]);
    h.why = `${parts.join('; ')}. Only ${d} is missing.`;
  }
  return h;
}

// Takes hint h's step on the board: a wrong digit out (it can't be
// undone back in, and its heart stays lost), or the digit in, as a
// hint's. Returns { won: the board full }.
export function applyHint(g, h) {
  if (h.kind === 'bad') {
    g.bad[h.cell] = 0;
    g.undo = g.undo.filter(u => u.i !== h.cell);
  } else putDigit(g, h.cell, h.d, 'hint');
  return { won: full(g) };
}

// 💡 Hint: the next hint, its step taken, one hint used. { ok, h, won }.
export function useHint(g, col) {
  if (g.result || g.hints <= 0) return { ok: false };
  const h = findHint(g, col);
  if (!h) return { ok: false, why: 'stuck' };
  g.hints--;
  g.hintsUsed++;
  const { won } = applyHint(g, h);
  if (won) g.result = 'won';
  return { ok: true, h, won };
}

// Give up's Show me how: the next step from the player's board, shown and
// taken as a hint is, with no hint used. { h, done: the board full }.
export function walkStep(g, col) {
  const h = findHint(g, col);
  if (!h) return null;
  const { won } = applyHint(g, h);
  return { h, done: won };
}
// The steps Show me how will take from here: each empty square, and each
// wrong digit to take out first.
export const walkLength = g => emptyCount(g) + g.bad.filter(Boolean).length;
// ⏩ The rest: every empty square filled from the answer as a hint's.
export function fillRest(g) {
  let k = 0;
  for (let i = 0; i < NN; i++) if (!g.grid[i]) { putDigit(g, i, g.sol[i], 'hint'); k++; }
  return k;
}

/* ---------- a game kept on the device (DESIGN.md "Coming back to a game") ---------- */

const KINDS = ['', 'given', 'mine', 'hint', 'pale'];
const RESULTS = [null, 'won', 'lost', 'gaveup', 'shown'];

// What to keep of game g (plain data); the puzzle itself is kept by the
// screen as its level and number.
export function snapshotGame(g) {
  const { level, tidy, grid, kind, bad, notes, hearts, hints, mistakes, hintsUsed, undo: steps, result } = g;
  return JSON.parse(JSON.stringify({ level, tidy, grid, kind, bad, notes, hearts, hints, mistakes, hintsUsed, undo: steps, result }));
}

// Game g of puzzle p as it was kept (snapshotGame's). Throws, saying why,
// when it isn't one of this puzzle's or isn't whole.
export function restoreGame(p, kept) {
  const k = kept ?? {};
  const arr = (a, ok) => Array.isArray(a) && a.length === NN && a.every(ok);
  const count = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  if (k.level !== p.level) throw new Error(`restoreGame: level ${k.level}, not ${p.level}`);
  if (!arr(k.grid, d => count(d, 9)) || !arr(k.kind, x => KINDS.includes(x)) || !arr(k.bad, d => count(d, 9)) || !arr(k.notes, m => count(m, 0b1111111110))) throw new Error('restoreGame: bad board');
  for (let i = 0; i < NN; i++) {
    if (p.givens[i] && (k.grid[i] !== p.givens[i] || k.kind[i] !== 'given')) throw new Error(`restoreGame: square ${i} not its given`);
    if (k.grid[i] && k.grid[i] !== p.sol[i]) throw new Error(`restoreGame: square ${i} not the answer`);
    if (!k.grid[i] !== !k.kind[i]) throw new Error(`restoreGame: square ${i}'s kind`);
    if (k.bad[i] && (k.grid[i] || k.bad[i] === p.sol[i])) throw new Error(`restoreGame: square ${i}'s wrong digit`);
  }
  if (!count(k.hearts, HEARTS) || !count(k.hints, HINTS) || !count(k.mistakes, 1e6) || !count(k.hintsUsed, 1e6)) throw new Error('restoreGame: bad counts');
  if (!RESULTS.includes(k.result)) throw new Error(`restoreGame: bad result ${k.result}`);
  if (!Array.isArray(k.undo) || !k.undo.every(u => u && ['note', 'bad'].includes(u.t) && count(u.i, NN - 1) && count(u.before, u.t === 'note' ? 0b1111111110 : 9))) throw new Error('restoreGame: bad undo steps');
  const g = createGame(p, { tidy: !!k.tidy });
  Object.assign(g, JSON.parse(JSON.stringify({
    grid: k.grid, kind: k.kind, bad: k.bad, notes: k.notes, hearts: k.hearts, hints: k.hints,
    mistakes: k.mistakes, hintsUsed: k.hintsUsed, undo: k.undo, result: k.result,
  })));
  return g;
}

/* ---------- progress and best times (kept on the device) ---------- */

export const PROGRESS_KEY = 'web-games-colour-sudoku';

// { next: { level: puzzle number to play next (0-based) }, best: { level:
// ms } }, from what was kept (anything unreadable counts as nothing).
export function readProgress(text) {
  const out = { next: {}, best: {} };
  let v = null;
  try { v = JSON.parse(text ?? 'null'); } catch { return out; }
  for (const lv of LEVELS) {
    const k = v?.next?.[lv], b = v?.best?.[lv];
    if (Number.isInteger(k) && k >= 0) out.next[lv] = k;
    if (Number.isFinite(b) && b > 0) out.best[lv] = b;
  }
  return out;
}
// The puzzle number (0-based) to start for a level, counted as used at
// once (as Find the Stars since Q28: Play, Next and a new game each bring
// one not yet started; only Try again plays one again).
export function takeNext(prog, level) {
  const k = prog.next[level] ?? 0;
  prog.next[level] = k + 1;
  return k;
}
// After a win in `ms`: { best: the best before (or null), newBest }.
export function recordTime(prog, level, ms) {
  const before = prog.best[level] ?? null;
  const newBest = before === null || ms < before;
  if (newBest) prog.best[level] = ms;
  return { best: before, newBest };
}
