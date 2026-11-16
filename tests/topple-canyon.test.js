// Topple! Hardest in Cactus Canyon (journal Q106, the build's session 4;
// developer, 2026-11-15: "Yes, build those picks"): the tumbleweeds rolling
// across (a stream, a ball can pass through the gaps), the mine cart on its
// rails (slide, on the sand), the vulture diving in (drop), each once in
// scenes 1, 3, 5; scenes 2 and 4 spread out, with the clay pot not to hit.
// Where each is at each moment, clear of the scrub and the cactus, and in
// the physics. Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  MOVES, WAYS, CANYON, FROSTY, PARK, LOADS, TUMBLE_R, TUMBLE_D, HAT, HEIGHTS, THROW_TOP, DROP_FROM, AT, AT_TRY, ENDS_PAST, MOVER_LEVELS, MOVING_SCENES,
  moverFor, moverAt, inWay, openShare, gaps, hardestDeal, clashes,
} from '../src/core/topple-movers.js';
import { createWorld, MOVER_OPEN, MOVER_SHUT, moverFits } from '../src/core/topple-world.js';
import { STEP, HAND, SCENES, LEVELS, launchVel } from '../src/core/topple.js';
import { STRUCTURES as DATA } from '../src/core/topple-levels.js';

// A Cactus Canyon scene's parts, and the same with no things in it (the scrub and cactus left out).
function canyonScene(seed = 4242, i = 1) {
  const w = createWorld();
  const s = w.makeScene(seed, 4, i);
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

// (levels 1-3's Hardest deals, games 1-200 each, one JSON line a deal: by 10.18's code, run 2026-11-15, before this level was built)
const DEALS_1018 = '4e54074c5dc0f685bc2b27472c7826710cd60120';
test('canyon: Hardest\'s deal: the tumbleweeds stream, the cart slides, the vulture dives, each once in scenes 1, 3, 5; 2 and 4 spread out; levels 1-3 dealt as before', () => {
  assert.deepEqual(CANYON, { slide: 'cart', stream: 'tumbleweed', drop: 'vulture' });
  assert.deepEqual(MOVER_LEVELS, [1, 2, 3, 4, 5]);
  const spread = LEVELS[3].spread, seen = new Map(), orders = new Set();
  const tally = k => seen.set(k, (seen.get(k) || 0) + 1);
  assert.deepEqual(spread, ['canyonSpreadPosts', 'canyonSpreadTrestles', 'canyonSpreadMix']);
  for (let seed = 1; seed <= 200; seed++) {
    const d = hardestDeal(seed, 4);
    assert.deepEqual(d, hardestDeal(seed, 4), 'the same game, the same deal');
    const movers = d.filter((h, i) => MOVING_SCENES.includes(i + 1)).map(h => h.mover), spreads = d.filter((h, i) => !MOVING_SCENES.includes(i + 1)).map(h => h.spread);
    assert.ok(movers.every(Boolean) && spreads.every(Boolean), `${seed}: ${JSON.stringify(d)}`);
    assert.deepEqual(movers.map(c => c.look).sort(), ['cart', 'tumbleweed', 'vulture'], `${seed}: each thing once`);
    for (const c of movers) assert.equal(CANYON[c.move], c.look, `${seed}: the ${c.look} ${c.move}s`);
    assert.deepEqual(movers.map(c => c.timing), ['varied', 'varied', 'tricky']);
    assert.ok(spreads[0] !== spreads[1] && spreads.every(n => spread.includes(n)), `${seed}: ${spreads}`);
    orders.add(movers.map(c => c.look).join(' '));
    movers.forEach((c, k) => tally(`${c.look} ${k}`)); spreads.forEach(tally);
  }
  assert.equal(orders.size, 6, `orders: ${[...orders]}`);
  for (const look of Object.values(CANYON)) for (const k of [0, 1, 2]) assert.ok(seen.get(`${look} ${k}`) >= 40, `the ${look} in moving scene ${k + 1} only ${seen.get(`${look} ${k}`) ?? 0} times`);
  for (const n of spread) assert.ok(seen.get(n) >= 80, `${n} dealt only ${seen.get(n) ?? 0} times`);
  const lines = [];
  for (let seed = 1; seed <= 200; seed++) for (const lv of [1, 2, 3]) lines.push(JSON.stringify(hardestDeal(seed, lv)));
  assert.equal(createHash('sha1').update(lines.join('\n')).digest('hex'), DEALS_1018, 'levels 1-3 dealt otherwise than 10.18');
  assert.deepEqual(PARK, { swing: 'tyre', slide: 'zip', drop: 'kite' });
  assert.deepEqual(FROSTY, { slide: 'snowman', stream: 'snowball', fall: 'flake' });
  assert.deepEqual(WAYS, [...MOVES, 'fall']);
  assert.equal(hardestDeal(5, 6), null, 'no level 6');
});

test('canyon: the spread-out structures: small pieces well apart, each on the sand, a small barrel on each post, trestle or beam', () => {
  const k = () => 1;
  for (const name of LEVELS[3].spread) {
    assert.ok(DATA[name], `${name} is a structure`);
    const bs = DATA[name](k);
    assert.ok(bs.length >= 6 && bs.length <= 16, `${name}: ${bs.length} pieces`);
    assert.ok(bs.some(b => b.shape === 'cyl') && bs.every(b => b.mat === 'wood' || b.mat === 'barrel'), `${name}: wood and barrels`);
    assert.ok(Math.min(...bs.map(b => b.y - b.h / 2)) < 0.01 && Math.min(...bs.map(b => b.y - b.h / 2)) >= 0, `${name}: standing on the sand`);
    // the pieces on the ground (the ones nothing is stacked under): at least two groups, 0.9 m apart or more somewhere
    const feet = bs.filter(b => b.y - b.h / 2 < 0.01), xs = feet.map(b => b.x);
    assert.ok(Math.max(...xs) - Math.min(...xs) >= 1.4, `${name}: spread ${(Math.max(...xs) - Math.min(...xs)).toFixed(2)} m`);
    // the layouts the game makes vary a little round these
    assert.notDeepEqual(DATA[name](key => (key.startsWith('h') || key.startsWith('p') ? 1.05 : 1)).map(b => b.h), bs.map(b => b.h), `${name}: its heights vary with the game`);
  }
});

/* ---------- the shapes ---------- */

test('canyon: the tumbleweed (a cowboy hat since Q114): a brim and a crown within the circle it turns in, room round them for a ball; the cart a box on the sand; the vulture\'s body and two wings in its box', () => {
  const tw = LOADS.tumbleweed, R = TUMBLE_R, r = 0.07;
  assert.equal(tw.w, 2 * R); assert.equal(tw.d, TUMBLE_D); assert.equal(tw.n, 3); assert.equal(tw.ground, true); assert.equal(tw.clear, true); assert.equal(tw.roll, true); assert.equal(tw.gaps, true);
  assert.equal(tw.shapes.length, 2, 'a brim and a crown');
  assert.deepEqual(tw.shapes.map(sh => sh.at), [HAT.brim.at, HAT.crown.at]);
  assert.ok(Math.abs(tw.shapes[0].half[0] * 2 - 1.24) < 1e-9 && Math.abs(tw.shapes[0].half[2] * 2 - TUMBLE_D) < 1e-9, 'the brim is 1.24 m long and as deep as the load');
  assert.ok(tw.shapes[1].at[1] > tw.shapes[0].at[1] + tw.shapes[0].half[1], 'the crown sits above the brim');
  let n = 0;
  for (const sh of tw.shapes) for (const [x, y] of corners(sh)) { n++; assert.ok(Math.hypot(x, y) <= R + 0.03, `a corner ${Math.hypot(x, y).toFixed(3)} m out`); }
  assert.equal(n, 4 * tw.shapes.length);
  // most of the circle is clear for a ball, a fair part of it covered (the brim and crown), the gap above the crown and below the brim real
  let inside = 0, clear = 0, covered = 0;
  for (let x = -R; x <= R; x += 0.01) for (let y = -R; y <= R; y += 0.01) {
    if (Math.hypot(x, y) > R - r) continue;
    inside++;
    const d = Math.min(...tw.shapes.map(sh => fromBox([x, y], sh)));
    if (d > r) clear++;
    if (d <= 0) covered++;
  }
  assert.ok(clear / inside > 0.3 && clear / inside < 0.8, `a ball passes clear at ${(100 * clear / inside).toFixed(0)}% of it`);
  assert.ok(covered / inside > 0.1, `the hat ${(100 * covered / inside).toFixed(0)}% of it`);
  for (const p of [[0, 0.5], [0, -0.45], [-0.45, 0.2], [0.45, 0.2]]) assert.ok(Math.min(...tw.shapes.map(sh => fromBox(p, sh))) > r, `a gap at ${p}`);
  // the cart: one box, on the sand; the vulture: a body and a wing each side, none past its span
  assert.equal(LOADS.cart.shapes, undefined); assert.equal(LOADS.cart.ground, true); assert.equal(LOADS.cart.clear, true);
  const v = LOADS.vulture;
  assert.equal(v.shapes.length, 3); assert.equal(v.ground, undefined); assert.equal(v.clear, undefined, 'it dives over the things');
  for (const sh of v.shapes) for (const [x, y] of corners(sh)) assert.ok(Math.abs(x) <= v.w / 2 + 1e-9 && Math.abs(y) <= v.h / 2 + 1e-9, `within its box: ${x.toFixed(2)}, ${y.toFixed(2)}`);
  assert.ok(Math.abs(v.shapes[1].at[0] + v.shapes[2].at[0]) < 1e-9, 'a wing each side');
});

/* ---------- where each is ---------- */

test('canyon: the tumbleweeds roll along the sand, turning as far as they go, hopping a little, three evenly spaced, round again', () => {
  const { bare } = canyonScene();
  const m = moverFor(bare, { move: 'stream', look: 'tumbleweed', pace: 'fast', timing: 'steady' }, 7), R = m.load.w / 2;
  assert.equal(m.n, 3); assert.equal(m.y, R, 'on the sand, whatever the height');
  assert.equal(moverFor(bare, { move: 'stream', look: 'tumbleweed', height: 'high' }, 7).y, R);
  const at = t => moverAt(m, t);
  const xs = at(1).map(l => l.p[0]).sort((a, b) => a - b), gap = xs.slice(1).map((x, i) => x - xs[i]);
  assert.equal(xs.length, 3);
  for (const g of gap) assert.ok(Math.abs(g - gap[0]) < 1e-9, `even gaps: ${gap}`);
  let hopMax = 0, hopMin = Infinity;
  for (let t = 0; t < 4; t += 0.01) for (const l of at(t)) {
    assert.ok(l.p[1] >= R - 1e-9 && l.p[1] <= R + m.load.hop + 1e-9, `height ${l.p[1]}`);
    hopMax = Math.max(hopMax, l.p[1] - R); hopMin = Math.min(hopMin, l.p[1] - R);
    // rolling: the turn is the distance along the sand over the radius
    assert.ok(Math.abs(l.tilt + (l.p[0] - m.x0) / R) < 1e-9, 'turns as far as it goes');
    assert.equal(l.p[2], m.z); assert.equal(l.gone, undefined);
  }
  assert.ok(hopMax > 0.08 && hopMin < 0.02, `hops ${hopMin.toFixed(3)}-${hopMax.toFixed(3)} m`);
  // one way, left to right, and round again once past the end
  const a = at(0.5)[0].p[0], b = at(0.55)[0].p[0];
  assert.ok(b > a, 'going right');
  const v = 2 * m.span / m.cross;
  assert.ok(Math.abs((b - a) / 0.05 - v) < 0.05 * v, `at the pace: ${((b - a) / 0.05).toFixed(2)} of ${v.toFixed(2)} m/s`);
  const far = m.span + 2.5;
  for (let t = 0; t < 12; t += 0.05) for (const l of at(t)) assert.ok(l.p[0] >= m.x0 - far - 1e-6 && l.p[0] <= m.x0 + far + 1e-6);
  // the way is open often enough, never shut long (the scene check's bar), steady and varied
  for (const timing of ['steady', 'varied', 'tricky']) {
    const mv = moverFor(bare, { move: 'stream', look: 'tumbleweed', timing }, 7);
    assert.ok(openShare(mv) >= MOVER_OPEN && gaps(mv).shutS <= MOVER_SHUT, `${timing}: open ${openShare(mv)}, shut ${gaps(mv).shutS}`);
  }
});

test('canyon: the cart slides along its rails on the sand, across and back, short of a thing at either end; the vulture dives from out of sight, hovers at the throws\' height, climbs away', () => {
  const { s, bare } = canyonScene();
  const m = moverFor(bare, { move: 'slide', look: 'cart', timing: 'steady' }, 7);
  assert.equal(m.y, m.load.h / 2); assert.equal(moverFor(bare, { move: 'slide', look: 'cart', height: 'high' }, 7).y, m.load.h / 2);
  assert.equal(m.spanL, m.span); assert.equal(m.spanR, m.span);
  const xs = [], ys = new Set();
  for (let t = 0; t < m.plan.len; t += 0.02) { const [l] = moverAt(m, t); xs.push(l.p[0]); ys.add(l.p[1]); }
  assert.deepEqual([...ys], [m.load.h / 2]);
  assert.ok(Math.abs(Math.min(...xs) - (m.x0 - m.span)) < 1e-6 && Math.abs(Math.max(...xs) - (m.x0 + m.span)) < 1e-6);
  // a scrub off to the right at every depth: its right end short of it, past the line; the left as far as ever
  const bush = { ...bare, bodies: [{ kind: 'bush', thing: 'scrub', shapes: AT_TRY.map(sh => ({ type: 'sphere', r: 0.3, at: [m.x0 + m.span + m.load.w / 2 - 0.2, 0.3, HAND.z + (s.parts.stand.z - HAND.z) * sh] })) }] };
  const short = moverFor(bush, { move: 'slide', look: 'cart', timing: 'varied' }, 7);
  assert.ok(short.spanR < short.span - 0.2 && short.spanR >= short.load.w / 2 + 0.07 + ENDS_PAST, `right end ${short.spanR} of ${short.span}`);
  assert.equal(short.spanL, short.span);
  assert.deepEqual(clashes(short, bush), []);
  // the vulture: out of sight above, down to the throws' height, up again
  const v = moverFor(bare, { move: 'drop', look: 'vulture', timing: 'steady' }, 7);
  assert.equal(v.n, 1); assert.equal(v.y, HEIGHTS.middle);
  let top = 0, low = Infinity, low1 = Infinity;
  for (let t = 0; t < v.plan.len; t += 0.01) { const y = moverAt(v, t)[0].p[1]; top = Math.max(top, y); low = Math.min(low, y); if (t < 4) low1 = Math.min(low1, y); }
  assert.ok(top >= DROP_FROM - 1e-6, `up out of sight (${top.toFixed(1)} m)`);
  assert.ok(low >= HEIGHTS.middle - 0.3 && low < HEIGHTS.middle, `down to ${low.toFixed(2)} m`);
  assert.ok(!inWay(v, moverAt(v, 0)[0]) || moverAt(v, 0)[0].p[1] - v.load.h / 2 < THROW_TOP, 'out of the way at the top');
  assert.ok(openShare(v) >= MOVER_OPEN && gaps(v).shutS <= MOVER_SHUT, `open ${openShare(v)}, shut ${gaps(v).shutS}`);
});

test('canyon: the tumbleweeds and the cart cross at a depth clear of the scrub and cactus (further first); through them everywhere, the check throws the layout away; the vulture dives over them', () => {
  const { s, bare } = canyonScene();
  const lineAt = share => HAND.z + (s.parts.stand.z - HAND.z) * share;
  const wall = { ...bare, bodies: [{ kind: 'bush', thing: 'scrub', shapes: AT_TRY.map(sh => ({ type: 'sphere', r: 0.5, at: [bare.stand.x * sh, 0.4, lineAt(sh)] })) }] };
  for (const look of ['tumbleweed', 'cart']) {
    const move = look === 'cart' ? 'slide' : 'stream';
    const free = moverFor(bare, { move, look, timing: 'varied' }, 7);
    assert.equal(free.at, AT); assert.deepEqual(clashes(free, bare), []);
    const one = { ...bare, bodies: [{ kind: 'bush', thing: 'scrub', shapes: [{ type: 'sphere', r: 0.6, at: [free.x0, 0.4, free.z] }] }] };
    const moved = moverFor(one, { move, look, timing: 'varied' }, 7);
    assert.ok(AT_TRY.includes(moved.at) && moved.at !== AT, `${look}: crosses at ${moved.at}`);
    assert.deepEqual(clashes(moved, one), [], look);
    assert.deepEqual(clashes(free, one), ['scrub'], `${look}: at the usual depth it goes through the scrub`);
    const stuck = moverFor(wall, { move, look }, 7);
    assert.equal(stuck.at, AT);
    assert.deepEqual(moverFits(stuck, wall).through, ['scrub'], look);
    assert.ok(moverFits(stuck, wall).why.some(w => /the mover through the scrub/.test(w)), look);
  }
  assert.deepEqual(clashes(moverFor(wall, { move: 'drop', look: 'vulture' }, 7), wall), [], 'the vulture goes over');
});

/* ---------- in the physics ---------- */

test('canyon: a ball at a tumbleweed\'s ring or spoke stops and drops; one between the spokes goes on to the structure, told once; none touches a block', () => {
  const { s, bare } = canyonScene(4242, 1);
  const m = moverFor(bare, { move: 'stream', look: 'tumbleweed', pace: 'slow', timing: 'steady' }, 7), R = m.load.w / 2, r = 0.07;
  const w = createWorld();
  w.setScene(bare);
  const cands = throwsAtBlocks(w, s.layout.power, m).filter((_, k) => k % 3 === 0);
  // a throw and a moment: where it passes a tumbleweed's plane, in its own frame (turned back by its roll), at the nearest of the three
  const rel = (c, t) => {
    let best = null;
    for (const l of moverAt(m, t + c.tz)) {
      const dx = c.at[0] - l.p[0], dy = c.at[1] - l.p[1], k = Math.cos(-l.tilt), n = Math.sin(-l.tilt), p = [dx * k - dy * n, dx * n + dy * k];
      if (!best || Math.hypot(...p) < Math.hypot(...best)) best = p;
    }
    return best;
  };
  // the throws that look best through a gap (clear of the spokes by the most), and one at a spoke; the physics decides:
  // the ring turns and rolls as the ball crosses it, so the widest gaps are tried first, until a ball does go through
  const gapsAt = [];
  let spoke = null;
  for (let t = 0; t < m.plan.len; t += 0.02) for (const c of cands) {
    const p = rel(c, t);
    if (!p || Math.hypot(...p) > R - 0.15) continue;
    const d = Math.min(...m.load.shapes.map(sh => fromBox(p, sh)));
    if (d > r + 0.03 && Math.hypot(...p) > 0.3) gapsAt.push({ c, t, d });
    if (!spoke && d < -0.02) spoke = { c, t };
  }
  gapsAt.sort((x, y) => y.d - x.d);
  assert.ok(gapsAt.length >= 20 && spoke, `throws through a gap (${gapsAt.length}), and one at a spoke`);
  const run = q => {
    const hits = [], w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w2.setScene(bare); w2.setMovers(m); stepTo(w2, q.t);
    const ball = throwAndWatch(w2, q.c.vec, hits);
    return { hits, ball, w2 };
  };
  let through = null, tried = 0;
  for (const q of gapsAt.slice(0, 60)) { tried++; const o = run(q); if (o.hits.includes('through') && !o.hits.includes('mover')) { through = o; break; } }
  assert.ok(through, `a ball went through a gap in one of the ${tried} widest`);
  assert.equal(through.hits.filter(h => h === 'through').length, 1, 'told once');
  assert.equal(through.hits.filter(h => h !== 'through')[0], 'block', through.hits.join(', '));
  assert.ok(!through.ball.stopped && through.ball.through);
  const hit = run(spoke);
  assert.equal(hit.hits[0], 'mover', `at a spoke: ${hit.hits.join(', ')}`);
  assert.ok(!hit.hits.includes('through') && hit.ball.stopped);
  assert.equal(hit.w2.downCount(), 0, 'a stopped ball knocks nothing');
});

test('canyon: a ball at the cart or the vulture stops and drops; nothing the movers do touches a block', () => {
  const { s, bare } = canyonScene(4242, 1);
  for (const [look, move] of [['cart', 'slide'], ['vulture', 'drop']]) {
    const m = moverFor(bare, { move, look, pace: 'slow', timing: 'steady' }, 7);
    const w = createWorld();
    w.setScene(bare);
    const cands = throwsAtBlocks(w, s.layout.power, m);
    // a moment the thing is where a throw passes its depth (within its box)
    let pick = null;
    for (let t = 0; t < m.plan.len && !pick; t += 0.02) for (const c of cands) {
      const [l] = moverAt(m, t + c.tz);
      if (Math.abs(c.at[0] - l.p[0]) < m.load.w / 2 - 0.25 && Math.abs(c.at[1] - l.p[1]) < m.load.h / 2 - 0.15) { pick = { c, t }; break; }
    }
    assert.ok(pick, `${look}: a throw at it`);
    const hits = [], w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w2.setScene(bare); w2.setMovers(m); stepTo(w2, pick.t);
    const ball = throwAndWatch(w2, pick.c.vec, hits);
    assert.equal(hits[0], 'mover', `${look}: ${hits.join(', ')}`);
    assert.ok(ball.stopped && !hits.includes('block'), `${look}: stopped, no block touched`);
    // the same throw with the way clear reaches the structure
    const w3 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push(h.b); } });
    w3.setScene(bare);
    throwAndWatch(w3, pick.c.vec, hits);
    assert.ok(hits.includes('block') && !hits.includes('mover'), `${look}: the same throw, nothing in the way: ${hits.join(', ')}`);
  }
});

/* ---------- the scenes ---------- */

// Cactus Canyon's Hardest scenes as dealt, two games: the check passes, each thing its own way, open often
// enough, through none of the scrub and cactus; the pot in scenes 2 and 4; Normal and Harder as before.
test('canyon: Cactus Canyon\'s Hardest scenes are made as dealt, open often enough, clear of the scrub and the cactus; nothing in the way in 2 and 4; Normal and Harder as before', () => {
  let n = 0;
  for (const seed of [12345, 404]) {
    const w = createWorld(), d = hardestDeal(seed, 4);
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 4, i, null, 'hardest'), h = d[i - 1], at = `canyon ${seed} scene ${i}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.deepEqual(s.layout.hardest, h, `${at}: the deal kept in the layout`);
      if (h.spread) {
        assert.equal(s.layout.stack, h.spread); assert.equal(s.mover, null);
        assert.equal(s.layout.keepout, undefined, `${at}: nothing in the way (the things in the way were dropped, Q112)`);
        assert.ok(s.tries <= 2, `${at}: ${s.tries} tries`);
        continue;
      }
      assert.equal(s.layout.keepout, undefined, `${at}: no pot beside a mover`);
      const m = s.mover;
      assert.equal(m.look, h.mover.look); assert.equal(m.move, h.mover.move);
      assert.ok(s.check.mover.open >= MOVER_OPEN && s.check.mover.shutS <= MOVER_SHUT, `${at}: ${JSON.stringify(s.check.mover)}`);
      assert.deepEqual(clashes(m, s.parts), [], at);
      assert.equal(s.check.mover.through, undefined);
      assert.deepEqual(m.plan, moverFor(s.parts, h.mover, s.layout.seed).plan, `${at}: the same plan from the scene's seed`);
      for (const mode of ['normal', 'harder']) {
        const o = createWorld().makeScene(seed, 4, i, null, mode);
        assert.equal(o.mover, null); assert.equal(o.layout.hardest, undefined); assert.equal(o.layout.keepout, undefined);
      }
    }
  }
  assert.equal(n, 2 * SCENES);
});

test('canyon: every structure the level can deal is still a structure (the pool, the challenges and the spread-out ones)', () => {
  const info = LEVELS[3];
  for (const name of [...info.pool, ...info.challenges, ...info.spread]) assert.equal(typeof DATA[name], 'function', name);
});

test('canyon: the page: each thing\'s sound, a ball through the tumbleweed logged, the three drawn (the rails for the cart), the pot\'s notice words', async () => {
  const { readFile } = await import('node:fs/promises');
  const read = f => readFile(new URL(`../${f}`, import.meta.url), 'utf8');
  const page = await read('src/ui/topple.js'), scene = await read('src/ui/topple-scene.js'), core = await read('src/core/topple.js');
  // Q114: not a ball: the tumbleweed is drawn as a cowboy hat (a brim and a crown from the physics' HAT), the machine's snowball as a snowman's head with a face and a top hat
  const weed = scene.match(/function tumbleweed\(g, m, i = 0\) \{[\s\S]*?\n  \}/)?.[0] ?? '', head = scene.match(/function snowball\(g, m\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
  assert.match(weed, /HAT_FELTS\[i % HAT_FELTS\.length\], \{ brim, crown \} = HAT;/); assert.match(weed, /hatBand/); assert.doesNotMatch(weed, /TorusGeometry/, 'no ring of twigs');
  // the brim curls up at both sides in one smooth curve (not two tilted bits stuck on its top: developer, 2026-11-16, "looks funny"), and the curled ends stay inside the circle the hat turns in
  assert.match(weed, /BRIM_CURL \* bp\.getX\(k\) \*\* 2/); assert.doesNotMatch(weed, /\blip\b/, 'no bits stuck on the brim');
  const curl = +scene.match(/const BRIM_CURL = ([\d.]+);/)?.[1];
  assert.ok(curl > 0 && curl <= 0.15, `the curl is a gentle one, got ${curl}`);
  assert.ok(Math.hypot(HAT.brim.half[0], HAT.brim.at[1] + HAT.brim.half[1] + curl) <= TUMBLE_R + 1e-9, 'the curled end is inside the hat\'s circle');
  assert.match(head, /carrotMat/); assert.match(head, /coalMat/); assert.match(head, /hat\.rotation\.z = -0\.2/);
  assert.match(page, /tumbleweed: 'rustle', cart: 'clonk', vulture: 'thud'/);
  assert.match(page, /tumbleweed: 'ball through the tumbleweed'/);
  assert.match(scene, /const OWN = \{ tyre, zip: zipSeat, kite, snowman, snowball, flake: snowflake, tumbleweed, cart, vulture/);
  assert.match(scene, /if \(m\.look === 'cart'\) \{\s*\/\/ the rails across its way/);
  assert.match(scene, /u0\.wings\.forEach\(\(wg, k\) => \{ wg\.rotation\.z = \(k \? 1 : -1\) \* ang; \}\);/, 'the vulture flaps, folds up in the dive');
  assert.match(scene, /for \(const wh of u0\.wheels\) wh\.rotation\.z -= vx \* dt \/ \(0\.19 \* u0\.k\);/, 'the cart\'s wheels turn as it goes');
  assert.match(core, /moving things in levels 1 to 5/);
});
