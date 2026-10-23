// Laser Lab: rules, the beam tracer, the cheapest-cost solver and puzzle
// maker, runs of puzzles and a game. No DOM or UI code: the screen lives
// in src/ui/laser-lab.js.
//
// The puzzle (DESIGN.md "Laser Lab"): a square grid with walls and gems.
// Lasers stand beside the board, at most one per side, each shining in
// along its row or column. The player buys mirrors (turn a beam a quarter
// turn) and splitters (let it through and turn a copy) and puts them on
// empty squares. Walls and gems stop a beam; a beam leaving the board is
// gone, unless a laser stands there: then it breaks that laser. Solved
// when every gem gets exactly its colours (one laser: yellow; two: red,
// blue, and purple gems that want both) and no laser is hit. Pieces cost
// while they're on the board; the puzzle's budget is its cheapest cost
// plus MARGIN, and what's left of it goes into the run's savings.
//
// The code says "lamp" where the words say "laser" (the game was Mirror
// Light until 2026-10-22). From the mockup's core (lp-core.js, mockup v7),
// which made the puzzles the developer tried.
//
// Directions: 0 up, 1 right, 2 down, 3 left. Square i = row * n + col.
// A lamp is { side: 0 top | 1 right | 2 bottom | 3 left, k: its row or
// column, c: its colour }. Colours are bits: one lamp 1; two lamps red 1,
// blue 2; a gem's colour is the bits it wants (3: purple). A piece is
// { t: 'm' (mirror) | 's' (splitter), o: 0 ('/') | 1 ('\') }.

import { mulberry32, clock } from './hidden-faces.js';

export { clock };

export const SIZES = [6, 7, 8];
export const LASERS = [1, 2];
// A setup is a size and a number of lasers: '7-2'.
export const SETUPS = SIZES.flatMap(n => LASERS.map(l => `${n}-${l}`));
export const setupOf = (n, lasers) => `${n}-${lasers}`;
export const parseSetup = s => { const [n, l] = String(s).split('-').map(Number); return { n, lasers: l }; };
export const RUN = 10;          // puzzles in a run
export const MARGIN = 3;        // the budget over the cheapest cost
export const PRICE = { m: 1, s: 2 };
export const WRONG_LAMP = 1;    // a laser switched on that isn't right
export const HEARTS = 3;        // ❤️ Try again, per run (3.2)
export const ANSWERS = 50;      // the cheapest ways hints and Give up choose from

export const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
export const turn = (o, d) => (o === 0 ? d ^ 1 : 3 - d);

// A lamp's square outside the board and the way it shines.
export function lampAt(l, n) {
  return [{ r: -1, c: l.k, d: 2 }, { r: l.k, c: n, d: 3 }, { r: n, c: l.k, d: 0 }, { r: l.k, c: -1, d: 1 }][l.side];
}

// The board as one code per square: '.' empty, '#' wall, 'G' gem.
export function boardOf(p) {
  const b = Array(p.n * p.n).fill('.');
  for (const [r, c] of p.walls) b[r * p.n + c] = '#';
  for (const [r, c] of p.gems) b[r * p.n + c] = 'G';
  return b;
}
export const gemColours = p => new Map(p.gems.map(([r, c, k]) => [r * p.n + c, k || 1]));
// lamps by the square outside the board they stand on
const lampSpots = p => new Map(p.lamps.map((l, i) => { const a = lampAt(l, p.n); return [`${a.r},${a.c}`, i]; }));

// Follows the beams with the player's pieces (a Map from square to
// piece). Returns the segments in the order the beams reach them ({x1, y1,
// x2, y2, step, col, end} in square units; end: 'stop' at a wall or gem,
// 'edge' off the board, 'lamp' into a lamp, with `lamp` its index), the
// colours each gem got (a Map from square to bits), the pieces touched
// and the lamps hit. `only`: the lamps switched on (all if left out).
export function trace(p, placed, only) {
  const n = p.n, b = boardOf(p), spots = lampSpots(p);
  const segs = [], lit = new Map(), touched = new Set(), hits = new Set(), seen = new Set();
  const inside = (r, c) => r >= 0 && c >= 0 && r < n && c < n;
  let beams = p.lamps.flatMap((l, li) => (!only || only.includes(li) ? [{ ...lampAt(l, n), col: l.c || 1 }] : [])), step = 0;
  while (beams.length) {
    const next = [];
    for (const { r, c, d, col } of beams) {
      const key = ((((r + 1) * (n + 2) + c + 1) * 4 + d) * 4) + col;
      if (seen.has(key)) continue;
      seen.add(key);
      const r2 = r + DR[d], c2 = c + DC[d];
      // from the square's centre, or from the board's edge for a beam
      // coming in from a lamp
      const x1 = c + .5 + (inside(r, c) ? 0 : DC[d] / 2), y1 = r + .5 + (inside(r, c) ? 0 : DR[d] / 2);
      if (!inside(r2, c2)) {
        const half = { x1, y1, x2: c + .5 + DC[d] / 2, y2: r + .5 + DR[d] / 2, step, col };
        const li = spots.get(`${r2},${c2}`);
        if (li !== undefined) { hits.add(li); segs.push({ ...half, end: 'lamp', lamp: li }); }
        else segs.push({ ...half, end: 'edge' });
        continue;
      }
      const i = r2 * n + c2, code = b[i];
      if (code === '#') { segs.push({ x1, y1, x2: c + .5 + DC[d] / 2, y2: r + .5 + DR[d] / 2, step, col, end: 'stop' }); continue; }
      segs.push({ x1, y1, x2: c2 + .5, y2: r2 + .5, step, col, ...(code === 'G' ? { end: 'stop' } : {}) });
      if (code === 'G') { lit.set(i, (lit.get(i) || 0) | col); continue; }
      const pc = placed.get(i);
      if (pc) touched.add(i);
      if (!pc) next.push({ r: r2, c: c2, d, col });
      else {
        next.push({ r: r2, c: c2, d: turn(pc.o, d), col });
        if (pc.t === 's') next.push({ r: r2, c: c2, d, col });
      }
    }
    beams = next; step++;
  }
  return { segs, lit, touched, hits, steps: step };
}

// Solved: every gem got exactly its colours and no lamp is hit. `wrong`
// gems got a colour they don't want; `unlit` ones miss one. (No tray
// since v6: a piece the beams don't touch is only money wasted.)
export function check(p, placed) {
  const t = trace(p, placed);
  const unlit = [], wrong = [];
  for (const [i, k] of gemColours(p)) {
    const got = t.lit.get(i) || 0;
    if (got & ~k) wrong.push(i); else if (got !== k) unlit.push(i);
  }
  return { ok: !unlit.length && !wrong.length && !t.hits.size, unlit, wrong, ...t };
}

// Lamp `li` switched on with `others` already on: its own beam is right
// when every gem wanting its colour gets it, no gem that doesn't want it
// gets it, and it shines into no lamp. Every lamp right, switched on one
// by one, is the same as `check` passing. `unlit` gems miss this colour,
// `wrong` ones got it unwanted; `solved` when it was the last lamp.
export function checkLamp(p, placed, li, others = []) {
  const t = trace(p, placed, [li]), bit = p.lamps[li].c || 1;
  const unlit = [], wrong = [];
  for (const [i, k] of gemColours(p)) {
    const got = t.lit.get(i) || 0;
    if (got & ~k) wrong.push(i); else if ((k & bit) && !got) unlit.push(i);
  }
  const last = p.lamps.every((l, j) => j === li || others.includes(j));
  const ok = !unlit.length && !wrong.length && !t.hits.size;
  return { ok, solved: ok && last, last, unlit, wrong, ...t };
}

/* ---------- the cheapest cost ---------- */

const PIECES = [null, { t: 'm', o: 0 }, { t: 'm', o: 1 }, { t: 's', o: 0 }, { t: 's', o: 1 }];
const PAY = [0, PRICE.m, PRICE.m, PRICE.s, PRICE.s];
export const costOf = placed => { let k = 0; for (const pc of placed.values()) k += PRICE[pc.t]; return k; };
export const answerCost = a => a.reduce((k, x) => k + PRICE[x.t], 0);
export const answerMap = (a, n) => new Map(a.map(x => [x.r * n + x.c, { t: x.t, o: x.o }]));

// Every answer costing at most `cap`, up to `limit`. The pieces can only
// matter where the beams go, so the search follows the beams and, at each
// empty square they reach for the first time, tries leaving it empty or
// buying each piece there, both ways round. A beam into a lamp, or of a
// colour a gem doesn't want, ends that branch. `nodes` counts the choices
// tried; the search stops after `budget` of them (`over` then says so).
// The state is shared by all branches: each change is written on a trail
// and undone after a branch, rather than copied for every choice.
export function solveCheap(p, cap, limit = 1, budget = Infinity) {
  const n = p.n, N = n + 2;
  const b = boardOf(p), gems = gemColours(p), want = new Int8Array(n * n);
  for (const [i, k] of gems) want[i] = k;
  const lampOut = new Uint8Array(N * N);   // squares outside the board with a lamp
  for (const l of p.lamps) { const a = lampAt(l, n); lampOut[(a.r + 1) * N + a.c + 1] = 1; }
  const place = new Int8Array(n * n).fill(-1);   // -1 not chosen yet, else PIECES' index
  const seen = new Uint8Array(N * N * 16), lit = new Int8Array(n * n), trail = [];
  const out = []; let nodes = 0;
  // returns at a dead end or after trying a choice's options
  function run(queue, money) {
    for (let q = 0; q < queue.length; q++) {
      const { r, c, d, col } = queue[q];
      const key = ((((r + 1) * N + c + 1) * 4 + d) * 4) + col;
      if (seen[key]) continue;
      const r2 = r + DR[d], c2 = c + DC[d];
      if (r2 < 0 || c2 < 0 || r2 >= n || c2 >= n) {
        if (lampOut[(r2 + 1) * N + c2 + 1]) return;
        seen[key] = 1; trail.push(key); continue;
      }
      const i = r2 * n + c2, code = b[i];
      if (code === '#') { seen[key] = 1; trail.push(key); continue; }
      if (code === 'G') {
        if (col & ~want[i]) return;
        seen[key] = 1; trail.push(key);
        if (!(lit[i] & col)) { lit[i] |= col; trail.push(-1 - i * 4 - col); }
        continue;
      }
      if (place[i] < 0 && money > 0) {
        const rest = queue.slice(q);
        for (let o = 0; o < 5; o++) {
          if (PAY[o] > money) continue;
          if (out.length >= limit || nodes > budget) break;
          nodes++;
          const mark = trail.length;
          place[i] = o;
          run(rest.slice(), money - PAY[o]);
          while (trail.length > mark) {
            const t = trail.pop();
            if (t >= 0) seen[t] = 0; else { const u = -1 - t; lit[u >> 2] &= ~(u & 3); }
          }
        }
        place[i] = -1;
        return;
      }
      seen[key] = 1; trail.push(key);
      const pc = place[i] > 0 ? PIECES[place[i]] : null;
      if (!pc) queue.push({ r: r2, c: c2, d, col });
      else {
        queue.push({ r: r2, c: c2, d: turn(pc.o, d), col });
        if (pc.t === 's') queue.push({ r: r2, c: c2, d, col });
      }
    }
    for (const [i, k] of gems) if (lit[i] !== k) return;
    const ans = [];
    place.forEach((o, i) => { if (o > 0) ans.push({ r: Math.floor(i / n), c: i % n, t: PIECES[o].t, o: PIECES[o].o }); });
    out.push(ans);
  }
  run(p.lamps.map(l => ({ ...lampAt(l, n), col: l.c || 1 })), cap);
  return { answers: out, nodes, over: nodes > budget };
}

// The cheapest cost, proved: every smaller cap searched and failing.
// Returns { cost, answers (at that cost, up to `limit`), nodes }, or
// { over } when the search ran past `budget` choices.
export function cheapest(p, { max = 30, limit = ANSWERS, budget = Infinity } = {}) {
  let nodes = 0;
  for (let cap = 0; cap <= max; cap++) {
    const r = solveCheap(p, cap, limit, budget - nodes);
    nodes += r.nodes;
    if (r.over) return { over: true, nodes };
    if (r.answers.length) return { cost: cap, answers: r.answers, nodes };
  }
  return { cost: null, answers: [], nodes };
}

// The cheapest ways a stock puzzle's hints and Give up choose from (its
// cost is known): one search, worked out on the device when first needed.
export function answersFor(p, budget = Infinity) {
  const r = solveCheap(p, p.cheapest, ANSWERS, budget);
  return { answers: r.answers, nodes: r.nodes, over: r.over };
}

/* ---------- the maker ---------- */

// Why seeds didn't make a puzzle (the tool logs it).
export const FAILS = {};
const fail = why => { FAILS[why] = (FAILS[why] || 0) + 1; return null; };

// The board the maker starts from: lamps on different sides, some walls,
// pieces (`m` mirrors, `s` splitters) dropped at random along the beams
// (a splitter where the two colours cross, half the time there is such a
// square, so their beams can join), and a gem where each beam ends inside
// the board. Returns { p, placed, c (its check), fronts (the squares in
// front of the lamps), R } or null.
function layout(seed, { n, lamps = 1, m = 2, s = 0, walls = 3, minGems = 1, minLen = 8 }) {
  const R = mulberry32(seed), ri = k => Math.floor(R() * k);
  const sides = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = ri(i + 1); [sides[i], sides[j]] = [sides[j], sides[i]]; }
  const p = { n, lamps: sides.slice(0, lamps).map((side, i) => ({ side, k: ri(n), c: i + 1 })), walls: [], gems: [] };
  const fronts = new Set(p.lamps.map(l => { const a = lampAt(l, n); return (a.r + DR[a.d]) * n + a.c + DC[a.d]; }));
  const free = () => { const b = boardOf(p); const f = []; b.forEach((x, i) => { if (x === '.' && !fronts.has(i)) f.push(i); }); return f; };
  for (let w = 0; w < walls; w++) { const f = free(); const i = f[ri(f.length)]; p.walls.push([Math.floor(i / n), i % n]); }
  const placed = new Map(); let mLeft = m, sLeft = s;
  while (mLeft + sLeft > 0) {
    const t = trace(p, placed);
    // empty squares the beams cross (not where they end), and the colours
    // crossing each
    const cols = new Map();
    for (const g of t.segs) if (!g.end) { const i = Math.floor(g.y2) * n + Math.floor(g.x2); if (!placed.has(i)) cols.set(i, (cols.get(i) || 0) | g.col); }
    const cands = [...cols.keys()];
    if (!cands.length) return fail('no square for a piece');
    const useS = sLeft && (!mLeft || R() < .5);
    const both = cands.filter(i => cols.get(i) === 3);
    const i = useS && both.length && R() < .5 ? both[ri(both.length)] : cands[ri(cands.length)];
    placed.set(i, { t: useS ? 's' : 'm', o: ri(2) });
    if (useS) sLeft--; else mLeft--;
  }
  const t = trace(p, placed);
  if (t.hits.size) return fail('the beam hit a lamp');
  // a gem where each beam ends inside the board, of the colours ending there
  const ends = new Map();
  for (const g of t.segs) {
    if (g.end !== 'stop' && g.end !== 'edge') continue;
    const i = Math.floor(g.y1) * n + Math.floor(g.x1);
    if (g.y1 % 1 === 0 || g.x1 % 1 === 0) continue; // from the edge: no square
    if (boardOf(p)[i] === '.' && !placed.has(i)) ends.set(i, (ends.get(i) || 0) | g.col);
  }
  for (const [i, k] of ends) p.gems.push([Math.floor(i / n), i % n, k]);
  if (p.gems.length < minGems) return fail('too few gems');
  for (let k = 1; k <= lamps; k++) if (!p.gems.some(g => g[2] & k)) return fail('a lamp with no gem');
  const c = check(p, placed);
  // every piece dropped touched too (the mockup's tray rule, kept so the
  // puzzles are the ones it made)
  if (!c.ok || c.touched.size !== placed.size) return fail(c.hits.size ? 'the beam hit a lamp' : 'a gem cut the beam');
  if (c.segs.length < minLen) return fail('beam too short');
  return { p, placed, c, fronts, R };
}

// A budget puzzle from a seed: layout's board (less the pieces the beams
// ended up not touching), then walls on squares where an answer cheaper
// than `minCost` has a beam and the layout's answer doesn't, until none
// is that cheap. Then the cheapest cost, proved (it may be below the
// layout's own). No unique answer needed. Returns the puzzle with
// `cheapest`, `budget` (cheapest + MARGIN), `answers` (at the cheapest,
// up to ANSWERS), `answer` (one of them, the layout's when it's one),
// `nodes` (the search's size) and `seed`; or null.
export function makeCheap(seed, opt) {
  const lay = layout(seed, opt);
  if (!lay) return null;
  const { p, c, fronts, R } = lay, ri = k => Math.floor(R() * k), n = p.n, { maxNodes = Infinity, minCost = 0 } = opt;
  const placed = new Map([...lay.placed].filter(([i]) => c.touched.has(i)));
  if (costOf(placed) < minCost) return fail('too cheap');
  if (!check(p, placed).ok) return fail('not right without the untouched pieces');
  const onPath = cellsOf(trace(p, placed), n);
  let nodes = 0;
  for (let k2 = 0; ; k2++) {
    const res = solveCheap(p, minCost - 1, 1, maxNodes);
    nodes += res.nodes;
    if (res.over) return fail('search too big');
    if (!res.answers.length) break;
    if (k2 >= 12) return fail('still too cheap');
    const altT = trace(p, answerMap(res.answers[0], n));
    const bb = boardOf(p);
    const spots = [...cellsOf(altT, n)].filter(i => !onPath.has(i) && bb[i] === '.' && !fronts.has(i));
    if (!spots.length) return fail('cheaper answer on the same squares');
    const i = spots[ri(spots.length)];
    p.walls.push([Math.floor(i / n), i % n]);
  }
  const all = cheapest(p, { limit: ANSWERS, budget: maxNodes });
  nodes += all.nodes;
  if (all.over) return fail('search too big');
  p.cheapest = all.cost;
  p.budget = all.cost + MARGIN;
  p.answers = all.answers;
  p.answer = all.answers.find(a => sameAnswer(a, placed, n)) || all.answers[0];
  p.nodes = nodes;
  p.seed = seed;
  return p;
}

// the squares inside the board the beams pass through or stop in
export function cellsOf(t, n) {
  const s = new Set();
  const add = (x, y) => { if (x % 1 && y % 1 && x > 0 && y > 0 && x < n && y < n) s.add(Math.floor(y) * n + Math.floor(x)); };
  for (const g of t.segs) { add(g.x1, g.y1); add(g.x2, g.y2); }
  return s;
}

export function sameAnswer(a, placed, n) {
  return a.length === placed.size && a.every(x => { const q = placed.get(x.r * n + x.c); return q && q.t === x.t && q.o === x.o; });
}

/* ---------- the stock (DESIGN.md "Laser Lab") ---------- */

// What the maker is given, per size (mockup v6-v7): the pieces it drops,
// and the floor under the cheapest cost.
export const MAKE = {
  6: { m: 4, s: 1, minCost: 6 },
  7: { m: 4, s: 2, minCost: 7 },
  8: { m: 5, s: 2, minCost: 8 },
};
const MAKE_ALL = { minGems: 2, maxNodes: 2000000 };
export const makeOptions = setup => { const { n, lasers } = parseSetup(setup); return { n, lamps: lasers, ...MAKE[n], ...MAKE_ALL }; };

// Puzzles per setup, made ahead of time by tools/laser-lab-puzzles.js into
// data/laser-lab.json: from firstSeed(setup) on, in seed order, the first
// stockPurple(setup) made puzzles with a purple gem and the first
// stockSize - stockPurple without (stockPuzzle), in the order stockOrder
// gives them. 8 x 8 with two lasers takes about 30 minutes of one core a
// puzzle (2026-10-22), so 50 of those for now (5 runs).
export const STOCK = 100;
export const stockSize = setup => (setup === '8-2' ? 50 : STOCK);
// Two lasers: about 1 in 3 with a purple gem (developer, 2026-10-22: "about
// 1 in 3 two-laser puzzles at 6x6 and 7x7, spread through each run, and
// 8x8's three spread out"). 8 x 8's are the 3 its first 50 had, not remade.
export const stockPurple = setup => (parseSetup(setup).lasers < 2 ? 0 : setup === '8-2' ? 3 : Math.round(stockSize(setup) / 3));
// A stock entry (encode) with a purple gem.
export const isPurple = e => e[2].includes('3');
export const firstSeed = setup => { const { n, lasers } = parseSetup(setup); return (n * 10 + lasers) * 1000000; };
// With two lasers, kept only when both beams pass through a piece of the
// answer (the mockup's first pick rule, v3-v7: otherwise one laser just
// shines straight at its gems).
export function stockPuzzle(setup, seed) {
  const p = makeCheap(seed, makeOptions(setup));
  if (!p || (p.lamps.length > 1 && !bothUsePieces(p))) return p && fail('a laser with no piece');
  return p;
}
export function bothUsePieces(p) {
  const by = [0, new Set(), new Set()], pl = answerMap(p.answer, p.n);
  for (const g of trace(p, pl).segs) if (!g.end && g.x2 % 1) { const i = Math.floor(g.y2) * p.n + Math.floor(g.x2); if (pl.has(i)) by[g.col].add(i); }
  return by[1].size > 0 && by[2].size > 0;
}
function shuffled(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Stock entries (in seed order) shuffled once with a fixed seed, so the
// tool always makes the same file; the purple ones (shuffled too) then
// spaced evenly through it, so every run of 10 has about as many (100 with
// 33: 3 or 4 a run, at least 2 puzzles apart). With no purple, the order
// is 3.0's.
export function stockOrder(setup, list) {
  const rnd = mulberry32(firstSeed(setup) + 1);
  const out = shuffled(list.filter(e => !isPurple(e)), rnd), purple = shuffled(list.filter(isPurple), rnd);
  purple.forEach((e, j) => out.splice(Math.floor((j + 0.5) * list.length / purple.length), 0, e));
  return out;
}
// Run `no`'s puzzle `at` (0-based): the stock's from no * RUN on; after
// the last they come round again.
export const puzzleNumber = (no, at) => no * RUN + at;
export const stockAt = (list, k) => list[k % list.length];

// A stock entry: [seed, lamps as [side, k], the board as one character a
// square ('.' empty, '#' wall, '1' '2' '3' a gem of those colours), the
// cheapest cost, one cheapest answer as "square piece turn" ("14m0 22s1")].
export function encode(p) {
  const b = boardOf(p).map(x => (x === 'G' ? '?' : x));
  for (const [r, c, k] of p.gems) b[r * p.n + c] = String(k);
  return [p.seed, p.lamps.map(l => [l.side, l.k]), b.join(''), p.cheapest, p.answer.map(a => `${a.r * p.n + a.c}${a.t}${a.o}`).join(' ')];
}
// A stock entry as a puzzle. Throws, saying why, when it isn't one
// (problems).
export function decode(setup, e) {
  const { n, lasers } = parseSetup(setup);
  const [seed, lamps, board, cost, answer] = Array.isArray(e) ? e : [];
  const p = { setup, seed, n, lamps: [], walls: [], gems: [], cheapest: cost, budget: cost + MARGIN, answer: [] };
  try {
    p.lamps = lamps.map(([side, k], i) => ({ side, k, c: i + 1 }));
    [...board].forEach((x, i) => {
      if (x === '#') p.walls.push([Math.floor(i / n), i % n]);
      else if (/[123]/.test(x)) p.gems.push([Math.floor(i / n), i % n, Number(x)]);
    });
    p.answer = answer.split(' ').filter(Boolean).map(w => {
      const m = /^(\d+)([ms])([01])$/.exec(w);
      if (!m) throw new Error(`bad piece "${w}"`);
      const i = Number(m[1]);
      return { r: Math.floor(i / n), c: i % n, t: m[2], o: Number(m[3]) };
    });
    p.boardText = board;
  } catch (err) { throw new Error(`laser lab ${setup} ${seed}: not a puzzle (${err.message})`); }
  const why = problems(p, lasers);
  if (why.length) throw new Error(`laser lab ${setup} ${seed}: ${why.join('; ')}`);
  delete p.boardText;
  return p;
}

// Everything wrong with a decoded puzzle, as words ([] when it's fine):
// the board's size and squares, the lamps (the setup's number, different
// sides, inside the board's span, nothing in front of them blocked by a
// wall), the gems (each lamp's colour wanted by one), and the answer (on
// empty squares, right, costing the cheapest). The cheapest cost itself
// is proved by the tool and the tests, not here (too slow for a phone).
export function problems(p, lasers = p.lamps.length) {
  const out = [], n = p.n;
  if (!Number.isInteger(p.seed)) out.push('no seed');
  if (typeof p.boardText === 'string' && (p.boardText.length !== n * n || /[^.#123]/.test(p.boardText))) out.push(`the board isn't ${n}×${n} squares`);
  if (p.lamps.length !== lasers) out.push(`${p.lamps.length} lasers, not ${lasers}`);
  if (new Set(p.lamps.map(l => l.side)).size !== p.lamps.length) out.push('two lasers on one side');
  for (const l of p.lamps) if (![0, 1, 2, 3].includes(l.side) || !(Number.isInteger(l.k) && l.k >= 0 && l.k < n)) out.push(`a laser off the board (${l.side}, ${l.k})`);
  for (let k = 1; k <= p.lamps.length; k++) if (!p.gems.some(g => g[2] & k)) out.push(`no gem for laser ${k}`);
  if (p.gems.some(g => g[2] > (1 << p.lamps.length) - 1)) out.push('a gem of a colour no laser has');
  if (!(Number.isInteger(p.cheapest) && p.cheapest > 0)) out.push('no cheapest cost');
  if (out.length) return out;
  const b = boardOf(p);
  if (p.answer.some(a => b[a.r * n + a.c] !== '.')) out.push('the answer puts a piece on a wall or gem');
  else if (new Set(p.answer.map(a => a.r * n + a.c)).size !== p.answer.length) out.push('the answer puts two pieces on a square');
  else if (!check(p, answerMap(p.answer, n)).ok) out.push("the answer isn't right");
  if (answerCost(p.answer) !== p.cheapest) out.push(`the answer costs ${answerCost(p.answer)}, not ${p.cheapest}`);
  return out;
}

// The rules picture and the home page's: a 6 x 6 with one lamp, solved
// the cheapest way (a mockup v5 puzzle, so it gives away none of the
// stock's answers).
export const DEMO = {
  n: 6, lamps: [{ side: 1, k: 3, c: 1 }],
  walls: [[0, 0], [1, 1], [5, 4], [3, 0], [3, 2], [5, 1], [4, 5], [2, 4], [2, 2], [1, 4]],
  gems: [[4, 0, 1], [5, 3, 1]],
  cheapest: 3,
  answer: [{ r: 3, c: 3, t: 'm', o: 0 }, { r: 4, c: 3, t: 's', o: 0 }],
};

/* ---------- a game ---------- */

// A game is a plain object (so it can be kept as JSON) beside its puzzle
// `p`: `pieces` a code per square ('' empty, 'm0' a mirror '/', 's1' a
// splitter '\'), `fixed` the squares a hint fixed, `fees` the coins spent
// on wrong lasers and hints, `on` the lasers on, `broken` the ones shone
// into, `failed` lasers that weren't right with nothing moved since (and
// which others were on), `miss` the last laser that wasn't right ({ li,
// others }, its beam drawn faint), `result` null | 'solved' | 'gaveup',
// `saved` what the puzzle put into the savings, `ms` the clock.
export function createGame(p, setup, k) {
  return {
    setup, k, seed: p.seed, pieces: Array(p.n * p.n).fill(''), fixed: [], fees: 0, wrongLamps: 0, hintsUsed: 0,
    on: [], broken: [], failed: [], miss: null, result: null, saved: null, ms: 0,
  };
}
export const pieceOf = code => (code ? { t: code[0], o: Number(code[1]) } : null);
export function placedOf(g) {
  const m = new Map();
  g.pieces.forEach((code, i) => { if (code) m.set(i, pieceOf(code)); });
  return m;
}
export const spent = g => costOf(placedOf(g));
// What's left of the puzzle's budget (below 0 comes out of the savings).
export const budgetLeft = (g, p) => p.budget - spent(g) - g.fees;
export const nextHintPrice = g => g.hintsUsed + 1;
const lightsOff = g => { g.on = []; g.broken = []; g.failed = []; g.miss = null; };

// A tap on a square, with piece `sel` ('m' or 's') picked: an empty
// square gets one ('/'); a piece turns ('\'); a '\' piece comes off, its
// price back. Walls, gems and a hint's pieces can't be changed. Any change
// switches every laser off, mends a broken one and clears a faint beam.
export function tapSquare(g, p, i, sel) {
  if (g.result) return { ok: false, why: 'over' };
  const code = boardOf(p)[i];
  if (code === '#') return { ok: false, why: 'wall' };
  if (code === 'G') return { ok: false, why: 'gem' };
  if (g.fixed.includes(i)) return { ok: false, why: 'fixed' };
  const pc = pieceOf(g.pieces[i]);
  let did;
  if (!pc) { g.pieces[i] = `${sel}0`; did = 'put'; }
  else if (pc.o === 0) { g.pieces[i] = `${pc.t}1`; did = 'turn'; }
  else { g.pieces[i] = ''; did = 'off'; }
  lightsOff(g);
  return { ok: true, did, t: pc ? pc.t : sel };
}

// ↺ Clear: every piece off but a hint's, their prices back.
export function clearBoard(g) {
  if (g.result) return 0;
  let k = 0;
  g.pieces.forEach((code, i) => { if (code && !g.fixed.includes(i)) { g.pieces[i] = ''; k++; } });
  if (k) lightsOff(g);
  return k;
}

const failKey = (g, li) => `${li}:${[...g.on].sort().join(',')}`;
// Tapping again a laser that wasn't right, with nothing moved since, would
// only cost again. Its own colour's faults don't depend on the other laser;
// a laser hit does.
export const failedBefore = (g, li) => g.failed.includes(`${li}`) || g.failed.includes(failKey(g, li));
// Lasers that can be switched on and would be judged (they pulse).
export const readyLamps = (g, p) => (g.result || !g.pieces.some(Boolean) ? [] : p.lamps.map((l, li) => li).filter(li => !g.on.includes(li) && !g.broken.includes(li) && !failedBefore(g, li)));

// A laser tapped. On: off, free ({ did: 'off' }). Broken, or not right
// with nothing moved since: refused, free ({ refused: 'broken' |
// 'nothing moved' }). Off: on, and judged (checkLamp): right, it stays on
// (`solved` when it was the last); not, it costs WRONG_LAMP, goes off,
// and any laser its beam shone into breaks. Returns { did: 'on', res
// (checkLamp's), others (the lasers on before) }.
export function switchLamp(g, p, li) {
  if (g.result) return { refused: 'over' };
  if (g.broken.includes(li)) return { refused: 'broken' };
  if (g.on.includes(li)) { g.on = g.on.filter(x => x !== li); return { did: 'off' }; }
  if (failedBefore(g, li)) return { refused: 'nothing moved' };
  const others = [...g.on], key = failKey(g, li);
  const res = checkLamp(p, placedOf(g), li, others);
  g.miss = null;
  if (res.ok) {
    g.on.push(li);
    if (res.solved) { g.result = 'solved'; g.saved = budgetLeft(g, p); }
    return { did: 'on', res, others };
  }
  g.fees += WRONG_LAMP;
  g.wrongLamps++;
  g.failed.push(res.unlit.length || res.wrong.length || res.hits.size ? `${li}` : key);
  for (const h of res.hits) { if (!g.broken.includes(h)) g.broken.push(h); g.on = g.on.filter(x => x !== h); }
  g.miss = { li, others };
  return { did: 'on', res, others };
}

// The words for a laser's beam that wasn't right (three lines at most).
const COLOUR = ['', 'red', 'blue'];
export const lampName = (p, li) => (p.lamps.length > 1 ? COLOUR[p.lamps[li].c] : '');
export function missWords(p, res, li) {
  const two = p.lamps.length > 1, name = lampName(p, li), other = two ? lampName(p, 1 - li) : '', bits = [];
  if (res.hits.size) bits.push(res.hits.size > 1 ? 'it broke both lasers' : res.hits.has(li) ? (two ? 'it shone back into its own laser' : 'the beam shone back into the laser') : `it broke the ${other} laser`);
  if (res.unlit.length) bits.push(two ? `no ${name} on ${res.unlit.length} 💎` : `${res.unlit.length} 💎 not lit`);
  if (res.wrong.length) bits.push(`${name} on ${res.wrong.length} ${other} 💎`);
  return `${two ? `The ${name} beam isn't right` : 'Not yet'}: ${bits.join(', ')}. That cost ${coins(WRONG_LAMP)}.`;
}
export function rightWords(g, p, li) {
  const rest = p.lamps.map((l, j) => j).filter(j => !g.on.includes(j));
  return `The ${lampName(p, li)} beam is right. Now the ${rest.map(j => lampName(p, j)).join(' and ')} laser.`;
}
// In words (3.2; the developer on the 🪙: "looks like a ball - not
// meaningful").
export const coins = k => `${k < 0 ? '−' : ''}${Math.abs(k)} coin${Math.abs(k) === 1 ? '' : 's'}`;

// The cheapest answer closest to the player's board: of those that keep
// every hint's piece, the one fewest steps away (a piece to take off,
// turn or put down is a step each).
export function closest(g, p, answers) {
  const n = p.n, placed = placedOf(g), same = (x, pc) => pc && pc.t === x.t && pc.o === x.o;
  const keeps = a => g.fixed.every(i => a.some(x => x.r * n + x.c === i && same(x, placed.get(i))));
  const steps = a => {
    const at = new Map(a.map(x => [x.r * n + x.c, x]));
    let k = a.filter(x => !same(x, placed.get(x.r * n + x.c))).length;
    for (const [i, pc] of placed) if (!same(at.get(i) || {}, pc)) k++;
    return k;
  };
  const list = answers.filter(keeps);
  return (list.length ? list : answers).reduce((b, a) => (steps(a) < steps(b) ? a : b));
}

// 💡 Hint, priced 1, then 2, then 3... in one puzzle. It follows the
// cheapest answer closest to the player's board: a piece not in it comes
// off (its price back), one facing the wrong way is turned, or the
// answer's next piece along the beams is put down (bought as usual);
// either way a piece it leaves is fixed there. Every piece right
// already: no charge. Returns { ok, kind: 'off' | 'turn' | 'fix' | 'put'
// | 'none', i, price, text }.
const where = (i, n) => `row ${Math.floor(i / n) + 1}, column ${i % n + 1}`;
const NAME = { m: 'mirror', s: 'splitter' };
export function useHint(g, p, answers) {
  if (g.result || !answers?.length) return { ok: false };
  const n = p.n, at = i => where(i, n), price = nextHintPrice(g), cost = `That hint cost ${coins(price)}.`;
  const ans = answerMap(closest(g, p, answers), n);
  const take = (kind, i, text) => {
    g.fees += price; g.hintsUsed++;
    lightsOff(g);
    return { ok: true, kind, i, price, text: `${text} ${cost}` };
  };
  for (const [i, pc] of placedOf(g)) {
    if (g.fixed.includes(i)) continue;
    const a = ans.get(i);
    if (!a || a.t !== pc.t) {
      g.pieces[i] = '';
      return take('off', i, `The ${NAME[pc.t]} at ${at(i)} isn't in a cheapest way: the hint takes it off (${coins(PRICE[pc.t])} back).`);
    }
    if (a.o !== pc.o) {
      g.pieces[i] = `${a.t}${a.o}`; g.fixed.push(i);
      return take('turn', i, `The ${NAME[pc.t]} at ${at(i)} is in the right place but faces the wrong way: the hint turns it, and fixes it there.`);
    }
  }
  // the answer's next piece along the beams not yet fixed
  const order = [];
  for (const s of trace(p, ans).segs) if (s.x2 % 1 && s.y2 % 1) { const i = Math.floor(s.y2) * n + Math.floor(s.x2); if (ans.has(i) && !order.includes(i)) order.push(i); }
  const i = order.find(k => !g.fixed.includes(k));
  if (i === undefined) return { ok: true, kind: 'none', price: 0, text: 'Every piece is right: switch the lasers on.' };
  const a = ans.get(i);
  g.fixed.push(i);
  if (g.pieces[i]) return take('fix', i, `The ${NAME[a.t]} at ${at(i)} is right: the hint fixes it there.`);
  g.pieces[i] = `${a.t}${a.o}`;
  const does = a.t === 'm' ? 'turns the beam' : 'lets the beam through and turns a copy of it';
  return take('put', i, `A ${NAME[a.t]} (${coins(PRICE[a.t])}) goes at ${at(i)}, facing ${a.o ? '⟍' : '⟋'}: it ${does}. The hint puts it there.`);
}

// Show answer (🏳 Give up until 3.2; the code keeps its name, so games
// kept under 3.1 still read): a cheapest answer, the one closest to the
// player's pieces, with every laser on; the whole budget comes off the
// savings.
export function giveUp(g, p, answers) {
  if (g.result) return false;
  const a = answers?.length ? closest(g, p, answers) : p.answer;
  g.pieces = Array(p.n * p.n).fill('');
  for (const x of a) g.pieces[x.r * p.n + x.c] = `${x.t}${x.o}`;
  g.fixed = a.map(x => x.r * p.n + x.c);
  g.on = p.lamps.map((l, li) => li); g.broken = []; g.failed = []; g.miss = null;
  g.result = 'gaveup';
  g.saved = -p.budget;
  return true;
}

// The end's words (3.5; developer: "Pieces 7, cheapest 6" read as pieces,
// though both were coins): what the player's pieces were and cost, and
// the best way's, in pieces and coins; no best line when the player's was
// as cheap (3.6; developer: "It is obvious if there is no second line",
// 3.5 said "the best ✓"). `best`: the cheapest way the end
// counts (and See best shows); `run`: { done, savings, best } at a run's
// end. Returns { how: 'solved' | 'lost', head, lines, isBest }.
const pieceCount = k => `${k} piece${k === 1 ? '' : 's'}`;
export function endWords(g, p, best, run = {}) {
  const bestLine = `Best: ${pieceCount(best.length)} (${coins(p.cheapest)})`;
  let how, head, lines, short, isBest = false;
  if (g.result === 'solved') {
    const cost = spent(g), hints = g.hintsUsed * (g.hintsUsed + 1) / 2;
    const fees = [hints ? `hints ${coins(hints)}` : '', g.wrongLamps ? `lasers ${coins(g.wrongLamps)}` : ''].filter(Boolean).map(f => ` · ${f}`).join('');
    isBest = cost <= p.cheapest;
    how = 'solved';
    head = g.saved >= 0 ? `Solved! Saved ${coins(g.saved)}` : `Solved, ${coins(-g.saved)} over`;
    lines = [`You used ${pieceCount(placedOf(g).size)} (${coins(cost)})${fees}`, ...(isBest ? [] : [bestLine])];
    short = g.saved >= 0 ? `This one: saved ${coins(g.saved)}` : `This one: ${coins(-g.saved)} over`;
  } else {
    how = 'lost';
    head = `Answer shown: ${coins(g.saved)}`;
    lines = [bestLine];
    short = `This one: ${coins(g.saved)}`;
  }
  if (run.done) { head = `Run over! Savings ${coins(run.savings)}`; lines = [`${short}${run.best ? ' · Best run!' : ''}`, ...(isBest ? [] : [bestLine])]; }
  return { how, head, lines, isBest };
}
// The board as the best way has it (See best, 3.5): its pieces, every
// laser on. A view to draw, not a game to play.
export function bestView(g, p, best) {
  const pieces = Array(p.n * p.n).fill('');
  for (const x of best) pieces[x.r * p.n + x.c] = `${x.t}${x.o}`;
  return { ...g, pieces, fixed: [], on: p.lamps.map((l, li) => li), broken: [], failed: [], miss: null };
}

// ❤️ Try again (3.2): the board cleared, a hint's pieces too, and all the
// puzzle cost given back (pieces, wrong lasers, hints), so the budget and
// savings are as at its start; the clock runs on. It uses one of the run's
// hearts. Refused, with no heart used: the puzzle over, no hearts left, or
// nothing to give back. Returns { ok, why } or { ok, back, pieces, fees,
// hearts (left) }.
export function tryAgain(prog, g) {
  if (g.result) return { ok: false, why: 'over' };
  const r = runOf(prog, g.setup), pieces = spent(g), fees = g.fees;
  if (!pieces && !fees) return { ok: false, why: 'nothing spent' };
  if (r.hearts <= 0) return { ok: false, why: 'no hearts' };
  g.pieces = g.pieces.map(() => '');
  Object.assign(g, { fixed: [], fees: 0, wrongLamps: 0, hintsUsed: 0 });
  lightsOff(g);
  prog.runs[g.setup] = { ...r, hearts: r.hearts - 1 };
  return { ok: true, back: pieces + fees, pieces, fees, hearts: r.hearts - 1 };
}

// The game as kept (a copy), and a kept game picked up again: null when it
// isn't one for this puzzle.
export const snapshotGame = g => JSON.parse(JSON.stringify(g));
export function restoreGame(p, kept) {
  if (!kept || kept.seed !== p.seed || !Array.isArray(kept.pieces) || kept.pieces.length !== p.n * p.n) return null;
  const b = boardOf(p), g = { ...createGame(p, kept.setup, kept.k), ...snapshotGame(kept) };
  if (g.pieces.some((code, i) => code && (!/^[ms][01]$/.test(code) || b[i] !== '.'))) return null;
  const lamp = li => Number.isInteger(li) && li >= 0 && li < p.lamps.length;
  if (!g.on.every(lamp) || !g.broken.every(lamp) || (g.miss && !lamp(g.miss.li))) return null;
  if (![null, 'solved', 'gaveup'].includes(g.result) || ![g.fees, g.wrongLamps, g.hintsUsed, g.ms].every(v => Number.isFinite(v) && v >= 0)) return null;
  return g;
}

/* ---------- runs, kept on the device ---------- */

export const PROGRESS_KEY = 'web-games-laser-lab';

// { runs: { setup: { no, at, savings, hearts, cur } }, best: { setup:
// savings } }: run `no`'s next puzzle is `at` (0-9); `hearts` the Try
// agains left (3.2: a run kept before has HEARTS); `cur` the puzzle under
// way, as left (a kept game), or null. Anything unreadable counts as
// nothing.
export function readProgress(text) {
  const out = { runs: {}, best: {} };
  let v = null;
  try { v = JSON.parse(text ?? 'null'); } catch { return out; }
  for (const s of SETUPS) {
    const r = v?.runs?.[s], b = v?.best?.[s];
    if (r && Number.isInteger(r.no) && r.no >= 0 && Number.isInteger(r.at) && r.at >= 0 && r.at < RUN && Number.isFinite(r.savings)) {
      const hearts = Number.isInteger(r.hearts) && r.hearts >= 0 && r.hearts <= HEARTS ? r.hearts : HEARTS;
      out.runs[s] = { no: r.no, at: r.at, savings: r.savings, hearts, cur: r.cur && typeof r.cur === 'object' ? r.cur : null };
    }
    if (Number.isFinite(b)) out.best[s] = b;
  }
  return out;
}
export const runOf = (prog, setup) => prog.runs[setup] ?? { no: 0, at: 0, savings: 0, hearts: HEARTS, cur: null };

// Keeps the puzzle under way in its run (after every change), so it comes
// back as left.
export function keepCurrent(prog, setup, g) {
  prog.runs[setup] = { ...runOf(prog, setup), cur: g.result ? null : snapshotGame(g) };
}

// The puzzle's end: `saved` (what's left of its budget, or minus all of
// it) goes into the savings and the run moves on, its hearts kept; after
// the RUN-th a new run starts at 0 with HEARTS and the best is kept. Returns { savings, done, best
// (a new best run), run (the next) }.
export function finishPuzzle(prog, setup, saved) {
  const r = runOf(prog, setup);
  const savings = r.savings + saved, done = r.at + 1 >= RUN;
  let best = false;
  if (done) {
    best = prog.best[setup] === undefined || savings > prog.best[setup];
    if (best) prog.best[setup] = savings;
    prog.runs[setup] = { no: r.no + 1, at: 0, savings: 0, hearts: HEARTS, cur: null };
  } else prog.runs[setup] = { ...r, at: r.at + 1, savings, cur: null };
  return { savings, done, best, run: prog.runs[setup] };
}
