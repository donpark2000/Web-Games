import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINES, FACE_NAMES, ROBOT, FIRST_RULES, emptyBoard, outcome, nextStarter,
  checkFaces, createMatch, newRound, place, robotMove, ROBOT_TUNING,
} from '../src/core/tic-tac-toe.js';

// Builds a board from a 9-character string: '.' empty, '1'/'2' players.
const B = s => [...s.replace(/\s/g, '')].map(c => (c === '.' ? 0 : Number(c)));
// A rand() that returns the given values in order, then fails loudly.
const seq = (...vals) => () => {
  if (!vals.length) throw new Error('rand called more times than expected');
  return vals.shift();
};
// A small repeatable random source (mulberry32).
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  assert.equal(checked, 16);
});

test('outcome: empty and in-progress boards have no result', () => {
  assert.equal(outcome(emptyBoard()), null);
  assert.equal(outcome(B('12. .1. 2..')), null);
  assert.equal(outcome(B('112 221 11.')), null);   // one square left, no line
});

test('outcome: a full board with no line is a tie; a full board with a line is a win', () => {
  assert.deepEqual(outcome(B('121 112 212')), { winner: 0, line: [] });
  assert.deepEqual(outcome(B('111 221 212')), { winner: 1, line: [0, 1, 2] });
});

test('nextStarter: all three rules, after a win by either player and after a tie', () => {
  // [starter, winner, rule] -> next starter
  const cases = [
    [1, 1, 'alt', 2], [1, 2, 'alt', 2], [2, 1, 'alt', 1], [2, 2, 'alt', 1],
    [1, 1, 'win', 1], [1, 2, 'win', 2], [2, 1, 'win', 1], [2, 2, 'win', 2],
    [1, 1, 'lose', 2], [1, 2, 'lose', 1], [2, 1, 'lose', 2], [2, 2, 'lose', 1],
  ];
  for (const [s, w, rule, want] of cases) assert.equal(nextStarter(s, w, rule), want, `${s} ${w} ${rule}`);
  // After a tie the other player starts, whatever the rule.
  for (const rule of FIRST_RULES) {
    assert.equal(nextStarter(1, 0, rule), 2, `tie, ${rule}`);
    assert.equal(nextStarter(2, 0, rule), 1, `tie, ${rule}`);
  }
});

test('faces: 16 to pick from; the robot is not one of them', () => {
  assert.equal(FACE_NAMES.length, 16);
  assert.equal(new Set(FACE_NAMES).size, 16);
  assert.ok(!FACE_NAMES.includes(ROBOT));
});

test('checkFaces: both players can never have the same face', () => {
  assert.equal(checkFaces({ vsRobot: false, p1: 'cat', p2: 'cat' }), 'same-face');
  assert.equal(checkFaces({ vsRobot: false, p1: 'cat', p2: 'dog' }), '');
});

test('checkFaces: missing and unknown picks; the robot cannot be picked', () => {
  assert.equal(checkFaces({ vsRobot: true, p1: null }), 'p1-missing');
  assert.equal(checkFaces({ vsRobot: false, p1: null, p2: 'dog' }), 'p1-missing');
  assert.equal(checkFaces({ vsRobot: false, p1: 'dog', p2: null }), 'p2-missing');
  assert.equal(checkFaces({ vsRobot: false, p1: 'dog', p2: ROBOT }), 'unknown-face');
  assert.equal(checkFaces({ vsRobot: true, p1: ROBOT }), 'unknown-face');
  assert.equal(checkFaces({ vsRobot: true, p1: 'dragon' }), 'unknown-face');
  // Against the robot, player 2's leftover pick doesn't matter.
  assert.equal(checkFaces({ vsRobot: true, p1: 'dog', p2: 'dog' }), '');
});

test('createMatch: against the robot, player 2 is the robot; scores 0-0; player 1 starts', () => {
  const m = createMatch({ vsRobot: true, p1: 'bear', p2: 'cat', firstRule: 'alt' });
  assert.deepEqual(m.faces, ['bear', ROBOT]);
  assert.deepEqual(m.scores, { 1: 0, 2: 0, ties: 0 });
  assert.equal(m.starter, 1);
  assert.equal(m.turn, 1);
  assert.deepEqual(m.board, emptyBoard());
});

test('createMatch: refuses bad picks and unknown rules', () => {
  assert.throws(() => createMatch({ vsRobot: false, p1: 'cat', p2: 'cat', firstRule: 'alt' }), /same-face/);
  assert.throws(() => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'coin-toss' }), /unknown first rule/);
});

test('place: players alternate; occupied, out-of-range and after-the-end moves are refused', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'alt' });
  assert.deepEqual(place(m, 4), { ok: true });
  assert.equal(m.turn, 2);
  assert.deepEqual(place(m, 4), { ok: false, why: 'taken' });
  assert.equal(m.turn, 2, 'a refused move does not change the turn');
  for (const bad of [-1, 9, 1.5, '3', undefined]) assert.deepEqual(place(m, bad), { ok: false, why: 'bad-square' });
  // Player 2 takes the top row while player 1 plays 8 and 7.
  place(m, 0); place(m, 8); place(m, 1); place(m, 7); place(m, 2);
  assert.deepEqual(m.result, { winner: 2, line: [0, 1, 2] });
  assert.deepEqual(place(m, 3), { ok: false, why: 'round-over' });
});

test('a match: scores wins and ties; the starter follows the rule', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'lose' });
  // Round 1: player 1 starts and wins the left column.
  for (const s of [0, 1, 3, 4, 6]) place(m, s);
  assert.equal(m.result.winner, 1);
  assert.deepEqual(m.scores, { 1: 1, 2: 0, ties: 0 });
  assert.equal(m.starter, 2, 'loser goes first');
  // Round 2: player 2 starts; a tie.
  newRound(m);
  assert.equal(m.turn, 2);
  for (const s of [0, 1, 2, 4, 3, 5, 7, 6, 8]) place(m, s);   // ends 212 / 211 / 122
  assert.equal(m.result.winner, 0, `board ${m.board}`);
  assert.deepEqual(m.scores, { 1: 1, 2: 0, ties: 1 });
  assert.equal(m.starter, 1, 'after a tie the other player starts');
});

test('Play again mid-round: the round restarts unscored, same starter', () => {
  const m = createMatch({ vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'alt' });
  place(m, 0); place(m, 4);
  newRound(m);
  assert.deepEqual(m.board, emptyBoard());
  assert.equal(m.turn, 1);
  assert.equal(m.result, null);
  assert.deepEqual(m.scores, { 1: 0, 2: 0, ties: 0 });
});

test('robot: takes a win when the roll is under takeWin, and skips it otherwise', () => {
  const b = B('22. 11. ...');  // robot (2) can win at 2; player 1 threatens 5
  assert.deepEqual(robotMove(b, 2, seq(0.1)), { square: 2, reason: 'win' });
  assert.deepEqual(robotMove(b, 2, seq(ROBOT_TUNING.takeWin, 0.1)), { square: 5, reason: 'block' });
});

test('robot: blocks when the roll is under block, otherwise likes the centre, otherwise random', () => {
  const b = B('11. ... 2..');   // player 1 threatens 2; centre free
  assert.deepEqual(robotMove(b, 2, seq(0.5)), { square: 2, reason: 'block' });
  assert.deepEqual(robotMove(b, 2, seq(0.99, 0.1)), { square: 4, reason: 'centre' });
  // empties are 2,3,4,5,7,8 -> rand 0.99 picks the last, 8
  assert.deepEqual(robotMove(b, 2, seq(0.99, 0.99, 0.99)), { square: 8, reason: 'random' });
});

test('robot: never picks a taken square (2000 seeded games)', () => {
  const rand = seeded(42);
  let moves = 0;
  for (let g = 0; g < 2000; g++) {
    const b = emptyBoard();
    let p = 1 + (g % 2);
    while (!outcome(b)) {
      const { square } = robotMove(b, p, rand);
      assert.equal(b[square], 0, `game ${g}: square ${square} taken`);
      b[square] = p;
      p = 3 - p;
      moves++;
    }
  }
  assert.ok(moves > 2000 * 5, `only ${moves} moves checked`);
});

test('robot: refuses a full board', () => {
  assert.throws(() => robotMove(B('121 112 212'), 2), /full/);
});

test('robot is beatable: a careful player beats it often, and it still wins sometimes', () => {
  // The "careful player" always takes a win, always blocks, else centre, else a random square.
  const careful = { takeWin: 1, block: 1, centre: 1 };
  const rand = seeded(7);
  const tally = { person: 0, robot: 0, tie: 0 };
  for (let g = 0; g < 1000; g++) {
    const b = emptyBoard();
    let p = 1 + (g % 2);  // take turns starting
    while (!outcome(b)) {
      const { square } = p === 1 ? robotMove(b, 1, rand, careful) : robotMove(b, 2, rand);
      b[square] = p;
      p = 3 - p;
    }
    const w = outcome(b).winner;
    tally[w === 1 ? 'person' : w === 2 ? 'robot' : 'tie']++;
  }
  assert.ok(tally.person > 300, `person won only ${tally.person}/1000 ${JSON.stringify(tally)}`);
  assert.ok(tally.robot > 20, `robot won only ${tally.robot}/1000 ${JSON.stringify(tally)}`);
});
