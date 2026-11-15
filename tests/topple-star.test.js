// Topple! Hardest in Star Light (journal Q110, the build's session 5; developer,
// 2026-11-15: "I like it all except for the owl. I don't want to be hitting a
// creature with the balls. Something inanimate but moving ... a sled going by"):
// a paper lantern swinging on its chain, a sled sliding on the snow, a star
// falling at a slant (a ball can pass between its points), each once in scenes
// 1, 3, 5; scenes 2 and 4 spread out, with a telescope not to hit.
// Where each is at each moment, clear of the rock and the pine, and in the
// physics. Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  MOVES, WAYS, STAR_LIGHT, CANYON, FROSTY, PARK, LOADS, STAR_R, STAR_D, STAR_SLOPE, SLED_H, HEIGHTS, THROW_TOP, CABLE_TOP, AT, AT_TRY, ENDS_PAST, MOVER_LEVELS, MOVING_SCENES,
  moverFor, moverAt, inWay, openShare, gaps, hardestDeal, clashes, flakesOn,
} from '../src/core/topple-movers.js';
import { createWorld, MOVER_OPEN, MOVER_SHUT, moverFits } from '../src/core/topple-world.js';
import { STEP, HAND, SCENES, LEVELS, launchVel } from '../src/core/topple.js';
import { STRUCTURES as DATA } from '../src/core/topple-levels.js';
import { KEEP, THINGS, keepFor, keepLine, KEEP_EMOJI } from '../src/core/topple-keepout.js';

// A Star Light scene's parts, and the same with no things in it (the rock and pine left out).
function starScene(seed = 4242, i = 1) {
  const w = createWorld();
  const s = w.makeScene(seed, 5, i);
  return { w, s, bare: { ...s.parts, bodies: [] } };
}
const stepTo = (w, t) => { while (w.moverT < t - 1e-9) w.step(STEP); };
function throwAndWatch(w, vec, hits, steps = 360) {
  hits.length = 0;
  const ball = w.throwBall(vec);
  for (let k = 0; k < steps; k++) w.step(STEP);
  return ball;
}
// Straight throws at a block (the world's, as set): each { vec, pts, at (where it passes the mover's depth), tz }.
function throwsAtBlocks(w, power, m, dUp = 0.5, top = 20) {
  const out = [];
  for (let up = 2; up <= top; up += dUp) for (let a = -0.5; a <= 0.5; a += 0.01) {
    const { vec } = launchVel(power, a, up), tr = w.trace(vec, 0), iz = tr.pts.findIndex(q => q[2] <= m.z);
    if (tr.hits[0]?.kind !== 'block' || iz < 0) continue;
    out.push({ vec, pts: tr.pts, at: tr.pts[iz], tz: iz * STEP });
  }
  return out;
}
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

// (levels 1-4's Hardest deals, games 1-200 each, one JSON line a deal, and 60 snowflake plans: by 10.19's code
// (the commit before this one), run 2026-11-15 with the scratch script that made these two: the same by this code)
const DEALS_1019 = 'bd5c8634dc627b457ec97d24c848e6967e65ed16';
const FLAKE_PLANS_1019 = '80a9f219766b625a38c7e81ba47426fae1a495b8';
test('star: Hardest\'s deal: the lantern swings, the sled slides, the star falls, each once in scenes 1, 3, 5; 2 and 4 spread out; levels 1-4 dealt as before', () => {
  assert.deepEqual(STAR_LIGHT, { slide: 'sled', swing: 'paperLantern', fall: 'star' });
  assert.deepEqual(MOVER_LEVELS, [1, 2, 3, 4, 5]);
  const spread = LEVELS[4].spread, seen = new Map(), orders = new Set();
  const tally = k => seen.set(k, (seen.get(k) || 0) + 1);
  assert.deepEqual(spread, ['starSpreadColumns', 'starSpreadGates', 'starSpreadMix']);
  for (let seed = 1; seed <= 200; seed++) {
    const d = hardestDeal(seed, 5);
    assert.deepEqual(d, hardestDeal(seed, 5), 'the same game, the same deal');
    const movers = d.filter((h, i) => MOVING_SCENES.includes(i + 1)).map(h => h.mover), spreads = d.filter((h, i) => !MOVING_SCENES.includes(i + 1)).map(h => h.spread);
    assert.ok(movers.every(Boolean) && spreads.every(Boolean), `${seed}: ${JSON.stringify(d)}`);
    assert.deepEqual(movers.map(c => c.look).sort(), ['paperLantern', 'sled', 'star'], `${seed}: each thing once`);
    for (const c of movers) assert.equal(STAR_LIGHT[c.move], c.look, `${seed}: the ${c.look} goes by ${c.move}`);
    assert.deepEqual(movers.map(c => c.timing), ['varied', 'varied', 'tricky']);
    assert.ok(spreads[0] !== spreads[1] && spreads.every(n => spread.includes(n)), `${seed}: ${spreads}`);
    orders.add(movers.map(c => c.look).join(' '));
    movers.forEach((c, k) => tally(`${c.look} ${k}`)); spreads.forEach(tally);
  }
  assert.equal(orders.size, 6, `orders: ${[...orders]}`);
  for (const look of Object.values(STAR_LIGHT)) for (const k of [0, 1, 2]) assert.ok(seen.get(`${look} ${k}`) >= 40, `the ${look} in moving scene ${k + 1} only ${seen.get(`${look} ${k}`) ?? 0} times`);
  for (const n of spread) assert.ok(seen.get(n) >= 80, `${n} dealt only ${seen.get(n) ?? 0} times`);
  const lines = [];
  for (let seed = 1; seed <= 200; seed++) for (const lv of [1, 2, 3, 4]) lines.push(JSON.stringify(hardestDeal(seed, lv)));
  assert.equal(createHash('sha1').update(lines.join('\n')).digest('hex'), DEALS_1019, 'levels 1-4 dealt otherwise than 10.19');
  assert.deepEqual(PARK, { swing: 'tyre', slide: 'zip', drop: 'kite' });
  assert.deepEqual(FROSTY, { slide: 'snowman', stream: 'snowball', fall: 'flake' });
  assert.deepEqual(CANYON, { slide: 'cart', stream: 'tumbleweed', drop: 'vulture' });
  assert.deepEqual(WAYS, [...MOVES, 'fall']);
  assert.equal(hardestDeal(5, 6), null, 'no level 6');
});

test('star: the spread-out structures: glowing pieces well apart, each on the snow, a cube on each column or gate', () => {
  const k = () => 1;
  for (const name of LEVELS[4].spread) {
    assert.ok(DATA[name], `${name} is a structure`);
    const bs = DATA[name](k);
    assert.ok(bs.length >= 6 && bs.length <= 16, `${name}: ${bs.length} pieces`);
    assert.ok(bs.every(b => b.mat === 'glow' && b.c), `${name}: glowing, each its colour`);
    assert.ok(Math.min(...bs.map(b => b.y - b.h / 2)) < 0.01 && Math.min(...bs.map(b => b.y - b.h / 2)) >= 0, `${name}: standing on the snow`);
    const feet = bs.filter(b => b.y - b.h / 2 < 0.01), xs = feet.map(b => b.x);
    assert.ok(Math.max(...xs) - Math.min(...xs) >= 1.4, `${name}: spread ${(Math.max(...xs) - Math.min(...xs)).toFixed(2)} m`);
    assert.ok(bs.filter(b => b.shape !== 'cyl' && b.w === 0.26 && b.h === 0.26).length >= 2, `${name}: cubes on top`);
    assert.notDeepEqual(DATA[name](key => (key.startsWith('h') || key.startsWith('p') ? 1.05 : 1)).map(b => b.h), bs.map(b => b.h), `${name}: its heights vary with the game`);
  }
});

/* ---------- the shapes ---------- */

test('star: the star\'s five points within its circle, gaps between them a ball fits through; the sled a box on the snow; the paper lantern a box that hangs', () => {
  const st = LOADS.star, R = STAR_R, r = 0.07;
  assert.equal(st.w, 2 * R); assert.equal(st.d, STAR_D); assert.equal(st.gaps, true); assert.equal(st.clear, true); assert.equal(st.slant, true); assert.equal(st.ground, undefined);
  assert.equal(st.shapes.length, 1 + 5 * 2, 'a middle and an inner and an outer box to each point');
  let n = 0, reach = 0;
  for (const sh of st.shapes) for (const [x, y] of corners(sh)) { n++; reach = Math.max(reach, Math.hypot(x, y)); assert.ok(Math.hypot(x, y) <= R + 1e-6, `a corner ${Math.hypot(x, y).toFixed(3)} m out`); }
  assert.equal(n, 4 * st.shapes.length);
  assert.ok(reach > R - 0.05, `the points reach ${reach.toFixed(2)} of ${R}`);
  // the points: one straight up, the others 72 degrees round; between each pair a wedge a ball fits through
  let inside = 0, clear = 0;
  for (let x = -R; x <= R; x += 0.01) for (let y = -R; y <= R; y += 0.01) {
    if (Math.hypot(x, y) > R - r) continue;
    inside++;
    if (Math.min(...st.shapes.map(sh => fromBox([x, y], sh))) > r) clear++;
  }
  assert.ok(clear / inside > 0.3 && clear / inside < 0.8, `a ball passes clear at ${(100 * clear / inside).toFixed(0)}% of it`);
  for (let k = 0; k < 5; k++) {
    const up = Math.PI / 2 + k * 2 * Math.PI / 5, between = up + Math.PI / 5, p = [0.42 * Math.cos(between), 0.42 * Math.sin(between)], on = [0.42 * Math.cos(up), 0.42 * Math.sin(up)];
    assert.ok(Math.min(...st.shapes.map(sh => fromBox(p, sh))) > r, `a gap between points at ${(between * 57.3).toFixed(0)} degrees`);
    assert.ok(Math.min(...st.shapes.map(sh => fromBox(on, sh))) < 0, `a point at ${(up * 57.3).toFixed(0)} degrees`);
  }
  const sled = LOADS.sled, lamp = LOADS.paperLantern;
  assert.equal(sled.ground, true); assert.equal(sled.clear, true); assert.equal(sled.minShare, 0.4); assert.equal(sled.d, 0.7);
  // the sled: a body, a board curled up at each end and a tree in three tiers, all inside its box, the tree to its top
  assert.equal(sled.h, SLED_H); assert.equal(sled.shapes.length, 6);
  let top = -Infinity, bottom = Infinity;
  for (const sh of sled.shapes) for (const [x, y] of corners(sh)) {
    assert.ok(Math.abs(x) <= sled.w / 2 + 1e-9 && y <= sled.h / 2 + 1e-9 && y >= -sled.h / 2 - 1e-9, `within its box: ${x.toFixed(2)}, ${y.toFixed(2)}`);
    top = Math.max(top, y); bottom = Math.min(bottom, y);
  }
  assert.ok(Math.abs(top - sled.h / 2) < 1e-9, 'the tree reaches the top of its box');
  assert.ok(Math.abs(bottom - (-sled.h / 2 + 0.1)) < 1e-9, 'on its runners, 10 cm up');
  assert.ok(sled.h >= 1.25, 'tall enough that about half the throws (they pass 0.90-1.65 m up) can meet it');
  assert.equal(lamp.shapes, undefined); assert.equal(lamp.ground, undefined); assert.equal(lamp.clear, undefined, 'it swings over the things');
  assert.ok(lamp.h >= 1.0 && lamp.h <= 1.3);
});

/* ---------- where each is ---------- */

test('star: the star falls at a slant, not turning, over the line at its crossing height, breaks up on the snow, the next after a wait; the snowflake\'s plans are as they were', () => {
  const { bare } = starScene();
  const m = moverFor(bare, { move: 'fall', look: 'star', pace: 'medium', timing: 'steady' }, 7), R = m.load.h / 2;
  assert.equal(m.n, 1);
  const f = m.plan.flakes[0];
  assert.ok(Math.abs(f.slope) >= STAR_SLOPE[0] && Math.abs(f.slope) <= STAR_SLOPE[1], `slope ${f.slope}`);
  let was = null, landed = false, lowest = Infinity;
  for (let t = f.t0; t < f.t0 + f.fall - 0.02; t += 0.01) {
    const [l] = moverAt(m, t);
    assert.equal(l.tilt, 0, 'does not turn'); assert.equal(l.gone, false);
    // straight down the slant: the sideways travel is the slope times the height fallen, whatever its speed
    assert.ok(Math.abs((l.p[0] - m.x0 - f.c) - f.slope * (m.y - l.p[1])) < 1e-9, `at ${l.p[1].toFixed(2)} m: ${l.p[0].toFixed(3)}`);
    if (was) assert.ok(l.p[1] < was.p[1] && Math.sign(l.p[0] - was.p[0]) === Math.sign(f.slope), 'down and the way it slants');
    was = l; lowest = Math.min(lowest, l.p[1]);
  }
  lowest = Math.min(lowest, moverAt(m, f.t0 + f.fall - 1e-6)[0].p[1]);
  assert.ok(Math.abs(lowest - R) < 0.01, `down to ${lowest.toFixed(3)} m, the snow under it at ${R}`);
  // gone (up out of the way) once down, until the next
  const g = moverAt(m, f.t0 + f.fall + 0.01)[0];
  assert.equal(g.gone, true); assert.equal(g.p[1], m.from);
  const next = m.plan.flakes[1], back = moverAt(m, next.t0 + 0.01)[0];
  assert.equal(back.gone, false); assert.ok(next.t0 > f.t0 + f.fall, 'a wait between');
  // it crosses the line (x0 + c) as it passes the crossing height, and the slant goes both ways over a plan
  assert.ok(m.plan.flakes.every(fl => Math.abs(fl.slope) >= STAR_SLOPE[0]));
  const varied = moverFor(bare, { move: 'fall', look: 'star', timing: 'varied' }, 7);
  assert.ok(varied.plan.flakes.some(fl => fl.slope > 0) && varied.plan.flakes.some(fl => fl.slope < 0), 'slants both ways');
  assert.ok(new Set(varied.plan.flakes.map(fl => +fl.slope.toFixed(3))).size > 4, 'each its own slant');
  // the way is open often enough, never shut long, whatever the timing
  for (const timing of ['steady', 'varied', 'tricky']) {
    const mv = moverFor(bare, { move: 'fall', look: 'star', timing }, 7);
    assert.ok(openShare(mv) >= MOVER_OPEN && gaps(mv).shutS <= MOVER_SHUT, `${timing}: open ${openShare(mv)}, shut ${gaps(mv).shutS}`);
  }
  // the snowflake sways as it did, its plans carrying no slope: a hash taken by 10.19's code
  const lines = [];
  for (let seed = 1; seed <= 20; seed++) {
    const w = createWorld(), s = w.makeScene(4242 + seed, 3, 1), fb = { ...s.parts, bodies: [] };
    for (const timing of ['steady', 'varied', 'tricky']) lines.push(JSON.stringify(moverFor(fb, { move: 'fall', look: 'flake', timing }, seed).plan));
  }
  assert.equal(createHash('sha1').update(lines.join('\n')).digest('hex'), FLAKE_PLANS_1019, 'the snowflake\'s plans are as 10.19 made them');
});

test('star: the paper lantern swings on its chain from out of sight, out to either side; the sled slides on the snow, across and back, short of a thing at either end', () => {
  const { s, bare } = starScene();
  const l = moverFor(bare, { move: 'swing', look: 'paperLantern', timing: 'steady' }, 7), L = CABLE_TOP - l.y;
  assert.equal(l.y, HEIGHTS.middle); assert.equal(l.n, 1);
  let left = 0, right = 0, low = Infinity;
  for (let t = 0; t < l.plan.len; t += 0.01) {
    const [p] = moverAt(l, t);
    assert.ok(Math.abs(Math.hypot(p.p[0] - l.x0, CABLE_TOP - p.p[1]) - L) < 1e-9, 'on its chain');
    left = Math.min(left, p.p[0] - l.x0); right = Math.max(right, p.p[0] - l.x0); low = Math.min(low, p.p[1]);
  }
  assert.ok(left < -0.9 * l.span && right > 0.9 * l.span, `swings ${left.toFixed(2)} to ${right.toFixed(2)} of ${l.span}`);
  assert.ok(left >= -l.span - 1e-6 && right <= l.span + 1e-6);
  assert.ok(Math.abs(low - l.y) < 1e-6, 'lowest at the middle');
  assert.ok(openShare(l) >= MOVER_OPEN && gaps(l).shutS <= MOVER_SHUT, `lantern: open ${openShare(l)}, shut ${gaps(l).shutS}`);
  // the sled: on the snow whatever the height asked, across and back to both ends
  const m = moverFor(bare, { move: 'slide', look: 'sled', timing: 'steady' }, 7);
  assert.equal(m.y, m.load.h / 2); assert.equal(moverFor(bare, { move: 'slide', look: 'sled', height: 'high' }, 7).y, m.load.h / 2);
  assert.equal(m.spanL, m.span); assert.equal(m.spanR, m.span);
  const xs = [], ys = new Set();
  for (let t = 0; t < m.plan.len; t += 0.02) { const [p] = moverAt(m, t); xs.push(p.p[0]); ys.add(p.p[1]); }
  assert.deepEqual([...ys], [m.load.h / 2]);
  assert.ok(Math.abs(Math.min(...xs) - (m.x0 - m.span)) < 1e-6 && Math.abs(Math.max(...xs) - (m.x0 + m.span)) < 1e-6);
  // a rock off to the right at every depth: its right end short of it, past the line; the left as far as ever
  const rock = { ...bare, bodies: [{ kind: 'bush', thing: 'rock', shapes: AT_TRY.map(sh => ({ type: 'sphere', r: 0.3, at: [m.x0 + m.span + m.load.w / 2 - 0.2, 0.3, HAND.z + (s.parts.stand.z - HAND.z) * sh] })) }] };
  const short = moverFor(rock, { move: 'slide', look: 'sled', timing: 'varied' }, 7);
  assert.ok(short.spanR < short.span - 0.2 && short.spanR >= short.load.w / 2 + 0.07 + ENDS_PAST, `right end ${short.spanR} of ${short.span}`);
  assert.equal(short.spanL, short.span);
  assert.deepEqual(clashes(short, rock), []);
  for (const timing of ['steady', 'varied', 'tricky']) {
    const mv = moverFor(bare, { move: 'slide', look: 'sled', timing }, 7);
    assert.ok(openShare(mv) >= MOVER_OPEN && gaps(mv).shutS <= MOVER_SHUT, `sled ${timing}: open ${openShare(mv)}, shut ${gaps(mv).shutS}`);
  }
});

test('star: the sled and the star cross at a depth clear of the rock and pine (further first); through them everywhere, the check throws the layout away; the lantern swings over them', () => {
  const { s, bare } = starScene();
  const lineAt = share => HAND.z + (s.parts.stand.z - HAND.z) * share;
  const wall = { ...bare, bodies: [{ kind: 'bush', thing: 'rock', shapes: AT_TRY.map(sh => ({ type: 'sphere', r: 0.6, at: [bare.stand.x * sh, 0.4, lineAt(sh)] })) }] };
  for (const [look, move] of [['sled', 'slide'], ['star', 'fall']]) {
    const free = moverFor(bare, { move, look, timing: 'varied' }, 7);
    assert.equal(free.at, AT); assert.deepEqual(clashes(free, bare), []);
    // a rock right at the usual depth (as wide as the sled's way past it allows: at the next depths 0.75 of the way, 1.02 m off, the 2 m sled's 0.45 m half-depth and the rock must fit; most of the stars, which land 0.3-0.7 m to a side, come down on it)
    // (the sled's 0.7 m depth needs the rock narrow: 0.5; the star, thin, a wide one: 0.9)
    const one = { ...bare, bodies: [{ kind: 'bush', thing: 'rock', shapes: [{ type: 'sphere', r: look === 'star' ? 0.9 : 0.5, at: [free.x0, 0.4, free.z] }] }] };
    const moved = moverFor(one, { move, look, timing: 'varied' }, 7);
    assert.ok(AT_TRY.includes(moved.at) && moved.at !== AT, `${look}: crosses at ${moved.at}`);
    assert.deepEqual(clashes(moved, one), [], look);
    // (the sled's way is a path in the open; a star's plan is worked out against the things it was made for, so it is not asked of `free`)
    if (look === 'sled') assert.ok(clashes(free, one).includes('rock'), `${look}: at the usual depth it goes into the rock`);
    else assert.ok(flakesOn(moverFor(one, { move, look, timing: 'varied' }, 7)).share <= 0.3, `${look}: the plan made against the rock comes down on it at most 30% of the time`);
    const stuck = moverFor(wall, { move, look }, 7);
    assert.equal(stuck.at, AT);
    assert.ok(clashes(stuck, wall).includes('rock'), `${look}: ${JSON.stringify(clashes(stuck, wall))}`);
    assert.ok(moverFits(stuck, wall).why.some(w => /the mover through the rock/.test(w)), look);
  }
  assert.deepEqual(clashes(moverFor(wall, { move: 'swing', look: 'paperLantern' }, 7), wall), [], 'the lantern swings over');
  // the stars that come down on the rock: a share of the plan, over the bar once the rock is across the line
  const m = moverFor(bare, { move: 'fall', look: 'star', timing: 'varied' }, 7);
  assert.equal(flakesOn(m).share, 0);
});

/* ---------- in the physics ---------- */

test('star: a ball at a point of the star stops and drops; one between the points goes on to the structure, told once; none touches a block', () => {
  const { s, bare } = starScene(4242, 1);
  const m = moverFor(bare, { move: 'fall', look: 'star', pace: 'slow', timing: 'steady' }, 7), R = m.load.w / 2, r = 0.07;
  const w = createWorld();
  w.setScene(bare);
  const cands = throwsAtBlocks(w, s.layout.power, m).filter((_, k) => k % 3 === 0);
  // a throw and a moment: where it passes the star's plane, in its own frame (it does not turn)
  const rel = (c, t) => { const [l] = moverAt(m, t + c.tz); return l.gone ? null : [c.at[0] - l.p[0], c.at[1] - l.p[1]]; };
  const gapsAt = [];
  let point = null;
  for (let t = 0; t < m.plan.len; t += 0.02) for (const c of cands) {
    const p = rel(c, t);
    if (!p || Math.hypot(...p) > R - 0.15) continue;
    const d = Math.min(...m.load.shapes.map(sh => fromBox(p, sh)));
    if (d > r + 0.03 && Math.hypot(...p) > 0.3) gapsAt.push({ c, t, d });
    if (!point && d < -0.02) point = { c, t };
  }
  gapsAt.sort((x, y) => y.d - x.d);
  assert.ok(gapsAt.length >= 20 && point, `throws through a gap (${gapsAt.length}), and one at a point`);
  const run = q => {
    const hits = [], w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w2.setScene(bare); w2.setMovers(m); stepTo(w2, q.t);
    const ball = throwAndWatch(w2, q.c.vec, hits);
    return { hits, ball, w2 };
  };
  let through = null, tried = 0;
  for (const q of gapsAt.slice(0, 40)) { tried++; const o = run(q); if (o.hits.includes('through') && !o.hits.includes('mover')) { through = o; break; } }
  assert.ok(through, `a ball went between the points in one of the ${tried} widest gaps`);
  assert.equal(through.hits.filter(h => h === 'through').length, 1, 'told once');
  assert.equal(through.hits.filter(h => h !== 'through')[0], 'block', through.hits.join(', '));
  assert.ok(!through.ball.stopped && through.ball.through);
  const hit = run(point);
  assert.equal(hit.hits[0], 'mover', `at a point: ${hit.hits.join(', ')}`);
  assert.ok(!hit.hits.includes('through') && hit.ball.stopped);
  assert.equal(hit.w2.downCount(), 0, 'a stopped ball knocks nothing');
});

test('star: a ball at the sled or the paper lantern stops and drops; nothing the movers do touches a block', () => {
  const { s, bare } = starScene(4242, 1);
  for (const [look, move] of [['sled', 'slide'], ['paperLantern', 'swing']]) {
    const m = moverFor(bare, { move, look, pace: 'slow', timing: 'steady' }, 7);
    const w = createWorld();
    w.setScene(bare);
    const cands = throwsAtBlocks(w, s.layout.power, m);
    let pick = null;
    for (let t = 0; t < m.plan.len && !pick; t += 0.02) for (const c of cands) {
      const [l] = moverAt(m, t + c.tz), p = [c.at[0] - l.p[0], c.at[1] - l.p[1]];
      // inside one of its boxes by a ball's radius, if it has them (the sled's tree: a throw over its body is not stopped), else in the box
      const hitsIt = m.load.shapes ? m.load.shapes.some(sh => fromBox(p, sh) < -0.08) : Math.abs(p[0]) < m.load.w / 2 - 0.25 && Math.abs(p[1]) < m.load.h / 2 - 0.15;
      if (hitsIt) { pick = { c, t }; break; }
    }
    assert.ok(pick, `${look}: a throw at it`);
    const hits = [], w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w2.setScene(bare); w2.setMovers(m); stepTo(w2, pick.t);
    const ball = throwAndWatch(w2, pick.c.vec, hits);
    assert.equal(hits[0], 'mover', `${look}: ${hits.join(', ')}`);
    assert.ok(ball.stopped && !hits.includes('block'), `${look}: stopped, no block touched`);
    const w3 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w3.setScene(bare);
    throwAndWatch(w3, pick.c.vec, hits);
    assert.ok(hits.includes('block') && !hits.includes('mover'), `${look}: the same throw, nothing in the way: ${hits.join(', ')}`);
  }
});

/* ---------- the scenes ---------- */

// Star Light's Hardest scenes as dealt, two games: the check passes, each thing its own way, open often
// enough, through none of the rock and pine; the telescope in scenes 2 and 4; Normal and Harder as before.
test('star: Star Light\'s Hardest scenes are made as dealt, open often enough, clear of the rock and the pine; the telescope in 2 and 4; Normal and Harder as before', () => {
  let n = 0;
  for (const seed of [12345, 404, 77]) {
    const w = createWorld(), d = hardestDeal(seed, 5);
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 5, i, null, 'hardest'), h = d[i - 1], at = `star ${seed} scene ${i}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.deepEqual(s.layout.hardest, h, `${at}: the deal kept in the layout`);
      if (h.spread) {
        assert.equal(s.layout.stack, h.spread); assert.equal(s.mover, null);
        assert.equal(s.layout.keepout?.thing, 'telescope', `${at}: the telescope`);
        // (the telescope in the way of too many throws sends a layout away: 1.2 tries a spread scene, at most 3, over 60 scenes of 30 games)
        assert.ok(s.tries <= 5, `${at}: ${s.tries} tries`);
        continue;
      }
      assert.equal(s.layout.keepout, undefined, `${at}: no telescope beside a mover`);
      const m = s.mover;
      assert.equal(m.look, h.mover.look); assert.equal(m.move, h.mover.move);
      assert.ok(s.check.mover.open >= MOVER_OPEN && s.check.mover.shutS <= MOVER_SHUT, `${at}: ${JSON.stringify(s.check.mover)}`);
      assert.deepEqual(clashes(m, s.parts), [], at);
      assert.deepEqual(m.plan, moverFor(s.parts, h.mover, s.layout.seed).plan, `${at}: the same plan from the scene's seed`);
      for (const mode of ['normal', 'harder']) {
        const o = createWorld().makeScene(seed, 5, i, null, mode);
        assert.equal(o.mover, null); assert.equal(o.layout.hardest, undefined); assert.equal(o.layout.keepout, undefined);
      }
    }
  }
  assert.equal(n, 3 * SCENES);
});

test('star: the telescope: not to hit in scenes 2 and 4 of Hardest only, with its own notice words, a dark thing that tumbles', () => {
  assert.equal(KEEP[5], 'telescope');
  const t = THINGS.telescope;
  assert.deepEqual([t.w, t.h, t.d, t.reacts], [0.5, 0.8, 0.45, 'tumbles']);
  assert.equal(keepFor('hardest', 5, 2), 'telescope'); assert.equal(keepFor('hardest', 5, 4), 'telescope');
  for (const scene of [1, 3, 5]) assert.equal(keepFor('hardest', 5, scene), null);
  for (const mode of ['normal', 'harder']) for (const scene of [1, 2, 3, 4, 5]) assert.equal(keepFor(mode, 5, scene), null);
  assert.equal(keepLine('telescope'), 'Don\'t hit the telescope!'); assert.equal(KEEP_EMOJI.telescope, '🔭');
  for (const k of [1, 2, 3, 4]) assert.notEqual(KEEP[k], 'telescope');
});

test('star: every structure the level can deal is still a structure (the pool, the challenges and the spread-out ones)', () => {
  const info = LEVELS[4];
  for (const name of [...info.pool, ...info.challenges, ...info.spread]) assert.equal(typeof DATA[name], 'function', name);
});

test('star: the page: each thing\'s sound, a ball through the star logged, the three and the telescope drawn, the Hardest line', async () => {
  const { readFile } = await import('node:fs/promises');
  const read = f => readFile(new URL(`../${f}`, import.meta.url), 'utf8');
  const page = await read('src/ui/topple.js'), scene = await read('src/ui/topple-scene.js'), keep = await read('src/ui/topple-keepout.js'), core = await read('src/core/topple.js');
  assert.match(page, /sled: 'thud', paperLantern: 'rustle', star: 'chime' \};/);
  assert.match(page, /star: 'ball through the star' \};/);
  assert.match(scene, /vulture, sled, paperLantern, star: fallingStar \};/);
  assert.match(scene, /if \(u0\.star\) puff\('gold'/, 'the star breaks up in gold sparkles');
  assert.match(scene, /u0\.tail\.rotation\.z = u0\.ang;/, 'the tail points behind it');
  assert.match(keep, /const BUILD = \{ nest, pane, lantern, pot, telescope \};/);
  assert.match(keep, /u\.thing === 'telescope'/, 'the telescope\'s tube falls off its mount');
  assert.match(core, /moving things in levels 1 to 5/);
});
