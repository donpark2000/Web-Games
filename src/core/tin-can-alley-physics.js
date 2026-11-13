// Tin Can Alley's physics (DESIGN.md "Tin Can Alley"): the stall as a
// cannon-es world (src/vendor/cannon-es), as Fairground Stall Mockup v4
// made it. No DOM or three.js, so the tests run it under Node; the screen
// (src/ui/tin-can-alley-stall.js) draws each body where this puts it.
//
// The cans stand asleep until the ball touches one (awake from the start
// they creep and jitter), then all wake. A can's pose can be given (a
// round picked up again: the cans where they had come to rest).

import * as CANNON from '../vendor/cannon-es/cannon-es.js';
import { SHELF, CAN, BALL, HAND, GRAVITY, STALL_BOXES, layoutSpots, isOff } from './tin-can-alley.js';
import { fixedStepper } from './fixed-step.js';

export const STEP = 1 / 120;     // the physics' fixed step (s)
export const MAX_SUBSTEPS = 12;  // MAX_FRAME_S (0.1 s) of steps a frame (8 until 10.6: Q99)
export const BALL_LIFE = 8;      // a thrown ball is taken away after this long (s), or once below the ground
export const STILL_SPEED = 0.05; // a can slower than this (m/s) counts as still

// `onHit({ a, b, v })` for each knock harder than 0.5 m/s (for the
// sounds): a and b are 'can', 'ball' or 'stall' (the ball's own knocks
// come once, as a: 'ball').
export function createStall({ onHit = () => {} } = {}) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAVITY, 0) });
  world.allowSleep = true;
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.solver.iterations = 20;
  const matCan = new CANNON.Material('can'), matBall = new CANNON.Material('ball'), matWood = new CANNON.Material('wood');
  world.defaultContactMaterial.friction = 0.4;
  world.defaultContactMaterial.restitution = 0.15;
  world.addContactMaterial(new CANNON.ContactMaterial(matCan, matCan, { friction: 0.35, restitution: 0.1 }));
  world.addContactMaterial(new CANNON.ContactMaterial(matCan, matWood, { friction: 0.45, restitution: 0.1 }));
  world.addContactMaterial(new CANNON.ContactMaterial(matBall, matCan, { friction: 0.3, restitution: 0.35 }));
  world.addContactMaterial(new CANNON.ContactMaterial(matBall, matWood, { friction: 0.4, restitution: 0.35 }));

  const ground = new CANNON.Body({ mass: 0, material: matWood, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  ground.kind = 'stall';
  world.addBody(ground);
  for (const s of STALL_BOXES) {
    const b = new CANNON.Body({ mass: 0, material: matWood, shape: new CANNON.Box(new CANNON.Vec3(s.w / 2, s.h / 2, s.d / 2)) });
    b.position.set(s.x, s.y, s.z);
    b.aabbNeedsUpdate = true;   // its box was worked out at the origin (Q63)
    b.kind = 'stall';
    world.addBody(b);
  }

  const advance = fixedStepper(world, STEP, MAX_SUBSTEPS);
  let cans = [], balls = [], time = 0, hits = 0, stepped = { steps: 0, dropped: 0 };
  const kindOf = body => body.kind ?? 'stall';
  const wakeCans = () => { for (const c of cans) c.wakeUp(); };

  function onCanCollide(e) {
    if (e.body.kind === 'ball') return;   // the ball's own listener has it
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (v >= 0.5) onHit({ a: 'can', b: kindOf(e.body), v });
  }
  function onBallCollide(e) {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (e.body.kind === 'can') { hits++; wakeCans(); }
    if (v >= 0.5 || e.body.kind === 'can') onHit({ a: 'ball', b: kindOf(e.body), v, ball: e.target.ball });
  }

  // The round's cans on the shelf (asleep), or at `poses` ([{ p, q }],
  // one per can: where they came to rest).
  function setCans(layout, poses = null) {
    for (const b of [...cans, ...balls]) world.removeBody(b);
    cans = []; balls = []; hits = 0;
    layoutSpots(layout).forEach((s, i) => {
      const body = new CANNON.Body({
        mass: CAN.kg, material: matCan, shape: new CANNON.Cylinder(CAN.r, CAN.r, CAN.h, 12),
        linearDamping: 0.05, angularDamping: 0.12, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.4,
      });
      const pose = poses?.[i];
      if (pose) {
        body.position.set(...pose.p);
        body.quaternion.set(...pose.q);
      } else body.position.set(s.x, s.y, s.z);
      // cannon-es worked out its box (AABB) at the origin as it was made,
      // and won't again until it moves: asleep, the broadphase would sort
      // it as if there and the ball could fly through it (Q63).
      body.aabbNeedsUpdate = true;
      body.kind = 'can';
      body.row = s.row;
      body.start = { x: s.x, y: s.y, z: s.z };
      body.addEventListener('collide', onCanCollide);
      world.addBody(body);
      body.sleep();
      cans.push(body);
    });
    return cans;
  }

  // A ball from the hand at velocity vec ([x, y, z] m/s).
  function throwBall(vec, n) {
    const body = new CANNON.Body({ mass: BALL.kg, material: matBall, shape: new CANNON.Sphere(BALL.r), linearDamping: 0, angularDamping: 0.3 });
    body.position.set(HAND.x, HAND.y, HAND.z);
    body.velocity.set(...vec);
    body.kind = 'ball';
    body.ball = n;
    body.thrownAt = time;
    body.addEventListener('collide', onBallCollide);
    world.addBody(body);
    balls.push(body);
    return body;
  }

  // dt s on, in fixed steps (fixedStepper: clock the game's, to give up
  // catching up when out of time; none in the tests, every step). Returns
  // the balls taken away; `stepped` has the last call's steps and dropped.
  function step(dt, clock = null) {
    stepped = advance(dt, clock);
    time += dt;
    const gone = [];
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (time - b.thrownAt > BALL_LIFE || b.position.y < -2) {
        world.removeBody(b);
        balls.splice(i, 1);
        gone.push(b);
      }
    }
    return gone;
  }

  const asleep = c => c.sleepState === CANNON.Body.SLEEPING;
  return {
    world,
    get cans() { return cans; },
    get balls() { return balls; },
    get time() { return time; },
    get hits() { return hits; },
    get stepped() { return stepped; },
    setCans,
    throwBall,
    step,
    offCount: () => cans.reduce((n, c) => n + (isOff(c.position) ? 1 : 0), 0),
    still: () => cans.every(c => asleep(c) || c.velocity.length() < STILL_SPEED),
    awake: () => cans.filter(c => !asleep(c)).length,
    // Each can's pose, kept for a round picked up again.
    poses: () => cans.map(c => ({ p: [c.position.x, c.position.y, c.position.z].map(r4), q: [c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w].map(r4) })),
    // How far the furthest can has moved from its place (m), and how
    // upright each is (1 standing): for the log and the tests.
    drift: () => Math.max(0, ...cans.map(c => c.position.distanceTo(new CANNON.Vec3(c.start.x, c.start.y, c.start.z)))),
    upright: c => 1 - 2 * (c.quaternion.x ** 2 + c.quaternion.z ** 2),
    asleep,
  };
}
const r4 = v => Math.round(v * 1e4) / 1e4;

// For the tests: the can's top row height, from the shelf (row 0 the bottom).
export const rowOf = y => Math.round((y - SHELF.y - CAN.h / 2) / CAN.h);
