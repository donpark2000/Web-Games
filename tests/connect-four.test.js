import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, SIZE, LINES, emptyBoard, landingSpot, openColumns, outcome,
  checkFaces, createMatch, newRound, drop, robotMove, ROBOT_TUNING, ROBOT,
} from '../src/core/connect-four.js';

// Builds a board from 6 rows of 7 characters, top row first:
// '.' empty, '1'/'2' players.
const B = s => {
  const cells = [...s.replace(/\s/g, '')].map(c => (c === '.' ? 0 : Number(c)));
  assert.equal(cells.length, SIZE, 'test board must have 42 spots');
  return cells;
};
const at = (row, col) => row * COLS + col;
// A rand() that returns the given values in order, then fails loudly.
const seq = (...vals) => () => {
  if (!vals.length) throw new Error('rand called more times than expected');
  return vals.shift();
};
// A small repeatable random source (mulberry32), as in the tic-tac-toe tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const robotMatch = () => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'alt' });

// A full board with no 4 in a row anywhere (found by a search; the
// pattern flips every two rows). Not a board real play would reach, which
// outcome() doesn't need.
const DRAW = `
  1112111
  1112111
  2221222
  2221222
  1112111
  1112111`;

test('lines: 69 lines of 4, each straight and on the board', () => {
  assert.equal(LINES.length, 69);   // 24 across, 21 down, 12 + 12 diagonal
  const seen = new Set();
  for (const line of LINES) {
    assert.equal(line.length, 4);
    const rows = line.map(i => Math.floor(i / COLS)), cols = line.map(i => i % COLS);
    const dr = rows[1] - rows[0], dc = cols[1] - cols[0];
    assert.ok(Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr || dc), `step ${dr},${dc}`);
    for (let k = 1; k < 4; k++) {
      assert.equal(rows[k] - rows[k - 1], dr, `line ${line}`);
      assert.equal(cols[k] - cols[k - 1], dc, `line ${line}`);
    }
    for (const i of line) assert.ok(i >= 0 && i < SIZE);
    seen.add(line.join());
  }
  assert.equal(seen.size, 69, 'no line twice');
});

test('outcome: every line wins, for both players', () => {
  let checked = 0;
  for (const p of [1, 2]) {
    for (const line of LINES) {
      const b = emptyBoard();
      for (const i of line) b[i] = p;
      assert.deepEqual(outcome(b), { winner: p, line }, `player ${p}, line ${line}`);
      checked++;
    }
  }
  assert.equal(checked, 138);
});

test('outcome: 3 in a row is not a win; empty and in-progress boards have no result', () => {
  assert.equal(outcome(emptyBoard()), null);
  assert.equal(outcome(B(`
    .......
    .......
    .......
    .......
    .2.2...
    111.222`)), null);
});

test('outcome: a full board with no 4 in a row is a tie', () => {
  assert.deepEqual(outcome(B(DRAW)), { winner: 0, line: [] });
});

test('outcome: a move that makes two lines at once lights up both', () => {
  // The 1 at the bottom of column 3 finishes a row and a column.
  const r = outcome(B(`
    .......
    .......
    ...1...
    ...1...
    ...1...
    1111222`));
  assert.equal(r.winner, 1);
  assert.deepEqual(r.line, [at(2, 3), at(3, 3), at(4, 3), at(5, 0), at(5, 1), at(5, 2), at(5, 3)]);
});

test('landingSpot and openColumns: pieces land on the lowest empty spot', () => {
  const b = B(`
    ..2....
    ..1....
    ..2....
    ..1....
    ..2....
    1.1....`);
  assert.equal(landingSpot(b, 0), at(4, 0));
  assert.equal(landingSpot(b, 1), at(5, 1));
  assert.equal(landingSpot(b, 2), -1);
  assert.deepEqual(openColumns(b), [0, 1, 3, 4, 5, 6]);
  assert.deepEqual(openColumns(B(DRAW)), []);
});

test('drop: stacks pieces in a column and takes turns; refuses a full or bad column', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'alt' });
  for (let k = 0; k < ROWS; k++) {
    assert.deepEqual(drop(m, 3), { ok: true, spot: at(ROWS - 1 - k, 3) });
  }
  assert.equal(m.turn, 1);
  assert.deepEqual(drop(m, 3), { ok: false, why: 'full' });
  for (const bad of [-1, 7, 2.5, '3', undefined]) {
    assert.deepEqual(drop(m, bad), { ok: false, why: 'bad-column' }, `column ${bad}`);
  }
  assert.equal(m.turn, 1, 'a refused move does not pass the turn');
  assert.equal(m.board.filter(Boolean).length, ROWS);
});

test('drop: 4 in a row wins, scores, and picks the next starter; then the round is over', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'lose' });
  for (const col of [0, 6, 1, 6, 2, 6]) assert.ok(drop(m, col).ok);
  assert.equal(m.result, null);
  assert.deepEqual(drop(m, 3), { ok: true, spot: at(5, 3) });
  assert.deepEqual(m.result, { winner: 1, line: [at(5, 0), at(5, 1), at(5, 2), at(5, 3)] });
  assert.deepEqual(m.scores, { 1: 1, 2: 0, ties: 0 });
  assert.equal(m.starter, 2, 'loser goes first');
  assert.deepEqual(drop(m, 4), { ok: false, why: 'round-over' });
  newRound(m);
  assert.equal(m.turn, 2);
  assert.equal(m.board.filter(Boolean).length, 0);
});

test('drop: filling the board with no winner is a tie; the other player starts next', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'win' });
  m.board = B(DRAW);
  m.board[at(0, 6)] = 0;   // one spot left; it takes a 1
  m.turn = 1;
  assert.equal(drop(m, 6).ok, true);
  assert.deepEqual(m.result, { winner: 0, line: [] });
  assert.deepEqual(m.scores, { 1: 0, 2: 0, ties: 1 });
  assert.equal(m.starter, 2, 'after a tie the other player starts (1 started)');
});

test('newRound mid-round: restarts unscored with the same starter', () => {
  const m = robotMatch();
  drop(m, 3);
  drop(m, 4);
  newRound(m);
  assert.equal(m.starter, 1);
  assert.equal(m.turn, 1);
  assert.deepEqual(m.scores, { 1: 0, 2: 0, ties: 0 });
});

test('createMatch: the robot is player 2; bad picks are refused', () => {
  assert.deepEqual(robotMatch().faces, ['bear', ROBOT]);
  assert.equal(checkFaces({ vsRobot: false, p1: 'cat', p2: 'cat' }), 'same-face');
  assert.throws(() => createMatch({ vsRobot: false, p1: 'cat', p2: 'cat', firstRule: 'alt' }), /same-face/);
  assert.throws(() => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'sometimes' }), /first rule/);
});

test('robotMove: takes a win when the dice say so, otherwise plays on', () => {
  const b = B(`
    .......
    .......
    .......
    .......
    1......
    1.222..`);
  assert.deepEqual(robotMove(b, 2, seq(0)), { col: 1, reason: 'win' });
  // Skipped the win (0.9 > 0.75); no block needed; no gifts to avoid; then random.
  const m = robotMove(b, 2, seq(0.9, 0));
  assert.deepEqual(m, { col: 0, reason: 'random' });
});

test('robotMove: blocks the other player, but not always', () => {
  const b = B(`
    .......
    .......
    .......
    1......
    1......
    1.22...`);
  assert.deepEqual(robotMove(b, 2, seq(0)), { col: 0, reason: 'block' });
  assert.equal(robotMove(b, 2, seq(0.9, 0.999)).reason, 'random');
  // Its own win comes before a block.
  const both = B(`
    .......
    .......
    .......
    1......
    1......
    1222...`);
  assert.deepEqual(robotMove(both, 2, seq(0)), { col: 4, reason: 'win' });
});

test('robotMove: sometimes avoids a column that hands the other player a win', () => {
  // Player 1 has 1 1 1 . on row 4 (second from the bottom); a piece in
  // column 3 now would let 1 drop on top of it and win.
  const b = B(`
    .......
    .......
    .......
    .......
    111....
    221.2..`);
  let gifts = 0, tries = 0;
  for (let r = 0; r < 1; r += 0.01) {
    const m = robotMove(b, 2, seq(r < 0.5 ? 0 : 0.9, r));
    tries++;
    if (m.reason === 'safe') assert.notEqual(m.col, 3, `rand ${r}`);
    if (m.col === 3) gifts++;
  }
  assert.equal(tries, 100);
  assert.ok(gifts > 0, 'when not careful it can still play there');
  // Every column but 3 is safe, so the careful pick is never 3.
  assert.equal(robotMove(b, 2, seq(0, 0.5)).reason, 'safe');
});

test('robotMove: leans towards the middle columns', () => {
  const b = emptyBoard();
  assert.equal(robotMove(b, 2, seq(0)).col, 0);
  assert.equal(robotMove(b, 2, seq(0.5)).col, 3);
  assert.equal(robotMove(b, 2, seq(0.999)).col, 6);
  const counts = Array(COLS).fill(0);
  const rand = seeded(7);
  for (let k = 0; k < 1600; k++) counts[robotMove(b, 2, rand).col]++;
  assert.ok(counts[3] > counts[0] * 2, `middle ${counts[3]} vs edge ${counts[0]}`);
});

test('robotMove: always picks an open column; refuses a full board', () => {
  assert.throws(() => robotMove(B(DRAW), 2), /full/);
  // 200 whole games of robot against robot, seeded: every move is legal and
  // every game ends.
  const rand = seeded(42);
  let moves = 0, ended = 0;
  for (let g = 0; g < 200; g++) {
    const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'alt' });
    while (!m.result) {
      const { col } = robotMove(m.board, m.turn, rand);
      assert.ok(drop(m, col).ok, `game ${g}: column ${col} refused`);
      moves++;
    }
    ended++;
  }
  assert.equal(ended, 200);
  assert.ok(moves >= 200 * 7, `only ${moves} moves`);
});

test('robot tuning: still beatable (takes a win only some of the time)', () => {
  assert.ok(ROBOT_TUNING.takeWin < 1 && ROBOT_TUNING.block < 1 && ROBOT_TUNING.avoidGift < 1);
});
