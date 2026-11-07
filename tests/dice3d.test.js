// Five Dice 3D's tray maths (src/core/dice3d.js): the dice land on the
// rules' numbers, the spots are clear of each other and of the kept dice,
// the camera keeps the tray in view, and the fit's search finds the same
// row size as trying every one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  v3, qAxis, qMul, qRotate, qFromUnitVectors, qSlerp, qRandom, UP, FACES, upright, topFace, support,
  trayCorners, trayPlaces, backRow, pickSpots, fallbackSpots, planThrow, throwPose, slide, slidePose, cupPose, cupTimes,
  bounces, heightAt, restPose, project, aim, dieAt, trayShape, shapesKnown, bestRow, flat, apart, DIE_GAP, THROW_T, RATIO,
} from '../src/core/dice3d.js';

// The same numbers every run.
function seeded(seed) {
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;
const nearV = (a, b, eps = 1e-6) => near(a.x, b.x, eps) && near(a.y, b.y, eps) && near(a.z, b.z, eps);

test('dice3d: turns as three.js turns them', () => {
  // a quarter turn about the upright takes +x to -z
  assert.ok(nearV(qRotate(qAxis(UP, Math.PI / 2), v3(1, 0, 0)), v3(0, 0, -1)));
  // a then b: b's turn first in a's frame (three.js's multiply)
  const a = qAxis(v3(1, 0, 0), .7), b = qAxis(UP, 1.1), p = v3(.3, -.2, .9);
  assert.ok(nearV(qRotate(qMul(a, b), p), qRotate(a, qRotate(b, p))));
  // from one direction to another, also to the opposite one
  for (const [f, t] of [[v3(1, 0, 0), UP], [UP, v3(0, -1, 0)], [v3(0, 0, 1), v3(0, 0, -1)]]) assert.ok(nearV(qRotate(qFromUnitVectors(f, t), f), t), JSON.stringify([f, t]));
  // halfway between two turns, and the ends
  const h = qSlerp(qAxis(UP, 0), qAxis(UP, 1), .5);
  assert.ok(nearV(qRotate(h, v3(1, 0, 0)), qRotate(qAxis(UP, .5), v3(1, 0, 0))));
  const r = qRandom(seeded(1));
  assert.ok(near(Math.hypot(r.x, r.y, r.z, r.w), 1, 1e-12));
});

test('dice3d: a die shows the number it was turned to, standing on a face', () => {
  assert.deepEqual(FACES.map(f => f.v).sort(), [1, 2, 3, 4, 5, 6]);
  for (const f of FACES) assert.equal(FACES.find(g => nearV(g.n, v3(-f.n.x, -f.n.y, -f.n.z))).v, 7 - f.v, 'opposite faces add up to 7');
  let checked = 0;
  for (let v = 1; v <= 6; v++) for (const yaw of [0, 1, 2.5, 4, 6]) {
    const q = upright(v, yaw);
    assert.equal(topFace(q), v);
    assert.ok(near(support(q), .5, 1e-9), `${v}: stands ${support(q)}`);
    checked++;
  }
  assert.equal(checked, 30);
  // on an edge it stands higher
  assert.ok(support(qMul(qAxis(v3(1, 0, 0), Math.PI / 4), upright(1))) > .6);
  assert.throws(() => upright(7), /no face 7/);
});

test('dice3d: every throw lands on the rules’ numbers, at its spot, never through the felt', () => {
  const rand = seeded(42), places = trayPlaces(4.1, 2.7);
  let landed = 0;
  for (let round = 0; round < 40; round++) {
    const values = Array.from({ length: 5 }, () => 1 + Math.floor(rand() * 6));
    const thrown = values.map((_, i) => ({ i, pos: v3(-2.6 + i * 1.3, 0, 0), quat: qRandom(rand) }));
    const plan = planThrow({ thrown, kept: [], values, places, rand });
    for (const d of thrown) {
      const a = plan.anims[d.i];
      for (let t = a.throwAt; t < a.throwAt + a.T; t += .01) {
        const s = throwPose(a, t);
        assert.ok(s.p.y >= support(s.q) - 1e-9, `die ${d.i} under the felt at ${t}`);
      }
      const end = throwPose(a, a.throwAt + a.T + 1e-9);
      assert.equal(end.phase, 'done');
      assert.equal(topFace(end.q), values[d.i], `round ${round}, die ${d.i}`);
      assert.ok(nearV(end.p, a.to));
      landed++;
    }
  }
  assert.equal(landed, 200);
});

test('dice3d: two resting dice touch only when their squares do', () => {
  // side by side, square: apart from 1 + the margin
  assert.equal(apart({ x: 0, z: 0, yaw: 0 }, { x: 1.07, z: 0, yaw: 0 }), true);
  assert.equal(apart({ x: 0, z: 0, yaw: 0 }, { x: 1.03, z: 0, yaw: 0 }), false);
  // 1.05 apart on a slant, both square: their corners overlap
  assert.equal(apart({ x: 0, z: 0, yaw: 0 }, { x: .75, z: .75, yaw: 0 }), false);
  // 1.05 apart, one turned an eighth: its corner reaches into the other
  assert.equal(apart({ x: 0, z: 0, yaw: 0 }, { x: 1.05, z: 0, yaw: Math.PI / 4 }), false);
  assert.equal(apart({ x: 0, z: 0, yaw: 0 }, { x: 1.3, z: 0, yaw: Math.PI / 4 }), true);
  // a quarter turn looks the same
  assert.equal(apart({ x: 0, z: 0, yaw: Math.PI / 2 }, { x: 1.07, z: 0, yaw: Math.PI }), true);
});

test('dice3d: thrown dice rest apart, inside the tray, clear of the kept dice and the Roll button', () => {
  const rand = seeded(7);
  let checked = 0, tight = 0;
  const found = {};
  for (const [ix, iz] of [[4.1, 2.7], [3.7, 2.1], [3.3, 1.8]]) {
    const places = trayPlaces(ix, iz);
    for (let kept = 0; kept <= 4; kept++) for (let rep = 0; rep < 10; rep++) {
      const n = 5 - kept, fixed = backRow(kept, places.backZ);
      // a pretend Roll button over the front left (the real one is on the
      // front right, where the cup's room keeps dice away anyway: a check
      // there checked nothing)
      const blocked = to => to.x < -ix + 1.8 && to.z > iz - 1.2;
      // in front of the kept dice; failing that, anywhere clear of them (as planThrow)
      let got = pickSpots({ n, fixed, places, kept, blocked, rand }), front = true;
      if (!got && kept) { got = pickSpots({ n, fixed, places, kept, blocked, rand, front: false }); front = false; }
      const key = `${ix}x${iz}/${kept}`;
      found[key] ??= { front: 0, tray: 0 };
      if (got) found[key][front ? 'front' : 'tray']++;
      if (!got) continue;
      const { spots, gap } = got;
      assert.equal(spots.length, n);
      if (gap < 1.42) tight++;
      for (const [k, s] of spots.entries()) {
        assert.ok(Math.abs(s.x) <= ix - .6 && Math.abs(s.z) <= iz - .6 + 1e-9, `outside: ${JSON.stringify(s)}`);
        assert.ok(!blocked(s), 'under Roll');
        for (const o of [...spots.slice(k + 1), ...fixed]) {
          assert.ok(flat(s, o) >= gap - 1e-9, `too close: ${flat(s, o)} < ${gap}`);
          assert.ok(apart(s, o), `touching: ${JSON.stringify([s, o])}`);
        }
        if (kept && front) assert.ok(s.z >= places.backZ + 1.15 - 1e-9, 'in the back row');
        checked++;
      }
    }
  }
  assert.ok(checked > 400, `${checked} spots checked`);
  assert.ok(tight > 0, 'no tight trays tried: the touching check checked nothing hard');
  // room every time; in front of the kept dice but in the shallowest tray
  // (an upright phone's) with 1 kept, where it's nearly always beside it
  for (const [key, n] of Object.entries(found)) {
    assert.equal(n.front + n.tray, 10, `${key}: room ${n.front + n.tray} times in 10`);
    if (key !== '3.3x1.8/1') assert.equal(n.tray, 0, `${key}: beside the kept dice ${n.tray} times`);
  }
  assert.ok(found['3.3x1.8/1'].tray > 0, 'the whole tray never tried');
});

test('dice3d: with no room found, the dice rest in two rows inside the tray (and it says so)', () => {
  const places = trayPlaces(3.3, 1.8);
  const plan = planThrow({
    thrown: [0, 1, 2].map(i => ({ i, pos: v3(i, 0, 0), quat: upright(1) })),
    kept: [3, 4].map(i => ({ i, pos: v3(i - 5, 0, 1), quat: upright(2) })),
    values: [6, 6, 6], places, blocked: () => true, rand: seeded(3),
  });
  assert.equal(plan.where, 'rows');
  assert.equal(plan.gap, null);
  assert.equal(plan.spots.length, 3);
  for (const s of plan.spots) assert.ok(Math.abs(s.x) <= 3.3 && Math.abs(s.z) <= 1.8, JSON.stringify(s));
  assert.deepEqual(fallbackSpots({ n: 1, places, kept: 0 }).length, 1);
});

test('dice3d: kept dice slide to the back row in their left-to-right order; ones there stay', () => {
  const places = trayPlaces(4.1, 2.7), row = backRow(3, places.backZ);
  assert.deepEqual(row.map(p => p.x), [-DIE_GAP, 0, DIE_GAP]);
  const kept = [
    { i: 4, pos: v3(-3, 0, 1), quat: upright(5, .4) },   // leftmost
    { i: 0, pos: v3(2, 0, .5), quat: upright(3, 2) },
    { i: 2, pos: { ...row[1] }, quat: upright(6, 1) },    // already in the middle spot
  ];
  const plan = planThrow({ thrown: [1, 3].map(i => ({ i, pos: v3(), quat: upright(1) })), kept, values: [2, 4], places, rand: seeded(9) });
  assert.deepEqual(Object.keys(plan.moves).map(Number).sort(), [0, 4]);
  assert.ok(nearV(plan.moves[4].p1, row[0]));
  assert.ok(nearV(plan.moves[0].p1, row[2]));
  const end = slidePose(plan.moves[4], plan.moves[4].dur);
  assert.equal(end.done, true);
  assert.equal(topFace(end.q), 5, 'still shows its number');
  assert.ok(nearV(qRotate(end.q, v3(0, 0, 1)), qRotate(upright(5, 0), v3(0, 0, 1))), 'square to the front');
  assert.equal(slidePose(plan.moves[4], .1).done, false);
  assert.deepEqual(Object.keys(plan.anims).map(Number).sort(), [1, 3]);
});

test('dice3d: a die picked up rises; slides and the cup end where they should', () => {
  const r = restPose(v3(1, 0, 1), upright(4), 1);
  assert.ok(r.p.y > 1.2, `lifted ${r.p.y}`);
  assert.ok(near(restPose(v3(1, 0, 1), upright(4), 0).p.y, .5));
  const places = trayPlaces(4.1, 2.7), P = { t0: 0, ...cupTimes(5) };
  assert.ok(P.shake0 < P.shake1 && P.shake1 < P.tip1 && P.tip1 < P.out0);
  assert.equal(cupPose(P, 0, places).visible, true);
  assert.equal(cupPose(P, (P.shake0 + P.shake1) / 2, places).shaking, true);
  assert.equal(cupPose(P, P.tip1, places).shaking, false);
  assert.equal(cupPose(P, P.out1, places).visible, false);
  // the whole roll, the cup and the last die's flight, about 2.5 s
  const lastFly = P.tip1 - .08 + 4 * .07 + THROW_T;
  assert.ok(lastFly > 2.2 && lastFly < 2.8, `${lastFly}`);
  const d = slide({ pos: v3(), quat: upright(2, 1) }, v3(1, 0, 0), 5);
  assert.equal(d.t0, 5);
});

test('dice3d: bounces get lower and end on the felt', () => {
  const b = bounces(1.25, 1.4);
  assert.ok(near(heightAt(b, 0), 1.4));
  assert.ok(near(heightAt(b, b.t0), 0, 1e-9));
  for (let k = 1; k < b.list.length; k++) assert.ok(b.list[k].v < b.list[k - 1].v && b.list[k].t > b.list[k - 1].t);
  assert.ok(b.list.length >= 3, `${b.list.length} bounces`);
  assert.equal(heightAt(b, 1.25), 0);
});

test('dice3d: the camera projects as three.js does, and keeps the whole tray in view', () => {
  const cam = { pos: v3(0, 0, 10), look: v3(0, 0, 0) };
  assert.deepEqual(project(v3(0, 0, 0), cam, 1.5), { x: 0, y: 0 });
  // at the edge of a 34 degree field of view, 10 away: y = 1
  const top = 10 * Math.tan(17 * Math.PI / 180);
  assert.ok(near(project(v3(0, top, 0), cam, 1.5).y, 1, 1e-9));
  assert.ok(near(project(v3(top * 1.5, 0, 0), cam, 1.5).x, 1, 1e-9));
  let checked = 0;
  for (const aspect of [393 / 200, 1.2, 3, .9]) {
    const corners = trayCorners(4.1, 2.7), c = aim(aspect, corners);
    const s = corners.map(p => project(p, c, aspect));
    for (const p of s) assert.ok(Math.abs(p.x) <= .97 + 1e-6 && Math.abs(p.y) <= .96 + 1e-6, `${aspect}: out of view ${JSON.stringify(p)}`);
    // as close as that allows: a corner at the edge
    assert.ok(s.some(p => Math.abs(p.x) > .95 || Math.abs(p.y) > .94), `${aspect}: too far away`);
    checked += s.length;
  }
  assert.equal(checked, 40);
});

test('dice3d: the tray’s shape for the room, remembered for each width and height', () => {
  const before = shapesKnown();
  const a = trayShape(361, 200);
  assert.ok(a.die > 30 && a.die < 60, JSON.stringify(a));
  assert.ok(a.needH <= 200);
  assert.equal(trayShape(361, 200), a, 'the same room: remembered');
  // only the height changed: worked out again (journal 6.3: a result kept
  // by width alone was wrong for a second layout at that width)
  const b = trayShape(361, 120);
  assert.notEqual(b, a);
  assert.ok(b.die < a.die, `less height, smaller dice: ${b.die} vs ${a.die}`);
  assert.equal(shapesKnown(), before + 2);
  // a deep room: the deepest tray that's within 3% of the biggest dice
  const deep = trayShape(400, 400);
  assert.ok(deep.iz >= a.iz, JSON.stringify(deep));
  assert.ok(near(dieAt(361, 200, a.ix, a.iz), a.die, .5));
});

test('dice3d: the fit finds the same row size as trying every one, in a few tries', () => {
  let checked = 0;
  for (const [W, H0, k] of [[361, 520, 9], [560, 900, 13], [316, 300, 4], [700, 640, 10], [361, 360, 9], [361, 2000, 2]]) {
    const measure = r => { const T = Math.round(H0 - k * r); return T < 90 ? null : { die: trayShape(W, T).die }; };
    const fast = bestRow(28, 64, 2, measure);
    let all = null;
    for (let r = 64; r >= 28; r -= 2) {
      const m = measure(r);
      if (!m) continue;
      const v = Math.min(m.die, RATIO * r);
      if (!all || v > all.value + .5) all = { row: r, value: v };
    }
    if (!all) { assert.equal(fast, null); checked++; continue; }
    assert.ok(Math.abs(fast.value - all.value) <= 1, `${W}x${H0}: ${fast.value} vs ${all.value}`);
    // at most about half the 19 row sizes (the crossing, then any bigger
    // rows keeping the dice as big)
    assert.ok(fast.tries <= 10, `${fast.tries} tries`);
    checked++;
  }
  assert.equal(checked, 6);
  // the dice the same whatever the rows (the tray in another column), up to
  // where the page stops fitting at rows over 34: the biggest rows
  const plateau = bestRow(28, 64, 2, r => (r > 34 ? null : { die: 34 }));
  assert.equal(plateau.row, 34, JSON.stringify(plateau));
  assert.ok(plateau.tries <= 10, `${plateau.tries} tries`);
  // no room at any size
  assert.equal(bestRow(28, 64, 2, () => null), null);
  // big rows always fit with room to spare: the biggest
  assert.equal(bestRow(28, 64, 2, () => ({ die: 200 })).row, 64);
});
