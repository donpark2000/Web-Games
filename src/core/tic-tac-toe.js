// Tic-tac-toe rules. No DOM or UI code: the screens live in src/ui/.
//
// A match is a plain object (players' faces, who-goes-first rule, scores,
// the current round). Everything here is a pure function of its inputs, or
// mutates only the match passed in, so a networked mode could later drive
// the same rules (DESIGN.md, journal Q1).
//
// Squares are numbered 0-8, left to right, top to bottom.
// Players are 1 and 2; an empty square is 0.

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// The faces a person can pick. The robot is only for the computer.
export const FACE_NAMES = [
  'bear', 'cat', 'dog', 'bunny', 'fox', 'panda', 'pig', 'frog',
  'lion', 'mouse', 'monkey', 'chick', 'girl', 'boy', 'grandma', 'grandpa',
];
export const ROBOT = 'robot';

// Who goes first in the next round: take turns, winner first, loser first.
export const FIRST_RULES = ['alt', 'win', 'lose'];

export const emptyBoard = () => Array(9).fill(0);

// null while the round is still going; otherwise { winner, line }.
// winner 0 is a tie (line is then empty).
export function outcome(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [...line] };
    }
  }
  return board.every(Boolean) ? { winner: 0, line: [] } : null;
}

// Who starts the next round. After a tie the other player starts, whatever
// the rule.
export function nextStarter(starter, winner, rule) {
  if (!winner || rule === 'alt') return 3 - starter;
  return rule === 'win' ? winner : 3 - winner;
}

// Checks the setup screen's picks. Returns '' when they're fine, otherwise
// a reason code the screen turns into words:
//   'p1-missing', 'p2-missing', 'unknown-face', 'same-face'.
// Against the robot, player 2's pick is ignored (it's always the robot).
export function checkFaces({ vsRobot, p1, p2 }) {
  if (!p1) return 'p1-missing';
  if (!FACE_NAMES.includes(p1)) return 'unknown-face';
  if (vsRobot) return '';
  if (!p2) return 'p2-missing';
  if (!FACE_NAMES.includes(p2)) return 'unknown-face';
  if (p1 === p2) return 'same-face';
  return '';
}

// A new match: scores 0-0, player 1 starts the first round.
// Throws if the picks aren't valid (the screen keeps "Play!" greyed until
// they are, so this is a guard, not the normal path).
export function createMatch({ vsRobot, p1, p2, firstRule }) {
  const why = checkFaces({ vsRobot, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  const match = {
    vsRobot: !!vsRobot,
    faces: [p1, vsRobot ? ROBOT : p2],
    firstRule,
    scores: { 1: 0, 2: 0, ties: 0 },
    starter: 1,
    board: emptyBoard(),
    turn: 1,
    result: null,
  };
  return match;
}

// Clears the grid for a round. The match's starter goes first. Called for
// "Play again" too: mid-round, that restarts the round unscored, with the
// same starter (the starter only changes when a round finishes).
export function newRound(match) {
  match.board = emptyBoard();
  match.turn = match.starter;
  match.result = null;
}

// The player whose turn it is takes a square.
// Returns { ok: true } or { ok: false, why } where why is
// 'round-over', 'bad-square' or 'taken'.
// When the move ends the round: scores it, sets match.result and picks the
// next round's starter.
export function place(match, square) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (!Number.isInteger(square) || square < 0 || square > 8) return { ok: false, why: 'bad-square' };
  if (match.board[square]) return { ok: false, why: 'taken' };
  match.board[square] = match.turn;
  const result = outcome(match.board);
  if (result) {
    match.result = result;
    if (result.winner) match.scores[result.winner]++;
    else match.scores.ties++;
    match.starter = nextStarter(match.starter, result.winner, match.firstRule);
  } else {
    match.turn = 3 - match.turn;
  }
  return { ok: true };
}

// The robot is beatable on purpose ("not too aggressive"): it takes a win
// only some of the time, blocks only some of the time, likes the centre,
// and otherwise plays at random. Tunable.
export const ROBOT_TUNING = { takeWin: 0.75, block: 0.55, centre: 0.4 };

// The square that would complete a line for player p, or null.
function finishingSquare(board, p) {
  for (const line of LINES) {
    const vals = line.map(i => board[i]);
    if (vals.filter(v => v === p).length === 2 && vals.includes(0)) return line[vals.indexOf(0)];
  }
  return null;
}

// Picks the robot's square. `rand` returns numbers in [0, 1); tests pass a
// fixed sequence so they're repeatable. Returns { square, reason } where
// reason is 'win', 'block', 'centre' or 'random' (for the debug log).
export function robotMove(board, me, rand = Math.random, tuning = ROBOT_TUNING) {
  const empties = board.flatMap((v, i) => (v ? [] : [i]));
  if (!empties.length) throw new Error('robotMove: the board is full');
  const win = finishingSquare(board, me);
  if (win !== null && rand() < tuning.takeWin) return { square: win, reason: 'win' };
  const block = finishingSquare(board, 3 - me);
  if (block !== null && rand() < tuning.block) return { square: block, reason: 'block' };
  if (!board[4] && rand() < tuning.centre) return { square: 4, reason: 'centre' };
  return { square: empties[Math.floor(rand() * empties.length)], reason: 'random' };
}
