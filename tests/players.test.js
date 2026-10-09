import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FACE_NAMES, ROBOT, NAMES, nameOf, twoPlayerFaces, endMoods, endSound, checkFaces,
} from '../src/core/players.js';

test('endMoods: the winner smiles, the loser shows the "aww" face', () => {
  assert.deepEqual(endMoods(1), { 1: 'winner', 2: 'sad' });
  assert.deepEqual(endMoods(2), { 1: 'sad', 2: 'winner' });
});

test('endMoods: a tie, both smile; alone, the player smiles (no one is sad)', () => {
  assert.deepEqual(endMoods(0), { 1: 'winner', 2: 'winner' });
  assert.deepEqual(endMoods(1, { solo: true }), { 1: 'winner' });
});

test('endMoods: a winner that is not 0, 1 or 2 is an error, not a blank face', () => {
  for (const bad of [3, -1, null, undefined, '1']) assert.throws(() => endMoods(bad), /bad winner/);
});

test('endSound: a person winning cheers, the robot winning is a gentle "aww", a tie dings', () => {
  assert.equal(endSound(1, { vsRobot: true }), 'win');
  assert.equal(endSound(2, { vsRobot: true }), 'aww');
  assert.equal(endSound(0, { vsRobot: true }), 'tie');
  // Two players: only the cheer (the loser's "aww" face is enough).
  assert.equal(endSound(1), 'win');
  assert.equal(endSound(2), 'win');
  assert.equal(endSound(0), 'tie');
  assert.equal(endSound(1, { solo: true }), 'win');
});

test('endSound: a winner that is not 0, 1 or 2 is an error', () => {
  for (const bad of [3, null, undefined]) assert.throws(() => endSound(bad), /bad winner/);
});

test('names: every face and the robot has its own fixed name', () => {
  assert.deepEqual(Object.keys(NAMES).sort(), [...FACE_NAMES, ROBOT].sort());
  assert.equal(nameOf('lion'), 'Leo');
  assert.equal(nameOf('grandma'), 'Grandma');
  assert.equal(nameOf(ROBOT), 'Robot');
  const names = Object.values(NAMES);
  assert.equal(new Set(names).size, names.length, 'two faces share a name');
  assert.equal(names.length, 15);
});

test('names: the girl and boy faces are gone; an unknown face has no name (an error, not blank)', () => {
  for (const gone of ['girl', 'boy']) {
    assert.ok(!FACE_NAMES.includes(gone), `${gone} still pickable`);
    assert.equal(checkFaces({ onePlayer: true, p1: gone }), 'unknown-face');
  }
  for (const bad of ['girl', 'boy', '', undefined, 'toString']) assert.throws(() => nameOf(bad), /unknown face/);
});

test('twoPlayerFaces: the "Two players" button shows two different faces', () => {
  assert.deepEqual(twoPlayerFaces(null, null), ['bear', 'cat']);
  assert.deepEqual(twoPlayerFaces('lion', null), ['lion', 'cat']);
  assert.deepEqual(twoPlayerFaces('cat', null), ['cat', 'bear']);
  assert.deepEqual(twoPlayerFaces('lion', 'frog'), ['lion', 'frog']);
  // Player 2's pick the same as player 1's (left from "Me and the robot"): another face.
  assert.deepEqual(twoPlayerFaces('cat', 'cat'), ['cat', 'bear']);
  for (const p1 of [null, ...FACE_NAMES]) {
    for (const p2 of [null, ...FACE_NAMES]) {
      const [a, b] = twoPlayerFaces(p1, p2);
      assert.notEqual(a, b, `${p1}/${p2}`);
      assert.ok(FACE_NAMES.includes(a) && FACE_NAMES.includes(b), `${p1}/${p2}`);
    }
  }
});
