// Topple! Hardest's thing that moves in the way (src/core/topple-movers.js,
// journal Q106): where it is at each moment for slide, swing and stream,
// and in the physics: a ball that meets it stops and drops; the same throw
// with the way clear reaches the structure; it never touches a block.
// Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, PACES, HEIGHTS, DEFAULT, PAUSE, CABLE_TOP, STREAM_N, moverFor, moverAt, openShare } from '../src/core/topple-movers.js';
import { createWorld, MOVER_KEEP } from '../src/core/topple-world.js';
import { STEP, HAND, launchVel } from '../src/core/topple.js';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const xs = (m, t) => moverAt(m, t).map(l => l.p[0]);

// a building-site scene's parts, from the world (as the game makes them)
function siteScene(seed = 4242, i = 1) {
  const w = createWorld();
  const s = w.makeScene(seed, 2, i);
  return { w, s };
}

test('movers: unknown choices fall back to the defaults; it crosses between the hand and the structure, past its sides', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'hop', pace: 'warp', height: 'sky' });
  assert.equal(m.move, DEFAULT.move); assert.equal(m.pace, DEFAULT.pace); assert.equal(m.height, DEFAULT.height);
  assert.equal(m.cross, PACES[DEFAULT.pace]); assert.equal(m.y, HEIGHTS[DEFAULT.height]);
  const st = s.parts.stand;
  assert.ok(m.z < HAND.z && m.z > st.z, `crosses at z ${m.z}, between the hand (${HAND.z}) and the structure (${st.z})`);
  // its ends are clear of the structure as seen from the hand at that depth
  const k = (m.z - HAND.z) / (st.z - HAND.z), half = Math.max(st.w / 2, s.parts.bounds.max[0] - st.x, st.x - s.parts.bounds.min[0]) * k;
  assert.ok(m.span - m.load.w / 2 > half + 0.5, `the ends ${m.span} m out, the structure ${half.toFixed(2)} m`);
  for (const move of MOVES) assert.equal(moverFor(s.parts, { move }).n, move === 'stream' ? STREAM_N : 1);
});

test('movers: slide goes across at a steady speed, stops at each end, and comes back', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'slide', pace: 'medium' }), T = m.cross;
  assert.ok(near(xs(m, 0)[0], m.x0 - m.span), 'starts at the left end');
  assert.ok(near(xs(m, T / 2)[0], m.x0, 1e-3), 'the middle half way across');
  assert.ok(near(xs(m, T)[0], m.x0 + m.span), 'the right end after one crossing');
  assert.ok(near(xs(m, T + PAUSE * 0.9)[0], m.x0 + m.span), 'stopped at the end');
  assert.ok(near(xs(m, 2 * T + PAUSE)[0], m.x0 - m.span), 'back at the left end');
  assert.ok(near(xs(m, 2 * (T + PAUSE) + T / 2)[0], m.x0, 1e-3), 'the next cycle the same');
  // steady in the middle: equal steps over the middle half
  const d1 = xs(m, 0.4 * T)[0] - xs(m, 0.3 * T)[0], d2 = xs(m, 0.7 * T)[0] - xs(m, 0.6 * T)[0];
  assert.ok(near(d1, d2, 1e-9), `steady: ${d1} then ${d2}`);
  // never past its ends
  for (let t = 0; t < 4 * T; t += 0.01) assert.ok(Math.abs(xs(m, t)[0] - m.x0) <= m.span + 1e-9);
});

test('movers: swing hangs from the jib, leans as it swings, fastest in the middle', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'swing', pace: 'slow' }), T = m.cross, L = CABLE_TOP - m.y;
  const at = t => moverAt(m, t)[0];
  assert.ok(near(at(0).p[0], m.x0) && near(at(0).p[1], m.y), 'starts hanging straight down, in the middle');
  assert.ok(near(at(T / 2).p[0], m.x0 + m.span, 1e-6), `out to the right end at T/2: ${at(T / 2).p[0]}`);
  for (let t = 0; t < 2 * T; t += 0.05) {
    const { p, tilt } = at(t);
    assert.ok(near(Math.hypot(p[0] - m.x0, p[1] - CABLE_TOP), L, 1e-9), 'the cable keeps its length');
    if (Math.abs(p[0] - m.x0) > 1e-6) assert.equal(Math.sign(tilt), Math.sign(p[0] - m.x0), 'leans the way it has swung');
    assert.ok(p[1] >= m.y - 1e-9, 'never lower than straight down');
  }
  const mid = Math.abs(at(0.05).p[0] - at(0).p[0]), end = Math.abs(at(T / 2).p[0] - at(T / 2 - 0.05).p[0]);
  assert.ok(mid > 5 * end, `fast in the middle (${mid.toFixed(3)} m in 0.05 s), slow at the end (${end.toFixed(3)})`);
});

test('movers: stream sends loads one way, evenly spaced, round again', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'stream', pace: 'fast' });
  const a = xs(m, 1).sort((p, q) => p - q), b = xs(m, 1.1);
  assert.equal(a.length, STREAM_N);
  const gaps = a.slice(1).map((x, i) => x - a[i]);
  for (const g of gaps) assert.ok(near(g, gaps[0], 1e-9), `even gaps: ${gaps}`);
  const v = 2 * m.span / m.cross;
  const moved = b.map((x, i) => x - xs(m, 1)[i]).filter(d => d > 0);
  assert.ok(moved.length >= STREAM_N - 1 && moved.every(d => near(d, v * 0.1, 1e-9)), 'each moves right at the steady speed (one may have come round)');
});

test('movers: the way is open some of the time and closed some of the time, every way and pace', () => {
  const { s } = siteScene();
  const seen = [];
  for (const move of MOVES) for (const pace of Object.keys(PACES)) {
    const share = openShare(moverFor(s.parts, { move, pace }));
    seen.push(`${move} ${pace} ${share}`);
    assert.ok(share > 0.3 && share < 0.95, `${move} ${pace}: open ${share}`);
  }
  assert.equal(seen.length, 9);
});

// The first straight throw (up 2-20°, aimed along the scan) whose path's
// first touch is a block and that passes the load's depth within its height.
function straightAtBlock(w, power, m) {
  for (let up = 2; up <= 20; up += 2) for (let a = -0.5; a <= 0.5; a += 0.02) {
    const { vec } = launchVel(power, a, up), tr = w.trace(vec, 0), p = tr.pts.find(q => q[2] <= m.z);
    if (tr.hits[0]?.kind === 'block' && p && Math.abs(p[1] - m.y) < m.load.h / 2 - 0.1) return { vec, pts: tr.pts };
  }
  return null;
}
// Steps the world to its mover's time t (s), in the physics' own steps.
const stepTo = (w, t) => { while (w.moverT < t - 1e-9) w.step(STEP); };
// A throw now and 3 s on: what the ball touched, first.
function throwAndWatch(w, vec, hits) {
  hits.length = 0;
  const ball = w.throwBall(vec);
  for (let k = 0; k < 360; k++) w.step(STEP);
  return ball;
}

test('movers: a ball that meets the load stops and drops; the same throw with the way clear reaches a block; no block is ever touched by it', () => {
  const hits = [];
  const w = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
  const s = w.makeScene(4242, 2, 1);
  const m = moverFor(s.parts, { move: 'slide', pace: 'medium', height: 'middle' });
  w.setMovers(m);
  assert.equal(w.movers.length, 1);
  const shot = straightAtBlock(w, s.layout.power, m);
  assert.ok(shot, 'a straight throw at a block');
  // when the ball reaches the load's depth, and where it is then
  const iz = shot.pts.findIndex(p => p[2] <= m.z), tz = iz * STEP, yz = shot.pts[iz][1];
  assert.ok(Math.abs(yz - m.y) < m.load.h / 2, `the throw passes the load's height (${yz.toFixed(2)} m, the load ${m.y} ± ${m.load.h / 2})`);
  // the load in the middle (going right) as the ball gets there
  const T = m.cross;
  stepTo(w, T / 2 - tz + 2 * (T + PAUSE));
  const ball = throwAndWatch(w, shot.vec, hits);
  assert.equal(hits[0], 'mover', `first touched: ${hits.join(', ')}`);
  assert.ok(!hits.includes('block'), 'never reached the structure');
  assert.ok(ball.stopped, 'stopped by it');
  assert.equal(w.downCount(), 0);
  assert.ok(w.drift() < 1e-6, `the blocks still (${w.drift()} m)`);
  // the same throw with the load at its right end (stopped there)
  stepTo(w, 2 * (T + PAUSE) * 3 + T + PAUSE / 2 - tz);
  throwAndWatch(w, shot.vec, hits);
  assert.equal(hits[0], 'block', `first touched: ${hits.join(', ')}`);
  assert.ok(!hits.includes('mover'));
  assert.ok(MOVER_KEEP < 0.2);
});

test('movers: a load swept through the structure itself touches no block', () => {
  const w = createWorld();
  const s = w.makeScene(777, 2, 2);
  const m = { ...moverFor(s.parts, { move: 'slide', pace: 'fast', height: 'low' }) };
  m.z = s.parts.stand.z; m.y = 0.5;   // right through the blocks
  w.setMovers(m);
  for (let k = 0; k < 120 * 6; k++) w.step(STEP);
  assert.equal(w.awake(), 0, 'no block woken');
  assert.ok(w.drift() < 1e-6, `the blocks still (${w.drift()} m)`);
  w.setMovers(null);
  assert.equal(w.movers.length, 0);
});
