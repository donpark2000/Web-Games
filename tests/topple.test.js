// Topple!'s rules, scenes and camera (src/core/topple.js): the drag's
// aiming in both views (mockup v8's checks), a block down, the game's
// jewels and hearts, a scene's end, what's kept on the device, the dots,
// the views fitted to a scene, and scenes 1-4 dealt so neighbours differ. Pure functions, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HAND, CAM, SCALE, MAX_UP, MAX_AIM, R2D, BALLS, SCENES, HEARTS, STACKS, SIZE, KINDS, READY_AFTER, END_WAIT, END_MAX,
  makeLayout, sceneOpts, sceneSeed, levelPlan, sceneChoice, sceneParts, frontDrag, sideDrag, launchVel, isDown, createGame, readGame, sceneOver,
  newRound, useBall, canThrow, update, endWords, dotsFor, behindView, sideView, dotScaleFor, checkSetup, rng,
  PAD, DEMO, DEMO_UPS, padSpot, dragFrom, demoDrag, demoAt,
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
  assert.ok(checked >= 13, `only ${checked} ground blocks`);
  assert.deepEqual(sceneOpts(1).stacks, ['arch', 'posts', 'pyramid']);
  assert.deepEqual(sceneOpts(4), sceneOpts(1));
  assert.deepEqual(sceneOpts(5), { n: 2, stacks: ['tower', 'fence'] });
});

// Developer, 2026-11-10: "Sometimes there seemed to be no difference
// between scenes" (their game 1288553953: scenes 1-3 all an arch behind a
// bush). Picked each on its own, 97 of 300 neighbouring scenes had the same
// structure, 32 the same structure and thing.
test('topple: scenes 1-4 dealt per game: never the same structure twice in a row, no structure and thing twice', () => {
  const stacks = sceneOpts(1).stacks;
  let games = 0;
  const seenStack = new Set(), seenThing = new Set();
  for (let g = 1; g <= 500; g++) for (const level of [1, 2]) {
    const plan = levelPlan(g * 7919, level);
    assert.equal(plan.length, SCENES - 1);
    assert.deepEqual(levelPlan(g * 7919, level), plan, `${g}/${level}: not the same each time`);
    plan.forEach((c, i) => {
      assert.ok(stacks.includes(c.stack) && KINDS.includes(c.thing), `${g}: ${JSON.stringify(c)}`);
      seenStack.add(c.stack); seenThing.add(c.thing);
      if (i) assert.notEqual(c.stack, plan[i - 1].stack, `${g}/${level}: scenes ${i} and ${i + 1} both ${c.stack}`);
    });
    assert.equal(new Set(plan.map(c => `${c.stack}+${c.thing}`)).size, plan.length, `${g}/${level}: a pair twice: ${JSON.stringify(plan)}`);
    games++;
  }
  assert.equal(games, 1000);
  assert.equal(seenStack.size, 3); assert.equal(seenThing.size, 3);
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
    assert.ok(['tower', 'fence'].includes(L.stack));
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

test('topple: from the side, drag the way the ball goes: its direction how high, its length how hard', () => {
  const size = 400, stand = { x: 0.6, z: -5.6 };
  const d = sideDrag(150, -100, size, 0.5, stand);
  near(d.up, Math.atan2(100, 150) * R2D, 1e-9, 'up');
  near(d.up, 34, 0.5, 'up');
  assert.ok(d.ok && d.show);
  near(d.aim, Math.atan2(stand.x - HAND.x, HAND.z - stand.z) * R2D / MAX_AIM, 1e-12, 'straight at the structure');
  const softer = sideDrag(75, -50, size, 0.5, stand);
  near(softer.up, d.up, 1e-9, 'the same angle');
  assert.ok(softer.power < d.power, 'a shorter drag isn\'t softer');
  assert.equal(sideDrag(200, 0, size, 0.5, stand).up, 0, 'straight right: flat');
  assert.equal(sideDrag(-150, 100, size, 0.5, stand).up, 0, 'left and down (v7\'s pull back): flat');
  assert.equal(sideDrag(0, -300, size, 0.5, stand).up, MAX_UP, 'straight up: 70°');
  // 0.4-1.15 times the front view's speed
  const v = p => 2 + p * 8;
  near(v(sideDrag(0.4 * size, 0, size, 0.5, stand).power) / v(0.5), 1.15, 1e-9, 'full');
  assert.equal(sideDrag(10, 0, size, 0.5, stand).ok, false, 'a short drag threw');
});

// The drag pad (journal, "9.2 on the phone; home pictures and aiming", Q67).
test('topple: the drag pad sits low, on the right from behind and the left from the side, inside the park', () => {
  let checked = 0;
  // an upright phone's park (393 x 760 screen), a sideways one, a tablet's
  for (const [w, h] of [[377, 592], [760, 377], [740, 900]]) {
    const s = Math.min(w, h), f = padSpot('front', w, h), sd = padSpot('side', w, h);
    for (const p of [f, sd]) {
      assert.ok(p.x - p.r >= 0 && p.x + p.r <= w && p.y - p.r >= 0 && p.y + p.r <= h, `${w}x${h}: the pad runs off the park`);
      assert.ok(p.y > h / 2, `${w}x${h}: the pad isn't low`);
      // over the park's foot: the view switch (44 px tall, 8 px up) and the hint
      assert.ok(p.y + p.r <= h - 56, `${w}x${h}: the pad is over the view switch or hint`);
      checked++;
    }
    assert.ok(f.x > w / 2 && sd.x < w / 2, `${w}x${h}: front on the right, side on the left`);
    // room to drag: from behind 0.4 of s up; from the side 0.3 of s to the right
    assert.ok(f.y - 0.4 * s >= 0 && sd.x + 0.3 * s <= w, `${w}x${h}: no room for a full drag`);
  }
  assert.equal(checked, 6);
  assert.equal(padSpot('front', 200, 200).r, PAD.rMin, 'a small park: the smallest pad');
  assert.equal(padSpot('front', 2000, 1500).r, PAD.rMax, 'a big park: the biggest pad');
  assert.equal(padSpot('front', 0, 500), null, 'a park of no size');
});

test('topple: where a drag started: the pad, the ball, or elsewhere', () => {
  const pad = { x: 300, y: 450, r: 38 }, ball = { x: 80, y: 500 };
  assert.equal(dragFrom(300, 450, pad, ball), 'pad');
  assert.equal(dragFrom(300 + 38 * 1.25, 450, pad, ball), 'pad', 'just off its edge still counts');
  assert.equal(dragFrom(300 + 38 * 1.4, 450, pad, ball), 'elsewhere');
  assert.equal(dragFrom(100, 520, pad, ball), 'ball');
  assert.equal(dragFrom(200, 200, pad, ball), 'elsewhere');
  assert.equal(dragFrom(200, 200, null, null), 'elsewhere', 'before the park is drawn');
});

test('topple: the pad\'s show: a finger drags from it twice, the dots following, aimed at the structure', () => {
  const size = 377, stand = { x: 0.6, z: -5.6 };
  const to = demoDrag('front', size, stand), d = frontDrag(to.dx, to.dy, size, 0.5);
  near(d.up, 30, 1e-9, 'up');
  near(d.aim * MAX_AIM, Math.atan2(stand.x - HAND.x, HAND.z - stand.z) * R2D, 1e-9, 'aimed at the structure');
  assert.ok(d.ok);
  assert.equal(frontDrag(...Object.values(demoDrag('front', size, { x: 50, z: -1 })), size, 0.5).aim, 1, 'far off to one side: full aim');
  const side = sideDrag(...Object.values(demoDrag('side', size, stand)), size, 0.5, stand);
  near(side.up, 35, 1e-9, 'side: up');
  assert.ok(side.ok && side.pull === 0.75, 'side: three quarters as hard');
  // the other angles tried, for a show whose path touches a block first
  for (const v of ['front', 'side']) {
    assert.equal(DEMO_UPS[v][0], v === 'side' ? 35 : 30);
    for (const up of DEMO_UPS[v]) {
      const t = demoDrag(v, size, stand, up), dd = v === 'side' ? sideDrag(t.dx, t.dy, size, 0.5, stand) : frontDrag(t.dx, t.dy, size, 0.5);
      near(dd.up, up, 1e-9, `${v} ${up}°`);
      assert.ok(dd.ok, `${v} ${up}°: too short to throw`);
    }
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

test('topple: a game: a jewel and the next scene; a heart and the same scene; the last heart back to scene 1', () => {
  const g = createGame(77);
  assert.deepEqual(g, { seed: 77, level: 1, scene: 1, hearts: HEARTS, jewels: 0 });
  assert.equal(sceneOver(g, true), 'won');
  assert.deepEqual([g.scene, g.jewels, g.hearts], [2, 1, 3]);
  assert.equal(sceneOver(g, false), 'lost');
  assert.deepEqual([g.scene, g.jewels, g.hearts], [2, 1, 2]);
  assert.equal(sceneOver(g, false), 'lost');
  assert.equal(sceneOver(g, false), 'out');
  assert.deepEqual(g, { seed: 77, level: 1, scene: 1, hearts: HEARTS, jewels: 0 }, 'the same scenes: the seed kept');
  for (let i = 1; i < SCENES; i++) assert.equal(sceneOver(g, true), 'won');
  assert.equal(g.scene, SCENES);
  assert.equal(sceneOver(g, true), 'level');
  assert.throws(() => createGame(0));
  assert.throws(() => createGame(1.5));
});

test('topple: a game kept on the device is used only if it makes sense', () => {
  const g = createGame(5);
  assert.deepEqual(readGame(JSON.parse(JSON.stringify(g))), g);
  assert.deepEqual(readGame({ ...g, extra: 1 }), g);
  for (const bad of [null, 'x', {}, { ...g, seed: 0 }, { ...g, scene: 6 }, { ...g, scene: 0 }, { ...g, hearts: 0 }, { ...g, hearts: 4 }, { ...g, jewels: 5 }, { ...g, level: 2 }, { ...g, scene: '2' }]) {
    assert.equal(readGame(bad), null, JSON.stringify(bad));
  }
});

test('topple: a scene: 5 balls, the next 0.9 s after a throw; cleared once all are down for 0.35 s; out of balls once still', () => {
  const r = newRound(5);
  assert.ok(canThrow(r).ok);
  assert.deepEqual(useBall(r), { ok: true, ball: 1 });
  assert.equal(canThrow(r).why, 'not-ready');
  update(r, READY_AFTER + 0.01, { down: 2, still: false });
  assert.ok(canThrow(r).ok);
  assert.equal(r.down, 2);
  // all down: not at once (one may be still falling past)
  assert.equal(update(r, 0.2, { down: 5, still: false }).ended, null);
  assert.equal(update(r, 0.2, { down: 5, still: false }).ended.won, true);
  assert.deepEqual(r.result, { won: true, down: 5, total: 5, balls: 1 });
  assert.equal(canThrow(r).why, 'scene-over');

  const s = newRound(7);
  for (let i = 0; i < BALLS; i++) { assert.ok(useBall(s).ok); update(s, 1, { down: 1, still: false }); }
  assert.equal(canThrow(s).why, 'no-balls');
  assert.equal(useBall(s).ok, false);
  assert.equal(update(s, END_WAIT - 1.01, { down: 1, still: true }).ended, null, 'over before the wait');
  assert.equal(update(s, 0.1, { down: 1, still: false }).ended, null, 'over while blocks move');
  assert.deepEqual(update(s, 0.1, { down: 1, still: true }).ended, { won: false, down: 1, total: 7, balls: 5 });
  // never still: over anyway
  const t = newRound(3);
  for (let i = 0; i < BALLS; i++) { useBall(t); update(t, 1, { down: 0, still: false }); }
  assert.equal(update(t, END_MAX, { down: 0, still: false }).ended.won, false);
});

test('topple: the end card\'s words, and a face is needed', () => {
  const g = { level: 1, scene: 3, hearts: 2 };
  assert.deepEqual(endWords('won', g, 'Teddy'), { title: 'Teddy cleared it! 💎', next: 'Scene 3 of 5' });
  assert.equal(endWords('level', g, 'Teddy').title, 'Level 1 done! 💎💎💎💎💎');
  assert.equal(endWords('lost', { ...g, hearts: 1 }, 'Teddy').sub, '1 heart left');
  assert.equal(endWords('lost', g, 'Teddy').sub, '2 hearts left');
  assert.equal(endWords('out', g, 'Teddy').next, 'Start again');
  assert.throws(() => endWords('draw', g, 'Teddy'));
  assert.equal(checkSetup({ p1: 'bear' }), '');
  assert.equal(checkSetup({ p1: '' }), 'p1-missing');
  assert.equal(checkSetup({ p1: 'unicorn' }), 'unknown-face');
});

test('topple: the dots: one every 0.05 s for ½ s, stopping orange where the path touches sooner', () => {
  const pts = Array.from({ length: 200 }, (_, i) => [0, 1, -i / 100]);
  const free = dotsFor({ hits: [], pts });
  assert.equal(free.pts.length, 10);
  assert.deepEqual(free.pts[0], pts[6]);
  assert.equal(free.stopped, null);
  const hit = dotsFor({ hits: [{ kind: 'bush', t: 0.21, at: [0, 1, -0.5] }], pts });
  assert.equal(hit.stopped, 'bush');
  assert.equal(hit.pts.length, 5, '4 dots and the touch');
  assert.deepEqual(hit.pts.at(-1), [0, 1, -0.5]);
  assert.equal(dotsFor({ hits: [{ kind: 'block', t: 0.9, at: [0, 0, 0] }], pts }).stopped, null, 'a touch after ½ s isn\'t shown');
});

test('topple: the views take in the whole scene and the slingshot, upright and sideways', () => {
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
      const s = sideView(aspect, p);
      assert.ok(s.pos[0] > p.bounds.max[0], 'the side camera isn\'t to the right');
      assert.ok(dotScaleFor('side', s) >= 1 && dotScaleFor('side', s) <= 8);
      checked++;
    }
  }
  assert.equal(checked, 12);
  assert.equal(dotScaleFor('front', { dist: 30 }), 1);
});
