// Bridges (the Hashi puzzle): rules, solvers, puzzle maker and a game. No
// DOM or UI code: the screen lives in src/ui/bridges.js, the drawing in
// src/ui/brboard.js.
//
// The puzzle (DESIGN.md "Bridges"): an n x n grid with islands, each
// wanting a number of bridges. Bridges run straight across or down
// between two islands that see each other (nothing between), at most two
// between a pair, and never cross. Solved: every island has exactly its
// number, and all are joined up. Every stock puzzle has exactly one
// answer, which the step-by-step reasoning below (the hints) reaches.
//
// A puzzle is { size, n, seed, islands: [{ r, c, need }] }. Its edges (the
// bridges that could be) are worked out by `edgesOf`: { a, b, k: 'h' | 'v',
// r or c, from, to } between islands a < b. A board is an array of
// counts, one per edge (0, 1 or 2).
//
// From the mockup's core (mockup v1, 2026-10-24), which made the puzzles
// the developer tried.

import { mulberry32, clock } from './hidden-faces.js';

export { mulberry32, clock };

// The sizes (the setup's "Size"): Small for the kids (5 x 5, numbers
// shown as dots), Medium and Large for grown-ups.
export const SIZES = ['small', 'medium', 'large'];
export const SIZE_NAMES = { small: 'Small', medium: 'Medium', large: 'Large' };
export const DOTS = { small: true, medium: false, large: false };

/* ---------- geometry ---------- */

// The edges of a puzzle, for each edge the edges it crosses, and each
// island's edges.
export function edgesOf(p) {
  const at = new Map(p.islands.map((s, i) => [s.r * p.n + s.c, i]));
  const edges = [];
  p.islands.forEach((s, a) => {
    // Right and down only, so each pair once.
    for (let c = s.c + 1; c < p.n; c++) {
      const b = at.get(s.r * p.n + c);
      if (b !== undefined) { edges.push({ a, b, k: 'h', r: s.r, from: s.c, to: c }); break; }
    }
    for (let r = s.r + 1; r < p.n; r++) {
      const b = at.get(r * p.n + s.c);
      if (b !== undefined) { edges.push({ a, b, k: 'v', c: s.c, from: s.r, to: r }); break; }
    }
  });
  edges.forEach(e => { e.crosses = []; });
  edges.forEach((e, i) => edges.forEach((f, j) => {
    if (e.k === 'h' && f.k === 'v' && f.c > e.from && f.c < e.to && e.r > f.from && e.r < f.to) {
      e.crosses.push(j); f.crosses.push(i);
    }
  }));
  const of = p.islands.map(() => []);
  edges.forEach((e, i) => { of[e.a].push(i); of[e.b].push(i); });
  return { edges, of };
}

// How many bridges each island has on a board.
export function counts(p, g, board) {
  return p.islands.map((_, i) => g.of[i].reduce((s, e) => s + board[e], 0));
}

// Are all islands joined, through edges with a bridge?
export function joined(p, g, board) {
  const seen = new Set([0]), todo = [0];
  while (todo.length) {
    const i = todo.pop();
    for (const e of g.of[i]) {
      if (!board[e]) continue;
      const j = g.edges[e].a === i ? g.edges[e].b : g.edges[e].a;
      if (!seen.has(j)) { seen.add(j); todo.push(j); }
    }
  }
  return seen.size === p.islands.length;
}

// The edges with a bridge that edge e would cross.
export const blockedBy = (g, board, e) => g.edges[e].crosses.filter(f => board[f] > 0);

export function isSolved(p, g, board) {
  const n = counts(p, g, board);
  return p.islands.every((s, i) => n[i] === s.need) && joined(p, g, board);
}

/* ---------- the solver: counts answers ---------- */

// Counts the answers, up to `limit`. Domains [lo, hi] per edge, narrowed
// by each island's number and by crossings, then a branch on an open edge.
// Returns { found, answer: the first answer's board (or null) }.
export function countAnswers(p, limit = 2, g = edgesOf(p)) {
  let found = 0, first = null;
  const lo = g.edges.map(() => 0), hi = g.edges.map(() => 2);
  function narrow(lo, hi) {
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < p.islands.length; i++) {
        const es = g.of[i], need = p.islands[i].need;
        const sLo = es.reduce((s, e) => s + lo[e], 0), sHi = es.reduce((s, e) => s + hi[e], 0);
        if (sLo > need || sHi < need) return false;
        for (const e of es) {
          const l = Math.max(lo[e], need - (sHi - hi[e])), h = Math.min(hi[e], need - (sLo - lo[e]));
          if (l > h) return false;
          if (l !== lo[e] || h !== hi[e]) { lo[e] = l; hi[e] = h; changed = true; }
        }
      }
      for (let e = 0; e < g.edges.length; e++) {
        if (lo[e] > 0) for (const f of g.edges[e].crosses) {
          if (lo[f] > 0) return false;
          if (hi[f] > 0) { hi[f] = 0; changed = true; }
        }
      }
    }
    return true;
  }
  (function go(lo, hi) {
    if (found >= limit || !narrow(lo, hi)) return;
    const open = lo.findIndex((l, e) => l !== hi[e]);
    if (open < 0) {
      if (joined(p, g, lo)) { found++; first ??= [...lo]; }
      return;
    }
    for (let v = hi[open]; v >= lo[open]; v--) {
      const l2 = [...lo], h2 = [...hi];
      l2[open] = h2[open] = v;
      go(l2, h2);
    }
  })(lo, hi);
  return { found, answer: first };
}

/* ---------- the logic solver: steps a person would take ---------- */

// One round of reasoning from what's known (`known`: bridges there now,
// taken as certain). Returns the first island with a bridge it must have
// beyond those, with every edge's limit and why ({ island, edge, count,
// need, edges: [{ edge, hi, why }] }), or null when reasoning alone gets
// no further. The limits: { t: 'crosses', by: edge } (a bridge in the
// way), { t: 'full', i } (island i has no more room), { t: 'cutoff' } (a
// group of islands would be closed off from the rest).
export function nextStep(p, g, known) {
  const lo = [...known], hi = g.edges.map(() => 2);
  const why = g.edges.map(() => null);
  const cap = (e, h, reason) => { if (h < hi[e]) { hi[e] = h; why[e] = reason; return true; } return false; };
  for (let changed = true; changed;) {
    changed = false;
    // Crossings.
    for (let e = 0; e < g.edges.length; e++) {
      if (lo[e] > 0) for (const f of g.edges[e].crosses) changed = cap(f, 0, { t: 'crosses', by: e }) || changed;
    }
    // A neighbour that can take only so many more.
    for (let i = 0; i < p.islands.length; i++) {
      const es = g.of[i], need = p.islands[i].need;
      const sLo = es.reduce((s, e) => s + lo[e], 0);
      for (const e of es) changed = cap(e, Math.max(lo[e], need - (sLo - lo[e])), { t: 'full', i }) || changed;
    }
    // Cut off: a bridge that would close a group of islands needing
    // nothing more, apart from the rest.
    for (let e = 0; e < g.edges.length; e++) {
      for (let v = hi[e]; v > lo[e]; v--) {
        if (!closesGroup(p, g, lo, e, v)) break;
        changed = cap(e, v - 1, { t: 'cutoff' }) || changed;
      }
    }
    // Each island: what it must have on each edge, given the most the
    // others can take.
    for (let i = 0; i < p.islands.length; i++) {
      const es = g.of[i], need = p.islands[i].need;
      const sHi = es.reduce((s, e) => s + hi[e], 0);
      for (const e of es) {
        const must = need - (sHi - hi[e]);
        if (must > lo[e]) {
          return { island: i, edge: e, count: must, need, edges: es.map(f => ({ edge: f, hi: hi[f], why: why[f] })) };
        }
      }
    }
  }
  return null;
}

// Would edge e at v bridges (with the rest at lo) close a group of islands
// that all have their number, short of every island?
function closesGroup(p, g, lo, e, v) {
  const b = [...lo]; b[e] = v;
  const n = counts(p, g, b);
  const start = g.edges[e].a, seen = new Set([start]), todo = [start];
  while (todo.length) {
    const i = todo.pop();
    if (n[i] !== p.islands[i].need) return false;
    for (const f of g.of[i]) {
      if (!b[f]) continue;
      const j = g.edges[f].a === i ? g.edges[f].b : g.edges[f].a;
      if (!seen.has(j)) { seen.add(j); todo.push(j); }
    }
  }
  return seen.size < p.islands.length;
}

// Solves by reasoning alone. Returns { board, steps } or null if it gets stuck.
export function solveByLogic(p, g = edgesOf(p)) {
  const board = g.edges.map(() => 0);
  let steps = 0;
  for (;;) {
    if (isSolved(p, g, board)) return { board, steps };
    const s = nextStep(p, g, board);
    if (!s) return null;
    board[s.edge] = s.count;
    steps++;
  }
}

/* ---------- the maker ---------- */

// Each size's maker settings (measured in the mockup, 2026-10-24): n, how
// many islands, the most bridges one may want (Small's at most 4, drawn
// as a die's dots), the share of doubles and of extra bridges, the share
// of rows and columns islands may use, and the fewest possible bridges
// per island a kept puzzle has (more makes it harder).
export const MAKE = {
  small: { n: 5, islands: 6, maxNeed: 4, doubles: 0.3, extra: 0.2, lines: 0.7, minRatio: 1.0 },
  medium: { n: 7, islands: 12, maxNeed: 8, doubles: 0.45, extra: 0.3, lines: 0.6, minRatio: 1.2 },
  large: { n: 10, islands: 24, maxNeed: 8, doubles: 0.45, extra: 0.3, lines: 0.6, minRatio: 1.38 },
};

const shuffle = (a, rand) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Makes a puzzle from a seed, or null when that seed's puzzle fails a
// rule: islands only where some rows meet some columns (so they line up
// and see each other), none side by side, one on each edge of the board,
// never two empty rows or columns together; joined by a random network of
// bridges that don't cross (a spanning tree, then a few more), each one or
// two; kept only with one answer that reasoning alone reaches. `fail`
// counts the reasons, for the tool's log.
export function makePuzzle(n, seed, { islands: want = 8, maxNeed = 8, doubles = 0.45, extra = 0.3, lines = 0.6 } = {}, fail = {}) {
  const no = why => { fail[why] = (fail[why] ?? 0) + 1; return null; };
  const rand = mulberry32(seed);
  const someOf = () => Array.from({ length: n }, (_, i) => i).filter(i => i === 0 || i === n - 1 || rand() < lines);
  const rows = someOf(), cols = someOf();
  const cells = shuffle(rows.flatMap(r => cols.map(c => ({ r, c }))), rand);
  const taken = new Set();
  const isl = [];
  for (const { r, c } of cells) {
    if (isl.length === want) break;
    if ([[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dr, dc]) => taken.has(`${r + dr},${c + dc}`))) continue;
    taken.add(`${r},${c}`);
    isl.push({ r, c });
  }
  if (isl.length < want) return no('place');
  if (![isl.some(s => s.r === 0), isl.some(s => s.r === n - 1), isl.some(s => s.c === 0), isl.some(s => s.c === n - 1)].every(Boolean)) return no('edges');
  const gaps = used => Array.from({ length: n - 1 }, (_, i) => !used.has(i) && !used.has(i + 1)).some(Boolean);
  if (gaps(new Set(isl.map(s => s.r))) || gaps(new Set(isl.map(s => s.c)))) return no('gaps');
  const p0 = { n, islands: isl.map(s => ({ ...s, need: 0 })) };
  const g0 = edgesOf(p0);
  const board = g0.edges.map(() => 0);
  // A random spanning tree: edges in a shuffled order, each joining two
  // groups unless it crosses a bridge already down.
  const order = shuffle(g0.edges.map((_, i) => i), rand);
  const group = isl.map((_, i) => i);
  const root = i => (group[i] === i ? i : (group[i] = root(group[i])));
  let joins = 0;
  for (const e of order) {
    const { a, b } = g0.edges[e];
    if (root(a) === root(b) || blockedBy(g0, board, e).length) continue;
    group[root(a)] = root(b);
    board[e] = rand() < doubles ? 2 : 1;
    joins++;
  }
  if (joins !== isl.length - 1) return no('tree');
  for (const e of order) {
    if (!board[e] && rand() < extra && !blockedBy(g0, board, e).length) board[e] = rand() < doubles ? 2 : 1;
  }
  const need = counts(p0, g0, board);
  if (need.some(x => x > maxNeed || x === 0)) return no('need');
  const p = { n, seed, islands: isl.map((s, i) => ({ r: s.r, c: s.c, need: need[i] })) };
  const g = edgesOf(p);
  if (countAnswers(p, 2, g).found !== 1) return no('answers');
  const logic = solveByLogic(p, g);
  if (!logic) return no('logic');
  p.steps = logic.steps;
  return p;
}

/* ---------- the stock ---------- */

// Puzzles made ahead of time by tools/bridges-puzzles.js into
// data/bridges.json, STOCK per size: the first kept seeds from
// firstSeed(size) on, no two the same shape (turned or flipped), in an
// order shuffled once with a fixed seed (DESIGN.md "Puzzle order").
export const STOCK = { small: 200, medium: 200, large: 200 };
export const firstSeed = size => (SIZES.indexOf(size) + 1) * 100000;

// A size's puzzle from a seed, or null when it isn't kept: the maker's
// rules, then enough possible bridges per island for its size.
export function stockPuzzle(size, seed, fail = {}) {
  const m = MAKE[size];
  const p = makePuzzle(m.n, seed, m, fail);
  if (!p) return null;
  if (edgesOf(p).edges.length / p.islands.length < m.minRatio) { fail.ratio = (fail.ratio ?? 0) + 1; return null; }
  return { size, ...p };
}

// The same puzzle turned or flipped looks the same to a player: a key that
// is the same for all eight.
export function shapeKey(p) {
  const n = p.n, m = n - 1;
  const turns = [
    (r, c) => [r, c], (r, c) => [c, m - r], (r, c) => [m - r, m - c], (r, c) => [m - c, r],
    (r, c) => [r, m - c], (r, c) => [c, r], (r, c) => [m - r, c], (r, c) => [m - c, m - r],
  ];
  return turns.map(t => p.islands.map(s => { const [r, c] = t(s.r, s.c); return `${r}${c}${s.need}`; }).sort().join('')).sort()[0];
}

export function stockOrder(size, list) {
  return shuffle(list.slice(), mulberry32(firstSeed(size) + 1));
}
// The puzzle numbered k (0-based): after the last they come round again.
export const stockAt = (list, k) => list[k % list.length];
// Stored as [seed, "rcn rcn ..."] (row, column, need: one digit each).
export const encode = p => [p.seed, p.islands.map(s => `${s.r}${s.c}${s.need}`).join(' ')];
export function decode(size, [seed, text]) {
  const islands = String(text).split(' ').map(t => ({ r: Number(t[0]), c: Number(t[1]), need: Number(t[2]) }));
  const p = { size, n: MAKE[size]?.n, seed, islands };
  const why = problems(p);
  if (why.length) throw new Error(`bridges ${size} ${seed}: ${why.join('; ')}`);
  return p;
}

// Everything wrong with a puzzle, as words ([] when it's fine): its size,
// the islands (on the board, none side by side, each wanting 1 to the
// size's most), one answer, and that reasoning alone reaches it.
export function problems(p) {
  const m = MAKE[p.size];
  if (!m) return [`bad size ${p.size}`];
  const out = [];
  if (p.n !== m.n) out.push(`n ${p.n}, not ${m.n}`);
  if (!Array.isArray(p.islands) || p.islands.length < 2) return [...out, 'too few islands'];
  const at = new Set();
  for (const s of p.islands) {
    if (![s.r, s.c].every(v => Number.isInteger(v) && v >= 0 && v < m.n)) { out.push(`island off the board: ${s.r},${s.c}`); continue; }
    if (!(Number.isInteger(s.need) && s.need >= 1 && s.need <= m.maxNeed)) out.push(`island ${s.r},${s.c} wants ${s.need}`);
    if (at.has(`${s.r},${s.c}`)) out.push(`two islands at ${s.r},${s.c}`);
    at.add(`${s.r},${s.c}`);
  }
  for (const s of p.islands) if (at.has(`${s.r},${s.c + 1}`) || at.has(`${s.r + 1},${s.c}`)) out.push(`islands side by side at ${s.r},${s.c}`);
  if (out.length) return out;
  const g = edgesOf(p);
  const found = countAnswers(p, 2, g).found;
  if (found !== 1) return [`${found} answers`];
  if (!solveByLogic(p, g)) out.push('reasoning alone gets stuck');
  return out;
}

// The rules' picture (setup) and the home page's button: a Small puzzle,
// solved (the mockup's first; not one of the stock's seeds).
export const DEMO = { size: 'small', n: 5, seed: 187, islands: [[4, 0, 2], [0, 0, 1], [4, 4, 1], [2, 2, 2], [2, 4, 1], [4, 2, 3]].map(([r, c, need]) => ({ r, c, need })) };

/* ---------- a game ---------- */

const UNDO_MAX = 200;

// A new game of puzzle p: the board empty, its answer worked out.
export function createGame(p) {
  const g = edgesOf(p);
  const { answer } = countAnswers(p, 1, g);
  return { size: p.size, seed: p.seed, p, g, answer, board: g.edges.map(() => 0), undo: [], hints: 0, result: null };
}

const pushUndo = G => { G.undo.push([...G.board]); if (G.undo.length > UNDO_MAX) G.undo.shift(); };

// A tap or drag on edge e: the next count, 0, 1, 2, then 0 again. A bridge
// that would cross another is refused: { ok: false, why: 'crosses', by }.
export function cycle(G, e) {
  if (G.result || !(e >= 0 && e < G.board.length)) return { ok: false, why: 'no edge' };
  const k = (G.board[e] + 1) % 3;
  const by = blockedBy(G.g, G.board, e);
  if (k > 0 && by.length) return { ok: false, why: 'crosses', by };
  pushUndo(G);
  G.board[e] = k;
  const won = isSolved(G.p, G.g, G.board);
  if (won) G.result = 'won';
  return { ok: true, count: k, won };
}

export const canUndo = G => !G.result && G.undo.length > 0;
export function undo(G) {
  if (!canUndo(G)) return { ok: false };
  G.board = G.undo.pop();
  return { ok: true };
}
export const canClear = G => !G.result && G.board.some(Boolean);
export function clear(G) {
  if (!canClear(G)) return { ok: false };
  pushUndo(G);
  G.board = G.board.map(() => 0);
  return { ok: true };
}

// How the board stands: each island's bridges and whether it has its
// number ('done'), too many ('over') or not yet (''); how many are done;
// every island right but not all joined up.
export function standing(G) {
  const have = counts(G.p, G.g, G.board);
  const state = G.p.islands.map((s, i) => (have[i] === s.need ? 'done' : have[i] > s.need ? 'over' : ''));
  const done = state.filter(s => s === 'done').length;
  return { have, state, done, total: state.length, notJoined: done === state.length && !joined(G.p, G.g, G.board) };
}

/* ---------- hints (and Show me how's steps) ---------- */

const NUM = ['no', 'one', 'two'];
function dirOf(p, g, i, e) {
  const E = g.edges[e], s = p.islands[i], o = p.islands[E.a === i ? E.b : E.a];
  return E.k === 'h' ? (o.c > s.c ? 'right' : 'left') : (o.r > s.r ? 'down' : 'up');
}

// The next step from the board: a bridge not in the answer comes off
// first; otherwise the next island whose bridges are forced, every one of
// them; with no step reasoning finds (it shouldn't happen from a board
// that is part of the answer), the next bridge of the answer. Returns
// { kind: 'wrong' | 'step' | 'answer', island, put: [{ edge, count }],
// text } (island -1 but for a step), or null when the board is the answer.
export function nextHint(G) {
  const { p, g, answer, board } = G;
  const short = DOTS[G.size];
  const wrong = board.findIndex((k, e) => k > answer[e]);
  if (wrong >= 0) {
    const text = short ? 'That bridge doesn’t belong there, so it came off.'
      : `A bridge there isn’t part of the answer, so ${answer[wrong] ? 'one of the two came' : 'it came'} off.`;
    return { kind: 'wrong', island: -1, put: [{ edge: wrong, count: answer[wrong] }], text };
  }
  const step = nextStep(p, g, board);
  if (!step) {
    const e = answer.findIndex((k, i) => k > board[i]);
    if (e < 0) return null;
    return { kind: 'answer', island: -1, put: [{ edge: e, count: answer[e] }], text: 'Here is the next bridge of the answer.' };
  }
  const i = step.island, need = step.need;
  const sumHi = step.edges.reduce((s, f) => s + f.hi, 0);
  const put = step.edges.map(f => ({ edge: f.edge, count: need - (sumHi - f.hi) })).filter(f => f.count > board[f.edge]);
  if (short) {
    const many = put.length > 1 || put[0].count === 2;
    return { kind: 'step', island: i, put, text: `Here ${many ? 'are bridges' : 'is a bridge'} for the ringed island.` };
  }
  const name = j => `the ${p.islands[j].need}`;
  const parts = step.edges.map(f => {
    let w = `${f.hi === 0 ? 'none' : f.hi} ${dirOf(p, g, i, f.edge)}`;
    const why = f.why;
    if (why?.t === 'crosses' && f.hi === 0) w += ' (a bridge is in the way)';
    else if (why?.t === 'full' && why.i !== i) w += ` (${name(why.i)} there has room for ${f.hi === 0 ? 'no' : `only ${NUM[f.hi]}`} more)`;
    else if (why?.t === 'cutoff') w += ` (${f.hi === 0 ? 'a bridge' : 'two bridges'} would leave islands cut off from the rest)`;
    return w;
  });
  const what = put.map(f => `${NUM[f.count]} ${dirOf(p, g, i, f.edge)}`).join(' and ');
  const text = `The ringed island needs ${need}. It can take at most ${parts.join(', ')}: ${sumHi} in all. `
    + (sumHi === need ? `So it takes every one of them: ${what}.` : `So even with the most everywhere else, it needs ${what}.`);
  return { kind: 'step', island: i, put, text };
}

// Takes the next step on the board: one Undo step. Returns { ok, h, won }.
function takeStep(G) {
  if (G.result) return { ok: false, why: 'over' };
  const h = nextHint(G);
  if (!h) return { ok: false, why: 'solved' };
  pushUndo(G);
  for (const f of h.put) G.board[f.edge] = f.count;
  const won = isSolved(G.p, G.g, G.board);
  return { ok: true, h, won };
}

// 💡 Hint: the next step, taken, and counted. A hint's last bridge can
// solve the puzzle.
export function useHint(G) {
  const r = takeStep(G);
  if (!r.ok) return r;
  G.hints++;
  if (r.won) G.result = 'won';
  return r;
}

// Give up's Show me how: the same steps, with no hint used. The last one
// (won) doesn't end the game: the screen's Finish does, as shown, not won.
export const walkStep = G => takeStep(G);
// How many steps Show me how takes from the board as it is.
export function walkLength(G) {
  const copy = { ...G, board: [...G.board], undo: [], result: null };
  let k = 0;
  while (!isSolved(copy.p, copy.g, copy.board) && takeStep(copy).ok && k < 1000) k++;
  return k;
}

// The rest at once (Show me how's ⏩ The rest, Give up's Just show it):
// the answer on the board. Returns the bridges it took to get there (each
// edge whose count changed).
export function fillRest(G) {
  const changed = G.answer.map((k, e) => (k !== G.board[e] ? e : -1)).filter(e => e >= 0);
  G.board = [...G.answer];
  return changed;
}
export function endGame(G, how) { G.result = how; }

/* ---------- keeping a game ---------- */

export const snapshotGame = G => ({ size: G.size, seed: G.seed, board: G.board, undo: G.undo, hints: G.hints, result: G.result });
// A kept game of puzzle p, or a throw when it doesn't fit p.
export function restoreGame(p, s) {
  const G = createGame(p);
  const ok = b => Array.isArray(b) && b.length === G.board.length && b.every(k => k === 0 || k === 1 || k === 2);
  if (!ok(s?.board) || !Array.isArray(s.undo) || !s.undo.every(ok)) throw new Error('kept board doesn’t fit the puzzle');
  G.board = [...s.board];
  G.undo = s.undo.slice(-UNDO_MAX).map(b => [...b]);
  G.hints = Number.isInteger(s.hints) && s.hints >= 0 ? s.hints : 0;
  G.result = ['won', 'gaveup', 'shown'].includes(s.result) ? s.result : null;
  return G;
}

/* ---------- progress kept on the device ---------- */

export const PROGRESS_KEY = 'web-games-bridges';

// { next: { size: puzzle number to play next (0-based) }, best: { size:
// ms } }, from what was kept (anything unreadable counts as nothing).
export function readProgress(text) {
  const out = { next: {}, best: {} };
  let v = null;
  try { v = JSON.parse(text ?? 'null'); } catch { return out; }
  for (const s of SIZES) {
    const k = v?.next?.[s], b = v?.best?.[s];
    if (Number.isInteger(k) && k >= 0) out.next[s] = k;
    if (Number.isFinite(b) && b > 0) out.best[s] = b;
  }
  return out;
}
// The puzzle number (0-based) to start for a size, counted as used at
// once (DESIGN.md "Puzzle order": only Try again plays one again).
export function takeNext(prog, size) {
  const k = prog.next[size] ?? 0;
  prog.next[size] = k + 1;
  return k;
}
// After a win in `ms`: { best: the best before (or null), newBest }.
export function recordTime(prog, size, ms) {
  const before = prog.best[size] ?? null;
  const newBest = before === null || ms < before;
  if (newBest) prog.best[size] = ms;
  return { best: before, newBest };
}
