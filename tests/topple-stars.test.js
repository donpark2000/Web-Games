// Topple!'s stars and one game for each difficulty (Q116): the core only
// (no browser). Stars by balls used, the best kept, a scene started from
// the map, and the profile of three games read from what the device holds,
// including a game kept before there were stars.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, readGame, sceneOver, switchLevel, placeOf, isOpen, seedOf, SCENES, HEARTS, MAX_LEVEL, MODES,
  starsForBalls, starsOf, starTotal, STARS_ALL, recordStars, playableScene, startAtScene, readProfile, createProfile,
} from '../src/core/topple.js';

const copy = o => JSON.parse(JSON.stringify(o));

test('stars: 3 balls or fewer 3, 4 balls 2, 5 balls 1; nothing else earns any', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(starsForBalls), [3, 3, 3, 2, 1]);
  for (const bad of [0, 6, -1, 2.5, NaN, null, undefined, '3']) assert.equal(starsForBalls(bad), 0, String(bad));
  assert.equal(STARS_ALL, MAX_LEVEL * SCENES * 3);
});

test('stars: the best only goes up; a game with none carries no stars field', () => {
  const g = createGame(11);
  assert.equal(g.stars, undefined);
  assert.deepEqual(starsOf(g, 1), [0, 0, 0, 0, 0]);
  assert.deepEqual(recordStars(g, 1, 2, 2), { stars: 2, best: 0, improved: true });
  assert.deepEqual(recordStars(g, 1, 2, 1), { stars: 1, best: 2, improved: false });
  assert.deepEqual(recordStars(g, 1, 2, 0), { stars: 0, best: 2, improved: false }, 'a lost scene takes nothing away');
  assert.deepEqual(recordStars(g, 1, 2, 3), { stars: 3, best: 2, improved: true });
  assert.deepEqual(starsOf(g, 1), [0, 3, 0, 0, 0]);
  recordStars(g, 3, 5, 1);
  assert.equal(starTotal(g), 4);
  assert.equal(starTotal(g, 3), 1);
  assert.equal(starTotal(g, 2), 0);
  for (const bad of [[0, 1], [6, 1], [1, 0], [1, 6], [1, 1.5]]) assert.throws(() => recordStars(g, ...bad, 1), /bad scene/, String(bad));
  const o = starsOf(g, 1); o[0] = 3;
  assert.deepEqual(starsOf(g, 1)[0], 0, 'starsOf hands out a copy');
});

test('stars: kept on the device, read back; odd ones dropped, not the game; a new game keeps them', () => {
  const g = createGame(12);
  recordStars(g, 1, 1, 3); recordStars(g, 2, 4, 1);
  assert.deepEqual(readGame(copy(g)), g);
  const odd = readGame({ ...copy(g), stars: { 1: [3, 9, -1, 'x', 2.5, 1, 1], 9: [3], 2: 'no', x: [1], 3: [0, 0, 0, 0, 0] } });
  assert.deepEqual(odd.stars, { 1: [3, 3, 0, 0, 0] }, 'capped at 3, junk 0, a level out of range, a row of none, a non-row: dropped');
  assert.equal(readGame({ ...copy(g), stars: 'x' }).stars, undefined);
  assert.deepEqual(createGame(13, g).stars, g.stars, 'Start over and the whole game again keep the best');
  assert.notEqual(createGame(13, g).stars, g.stars, 'a copy');
  assert.equal(createGame(14).stars, undefined);
  assert.deepEqual(createGame(15, { stars: g.stars }).reached, 1, 'Start over: stars only, nothing else carried');
});

test('stars from the map: a won scene or the place can be started; a later one cannot; a done level any', () => {
  const g = createGame(21);
  assert.equal(playableScene(g, 1, 1), true, 'the place');
  assert.equal(playableScene(g, 1, 2), false, 'a later scene');
  assert.equal(playableScene(g, 2, 1), false, 'a level not open');
  assert.equal(playableScene(g, 1, 0) || playableScene(g, 1, 6) || playableScene(g, 1, 1.5), false);
  assert.equal(startAtScene(g, 1, 3), false);
  assert.deepEqual([g.scene, g.hearts, g.jewels], [1, HEARTS, 0], 'nothing changed');
  // win scenes 1-3 (stars), lose a heart on 4
  for (const s of [1, 2, 3]) { recordStars(g, 1, s, 3); sceneOver(g, true); }
  sceneOver(g, false);
  assert.deepEqual([g.scene, g.hearts, g.jewels], [4, 2, 3]);
  assert.equal(playableScene(g, 1, 4), true);
  assert.equal(playableScene(g, 1, 5), false);
  const s0 = seedOf(g);
  assert.equal(startAtScene(g, 1, 4), true, 'the place: carried on');
  assert.deepEqual([g.scene, g.hearts, g.jewels, seedOf(g)], [4, 2, 3, s0]);
  assert.equal(startAtScene(g, 1, 2), true, 'a won scene again');
  assert.deepEqual([g.scene, g.hearts, g.jewels], [2, HEARTS, 1], '3 hearts, the jewels before it');
  assert.notEqual(seedOf(g), s0, 'new scenes');
  // play it through to the level's end: the level is done and on to level 2
  const out = [];
  while (g.level === 1) out.push(sceneOver(g, true));
  assert.deepEqual(out, ['won', 'won', 'won', 'level']);
  assert.equal(g.level, 2);
  assert.equal(isOpen(g, 2), true);
  // a done level: every scene can be started, those without stars too
  assert.equal(g.done.includes(1), true);
  assert.equal(playableScene(g, 1, 5), true);
  assert.equal(startAtScene(g, 1, 5), true);
  assert.deepEqual([g.level, g.scene, g.hearts, g.jewels], [1, 5, HEARTS, 4]);
  assert.deepEqual(placeOf(g, 2), { scene: 1, hearts: HEARTS, jewels: 0 }, 'level 2 keeps its place');
});

test('profile: a game kept before becomes the one for its difficulty; the others start empty', () => {
  const old = createGame(31, null, 'harder');
  sceneOver(old, true);
  const p = readProfile(copy(old));
  assert.equal(p.mode, 'harder');
  assert.deepEqual(p.games.harder, old);
  assert.equal(p.games.normal, null);
  assert.equal(p.games.hardest, null);
  assert.deepEqual(Object.keys(p.games), MODES);
  // one kept before Q96 (no mode) was Normal
  const { mode, ...noMode } = copy(old);
  assert.equal(readProfile(noMode).mode, 'normal');
});

test('profile: three games, each with its own progress and stars, read back as kept', () => {
  const n = createGame(41, null, 'normal'), h = createGame(42, null, 'hardest');
  for (let i = 0; i < 5; i++) { recordStars(n, 1, i + 1, 3); sceneOver(n, true); }
  assert.equal(n.reached, 2);
  recordStars(h, 1, 1, 1); sceneOver(h, true);
  const p = createProfile(n);
  p.games.hardest = h; p.mode = 'hardest';
  const back = readProfile(copy(p));
  assert.equal(back.mode, 'hardest');
  assert.deepEqual(back.games.normal, n);
  assert.deepEqual(back.games.hardest, h);
  assert.equal(back.games.normal.reached, 2);
  assert.equal(back.games.hardest.reached, 1, 'unlocked on its own');
  assert.equal(isOpen(back.games.hardest, 2), false);
  assert.equal(starTotal(back.games.normal), 15);
  assert.equal(starTotal(back.games.hardest), 1);
});

test('profile: what makes no sense is refused or repaired, never thrown', () => {
  for (const bad of [null, undefined, 5, 'x', [], {}, { v: 2 }, { v: 2, games: 5 }, { v: 2, games: {} }, { v: 2, games: { normal: { seed: 0 } } }]) {
    assert.equal(readProfile(bad), null, JSON.stringify(bad));
  }
  const g = createGame(51, null, 'harder');
  // a game filed under the wrong difficulty takes the one it is filed under
  const p = readProfile({ v: 2, mode: 'normal', games: { harder: { ...g, mode: 'normal' } } });
  assert.equal(p.mode, 'harder', 'the picked difficulty has no game: the first that has');
  assert.equal(p.games.harder.mode, 'harder');
  assert.equal(readProfile({ v: 2, mode: 'easy', games: { harder: g } }).mode, 'harder', 'an unknown difficulty');
});
