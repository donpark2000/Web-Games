// Topple! Hardest: a thing that moves in the way (journal Q106, 2026-11-14;
// developer: "The moving obstacles introduces a timing element to game
// play"; a mockup first). No DOM, three.js or physics here: where the thing
// is at a moment, worked out from the scene's sizes; the physics
// (src/core/topple-world.js, setMovers) moves its bodies there step by
// step, the drawing (src/ui/topple-scene.js) draws them where the physics
// has them.
//
// The building site's: the crane's load (a yellow skip on its hook)
// crossing between the slingshot and the structure, three ways (Claude's
// options, agreed to try all three in the mockup):
// - slide: carried across and back at a steady speed, a short stop at each end;
// - swing: swinging on its cable as a pendulum, fast in the middle, slow at the ends;
// - stream: a line of loads going one way, one after another with gaps.
// The pace is the time of one crossing (s); the height the load's middle
// over the ground (world m). A ball that touches it stops and drops (the
// physics); the dots ignore it (developer, 2026-11-14: "yes"), so the
// timing is the player's.
//
// Sizes in the world's metres (Far), as sceneParts() gives them.

import { HAND } from './topple.js';

export const MOVES = ['slide', 'swing', 'stream'];
export const PACES = { slow: 4, medium: 3, fast: 2 };              // s for one crossing
// The load's middle over the ground (m). Measured 2026-11-14 over five
// building-site scenes (journal, Q106): the straight throws (under 30°)
// that hit a block pass the load's depth 1.0-2.1 m up, half under 1.5;
// lobs 2.3-5 m; about 0.35-0.4 s after the throw. Low takes the low
// straight throws, middle the middle ones, high the top ones and the
// lowest lobs.
export const HEIGHTS = { low: 1.0, middle: 1.5, high: 2.4 };
export const LOAD = { w: 0.9, h: 0.6, d: 0.7 };                    // a crane skip (m)
export const AT = 0.55;          // where it crosses: this share of the way from the hand to the structure
export const CLEAR = 0.6;        // how far past the structure's side (as seen from the hand) its ends are (m)
export const PAUSE = 0.4;        // slide: the stop at each end (s)
export const EASE = 0.15;        // slide: the share of a crossing spent speeding up, and slowing down
export const CABLE_TOP = 9;      // the cable's top, the crane's jib (out of view); the swing's pivot (m)
export const STREAM_N = 3;       // stream: how many loads
export const STREAM_OUT = 2.5;   // stream: how far past the ends a load goes before it comes round again (m)

export const DEFAULT = { move: 'slide', pace: 'medium', height: 'middle' };

// The mover for a scene's parts (sceneParts()) and a choice { move, pace,
// height } (unknown values: the defaults). Returns { move, pace, height,
// cross (s), x0 (the throw line's x where it crosses), z, y, span (from
// x0 to each end, m), load, n (loads) }.
export function moverFor(parts, choice = {}) {
  const c = { ...DEFAULT, ...choice };
  const move = MOVES.includes(c.move) ? c.move : DEFAULT.move;
  const pace = PACES[c.pace] ? c.pace : DEFAULT.pace;
  const height = HEIGHTS[c.height] ? c.height : DEFAULT.height;
  const st = parts.stand;
  const z = HAND.z + (st.z - HAND.z) * AT;
  const x0 = HAND.x + (st.x - HAND.x) * AT;
  // the structure's half-width as seen at this depth (from the hand), then past it by CLEAR and half the load
  const halfAt = Math.max(Math.abs(parts.bounds.min[0] - st.x), Math.abs(parts.bounds.max[0] - st.x), st.w / 2) * AT;
  const span = +(halfAt + CLEAR + LOAD.w / 2).toFixed(3);
  return { move, pace, height, cross: PACES[pace], x0: +x0.toFixed(3), z: +z.toFixed(3), y: HEIGHTS[height], span, load: { ...LOAD }, n: move === 'stream' ? STREAM_N : 1 };
}

// Slide: the share of the way across (-1 to 1) u s into a crossing of T s,
// speeding up over EASE of it, steady, slowing down over EASE.
function eased(u, T) {
  const s = Math.min(1, Math.max(0, u / T)), a = EASE;
  // a trapezoid of speed: its area 1, so the top speed is 1 / (1 - a)
  const top = 1 / (1 - a);
  let f;
  if (s < a) f = top * s * s / (2 * a);
  else if (s > 1 - a) f = 1 - top * (1 - s) * (1 - s) / (2 * a);
  else f = top * (s - a / 2);
  return -1 + 2 * f;
}

// Where the mover's loads are t s after the scene started: [{ p: [x, y, z],
// tilt (rad, about the depth axis: the swing's lean) }], one per load.
export function moverAt(m, t) {
  const T = m.cross;
  if (m.move === 'swing') {
    // a pendulum from CABLE_TOP over the line, out to span at its ends; one swing across in T s
    const L = CABLE_TOP - m.y, amp = Math.asin(Math.min(0.9, m.span / L));
    const th = amp * Math.sin(Math.PI * t / T);
    return [{ p: [m.x0 + L * Math.sin(th), CABLE_TOP - L * Math.cos(th), m.z], tilt: th }];
  }
  if (m.move === 'stream') {
    // one way, left to right, at the slide's middle speed; each load comes round again once out past the end
    const far = m.span + STREAM_OUT, loop = 2 * far, v = 2 * m.span / T, gap = loop / m.n;
    return Array.from({ length: m.n }, (_, i) => {
      const s = (((v * t + i * gap) % loop) + loop) % loop;
      return { p: [m.x0 - far + s, m.y, m.z], tilt: 0 };
    });
  }
  // slide: across, a stop, back, a stop
  const cycle = 2 * (T + PAUSE), u = ((t % cycle) + cycle) % cycle;
  let f;
  if (u < T) f = eased(u, T);
  else if (u < T + PAUSE) f = 1;
  else if (u < 2 * T + PAUSE) f = -eased(u - T - PAUSE, T);
  else f = -1;
  return [{ p: [m.x0 + m.span * f, m.y, m.z], tilt: 0 }];
}

// The share of the time the throw line (x0) is clear of every load (its
// half-width and the ball's radius r), over one cycle in steps of dt: how
// open the way is (the log, the tests).
export function openShare(m, r = 0.07, dt = 1 / 120) {
  const T = m.move === 'slide' ? 2 * (m.cross + PAUSE) : m.move === 'swing' ? 2 * m.cross : (2 * (m.span + STREAM_OUT)) / m.n / (2 * m.span / m.cross);
  let open = 0, n = 0;
  for (let t = 0; t < T; t += dt) {
    n++;
    if (moverAt(m, t).every(l => Math.abs(l.p[0] - m.x0) > m.load.w / 2 + r)) open++;
  }
  return +(open / n).toFixed(3);
}
