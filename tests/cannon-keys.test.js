// cannon-es's touch keys that can't overflow (journal Q136,
// src/core/cannon-keys.js): touches are still reported once the page has made
// more bodies than cannon-es's 16-bit keys hold. Each test file runs in its
// own process, so the id counters set here touch nothing else; they're put
// back anyway. Hermetic: no files, no clock.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as CANNON from '../src/vendor/cannon-es/cannon-es.js';
import { safeContactKeys, KEY_SPAN } from '../src/core/cannon-keys.js';
import { createMoonWorld } from '../src/core/topple-moon-world.js';
import { createWorld } from '../src/core/topple-world.js';

// The id counters from `n` for the length of fn.
function idsFrom(n, fn) {
  const b = CANNON.Body.idCounter, s = CANNON.Shape.idCounter;
  CANNON.Body.idCounter = n; CANNON.Shape.idCounter = n;
  try { return fn(); } finally { CANNON.Body.idCounter = b; CANNON.Shape.idCounter = s; }
}

// A box on the ground and a ball dropped on it in a plain world (fixed or not):
// the begin and end touches reported, and the ball's among them.
function dropOnBox(fix) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  if (fix) safeContactKeys(world);
  const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  const box = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.2)), position: new CANNON.Vec3(0, 0.2, 0) });
  const ball = new CANNON.Body({ mass: 0.3, shape: new CANNON.Sphere(0.1), position: new CANNON.Vec3(0, 1, 0) });
  ball.velocity.set(0, 0, 0);
  for (const b of [ground, box, ball]) world.addBody(b);
  const begins = [], ends = [];
  world.addEventListener('beginContact', e => begins.push([e.bodyA, e.bodyB]));
  world.addEventListener('endContact', e => ends.push([e.bodyA, e.bodyB]));
  for (let i = 0; i < 120; i++) world.step(1 / 60);
  // knock the ball away again: its touch with the box ends
  ball.position.set(5, 1, 0); ball.velocity.set(0, 0, 0);
  for (let i = 0; i < 10; i++) world.step(1 / 60);
  const has = (list, x, y) => list.some(([a, b]) => (a === x && b === y) || (a === y && b === x));
  return { begins: begins.length, ballBox: has(begins, ball, box), boxGround: has(begins, box, ground), ballBoxEnded: has(ends, ball, box), strays: begins.filter(p => !p[0] || !p[1]).length };
}

test('Q136: a plain cannon-es world loses touches once the ids pass 65535; with safe keys it reports them all', () => {
  // the bug itself, so this test can catch it coming back
  const low = idsFrom(0, () => dropOnBox(false));
  assert.ok(low.ballBox && low.boxGround, `low ids, plain: the ball and the box touch reported (${JSON.stringify(low)})`);
  const high = idsFrom(70000, () => dropOnBox(false));
  assert.ok(!high.ballBox, `ids past 70000, plain: cannon-es loses the ball's touch (${JSON.stringify(high)})`);
  // the fix, low and high: every touch, each with the right two bodies
  for (const from of [0, 33000, 70000, 5_000_000]) {
    const r = idsFrom(from, () => dropOnBox(true));
    assert.ok(r.ballBox, `ids from ${from}: the ball's touch with the box reported`);
    assert.ok(r.boxGround, `ids from ${from}: the box's touch with the ground reported`);
    assert.ok(r.ballBoxEnded, `ids from ${from}: the ball's touch with the box ended`);
    assert.equal(r.strays, 0, `ids from ${from}: no touch reported with a body that isn't there`);
  }
});

test('Q136: the keys stay in order and unpack to the same ids', () => {
  const w = safeContactKeys(new CANNON.World());
  const k = w.bodyOverlapKeeper;
  assert.equal(k.getKey(3, 70001), k.getKey(70001, 3), 'either way round, one key');
  assert.ok(k.getKey(70000, 70001) < k.getKey(70001, 70002), 'in order by the first id');
  assert.ok(k.getKey(KEY_SPAN - 2, KEY_SPAN - 1) < 2 ** 53, 'inside a double\'s whole numbers');
  // a pair touching now but not before (an addition), one before but not now (a removal)
  k.set(70000, 70001); k.tick(); k.set(5, 99999);
  const add = [], rem = [];
  k.getDiff(add, rem);
  assert.deepEqual(add, [5, 99999]);
  assert.deepEqual(rem, [70000, 70001]);
});

test('Q136: the moon world made after 70000 bodies still wakes its blocks at the ball\'s first touch', () => {
  const r = idsFrom(70000, () => {
    const hits = [];
    const W = createMoonWorld({ onHit: h => hits.push(h) });
    assert.ok(W.world.safeKeys, 'the moon world has the safe keys');
    // two crates side by side, asleep as a scene starts; the ball dropped on the first
    W.setScene({ blocks: [{ x: 0, y: 0.2, z: 0, w: 0.4, h: 0.4, d: 0.4, mat: 'crate' }, { x: 2, y: 0.2, z: 0, w: 0.4, h: 0.4, d: 0.4, mat: 'crate' }] });
    W.dropBall([0, 1.5, 0], [0, 0, 0]);
    for (let i = 0; i < 180; i++) W.step(1 / 60);
    return { ballHits: hits.filter(h => h.a === 'ball').length, ballBlock: hits.some(h => h.a === 'ball' && h.b === 'block') };
  });
  assert.ok(r.ballBlock, `the ball's touch with the crate heard (${JSON.stringify(r)})`);
});

test('Q136: the park world has the safe keys too (the blast ball goes off at its first touch)', () => {
  const W = createWorld();
  assert.ok(W.world.safeKeys);
});
