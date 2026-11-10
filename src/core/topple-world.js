// Topple!'s physics, the path ahead and the scene check (DESIGN.md
// "Topple!"): a cannon-es world (src/vendor/cannon-es) as the Block Game
// Mockup v8 made it. No DOM or three.js, so the tests run it under Node; the
// screen (src/ui/topple-scene.js) draws each body where this puts it.
//
// The blocks stand asleep until the ball touches one (awake from the start
// they creep), then all wake. Every body's box (AABB) is refreshed as it's
// added: cannon-es works it out at the origin as a body is made, and a body
// that never moves keeps it there, so the broadphase skipped it (Q63).

import * as CANNON from '../vendor/cannon-es/cannon-es.js';
import {
  HAND, CAM, BALL, SCALE, DENSITY, GRAVITY, STEP, MAX_AIM, R2D, clamp, launchVel, sideView,
  sceneParts, makeLayout, sceneSeed, sceneOpts, isDown,
} from './topple.js';
import { fixedStepper } from './fixed-step.js';

export const MAX_SUBSTEPS = 8;
export const BALL_LIFE = 10;                         // a thrown ball is taken away after this long (s), or once under the ground
export const STILL_SPEED = 0.05 * Math.sqrt(SCALE);  // a block slower than this (m/s) counts as still
// How much of its speed into a surface the ball keeps off each kind of thing
// (the physics and the path alike): the glass backboard lively (developer:
// "simpler for the player to grasp"); the bush none.
export const BOUNCE = { block: 0.3, stand: 0.3, glass: 0.7, bush: 0, tree: 0.3, ground: 0.3 };
// A ball that touches the bush keeps only this much of its speed, all ways,
// and drops through it to the ground, slowed as if caught in the leaves
// (developer, 2026-11-10: "if a ball hit a bush it would just fall to the
// ground"). Only slowed, it was pushed back out (it had sunk 7 cm into the
// bush in a step) and rolled 1.6 m back towards the thrower; so that first
// contact is switched off and the ball goes on through every bush.
export const BUSH_KEEP = 0.1;
export const CAUGHT_DAMPING = 0.9;   // the ball's damping once in the bush (keeps 0.1 of its speed a second)
const BUSH_GROUP = 2;                // the bushes' collision group, which a ball in a bush stops touching
export const TRIES = 25;   // layouts tried for a scene before taking the best

/* ---------- small vector maths (arrays) ---------- */

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(a[0], a[1], a[2]);
const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
// quaternions [x, y, z, w]: a·b, and v turned by q (or back, by its conjugate)
const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
function rot(q, v) {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1], iy = w * v[1] + z * v[0] - x * v[2], iz = w * v[2] + x * v[1] - y * v[0], iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}
const rotBack = (q, v) => rot([-q[0], -q[1], -q[2], q[3]], v);
const quatOf = b => [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w];
const posOf = b => [b.position.x, b.position.y, b.position.z];

/* ---------- the world ---------- */

// `onHit({ a, b, v, ball })` for each knock (for the sounds and the log): a
// 'block' or 'ball', b the other's kind, v the speed along the knock (m/s);
// the ball's own knocks come once, as a: 'ball', with its height `y`.
export function createWorld({ onHit = () => {} } = {}) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAVITY, 0) });
  world.allowSleep = true;
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.solver.iterations = 20;
  const M = Object.fromEntries(['block', 'ball', 'stand', 'glass', 'bush', 'tree'].map(k => [k, new CANNON.Material(k)]));
  world.defaultContactMaterial.friction = 0.4;
  world.defaultContactMaterial.restitution = 0.15;
  const CM = (a, b, friction, restitution) => world.addContactMaterial(new CANNON.ContactMaterial(M[a], M[b], { friction, restitution }));
  CM('block', 'block', 0.5, 0.05); CM('block', 'stand', 0.5, 0.05); CM('block', 'glass', 0.2, 0.05); CM('block', 'bush', 0.6, 0.02); CM('block', 'tree', 0.4, 0.05);
  CM('ball', 'block', 0.3, BOUNCE.block); CM('ball', 'stand', 0.4, BOUNCE.stand); CM('ball', 'glass', 0.05, BOUNCE.glass);
  CM('ball', 'bush', 0.8, BOUNCE.bush); CM('ball', 'tree', 0.5, BOUNCE.tree);
  const ground = new CANNON.Body({ mass: 0, material: M.stand, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  ground.kind = 'ground';
  world.addBody(ground);

  const advance = fixedStepper(world, STEP, MAX_SUBSTEPS);
  let statics = [], blocks = [], balls = [], time = 0, parts = null;
  const kindOf = body => body.kind ?? 'ground';
  const asleep = b => b.sleepState === CANNON.Body.SLEEPING;
  const wakeBlocks = () => { for (const b of blocks) b.body.wakeUp(); };

  function onBlockCollide(e) {
    if (e.body.kind === 'ball') return;   // the ball's own listener has it
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (v >= 0.5) onHit({ a: 'block', b: kindOf(e.body), v });
  }
  function onBallCollide(e) {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal()), kind = kindOf(e.body);
    if (kind === 'block') wakeBlocks();
    onHit({ a: 'ball', b: kind, v, y: e.target.position.y, ball: e.target, other: e.body });
  }

  // No ball touches a bush in the physics (a ball's collision mask leaves the
  // bushes out). Instead, before each step's move (after the solving), a ball
  // about to reach one of a bush's balls is put where it touches, slowed to
  // BUSH_KEEP and damped, and left to drop through to the ground. (Slowed at
  // the physics' own touch, it was pushed back out: it had sunk 7 cm in.)
  let bushBalls = [];   // [{ c, r, body }]
  function catchInBush() {
    for (const { body: b } of balls) {
      if (b.inBush) continue;
      const p = [b.position.x, b.position.y, b.position.z], d = [b.velocity.x * STEP, b.velocity.y * STEP, b.velocity.z * STEP];
      for (const s of bushBalls) {
        const k = reachAlong(p, d, s.c, s.r + BALL.r);
        if (k === null) continue;
        const at = add(p, scale(d, k)), n = scale(sub(at, s.c), 1 / (dist(at, s.c) || 1));
        const vn = -dot([b.velocity.x, b.velocity.y, b.velocity.z], n);
        b.inBush = true;
        b.position.set(...at);
        b.velocity.scale(BUSH_KEEP, b.velocity);
        b.angularVelocity.set(0, 0, 0);
        b.linearDamping = b.angularDamping = CAUGHT_DAMPING;
        onHit({ a: 'ball', b: 'bush', v: Math.max(0, vn), y: at[1], ball: b, other: s.body });
        break;
      }
    }
  }
  world.addEventListener('preStep', catchInBush);

  function addBody(body) {
    body.aabbNeedsUpdate = true;   // its box was worked out at the origin (Q63)
    world.addBody(body);
    return body;
  }
  function shapeOf(sh) {
    if (sh.type === 'sphere') return new CANNON.Sphere(sh.r);
    if (sh.type === 'box') return new CANNON.Box(new CANNON.Vec3(...sh.half));
    const c = new CANNON.Cylinder(sh.r, sh.r, sh.hh * 2, 16);   // upright, along y
    c.trunkR = sh.r; c.trunkHH = sh.hh;
    return c;
  }

  // A scene's things and blocks (sceneParts()), the blocks asleep; or at
  // `poses` ([{ p, q, down }], one per block: where they had come to rest).
  function setScene(p, poses = null) {
    for (const s of [...statics, ...blocks, ...balls]) world.removeBody(s.body);
    statics = []; blocks = []; balls = []; bushBalls = []; parts = p;
    for (const b of p.bodies) {
      // one shape: the body where the shape is (a box turned as it is); more: each at its place
      const body = new CANNON.Body({ mass: 0, material: M[b.kind] });
      if (b.shapes.length === 1) {
        const sh = b.shapes[0];
        body.addShape(shapeOf(sh));
        body.position.set(...sh.at);
        if (sh.yaw) body.quaternion.setFromEuler(0, sh.yaw, 0);
      } else for (const sh of b.shapes) body.addShape(shapeOf(sh), new CANNON.Vec3(...sh.at));
      body.kind = b.kind;
      if (b.kind === 'bush') {
        body.collisionFilterGroup = BUSH_GROUP;
        for (const sh of b.shapes) bushBalls.push({ c: sh.at, r: sh.r, body });
      }
      statics.push({ body: addBody(body) });
    }
    p.blocks.forEach((o, i) => {
      const body = new CANNON.Body({
        mass: DENSITY * o.w * o.h * o.d, material: M.block, shape: new CANNON.Box(new CANNON.Vec3(o.w / 2, o.h / 2, o.d / 2)),
        linearDamping: 0.05, angularDamping: 0.1, sleepSpeedLimit: 0.1 * Math.sqrt(SCALE), sleepTimeLimit: 0.4,
      });
      const pose = poses?.[i];
      body.position.set(...(pose ? pose.p : [o.x, o.y, o.z]));
      if (pose) body.quaternion.set(...pose.q);
      body.kind = 'block';
      body.addEventListener('collide', onBlockCollide);
      addBody(body);
      body.sleep();   // still until the ball touches one
      blocks.push({ body, start: { x: o.x, y: o.y, z: o.z }, c: o.c, minDim: Math.min(o.w, o.h, o.d), down: !!pose?.down });
    });
    return blocks;
  }

  // A ball from the slingshot at velocity vec ([x, y, z] m/s).
  function throwBall(vec) {
    const body = new CANNON.Body({ mass: BALL.kg * SCALE ** 3, material: M.ball, shape: new CANNON.Sphere(BALL.r), linearDamping: 0, angularDamping: 0.3 });
    body.position.set(HAND.x, HAND.y, HAND.z);
    body.velocity.set(...vec);
    body.kind = 'ball';
    body.thrownAt = time;
    body.collisionFilterMask = ~BUSH_GROUP;   // the bush catches it instead (catchInBush)
    body.addEventListener('collide', onBallCollide);
    world.addBody(body);
    balls.push({ body });
    return body;
  }

  // dt s on, in fixed steps (fixedStepper: clock the game's, to give up
  // catching up when out of time; none in the tests, every step); balls past
  // their time taken away. Returns how many blocks are down (each, once down,
  // stays down), the newly down, and the steps taken and dropped.
  function step(dt, clock = null) {
    const { steps, dropped } = advance(dt, clock);
    time += dt;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i].body;
      if (time - b.thrownAt > BALL_LIFE || b.position.y < -2) { world.removeBody(b); balls.splice(i, 1); }
    }
    const fell = [];
    for (const b of blocks) if (!b.down && isDown(quatOf(b.body), b.body.position.y, b.start.y, b.minDim)) { b.down = true; fell.push(b); }
    return { down: blocks.filter(b => b.down).length, fell, steps, dropped };
  }

  /* ---------- the path ahead ---------- */

  // Everything a ball could touch: each shape of each body (boxes, the
  // bush's and leaves' spheres, the trunk's upright cylinder), where it is
  // now. keep(body): only these.
  function obstacles(keep) {
    const out = [];
    for (const s of [...statics, ...blocks]) {
      const b = s.body;
      if (keep && !keep(b)) continue;
      const bq = quatOf(b), bp = posOf(b);
      b.shapes.forEach((sh, i) => {
        const off = b.shapeOffsets[i], so = b.shapeOrientations[i];
        const o = { kind: b.kind, body: b, type: sh.type, c: add(rot(bq, [off.x, off.y, off.z]), bp), q: qmul(bq, [so.x, so.y, so.z, so.w]) };
        if (sh.type === CANNON.Shape.types.BOX) { const he = sh.halfExtents; o.h = [he.x, he.y, he.z]; o.rad = Math.hypot(he.x, he.y, he.z); } else if (sh.type === CANNON.Shape.types.SPHERE) { o.r = sh.radius; o.rad = sh.radius; } else if (sh.trunkR) { o.R = sh.trunkR; o.hh = sh.trunkHH; o.rad = Math.hypot(o.R, o.hh); } else return;
        out.push(o);
      });
    }
    return out;
  }

  // dt s of the ball's path from the hand, as the physics flies it (the same
  // steps: gravity, then move), against `obs` and the ground. A bounce
  // reflects it off the surface keeping BOUNCE[kind] of its speed into it (no
  // spin or friction); a bush slows it, and it goes on through the bushes.
  // bounces: how many to follow; bounceOn: bounce only off
  // these kinds (stop at others). Returns { hits: [{ kind, body, at, n, t }],
  // pts: [[x, y, z], ...] every STEP s }.
  function trace(vec, bounces = 0, obs = obstacles(), bounceOn = null) {
    const r = BALL.r;
    let p = [HAND.x, HAND.y, HAND.z], v = vec.slice();
    const hits = [], pts = [p], tMax = 4 * Math.sqrt(SCALE);
    for (let i = 1; i * STEP < tMax; i++) {
      v[1] -= GRAVITY * STEP;
      const np = add(p, scale(v, STEP));
      let hit = null;
      for (let k = 1; k <= 4 && !hit; k++) {
        const q = lerp(p, np, k / 4);
        if (q[1] < r) { hit = { kind: 'ground', at: q, n: [0, 1, 0] }; break; }
        for (const o of obs) { const h = touch(q, o, r); if (h) { hit = { kind: o.kind, body: o.body, at: q, n: h.n }; break; } }
      }
      if (hit) {
        hit.t = i * STEP;
        hits.push(hit);
        if (hits.length > bounces || (bounceOn && !bounceOn.has(hit.kind))) break;
        const vn = dot(v, hit.n);
        // into a bush: slowed, and on through the bushes (as catchInBush; its damping left out)
        if (hit.kind === 'bush') { v = scale(v, BUSH_KEEP); obs = obs.filter(o => o.kind !== 'bush'); } else if (vn < 0) v = add(v, scale(hit.n, -(1 + BOUNCE[hit.kind]) * vn));
        p = add(hit.at, scale(hit.n, 0.002));
        pts.push(p);
        continue;
      }
      p = np;
      pts.push(p);
      if (p[1] < -1) break;
    }
    return { hits, pts };
  }

  /* ---------- the scene check ---------- */

  // Before a scene is shown, throws are scanned (up 0-70° by 3°, aimed
  // across everything by 0.04 of the full aim), first with nothing in the
  // way, then with the things:
  // - possible: every block that can be hit with nothing in the way can
  //   still be hit, first or straight after the backboard (one may be missed:
  //   a block hidden under others falls with them);
  // - the things matter (a bush or a tree; a backboard only adds a way):
  //   some block at least partly hidden from the camera, or keeping under
  //   half its straight hits, or at most 75% as many first hits in all;
  // - enough shows, in one view or the other (developer: "At least one view
  //   should give you something to aim at, and allow you to see if you hit
  //   it, and if anything is left"): every block at least partly seen, a
  //   third wholly;
  // - not a pinhole: at least 15 throws of the scan hit a block;
  // - a backboard worth trying: at least 3 throws off it hit a block.
  const GLASS_ONLY = new Set(['glass']);
  function check(L) {
    const all = obstacles(), clear = obstacles(b => b.kind === 'block' || b.kind === 'stand');
    const az = all.filter(o => o.kind === 'block' || o.kind === 'glass').map(o => Math.atan2(o.c[0] - HAND.x, HAND.z - o.c[2]) * R2D / MAX_AIM);
    const a0 = clamp(Math.min(...az) - 0.15, -1, 1), a1 = clamp(Math.max(...az) + 0.15, -1, 1);
    const base = new Map(), direct = new Map(), banked = new Set();
    const tally = (m, k) => m.set(k, (m.get(k) || 0) + 1);
    let nBase = 0, nDirect = 0, nBank = 0, n = 0;
    for (let up = 0; up <= 70; up += 3) for (let a = a0; a <= a1 + 1e-9; a += 0.04) {
      n++;
      const { vec } = launchVel(L.power, a, up);
      const h0 = trace(vec, 0, clear).hits[0];
      if (h0 && h0.kind === 'block') { nBase++; tally(base, h0.body); }
      const h = trace(vec, 1, all, GLASS_ONLY).hits;
      if (h[0] && h[0].kind === 'block') { nDirect++; tally(direct, h[0].body); } else if (h[0] && h[0].kind === 'glass' && h[1] && h[1].kind === 'block') { nBank++; banked.add(h[1].body); }
    }
    const missing = [...base.keys()].filter(b => !direct.has(b) && !banked.has(b)).length;
    const hidden = [...base].filter(([b, c]) => (direct.get(b) || 0) < 0.5 * c).length;
    const front = viewOfBlocks(CAM, b => b.kind === 'bush' || b.kind === 'tree');
    // the side camera at a fixed shape, so a scene comes out the same on any screen
    const side = viewOfBlocks(sideView(0.75, parts).pos, b => b.kind === 'bush' || b.kind === 'tree');
    const enough = v => v.full + v.part === blocks.length && v.full >= blocks.length / 3;
    const hasBoard = L.things.some(t => t.kind === 'backboard'), hides = L.things.some(t => t.kind !== 'backboard');
    const why = [];
    if (missing > 1) why.push(`${missing} blocks can't be hit`);
    if (hides && hidden === 0 && front.full === blocks.length && nDirect > 0.75 * nBase) why.push('the things hardly matter');
    if (!enough(front) && !enough(side)) why.push('too little shows in either view');
    if (nDirect + nBank < 15) why.push('too few throws hit');
    if (hasBoard && nBank < 3) why.push('the backboard is no use');
    return {
      ok: why.length === 0, why: why.join('; '), shots: n, clear: nBase, direct: nDirect, bank: nBank, share: +(nDirect / Math.max(1, nBase)).toFixed(2),
      blocks: blocks.length, missing, hidden,
      seen: `${front.full} whole, ${front.part} part, ${blocks.length - front.full - front.part} hidden`,
      seenSide: `${side.full} whole, ${side.part} part, ${blocks.length - side.full - side.part} hidden`,
    };
  }
  // What a camera at cam sees of each block past the things keep() lets
  // through: its top's middle, three points across its front and its right
  // side's middle (whole: all; part: some).
  function viewOfBlocks(cam, keep) {
    const occ = obstacles(keep);
    const clearTo = p => { for (let i = 1; i < 40; i++) { const q = lerp(cam, p, i / 40); for (const o of occ) if (touch(q, o, 0.001)) return false; } return true; };
    let full = 0, part = 0;
    for (const b of blocks) {
      const p = posOf(b.body), he = b.body.shapes[0].halfExtents;
      const pts = [[0, he.y, 0], [0, 0, he.z], [-0.8 * he.x, 0, he.z], [0.8 * he.x, 0, he.z], [he.x, 0, 0]].map(d => add(p, d));
      const k = pts.filter(clearTo).length;
      if (k === pts.length) full++; else if (k) part++;
    }
    return { full, part };
  }

  // Scene i of a game's level: its layout made from its seed and checked; a
  // layout that fails is thrown away and the next try's seed used (TRIES at
  // most, else the best of them). The same game, level and scene always give
  // the same scene. Returns { layout, parts, check, tries, thrown (why each
  // was thrown away) }, the scene set up in the world.
  function makeScene(gameSeed, level, i) {
    const score = c => (c.ok ? 1000 : 0) - c.missing * 50 - Math.max(0, c.share - 0.75) * 100 + Math.min(c.direct + c.bank, 15);
    let best = null, tries = 0, L, p, chk;
    const thrown = [];
    do {
      L = makeLayout(sceneSeed(gameSeed, level, i, tries), sceneOpts(i));
      tries++;
      p = sceneParts(L);
      setScene(p);
      chk = check(L);
      if (!chk.ok) thrown.push({ seed: L.seed, stack: L.stack, things: L.things.map(t => t.kind), why: chk.why });
      if (!best || score(chk) > score(best.chk)) best = { L, p, chk };
    } while (!chk.ok && tries < TRIES);
    if (!chk.ok) { ({ L, p, chk } = best); setScene(p); }
    return { layout: L, parts: p, check: chk, tries, thrown };
  }

  return {
    world,
    get blocks() { return blocks; },
    get statics() { return statics; },
    get balls() { return balls.map(b => b.body); },
    get time() { return time; },
    get parts() { return parts; },
    setScene, makeScene, throwBall, step, obstacles, trace, check,
    downCount: () => blocks.filter(b => b.down).length,
    still: () => blocks.every(b => asleep(b.body) || b.body.velocity.length() < STILL_SPEED),
    awake: () => blocks.filter(b => !asleep(b.body)).length,
    // Each block's pose, and whether it's down: kept for a scene picked up again.
    poses: () => blocks.map(b => ({ p: posOf(b.body).map(r4), q: quatOf(b.body).map(r4), down: b.down })),
    // How far the furthest block has moved from its place (m): the log and the tests.
    drift: () => Math.max(0, ...blocks.map(b => dist(posOf(b.body), [b.start.x, b.start.y, b.start.z]))),
    // Blocks still standing that touch a fixed thing (the bush, a pole...): the tests.
    leaning: () => {
      const standing = new Set(blocks.filter(b => !b.down).map(b => b.body)), fixed = new Set(statics.map(s => s.body));
      return world.contacts.filter(c => (standing.has(c.bi) && fixed.has(c.bj)) || (standing.has(c.bj) && fixed.has(c.bi))).length;
    },
    asleep,
  };
}
const r4 = v => Math.round(v * 1e4) / 1e4;

// Does a ball of radius r at p touch the obstacle o? { n: the way out of o } if so.
// How far along a move d from p (0-1) a point first comes within rr of c: 0
// if it is already; null if not on this move.
export function reachAlong(p, d, c, rr) {
  const pc = sub(p, c), cc = dot(pc, pc) - rr * rr;
  if (cc <= 0) return 0;
  const a = dot(d, d), b = 2 * dot(d, pc), disc = b * b - 4 * a * cc;
  if (a === 0 || disc < 0) return null;
  const k = (-b - Math.sqrt(disc)) / (2 * a);
  return k >= 0 && k <= 1 ? k : null;
}

export function touch(p, o, r) {
  if (dist(p, o.c) > o.rad + r) return null;
  if (o.type === CANNON.Shape.types.SPHERE) {
    const diff = sub(p, o.c), d = len(diff);
    if (d >= o.r + r) return null;
    return { n: d > 1e-6 ? scale(diff, 1 / d) : [0, 1, 0] };
  }
  if (o.R) {   // the trunk: an upright cylinder
    const lx = p[0] - o.c[0], ly = p[1] - o.c[1], lz = p[2] - o.c[2], hd = Math.hypot(lx, lz);
    const k = hd > o.R ? o.R / hd : 1, cy = Math.max(-o.hh, Math.min(o.hh, ly));
    let diff = [lx - lx * k, ly - cy, lz - lz * k];
    const d = len(diff);
    if (d >= r) return null;
    if (d < 1e-6) diff = [hd > 1e-6 ? lx / hd : 1, 0, hd > 1e-6 ? lz / hd : 0];
    return { n: scale(diff, 1 / (len(diff) || 1)) };
  }
  const l = rotBack(o.q, sub(p, o.c));
  const c = [0, 1, 2].map(i => Math.max(-o.h[i], Math.min(o.h[i], l[i])));
  let diff = sub(l, c);
  const d = len(diff);
  if (d >= r) return null;
  if (d < 1e-6) {   // the middle inside: out through the nearest face
    const pen = [0, 1, 2].map(i => o.h[i] - Math.abs(l[i]));
    const i = pen.indexOf(Math.min(...pen));
    diff = [0, 0, 0];
    diff[i] = Math.sign(l[i]) || 1;
  }
  return { n: rot(o.q, scale(diff, 1 / (len(diff) || 1))) };
}
