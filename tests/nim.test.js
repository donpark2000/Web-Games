import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  START_ROWS, freshRows, counts, nimSum, checkFaces, createMatch, newRound, take,
  moves, robotMove, robotPicks, ROBOT,
} from '../src/core/nim.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const robotMatch = (o = {}) => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'alt', ...o });
const twoMatch = (o = {}) => createMatch({ vsRobot: false, p1: 'bear', p2: 'cat', firstRule: 'alt', ...o });
// Every position reachable from 3-5-7 (each row 0..its start), 192 in all.
const ALL = [];
for (let a = 0; a <= 3; a++) for (let b = 0; b <= 5; b++) for (let c = 0; c <= 7; c++) ALL.push([a, b, c]);
const after = (rows, m) => rows.map((n, i) => (i === m.row ? n - m.count : n));
const rowsLeft = rows => rows.filter(n => n > 0).length;

test('nim: three rows of 3, 5 and 7, none taken; the nim-sum', () => {
  assert.deepEqual(START_ROWS, [3, 5, 7]);
  assert.deepEqual(counts(freshRows()), [3, 5, 7]);
  assert.equal(nimSum([3, 5, 7]), 1, 'the first player can win from the start');
  assert.equal(nimSum([1, 2, 3]), 0);
  assert.equal(nimSum([0, 0, 0]), 0);
  assert.equal(moves([3, 5, 7]).length, 15);
  assert.equal(moves([0, 0, 0]).length, 0);
});

test('nim: setup picks are checked; the robot is player 2', () => {
  assert.equal(checkFaces({ vsRobot: true, p1: 'bear' }), '');
  assert.equal(checkFaces({ vsRobot: false, p1: 'bear', p2: 'bear' }), 'same-face');
  assert.equal(checkFaces({ vsRobot: false, p1: 'bear' }), 'p2-missing');
  const m = robotMatch();
  assert.deepEqual(m.faces, ['bear', ROBOT]);
  assert.equal(m.level, 'easy');
  assert.deepEqual(m.scores, { 1: 0, 2: 0 });
  assert.throws(() => createMatch({ vsRobot: true, p1: '', firstRule: 'alt' }), /p1-missing/);
  assert.throws(() => robotMatch({ firstRule: 'never' }), /first rule/);
  assert.throws(() => robotMatch({ level: 'medium' }), /level/);
});

test('nim: a take removes those matches and passes the turn', () => {
  const m = twoMatch();
  assert.deepEqual(take(m, 2, [0, 6, 3]), { ok: true });
  assert.deepEqual(counts(m.taken), [3, 5, 4]);
  assert.deepEqual(m.taken[2], [true, false, false, true, false, false, true]);
  assert.equal(m.turn, 2);
  assert.equal(m.result, null);
});

test('nim: bad takes are refused and change nothing', () => {
  const m = twoMatch();
  take(m, 0, [1]);
  const before = JSON.stringify(m);
  const cases = [
    [[0, [1]], 'already-taken'],
    [[0, [0, 1]], 'already-taken'],
    [[0, []], 'none-picked'],
    [[0, undefined], 'none-picked'],
    [[1, [5]], 'bad-match'],
    [[1, [-1]], 'bad-match'],
    [[1, [2, 2]], 'bad-match'],
    [[1, [1.5]], 'bad-match'],
    [[3, [0]], 'bad-row'],
    [[-1, [0]], 'bad-row'],
    [['1', [0]], 'bad-row'],
  ];
  for (const [[row, picks], why] of cases) {
    assert.deepEqual(take(m, row, picks), { ok: false, why }, `take(${row}, ${JSON.stringify(picks)})`);
  }
  assert.equal(JSON.stringify(m), before, 'a refused take changed the match');
});

test('nim: taking the last match wins; scored; the next starter follows the rule', () => {
  const m = twoMatch({ firstRule: 'lose' });
  take(m, 0, [0, 1, 2]);   // player 1
  take(m, 1, [0, 1, 2, 3, 4]);   // player 2
  assert.equal(m.result, null, 'matches still left in row 3');
  assert.deepEqual(take(m, 2, [6, 0, 1, 2, 3, 4, 5]), { ok: true });   // player 1 takes the last row whole
  assert.deepEqual(m.result, { winner: 1, row: 2, picks: [0, 1, 2, 3, 4, 5, 6] });
  assert.deepEqual(m.scores, { 1: 1, 2: 0 });
  assert.equal(m.starter, 2, 'loser goes first');
  assert.deepEqual(take(m, 0, [0]), { ok: false, why: 'round-over' });
  newRound(m);
  assert.deepEqual(counts(m.taken), [3, 5, 7]);
  assert.equal(m.turn, 2);
  assert.equal(m.result, null);
  assert.deepEqual(m.scores, { 1: 1, 2: 0 }, 'games won are kept');
});

test('nim: Play again mid-round restarts it unscored, same starter', () => {
  const m = twoMatch();
  take(m, 1, [2]);
  newRound(m);
  assert.deepEqual(counts(m.taken), [3, 5, 7]);
  assert.equal(m.turn, 1);
  assert.equal(m.starter, 1);
  assert.deepEqual(m.scores, { 1: 0, 2: 0 });
});

// Hard checked over every position: wherever a nim-sum-0 move exists it
// takes one; where none does, it still never hands over an easy win if
// it can help it.
test('nim robot: hard plays its best from every position', () => {
  const rand = seeded(7);
  let best = 0, losing = 0;
  for (const rows of ALL) {
    if (!rows.some(Boolean)) continue;
    const m = robotMove(rows, 'hard', rand);
    assert.ok(m.count >= 1 && m.count <= rows[m.row], `${rows}: took ${m.count} from row ${m.row}`);
    if (nimSum(rows) !== 0) {
      assert.equal(m.reason, 'best', `${rows}`);
      assert.equal(nimSum(after(rows, m)), 0, `${rows}: left ${after(rows, m)}`);
      best++;
    } else {
      assert.notEqual(m.reason, 'best', `${rows}: no best move exists`);
      if (moves(rows).some(x => rowsLeft(after(rows, { row: x[0], count: x[1] })) !== 1)) {
        assert.notEqual(rowsLeft(after(rows, m)), 1, `${rows}: handed over a win`);
      }
      losing++;
    }
  }
  assert.equal(best + losing, 191, 'every position but the empty one');
  assert.ok(losing >= 20, `only ${losing} losing positions checked`);
});

// Easy, over every position: takes a win when there is one, and never
// leaves a single row when another move exists.
test('nim robot: easy takes a win and never hands one over', () => {
  const rand = seeded(11);
  let wins = 0, safes = 0, stuck = 0;
  for (const rows of ALL) {
    if (!rows.some(Boolean)) continue;
    const m = robotMove(rows, 'easy', rand);
    assert.ok(m.count >= 1 && m.count <= rows[m.row], `${rows}: took ${m.count} from row ${m.row}`);
    const left = after(rows, m);
    if (rowsLeft(rows) === 1) {
      assert.equal(m.reason, 'win', `${rows}`);
      assert.deepEqual(left, [0, 0, 0], `${rows}`);
      wins++;
    } else if (m.reason === 'stuck') {
      // Only when every move leaves one row: two rows of 1 each.
      assert.ok(moves(rows).every(([r, k]) => rowsLeft(after(rows, { row: r, count: k })) === 1), `${rows}: stuck with a safe move`);
      stuck++;
    } else {
      assert.equal(m.reason, 'safe', `${rows}`);
      assert.notEqual(rowsLeft(left), 1, `${rows}: left just one row (${left})`);
      safes++;
    }
  }
  // One row left: 3 + 5 + 7 positions; stuck: two rows of 1 (3 ways).
  assert.deepEqual({ wins, safes, stuck }, { wins: 15, safes: 173, stuck: 3 });
});

test('nim robot: easy varies its moves; no matches left is an error', () => {
  const rand = seeded(3);
  const seen = new Set();
  for (let i = 0; i < 200; i++) { const m = robotMove([3, 5, 7], 'easy', rand); seen.add(`${m.row}:${m.count}`); }
  assert.ok(seen.size >= 10, `only ${seen.size} different opening moves`);
  assert.throws(() => robotMove([0, 0, 0], 'easy'), /no matches/);
  assert.throws(() => robotMove([0, 0, 0], 'hard'), /no matches/);
});

test('nim robot: lifts the rightmost matches still there', () => {
  const taken = freshRows();
  taken[2][6] = true;
  taken[2][4] = true;
  assert.deepEqual(robotPicks(taken, 2, 3), [5, 3, 2]);
  assert.deepEqual(robotPicks(taken, 0, 3), [2, 1, 0]);
  assert.throws(() => robotPicks(taken, 2, 6), /can't take 6/);
  assert.throws(() => robotPicks(taken, 1, 0), /can't take 0/);
});

// Whole games through take(): strength as measured in the journal
// (2026-10-08). A sensible player takes a win and never leaves one row;
// the bands are wide so a different random stream doesn't fail them.
function playGames(n, level, kid, robotFirst, rand) {
  let robotWins = 0;
  for (let g = 0; g < n; g++) {
    const m = robotMatch({ level });
    if (robotFirst) m.turn = 2;
    while (!m.result) {
      const rows = counts(m.taken);
      const mv = m.turn === 2 ? robotMove(rows, level, rand) : kid(rows, rand);
      const r = take(m, mv.row, robotPicks(m.taken, mv.row, mv.count));
      assert.ok(r.ok, `refused: ${r.why}`);
    }
    if (m.result.winner === 2) robotWins++;
  }
  return robotWins / n;
}
const sensibleKid = (rows, rand) => robotMove(rows, 'easy', rand);
const perfectKid = (rows, rand) => robotMove(rows, 'hard', rand);

test('nim robot: strength over whole games', () => {
  const rand = seeded(2026);
  const easy = playGames(600, 'easy', sensibleKid, false, rand);
  assert.ok(easy > 0.35 && easy < 0.65, `easy vs a sensible child: robot won ${easy}`);
  const hard = playGames(300, 'hard', sensibleKid, false, rand);
  assert.ok(hard > 0.9, `hard vs a sensible child: robot won ${hard}`);
  assert.equal(playGames(100, 'hard', perfectKid, false, rand), 0, 'a perfect child going first always beats hard');
  assert.equal(playGames(100, 'hard', sensibleKid, true, rand), 1, 'hard going first always wins');
  assert.equal(playGames(100, 'easy', perfectKid, false, rand), 0, 'a perfect child going first always beats easy');
});
