// Topple! Hardest's thing that moves in the way (src/core/topple-movers.js,
// journal Q106): where it is at each moment for slide, swing and stream,
// and in the physics: a ball that meets it stops and drops; the same throw
// with the way clear reaches the structure; it never touches a block.
// Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOVES, PACES, HEIGHTS, TIMINGS, LOOKS, DEFAULT, PAUSE, CABLE_TOP, STREAM_N, PLAN_S, SPREAD, DROP_FROM, DROP_G, BOUNCE_M, BOUNCE_S, THROW_TOP,
  MOVER_LEVELS, MOVING_SCENES, moverFor, moverAt, openShare, gaps, inWay, hardestDeal, hardestScene,
  PARK, LOADS, ALL_LOOKS, TYRE_OUT, TYRE_HOLE, ZIP_Y,
} from '../src/core/topple-movers.js';
import { createWorld, MOVER_KEEP, MOVER_OPEN, MOVER_SHUT, moverFits } from '../src/core/topple-world.js';
import { STEP, HAND, SCENES, MAX_LEVEL, LEVELS, launchVel, behindView } from '../src/core/topple.js';

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
  assert.equal(seen.length, MOVES.length * 3 * 3);
  assert.equal(MOVES.length, 4);
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

// The build, session 1 (developer, 2026-11-14, of v2: "maybe sometimes the
// obstacle can be something falling from the sky instead of back and
// forth"): drop.
test('movers: drop falls from out of sight as a thing falls, is braked where it hangs with a bounce, held, hauled back up; always over the line', () => {
  const { s } = siteScene();
  const m = moverFor(s.parts, { move: 'drop', pace: 'medium', timing: 'steady' }), d = m.plan.drops[0];
  const at = t => moverAt(m, t)[0].p;
  assert.equal(m.n, 1);
  assert.ok(near(at(0)[1], DROP_FROM), 'starts up out of sight');
  assert.equal(inWay(m, moverAt(m, 0)[0]), false, 'up there, out of the way');
  // the fall: as a thing falls, from DROP_FROM to where it hangs
  assert.ok(near(d.fall, Math.sqrt(2 * (DROP_FROM - m.y) / DROP_G), 1e-9));
  for (const f of [0.25, 0.5, 0.9]) assert.ok(near(at(f * d.fall)[1], DROP_FROM - DROP_G * (f * d.fall) ** 2 / 2, 1e-9), `falling at ${f}`);
  // the brake: down past where it hangs, by no more than BOUNCE_M, then held there
  let low = Infinity;
  for (let t = d.fall; t < d.fall + BOUNCE_S; t += 0.005) low = Math.min(low, at(t)[1]);
  assert.ok(low < m.y - 0.05 && low > m.y - BOUNCE_M - 1e-9, `the bounce down to ${low.toFixed(3)} (hangs at ${m.y})`);
  assert.ok(near(at(d.fall + (BOUNCE_S + d.hold) / 2)[1], m.y, 1e-9) && d.hold > BOUNCE_S, 'held where it hangs');
  assert.equal(inWay(m, moverAt(m, d.fall + d.hold * 0.9)[0]), true, 'in the way while held');
  // hauled up, back to the top, waiting; then the next drop
  assert.ok(near(at(d.fall + d.hold + d.up)[1], DROP_FROM, 1e-9), 'back up');
  assert.ok(near(at(d.fall + d.hold + d.up + d.wait / 2)[1], DROP_FROM, 1e-9), 'waits up there');
  for (let t = 0; t < 2 * m.plan.len; t += 0.01) {
    const p = at(t);
    assert.ok(near(p[0], m.x0, 1e-12) && near(p[2], m.z, 1e-12), 'straight down over the throw line');
    assert.ok(p[1] <= DROP_FROM + 1e-9 && p[1] >= m.y - BOUNCE_M - 1e-9);
  }
});

test('movers: varied and tricky drops: holds and waits of their own lengths; tricky hauled only part way now and then (still out of the throws\' way)', () => {
  const { s } = siteScene();
  const v = moverFor(s.parts, { move: 'drop', timing: 'varied' }, s.layout.seed).plan.drops;
  assert.ok(v.length >= 8, `${v.length} drops`);
  for (const key of ['hold', 'up', 'wait']) assert.ok(new Set(v.map(d => d[key].toFixed(3))).size > v.length / 2, `varied: ${key}s of their own lengths`);
  assert.ok(v.every(d => d.from === DROP_FROM && d.to === DROP_FROM), 'varied: every drop from the top');
  const t = moverFor(s.parts, { move: 'drop', timing: 'tricky' }, s.layout.seed);
  const part = t.plan.drops.filter(d => d.to < DROP_FROM);
  assert.ok(part.length >= 2 && part.length < t.plan.drops.length - 2, `tricky: ${part.length} of ${t.plan.drops.length} hauled part way`);
  for (const d of part) assert.ok(d.to - t.load.h / 2 > THROW_TOP, `part way to ${d.to.toFixed(2)} m: out of the throws' way`);
  assert.equal(t.plan.drops.at(-1).to, DROP_FROM, 'ends at the top, where it starts (round again smoothly)');
  // no jump up or down anywhere (the plan's end into its start included): never faster than the fall's end
  const top = Math.sqrt(2 * DROP_G * (DROP_FROM - t.y)), dt = 1 / 120;
  let worst = 0, prev = moverAt(t, 0)[0].p[1];
  for (let u = dt; u < 2 * t.plan.len; u += dt) { const y = moverAt(t, u)[0].p[1]; worst = Math.max(worst, Math.abs(y - prev)); prev = y; }
  assert.ok(worst < 1.05 * top * dt, `the biggest step ${worst.toFixed(3)} m in ${dt.toFixed(4)} s (the fall's end ${(top * dt).toFixed(3)})`);
});

// The load up at DROP_FROM is out of sight in every building-site scene,
// on a phone upright and sideways and a tablet (the camera fitted as the
// page fits it): its bottom over the top of the view.
test('movers: a drop\'s load up at the top is out of sight, upright and sideways', () => {
  const w = createWorld();
  let n = 0, closest = Infinity, zips = 0;
  // (the crane's load, and the park's kite: taller, 1.3 m)
  for (const [lv, look] of [[2, 'girders'], [1, 'kite']]) for (const seed of [1, 2, 3, 4]) for (let i = 1; i <= SCENES; i++) {
    const s = w.makeScene(seed, lv, i), m = moverFor(s.parts, { move: 'drop', look });
    for (const aspect of [0.46, 0.75, 1.33, 2.17]) {
      const v = behindView(aspect, s.parts), yw = v.yaw / 57.29578, pt = v.pitch / 57.29578;
      const f = [Math.sin(yw) * Math.cos(pt), Math.sin(pt), -Math.cos(yw) * Math.cos(pt)], u = [-Math.sin(yw) * Math.sin(pt), Math.cos(pt), Math.cos(yw) * Math.sin(pt)];
      const limit = Math.tan(v.fov / 2 / 57.29578);
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        const p = [m.x0 + dx * m.load.w / 2, DROP_FROM - m.load.h / 2, m.z + dz * m.load.d / 2], d = p.map((q, k) => q - v.pos[k]);
        const up = d.reduce((a, q, k) => a + q * u[k], 0) / d.reduce((a, q, k) => a + q * f[k], 0);
        n++;
        closest = Math.min(closest, up / limit);
        assert.ok(up > limit, `${look} ${seed}/${i} at ${aspect}: the load up there shows (${(up / limit).toFixed(2)} of the view's top)`);
      }
      // the park's zip line: its cable over the throw line in sight (at 6 m it wasn't: the seat hung from nowhere)
      if (lv === 1) {
        const d = [m.x0 - v.pos[0], ZIP_Y - v.pos[1], m.z - v.pos[2]], up = d.reduce((a, q, k) => a + q * u[k], 0) / d.reduce((a, q, k) => a + q * f[k], 0);
        zips++;
        assert.ok(up < 0.97 * limit, `${seed}/${i} at ${aspect}: the zip line's cable out of sight (${(up / limit).toFixed(2)} of the view's top)`);
      }
    }
  }
  assert.equal(n, 2 * 4 * SCENES * 4 * 4);
  assert.equal(zips, 4 * SCENES * 4);
  assert.ok(closest > 1, `closest ${closest.toFixed(2)}`);
  assert.ok(ZIP_Y > HEIGHTS.middle + LOADS.zip.h / 2 + 0.5, 'the cable over the seat, its chains in sight');
});

// Hardest's scenes, dealt (developer, 2026-11-14: "change the obstacle from
// scene to scene. Maybe moving things every other scene and then use space").
test('movers: Hardest\'s deal: the building site\'s scenes 1, 3, 5 each a different way and load, 2 and 4 spread out; other levels none yet', () => {
  assert.deepEqual(MOVER_LEVELS, [1, 2]);
  assert.deepEqual(MOVING_SCENES, [1, 3, 5]);
  for (let lv = 1; lv <= MAX_LEVEL; lv++) if (!MOVER_LEVELS.includes(lv)) assert.equal(hardestDeal(5, lv), null, `level ${lv}: no mover yet`);
  assert.equal(hardestDeal(5, 9), null);
  const spread = LEVELS[1].spread, seen = new Map(), deals = new Set();
  const tally = k => seen.set(k, (seen.get(k) || 0) + 1);
  for (let seed = 1; seed <= 200; seed++) {
    const d = hardestDeal(seed, 2);
    assert.deepEqual(d, hardestDeal(seed, 2), 'the same game, the same deal');
    assert.deepEqual(hardestScene(seed, 2, 3), d[2]);
    assert.equal(d.length, SCENES);
    deals.add(JSON.stringify(d));
    const movers = d.filter((h, i) => MOVING_SCENES.includes(i + 1)).map(h => h.mover), spreads = d.filter((h, i) => !MOVING_SCENES.includes(i + 1)).map(h => h.spread);
    assert.ok(movers.every(Boolean) && spreads.every(Boolean), `${seed}: ${JSON.stringify(d)}`);
    assert.equal(new Set(movers.map(c => c.move)).size, 3, `${seed}: three different ways`);
    assert.ok(movers.every(c => MOVES.includes(c.move) && LOOKS.includes(c.look)));
    assert.ok(movers[0].look !== movers[1].look && movers[1].look !== movers[2].look, `${seed}: the loads in turn`);
    assert.deepEqual(movers.map(c => c.timing), ['varied', 'varied', 'tricky']);
    assert.ok(spreads[0] !== spreads[1] && spreads.every(n => spread.includes(n)), `${seed}: ${spreads}`);
    movers.forEach(c => tally(c.move)); spreads.forEach(tally); tally(movers[0].look);
  }
  for (const k of [...MOVES, ...spread, ...LOOKS]) assert.ok(seen.get(k) >= 40, `${k} dealt only ${seen.get(k) ?? 0} times in 200 games`);
  assert.ok(deals.size >= 50, `only ${deals.size} different deals`);
  // (the building site's deals as in 10.10: game 5's, so a game under way keeps its scenes)
  assert.deepEqual(hardestDeal(5, 2).map(h => h.mover ? `${h.mover.move} ${h.mover.look}` : h.spread), HARDEST_5_SITE);
});

// The park (the build's session 2; developer, 2026-11-14: the tyre swing,
// the zip-line seat, the kite, "skip the roundabout"): each thing once, in
// its own way, in a dealt order.
// (game 5's building-site deal as 10.10 dealt it, by 10.10's code)
const HARDEST_5_SITE = ['stream bricks', 'spreadPosts', 'drop girders', 'spreadFrames', 'swing bricks'];
test('movers: Hardest\'s deal in the park: the tyre swings, the seat slides, the kite drops, each once in scenes 1, 3, 5; 2 and 4 spread out', () => {
  assert.deepEqual(PARK, { swing: 'tyre', slide: 'zip', drop: 'kite' });
  const spread = LEVELS[0].spread, seen = new Map(), orders = new Set();
  const tally = k => seen.set(k, (seen.get(k) || 0) + 1);
  for (let seed = 1; seed <= 200; seed++) {
    const d = hardestDeal(seed, 1);
    assert.deepEqual(d, hardestDeal(seed, 1), 'the same game, the same deal');
    const movers = d.filter((h, i) => MOVING_SCENES.includes(i + 1)).map(h => h.mover), spreads = d.filter((h, i) => !MOVING_SCENES.includes(i + 1)).map(h => h.spread);
    assert.ok(movers.every(Boolean) && spreads.every(Boolean), `${seed}: ${JSON.stringify(d)}`);
    assert.deepEqual(movers.map(c => c.look).sort(), ['kite', 'tyre', 'zip'], `${seed}: each thing once`);
    for (const c of movers) assert.equal(PARK[c.move], c.look, `${seed}: the ${c.look} ${c.move}s`);
    assert.deepEqual(movers.map(c => c.timing), ['varied', 'varied', 'tricky']);
    assert.ok(spreads[0] !== spreads[1] && spreads.every(n => spread.includes(n)), `${seed}: ${spreads}`);
    orders.add(movers.map(c => c.look).join(' '));
    movers.forEach((c, k) => tally(`${c.look} ${k}`)); spreads.forEach(tally);
  }
  assert.equal(orders.size, 6, `orders: ${[...orders]}`);
  for (const look of Object.values(PARK)) for (const k of [0, 1, 2]) assert.ok(seen.get(`${look} ${k}`) >= 40, `the ${look} in moving scene ${k + 1} only ${seen.get(`${look} ${k}`) ?? 0} times`);
  for (const n of spread) assert.ok(seen.get(n) >= 80, `${n} dealt only ${seen.get(n) ?? 0} times`);
});

// The park's things' physics shapes: the tyre a ring round a clear hole,
// the kite boxes within its diamond; every one within its box (w, h, d),
// which the scene check and inWay take.
test('movers: the tyre\'s ring leaves its hole clear; the kite\'s boxes stay inside its diamond; all within their box', () => {
  const corners = s => [-1, 1].flatMap(sx => [-1, 1].map(sy => {
    const c = Math.cos(s.rot), n = Math.sin(s.rot), x = sx * s.half[0], y = sy * s.half[1];
    return [s.at[0] + x * c - y * n, s.at[1] + x * n + y * c];
  }));
  const tyre = LOADS.tyre;
  assert.equal(tyre.w, 2 * TYRE_OUT); assert.equal(tyre.hole, TYRE_HOLE);
  let n = 0;
  for (const s of tyre.shapes) {
    // the box's inner face no nearer the middle than the hole's edge (its middle the nearest point)
    const mid = Math.hypot(...s.at.slice(0, 2)) - s.half[1];
    assert.ok(mid >= TYRE_HOLE - 1e-9, `a ring box ${mid.toFixed(3)} m from the middle`);
    for (const [x, y] of corners(s)) { n++; assert.ok(Math.hypot(x, y) >= TYRE_HOLE - 1e-9 && Math.abs(x) <= tyre.w / 2 + 0.03 && Math.abs(y) <= tyre.h / 2 + 0.03, `a ring corner at ${x.toFixed(2)}, ${y.toFixed(2)}`); }
  }
  // all the way round: no angle without a box over the ring's middle
  const rm = (TYRE_OUT + TYRE_HOLE) / 2;
  for (let a = 0; a < 2 * Math.PI; a += 0.05) {
    const p = [rm * Math.cos(a), rm * Math.sin(a)];
    assert.ok(tyre.shapes.some(s => { const dx = p[0] - s.at[0], dy = p[1] - s.at[1], c = Math.cos(-s.rot), sn = Math.sin(-s.rot); return Math.abs(dx * c - dy * sn) <= s.half[0] && Math.abs(dx * sn + dy * c) <= s.half[1]; }), `no ring at ${a.toFixed(2)} rad`);
  }
  const kite = LOADS.kite;
  for (const s of kite.shapes) for (const [x, y] of corners(s)) { n++; assert.ok(Math.abs(x) / (kite.w / 2) + Math.abs(y) / (kite.h / 2) <= 1 + 1e-9, `a kite corner outside the diamond: ${x.toFixed(2)}, ${y.toFixed(2)}`); }
  // covering most of the diamond (its area w h / 2)
  const area = kite.shapes.reduce((a, s) => a + 4 * s.half[0] * s.half[1], 0);
  assert.ok(area > 0.7 * kite.w * kite.h / 2, `the boxes cover ${(area / (kite.w * kite.h / 2)).toFixed(2)} of the diamond`);
  assert.equal(n, 4 * (tyre.shapes.length + kite.shapes.length));
  assert.ok(ALL_LOOKS.every(k => LOADS[k].w > 0 && LOADS[k].h > 0 && LOADS[k].d > 0));
});

// "being able to shoot through the hole would be cool" (developer,
// 2026-11-14): a ball through the hole goes on to the structure, told; at
// the ring it stops and drops.
function parkSwing(seed = 4242) {
  const hits = [];
  const w = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
  const s = w.makeScene(seed, 1, 1);
  const m = moverFor(s.parts, { move: 'swing', look: 'tyre', pace: 'slow', timing: 'steady' });
  w.setMovers(m);
  return { w, s, m, hits };
}
// A straight throw at a block passing the tyre's depth within d of the swing's middle (x0, y).
function throwAtTyre(w, power, m, d = 0.06) {
  let best = null;
  for (let up = 2; up <= 20; up += 0.5) for (let a = -0.5; a <= 0.5; a += 0.01) {
    const { vec } = launchVel(power, a, up), tr = w.trace(vec, 0), p = tr.pts.find(q => q[2] <= m.z);
    if (tr.hits[0]?.kind !== 'block' || !p) continue;
    const off = Math.hypot(p[0] - m.x0, p[1] - m.y);
    if (off < d && (!best || off < best.off)) best = { vec, pts: tr.pts, off };
  }
  return best;
}
test('movers: a ball through the tyre\'s hole goes on to the structure; one at the ring stops and drops', () => {
  const { w, s, m, hits } = parkSwing();
  assert.equal(w.movers[0].shapes.length, LOADS.tyre.shapes.length);
  const shot = throwAtTyre(w, s.layout.power, m);
  assert.ok(shot, 'a straight throw through the swing\'s middle at a block');
  const iz = shot.pts.findIndex(p => p[2] <= m.z), tz = iz * STEP, T = m.cross;
  // the tyre at the middle of its swing (steady: every T s) as the ball gets there
  stepTo(w, 2 * T - tz);
  const ball = throwAndWatch(w, shot.vec, hits);
  assert.ok(hits.includes('through'), `not through the hole: ${hits.join(', ')}`);
  assert.ok(!hits.includes('mover'), `touched the tyre: ${hits.join(', ')}`);
  assert.equal(hits.filter(h => h !== 'through')[0], 'block', `then touched: ${hits.join(', ')}`);
  assert.ok(!ball.stopped && ball.through);
  // the same throw with the ring's side where the hole was: the tyre's middle the ring's width off the line
  const off = (TYRE_OUT + TYRE_HOLE) / 2;
  let t = 4 * T, best = Infinity, at = t;
  for (let u = 4 * T; u < 6 * T; u += STEP) { const d = Math.abs(moverAt(m, u + tz)[0].p[0] - (m.x0 + off)); if (d < best) { best = d; at = u; } }
  assert.ok(best < 0.02, `the tyre ${best.toFixed(3)} m from where wanted`);
  stepTo(w, at);
  const b2 = throwAndWatch(w, shot.vec, hits);
  assert.equal(hits[0], 'mover', `first touched: ${hits.join(', ')}`);
  assert.ok(!hits.includes('through') && b2.stopped);
});

// The park's scenes on Hardest as dealt, two games: the check passes, the
// thing its own way, its way open often enough; the spread-out ones first time.
test('movers: the park\'s Hardest scenes are made as dealt, its things\' ways open often enough', () => {
  let n = 0;
  for (const seed of [12345, 404]) {
    const w = createWorld(), d = hardestDeal(seed, 1);
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 1, i, null, 'hardest'), h = d[i - 1], at = `park ${seed} scene ${i}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.deepEqual(s.layout.hardest, h, `${at}: the deal kept in the layout`);
      if (h.spread) { assert.equal(s.layout.stack, h.spread); assert.equal(s.mover, null); assert.equal(s.tries, 1, `${at}: ${s.tries} tries`); continue; }
      assert.equal(s.mover.look, h.mover.look); assert.equal(s.mover.move, h.mover.move);
      assert.deepEqual(s.mover.load, LOADS[h.mover.look]);
      assert.ok(s.check.mover.open >= MOVER_OPEN && s.check.mover.shutS <= MOVER_SHUT, `${at}: ${JSON.stringify(s.check.mover)}`);
      // on Normal: the park as it was
      const o = createWorld().makeScene(seed, 1, i);
      assert.equal(o.mover, null); assert.equal(o.layout.hardest, undefined);
    }
  }
  assert.equal(n, 2 * SCENES);
});

test('movers: Hardest\'s scenes are made as dealt, the mover\'s way open often enough; Normal and Harder as before; a mover that blocks too much fails', () => {
  let n = 0;
  for (const seed of [12345, 404]) {
    const w = createWorld(), d = hardestDeal(seed, 2);
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 2, i, null, 'hardest'), h = d[i - 1], at = `${seed} scene ${i}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.deepEqual(s.layout.hardest, h, `${at}: the deal kept in the layout`);
      if (h.spread) {
        assert.equal(s.layout.stack, h.spread);
        assert.equal(s.mover, null);
      } else {
        assert.equal(s.mover.move, h.mover.move); assert.equal(s.mover.look, h.mover.look); assert.equal(s.mover.timing, h.mover.timing);
        assert.deepEqual(s.mover.plan, moverFor(s.parts, h.mover, s.layout.seed).plan, `${at}: the plan from the scene's seed (a scene picked up again: the same)`);
        assert.ok(s.check.mover.open >= MOVER_OPEN && s.check.mover.shutS <= MOVER_SHUT, `${at}: ${JSON.stringify(s.check.mover)}`);
      }
      // Normal and Harder: no deal, no mover
      for (const mode of ['normal', 'harder']) {
        const o = createWorld().makeScene(seed, 2, i, null, mode);
        assert.equal(o.layout.hardest, undefined); assert.equal(o.mover, null);
      }
    }
  }
  assert.equal(n, 2 * SCENES);
  // Frosty Times on Hardest: as it was (no deal there yet)
  const p = createWorld().makeScene(12345, 3, 1, null, 'hardest');
  assert.equal(p.layout.hardest, undefined); assert.equal(p.mover, null);
  // a mover in the way most of the time, and for long: fails, saying why
  const { s } = siteScene();
  const blocking = { ...moverFor(s.parts, { move: 'stream', pace: 'slow', timing: 'steady' }), n: 9 };
  blocking.plan = { ...blocking.plan, offsets: Array.from({ length: 9 }, (_, k) => k * blocking.plan.loop / 9) };
  const f = moverFits(blocking);
  assert.ok(f.open < MOVER_OPEN, `open ${f.open}`);
  assert.ok(f.why.some(w => /too seldom/.test(w)), f.why.join('; '));
  assert.deepEqual(moverFits(moverFor(s.parts, { move: 'slide', timing: 'steady' })).why, []);
  // in the game: a layout whose mover blocks too much is thrown away, the next tried (rare: 6 of 3,033
  // first layouts over 1,011 games, all tricky drops; game 101's scene 5 one of them)
  const r = createWorld().makeScene(101, 2, 5, null, 'hardest');
  assert.equal(r.layout.hardest.mover.move, 'drop');
  assert.ok(r.thrown.some(t => /the mover too seldom out of the way/.test(t.why)), `thrown: ${JSON.stringify(r.thrown)}`);
  assert.ok(r.check.ok && r.tries >= 2, `${r.tries} tries: ${r.check.why}`);
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
  // (the build: wider than v2's 0.6-1.35 of the pace: "more variance in the speed"), over 8 scenes' plans
  const all = [1, 2, 3, 4, 5, 6, 7, 8].flatMap(seed => moverFor(s.parts, { move: 'slide', pace: 'medium', timing: 'varied' }, seed).plan.segs.filter(g => g.a !== g.b).map(g => g.d / T));
  const [l8, h8] = [Math.min(...all), Math.max(...all)];
  assert.ok(l8 < 0.55 && h8 > 1.7, `crossings ${l8.toFixed(2)}-${h8.toFixed(2)} of the pace over ${all.length}`);
  assert.ok(l8 >= SPREAD.varied.move[0] - 1e-9 && h8 <= SPREAD.varied.move[1] + 1e-9);
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
