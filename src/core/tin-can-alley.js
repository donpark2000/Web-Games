// Tin Can Alley rules and the stall's measurements (DESIGN.md "Tin Can
// Alley", agreed from the Fairground Stall Mockup v4, 2026-11-09). No DOM,
// three.js or physics here: the cannon-es world is
// src/core/tin-can-alley-physics.js and the screen is src/ui/.
//
// Knock every can off the shelf with 3 balls. One control: drag back and
// let go, as a catapult; how far down sets the speed (and so how high on
// the stack the ball hits), sideways aims the other way. After each throw
// the camera cuts to the side, holds, and glides back behind; then the
// next ball.
//
// A match is a plain object (your face, the cans, the round under way),
// kept on the device as JSON (DESIGN.md "Coming back to a game"); the
// functions here change only the match passed in.

import { FACE_NAMES, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES };

/* ---------- the stall, in metres (as the mockup) ---------- */

// The thrower at z = 0.6 (the camera behind), the counter at z = -0.75,
// the shelf at z = -2.4, 1.0 high.
export const SHELF = { y: 1.0, z: -2.4, w: 1.7, d: 0.26 };
export const SHELF_FRONT = SHELF.z + SHELF.d / 2;
// The curtain (0.06 thick); its face GAP behind the shelf: twice a can's
// height, so a tipped can always falls (mockup v3's 0.22 left cans leaning
// on it).
export const CURTAIN_T = 0.06, GAP = 0.45;
export const BACK = SHELF.z - SHELF.d / 2 - GAP - CURTAIN_T / 2;   // the curtain's middle
export const CAN = { r: 0.075, h: 0.22, kg: 0.14 };               // Medium (developer, 2026-11-09)
export const BALL = { r: 0.06, kg: 0.2 };
export const ELEV = 20 * Math.PI / 180;    // every throw leaves at 20° up
export const HAND = { x: 0, y: 1.25, z: -0.2 };   // where every throw starts
export const GRAVITY = 9.82;

// The stall's solid parts, for the physics and the drawing alike: boxes
// { part, w, h, d, x, y, z }. The ground is a plane at y = 0 (not listed);
// the side walls, roof and valance are only drawn (src/ui).
export const SIDE_X = 1.45, COUNTER_Z = -0.75;
export const STALL_BOXES = [
  { part: 'shelf', w: SHELF.w + 0.1, h: 0.05, d: SHELF.d, x: 0, y: SHELF.y - 0.025, z: SHELF.z },
  { part: 'cabinet', w: SHELF.w + 0.1, h: SHELF.y - 0.05, d: SHELF.d, x: 0, y: (SHELF.y - 0.05) / 2, z: SHELF.z },
  { part: 'curtain', w: 3.0, h: 3.0, d: CURTAIN_T, x: 0, y: 1.5, z: BACK },
  ...[-1, 1].flatMap(sx => [
    { part: 'post', w: 0.1, h: 2.9, d: 0.1, x: sx * SIDE_X, y: 1.45, z: BACK + 0.06, side: sx },
    { part: 'post', w: 0.1, h: 2.9, d: 0.1, x: sx * SIDE_X, y: 1.45, z: COUNTER_Z, side: sx },
  ]),
  { part: 'counter', w: 2.9, h: 0.08, d: 0.4, x: 0, y: 0.81, z: COUNTER_Z },
  { part: 'counter-front', w: 2.9, h: 0.77, d: 0.06, x: 0, y: 0.385, z: -0.57 },
];

/* ---------- the cans ---------- */

// Pyramid 6 (preselected), 10 or 15, or the Wall of 9 (3 by 3, harder).
export const LAYOUTS = ['6', '10', '15', 'wall'];
export const DEFAULT_LAYOUT = '6';
// The cans' colours, a colour per row from the bottom (the 3D stall's and
// the pictures').
export const CAN_COLOURS = ['#E2563F', '#3A94D4', '#F7B928', '#4DB37A', '#8E6CC9'];
export const LAYOUT_NAMES = { 6: 'Pyramid 6', 10: 'Pyramid 10', 15: 'Pyramid 15', wall: 'Wall 9' };

// Each can's place: { x, row, y, z } (its middle), the bottom row first.
// The rows: 3 cans (wall: 3 of 3), or a pyramid's n, n-1 ... 1.
export function layoutRows(kind) {
  if (kind === 'wall') return [3, 3, 3];
  const n = { 6: 3, 10: 4, 15: 5 }[kind];
  if (!n) throw new Error(`layoutRows: unknown cans: ${kind}`);
  return Array.from({ length: n }, (_, row) => n - row);
}
export function layoutSpots(kind) {
  const sp = CAN.r * 2 + 0.006, out = [];
  layoutRows(kind).forEach((k, row) => {
    for (let i = 0; i < k; i++) {
      out.push({ x: (i - (k - 1) / 2) * sp, row, y: SHELF.y + CAN.h / 2 + row * (CAN.h + 0.002) + 0.001, z: SHELF.z });
    }
  });
  return out;
}

// A can is off the shelf once its middle is below the shelf's top, or past
// an edge (it's falling).
export function isOff(p) {
  return p.y < SHELF.y || Math.abs(p.x) > SHELF.w / 2 + 0.05 || Math.abs(p.z - SHELF.z) > SHELF.d / 2;
}

/* ---------- the throw ---------- */

// The drag (dx, dy in px from where it started; dy > 0 is down) on a stage
// whose shorter side is `size` px: power 0-1 from how far down (0.45 of
// the size is full), aim -1 (left) to 1 from sideways (0.35 is full), the
// other way, like a catapult.
export const MIN_POWER = 0.06;   // a shorter drag throws nothing
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function dragToThrow(dx, dy, size) {
  if (!(size > 0)) return { power: 0, aim: 0 };
  return { power: clamp(dy / size / 0.45, 0, 1), aim: clamp(-dx / size / 0.35, -1, 1) || 0 };
}

// The ball's speed (3-12 m/s), its turn (up to 22° each way) and velocity.
export function launchVel(power, aim) {
  const v = 3 + power * 9, yaw = aim * 22 * Math.PI / 180;
  return { v, yaw, vec: [Math.sin(yaw) * Math.cos(ELEV) * v, Math.sin(ELEV) * v, -Math.cos(yaw) * Math.cos(ELEV) * v] };
}

// Where the ring goes: where the path (no air, as the physics flies it)
// crosses the shelf's front ('shelf'), or lands on the ground first
// ('ground'). Returns { where, hit: [x, y, z], t }.
export function predict(power, aim) {
  const { vec } = launchVel(power, aim), g = GRAVITY;
  const at = t => [HAND.x + vec[0] * t, HAND.y + vec[1] * t - 0.5 * g * t * t, HAND.z + vec[2] * t];
  let t = (SHELF_FRONT - HAND.z) / vec[2], where = 'shelf';
  if (at(t)[1] < 0) { t = (vec[1] + Math.sqrt(vec[1] * vec[1] + 2 * g * HAND.y)) / g; where = 'ground'; }
  return { where, hit: at(t), t };
}

/* ---------- the camera ---------- */

// Aim from behind; after a throw, cut to the side (outside the stall, the
// near wall cut away), hold SIDE_HOLD s, glide back behind in GLIDE s.
export const VIEWS = {
  behind: { pos: [0, 1.55, 0.6], look: [0, 1.3, SHELF.z] },
  side: { pos: [3.6, 1.7, -0.5], look: [0, 1.3, -1.4] },
};
export const SIDE_HOLD = 1.8, GLIDE = 0.6;
// The camera `t` s after a throw: { view: 'side' | 'glide' | 'behind', pos, look }.
export function cameraAt(t) {
  const { side, behind } = VIEWS;
  if (t == null || t >= SIDE_HOLD + GLIDE) return { view: 'behind', pos: behind.pos, look: behind.look };
  if (t < SIDE_HOLD) return { view: 'side', pos: side.pos, look: side.look };
  const k = (t - SIDE_HOLD) / GLIDE, e = k * k * (3 - 2 * k);
  const mix = (a, b) => a.map((v, i) => v + (b[i] - v) * e);
  return { view: 'glide', pos: mix(side.pos, behind.pos), look: mix(side.look, behind.look) };
}
// The vertical field of view (°) for a stage of this aspect (width /
// height). Upright (the mockup's): at least 50, wider on a narrow stage so
// the stall's width (about ±18° across) stays in view. Sideways (2026-11-09,
// the developer: the most room for the game in each way of holding it):
// narrower, down to 44, so the stall fills the width (about ±30° across)
// and the cans are bigger, rather than 50 showing the grass beside the
// stall. 44, not less: the ball in the hand is 20° under the camera's
// middle (38 cut it off on a sideways phone, 780 x 340), and Pyramid 15's
// top 15° over it.
export const FOV_MIN_WIDE = 44;
export function fovFor(aspect) {
  const deg = (half, a) => 2 * Math.atan(Math.tan(half * Math.PI / 180) / a) * 180 / Math.PI;
  if (aspect <= 1) return Math.max(50, deg(18, aspect));
  return Math.max(FOV_MIN_WIDE, Math.min(50, deg(30, aspect)));
}

/* ---------- a round ---------- */

export const BALLS = 3;
export const END_HOLD = 0.35;   // all off for this long: won (a can still falling past the edge)
export const END_WAIT = 2;      // out of balls: the round ends this long after the last throw, once the cans are still
export const END_MAX = 7;       // ... or this long after it, still or not

export const checkFaces = ({ p1 }) => checkPicks({ onePlayer: true, p1 });
export function checkSetup({ p1, layout }) {
  return checkFaces({ p1 }) || (LAYOUTS.includes(layout) ? '' : 'unknown-cans');
}

export function createMatch(setup) {
  const why = checkSetup(setup);
  if (why) throw new Error(`createMatch: ${why}`);
  const m = { face: setup.p1, layout: setup.layout, rounds: 0, cleared: 0, round: null };
  newRound(m);
  return m;
}

// A new round: every can back on the shelf, 3 balls. `t` counts the
// round's seconds (the physics' time), `since` the seconds since the last
// throw (null before the first).
export function newRound(m) {
  m.rounds++;
  m.round = { total: layoutSpots(m.layout).length, used: 0, off: 0, t: 0, since: null, allOff: 0, result: null };
  return m.round;
}

export const ballsLeft = r => BALLS - r.used;
// A throw is allowed while the round is on, a ball is left and the camera
// is back behind the thrower.
export function canThrow(m) {
  const r = m.round;
  if (r.result) return { ok: false, why: 'round-over' };
  if (ballsLeft(r) <= 0) return { ok: false, why: 'no-balls' };
  if (cameraAt(r.since).view !== 'behind') return { ok: false, why: 'camera' };
  return { ok: true };
}
export function throwBall(m, power, aim) {
  const c = canThrow(m);
  if (!c.ok) return c;
  if (!(power >= MIN_POWER)) return { ok: false, why: 'too-short' };
  const r = m.round;
  r.used++;
  r.since = 0;
  return { ok: true, ball: r.used, ...launchVel(power, aim), toward: predict(power, aim) };
}

// The round, `dt` s on: `off` cans off the shelf now, `still` whether
// every can has stopped. Returns { offChanged, ended } (ended: the result,
// set once).
export function update(m, dt, { off, still }) {
  const r = m.round;
  r.t += dt;
  if (r.since != null) r.since += dt;
  if (r.result) return { offChanged: false, ended: null };
  const offChanged = off !== r.off;
  r.off = off;
  let won = null;
  if (off >= r.total) {
    r.allOff += dt;
    if (r.allOff > END_HOLD) won = true;
  } else {
    r.allOff = 0;
    if (ballsLeft(r) <= 0 && r.since > END_WAIT && (still || r.since > END_MAX)) won = false;
  }
  if (won === null) return { offChanged, ended: null };
  r.result = { won, off: r.off, total: r.total, balls: r.used };
  if (won) m.cleared++;
  return { offChanged, ended: r.result };
}

// The words at a round's end: "Teddy knocked all 6 off with 2 balls! 🎉",
// "Teddy knocked 4 of 6 off", or nothing off: "None off this time".
export function endWords(result, name) {
  const { won, off, total, balls } = result;
  if (won) return `${name} knocked all ${total} off with ${balls} ball${balls === 1 ? '' : 's'}! 🎉`;
  if (!off) return 'None off this time';
  return `${name} knocked ${off} of ${total} off`;
}
