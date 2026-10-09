import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endMoods, endSound } from '../src/core/players.js';

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
