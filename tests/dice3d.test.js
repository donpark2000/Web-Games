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
  lineUp, TRAY, inOrder, sortRow, LAYER_UP, intoRow, slidesMeet,
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

test('dice3d: dice line up along the front, inside the tray, apart, clear of Roll and the back row', () => {
  // every tray shape the fit can pick, a pretend Roll button over the
  // front right corner (where the real one is), and the rows the game
  // makes: 5 rolled, 2 or 4 rolled beside kept ones, a box's groups
  const shapes = [];
  for (let ix = TRAY.xRange[0]; ix <= TRAY.xRange[1] + 1e-9; ix += TRAY.xStep) for (let iz = TRAY.zRange[0]; iz <= TRAY.zRange[1] + 1e-9; iz += TRAY.zStep) shapes.push([ix, iz]);
  const rows = [
    { groups: [[0, 1, 2, 3, 4]], backFree: true },
    { groups: [[3, 1]], backFree: false, kept: 3 },
    { groups: [[0, 1, 2, 4]], backFree: false, kept: 1 },
    { groups: [[0, 2, 4], [1, 3]], backFree: true },      // a full house
    { groups: [[2, 0, 4, 1]], backFree: false, kept: 1 }, // a small run
  ];
  let checked = 0, front = 0, back = 0, closer = 0;
  // Roll's width as far as the dice go (the real one, upright phone, 3.7 x
  // 1.8 tray: a die's centre at most 1.95 across, mockup v1, so about 1.2)
  for (const [ix, iz] of shapes) for (const rollW of [1.2, 1.6, 2.0]) {
    const places = trayPlaces(ix, iz);
    const blocked = s => s.x + .55 > ix - rollW && s.z + .55 > iz - 1.3;
    for (const r of rows) {
      const got = lineUp({ ...r, places, blocked });
      const n = r.groups.flat().length, key = `${ix.toFixed(1)}x${iz.toFixed(1)} roll ${rollW} ${JSON.stringify(r.groups)}`;
      assert.ok(got, `${key}: no room`);
      const { spots, gap, z } = got;
      assert.equal(spots.length, n, key);
      if (z === Math.round((iz - .62) * 1000) / 1000) front++; else back++;
      if (gap < DIE_GAP) closer++;
      const kept = backRow(r.kept ?? 0, places.backZ);
      for (const [k, s] of spots.entries()) {
        assert.ok(Math.abs(s.x) <= ix - .6 + 1e-9 && Math.abs(s.z) <= iz - .6 + 1e-9, `${key}: outside: ${JSON.stringify(s)}`);
        assert.ok(!blocked(s), `${key}: under Roll`);
        assert.ok(near(s.z, z) && s.yaw === 0, `${key}: not in one row, square to the front`);
        if (!r.backFree) assert.ok(s.z >= places.backZ + 1.1 - 1e-9, `${key}: in the back row`);
        if (k) assert.ok(s.x - spots[k - 1].x >= gap - 1e-9, `${key}: not left to right, ${gap} apart`);
        for (const o of [...spots.slice(k + 1), ...kept]) assert.ok(apart(s, o), `${key}: touching: ${JSON.stringify([s, o])}`);
        checked++;
      }
      // a wider gap between a box's groups
      if (r.groups.length > 1) {
        const a = r.groups[0].length;
        assert.ok(spots[a].x - spots[a - 1].x > gap + .2, `${key}: groups not apart`);
      }
    }
  }
  // 12 tray shapes x 3 Rolls x 20 dice in the rows
  assert.equal(checked, 720, `${checked} dice checked`);
  assert.ok(front > 0 && back > 0, `the front ${front} times, further back ${back}: both tried`);
  assert.ok(closer > 0, 'the dice never closed up: that spacing untried');
});

test('dice3d: a row with nothing in the way is centred along the front; no room anywhere is null', () => {
  const places = trayPlaces(3.3, 1.8);
  const got = lineUp({ groups: [[4, 3, 2, 1, 0]], places, backFree: true });
  assert.equal(got.z, Math.round((1.8 - .62) * 1000) / 1000);
  assert.equal(got.gap, DIE_GAP);
  assert.ok(near(got.spots.reduce((a, s) => a + s.x, 0), 0, 1e-9), 'centred');
  // a full house at 1.3 with its wider gap spans 5.65: wider than the
  // narrowest tray's room (5.4), so it's closed up rather than off the edge
  const house = lineUp({ groups: [[0, 1, 2], [3, 4]], places, backFree: true });
  assert.ok(house.spots.every(s => Math.abs(s.x) <= 3.3 - .6 + 1e-9), JSON.stringify(house.spots));
  assert.ok(house.gap < DIE_GAP, `gap ${house.gap}`);
  // Roll everywhere, or a tray too narrow for 5 dice: no room
  assert.equal(lineUp({ groups: [[0, 1, 2, 3, 4]], places, blocked: () => true, backFree: true }), null);
  assert.equal(lineUp({ groups: [[0, 1, 2, 3, 4]], places: trayPlaces(2, 1.8), backFree: true }), null);
  // a single die: at the front, beside Roll
  const one = lineUp({ groups: [[2]], places, blocked: s => s.x > -.5 && s.z > 0 });
  assert.ok(one.spots[0].x <= -.5 + 1e-9 && one.z > 0, JSON.stringify(one));
  // a Roll wider than any real one (2.4) on the shallowest tray: no room
  // for 4 dice in front of a kept one (the tray then leaves them where they
  // landed, and logs it)
  const wide = s => s.x + .55 > 3.3 - 2.4 && s.z + .55 > 1.8 - 1.3;
  assert.equal(lineUp({ groups: [[0, 1, 2, 4]], places, blocked: wide }), null);
  assert.ok(lineUp({ groups: [[0, 1, 2, 4]], places, blocked: wide, backFree: true }), 'the back row free: room there');
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

// Whether two dice ever meet on their slides (both start together), at
// 120 points along the way (a die moves at most 0.1 between two): within 1.05 across (a die is 1, square to the front
// here) and under 1
// apart in height. { m } a slide, { p } a die standing still.
function everMeet(a, b) {
  for (let s = 0; s <= 120; s++) {
    const at = x => (x.m ? slidePose(x.m, x.m.t0 + s / 120 * x.m.dur).p : { ...x.p, y: .5 });
    const pa = at(a), pb = at(b);
    if (flat(pa, pb) < 1.05 && Math.abs(pa.y - pb.y) < 1) return true;
  }
  return false;
}
// A row's dice put in order as the tray does it (sortRow, then a slide
// each with its height), for dice showing `values` standing at xs.
function sortSlides(values, xs, z = 1.18) {
  const ds = values.map((value, k) => ({ value, pos: v3(xs[k], 0, z) }));
  const { moves, layers } = sortRow(ds);
  const q = upright(3, 0);
  const slides = ds.map((d, k) => ({ m: { t0: 0, dur: .55, p0: d.pos, p1: moves[k].to, q0: q, q1: q, over: moves[k].over } }));
  return { ds, moves, layers, slides };
}

test('dice3d: dice in order smallest to highest, one number left to right (Q56)', () => {
  const d = (value, x) => ({ value, pos: v3(x, 0, 0) });
  assert.deepEqual(inOrder([d(5, 0), d(2, 1), d(5, -2), d(1, 3), d(2, -1)]).map(o => [o.value, o.pos.x]), [[1, 3], [2, -1], [2, 1], [5, -2], [5, 0]]);
  assert.deepEqual(inOrder([]), []);
  // a row put in order keeps its own places
  const { moves, layers } = sortSlides([6, 1, 4], [-1.3, 0, 1.3]);
  assert.deepEqual(moves.map(m => m.to.x), [1.3, -1.3, 0]);
  assert.equal(layers, 2, 'the 6 passes over the 1 and the 4');
  assert.deepEqual(moves.map(m => m.over), [LAYER_UP, 0, 0]);
  // in order already: nothing moves, one height
  const same = sortSlides([2, 2, 5], [-1, .2, 1.5]);
  assert.deepEqual(same.moves.map(m => [m.to.x, m.over]), [[-1, 0], [.2, 0], [1.5, 0]]);
  assert.equal(same.layers, 1);
  // a die of the same number keeps its left-to-right place
  assert.deepEqual(sortSlides([3, 3], [1, -1]).moves.map(m => m.to.x), [1, -1]);
  assert.deepEqual(sortRow([]), { moves: [], layers: 0 });
});

test('dice3d: a row put in order: dice pass over each other, never through (Q56)', () => {
  // two dice side by side swapping: on the felt they'd meet (the check can
  // fail); planned, one goes over and lands where it was going
  const swap = sortSlides([5, 2], [-.65, .65]);
  const felt = swap.slides.map(x => ({ m: { ...x.m, over: 0 } }));
  assert.ok(everMeet(felt[0], felt[1]), 'a swap on the felt meets');
  assert.ok(!everMeet(swap.slides[0], swap.slides[1]), 'planned: still meet');
  const up = swap.slides.find(x => x.m.over).m;
  assert.ok(slidePose(up, .55 / 2).p.y > 1.6, 'not lifted over');
  assert.ok(nearV(slidePose(up, .55).p, { ...up.p1, y: .5 }, 1e-6) && slidePose(up, .55).done, 'lands where it was going');
  assert.ok(nearV(slidePose(up, -1).p, { ...up.p0, y: .5 }, 1e-6), 'waits where it starts');
  // every order of 1 to 5 dice, ties too (n dice showing 1 to n have
  // them all), in the closest spacing a row
  // has (1.12) and the widest (1.3): none ever meets another; the heights
  // are as many as the longest run out of order needs
  let rows = 0, pairs = 0, moved = 0, maxLayers = 0, lifted = 0;
  for (let n = 1; n <= 5; n++) for (let code = 0; code < n ** n; code++) for (const gap of [1.12, 1.3]) {
    const values = Array.from({ length: n }, (_, k) => 1 + Math.floor(code / n ** k) % n);
    const xs = values.map((_, k) => (k - (n - 1) / 2) * gap);
    const { moves, layers, slides } = sortSlides(values, xs);
    // in order at the end, in the row's own places
    const end = moves.map((m, k) => [m.to.x, values[k]]).sort((a, b) => a[0] - b[0]);
    assert.deepEqual(end.map(e => e[1]), [...values].sort((a, b) => a - b), `${values}: not in order`);
    assert.deepEqual(end.map(e => e[0]), xs, `${values}: not the row's places`);
    for (const [k, a] of slides.entries()) {
      for (const b of slides.slice(k + 1)) { assert.ok(!everMeet(a, b), `${values} at ${gap}: dice meet`); pairs++; }
      if (a.m.p0.x !== a.m.p1.x) moved++;
      if (a.m.over) lifted++;
    }
    maxLayers = Math.max(maxLayers, layers);
    rows++;
  }
  assert.equal(rows, 2 * (1 + 4 + 27 + 256 + 3125));
  assert.equal(pairs, 2 * (4 * 1 + 27 * 3 + 256 * 6 + 3125 * 10));
  // the front row and the kept dice's row put in order together, 1.1
  // apart (lineUp keeps them at least that): no die meets one in the other
  const front = sortSlides([6, 5, 4], [-1.3, 0, 1.3], 1.18), back = sortSlides([3, 1], [-.65, .65], .08);
  for (const a of front.slides) for (const b of back.slides) assert.ok(!everMeet(a, b), 'the rows meet');
  assert.equal(maxLayers, 5, '5 dice from highest to lowest: five heights');
  assert.ok(moved > 0 && lifted > 0);
  console.log(`# sortRow: ${rows} rows, ${pairs} pairs of dice checked, ${moved} slides, ${lifted} over others, at most ${maxLayers} heights`);
});

test('dice3d: the rolled dice go straight to their places in order, over each other, never through (Q56, one step)', () => {
  // two dice landed side by side whose order swaps: the check finds them
  // meeting on the felt (it can fail); planned, one goes over
  const q = upright(3, .4);
  const pair = [{ value: 5, pos: v3(-.7, 0, 1), quat: q }, { value: 2, pos: v3(.7, 0, 1), quat: upright(2, 1) }];
  const spots2 = [v3(-.65, 0, 1.2), v3(.65, 0, 1.2)];
  const two = intoRow({ ds: pair, spots: spots2 });
  assert.deepEqual(two.order, [1, 0], 'the 2 then the 5');
  assert.ok(slidesMeet({ ...two.moves[0], over: 0 }, { ...two.moves[1], over: 0 }), 'on the felt they meet');
  assert.ok(!slidesMeet(two.moves[0], two.moves[1]), 'planned: they meet');
  assert.equal(two.heights, 2);
  assert.ok(nearV(slidePose(two.moves[0], .7).p, { ...spots2[1], y: .5 }), 'the 5 not at the right');
  assert.equal(topFace(slidePose(two.moves[1], .7).q), 2, 'turned off its number');
  // a die standing still in the way is gone over too
  const still = intoRow({ ds: [{ value: 1, pos: v3(-2, 0, 0), quat: q }], spots: [v3(2, 0, 0)], others: [{ pos: v3(0, 0, 0) }] });
  assert.ok(still.moves[0].over >= 1, 'went through the still die');
  assert.deepEqual(intoRow({ ds: [], spots: [] }), { moves: [], order: [], heights: 0 });

  // real throws: every tray size, 1 to 5 dice rolled, the kept ones in
  // the back row sorting at the same time. In order at the row's places
  // at the end, no die ever meets another; on the felt they would have.
  const rand = seeded(11);
  let rolls = 0, pairs = 0, lifted = 0, feltMeets = 0, maxHeights = 0;
  for (const [ix, iz] of [[4.1, 2.7], [3.7, 2.1], [3.3, 1.8]]) {
    const places = trayPlaces(ix, iz);
    for (let kept = 0; kept <= 4; kept++) for (let rep = 0; rep < 12; rep++) {
      const n = 5 - kept, values = Array.from({ length: 5 }, () => 1 + Math.floor(rand() * 6));
      const keptDice = backRow(kept, places.backZ).map((p, k) => ({ i: n + k, pos: p, quat: upright(values[n + k]) }));
      const thrown = Array.from({ length: n }, (_, k) => ({ i: k, pos: v3(), quat: upright(1) }));
      const plan = planThrow({ thrown, kept: keptDice, values: values.slice(0, n), places, rand });
      const landed = thrown.map((d, k) => ({ value: values[k], pos: plan.anims[k].to, quat: plan.anims[k].qT }));
      const line = lineUp({ groups: [thrown.map(d => d.i)], places, backFree: n === 5 });
      assert.ok(line, `${ix}x${iz}, ${kept} kept: no row`);
      const back = sortRow(keptDice.map(d => ({ value: values[d.i], pos: d.pos })));
      const others = keptDice.map((d, k) => ({ t0: 0, dur: .7, p0: d.pos, p1: back.moves[k].to, q0: d.quat, q1: d.quat, over: back.moves[k].over }));
      const { moves, order, heights } = intoRow({ ds: landed, spots: line.spots.map(s => v3(s.x, 0, s.z)), others });
      assert.deepEqual(order.map(k => values[k]), values.slice(0, n).sort((a, b) => a - b), 'not in order');
      order.forEach((k, j) => assert.ok(nearV(moves[k].p1, v3(line.spots[j].x, 0, line.spots[j].z)), 'not at its place'));
      const all = [...moves, ...others];
      for (const [a, m] of moves.entries()) {
        for (const o of all.slice(a + 1)) {
          assert.ok(!slidesMeet(m, o, 240), `${ix}x${iz}, ${kept} kept: dice meet`);
          // the same, by the test's own look (dice landed at least 1.05 apart)
          if (flat(m.p0, o.p0 ?? o.pos) >= 1.05) { assert.ok(!everMeet({ m }, { m: o }), 'dice meet (everMeet)'); pairs++; }
        }
        if (m.over) lifted++;
      }
      if (moves.some((m, a) => all.some((o, b) => b !== a && slidesMeet({ ...m, over: 0 }, o.over != null ? { ...o, over: 0 } : o)))) feltMeets++;
      maxHeights = Math.max(maxHeights, heights);
      rolls++;
    }
  }
  assert.equal(rolls, 3 * 5 * 12);
  assert.ok(pairs > 300 && lifted > 0 && feltMeets > 0, `${pairs} pairs, ${lifted} lifted, ${feltMeets} would meet on the felt`);
  console.log(`# intoRow: ${rolls} rolls, ${pairs} pairs of dice checked, ${lifted} dice over others, ${feltMeets} rolls would meet on the felt, at most ${maxHeights} heights`);
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
