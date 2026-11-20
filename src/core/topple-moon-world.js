// The moon base's physics (DESIGN.md "Topple!", The moon): a cannon-es world
// at the moon's gravity, a scene's blocks and ledges, and the balls the
// lander drops (src/core/topple-moon.js's rules; the mockups' materials). No
// DOM or three.js, so the tests run it under Node; src/ui/topple-moon.js
// draws each body where this puts it.
//
// A block is down as in the park (topple.js isDown: tipped past 45°, a post
// past 30°, or dropped 0.6 of its smallest side), or knocked well away from
// where it stood and slowed, or slowed where no drop reaches (outOfReach),
// or off the ground's edge.

import * as CANNON from '../vendor/cannon-es/cannon-es.js';
import { isDown, STEP, rng } from './topple.js';
import { MOON_G, MOON_BALL, MOON_MATS, reachOf, outOfReach, ROLL_M, ROLL_DROP, BURST_R, BURST_KICK, POP_THRUST, POP_S } from './topple-moon.js';
import { fixedStepper } from './fixed-step.js';
import { safeContactKeys } from './cannon-keys.js';

export const MOON_SUBSTEPS = 12;
export const MOON_BALL_LIFE = 12;     // a dropped ball is taken away after this long (s)
export const AWAY_M = 2.5;            // knocked this far from where it stood (m) ...
export const AWAY_SLOW = 0.3;         // ... and slower than this (m/s): down, out of reach
export const STILL_V = 0.05;          // a block slower than this (m/s, and turning slower than this rad/s) is still
export const CALM_V = 0.3;            // ... and calm (the win's card)

export function createMoonWorld({ onHit = () => {} } = {}) {
  // (touch keys that can't overflow: the first ball touch wakes the blocks, Q136)
  const world = safeContactKeys(new CANNON.World({ gravity: new CANNON.Vec3(0, -MOON_G, 0) }));
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 14;
  const mats = { ball: new CANNON.Material('ball'), block: new CANNON.Material('block'), ground: new CANNON.Material('ground') };
  const cm = (a, b, friction, restitution) => world.addContactMaterial(new CANNON.ContactMaterial(a, b, { friction, restitution }));
  cm(mats.ball, mats.ground, 0.7, 0.12);
  cm(mats.ball, mats.block, 0.3, 0.15);
  cm(mats.block, mats.ground, 0.55, 0.05);
  cm(mats.block, mats.block, 0.5, 0.05);
  cm(mats.ball, mats.ball, 0.2, 0.3);
  const ground = new CANNON.Body({ mass: 0, material: mats.ground, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground);
  const advance = fixedStepper(world, STEP, MOON_SUBSTEPS);

  const W = { world, blocks: [], balls: [], ledges: [], time: 0 };
  let woke = false;

  const kind = new Map();   // body → 'block' | 'ball' | 'ground' | 'ledge'
  kind.set(ground, 'ground');
  world.addEventListener('beginContact', e => {
    const a = kind.get(e.bodyA), b = kind.get(e.bodyB);
    if (!a || !b) return;
    const ball = a === 'ball' ? e.bodyA : b === 'ball' ? e.bodyB : null;
    const blockBody = a === 'block' ? e.bodyA : b === 'block' ? e.bodyB : null;
    if (ball && !woke) { woke = true; for (const r of W.blocks) r.body.wakeUp(); }
    const v = Math.hypot(e.bodyA.velocity.x - e.bodyB.velocity.x, e.bodyA.velocity.y - e.bodyB.velocity.y, e.bodyA.velocity.z - e.bodyB.velocity.z);
    const rec = blockBody && W.blocks.find(r => r.body === blockBody);
    onHit({ a: ball ? 'ball' : a, b: ball ? (a === 'ball' ? b : a) : b, v, mat: rec?.mat ?? null });
    // Q125: each block touched in this contact, its own behaviour (done after the step)
    for (const body of [e.bodyA, e.bodyB]) {
      const r = kind.get(body) === 'block' && W.blocks.find(x => x.body === body);
      if (!r || r.broken) continue;
      const m = MOON_MATS[r.mat] ?? {};
      if (m.burst && ball && v >= m.burst) todo.set(r, { what: 'burst', v, ball });
      else if (m.pop && ball && v >= m.pop && r.popT == null) todo.set(r, { what: 'pop', v, ball });
      else if (m.shatter && r.down && v >= 0.4) todo.set(r, { what: 'shatter', v });
    }
  });
  const todo = new Map();   // block → what happens to it after this step
  // the spins a burst or a pop gives (seeded with the scene, so a run can be repeated: the tests and the star tool)
  let spinR = rng(1);
  W.events = [];            // what happened, for the drawing and the log: { what, i, mat, at, v }
  const ev = (what, r, v = 0) => { const p = r.body.position; W.events.push({ what, i: r.i, mat: r.mat, at: [p.x, p.y, p.z], v, t: W.time }); };
  // gone: a burst or a shatter (taken out of the world; down for good)
  const breakUp = (r, what, v) => {
    ev(what, r, v);
    world.removeBody(r.body);
    r.broken = true; r.down = true;
    if (what === 'burst') {
      for (const o of W.blocks) {
        if (o.broken) continue;
        const d = o.body.position.vsub(r.body.position), dist = d.length();
        if (dist > BURST_R) continue;
        const k = BURST_KICK * (1 - dist / BURST_R);
        d.normalize();
        o.body.wakeUp();
        o.body.velocity.vadd(new CANNON.Vec3(d.x * k, Math.abs(d.y) * k * 0.5 + k * 0.4, d.z * k), o.body.velocity);
        o.body.angularVelocity.set((spinR() - 0.5) * k * 3, (spinR() - 0.5) * k * 3, (spinR() - 0.5) * k * 3);
      }
    }
  };
  const settle = () => {
    for (const [r, x] of todo) {
      if (r.broken) continue;
      if (x.what === 'pop') {
        // it vents: a kick up and away from the ball, a spin, then its jet (POP_S) does the rest
        const away = r.body.position.vsub(x.ball.position); away.y = 0; if (away.length() > 1e-6) away.normalize();
        r.body.wakeUp();
        r.body.velocity.vadd(new CANNON.Vec3(away.x * 1.2, 1.6, away.z * 1.2), r.body.velocity);
        r.body.angularVelocity.set((spinR() - 0.5) * 5, (spinR() - 0.5) * 3, (spinR() - 0.5) * 5);
        r.popT = W.time;
        ev('pop', r, x.v);
      } else breakUp(r, x.what, x.v);
    }
    todo.clear();
  };

  const clear = () => {
    for (const r of [...W.blocks, ...W.balls, ...W.ledges]) world.removeBody(r.body);
    W.blocks = []; W.balls = []; W.ledges = [];
    woke = false;
    todo.clear(); W.events = [];
  };
  // a block's shape (Q125: drums and tanks on end, prisms, boulders; else a box)
  const shapeOf = (b, m) => (m.shape === 'cyl' ? new CANNON.Cylinder(b.w / 2, b.w / 2, b.h, 16)
    : m.shape === 'hex' ? new CANNON.Cylinder(b.w / 2, b.w / 2, b.h, 6)
      : m.shape === 'ball' ? new CANNON.Sphere(b.w / 2)
        : new CANNON.Box(new CANNON.Vec3(b.w / 2, b.h / 2, b.d / 2)));

  // The scene's blocks (and ledges), standing asleep (or at `poses`: a scene picked up again).
  W.setScene = (scene, poses = null) => {
    clear();
    W.reach = scene.span ? reachOf(scene.span) : null;
    for (const l of scene.ledges ?? []) {
      const body = new CANNON.Body({ mass: 0, material: mats.ground, shape: new CANNON.Box(new CANNON.Vec3(l.w / 2, l.h / 2, l.d / 2)), position: new CANNON.Vec3(l.x, l.h / 2, l.z) });
      body.updateAABB?.();
      world.addBody(body);
      kind.set(body, 'ledge');
      W.ledges.push({ body, ...l });
    }
    scene.blocks.forEach((b, i) => {
      const m = MOON_MATS[b.mat] ?? MOON_MATS.crate;
      const body = new CANNON.Body({
        mass: m.density * b.w * b.h * b.d * (m.shape === 'ball' ? 0.52 : m.shape ? 0.79 : 1), material: mats.block, shape: shapeOf(b, m),
        position: new CANNON.Vec3(b.x, b.y, b.z), linearDamping: m.roll ? 0.06 : 0.01, angularDamping: m.roll ? 0.3 : 0.05,
      });
      body.sleepSpeedLimit = 0.08; body.sleepTimeLimit = 1.0;
      const p = poses?.[i];
      if (p) { body.position.set(...p.at); body.quaternion.set(...p.q); }
      body.updateAABB?.();
      world.addBody(body);
      body.sleep();
      kind.set(body, 'block');
      const tall = b.h > b.w && b.h > b.d;
      const rec = { body, mat: b.mat, i, x0: b.x, y0: b.y, z0: b.z, min: Math.min(b.w, b.h, b.d), tall, he: { x: b.w / 2, y: b.h / 2, z: b.d / 2 }, down: !!p?.down, roll: !!m.roll };
      W.blocks.push(rec);
      if (p?.broken) { world.removeBody(body); rec.broken = true; rec.down = true; }   // (a scene picked up again: gone already)
    });
    W.time = 0;
    spinR = rng(((scene.seed ?? 0) ^ Math.imul((scene.level ?? 0) * 8 + (scene.scene ?? 0), 0x9E3779B1)) >>> 0);
    return W.blocks.length;
  };

  // A ball let go at p (x, y, z) moving at v (x, y, z).
  W.dropBall = (p, v) => {
    const body = new CANNON.Body({ mass: MOON_BALL.kg, material: mats.ball, shape: new CANNON.Sphere(MOON_BALL.r), position: new CANNON.Vec3(...p), linearDamping: 0.01, angularDamping: 0.3 });
    body.velocity.set(...v);
    world.addBody(body);
    kind.set(body, 'ball');
    const rec = { body, born: W.time };
    W.balls.push(rec);
    return rec;
  };

  // `dt` s on (clock: see fixed-step.js). Returns { down (how many), fell: the blocks newly down, dropped }.
  W.step = (dt, clock = null) => {
    // an oxygen tank venting: its jet pushes it along its own length (Q125)
    for (const r of W.blocks) {
      if (r.broken || r.popT == null || W.time - r.popT > POP_S) continue;
      const ax = r.body.quaternion.vmult(new CANNON.Vec3(0, 1, 0));
      r.body.velocity.vadd(ax.scale(POP_THRUST * dt), r.body.velocity);
      r.venting = true;
    }
    for (const r of W.blocks) if (r.venting && W.time - r.popT > POP_S) r.venting = false;
    const { dropped } = advance(dt, clock);
    W.time += dt;
    settle();
    for (let i = W.balls.length - 1; i >= 0; i--) {
      const b = W.balls[i];
      if (W.time - b.born > MOON_BALL_LIFE || b.body.position.y < -5) { world.removeBody(b.body); W.balls.splice(i, 1); }
    }
    const fell = [];
    let down = 0;
    for (const r of W.blocks) {
      if (r.broken) { down++; continue; }
      const p = r.body.position, q = r.body.quaternion;
      const slowNow = r.body.velocity.length() < AWAY_SLOW;
      const away = slowNow && (Math.hypot(p.x - r.x0, p.z - r.z0) > AWAY_M || (W.reach && outOfReach(W.reach, p.x, p.z)));
      // a boulder: down once it has rolled away or dropped (it turns as it rolls, so not by its tilt)
      const rolled = r.roll && (Math.hypot(p.x - r.x0, p.z - r.z0) > ROLL_M || p.y < r.y0 - ROLL_DROP);
      const now = away || p.y < -1 || (r.roll ? rolled : isDown([q.x, q.y, q.z, q.w], p.y, r.y0, r.min, r.tall, r.down));
      if (now && !r.down) { fell.push(r); r.away = away ? 'away' : null; }
      r.down = r.tall ? now : (r.down || now);   // a post may get up again (as in the park); a crate stays down
      if (r.down) down++;
      // a boulder that has rolled off: it slows sooner, so the scene isn't held up while it rolls on (Q125)
      if (r.roll && r.down) { r.body.linearDamping = 0.35; r.body.angularDamping = 0.7; }
      // glass or a crystal down that came to rest without a knock (it tipped slowly): shattered now (as the park's ice)
      if (r.down && MOON_MATS[r.mat]?.shatter && r.body.velocity.length() < 0.15 && r.body.angularVelocity.length() < 0.5) todo.set(r, { what: 'shatter', v: 0 });
    }
    settle();
    return { down, fell, dropped };
  };

  const slow = (r, v) => r.broken || r.venting || r.body.sleepState === CANNON.Body.SLEEPING || (r.body.velocity.length() < v && r.body.angularVelocity.length() < v * 4);
  W.still = () => W.blocks.every(r => !r.venting && slow(r, STILL_V)) && W.balls.every(b => b.body.velocity.length() < STILL_V * 4 || b.body.position.y < 0);
  W.calm = () => W.blocks.every(r => !r.venting && slow(r, CALM_V));
  W.poses = () => W.blocks.map(r => ({ at: [r.body.position.x, r.body.position.y, r.body.position.z], q: [r.body.quaternion.x, r.body.quaternion.y, r.body.quaternion.z, r.body.quaternion.w], down: r.down, ...(r.broken ? { broken: true } : {}) }));
  // The standing blocks' boxes as they stand now (for the ring and the lit block), null for one down.
  W.boxes = () => W.blocks.map(r => {
    if (r.down || r.broken) return null;
    const p = r.body.position, q = r.body.quaternion;
    // the box round the turned block
    const ex = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(([x, y, z]) => q.vmult(new CANNON.Vec3(x, y, z)));
    const h = [r.he.x, r.he.y, r.he.z];
    const half = k => Math.abs(ex[0][k]) * h[0] + Math.abs(ex[1][k]) * h[1] + Math.abs(ex[2][k]) * h[2];
    const hx = half('x'), hy = half('y'), hz = half('z');
    return [p.x - hx, p.y - hy, p.z - hz, p.x + hx, p.y + hy, p.z + hz];
  });
  return W;
}
