// Tin Can Alley's physics (src/core/tin-can-alley-physics.js) under Node,
// checking what the mockup's sweeps checked in the browser (journal,
// "Stall mockup v3 tried" and "v4"): every lot of cans stands still,
// asleep; a good straight throw knocks cans off; rounds of 3 throws end
// with no can hanging on the curtain; a round picked up again puts the
// cans where they were. Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStall, BALL_LIFE } from '../src/core/tin-can-alley-physics.js';
import {
  LAYOUTS, SHELF, CAN, BACK, CURTAIN_T, isOff, createMatch, throwBall, update, cameraAt,
} from '../src/core/tin-can-alley.js';

const DT = 1 / 60;
// Steps the stall and the match together, `sec` s; returns the round's end once.
function play(stall, m, sec) {
  let ended = null;
  for (let t = 0; t < sec - 1e-9; t += DT) {
    stall.step(DT);
    ended = update(m, DT, { off: stall.offCount(), still: stall.still() }).ended ?? ended;
  }
  return ended;
}
// Throws (after waiting for the camera) and returns the throw.
function toss(stall, m, power, aim) {
  while (cameraAt(m.round.since).view !== 'behind') play(stall, m, DT);
  const r = throwBall(m, power, aim);
  assert.ok(r.ok, `throw refused: ${r.why}`);
  stall.throwBall(r.vec, r.ball);
  return r;
}

test('tin can alley physics: every lot of cans stands still for 10 s, asleep', () => {
  for (const layout of LAYOUTS) {
    const s = createStall();
    s.setCans(layout);
    for (let i = 0; i < 600; i++) s.step(DT);
    assert.equal(s.awake(), 0, `${layout}: cans woke with nothing touching them`);
    assert.ok(s.drift() < 1e-6, `${layout}: cans moved ${s.drift()} m`);
    assert.equal(s.offCount(), 0, `${layout}: a can fell`);
    assert.ok(s.still());
  }
});

test('tin can alley physics: a straight throw at power 0.4 knocks Pyramid 6\'s cans off; the ball wakes them', () => {
  const hits = [];
  const s = createStall({ onHit: h => hits.push(`${h.a}-${h.b}`) });
  const m = createMatch({ p1: 'bear', layout: '6' });
  s.setCans('6');
  toss(s, m, 0.4, 0);
  play(s, m, 4);
  assert.ok(s.hits > 0, 'the ball touched no can');
  assert.ok(m.round.off >= 2, `only ${m.round.off} off`);
  assert.ok(hits.includes('ball-can'), `no ball-can knock in ${[...new Set(hits)]}`);
  assert.ok(hits.includes('can-stall') || hits.includes('can-can'), 'no can knock');
});

test('tin can alley physics: a throw that misses leaves the cans asleep; the ball is taken away', () => {
  const s = createStall();
  const m = createMatch({ p1: 'bear', layout: 'wall' });
  s.setCans('wall');
  toss(s, m, 0.05 + 0.02, 0);   // falls short, on the ground before the counter
  assert.equal(s.balls.length, 1);
  play(s, m, 3);
  assert.equal(s.awake(), 0);
  assert.equal(m.round.off, 0);
  play(s, m, BALL_LIFE);
  assert.equal(s.balls.length, 0, 'the ball was not taken away');
});

// Rounds of 3 throws over every lot of cans, aimed all over (12 rounds,
// 36 throws): each round ends; every can either still on the shelf, or
// off and not hanging on the curtain (its nearest point within 1 cm of the
// curtain's face while above the shelf's foot).
test('tin can alley physics: rounds of 3 throws end, and no can is left hanging on the curtain', () => {
  const powers = [[0.25, 0.35, 0.45], [0.4, 0.5, 0.6], [0.3, 0.55, 0.35]];
  const face = BACK + CURTAIN_T / 2;
  let rounds = 0, cansChecked = 0, offTotal = 0;
  for (const layout of LAYOUTS) {
    for (const [i, set] of powers.entries()) {
      const s = createStall();
      const m = createMatch({ p1: 'bear', layout });
      s.setCans(layout);
      let ended = null;
      for (const [k, p] of set.entries()) {
        toss(s, m, p, [(i - 1) * 0.3, 0.15, -0.15][k]);
        ended = play(s, m, 2.45) ?? ended;
      }
      ended = ended ?? play(s, m, 8);
      assert.ok(ended, `${layout} round ${i}: never ended`);
      rounds++;
      offTotal += ended.off;
      assert.equal(ended.off, s.offCount(), 'the result is not the cans');
      for (const c of s.cans) {
        cansChecked++;
        const p = c.position;
        const q = c.quaternion, ax = { z: 2 * (q.y * q.z - q.w * q.x) };   // the can's axis' z
        const reach = Math.abs(ax.z) * CAN.h / 2 + Math.sqrt(Math.max(0, 1 - ax.z * ax.z)) * CAN.r;
        const onCurtain = p.z - reach - face < 0.01;
        assert.ok(!(onCurtain && p.y > SHELF.y * 0.5), `${layout} round ${i}: a can hangs on the curtain at ${p.y.toFixed(2)} m`);
        if (!isOff(p)) assert.ok(Math.abs(p.z - SHELF.z) <= SHELF.d / 2, 'a can on the shelf is past its edge');
      }
    }
  }
  assert.equal(rounds, 12);
  assert.ok(cansChecked >= 12 * 6, `only ${cansChecked} cans checked`);
  assert.ok(offTotal > 0, 'no throw knocked any can off');
});

// Q63 (journal, "Block game mockup v1"): cannon-es works out a body's box
// (AABB) as it's made, at the origin, and again only when it moves; the
// cans and the stall's boxes are placed after they're made and never move
// until hit, so the broadphase sorted them as if at the origin and some
// throws aimed off the middle went through the cans.
test('tin can alley physics: every body\'s collision box is where the body is (Q63)', () => {
  let checked = 0;
  for (const layout of LAYOUTS) {
    for (const poses of [null, 'picked up']) {
      const s = createStall();
      let p = null;
      if (poses) { s.setCans(layout); p = s.poses(); }
      s.setCans(layout, p);
      s.step(DT);
      for (const b of s.world.bodies) {
        if (b.shapes[0].type === 2 /* a plane: endless */) continue;
        const { lowerBound: lo, upperBound: hi } = b.aabb;
        const inside = ['x', 'y', 'z'].every(k => lo[k] - 1e-9 <= b.position[k] && b.position[k] <= hi[k] + 1e-9);
        assert.ok(inside, `${layout}${poses ? ' (picked up)' : ''}: a ${b.kind}'s box is at ${['x', 'y', 'z'].map(k => ((lo[k] + hi[k]) / 2).toFixed(2))}, the body at ${['x', 'y', 'z'].map(k => b.position[k].toFixed(2))}`);
        checked++;
      }
    }
  }
  assert.ok(checked >= LAYOUTS.length * 2 * 10, `only ${checked} bodies checked`);
});

// Throws aimed left and right of the middle, each at a pile it reaches:
// every one touches a can. (As built in 8.1, Pyramid 6 at power 0.35, aim
// -0.1, touched none, and 30 of 189 such throws missed.)
test('tin can alley physics: throws aimed left and right of the middle touch a can (Q63)', () => {
  const missed = [];
  let n = 0;
  // (Pyramid 6 is too narrow for ±0.3: those miss on both sides, fixed or not.)
  for (const [layout, aims] of [['6', [-0.2, -0.1, 0.1, 0.2]], ['15', [-0.3, -0.2, -0.1, 0.1, 0.2, 0.3]]]) {
    for (const aim of aims) {
      const s = createStall();
      const m = createMatch({ p1: 'bear', layout });
      s.setCans(layout);
      toss(s, m, 0.35, aim);
      play(s, m, 2);
      n++;
      if (s.hits === 0) missed.push(`${layout} aim ${aim}`);
    }
  }
  assert.equal(n, 10);
  assert.deepEqual(missed, [], `the ball went through the cans: ${missed.join(', ')}`);
});

test('tin can alley physics: a round picked up again: the cans where they had come to rest, asleep', () => {
  const s = createStall();
  const m = createMatch({ p1: 'bear', layout: '10' });
  s.setCans('10');
  toss(s, m, 0.4, 0);
  let waited = 0;
  while (!s.still() && waited < 15) { play(s, m, 0.5); waited += 0.5; }
  assert.ok(s.still(), 'the cans did not settle in 15 s');
  const poses = JSON.parse(JSON.stringify(s.poses()));
  const off = s.offCount();
  const back = createStall();
  back.setCans('10', poses);
  assert.equal(back.offCount(), off);
  for (let i = 0; i < 120; i++) back.step(DT);
  assert.equal(back.awake(), 0, 'cans put back woke up');
  back.cans.forEach((c, i) => {
    const d = Math.hypot(c.position.x - poses[i].p[0], c.position.y - poses[i].p[1], c.position.z - poses[i].p[2]);
    assert.ok(d < 1e-3, `can ${i} moved ${d} m once put back`);
  });
});
