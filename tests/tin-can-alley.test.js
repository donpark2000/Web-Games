// Tin Can Alley's rules (src/core/tin-can-alley.js): the cans' places,
// off the shelf, the drag to a throw, the ring's point, the camera, a
// round's balls and end, the end words. Pure functions; nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LAYOUTS, DEFAULT_LAYOUT, LAYOUT_NAMES, layoutRows, layoutSpots, isOff, SHELF, SHELF_FRONT, CAN, HAND, BACK, CURTAIN_T, GAP,
  dragToThrow, MIN_POWER, launchVel, predict, cameraAt, SIDE_HOLD, GLIDE, fovFor, STALL_BOXES,
  BALLS, END_HOLD, END_WAIT, END_MAX, checkSetup, createMatch, newRound, canThrow, throwBall, update, ballsLeft, endWords,
} from '../src/core/tin-can-alley.js';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test('tin can alley: the four lots of cans, the bottom row first, standing on the shelf', () => {
  assert.deepEqual(LAYOUTS, ['6', '10', '15', 'wall']);
  assert.equal(DEFAULT_LAYOUT, '6');
  assert.deepEqual(LAYOUTS.map(l => LAYOUT_NAMES[l]), ['Pyramid 6', 'Pyramid 10', 'Pyramid 15', 'Wall 9']);
  assert.deepEqual(LAYOUTS.map(l => layoutSpots(l).length), [6, 10, 15, 9]);
  assert.deepEqual(layoutRows('15'), [5, 4, 3, 2, 1]);
  assert.deepEqual(layoutRows('wall'), [3, 3, 3]);
  for (const l of LAYOUTS) {
    const spots = layoutSpots(l);
    for (const s of spots) {
      assert.ok(!isOff(s), `${l}: a can starts off the shelf: ${JSON.stringify(s)}`);
      assert.ok(Math.abs(s.x) + CAN.r < SHELF.w / 2, `${l}: a can over the shelf's end`);
      assert.ok(near(s.y - CAN.h / 2 - s.row * (CAN.h + 0.002), SHELF.y + 0.001, 1e-9), `${l}: row ${s.row} not stacked`);
    }
    // no two cans in one row overlap
    for (const a of spots) for (const b of spots) {
      if (a !== b && a.row === b.row) assert.ok(Math.abs(a.x - b.x) >= CAN.r * 2, `${l}: cans overlap`);
    }
    // each row centred
    for (const row of new Set(spots.map(s => s.row))) {
      assert.ok(near(spots.filter(s => s.row === row).reduce((t, s) => t + s.x, 0), 0, 1e-12), `${l}: row ${row} not centred`);
    }
  }
  assert.throws(() => layoutRows('7'), /unknown cans: 7/);
});

test('tin can alley: off the shelf: below its top, or past an edge', () => {
  const on = { x: 0, y: SHELF.y + 0.11, z: SHELF.z };
  assert.equal(isOff(on), false);
  assert.equal(isOff({ ...on, y: SHELF.y - 0.001 }), true, 'below the top');
  assert.equal(isOff({ ...on, x: SHELF.w / 2 + 0.049 }), false, 'just at the end');
  assert.equal(isOff({ ...on, x: -(SHELF.w / 2 + 0.051) }), true, 'past the left end');
  assert.equal(isOff({ ...on, z: SHELF.z - SHELF.d / 2 - 0.001 }), true, 'past the back');
  assert.equal(isOff({ ...on, z: SHELF_FRONT + 0.001 }), true, 'past the front');
  // the gap behind the shelf: twice a can's height, so a tipped can falls (v4)
  assert.ok(near(SHELF.z - SHELF.d / 2 - (BACK + CURTAIN_T / 2), GAP, 1e-12));
  assert.ok(GAP >= 2 * CAN.h);
});

test('tin can alley: the drag: down sets the power, sideways aims the other way; clamped', () => {
  assert.deepEqual(dragToThrow(0, 0, 400), { power: 0, aim: 0 });
  const half = dragToThrow(0, 90, 400);
  assert.ok(near(half.power, 0.5) && half.aim === 0, JSON.stringify(half));
  assert.equal(dragToThrow(0, 9999, 400).power, 1, 'full power at most');
  assert.equal(dragToThrow(0, -50, 400).power, 0, 'a drag up throws nothing');
  assert.ok(near(dragToThrow(-70, 0, 400).aim, 0.5), 'drag left, aim right');
  assert.equal(dragToThrow(9999, 0, 400).aim, -1);
  assert.deepEqual(dragToThrow(10, 10, 0), { power: 0, aim: 0 }, 'no stage yet');
  assert.ok(MIN_POWER > 0 && MIN_POWER < 0.1);
});

test('tin can alley: the throw: 3-12 m/s at 20° up, turned up to 22°', () => {
  const lo = launchVel(0, 0), hi = launchVel(1, 0);
  assert.ok(near(lo.v, 3) && near(hi.v, 12));
  const speed = v => Math.hypot(...v.vec);
  assert.ok(near(speed(hi), 12, 1e-9));
  assert.ok(near(Math.atan2(hi.vec[1], -hi.vec[2]) * 180 / Math.PI, 20, 1e-9), 'not 20° up');
  const left = launchVel(0.5, -1), right = launchVel(0.5, 1);
  assert.ok(left.vec[0] < 0 && right.vec[0] > 0 && near(left.vec[0], -right.vec[0]));
  assert.ok(near(right.yaw * 180 / Math.PI, 22, 1e-9));
});

test('tin can alley: the ring: on the shelf\'s front, higher with more power; on the ground if short', () => {
  const short = predict(0, 0);
  assert.equal(short.where, 'ground');
  assert.ok(near(short.hit[1], 0, 1e-9), 'not on the ground');
  let lastY = -Infinity, shelfHits = 0;
  for (let p = 0.2; p <= 1.0001; p += 0.1) {
    const r = predict(p, 0);
    if (r.where !== 'shelf') continue;
    shelfHits++;
    assert.ok(near(r.hit[2], SHELF_FRONT, 1e-9), 'not at the shelf\'s front');
    assert.ok(r.hit[1] > lastY, `power ${p.toFixed(1)}: not higher`);
    lastY = r.hit[1];
  }
  assert.ok(shelfHits >= 6, `only ${shelfHits} powers reach the shelf`);
  // power 0.4 (the mockup's good straight throw) hits the pyramid's middle rows
  const mid = predict(0.4, 0).hit[1];
  assert.ok(mid > SHELF.y + CAN.h && mid < SHELF.y + 2 * CAN.h + 0.05, `power 0.4 hits at ${mid}`);
  assert.ok(predict(0.5, 0.5).hit[0] > 0, 'aimed right, the ring is right');
  assert.equal(HAND.z > SHELF_FRONT, true);
});

test('tin can alley: the camera: behind, then the side, a glide back, behind', () => {
  assert.equal(cameraAt(null).view, 'behind');
  assert.equal(cameraAt(0).view, 'side');
  assert.equal(cameraAt(SIDE_HOLD - 0.01).view, 'side');
  const g = cameraAt(SIDE_HOLD + GLIDE / 2);
  assert.equal(g.view, 'glide');
  const s = cameraAt(0).pos, b = cameraAt(null).pos;
  assert.ok(g.pos.every((v, i) => v >= Math.min(s[i], b[i]) - 1e-9 && v <= Math.max(s[i], b[i]) + 1e-9), 'the glide leaves the line');
  assert.equal(cameraAt(SIDE_HOLD + GLIDE).view, 'behind');
  // upright stages widen the view; a square one is 50°; wider ones narrow
  // it, to 44° at the least, with no jump between the two
  assert.equal(fovFor(0.75), 50);
  assert.ok(fovFor(0.5) > 50);
  assert.ok(fovFor(0.4) > fovFor(0.5));
  assert.equal(fovFor(1), 50);
  assert.ok(Math.abs(fovFor(1.0001) - 50) < 1e-9, 'a jump at square');
  assert.ok(fovFor(1.3) < 50 && fovFor(1.3) > 44, String(fovFor(1.3)));
  assert.equal(fovFor(2.4), 44);
  // at the narrowest, the ball in the hand and Pyramid 15's top both in view
  const cam = cameraAt(null), half = fovFor(9) / 2;
  const below = (pt) => Math.atan2(cam.pos[1] - pt[1], cam.pos[2] - pt[2]) * 180 / Math.PI;
  const axis = below(cam.look);
  assert.ok(below([0, HAND.y - 0.06, HAND.z]) - axis < half, 'the ball in the hand is cut off');
  assert.ok(axis - below([0, SHELF.y + 5 * CAN.h, SHELF.z]) < half, 'Pyramid 15\'s top is cut off');
});

test('tin can alley: the stall\'s parts: the shelf, cabinet, curtain, 4 posts and the counter', () => {
  const parts = STALL_BOXES.map(b => b.part).sort();
  assert.deepEqual(parts, ['cabinet', 'counter', 'counter-front', 'curtain', 'post', 'post', 'post', 'post', 'shelf']);
  const shelf = STALL_BOXES.find(b => b.part === 'shelf');
  assert.ok(near(shelf.y + shelf.h / 2, SHELF.y), 'the shelf\'s top is not at its height');
});

test('tin can alley: setup: a face and known cans', () => {
  assert.equal(checkSetup({ p1: 'bear', layout: '6' }), '');
  assert.equal(checkSetup({ p1: '', layout: '6' }), 'p1-missing');
  assert.equal(checkSetup({ p1: 'robot', layout: '6' }), 'unknown-face');
  assert.equal(checkSetup({ p1: 'bear', layout: '7' }), 'unknown-cans');
  assert.throws(() => createMatch({ p1: 'bear', layout: 'x' }), /unknown-cans/);
});

// Steps a match's round with the cans as given.
const run = (m, sec, cans, dt = 1 / 60) => {
  let ended = null;
  for (let t = 0; t < sec - 1e-9; t += dt) ended = update(m, dt, cans).ended ?? ended;
  return ended;
};

test('tin can alley: 3 balls; the next waits for the camera; a short drag throws nothing', () => {
  const m = createMatch({ p1: 'fox', layout: 'wall' });
  assert.equal(m.round.total, 9);
  assert.equal(ballsLeft(m.round), BALLS);
  assert.deepEqual(throwBall(m, 0.03, 0), { ok: false, why: 'too-short' });
  assert.equal(m.round.used, 0, 'a short drag used a ball');
  const t1 = throwBall(m, 0.4, 0);
  assert.ok(t1.ok && t1.ball === 1 && t1.toward.where === 'shelf');
  assert.deepEqual(throwBall(m, 0.4, 0), { ok: false, why: 'camera' });
  run(m, SIDE_HOLD + GLIDE + 0.02, { off: 0, still: false });
  assert.ok(canThrow(m).ok);
  throwBall(m, 0.4, 0);
  run(m, SIDE_HOLD + GLIDE + 0.02, { off: 0, still: false });
  throwBall(m, 0.4, 0);
  run(m, SIDE_HOLD + GLIDE + 0.02, { off: 0, still: false });
  assert.deepEqual(canThrow(m), { ok: false, why: 'no-balls' });
});

test('tin can alley: all off is a win once they stay off; a can back on the shelf resets it', () => {
  const m = createMatch({ p1: 'bear', layout: '6' });
  throwBall(m, 0.4, 0);
  assert.equal(run(m, END_HOLD - 0.05, { off: 6, still: false }), null, 'won before the hold');
  assert.equal(update(m, 1 / 60, { off: 5, still: false }).offChanged, true);
  assert.equal(m.round.allOff, 0);
  const r = run(m, END_HOLD + 0.05, { off: 6, still: false });
  assert.deepEqual(r, { won: true, off: 6, total: 6, balls: 1 });
  assert.equal(m.cleared, 1);
  assert.equal(update(m, 1 / 60, { off: 6, still: true }).ended, null, 'ended twice');
  assert.deepEqual(canThrow(m), { ok: false, why: 'round-over' });
  newRound(m);
  assert.equal(m.rounds, 2);
  assert.deepEqual([m.round.used, m.round.off, m.round.result], [0, 0, null]);
});

test('tin can alley: out of balls: over 2 s after the last throw once still, or 7 s whatever', () => {
  const play3 = () => {
    const m = createMatch({ p1: 'bear', layout: '10' });
    for (let i = 0; i < 3; i++) { throwBall(m, 0.4, 0); if (i < 2) run(m, SIDE_HOLD + GLIDE + 0.02, { off: 2, still: true }); }
    return m;
  };
  let m = play3();
  assert.equal(run(m, END_WAIT - 0.05, { off: 4, still: true }), null, 'over too soon');
  assert.deepEqual(run(m, 0.1, { off: 4, still: true }), { won: false, off: 4, total: 10, balls: 3 });
  assert.equal(m.cleared, 0);
  m = play3();
  assert.equal(run(m, END_MAX - 0.05, { off: 4, still: false }), null, 'over while cans still roll');
  assert.equal(run(m, 0.1, { off: 4, still: false }).won, false);
  // before the last ball: never over, however long
  const k = createMatch({ p1: 'bear', layout: '6' });
  throwBall(k, 0.4, 0);
  assert.equal(run(k, 20, { off: 2, still: true }), null);
});

test('tin can alley: the end words', () => {
  assert.equal(endWords({ won: true, off: 6, total: 6, balls: 2 }, 'Teddy'), 'Teddy knocked all 6 off with 2 balls! 🎉');
  assert.equal(endWords({ won: true, off: 9, total: 9, balls: 1 }, 'Leo'), 'Leo knocked all 9 off with 1 ball! 🎉');
  assert.equal(endWords({ won: false, off: 4, total: 6, balls: 3 }, 'Teddy'), 'Teddy knocked 4 of 6 off');
  assert.equal(endWords({ won: false, off: 0, total: 6, balls: 3 }, 'Teddy'), 'None off this time');
});

test('tin can alley: a match comes back from JSON and plays on the same', () => {
  const m = createMatch({ p1: 'bear', layout: '15' });
  throwBall(m, 0.5, 0.2);
  run(m, 1, { off: 3, still: false });
  const back = JSON.parse(JSON.stringify(m));
  assert.deepEqual(back, m);
  const a = run(m, 3, { off: 3, still: false }), b = run(back, 3, { off: 3, still: false });
  assert.deepEqual(back, m);
  assert.deepEqual(a, b);
});
