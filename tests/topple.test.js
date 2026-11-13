// Topple!'s rules, scenes and camera (src/core/topple.js): the drag's
// aiming (mockup v8's checks), the drag pad and its show, a block down, the
// game's jewels and hearts, a scene's end, what's kept on the device, the
// dots, the view fitted to a scene, and scenes 1-4 dealt so neighbours
// differ. Pure functions, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HAND, CAM, SCALE, MAX_UP, MAX_AIM, R2D, BALLS, SCENES, HEARTS, STACKS, SIZE, KINDS, READY_AFTER, END_WAIT, END_MAX, WIN_HOLD, CARD_HOLD, CARD_MAX,
  makeLayout, sceneOpts, sceneSeed, levelPlan, sceneChoice, sceneParts, frontDrag, launchVel, isDown, createGame, readGame, sceneOver,
  newRound, useBall, canThrow, update, endWords, dotsFor, behindView, checkSetup, rng,
  PAD, DEMO, DEMO_UPS, padSpot, dragFrom, padPress, demoDrag, demoAt,
  FAR_TREES, farBalls, treeBalls, inLeaves, trunksIn, SOME_STACKS, SOME_MIN,
  MAX_LEVEL, LEVELS, switchLevel, restartLevel, seedOf, layoutFor, placeOf, isOpen, MAP_NODES, mapRoad, roadAt, roadTo,
  MODES, MODE_INFO, dotSeconds, GLOW_WAIT, GLOW_PULSES, GLOW_PULSE_S, GLOW_STILL_MAX, waitingOn, glowAt, glowsBy,
} from '../src/core/topple.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} not within ${tol} of ${b}`);

test('topple: every block on the ground is upright, so a hit can tip it; scene 5 the bigger structures', () => {
  let checked = 0;
  for (const [name, make] of Object.entries(STACKS)) {
    for (const b of make()) {
      if (b.y - b.h / 2 > 0.01) continue;
      assert.ok(b.h > b.d && b.h > b.w * 0.99, `${name}: a ${b.c} block on the ground isn't upright`);
      checked++;
    }
  }
  assert.ok(checked >= 30, `only ${checked} ground blocks`);
  assert.deepEqual(sceneOpts(1).stacks, ['arch', 'posts', 'pyramid', 'bench', 'pair', 'row']);
  assert.deepEqual(sceneOpts(4), sceneOpts(1));
  assert.deepEqual(sceneOpts(5), { n: 2, stacks: ['tower', 'fence', 'trio'] });
  // the ones where a hit knocks only some (Q72), in both lists
  assert.deepEqual(SOME_STACKS.filter(k => sceneOpts(1).stacks.includes(k) || sceneOpts(5).stacks.includes(k)), SOME_STACKS);
});

// Developer, 2026-11-10: "Sometimes there seemed to be no difference
// between scenes" (their game 1288553953: scenes 1-3 all an arch behind a
// bush). Picked each on its own, 97 of 300 neighbouring scenes had the same
// structure, 32 the same structure and thing.
test('topple: scenes 1-4 dealt per game: a different structure each, at least two where a hit knocks only some', () => {
  const stacks = sceneOpts(1).stacks;
  let games = 0;
  const seenStack = new Set(), seenThing = new Set(), someCounts = new Set();
  for (let g = 1; g <= 500; g++) for (const level of [1, 2]) {
    const plan = levelPlan(g * 7919, level);
    assert.equal(plan.length, SCENES - 1);
    assert.deepEqual(levelPlan(g * 7919, level), plan, `${g}/${level}: not the same each time`);
    plan.forEach((c, i) => {
      assert.ok(stacks.includes(c.stack) && KINDS.includes(c.thing), `${g}: ${JSON.stringify(c)}`);
      seenStack.add(c.stack); seenThing.add(c.thing);
    });
    assert.equal(new Set(plan.map(c => c.stack)).size, plan.length, `${g}/${level}: a structure twice: ${JSON.stringify(plan)}`);
    const some = plan.filter(c => SOME_STACKS.includes(c.stack)).length;
    assert.ok(some >= SOME_MIN, `${g}/${level}: only ${some} where a hit knocks only some`);
    someCounts.add(some);
    games++;
  }
  assert.equal(games, 1000);
  assert.equal(seenStack.size, stacks.length); assert.equal(seenThing.size, KINDS.length);
  assert.deepEqual([...someCounts].sort(), [2, 3], 'two or three of the four, as dealt');
  assert.notDeepEqual(levelPlan(1, 1), levelPlan(2, 1), 'every game the same plan');
  // a scene's options carry its dealt structure and thing; the 5th is as before
  const plan = levelPlan(42, 1);
  for (let i = 1; i < SCENES; i++) {
    const o = sceneChoice(42, 1, i), L = makeLayout(sceneSeed(42, 1, i), o);
    assert.deepEqual([o.stacks, o.kinds], [[plan[i - 1].stack], [plan[i - 1].thing]]);
    assert.equal(L.stack, plan[i - 1].stack);
    assert.deepEqual([...L.things.map(t => t.kind), ...L.unplaced], [plan[i - 1].thing]);
  }
  assert.deepEqual(sceneChoice(42, 1, SCENES), sceneOpts(SCENES));
});

test('topple: a layout is the same from the same seed; the 5th scene has two things; each block 1.5× the mockup v5\'s', () => {
  assert.deepEqual(makeLayout(42), makeLayout(42));
  assert.notDeepEqual(makeLayout(42).blocks, makeLayout(43).blocks);
  for (let seed = 1; seed <= 20; seed++) {
    const L = makeLayout(seed * 101, sceneOpts(5));
    assert.ok(['tower', 'fence', 'trio'].includes(L.stack));
    assert.equal(L.things.length + L.unplaced.length, 2, `${seed}: ${L.things.length} things`);
    assert.ok(L.power >= 0.3 && L.power <= 0.8);
    for (const t of L.things) assert.ok(KINDS.includes(t.kind));
  }
  const L = makeLayout(7, sceneOpts(1));
  const raw = STACKS[L.stack]();
  L.blocks.forEach((b, i) => near(b.h, raw[i].h * SIZE, 1e-12, 'height'));
});

// On the right of the throw a tree stood between the side view's camera and
// the structure, and was drawn see-through there (developer, 2026-11-10:
// "much lighter coloring"); now every tree is on the left, nothing faded.
test('topple: every tree stands left of the throw, alone or beside a bush or a backboard; none is faded', () => {
  const lineX = (table, z) => HAND.x + (table.x - HAND.x) * (z - HAND.z) / (table.z - HAND.z);
  let trees = 0;
  for (const pool of [['tree'], ['bush', 'tree'], ['tree', 'backboard']]) {
    for (let seed = 1; seed <= 40; seed++) {
      const L = makeLayout(seed * 7919, sceneOpts(pool.length === 1 ? 1 : 5), pool);
      assert.ok(!L.unplaced.includes('tree'), `${pool}/${seed}: the tree found no room`);
      for (const t of L.things.filter(t => t.kind === 'tree')) {
        trees++;
        assert.equal(t.where, 'left');
        assert.ok(t.x + t.r < lineX(L.table, t.z), `${pool}/${seed}: the trunk reaches the line (x ${t.x.toFixed(2)})`);
      }
      const p = sceneParts(L);
      assert.ok(![...p.bodies, ...p.props].some(o => 'faded' in o), `${pool}/${seed}: something faded`);
    }
  }
  assert.equal(trees, 120);
});

// Developer, 2026-11-11: "there is a gap between the trunk part and the bush
// part"; the far-off trees' trunks stopped at 1.6 m, short of 10 of 12 clumps.
test('topple: every trunk and branch reaches into its leaves, the far-off trees\' and the scenes\'', () => {
  const t = trunksIn();
  assert.ok(t.far >= 0.3, `a far-off trunk only ${t.far} m into its leaves`);
  assert.equal(t.scene, null, 'no scene, no scene trees');
  let ends = 0, least = Infinity;
  for (let seed = 1; seed <= 60; seed++) {
    const p = sceneParts(makeLayout(seed * 104729, sceneOpts(seed % 2 ? 1 : 5), ['bush', 'tree']));
    for (const pr of p.props.filter(pr => pr.part === 'tree')) ends += treeBalls(pr).ends.length;
    const s = trunksIn(p.props).scene;
    if (s != null) least = Math.min(least, s);
  }
  assert.ok(ends >= 120, `only ${ends} trunk and branch ends checked`);
  assert.ok(least >= 0.1, `a scene tree's trunk or branch only ${least} m into its leaves`);
  // the check can fail: the old trunks, 1.6 m tall, are short of most clumps
  const short = FAR_TREES.filter(f => inLeaves([f.x, 1.6, f.z], farBalls(f)) < 0);
  assert.equal(short.length, 10, `${short.length} of 12 old trunks short of their leaves`);
});

test('topple: scene seeds differ by scene, level, try and game, and stay the same', () => {
  const s = sceneSeed(1234, 1, 1);
  assert.equal(sceneSeed(1234, 1, 1), s);
  const others = [sceneSeed(1234, 1, 2), sceneSeed(1234, 2, 1), sceneSeed(1234, 1, 1, 1), sceneSeed(1235, 1, 1)];
  for (const o of others) assert.notEqual(o, s);
  assert.equal(new Set(others).size, 4);
  const r = rng(5), a = [r(), r(), r()];
  assert.ok(a.every(v => v >= 0 && v < 1));
  assert.deepEqual(a, [rng(5)(), (() => { const q = rng(5); q(); return q(); })(), (() => { const q = rng(5); q(); q(); return q(); })()]);
});

test('topple: the world\'s sizes are Far\'s, twice the layout\'s and twice as far from the hand', () => {
  const L = makeLayout(99), p = sceneParts(L);
  assert.equal(SCALE, 2);
  p.blocks.forEach((b, i) => {
    near(b.h, L.blocks[i].h * 2, 1e-12, 'height');
    near(b.z, HAND.z + (L.blocks[i].z - HAND.z) * 2, 1e-12, 'depth');
  });
  // the bounds hold every block
  for (const b of p.blocks) {
    assert.ok(b.x - b.w / 2 >= p.bounds.min[0] - 1e-9 && b.x + b.w / 2 <= p.bounds.max[0] + 1e-9);
    assert.ok(b.y + b.h / 2 <= p.bounds.max[1] + 1e-9);
  }
  assert.ok(p.bodies.length >= 1 && p.props.length >= p.bodies.length);
});

// Mockup v8's aiming checks (journal, "Block game mockup v8").
test('topple: from behind, drag where to throw: up aims higher, sideways the same way; a short drag doesn\'t throw', () => {
  const size = 400;
  const d = frontDrag(0, -0.4 * size * 32 / MAX_UP, size, 0.5);
  near(d.up, 32, 1e-9, 'up');
  assert.equal(d.aim, 0);
  assert.equal(d.power, 0.5, 'how hard is the scene\'s');
  assert.ok(d.ok);
  assert.equal(frontDrag(0, -size, size, 0.5).up, MAX_UP, 'more than full: 70°');
  assert.equal(frontDrag(0, size * 0.2, size, 0.5).up, 0, 'down: flat');
  assert.equal(frontDrag(size * 0.35, 0, size, 0.5).aim, 1);
  assert.equal(frontDrag(-size, 0, size, 0.5).aim, -1);
  assert.equal(frontDrag(5, 5, size, 0.5).ok, false, 'a 7 px drag threw');
  assert.equal(frontDrag(5, 5, size, 0.5).show, true);
  assert.equal(frontDrag(3, 0, size, 0.5).show, false);
  assert.equal(frontDrag(10, 10, 0, 0.5), null, 'a stage of no size');
});

// The drag pad (journal, "9.2 on the phone; home pictures and aiming", Q67).
test('topple: the drag pad sits low on the right, inside the park, with room for a full drag', () => {
  let checked = 0;
  // an upright phone's park (393 x 760 screen), a sideways one, a tablet's
  for (const [w, h] of [[377, 592], [760, 377], [740, 900]]) {
    const s = Math.min(w, h), p = padSpot(w, h);
    assert.ok(p.x - p.r >= 0 && p.x + p.r <= w && p.y - p.r >= 0 && p.y + p.r <= h, `${w}x${h}: the pad runs off the park`);
    assert.ok(p.y > h / 2 && p.x > w / 2, `${w}x${h}: the pad isn't low on the right`);
    // clear of the park's foot (the hint, 8 px up, on the left)
    assert.ok(p.y + p.r <= h - 56, `${w}x${h}: the pad is down at the park's foot`);
    // room to drag: 0.4 of s up for the highest throw
    assert.ok(p.y - 0.4 * s >= 0, `${w}x${h}: no room for a full drag`);
    checked++;
  }
  assert.equal(checked, 3);
  assert.equal(padSpot(200, 200).r, PAD.rMin, 'a small park: the smallest pad');
  assert.equal(padSpot(2000, 1500).r, PAD.rMax, 'a big park: the biggest pad');
  assert.equal(padSpot(0, 500), null, 'a park of no size');
});

test('topple: where a press is: the pad, the ball, or elsewhere', () => {
  const pad = { x: 300, y: 450, r: 38 }, ball = { x: 80, y: 500 };
  assert.equal(PAD.reach, 1.5);
  assert.equal(dragFrom(300, 450, pad, ball), 'pad');
  assert.equal(dragFrom(300 + 38 * 1.45, 450, pad, ball), 'pad', 'just off its edge still counts');
  assert.equal(dragFrom(300, 450 - 38 * 1.45, pad, ball), 'pad', 'above it too');
  assert.equal(dragFrom(300 + 38 * 1.55, 450, pad, ball), 'elsewhere');
  assert.equal(dragFrom(100, 520, pad, ball), 'ball');
  assert.equal(dragFrom(200, 200, pad, ball), 'elsewhere');
  assert.equal(dragFrom(200, 200, null, null), 'elsewhere', 'before the park is drawn');
});

// A throw starts only on the pad (developer, 2026-11-10: "only starting from
// the guide is more intuitive").
test('topple: only a press on the pad (or nearly) starts a drag; a miss says how far off', () => {
  const pad = { x: 300, y: 450, r: 38 }, ball = { x: 80, y: 500 };
  assert.deepEqual(padPress(300, 450, pad, ball), { on: true, from: 'pad', offPx: 0 }, 'its middle');
  assert.deepEqual(padPress(300 + 30, 450, pad, ball), { on: true, from: 'pad', offPx: 0 }, 'inside the drawn pad');
  assert.deepEqual(padPress(300 + 55, 450, pad, ball), { on: true, from: 'pad', offPx: 17 }, 'a near miss counts (55 px of a 57 px reach)');
  assert.deepEqual(padPress(300 + 60, 450, pad, ball), { on: false, from: 'elsewhere', offPx: 22 }, 'past the reach');
  assert.deepEqual(padPress(80, 500, pad, ball), { on: false, from: 'ball', offPx: 188 }, 'the ball itself starts nothing');
  assert.deepEqual(padPress(200, 200, null, ball), { on: false, from: 'elsewhere', offPx: null }, 'before the park is drawn');
});

test('topple: the pad\'s show: a finger drags from it twice, the dots following, aimed at the structure', () => {
  const size = 377, stand = { x: 0.6, z: -5.6 };
  const to = demoDrag(size, stand), d = frontDrag(to.dx, to.dy, size, 0.5);
  near(d.up, 30, 1e-9, 'up');
  near(d.aim * MAX_AIM, Math.atan2(stand.x - HAND.x, HAND.z - stand.z) * R2D, 1e-9, 'aimed at the structure');
  assert.ok(d.ok);
  assert.equal(frontDrag(...Object.values(demoDrag(size, { x: 50, z: -1 })), size, 0.5).aim, 1, 'far off to one side: full aim');
  // the other angles tried, for a show whose path touches a block first
  assert.equal(DEMO_UPS[0], 30);
  for (const up of DEMO_UPS) {
    const t = demoDrag(size, stand, up), dd = frontDrag(t.dx, t.dy, size, 0.5);
    near(dd.up, up, 1e-9, `${up}°`);
    assert.ok(dd.ok, `${up}°: too short to throw`);
  }
  // the finger over time: fades in at the pad, moves, holds, fades; the gap; again; done
  assert.deepEqual(demoAt(0, to), { dx: 0, dy: 0, alpha: 0, dots: false });
  const mid = demoAt(DEMO.in + DEMO.move / 2, to);
  near(mid.dy, to.dy / 2, 1e-9, 'half way');
  assert.ok(mid.dots && mid.alpha === 1);
  assert.deepEqual(demoAt(DEMO.in + DEMO.move + 0.1, to), { ...to, alpha: 1, dots: true });
  const cycle = DEMO.in + DEMO.move + DEMO.hold + DEMO.out + DEMO.gap;
  assert.equal(demoAt(cycle - 0.1, to).alpha, 0, 'the gap');
  assert.deepEqual(demoAt(cycle + DEMO.in + DEMO.move + 0.1, to), { ...to, alpha: 1, dots: true }, 'the second time');
  assert.equal(demoAt(cycle * DEMO.times - DEMO.gap, to), null, 'done after the second');
  assert.equal(demoAt(-1, to), null);
  assert.equal(demoAt(NaN, to), null);
});

test('topple: the throw\'s speed is √2 times the Near speed; up and sideways turn it', () => {
  const { v, vec } = launchVel(0.5, 0, 0);
  near(v, 6 * Math.SQRT2, 1e-12, 'speed');
  near(vec[2], -v, 1e-12, 'straight ahead');
  const up = launchVel(0.5, 0, 45).vec;
  near(up[1], -up[2], 1e-9, '45°');
  assert.ok(launchVel(0.5, 1, 0).vec[0] > 0, 'aim 1 isn\'t to the right');
});

test('topple: a block is down once tipped over 45° or dropped 0.6 of its smallest side', () => {
  const tilt = deg => [Math.sin(deg / 2 / R2D), 0, 0, Math.cos(deg / 2 / R2D)];
  assert.equal(isDown(tilt(0), 1, 1, 0.2), false);
  assert.equal(isDown(tilt(44), 1, 1, 0.2), false);
  assert.equal(isDown(tilt(46), 1, 1, 0.2), true);
  assert.equal(isDown([0, Math.sin(1), 0, Math.cos(1)], 1, 1, 0.2), false, 'turned about the upright: still standing');
  assert.equal(isDown(tilt(0), 1 - 0.11, 1, 0.2), false, 'dropped 0.55');
  assert.equal(isDown(tilt(0), 1 - 0.13, 1, 0.2), true, 'dropped 0.65');
});

// Q69 (journal, "Mockup v1 tried"): a post leaning on another looked
// standing; Q91 (2026-11-12): posts leaning on the debris looked down, so
// a post's lean counts from 30°, not 45°.
test('topple: a tall block is down only while it lies tipped past 30°; dropping doesn\'t count; up again under 25°', () => {
  const tilt = deg => [Math.sin(deg / 2 / R2D), 0, 0, Math.cos(deg / 2 / R2D)];
  const post = (deg, y = 1, was = false) => isDown(tilt(deg), y, 1, 0.2, true, was);
  assert.equal(post(29, 0), false, 'fallen 1 m, standing at 29° (seed 28\'s upper post)');
  assert.equal(post(31), true, 'leaning at 31°');
  assert.equal(post(41), true, 'leaning at 41° (seed 17\'s post: up under the 45° rule)');
  assert.equal(post(90, 0), true, 'lying');
  // counted down: up again only under 25° (no flicker either side of 30°)
  assert.equal(post(27, 1, true), true);
  assert.equal(post(24, 1, true), false);
  assert.equal(post(27, 1, false), false);
  // a cube or plank keeps 45°
  assert.equal(isDown(tilt(40), 1, 1, 0.2, false), false);
  // a cube or plank as before: dropping counts
  assert.equal(isDown(tilt(0), 1 - 0.13, 1, 0.2, false), true);
});

const FRESH = { scene: 1, hearts: HEARTS, jewels: 0 };
test('topple: a game: a jewel and the next scene; a heart and the same scene; the last heart back to scene 1', () => {
  const g = createGame(77);
  assert.deepEqual(g, { seed: 77, level: 1, ...FRESH, reached: 1, done: [], places: {}, rounds: {}, mode: 'normal' });
  assert.equal(sceneOver(g, true), 'won');
  assert.deepEqual([g.scene, g.jewels, g.hearts], [2, 1, 3]);
  assert.equal(sceneOver(g, false), 'lost');
  assert.deepEqual([g.scene, g.jewels, g.hearts], [2, 1, 2]);
  assert.equal(sceneOver(g, false), 'lost');
  assert.equal(sceneOver(g, false), 'out');
  assert.deepEqual(g, { seed: 77, level: 1, ...FRESH, reached: 1, done: [], places: {}, rounds: {}, mode: 'normal' }, 'the same scenes: the seed kept');
  for (let i = 1; i < SCENES; i++) assert.equal(sceneOver(g, true), 'won');
  assert.equal(g.scene, SCENES);
  assert.throws(() => createGame(0));
  assert.throws(() => createGame(1.5));
});

// Levels (developer, 2026-11-11): a level done opens the next and goes on
// to it; each level keeps its own place; the map plays any level open, not
// higher; the last level done: 'all'.
test('topple: levels: a level done opens the next; each keeps its place; only open levels can be played', () => {
  assert.equal(MAX_LEVEL, 5);
  assert.deepEqual(LEVELS.map(l => l.name), ['The park', 'The building site', 'Frosty Times', 'Cactus Canyon', 'Star Light']);
  const g = createGame(9);
  assert.equal(isOpen(g, 2), false);
  assert.equal(switchLevel(g, 2), false, 'level 2 before level 1 is done');
  assert.equal(g.level, 1);
  for (let i = 1; i < SCENES; i++) sceneOver(g, true);
  assert.equal(sceneOver(g, true), 'level');
  assert.deepEqual({ level: g.level, reached: g.reached, done: g.done }, { level: 2, reached: 2, done: [1] });
  assert.deepEqual(placeOf(g, 2), FRESH);
  assert.deepEqual(placeOf(g, 1), FRESH, 'level 1 done: played again from scene 1');
  // part way into level 2, then back to level 1 and level 2 again: its place kept
  sceneOver(g, true); sceneOver(g, false);
  assert.deepEqual(placeOf(g, 2), { scene: 2, hearts: 2, jewels: 1 });
  assert.equal(switchLevel(g, 1), true);
  assert.deepEqual([g.level, g.scene], [1, 1]);
  sceneOver(g, true);
  assert.equal(switchLevel(g, 2), true);
  assert.deepEqual({ level: g.level, scene: g.scene, hearts: g.hearts, jewels: g.jewels }, { level: 2, scene: 2, hearts: 2, jewels: 1 });
  assert.deepEqual(placeOf(g, 1), { scene: 2, hearts: 3, jewels: 1 });
  assert.equal(switchLevel(g, 3), false);
  // through to the last level: 'all', every level done
  for (const n of [2, 3, 4]) { switchLevel(g, n); Object.assign(g, FRESH); for (let i = 1; i < SCENES; i++) sceneOver(g, true); assert.equal(sceneOver(g, true), 'level'); }
  assert.equal(g.level, 5);
  for (let i = 1; i < SCENES; i++) sceneOver(g, true);
  assert.equal(sceneOver(g, true), 'all');
  assert.deepEqual({ level: g.level, reached: g.reached, done: g.done, ...placeOf(g, 5) }, { level: 5, reached: 5, done: [1, 2, 3, 4, 5], ...FRESH });
  // new scenes keep the levels reached
  const h = createGame(10, g);
  assert.deepEqual({ level: h.level, reached: h.reached, done: h.done, places: h.places }, { level: 1, reached: 5, done: [1, 2, 3, 4, 5], places: {} });
});

// Developer, 2026-11-13 (Q102): "once you are in a scene you can only start
// the scene again". The level from scene 1: free, new scenes each time, the
// levels open and done kept; a level not done too.
test('topple: the level started again from scene 1: 3 hearts, no jewels, new scenes each time, the other levels as they were', () => {
  const g = createGame(2468);
  for (let i = 1; i <= SCENES; i++) sceneOver(g, true);   // level 1 done, on level 2
  sceneOver(g, true); sceneOver(g, true); sceneOver(g, false); sceneOver(g, false);
  assert.deepEqual(placeOf(g, 2), { scene: 3, hearts: 1, jewels: 2 });
  const s0 = seedOf(g), others = { reached: g.reached, done: [...g.done], places: JSON.parse(JSON.stringify(g.places)), mode: g.mode, seed: g.seed };
  assert.equal(restartLevel(g), g);
  assert.deepEqual({ level: g.level, ...placeOf(g, 2) }, { level: 2, ...FRESH });
  assert.deepEqual({ reached: g.reached, done: g.done, places: g.places, mode: g.mode, seed: g.seed }, others, 'the rest of the game as it was');
  const s1 = seedOf(g);
  assert.notEqual(s1, s0, 'new scenes');
  restartLevel(g);
  const s2 = seedOf(g);
  assert.ok(s2 !== s1 && s2 !== s0, 'new scenes again');
  // kept on the device as it is: the same scenes when the game is read back
  const back = readGame(JSON.parse(JSON.stringify(g)));
  assert.equal(seedOf(back), s2);
  // to level 1 and back: level 2 carries on from its new start, its scenes the same
  switchLevel(g, 1); switchLevel(g, 2);
  assert.deepEqual([g.scene, g.hearts, g.jewels, seedOf(g)], [1, HEARTS, 0, s2]);
  // a level not done (level 1 of a new game): the same
  const h = createGame(97531), h0 = seedOf(h);
  sceneOver(h, true);
  restartLevel(h);
  assert.deepEqual({ level: h.level, ...placeOf(h, 1), reached: h.reached, done: h.done }, { level: 1, ...FRESH, reached: 1, done: [] });
  assert.notEqual(seedOf(h), h0);
});

// (developer, 2026-11-12: a level completed before, gone back to from the
// map, "different target arrangements"; a heart lost: the same scenes)
test('topple: a done level started again from the map has new scenes; carried on, or a heart lost, the same', () => {
  const g = createGame(4321);
  for (let i = 1; i <= SCENES; i++) sceneOver(g, true);
  assert.equal(g.level, 2);
  const first = seedOf(g, 1);
  assert.equal(first, 4321, 'a level not played again: the game\'s seed');
  assert.ok(switchLevel(g, 1));
  assert.deepEqual(g.rounds, { 1: 1 });
  const again = seedOf(g, 1);
  assert.notEqual(again, first, 'level 1 again: new scenes');
  assert.ok(Number.isInteger(again) && again > 0 && again < 2 ** 31);
  // a heart lost, all of them: the same scenes
  sceneOver(g, true); sceneOver(g, false); sceneOver(g, false); sceneOver(g, false);
  assert.equal(seedOf(g, 1), again);
  // off to level 2 partway through level 1, then back: carried on, the same
  sceneOver(g, true);
  assert.ok(switchLevel(g, 2) && switchLevel(g, 1));
  assert.deepEqual([g.scene, g.rounds[1], seedOf(g, 1)], [2, 1, again]);
  // through to the end, then back from the map: new scenes again, each time different
  for (let i = 2; i <= SCENES; i++) sceneOver(g, true);
  assert.equal(g.level, 2);
  switchLevel(g, 1);
  assert.equal(g.rounds[1], 2);
  assert.ok(![first, again].includes(seedOf(g, 1)));
  // a level not done, gone back to at its start: the same (only done levels)
  assert.ok(switchLevel(g, 2) && switchLevel(g, 1) && switchLevel(g, 2));
  assert.equal(g.rounds[2], undefined);
  // the layouts differ: another level's seed makes other scenes
  assert.notDeepEqual(layoutFor(first, 2, 1).table, layoutFor(again, 2, 1).table);
  // kept on the device; nonsense dropped; a game from before 10.3 has none
  assert.deepEqual(readGame(JSON.parse(JSON.stringify(g))).rounds, g.rounds);
  assert.deepEqual(readGame({ ...g, rounds: { 1: 2, 9: 1, 2: -1, 3: 1.5, x: 4 } }).rounds, { 1: 2 });
  const old = { ...g }; delete old.rounds;
  assert.deepEqual(readGame(old).rounds, {});
  assert.equal(seedOf(readGame(old), 1), 4321);
});

test('topple: a game kept on the device is used only if it makes sense', () => {
  const g = createGame(5);
  assert.deepEqual(readGame(JSON.parse(JSON.stringify(g))), g);
  assert.deepEqual(readGame({ ...g, extra: 1 }), g);
  for (const bad of [null, 'x', {}, { ...g, seed: 0 }, { ...g, scene: 6 }, { ...g, scene: 0 }, { ...g, hearts: 0 }, { ...g, hearts: 4 }, { ...g, jewels: 5 }, { ...g, level: 0 }, { ...g, level: 6 }, { ...g, scene: '2' }]) {
    assert.equal(readGame(bad), null, JSON.stringify(bad));
  }
  // one kept by 9.4 (level 1 only) carries on
  assert.deepEqual(readGame({ seed: 5, level: 1, scene: 3, hearts: 2, jewels: 2 }), { seed: 5, level: 1, scene: 3, hearts: 2, jewels: 2, reached: 1, done: [], places: {}, rounds: {}, mode: 'normal' });
  // levels and places that don't make sense are dropped, not the game
  const odd = readGame({ seed: 5, level: 2, scene: 1, hearts: 3, jewels: 0, reached: 1, done: [1, 7, 'x', 1], places: { 1: { scene: 9, hearts: 1, jewels: 0 }, 3: FRESH, 2: FRESH } });
  assert.deepEqual(odd, { seed: 5, level: 2, scene: 1, hearts: 3, jewels: 0, reached: 2, done: [1], places: {}, rounds: {}, mode: 'normal' });
  const kept = readGame({ seed: 5, level: 2, scene: 1, hearts: 3, jewels: 0, reached: 3, done: [1, 2], places: { 1: { scene: 4, hearts: 1, jewels: 3 } } });
  assert.deepEqual(kept.places, { 1: { scene: 4, hearts: 1, jewels: 3 } });
  // every level done when there were four (10.0), then some scenes played again: level 5 open, places kept
  const ten = readGame({ seed: 5, level: 2, scene: 3, hearts: 2, jewels: 2, reached: 4, done: [1, 2, 3, 4], places: { 4: { scene: 2, hearts: 3, jewels: 1 } } });
  assert.deepEqual({ reached: ten.reached, done: ten.done, level: ten.level, scene: ten.scene, places: ten.places },
    { reached: 5, done: [1, 2, 3, 4], level: 2, scene: 3, places: { 4: { scene: 2, hearts: 3, jewels: 1 } } });
  assert.ok(isOpen(ten, 5) && switchLevel(ten, 5) && ten.scene === 1, 'level 5 from its first scene');
  // a level not done opens nothing more; the last level done opens nothing past it
  assert.equal(readGame({ seed: 5, level: 3, scene: 2, hearts: 3, jewels: 1, reached: 3, done: [1, 2] }).reached, 3);
  assert.equal(readGame({ seed: 5, level: 1, scene: 1, hearts: 3, jewels: 0, reached: 5, done: [1, 2, 3, 4, 5] }).reached, 5);
});

test('topple: a scene: 5 balls, the next 0.9 s after a throw; cleared once all are down 0.35 s, the card once calm; out of balls once still', () => {
  const r = newRound(5);
  assert.ok(canThrow(r).ok);
  assert.deepEqual(useBall(r), { ok: true, ball: 1 });
  assert.equal(canThrow(r).why, 'not-ready');
  update(r, READY_AFTER + 0.01, { down: 2, still: false });
  assert.ok(canThrow(r).ok);
  assert.equal(r.down, 2);
  // all down, still falling: cleared after WIN_HOLD, moving or not (developer, 2026-11-12: a long pause)
  assert.equal(update(r, WIN_HOLD - 0.05, { down: 5, still: false, calm: false }).ended, null, 'before the hold');
  const won = update(r, 0.1, { down: 5, still: false, calm: false });
  assert.deepEqual(won.ended, { won: true, down: 5, total: 5, balls: 1 });
  assert.equal(won.card, false, 'the card waits for the blocks');
  assert.equal(canThrow(r).why, 'scene-over');
  // the card: calm for CARD_HOLD (not at a moment's calm), once
  assert.equal(update(r, 0.2, { down: 5, still: false, calm: true }).card, false);
  assert.equal(update(r, 0.1, { down: 5, still: false, calm: false }).card, false, 'moving again: the wait starts again');
  assert.equal(update(r, CARD_HOLD - 0.05, { down: 5, still: false, calm: true }).card, false);
  const c = update(r, 0.1, { down: 5, still: false, calm: true });
  assert.equal(c.card, true);
  assert.equal(c.ended, null, 'ended twice');
  assert.equal(update(r, 1, { down: 5, still: true, calm: true }).card, false, 'the card twice');
  // never calm: the card anyway after CARD_MAX
  const m = newRound(1);
  update(m, WIN_HOLD + 0.05, { down: 1, still: false, calm: false });
  assert.equal(update(m, CARD_MAX - 0.05, { down: 1, still: false, calm: false }).card, false);
  assert.equal(update(m, 0.1, { down: 1, still: false, calm: false }).card, true);
  // no calm given (the tests' players): as still
  const p = newRound(1);
  update(p, WIN_HOLD + 0.05, { down: 1, still: true });
  assert.equal(update(p, CARD_HOLD + 0.05, { down: 1, still: true }).card, true);
  // one up again (a post leaning, not lying) starts the count again
  const w = newRound(2);
  update(w, 0.3, { down: 2, still: false });
  update(w, 0.02, { down: 1, still: false });
  assert.equal(update(w, WIN_HOLD - 0.05, { down: 2, still: false }).ended, null);
  assert.equal(update(w, 0.1, { down: 2, still: false }).ended.won, true);
  // a round kept before allDown was counted (2026-11-12) still ends; one kept ended before 10.3 (no card) gets none
  const old = { ...newRound(1) }; delete old.allDown;
  assert.equal(update(old, 0.4, { down: 1, still: true }).ended.won, true);
  const done = { ...newRound(1), result: { won: true, down: 1, total: 1, balls: 1 } }; delete done.card;
  assert.equal(update(done, 5, { down: 1, still: true, calm: true }).card, false);

  const s = newRound(7);
  for (let i = 0; i < BALLS; i++) { assert.ok(useBall(s).ok); update(s, 1, { down: 1, still: false }); }
  assert.equal(canThrow(s).why, 'no-balls');
  assert.equal(useBall(s).ok, false);
  assert.equal(update(s, END_WAIT - 1.01, { down: 1, still: true }).ended, null, 'over before the wait');
  assert.equal(update(s, 0.1, { down: 1, still: false }).ended, null, 'over while blocks move');
  const lost = update(s, 0.1, { down: 1, still: true });
  assert.deepEqual(lost.ended, { won: false, down: 1, total: 7, balls: 5 });
  assert.equal(lost.card, true, 'a scene lost: its card with its end');
  // never still: over anyway
  const t = newRound(3);
  for (let i = 0; i < BALLS; i++) { useBall(t); update(t, 1, { down: 0, still: false }); }
  assert.equal(update(t, END_MAX, { down: 0, still: false }).ended.won, false);
});

test('topple: the end card\'s words, and a face is needed', () => {
  const g = { level: 1, scene: 3, hearts: 2 };
  // the button says what it does; the jewels show where you are (2026-11-11)
  assert.deepEqual(endWords('won', g, 'Teddy'), { title: 'Teddy cleared it! 💎', next: 'Next ▸' });
  // every button an action: a verb or "Next" (no bare label like "Scene 3 of 5")
  for (const o of ['won', 'level', 'all', 'lost', 'out']) assert.match(endWords(o, g, 'Teddy').next, /^(Next|Play|Try|Start|Level \d ▸)/, o);
  assert.equal(endWords('level', g, 'Teddy').title, 'Level 1 done! 💎💎💎💎💎');
  assert.deepEqual(endWords('level', g, 'Teddy'), { title: 'Level 1 done! 💎💎💎💎💎', sub: 'On to The building site', next: 'Level 2 ▸' });
  assert.deepEqual(endWords('all', { ...g, level: 4 }, 'Teddy'), { title: 'All levels done! 💎', sub: 'More levels coming', next: 'Play again' });
  assert.equal(endWords('lost', { ...g, hearts: 1 }, 'Teddy').sub, '1 heart left');
  assert.equal(endWords('lost', g, 'Teddy').sub, '2 hearts left');
  assert.equal(endWords('out', g, 'Teddy').next, 'Start again');
  assert.throws(() => endWords('draw', g, 'Teddy'));
  assert.equal(checkSetup({ p1: 'bear' }), '');
  assert.equal(checkSetup({ p1: '' }), 'p1-missing');
  assert.equal(checkSetup({ p1: 'unicorn' }), 'unknown-face');
});

test('topple: the dots: one every 0.05 s for 0.3 s, stopping orange where the path touches sooner', () => {
  const pts = Array.from({ length: 200 }, (_, i) => [0, 1, -i / 100]);
  const free = dotsFor({ hits: [], pts });
  assert.equal(free.pts.length, 6);
  assert.deepEqual(free.pts[0], pts[6]);
  assert.equal(free.stopped, null);
  const hit = dotsFor({ hits: [{ kind: 'bush', t: 0.21, at: [0, 1, -0.5] }], pts });
  assert.equal(hit.stopped, 'bush');
  assert.equal(hit.pts.length, 5, '4 dots and the touch');
  assert.deepEqual(hit.pts.at(-1), [0, 1, -0.5]);
  assert.equal(dotsFor({ hits: [{ kind: 'block', t: 0.4, at: [0, 0, 0] }], pts }).stopped, null, 'a touch after 0.3 s isn\'t shown');
});

test('topple: how hard (Q96): Normal as before, Harder half the dots, Hardest Harder\'s dots for now (Q98)', () => {
  assert.deepEqual(MODES, ['normal', 'harder', 'hardest']);
  assert.deepEqual(MODES.map(m => MODE_INFO[m].name), ['Normal', 'Harder', 'Hardest']);
  // the seconds of dots, ball by ball (0 thrown, 1, 4)
  assert.deepEqual([0, 1, 4].map(u => dotSeconds('normal', u)), [0.3, 0.3, 0.3]);
  assert.deepEqual([0, 1, 4].map(u => dotSeconds('harder', u)), [0.15, 0.15, 0.15]);
  assert.deepEqual([0, 1, 4].map(u => dotSeconds('hardest', u)), [0.15, 0.15, 0.15], 'Hardest: dots for every ball (10.4: the first only)');
  assert.doesNotMatch(MODE_INFO.hardest.line, /first ball/, 'the setup\'s words changed with it');
  assert.equal(dotSeconds('nonsense', 2), 0.3, 'an unknown mode: Normal');
  // the dots themselves: 6 at Normal, 3 at Harder; a touch at 0.21 s shown at Normal, not at Harder
  const pts = Array.from({ length: 200 }, (_, i) => [0, 1, -i / 100]);
  assert.equal(dotsFor({ hits: [], pts }, dotSeconds('normal', 0)).pts.length, 6);
  assert.equal(dotsFor({ hits: [], pts }, dotSeconds('harder', 0)).pts.length, 3);
  const bush = { hits: [{ kind: 'bush', t: 0.21, at: [0, 1, -0.5] }], pts };
  assert.equal(dotsFor(bush, dotSeconds('normal', 0)).stopped, 'bush');
  assert.equal(dotsFor(bush, dotSeconds('harder', 0)).stopped, null);
});

test('topple: how hard is kept with the game: a new game Normal, New scenes and Start over keep it, one kept before Q96 Normal', () => {
  const g = createGame(5);
  assert.equal(g.mode, 'normal');
  g.mode = 'hardest';
  assert.equal(readGame(JSON.parse(JSON.stringify(g))).mode, 'hardest', 'kept on the device');
  assert.equal(createGame(6, g).mode, 'hardest', 'New scenes from scene 1');
  assert.equal(createGame(7, null, g.mode).mode, 'hardest', 'Start over');
  assert.equal(createGame(8, { ...g, mode: 'harder' }).mode, 'harder');
  assert.throws(() => createGame(9, null, 'easy'), /unknown mode/);
  const { mode, ...before } = g;
  assert.equal(readGame(before).mode, 'normal', 'a game kept before Q96');
  assert.equal(readGame({ ...g, mode: 'easy' }).mode, 'normal', 'an unknown one');
});

test('topple: the view takes in the whole scene and the slingshot, upright and sideways', () => {
  let checked = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const p = sceneParts(makeLayout(seed * 37, sceneOpts(seed === 6 ? 5 : 1)));
    for (const aspect of [393 / 600, 1.9]) {
      const b = behindView(aspect, p);
      assert.ok(b.fov > 10 && b.fov < 100, `fov ${b.fov}`);
      assert.deepEqual(b.pos, CAM);
      // every block's top corners inside the view's height (the pitch ± fov/2)
      for (const k of p.blocks) {
        const el = Math.atan2(k.y + k.h / 2 - CAM[1], CAM[2] - k.z) * R2D;
        assert.ok(el <= b.pitch + b.fov / 2 + 1e-6 && el >= b.pitch - b.fov / 2 - 1e-6, `a block out of view: ${el} vs ${b.pitch} ± ${b.fov / 2}`);
      }
      checked++;
    }
  }
  assert.equal(checked, 12);
});

// The map's road (Q81, 2026-11-12): your face walks it after a level, the
// dots filling in behind it.
const nearPt = (p, q, why) => assert.ok(Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9, `${why}: ${p} vs ${q}`);
test('topple: the map\'s road runs level to level; a point along it, and the part travelled, are on it', () => {
  assert.equal(MAP_NODES.length, MAX_LEVEL);
  for (let i = 1; i < MAX_LEVEL; i++) {
    const a = MAP_NODES[i - 1], b = MAP_NODES[i], P = mapRoad(a, b);
    nearPt(roadAt(P, 0), [a.x, a.y], `${i}: the start`);
    nearPt(roadAt(P, 1), [b.x, b.y], `${i}: the end`);
    for (const t of [0.1, 0.37, 0.5, 0.9]) {
      const part = roadTo(P, t);
      // the part travelled starts where the road does and ends where the face is
      nearPt(part[0], P[0], `${i}: t ${t}, its start`);
      nearPt(part[3], roadAt(P, t), `${i}: t ${t}, its end`);
      // and follows the road: its points a quarter and half way are the road's at t/4 and t/2 (halfway alone can't tell its middle two points apart)
      nearPt(roadAt(part, 0.25), roadAt(P, t / 4), `${i}: t ${t}, a quarter`);
      nearPt(roadAt(part, 0.5), roadAt(P, t / 2), `${i}: t ${t}, halfway`);
    }
    // inside the map's box
    for (let t = 0; t <= 1; t += 0.05) for (const v of roadAt(P, t)) assert.ok(v >= 0 && v <= 100, `${i}: off the map at ${t}`);
  }
});

test('topple: the blocks left glow after a pause (Q101): twice over 2 s, after 4 s waiting, then only after another 4', () => {
  assert.deepEqual([GLOW_WAIT, GLOW_PULSES, GLOW_PULSE_S], [4, 2, 1]);
  // dark while waiting; two bright pulses, dark between them and after
  for (const t of [0, 2, 3.99, 6, 8, 9.99, 12, 14]) assert.equal(glowAt(t), 0, `glowing at ${t} s`);
  near(glowAt(4.5), 1, 1e-9, 'first pulse at its brightest');
  near(glowAt(5), 0, 1e-9, 'between the pulses');
  near(glowAt(5.5), 1, 1e-9, 'second pulse');
  near(glowAt(10.5), 1, 1e-9, 'again after another wait');
  assert.ok(glowAt(4.1) > 0 && glowAt(4.1) < 0.2, 'fades in');
  // each glow counted once (the page logs it)
  assert.deepEqual([0, 3.9, 4, 5.9, 9.9, 10, 16].map(glowsBy), [0, 0, 1, 1, 1, 2, 3]);
  // waiting on the player: a ball thrown, none in flight, everything stopped, balls left, not over
  const r = newRound(5);
  assert.equal(waitingOn(r, true), false, 'before the first ball (the pad\'s show is for that)');
  useBall(r);
  assert.equal(waitingOn(r, true), false, 'the ball just thrown');
  r.since = READY_AFTER;
  assert.equal(waitingOn(r, true), true);
  assert.equal(waitingOn(r, false), false, 'blocks still moving');
  // something moving on and on (Q105): the count goes on anyway GLOW_STILL_MAX s after the ball is ready
  r.since = READY_AFTER + GLOW_STILL_MAX - 0.01;
  assert.equal(waitingOn(r, false), false, 'just before the most it waits for still');
  r.since = READY_AFTER + GLOW_STILL_MAX;
  assert.equal(waitingOn(r, false), true, 'still or not, from then on');
  assert.equal(GLOW_STILL_MAX, 3);
  r.result = { won: true };
  assert.equal(waitingOn(r, true), false, 'scene over');
  r.result = null; r.used = BALLS;
  assert.equal(waitingOn(r, true), false, 'no balls left: the scene ends anyway');
});
