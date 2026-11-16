// Topple! Hardest: a thing that moves in the way (journal Q106, 2026-11-14;
// developer: "The moving obstacles introduces a timing element to game
// play"; a mockup first). No DOM, three.js or physics here: where the thing
// is at a moment, worked out from the scene's sizes; the physics
// (src/core/topple-world.js, setMovers) moves its bodies there step by
// step, the drawing (src/ui/topple-scene.js) draws them where the physics
// has them.
//
// The park's (session 2): a tyre swing (a ball can go through its hole), a
// bucket seat on a zip line, a kite diving: see LOADS, PARK.
//
// Frosty Times' (session 3; developer, 2026-11-14: "a moving snowman or a
// snowball machine", then "a giant snowflake that falls from the sky"): a
// snowman on skates (slide, on the snow: a ball at his head knocks his hat
// off), the snowball machine (stream: big snowballs lobbed across, one hit
// bursts), a giant snowflake (fall, a fifth way: it drifts down rocking
// from side to side, breaks up on the snow, the next after a wait; a ball
// can pass between its arms): see LOADS, FROSTY.
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
// The build (session 1, the building site; developer, 2026-11-14, of v2:
// "more variance in the speed ... change the obstacle from scene to scene.
// Maybe moving things every other scene and then use space ... for the
// scenes that don't have moving obstacles. And maybe sometimes the obstacle
// can be something falling from the sky"): a fourth way, drop (the crane
// lets the load fall from above the screen, brakes it in the throw's way,
// holds it, hauls it back up); the varied speeds wider; and Hardest's
// scenes dealt (hardestDeal): scenes 1, 3, 5 each a different way and
// load, 2 and 4 spread out (the level's `spread` structures).
//
// Sizes in the world's metres (Far), as sceneParts() gives them.

import { HAND, SCENES, levelInfo, rng } from './topple.js';

// The crane's ways (the building site deals over these four; kept as they
// were, so its deals stay as 10.10 dealt them), and every way: Frosty
// Times' snowflake falls (`fall`, no rope: see PLANS.fall).
export const MOVES = ['slide', 'swing', 'stream', 'drop'];
export const WAYS = [...MOVES, 'fall'];
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
// The building site's (the crane's loads):
export const LOOKS = ['girders', 'bricks'];
export const LOAD = { w: 1.2, h: 0.6, d: 0.45 };                   // the load's box (m): a bundle of girders, a pallet of bricks
// The park's (session 2 of the build; developer, 2026-11-14: the tyre
// swing, the zip-line seat, the kite, "skip the roundabout"; "For the tire,
// being able to shoot through the hole would be cool"), each its own way
// (PARK). Sizes at Far (twice real): a car tyre 0.6 m across, a toddler's
// bucket seat, a child's kite. `shapes`: the physics' boxes ({ half, at,
// rot: about the depth axis }) where one box would stop a ball in thin air:
// the tyre a ring of TYRE_N boxes round a hole (TYRE_HOLE across, clear),
// the kite a diamond in three. The box (w, h, d) is still what inWay and
// the scene check take: the hole is the player's bonus, never counted on.
export const TYRE_N = 10, TYRE_OUT = 0.6, TYRE_HOLE = 0.3;
const ring = (n, rOut, rIn, d) => {
  const rm = (rOut + rIn) / 2, len = 2 * rm * Math.tan(Math.PI / n) * 1.04;
  return Array.from({ length: n }, (_, k) => {
    const a = (k + 0.5) * 2 * Math.PI / n;
    return { half: [len / 2, (rOut - rIn) / 2, d / 2], at: [rm * Math.cos(a), rm * Math.sin(a), 0], rot: a - Math.PI / 2 };
  });
};
// the diamond as bands, each box as wide as the diamond at its outer edge
// (so none sticks out past it): a middle band and three above and below
const BANDS = [0.1, 0.22, 0.34, 0.44];
const diamond = (w, h, d) => {
  const box = (y0, y1, s) => ({ half: [(1 - 2 * y1) * w / 2, (y1 - y0) * h / 2, d / 2], at: [0, s * (y0 + y1) * h / 2, 0], rot: 0 });
  const out = [{ ...box(0, BANDS[0], 0), half: [(1 - 2 * BANDS[0]) * w / 2, BANDS[0] * h, d / 2] }];
  for (let i = 1; i < BANDS.length; i++) for (const s of [1, -1]) out.push(box(BANDS[i - 1], BANDS[i], s));
  return out;
};
// Frosty Times' (session 3). Sizes at Far (twice real), each from its
// box's middle:
// - the snowman: a real one about 1 m tall (three balls, of radius 0.4,
//   0.3 and 0.22 m at Far; 1.15 m at first, which crossing near the hand
//   filled half the screen), on skates, a top hat; he stands
//   on the snow (`ground`: his box's middle at half his height, not
//   HEIGHTS'), so he takes the low and middle throws, not the lobs. His
//   balls are spheres to the physics (`r`); his hat, arms and skates are
//   drawn only. A ball that touches his head (his third ball, `head`)
//   knocks his hat off (told once a scene).
// - the snowball: one of the machine's, 0.6 m across (a sphere), `arc`:
//   lobbed from the machine's muzzle (MUZZLE_Y up, STREAM_OUT past the
//   way's left end) over the line at HEIGHTS' height, down to the snow past
//   the right; one hit bursts (gone until it comes round again). Four of
//   them (n; the crane's stream three loads 1.2 m wide), so the way is open
//   about as often as the other things leave it.
// - the snowflake: 1.4 m across, six arms, two branches on each, as thin
//   boxes (FLAKE_*), none past its circle; the gaps between real, so a ball
//   can pass (`gaps`: told as the tyre's hole is).
export const SNOWMAN = { base: 0.4, mid: 0.3, head: 0.22, skate: 0.07, hat: 0.22, sink: 0.08 };   // (sink: how far each ball sits into the one below, m)
const SNOWMAN_H = SNOWMAN.skate + 2 * (SNOWMAN.base + SNOWMAN.mid + SNOWMAN.head) - 2 * SNOWMAN.sink + SNOWMAN.hat;
const snowmanBalls = () => {
  const { base, mid, head, skate } = SNOWMAN, y0 = -SNOWMAN_H / 2 + skate;
  const yb = y0 + base, ym = yb + base + mid - SNOWMAN.sink, yh = ym + mid + head - SNOWMAN.sink;
  return [{ r: base, at: [0, yb, 0] }, { r: mid, at: [0, ym, 0] }, { r: head, at: [0, yh, 0] }];
};
export const MUZZLE_Y = 0.9;
export const FLAKE_R = 0.7, FLAKE_D = 0.08;
export const FLAKE_ARM = { from: 0.08, w: 0.12 }, FLAKE_BRANCH = { at: 0.42, len: 0.2, w: 0.07, a: 55 * Math.PI / 180 };
const flake = (R, d) => {
  const out = [{ half: [0.1, 0.1, d / 2], at: [0, 0, 0], rot: Math.PI / 4 }];
  const L = R - 0.02 - FLAKE_ARM.from, B = FLAKE_BRANCH;
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a), rm = FLAKE_ARM.from + L / 2;
    out.push({ half: [L / 2, FLAKE_ARM.w / 2, d / 2], at: [rm * c, rm * s, 0], rot: a });
    for (const side of [-1, 1]) {
      const b = a + side * B.a, mx = B.at * c + (B.len / 2) * Math.cos(b), my = B.at * s + (B.len / 2) * Math.sin(b);
      out.push({ half: [B.len / 2, B.w / 2, d / 2], at: [mx, my, 0], rot: b });
    }
  }
  return out;
};
// Cactus Canyon's (session 4; developer, 2026-11-15: "Yes, build those
// picks"). Sizes at Far (twice real), each from its box's middle:
// - the tumbleweed (a rolling cowboy hat since 2026-11-16, Q114: developer,
//   of the tumbleweed's ring, "just looks too much like big balls"; the
//   look keeps its name 'tumbleweed' so the deals stay as they were): 1.3 m
//   across (measured 2026-11-15: a straight throw that hits a block passes
//   the mover's depth 0.9-1.7 m up, so a thing on the sand under 0.9 m, as
//   the first try's 0.84 m, was never in a throw's way), a hat turning end
//   over end as a wheel: a brim 1.24 m long and a crown above it, two
//   boxes to the physics, the gaps round them real so a ball can pass
//   (`gaps`, told as 'through'), rolling along the sand (`ground`, `roll`:
//   it turns as it goes, `hop`: a little hop twice a turn); three in a
//   stream, so it crosses where it goes through neither the scrub nor the
//   cactus (`clear`). (A ring of twigs with four spokes until then.)
// - the mine cart: 1.95 m long and 1.1 m tall on its rails (a real one's 1 m
//   by 0.6, twice), slide, on the ground as the
//   snowman is (the low and middle throws, not the lobs), its ends short of a thing.
// - the vulture: 1.8 m across its wings, drop: dives in, hovers flapping
//   (the physics has its body and two wings; the flap is drawn only), climbs
//   away out of sight.
export const TUMBLE_R = 0.65, TUMBLE_D = 0.56;
// the hat, upright: the brim across the bottom, the crown above it (every corner inside the circle it turns in)
export const HAT = { brim: { half: [0.62, 0.055, 0.28], at: [0, -0.14, 0] }, crown: { half: [0.27, 0.2, 0.25], at: [0, 0.12, 0] } };
const hatShapes = () => [HAT.brim, HAT.crown].map(b => ({ half: [...b.half], at: [...b.at], rot: 0 }));
// Star Light's (session 5; developer, 2026-11-15, of Claude's proposals:
// "I like it all except for the owl. I don't want to be hitting a creature
// with the balls. Something inanimate but moving. It could be a tumbleweed or
// maybe a sled going by"). Measured the same day over 12 scenes (13,395
// straight throws that hit a block): they pass the mover's depth 0.90-1.65 m
// up, so the sled stands 1.3 m tall (see SLED_H) and the lantern 1.2 m. Sizes at Far:
// - the paper lantern: 0.9 m across and 1.2 m tall, swing, hung from out of
//   sight (CABLE_TOP) on a chain like the tyre; one box to the physics;
// - the sled: 1.7 m long and 1.3 m tall (2.0 m long at first: at its nearest
//   depth, 0.4 of the way, 43% of the view's width; 1.7 m, 36%), slide, on the snow as the cart and
//   the snowman are (the low and middle throws, not the lobs), its ends short
//   of a thing; empty of anything alive: a sleigh with a curled end each
//   side (so it needs no front) and sacks and logs on it;
// - the falling star: 1.3 m across, five points, fall (as the snowflake, but
//   it comes down at a slant, not rocking from side to side: `slant`), a
//   tail drawn behind it; the gaps between the points are real (`gaps`, as
//   the snowflake's), so a ball can pass between them.
// (the sled first stood 1.0 m tall: the lowest throws only, under 1.0 m, about 1 in 20 of the 13,395; at 1.3 m
// about half pass under its top, so its tree is what a throw may meet over the body). It is 0.7 m deep and may
// cross as near as 0.4 of the way, the last place tried (AT_TRY: further first): at 0.9 m deep and no nearer than
// 0.5 (the cart's), a rock on the throw line (0.63 m across, 0.5-0.75 of the way) left no depth clear in 14 of 24
// scenes (the check passed 10), and the layout was never found (journal, Q110)
export const SLED_H = 1.3, SLED_W = 1.7;
// the sled's boxes, from its box's middle (y up from the snow: its body 0.1-0.55 m, a board curling up at each
// end to 0.9 m, a fir tree in three tiers to 1.3 m): what a ball touches is what is drawn
const sledShapes = () => {
  const y = w => w - SLED_H / 2;   // a height over the snow -> from the box's middle
  return [
    { half: [SLED_W * 0.45 + 0.06, 0.225, 0.3], at: [0, y(0.325), 0], rot: 0 },
    { half: [0.06, 0.35, 0.3], at: [-SLED_W * 0.45, y(0.55), 0], rot: 0 },
    { half: [0.06, 0.35, 0.3], at: [SLED_W * 0.45, y(0.55), 0], rot: 0 },
    { half: [0.42, 0.175, 0.32], at: [0, y(0.675), 0], rot: 0 },
    { half: [0.3, 0.125, 0.25], at: [0, y(0.975), 0], rot: 0 },
    { half: [0.18, 0.1, 0.18], at: [0, y(1.2), 0], rot: 0 },
  ];
};
export const STAR_R = 0.65, STAR_D = 0.08;
export const STAR_SLOPE = [0.35, 0.8];   // fall: how far to the side it goes for each metre it falls (a share), either way
const star = (R, d) => {
  const out = [{ half: [0.12, 0.12, d / 2], at: [0, 0, 0], rot: Math.PI / 4 }];
  // five points, each an inner box (broad, from the middle) and an outer one (thin, to the tip), none past the circle
  const inner = [0.08, 0.34], outer = [0.34, R - 0.02];
  for (let k = 0; k < 5; k++) {
    const a = Math.PI / 2 + k * 2 * Math.PI / 5, c = Math.cos(a), s = Math.sin(a);
    for (const [[from, to], w] of [[inner, 0.2], [outer, 0.09]]) {
      const L = to - from, rm = from + L / 2;
      out.push({ half: [L / 2, w / 2, d / 2], at: [rm * c, rm * s, 0], rot: a });
    }
  }
  return out;
};
export const LOADS = {
  girders: LOAD,
  bricks: LOAD,
  tyre: { w: 2 * TYRE_OUT, h: 2 * TYRE_OUT, d: 0.36, hole: TYRE_HOLE, shapes: ring(TYRE_N, TYRE_OUT, TYRE_HOLE, 0.36) },
  zip: { w: 0.8, h: 0.6, d: 0.8 },
  kite: { w: 1.0, h: 1.3, d: 0.08, shapes: diamond(1.0, 1.3, 0.08) },
  snowman: { w: 2 * SNOWMAN.base, h: +SNOWMAN_H.toFixed(3), d: 2 * SNOWMAN.base, ground: true, clear: true, head: 2, shapes: snowmanBalls() },
  snowball: { w: 0.6, h: 0.6, d: 0.6, n: 3, arc: true, clear: true, shapes: [{ r: 0.3, at: [0, 0, 0] }] },
  flake: { w: 2 * FLAKE_R, h: 2 * FLAKE_R, d: FLAKE_D, gaps: true, clear: true, shapes: flake(FLAKE_R, FLAKE_D) },
  tumbleweed: { w: 2 * TUMBLE_R, h: 2 * TUMBLE_R, d: TUMBLE_D, n: 3, ground: true, clear: true, roll: true, hop: 0.2, gaps: true, minShare: 0.5, shapes: hatShapes() },
  cart: { w: 1.95, h: 1.125, d: 1.05, ground: true, clear: true, minShare: 0.5 },
  paperLantern: { w: 0.9, h: 1.2, d: 0.9 },
  sled: { w: SLED_W, h: SLED_H, d: 0.7, ground: true, clear: true, minShare: 0.4, shapes: sledShapes() },
  star: { w: 2 * STAR_R, h: 2 * STAR_R, d: STAR_D, gaps: true, clear: true, slant: true, shapes: star(STAR_R, STAR_D) },
  vulture: { w: 1.8, h: 0.6, d: 0.4, shapes: [{ half: [0.17, 0.25, 0.15], at: [0, -0.05, 0], rot: 0 }, { half: [0.35, 0.05, 0.18], at: [-0.5, 0.12, 0], rot: -0.15 }, { half: [0.35, 0.05, 0.18], at: [0.5, 0.12, 0], rot: 0.15 }] },
};
export const ALL_LOOKS = Object.keys(LOADS);
// The park's: each thing its own way (a tyre swings, a seat slides on its
// zip line, a kite dives).
export const PARK = { swing: 'tyre', slide: 'zip', drop: 'kite' };
// Frosty Times': the snowman skates, the machine's snowballs stream, the snowflake falls.
export const FROSTY = { slide: 'snowman', stream: 'snowball', fall: 'flake' };
// Cactus Canyon's: the mine cart slides on its rails, the tumbleweeds stream by, the vulture dives.
export const CANYON = { slide: 'cart', stream: 'tumbleweed', drop: 'vulture' };
// Star Light's: the sled slides on the snow, the paper lantern swings on its chain, the star falls.
export const STAR_LIGHT = { slide: 'sled', swing: 'paperLantern', fall: 'star' };
// The zip line's cable (m up): in sight (the view's top over the line at
// the mover's depth measured 2.81-4.42 m, park scenes, phone upright to
// wide; at 6 m it was out of sight and the seat hung from nowhere). Drawn
// only: a lob may pass through it.
export const ZIP_Y = 2.7;
export const AT = 0.55;          // where it crosses: this share of the way from the hand to the structure
export const CLEAR = 0.6;        // how far past the structure's side (as seen from the hand) its ends are (m)
export const PAUSE = 0.4;        // slide, steady: the stop at each end (s)
export const EASE = 0.15;        // slide: the share of a move spent speeding up, and slowing down
export const CABLE_TOP = 9;      // the cable's top, the crane's jib (out of view); the swing's pivot (m)
export const STREAM_N = 3;       // stream: how many loads
export const STREAM_OUT = 2.5;   // stream: how far past the ends a load goes before it comes round again (m)
export const PLAN_S = 60;        // varied, tricky: how long a plan runs before it goes round again (s)
// varied and tricky: each move's time is the pace times one of these (lo, hi); each stop's (s)
// (v2's: varied 0.6-1.35, tricky 0.5-1.4; developer, 2026-11-14: "more variance in the speed")
export const SPREAD = { varied: { move: [0.45, 1.8], stop: [0.1, 1.0] }, tricky: { move: [0.45, 1.8], stop: [0.1, 1.0] } };
export const FEINT = 0.4;        // tricky, slide: the share of crossings that stop part-way (then on, or back: even odds)
// drop: the load up out of sight (its middle, m), let fall as a thing
// falls (GRAVITY), braked where it hangs (m.y) with a bounce on the cable
// (BOUNCE_M, BOUNCE_S), held, then hauled up (UP_PACES of the pace), and
// a wait up there. Varied and tricky: each hold, haul and wait its own
// (HOLD, UP_SPREAD, WAIT; the first try, the hold also times the move
// spread, kept the way shut up to 3.4 s, most plans thrown away by the
// check's MOVER_SHUT). Tricky: now and then (FEINT) hauled only part way
// and let fall again.
export const DROP_FROM = 11;
export const DROP_G = 9.82;
export const BOUNCE_M = 0.22, BOUNCE_S = 0.5;
export const UP_PACES = 1.1, UP_SPREAD = [0.6, 1.3];
export const HOLD = [0.15, 0.6];    // the hold after the bounce, of the pace
export const WAIT = [0.4, 1.5];    // the wait up out of sight, of the pace
// A throw passes the mover's depth no higher than this (m: measured, lobs
// 2.3-5 m, see HEIGHTS): a load above it is out of the way.
export const THROW_TOP = 5;
// fall (Frosty Times' snowflake; no rope, so nothing hauls it back): it
// drifts down from fallFrom(m.at) (just out of sight, so not a drop's 11
// m, the way open too long: measured 2026-11-14 over 120 of level 3's
// scenes, four screen shapes, the flake's sway's widest either side, it
// must start 6.15 m up to be out of sight crossing at 0.4 of the way, up
// to 7.75 m at 0.75, the upright phone the worst; so 6.6 m at 0.4 and
// 4.6 m more per share further, about 0.45 m over) at its own
// steady speed, a crossing of the throws' heights (THROW_TOP to the snow)
// the pace times FALL_SPREAD (steady: the pace); swaying from side to side
// (SWAY m either way of where it falls, SWAY_P s a sway), so it crosses the
// line at a slant; turning slowly (SPIN rad/s at most). On the snow it
// breaks up and is gone (up at m.from, out of the way) for a wait
// (FALL_WAIT of the pace), then the next falls. Tricky: now and then
// (FEINT) a gust holds it up a while (GUST s, rising GUST_UP m), part way.
export const fallFrom = share => +(6.6 + 4.6 * (share - 0.4)).toFixed(3);
export const FALL_SPREAD = [0.6, 1.5];
export const SWAY = [0.75, 1.1], SWAY_P = [1.8, 3.2], SPIN = 0.5;
export const FALL_WAIT = [0.2, 0.7];
export const GUST = [0.4, 0.9], GUST_UP = 0.25;

export const DEFAULT = { move: 'slide', pace: 'medium', height: 'middle', timing: 'varied', look: 'girders' };

const pick = (v, list, d) => (list.includes(v) ? v : d);

// The mover for a scene's parts (sceneParts()), a choice { move, pace,
// height, timing, look } (unknown values: the defaults) and a seed (the
// scene's: its plan). Returns { move, pace, height, timing, look, cross
// (s), x0 (the throw line's x where it crosses), z, y, span (from x0 to
// each end, m), load, n (loads), plan, at (the share of the way it crosses) }.
// Frosty Times' things (`clear` looks) cross where they go through none of
// the scene's things (the rock stands on the line, mostly 0.5-0.65 of the
// way, where the others cross: measured 2026-11-14, 27 games' scenes): the
// first of AT_TRY clear of them (clashes()), further away first (nearer the
// hand they loom: the snowman at 0.4 of the way filled half a screen),
// else AT, which the scene check throws away. The snowflake breaks up on whatever it comes down on
// (the snow, the rock, the pine's branches); a snowball bursts on the
// first thing in its path.
export const AT_TRY = [0.55, 0.6, 0.65, 0.5, 0.7, 0.75, 0.45, 0.4];
export function moverFor(parts, choice = {}, seed = 1) {
  const c = { ...DEFAULT, ...choice };
  const move = pick(c.move, WAYS, DEFAULT.move);
  const pace = PACES[c.pace] ? c.pace : DEFAULT.pace;
  const height = HEIGHTS[c.height] ? c.height : DEFAULT.height;
  const timing = pick(c.timing, TIMINGS, DEFAULT.timing);
  const look = pick(c.look, ALL_LOOKS, DEFAULT.look);
  const load = LOADS[look];
  const st = parts.stand;
  const meets = load.clear ? meetsThings(parts) : () => null;
  const make = share => {
    const z = HAND.z + (st.z - HAND.z) * share;
    const x0 = HAND.x + (st.x - HAND.x) * share;
    // the structure's half-width as seen at this depth (from the hand), then past it by CLEAR and half the load
    const halfAt = Math.max(Math.abs(parts.bounds.min[0] - st.x), Math.abs(parts.bounds.max[0] - st.x), st.w / 2) * share;
    const span = +(halfAt + CLEAR + load.w / 2).toFixed(3);
    // (a thing on the snow, the snowman: its middle at half its height, whatever the height asked)
    const y = load.ground ? load.h / 2 : HEIGHTS[height];
    const m = { move, pace, height, timing, look, cross: PACES[pace], x0: +x0.toFixed(3), z: +z.toFixed(3), y, span, load: { ...load }, n: move === 'stream' ? load.n ?? STREAM_N : 1, at: share, from: fallFrom(share) };
    // the snowman: each end of his way short of a thing there (the pine off to the left), if still past the line
    if (load.ground) for (const [k, sd] of [['spanL', -1], ['spanR', 1]]) m[k] = groundReach(m, sd, meets);
    m.plan = PLANS[move](m, rng((seed ^ 0x5EED1066) >>> 0), meets);
    return m;
  };
  if (!load.clear) return make(AT);
  // (the big ones, the tumbleweeds and the cart, no nearer than `minShare`: at 0.4 of the way the cart filled the screen; none clear: the layout is thrown away)
  for (const share of AT_TRY) { if (share < (load.minShare ?? 0)) continue; const m = make(share); if (!clashes(m, parts).length) return m; }
  return make(AT);
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
  // A machine's snowballs (`arc`): `end`, the x where they burst (the first thing in their path, or the snow past the right).
  stream(m, rand, meets = () => null) {
    const v = 2 * m.span / m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand();
    // (a machine's heads start at its muzzle, which stands in view at the left, MACHINE_IN short of the structure's side: farL; the rest start and end STREAM_OUT out)
    const far = m.span + STREAM_OUT, farL = m.load.arc ? Math.max(1, m.span - MACHINE_IN) : far, loop = farL + far, gap = loop / m.n;
    const end = m.load.arc ? arcEnd(m, farL, far, meets) : null;
    const offsets = Array.from({ length: m.n }, (_, i) => i * gap + (sp ? r(-0.2, 0.2) * gap : 0));
    if (!sp) return { knots: [{ t0: 0, v, D: 0 }, { t0: loop / v, v, D: loop }], len: loop / v, far, farL, loop, offsets, end };
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
    return { knots, len: t, far, farL, loop, offsets, end };
  },
  // Drops: { t0, from (where the fall starts, m), fall (s), hold (s), up (s, back to DROP_FROM), wait (s) }.
  drop(m, rand) {
    const T = m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand(), k = () => (sp ? r(...UP_SPREAD) : 1);
    const drops = [];
    let t = 0, from = DROP_FROM;
    do {
      const fall = Math.sqrt(2 * (from - m.y) / DROP_G);
      const hold = BOUNCE_S + T * (sp ? r(...HOLD) : (HOLD[0] + HOLD[1]) / 2);
      // tricky: hauled only part way (out of the throws' way, still in sight), let fall again at once
      const part = m.timing === 'tricky' && rand() < FEINT;
      const to = part ? THROW_TOP + m.load.h + r(0.3, 1.2) : DROP_FROM;
      const up = T * UP_PACES * k() * (to - m.y) / (DROP_FROM - m.y);
      const wait = part ? r(0.1, 0.5) : T * (sp ? r(...WAIT) : (WAIT[0] + WAIT[1]) / 2);
      drops.push({ t0: t, from, to, fall, hold, up, wait });
      t += fall + hold + up + wait;
      from = to;
    } while (sp ? t < PLAN_S || from !== DROP_FROM : drops.length < 2);
    return { drops, len: t };
  },
  // Flakes: { t0, v (m/s down), c (where it falls, m off the line), A, P, ph (its sway), spin0, spin (rad/s),
  // gust (null, or { y: the height it holds at, d s }), fall (s, to the snow, or the first thing it comes down
  // on: `meets`, its box a little in from its circle), wait (s, gone) }.
  fall(m, rand, meets = () => null) {
    const T = m.cross, sp = SPREAD[m.timing], r = (lo, hi) => lo + (hi - lo) * rand();
    const flakes = [], land = m.load.h / 2;
    let t = 0;
    do {
      const v = THROW_TOP / (T * (sp ? r(...FALL_SPREAD) : 1));
      const A = sp ? r(...SWAY) : (SWAY[0] + SWAY[1]) / 2, P = sp ? r(...SWAY_P) : (SWAY_P[0] + SWAY_P[1]) / 2;
      const c = sp ? r(-0.25, 0.25) : 0, ph = sp ? r(0, 2 * Math.PI) : 0;
      const spin0 = r(0, Math.PI / 3), spin = sp ? r(-SPIN, SPIN) : SPIN / 2;
      const gust = m.timing === 'tricky' && rand() < FEINT ? { y: r(1.8, 4), d: r(...GUST) } : null;
      let fall = (m.from - land) / v + (gust ? gust.d : 0);
      // (a falling star: which way it slants and how far; drawn after the others, so the snowflake's plans stay as they were)
      const slope = m.load.slant ? (rand() < 0.5 ? -1 : 1) * r(...STAR_SLOPE) : 0;
      const f = { v, c, A, P, ph, gust, slope }, hs = [0.85 * m.load.w / 2, 0.85 * m.load.h / 2, m.load.d / 2];
      for (let s = 0; s < fall; s += 1 / 60) if (meets(flakeAt(m, f, s), hs)) { fall = s; break; }
      const wait = T * (sp ? r(...FALL_WAIT) : (FALL_WAIT[0] + FALL_WAIT[1]) / 2);
      flakes.push({ t0: t, v, c, A, P, ph, spin0, spin, gust, fall, wait, ...(m.load.slant ? { slope } : {}) });
      t += fall + wait;
    } while (sp ? t < PLAN_S : flakes.length < 2);
    return { flakes, len: t };
  },
};

// Where the snowflake is s s into its fall ([x, y, z]; before it lands).
function flakeAt(m, f, s) {
  const y = Math.max(m.load.h / 2, fallY(m, f, s));
  // a falling star slants (over the line at m.y, further right the lower it is if it falls to the right), the snowflake sways
  const dx = m.load.slant ? f.slope * (m.y - y) : f.A * Math.sin(2 * Math.PI * s / f.P + f.ph);
  return [m.x0 + f.c + dx, y, m.z];
}
// The snowflake's height s s into its fall (m): steady down, held up by a gust a while (tricky), to the snow.
function fallY(m, f, s) {
  const y = m.from - f.v * s;
  if (!f.gust || y >= f.gust.y) return y;
  const s1 = (m.from - f.gust.y) / f.v;
  if (s < s1 + f.gust.d) return f.gust.y + GUST_UP * Math.sin(Math.PI * (s - s1) / f.gust.d);
  return f.gust.y - f.v * (s - s1 - f.gust.d);
}

// The drop's height t s into one drop (m): falling, the brake's bounce, held, hauled up, waiting.
function dropY(m, d, s) {
  if (s < d.fall) return d.from - DROP_G * s * s / 2;
  s -= d.fall;
  // the brake: down past where it hangs and back, dying away
  if (s < BOUNCE_S) return m.y - BOUNCE_M * Math.sin(2 * Math.PI * s / BOUNCE_S) * Math.exp(-4 * s / BOUNCE_S);
  if (s < d.hold) return m.y;   // (the hold takes in the bounce)
  s -= d.hold;
  if (s < d.up) return m.y + (d.to - m.y) * eased(s / d.up);
  return d.to;
}

// A machine's snowman's head's height at x (m): through the muzzle (MUZZLE_Y)
// plan.farL left of the line, the line's height over the line, and the snow
// (its radius up) plan.far right of it: the parabola through the three.
export function arcY(m, plan, x) {
  const L = plan.farL, R = plan.far, r = m.load.h / 2, P = MUZZLE_Y - m.y, Q = r - m.y;
  const b = (P * R + Q * L) / (L * R * (L + R)), a = (Q - b * R * R) / R, u = x - m.x0;
  return m.y + a * u + b * u * u;
}
// Where a machine's snowballs burst (x, m): the first thing their path meets (in 2 cm steps from the muzzle), else the snow.
function arcEnd(m, farL, far, meets) {
  const r = m.load.w / 2, hs = [r, r, r];
  for (let x = m.x0 - farL; x < m.x0 + far; x += 0.02) if (meets([x, arcY(m, { farL, far }, x), m.z], hs)) return +x.toFixed(3);
  return +(m.x0 + far).toFixed(3);
}

// How far the stream's line has gone t s in (m).
function streamD(plan, t) {
  const { knots, len } = plan, laps = Math.floor(t / len), u = t - laps * len;
  const k = knots.indexOf(at(knots, u)), a = knots[k], b = knots[Math.min(k + 1, knots.length - 1)];
  const dt = b.t0 - a.t0, s = u - a.t0;
  const D = a.D + a.v * s + (dt > 0 ? (b.v - a.v) * s * s / (2 * dt) : 0);
  return laps * knots.at(-1).D + D;
}

// Where the mover's loads are t s after the scene started: [{ p: [x, y, z],
// tilt (rad, about the depth axis: the swing's lean, the snowflake's turn,
// a snowball's roll), gone (the snowflake broken up on the snow, waiting
// for the next, or a snowball burst: up at m.from, out of the way) }], one per load.
export function moverAt(m, t) {
  const plan = m.plan;
  if (m.move === 'fall') {
    const u = wrap(t, plan.len), f = at(plan.flakes, u), s = u - f.t0;
    if (s >= f.fall) return [{ p: [m.x0, m.from, m.z], tilt: 0, gone: true }];
    // (a star keeps its points up: it does not turn)
    return [{ p: flakeAt(m, f, s), tilt: m.load.slant ? 0 : f.spin0 + f.spin * s, gone: false }];
  }
  if (m.move === 'drop') {
    // straight down over the throw line, and back up
    const u = wrap(t, plan.len), d = at(plan.drops, u);
    return [{ p: [m.x0, dropY(m, d, u - d.t0), m.z], tilt: 0 }];
  }
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
    return plan.offsets.map(o => {
      const x = m.x0 - plan.farL + wrap(D + o, plan.loop);
      if (!m.load.arc) {
        if (!m.load.roll) return { p: [x, m.y, m.z], tilt: 0 };
        // a tumbleweed: rolling along the sand (it turns as far as it goes), hopping twice a turn
        const rad = m.load.w / 2, dx = x - m.x0;
        return { p: [x, m.y + (m.load.hop ?? 0) * Math.abs(Math.sin(dx / rad)), m.z], tilt: -dx / rad };
      }
      // the machine's snowballs: lobbed from its muzzle over the line (at m.y) down to the snow, rolling over as they
      // go; burst at plan.end (gone, up out of the way, till round again)
      if (x >= plan.end) return { p: [m.x0, m.from, m.z], tilt: 0, gone: true };
      return { p: [x, arcY(m, plan, x), m.z], tilt: -(x - m.x0) / (m.load.w / 2) };
    });
  }
  // slide
  const u = wrap(t, plan.len), seg = at(plan.segs, u);
  const f = seg.a + (seg.b - seg.a) * eased((u - seg.t0) / seg.d);
  // (the snowman's ends may each be nearer: spanL, spanR)
  return [{ p: [m.x0 + (f < 0 ? m.spanL ?? m.span : m.spanR ?? m.span) * f, m.y, m.z], tilt: 0 }];
}

// Whether a load is in the throw line's way: across it (its half-width and
// the ball's radius r), and lower than a throw passes (a drop's load up
// out of sight is not).
export const inWay = (m, l, r = 0.07) => !l.gone && Math.abs(l.p[0] - m.x0) < m.load.w / 2 + r && l.p[1] - m.load.h / 2 < THROW_TOP;

// The share of the time the throw line (x0) is clear of every load, over
// the plan (30 s at most) in steps of dt: how open the way is (the log,
// the tests).
export function openShare(m, r = 0.07, dt = 1 / 120) {
  const T = Math.min(m.plan.len, 30);
  let open = 0, n = 0;
  for (let t = 0; t < T; t += dt) {
    n++;
    if (!moverAt(m, t).some(l => inWay(m, l, r))) open++;
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
    const o = !moverAt(m, t).some(l => inWay(m, l, r));
    if (o === was) run += dt; else { if (was !== null) ends.push([was, run]); run = dt; was = o; }
  }
  ends.push([was, run]);
  for (const [o, d] of ends) if (o) open = Math.max(open, d); else shut = Math.max(shut, d);
  return { openS: +open.toFixed(2), shutS: +shut.toFixed(2), changes: ends.length };
}

/* ---------- clear of the things (Frosty Times, session 3) ---------- */

// The snowball machine on the snow, its muzzle (MUZZLE_Y up) at the left end
// of its snowballs' loop, its body behind it (m): drawn only, but it must
// not stand in a thing.
// (the machine in view, at the left: its muzzle this far short of the structure's side at the mover's depth, Q114 session:
// developer, 2026-11-16: "I did not see a machine lobbing snowman heads - just heads floating by")
export const MACHINE_IN = 0.2;
export const MACHINE = { w: 0.9, h: 1.1, d: 0.8, back: 0.35 };
export const machineAt = (m) => [m.x0 - m.plan.farL - MACHINE.back, MACHINE.h / 2, m.z];
// The scene's things (sceneParts()'s bodies but the blocks: the rock, the
// pine, ...) as a test: meets(c, hs), the name of the first thing a box
// round c (half-sizes hs) goes into, else null. Each shape: a sphere, an
// upright cylinder, a box by its circle round.
export function meetsThings(parts) {
  const things = parts.bodies.filter(b => b.kind !== 'block');
  // the distance from a point to a box round c of half-sizes hs, along each axis
  const out = (p, c, hs) => p.map((v, i) => Math.max(0, Math.abs(v - c[i]) - hs[i]));
  return (c, hs) => {
    for (const b of things) for (const s of b.shapes) {
      if (s.type === 'sphere') { if (Math.hypot(...out(s.at, c, hs)) < s.r) return b.thing ?? b.kind; continue; }
      const r = s.type === 'cyl' ? s.r : Math.hypot(s.half[0], s.half[2]), hh = s.type === 'cyl' ? s.hh : s.half[1];
      const o = out(s.at, c, [hs[0], hs[1] + hh, hs[2]]);
      if (o[1] === 0 && Math.hypot(o[0], o[2]) < r) return b.thing ?? b.kind;
    }
    return null;
  };
}
// How far the snowman may skate to one side (sd -1 left, 1 right) of the
// line, at most his span: 5 cm short of the first thing his box meets, in
// 2 cm steps out from the line; never less than ENDS_PAST past it (so the
// way opens), which clashes() then finds.
export const ENDS_PAST = 0.25;
function groundReach(m, sd, meets) {
  const { w, h, d } = m.load, hs = [w / 2, h / 2, d / 2], least = w / 2 + 0.07 + ENDS_PAST;
  for (let e = 0; e <= m.span; e += 0.02) if (meets([m.x0 + sd * e, m.y, m.z], hs)) return +Math.max(least, e - 0.05).toFixed(3);
  return m.span;
}
// Whether a Frosty Times thing (`clear` looks) would go through one of the
// scene's things: the snowman, his box every 1/30 s of the plan (30 s at
// most) as he skates; the machine standing in one, or its snowballs
// bursting on one before they're across the line; the snowflakes coming
// down on one (the rock on the line) more than ON_THINGS of the time, so
// they'd seldom fall past the low throws. (The crane's loads and the
// park's things go over or past them.) Returns the things ([] none).
export const ON_THINGS = 0.3;
export function clashes(m, parts, dt = 1 / 30) {
  if (!LOADS[m.look]?.clear) return [];
  const meets = meetsThings(parts), hits = new Set(), add = k => k && hits.add(k);
  const { w, h, d } = m.load;
  if (m.load.ground) {
    const T = Math.min(m.plan.len, 30), hs = [w / 2, h / 2, d / 2];
    for (let t = 0; t < T; t += dt) for (const l of moverAt(m, t)) if (!l.gone) add(meets(l.p, hs));
  }
  if (m.load.arc) {
    add(meets(machineAt(m), [MACHINE.w / 2, MACHINE.h / 2, MACHINE.d / 2]));
    const r = w / 2;
    if (m.plan.end < m.x0 + r + 0.07) add(meets([m.plan.end, arcY(m, m.plan, m.plan.end), m.z], [r, r, r]) ?? 'snow');
  }
  if (m.move === 'fall') {
    const on = flakesOn(m, meets);
    if (on.share > ON_THINGS) add(on.top);
  }
  return [...hits];
}
// The share of a plan's snowflakes that come down on a thing, not the snow,
// and the thing most of them come down on.
export function flakesOn(m, meets = () => null) {
  const n = {}, hs = [0.85 * m.load.w / 2, 0.85 * m.load.h / 2, m.load.d / 2];
  let on = 0;
  for (const f of m.plan.flakes) {
    const p = moverAt(m, f.t0 + Math.max(0, f.fall - 1e-3))[0].p;
    if (p[1] > m.load.h / 2 + 0.01) { on++; const k = meets(flakeAt(m, f, f.fall), hs) ?? 'something'; n[k] = (n[k] || 0) + 1; }
  }
  const top = Object.keys(n).sort((a, b) => n[b] - n[a])[0] ?? null;
  return { share: +(on / m.plan.flakes.length).toFixed(3), top };
}

/* ---------- Hardest's scenes (the build, session 1) ---------- */

// The levels with a thing that moves (one level a session: the building
// site first, then the park, then the levels in order: developer,
// 2026-11-14, "I suggest we just tackle them in order"; Hardest in the
// others as it was until theirs is built). Each level's things: `looks`
// dealt in turn over any of MOVES (the crane's loads), or `ways` (each
// thing its own way: the park).
export const LEVEL_MOVERS = { 1: { ways: PARK }, 2: { looks: LOOKS }, 3: { ways: FROSTY }, 4: { ways: CANYON }, 5: { ways: STAR_LIGHT } };
export const MOVER_LEVELS = Object.keys(LEVEL_MOVERS).map(Number);
// Scenes with the mover; the others spread out (developer, 2026-11-14:
// "moving things every other scene and then use space").
export const MOVING_SCENES = [1, 3, 5];

// Hardest's five scenes of a game's level (dealt once per game and level,
// so a scene played again is the same one), or null for a level without a
// mover yet: [{ mover: { move, look, timing, pace, height } } | { spread:
// a structure }], scene 1 first. The moving scenes each a different way
// (3 of MOVES): the crane's loads in turn (girders, bricks, or the other
// way round), the park's three things each once (its own way), in a dealt
// order; varied, the 5th (the challenge) tricky; the spread-out scenes two
// different structures of the level's `spread`.
export function hardestDeal(gameSeed, level) {
  const info = levelInfo(level), own = LEVEL_MOVERS[level];
  if (!own || !info?.spread) return null;
  const random = rng((gameSeed ^ Math.imul(level, 0x2C1B3C6D) ^ 0x297A2D39) >>> 0);
  const shuffled = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const moves = shuffled(own.ways ? Object.keys(own.ways) : MOVES), spreads = shuffled(info.spread), look0 = random() < 0.5 ? 0 : 1;
  const lookOf = k => (own.ways ? own.ways[moves[k]] : own.looks[(look0 + k) % own.looks.length]);
  let k = 0, j = 0;
  return Array.from({ length: SCENES }, (_, i) => {
    const n = i + 1;
    if (!MOVING_SCENES.includes(n)) return { spread: spreads[j++ % spreads.length] };
    const c = { move: moves[k], look: lookOf(k), timing: n === SCENES ? 'tricky' : 'varied', pace: DEFAULT.pace, height: DEFAULT.height };
    k++;
    return { mover: c };
  });
}
export const hardestScene = (gameSeed, level, i) => hardestDeal(gameSeed, level)?.[i - 1] ?? null;
