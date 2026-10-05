import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, GOAL, BOARD_RULES, cell, numAt, centre, segDist, boardTotals, checkBoard, makeBoard, rollDie,
  checkFaces, createMatch, newRound, move, ROBOT,
} from '../src/core/snakes-ladders.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A board that follows every rule (checked in the first board test).
const GOOD = { ladders: { 4: 16, 8: 18, 20: 28, 25: 35 }, snakes: { 10: 3, 23: 13, 27: 22, 30: 19 } };
const copy = b => ({ ladders: { ...b.ladders }, snakes: { ...b.snakes } });
// A match on a known board: player 1 (bear) against the robot.
function onBoard(board = GOOD, pos = { 1: 1, 2: 1 }) {
  const m = createMatch({ vsRobot: true, p1: 'bear', firstRule: 'alt' });
  newRound(m, seeded(1));
  m.board = copy(board);
  m.pos = { ...pos };
  return m;
}

test('squares: 1 to 36 snake back and forth from the bottom left; 36 is top left', () => {
  assert.equal(GOAL, 36);
  assert.deepEqual([1, 6, 7, 12, 13, 36].map(cell), [
    { r: 0, c: 0 }, { r: 0, c: 5 }, { r: 1, c: 5 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 5, c: 0 },
  ]);
  for (let n = 1; n <= GOAL; n++) { const { r, c } = cell(n); assert.equal(numAt(r, c), n); }
  assert.deepEqual(centre(1), { x: 0.5, y: ROWS - 0.5 });
  assert.deepEqual(centre(36), { x: 0.5, y: 0.5 });
  assert.equal(COLS * ROWS, GOAL);
});

test('segDist: crossing 0, apart the gap, touching ends 0', () => {
  const s = (x1, y1, x2, y2) => [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  assert.equal(segDist(s(0, 0, 2, 2), s(0, 2, 2, 0)), 0);
  assert.equal(segDist(s(0, 0, 0, 2), s(1, 0, 1, 2)), 1);
  assert.equal(segDist(s(0, 0, 1, 0), s(1, 0, 2, 5)), 0);
  assert.ok(Math.abs(segDist(s(0, 0, 2, 0), s(1, 1, 1, 3)) - 1) < 1e-12);
});

test('board rules: a good board passes; each broken rule is caught', () => {
  assert.deepEqual(checkBoard(GOOD), []);
  assert.deepEqual(boardTotals(GOOD), { gain: 12 + 10 + 8 + 10, loss: 7 + 10 + 5 + 11 });
  const broken = (change, expect) => {
    const b = copy(GOOD);
    change(b);
    const why = checkBoard(b);
    assert.ok(why.some(w => w.includes(expect)), `expected "${expect}" in ${JSON.stringify(why)}`);
  };
  broken(b => { delete b.ladders[25]; }, '3 ladders');
  broken(b => { delete b.ladders[4]; b.ladders[1] = 13; }, 'on square 1');
  broken(b => { delete b.ladders[25]; b.ladders[33] = 36; }, 'on square 36');
  broken(b => { delete b.snakes[10]; b.snakes[16] = 2; }, 'also used by');            // a ladder's top is a snake's head
  broken(b => { delete b.ladders[20]; b.ladders[20] = 24; }, 'moves only 4');
  broken(b => { delete b.ladders[4]; b.ladders[2] = 32; }, 'spans 5 rows');
  broken(b => { delete b.ladders[4]; b.ladders[6] = 7; }, 'moves only 1');
  broken(b => { delete b.ladders[4]; b.ladders[5] = 13; }, 'lies flat');   // 5 (column 4) to 13 (column 0): 4 over, 2 up
  broken(b => { delete b.snakes[30]; b.snakes[33] = 21; }, 'head in the last row');
  broken(b => { delete b.ladders[8]; b.ladders[9] = 17; }, 'too close');
  broken(b => { b.snakes[30] = 14; }, 'snakes take');                       // too mean: 38 of 40
  broken(b => { b.snakes[27] = 26; b.snakes[30] = 25; }, 'snakes take');    // too kind: 23 of 40 (24 is the least)
});

test('makeBoard: 500 boards each follow every rule; the same seed gives the same board', () => {
  const rand = seeded(7);
  const shares = [];
  let tries = 0;
  for (let i = 0; i < 500; i++) {
    const b = makeBoard(rand);
    assert.deepEqual(checkBoard(b), [], JSON.stringify(b));
    const { gain, loss } = boardTotals(b);
    shares.push(loss / gain);
    tries += b.tries;
  }
  // Boards vary: not one board over and over.
  assert.ok(Math.min(...shares) < 0.7 && Math.max(...shares) > 0.8, `shares ${Math.min(...shares)}..${Math.max(...shares)}`);
  assert.ok(tries / 500 < 50, `${tries / 500} tries a board`);
  const a = makeBoard(seeded(3)), b = makeBoard(seeded(3));
  assert.deepEqual(a, b);
});

test('makeBoard: impossible rules throw rather than loop forever', () => {
  assert.throws(() => makeBoard(seeded(1), { ...BOARD_RULES, minMove: 40 }), /no board/);
});

test('rollDie: 1 to 6, each about as often', () => {
  const rand = seeded(11), counts = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6000; i++) counts[rollDie(rand)]++;
  assert.equal(counts[0], 0);
  for (let n = 1; n <= 6; n++) assert.ok(counts[n] > 850 && counts[n] < 1150, `${n}: ${counts[n]}`);
  assert.equal(rollDie(() => 0.9999999), 6);
  assert.equal(rollDie(() => 0), 1);
});

test('setup: faces checked as in the other games; the robot is player 2', () => {
  assert.equal(checkFaces({ vsRobot: true, p1: 'bear' }), '');
  assert.equal(checkFaces({ vsRobot: false, p1: 'bear', p2: 'bear' }), 'same-face');
  assert.equal(checkFaces({ vsRobot: false, p1: 'bear' }), 'p2-missing');
  assert.throws(() => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'random' }), /first rule/);
  const m = createMatch({ vsRobot: true, p1: 'bear', firstRule: 'alt' });
  assert.deepEqual(m.faces, ['bear', ROBOT]);
  newRound(m, seeded(2));
  assert.deepEqual(m.pos, { 1: 1, 2: 1 });
  assert.deepEqual(checkBoard(m.board), []);
});

test('move: hops one square per dot, then the turn passes', () => {
  const m = onBoard();
  const r = move(m, 2);
  assert.deepEqual([r.ok, r.player, r.path, r.at, r.jump, r.bounced, r.result], [true, 1, [2, 3], 3, null, false, null]);
  assert.equal(m.turn, 2);
  assert.deepEqual(move(m, 1).path, [2]);
  assert.equal(m.turn, 1);
});

test('move: up a ladder from its foot; down a snake from its head', () => {
  const m = onBoard();
  const up = move(m, 3);                       // 1 -> 4, ladder to 16
  assert.deepEqual(up.path, [2, 3, 4]);
  assert.deepEqual(up.jump, { kind: 'ladder', from: 4, to: 16 });
  assert.equal(m.pos[1], 16);
  m.pos[2] = 26;
  const down = move(m, 1);                     // robot 26 -> 27, snake to 22
  assert.deepEqual(down.jump, { kind: 'snake', from: 27, to: 22 });
  assert.equal(m.pos[2], 22);
  // Only the square it lands on counts: going over a snake's head does
  // nothing.
  const over = onBoard(GOOD, { 1: 9, 2: 1 });
  const r = move(over, 2);                     // 10 (a snake's head), then 11
  assert.deepEqual([r.path, r.jump, r.at], [[10, 11], null, 11]);
});

test('move: the exact number wins; extra dots hop back from the goal', () => {
  const m = onBoard(GOOD, { 1: 33, 2: 1 });
  const bounce = move(m, 5);                   // 34, 35, 36, then back 35, 34
  assert.deepEqual(bounce.path, [34, 35, 36, 35, 34]);
  assert.equal(bounce.bounced, true);
  assert.equal(bounce.at, 34);
  assert.equal(bounce.result, null);
  assert.equal(m.turn, 2);
  const far = onBoard(GOOD, { 1: 35, 2: 1 });
  assert.deepEqual(move(far, 6).path, [36, 35, 34, 33, 32, 31]);
  const win = onBoard(GOOD, { 1: 33, 2: 1 });
  const r = move(win, 3);
  assert.deepEqual(r.result, { winner: 1 });
  assert.deepEqual(win.scores, { 1: 1, 2: 0 });
  assert.equal(win.starter, 2, 'take turns: the robot starts the next round');
  assert.equal(win.turn, 1, 'the turn stays with the winner once the round is over');
});

test('move: refused after the round, and for a roll that is not 1 to 6', () => {
  const m = onBoard(GOOD, { 1: 35, 2: 1 });
  for (const bad of [0, 7, 2.5, '3', undefined]) assert.deepEqual(move(m, bad), { ok: false, why: 'bad-roll' });
  assert.equal(m.pos[1], 35);
  move(m, 1);
  assert.deepEqual(move(m, 1), { ok: false, why: 'round-over' });
  assert.equal(m.scores[1], 1);
});

test('play again mid-round: a new board, not scored, same starter', () => {
  const m = onBoard();
  move(m, 2);
  const before = JSON.stringify(m.board);
  newRound(m, seeded(99));
  assert.notEqual(JSON.stringify(m.board), before);
  assert.deepEqual([m.pos[1], m.pos[2], m.turn, m.moves, m.scores[1], m.scores[2]], [1, 1, 1, 0, 0, 0]);
});

test('whole games always finish, and not too long (exact roll, new board each game)', () => {
  const rand = seeded(5);
  const m = createMatch({ vsRobot: false, p1: 'bear', p2: 'cat', firstRule: 'alt' });
  const turns = [];
  for (let g = 0; g < 400; g++) {
    newRound(m, rand);
    while (!m.result) {
      assert.ok(m.moves < 1000, 'a game never ended');
      const r = move(m, rollDie(rand));
      assert.ok(r.ok);
      assert.ok(r.at >= 1 && r.at <= GOAL);
    }
    turns.push(Math.ceil(m.moves / 2));
  }
  assert.equal(m.scores[1] + m.scores[2], 400);
  turns.sort((a, b) => a - b);
  const median = turns[200], p90 = turns[360];
  // The simulation behind the agreed design: about 10 turns each, 9 in 10
  // games within about 16 (journal, mockup v3).
  assert.ok(median >= 7 && median <= 13, `median ${median}`);
  assert.ok(p90 <= 22, `90% within ${p90}`);
});
