import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZES, freshBoard, checkFaces, createMatch, newRound, draw, isLine, boxesOf, sides, freeLines, boxCounts,
  nearestLine, distanceTo, closingLines, safeLines, givesAway, robotMove, ROBOT,
} from '../src/core/dots-boxes.js';

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
const H = (r, c) => ({ k: 'h', r, c }), V = (r, c) => ({ k: 'v', r, c });
// Draws lines straight onto a board, as player p (no turns).
const put = (board, lines, p = 1) => { for (const l of lines) board[l.k][l.r][l.c] = p; return board; };

test('dots and boxes: board sizes and lines', () => {
  assert.deepEqual(SIZES, [5, 7]);
  for (const n of SIZES) {
    const b = freshBoard(n);
    assert.equal(freeLines(b).length, 2 * n * (n + 1), `${n}x${n}: every line free`);
    assert.deepEqual(boxCounts(b), { 1: 0, 2: 0 });
  }
  const b = freshBoard(5);
  assert.ok(isLine(b, H(5, 4)) && isLine(b, V(4, 5)));
  for (const bad of [H(6, 0), H(0, 5), V(5, 0), V(0, 6), H(-1, 0), { k: 'x', r: 0, c: 0 }, { k: 'h', r: 0.5, c: 0 }, null]) {
    assert.equal(isLine(b, bad), false, JSON.stringify(bad));
  }
  assert.deepEqual(boxesOf(b, H(0, 2)), [[0, 2]], 'the top edge: one box');
  assert.deepEqual(boxesOf(b, H(3, 2)), [[2, 2], [3, 2]]);
  assert.deepEqual(boxesOf(b, V(1, 5)), [[1, 4]], 'the right edge: one box');
  assert.deepEqual(boxesOf(b, V(1, 2)), [[1, 1], [1, 2]]);
});

test('dots and boxes: setup checks and a new match', () => {
  assert.equal(checkFaces({ vsRobot: true, p1: 'bear' }), '');
  assert.equal(checkFaces({ vsRobot: false, p1: 'bear', p2: 'bear' }), 'same-face');
  const m = robotMatch({ size: 7, level: 'hard' });
  assert.deepEqual(m.faces, ['bear', ROBOT]);
  assert.equal(m.board.n, 7);
  assert.equal(m.turn, 1);
  assert.throws(() => robotMatch({ size: 6 }), /unknown size/);
  assert.throws(() => robotMatch({ level: 'medium' }), /unknown level/);
  assert.throws(() => twoMatch({ p2: null }), /p2-missing/);
});

test('dots and boxes: no box, the turn passes; a box, the same player goes again', () => {
  const m = twoMatch();
  assert.deepEqual(draw(m, H(0, 0)), { ok: true, closed: [] });
  assert.equal(m.turn, 2);
  assert.equal(m.again, false);
  assert.deepEqual(m.last, H(0, 0));
  draw(m, V(0, 0));   // 2
  draw(m, H(1, 0));   // 1
  assert.equal(m.turn, 2);
  assert.equal(sides(m.board, 0, 0), 3);
  const r = draw(m, V(0, 1));   // 2 closes box (0, 0)
  assert.deepEqual(r.closed, [[0, 0]]);
  assert.equal(m.board.boxes[0][0], 2);
  assert.equal(m.turn, 2, 'closing a box: another turn');
  assert.equal(m.again, true);
  draw(m, H(5, 4));   // 2, nothing closed
  assert.equal(m.turn, 1);
  assert.equal(m.again, false);
  assert.equal(m.board.h[0][0], 1, 'a line keeps who drew it');
  assert.equal(m.board.v[0][1], 2);
});

test('dots and boxes: one line can close two boxes', () => {
  const m = twoMatch();
  put(m.board, [H(0, 0), H(1, 0), V(0, 0), H(0, 1), H(1, 1), V(0, 2)], 2);
  const r = draw(m, V(0, 1));
  assert.deepEqual(r.closed, [[0, 0], [0, 1]]);
  assert.deepEqual(boxCounts(m.board), { 1: 2, 2: 0 });
  assert.equal(m.turn, 1);
});

test('dots and boxes: refused lines change nothing', () => {
  const m = twoMatch();
  draw(m, H(0, 0));
  const before = JSON.stringify(m);
  assert.deepEqual(draw(m, H(0, 0)), { ok: false, why: 'already-drawn' });
  assert.deepEqual(draw(m, H(9, 0)), { ok: false, why: 'bad-line' });
  assert.deepEqual(draw(m, { k: 'h' }), { ok: false, why: 'bad-line' });
  assert.equal(JSON.stringify(m), before);
});

test('dots and boxes: a whole round; the winner scores and the starter changes', () => {
  for (const size of SIZES) {
    for (const firstRule of ['alt', 'win', 'lose']) {
      const m = twoMatch({ size, firstRule });
      const rand = seeded(size * 10 + firstRule.length);
      let lines = 0;
      while (!m.result) {
        const free = freeLines(m.board);
        assert.ok(draw(m, free[Math.floor(rand() * free.length)]).ok);
        lines++;
      }
      assert.equal(lines, 2 * size * (size + 1), 'every line drawn once');
      const { winner, boxes } = m.result;
      assert.equal(boxes[1] + boxes[2], size * size);
      assert.notEqual(boxes[1], boxes[2], 'odd sizes: no tie');
      assert.equal(winner, boxes[1] > boxes[2] ? 1 : 2);
      assert.deepEqual(m.scores, { 1: winner === 1 ? 1 : 0, 2: winner === 2 ? 1 : 0 });
      const want = firstRule === 'alt' ? 2 : firstRule === 'win' ? winner : 3 - winner;
      assert.equal(m.starter, want, `${size}x${size}, ${firstRule}`);
      assert.deepEqual(draw(m, H(0, 0)), { ok: false, why: 'round-over' });
      newRound(m);
      assert.equal(m.turn, want);
      assert.equal(freeLines(m.board).length, 2 * size * (size + 1));
      assert.equal(m.result, null);
    }
  }
});

test('dots and boxes: the nearest line to a finger', () => {
  const b = freshBoard(5);
  assert.deepEqual(nearestLine(b, 0.5, 0.1), H(0, 0), 'just under the top-left line');
  assert.deepEqual(nearestLine(b, 0.1, 0.5), V(0, 0));
  assert.deepEqual(nearestLine(b, 2.5, 3.9), H(4, 2));
  assert.deepEqual(nearestLine(b, 5.2, 4.5), V(4, 5), 'just outside the right edge');
  assert.equal(nearestLine(b, -1, -1), null, 'too far from any line');
  put(b, [H(0, 0), V(0, 0), V(0, 1)]);
  assert.deepEqual(nearestLine(b, 0.5, 0.6), H(1, 0), 'only lines not drawn: the box’s last side');
  assert.equal(distanceTo(H(0, 0), 0.5, 0), 0);
  assert.ok(Math.abs(distanceTo(H(0, 0), 1.3, 0.4) - 0.5) < 1e-9, 'past the end: to the dot');
});

test('dots and boxes: closing and safe lines; what a line gives away', () => {
  const b = freshBoard(5);
  assert.equal(safeLines(b).length, freeLines(b).length, 'an empty board: every line safe');
  assert.equal(closingLines(b).length, 0);
  put(b, [H(0, 0), V(0, 0), H(1, 0)]);
  assert.deepEqual(closingLines(b), [V(0, 1)]);
  assert.ok(!safeLines(b).some(l => l.k === 'v' && l.r === 0 && l.c === 1));
  // A run of three boxes along the top, open at both ends: drawing either
  // end gives all three away.
  const run = freshBoard(5);
  put(run, [H(0, 0), H(0, 1), H(0, 2), H(1, 0), H(1, 1), H(1, 2)]);
  assert.equal(givesAway(run, V(0, 3)), 3);
  assert.equal(givesAway(run, V(0, 0)), 3);
  assert.equal(givesAway(run, H(5, 4)), 0);
});

test('dots and boxes: the robot', () => {
  // Hard takes a box whenever it can.
  const b = put(freshBoard(5), [H(0, 0), V(0, 0), H(1, 0)]);
  for (let s = 0; s < 20; s++) assert.deepEqual(robotMove(b, 'hard', seeded(s)), { line: V(0, 1), reason: 'take' });
  // With safe lines left, Hard never gives a box away.
  const open = put(freshBoard(5), [H(2, 2), V(2, 2)]);
  for (let s = 0; s < 50; s++) {
    const m = robotMove(open, 'hard', seeded(s));
    assert.equal(m.reason, 'safe');
    assert.ok(safeLines(open).some(l => JSON.stringify(l) === JSON.stringify(m.line)));
  }
  // No safe line left: Hard gives the fewest boxes away. A 5x5 board
  // with every box at 2 sides: rows of 5 (the horizontal lines between
  // rows all drawn), so any line gives a whole row of 5 but the edge...
  const rows = freshBoard(5);
  for (let r = 0; r <= 5; r++) for (let c = 0; c < 5; c++) rows.h[r][c] = 1;
  const hard = robotMove(rows, 'hard', seeded(1));
  assert.equal(hard.reason, 'least');
  assert.equal(hard.gives, Math.min(...freeLines(rows).map(l => givesAway(rows, l))));
  assert.equal(hard.gives, 5, 'each row is a run of 5');
  // Easy, with a box to take and a fixed random source: takes it when
  // rand < easyTake, otherwise not always.
  assert.equal(robotMove(b, 'easy', () => 0.1).reason, 'take');
  assert.equal(robotMove(b, 'easy', () => 0.95).reason, 'careless');
  const reasons = new Set();
  for (let s = 0; s < 200; s++) reasons.add(robotMove(b, 'easy', seeded(s)).reason);
  assert.deepEqual([...reasons].sort(), ['careless', 'safe', 'take']);
  assert.throws(() => robotMove(put(freshBoard(5), freeLines(freshBoard(5))), 'easy'), /no lines left/);
});

test('dots and boxes: Hard beats Easy most of the time, and both finish every game', () => {
  const rand = seeded(7);
  let hardWins = 0;
  const games = 40;
  for (let g = 0; g < games; g++) {
    const m = twoMatch({ size: 5 });
    m.turn = g % 2 ? 1 : 2;
    while (!m.result) {
      const level = m.turn === 1 ? 'hard' : 'easy';
      assert.ok(draw(m, robotMove(m.board, level, rand).line).ok);
    }
    if (m.result.winner === 1) hardWins++;
  }
  assert.ok(hardWins >= games * 0.75, `hard won ${hardWins} of ${games}`);
});
