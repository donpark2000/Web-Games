// Topple!'s levels 2-4 (src/core/topple-levels.js; DESIGN.md "Topple!"
// Levels): the building site, Frosty Times, Cactus Canyon. Under Node,
// seconds of physics, nothing written: every scene is made, passes the
// check and stands still, asleep; nothing in the way is within reach of
// the structure falling; the materials weigh and bounce as set; ice
// shatters and a barrel bursts at a hard knock (and not at a soft one), and
// stays broken when the scene is picked up again; a thing that hides a
// block for the whole scene is caught; every scene of two games can be won
// by a player throwing as a person can.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, touch } from '../src/core/topple-world.js';
import {
  SCALE, SCENES, LEVELS, MAX_LEVEL, MATS, frameLayout, layoutFor, sceneParts, launchVel, HAND, MAX_AIM, R2D, makeLayout, sceneOpts, FRAME_REACH,
} from '../src/core/topple.js';
import { canBeWon } from './topple-players.js';

const DT = 1 / 60;
const LATER = LEVELS.filter(l => l.n > 1);

test('topple levels: four levels, each later one five structures in a fixed order, its own things, the iron ball', () => {
  assert.equal(MAX_LEVEL, 4);
  for (const l of LATER) {
    assert.equal(l.scenes.length, SCENES, l.name);
    assert.equal(new Set(l.scenes).size, SCENES, `${l.name}: a structure twice`);
    assert.equal(l.ball, 'iron');
    // the order is the same in every game; the seed changes only small sizes and where things stand
    for (let i = 1; i <= SCENES; i++) {
      const a = frameLayout(111, l.n, i), b = frameLayout(222, l.n, i);
      assert.equal(a.stack, l.scenes[i - 1]);
      assert.equal(b.stack, l.scenes[i - 1]);
      assert.equal(a.blocks.length, b.blocks.length);
      assert.notDeepEqual(a.blocks, b.blocks, `${l.name} ${i}: two games' scenes the same`);
      // scenes 1 and 3 the soft thing, 2 and 4 the tall one, the 5th both
      assert.deepEqual(a.things.map(t => t.kind).sort(), (i === SCENES ? [l.soft, l.tall] : [i % 2 ? l.soft : l.tall]).sort(), `${l.name} ${i}`);
    }
  }
  assert.throws(() => frameLayout(1, 1, 1));
});

test('topple levels: every scene of two games is made, passes the check first time or nearly, and stands still for 5 s, asleep', () => {
  let n = 0;
  for (const seed of [12345, 2026]) for (const l of LATER) {
    const w = createWorld();
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, l.n, i), at = `${seed} ${l.name} ${i} ${s.layout.stack}`;
      n++;
      assert.ok(s.check.ok, `${at}: ${s.check.why}`);
      assert.ok(s.tries <= 15, `${at}: ${s.tries} tries`);
      assert.equal(s.layout.unplaced.length, 0, `${at}: no room for ${s.layout.unplaced}`);
      assert.equal(s.parts.level, l.n);
      assert.deepEqual(s.parts.ball, { r: 0.07, kg: 3 });
      assert.equal(w.awake(), 0, `${at}: awake at the start`);
      for (let k = 0; k < 300; k++) w.step(DT);
      assert.equal(w.awake(), 0, `${at}: woke with nothing touching it`);
      assert.ok(w.drift() < 1e-6, `${at}: moved ${w.drift()} m`);
      assert.equal(w.downCount(), 0, `${at}: a block fell`);
    }
  }
  assert.equal(n, 2 * 3 * SCENES);
});

// The structure falling whole reaches further than its tallest block: the
// things stand FRAME_REACH of its height away (journal, mockup v1), measured
// from the bodies as built, in plan view.
test('topple levels: nothing in the way stands within reach of the structure falling', () => {
  let checked = 0;
  for (const l of LATER) for (let i = 1; i <= SCENES; i++) for (const seed of [7, 8]) {
    const L = layoutFor(seed, l.n, i), p = sceneParts(L);
    const top = Math.max(...p.blocks.map(b => b.y + b.h / 2)) / SCALE;
    assert.ok(L.reach >= FRAME_REACH * top - 0.006, `${l.name} ${i}: reach ${L.reach} for a structure ${top} tall`);   // (the layout's reach is to the cm)
    const w = createWorld();
    w.setScene(p);
    const blk = w.blocks.map(b => ({ p: b.body.position, he: b.he }));
    const rect = { x0: Math.min(...blk.map(b => b.p.x - b.he.x)), x1: Math.max(...blk.map(b => b.p.x + b.he.x)), z0: Math.min(...blk.map(b => b.p.z - b.he.z)), z1: Math.max(...blk.map(b => b.p.z + b.he.z)) };
    const gapAt = (x, z) => Math.hypot(Math.max(rect.x0 - x, 0, x - rect.x1), Math.max(rect.z0 - z, 0, z - rect.z1)) / SCALE;
    for (const o of w.obstacles(b => b.kind !== 'block')) {
      // (a heap: a sphere's cap, as wide as it is where it meets the ground)
      const r = o.r !== undefined ? (o.c[1] < 0 ? Math.sqrt(o.r ** 2 - o.c[1] ** 2) : o.r) : o.R ?? Math.hypot(o.h[0], o.h[2]);
      const low = o.c[1] - (o.r ?? o.hh ?? o.h[1]);
      if (low / SCALE > L.reach) continue;   // out of reach above (a lamp, a high tier of branches)
      assert.ok(gapAt(o.c[0], o.c[2]) - r / SCALE >= L.reach - 0.02, `${l.name} ${i} (${seed}): a ${o.kind} ${(gapAt(o.c[0], o.c[2]) - r / SCALE).toFixed(2)} from the structure, reach ${L.reach}`);
      checked++;
    }
  }
  assert.ok(checked > 60, `only ${checked} parts measured`);
});

test('topple levels: the materials: wood lightest to steel heaviest; ice slippery; ice and barrels break, the rest never', () => {
  assert.ok(MATS.wood.density < MATS.brick.density && MATS.brick.density < MATS.concrete.density && MATS.concrete.density < MATS.steel.density);
  // ice slides (2026-11-12, Q84: cannon-es's friction acts 1/STEP x 4 its number; ice's is put back):
  // a lone cube on the ground pushed at 1 m/s slides at least 25 cm (friction 0.15: 0.34 m); wood hardly moves
  assert.ok(MATS.ice.slides && !MATS.wood.slides);
  const L3 = frameLayout(5, 3, 3), p3 = sceneParts(L3), lo = Math.min(...p3.blocks.map(b => b.y));
  const slid = mat => {
    const one = { ...p3, blocks: [{ ...p3.blocks.find(b => b.y < lo + 0.01), mat }] }, w = createWorld();
    w.setScene(one);
    const b = w.blocks[0].body;
    for (let i = 0; i < 60; i++) { b.wakeUp(); w.step(1 / 60); }
    const x0 = b.position.x;
    b.velocity.set(1, 0, 0);
    for (let i = 0; i < 300; i++) w.step(1 / 60);
    return b.position.x - x0;
  };
  const ice = slid('ice'), wood = slid('wood');
  assert.ok(ice > 0.25, `ice slid ${ice.toFixed(2)} m`);
  assert.ok(wood < 0.05, `wood slid ${wood.toFixed(2)} m`);
  for (const [k, m] of Object.entries(MATS)) assert.equal(!!m.breaks, k === 'ice' || k === 'barrel', k);
  // a steel post weighs more than a wooden one of the same size, in the world as built
  const w = createWorld();
  const post = (mat, x) => ({ w: 0.2, h: 0.9, d: 0.2, x, y: 0.452, z: -5, mat });
  w.setScene({ blocks: [post('wood', -1), post('steel', 1)], bodies: [], props: [], level: 2, ball: { r: 0.07, kg: 3 } });
  assert.ok(Math.abs(w.blocks[1].body.mass / w.blocks[0].body.mass - MATS.steel.density / MATS.wood.density) < 1e-9);
});

// The throw (from `fromUp`° up) whose path first touches what `hits` picks
// nearest the point `aim` (a hit at the middle, not a graze: the path's
// touch is checked at 4 points a step, and a graze it counts can miss).
function bestThrow(w, power, hits, aim, fromUp = 0) {
  let best = null;
  for (let up = fromUp; up <= 60; up += 1) for (let a = -0.7; a <= 0.7; a += 0.01) {
    const v = launchVel(power, a, up).vec, h = w.trace(v, 0).hits[0];
    if (!h || !hits(h)) continue;
    const d = Math.hypot(h.at[0] - aim[0], h.at[1] - aim[1], h.at[2] - aim[2]);
    if (!best || d < best.d) best = { v, d };
  }
  return best?.v ?? null;
}
// Throws at block i of a scene, at its middle, and the knock's speed. Returns { broke, down, speed, w, brokeFirst }.
function throwAt(parts, power, i, fromUp = 0, weak = 1) {
  let speed = 0;
  const w = createWorld({ onHit: h => { if (h.a === 'ball' && h.b === 'block' && !speed) speed = h.v; } });
  w.setScene(parts);
  const target = w.blocks[i].body, c = target.position;
  const vec = bestThrow(w, power, h => h.body === target, [c.x, c.y, c.z], fromUp);
  assert.ok(vec, `no throw reaches block ${i} first`);
  w.throwBall(vec.map(v => v * weak));
  let broke = 0;
  for (let k = 0; k < 240; k++) broke += w.step(DT).broke.length;
  return { broke, down: w.downCount(), speed, w, brokeFirst: w.blocks[i].broken };
}

test('topple levels: ice shatters and a barrel bursts when hit hard, gone and down for good; a soft knock leaves it', () => {
  // the ice gate's left pillar, and the trestle's left barrel
  for (const [lv, name, i, mat] of [[3, 'iceGate', 0, 'ice'], [4, 'trestle', 0, 'barrel']]) {
    const L = frameLayout(31, lv, LEVELS[lv - 1].scenes.indexOf(name) + 1), p = sceneParts(L);
    assert.equal(p.blocks[i].mat, mat);
    const hard = throwAt(p, L.power, i, 8);
    assert.ok(hard.speed >= MATS[mat].breaks, `${mat}: knocked at only ${hard.speed.toFixed(1)} m/s`);
    assert.ok(hard.brokeFirst, `${mat}: not broken by a ${hard.speed.toFixed(1)} m/s knock`);
    assert.ok(hard.down >= 1);
    // broken: out of the world, out of the path and the view
    assert.ok(!hard.w.world.bodies.includes(hard.w.blocks[i].body));
    assert.ok(!hard.w.obstacles().some(o => o.body === hard.w.blocks[i].body));
    assert.equal(hard.w.frontSeen()[i], 0);
    // picked up again: still broken, still down
    const poses = JSON.parse(JSON.stringify(hard.w.poses()));
    assert.equal(poses[i].broken, true);
    const w2 = createWorld();
    w2.setScene(p, poses);
    assert.equal(w2.blocks[i].broken, true);
    assert.equal(w2.downCount(), hard.down);
    assert.ok(!w2.world.bodies.includes(w2.blocks[i].body));
    // a soft knock (a slow ball) leaves it whole
    const soft = throwAt(p, L.power, i, 8, 0.25);
    assert.ok(soft.speed < MATS[mat].breaks, `${mat}: the soft throw knocked at ${soft.speed.toFixed(1)}`);
    assert.equal(soft.brokeFirst, false, `${mat}: broken by a ${soft.speed.toFixed(1)} m/s knock`);
  }
  // a steel post hit as hard never breaks
  const L = frameLayout(31, 2, 1), p = sceneParts(L), i = p.blocks.findIndex(b => b.mat === 'steel');
  assert.equal(throwAt(p, L.power, i, 4).brokeFirst, false);
});

// Developer, 2026-11-12 (Q83): a cube that fell whole looked the same as a
// ground cube still to knock down. Ice counted down shatters as it lands;
// ice that only slid stays whole and standing.
test('topple levels: ice that falls shatters as it lands; ice pushed along the ground stays whole and standing', () => {
  const DT = 1 / 60;
  const L = frameLayout(5, 3, 3), p = sceneParts(L);
  assert.equal(L.stack, 'icePyramid');
  const run = (w, s) => { for (let t = 0; t < s; t += DT) w.step(DT); };
  // the top cube moved off its support: it drops a row or more
  let w = createWorld(); w.setScene(p);
  const top = w.blocks.reduce((a, b) => (b.start.y > a.start.y ? b : a));
  top.body.position.x += 0.5; for (const b of w.blocks) b.body.wakeUp();
  run(w, 4);
  assert.ok(top.broken, `the top cube fell whole (down ${top.down})`);
  // a cube turned onto its side where it stands (tipped over, no hard knock: 2.2 m/s never reached): shattered
  w = createWorld(); w.setScene(p);
  const tip = w.blocks.reduce((a, b) => (b.start.y > a.start.y ? b : a));
  tip.body.quaternion.setFromEuler(0, 0, Math.PI / 2); tip.body.wakeUp();
  run(w, 2);
  assert.ok(tip.broken, `a cube tipped over stayed whole (down ${tip.down})`);
  // a ground cube at the end of the row pushed sideways (the cube above holds it: it moves 10 cm): whole and standing
  w = createWorld(); w.setScene(p);
  const low = Math.min(...w.blocks.map(b => b.start.y));
  const end = w.blocks.filter(b => b.start.y < low + 0.01).reduce((a, b) => (b.start.x > a.start.x ? b : a));
  end.body.wakeUp(); end.body.velocity.set(2.5, 0, 0);
  run(w, 3);
  assert.ok(Math.abs(end.body.position.x - end.start.x) > 0.05, 'it never moved');
  assert.equal(end.broken, false, 'a slid cube shattered');
  assert.equal(end.down, false, 'a slid cube counted down');
});

// Developer, 2026-11-12: the snow heap, then a drift, didn't look real;
// "maybe a rock with a bit of snow on top and/or one side".
test('topple levels: level 3 has a snowy rock in the way, low and placed as the heap was, the ball\'s cap under it', () => {
  assert.equal(LEVELS[2].soft, 'rock');
  let rocks = 0;
  for (let seed = 1; seed <= 12; seed++) for (let sc = 1; sc <= SCENES; sc++) {
    for (const t of frameLayout(seed, 3, sc).things.filter(q => q.kind === 'rock')) {
      rocks++;
      assert.ok(t.rx >= 0.3 && t.rx <= 0.36 && t.rz >= 0.24 && t.rz <= 0.28 && t.H >= 0.19 && t.H <= 0.23, `${seed}/${sc}: size ${t.rx} x ${t.rz} x ${t.H}`);
      assert.deepEqual(t.parts, [{ x: t.x, z: t.z, r: (t.rx + t.rz) / 2 }]);
      const body = sceneParts(frameLayout(seed, 3, sc)).bodies.find(b => b.thing === 'rock');
      const cap = body.shapes[0];
      assert.ok(Math.abs(cap.at[1] + cap.r - t.H * SCALE) < 1e-9, `${seed}/${sc}: the cap's top not the rock's`);
    }
  }
  assert.ok(rocks >= 30, `only ${rocks} rocks checked`);
});

test('topple levels: the gravel and the snow catch the ball: it keeps a tenth of its speed and stays', () => {
  for (const [lv, kind] of [[2, 'barrow'], [3, 'rock']]) {
    const L = frameLayout(17, lv, 1), p = sceneParts(L);
    assert.ok(L.things.some(t => t.kind === kind));
    let before = 0, after = null;
    const w = createWorld({ onHit: h => { if (h.a === 'ball' && h.b === 'soft' && after === null) { after = h.ball.velocity.length(); } } });
    w.setScene(p);
    const soft = w.obstacles(b => b.kind === 'soft')[0];
    // at the heap's (or the tray's) top, over its middle
    const top = soft.r !== undefined ? soft.c[1] + soft.r : soft.c[1] + soft.h[1];
    const vec = bestThrow(w, L.power, h => h.kind === 'soft', [soft.c[0], top, soft.c[2]]);
    assert.ok(vec, `${kind}: no throw reaches it`);
    const ball = w.throwBall(vec);
    for (let k = 0; k < 240; k++) { if (after === null) before = ball.velocity.length(); w.step(DT); }
    assert.ok(after !== null, `${kind}: never touched`);
    assert.ok(after <= 0.15 * before, `${kind}: kept ${(after / before).toFixed(2)} of its speed`);
    const moved = Math.hypot(ball.position.x - soft.c[0], ball.position.z - soft.c[2]);
    assert.ok(moved < 1.0, `${kind}: the ball ended ${moved.toFixed(2)} m from it`);
  }
});

test('topple levels: touch() finds a barrel lying on its side (a turned cylinder) and nothing past its end', () => {
  const s = Math.SQRT1_2, lying = { type: 0, c: [0, 0.3, 0], q: [0, 0, s, s], R: 0.3, hh: 0.4, rad: 0.5 };   // turned 90° about z: along x
  assert.ok(touch([0.3, 0.65, 0], lying, 0.07), 'just over its side');
  assert.equal(touch([0.3, 0.68, 0], lying, 0.07), null, 'clear of its side');
  assert.ok(touch([0.46, 0.3, 0], lying, 0.07), 'at its end');
  assert.equal(touch([0.48, 0.3, 0], lying, 0.07), null, 'past its end');
  assert.deepEqual(touch([0, 0.65, 0], lying, 0.07).n.map(v => +v.toFixed(6) + 0), [0, 1, 0]);
});

// Developer, Q73: blocks may hide behind other blocks until they fall, but
// none behind a thing for the whole scene. The saloon's front barrels behind
// the scrub (the check loosened for a while) were never hit: such a layout
// is thrown away.
test('topple levels: a thing that hides a block for the whole scene is caught by the check', () => {
  const L = frameLayout(21, 4, 5), p = sceneParts(L);
  const w = createWorld();
  w.setScene(p);
  assert.ok(w.check(L).ok, w.check(L).why);
  // the scrub moved right in front of the front barrels, on the line from the camera
  // the scrub made one big ball, half way along the line from the camera to the front barrel's middle
  const scrub = p.bodies.find(b => b.thing === 'scrub'), front = p.blocks[0];
  const cam = [0.55, 1.95, 0.9], k = 0.5;
  scrub.shapes = [{ type: 'sphere', r: 0.55, at: [0, 1, 2].map(j => cam[j] + ([front.x, front.y, front.z][j] - cam[j]) * k) }];
  w.setScene(p);
  const c = w.check(L);
  assert.equal(w.frontSeen()[0], 0, 'the front barrel still seen');
  assert.equal(c.ok, false);
  assert.match(c.why, /too little shows from the front/);
});

// Pass criteria (journal, "Level 2's scenes" and "Levels 2-4 balanced"):
// every scene can be won. Players throw at a random block they can see,
// up to 12 a scene (the win rates themselves: tools in the journal).
test('topple levels: every scene of two games can be won by a player throwing as a person can', () => {
  const rows = [];
  for (const seed of [12345, 404]) for (const l of LATER) {
    const w = createWorld();
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, l.n, i);
      rows.push({ at: `${seed} ${l.name} ${i} ${s.layout.stack}`, ...canBeWon(s, seed * 31 + i, 1, 12) });
    }
  }
  const summary = rows.filter(r => !r.won).map(r => `${r.at}: NOT WON by ${r.players} (best ${r.best}/${r.total})`).join('; ');
  assert.equal(rows.length, 2 * 3 * SCENES);
  assert.equal(rows.filter(r => !r.won).length, 0, summary);
});

test('topple levels: level 1 is as it was: its layouts don\'t change (the toy blocks, no material, the painted ball)', () => {
  const L = makeLayout(4242, sceneOpts(1)), p = sceneParts(L);
  assert.ok(p.blocks.every(b => b.mat === 'toy' && b.shape === 'box'));
  assert.deepEqual(p.ball, { r: 0.06, kg: 2 });
  assert.equal(p.level, 1);
  assert.deepEqual(layoutFor(4242, 1, 5), makeLayout(layoutFor(4242, 1, 5).seed, sceneOpts(5)));
  // its blocks as level 1's always were: the toy material's weight (27 kg/m³)
  const w = createWorld();
  w.setScene(p);
  const b = w.blocks[0], o = p.blocks[0];
  assert.ok(Math.abs(b.body.mass - 27 * o.w * o.h * o.d) < 1e-9);
});
