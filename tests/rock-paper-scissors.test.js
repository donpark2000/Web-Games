import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PICKS, BEATS, FIRST_TO, ROBOT, checkFaces, judge, robotPick, createMatch, newGame, newRound, unlock, choose,
} from '../src/core/rock-paper-scissors.js';
import { PICTURES, SAYS } from '../src/ui/rpspics.js';

// A rand() that makes the robot pick `p` (0, 1/3, 2/3 land on each pick).
const makes = p => () => PICKS.indexOf(p) / 3 + 0.01;
// Plays one round: the robot picks `robot`, the countdown ends, you pick `mine`.
function round(m, mine, robot) {
  newRound(m, makes(robot));
  unlock(m);
  return choose(m, mine);
}

test('judge: rock beats scissors, paper beats rock, scissors beat paper; same is 0', () => {
  for (const p of PICKS) {
    assert.equal(judge(p, BEATS[p]), 1, `${p} beats ${BEATS[p]}`);
    assert.equal(judge(BEATS[p], p), 2, `${BEATS[p]} loses to ${p}`);
    assert.equal(judge(p, p), 0);
  }
  assert.deepEqual(BEATS, { rock: 'scissors', paper: 'rock', scissors: 'paper' });
  assert.throws(() => judge('rock', 'lizard'), /bad pick/);
});

test('robot: picks each of the three, about equally', () => {
  assert.equal(robotPick(() => 0), 'rock');
  assert.equal(robotPick(() => 0.4), 'paper');
  assert.equal(robotPick(() => 0.99), 'scissors');
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = { rock: 0, paper: 0, scissors: 0 };
  for (let i = 0; i < 3000; i++) n[robotPick(rand)]++;
  for (const p of PICKS) assert.ok(n[p] > 900 && n[p] < 1100, `${p}: ${n[p]} of 3000`);
});

test('setup: always against the robot; a face is needed', () => {
  assert.deepEqual(createMatch({ p1: 'fox' }).faces, ['fox', ROBOT]);
  assert.equal(checkFaces({ p1: null }), 'p1-missing');
  assert.equal(checkFaces({ p1: 'robot' }), 'unknown-face');
  assert.throws(() => createMatch({ p1: '' }), /p1-missing/);
});

test('a round: no picking until the countdown ends; one pick per round', () => {
  const m = createMatch({ p1: 'bear' });
  assert.deepEqual(choose(m, 'rock'), { ok: false, why: 'no-round' });
  assert.equal(newRound(m, makes('paper')), 'paper', 'the robot picks first');
  assert.deepEqual(choose(m, 'rock'), { ok: false, why: 'not-yet' }, 'still counting');
  assert.equal(m.round.mine, null);
  unlock(m);
  assert.deepEqual(choose(m, 'lizard'), { ok: false, why: 'bad-pick' });
  assert.deepEqual(choose(m, 'scissors'), { ok: true, robot: 'paper', winner: 1, gameOver: false });
  assert.deepEqual(choose(m, 'rock'), { ok: false, why: 'already' }, 'no changing your mind');
  assert.equal(unlock(m), false);
});

test('the robot cannot change its pick after yours', () => {
  const m = createMatch({ p1: 'bear' });
  newRound(m, makes('rock'));
  unlock(m);
  const robotBefore = m.round.robot;
  choose(m, 'paper');
  assert.equal(m.round.robot, robotBefore);
  assert.equal(m.round.winner, 1);
});

test('first to 3 wins the game; the same pick is not counted', () => {
  const m = createMatch({ p1: 'bear' });
  assert.equal(FIRST_TO, 3);
  assert.equal(round(m, 'rock', 'rock').winner, 0);
  assert.deepEqual(m.stars, { 1: 0, 2: 0 });
  round(m, 'rock', 'scissors');
  round(m, 'rock', 'paper');
  round(m, 'paper', 'rock');
  assert.deepEqual(m.stars, { 1: 2, 2: 1 });
  const last = round(m, 'scissors', 'paper');
  assert.equal(last.gameOver, true);
  assert.deepEqual(m.result, { winner: 1 });
  assert.deepEqual(m.games, { 1: 1, 2: 0 });
  assert.equal(m.rounds, 5);
  assert.deepEqual(choose(m, 'rock'), { ok: false, why: 'game-over' });
  assert.throws(() => newRound(m), /game is over/);
});

test('play again: a new game keeps games won; mid-game it is not counted', () => {
  const m = createMatch({ p1: 'bear' });
  for (let i = 0; i < 3; i++) round(m, 'paper', 'scissors');   // the robot wins 3-0
  assert.deepEqual(m.games, { 1: 0, 2: 1 });
  newGame(m);
  assert.deepEqual(m.stars, { 1: 0, 2: 0 });
  assert.equal(m.result, null);
  assert.deepEqual(m.games, { 1: 0, 2: 1 }, 'games won kept');
  round(m, 'rock', 'scissors');
  newGame(m);   // mid-game
  assert.deepEqual(m.stars, { 1: 0, 2: 0 });
  assert.deepEqual(m.games, { 1: 0, 2: 1 }, 'the restarted game counted for nobody');
});

test('pictures and sayings: one for each pick', () => {
  for (const p of PICKS) {
    assert.match(PICTURES[p], /^<svg class="av" viewBox="0 0 100 100"/, p);
    assert.match(SAYS[p], new RegExp(`^${p[0].toUpperCase() + p.slice(1)} .* ${BEATS[p]}!$`), p);
  }
});
