// Snakes and Ladders rules. No DOM or UI code: the screens live in src/ui/.
//
// Agreed 2026-10-05 from mockup v3 (journal). The board is 6 across by 6 up,
// squares 1 to 36 snaking back and forth from the bottom left; 36 (top
// left) is the goal. Both pieces start on square 1. A turn: roll the die
// (1-6), hop one square per dot; reaching 36 needs the exact number, extra
// dots hop back from it. Landing on a ladder's foot climbs it; on a snake's
// head slides down to its tail. Whoever lands on 36 wins; no ties.
//
// Every round gets a new board (makeBoard), made to rules that keep it
// tidy and kind (BOARD_RULES). A match is a plain object, as in the other
// games; everything here is a pure function of its inputs or mutates only
// the match passed in. Players are 1 and 2.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter };

export const COLS = 6;
export const ROWS = 6;
export const GOAL = COLS * ROWS;
export const SIDES = 6;   // the die

// The board maker's rules (developer and Claude, 2026-10-05, mockups v2-v3):
//   count       ladders, and snakes, per board
//   minMove     each ladder or snake moves you at least this many squares
//   maxRows     ...and spans 1 to this many rows; never more columns
//               sideways than rows (none lie flat)
//   minGap      none closer to another than this (in squares), so none cross
//   snakeShare  the snakes together take away this share of what the
//               ladders give: never meaner than kind
// Also: never on square 1 or the goal, no square used twice (so a ladder
// never ends on a snake's head), and no snake in the last row (bouncing
// back from the goal shouldn't also slide you down).
export const BOARD_RULES = { count: 4, minMove: 5, maxRows: 2, minGap: 0.45, snakeShare: [0.6, 0.9] };

// Square n's row (0 = bottom) and column (0 = left).
export function cell(n) {
  const r = Math.floor((n - 1) / COLS), i = (n - 1) % COLS;
  return { r, c: r % 2 ? COLS - 1 - i : i };
}
export const numAt = (r, c) => r * COLS + (r % 2 ? COLS - 1 - c : c) + 1;
// The middle of square n, in squares from the board's top left corner.
export function centre(n) {
  const { r, c } = cell(n);
  return { x: c + 0.5, y: ROWS - 1 - r + 0.5 };
}

// The shortest distance between two line segments ([p, q] each), 0 if
// they cross.
export function segDist(a, b) {
  const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
  const dot = (p, q) => p.x * q.x + p.y * q.y, cross = (p, q) => p.x * q.y - p.y * q.x;
  const d1 = sub(a[1], a[0]), d2 = sub(b[1], b[0]), w = sub(b[0], a[0]), den = cross(d1, d2);
  if (den !== 0) {
    const t = cross(w, d2) / den, u = cross(w, d1) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  const toSeg = (p, s) => {
    const d = sub(s[1], s[0]), t = Math.max(0, Math.min(1, dot(sub(p, s[0]), d) / dot(d, d)));
    return Math.hypot(p.x - s[0].x - d.x * t, p.y - s[0].y - d.y * t);
  };
  return Math.min(toSeg(a[0], b), toSeg(a[1], b), toSeg(b[0], a), toSeg(b[1], a));
}

// What the ladders give and the snakes take away, in squares.
export function boardTotals({ ladders, snakes }) {
  const sum = (o, f) => Object.entries(o).reduce((t, [a, b]) => t + f(Number(a), b), 0);
  return { gain: sum(ladders, (lo, hi) => hi - lo), loss: sum(snakes, (hi, lo) => hi - lo) };
}

// The rules a board breaks, as a list of short descriptions ([] if none).
// makeBoard only returns boards with none; the tests also feed it broken
// ones to prove each check can fail.
export function checkBoard(board, rules = BOARD_RULES) {
  const broken = [];
  const items = [
    ...Object.entries(board.ladders).map(([lo, hi]) => ({ kind: 'ladder', lo: Number(lo), hi })),
    ...Object.entries(board.snakes).map(([hi, lo]) => ({ kind: 'snake', lo, hi: Number(hi) })),
  ];
  for (const kind of ['ladder', 'snake']) {
    const n = items.filter(it => it.kind === kind).length;
    if (n !== rules.count) broken.push(`${n} ${kind}s, not ${rules.count}`);
  }
  const used = new Map();
  for (const it of items) {
    const name = `${it.kind} ${it.kind === 'ladder' ? `${it.lo}-${it.hi}` : `${it.hi}-${it.lo}`}`;
    for (const n of [it.lo, it.hi]) {
      if (!Number.isInteger(n) || n < 1 || n > GOAL) broken.push(`${name}: square ${n} is off the board`);
      if (n === 1 || n === GOAL) broken.push(`${name}: on square ${n}`);
      if (used.has(n)) broken.push(`${name}: square ${n} also used by ${used.get(n)}`);
      used.set(n, name);
    }
    if (it.hi - it.lo < rules.minMove) broken.push(`${name}: moves only ${it.hi - it.lo}`);
    const a = cell(it.lo), b = cell(it.hi), rows = b.r - a.r;
    if (rows < 1 || rows > rules.maxRows) broken.push(`${name}: spans ${rows} rows`);
    if (Math.abs(b.c - a.c) > rows) broken.push(`${name}: lies flat`);
    if (it.kind === 'snake' && b.r === ROWS - 1) broken.push(`${name}: head in the last row`);
    it.name = name;
    it.seg = [centre(it.lo), centre(it.hi)];
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (segDist(items[i].seg, items[j].seg) < rules.minGap) broken.push(`${items[i].name} too close to ${items[j].name}`);
    }
  }
  const { gain, loss } = boardTotals(board);
  const [lo, hi] = rules.snakeShare;
  if (loss < gain * lo || loss > gain * hi) broken.push(`snakes take ${loss} of the ladders' ${gain}`);
  return broken;
}

// A new random board: { ladders: { foot: top }, snakes: { head: tail },
// tries }. Places ladders then snakes one at a time, each where the rules
// allow, and starts again if one won't fit or the totals are off.
// Throws if no board is found (never seen: a board takes ~1 ms).
export function makeBoard(rand = Math.random, rules = BOARD_RULES) {
  const pickInt = n => Math.min(n - 1, Math.floor(rand() * n));
  for (let tries = 1; tries <= 5000; tries++) {
    const used = new Set([1, GOAL]), ladders = {}, snakes = {}, segs = [];
    let ok = true;
    for (let k = 0; k < 2 * rules.count && ok; k++) {
      const isLadder = k < rules.count;
      let placed = false;
      for (let t = 0; t < 300 && !placed; t++) {
        const lo = 2 + pickInt(GOAL - 2), { r, c } = cell(lo);
        const rows = 1 + pickInt(rules.maxRows), hr = r + rows, hc = c + pickInt(2 * rows + 1) - rows;
        if (hr > ROWS - 1 || hc < 0 || hc >= COLS) continue;
        if (!isLadder && hr === ROWS - 1) continue;
        const hi = numAt(hr, hc);
        if (hi >= GOAL || hi - lo < rules.minMove || used.has(lo) || used.has(hi)) continue;
        const seg = [centre(lo), centre(hi)];
        if (segs.some(s => segDist(s, seg) < rules.minGap)) continue;
        used.add(lo); used.add(hi); segs.push(seg);
        if (isLadder) ladders[lo] = hi; else snakes[hi] = lo;
        placed = true;
      }
      ok = placed;
    }
    if (!ok) continue;
    const { gain, loss } = boardTotals({ ladders, snakes });
    if (loss >= gain * rules.snakeShare[0] && loss <= gain * rules.snakeShare[1]) return { ladders, snakes, tries };
  }
  throw new Error('makeBoard: no board found');
}

export const rollDie = (rand = Math.random) => 1 + Math.min(SIDES - 1, Math.floor(rand() * SIDES));

// Checks the setup screen's picks (players.js checkFaces). Against the
// robot, player 2's pick is ignored (it's always the robot).
export const checkFaces = ({ vsRobot, p1, p2 }) => checkPicks({ onePlayer: vsRobot, p1, p2 });

// A new match: games won 0-0, player 1 starts the first round. Throws if
// the picks aren't valid (the screen keeps "Play!" greyed until they are).
export function createMatch({ vsRobot, p1, p2, firstRule }) {
  const why = checkFaces({ vsRobot, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  return {
    vsRobot: !!vsRobot,
    faces: [p1, vsRobot ? ROBOT : p2],
    firstRule,
    scores: { 1: 0, 2: 0 },
    starter: 1,
    board: null,
    pos: { 1: 1, 2: 1 },
    turn: 1,
    moves: 0,
    result: null,
  };
}

// A new board, both pieces on 1; the match's starter goes first. Also
// "Play again": mid-round, that restarts the round unscored, with the same
// starter (the starter only changes when a round finishes).
export function newRound(match, rand = Math.random) {
  match.board = makeBoard(rand);
  match.pos = { 1: 1, 2: 1 };
  match.turn = match.starter;
  match.moves = 0;
  match.result = null;
}

// The player whose turn it is moves `roll` squares.
// Returns { ok: true, player, roll, path, bounced, jump, at, result } or
// { ok: false, why } where why is 'round-over' or 'bad-roll'.
//   path     every square hopped onto, in order (one per dot)
//   bounced  true if extra dots took it back from the goal
//   jump     { kind: 'ladder' | 'snake', from, to } or null
//   at       where it ends up
//   result   { winner } when that move landed on the goal, else null
// Then the turn passes (or, on a win, the round is scored and the next
// starter chosen).
export function move(match, roll) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (!Number.isInteger(roll) || roll < 1 || roll > SIDES) return { ok: false, why: 'bad-roll' };
  const player = match.turn;
  const path = [];
  let at = match.pos[player], dir = 1, bounced = false;
  for (let k = 0; k < roll; k++) {
    if (at === GOAL) { dir = -1; bounced = true; }
    at += dir;
    path.push(at);
  }
  let jump = null;
  const { ladders, snakes } = match.board;
  if (ladders[at]) jump = { kind: 'ladder', from: at, to: ladders[at] };
  else if (snakes[at]) jump = { kind: 'snake', from: at, to: snakes[at] };
  if (jump) at = jump.to;
  match.pos[player] = at;
  match.moves++;
  if (at === GOAL) {
    match.result = { winner: player };
    match.scores[player]++;
    match.starter = nextStarter(match.starter, player, match.firstRule);
  } else {
    match.turn = 3 - player;
  }
  return { ok: true, player, roll, path, bounced, jump, at, result: match.result };
}
