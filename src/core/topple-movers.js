// Topple! Hardest: a thing that moves in the way (journal Q106, 2026-11-14;
// developer: "The moving obstacles introduces a timing element to game
// play"; a mockup first). No DOM, three.js or physics here: where the thing
// is at a moment, worked out from the scene's sizes; the physics
// (src/core/topple-world.js, setMovers) moves its bodies there step by
// step, the drawing (src/ui/topple-scene.js) draws them where the physics
// has them.
//
// The building site's: the crane's load (girders or a pallet of bricks on
// its hook) crossing between the slingshot and the structure, three ways
// (Claude's options, agreed to try all three in the mockup):
// - slide: carried across and back, a stop at each end;
// - swing: swinging on its cable as a pendulum, fast in the middle, slow at the ends;
// - stream: a line of loads going one way, one after another with gaps.
// The pace is the time of one crossing (s); the height the load's middle
// over the ground (world m). A ball that touches it stops and drops (the
// physics); the dots ignore it (developer, 2026-11-14: "yes"), so the
// timing is the player's.
//
// The timing (mockup v2; developer, 2026-11-14, of v1: "rather slow and
// completely predictable ... it just slows it down while you wait for it
// to get out of the way"): steady (v1's, every crossing the same), varied
// (each crossing's speed and each stop its own), or tricky (varied, and
// now and then it stops part-way and goes on or turns back). Varied and
// tricky come from a plan made once from the scene's seed (the same scene,
// the same plan; no clock read), PLAN_S long, then round again.
//
// Sizes in the world's metres (Far), as sceneParts() gives them.

import { HAND, rng } from './topple.js';

export const MOVES = ['slide', 'swing', 'stream'];
// s for one crossing (v1's 4 / 3 / 2 s: "rather slow", 2026-11-14)
export const PACES = { slow: 3, medium: 2, fast: 1.4 };
// The load's middle over the ground (m). Measured 2026-11-14 over five
// building-site scenes (journal, Q106): the straight throws (under 30°)
// that hit a block pass the load's depth 1.0-2.1 m up, half under 1.5;
// lobs 2.3-5 m; about 0.35-0.4 s after the throw. Low takes the low
// straight throws, middle the middle ones, high the top ones and the
// lowest lobs.
export const HEIGHTS = { low: 1.0, middle: 1.5, high: 2.4 };
export const TIMINGS = ['steady', 'varied', 'tricky'];
// What the load looks like (the drawing's; the physics' box is the same):
// v1's yellow skip "did not really look like anything" (2026-11-14).
export const LOOKS = ['girders', 'bricks'];
export const LOAD = { w: 1.2, h: 0.6, d: 0.45 };                   // the load's box (m): a bundle of girders, a pallet of bricks
export const AT = 0.55;          // where it crosses: this share of the way from the hand to the structure
export const CLEAR = 0.6;        // how far past the structure's side (as seen from the hand) its ends are (m)
export const PAUSE = 0.4;        // slide, steady: the stop at each end (s)
export const EASE = 0.15;        // slide: the share of a move spent speeding up, and slowing down
export const CABLE_TOP = 9;      // the cable's top, the crane's jib (out of view); the swing's pivot (m)
export const STREAM_N = 3;       // stream: how many loads
export const STREAM_OUT = 2.5;   // stream: how far past the ends a load goes before it comes round again (m)
export const PLAN_S = 60;        // varied, tricky: how long a plan runs before it goes round again (s)
// varied and tricky: each move's time is the pace times one of these (lo, hi); each stop's (s)
export const SPREAD = { varied: { move: [0.6, 1.35], stop: [0.1, 0.9] }, tricky: { move: [0.5, 1.4], stop: [0.1, 0.9] } };
export const FEINT = 0.4;        // tricky, slide: the share of crossings that stop part-way (then on, or back: even odds)

export const DEFAULT = { move: 'slide', pace: 'medium', height: 'middle', timing: 'varied', look: 'girders' };

const pick = (v, list, d) => (list.includes(v) ? v : d);

// The mover for a scene's parts (sceneParts()), a choice { move, pace,
// height, timing, look } (unknown values: the defaults) and a seed (the
// scene's: its plan). Returns { move, pace, height, timing, look, cross
// (s), x0 (the throw line's x where it crosses), z, y, span (from x0 to
// each end, m), load, n (loads), plan }.
export function moverFor(parts, choice = {}, seed = 1) {
  const c = { ...DEFAULT, ...choice };
  const move = pick(c.move, MOVES, DEFAULT.move);
  const pace = PACES[c.pace] ? c.pace : DEFAULT.pace;
  const height = HEIGHTS[c.height] ? c.height : DEFAULT.height;
  const timing = pick(c.timing, TIMINGS, DEFAULT.timing);
  const look = pick(c.look, LOOKS, DEFAULT.look);
  const st = parts.stand;
  const z = HAND.z + (st.z - HAND.z) * AT;
  const x0 = HAND.x + (st.x - HAND.x) * AT;
  // the structure's half-width as seen at this depth (from the hand), then past it by CLEAR and half the load
  const halfAt = Math.max(Math.abs(parts.bounds.min[0] - st.x), Math.abs(parts.bounds.max[0] - st.x), st.w / 2) * AT;
  const span = +(halfAt + CLEAR + LOAD.w / 2).toFixed(3);
  const m = { move, pace, height, timing, look, cross: PACES[pace], x0: +x0.toFixed(3), z: +z.toFixed(3), y: HEIGHTS[height], span, load: { ...LOAD }, n: move === 'stream' ? STREAM_N : 1 };
  m.plan = PLANS[move](m, rng((seed ^ 0x5EED1066) >>> 0));
  return m;
}

/* ---------- plans: made once per scene, read at any moment ---------- */

// A share of a move (0-1) s of the way through its time: speeding up over
// EASE of it, steady, slowing down over EASE (a trapezoid of speed, area 1).
function eased(s) {
  s = Math.min(1, Math.max(0, s));
  const a = EASE, top = 1 / (1 - a);
  if (s < a) return top * s * s / (2 * a);
  if (s > 1 - a) return 1 - top * (1 - s) * (1 - s) / (2 * a);
  return top * (s - a / 2);
}
// The last entry of a sorted list whose t0 is at or before u.
function at(list, u) {
  let lo = 0, hi = list.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (list[mid].t0 <= u) lo = mid; else hi = mid - 1; }
  return list[lo];
}
const wrap = (t, len) => ((t % len) + len) % len;

const PLANS = {
  // Moves from a to b (the share of the way across, -1 left end to 1 right) over d s; a stop where a = b.
  slide(m, rand) {
    const T = m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand();
    const segs = [];
    let t = 0, f = -1, dir = 1;
    const go = (to, d) => { segs.push({ t0: t, d, a: f, b: to }); t += d; f = to; };
    const stop = d => { segs.push({ t0: t, d, a: f, b: f }); t += d; };
    // steady: v1's cycle (across T, a stop, back T, a stop); varied and tricky: each its own, ending at the left end
    do {
      if (!sp) { go(dir, T); stop(PAUSE); dir = -dir; continue; }
      const pace = T * r(...sp.move);
      if (m.timing === 'tricky' && rand() < FEINT) {
        const mid = dir * r(-0.4, 0.4);
        go(mid, Math.max(0.25, pace * Math.abs(mid - f) / 2));
        stop(r(0.15, 0.6));
        if (rand() < 0.5) dir = -dir;   // back the way it came
        go(dir, Math.max(0.25, pace * Math.abs(dir - f) / 2));
      } else go(dir, pace);
      stop(r(...sp.stop));
      dir = -dir;
    } while (sp ? t < PLAN_S || f !== -1 : segs.length < 4);
    return { segs, len: t };
  },
  // Lobes: out from the middle and back, to one side (even ones right, odd left), d s, amp a share of the widest swing.
  swing(m, rand) {
    const T = m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand();
    const lobes = [];
    let t = 0;
    do {
      const d = sp ? T * r(...sp.move) : T;
      const amp = !sp ? 1 : m.timing === 'tricky' ? r(0.5, 1) : r(0.75, 1);
      lobes.push({ t0: t, d, amp, side: lobes.length % 2 ? -1 : 1 });
      t += d;
    } while (sp ? t < PLAN_S || lobes.length % 2 : lobes.length < 2);
    return { lobes, len: t };
  },
  // Speed knots (m/s), the speed changing evenly between them; D how far the line has gone at each.
  stream(m, rand) {
    const v = 2 * m.span / m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand();
    const far = m.span + STREAM_OUT, loop = 2 * far, gap = loop / m.n;
    const offsets = Array.from({ length: m.n }, (_, i) => i * gap + (sp ? r(-0.2, 0.2) * gap : 0));
    if (!sp) return { knots: [{ t0: 0, v, D: 0 }, { t0: loop / v, v, D: loop }], len: loop / v, far, loop, offsets };
    // each knot's speed the pace's times 1 / the move spread (a short move time, a fast speed); tricky: now and then a stop
    const knots = [{ t0: 0, v }];
    let t = 0;
    while (t < PLAN_S) {
      t += r(0.8, 1.8);
      if (m.timing === 'tricky' && rand() < 0.25) { knots.push({ t0: t, v: 0 }); t += r(0.3, 0.8); knots.push({ t0: t, v: 0 }); t += 0.4; }
      knots.push({ t0: t, v: t < PLAN_S ? v / r(...sp.move) : v });
    }
    knots.at(-1).v = v;   // round again at the speed it started
    knots[0].D = 0;
    for (let k = 1; k < knots.length; k++) knots[k].D = knots[k - 1].D + (knots[k - 1].v + knots[k].v) / 2 * (knots[k].t0 - knots[k - 1].t0);
    return { knots, len: t, far, loop, offsets };
  },
};

// How far the stream's line has gone t s in (m).
function streamD(plan, t) {
  const { knots, len } = plan, laps = Math.floor(t / len), u = t - laps * len;
  const k = knots.indexOf(at(knots, u)), a = knots[k], b = knots[Math.min(k + 1, knots.length - 1)];
  const dt = b.t0 - a.t0, s = u - a.t0;
  const D = a.D + a.v * s + (dt > 0 ? (b.v - a.v) * s * s / (2 * dt) : 0);
  return laps * knots.at(-1).D + D;
}

// Where the mover's loads are t s after the scene started: [{ p: [x, y, z],
// tilt (rad, about the depth axis: the swing's lean) }], one per load.
export function moverAt(m, t) {
  const plan = m.plan;
  if (m.move === 'swing') {
    // a pendulum from CABLE_TOP over the line, out to span at its widest
    const L = CABLE_TOP - m.y, full = Math.asin(Math.min(0.9, m.span / L));
    const u = wrap(t, plan.len), lobe = at(plan.lobes, u);
    const th = lobe.side * full * lobe.amp * Math.sin(Math.PI * Math.min(1, (u - lobe.t0) / lobe.d));
    return [{ p: [m.x0 + L * Math.sin(th), CABLE_TOP - L * Math.cos(th), m.z], tilt: th }];
  }
  if (m.move === 'stream') {
    // one way, left to right; each load comes round again once out past the end
    const D = streamD(plan, t);
    return plan.offsets.map(o => ({ p: [m.x0 - plan.far + wrap(D + o, plan.loop), m.y, m.z], tilt: 0 }));
  }
  // slide
  const u = wrap(t, plan.len), seg = at(plan.segs, u);
  const f = seg.a + (seg.b - seg.a) * eased((u - seg.t0) / seg.d);
  return [{ p: [m.x0 + m.span * f, m.y, m.z], tilt: 0 }];
}

// The share of the time the throw line (x0) is clear of every load (its
// half-width and the ball's radius r), over the plan (30 s at most) in
// steps of dt: how open the way is (the log, the tests).
export function openShare(m, r = 0.07, dt = 1 / 120) {
  const T = Math.min(m.plan.len, 30);
  let open = 0, n = 0;
  for (let t = 0; t < T; t += dt) {
    n++;
    if (moverAt(m, t).every(l => Math.abs(l.p[0] - m.x0) > m.load.w / 2 + r)) open++;
  }
  return +(open / n).toFixed(3);
}

// The longest the way stays open, and stays shut, over the plan (30 s at
// most): how long a player may wait (the log, the tests).
export function gaps(m, r = 0.07, dt = 1 / 120) {
  const T = Math.min(m.plan.len, 30);
  let run = 0, was = null, open = 0, shut = 0;
  const ends = [];
  for (let t = 0; t < T; t += dt) {
    const o = moverAt(m, t).every(l => Math.abs(l.p[0] - m.x0) > m.load.w / 2 + r);
    if (o === was) run += dt; else { if (was !== null) ends.push([was, run]); run = dt; was = o; }
  }
  ends.push([was, run]);
  for (const [o, d] of ends) if (o) open = Math.max(open, d); else shut = Math.max(shut, d);
  return { openS: +open.toFixed(2), shutS: +shut.toFixed(2), changes: ends.length };
}
