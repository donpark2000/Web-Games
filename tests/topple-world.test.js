// Topple!'s physics, path and scene check (src/core/topple-world.js) under
// Node, checking what the mockup's scripts checked in the browser (journal,
// "Block game mockup v7" and "Mockup v8 tried"; the scripts kept in the
// testing folder): every scene stands still, asleep; nothing a falling block
// could lean on is within its reach, measured from the bodies; a scene comes
// out the same each time; the path's first touch is where the ball touches;
// a perfect-aim player clears most scenes, leaving no block upright against
// a thing; every scene can be won by a player throwing only as a person can
// (at what it sees from behind, straight from the side). Seconds of physics,
// nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, touch, BUSH_KEEP } from '../src/core/topple-world.js';
import {
  SCALE, HAND, BALL, MAX_AIM, MAX_UP, R2D, SCENES, launchVel, sideDrag, newRound, useBall, update, canThrow, sceneParts, makeLayout, sceneOpts, rng,
} from '../src/core/topple.js';

const DT = 1 / 60;
const GAMES = [12345, 777, 4242];

test('topple world: every scene of three games is made, checked and stands still for 5 s, asleep', () => {
  let made = 0, ok = 0;
  for (const seed of GAMES) {
    const w = createWorld();
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 1, i);
      made++;
      if (s.check.ok) ok++;
      assert.equal(w.blocks.length, s.parts.blocks.length);
      assert.equal(w.awake(), 0, `${seed}/${i}: blocks awake at the start`);
      for (let k = 0; k < 300; k++) w.step(DT);
      assert.equal(w.awake(), 0, `${seed}/${i}: blocks woke with nothing touching them`);
      assert.ok(w.drift() < 1e-6, `${seed}/${i}: blocks moved ${w.drift()} m`);
      assert.equal(w.downCount(), 0, `${seed}/${i}: a block fell`);
      // scene 5: two things and a bigger structure
      assert.equal(s.layout.n, i < SCENES ? 1 : 2);
      assert.ok(s.layout.things.length >= 1, `${seed}/${i}: nothing in the way`);
    }
  }
  assert.equal(made, 15);
  assert.ok(ok >= 14, `only ${ok} of ${made} scenes passed the check`);
});

test('topple world: a scene is the same every time it\'s made, and another scene or game is not', () => {
  const a = createWorld().makeScene(777, 1, 3), b = createWorld().makeScene(777, 1, 3);
  assert.deepEqual(a.layout, b.layout);
  assert.deepEqual(a.check, b.check);
  const c = createWorld().makeScene(777, 1, 4), d = createWorld().makeScene(778, 1, 3);
  assert.notDeepEqual(c.layout.blocks, a.layout.blocks);
  assert.notDeepEqual(d.layout.blocks, a.layout.blocks);
});

// The reach (mockup v7): every part of a thing low enough for a falling
// block to lean on stands at least the tallest block plus 10 cm (Near
// metres) from the structure's footprint, in plan view, measured from the
// physics bodies as built, not the layout's own numbers.
function measureReach(w) {
  const blk = w.blocks.map(b => ({ p: b.body.position, he: b.body.shapes[0].halfExtents }));
  const rect = {
    x0: Math.min(...blk.map(b => b.p.x - b.he.x)), x1: Math.max(...blk.map(b => b.p.x + b.he.x)),
    z0: Math.min(...blk.map(b => b.p.z - b.he.z)), z1: Math.max(...blk.map(b => b.p.z + b.he.z)),
  };
  const reach = Math.max(...blk.map(b => 2 * b.he.y)) / SCALE + 0.1;
  const gapAt = (x, z) => Math.hypot(Math.max(rect.x0 - x, 0, x - rect.x1), Math.max(rect.z0 - z, 0, z - rect.z1)) / SCALE;
  let min = Infinity, parts = 0;
  for (const o of w.obstacles(b => b.kind !== 'block')) {
    let low, gap;
    if (o.r !== undefined) { low = o.c[1] - o.r; gap = gapAt(o.c[0], o.c[2]) - o.r / SCALE; } else if (o.R !== undefined) { low = o.c[1] - o.hh; gap = gapAt(o.c[0], o.c[2]) - o.R / SCALE; } else {
      // a box turned about the upright: its outline in plan view
      low = o.c[1] - o.h[1];
      const yaw = 2 * Math.atan2(o.q[1], o.q[3]), ux = [Math.cos(yaw), -Math.sin(yaw)], uz = [Math.sin(yaw), Math.cos(yaw)];
      gap = Infinity;
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
        if (Math.abs(i) !== 4 && Math.abs(j) !== 4) continue;
        gap = Math.min(gap, gapAt(o.c[0] + ux[0] * o.h[0] * i / 4 + uz[0] * o.h[2] * j / 4, o.c[2] + ux[1] * o.h[0] * i / 4 + uz[1] * o.h[2] * j / 4));
      }
    }
    if (low / SCALE < reach) { parts++; min = Math.min(min, gap); }
  }
  return { reach, min, parts };
}

test('topple world: nothing a falling block could lean on is within its reach (40 scenes, every kind of thing)', () => {
  const w = createWorld();
  let checked = 0, parts = 0;
  for (const pool of [['bush'], ['tree'], ['backboard'], ['bush', 'tree', 'backboard']]) {
    for (let seed = 1; seed <= 10; seed++) {
      const L = makeLayout(seed * 7919, sceneOpts(seed % 5 === 0 ? 5 : 1), pool);
      w.setScene(sceneParts(L));
      const m = measureReach(w);
      if (m.parts) assert.ok(m.min >= m.reach - 0.005, `${pool}/${seed}: a part ${m.min.toFixed(3)} m from the structure, reach ${m.reach.toFixed(3)}`);
      checked++; parts += m.parts;
    }
  }
  assert.equal(checked, 40);
  assert.ok(parts > 100, `only ${parts} low parts measured`);
});

test('topple world: the measure catches a thing within reach (a pole moved next to the structure)', () => {
  const L = makeLayout(4, sceneOpts(1), ['backboard']);
  const p = sceneParts(L);
  const pole = p.bodies.find(b => b.kind === 'stand');
  const s = p.blocks[0];
  pole.shapes[0].at = [s.x + s.w / 2 + 0.1, pole.shapes[0].at[1], s.z];
  const w = createWorld();
  w.setScene(p);
  const m = measureReach(w);
  assert.ok(m.min < m.reach - 0.005, `not caught: ${m.min} against ${m.reach}`);
});

test('topple world: the path\'s first touch is where the thrown ball first touches', () => {
  const w = createWorld();
  const touches = [];
  const ww = createWorld({ onHit: h => { if (h.a === 'ball' && touches.length < 1) touches.push({ kind: h.b, at: [h.ball.position.x, h.ball.position.y, h.ball.position.z] }); } });
  let checked = 0;
  for (const i of [1, 2, 3, 4, 5]) {
    const s = w.makeScene(12345, 1, i);
    ww.setScene(s.parts);
    // aimed at the structure's middle, 15° up
    const st = s.parts.stand, aim = Math.atan2(st.x - HAND.x, HAND.z - st.z) * R2D / MAX_AIM;
    const { vec } = launchVel(s.layout.power, aim, 15);
    const pred = ww.trace(vec, 0).hits[0];
    touches.length = 0;
    ww.throwBall(vec);
    for (let k = 0; k < 180 && !touches.length; k++) ww.step(DT);
    assert.ok(pred && touches.length, `scene ${i}: no touch`);
    assert.equal(touches[0].kind, pred.kind, `scene ${i}: touched ${touches[0].kind}, the path said ${pred.kind}`);
    const off = Math.hypot(...touches[0].at.map((v, j) => v - pred.at[j]));
    assert.ok(off < 0.15, `scene ${i}: ${(off * 100).toFixed(1)} cm from the path's touch`);
    checked++;
  }
  assert.equal(checked, 5);
});

// Developer, 2026-11-10: "if a ball hit a bush it would just fall to the
// ground". Throws straight at the bush (flat and a little up) of 8 layouts;
// a throw at a block, as the same check, still bounces.
function bushThrow(seed, up, at = 'bush') {
  let touched = null, landed = null, before = 0;
  const w = createWorld({
    onHit: h => {
      if (h.a !== 'ball') return;
      if (!touched) touched = { kind: h.b, at: [h.ball.position.x, h.ball.position.z] };
      else if (!landed && h.b === 'ground') landed = [h.ball.position.x, h.ball.position.y, h.ball.position.z];
    },
  });
  const L = makeLayout(seed, sceneOpts(1), ['bush']);
  w.setScene(sceneParts(L));
  const st = w.parts.stand, aim = Math.atan2(st.x - HAND.x, HAND.z - st.z) * R2D / MAX_AIM;
  // a throw at the middle whose first touch is `at`: the bush, or a block over it
  let vec = null;
  for (let u = up; u <= 70 && !vec; u += 1) { const v = launchVel(L.power, aim, u).vec; if (w.trace(v, 0).hits[0]?.kind === at) vec = v; }
  if (!vec) return null;
  const ball = w.throwBall(vec);
  let after = null, k = 0;
  for (; k < 240; k++) {
    const speed = ball.velocity.length();
    w.step(DT);
    if (touched && after === null) { before = speed; after = ball.velocity.length(); }
  }
  const p = ball.position, path = w.trace(vec, 1).hits;
  return {
    kind: touched.kind, keep: after / before, onGround: p.y < BALL.r * 1.3, moved: Math.hypot(p.x - touched.at[0], p.z - touched.at[1]),
    // the path's second touch against where the ball came down
    pathNext: path[1]?.kind, pathOff: landed && path[1] ? Math.hypot(...landed.map((x, i) => x - path[1].at[i])) : null,
  };
}

test('topple world: a ball into the bush loses its speed and drops to the ground near it; one at a block bounces on', () => {
  const rows = [];
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) for (const up of [0, 12]) {
    const r = bushThrow(seed, up);
    if (!r) continue;
    rows.push(r);
    assert.equal(r.kind, 'bush');
    assert.ok(r.keep <= BUSH_KEEP + 0.05, `${seed}/${up}°: kept ${r.keep.toFixed(2)} of its speed`);
    assert.ok(r.onGround, `${seed}/${up}°: not on the ground after 4 s`);
    assert.ok(r.moved < 0.6 * SCALE, `${seed}/${up}°: rolled ${r.moved.toFixed(2)} m from the bush`);
    assert.equal(r.pathNext, 'ground', `${seed}/${up}°: the path's next touch`);
    assert.ok(r.pathOff < 0.35, `${seed}/${up}°: the path came down ${r.pathOff?.toFixed(2)} m from the ball`);
  }
  assert.ok(rows.length >= 8, `only ${rows.length} throws hit the bush`);
  const block = bushThrow(11, 25, 'block');
  assert.ok(block && block.keep > 0.25, `a block's bounce kept only ${block?.keep.toFixed(2)}`);
});

test('topple world: touch() finds a box\'s, a sphere\'s and the trunk\'s surface, and nothing past it', () => {
  const box = { type: 1 << 2, c: [0, 1, 0], q: [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)], h: [0.5, 0.2, 0.1], rad: Math.hypot(0.5, 0.2, 0.1) };
  assert.ok(touch([0, 1.25, 0], box, 0.06), 'just over the top');
  assert.equal(touch([0, 1.27, 0], box, 0.06), null, 'clear of the top');
  assert.deepEqual(touch([0, 1.25, 0], box, 0.06).n.map(v => +v.toFixed(6)), [0, 1, 0]);
  const sphere = { type: 1, c: [0, 0, 0], r: 0.3, rad: 0.3 };
  assert.ok(touch([0.35, 0, 0], sphere, 0.06));
  assert.equal(touch([0.37, 0, 0], sphere, 0.06), null);
  const trunk = { type: 0, c: [0, 1, 0], R: 0.2, hh: 1, rad: Math.hypot(0.2, 1) };
  assert.ok(touch([0.25, 1.5, 0], trunk, 0.06));
  assert.equal(touch([0.27, 1.5, 0], trunk, 0.06), null);
  assert.equal(touch([0, 2.07, 0], trunk, 0.06), null, 'over the trunk\'s top');
});

// The perfect-aim player (the mockup's, as kept): for each ball, scans the
// throws as the check does and picks one whose path first touches a block
// still standing (or the glass, then one), straight throws first; of those,
// the middle one at the highest standing block (after a ball that knocked
// nothing down, the lowest).
function pickThrow(w, power, low) {
  const obs = w.obstacles(), standing = new Set(w.blocks.filter(b => !b.down).map(b => b.body));
  if (!standing.size) return null;
  const az = [...standing].map(b => Math.atan2(b.position.x - HAND.x, HAND.z - b.position.z) * R2D / MAX_AIM);
  const a0 = Math.max(-1, Math.min(...az) - 0.2), a1 = Math.min(1, Math.max(...az) + 0.2);
  const GLASS = new Set(['glass']), cands = [];
  for (let up = 0; up <= 70; up += 3) for (let a = a0; a <= a1 + 1e-9; a += 0.04) {
    const h = w.trace(launchVel(power, a, up).vec, 1, obs, GLASS).hits;
    let target = null;
    if (h[0]?.kind === 'block' && standing.has(h[0].body)) target = h[0].body;
    else if (h[0]?.kind === 'glass' && h[1]?.kind === 'block' && standing.has(h[1].body)) target = h[1].body;
    if (target) cands.push({ a, up, target, bank: h[0].kind === 'glass' });
  }
  if (!cands.length) return null;
  const direct = cands.filter(c => !c.bank), pool = direct.length ? direct : cands;
  const ys = pool.map(c => c.target.position.y), want = low ? Math.min(...ys) : Math.max(...ys);
  const best = pool.filter(c => Math.abs(c.target.position.y - want) < 1e-6);
  return best[Math.floor(best.length / 2)];
}
function playScene(w, s) {
  const r = newRound(w.blocks.length);
  let low = false, lastDown = 0, leaningAtEnd = 0, ended = null;
  const run = sec => { for (let t = 0; t < sec - 1e-9 && !ended; t += DT) { const { down } = w.step(DT); ended = update(r, DT, { down, still: w.still() }).ended; } };
  while (!ended && canThrow(r).why !== 'no-balls') {
    while (!ended && !canThrow(r).ok && canThrow(r).why === 'not-ready') run(DT);
    if (ended) break;
    if (r.used) { low = r.down === lastDown; lastDown = r.down; }
    const p = pickThrow(w, s.layout.power, low);
    assert.ok(useBall(r).ok);
    w.throwBall(launchVel(s.layout.power, p ? p.a : 0, p ? p.up : 30).vec);
    run(3);
  }
  run(20);
  leaningAtEnd = w.leaning();
  return { won: !!ended?.won, ended: !!ended, down: r.down, total: r.total, balls: r.used, leaningAtEnd };
}

// Over 6 games (30 scenes, 2026-11-10) it cleared 21 (the mockup's player
// about 75%), in 3.2 balls; the arch the hardest (6 of 11: a plank on two
// posts doesn't fall from a hit on the plank). These two games: 8 of 10.
test('topple world: a perfect-aim player clears most scenes, no block left upright against a thing', () => {
  const rows = [];
  for (const seed of [4242, 2026]) {
    const w = createWorld();
    for (let i = 1; i <= SCENES; i++) rows.push({ i, ...playScene(w, w.makeScene(seed, 1, i)) });
  }
  const summary = rows.map(r => `${r.i}:${r.won ? 'won' : 'lost'} ${r.down}/${r.total} in ${r.balls}${r.leaningAtEnd ? ' LEANING' : ''}`).join(', ');
  assert.equal(rows.length, 10);
  assert.ok(rows.every(r => r.ended), `a scene never ended: ${summary}`);
  assert.ok(rows.filter(r => r.won).length >= 7, `only ${rows.filter(r => r.won).length} of 10 cleared: ${summary}`);
  assert.equal(rows.filter(r => r.leaningAtEnd).length, 0, `a standing block against a thing: ${summary}`);
});

// A player that throws as a person can (Q64; developer: "I see no point in
// publishing a game than can not be won"): from behind, only at blocks it
// can see (frontSeen); from the side, as the side view lets you, straight at
// the structure (the game's sideDrag, a few lengths of drag). Each ball a
// random one of those throws whose path first touches a standing block
// (seeded, so the same each run). The perfect-aim player above follows one
// plan; this one shows a scene can be won at all.
const GLASS_ONLY = new Set(['glass']);
function personThrows(w, power, stand) {
  const seen = w.frontSeen(), standing = w.blocks.filter(b => !b.down);
  if (!standing.length) return [];
  const visible = new Set(w.blocks.filter((b, i) => !b.down && seen[i] > 0).map(b => b.body)), all = new Set(standing.map(b => b.body));
  const obs = w.obstacles(), out = [];
  const add = (vel, targets) => {
    const h = w.trace(vel.vec, 1, obs, GLASS_ONLY).hits;
    const t = h[0]?.kind === 'block' ? h[0].body : (h[0]?.kind === 'glass' && h[1]?.kind === 'block' ? h[1].body : null);
    if (t && targets.has(t)) out.push(vel);
  };
  const az = standing.map(b => Math.atan2(b.body.position.x - HAND.x, HAND.z - b.body.position.z) * R2D / MAX_AIM);
  const a0 = Math.max(-1, Math.min(...az) - 0.2), a1 = Math.min(1, Math.max(...az) + 0.2);
  for (let up = 0; up <= MAX_UP; up += 3) for (let a = a0; a <= a1 + 1e-9; a += 0.04) add(launchVel(power, a, up), visible);
  for (let up = 0; up <= MAX_UP; up += 3) for (const m of [0.16, 0.22, 0.28, 0.34, 0.4]) {
    const d = sideDrag(Math.cos(up / R2D) * m, -Math.sin(up / R2D) * m, 1, power, stand);
    add(launchVel(d.power, d.aim, d.up), all);
  }
  return out;
}
// Plays scene s with a fresh world; `weak` scales every throw (the check
// that the test can fail). Returns { won, down, total }.
function personPlays(s, random, weak = 1) {
  const w = createWorld();
  w.setScene(s.parts);
  const r = newRound(w.blocks.length);
  let ended = null;
  const run = sec => { for (let t = 0; t < sec - 1e-9 && !ended; t += DT) { const { down } = w.step(DT); ended = update(r, DT, { down, still: w.still() }).ended; } };
  while (!ended && canThrow(r).why !== 'no-balls') {
    while (!ended && !canThrow(r).ok && canThrow(r).why === 'not-ready') run(DT);
    if (ended) break;
    const c = personThrows(w, s.layout.power, s.parts.stand);
    assert.ok(useBall(r).ok);
    const vec = (c.length ? c[Math.floor(random() * c.length)] : launchVel(s.layout.power, 0, 30)).vec;
    w.throwBall(vec.map(v => v * weak));
    run(3);
  }
  run(20);
  return { won: !!ended?.won, down: r.down, total: r.total };
}
// Up to PERSON_TRIES players a scene, stopping at the first win.
const PERSON_TRIES = 20;
function canBeWon(s, seed, weak = 1, tries = PERSON_TRIES) {
  const random = rng(seed);
  let best = 0, total = 0;
  for (let k = 1; k <= tries; k++) {
    const p = personPlays(s, random, weak);
    best = Math.max(best, p.down); total = p.total;
    if (p.won) return { won: true, players: k };
  }
  return { won: false, players: tries, best, total };
}

// 2026-11-10: over 100 scenes (20 games) such players won every one; varied
// players at any block won 874 of 1,000 tries.
test('topple world: every scene of three games can be won by a player throwing as a person can', () => {
  const rows = [];
  for (const seed of GAMES) {
    const w = createWorld();
    for (let i = 1; i <= SCENES; i++) {
      const s = w.makeScene(seed, 1, i);
      rows.push({ at: `${seed}/${i} ${s.layout.stack}`, ...canBeWon(s, seed * 31 + i) });
    }
  }
  const summary = rows.map(r => `${r.at}: ${r.won ? `won by player ${r.players}` : `NOT WON by ${r.players} players (best ${r.best}/${r.total} down)`}`).join('; ');
  assert.equal(rows.length, GAMES.length * SCENES, `${rows.length} scenes played`);
  assert.equal(rows.filter(r => !r.won).length, 0, summary);
});

test('topple world: a scene no player can win is reported (throws too weak to reach)', () => {
  const s = createWorld().makeScene(GAMES[0], 1, 1);
  assert.ok(canBeWon(s, 1).won, 'scene 1 not won at full strength');
  const r = canBeWon(s, 1, 0.2, 3);
  assert.equal(r.won, false);
  assert.equal(r.players, 3);
  assert.equal(r.best, 0);
});

test('topple world: a scene picked up again puts the blocks where they were, the fallen still down', () => {
  const w = createWorld();
  // the arch behind a tree: this throw knocks the top left cube off (the mockup's too)
  const s = w.makeScene(12345, 1, 2);
  w.throwBall(launchVel(s.layout.power, 0.16, 27).vec);
  for (let k = 0; k < 360; k++) w.step(DT);
  const poses = JSON.parse(JSON.stringify(w.poses())), down = w.downCount();
  assert.ok(down > 0, 'the throw knocked nothing down');
  const w2 = createWorld();
  w2.setScene(s.parts, poses);
  assert.equal(w2.downCount(), down);
  assert.deepEqual(w2.poses(), poses);
  for (let k = 0; k < 120; k++) w2.step(DT);
  assert.ok(w2.drift() > 0, 'the blocks put back at their start');
  assert.equal(w2.downCount(), down, 'a block came back up');
});
