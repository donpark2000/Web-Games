// Find the Stars (called Hidden Faces until 2026-10-14; the files and
// the code keep that name, and a found star is a 'face' mark): rules,
// solver and puzzle maker. No DOM or UI code: the screen lives in
// src/ui/hidden-faces.js.
//
// The puzzle is Star Battle with one star (DESIGN.md "Hidden Faces",
// agreed 2026-10-13 from mockup v2): an N x N grid in N joined colour
// regions hides N faces, one per row, one per column, one per colour, and
// no two faces touch, not even at a corner.
//
// A puzzle is { n, reg }: reg is an array of n*n region numbers (0..n-1),
// square i = row*n + col. The solver works only by steps a person can
// see, one at a time; each step says which rule it used and why, so the
// same steps are the hints. A puzzle the solver finishes has exactly one
// answer (every step holds for any answer, and they end at one).
//
// A game is a plain object (the puzzle, the answer, the marks, hearts,
// hints, undo); the functions below change only the game passed in.

// A small repeatable random source (mulberry32).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A shuffled copy (Fisher-Yates), the same in every browser for a seed.
function shuffled(list, rnd) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SIZES = [6, 7, 8, 9, 10];
export const DEFAULT_SIZE = 6;
export const HEARTS = 3;   // wrong looks allowed: the third ends the game
export const HINTS = 3;    // per puzzle
export const SHOWS = 1;    // "show me one face", per puzzle

// Rule levels: how hard a step is to see.
export const LEVEL = { single: 1, inside: 2, touch: 2, group: 3, tryit: 4 };
// The rules the stock's puzzles are made with (no "try it").
export const MAKE_LEVEL = 3;

const rowOf = (n, i) => Math.floor(i / n);

// The rows, columns and colours, each { type, idx, cells }.
export function units(n, reg) {
  const u = [];
  for (let r = 0; r < n; r++) u.push({ type: 'row', idx: r, cells: Array.from({ length: n }, (_, c) => r * n + c) });
  for (let c = 0; c < n; c++) u.push({ type: 'col', idx: c, cells: Array.from({ length: n }, (_, r) => r * n + c) });
  for (let g = 0; g < n; g++) u.push({ type: 'region', idx: g, cells: [] });
  reg.forEach((g, i) => u[2 * n + g].cells.push(i));
  return u;
}

// Every square a face at i rules out: its row, column, colour, and the 8
// around it.
export function seenBy(n, reg, i) {
  const r = rowOf(n, i), c = i % n, out = [];
  for (let j = 0; j < n * n; j++) {
    if (j === i) continue;
    const rj = rowOf(n, j), cj = j % n;
    if (rj === r || cj === c || reg[j] === reg[i] || (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1)) out.push(j);
  }
  return out;
}

// The solver's state: which squares can still hold a face (cand), and
// the faces placed.
export function newState(n, reg) {
  return { n, reg, U: units(n, reg), cand: new Uint8Array(n * n).fill(1), face: new Uint8Array(n * n) };
}
function copy(s) { return { ...s, cand: s.cand.slice(), face: s.face.slice() }; }

export function place(s, i) {
  s.face[i] = 1;
  s.cand[i] = 1;
  for (const j of seenBy(s.n, s.reg, i)) s.cand[j] = 0;
}

const open = (s, u) => !u.cells.some(i => s.face[i]);
const cands = (s, u) => u.cells.filter(i => s.cand[i] && !s.face[i]);

// A step: { rule, level, place?: square, out: [squares ruled out], units:
// [the units the reason is about], why: [squares to light as the reason] }.
export function apply(s, step) {
  for (const i of step.out) s.cand[i] = 0;
  if (step.place != null) place(s, step.place);
}

// Some row, column or colour has no square left for its face.
export function broken(s) {
  return s.U.some(u => open(s, u) && cands(s, u).length === 0);
}

// A unit with one square left: its face is there.
function single(s) {
  for (const u of s.U) {
    if (!open(s, u)) continue;
    const c = cands(s, u);
    if (c.length === 1) return { rule: 'single', place: c[0], out: [], units: [u], why: [c[0]] };
  }
  return null;
}

// All of unit A's squares left lie inside unit B, so B's face is in A:
// the rest of B is ruled out.
function inside(s) {
  for (const a of s.U) {
    if (!open(s, a)) continue;
    const ca = cands(s, a);
    if (ca.length < 2) continue;
    for (const b of s.U) {
      if (b === a || b.type === a.type || !open(s, b)) continue;
      if (!ca.every(i => b.cells.includes(i))) continue;
      const out = cands(s, b).filter(i => !ca.includes(i));
      if (out.length) return { rule: 'inside', out, units: [a, b], why: ca };
    }
  }
  return null;
}

// A face on this square would rule out every square left for some row,
// column or colour.
function touch(s) {
  const n = s.n;
  for (let i = 0; i < n * n; i++) {
    if (!s.cand[i] || s.face[i]) continue;
    const gone = new Set(seenBy(n, s.reg, i));
    for (const u of s.U) {
      if (!open(s, u) || u.cells.includes(i)) continue;
      const c = cands(s, u);
      if (c.length && c.every(j => gone.has(j))) return { rule: 'touch', out: [i], units: [u], why: c };
    }
  }
  return null;
}

// k colours whose squares left all lie in k rows (or columns) fill those
// rows: nothing else in them can be a face. And the other way: k rows (or
// columns) whose squares left lie in k colours.
function group(s) {
  const n = s.n, U = s.U;
  const rows = U.slice(0, n), cols = U.slice(n, 2 * n), regs = U.slice(2 * n);
  const tries = [[regs, rows], [regs, cols], [rows, regs], [cols, regs]];
  for (let k = 2; k < n - 1; k++) {
    for (const [as, bs] of tries) {
      const live = as.filter(u => open(s, u));
      if (live.length <= k) continue;
      const found = subsets(live.length, k, pick => {
        const set = pick.map(x => live[x]);
        const sq = set.flatMap(u => cands(s, u));
        const hit = bs.filter(b => open(s, b) && sq.some(i => b.cells.includes(i)));
        if (hit.length !== k) return null;
        const out = hit.flatMap(b => cands(s, b)).filter(i => !sq.includes(i));
        return out.length ? { rule: 'group', out, units: [...set, ...hit], why: sq } : null;
      });
      if (found) return found;
    }
  }
  return null;
}
function subsets(m, k, fn) {
  const pick = [];
  function rec(start) {
    if (pick.length === k) return fn(pick);
    for (let x = start; x <= m - (k - pick.length); x++) {
      pick.push(x);
      const r = rec(x + 1);
      pick.pop();
      if (r) return r;
    }
    return null;
  }
  return rec(0);
}

// Try a face here: following the simpler rules, something runs out of
// squares. So it can't be here. (For hints only; the stock's puzzles never
// need it.)
function tryit(s) {
  const n = s.n;
  for (let i = 0; i < n * n; i++) {
    if (!s.cand[i] || s.face[i]) continue;
    const t = copy(s);
    place(t, i);
    for (let guard = 0; guard < 200 && !broken(t); guard++) {
      const st = single(t) || inside(t) || touch(t) || group(t);
      if (!st) break;
      apply(t, st);
    }
    if (broken(t)) return { rule: 'tryit', out: [i], units: [], why: [i] };
  }
  return null;
}

const RULES = { single, inside, touch, group, tryit };

// The easiest step that can be taken now, using rules up to maxLevel, or
// null.
export function nextStep(s, maxLevel = 4) {
  for (const [rule, f] of Object.entries(RULES)) {
    if (LEVEL[rule] > maxLevel) continue;
    const st = f(s);
    if (st) { st.level = LEVEL[rule]; return st; }
  }
  return null;
}

// Solves step by step. Returns { solved, broken, steps, faces, level (the
// hardest rule used), hard (steps that needed more than "single"),
// decided (squares known) }.
export function solve(n, reg, maxLevel = 4) {
  const s = newState(n, reg);
  const steps = [];
  for (;;) {
    const st = nextStep(s, maxLevel);
    if (!st) break;
    apply(s, st);
    steps.push(st);
    if (broken(s)) return { solved: false, broken: true, steps, faces: [], level: 0, hard: 0, decided: 0 };
  }
  const faces = [];
  s.face.forEach((f, i) => { if (f) faces.push(i); });
  return {
    solved: faces.length === n, broken: false, steps, faces,
    level: Math.max(0, ...steps.map(x => x.level)),
    hard: steps.filter(x => x.level >= 2).length,
    decided: s.cand.reduce((a, c, i) => a + (c === 0 || s.face[i] ? 1 : 0), 0),
  };
}

// A random answer: one face per row and column, none touching.
function randomAnswer(n, rnd) {
  const col = [];
  function rec(r) {
    if (r === n) return true;
    for (const c of shuffled([...Array(n).keys()], rnd)) {
      if (col.includes(c) || (r && Math.abs(col[r - 1] - c) < 2)) continue;
      col.push(c);
      if (rec(r + 1)) return true;
      col.pop();
    }
    return false;
  }
  if (!rec(0)) throw new Error(`no answer for ${n} x ${n}`);
  return col.map((c, r) => r * n + c);
}

// The squares beside i (not corners).
export function nbrs(n, i) {
  const r = rowOf(n, i), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

// Colours grown out from each face, each with its own appetite, so sizes
// and shapes vary.
function growRegions(n, faces, rnd) {
  const reg = new Array(n * n).fill(-1);
  faces.forEach((i, g) => { reg[i] = g; });
  const want = faces.map(() => 0.2 + rnd() * rnd() * 3);
  let left = n * n - n;
  while (left) {
    const tot = want.reduce((a, b) => a + b, 0);
    let x = rnd() * tot, g = 0;
    while (g < n - 1 && x > want[g]) x -= want[g++];
    const edge = [];
    reg.forEach((rg, i) => { if (rg === g) for (const j of nbrs(n, i)) if (reg[j] === -1) edge.push(j); });
    if (!edge.length) { want[g] *= 0.5; continue; }
    reg[edge[Math.floor(rnd() * edge.length)]] = g;
    left--;
  }
  return reg;
}

// Whether colour g's squares are all joined (side to side).
export function connected(n, reg, g) {
  const cells = [];
  reg.forEach((r, i) => { if (r === g) cells.push(i); });
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), q = [cells[0]];
  while (q.length) for (const j of nbrs(n, q.pop())) if (reg[j] === g && !seen.has(j)) { seen.add(j); q.push(j); }
  return seen.size === cells.length;
}

// Makes a puzzle the solver finishes using rules up to maxLevel: faces
// placed at random, a colour grown out of each, then single squares moved
// between neighbouring colours while that lets the solver get further.
// Returns { n, reg, faces, level, hard, steps, tries } or null.
export function generate(n, seed, { maxLevel = MAKE_LEVEL, tries = 60, moves = 400 } = {}) {
  const rnd = mulberry32(seed);
  for (let t = 0; t < tries; t++) {
    const faces = randomAnswer(n, rnd);
    let reg = growRegions(n, faces, rnd);
    let best = solve(n, reg, maxLevel);
    for (let m = 0; m < moves && !best.solved; m++) {
      const i = Math.floor(rnd() * n * n);
      if (faces.includes(i)) continue;
      const to = nbrs(n, i).map(j => reg[j]).filter(g => g !== reg[i]);
      if (!to.length) continue;
      const next = reg.slice();
      const from = reg[i];
      next[i] = to[Math.floor(rnd() * to.length)];
      if (!connected(n, next, from)) continue;
      const r = solve(n, next, maxLevel);
      if (r.broken) continue;
      if (r.decided >= best.decided) { reg = next; best = r; }
    }
    if (best.solved) return { n, reg, faces: best.faces, level: best.level, hard: best.hard, steps: best.steps.length, tries: t + 1 };
  }
  return null;
}

// Hard enough for the stock: at least 60% as many steps needing more than
// "one square left" as the size (the bar the mockup's puzzles were picked
// by; about 4 in 15 made puzzles need "single" steps only).
export const HARD_SHARE = 0.6;
export const hardEnough = (n, hard) => hard >= Math.ceil(HARD_SHARE * n);

/* ---------- the puzzle stock (data/hidden-faces.json) ---------- */

// The stock file (tools/hidden-faces-puzzles.js): { "6": [[seed, reg,
// faces], ...], ... }; seed the one generate() made it from, reg a string
// of region digits (0-9), faces the answer's squares, top to bottom. The
// puzzles of a size are the first STOCK seeds from n*10000 on whose
// puzzle is hardEnough.
export const STOCK = 200;
export const firstSeed = n => n * 10000;
export const encode = (seed, p) => [seed, p.reg.join(''), p.faces];
export function decode(n, [seed, reg, faces]) {
  return { n, seed, reg: [...reg].map(Number), faces: [...faces] };
}
// The stock's puzzle made from `seed`, or null when that seed's isn't
// kept (none made, or not hard enough).
export function stockPuzzle(n, seed) {
  const p = generate(n, seed);
  return p && hardEnough(n, p.hard) ? p : null;
}

// Everything wrong with a puzzle, as words ([] when it's fine): the
// shape, the colours (n of them, each joined), the answer (one face per
// row, column and colour, none touching) and that the solver, with the
// stock's rules, finds exactly that answer.
export function problems(p, { maxLevel = MAKE_LEVEL } = {}) {
  const { n, reg, faces } = p;
  const out = [];
  if (!SIZES.includes(n) && n !== 5) return [`bad size ${n}`];
  if (reg.length !== n * n) return [`${reg.length} squares, not ${n * n}`];
  if (reg.some(g => !(Number.isInteger(g) && g >= 0 && g < n))) return ['a colour outside 0..n-1'];
  for (let g = 0; g < n; g++) if (!connected(n, reg, g)) out.push(`colour ${g} missing or not joined`);
  if (faces.length !== n) out.push(`${faces.length} faces, not ${n}`);
  const rows = new Set(faces.map(i => rowOf(n, i))), cols = new Set(faces.map(i => i % n)), regs = new Set(faces.map(i => reg[i]));
  if (rows.size !== n || cols.size !== n || regs.size !== n) out.push('not one face per row, column and colour');
  for (const a of faces) for (const b of faces) {
    if (a < b && Math.abs(rowOf(n, a) - rowOf(n, b)) <= 1 && Math.abs(a % n - b % n) <= 1) out.push(`faces ${a} and ${b} touch`);
  }
  const r = solve(n, reg, maxLevel);
  if (!r.solved) out.push('the solver can\'t finish it');
  else if (r.faces.join() !== [...faces].sort((a, b) => a - b).join()) out.push('the solver finds another answer');
  return out;
}

// A 5 x 5 puzzle for the pictures (the home page's button, the rules on
// the setup screen): generate(5, 50001), which needs "inside" and
// "touch" steps.
export const DEMO = { n: 5, reg: [...'2000120111222224422344422'].map(Number), faces: [1, 8, 10, 19, 22] };

/* ---------- colours ---------- */

// The colours a puzzle's regions are painted, and their names in hints.
export const COLORS = [
  ['Pink', '#F6B3C8'], ['Orange', '#F8BE84'], ['Yellow', '#F3DE6E'], ['Green', '#A6D98B'], ['Teal', '#86D3C6'],
  ['Blue', '#98C3EF'], ['Purple', '#BFA8EA'], ['Grey', '#CBCBD3'], ['Brown', '#CFAE86'], ['Red', '#EC8A8A'],
];
// Pairs that are hard to tell apart side by side.
const LOOKALIKE = [[0, 9], [1, 8], [1, 2], [3, 4], [4, 5], [5, 6], [0, 6], [8, 9], [1, 9], [7, 5]];

// Colours for a puzzle's regions, [{ name, c }] by region: different for
// each region, and neighbouring regions get colours that don't look alike
// where possible. The same every time for a seed.
export function colorsFor(n, reg, seed) {
  const adj = new Set();
  reg.forEach((g, i) => {
    const r = rowOf(n, i), c = i % n;
    if (c < n - 1 && reg[i + 1] !== g) adj.add(`${g},${reg[i + 1]}`);
    if (r < n - 1 && reg[i + n] !== g) adj.add(`${g},${reg[i + n]}`);
  });
  const rnd = mulberry32(seed);
  let best = null, bestBad = Infinity;
  for (let t = 0; t < 400 && bestBad; t++) {
    const p = shuffled(COLORS.map((_, k) => k), rnd).slice(0, n);
    let bad = 0;
    for (const key of adj) {
      const [a, b] = key.split(',').map(Number);
      if (LOOKALIKE.some(([x, y]) => (p[a] === x && p[b] === y) || (p[a] === y && p[b] === x))) bad++;
    }
    if (bad < bestBad) { best = p; bestBad = bad; }
  }
  return best.map(k => ({ name: COLORS[k][0], c: COLORS[k][1] }));
}

/* ---------- a game ---------- */

// Marks: '' (nothing), 'x' (the player's ✕), 'face' (found), 'bad' (a
// wrong look: a red ✕ that stays), 'hx' (a hint's ✕: fixed, like a found
// star; Undo and drags leave it alone), 'ghost' (a star not found, shown
// pale when out of hearts).

// A new game of puzzle p ({ n, reg, faces }). `auto`: finding a face puts
// ✕s on its row, column, colour and neighbours (Auto ✕, the default).
export function createGame(p, { auto = true, colorSeed = 0 } = {}) {
  const why = problems(p, { maxLevel: 4 });
  if (why.length) throw new Error(`createGame: bad puzzle: ${why.join('; ')}`);
  return {
    n: p.n, reg: p.reg, sol: new Set(p.faces), auto,
    col: colorsFor(p.n, p.reg, colorSeed),
    marks: new Array(p.n * p.n).fill(''),
    hearts: HEARTS, hints: HINTS, shows: SHOWS,
    mistakes: 0, hintsUsed: 0, showsUsed: 0,
    undo: [],          // groups of [square, mark before], or { look: square }
                       // for a wrong look; newest last
    told: new Set(),   // squares a hint said to cross out (no star there)
    result: null,      // 'won' or 'lost'
  };
}

export const foundCount = g => g.marks.filter(m => m === 'face').length;

// Why square i is already known to hold no star, in words, or null: a
// found star rules it out (its row, column, colour or a neighbour), or a
// hint said to cross it out. A look there tells nothing new, so it isn't
// counted (developer, 2026-10-15: a double tap on a square a hint had just
// crossed out cost a heart, and Undo kept the mistake).
export function knownEmpty(g, i) {
  const { n, reg, marks } = g;
  if (g.sol.has(i)) return null;
  const r = rowOf(n, i), c = i % n;
  for (let f = 0; f < n * n; f++) {
    if (marks[f] !== 'face' || f === i) continue;
    const rf = rowOf(n, f), cf = f % n;
    if (Math.abs(rf - r) <= 1 && Math.abs(cf - c) <= 1) return 'No star here: it touches a star.';
    if (rf === r) return `No star here: row ${r + 1} already has its star.`;
    if (cf === c) return `No star here: column ${c + 1} already has its star.`;
    if (reg[f] === reg[i]) return `No star here: ${g.col[reg[i]].name} already has its star.`;
  }
  return g.told.has(i) || marks[i] === 'hx' ? 'No star here: a hint crossed it out.' : null;
}

// Look under square i: a face (with Auto ✕, the ✕s it implies), or a red
// ✕ and a heart lost. Returns { ok, face, autoX: [squares ✕ed], won,
// lost } or { ok: false, why }. Where the board or a hint already says
// there's no star (knownEmpty), nothing changes: { ok, face: false,
// known: its words, ... }.
export function look(g, i) {
  if (g.result) return { ok: false, why: 'over' };
  if (!(Number.isInteger(i) && i >= 0 && i < g.marks.length)) return { ok: false, why: 'bad-square' };
  if (g.marks[i] === 'face' || g.marks[i] === 'bad') return { ok: false, why: 'already' };
  if (g.sol.has(i)) {
    g.marks[i] = 'face';
    const autoX = [];
    if (g.auto) for (const j of seenBy(g.n, g.reg, i)) if (g.marks[j] === '') { g.marks[j] = 'x'; autoX.push(j); }
    const won = foundCount(g) === g.n;
    if (won) g.result = 'won';
    return { ok: true, face: true, autoX, won, lost: false };
  }
  const known = knownEmpty(g, i);
  if (known) return { ok: true, face: false, known, autoX: [], won: false, lost: false };
  g.marks[i] = 'bad';
  g.hearts--;
  g.mistakes++;
  g.undo.push({ look: i });
  const lost = g.hearts <= 0;
  if (lost) g.result = 'lost';
  return { ok: true, face: false, autoX: [], won: false, lost };
}

// A tap on square i: an empty square gets a ✕ (undoable); a ✕ is looked
// under, however soon after its ✕ (developer, 2026-10-14: the 0.4 s wait
// for a slip was too long, and Undo takes back a wrong look); a hint's ✕
// too (a look that costs nothing: knownEmpty). Returns
// { ok, did: 'x' | 'look', ...look's result }.
export function tap(g, i) {
  if (g.result) return { ok: false, why: 'over' };
  const m = g.marks[i];
  if (m === '') {
    g.marks[i] = 'x';
    g.undo.push([[i, '']]);
    return { ok: true, did: 'x' };
  }
  if (m === 'x' || m === 'hx') return { ...look(g, i), did: 'look' };
  return { ok: false, why: 'already' };
}

// A drag: from an empty square it ✕s every empty square it passes; from a
// ✕ it rubs out every ✕ it passes. startStroke at the first square,
// strokeTo for each square passed, endStroke at the end: one undo step
// per square, so Undo takes back the last square first (developer,
// 2026-10-14: a long drag easily goes a square too far, and Undo took
// back the whole drag).
// A stroke from a face, a red ✕ or a hint's ✕ does nothing, and no stroke
// changes a hint's ✕.
export function startStroke(g, i) {
  const m = g.marks[i];
  return { mode: g.result ? null : m === '' ? 'mark' : m === 'x' ? 'erase' : null, changed: [] };
}
export function strokeTo(g, stroke, i) {
  const m = g.marks[i];
  if (stroke.mode === 'mark' && m === '') { stroke.changed.push([i, m]); g.marks[i] = 'x'; return true; }
  if (stroke.mode === 'erase' && m === 'x') { stroke.changed.push([i, m]); g.marks[i] = ''; return true; }
  return false;
}
export function endStroke(g, stroke) {
  for (const c of stroke.changed) g.undo.push([c]);
  return stroke.changed.length;
}

// What undoing one step would change: the squares to set back, as
// [square, mark], and whether it gives a heart back. A square that has
// since become a face or a hint's ✕ stays one, so a step can come to
// change nothing.
function undoes(g, step) {
  if (step.look != null) return { back: [[step.look, 'x']], heart: true };
  const back = [];
  for (const [i, before] of [...step].reverse()) {
    if ((g.marks[i] === '' || g.marks[i] === 'x') && g.marks[i] !== before) back.push([i, before]);
  }
  return { back, heart: false };
}

// Takes back the last ✕, rubbed-out square or wrong look (developer, 2026-10-13:
// "being able to undo errors is kind of the whole point of undo"). A wrong
// look's red ✕ is a ✕ again and the heart comes back; the mistake still
// counts in the result. A found face is never taken back. Steps that
// would change nothing are skipped. Returns how many squares changed
// back, or -1 when there's nothing to undo (or the game is over).
export function undo(g) {
  if (g.result) return -1;
  while (g.undo.length) {
    const u = undoes(g, g.undo.pop());
    if (!u.back.length) continue;
    for (const [i, m] of u.back) g.marks[i] = m;
    if (u.heart) g.hearts++;
    return u.back.length;
  }
  return -1;
}
export const canUndo = g => !g.result && g.undo.some(step => undoes(g, step).back.length > 0);

// "Show me one face": looks under a face not yet found (rnd picks which).
export function showOne(g, rnd = Math.random) {
  if (g.result || g.shows <= 0) return { ok: false, why: g.result ? 'over' : 'none-left' };
  const left = [...g.sol].filter(i => g.marks[i] !== 'face').sort((a, b) => a - b);
  const i = left[Math.min(left.length - 1, Math.floor(rnd() * left.length))];
  g.shows--;
  g.showsUsed++;
  return { ...look(g, i), square: i };
}

/* ---------- hints ---------- */

// The solver's state for the board as the player has it: the faces
// found, every ✕ (theirs, red ones and hints') as "no face".
export function stateOf(g) {
  const s = newState(g.n, g.reg);
  g.marks.forEach((m, i) => { if (m === 'face') place(s, i); });
  g.marks.forEach((m, i) => { if (m === 'x' || m === 'bad' || m === 'hx') s.cand[i] = 0; });
  return s;
}

// The next hint, without changing the board (useHint takes its step): a
// wrong ✕ first, then ✕s a found face already implies, then the solver's
// next step. Returns
// { kind, tgt?: the square it means, why: [squares lit as the reason],
// out: [squares to cross out], units, text } or { kind: 'none', text }.
export function findHint(g) {
  const { n, reg, marks, sol } = g;
  const sq = i => `row ${rowOf(n, i) + 1}, column ${i % n + 1}`;
  const wrong = marks.findIndex((m, i) => m === 'x' && sol.has(i));
  if (wrong >= 0) return { kind: 'wrong', tgt: wrong, why: [], out: [], text: `The ringed ✕ (${sq(wrong)}) was wrong: there's a star under it.` };
  for (let f = 0; f < n * n; f++) {
    if (marks[f] !== 'face') continue;
    const r = rowOf(n, f), c = f % n;
    const sets = [
      [j => rowOf(n, j) === r, `Row ${r + 1} already has its star. Cross out the rest of it.`],
      [j => j % n === c, `Column ${c + 1} already has its star. Cross out the rest of it.`],
      [j => reg[j] === reg[f], `${g.col[reg[f]].name} already has its star. Cross out the rest of it.`],
      [j => Math.abs(rowOf(n, j) - r) <= 1 && Math.abs(j % n - c) <= 1, 'Stars never touch. Cross out the squares around it (marked ✕).'],
    ];
    for (const [inSet, text] of sets) {
      const out = marks.map((_, j) => j).filter(j => j !== f && marks[j] === '' && inSet(j));
      if (out.length) return { kind: 'implied', why: [f], out, text };
    }
  }
  const st = nextStep(stateOf(g), 4);
  if (!st) return { kind: 'none', why: [], out: [], text: 'No hint here: every star can be found from what is on the board.' };
  const U = st.units;
  const unitName = u => (u.type === 'row' ? `row ${u.idx + 1}` : u.type === 'col' ? `column ${u.idx + 1}` : g.col[u.idx].name);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const list = names => (names.length < 2 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);
  const unitsName = us => (us[0].type === 'region' ? list(us.map(unitName))
    : `${us[0].type === 'row' ? 'rows' : 'columns'} ${list(us.map(u => String(u.idx + 1)))}`);
  const h = { kind: st.rule, why: st.why, out: st.out, units: U };
  if (st.rule === 'single' && U[0].cells.length === 1) return { ...h, why: [], tgt: st.place, text: `${cap(unitName(U[0]))} is just one square (ringed, ${sq(st.place)}), so its star is there.` };
  if (st.rule === 'single') return { ...h, why: U[0].cells, tgt: st.place, text: `The ringed square (${sq(st.place)}) is the only one left for ${unitName(U[0])}, so its star is there.` };
  if (st.rule === 'inside') return { ...h, text: `The lit squares, all that's left for ${unitName(U[0])}, are all in ${unitName(U[1])}. So ${unitName(U[1])}'s star is one of them: cross out the rest of ${unitName(U[1])}.` };
  if (st.rule === 'touch') return { ...h, tgt: st.out[0], text: `A star on the ringed square (${sq(st.out[0])}) would rule out the lit squares, the last ones for ${unitName(U[0])}. So cross it out.` };
  if (st.rule === 'group') {
    const k = U.length / 2, a = U.slice(0, k), b = U.slice(k);
    return { ...h, text: `${cap(unitsName(a))} only have squares left in ${unitsName(b)} (lit), so those ${k} stars are theirs. Cross out the rest of ${unitsName(b)}.` };
  }
  return { ...h, why: [], tgt: st.out[0], text: `Try a star on the ringed square (${sq(st.out[0])}): follow the rules and some row, column or colour runs out of squares. So cross it out.` };
}

// The deeper reason for a hint (its Why?), without changing the board:
// why the squares it lights are ruled out, or why they must hold the star.
// Returns { text, pretend?: the square a pretend star goes on, tags:
// [[square, 'touch' | 'row' | 'col' | 'colour']] (why each lit square
// would go), rings: [{ cells, style: 'empty' | 'unit' | 'other' |
// 'reach' }] (outlines: a unit left with nothing, the units the reason is
// about, the pretend star's colour) }, or null for a hint with nothing
// more to say (a wrong ✕, ✕s a found star implies, none).
export function explainHint(g, h) {
  const { n, reg } = g;
  const U = h.units ?? [];
  const name = u => (u.type === 'row' ? `row ${u.idx + 1}` : u.type === 'col' ? `column ${u.idx + 1}` : g.col[u.idx].name);
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const list = xs => (xs.length < 2 ? xs[0] : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
  const names = us => (us[0].type === 'region' ? list(us.map(name))
    : `${us[0].type === 'row' ? 'rows' : 'columns'} ${list(us.map(u => String(u.idx + 1)))}`);
  if (h.kind === 'touch') {
    const t = h.tgt, r = rowOf(n, t), c = t % n, u = U[0];
    const tagOf = j => {
      const rj = rowOf(n, j), cj = j % n;
      if (Math.abs(rj - r) <= 1 && Math.abs(cj - c) <= 1) return 'touch';
      return rj === r ? 'row' : cj === c ? 'col' : 'colour';
    };
    const tags = h.why.map(j => [j, tagOf(j)]);
    const colour = g.col[reg[t]].name;
    // [one square's words, several's]: short, as each lit square's label
    // says it too, and the bar has 3 lines (about 140 characters).
    const says = {
      touch: ['it touches the star', 'touching it'], row: ["it's in the star's row", 'in its row'],
      col: ["it's in the star's column", 'in its column'], colour: [`it's ${colour}, like the star`, `${colour} like it`],
    };
    const k = tags.length;
    const counts = Object.keys(says).map(tag => [tag, tags.filter(x => x[1] === tag).length]).filter(x => x[1]);
    const what = k === 1 ? `${name(u)}'s last square (lit): ${says[counts[0][0]][0]}`
      : `${name(u)}'s last ${k} squares (lit): ${counts.map(([tag, m]) => `${m === k ? (k === 2 ? 'both' : 'all') : m} ${says[tag][1]}`).join(', ')}`;
    const rings = [{ cells: u.cells, style: 'empty' }];
    if (tags.some(x => x[1] === 'colour')) rings.push({ cells: reg.map((_, j) => j).filter(j => reg[j] === reg[t]), style: 'reach' });
    return { text: `A star on the ringed square would rule out ${what}. No star left for ${name(u)}!`, pretend: t, tags, rings };
  }
  if (h.kind === 'inside') {
    const [a, b] = U;
    return {
      text: `${cap(name(a))}'s star is on a lit square, and they're all in ${name(b)}. So ${name(b)}'s one star is ${name(a)}'s: no star in the rest of ${name(b)}.`,
      tags: [], rings: [{ cells: a.cells, style: 'unit' }, { cells: b.cells, style: 'other' }],
    };
  }
  if (h.kind === 'group') {
    const k = U.length / 2, a = U.slice(0, k), b = U.slice(k);
    return {
      text: `${cap(names(a))}'s ${k} stars are on lit squares, in ${names(b)}. Those ${k} ${b[0].type === 'region' ? 'colours' : b[0].type === 'row' ? 'rows' : 'columns'} have just ${k} stars, so no star in the rest of them.`,
      tags: [], rings: [...a.map(u => ({ cells: u.cells, style: 'unit' })), ...b.map(u => ({ cells: u.cells, style: 'other' }))],
    };
  }
  if (h.kind === 'single') {
    const u = U[0];
    const text = u.cells.length === 1
      ? `${cap(name(u))} needs a star, like every colour, and it's just this one square.`
      : `${cap(name(u))} needs a star, and the rest of it is crossed out. So the star is on the ringed square.`;
    return { text, tags: [], rings: [{ cells: u.cells, style: 'unit' }] };
  }
  return null;
}

// Uses a hint and takes its step (developer, 2026-10-15: "It seems
// unlikely that if one asks for a hint they would chose to ignore it"): a
// hint that points at a star (one square left, a wrong ✕) places the star
// and puts hint ✕s ('hx') on the empty squares it rules out, Auto ✕ or
// not; any other puts hint ✕s on the empty squares it crosses out (the
// player's own ✕s stay theirs). Hint ✕s are fixed: no Undo step, no drag
// changes them. Returns the hint (findHint's, worked out before the step)
// with { star: the square starred or null, hx: [squares given hint ✕s],
// won }, counting it unless there was none to give. { ok: false, why }
// when none are left or the game is over.
export function useHint(g) {
  if (g.result) return { ok: false, why: 'over' };
  if (g.hints <= 0) return { ok: false, why: 'none-left' };
  const h = findHint(g);
  if (h.kind !== 'none') { g.hints--; g.hintsUsed++; }
  const star = h.kind === 'single' || h.kind === 'wrong' ? h.tgt : null;
  if (star != null) g.marks[star] = 'face';
  const hx = (star != null ? seenBy(g.n, g.reg, star) : h.out).filter(i => g.marks[i] === '');
  for (const i of hx) { g.marks[i] = 'hx'; g.told.add(i); }
  for (const i of h.out) g.told.add(i);
  const won = star != null && foundCount(g) === g.n;
  if (won) g.result = 'won';
  return { ok: true, ...h, star, hx, won };
}

/* ---------- a game kept on the device (DESIGN.md "Coming back to a game") ---------- */

const MARKS = ['', 'x', 'face', 'bad', 'ghost', 'hx'];

// What to keep of game g (plain data): the marks, what's left and used,
// the undo steps, the squares hints crossed out and the result. The
// puzzle itself is kept by the screen as its size and number.
export function snapshotGame(g) {
  const { n, auto, marks, hearts, hints, shows, mistakes, hintsUsed, showsUsed, undo: steps, result } = g;
  return JSON.parse(JSON.stringify({ n, auto, marks, hearts, hints, shows, mistakes, hintsUsed, showsUsed, undo: steps, told: [...g.told].sort((a, b) => a - b), result }));
}

// Game g of puzzle p as it was kept (snapshotGame's). Throws, saying why,
// when the kept game isn't one of this puzzle's (a star where p has none,
// the wrong size) or isn't whole.
export function restoreGame(p, kept, { colorSeed = 0 } = {}) {
  const k = kept ?? {};
  const N = p.n * p.n;
  const count = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
  const sq = i => Number.isInteger(i) && i >= 0 && i < N;
  if (k.n !== p.n) throw new Error(`restoreGame: size ${k.n}, not ${p.n}`);
  if (!Array.isArray(k.marks) || k.marks.length !== N || !k.marks.every(m => MARKS.includes(m))) throw new Error('restoreGame: bad marks');
  if (k.marks.some((m, i) => (m === 'face' || m === 'ghost') && !p.faces.includes(i))) throw new Error('restoreGame: a star the puzzle hasn\'t');
  if (k.marks.some((m, i) => m === 'hx' && p.faces.includes(i))) throw new Error('restoreGame: a hint’s ✕ on a star');
  if (!count(k.hearts, HEARTS) || !count(k.hints, HINTS) || !count(k.shows, SHOWS)) throw new Error('restoreGame: bad hearts, hints or shows');
  if (![k.mistakes, k.hintsUsed, k.showsUsed].every(v => count(v, 1e6))) throw new Error('restoreGame: bad counts');
  if (![null, 'won', 'lost'].includes(k.result)) throw new Error(`restoreGame: bad result ${k.result}`);
  const stepOk = st => (st && !Array.isArray(st) ? sq(st.look)
    : Array.isArray(st) && st.every(c => Array.isArray(c) && sq(c[0]) && (c[1] === '' || c[1] === 'x')));
  if (!Array.isArray(k.undo) || !k.undo.every(stepOk)) throw new Error('restoreGame: bad undo steps');
  // Kept before 2026-10-15: no `told` (no square known from a hint).
  const told = k.told ?? [];
  if (!Array.isArray(told) || !told.every(i => sq(i) && !p.faces.includes(i))) throw new Error('restoreGame: bad squares crossed out by hints');
  const g = createGame(p, { auto: !!k.auto, colorSeed });
  Object.assign(g, {
    marks: [...k.marks], hearts: k.hearts, hints: k.hints, shows: k.shows,
    mistakes: k.mistakes, hintsUsed: k.hintsUsed, showsUsed: k.showsUsed,
    undo: JSON.parse(JSON.stringify(k.undo)), told: new Set(told), result: k.result,
  });
  return g;
}

/* ---------- progress and best times (kept on the device) ---------- */

export const PROGRESS_KEY = 'web-games-hidden-faces';

// { next: { size: puzzle number to play next (0-based) }, best: { size:
// ms } }, from what was kept (anything unreadable counts as nothing).
export function readProgress(text) {
  const out = { next: {}, best: {} };
  let v = null;
  try { v = JSON.parse(text ?? 'null'); } catch { return out; }
  for (const n of SIZES) {
    const k = v?.next?.[n], b = v?.best?.[n];
    if (Number.isInteger(k) && k >= 0) out.next[n] = k;
    if (Number.isFinite(b) && b > 0) out.best[n] = b;
  }
  return out;
}

// After a win in `ms` on size n: { best: the best before (or null),
// newBest }. Updates prog.best.
export function recordTime(prog, n, ms) {
  const before = prog.best[n] ?? null;
  const newBest = before === null || ms < before;
  if (newBest) prog.best[n] = ms;
  return { best: before, newBest };
}

// "4:12" for 252000 ms.
export function clock(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
