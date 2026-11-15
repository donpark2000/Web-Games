// Topple! Hardest in Frosty Times (journal Q106, the build's session 3;
// developer, 2026-11-14: "Yes, build those three"): the snowman on skates
// (slide; a ball at his head knocks his hat off), the snowball machine
// (stream; a snowball hit bursts), the giant snowflake (fall, a fifth way;
// a ball can pass between its arms). Where each is at each moment, clear of
// the scene's things (the rock stands on the line), and in the physics.
// Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  MOVES, WAYS, FROSTY, PARK, LOADS, SNOWMAN, FLAKE_R, fallFrom, FALL_SPREAD, FALL_WAIT, MUZZLE_Y, MACHINE, THROW_TOP, AT, AT_TRY, ON_THINGS, ENDS_PAST,
  MOVING_SCENES, moverFor, moverAt, inWay, openShare, gaps, hardestDeal, clashes, meetsThings, flakesOn, machineAt, arcY,
} from '../src/core/topple-movers.js';
import { createWorld, MOVER_OPEN, MOVER_SHUT, moverFits } from '../src/core/topple-world.js';
import { STEP, HAND, SCENES, LEVELS, launchVel, behindView } from '../src/core/topple.js';

// A Frosty Times scene's parts, and the same with no things in it (the rock and pine left out).
function frostyScene(seed = 4242, i = 1) {
  const w = createWorld();
  const s = w.makeScene(seed, 3, i);
  return { w, s, bare: { ...s.parts, bodies: [] } };
}
const stepTo = (w, t) => { while (w.moverT < t - 1e-9) w.step(STEP); };
function throwAndWatch(w, vec, hits, steps = 360) {
  hits.length = 0;
  const ball = w.throwBall(vec);
  for (let k = 0; k < steps; k++) w.step(STEP);
  return ball;
}
// Straight throws at a block (the world's, as set): each { vec, pts, at (where it passes the mover's depth), tz (s to get there) }.
function throwsAtBlocks(w, power, m, dUp = 0.5, top = 20) {
  const out = [];
  for (let up = 2; up <= top; up += dUp) for (let a = -0.5; a <= 0.5; a += 0.01) {
    const { vec } = launchVel(power, a, up), tr = w.trace(vec, 0), iz = tr.pts.findIndex(q => q[2] <= m.z);
    if (tr.hits[0]?.kind !== 'block' || iz < 0) continue;
    out.push({ vec, pts: tr.pts, at: tr.pts[iz], tz: iz * STEP });
  }
  return out;
}
// A point's distance (2D) from a box shape { half, at, rot } of the load, in the load's own frame.
function fromBox(p, s) {
  const dx = p[0] - s.at[0], dy = p[1] - s.at[1], c = Math.cos(-s.rot), n = Math.sin(-s.rot);
  const lx = Math.abs(dx * c - dy * n) - s.half[0], ly = Math.abs(dx * n + dy * c) - s.half[1];
  return Math.hypot(Math.max(0, lx), Math.max(0, ly)) + Math.min(0, Math.max(lx, ly));
}
const corners = s => [-1, 1].flatMap(sx => [-1, 1].map(sy => {
  const c = Math.cos(s.rot), n = Math.sin(s.rot), x = sx * s.half[0], y = sy * s.half[1];
  return [s.at[0] + x * c - y * n, s.at[1] + x * n + y * c];
}));

/* ---------- the deal ---------- */

// (levels 1 and 2's Hardest deals, games 1-200 each, one JSON line a deal: by 10.11's code, run 2026-11-14)
const DEALS_1011 = '109b11021349809e8d6f24409aaca088c570f2f2';
test('frosty: Hardest\'s deal: the snowman skates, the snowballs stream, the snowflake falls, each once in scenes 1, 3, 5; 2 and 4 spread out; the park\'s and building site\'s deals as 10.11 dealt them', () => {
  assert.deepEqual(FROSTY, { slide: 'snowman', stream: 'snowball', fall: 'flake' });
  assert.deepEqual(WAYS, [...MOVES, 'fall']);
  assert.ok(!MOVES.includes('fall'), 'the crane deals over its four ways only');
  const spread = LEVELS[2].spread, seen = new Map(), orders = new Set();
  const tally = k => seen.set(k, (seen.get(k) || 0) + 1);
  assert.deepEqual(spread, ['iceSpreadPillars', 'iceSpreadGates', 'iceSpreadMix']);
  for (let seed = 1; seed <= 200; seed++) {
    const d = hardestDeal(seed, 3);
    assert.deepEqual(d, hardestDeal(seed, 3), 'the same game, the same deal');
    const movers = d.filter((h, i) => MOVING_SCENES.includes(i + 1)).map(h => h.mover), spreads = d.filter((h, i) => !MOVING_SCENES.includes(i + 1)).map(h => h.spread);
    assert.ok(movers.every(Boolean) && spreads.every(Boolean), `${seed}: ${JSON.stringify(d)}`);
    assert.deepEqual(movers.map(c => c.look).sort(), ['flake', 'snowball', 'snowman'], `${seed}: each thing once`);
    for (const c of movers) assert.equal(FROSTY[c.move], c.look, `${seed}: the ${c.look} ${c.move}s`);
    assert.deepEqual(movers.map(c => c.timing), ['varied', 'varied', 'tricky']);
    assert.ok(spreads[0] !== spreads[1] && spreads.every(n => spread.includes(n)), `${seed}: ${spreads}`);
    orders.add(movers.map(c => c.look).join(' '));
    movers.forEach((c, k) => tally(`${c.look} ${k}`)); spreads.forEach(tally);
  }
  assert.equal(orders.size, 6, `orders: ${[...orders]}`);
  for (const look of Object.values(FROSTY)) for (const k of [0, 1, 2]) assert.ok(seen.get(`${look} ${k}`) >= 40, `the ${look} in moving scene ${k + 1} only ${seen.get(`${look} ${k}`) ?? 0} times`);
  for (const n of spread) assert.ok(seen.get(n) >= 80, `${n} dealt only ${seen.get(n) ?? 0} times`);
  // the other levels' games keep their scenes
  const lines = [];
  for (let seed = 1; seed <= 200; seed++) for (const lv of [1, 2]) lines.push(JSON.stringify(hardestDeal(seed, lv)));
  assert.equal(createHash('sha1').update(lines.join('\n')).digest('hex'), DEALS_1011, 'levels 1 and 2 dealt otherwise than 10.11');
  assert.deepEqual(PARK, { swing: 'tyre', slide: 'zip', drop: 'kite' });
});

/* ---------- the shapes ---------- */

test('frosty: the snowman\'s three balls stack in his box, on skates on the snow, the top one his head; a snowball a sphere; the snowflake\'s arms inside its circle, gaps between them a ball fits through', () => {
  const sm = LOADS.snowman, [b, md, hd] = sm.shapes;
  assert.equal(sm.ground, true); assert.equal(sm.head, 2); assert.equal(sm.shapes[sm.head], hd);
  assert.ok(b.r > md.r && md.r > hd.r, 'smaller going up');
  for (const [lo, hi] of [[b, md], [md, hd]]) {
    const d = hi.at[1] - lo.at[1];
    assert.ok(d > 0 && d < lo.r + hi.r, `each ball on the one below, sunk into it (${d.toFixed(2)} m apart, radii ${lo.r} + ${hi.r})`);
  }
  for (const s of sm.shapes) assert.ok(Math.abs(s.at[1]) + s.r <= sm.h / 2 + 1e-9 && s.r <= sm.w / 2 + 1e-9 && s.r <= sm.d / 2 + 1e-9, 'within his box');
  assert.ok(Math.abs(b.at[1] - b.r - (-sm.h / 2 + SNOWMAN.skate)) < 1e-9, 'his bottom ball on his skates');
  assert.ok(sm.h / 2 - (hd.at[1] + hd.r) >= SNOWMAN.hat - 0.05, 'room for his hat');
  const { s } = frostyScene();
  const m = moverFor(s.parts, { move: 'slide', look: 'snowman' });
  assert.equal(m.y, sm.h / 2, 'on the snow, whatever the height');
  assert.equal(moverFor(s.parts, { move: 'slide', look: 'snowman', height: 'high' }).y, sm.h / 2);
  const ball = LOADS.snowball;
  assert.deepEqual(ball.shapes, [{ r: ball.w / 2, at: [0, 0, 0] }]);
  assert.equal(moverFor(s.parts, { move: 'stream', look: 'snowball' }).n, ball.n);
  // the snowflake: 1 middle, 6 arms, 12 branches; every corner within its circle
  const fl = LOADS.flake, R = FLAKE_R, r = 0.07;
  assert.equal(fl.shapes.length, 19); assert.equal(fl.w, 2 * R);
  let n = 0;
  for (const sh of fl.shapes) for (const [x, y] of corners(sh)) { n++; assert.ok(Math.hypot(x, y) <= R + 1e-9, `a corner ${Math.hypot(x, y).toFixed(3)} m out`); }
  assert.equal(n, 4 * 19);
  // six arms all round: along each of the six directions, out to near its edge
  for (let k = 0; k < 6; k++) for (const q of [0.2, 0.4, 0.6]) {
    const a = Math.PI / 2 + k * Math.PI / 3, p = [q * Math.cos(a), q * Math.sin(a)];
    assert.ok(fl.shapes.some(sh => fromBox(p, sh) <= 0), `no arm at ${(a * 57.3).toFixed(0)}°, ${q} m`);
  }
  // the gaps: points of the circle (a ball's radius in from its edge) where a ball touches no arm
  let inside = 0, clear = 0, covered = 0;
  for (let x = -R; x <= R; x += 0.01) for (let y = -R; y <= R; y += 0.01) {
    if (Math.hypot(x, y) > R - r) continue;
    inside++;
    const d = Math.min(...fl.shapes.map(sh => fromBox([x, y], sh)));
    if (d > r) clear++;
    if (d <= 0) covered++;
  }
  assert.ok(clear / inside > 0.15 && clear / inside < 0.6, `a ball passes clear at ${(100 * clear / inside).toFixed(0)}% of it`);
  assert.ok(covered / inside > 0.2, `the arms ${(100 * covered / inside).toFixed(0)}% of it`);
});

/* ---------- where each is ---------- */

test('frosty: the snowflake falls from out of sight at a steady speed, sways across the line, breaks up on the snow, gone a while (out of the way), then the next', () => {
  const { bare } = frostyScene();
  const m = moverFor(bare, { move: 'fall', look: 'flake', timing: 'steady' }, 7), T = m.cross, h = m.load.h;
  assert.equal(m.move, 'fall'); assert.equal(m.at, AT, 'nothing in its way: the usual depth');
  const f = m.plan.flakes[0];
  assert.equal(f.v, THROW_TOP / T);
  assert.equal(m.from, fallFrom(AT));
  assert.deepEqual(moverAt(m, 0)[0].p, [m.x0 + f.c + f.A * Math.sin(f.ph), m.from, m.z]);
  let left = false, right = false, gone = 0, last = null, landed = null, n = 0;
  for (let t = 0; t < m.plan.len; t += 1 / 120) {
    const [l] = moverAt(m, t);
    n++;
    if (l.gone) {
      gone++;
      assert.deepEqual(l.p, [m.x0, m.from, m.z]); assert.equal(inWay(m, l), false);
      if (landed == null) landed = last;
      last = l;
      continue;
    }
    if (last && !last.gone) assert.ok(Math.abs((last.p[1] - l.p[1]) * 120 - f.v) < 1e-6 || l.p[1] === h / 2, `steady down: ${((last.p[1] - l.p[1]) * 120).toFixed(3)} m/s`);
    assert.ok(l.p[1] >= h / 2 - 1e-9, 'never into the snow');
    if (l.p[1] < THROW_TOP) { if (l.p[0] < m.x0 - h / 2 - 0.07) left = true; if (l.p[0] > m.x0 + h / 2 + 0.07) right = true; }
    last = l;
  }
  assert.ok(left || right, 'sways clear of the line as it falls past the throws');
  assert.ok(Math.abs(landed.p[1] - h / 2) < 0.03, `down on the snow at ${landed.p[1].toFixed(3)} m`);
  assert.ok(Math.abs(gone / 120 - 2 * T * (FALL_WAIT[0] + FALL_WAIT[1]) / 2) < 0.05, `gone ${(gone / 120).toFixed(2)} s in 2 flakes`);
  // varied and tricky: each its own speed, sway and wait; tricky, now and then held up by a gust
  for (const timing of ['varied', 'tricky']) {
    const v = moverFor(bare, { move: 'fall', look: 'flake', timing }, 7), fl = v.plan.flakes;
    assert.ok(fl.length >= 10, `${fl.length} flakes`);
    assert.ok(new Set(fl.map(q => q.v.toFixed(3))).size >= fl.length - 1, 'each its own speed');
    for (const q of fl) {
      assert.ok(q.v >= THROW_TOP / (T * FALL_SPREAD[1]) - 1e-9 && q.v <= THROW_TOP / (T * FALL_SPREAD[0]) + 1e-9, `${timing}: ${q.v.toFixed(2)} m/s`);
      assert.ok(q.wait >= T * FALL_WAIT[0] - 1e-9 && q.wait <= T * FALL_WAIT[1] + 1e-9);
    }
    // swaying: nearly every flake clear of the line a while as it falls past the throws, to the left and the right
    const half = v.load.w / 2 + 0.07, side = new Set();
    let clearOnce = 0;
    for (const q of fl) {
      let was = false;
      for (let t = q.t0; t < q.t0 + q.fall; t += 1 / 60) {
        const [l] = moverAt(v, t);
        if (l.gone || l.p[1] >= THROW_TOP) continue;
        if (Math.abs(l.p[0] - v.x0) > half) { was = true; side.add(Math.sign(l.p[0] - v.x0)); }
      }
      if (was) clearOnce++;
    }
    assert.ok(clearOnce >= 0.8 * fl.length && side.size === 2, `${timing}: ${clearOnce} of ${fl.length} flakes clear of the line a while, sides ${[...side]}`);
    const gusts = fl.filter(q => q.gust);
    if (timing === 'varied') assert.equal(gusts.length, 0);
    else {
      assert.ok(gusts.length >= 2, `${gusts.length} gusts`);
      const g = gusts[0], s1 = (v.from - g.gust.y) / g.v;
      for (let s = s1; s < s1 + g.gust.d; s += 0.05) assert.ok(moverAt(v, g.t0 + s)[0].p[1] >= g.gust.y - 1e-6, 'held up by the gust');
    }
    assert.deepEqual(v.plan, moverFor(bare, { move: 'fall', look: 'flake', timing }, 7).plan, 'the same scene, the same plan');
    assert.notDeepEqual(v.plan, moverFor(bare, { move: 'fall', look: 'flake', timing }, 8).plan);
  }
});

test('frosty: the snowflake up at the top is out of sight, upright and sideways', () => {
  const w = createWorld();
  let n = 0, closest = Infinity;
  for (const seed of [1, 2, 3, 4]) for (let i = 1; i <= SCENES; i++) for (const share of [AT_TRY[0], Math.min(...AT_TRY), Math.max(...AT_TRY)]) {
    // (crossing at each depth it may)
    const s = w.makeScene(seed, 3, i), m0 = moverFor({ ...s.parts, bodies: [] }, { move: 'fall', look: 'flake' });
    const k = share / m0.at, m = { ...m0, x0: HAND.x + (m0.x0 - HAND.x) * k, z: HAND.z + (m0.z - HAND.z) * k, from: fallFrom(share) };
    for (const aspect of [0.46, 0.75, 1.33, 2.17]) {
      const v = behindView(aspect, s.parts), yw = v.yaw / 57.29578, pt = v.pitch / 57.29578;
      const f = [Math.sin(yw) * Math.cos(pt), Math.sin(pt), -Math.cos(yw) * Math.cos(pt)], u = [-Math.sin(yw) * Math.sin(pt), Math.cos(pt), Math.cos(yw) * Math.sin(pt)];
      const limit = Math.tan(v.fov / 2 / 57.29578);
      // where each flake starts: its sway's widest either side
      for (const dx of [-1.6, 1.6]) {
        const p = [m.x0 + dx, m.from - m.load.h / 2, m.z], d = p.map((q, j) => q - v.pos[j]);
        const up = d.reduce((a, q, j) => a + q * u[j], 0) / d.reduce((a, q, j) => a + q * f[j], 0);
        n++;
        closest = Math.min(closest, up / limit);
        assert.ok(up > limit, `${seed}/${i} at ${share} of the way, ${aspect}: the flake starting shows (${(up / limit).toFixed(2)} of the view's top)`);
      }
    }
  }
  assert.equal(n, 4 * SCENES * 3 * 4 * 2);
  assert.ok(closest > 1, `closest ${closest.toFixed(2)}`);
});

test('frosty: the machine\'s snowballs are lobbed from its muzzle over the line at the throws\' height, down to the snow, rolling; they burst on a thing in their way', () => {
  const { bare } = frostyScene();
  const m = moverFor(bare, { move: 'stream', look: 'snowball', timing: 'steady' }, 7), r = m.load.w / 2, P = m.plan;
  assert.ok(Math.abs(arcY(m, P, m.x0 - P.far) - MUZZLE_Y) < 1e-9, 'from the muzzle');
  assert.ok(Math.abs(arcY(m, P, m.x0) - m.y) < 1e-9, 'over the line at its height');
  assert.ok(Math.abs(arcY(m, P, m.x0 + P.far) - r) < 1e-9, 'down to the snow');
  for (let x = m.x0 - P.far; x <= m.x0 + 0.5; x += 0.05) assert.ok(arcY(m, P, x) >= MUZZLE_Y - 1e-9, `rising or over the line at ${x.toFixed(2)}`);
  assert.equal(P.end, +(m.x0 + P.far).toFixed(3), 'nothing in the way: to the snow');
  const [mx, my] = machineAt(m);
  assert.ok(Math.abs(mx + MACHINE.back - (m.x0 - P.far)) < 1e-9 && my === MACHINE.h / 2, 'the machine behind its muzzle, on the snow');
  // rolling: turned by its way along over its radius
  const a = moverAt(m, 0.5)[0], b = moverAt(m, 0.6)[0];
  assert.ok(Math.abs((b.tilt - a.tilt) + (b.p[0] - a.p[0]) / r) < 1e-9, 'rolls as it goes');
  // a rock in their way right of the line: they burst on it (gone past it); left of it: the scene's check finds it
  const rock = x => ({ ...bare, bodies: [{ kind: 'soft', thing: 'rock', shapes: [{ type: 'sphere', r: 0.4, at: [x, arcY(m, P, x), m.z] }] }] });
  const hit = moverFor(rock(m.x0 + 1.2), { move: 'stream', look: 'snowball', timing: 'steady' }, 7);
  assert.ok(hit.plan.end > m.x0 + 0.3 && hit.plan.end < m.x0 + 1.2 - 0.4 - r + 0.03, `burst at ${(hit.plan.end - m.x0).toFixed(2)} m`);
  for (let t = 0; t < hit.plan.len; t += 0.01) for (const l of moverAt(hit, t)) if (!l.gone) assert.ok(l.p[0] < hit.plan.end + 1e-9);
  assert.ok(moverAt(hit, 0).length === hit.n && openShare(hit) > 0);
  assert.deepEqual(clashes(hit, rock(m.x0 + 1.2)), []);
  // short of the line, at every depth tried: the check names it
  const wall = { ...bare, bodies: [{ kind: 'soft', thing: 'rock', shapes: Array.from({ length: 40 }, (_, k) => ({ type: 'sphere', r: 0.5, at: [m.x0 - 0.8, 1.4, HAND.z - 0.25 * k] })) }] };
  const short = moverFor(wall, { move: 'stream', look: 'snowball', timing: 'steady' }, 7);
  assert.deepEqual(clashes(short, wall), ['rock']);
  assert.ok(moverFits(short, wall).why.some(w => /through the rock/.test(w)));
});

test('frosty: the snowman skates across at a depth clear of the things, short of one at either end; through them everywhere, the check throws it away', () => {
  const { s, bare } = frostyScene();
  const m = moverFor(bare, { move: 'slide', look: 'snowman', timing: 'steady' }, 7);
  assert.equal(m.at, AT); assert.equal(m.spanL, m.span); assert.equal(m.spanR, m.span);
  assert.deepEqual(clashes(m, bare), []);
  // steady: from the left end to the right and back, his feet on the snow all the way
  const ys = new Set(), xs = [];
  for (let t = 0; t < m.plan.len; t += 0.02) { const [l] = moverAt(m, t); ys.add(l.p[1]); xs.push(l.p[0]); }
  assert.deepEqual([...ys], [m.load.h / 2]);
  assert.ok(Math.abs(Math.min(...xs) - (m.x0 - m.span)) < 1e-6 && Math.abs(Math.max(...xs) - (m.x0 + m.span)) < 1e-6);
  // a rock on the line where he'd cross: another depth, clear of it
  const at = (share, x, r = 0.6) => ({ type: 'sphere', r, at: [x, 0, HAND.z + (s.parts.stand.z - HAND.z) * share] });
  const one = { ...bare, bodies: [{ kind: 'soft', thing: 'rock', shapes: [at(AT, m.x0, 0.3)] }] };
  const moved = moverFor(one, { move: 'slide', look: 'snowman', timing: 'varied' }, 7);
  assert.notEqual(moved.at, AT); assert.ok(AT_TRY.includes(moved.at));
  // (further away first: nearer the hand he looms, at 0.4 of the way filling half a screen)
  assert.ok(moved.at > AT, `crosses at ${moved.at}, nearer than the usual ${AT}, though further is clear`);
  assert.deepEqual(clashes(moved, one), []);
  assert.deepEqual(clashes(moverFor(bare, { move: 'slide', look: 'snowman', timing: 'varied' }, 7), one), ['rock'], 'at the usual depth he would go through it');
  // a pine off to the left at every depth: his left end short of it, still past the line; his right as far as ever
  const pine = { ...bare, bodies: [{ kind: 'tree', thing: 'pine', shapes: AT_TRY.map(sh => ({ type: 'cyl', r: 0.15, hh: 2, at: [m.x0 - m.span - m.load.w / 2 + 0.25, 2, HAND.z + (s.parts.stand.z - HAND.z) * sh] })) }] };
  const short = moverFor(pine, { move: 'slide', look: 'snowman', timing: 'varied' }, 7);
  assert.ok(short.spanL < short.span - 0.2 && short.spanL >= short.load.w / 2 + 0.07 + ENDS_PAST, `left end ${short.spanL} of ${short.span}`);
  assert.equal(short.spanR, short.span);
  assert.deepEqual(clashes(short, pine), []);
  assert.ok(openShare(short) >= MOVER_OPEN, `open ${openShare(short)}`);
  // things at every depth on the line: no way clear, so the check throws the layout away, saying why
  const wall = { ...bare, bodies: [{ kind: 'soft', thing: 'rock', shapes: AT_TRY.map(sh => at(sh, m.x0, 0.5)) }] };
  const stuck = moverFor(wall, { move: 'slide', look: 'snowman' }, 7);
  assert.equal(stuck.at, AT);
  assert.deepEqual(moverFits(stuck, wall).through, ['rock']);
  assert.ok(moverFits(stuck, wall).why.some(w => /the mover through the rock/.test(w)));
  // (the crane's loads and the park's things: never checked so; they pass over or by)
  assert.deepEqual(clashes(moverFor(wall, { move: 'slide', look: 'girders' }), wall), []);
});

test('frosty: the snowflakes fall where most reach the snow (the rock on the line takes them elsewhere); on a thing, they break up on it', () => {
  const { s, bare } = frostyScene();
  const lineAt = share => [s.parts.stand.x * share, HAND.z + (s.parts.stand.z - HAND.z) * share];
  // (a rock about the game's: 0.6 m high, 0.85 m round at the snow)
  const R = 0.9, rock = shares => ({ ...bare, bodies: [{ kind: 'soft', thing: 'rock', shapes: shares.map(sh => { const [x, z] = lineAt(sh); return { type: 'sphere', r: R, at: [x, -0.3, z] }; }) }] });
  assert.equal(flakesOn(moverFor(bare, { move: 'fall', look: 'flake' }, 7)).share, 0, 'nothing there: all to the snow');
  assert.equal(moverFor(bare, { move: 'fall', look: 'flake' }, 7).at, AT);
  // a rock on the line where they'd cross: another depth, where most reach the snow
  const one = rock([AT]), m = moverFor(one, { move: 'fall', look: 'flake' }, 7);
  assert.notEqual(m.at, AT);
  assert.ok(flakesOn(m, meetsThings(one)).share <= ON_THINGS);
  assert.deepEqual(clashes(m, one), []);
  // rocks at every depth: they come down on them (breaking up on them, not inside), and the check says so
  const all = rock(AT_TRY), on = moverFor(all, { move: 'fall', look: 'flake' }, 7), o = flakesOn(on, meetsThings(all));
  assert.equal(on.at, AT);
  assert.ok(o.share > ON_THINGS && o.top === 'rock', `${o.share} on the ${o.top}`);
  assert.deepEqual(clashes(on, all), ['rock']);
  let onTop = 0;
  for (const f of on.plan.flakes) {
    const [l] = moverAt(on, f.t0 + Math.max(0, f.fall - 1e-3));
    assert.ok(!l.gone && l.p[1] >= on.load.h / 2 - 1e-9);
    if (l.p[1] > on.load.h / 2 + 0.01) {
      onTop++;
      // its box (as the plan takes it) no further into the rock than one step's fall
      const hs = [0.85 * on.load.w / 2, 0.85 * on.load.h / 2, on.load.d / 2], c = all.bodies[0].shapes[0].at;
      const d = Math.hypot(...[0, 1, 2].map(k => Math.max(0, Math.abs(c[k] - l.p[k]) - hs[k])));
      assert.ok(d > R - f.v / 60 - 0.01, `broke up ${(R - d).toFixed(3)} m into the rock`);
    }
  }
  assert.ok(onTop > 0);
});

/* ---------- in the physics ---------- */

test('frosty: a ball at the snowman\'s head knocks his hat off (once), and stops; one at his middle stops, his hat left on', () => {
  const { s, bare } = frostyScene(4242, 1);
  const m = moverFor(bare, { move: 'slide', look: 'snowman', pace: 'slow', timing: 'steady' }, 7);
  const hd = m.load.shapes[m.load.head], md = m.load.shapes[1];
  const hits = [], w = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
  w.setScene(bare);
  // throws anywhere along his way (near the line the low ones go through the ice gate's opening: none under 1.55 m)
  const cands = throwsAtBlocks(w, s.layout.power, m, 0.1, 35).filter(c => Math.abs(c.at[0] - m.x0) < m.span - 0.3);
  const best = y => cands.reduce((q, c) => { const off = Math.abs(c.at[1] - y); return !q || off < q.off ? { ...c, off } : q; }, null);
  const head = best(m.y + hd.at[1]), mid = best(m.y + md.at[1] + 0.05);
  assert.ok(head.off < 0.05 && mid.off < 0.05, `throws at his head's height (${head.off.toFixed(3)} m off) and his middle's (${mid.off.toFixed(3)})`);
  assert.ok(mid.at[1] - m.y - hd.at[1] < -(hd.r + 0.07 + 0.05), 'the middle throw well under his head');
  // a moment he's where the throw passes (steady: across and back every plan's length), from the plan's second round
  const when = shot => { for (let t = m.plan.len; t < 2 * m.plan.len; t += STEP) if (Math.abs(moverAt(m, t + shot.tz)[0].p[0] - shot.at[0]) < 0.02) return t; return null; };
  const run = (shot, t) => { const w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } }); w2.setScene(bare); w2.setMovers(m); stepTo(w2, t); return w2; };
  const th = when(head), tm = when(mid);
  assert.ok(th != null && tm != null);
  const w1 = run(head, th), ball = throwAndWatch(w1, head.vec, hits);
  assert.equal(hits[0], 'mover', `first touched: ${hits.join(', ')}`);
  assert.equal(hits.filter(h => h === 'hat').length, 1, hits.join(', '));
  assert.ok(ball.stopped && w1.movers[0].hatOff);
  stepTo(w1, th + 2 * m.plan.len);
  throwAndWatch(w1, head.vec, hits);
  assert.ok(hits.includes('mover') && !hits.includes('hat'), `the hat off once: ${hits.join(', ')}`);
  const w3 = run(mid, tm), b3 = throwAndWatch(w3, mid.vec, hits);
  assert.equal(hits[0], 'mover', `first touched: ${hits.join(', ')}`);
  assert.ok(!hits.includes('hat') && b3.stopped && !w3.movers[0].hatOff, `his middle: ${hits.join(', ')}`);
});

test('frosty: a snowball hit bursts (the ball stops); burst, it touches nothing until it comes round again, then whole', () => {
  const { s, bare } = frostyScene(4242, 1);
  const m = moverFor(bare, { move: 'stream', look: 'snowball', pace: 'slow', timing: 'steady' }, 7);
  const hits = [], w = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
  w.setScene(bare); w.setMovers(m);
  const shot = throwsAtBlocks(w, s.layout.power, m, 0.1).reduce((q, c) => { const off = Math.hypot(c.at[0] - m.x0, c.at[1] - m.y); return !q || off < q.off ? { ...c, off } : q; }, null);
  assert.ok(shot.off < 0.08, `a throw through where they cross (${shot.off.toFixed(3)} m off)`);
  // a moment a snowball is at the line as the ball gets there
  let when = null, which = -1;
  for (let t = 2; t < 2 + m.plan.len && when == null; t += STEP) moverAt(m, t + shot.tz).forEach((l, i) => { if (when == null && !l.gone && Math.abs(l.p[0] - m.x0) < 0.02) { when = t; which = i; } });
  assert.ok(when != null);
  stepTo(w, when);
  const ball = throwAndWatch(w, shot.vec, hits, Math.ceil((shot.tz + 0.3) / STEP));
  assert.equal(hits[0], 'mover', `first touched: ${hits.join(', ')}`);
  assert.ok(hits.includes('burst') && ball.stopped);
  const sb = w.movers[which];
  assert.ok(sb.burst && sb.collisionResponse === false, 'burst: touches nothing');
  assert.ok(w.movers.filter(b => b.burst).length === 1, 'only that one');
  // round again (its loop's time on): whole
  for (let k = 0; k < Math.ceil(m.plan.len / STEP); k++) w.step(STEP);
  assert.ok(!sb.burst && sb.collisionResponse === true, 'whole again once round');
});

test('frosty: a ball between the snowflake\'s arms goes on to the structure, told; one at an arm stops and drops', () => {
  const { s, bare } = frostyScene(4242, 1);
  const m = moverFor(bare, { move: 'fall', look: 'flake', pace: 'slow', timing: 'steady' }, 7), R = m.load.w / 2, r = 0.07;
  const w = createWorld();
  w.setScene(bare);
  const cands = throwsAtBlocks(w, s.layout.power, m).filter((_, k) => k % 3 === 0);
  // a throw and a moment: where it passes the flake's plane, in the flake's own frame (turned back by its turn)
  const rel = (c, t) => { const [l] = moverAt(m, t + c.tz); if (l.gone) return null; const dx = c.at[0] - l.p[0], dy = c.at[1] - l.p[1], k = Math.cos(-l.tilt), n = Math.sin(-l.tilt); return [dx * k - dy * n, dx * n + dy * k]; };
  let gap = null, arm = null;
  for (let t = 0; t < m.plan.len && !(gap && arm); t += 0.02) for (const c of cands) {
    const p = rel(c, t);
    if (!p || Math.hypot(...p) > R - 0.15) continue;
    const d = Math.min(...m.load.shapes.map(sh => fromBox(p, sh)));
    if (!gap && d > r + 0.04 && Math.hypot(...p) > 0.25) gap = { c, t };
    if (!arm && d < -0.03) arm = { c, t };
  }
  assert.ok(gap && arm, 'a throw through a gap, and one at an arm');
  for (const [k, q] of [['gap', gap], ['arm', arm]]) {
    const hits = [], w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w2.setScene(bare); w2.setMovers(m); stepTo(w2, q.t);
    const ball = throwAndWatch(w2, q.c.vec, hits);
    if (k === 'gap') {
      assert.ok(hits.includes('through') && !hits.includes('mover'), `through a gap: ${hits.join(', ')}`);
      assert.equal(hits.filter(h => h !== 'through')[0], 'block', hits.join(', '));
      assert.ok(!ball.stopped && ball.through);
    } else {
      assert.equal(hits[0], 'mover', `at an arm: ${hits.join(', ')}`);
      assert.ok(!hits.includes('through') && ball.stopped);
    }
  }
});

/* ---------- the scenes ---------- */

// Frosty Times' Hardest scenes as dealt, two games: the check passes, each
// thing its own way, open often enough, through none of the things.
test('frosty: Frosty Times\' Hardest scenes are made as dealt, open often enough, clear of the rock and the pine; Normal as before', () => {
  let n = 0;
  for (const seed of [12345, 404]) {
    const w = createWorld(), d = hardestDeal(seed, 3);
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 3, i, null, 'hardest'), h = d[i - 1], at = `frosty ${seed} scene ${i}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.deepEqual(s.layout.hardest, h, `${at}: the deal kept in the layout`);
      if (h.spread) { assert.equal(s.layout.stack, h.spread); assert.equal(s.mover, null); assert.ok(s.tries <= 2, `${at}: ${s.tries} tries`); continue; }   // (a second try only when the lantern found no place: Q97, game 404's scene 4)
      const m = s.mover;
      assert.equal(m.look, h.mover.look); assert.equal(m.move, h.mover.move);
      assert.ok(s.check.mover.open >= MOVER_OPEN && s.check.mover.shutS <= MOVER_SHUT, `${at}: ${JSON.stringify(s.check.mover)}`);
      assert.deepEqual(clashes(m, s.parts), [], at);
      assert.equal(s.check.mover.through, undefined);
      assert.deepEqual(m.plan, moverFor(s.parts, h.mover, s.layout.seed).plan, `${at}: the same plan from the scene's seed`);
      const o = createWorld().makeScene(seed, 3, i);
      assert.equal(o.mover, null); assert.equal(o.layout.hardest, undefined);
    }
  }
  assert.equal(n, 2 * SCENES);
  // a layout whose snowman can't get clear of the rock and pine is thrown away, the next tried (game 5's scene 1;
  // 10 of 40 games' snowman scenes, 2-5 tries)
  const r = createWorld().makeScene(5, 3, 1, null, 'hardest');
  assert.equal(r.layout.hardest.mover.look, 'snowman');
  assert.ok(r.thrown.some(t => /the mover through the/.test(t.why)), `thrown: ${JSON.stringify(r.thrown)}`);
  assert.ok(r.check.ok && r.tries >= 2);
});
