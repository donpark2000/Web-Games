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
//
// Directional bombs (3.9, from mockups v8-v9; developer, 2026-10-23),
// "boosters" in the words since 3.10 (developer: "Call them boosters";
// the code keeps "bomb", as it keeps "lamp" for the laser),
// placed by the puzzle, `bombs` [r, c, k, d]. A bomb points (d, a
// direction) at the wall it brings down; a beam of its colour k (one
// laser: its beam; two: red or blue) coming in from behind, going the way
// it points, sets it off: that wall comes down and the beam carries on.
// Any other beam (another colour, or from another side) stops at it, as
// at a wall. A beam stopped at a wall or bomb that then goes carries on. The lasers shine in the order they were switched
// on, each leaving everything on right (the order can matter: developer,
// "a good feature - not a limitation").

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
  for (const [r, c] of p.bombs ?? []) b[r * p.n + c] = 'B';
  return b;
}
export const bombColours = p => new Map((p.bombs ?? []).map(([r, c, k]) => [r * p.n + c, k || 1]));
export const bombDirs = p => new Map((p.bombs ?? []).map(([r, c, , d]) => [r * p.n + c, d]));
// the way a segment of beam goes (0 up, 1 right, 2 down, 3 left)
export const segDir = g => (g.x2 > g.x1 ? 1 : g.x2 < g.x1 ? 3 : g.y2 > g.y1 ? 2 : 0);
// every order the lasers can be switched on in (one, unless bombs make it
// matter)
export function lampOrders(p) {
  const all = p.lamps.map((l, li) => li);
  if (!(p.bombs ?? []).length || all.length < 2) return [all];
  return [all, [all[1], all[0]]];
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
  const n = p.n, b = boardOf(p), spots = lampSpots(p), bombK = bombColours(p), bombD = bombDirs(p);
  const order = only ?? p.lamps.map((l, li) => li);
  const segs = [], lit = new Map(), touched = new Set(), hits = new Set(), seen = new Set();
  const gone = new Set(), blasts = [], stopped = new Map();
  const inside = (r, c) => r >= 0 && c >= 0 && r < n && c < n;
  let step = 0;
  // with bombs, one laser after another (`phase`), each one's steps from
  // 0; without, all at once as before 3.9 (the same puzzles from a seed).
  // Each segment says its laser (`li`).
  const phased = (p.bombs ?? []).length > 0, phases = phased ? order.map(li => [li]) : [order];
  for (let ph = 0; ph < phases.length; ph++) {
    let beams = phases[ph].map(li => ({ ...lampAt(p.lamps[li], n), col: p.lamps[li].c || 1, li }));
    step = 0;
    while (beams.length) {
      const next = [];
      for (const bm of beams) {
        const { r, c, d, col, li: from } = bm;
        const key = ((((r + 1) * (n + 2) + c + 1) * 4 + d) * 16) + col;
        if (seen.has(key) && !bm.resume) continue;
        seen.add(key);
        const r2 = r + DR[d], c2 = c + DC[d];
        // from the square's centre, or from the board's edge for a beam
        // coming in from a lamp
        const x1 = c + .5 + (inside(r, c) ? 0 : DC[d] / 2), y1 = r + .5 + (inside(r, c) ? 0 : DR[d] / 2);
        if (!inside(r2, c2)) {
          const half = { x1, y1, x2: c + .5 + DC[d] / 2, y2: r + .5 + DR[d] / 2, step, col, phase: ph, li: from };
          const li = spots.get(`${r2},${c2}`);
          if (li !== undefined) { hits.add(li); segs.push({ ...half, end: 'lamp', lamp: li }); }
          else segs.push({ ...half, end: 'edge' });
          continue;
        }
        const i = r2 * n + c2, code = gone.has(i) ? '.' : b[i];
        if (code === '#' || (code === 'B' && !(col & bombK.get(i) && d === bombD.get(i)))) {
          segs.push({ x1, y1, x2: c + .5 + DC[d] / 2, y2: r + .5 + DR[d] / 2, step, col, end: 'stop', phase: ph, li: from });
          if (!stopped.has(i)) stopped.set(i, []);
          stopped.get(i).push({ r, c, d, col, li: from });
          continue;
        }
        segs.push({ x1, y1, x2: c2 + .5, y2: r2 + .5, step, col, phase: ph, li: from, ...(code === 'G' ? { end: 'stop' } : {}) });
        if (code === 'G') { lit.set(i, (lit.get(i) || 0) | col); continue; }
        if (code === 'B') {
          // the bomb goes off; the wall it points at (the way the beam
          // goes) comes down; beams stopped at either carry on
          gone.add(i);
          const r3 = r2 + DR[d], c3 = c2 + DC[d], j = inside(r3, c3) && b[r3 * n + c3] === '#' && !gone.has(r3 * n + c3) ? r3 * n + c3 : -1;
          if (j >= 0) gone.add(j);
          const blast = { i, wall: j, d, col, phase: ph, step };
          segs[segs.length - 1].blast = blast;
          blasts.push(blast);
          for (const k of [i, j]) if (k >= 0 && stopped.has(k)) { for (const x of stopped.get(k)) next.push({ ...x, resume: true }); stopped.delete(k); }
          next.push({ r: r2, c: c2, d, col, li: from });
          continue;
        }
        const pc = gone.has(i) ? null : placed.get(i);
        if (pc) touched.add(i);
        if (!pc) next.push({ r: r2, c: c2, d, col, li: from });
        else {
          next.push({ r: r2, c: c2, d: turn(pc.o, d), col, li: from });
          if (pc.t === 's') next.push({ r: r2, c: c2, d, col, li: from });
        }
      }
      beams = next; step++;
    }
  }
  return { segs, lit, touched, hits, steps: step, gone, blasts, order, phased };
}

// What's on, in `order`, is right: no lamp hit, every gem has exactly the
// colours it wants of those on.
const bitsOf = (p, order) => order.reduce((k, li) => k | (p.lamps[li].c || 1), 0);
function rightSoFar(p, t, order) {
  if (t.hits.size) return false;
  const on = bitsOf(p, order);
  for (const [i, k] of gemColours(p)) if ((t.lit.get(i) || 0) !== (k & on)) return false;
  return true;
}
// The lasers switched on in `order`, each one leaving all that's on
// right: the last trace, or null.
export function inOrder(p, placed, order) {
  let t = null;
  for (let k = 1; k <= order.length; k++) {
    t = trace(p, placed, order.slice(0, k));
    if (!rightSoFar(p, t, order.slice(0, k))) return null;
  }
  return t;
}

// Solved: every gem got exactly its colours and no lamp is hit. `wrong`
// gems got a colour they don't want; `unlit` ones miss one. (No tray
// since v6: a piece the beams don't touch is only money wasted.)
export function check(p, placed) {
  // solved when some order of switching the lasers on works
  for (const order of lampOrders(p)) {
    const t = inOrder(p, placed, order);
    if (t) return { ok: true, unlit: [], wrong: [], ...t };
  }
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
  // shone after the ones on, in their order, which bombs make
  // matter; `segs` has them all (newSegs: this laser's beam, and with bombs
  // any beam its blasts let on)
  const t = trace(p, placed, [...others, li]), bit = p.lamps[li].c || 1;
  const unlit = [], wrong = [];
  for (const [i, k] of gemColours(p)) {
    const got = t.lit.get(i) || 0;
    if (got & ~k) wrong.push(i); else if ((k & bit) && !(got & bit)) unlit.push(i);
  }
  const last = p.lamps.every((l, j) => j === li || others.includes(j));
  const ok = !unlit.length && !wrong.length && !t.hits.size;
  // where this beam was stopped by a bomb: of the other colour, or
  // from a side that doesn't set it off
  const bk = bombColours(p), blocked = [];
  for (const g of t.segs) if (g.end === 'stop' && g.col === bit) {
    const d = segDir(g);
    const r = Math.floor(g.y1) + DR[d], c = Math.floor(g.x1) + DC[d], i = r * p.n + c;
    if (bk.has(i) && !t.gone.has(i)) blocked.push({ i, why: bk.get(i) & bit ? 'side' : 'colour' });
  }
  const newSegs = t.segs.filter(g => (t.phased ? g.phase === others.length : g.li === li));
  return { ok, solved: ok && last, last, unlit, wrong, blocked, ...t, newSegs, oldSegs: t.segs.filter(g => !newSegs.includes(g)) };
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
  // with bombs, each order the lasers can go on in, the answers merged
  const out = [], keys = new Set();
  let nodes = 0, over = false;
  for (const order of lampOrders(p)) {
    const r = solveOrder(p, cap, limit, budget - nodes, order);
    nodes += r.nodes;
    for (const a of r.answers) {
      const key = a.map(x => `${x.r * p.n + x.c}${x.t}${x.o}`).join(' ');
      if (!keys.has(key) && out.length < limit) { keys.add(key); out.push(a); }
    }
    if (r.over) { over = true; break; }
  }
  return { answers: out, nodes, over };
}
function solveOrder(p, cap, limit, budget, order) {
  const n = p.n, N = n + 2;
  const b = boardOf(p), gems = gemColours(p), want = new Int8Array(n * n), bombK = new Int8Array(n * n), bombD = new Int8Array(n * n);
  for (const [i, k] of gems) want[i] = k;
  for (const [i, k] of bombColours(p)) bombK[i] = k;
  for (const [i, d] of bombDirs(p)) bombD[i] = d;
  const lampOut = new Uint8Array(N * N);   // squares outside the board with a lamp
  for (const l of p.lamps) { const a = lampAt(l, n); lampOut[(a.r + 1) * N + a.c + 1] = 1; }
  const place = new Int8Array(n * n).fill(-1);   // -1 not chosen yet, else PIECES' index
  const seen = new Uint8Array(N * N * 64), lit = new Int8Array(n * n), trail = [];
  const gone = new Uint8Array(n * n), stopped = Array.from({ length: n * n }, () => []);
  const out = []; let nodes = 0;
  const start = li => { const l = p.lamps[li]; return { ...lampAt(l, n), col: l.c || 1 }; };
  // with bombs, one laser after another; without, all at once (as before 3.9)
  const phases = (p.bombs ?? []).length ? order.map(li => [li]) : [order];
  const undo = mark => {
    while (trail.length > mark) {
      const t = trail.pop();
      if (typeof t === 'function') t();
      else if (t >= 0) seen[t] = 0; else { const u = -1 - t; lit[u >> 4] &= ~(u & 15); }
    }
  };
  // returns at a dead end or after trying a choice's options
  function run(queue, money, ph) {
    for (let q = 0; q < queue.length; q++) {
      const bm = queue[q], { r, c, d, col } = bm;
      const key = ((((r + 1) * N + c + 1) * 4 + d) * 16) + col;
      if (seen[key] && !bm.resume) continue;
      const r2 = r + DR[d], c2 = c + DC[d];
      if (r2 < 0 || c2 < 0 || r2 >= n || c2 >= n) {
        if (lampOut[(r2 + 1) * N + c2 + 1]) return;
        seen[key] = 1; trail.push(key); continue;
      }
      const i = r2 * n + c2, code = gone[i] ? '.' : b[i];
      if (code === '#' || (code === 'B' && !(col & bombK[i] && d === bombD[i]))) {
        seen[key] = 1; trail.push(key);
        stopped[i].push({ r, c, d, col }); trail.push(() => stopped[i].pop());
        continue;
      }
      if (code === 'G') {
        if (col & ~want[i]) return;
        seen[key] = 1; trail.push(key);
        if (!(lit[i] & col)) { lit[i] |= col; trail.push(-1 - i * 16 - col); }
        continue;
      }
      if (code === 'B') {
        seen[key] = 1; trail.push(key);
        gone[i] = 1; trail.push(() => { gone[i] = 0; });
        const r3 = r2 + DR[d], c3 = c2 + DC[d], j = r3 >= 0 && c3 >= 0 && r3 < n && c3 < n && b[r3 * n + c3] === '#' && !gone[r3 * n + c3] ? r3 * n + c3 : -1;
        if (j >= 0) { gone[j] = 1; trail.push(() => { gone[j] = 0; }); }
        for (const k of [i, j]) if (k >= 0 && stopped[k].length) {
          const was = stopped[k];
          for (const x of was) queue.push({ ...x, resume: true });
          stopped[k] = []; trail.push(() => { stopped[k] = was; });
        }
        queue.push({ r: r2, c: c2, d, col });
        continue;
      }
      // a wall or bomb gone: empty, and no piece can be there
      if (b[i] !== '.') { seen[key] = 1; trail.push(key); queue.push({ r: r2, c: c2, d, col }); continue; }
      if (place[i] < 0 && money > 0) {
        const rest = queue.slice(q);
        for (let o = 0; o < 5; o++) {
          if (PAY[o] > money) continue;
          if (out.length >= limit || nodes > budget) break;
          nodes++;
          const mark = trail.length;
          place[i] = o;
          run(rest.slice(), money - PAY[o], ph);
          undo(mark);
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
    // this laser has shone: all that's on must be right before the next
    const on = phases.slice(0, ph + 1).flat().reduce((k, li) => k | (p.lamps[li].c || 1), 0);
    for (const [i, k] of gems) if (lit[i] !== (k & on)) return;
    if (ph + 1 < phases.length) {
      const mark = trail.length;
      run(phases[ph + 1].map(start), money, ph + 1);
      undo(mark);
      return;
    }
    const ans = [];
    place.forEach((o, i) => { if (o > 0) ans.push({ r: Math.floor(i / n), c: i % n, t: PIECES[o].t, o: PIECES[o].o }); });
    out.push(ans);
  }
  run(phases[0].map(start), cap, 0);
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
  if (opt.bomb && !addBomb(p, placed, fronts, R)) return fail('no square for a bomb');
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
  // a bomb must save coins: with it a wall, the cheapest costs more
  if (opt.bomb) {
    const w = { ...p, walls: [...p.walls, ...p.bombs.map(([r, c]) => [r, c])], bombs: [] };
    const r = solveCheap(w, all.cost, 1, maxNodes);
    nodes += r.nodes;
    if (r.over) return fail('search too big');
    if (r.answers.length) return fail('the bomb saves nothing');
  }
  p.budget = all.cost + MARGIN;
  p.answers = all.answers;
  p.answer = all.answers.find(a => sameAnswer(a, placed, n)) || all.answers[0];
  p.nodes = nodes;
  p.seed = seed;
  return p;
}

// A bomb on a square the answer's beam crosses straight, with a
// wall put on the next square along (one laser), or on a square where both
// colours cross (two: the bomb the other colour's, so it must go first).
// It points the way that beam goes. False when no square will do.
function addBomb(p, placed, fronts, R) {
  const n = p.n, t = trace(p, placed), b = boardOf(p);
  const cols = new Map(), free = i => b[i] === '.' && !placed.has(i) && !fronts.has(i);
  for (const g of t.segs) if (!g.end) { const i = Math.floor(g.y2) * n + Math.floor(g.x2); cols.set(i, (cols.get(i) || 0) | g.col); }
  const cands = [];
  for (const g of t.segs) {
    if (g.end || !(g.x1 % 1) || !(g.y1 % 1)) continue;
    const P = Math.floor(g.y1) * n + Math.floor(g.x1), Q = Math.floor(g.y2) * n + Math.floor(g.x2);
    if (!free(P) || !free(Q)) continue;
    if (p.lamps.length > 1 && cols.get(Q) !== 3) continue;
    cands.push([P, Q, g.col, segDir(g)]);
  }
  for (let k = cands.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [cands[k], cands[j]] = [cands[j], cands[k]]; }
  for (const [P, Q, col, d] of cands) {
    const q = { ...p, walls: [...p.walls, [Math.floor(Q / n), Q % n]], bombs: [[Math.floor(P / n), P % n, col, d]] };
    if (!check(q, placed).ok) continue;
    p.walls = q.walls; p.bombs = q.bombs;
    return true;
  }
  return false;
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
// data/laser-lab.json: in seed order, the first made (stockPuzzle) of each
// kind as many as stockKinds says (with a purple gem or without; without
// a bomb from firstSeed(setup) on, with one from bombSeed(setup) on), in
// the order stockOrder gives them. 8 x 8 with two lasers takes about 30 minutes of one core a
// puzzle (2026-10-22), so 50 of those for now (5 runs).
export const STOCK = 100;
export const stockSize = setup => (setup === '8-2' ? 50 : STOCK);
// Two lasers: about 1 in 3 with a purple gem (developer, 2026-10-22: "about
// 1 in 3 two-laser puzzles at 6x6 and 7x7, spread through each run, and
// 8x8's three spread out"). 8 x 8's are the 3 its first 50 had, not remade.
export const stockPurple = setup => (parseSetup(setup).lasers < 2 ? 0 : setup === '8-2' ? 3 : Math.round(stockSize(setup) / 3));
// A stock entry (encode) with a purple gem.
export const isPurple = e => e[2].includes('3');
// Directional bombs: about 2 in 3 puzzles (3.10; developer, 2026-10-23,
// after playing 3.9's half: "Choosing the order of lighting the lasers
// adds a dimension to the game ... more puzzles with bombs is better.
// Maybe 2 out of 3"), the first made from bombSeed(setup) on; none yet at
// 8 x 8 with two lasers (30 minutes a puzzle without bombs).
export const stockBombs = setup => (setup === '8-2' ? 0 : Math.round(stockSize(setup) * 2 / 3));
export const hasBomb = e => /[A-H]/.test(e[2]);
export const firstSeed = setup => { const { n, lasers } = parseSetup(setup); return (n * 10 + lasers) * 1000000; };
export const bombSeed = setup => firstSeed(setup) + 500000;
// With two lasers, kept only when both beams pass through a piece of the
// answer (the mockup's first pick rule, v3-v7: otherwise one laser just
// shines straight at its gems), or (bombs) the order they go on matters:
// then the laser with no piece is the one whose bomb opens the way. A
// bomb puzzle with two lasers is kept only when the order matters (3.10:
// the order is what the developer likes in them; 3.9 had 10 of 50 at
// 7 x 7 where it didn't).
// From bombSeed on, each puzzle has a bomb, in a setup with bombs (8 x 8
// with two lasers has none, and its seeds go past bombSeed: one puzzle in
// about 13,000 seeds).
export const bombAt = (setup, seed) => stockBombs(setup) > 0 && seed >= bombSeed(setup);
export function stockPuzzle(setup, seed) {
  const p = makeCheap(seed, { ...makeOptions(setup), ...(bombAt(setup, seed) ? { bomb: true } : {}) });
  if (!p || p.lamps.length < 2) return p;
  if (p.bombs?.length) return orderMatters(p) ? p : fail('the order doesn\'t matter');
  return bothUsePieces(p) ? p : fail('a laser with no piece');
}
// Two lasers, the answer right in one order only.
export function orderMatters(p) {
  const pl = answerMap(p.answer, p.n);
  return p.lamps.length > 1 && !inOrder(p, pl, [0, 1]) !== !inOrder(p, pl, [1, 0]);
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
// What goes where in a stock of `size` with `purple` and `bombs` among
// them: each place's kind (kindOf). The purple ones spaced evenly, so
// every run of 10 has about as many (100 with 33: 3 or 4 a run, at least 2
// puzzles apart); the bombs shared out evenly between the runs (3.10: 67
// in 100, 6 or 7 a run), at places in each run picked with a fixed seed,
// never two without a bomb side by side (3.9, half: never three of a
// kind).
export const kindOf = e => +isPurple(e) + 2 * hasBomb(e);
export function stockSlots(setup, size, purple, bombs) {
  const out = Array(size).fill(0), rnd = mulberry32(firstSeed(setup) + 2);
  for (let j = 0; j < purple; j++) out[Math.floor((j + 0.5) * size / purple)] = 1;
  for (let at = 0; at < size && bombs; at += RUN) {
    const m = Math.min(RUN, size - at), k = Math.round((at + m) * bombs / size) - Math.round(at * bombs / size);
    let pick;
    for (let tries = 0; tries < 1000; tries++) {
      const these = new Set(shuffled([...Array(m).keys()], rnd).slice(0, k));
      pick = [...Array(m).keys()].map(i => these.has(i));
      if (!pick.some((x, i) => i >= 1 && !x && !pick[i - 1])) break;
    }
    pick.forEach((x, i) => { if (x) out[at + i] += 2; });
  }
  return out;
}
// Stock entries (in seed order), each kind shuffled once with a fixed
// seed, so the tool always makes the same file, then put in stockSlots'
// places. With no bombs, the order is 3.3-3.8's (no purple either: 3.0's).
// Throws when the entries don't fit the places (stockSlots puts a purple
// or plain one on each place, so the purple bomb puzzles must be as many
// as the places both purple and bombs).
export function stockOrder(setup, list) {
  const slots = stockSlots(setup, list.length, list.filter(isPurple).length, list.filter(hasBomb).length);
  const rnd = mulberry32(firstSeed(setup) + 1);
  const by = [0, 1, 2, 3].map(k => shuffled(list.filter(e => kindOf(e) === k), rnd));
  by.forEach((g, k) => { const want = slots.filter(x => x === k).length; if (g.length !== want) throw new Error(`${setup}: ${g.length} puzzles of kind ${k} (purple 1, bomb 2), places for ${want}`); });
  return slots.map(k => by[k].shift());
}
// How many of each kind a stock of `size` needs (the tool makes these).
export function stockKinds(setup, size = stockSize(setup)) {
  const slots = stockSlots(setup, size, Math.round(size * stockPurple(setup) / stockSize(setup)), Math.round(size * stockBombs(setup) / stockSize(setup)));
  return [0, 1, 2, 3].map(k => slots.filter(x => x === k).length);
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
  // a bomb: A-D colour 1 pointing up, right, down, left; E-H colour 2
  for (const [r, c, k, d] of p.bombs ?? []) b[r * p.n + c] = String.fromCharCode(65 + (k === 2 ? 4 : 0) + d);
  return [p.seed, p.lamps.map(l => [l.side, l.k]), b.join(''), p.cheapest, p.answer.map(a => `${a.r * p.n + a.c}${a.t}${a.o}`).join(' ')];
}
// A stock entry as a puzzle. Throws, saying why, when it isn't one
// (problems).
export function decode(setup, e) {
  const { n, lasers } = parseSetup(setup);
  const [seed, lamps, board, cost, answer] = Array.isArray(e) ? e : [];
  const p = { setup, seed, n, lamps: [], walls: [], gems: [], bombs: [], cheapest: cost, budget: cost + MARGIN, answer: [] };
  try {
    p.lamps = lamps.map(([side, k], i) => ({ side, k, c: i + 1 }));
    [...board].forEach((x, i) => {
      if (x === '#') p.walls.push([Math.floor(i / n), i % n]);
      else if (/[123]/.test(x)) p.gems.push([Math.floor(i / n), i % n, Number(x)]);
      else if (/[A-H]/.test(x)) { const v = x.charCodeAt(0) - 65; p.bombs.push([Math.floor(i / n), i % n, v >= 4 ? 2 : 1, v % 4]); }
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
  if (typeof p.boardText === 'string' && (p.boardText.length !== n * n || /[^.#123A-H]/.test(p.boardText))) out.push(`the board isn't ${n}×${n} squares`);
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
// square gets one ('/'); the other kind of piece is swapped for it,
// facing the same way (3.7; developer: until then it had to be tapped
// off first); a piece turns ('\'); a '\' piece comes off, its price back.
// Walls, gems and a hint's pieces can't be changed. Any change switches
// every laser off, mends a broken one and clears a faint beam.
export function tapSquare(g, p, i, sel) {
  if (g.result) return { ok: false, why: 'over' };
  const code = boardOf(p)[i];
  if (code === '#') return { ok: false, why: 'wall' };
  if (code === 'G') return { ok: false, why: 'gem' };
  if (code === 'B') return { ok: false, why: 'bomb' };
  if (g.fixed.includes(i)) return { ok: false, why: 'fixed' };
  const pc = pieceOf(g.pieces[i]);
  let did;
  if (!pc) { g.pieces[i] = `${sel}0`; did = 'put'; }
  else if (pc.t !== sel) { g.pieces[i] = `${sel}${pc.o}`; did = 'swap'; }
  else if (pc.o === 0) { g.pieces[i] = `${pc.t}1`; did = 'turn'; }
  else { g.pieces[i] = ''; did = 'off'; }
  lightsOff(g);
  return { ok: true, did, t: sel, ...(did === 'swap' ? { was: pc.t } : {}) };
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
  // with bombs, the lasers on change what a beam can reach,
  // so a failure holds only for the same lasers on
  g.failed.push(!(p.bombs ?? []).length && (res.unlit.length || res.wrong.length || res.hits.size) ? `${li}` : key);
  for (const h of res.hits) { if (!g.broken.includes(h)) g.broken.push(h); g.on = g.on.filter(x => x !== h); }
  g.miss = { li, others };
  return { did: 'on', res, others };
}

// An order of switching the lasers on that solves it with `placed`.
export function workingOrder(p, placed) {
  return lampOrders(p).find(o => inOrder(p, placed, o)) ?? p.lamps.map((l, li) => li);
}

// The words for a laser's beam that wasn't right (three lines at most).
const COLOUR = ['', 'red', 'blue'];
export const lampName = (p, li) => (p.lamps.length > 1 ? COLOUR[p.lamps[li].c] : '');
export function missWords(p, res, li) {
  const two = p.lamps.length > 1, name = lampName(p, li), other = two ? lampName(p, 1 - li) : '', bits = [];
  if (res.hits.size) bits.push(res.hits.size > 1 ? 'it broke both lasers' : res.hits.has(li) ? (two ? 'it shone back into its own laser' : 'the beam shone back into the laser') : `it broke the ${other} laser`);
  if (res.unlit.length) bits.push(two ? `no ${name} on ${res.unlit.length} 💎` : `${res.unlit.length} 💎 not lit`);
  if (res.wrong.length) bits.push(`${name} on ${res.wrong.length} ${other} 💎`);
  if (res.blocked?.some(x => x.why === 'colour')) bits.push(`it stopped at the ${other} booster`);
  if (res.blocked?.some(x => x.why === 'side')) bits.push('it reached a booster from the side, not through its open end');
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
  g.on = workingOrder(p, answerMap(a, p.n)); g.broken = []; g.failed = []; g.miss = null;
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
  return { ...g, pieces, fixed: [], on: workingOrder(p, answerMap(best, p.n)), broken: [], failed: [], miss: null };
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

// { runs: { setup: { no, at, savings, hearts, cur, visit } }, best: {
// setup: savings } }: run `no`'s next puzzle is `at` (0-9); `hearts` the
// Try agains left (3.2: a run kept before has HEARTS); `cur` the puzzle
// under way, as left (a kept game), or null, and `visit` the visit it was
// left in (3.11; src/core/resume.js visitTag). Anything unreadable counts
// as nothing.
export function readProgress(text) {
  const out = { runs: {}, best: {} };
  let v = null;
  try { v = JSON.parse(text ?? 'null'); } catch { return out; }
  for (const s of SETUPS) {
    const r = v?.runs?.[s], b = v?.best?.[s];
    if (r && Number.isInteger(r.no) && r.no >= 0 && Number.isInteger(r.at) && r.at >= 0 && r.at < RUN && Number.isFinite(r.savings)) {
      const hearts = Number.isInteger(r.hearts) && r.hearts >= 0 && r.hearts <= HEARTS ? r.hearts : HEARTS;
      out.runs[s] = { no: r.no, at: r.at, savings: r.savings, hearts, cur: r.cur && typeof r.cur === 'object' ? r.cur : null };
      if (out.runs[s].cur && typeof r.visit === 'string') out.runs[s].visit = r.visit;
    }
    if (Number.isFinite(b)) out.best[s] = b;
  }
  return out;
}
export const runOf = (prog, setup) => prog.runs[setup] ?? { no: 0, at: 0, savings: 0, hearts: HEARTS, cur: null };

// Keeps the puzzle under way in its run (after every change), so it comes
// back as left in the same `visit`.
export function keepCurrent(prog, setup, g, visit) {
  const { visit: _, ...r } = runOf(prog, setup);
  prog.runs[setup] = g.result ? { ...r, cur: null } : { ...r, cur: snapshotGame(g), visit };
}

// The puzzles under way left in another visit dropped (3.11; developer:
// going to the home page, a restart or a new version should "start
// fresh"): Play! then starts that puzzle again on a clean board, with
// nothing it cost counted (developer: "Same puzzle, clean board, coins
// back"). Nothing spent on it had reached the savings; Try agains used on
// it stay used. Returns the setups whose puzzle was dropped.
export function dropOtherVisits(prog, visit) {
  const dropped = [];
  for (const [s, r] of Object.entries(prog.runs)) {
    if (!r.cur || r.visit === visit) continue;
    const { visit: _, ...rest } = r;
    prog.runs[s] = { ...rest, cur: null };
    dropped.push(s);
  }
  return dropped;
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
  } else prog.runs[setup] = { no: r.no, at: r.at + 1, savings, hearts: r.hearts, cur: null };
  return { savings, done, best, run: prog.runs[setup] };
}
