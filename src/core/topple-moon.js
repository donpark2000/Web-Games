// Topple!'s second world, the moon base (DESIGN.md "Topple!", The moon;
// journal Q119, mockups v1-v6, 2026-11-17). Levels 6-10 of the game: the
// same hearts, jewels, stars and map as the park's, a new way to aim. No
// DOM, three.js or physics here: the physics is src/core/topple-moon-world.js,
// the drawing src/ui/topple-moon.js.
//
// A lander flies to and fro over the base; hold the pad (or Space) to see
// where the ball would land (the orange ring; on Normal the block it would
// hit lights up), drag up to fly farther away, down to come nearer (or ↑ ↓),
// let go to drop: the ball falls straight down from under the lander, with
// its speed. ⇄ (or ← →) turns it round; it turns by itself once the ring is
// past the last structure (developer, mockup v3: "change direction once it
// was past its ability to reach a target").
//
// World metres, y up, z away from you (negative): the mockups' sizes. The
// levels' names and lines are src/core/topple-levels.js's LEVELS (6-10).

import { rng } from './topple.js';

/* ---------- the moon ---------- */

export const MOON_G = 1.62;                 // m/s² (a sixth of Earth's)
export const MOON_BALL = { r: 0.2, kg: 6 }; // the ball dropped (mockups v1-v6)
export const LANDER_Y = 4.3;                // how high it flies (m)
export const DROP_BELOW = 0.55;             // the ball hangs this far under it
export const Z_NEAR = -3.0, Z_FAR = -7.6;   // how near and far it can fly (m)
export const Z_START = -5.0;
export const TURN_PAST = 0.8;               // it turns once the ring is this far past the last structure (m)
export const TURN_ENDS = 1.0;               // its turn at the ends: m/s² (v3)
export const TURN_NOW = 3.0;                // ⇄'s turn: m/s² (v4: about ⅔ s)
export const STEER_PX = 110, STEER_M = 2.2; // a drag of 110 px up flies 2.2 m farther (v3)
export const STEER_KEY = 2.5, STEER_TAP = 0.25;   // ↑ ↓ held: m/s; a tap: m
export const STEER_EASE = 2.5;              // how fast it glides to where it's steered (1/s)

// How hard (each difficulty a game of its own, as in the park): Normal the
// mockup's (developer, v2: "the moon aiming would become clearer if the
// craft moved much slower ... we could keep speed as a tool for making
// levels harder"); Harder faster, the ring but no lit block; Hardest faster
// still, the ring for a scene's first ball only (as the park's Hardest
// first had the dots for the first ball only). Claude's pick, to try.
export const MOON_MODES = {
  normal: { speed: 1.0, light: true, ring: 'always' },
  harder: { speed: 1.35, light: false, ring: 'always' },
  hardest: { speed: 1.7, light: false, ring: 'first' },
};
export const moonMode = m => MOON_MODES[m] ?? MOON_MODES.normal;
export const showsRing = (mode, used) => moonMode(mode).ring === 'always' || used === 0;

// Time for a ball let go under the lander to fall to height h (s).
export const fallTime = (h = 0) => Math.sqrt(2 * Math.max(0, LANDER_Y - DROP_BELOW - MOON_BALL.r - h) / MOON_G);

/* ---------- the lander ---------- */

// A lander for a scene whose structures span x0..x1, flying at `speed`:
// it comes in from the left. { x, vx, dir, turning, accel, z, zT }
export function newLander(span, speed) {
  return { x: span[0] - TURN_PAST - speed * fallTime() - 1.0, vx: speed, speed, dir: 1, turning: false, accel: TURN_ENDS, z: Z_START, zT: Z_START };
}
// Where the ball let go now would come down (the ring's x): ahead by its speed × the fall.
export const ringX = (f, h = 0) => f.x + f.vx * fallTime(h);
// Turn round now (⇄): quicker than the turn at the ends.
export function turnNow(f) { f.dir = -f.dir; f.turning = true; f.accel = TURN_NOW; return f; }
// Fly that way (← →): turns round if it's heading the other way; false if it was already.
export function flyTo(f, dir) { if (f.dir === dir) return false; turnNow(f); return true; }
// Steer to z (clamped to how near and far it can fly).
export const steerTo = (f, z) => { f.zT = Math.min(Z_NEAR, Math.max(Z_FAR, z)); return f.zT; };
// `dt` s on: it turns itself once the ring is past the structures (span),
// eases its speed round at its turn's rate, glides towards zT.
// Returns 'turned' when it turned itself this step.
export function flyStep(f, dt, span) {
  let turned = null;
  const rx = ringX(f);
  if (!f.turning && ((f.dir > 0 && rx > span[1] + TURN_PAST) || (f.dir < 0 && rx < span[0] - TURN_PAST))) {
    f.dir = -f.dir; f.turning = true; f.accel = TURN_ENDS; turned = 'turned';
  }
  if (f.turning) {
    const want = f.dir * f.speed, step = f.accel * dt;
    if (Math.abs(want - f.vx) <= step) { f.vx = want; f.turning = false; } else f.vx += Math.sign(want - f.vx) * step;
  }
  f.x += f.vx * dt;
  f.z += (f.zT - f.z) * Math.min(1, dt * STEER_EASE);
  return turned;
}

/* ---------- the blocks ---------- */

// Materials: light alloy crates, solar panels, metal posts and beams, ore.
// kg/m³ chosen so a block weighs about what the mockups' 1 kg blocks did.
export const MOON_MATS = {
  crate: { density: 9, friction: 0.5, bounce: 0.05 },
  panel: { density: 20, friction: 0.5, bounce: 0.05 },
  post: { density: 10, friction: 0.5, bounce: 0.05 },
  beam: { density: 7, friction: 0.5, bounce: 0.05 },
  ore: { density: 14, friction: 0.6, bounce: 0.05 },
  tank: { density: 8, friction: 0.5, bounce: 0.05 },
};
const E = 0.003;   // a hair between stacked blocks
const B = (mat, w, h, d, x, y0, z = 0) => ({ mat, w, h, d, x, y: y0 + E + h / 2, z });
const top = b => b.y + b.h / 2;

// The structures (from their own middle at the ground; x along the lander's
// line, z towards you +). Every block on the ground is upright, so a ball
// from above can tip it (as in the park).
export const MOON_STRUCTURES = {
  // a tower of crates (v2: slim, 0.36 × 0.55 × 0.36: cubes stood when the ball landed on top)
  // (the game's: 0.32 × 0.6 × 0.32; at 0.36 × 0.55 the test player's balls sat on a lone crate's top in 5 of 225 scenes)
  crates3: () => [0, 1, 2].map(i => B('crate', 0.32, 0.6, 0.32, 0, i * (0.6 + E))),
  crates4: () => [0, 1, 2, 3].map(i => B('crate', 0.3, 0.52, 0.3, 0, i * (0.52 + E))),
  // two towers side by side, close enough that one falling can knock the other
  crates2x2: () => [-0.3, 0.3].flatMap(x => [0, 1].map(i => B('crate', 0.3, 0.6, 0.3, x, i * (0.6 + E)))),
  // solar panels standing in a row: dominoes
  panels3: () => [-0.4, 0, 0.4].map(x => B('panel', 0.08, 0.8, 0.7, x, 0)),
  panels4: () => [-0.6, -0.2, 0.2, 0.6].map(x => B('panel', 0.08, 0.8, 0.7, x, 0)),
  panels6: () => [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map(x => B('panel', 0.08, 0.8, 0.7, x, 0)),
  // an arch: two posts and a crate across them
  arch: () => [B('post', 0.3, 1.1, 0.3, -0.5, 0), B('post', 0.3, 1.1, 0.3, 0.5, 0), B('crate', 1.4, 0.3, 0.5, 0, 1.1 + E)],
  // an antenna arch: the arch with a box on top
  antenna: () => { const a = MOON_STRUCTURES.arch(); return [...a, B('crate', 0.3, 0.45, 0.3, 0, top(a[2]))]; },
  // a trestle with an ore cart on it (mining): two posts, a beam, the cart (a box of ore)
  trestle: () => {
    const ps = [B('post', 0.24, 0.9, 0.24, -0.45, 0), B('post', 0.24, 0.9, 0.24, 0.45, 0)];
    const beam = B('beam', 1.2, 0.18, 0.45, 0, top(ps[0]));
    return [...ps, beam, B('ore', 0.55, 0.4, 0.45, 0, top(beam))];
  },
  // a fuel tank standing on end, with a cap
  tank: () => { const t = B('tank', 0.42, 1.2, 0.42, 0, 0); return [t, B('crate', 0.3, 0.3, 0.3, 0, top(t))]; },
  // a launch gantry: two storeys of posts and beams, a crate on top (tall)
  gantry: () => {
    const p1 = [B('post', 0.24, 1.0, 0.24, -0.42, 0), B('post', 0.24, 1.0, 0.24, 0.42, 0)];
    const b1 = B('beam', 1.14, 0.18, 0.4, 0, top(p1[0]));
    const p2 = [B('post', 0.2, 0.8, 0.2, -0.3, top(b1)), B('post', 0.2, 0.8, 0.2, 0.3, top(b1))];
    const b2 = B('beam', 0.86, 0.16, 0.36, 0, top(p2[0]));
    return [...p1, b1, ...p2, b2, B('crate', 0.32, 0.4, 0.32, 0, top(b2))];
  },
  // a beacon: a tall post with a crate on it
  beacon: () => { const p = B('post', 0.26, 1.5, 0.26, 0, 0); return [p, B('crate', 0.36, 0.36, 0.36, 0, top(p))]; },
};

// A rock ledge to stand a structure on (crater rim): a box, not knocked about.
export const LEDGE = { w: 1.5, h: 0.5, d: 1.1 };

/* ---------- the levels ---------- */

// m: the narrowest span the lander flies over (3 m: a scene of one structure
// had it turning nearly all the time, its x within 0.5 m: a turn takes 2 s)
export const MIN_RUN = 5;
// Three distances (z): near, middle, far (v3: 3.5, 5, 6.8 m).
export const ZS = { n: -3.6, m: -5.0, f: -6.6 };
// A scene: structures at [name, x, distance, on a ledge?]. Scenes 1-4 are
// dealt 4 of the level's 6 (in the order listed, easiest first, so the climb
// is sure); scene 5 is one of its 2 challenges. A done level played again
// deals again (new scenes), as the park's.
const S = (name, x, at = 'm', ledge = false) => ({ name, x, at, ledge });
export const MOON_LEVELS = [
  {
    n: 6,   // Landing Zone
    // everything on one line (developer, v3: a first level "could stand everything on one line (timing only)")
    pool: [
      [S('crates3', 0)],
      [S('arch', 0)],
      [S('panels3', -1.4), S('crates3', 1.4)],
      [S('arch', -1.6), S('crates3', 1.6)],
      [S('panels4', -1.5), S('arch', 1.6)],
      [S('crates3', -2.0), S('antenna', 0.4), S('crates3', 2.5)],
    ],
    challenges: [
      [S('crates4', -2.2), S('panels4', 0), S('antenna', 2.3)],
      [S('antenna', -2.0), S('crates2x2', 0.4), S('crates3', 2.6)],
    ],
  },
  {
    n: 7,   // Solar Farm
    pool: [
      [S('panels4', 0, 'm')],
      [S('panels4', -1.2, 'm'), S('crates3', 1.8, 'f')],
      [S('panels6', 0, 'f')],
      [S('panels4', -1.5, 'n'), S('panels4', 1.5, 'f')],
      [S('crates3', -2.2, 'f'), S('panels4', 0, 'm'), S('arch', 2.4, 'f')],
      [S('panels6', -0.6, 'm'), S('antenna', 2.4, 'n')],
    ],
    challenges: [
      [S('panels6', -1.2, 'f'), S('panels4', 1.0, 'n'), S('crates3', 2.8, 'm')],
      [S('panels4', -2.0, 'n'), S('panels6', 0.6, 'm'), S('crates4', -0.4, 'f')],
    ],
  },
  {
    n: 8,   // Crater Rim
    pool: [
      [S('crates3', 0, 'm', true)],
      [S('arch', -1.4, 'n'), S('crates3', 1.6, 'f', true)],
      [S('panels3', -1.6, 'f', true), S('tank', 1.4, 'n')],
      [S('crates3', -2.0, 'n', true), S('panels4', 0.6, 'f')],
      [S('tank', -2.2, 'f'), S('arch', 0, 'm', true), S('crates3', 2.4, 'n')],
      [S('antenna', -1.6, 'f', true), S('crates2x2', 1.6, 'n')],
    ],
    challenges: [
      [S('crates3', -2.4, 'n', true), S('antenna', 0, 'f'), S('tank', 2.4, 'm', true)],
      [S('panels4', -2.0, 'f', true), S('crates4', 0.4, 'm'), S('arch', 2.5, 'n', true)],
    ],
  },
  {
    n: 9,   // Mining Site
    pool: [
      [S('trestle', 0, 'm')],
      [S('trestle', -1.4, 'f'), S('crates3', 1.4, 'n')],
      [S('tank', -1.8, 'n'), S('trestle', 0.8, 'm')],
      [S('trestle', -1.6, 'n'), S('trestle', 1.6, 'f')],
      [S('crates2x2', -2.2, 'm'), S('trestle', 0.4, 'f'), S('tank', 2.5, 'n')],
      [S('trestle', -2.2, 'f'), S('panels4', 0.2, 'n'), S('trestle', 2.4, 'm')],
    ],
    challenges: [
      [S('trestle', -2.4, 'n'), S('crates4', 0, 'f'), S('trestle', 2.4, 'm'), S('tank', -0.4, 'n')],
      [S('tank', -2.6, 'f'), S('trestle', -0.6, 'm'), S('crates2x2', 1.6, 'n'), S('beacon', 2.8, 'f')],
    ],
  },
  {
    n: 10,   // Launch Pad
    pool: [
      [S('gantry', 0, 'm')],
      [S('beacon', -1.4, 'n'), S('gantry', 1.4, 'f')],
      [S('gantry', -1.6, 'f'), S('tank', 1.6, 'm')],
      [S('beacon', -2.2, 'f'), S('gantry', 0, 'n'), S('beacon', 2.2, 'm')],
      [S('gantry', -1.8, 'm'), S('gantry', 1.8, 'f')],
      [S('tank', -2.4, 'n'), S('gantry', 0, 'f'), S('crates3', 2.4, 'm')],
    ],
    challenges: [
      [S('gantry', -2.2, 'f'), S('gantry', 0, 'n'), S('gantry', 2.2, 'm')],
      [S('beacon', -2.6, 'n'), S('gantry', -0.8, 'f'), S('antenna', 1.2, 'm'), S('gantry', 2.8, 'n')],
    ],
  },
];
export const MOON_FIRST = MOON_LEVELS[0].n;
export const moonLevel = n => MOON_LEVELS.find(l => l.n === n) ?? null;
export const isMoon = n => !!moonLevel(n);

// Which of the level's scenes are played (from the game's seed for the
// level: seedOf): 4 of the 6 in their order (two left out, never the first:
// the level's way in), one of the challenges, and whether it's mirrored.
export function moonDeal(seed, n) {
  const lv = moonLevel(n);
  if (!lv) throw new Error(`moonDeal: not a moon level: ${n}`);
  const r = rng((seed ^ Math.imul(n, 0x51ED27)) >>> 0);
  const out = new Set();
  while (out.size < 2) out.add(1 + Math.floor(r() * 5));
  return { scenes: [0, 1, 2, 3, 4, 5].filter(i => !out.has(i)), challenge: Math.floor(r() * lv.challenges.length), flip: r() < 0.5 };
}

// Scene i (1-5) of moon level n: { level, scene, seed, structures:
// [{ name, x, z, ledge, blocks }], ledges: [{ x, z, w, h, d }], span: [x0, x1],
// earth: { az, el, spin } }. Its x's shift a little with the seed, and half
// the deals are mirrored, so a scene played again isn't quite the same.
export function moonScene(seed, n, i) {
  const lv = moonLevel(n);
  if (!lv || !(i >= 1 && i <= 5)) throw new Error(`moonScene: bad scene ${n}.${i}`);
  const d = moonDeal(seed, n);
  const plan = i <= 4 ? lv.pool[d.scenes[i - 1]] : lv.challenges[d.challenge];
  const r = rng((seed ^ Math.imul(n * 8 + i, 0x2C9277B5)) >>> 0);
  const flip = d.flip ? -1 : 1;
  const structures = [], ledges = [];
  for (const s of plan) {
    const x = Math.round((flip * s.x + (r() - 0.5) * 0.3) * 100) / 100, z = Math.round((ZS[s.at] + (r() - 0.5) * 0.2) * 100) / 100;
    const base = s.ledge ? LEDGE.h : 0;
    if (s.ledge) ledges.push({ x, z, ...LEDGE });
    const blocks = MOON_STRUCTURES[s.name]().map(b => ({ ...b, x: x + b.x, y: b.y + base, z: z + b.z }));
    structures.push({ name: s.name, x, z, ledge: s.ledge, blocks });
  }
  const all = structures.flatMap(s => s.blocks);
  // the lander's run: over every block, and at least MIN_RUN wide (one structure: a run up to it, not a jiggle over it)
  let span = [Math.min(...all.map(b => b.x - b.w / 2)), Math.max(...all.map(b => b.x + b.w / 2))];
  const mid = (span[0] + span[1]) / 2;
  span = [Math.min(span[0], mid - MIN_RUN / 2), Math.max(span[1], mid + MIN_RUN / 2)].map(v => Math.round(v * 100) / 100);
  // the Earth in a slightly different place and turn each scene (developer, 2026-11-17)
  const earth = { az: Math.round((0.25 + r() * 0.5) * 100) / 100, el: Math.round((0.55 + r() * 0.3) * 100) / 100, spin: Math.round(r() * 628) / 100 };
  return { level: n, scene: i, seed, structures, ledges, span, earth, blocks: all };
}

// Where a drop can reach in a scene (as the park's Q103: a block knocked
// further than any throw reaches counts as down): along the line, the ring's
// turning points; across, how near and far the lander flies; each with
// REACH_SPARE for the ball's size. A block standing outside it is out of reach.
export const REACH_SPARE = 0.3;
export const reachOf = span => ({ x: [span[0] - TURN_PAST - REACH_SPARE, span[1] + TURN_PAST + REACH_SPARE], z: [Z_FAR - REACH_SPARE, Z_NEAR + REACH_SPARE] });
export const outOfReach = (reach, x, z) => x < reach.x[0] || x > reach.x[1] || z < reach.z[0] || z > reach.z[1];

// Every block of a scene, its box: [x0, y0, z0, x1, y1, z1].
export const boxOf = b => [b.x - b.w / 2, b.y - b.h / 2, b.z - b.d / 2, b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2];

// Where a ball let go from p with speed vx (along x) comes down, and the
// first standing block (or ledge) it would touch on the way: { x, y, z, hit }
// (hit: the block's index, -1 a ledge, null the ground). `boxes`: the
// standing blocks' boxes (null for one down), `ledges` the scene's.
export function dropPath(p, vx, boxes, ledges = [], dt = 1 / 120) {
  const r = MOON_BALL.r;
  let x = p[0], y = p[1], vy = 0;
  const z = p[2];
  const near = (bx, px, py) => {
    const cx = Math.max(bx[0], Math.min(px, bx[3])), cy = Math.max(bx[1], Math.min(py, bx[4])), cz = Math.max(bx[2], Math.min(z, bx[5]));
    return Math.hypot(px - cx, py - cy, z - cz) < r;
  };
  for (let t = 0; t < 6; t += dt) {
    vy -= MOON_G * dt; x += vx * dt; y += vy * dt;
    for (let k = 0; k < boxes.length; k++) if (boxes[k] && near(boxes[k], x, y)) return { x, y, z, hit: k };
    for (const l of ledges) if (near([l.x - l.w / 2, 0, l.z - l.d / 2, l.x + l.w / 2, l.h, l.z + l.d / 2], x, y)) return { x, y, z, hit: -1 };
    if (y <= r) return { x, y: r, z, hit: null };
  }
  return { x, y, z, hit: null };
}
