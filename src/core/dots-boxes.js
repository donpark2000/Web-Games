// Dots and Boxes rules. No DOM or UI code: the screens live in src/ui/.
//
// Built like nim.js: a match is a plain object (players' faces,
// who-goes-first rule, how hard, the board size, games won, the current
// round), and everything here is a pure function of its inputs or mutates
// only the match passed in.
//
// A board of n x n boxes, (n + 1) x (n + 1) dots. On your turn you draw
// one line between two dots next to each other. A line that closes a box
// (its fourth side) wins it, and you go again; otherwise the turn passes,
// so one turn can be several lines (match.turnLines).
// When every box is won, whoever has more wins (developer, 2026-10-24).
// Players are 1 and 2.
//
// Lines: h[r][c] is the line across from dot (r, c) to (r, c + 1), r in
// 0..n, c in 0..n-1; v[r][c] the line down from dot (r, c) to (r + 1, c),
// r in 0..n-1, c in 0..n. Each holds 0 (not drawn) or the player who drew
// it. boxes[r][c]: 0, or the player who won it. A line is { k: 'h' or
// 'v', r, c }.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter };

// Boxes per side (developer, 2026-10-24: "5x5 and 7x7"). Both odd, so a
// round can't be a tie.
export const SIZES = [5, 7];
export const LEVELS = ['easy', 'hard'];

// How often the Easy robot draws a line that gives no box away when it
// could (the rest of the time, any line). It always takes a box it can
// (release 4.2; until then 80% of the time: see robotMove).
export const ROBOT_TUNING = { easySafe: 0.7 };

const grid = (rows, cols) => Array.from({ length: rows }, () => Array(cols).fill(0));

// An empty board of n x n boxes.
export function freshBoard(n) {
  return { n, h: grid(n + 1, n), v: grid(n, n + 1), boxes: grid(n, n) };
}

// Checks the setup screen's picks (players.js checkFaces). Against the
// robot, player 2's pick is ignored (it's always the robot).
export const checkFaces = ({ vsRobot, p1, p2 }) => checkPicks({ onePlayer: vsRobot, p1, p2 });

// A new match: games won 0-0, player 1 starts the first round. Throws if
// the picks aren't valid (the screen keeps "Play!" greyed until they are).
// `level` only matters against the robot.
export function createMatch({ vsRobot, p1, p2, firstRule, level = 'easy', size = 5 }) {
  const why = checkFaces({ vsRobot, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  if (!LEVELS.includes(level)) throw new Error(`unknown level: ${level}`);
  if (!SIZES.includes(size)) throw new Error(`unknown size: ${size}`);
  const match = {
    vsRobot: !!vsRobot,
    faces: [p1, vsRobot ? ROBOT : p2],
    firstRule,
    level,
    size,
    scores: { 1: 0, 2: 0 },
    starter: 1,
  };
  newRound(match);
  return match;
}

// A clean board for a round; the match's starter goes first. Also "Play
// again": mid-round, that restarts the round unscored, with the same
// starter (the starter only changes when a round finishes).
export function newRound(match) {
  match.board = freshBoard(match.size);
  match.turn = match.starter;
  match.last = null;     // the last line drawn
  match.closed = [];     // the boxes it closed, as [r, c]
  match.again = false;   // the player whose turn it is just closed a box
  match.turnBy = 0;      // who drew the latest turn's lines
  match.turnLines = [];  // those lines (several when boxes were closed)
  match.result = null;
}

// Is { k, r, c } a line on this board?
export function isLine(board, line) {
  const { n } = board;
  const { k, r, c } = line ?? {};
  if (!Number.isInteger(r) || !Number.isInteger(c)) return false;
  if (k === 'h') return r >= 0 && r <= n && c >= 0 && c < n;
  if (k === 'v') return r >= 0 && r < n && c >= 0 && c <= n;
  return false;
}
export const lineOwner = (board, { k, r, c }) => board[k][r][c];

// The boxes a line is a side of (one at the edge, otherwise two), as [r, c].
export function boxesOf(board, { k, r, c }) {
  const { n } = board;
  const out = [];
  if (k === 'h') {
    if (r > 0) out.push([r - 1, c]);
    if (r < n) out.push([r, c]);
  } else {
    if (c > 0) out.push([r, c - 1]);
    if (c < n) out.push([r, c]);
  }
  return out;
}

// How many of a box's four sides are drawn.
export function sides(board, r, c) {
  return [board.h[r][c], board.h[r + 1][c], board.v[r][c], board.v[r][c + 1]].filter(Boolean).length;
}

// Every line not yet drawn.
export function freeLines(board) {
  const out = [];
  for (const k of ['h', 'v']) {
    board[k].forEach((row, r) => row.forEach((p, c) => { if (!p) out.push({ k, r, c }); }));
  }
  return out;
}

// Boxes won so far this round, per player.
export function boxCounts(board) {
  const n = { 1: 0, 2: 0 };
  for (const row of board.boxes) for (const p of row) if (p) n[p]++;
  return n;
}

// Draws a line on a board for `player` (no turns or scores: the robot's
// look-ahead uses it too). Returns the boxes it closed, as [r, c].
function drawOn(board, line, player) {
  board[line.k][line.r][line.c] = player;
  const closed = boxesOf(board, line).filter(([r, c]) => sides(board, r, c) === 4);
  for (const [r, c] of closed) board.boxes[r][c] = player;
  return closed;
}

// The player whose turn it is draws `line`. Returns { ok: true, closed }
// (the boxes it closed, as [r, c]) or { ok: false, why } where why is
// 'round-over', 'bad-line' or 'already-drawn'.
// A line that closes a box: the same player goes again (match.again);
// otherwise the turn passes. When every box is won: sets match.result to
// { winner, boxes } (winner 0 for a tie, which odd sizes can't have),
// scores it and picks the next round's starter.
export function draw(match, line) {
  if (match.result) return { ok: false, why: 'round-over' };
  const b = match.board;
  if (!isLine(b, line)) return { ok: false, why: 'bad-line' };
  if (lineOwner(b, line)) return { ok: false, why: 'already-drawn' };
  const player = match.turn;
  const closed = drawOn(b, line, player);
  match.last = { k: line.k, r: line.r, c: line.c };
  // The latest turn's lines: a new turn starts a new list (the screen
  // marks the robot's until the person draws; 4.1).
  if (match.turnBy !== player) { match.turnBy = player; match.turnLines = []; }
  match.turnLines.push(match.last);
  match.closed = closed;
  const counts = boxCounts(b);
  if (counts[1] + counts[2] === b.n * b.n) {
    const winner = counts[1] > counts[2] ? 1 : counts[2] > counts[1] ? 2 : 0;
    match.result = { winner, boxes: counts };
    match.again = false;
    if (winner) match.scores[winner]++;
    match.starter = nextStarter(match.starter, winner, match.firstRule);
  } else if (closed.length) {
    match.again = true;
  } else {
    match.again = false;
    match.turn = 3 - player;
  }
  return { ok: true, closed };
}

/* ---------- finding the line under a finger ---------- */

// The line not yet drawn nearest a point, or null when none is within
// `reach`. x, y in boxes from the top-left dot (dot (r, c) is at x = c,
// y = r). The screen uses this so a tap anywhere between two dots draws
// the nearest line (journal, "Dots and Boxes: the rules agreed").
export function nearestLine(board, x, y, reach = 0.75) {
  let best = null, bestD = reach;
  for (const line of freeLines(board)) {
    const d = distanceTo(line, x, y);
    if (d < bestD) { best = line; bestD = d; }
  }
  return best;
}

// From a point to a line (a segment one box long).
export function distanceTo({ k, r, c }, x, y) {
  const [x0, y0, x1, y1] = k === 'h' ? [c, r, c + 1, r] : [c, r, c, r + 1];
  const px = Math.max(Math.min(x, Math.max(x0, x1)), Math.min(x0, x1));
  const py = Math.max(Math.min(y, Math.max(y0, y1)), Math.min(y0, y1));
  return Math.hypot(x - px, y - py);
}

/* ---------- the robot ---------- */

const anyOf = (list, rand) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
const copyBoard = b => ({ n: b.n, h: b.h.map(r => [...r]), v: b.v.map(r => [...r]), boxes: b.boxes.map(r => [...r]) });

// Lines that close a box now, and lines that give none away (no box next
// to them would then have 3 sides).
export const closingLines = board => freeLines(board).filter(l => boxesOf(board, l).some(([r, c]) => sides(board, r, c) === 3));
export const safeLines = board => freeLines(board).filter(l => boxesOf(board, l).every(([r, c]) => sides(board, r, c) < 2));

// How many boxes the other player could take, one after another, after
// `line` is drawn (each box they close gives them another line).
export function givesAway(board, line) {
  const b = copyBoard(board);
  drawOn(b, line, 2);
  let taken = 0;
  for (;;) {
    const next = closingLines(b)[0];
    if (!next) return taken;
    taken += drawOn(b, next, 1).length;
  }
}

// Picks the robot's line. `rand` returns numbers in [0, 1); tests pass a
// fixed one so they're repeatable. Returns { line, reason } (reason for
// the debug log):
//
// Both levels always take a box they can ('take'), so a turn takes every
// box on offer (developer, 2026-10-24, after 4.1: Easy left boxes 1 time
// in 5, and the person who took them then had to open a new run for the
// robot, a trick the kids can't see; 4.2).
//
// Easy: otherwise usually ('easySafe') draws a line that gives no box
// away ('safe'), and the rest of the time any line ('careless'), which
// can hand a box over.
//
// Hard: otherwise gives none away while it
// can; when every line gives some away, the line that gives the fewest
// ('least'). It doesn't know the experts' trick of leaving the last two
// boxes of a run to win the rest (developer, 2026-10-24: Claude's
// suggestion, agreed; to add if Hard is too easy).
export function robotMove(board, level = 'easy', rand = Math.random, tuning = ROBOT_TUNING) {
  const all = freeLines(board);
  if (!all.length) throw new Error('robotMove: no lines left');
  const closing = closingLines(board);
  const safe = safeLines(board);
  if (closing.length) return { line: anyOf(closing, rand), reason: 'take' };
  if (level === 'hard') {
    if (safe.length) return { line: anyOf(safe, rand), reason: 'safe' };
    const cost = all.map(l => givesAway(board, l));
    const least = Math.min(...cost);
    return { line: anyOf(all.filter((_, i) => cost[i] === least), rand), reason: 'least', gives: least };
  }
  if (safe.length && rand() < tuning.easySafe) return { line: anyOf(safe, rand), reason: 'safe' };
  return { line: anyOf(all, rand), reason: 'careless' };
}
