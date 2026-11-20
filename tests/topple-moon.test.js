// Topple!'s moon base (DESIGN.md "Topple!", The moon; journal Q119): levels
// 6-10, the lander, the drop, the physics, and every scene played by the
// test player (tests/topple-moon-player.js). Hermetic: no files, no clock.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOON_LEVELS, MOON_STRUCTURES, MOON_MODES, moonScene, moonDeal, isMoon, newLander, flyStep, ringX, turnNow, flyTo, steerTo, fallTime,
  dropPath, reachOf, outOfReach, showsRing, Z_NEAR, Z_FAR, TURN_PAST, MIN_RUN, LANDER_Y, DROP_BELOW, MOON_BALL,
  MOON_MATS, LEVEL_TARGETS, ROLL_M, BURST_R, POP_S,
} from '../src/core/topple-moon.js';
import { createMoonWorld } from '../src/core/topple-moon-world.js';
import {
  LEVELS, MAX_LEVEL, PARK_LEVELS, SCENES, isMoonLevel, createGame, sceneOver, switchLevel, isOpen,
  newRound, useBall, update, glowWait, glowsBy, READY_AFTER, GLOW_WAIT, GLOW_STILL_MAX,
} from '../src/core/topple.js';
import { playMoonScene } from './topple-moon-player.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// (line ends as LF, whatever the checkout made them: some patterns span lines)
const read = async f => (await readFile(path.join(root, f), 'utf8')).replace(/\r\n/g, '\n');

test('moon: levels 6-10 are the moon base, after the park\'s 1-5; each deals 4 of 6 scenes in order and 1 of 2 challenges', () => {
  assert.equal(PARK_LEVELS, 5);
  assert.equal(MAX_LEVEL, 10);
  assert.deepEqual(MOON_LEVELS.map(l => l.n), [6, 7, 8, 9, 10]);
  for (let n = 1; n <= MAX_LEVEL; n++) assert.equal(isMoonLevel(n), n > 5, `level ${n}`);
  assert.ok(!isMoon(5) && isMoon(6) && isMoon(10) && !isMoon(11));
  for (const l of MOON_LEVELS) {
    assert.equal(LEVELS[l.n - 1].world, 'moon');
    assert.equal(l.pool.length, 6, `${l.n}: six scenes 1-4 are dealt from`);
    assert.equal(l.challenges.length, 2);
    for (const plan of [...l.pool, ...l.challenges]) for (const s of plan) assert.ok(MOON_STRUCTURES[s.name], `${l.n}: ${s.name} made`);
    const deals = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const d = moonDeal(seed, l.n);
      assert.equal(d.scenes.length, 4);
      assert.equal(d.scenes[0], 0, 'the first of the six always: the way in');
      assert.deepEqual([...d.scenes].sort((a, b) => a - b), d.scenes, 'in order, easiest first');
      deals.add(JSON.stringify(d));
    }
    assert.ok(deals.size > 10, `${l.n}: deals differ (${deals.size})`);
  }
  assert.throws(() => moonDeal(1, 5), /not a moon level/);
  assert.throws(() => moonScene(1, 6, 6), /bad scene/);
});

test('moon: a scene is the same for its seed; every block stands upright on the ground or on another, inside the lander\'s reach', () => {
  assert.deepEqual(moonScene(99, 7, 3), moonScene(99, 7, 3));
  assert.notDeepEqual(moonScene(99, 7, 5).blocks, moonScene(100, 7, 5).blocks);
  let checked = 0;
  for (let n = 6; n <= 10; n++) for (let i = 1; i <= SCENES; i++) for (const seed of [1, 2, 3]) {
    const s = moonScene(seed, n, i), reach = reachOf(s.span);
    assert.ok(s.span[1] - s.span[0] >= MIN_RUN - 0.02, `${n}.${i}: a run of at least ${MIN_RUN} m (to the cm)`);
    for (const b of s.blocks) {
      checked++;
      assert.ok(!outOfReach(reach, b.x, b.z), `${n}.${i}: block at ${b.x},${b.z} in reach`);
      assert.ok(b.z - b.d / 2 > Z_FAR - 0.5 && b.z + b.d / 2 < Z_NEAR + 0.5, `${n}.${i}: near enough to fly over`);
      const bottom = b.y - b.h / 2;
      const ledge = s.ledges.find(l => Math.abs(b.x - l.x) < l.w / 2 && Math.abs(b.z - l.z) < l.d / 2);
      // (a boulder is round: it rolls rather than tips, Q125)
      if (bottom < (ledge ? ledge.h : 0) + 0.01 && !MOON_MATS[b.mat].roll) assert.ok(b.h > b.w || b.h > b.d, `${n}.${i}: a ${b.mat} on the ground is upright (can tip)`);
    }
    // the 5th scene is the biggest of its level's (the challenge)
  }
  assert.ok(checked > 600, `blocks checked: ${checked}`);
  for (let n = 6; n <= 10; n++) {
    const sizes = [1, 2, 3, 4, 5].map(i => moonScene(7, n, i).blocks.length);
    assert.ok(sizes[4] >= Math.max(...sizes.slice(0, 4)), `${n}: scene 5 the biggest (${sizes})`);
  }
});

test('moon: the lander flies to and fro, turning once the ring is past the structures; ⇄ turns it at once; steering is clamped', () => {
  const span = [-2, 2], f = newLander(span, 1);
  assert.ok(ringX(f) < span[0], 'it comes in from the left, the ring short of the structures');
  let turns = 0, maxRing = -99, minRing = 99, t = 0;
  for (; t < 40; t += 1 / 60) { if (flyStep(f, 1 / 60, span)) turns++; if (t > 5) { maxRing = Math.max(maxRing, ringX(f)); minRing = Math.min(minRing, ringX(f)); } }
  assert.ok(turns >= 4, `turns: ${turns}`);
  assert.ok(maxRing <= span[1] + TURN_PAST + 0.05 && maxRing >= span[1] + TURN_PAST - 0.05, `the ring turns just past the right end: ${maxRing}`);
  assert.ok(minRing >= span[0] - TURN_PAST - 0.05 && minRing <= span[0] - TURN_PAST + 0.05, `... and the left: ${minRing}`);
  // Q126 (developer, 2026-11-18: "the speed of the target light should not change"): the ring
  // moves at the lander's speed the whole time, through ⇄ and through the turns at the ends;
  // the lander swings round behind it, never faster than its speed, and stays over the run
  for (const speed of [1, 1.35, 1.7]) {
    const g = newLander([-2.5, 2.5], speed);
    let r0 = ringX(g), ringV = [99, 0], vMax = 0, xs = [99, -99], ends = 0;
    for (let k = 0; k < 60 * 40; k++) {
      if (k === 60 * 13 || k === 60 * 13 + 30) turnNow(g);   // ⇄, and again half a second on
      if (flyStep(g, 1 / 60, [-2.5, 2.5])) ends++;
      const r = ringX(g), v = Math.abs(r - r0) * 60;
      ringV = [Math.min(ringV[0], v), Math.max(ringV[1], v)]; vMax = Math.max(vMax, Math.abs(g.vx));
      if (k > 60 * 10) xs = [Math.min(xs[0], g.x), Math.max(xs[1], g.x)];
      r0 = r;
    }
    assert.ok(ringV[0] > speed - 0.001 && ringV[1] < speed + 0.001, `${speed}: the ring at one speed: ${ringV}`);
    assert.ok(vMax <= speed + 1e-9, `${speed}: the lander no faster than its speed: ${vMax}`);
    assert.ok(xs[0] > -2.5 && xs[1] < 2.5, `${speed}: the lander over the run: ${xs}`);
    assert.ok(ends >= 4, `${speed}: turns at the ends: ${ends}`);
  }
  // ⇄: the ring heads the other way at once
  const g = newLander(span, 1); g.x = 0;
  for (let i = 0; i < 60; i++) flyStep(g, 1 / 60, [-50, 50]);
  const before = ringX(g);
  turnNow(g);
  flyStep(g, 1 / 60, [-50, 50]);
  assert.ok(Math.abs(ringX(g) - (before - 1 / 60)) < 1e-9, 'the ring back a step at once');
  assert.equal(g.ringV, -1);
  assert.equal(flyTo(g, -1), false, 'already heading left');
  assert.equal(flyTo(g, 1), true);
  assert.equal(steerTo(g, -20), Z_FAR); assert.equal(steerTo(g, 0), Z_NEAR); assert.equal(steerTo(g, -4.2), -4.2);
  for (let i = 0; i < 120; i++) flyStep(g, 1 / 60, [-50, 50]);
  assert.ok(Math.abs(g.z - -4.2) < 0.05, `it glides to where it's steered: ${g.z}`);
});

test('moon: the drop\'s path: straight down from under the lander with its speed; it meets the first block in its way', () => {
  const T = fallTime();
  assert.ok(Math.abs(T - 2.09) < 0.02, `fall ${T}`);
  const p = [0, LANDER_Y - DROP_BELOW, -5];
  const g = dropPath(p, 1, []);
  assert.equal(g.hit, null);
  assert.ok(Math.abs(g.x - T) < 0.03, `lands its speed × the fall ahead: ${g.x}`);
  const box = [1.8, 0, -5.2, 2.2, 1, -4.8];
  assert.equal(dropPath(p, 1, [null, box]).hit, 1, 'the block in the way');
  assert.equal(dropPath(p, 1, [null, box.map((v, i) => (i % 3 === 2 ? v - 2 : v))]).hit, null, 'a block off the line: not');
  assert.equal(dropPath(p, 1, [], [{ x: 2, z: -5, w: 1.5, h: 0.5, d: 1.1 }]).hit, -1, 'a ledge');
  assert.ok(showsRing('normal', 3) && showsRing('harder', 3) && showsRing('hardest', 0) && !showsRing('hardest', 1), 'Hardest: the ring for the first ball only');
  assert.ok(MOON_MODES.normal.speed < MOON_MODES.harder.speed && MOON_MODES.harder.speed < MOON_MODES.hardest.speed, 'faster as it gets harder');
  assert.ok(MOON_MODES.normal.light && !MOON_MODES.harder.light && !MOON_MODES.hardest.light, 'the lit block on Normal only');
});

test('moon physics: every scene stands still and asleep for 5 s; a ball dropped on a block knocks it; one knocked out of reach counts down', () => {
  const W = createMoonWorld();
  for (let n = 6; n <= 10; n++) for (let i = 1; i <= SCENES; i++) {
    const s = moonScene(3, n, i);
    W.setScene(s);
    let down = 0;
    for (let k = 0; k < 300; k++) ({ down } = W.step(1 / 60));
    assert.equal(down, 0, `${n}.${i}: nothing down by itself`);
    assert.ok(W.still(), `${n}.${i}: still`);
  }
  // a tower: a ball on its top crate
  const s = moonScene(1, 6, 1), W2 = createMoonWorld();
  W2.setScene(s);
  const top = s.blocks.reduce((a, b) => (b.y > a.y ? b : a));
  // let go a fall's worth before it (moving at 1 m/s it lands that far ahead), a little past its middle
  W2.dropBall([top.x + 0.12 - dropPath([0, LANDER_Y - DROP_BELOW, top.z], 1, []).x, LANDER_Y - DROP_BELOW, top.z], [1, 0, 0]);
  let down = 0; for (let k = 0; k < 480; k++) ({ down } = W2.step(1 / 60));
  assert.ok(down >= 1, `knocked: ${down}`);
  // out of reach: a block moved past where the ring turns, at rest, counts down
  const W3 = createMoonWorld(); W3.setScene(s);
  const r = W3.blocks[0], far = reachOf(s.span).x[1] + 0.5;
  r.body.position.set(far, r.y0, r.z0);
  const { fell } = W3.step(1 / 60);
  assert.ok(fell.includes(r) && r.away === 'away', 'out of reach: down');
  assert.equal(MOON_BALL.r, 0.2);
});

// Q125: each moon level's own target. A small scene of one structure at the middle
// distance, a ball let go just over a block at a speed, the world run for `secs`.
const targetScene = (name, seed = 1) => ({ level: 0, scene: 0, seed, ledges: [], span: [-2.5, 2.5], blocks: MOON_STRUCTURES[name]().map(b => ({ ...b, z: b.z - 5 })) });
function hitTarget(name, { block = null, v = 3, vx = 0, dx = 0, secs = 8, seed = 1 } = {}) {
  const s = targetScene(name, seed), W = createMoonWorld();
  W.setScene(s);
  const b = s.blocks[block ?? s.blocks.reduce((k, x, i) => (x.y > s.blocks[k].y ? i : k), 0)];
  W.dropBall([b.x + dx, b.y + b.h / 2 + MOON_BALL.r + 0.02, b.z], [vx, -v, 0]);
  const seen = [];   // each step: which blocks are down, broken, venting
  let down = 0;
  for (let k = 0; k < secs * 60; k++) {
    ({ down } = W.step(1 / 60));
    seen.push(W.blocks.map(r => ({ down: r.down, broken: !!r.broken, venting: !!r.venting })));
  }
  return { s, W, down, seen, events: W.events };
}

test('moon targets (Q125): each level has its own, from its first scene on every deal', () => {
  const want = { 6: 'drum', 7: 'glass', 8: 'boulder', 9: 'crystal', 10: 'oxygen' };
  let scenes = 0;
  for (const [n, mat] of Object.entries(want)) {
    assert.ok(LEVEL_TARGETS[n], `level ${n} has targets`);
    for (let seed = 1; seed <= 20; seed++) {
      const first = moonScene(seed, +n, 1);
      assert.ok(first.blocks.some(b => b.mat === mat), `${n}.1 seed ${seed}: has its ${mat}`);
      for (let i = 1; i <= SCENES; i++) {
        const sc = moonScene(seed, +n, i);
        scenes++;
        // another level's target never turns up here
        for (const b of sc.blocks) assert.ok(!Object.values(want).includes(b.mat) || b.mat === mat, `${n}.${i}: no ${b.mat}`);
      }
    }
  }
  assert.equal(scenes, 5 * 20 * SCENES);
  // a ball from the lander falls fast enough to burst a drum or set a tank venting, even onto the tallest structure (a gantry, 2.7 m)
  const fall = Math.sqrt(2 * 1.62 * (LANDER_Y - DROP_BELOW - 2.7));
  assert.ok(fall > MOON_MATS.drum.burst && fall > MOON_MATS.oxygen.pop, `the slowest fall onto a block: ${fall.toFixed(2)} m/s`);
});

test('moon targets: a fuel drum bursts when a ball hits it hard, pushing what\'s near; a slow ball only knocks it', () => {
  const { W, events } = hitTarget('drums3', { v: 3 });
  const burst = events.filter(e => e.what === 'burst');
  assert.ok(burst.length >= 1, `burst: ${burst.length}`);
  assert.equal(burst[0].i, 2, 'the drum hit (on top) bursts first');
  const r = W.blocks[2];
  assert.ok(r.broken && r.down, 'gone and down');
  assert.ok(!W.world.bodies.includes(r.body), 'taken out of the world');
  assert.equal(W.boxes()[2], null, 'no ring or glow on it');
  // (the drums under it, hit by the ball falling on, burst in turn)
  assert.ok(burst.length >= 2, `a chain: ${burst.map(e => e.i)}`);
  // the burst pushes what's within BURST_R (harder the nearer): a crate 0.5 m away (not touched
  // by the ball) is pushed; one 1.3 m away isn't
  const crate0 = targetScene('crates3').blocks[0];
  const near = { ...targetScene('drums3'), blocks: [targetScene('drums3').blocks[0], { ...crate0, x: 0.5 }, { ...crate0, x: -1.3 }] };
  const Wn = createMoonWorld(); Wn.setScene(near);
  Wn.dropBall([near.blocks[0].x, near.blocks[0].y + near.blocks[0].h / 2 + MOON_BALL.r + 0.02, near.blocks[0].z], [0, -3, 0]);
  for (let k = 0; k < 240; k++) Wn.step(1 / 60);
  const moved = r => Math.hypot(r.body.position.x - r.x0, r.body.position.z - r.z0);
  assert.ok(Wn.blocks[0].broken, 'the drum burst');
  assert.ok(moved(Wn.blocks[1]) > 0.1, `the crate 0.5 m away pushed ${moved(Wn.blocks[1]).toFixed(2)} m`);
  assert.ok(moved(Wn.blocks[2]) < 0.01, `the crate 1.3 m away not pushed (${moved(Wn.blocks[2]).toFixed(3)} m)`);
  // a scene picked up again (its poses kept): the burst drum stays gone
  const poses = W.poses(), W2 = createMoonWorld();
  W2.setScene(targetScene('drums3'), poses);
  assert.ok(W2.blocks[2].broken && !W2.world.bodies.includes(W2.blocks[2].body), 'still gone after a resume');
  // slow: no burst
  const slow = hitTarget('drums3', { v: 0.8, secs: 3 });
  assert.equal(slow.events.filter(e => e.what === 'burst').length, 0, 'a ball at 0.8 m/s doesn\'t burst a drum');
  assert.ok(BURST_R > 0);
});

test('moon targets: glass and crystals shatter only once down; one left standing never does', () => {
  for (const name of ['panels3', 'crystals']) {
    const sc = name === 'panels3' ? (() => { const s = targetScene('panels3'); s.blocks.forEach(b => { b.mat = 'glass'; }); return s; })() : targetScene(name);
    const W = createMoonWorld();
    W.setScene(sc);
    const b = sc.blocks.reduce((a, x) => (x.y + x.h / 2 > a.y + a.h / 2 ? x : a));
    // a glancing ball at the top's edge, so it tips over
    W.dropBall([b.x - b.w / 2, b.y + b.h / 2 + MOON_BALL.r + 0.02, b.z], [0.5, -3, 0]);
    // (a knock's shatter, v > 0, is judged with the block's state before the step; one coming
    // to rest down, v 0, is judged in the step it went down)
    const brokenStanding = [];
    for (let k = 0; k < 10 * 60; k++) {
      const wasDown = W.blocks.map(r => r.down), n0 = W.events.length;
      W.step(1 / 60);
      for (const e of W.events.slice(n0)) if (e.what === 'shatter' && (e.v > 0 ? !wasDown[e.i] : !W.blocks[e.i].down)) brokenStanding.push(e.i);
    }
    const shattered = W.events.filter(e => e.what === 'shatter');
    assert.ok(shattered.length >= 1, `${name}: shattered ${shattered.length}`);
    assert.deepEqual(brokenStanding, [], `${name}: none broke while standing`);
    // by the end, every one down is in pieces, every one standing whole
    for (const r of W.blocks) assert.equal(!!r.broken, r.down, `${name} block ${r.i}: ${r.down ? 'down, so shattered' : 'standing, so whole'}`);
  }
  // left alone, standing glass is never touched
  const W = createMoonWorld(), g = targetScene('panels3'); g.blocks.forEach(b => { b.mat = 'glass'; });
  W.setScene(g);
  for (let k = 0; k < 300; k++) W.step(1 / 60);
  assert.equal(W.events.length, 0, 'nothing shatters by itself');
});

test('moon targets: a boulder is down once rolled 0.6 m or dropped, not by how it\'s turned', () => {
  const W = createMoonWorld(), s = targetScene('boulder');
  W.setScene(s);
  const r = W.blocks[0];
  // turned right over where it stands: still up (it's round)
  r.body.quaternion.setFromEuler(Math.PI / 2, 0, 0.7);
  W.step(1 / 60);
  assert.equal(r.down, false, 'turned, not moved: up');
  r.body.position.set(r.x0 + ROLL_M - 0.1, r.y0, r.z0); r.body.velocity.set(0, 0, 0);
  W.step(1 / 60);
  assert.equal(r.down, false, `rolled ${ROLL_M - 0.1} m: up`);
  r.body.position.set(r.x0 + ROLL_M + 0.1, r.y0, r.z0);
  W.step(1 / 60);
  assert.equal(r.down, true, `rolled ${ROLL_M + 0.1} m: down`);
  // a ball dropped from the lander sets it rolling away, and it slows to a stop (the scene isn't held up)
  const hit = hitTarget('boulder', { vx: 1, secs: 12 });   // (at the lander's speed on Normal)
  assert.equal(hit.down, 1, 'rolled away');
  assert.ok(hit.W.calm(), 'come to rest within 12 s');
});

test('moon targets: an oxygen tank hit hard vents, flying off on its own jet for a moment; a slow ball only knocks it', () => {
  const { W, events, seen } = hitTarget('o2tank', { v: 3, secs: 10 });
  const pop = events.filter(e => e.what === 'pop');
  assert.equal(pop.length, 1, 'one pop');
  const venting = seen.filter(f => f[0].venting).length / 60;
  assert.ok(venting > POP_S - 0.1 && venting <= POP_S + 0.05, `vented ${venting.toFixed(2)} s`);
  assert.ok(!W.blocks[0].venting && W.blocks[0].down, 'the jet done, the tank down');
  const slow = hitTarget('o2tank', { v: 0.8, secs: 3 });
  assert.equal(slow.events.length, 0, 'a ball at 0.8 m/s doesn\'t set it venting');
});

test('moon targets: a burst or a pop plays out the same each time (seeded with the scene)', () => {
  for (const name of ['drums3', 'o2pair']) {
    const a = hitTarget(name, { secs: 4 }).W.poses(), b = hitTarget(name, { secs: 4 }).W.poses();
    assert.deepEqual(a, b, `${name}: the same both times`);
    const c = hitTarget(name, { secs: 4, seed: 2 }).W.poses();
    assert.equal(c.length, a.length);
  }
});

// Q133 (11.3): the blocks left glow on the moon as in the park. A real drop in the moon's
// physics, the round's rules and the wait counted as the page's moonTick counts it.
test('moon: the blocks left glow after a pause (Q133): 4 s after the next ball is ready and all is still; not while aiming, nor once won', () => {
  // (Landing Zone scene 4, seed 1: three structures; a drop on the highest block knocks 4 of 10)
  const s = moonScene(1, 6, 4);
  const top = s.blocks.reduce((a, b) => (b.y > a.y ? b : a));
  // the moon's frame for `secs` s after a drop on the tower's top; aiming(t): the pad held then
  function play(aiming = () => false, secs = 12) {
    const W = createMoonWorld(); W.setScene(s);
    const r = newRound(W.blocks.length);
    for (let k = 0; k < 120; k++) W.step(1 / 60);   // settled, as a scene is before the first ball
    useBall(r);
    W.dropBall([top.x + 0.12 - dropPath([0, LANDER_Y - DROP_BELOW, top.z], 1, []).x, LANDER_Y - DROP_BELOW, top.z], [1, 0, 0]);
    let idle = 0, first = null, standing = null, t = 0;
    for (let k = 0; k < secs * 60; k++) {
      const dt = 1 / 60, { down } = W.step(dt);
      t += dt;
      update(r, dt, { down, still: W.still(), calm: W.calm() });
      idle = glowWait(idle, r, W.still(), aiming(t), dt);
      if (first === null && glowsBy(idle) > 0) { first = t; standing = W.blocks.map(b => !b.down); }
    }
    return { first, standing, r, W };
  }
  const a = play();
  assert.ok(a.r.down >= 1 && a.r.down < a.r.total, `the drop knocks some, not all: ${a.r.down} of ${a.r.total}`);
  assert.ok(a.first !== null, 'it glows');
  // (measured 2026-11-18, 75 drops: the moon's ball rolls on in the dust at 0.3-0.8 m/s until it is
  // taken away at 12 s, so the scene is rarely still and the glow comes at the most it waits,
  // READY_AFTER + GLOW_STILL_MAX + GLOW_WAIT = 7.9 s, as the park's "by about 8 s"; a frame's rounding allowed)
  const soonest = READY_AFTER + GLOW_WAIT, latest = READY_AFTER + GLOW_STILL_MAX + GLOW_WAIT;
  assert.ok(a.first >= soonest - 1e-9 && a.first <= latest + 2 / 60, `first glow at ${a.first.toFixed(2)} s after the drop: between ${soonest} and ${latest}`);
  assert.equal(a.standing.filter(Boolean).length, a.r.total - a.r.down, 'only the blocks still standing glow');
  // holding the pad (aiming) the whole time: no glow; let go at 6 s: a glow GLOW_WAIT later, not at once
  assert.equal(play(() => true).first, null, 'no glow while aiming');
  const late = play(t => t < 6);
  assert.ok(late.first !== null && late.first >= 6 + GLOW_WAIT - 1e-9, `after letting go: ${late.first?.toFixed(2)} s`);
  // a scene won, or a ball not yet dropped (the tutorial's balls are free: used stays 0): never
  const won = newRound(3); useBall(won); won.since = 5; won.result = { won: true };
  assert.equal(glowWait(4.5, won, true, false, 1 / 60), 0, 'won: no glow');
  const free = newRound(3); free.since = 5;
  assert.equal(glowWait(4.5, free, true, false, 1 / 60), 0, 'no ball counted yet: no glow');
});

test('moon game: level 5 done opens level 6 (the moon); a level done there opens the next; level 10 done is every level', () => {
  const g = createGame(5);
  for (let n = 1; n <= 5; n++) { switchLevel(g, n); for (let i = 1; i <= SCENES; i++) sceneOver(g, true); }
  assert.ok(isOpen(g, 6) && g.level === 6, 'on to the moon');
  assert.ok(!isOpen(g, 7));
  for (let n = 6; n <= 9; n++) { for (let i = 1; i < SCENES; i++) sceneOver(g, true); assert.equal(sceneOver(g, true), 'level'); }
  for (let i = 1; i < SCENES; i++) sceneOver(g, true);
  assert.equal(sceneOver(g, true), 'all');
  assert.deepEqual(g.done, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'sorted as numbers');
});

// Every scene, played by the test player (as a person would with the pad):
// on each difficulty, and with a person's timing (its drops 15 cm off the
// aim, either way). Measured 2026-11-17 over 3 deals: 72-75 of 75 at each
// difficulty; 74 of 75 with 15 cm off; the misses the big 5th scenes.
test('moon: every scene can be won by the test player, on each difficulty and with a person\'s timing', () => {
  const runs = [['normal', 0], ['harder', 0], ['hardest', 0], ['normal', 0.15]];
  const failed = [];
  let played = 0, won = 0;
  for (const [mode, miss] of runs) for (let n = 6; n <= 10; n++) for (let i = 1; i <= SCENES; i++) for (const seed of [7919, 15838]) {
    const r = playMoonScene(seed, n, i, { mode, miss });
    played++;
    if (r.cleared) won++; else failed.push(`${mode}${miss ? '+miss' : ''} ${n}.${i} seed ${seed}: ${r.down}/${r.total} in ${r.balls}`);
    // the level's way in: always
    if (n === 6 && i <= 2) assert.ok(r.cleared, `level 6 scene ${i} (${mode}): ${r.down}/${r.total}`);
  }
  assert.equal(played, 4 * 25 * 2);
  assert.ok(won / played >= 0.93, `won ${won} of ${played}: ${failed.join('; ')}`);
});

test('moon page: its own canvas, the turn button by the pad, the keys, the lit block; the map\'s moon levels', async () => {
  const page = await read('topple.html'), js = await read('src/ui/topple.js'), css = await read('css/topple.css'), draw = await read('src/ui/topple-moon.js');
  assert.match(page, /<canvas id="cm"[^>]*hidden><\/canvas>/);
  assert.match(page, /<button type="button" class="turnbtn" id="turnBtn" aria-label="Turn the lander round" hidden>⇄<\/button>/);
  assert.match(css, /\.turnbtn \{[^}]*position: absolute/);
  assert.match(js, /if \(isMoonLevel\(lv\)\) return makeMoonScene\(lv, kept, spec\);/);
  assert.match(js, /\$\('cm'\)\.hidden = !moonOn;\s*\$\('c'\)\.hidden = moonOn;\s*\$\('turnBtn'\)\.hidden = !moonOn;/);
  assert.match(js, /const MOON_KEYS = \{ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Space: 'space' \};/);
  // Q131 (11.2): Space down drops at once; its let-go only kept from clicking a button
  assert.match(js, /\n  if \(k === 'space'\) moonDrop\('key'\);\n\}\);/, 'Space down drops');
  assert.match(js, /if \(k === 'space' && keysOn\(\)\) \{ e\.preventDefault\(\); return; \}/, 'Space let go drops nothing');
  assert.doesNotMatch(js, /keys\.space/, 'no Space held to aim');
  assert.match(js, /if \(onMoon\(\)\) \{ drag = null; mo\.held = false; moonDrop\('pad'\); return; \}/, 'letting go of the pad drops');
  assert.match(js, /if \(moonMode\(playMode\(\)\)\.light && a\.hit != null && a\.hit >= 0\) lit = a\.hit;/, 'no block lit for "none" (null >= 0 is true)');
  // Q131 (11.2): the ring whenever a ball is ready, not only while held
  assert.match(js, /const ok = ready\(\);\n  moon3d\.setLander\(f, ok, mo\.held && ok\);\n  let lit = -1, p = null;\n  if \(ok && showsRing\(playMode\(\), round\.used\)\) \{/, 'the ring always on');
  for (const n of [6, 7, 8, 9, 10]) assert.match(js, new RegExp(`\\n  ${n}: \\{ pic: \\(\\) => '[^']+', tint: '#[0-9A-F]{6}'`), `level ${n} on the map`);
  for (const s of ['L(\'drop\'', 'L(\'lander: turn\'', 'L(\'lander: steer\'', 'L(\'drop would hit block\'', '\'moon scene\'', 'L(\'lander turns at the end\'', 'L(\'drop refused\'']) assert.ok(js.includes(s), `logged: ${s}`);
  // Q133 (11.3): the blocks left glow, as the park's: counted in moonTick (the pad held or ↑ ↓ is aiming), drawn on each standing block, logged
  assert.match(js, /const \{ glow, glows \} = glowStep\(dt, still, mo\.held \|\| !!kz\);/);
  assert.match(js, /moon3d\.setGlow\(glow, glow > 0 \? moonWorld\.blocks\.map\(b => !b\.down\) : null\);\n  glowDrawn\(glow, glows, moon3d\);/);
  assert.match(js, /perf\.at = performance\.now\(\);\n  glowIdle = 0; glowsSaid = 0;\n  renderTally\(\);\n  L\(kept \? 'moon scene picked up again'/, 'a new moon scene starts the count');
  assert.match(draw, /const glowMat = new THREE\.MeshBasicMaterial\(\{ color: '#FFF1C4', transparent: true, opacity: 0, blending: THREE\.AdditiveBlending, depthWrite: false \}\);/);
  assert.match(draw, /m\.add\(over\); m\.userData\.glow = over;/, 'every moon block its glow');
  assert.match(draw, /m\.userData\.glow\.visible = glowing && !!standing\?\.\[i\];/);
  assert.match(draw, /m !== ballMat && m !== glowMat\)/, 'a new level keeps the glow\'s material');
  assert.match(draw, /nextStar = 8 \+ Math\.random\(\) \* 14;/, 'the odd shooting star');
  assert.match(draw, /earth\.rotation\.y \+= dt \* 0\.02;/, 'the Earth turning slowly');
  assert.match(draw, /earth\.position\.set\(-30 \+ e\.az \* 60, 10 \+ e\.el \* 12, -48\);/, 'the Earth where the scene puts it');
  // Q125 (11.5): each level's look and target: its scenery, a burst, shatter or pop heard, drawn and logged
  const looks = await read('src/ui/topple-moon-looks.js');
  assert.match(draw, /import \{ levelLook \} from '\.\/topple-moon-looks\.js';/);
  assert.match(draw, /const look = levelLook\(THREE, S, level, /);
  for (const n of [6, 7, 8, 9, 10]) assert.match(looks, new RegExp(`level === ${n}`), `level ${n}'s own look`);
  assert.match(js, /const MOON_KNOCK = \{ panel: 'ring', glass: 'iceknock', crystal: 'chime', boulder: 'crunch', drum: 'barrel' \};/);
  assert.match(js, /moonEvents\(moonWorld\);/, 'the targets\' events heard every frame');
  assert.match(js, /L\(`moon: \$\{e\.what\}`, \{ block: e\.i, mat: e\.mat, at: e\.at\.map\(r2\), v: r2\(e\.v\), t: r2\(round\.t\) \}\);/, 'each logged');
  assert.match(draw, /m\.visible = !r\.broken;/, 'one burst or shattered: gone');
  for (const m of ['drum', 'oxygen', 'glass', 'boulder', 'crystal']) assert.match(draw, new RegExp(`\\n    ${m}: `), `${m}'s look`);
  assert.doesNotMatch(js + draw + looks, /mockup:|__mockSeen|topple-mock/, 'nothing of the mockup left');
});
