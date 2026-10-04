import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endMoods } from '../src/core/players.js';

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
