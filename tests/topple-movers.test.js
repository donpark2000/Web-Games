// Topple! Hardest's thing that moves in the way (src/core/topple-movers.js,
// journal Q106): where it is at each moment for slide, swing and stream,
// and in the physics: a ball that meets it stops and drops; the same throw
// with the way clear reaches the structure; it never touches a block.
// Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVES, PACES, HEIGHTS, TIMINGS, LOOKS, DEFAULT, PAUSE, CABLE_TOP, STREAM_N, PLAN_S, moverFor, moverAt, openShare, gaps } from '../src/core/topple-movers.js';
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
  const m = moverFor(s.parts, { move: 'hop', pace: 'warp', height: 'sky', timing: 'jumpy', look: 'piano' });
  assert.equal(m.move, DEFAULT.move); assert.equal(m.pace, DEFAULT.pace); assert.equal(m.height, DEFAULT.height);
  assert.equal(m.timing, DEFAULT.timing); assert.equal(m.look, DEFAULT.look);
  assert.ok(LOOKS.includes(DEFAULT.look));
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
  const m = moverFor(s.parts, { move: 'slide', pace: 'medium', timing: 'steady' }), T = m.cross;
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
  const m = moverFor(s.parts, { move: 'swing', pace: 'slow', timing: 'steady' }), T = m.cross, L = CABLE_TOP - m.y;
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
  const m = moverFor(s.parts, { move: 'stream', pace: 'fast', timing: 'steady' });
  const a = xs(m, 1).sort((p, q) => p - q), b = xs(m, 1.1);
  assert.equal(a.length, STREAM_N);
  const gaps = a.slice(1).map((x, i) => x - a[i]);
  for (const g of gaps) assert.ok(near(g, gaps[0], 1e-9), `even gaps: ${gaps}`);
  const v = 2 * m.span / m.cross;
  const moved = b.map((x, i) => x - xs(m, 1)[i]).filter(d => d > 0);
  assert.ok(moved.length >= STREAM_N - 1 && moved.every(d => near(d, v * 0.1, 1e-9)), 'each moves right at the steady speed (one may have come round)');
});

test('movers: the way is open some of the time and closed some of the time, every way, pace and timing', () => {
  const { s } = siteScene();
  const seen = [];
  for (const move of MOVES) for (const pace of Object.keys(PACES)) for (const timing of TIMINGS) {
    const share = openShare(moverFor(s.parts, { move, pace, timing }, s.layout.seed));
    seen.push(`${move} ${pace} ${timing} ${share}`);
    assert.ok(share > 0.3 && share < 0.95, `${move} ${pace} ${timing}: open ${share}`);
  }
  assert.equal(seen.length, 27);
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
  const m = moverFor(s.parts, { move: 'slide', pace: 'medium', height: 'middle', timing: 'steady' });
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

// Mockup v2 (developer, 2026-11-14, of v1: "rather slow and competely
// predictable"): varied and tricky timing, from a plan made from the
// scene's seed.

// Every load's x over the first 2 plans' worth, in steps of dt, and the biggest jump between steps.
function track(m, dt = 1 / 120, T = 2 * m.plan.len) {
  const out = [];
  for (let t = 0; t <= T; t += dt) out.push(moverAt(m, t));
  return out;
}

test('movers: varied and tricky are the same plan for the same scene, another for another, and run on round again smoothly', () => {
  const { s } = siteScene();
  for (const move of MOVES) for (const timing of ['varied', 'tricky']) {
    const a = moverFor(s.parts, { move, timing }, 11), b = moverFor(s.parts, { move, timing }, 11), c = moverFor(s.parts, { move, timing }, 12);
    assert.deepEqual(a.plan, b.plan, `${move} ${timing}: one seed, one plan`);
    assert.notDeepEqual(a.plan, c.plan, `${move} ${timing}: another seed, another plan`);
    assert.ok(a.plan.len >= PLAN_S, `${move} ${timing}: the plan ${a.plan.len} s`);
    // no jump anywhere, the plan's end into its start included (a stream's load coming round aside), over 8 scenes' plans
    for (let seed = 1; seed <= 8; seed++) {
      const p = moverFor(s.parts, { move, timing }, seed), dt = 1 / 120, v = 2 * p.span / p.cross, xs0 = track(p, dt);
      let worst = 0;
      for (let k = 1; k < xs0.length; k++) xs0[k].forEach((l, i) => { const d = Math.abs(l.p[0] - xs0[k - 1][i].p[0]); if (move !== 'stream' || d < 1) worst = Math.max(worst, d); });
      assert.ok(worst < 4 * v * dt, `${move} ${timing} seed ${seed}: the biggest step ${worst.toFixed(4)} m in ${dt.toFixed(4)} s (steady top ${(v * dt).toFixed(4)})`);
    }
  }
});

test('movers: varied slide: each crossing its own time, each stop its own, never past the ends', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'slide', pace: 'medium', timing: 'varied' }, s.layout.seed), T = m.cross;
  const moves = m.plan.segs.filter(g => g.a !== g.b), stops = m.plan.segs.filter(g => g.a === g.b);
  assert.ok(moves.length >= 10, `${moves.length} crossings`);
  for (const g of moves) assert.ok(Math.abs(g.b - g.a) === 2, 'varied crosses end to end');
  const ds = moves.map(g => g.d), lo = Math.min(...ds), hi = Math.max(...ds);
  assert.ok(lo < 0.8 * T && hi > 1.2 * T, `crossings ${lo.toFixed(2)}-${hi.toFixed(2)} s (pace ${T})`);
  assert.ok(new Set(stops.map(g => g.d.toFixed(3))).size > stops.length / 2, 'stops of different lengths');
  for (const st of track(m)) assert.ok(Math.abs(st[0].p[0] - m.x0) <= m.span + 1e-9);
  assert.equal(m.plan.segs.at(-1).b, -1, 'ends at the left end, where it starts');
  // steady is v1's: every crossing the pace, every stop PAUSE
  const st = moverFor(s.parts, { move: 'slide', pace: 'medium', timing: 'steady' }, s.layout.seed);
  for (const g of st.plan.segs) assert.ok(g.a !== g.b ? g.d === T : g.d === PAUSE);
});

test('movers: tricky slide stops part-way now and then, and sometimes turns back', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'slide', timing: 'tricky' }, s.layout.seed), segs = m.plan.segs;
  const partStops = segs.filter(g => g.a === g.b && Math.abs(g.a) < 0.5);
  assert.ok(partStops.length >= 3, `${partStops.length} stops part-way`);
  // turned back: after a part-way stop, the next move goes back to the end it came from
  let back = 0;
  segs.forEach((g, i) => { if (g.a === g.b && Math.abs(g.a) < 0.5 && i > 0 && segs[i + 1]?.b === segs[i - 1].a) back++; });
  assert.ok(back >= 1 && back < partStops.length, `turned back ${back} of ${partStops.length}`);
  assert.ok(gaps(m).shutS > gaps(moverFor(s.parts, { move: 'slide', timing: 'steady' }, s.layout.seed)).shutS, 'a longer wait now and then than steady');
});

test('movers: varied swing keeps its cable, each swing its own time and width, none wider than the steady one', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'swing', pace: 'medium', timing: 'varied' }, s.layout.seed), L = CABLE_TOP - m.y;
  const lobes = m.plan.lobes;
  assert.equal(lobes.length % 2, 0, 'ends back on the side it starts');
  assert.ok(new Set(lobes.map(l => l.d.toFixed(3))).size > lobes.length / 2 && Math.max(...lobes.map(l => l.amp)) <= 1 && Math.min(...lobes.map(l => l.amp)) < 0.9, 'swings of their own time and width');
  for (const [l] of track(m, 1 / 30)) {
    assert.ok(near(Math.hypot(l.p[0] - m.x0, l.p[1] - CABLE_TOP), L, 1e-9), 'the cable keeps its length');
    assert.ok(Math.abs(l.p[0] - m.x0) <= m.span + 1e-6, 'never past the ends');
  }
});

test('movers: varied and tricky streams: the line speeds up and slows down, the loads never bump, tricky stops now and then', () => {
  const { s } = siteScene();
  for (const timing of ['varied', 'tricky']) {
    const m = moverFor(s.parts, { move: 'stream', pace: 'medium', timing }, s.layout.seed), v = 2 * m.span / m.cross;
    const speeds = m.plan.knots.map(k => k.v);
    assert.ok(Math.min(...speeds.filter(x => x > 0)) < 0.85 * v && Math.max(...speeds) > 1.2 * v, `${timing}: speeds ${Math.min(...speeds).toFixed(2)}-${Math.max(...speeds).toFixed(2)} m/s (pace ${v.toFixed(2)})`);
    assert.equal(speeds.filter(x => x === 0).length > 0, timing === 'tricky', `${timing}: stops`);
    assert.ok(speeds.every(x => x >= 0), 'never backwards');
    for (const at of track(m, 1 / 30)) {
      const xs1 = at.map(l => l.p[0]).sort((a, b) => a - b);
      for (let i = 1; i < xs1.length; i++) assert.ok(xs1[i] - xs1[i - 1] > m.load.w, `${timing}: loads ${(xs1[i] - xs1[i - 1]).toFixed(2)} m apart`);
    }
  }
});
