// Topple!'s animals' walks (src/core/topple-animals.js): each crosses the
// view once a scene, and a block falling while it's in view frightens it
// (developer, 2026-11-12: "acted frightened when blocks fall and reverse
// direction and run off"): startled a moment, then off away from the block,
// faster, out of sight. Time moves on in fixed steps (no clock).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossing, STARTLE, FLEE } from '../src/core/topple-animals.js';

const DT = 1 / 60, SPEED = 1;   // m/s walking, in these tests
const edges = () => [-5, 5];    // margin 1: from -6 to 6 (or back)
// t s on, walking SPEED m/s times its pace; how far it went
function walk(go, t) {
  const x0 = go.x;
  for (let s = 0; s < t / DT; s++) { go.tick(DT); go.advance(DT * SPEED * go.pace); }
  return go.x - x0;
}
// a crossing in view, a little way in
function inView(seed = 3, hold) {
  const go = crossing(seed, 0, -8, 1, hold);
  go.reset(edges);
  let n = 0;
  while (!go.on) { go.tick(DT); if (++n > 11 / DT) throw new Error('never set off'); }
  walk(go, 2);
  assert.ok(go.on && Math.abs(go.x) < 6, `in view (x ${go.x})`);
  return go;
}

test('topple animals: a block falling ahead of it: startled, then back the way it came, faster, out of sight', () => {
  const go = inView(), dir = go.dir, x = go.x;
  const r = go.fright(x + dir * 2);   // the block ahead of it
  assert.deepEqual(r, { x: Math.round(x * 100) / 100, from: Math.round((x + dir * 2) * 100) / 100, turned: true });
  assert.equal(go.dir, -dir, 'turned back');
  assert.equal(go.pace, FLEE);
  // startled: it stays put STARTLE s
  assert.equal(walk(go, STARTLE - 0.02), 0, 'moved while startled');
  assert.ok(go.startled > 0.9, `startled ${go.startled}`);
  walk(go, 0.04);
  assert.equal(go.startled, 0);
  // then off, FLEE times as fast
  const m = walk(go, 0.5);
  assert.ok(Math.abs(m - -dir * FLEE * SPEED * 0.5) < 0.05, `went ${m} m in 0.5 s`);
  // out of sight on the side it came from, then gone
  for (let i = 0; i < 600 && go.on; i++) walk(go, 0.1);
  assert.ok(go.done && !go.on, 'still in view');
  assert.ok(dir > 0 ? go.x < -6 : go.x > 6, `left on the far side (x ${go.x})`);
});

test('topple animals: a block falling behind it: not turned, just off faster; once a crossing; calm again next scene', () => {
  const go = inView(7), dir = go.dir;
  const r = go.fright(go.x - dir * 3);   // behind it
  assert.equal(r.turned, false);
  assert.equal(go.dir, dir);
  assert.equal(go.pace, FLEE);
  // a second block: nothing more (it's already off)
  walk(go, STARTLE + 0.1);
  assert.equal(go.fright(go.x + dir * 1), null);
  assert.equal(go.dir, dir, 'turned by a second block');
  // a new scene: walking again, not frightened
  go.reset();
  assert.equal(go.scared, false);
  assert.equal(go.pace, 1);
  assert.equal(go.startled, 0);
});

test('topple animals: no fright before it sets off or once it\'s gone; the birds (no hold) don\'t stop', () => {
  const go = crossing(5, 0, -8, 1);
  go.reset(edges);
  assert.equal(go.on, false);
  assert.equal(go.fright(0), null, 'frightened before it was in view');
  // gone: walked out of sight
  while (!go.done) { go.tick(DT); go.advance(DT * SPEED * go.pace); }
  assert.equal(go.fright(go.x), null, 'frightened once gone');
  assert.equal(go.scared, false);
  // in the air: off at once
  const bird = inView(9, 0), dir = bird.dir;
  bird.fright(bird.x + dir);
  assert.equal(bird.startled, 0);
  const m = walk(bird, 0.2);
  assert.ok(Math.abs(m - -dir * FLEE * SPEED * 0.2) < 0.05, `went ${m} m in 0.2 s`);
});

test('topple animals: each crossing still starts and ends just out of sight, either way', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const go = crossing(seed, 0, -8, 1);
    go.reset(edges);
    while (!go.on) go.tick(DT);
    assert.equal(go.x, go.dir > 0 ? -6 : 6, `seed ${seed} started at ${go.x}`);
    seen.add(go.dir);
    while (!go.done) { go.tick(DT); go.advance(DT * SPEED); }
    assert.ok(go.dir > 0 ? go.x > 6 : go.x < -6, `seed ${seed} ended at ${go.x}`);
  }
  assert.equal(seen.size, 2, 'all one way');
});
