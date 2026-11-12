// Topple!'s animals' walks (src/core/topple-animals.js): each crosses the
// view once a scene, and a block falling while it's in view frightens it
// (developer, 2026-11-12: "acted frightened when blocks fall and reverse
// direction and run off"): startled a moment, then off away from the block,
// faster, out of sight. Time moves on in fixed steps (no clock).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossing, perched, STARTLE, FLEE, HOOT_EVERY, OWL_FLY } from '../src/core/topple-animals.js';

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

// Star Light's owl (developer, 2026-11-12, Q87: "sitting on a tree branch
// and just say 'who' once in a while"): it sits from the scene's start,
// hoots now and then; a block falling startles it, then it flies off away
// from the block, climbing, out of sight; back on its branch next scene.
test('topple animals: the owl sits and hoots now and then; a fall startles it and it flies off away, out of sight; back next scene', () => {
  const owl = perched(55, 1);
  owl.setSeat([3, 2.6, -13]); owl.reset(edges);
  assert.deepEqual([owl.x, owl.y, owl.on, owl.scared], [3, 2.6, true, false]);
  // 60 s sitting: hoots, the first 3-6 s in, then every HOOT_EVERY s
  const at = [];
  for (let s = 0; s < 60 / DT; s++) if (owl.tick(DT)) at.push(s * DT);
  assert.ok(at[0] >= 3 && at[0] <= 6 + DT, `first hoot at ${at[0]}`);
  for (let i = 1; i < at.length; i++) { const gap = at[i] - at[i - 1]; assert.ok(gap >= HOOT_EVERY[0] - DT && gap <= HOOT_EVERY[1] + DT, `a hoot ${gap.toFixed(2)} s after the last`); }
  assert.ok(at.length >= 4 && at.length <= 8, `${at.length} hoots in a minute`);
  assert.deepEqual([owl.x, owl.y], [3, 2.6], 'moved while sitting');
  // a block to its left: startled STARTLE s (put), then off to the right, climbing, no hoots
  assert.deepEqual(owl.fright(1), { x: 3, from: 1, turned: false, flew: 1 });
  let hoots = 0;
  for (let s = 0; s < (STARTLE - 0.02) / DT; s++) hoots += owl.tick(DT);
  assert.deepEqual([owl.x, owl.y, owl.flying], [3, 2.6, false], 'moved while startled');
  for (let s = 0; s < 0.54 / DT; s++) hoots += owl.tick(DT);
  assert.ok(owl.flying && Math.abs(owl.x - 3 - OWL_FLY * 0.5) < 0.1, `flew to x ${owl.x}`);
  assert.ok(owl.y > 2.6, 'not climbing');
  assert.equal(owl.fright(owl.x + 1), null, 'frightened twice');
  for (let s = 0; s < 10 / DT && owl.on; s++) hoots += owl.tick(DT);
  assert.equal(owl.on, false, 'still in sight');
  assert.ok(owl.x > 5 + 1, `gone at x ${owl.x}`);
  assert.equal(hoots, 0, 'hooted, frightened');
  assert.equal(owl.fright(0), null, 'frightened once gone');
  // a new scene: back on its branch, calm; a block to its right sends it left
  owl.reset();
  assert.deepEqual([owl.x, owl.y, owl.on, owl.scared], [3, 2.6, true, false]);
  owl.fright(4);
  for (let s = 0; s < 1 / DT; s++) owl.tick(DT);
  assert.ok(owl.dir === -1 && owl.x < 3, `flew to x ${owl.x}`);
});
