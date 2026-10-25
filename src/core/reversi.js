// Reversi rules (Othello's game, under its old free name). No DOM or UI
// code: the screens live in src/ui/.
//
// Built like dots-boxes.js: a match is a plain object (players' faces,
// who-goes-first rule, how hard, the board size, games won, the current
// round), and everything here is a pure function of its inputs or mutates
// only the match passed in.
//
// An n x n board starts with four discs in the middle. On your turn you
// put down a disc so that one or more straight lines (across, down or
// diagonal) of the other player's discs are trapped between it and one of
// yours; every trapped disc flips to your colour. With no such square you
// pass; when neither player can move, whoever has more discs wins.
// Players are 1 and 2. Whoever starts a round plays black (black always
// moves first; agreed 2026-10-25), so a round's colours are
// match.black and the other.
//
// cells[r * n + c]: 0 (empty) or the player whose disc is there.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter };

// Squares a side (2026-10-25: 6 x 6 for the kids, preselected; 8 x 8 the
// classic board).
export const SIZES = [6, 8];
export const LEVELS = ['easy', 'hard'];

// Easy: how often it plays the move that flips the most (the rest of the
// time, any move), and how often it takes a corner it can. Hard: how many
// moves it looks ahead, and from how many empty squares it works out the
// end exactly.
export const ROBOT_TUNING = { easyGreedy: 0.4, easyCorner: 0.5, depth: 4, exact: 8 };

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

// A board ready to play: the four middle discs, black's (the starter's) on
// the top-right and bottom-left of the four, as on a real board.
export function freshBoard(n, black = 1) {
  const white = 3 - black;
  const cells = Array(n * n).fill(0);
  const m = n / 2;
  cells[(m - 1) * n + (m - 1)] = white;
  cells[m * n + m] = white;
  cells[(m - 1) * n + m] = black;
  cells[m * n + (m - 1)] = black;
  return { n, cells };
}

export const at = (b, r, c) => b.cells[r * b.n + c];
const inside = (n, r, c) => r >= 0 && r < n && c >= 0 && c < n;

// The discs `player` would flip with a disc on (r, c), as [r, c] in order
// out from it along each line (empty when the move isn't allowed).
export function flipsFor(b, r, c, player) {
  const { n, cells } = b;
  if (!inside(n, r, c) || cells[r * n + c]) return [];
  const other = 3 - player;
  const out = [];
  for (const [dr, dc] of DIRS) {
    const run = [];
    let y = r + dr, x = c + dc;
    while (inside(n, y, x) && cells[y * n + x] === other) { run.push([y, x]); y += dr; x += dc; }
    if (run.length && inside(n, y, x) && cells[y * n + x] === player) out.push(...run);
  }
  return out;
}

// Every square `player` can play, as { r, c, flips }.
export function legalMoves(b, player) {
  const out = [];
  for (let r = 0; r < b.n; r++) {
    for (let c = 0; c < b.n; c++) {
      const flips = flipsFor(b, r, c, player);
      if (flips.length) out.push({ r, c, flips });
    }
  }
  return out;
}

export function discCounts(b) {
  const n = { 1: 0, 2: 0 };
  for (const p of b.cells) if (p) n[p]++;
  return n;
}

// Puts `player`'s disc on (r, c) and flips the trapped discs (no turns or
// scores: the robot's look-ahead uses it too). Returns the flipped discs.
function playOn(b, r, c, player) {
  const flips = flipsFor(b, r, c, player);
  b.cells[r * b.n + c] = player;
  for (const [y, x] of flips) b.cells[y * b.n + x] = player;
  return flips;
}

export const checkFaces = ({ vsRobot, p1, p2 }) => checkPicks({ onePlayer: vsRobot, p1, p2 });

// A new match: games won 0-0, player 1 starts (and plays black in) the
// first round. Throws if the picks aren't valid.
export function createMatch({ vsRobot, p1, p2, firstRule, level = 'easy', size = 6 }) {
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

// A fresh board; the starter plays black and goes first. Also "Play
// again": mid-round, that restarts the round unscored, same starter.
export function newRound(match) {
  match.black = match.starter;
  match.board = freshBoard(match.size, match.black);
  match.turn = match.starter;
  match.last = null;     // { r, c, by, flips }: the latest disc put down
  match.passed = 0;      // the player who just had no move (so the other goes again)
  match.result = null;
}

// The player whose turn it is puts a disc on (r, c). Returns
// { ok: true, flips } or { ok: false, why } ('round-over', 'bad-square',
// 'taken', 'no-flips'). Then the other player moves if they can; if not,
// they pass and the same player goes again (match.passed); if neither can,
// the round is over: match.result = { winner (0 for a tie), discs },
// scored, and the next round's starter picked.
export function play(match, r, c) {
  if (match.result) return { ok: false, why: 'round-over' };
  const b = match.board;
  if (!Number.isInteger(r) || !Number.isInteger(c) || !inside(b.n, r, c)) return { ok: false, why: 'bad-square' };
  if (at(b, r, c)) return { ok: false, why: 'taken' };
  const player = match.turn;
  if (!flipsFor(b, r, c, player).length) return { ok: false, why: 'no-flips' };
  const flips = playOn(b, r, c, player);
  match.last = { r, c, by: player, flips };
  const other = 3 - player;
  match.passed = 0;
  if (legalMoves(b, other).length) match.turn = other;
  else if (legalMoves(b, player).length) match.passed = other;
  else finish(match);
  return { ok: true, flips };
}

function finish(match) {
  const discs = discCounts(match.board);
  const winner = discs[1] > discs[2] ? 1 : discs[2] > discs[1] ? 2 : 0;
  match.result = { winner, discs };
  if (winner) match.scores[winner]++;
  match.starter = nextStarter(match.starter, winner, match.firstRule);
}

/* ---------- the robot ---------- */

const anyOf = (list, rand) => list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
const copyBoard = b => ({ n: b.n, cells: [...b.cells] });

// How good a square is to hold, the usual way: corners best (they can
// never be flipped), the squares next to a corner worst (they hand it
// over), edges good.
export function squareWeight(n, r, c) {
  const e = n - 1;
  const edgeR = r === 0 || r === e, edgeC = c === 0 || c === e;
  const nearR = r === 1 || r === e - 1, nearC = c === 1 || c === e - 1;
  if (edgeR && edgeC) return 100;
  if (nearR && nearC) return -50;
  if ((edgeR && nearC) || (edgeC && nearR)) return -20;
  if (edgeR || edgeC) return 10;
  return -1;
}

const isCorner = (n, r, c) => (r === 0 || r === n - 1) && (c === 0 || c === n - 1);

// The position's worth to `player`: squares held (weighted) and how many
// moves each side has; a finished board by its discs alone.
function worth(b, player) {
  const other = 3 - player;
  let w = 0;
  for (let r = 0; r < b.n; r++) {
    for (let c = 0; c < b.n; c++) {
      const p = b.cells[r * b.n + c];
      if (p) w += (p === player ? 1 : -1) * squareWeight(b.n, r, c);
    }
  }
  const mine = legalMoves(b, player).length, theirs = legalMoves(b, other).length;
  return w + 5 * (mine - theirs);
}

const discDiff = (b, player) => { const d = discCounts(b); return d[player] - d[3 - player]; };

// Looks `depth` moves ahead (alpha-beta), each side playing its best by
// `worth`; at the end of the game by discs (counted far above any worth).
function search(b, player, depth, alpha, beta, exact) {
  const moves = legalMoves(b, player);
  if (!moves.length) {
    if (!legalMoves(b, 3 - player).length) return 10000 * Math.sign(discDiff(b, player)) + discDiff(b, player);
    return -search(b, 3 - player, depth, -beta, -alpha, exact);   // a pass
  }
  if (depth <= 0 && !exact) return worth(b, player);
  let best = -Infinity;
  for (const m of moves) {
    const next = copyBoard(b);
    playOn(next, m.r, m.c, player);
    const v = -search(next, 3 - player, depth - 1, -beta, -alpha, exact);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

// Picks the robot's move. `rand` returns numbers in [0, 1); tests pass a
// fixed one so they're repeatable. Returns { r, c, reason } (reason for
// the debug log):
//
// Easy plays loosely: sometimes takes a corner it can ('corner'),
// sometimes the move that flips the most ('most'), otherwise any move
// ('any').
//
// Hard looks ROBOT_TUNING.depth moves ahead, valuing corners and edges and
// keeping its own moves open ('ahead'); with ROBOT_TUNING.exact empty
// squares or fewer it plays the end out exactly ('exact').
export function robotMove(b, player, level = 'easy', rand = Math.random, tuning = ROBOT_TUNING) {
  const moves = legalMoves(b, player);
  if (!moves.length) throw new Error('robotMove: no moves');
  if (level === 'hard') {
    const empty = b.cells.filter(p => !p).length;
    const exact = empty <= tuning.exact;
    let best = -Infinity, picks = [];
    for (const m of moves) {
      const next = copyBoard(b);
      playOn(next, m.r, m.c, player);
      const v = -search(next, 3 - player, tuning.depth - 1, -Infinity, Infinity, exact);
      if (v > best) { best = v; picks = [m]; } else if (v === best) picks.push(m);
    }
    const m = anyOf(picks, rand);
    return { r: m.r, c: m.c, reason: exact ? 'exact' : 'ahead', value: best };
  }
  const corners = moves.filter(m => isCorner(b.n, m.r, m.c));
  if (corners.length && rand() < tuning.easyCorner) { const m = anyOf(corners, rand); return { r: m.r, c: m.c, reason: 'corner' }; }
  if (rand() < tuning.easyGreedy) {
    const most = Math.max(...moves.map(m => m.flips.length));
    const m = anyOf(moves.filter(x => x.flips.length === most), rand);
    return { r: m.r, c: m.c, reason: 'most' };
  }
  const m = anyOf(moves, rand);
  return { r: m.r, c: m.c, reason: 'any' };
}
