import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLLS, BOXES, UPPER, ROBOT, run, score, upper, bonusOf, points, openBoxes,
  checkFaces, createMatch, newRound, roll, toggle, pickUpAll, scoreBox, undo, endTurn,
} from '../src/core/five-dice.js';
import { bestPlay } from '../src/core/five-dice-best.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A random source that gives these die faces (1-6) in turn.
const faces = (...vs) => { let k = 0; return () => (vs[k++ % vs.length] - 1) / 6 + 0.01; };

test('score: the 1s-6s add up only that number', () => {
  assert.equal(score('1', [1, 1, 3, 1, 5]), 3);
  assert.equal(score('6', [6, 6, 6, 2, 4]), 18);
  assert.equal(score('4', [1, 2, 3, 5, 6]), 0);
  assert.equal(score('5', [5, 5, 5, 5, 5]), 25);
});

test('score: 3 the same, 4 the same, 5 the same', () => {
  assert.equal(score('three', [4, 4, 4, 2, 6]), 20);
  assert.equal(score('three', [4, 4, 2, 2, 6]), 0);
  assert.equal(score('three', [2, 2, 2, 2, 5]), 13, '4 the same is also 3 the same');
  assert.equal(score('four', [2, 2, 2, 2, 5]), 13);
  assert.equal(score('four', [2, 2, 2, 5, 5]), 0);
  assert.equal(score('four', [6, 6, 6, 6, 6]), 30, '5 the same is also 4 the same');
  assert.equal(score('five', [6, 6, 6, 6, 6]), 50);
  assert.equal(score('five', [6, 6, 6, 6, 5]), 0);
});

test('score: full house is exactly 3 and 2 (5 the same is not one)', () => {
  assert.equal(score('house', [5, 5, 5, 2, 2]), 25);
  assert.equal(score('house', [2, 5, 2, 5, 2]), 25);
  assert.equal(score('house', [5, 5, 5, 5, 2]), 0);
  assert.equal(score('house', [5, 5, 5, 5, 5]), 0, 'no joker rules');
  assert.equal(score('house', [5, 5, 2, 2, 1]), 0);
});

test('score: 4 in a row and 5 in a row, in any order, with a repeat', () => {
  assert.equal(run([1, 2, 3, 4, 6]), 4);
  assert.equal(run([1, 2, 3, 5, 6]), 3);
  assert.equal(score('small', [1, 2, 3, 4, 6]), 30);
  assert.equal(score('small', [4, 3, 3, 1, 2]), 30, 'a repeated number in the run');
  assert.equal(score('small', [6, 5, 4, 3, 1]), 30);
  assert.equal(score('small', [1, 2, 3, 5, 6]), 0);
  assert.equal(score('small', [2, 3, 4, 5, 6]), 30, '5 in a row is also 4 in a row');
  assert.equal(score('big', [2, 3, 4, 5, 6]), 40);
  assert.equal(score('big', [5, 4, 3, 2, 1]), 40);
  assert.equal(score('big', [1, 2, 3, 4, 6]), 0);
  assert.equal(score('chance', [3, 5, 2, 6, 4]), 20);
  assert.throws(() => score('yahtzee', [1, 1, 1, 1, 1]), /unknown box/);
});

test('bonus: 35 at 63 or more in the 1s-6s, long game only', () => {
  const at62 = { 1: 2, 2: 4, 3: 9, 4: 12, 5: 15, 6: 20 };   // 62
  const at63 = { ...at62, 1: 3 };                          // 63
  assert.equal(upper(at62), 62);
  assert.equal(bonusOf(at62, 'long'), 0);
  assert.equal(bonusOf(at63, 'long'), 35);
  assert.equal(bonusOf(at63, 'short'), 0);
  assert.equal(points({ ...at63, chance: 20 }, 'long'), 63 + 20 + 35);
  assert.equal(points(at63, 'short'), 63);
  assert.equal(upper({ three: 30, chance: 20 }), 0, 'only the 1s-6s count');
});

test('boxes: short is the 1s-6s and 5 the same; long is all 13', () => {
  assert.deepEqual(BOXES.short, [...UPPER, 'five']);
  assert.equal(BOXES.long.length, 13);
  assert.equal(new Set(BOXES.long).size, 13);
  for (const b of BOXES.long) assert.equal(typeof score(b, [1, 2, 3, 4, 5]), 'number');
  assert.deepEqual(openBoxes({ 1: 3, five: 0 }, 'short'), ['2', '3', '4', '5', '6']);
});

test('setup: faces as in Count to 9; the robot is player 2; bad picks throw', () => {
  assert.equal(checkFaces({ mode: 'solo', p1: 'bear' }), '');
  assert.equal(checkFaces({ mode: 'robot', p1: 'bear', p2: 'bear' }), '');
  assert.equal(checkFaces({ mode: 'two', p1: 'bear', p2: 'bear' }), 'same-face');
  assert.equal(checkFaces({ mode: 'two', p1: 'bear' }), 'p2-missing');
  assert.throws(() => createMatch({ mode: 'robot', p1: 'bear', length: 'medium' }), /unknown length/);
  assert.throws(() => createMatch({ mode: 'three', p1: 'bear' }), /unknown mode/);
  assert.throws(() => createMatch({ mode: 'two', p1: 'bear' }), /p2-missing/);
  const m = createMatch({ mode: 'robot', p1: 'bear', length: 'long' });
  assert.deepEqual(m.faces, ['bear', ROBOT]);
  assert.deepEqual([m.turn, m.rolls, m.scored, m.result], [1, 0, null, null]);
  assert.equal(createMatch({ mode: 'solo', p1: 'cat' }).length, 'short', 'short is the default');
});

test('a turn: the first roll rolls all five; then only the dice picked up', () => {
  const m = createMatch({ mode: 'two', p1: 'bear', p2: 'cat' });
  assert.deepEqual(toggle(m, 0), { ok: false, why: 'not-rolled' });
  const r1 = roll(m, faces(1, 2, 3, 4, 5));
  assert.deepEqual([r1.ok, r1.dice, r1.rolled, r1.rolls], [true, [1, 2, 3, 4, 5], [true, true, true, true, true], 1]);
  assert.deepEqual(roll(m), { ok: false, why: 'none-picked-up' });
  assert.equal(m.rolls, 1, 'a refused roll uses no roll');
  assert.deepEqual(toggle(m, 1), { ok: true, up: true });
  assert.deepEqual(toggle(m, 3), { ok: true, up: true });
  assert.deepEqual(toggle(m, 3), { ok: true, up: false }, 'tap again to put it back');
  const r2 = roll(m, faces(6));
  assert.deepEqual(r2.dice, [1, 6, 3, 4, 5]);
  assert.deepEqual(r2.rolled, [false, true, false, false, false]);
  assert.deepEqual(m.up, [false, false, false, false, false], 'put down after the roll');
  assert.deepEqual(pickUpAll(m), { ok: true });
  assert.equal(roll(m, faces(2)).dice.join(''), '22222');
  // 3 rolls is all
  assert.deepEqual(toggle(m, 0), { ok: false, why: 'no-rolls-left' });
  assert.deepEqual(pickUpAll(m), { ok: false, why: 'no-rolls-left' });
  assert.deepEqual(roll(m), { ok: false, why: 'no-rolls-left' });
  assert.equal(m.rolls, ROLLS);
  assert.deepEqual(toggle(m, 5), { ok: false, why: 'bad-die' });
});

test('scoring: one box a turn, only an empty one in this game; undo; the turn passes', () => {
  const m = createMatch({ mode: 'two', p1: 'bear', p2: 'cat' });
  assert.deepEqual(scoreBox(m, '1'), { ok: false, why: 'not-rolled' });
  roll(m, faces(5, 5, 5, 2, 2));
  assert.deepEqual(scoreBox(m, 'house'), { ok: false, why: 'bad-box' }, 'not in the short game');
  assert.deepEqual(scoreBox(m, '5'), { ok: true, box: '5', points: 15 });
  assert.deepEqual(scoreBox(m, '2'), { ok: false, why: 'scored' });
  assert.deepEqual(roll(m), { ok: false, why: 'scored' });
  assert.deepEqual(toggle(m, 0), { ok: false, why: 'scored' });
  // Undo: the box is empty again, same dice, same rolls
  assert.deepEqual(undo(m), { ok: true, box: '5' });
  assert.deepEqual(m.cards[1], {});
  assert.deepEqual([m.dice, m.rolls, m.turn], [[5, 5, 5, 2, 2], 1, 1]);
  assert.deepEqual(undo(m), { ok: false, why: 'nothing-to-undo' });
  assert.deepEqual(endTurn(m), { ok: false, why: 'not-scored' });
  scoreBox(m, '2');
  assert.deepEqual(endTurn(m), { ok: true, turn: 2, result: null });
  assert.deepEqual([m.rolls, m.scored, m.cards[1]], [0, null, { 2: 4 }]);
  assert.deepEqual(undo(m), { ok: false, why: 'nothing-to-undo' }, 'no undo once the turn has passed');
  // player 2 can't use player 1's filled box... but has their own
  roll(m, faces(2, 2, 3, 3, 1));
  assert.deepEqual(scoreBox(m, '2'), { ok: true, box: '2', points: 4 });
  endTurn(m);
  roll(m, faces(2, 2, 3, 3, 1));
  assert.deepEqual(scoreBox(m, '2'), { ok: false, why: 'filled' });
});

// Fills every box of a game, the robot's way for every player (the long
// game's values aren't loaded here: the robot's stand-in, the most points
// each turn; the best play has its own tests, five-dice-best.test.js).
function playGame(m, rand) {
  let turns = 0;
  while (!m.result) {
    assert.ok(++turns < 100, 'a game never ended');
    assert.ok(roll(m, rand).ok);
    for (;;) {
      const plan = bestPlay(m.dice, m.rolls, m.cards[m.turn], m.length);
      if (plan.box) { assert.ok(scoreBox(m, plan.box).ok); break; }
      plan.up.forEach((u, i) => { if (u) toggle(m, i); });
      assert.ok(roll(m, rand).ok);
    }
    assert.ok(endTurn(m).ok);
  }
  return turns;
}

test('whole games finish: every box filled, points add up, players take turns starting', () => {
  const rand = seeded(5);
  for (const length of ['short', 'long']) {
    const m = createMatch({ mode: 'two', p1: 'bear', p2: 'cat', length });
    const starters = [];
    for (let g = 0; g < 200; g++) {
      newRound(m);
      starters.push(m.turn);
      const turns = playGame(m, rand);
      assert.equal(turns, 2 * BOXES[length].length);
      for (const p of [1, 2]) {
        assert.deepEqual(Object.keys(m.cards[p]).sort(), [...BOXES[length]].sort());
        assert.equal(m.result.points[p], points(m.cards[p], length));
      }
      const { winner, points: pts } = m.result;
      assert.equal(winner, pts[1] > pts[2] ? 1 : pts[2] > pts[1] ? 2 : 0);
      assert.deepEqual(roll(m), { ok: false, why: 'round-over' });
    }
    assert.ok(m.wins[1] + m.wins[2] <= 200 && m.wins[1] + m.wins[2] > 150, JSON.stringify(m.wins));
    assert.deepEqual(starters.slice(0, 4), [1, 2, 1, 2], 'take turns starting each game');
  }
});

test('a tie: no winner, nobody gets a game', () => {
  const m = createMatch({ mode: 'two', p1: 'bear', p2: 'cat' });
  for (let t = 0; t < 14; t++) {
    roll(m, faces(3, 3, 3, 3, 3));
    scoreBox(m, openBoxes(m.cards[m.turn], 'short')[0]);
    endTurn(m);
  }
  assert.equal(m.result.winner, 0);
  assert.deepEqual(m.wins, { 1: 0, 2: 0 });
  assert.equal(m.result.points[1], m.result.points[2]);
});

test('just me: one column, the turn never passes, the best per length', () => {
  const rand = seeded(9);
  const m = createMatch({ mode: 'solo', p1: 'bear', length: 'short' });
  const turns = playGame(m, rand);
  assert.equal(turns, 7);
  assert.deepEqual(m.cards[2], {});
  assert.equal(m.result.winner, 1);
  assert.equal(m.result.best, true, 'the first game is the best so far');
  assert.equal(m.best.short, m.result.points[1]);
  assert.equal(m.starter, 1);
  // A game below the best isn't a new best.
  newRound(m);
  for (let t = 0; t < 7; t++) { roll(m, faces(1, 2, 2, 3, 4)); scoreBox(m, openBoxes(m.cards[1], 'short')[0]); endTurn(m); }
  if (m.result.points[1] <= m.best.short) assert.equal(m.result.best, false);
  assert.ok(m.best.short >= m.result.points[1]);
});

test('play again mid-game: cards cleared, not scored, same starter', () => {
  const m = createMatch({ mode: 'robot', p1: 'bear' });
  roll(m, faces(4));
  scoreBox(m, '4');
  endTurn(m);
  newRound(m);
  assert.deepEqual([m.cards, m.turn, m.rolls, m.wins, m.starter], [{ 1: {}, 2: {} }, 1, 0, { 1: 0, 2: 0 }, 1]);
});
