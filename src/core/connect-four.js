// Connect Four rules. No DOM or UI code: the screens live in src/ui/.
//
// Built like tic-tac-toe.js: a match is a plain object (players' faces,
// who-goes-first rule, scores, the current round), and everything here is
// a pure function of its inputs or mutates only the match passed in, so a
// networked mode could later drive the same rules (DESIGN.md, journal Q1).
//
// The board is 7 columns by 6 rows. Spots are numbered row by row from the
// top: spot = row * COLS + col, row 0 is the top row. A piece dropped in a
// column lands in its lowest empty spot. Players are 1 and 2; empty is 0.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter };

export const COLS = 7;
export const ROWS = 6;
export const SIZE = COLS * ROWS;

// Every line of 4 spots: across, down, and both diagonals (69 in all).
export const LINES = (() => {
  const lines = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const er = r + 3 * dr, ec = c + 3 * dc;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        lines.push([0, 1, 2, 3].map(k => (r + k * dr) * COLS + (c + k * dc)));
      }
    }
  }
  return lines;
})();
// The lines through each spot, for checking around one piece quickly.
const LINES_AT = Array.from({ length: SIZE }, (_, i) => LINES.filter(l => l.includes(i)));

export const emptyBoard = () => Array(SIZE).fill(0);

// The spot a piece dropped in `col` would land in, or -1 if the column is
// full.
export function landingSpot(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r * COLS + col]) return r * COLS + col;
  }
  return -1;
}

// The columns that still have room, left to right.
export const openColumns = board => [...Array(COLS).keys()].filter(c => !board[c]);

// null while the round is still going; otherwise { winner, line }.
// winner 0 is a tie (line is then empty). `line` is every spot in a
// winning line, in board order: one move can finish two lines at once (or
// make 5 in a row), and all of them light up.
export function outcome(board) {
  let winner = 0;
  const spots = new Set();
  for (const line of LINES) {
    const p = board[line[0]];
    if (p && line.every(i => board[i] === p)) {
      winner = p;
      for (const i of line) spots.add(i);
    }
  }
  if (winner) return { winner, line: [...spots].sort((a, b) => a - b) };
  return board.every(Boolean) ? { winner: 0, line: [] } : null;
}

// True if player p would complete a line by having a piece at `spot`.
function winsAt(board, spot, p) {
  return LINES_AT[spot].some(line => line.every(i => i === spot || board[i] === p));
}

// Checks the setup screen's picks (players.js checkFaces). Against the
// robot, player 2's pick is ignored (it's always the robot).
export const checkFaces = ({ vsRobot, p1, p2 }) => checkPicks({ onePlayer: vsRobot, p1, p2 });

// A new match: scores 0-0, player 1 starts the first round. Throws if the
// picks aren't valid (the screen keeps "Play!" greyed until they are).
export function createMatch({ vsRobot, p1, p2, firstRule }) {
  const why = checkFaces({ vsRobot, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  return {
    vsRobot: !!vsRobot,
    faces: [p1, vsRobot ? ROBOT : p2],
    firstRule,
    scores: { 1: 0, 2: 0, ties: 0 },
    starter: 1,
    board: emptyBoard(),
    turn: 1,
    result: null,
  };
}

// Empties the board for a round; the match's starter goes first. Also
// "Play again": mid-round, that restarts the round unscored, with the same
// starter (the starter only changes when a round finishes).
export function newRound(match) {
  match.board = emptyBoard();
  match.turn = match.starter;
  match.result = null;
}

// The player whose turn it is drops a piece in `col`.
// Returns { ok: true, spot } or { ok: false, why } where why is
// 'round-over', 'bad-column' or 'full'.
// When the move ends the round: scores it, sets match.result and picks the
// next round's starter.
export function drop(match, col) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return { ok: false, why: 'bad-column' };
  const spot = landingSpot(match.board, col);
  if (spot < 0) return { ok: false, why: 'full' };
  match.board[spot] = match.turn;
  const result = outcome(match.board);
  if (result) {
    match.result = result;
    if (result.winner) match.scores[result.winner]++;
    else match.scores.ties++;
    match.starter = nextStarter(match.starter, result.winner, match.firstRule);
  } else {
    match.turn = 3 - match.turn;
  }
  return { ok: true, spot };
}

// The robot is beatable on purpose ("not too aggressive", as in
// tic-tac-toe): it takes a win only some of the time, blocks only some of
// the time, only sometimes notices that a move would let the other player
// win on top of it, and otherwise plays at random, leaning towards the
// middle columns. Tunable.
export const ROBOT_TUNING = { takeWin: 0.75, block: 0.55, avoidGift: 0.5 };
// How much the robot likes each column when it plays at random.
export const COLUMN_WEIGHTS = [1, 2, 3, 4, 3, 2, 1];

// The first open column where player p would win at once, or null.
function winningColumn(board, cols, p) {
  for (const c of cols) if (winsAt(board, landingSpot(board, c), p)) return c;
  return null;
}

// True if dropping in `col` would let the other player win by dropping on
// top of it.
function givesAWin(board, col, me) {
  const spot = landingSpot(board, col);
  if (spot < COLS) return false;    // the top row: nothing can go above it
  const b = board.slice();
  b[spot] = me;
  return winsAt(b, spot - COLS, 3 - me);
}

// Picks the robot's column. `rand` returns numbers in [0, 1); tests pass a
// fixed sequence so they're repeatable. Returns { col, reason } where
// reason is 'win', 'block', 'safe' (random, but avoiding columns that
// would hand over a win) or 'random' (for the debug log).
export function robotMove(board, me, rand = Math.random, tuning = ROBOT_TUNING) {
  const cols = openColumns(board);
  if (!cols.length) throw new Error('robotMove: the board is full');
  const win = winningColumn(board, cols, me);
  if (win !== null && rand() < tuning.takeWin) return { col: win, reason: 'win' };
  const block = winningColumn(board, cols, 3 - me);
  if (block !== null && rand() < tuning.block) return { col: block, reason: 'block' };
  let choices = cols;
  let reason = 'random';
  const safe = cols.filter(c => !givesAWin(board, c, me));
  if (safe.length && safe.length < cols.length && rand() < tuning.avoidGift) {
    choices = safe;
    reason = 'safe';
  }
  return { col: weightedPick(choices, rand()), reason };
}

// One of `cols`, chosen by COLUMN_WEIGHTS; r is in [0, 1).
function weightedPick(cols, r) {
  const total = cols.reduce((s, c) => s + COLUMN_WEIGHTS[c], 0);
  let x = r * total;
  for (const c of cols) {
    x -= COLUMN_WEIGHTS[c];
    if (x < 0) return c;
  }
  return cols[cols.length - 1];
}
