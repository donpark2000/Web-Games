// Topple! rules, scenes and camera (DESIGN.md "Topple!", agreed from the
// Block Game Mockup v8, 2026-11-10). No DOM, three.js or physics here: the
// cannon-es world, the path ahead and the scene check are
// src/core/topple-world.js; the screen is src/ui/.
//
// Knock every block of a structure down with 5 balls from a slingshot, in a
// park. A game is levels of 5 scenes (level 1 for now): a scene cleared wins
// a jewel, one not cleared loses one of 3 hearts and is played again; the
// last heart lost goes back to the level's first scene, the same scenes.
// One drag aims, from behind: sideways and up (how hard is the scene's). (The
// side view and backboards are out of level 1, 2026-11-10, Q70: every block
// can be hit from the front with a straight throw.)
//
// Sizes are made in "Near" metres (the mockup's) and drawn at Far: SCALE
// times bigger and further from the hand, so the camera, at a person's
// height, looks down on them less. The ball keeps its size, weighs SCALE³ as
// much (a hit does the same) and is thrown √SCALE as fast (it reaches SCALE
// as far).

import { FACE_NAMES, checkFaces as checkPicks } from './players.js';
import { LEVELS, MAX_LEVEL, STRUCTURES, MATS, BALLS_BY, levelInfo, MAP_NODES, mapRoad, roadAt, roadTo } from './topple-levels.js';

export { FACE_NAMES, LEVELS, MAX_LEVEL, MATS, levelInfo, MAP_NODES, mapRoad, roadAt, roadTo };

/* ---------- sizes, in metres ---------- */

export const HAND = { x: 0, y: 1.25, z: -0.2 };   // the slingshot's pouch: every throw starts here
export const CAM = [0.55, 1.95, 0.9];            // the camera, over the thrower's right shoulder
export const BALL = { r: 0.06, kg: 0.25 };        // (kg at Near; × SCALE³ in the world)
export const SCALE = 2;                           // Far (the mockup's agreed distance)
export const DENSITY = 27;                        // the blocks, kg/m³
export const GRAVITY = 9.82;
export const STEP = 1 / 120;                      // the physics' fixed step, and the path's (s)
export const MAX_AIM = 22, MAX_UP = 70;           // ° sideways, ° up
export const V_MIN = 2, V_MAX = 10;               // the throw's speed at Near for strength 0-1 (m/s)
export const R2D = 180 / Math.PI;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// The slingshot (drawn only): the fork's tips and where its stick meets.
export const FORK_Z = -0.33, FORK_TIP_Y = 1.31, FORK_CROTCH_Y = 1.17;
export const TIPS = [[-0.1, FORK_TIP_Y, FORK_Z], [0.1, FORK_TIP_Y, FORK_Z]];

// Near metres to the world's: sizes and heights × SCALE, depth from the hand.
const X = x => x * SCALE, Y = y => y * SCALE, Z = z => HAND.z + (z - HAND.z) * SCALE;

/* ---------- the structures ---------- */

export const COLOURS = { red: '#E2563F', blue: '#3A94D4', yellow: '#F7B928', green: '#4DB37A', purple: '#8E6CC9' };
const e = 0.001;   // a hair between stacked blocks, so none starts inside another
// Every block touching the ground is upright (taller than it is deep), so a
// hit tips it: a cube on the ground could only be pushed along, and a pushed
// block hasn't fallen. x and z from the structure's middle, y the block's
// middle over the ground; all × SIZE.
export const SIZE = 1.5;
const Bk = (w, h, d, x, y, z, c) => ({ w, h, d, x, y, z, c });
export const STACKS = {
  arch: () => [
    Bk(0.08, 0.34, 0.12, -0.2, 0.17 + e, 0, 'blue'), Bk(0.08, 0.34, 0.12, 0.2, 0.17 + e, 0, 'blue'),
    Bk(0.56, 0.08, 0.14, 0, 0.38 + 2 * e, 0, 'yellow'),
    Bk(0.1, 0.1, 0.1, -0.15, 0.47 + 3 * e, 0, 'green'), Bk(0.1, 0.1, 0.1, 0.15, 0.47 + 3 * e, 0, 'purple'),
  ],
  posts: () => [
    Bk(0.08, 0.30, 0.12, -0.15, 0.15 + e, 0, 'blue'), Bk(0.08, 0.30, 0.12, 0.15, 0.15 + e, 0, 'blue'),
    Bk(0.44, 0.08, 0.14, 0, 0.34 + 2 * e, 0, 'yellow'),
    Bk(0.12, 0.12, 0.12, 0, 0.44 + 3 * e, 0, 'purple'), Bk(0.1, 0.1, 0.1, 0, 0.55 + 4 * e, 0, 'red'),
  ],
  // three upright bricks, a plank, two cubes and one on them
  pyramid: () => [
    Bk(0.08, 0.2, 0.1, -0.13, 0.1 + e, 0, 'red'), Bk(0.08, 0.2, 0.1, 0, 0.1 + e, 0, 'green'), Bk(0.08, 0.2, 0.1, 0.13, 0.1 + e, 0, 'blue'),
    Bk(0.38, 0.06, 0.12, 0, 0.23 + 2 * e, 0, 'yellow'),
    Bk(0.1, 0.1, 0.1, -0.055, 0.31 + 3 * e, 0, 'purple'), Bk(0.1, 0.1, 0.1, 0.055, 0.31 + 3 * e, 0, 'red'),
    Bk(0.1, 0.1, 0.1, 0, 0.41 + 4 * e, 0, 'green'),
  ],
  // the 5th scene's: two storeys
  tower: () => [
    Bk(0.08, 0.28, 0.12, -0.13, 0.14 + e, 0, 'blue'), Bk(0.08, 0.28, 0.12, 0.13, 0.14 + e, 0, 'blue'),
    Bk(0.4, 0.06, 0.14, 0, 0.31 + 2 * e, 0, 'yellow'),
    Bk(0.07, 0.22, 0.1, -0.1, 0.45 + 3 * e, 0, 'green'), Bk(0.07, 0.22, 0.1, 0.1, 0.45 + 3 * e, 0, 'green'),
    Bk(0.32, 0.06, 0.12, 0, 0.59 + 4 * e, 0, 'yellow'),
    Bk(0.1, 0.1, 0.1, 0, 0.67 + 5 * e, 0, 'red'),
  ],
  // the 5th scene's: wide, four posts and two planks with a cube on each
  fence: () => [
    ...[-0.33, -0.11, 0.11, 0.33].map(x => Bk(0.07, 0.3, 0.1, x, 0.15 + e, 0, 'blue')),
    Bk(0.3, 0.06, 0.12, -0.22, 0.33 + 2 * e, 0, 'yellow'), Bk(0.3, 0.06, 0.12, 0.22, 0.33 + 2 * e, 0, 'yellow'),
    Bk(0.1, 0.1, 0.1, -0.22, 0.41 + 3 * e, 0, 'purple'), Bk(0.1, 0.1, 0.1, 0.22, 0.41 + 3 * e, 0, 'red'),
  ],
  // Structures where one hit knocks only some (developer, 2026-11-11, Q72:
  // "it would be better if some shots just knocked some posts down"; the
  // ones above are posts carrying the rest, so a post hit drops it all).
  // More legs: a long plank on four posts, so one knocked leaves it up.
  bench: () => [
    ...[-0.27, -0.09, 0.09, 0.27].map(x => Bk(0.07, 0.28, 0.11, x, 0.14 + e, 0, 'blue')),
    Bk(0.66, 0.07, 0.14, 0, 0.315 + 2 * e, 0, 'yellow'),
    Bk(0.1, 0.1, 0.1, -0.18, 0.40 + 3 * e, 0, 'green'), Bk(0.1, 0.1, 0.1, 0.18, 0.40 + 3 * e, 0, 'red'),
  ],
  // Separate pieces, close enough that one falling can knock the next
  // (developer: "falling pieces from one target could still knock down
  // pieces from another"): two small stacks, the near one on the left, the
  // far one on the right (seen past the near one from behind).
  pair: () => [0, 1].flatMap(k => {
    const cx = k ? 0.07 : -0.07, cz = k ? -0.13 : 0.13;
    return [
      Bk(0.07, 0.26, 0.1, cx - 0.08, 0.13 + e, cz, 'blue'), Bk(0.07, 0.26, 0.1, cx + 0.08, 0.13 + e, cz, 'blue'),
      Bk(0.25, 0.06, 0.12, cx, 0.29 + 2 * e, cz, 'yellow'),
      Bk(0.1, 0.1, 0.1, cx, 0.37 + 3 * e, cz, k ? 'red' : 'green'),
    ];
  }),
  // three posts with a cube on each, in a row slanting away to the right
  row: () => [-1, 0, 1].flatMap(k => [
    Bk(0.08, 0.34, 0.12, k * 0.08, 0.17 + e, -k * 0.16, 'blue'),
    Bk(0.1, 0.1, 0.1, k * 0.08, 0.39 + 2 * e, -k * 0.16, ['green', 'purple', 'red'][k + 1]),
  ]),
  // the 5th scene's: three small stacks slanting away to the right
  trio: () => [-1, 0, 1].flatMap(k => {
    const cx = k * 0.12, cz = -k * 0.15;
    return [
      Bk(0.07, 0.26, 0.1, cx - 0.07, 0.13 + e, cz, 'blue'), Bk(0.07, 0.26, 0.1, cx + 0.07, 0.13 + e, cz, 'blue'),
      Bk(0.22, 0.06, 0.12, cx, 0.29 + 2 * e, cz, 'yellow'),
      Bk(0.1, 0.1, 0.1, cx, 0.37 + 3 * e, cz, ['green', 'purple', 'red'][k + 1]),
    ];
  }),
};
// The ones where a hit knocks only some: at least SOME_MIN of scenes 1-4
// (levelPlan), so a level has both kinds (developer: "use both in
// different scenes").
export const SOME_STACKS = ['bench', 'pair', 'row', 'trio'], SOME_MIN = 2;

// A level's scenes: 1-4 about the same (one thing in the way, a smaller
// structure), the 5th harder (two things, a bigger structure).
export const SCENES = 5, HEARTS = 3, BALLS = 5;
export const sceneOpts = i => (i < SCENES ? { n: 1, stacks: ['arch', 'posts', 'pyramid', 'bench', 'pair', 'row'] } : { n: 2, stacks: ['tower', 'fence', 'trio'] });
// The things in the way in level 1: bushes and trees (developer, 2026-11-10,
// Q70: backboards aren't useful "unless they need to be part of the
// solution", perhaps in a later level of 3D frames). The backboard is still
// made when asked for (ALL_KINDS, makeLayout's pool), for that level.
export const KINDS = ['bush', 'tree'];
export const ALL_KINDS = ['bush', 'tree', 'backboard'];

/* ---------- the trees' leaves ---------- */

// A tree's clump of leaves ({ r, at }) as a little bush (developer,
// 2026-11-10: one big ball looked "like a green sphere with a bit of leaves
// on top"): a ball in the middle and 6 smaller ones round it, more out to
// the sides than up or down, all within about the clump's own radius (the
// ball still touches the clump's sphere: the physics keeps it). Drawn by
// topple-scene.js, each ball a dark core (0.9 of its radius) under leaves.
export function clumpBalls(c, rand) {
  const [x, y, z] = c.at, out = [{ r: c.r * 0.55, at: [x, y, z] }], a0 = rand() * Math.PI * 2;
  for (let i = 0; i < 6; i++) {
    const a = a0 + i * Math.PI / 3 + (rand() - 0.5) * 0.6, up = (rand() - 0.35) * 0.9, d = c.r * (0.45 + 0.12 * rand());
    out.push({ r: c.r * (0.4 + 0.1 * rand()), at: [x + d * Math.cos(a) * Math.cos(up), y + d * Math.sin(up), z + d * Math.sin(a) * Math.cos(up)] });
  }
  return out;
}
export const CORE = 0.9;   // a leaf ball's dark core, of its radius
// How deep a trunk's (or branch's) top end `p` is inside the leaves (m;
// negative: that far short of them, a gap). Developer, 2026-11-11: "there
// is a gap between the trunk part and the bush part ... the bush part
// always [covers] part of the trunk".
// A scene's tree (sceneParts's prop: { at: its foot, clumps }), as drawn:
// its leaf balls, and the ends that must be in them: the trunk's top (the
// middle clump's middle) and each branch's.
export function treeBalls(p) {
  const rand = rng(1 + Math.round(Math.abs(p.at[0] * 7919 + p.at[2] * 104729)));
  return { balls: p.clumps.flatMap(c => clumpBalls(c, rand)), ends: p.clumps.map(c => c.at) };
}
export const inLeaves = (p, balls) => Math.max(...balls.map(b => CORE * b.r - Math.hypot(p[0] - b.at[0], p[1] - b.at[1], p[2] - b.at[2])));
// The trees far off (world metres), one clump each, its leaves drawn 4
// times as big. The trunk tapers from the ground up into the clump's middle
// (until 2026-11-11 it stopped at 1.6 m, short of 10 of the 12 clumps by up
// to 0.62 m). `seed` for clumpBalls's rng.
export const FAR_TREES = [[-9, -22], [-5, -27], [-1.5, -31], [3, -26], [7.5, -23], [12, -29], [-13, -30], [16, -21], [-17, -19], [0.5, -40], [-7, -38], [9, -36]]
  .map(([x, z], i) => {
    const r = 1.5 + (i % 3) * 0.3, y = 2.6 + (i % 2) * 0.4;
    return { x, z, r, y, seed: i + 1, trunk: { r0: 0.24, r1: 0.14, top: y } };
  });
export const farBalls = f => clumpBalls({ r: f.r * 1.05, at: [f.x, f.y, f.z] }, rng(f.seed));
// The least depth of any trunk or branch end in its leaves, over the far
// trees and the scene's trees (sceneParts's props): the log and the tests.
export function trunksIn(props = []) {
  const far = FAR_TREES.map(f => inLeaves([f.x, f.trunk.top, f.z], farBalls(f)));
  const near = props.filter(p => p.part === 'tree').flatMap(p => { const t = treeBalls(p); return t.ends.map(e => inLeaves(e, t.balls)); });
  return { far: +Math.min(...far).toFixed(3), scene: near.length ? +Math.min(...near).toFixed(3) : null };
}

/* ---------- seeds ---------- */

export function rng(seed) {
  let a = seed;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Scene i of a level's seed, from the game's (so a scene played again is the
// same one; only a new game makes new ones); tryN for a layout the check
// threw away.
export const sceneSeed = (gameSeed, level, i, tryN = 0) =>
  Math.floor(rng((gameSeed ^ Math.imul(level, 0x9E3779B1) ^ Math.imul(i, 0x85EBCA6B) ^ Math.imul(tryN + 1, 0xC2B2AE35)) >>> 0)() * 2 ** 31);

// What scenes 1-4 of a level are (developer, 2026-11-10: "Sometimes there
// seemed to be no difference between scenes"; scenes picked each on its own
// had the same structure next door 1 time in 3): dealt once per game and
// level, so a scene played again is still the same one. A different
// structure each scene (with six to pick from since 2026-11-11, Q72; with
// three, never the same twice in a row), at least SOME_MIN of them ones
// where a hit knocks only some. Returns [{ stack, thing }] for scenes 1 to
// SCENES - 1.
export function levelPlan(gameSeed, level) {
  const random = rng((gameSeed ^ Math.imul(level, 0x27D4EB2F) ^ 0x165667B1) >>> 0);
  const combos = sceneOpts(1).stacks.flatMap(stack => KINDS.map(thing => ({ stack, thing })));
  const plan = [];
  for (let i = 1; i < SCENES; i++) {
    const need = SOME_MIN - plan.filter(c => SOME_STACKS.includes(c.stack)).length;
    const left = combos.filter(c => !plan.some(p => p.stack === c.stack) && (need < SCENES - i ? true : SOME_STACKS.includes(c.stack)));
    plan.push(left[Math.floor(random() * left.length)]);
  }
  return plan.map(c => ({ ...c }));
}
// Scene i's options for makeLayout: scenes 1-4 their dealt structure and
// thing (`kinds`, the things to pick from), the 5th as sceneOpts.
export function sceneChoice(gameSeed, level, i) {
  if (i >= SCENES) return sceneOpts(i);
  const { stack, thing } = levelPlan(gameSeed, level)[i - 1];
  return { ...sceneOpts(i), stacks: [stack], kinds: [thing] };
}

/* ---------- a layout: the structure and the things in the way ---------- */

// A structure on the ground, a bit nearer or further, left or right; one or
// two things partly in the way: a bush (solid: the ball bounces off, softly),
// a tree (its trunk in the way of a straight shot, its leaves of a lob) or a
// glass backboard (beside, turned so a throw at it bounces on to the
// structure; or behind it, hung from an arm, so a throw that goes long comes
// back). Seeded: the same seed gives the same layout.
//
// Nothing on the ground within reach of a falling block (mockup v6: a block
// came to rest upright against the backboard's pole and couldn't be knocked
// down): every part of a thing low enough to lean on stands at least the
// reach from the structure's footprint, in plan view. The reach is the
// tallest block plus REACH_SPARE.
export const REACH_SPARE = 0.1;
export const REACH = 1.35;   // how hard: a 45° throw reaches REACH times as far as the structure
const TABLE = { side: 0.08, d: 0.3 };
const norm2 = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };
// where the line from the hand to the structure's middle is at depth z
const lineX = (table, z) => HAND.x + (table.x - HAND.x) * (z - HAND.z) / (table.z - HAND.z);
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;

// The parts of a thing a falling block could lean on, as circles in plan view.
export function lowParts(t, reachH) {
  if (t.kind === 'bush' || t.kind === 'scrub') return t.balls.map(b => ({ x: b.x, z: b.z, r: b.r }));
  if (t.kind === 'tree') return [{ x: t.x, z: t.z, r: t.r }];
  // the pine's low tiers of branches too (a falling frame could rest on them)
  if (t.kind === 'pine') return [{ x: t.x, z: t.z, r: t.r }, ...t.tiers.filter(q => q.y - q.r < reachH).map(q => ({ x: t.x, z: t.z, r: q.r }))];
  if (t.kind === 'light') return [{ x: t.x, z: t.z, r: 0.18 }];
  if (t.kind === 'cactus') return t.arms.map(a => ({ x: a.x, z: a.z, r: a.r })).concat([{ x: t.x, z: t.z, r: t.r }]);
  if (t.kind === 'barrow' || t.kind === 'rock') return t.parts;
  const out = [{ x: t.pole.x, z: t.pole.z, r: 0.035 }];
  if (t.y - t.H / 2 < reachH) for (let i = -3; i <= 3; i++) out.push({ x: t.x + Math.sin(t.yaw) * t.W / 2 * i / 3, z: t.z + Math.cos(t.yaw) * t.W / 2 * i / 3, r: 0.02 });
  return out;
}
// How far the nearest of the parts is from a footprint (a rectangle).
export const gapFrom = (rect, parts) => Math.min(...parts.map(p => Math.hypot(Math.max(rect.x0 - p.x, 0, p.x - rect.x1), Math.max(rect.z0 - p.z, 0, p.z - rect.z1)) - p.r));

// A tall thing's x at depth z: `off` left of the line, or further left if
// that's within reach of the structure (a part of radius r out from it).
function besideX(table, z, room, r, off) {
  const dz = Math.max(0, z - room.rect.z1, room.rect.z0 - z), need = Math.sqrt(Math.max(0, (room.reach + r) ** 2 - dz * dz));
  return Math.min(lineX(table, z) - off, room.rect.x0 - need - 0.01);
}

const PLACE = {
  // Between the hand and the structure, off the line by up to 12 cm: rows of
  // leafy balls from the ground up (no gap a ball could pass through), the
  // top row narrower. Its top just under the camera's sightline to 0.4 of the
  // structure's height, so its upper part shows over it.
  bush(R, table, rng, stackTop, camN, room) {
    const z = room.rect.z1 + room.reach + 0.31 + R(0, 0.25), W = R(0.5, 0.85);
    const x = lineX(table, z) + R(-0.12, 0.12);
    const aimY = table.top + (stackTop - table.top) * 0.4;
    const k = Math.hypot(x - camN.x, z - camN.z) / Math.hypot(table.x - camN.x, table.z - camN.z);
    const H = Math.max(0.3, Math.min(stackTop - 0.08, camN.y + (aimY - camN.y) * k - R(0, 0.05)));
    const rb = clamp(H * 0.45, 0.14, 0.23);
    const n = 3 + Math.round(W / (rb * 1.1)), yLo = rb * 0.9, yHi = Math.max(yLo, H - rb), rows = yHi > yLo ? Math.ceil((yHi - yLo) / (rb * 1.1)) + 1 : 1;
    const balls = [];
    for (let k = 0; k < rows; k++) {
      const top = k === rows - 1 && rows > 1;
      for (let i = top ? 1 : 0; i < (top ? n - 1 : n); i++) {
        const r = rb * R(0.92, 1.08), t = i / (n - 1);
        balls.push({ x: x - W / 2 + 0.7 * r + t * (W - 1.4 * r), y: (rows > 1 ? yLo + k * (yHi - yLo) / (rows - 1) : yLo) + R(-0.02, 0.02), z: z + R(-0.06, 0.06), r });
      }
    }
    return { kind: 'bush', x, z, W, H, balls, foot: { x0: x - W / 2 - 0.05, x1: x + W / 2 + 0.05, z0: z - 0.3, z1: z + 0.3 } };
  },
  // Between, 15-55 cm left of the line: a trunk 1.9 m tall, leaves from
  // about 1.6 m up (a flat shot goes under them, a lob into them); no nearer
  // the slingshot than 1.5 m (nearer, its trunk filled the screen's middle).
  // With a bush level with it, just past the bush's end.
  // Only on the left: on the right it stood between the side view's camera
  // and the throw, so it was see-through there (developer, 2026-11-10: "much
  // lighter coloring"). The draw that picked the side is still made, so the
  // rest of the layout comes out as before. (The side view went since, Q70;
  // the tree stays on the left, as seen and liked.)
  // The leaves in 4 clumps (developer, 2026-11-10: "a few big main branches
  // coming off the trunk"): the trunk splits at 1.3-1.5 m (`from`) and goes
  // on up to a clump over the middle; three branches go out and up, each to
  // a clump, spread round so the branches show between them.
  tree(R, table, rng, stackTop, camN, room, placed = []) {
    rng();
    const z = Math.min(-1.7, table.z + R(0.55, 1.6)), r = R(0.07, 0.11), trunkH = 1.9;
    let x = lineX(table, z) - R(0.15, 0.55);
    const bush = placed.find(t => t.kind === 'bush');
    if (bush && z + 0.2 > bush.foot.z0 && z - 0.2 < bush.foot.z1) x = Math.min(x, bush.foot.x0 - 0.21);
    const fork = R(1.3, 1.5), a0 = R(0, 2 * Math.PI);
    const leaves = [{ x: x + R(-0.05, 0.05), y: R(2.35, 2.5), z: z + R(-0.05, 0.05), r: R(0.36, 0.42), from: fork }];
    for (let i = 0; i < 3; i++) {
      const a = a0 + i * 2 * Math.PI / 3 + R(-0.4, 0.4), d = R(0.4, 0.52);
      leaves.push({ x: x + d * Math.cos(a), y: R(1.95, 2.25), z: z + d * Math.sin(a), r: R(0.28, 0.35), from: fork + R(-0.12, 0.12) });
    }
    return { kind: 'tree', where: 'left', x, z, r, trunkH, leaves, foot: { x0: x - 0.2, x1: x + 0.2, z0: z - 0.2, z1: z + 0.2 } };
  },
  // A glass backboard, 0.9 × 0.6: beside, turned so a throw at its middle
  // bounces on to the structure's middle (moved out sideways until its
  // nearest end and its pole are the reach away, turned again each time); or
  // behind, facing the thrower, its foot over the structure's top, hung from
  // an arm on a pole out of reach behind (as a basketball hoop).
  backboard(R, table, rng, stackTop, camN, room) {
    const behind = rng() < 0.5;
    const W = 0.9, H = 0.6;
    let x, y, z, n, side = 0, t;
    const make = () => ({ kind: 'backboard', where: behind ? 'behind' : side < 0 ? 'left' : 'right', x, y, z, W, H, n, yaw: Math.atan2(-n[1], n[0]) });
    if (behind) {
      x = table.x + R(-0.15, 0.15); z = table.z - table.d / 2 - R(0.08, 0.18); y = stackTop + 0.05 + 0.3 + R(0, 0.1);
      const a = R(-0.25, 0.25); n = [Math.sin(a), Math.cos(a)];
      t = make();
      for (let arm = 0.25; arm < 2; arm += 0.05) {
        t.arm = arm; t.pole = { x: x - n[0] * arm, z: z - n[1] * arm };
        if (gapFrom(room.rect, lowParts(t, room.reachH)) >= room.reach) break;
      }
    } else {
      side = rng() < 0.5 ? -1 : 1;
      x = table.x + side * (table.w / 2 + R(0.3, 0.5)); z = table.z + R(0.1, 0.35); y = Math.max(0.4, stackTop * R(0.6, 0.85));
      for (let i = 0; i < 12; i++) {
        const d1 = norm2(x - HAND.x, z - HAND.z), d2 = norm2(table.x - x, table.z - z);
        n = norm2(d2[0] - d1[0], d2[1] - d1[1]);
        t = make(); t.pole = { x: x - n[0] * 0.06, z: z - n[1] * 0.06 };
        const gap = gapFrom(room.rect, lowParts(t, room.reachH));
        if (gap >= room.reach) break;
        x += side * (room.reach - gap + 0.02);
      }
    }
    const xs = [x - 0.35, x + 0.35, t.pole.x - 0.1, t.pole.x + 0.1], zs = [z - 0.35, z + 0.35, t.pole.z - 0.1, t.pole.z + 0.1];
    t.foot = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    return t;
  },

  /* ---------- levels 2-4's things (Near metres; drawn by src/ui/topple-sets.js) ---------- */
  // Soft (the bush's job: a ball that lands in it keeps 0.1 of its speed):
  // between the hand and the structure, off the line, just out of reach.
  // A wheelbarrow of gravel, side on (mockup v3: "I really like the wheel
  // barrow"): 1 m long, its tray 0.38 m deep (world); wheel left or right.
  barrow(R, table, rng, stackTop, camN, room) {
    const z = room.rect.z1 + room.reach + 0.2 + R(0, 0.12), x = lineX(table, z) + R(-0.12, 0.12);
    const yaw = R(-0.45, 0.45) + (rng() < 0.5 ? 0 : Math.PI), c = Math.cos(yaw), s = Math.sin(yaw);
    const parts = [-1, -0.5, 0, 0.5, 1].map(k => ({ x: x + c * 0.25 * k, z: z - s * 0.25 * k, r: 0.18 }));
    return { kind: 'barrow', job: 'soft', x, z, yaw, H: 0.33, parts, foot: { x0: x - 0.55, x1: x + 0.55, z0: z - 0.35, z1: z + 0.35 } };
  },
  // A rock with snow on its top and one side (developer, 2026-11-12: the
  // round heap of snow "looks like 1/2 a sphere", a wind-blown drift
  // "still not very real looking"; "maybe a rock with a bit of snow on top
  // and/or one side"): 1.2-1.44 x 0.96-1.12 m, 0.38-0.46 m tall (world),
  // half buried. Its job is the drift's: it stops the ball (soft). Draws as
  // many numbers from the layout's random as the heap and the drift did.
  rock(R, table, rng, stackTop, camN, room) {
    const z = room.rect.z1 + room.reach + 0.28 + R(0, 0.12), x = lineX(table, z) + R(-0.12, 0.12);
    const rx = R(0.3, 0.36), rz = R(0.24, 0.28), H = R(0.19, 0.23), yaw = R(-0.6, 0.6), seed = 1 + Math.floor(rng() * 1e6);
    const parts = [{ x, z, r: (rx + rz) / 2 }];   // the physics' round cap (sceneParts), where it meets the ground
    return { kind: 'rock', job: 'soft', x, z, rx, rz, H, yaw, seed, parts, foot: { x0: x - rx - 0.05, x1: x + rx + 0.05, z0: z - rx, z1: z + rx } };
  },
  // Desert scrub: level 1's bush, lower and greyer (sagebrush).
  // (as tall as level 1's bush, it hid the saloon's front row of barrels
  // completely: as if the structure were 0.32 m tall (Near), at most)
  scrub(R, table, rng, stackTop, camN, room, placed) {
    return { ...PLACE.bush(R, table, rng, Math.min(stackTop, 0.32), camN, room, placed), kind: 'scrub', job: 'soft' };
  },
  // Tall (the tree's job): to the left of the line, its stem in the way of a
  // straight throw, its top of a lob; no nearer the slingshot than 1.5 m.
  // A building site's light on a pole (mockup v1): 3.4 m (world), a
  // concrete foot, two lamps on a bar at the top.
  light(R, table, rng, stackTop, camN, room) {
    rng();
    const z = Math.min(-1.7, table.z + R(0.55, 1.4)), x = besideX(table, z, room, 0.18, R(0.06, 0.3));
    return { kind: 'light', job: 'tall', x, z, poleH: 1.7, foot: { x0: x - 0.3, x1: x + 0.3, z0: z - 0.2, z1: z + 0.2 } };
  },
  // A snowy pine: a trunk 3.9 m (world) and four tiers of branches, the
  // lowest 1.15 m up (a flat throw passes under it).
  pine(R, table, rng, stackTop, camN, room) {
    rng();
    const k = R(0.9, 1.08), z = Math.min(-1.7, table.z + R(0.55, 1.5));
    const tiers = [[0.95, 0.39], [1.3, 0.31], [1.6, 0.23], [1.85, 0.15]].map(([y, r]) => ({ y: y * k, r: r * k }));
    const reachR = Math.max(0.05, ...tiers.filter(q => q.y - q.r < room.reachH).map(q => q.r)), x = besideX(table, z, room, reachR, R(0.25, 0.45));
    return { kind: 'pine', job: 'tall', x, z, r: 0.05, trunkH: 1.95 * k, tiers, foot: { x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4 } };
  },
  // A saguaro cactus: a ribbed trunk 2.8 m (world) and two arms that bend up.
  cactus(R, table, rng, stackTop, camN, room) {
    rng();
    const z = Math.min(-1.7, table.z + R(0.55, 1.4)), x = besideX(table, z, room, 0.3, R(0.12, 0.35)), h = R(1.3, 1.5);
    const a0 = R(0, Math.PI);
    const arms = [[-1, R(0.6, 0.7), R(1.0, 1.1)], [1, R(0.8, 0.9), R(1.15, 1.25)]].map(([side, y0, y1]) => {
      const out = R(0.2, 0.24), a = a0 + (side < 0 ? Math.PI : 0);
      return { x: x + Math.cos(a) * out, z: z + Math.sin(a) * out * 0.6, y0, y1, r: 0.065, out, a };
    });
    return { kind: 'cactus', job: 'tall', x, z, r: 0.085, h, arms, foot: { x0: x - 0.35, x1: x + 0.35, z0: z - 0.3, z1: z + 0.3 } };
  },
};

// The camera in Near metres (sizes scale from the hand), for placing the bush.
const CAM_N = { x: CAM[0] / SCALE, y: CAM[1] / SCALE, z: HAND.z + (CAM[2] - HAND.z) / SCALE };

// A layout from its seed: { seed, stack, table (the structure's footprint),
// blocks, things, power (the throw's strength, the scene's), reach,
// unplaced (things that found no room in 20 tries), tooNear }. `pool`: the
// things to pick from (all three; one, for the tests; opts.kinds, a scene's
// dealt thing, sceneChoice, wins).
export function makeLayout(seed, opts = sceneOpts(1), pool = KINDS) {
  if (opts.kinds) pool = opts.kinds;
  const random = rng(seed), R = (a, b) => a + (b - a) * random(), pick = arr => arr[Math.floor(random() * arr.length)];
  const stack = pick(opts.stacks);
  const rel = STACKS[stack]().map(b => ({ ...b, w: b.w * SIZE, h: b.h * SIZE, d: b.d * SIZE, x: b.x * SIZE, y: b.y * SIZE, z: b.z * SIZE }));
  const half = Math.max(...rel.map(b => Math.abs(b.x) + b.w / 2));
  // "table": the structure's footprint on the ground (top 0), for placing the things round it
  // A structure with depth (the pair, the row, the trio): the footprint
  // deeper, and set back so its front stands where a one-row structure's
  // does (in front, the row's near post left a tree no room 80 times in 300).
  const deep = 2 * Math.max(...rel.map(b => Math.abs(b.z) + b.d / 2)) + TABLE.side * 2;
  const back = Math.max(0, Math.max(...rel.map(b => b.z + b.d / 2)) - 0.07 * SIZE);
  const table = { w: 2 * half + TABLE.side * 2, d: Math.max(TABLE.d * SIZE, deep), top: 0, x: R(-0.35, 0.35), z: R(-3.1, -2.5) - back };
  const blocks = rel.map(b => ({ ...b, x: table.x + b.x, y: table.top + b.y, z: table.z + b.z }));
  const kinds = [];
  for (let i = 0; i < opts.n; i++) { const left = pool.filter(k => !kinds.includes(k)); kinds.push(pick(left.length ? left : pool)); }
  // placed in this order: the bush has the least room, the tree the most
  const ORDER = { bush: 0, backboard: 1, tree: 2 };
  kinds.sort((a, b) => ORDER[a] - ORDER[b]);
  const tableFoot = { x0: table.x - table.w / 2 - 0.05, x1: table.x + table.w / 2 + 0.05, z0: table.z - table.d / 2 - 0.05, z1: table.z + table.d / 2 + 0.05 };
  const stackTop = Math.max(...blocks.map(b => b.y + b.h / 2));
  const tallest = Math.max(...blocks.map(b => b.h));
  const room = {
    rect: { x0: Math.min(...blocks.map(b => b.x - b.w / 2)), x1: Math.max(...blocks.map(b => b.x + b.w / 2)), z0: Math.min(...blocks.map(b => b.z - b.d / 2)), z1: Math.max(...blocks.map(b => b.z + b.d / 2)) },
    reach: tallest + REACH_SPARE, reachH: tallest + REACH_SPARE,
  };
  const things = [];
  let tooNear = 0;
  for (const k of kinds) {
    for (let tries = 0; tries < 20; tries++) {
      const c = PLACE[k](R, table, random, stackTop, CAM_N, room, things);
      if (things.some(o => overlaps(o.foot, c.foot))) continue;
      if (k !== 'backboard' && overlaps(c.foot, tableFoot)) continue;
      c.gap = gapFrom(room.rect, lowParts(c, room.reachH));
      if (c.gap < room.reach - 1e-9) { tooNear++; continue; }
      things.push(c); break;
    }
  }
  // How hard: a 45° throw reaches about REACH times as far as the structure.
  // With a backboard behind, enough to reach its foot (15 cm up it): the
  // least speed to pass a point dx away and dy up is √(g (dy + √(dx² + dy²))), +8%.
  const dist = Math.hypot(table.x - HAND.x, table.z - HAND.z);
  let v = Math.sqrt(GRAVITY * REACH * dist);
  for (const t of things) if (t.where === 'behind') {
    const dx = Math.hypot(t.x - HAND.x, t.z - HAND.z), dy = t.y - t.H / 2 + 0.15 - HAND.y;
    v = Math.max(v, 1.08 * Math.sqrt(GRAVITY * (dy + Math.hypot(dx, dy))));
  }
  const power = clamp((v - V_MIN) / (V_MAX - V_MIN), 0.3, 0.8);
  const unplaced = kinds.filter(k => things.filter(t => t.kind === k).length < kinds.filter(x => x === k).length);
  return { seed, n: opts.n, stack, table, blocks, things, power: +power.toFixed(3), reach: +room.reach.toFixed(2), unplaced: [...new Set(unplaced)], tooNear };
}

// Levels 2 on: the structures of a game's level (levelDeal), dealt once per
// game and level seed (so a scene played again is the same one): scenes 1-4
// four of the level's pool of six, kept in the pool's order (easiest first,
// so the climb in difficulty is sure: journal, "Level 2's scenes"), the 5th
// one of its challenges (10.3: until then five in a fixed order; developer,
// 2026-11-12, "different target arrangements").
export function levelDeal(gameSeed, level) {
  const info = levelInfo(level);
  if (!info?.pool) throw new Error(`levelDeal: no level ${level}`);
  const random = rng((gameSeed ^ Math.imul(level, 0x5BD1E995) ^ 0x1B873593) >>> 0);
  const left = info.pool.map((name, i) => ({ name, i }));
  while (left.length > SCENES - 1) left.splice(Math.floor(random() * left.length), 1);
  return [...left.map(c => c.name), info.challenges[Math.floor(random() * info.challenges.length)]];
}
// Scene i: the structure `name` (the deal's for this seed when none is
// given), its small sizes and where it and the things stand from the seed. Scenes 1 and 3
// have the level's soft thing, 2 and 4 its tall one, the 5th both. The
// things stand out of reach of the whole structure falling, not only its
// tallest block (journal, mockup v1: "for frames the reach should be the
// structure's height"; FRAME_REACH of it, as a frame falls as it tips).
// The throw is fast enough to reach the top (mockup v1: level 1's rule
// gives too little for four storeys; +8%).
export const FRAME_REACH = 0.6;
export function frameLayout(seed, level, i, name = null) {
  const info = levelInfo(level);
  if (!info?.pool) throw new Error(`frameLayout: no level ${level}`);
  name ??= levelDeal(seed, level)[i - 1];
  if (!STRUCTURES[name]) throw new Error(`frameLayout: no structure ${name}`);
  const random = rng(seed), R = (a, b) => a + (b - a) * random();
  const ks = {}, k = key => (ks[key] ??= R(0.95, 1.05));
  const rel = STRUCTURES[name](k).map(b => ({ ...b, w: b.w / SCALE, h: b.h / SCALE, d: b.d / SCALE, x: b.x / SCALE, y: b.y / SCALE, z: b.z / SCALE, ...(b.r ? { r: b.r / SCALE } : {}) }));
  const half = Math.max(...rel.map(b => Math.abs(b.x) + b.w / 2));
  const deep = 2 * Math.max(...rel.map(b => Math.abs(b.z) + b.d / 2)) + TABLE.side * 2;
  const back = Math.max(0, Math.max(...rel.map(b => b.z + b.d / 2)) - 0.07 * SIZE);
  const table = { w: 2 * half + TABLE.side * 2, d: Math.max(TABLE.d * SIZE, deep), top: 0, x: R(-0.25, 0.25), z: R(-3.0, -2.6) - back };
  const blocks = rel.map(b => ({ ...b, x: table.x + b.x, y: b.y, z: table.z + b.z }));
  const kinds = i === SCENES ? [info.soft, info.tall] : [i % 2 ? info.soft : info.tall];
  const stackTop = Math.max(...blocks.map(b => b.y + b.h / 2)), tallest = Math.max(...blocks.map(b => b.h));
  const reach = Math.max(tallest + REACH_SPARE, FRAME_REACH * stackTop);
  const room = {
    rect: { x0: Math.min(...blocks.map(b => b.x - b.w / 2)), x1: Math.max(...blocks.map(b => b.x + b.w / 2)), z0: Math.min(...blocks.map(b => b.z - b.d / 2)), z1: Math.max(...blocks.map(b => b.z + b.d / 2)) },
    reach, reachH: reach, push: 0,
  };
  const tableFoot = { x0: room.rect.x0 - 0.05, x1: room.rect.x1 + 0.05, z0: room.rect.z0 - 0.05, z1: room.rect.z1 + 0.05 };
  const things = [];
  let tooNear = 0;
  for (const kd of kinds) {
    for (let tries = 0; tries < 20; tries++) {
      room.push = tries * 0.08;
      const c = PLACE[kd](R, table, random, stackTop, CAM_N, room, things);
      if (c.job === 'tall') { c.x -= room.push; for (const key of ['x0', 'x1']) c.foot[key] -= room.push; for (const a of c.arms ?? []) a.x -= room.push; }
      if (things.some(o => overlaps(o.foot, c.foot)) || overlaps(c.foot, tableFoot)) continue;
      c.gap = gapFrom(room.rect, lowParts(c, room.reachH));
      if (c.gap < room.reach - 1e-9) { tooNear++; continue; }
      things.push(c); break;
    }
  }
  const dist = Math.hypot(table.x - HAND.x, table.z - HAND.z), dy = stackTop - HAND.y / SCALE;
  const v = Math.max(Math.sqrt(GRAVITY * REACH * dist), 1.08 * Math.sqrt(GRAVITY * (dy + Math.hypot(dist, dy))));
  const power = clamp((v - V_MIN) / (V_MAX - V_MIN), 0.3, 0.8);
  const unplaced = kinds.filter(kd => !things.some(t => t.kind === kd));
  return { seed, level, n: kinds.length, stack: name, table, blocks, things, power: +power.toFixed(3), reach: +reach.toFixed(2), unplaced, tooNear, ball: info.ball };
}
// A thing moved sideways by dx (Near metres): its middle, its parts (the
// gap's), its foot and its balls (a bush's or scrub's). It never comes onto
// the structure's table or another thing (false, and left where it was).
// For the soft thing that would hide a block's front (Q105: the wheelbarrow
// before the twin towers' low wall), moved aside by world.makeScene.
export function shiftThing(L, t, dx) {
  const foot = { x0: t.foot.x0 + dx, x1: t.foot.x1 + dx, z0: t.foot.z0, z1: t.foot.z1 };
  const bx = L.blocks.map(b => [b.x - b.w / 2, b.x + b.w / 2]), bz = L.blocks.map(b => [b.z - b.d / 2, b.z + b.d / 2]);
  const table = { x0: Math.min(...bx.map(v => v[0])) - 0.05, x1: Math.max(...bx.map(v => v[1])) + 0.05, z0: Math.min(...bz.map(v => v[0])) - 0.05, z1: Math.max(...bz.map(v => v[1])) + 0.05 };
  if (overlaps(foot, table) || L.things.some(o => o !== t && overlaps(o.foot, foot))) return false;
  t.x += dx; t.foot = foot;
  for (const p of t.parts ?? []) p.x += dx;
  for (const b of t.balls ?? []) b.x += dx;
  t.aside = +((t.aside ?? 0) + dx).toFixed(3);
  return true;
}
// Scene i of a game's level, try tryN: level 1's dealt structures, or the level's own.
// (`name`: a structure of the level instead of the deal's, for the tests)
export function layoutFor(gameSeed, level, i, tryN = 0, name = null) {
  const seed = sceneSeed(gameSeed, level, i, tryN);
  return level === 1 ? makeLayout(seed, sceneChoice(gameSeed, level, i)) : frameLayout(seed, level, i, name ?? levelDeal(gameSeed, level)[i - 1]);
}

// A layout in the world's metres, for the physics and the drawing alike:
// { blocks: [{ w, h, d, x, y, z, c }], bodies: the fixed things' physics
// ({ kind, shapes: [{ type: 'box', half, at, yaw } | { type: 'sphere',
// r, at } | { type: 'cyl', r, hh, at }] }), props: what's drawn of them
// ({ part, ... }), stand (the structure's footprint), bounds (what the view
// must show: { min, max }) }.
export function sceneParts(L) {
  const s = SCALE, bodies = [], props = [], boxes = [], extra = [];
  const fitBox = (cx, cy, cz, hx, hy, hz) => boxes.push([cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz]);
  for (const t of L.things) {
    if (t.kind === 'bush' || t.kind === 'scrub') {
      const shapes = t.balls.map(b => ({ type: 'sphere', r: X(b.r), at: [X(b.x), Y(b.y), Z(b.z)] }));
      bodies.push({ kind: 'bush', thing: t.kind, shapes });
      // drawn as one leafy bush over all its balls
      props.push({ part: t.kind, balls: shapes.map(sh => ({ r: sh.r, at: sh.at })) });
      shapes.forEach(sh => fitBox(...sh.at, sh.r, sh.r, sh.r));
    } else if (t.kind === 'barrow') {
      // the tray of gravel, as the mockup's (a box 0.88 x 0.38 x 0.64 m, turned as the barrow)
      const x = X(t.x), z = Z(t.z);
      bodies.push({ kind: 'soft', thing: 'barrow', shapes: [{ type: 'box', half: [0.44, 0.19, 0.32], at: [x, 0.5, z], yaw: t.yaw }] });
      props.push({ part: 'barrow', at: [x, 0, z], yaw: t.yaw });
      extra.push([x - 0.8, 0.7, z], [x + 0.8, 0.7, z], [x, 0.05, z + 0.5]);
    } else if (t.kind === 'rock') {
      // the rock as the cap of a big sphere under the ground (as the round heap's)
      const x = X(t.x), z = Z(t.z), rx = X(t.rx), rz = X(t.rz), H = Y(t.H), a = (rx + rz) / 2, Rs = (a * a + H * H) / (2 * H);
      bodies.push({ kind: 'soft', thing: 'rock', shapes: [{ type: 'sphere', r: Rs, at: [x, H - Rs, z] }] });
      props.push({ part: 'rock', at: [x, 0, z], rx, rz, H, yaw: t.yaw, seed: t.seed });
      extra.push([x - rx, H, z], [x + rx, H, z], [x, 0.05, z + rz]);
    } else if (t.kind === 'light') {
      // the pole (in the way of a straight throw), its concrete foot, the lamps' bar at the top
      const x = X(t.x), z = Z(t.z), h = Y(t.poleH);
      bodies.push({ kind: 'stand', thing: 'light', shapes: [{ type: 'cyl', r: 0.07, hh: h / 2, at: [x, h / 2, z] }, { type: 'box', half: [0.25, 0.14, 0.25], at: [x, 0.14, z] }, { type: 'box', half: [0.5, 0.22, 0.1], at: [x, h + 0.15, z] }] });
      props.push({ part: 'light', at: [x, 0, z], h });
      extra.push([x, 0.05, z], [x, Y(L.table.top + 0.6), z]);
    } else if (t.kind === 'pine') {
      // the trunk and four tiers of branches (spheres to the physics)
      const x = X(t.x), z = Z(t.z), h = Y(t.trunkH), r = X(t.r);
      const tiers = t.tiers.map(q => ({ type: 'sphere', r: X(q.r), at: [x, Y(q.y), z] }));
      bodies.push({ kind: 'tree', thing: 'pine', shapes: [{ type: 'cyl', r, hh: h / 2, at: [x, h / 2, z] }, ...tiers] });
      props.push({ part: 'pine', r, h, at: [x, 0, z], tiers: tiers.map(q => ({ r: q.r, at: q.at })) });
      extra.push([x, 0.05, z], [x, Y(L.table.top + 0.6), z]);
    } else if (t.kind === 'cactus') {
      // the trunk, and each arm: its elbow (a sphere) and the part that goes up
      const x = X(t.x), z = Z(t.z), h = Y(t.h), r = X(t.r);
      const shapes = [{ type: 'cyl', r, hh: h / 2, at: [x, h / 2, z] }];
      const arms = t.arms.map(a => ({ x: X(a.x), z: Z(a.z), y0: Y(a.y0), y1: Y(a.y1), r: X(a.r), a: a.a, out: X(a.out) }));
      for (const a of arms) shapes.push({ type: 'sphere', r: a.r * 1.15, at: [a.x, a.y0, a.z] }, { type: 'cyl', r: a.r, hh: (a.y1 - a.y0) / 2, at: [a.x, (a.y0 + a.y1) / 2, a.z] });
      bodies.push({ kind: 'tree', thing: 'cactus', shapes });
      props.push({ part: 'cactus', r, h, at: [x, 0, z], arms });
      extra.push([x, 0.05, z], [x, Y(L.table.top + 0.6), z]);
    } else if (t.kind === 'tree') {
      const r = X(t.r), h = Y(t.trunkH), x = X(t.x), z = Z(t.z);
      const leaves = t.leaves.map(l => ({ type: 'sphere', r: X(l.r), at: [X(l.x), Y(l.y), Z(l.z)] }));
      bodies.push({ kind: 'tree', shapes: [{ type: 'cyl', r, hh: h / 2, at: [x, h / 2, z] }, ...leaves] });
      // drawn: the trunk up into the middle clump, a branch to each other
      // clump from where it leaves the trunk (drawn only: a ball passes them)
      props.push({ part: 'tree', r, at: [x, 0, z], clumps: leaves.map((l, i) => ({ r: l.r, at: l.at, from: [x, Y(t.leaves[i].from), z] })) });
      // the view takes in the trunk up to just over the ground, not the leaves (they may run off the top)
      extra.push([x, 0.05, z], [x, Y(L.table.top + 0.6), z]);
    } else {
      // thin along its facing (local x after the turn). Drawn 4 cm thick; in
      // the physics 10 cm, set back so its face is where it's drawn (4 cm: a
      // fast ball sank into it and came out of the back)
      const o = { w: 0.04 * s, h: Y(t.H), d: X(t.W), x: X(t.x), y: Y(t.y), z: Z(t.z), yaw: t.yaw };
      const back = 0.03 * s;
      bodies.push({ kind: 'glass', shapes: [{ type: 'box', half: [0.05 * s, o.h / 2, o.d / 2], at: [o.x - t.n[0] * back, o.y, o.z - t.n[1] * back], yaw: t.yaw }] });
      props.push({ part: 'board', ...o });
      // the view takes it in up to its middle (fitted to its top, a board behind made the view 86° tall)
      for (const sd of [-1, 1]) extra.push([o.x + sd * Math.sin(t.yaw) * o.d / 2, o.y - o.h / 2, o.z + sd * Math.cos(t.yaw) * o.d / 2], [o.x, o.y, o.z]);
      // the pole: beside, just behind the board, up to its foot; behind, out
      // of reach, up to an arm that reaches forward to the board's middle
      const px = X(t.pole.x), pz = Z(t.pole.z);
      const ph = t.arm ? o.y + 0.02 * s : o.y - o.h / 2;
      const p = { w: 0.05 * s, h: ph, d: 0.05 * s, x: px, y: ph / 2, z: pz };
      bodies.push({ kind: 'stand', shapes: [{ type: 'box', half: [p.w / 2, p.h / 2, p.d / 2], at: [p.x, p.y, p.z], yaw: 0 }] });
      props.push({ part: 'pole', ...p });
      fitBox(p.x, p.y, p.z, p.w / 2, p.h / 2, p.d / 2);
      if (t.arm) {
        const len = t.arm * s - 0.02 * s;
        const a = { w: len, h: 0.04 * s, d: 0.04 * s, x: (px + o.x - t.n[0] * 0.02 * s) / 2, y: o.y, z: (pz + o.z - t.n[1] * 0.02 * s) / 2, yaw: t.yaw };
        bodies.push({ kind: 'stand', shapes: [{ type: 'box', half: [a.w / 2, a.h / 2, a.d / 2], at: [a.x, a.y, a.z], yaw: a.yaw }] });
        props.push({ part: 'arm', ...a });
      }
    }
  }
  const blocks = L.blocks.map(b => ({ w: X(b.w), h: Y(b.h), d: X(b.d), x: X(b.x), y: Y(b.y), z: Z(b.z), c: b.c, mat: b.mat ?? 'toy', shape: b.shape ?? 'box', ...(b.r ? { r: X(b.r) } : {}) }));
  for (const b of blocks) fitBox(b.x, b.y, b.z, b.w / 2, b.h / 2, b.d / 2);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const bx of boxes) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], bx[i]); max[i] = Math.max(max[i], bx[i + 3]); }
  for (const p of extra) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
  const st = L.table;
  return { blocks, bodies, props, stand: { w: X(st.w), d: X(st.d), top: 0, x: X(st.x), z: Z(st.z) }, bounds: { min, max }, level: L.level ?? 1, ball: BALLS_BY[L.ball ?? 'toy'], power: L.power };
}

/* ---------- the camera ---------- */

// From behind (over the shoulder), fitted to the scene: from the slingshot
// (its fork and the ball pulled back) up to the top of what must show, room
// over it for a lob's dots, and across from its leftmost to its rightmost
// edge, 3° spare (1° under the slingshot). Returns { pos, look, fov, by }.
export function behindView(aspect, { bounds: b, stand }) {
  const pos = CAM, pts = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [b.min[1], b.max[1]]) for (const z of [b.min[2], b.max[2]]) if (y > 0.01) pts.push([x, y, z]);
  pts.push([stand.x, b.max[1], b.max[2]]);
  pts.push([stand.x / 2, b.max[1] + 0.6 * SCALE, (HAND.z + (b.min[2] + b.max[2]) / 2) / 2]);
  const elev = ([, y, z]) => Math.atan2(y - pos[1], pos[2] - z) * R2D;
  const azim = ([x, , z]) => Math.atan2(x - pos[0], pos[2] - z) * R2D;
  const foot = Math.min(elev([0, HAND.y - BALL.r, HAND.z]), elev([0, HAND.y - 0.03 - BALL.r, HAND.z + 0.1]), elev([0, FORK_CROTCH_Y, FORK_Z])) - 1;
  const top = Math.max(...pts.map(elev)) + 3;
  const sling = [[TIPS[0][0], 0, TIPS[0][2]], [TIPS[1][0], 0, TIPS[1][2]], [HAND.x, 0, HAND.z + 0.1]].map(azim);
  const left = Math.min(...sling, ...pts.map(azim)) - 3, right = Math.max(...sling, ...pts.map(azim)) + 3;
  const pitch = (top + foot) / 2, yaw = (left + right) / 2;
  const fovW = 2 * Math.atan(Math.tan((right - left) / 2 / R2D) / aspect) * R2D;
  const fov = Math.max(top - foot, fovW);
  const dir = [Math.sin(yaw / R2D) * Math.cos(pitch / R2D), Math.sin(pitch / R2D), -Math.cos(yaw / R2D) * Math.cos(pitch / R2D)];
  return { pos: pos.slice(), look: pos.map((p, i) => p + dir[i] * 5), fov, by: fov === fovW ? 'width' : 'height', pitch, yaw };
}

/* ---------- the throw ---------- */

// The ball's speed (× √SCALE), turn and lift, and its velocity.
export function launchVel(power, aim, up) {
  const v = (V_MIN + power * (V_MAX - V_MIN)) * Math.sqrt(SCALE), yaw = aim * MAX_AIM / R2D, el = up / R2D;
  return { v, yaw, el, vec: [Math.sin(yaw) * Math.cos(el) * v, Math.sin(el) * v, -Math.cos(yaw) * Math.cos(el) * v] };
}

// The farthest a throw at strength `power` can reach from the hand, along
// the ground (m, in plan view), at the best lift: where the path comes down
// to height h (no drag on the ball, as in the physics). Further out than
// this, no throw touches a block (Q103).
export function throwRange(power, h = 0) {
  const { v } = launchVel(power, 0, 0), H = HAND.y - h;
  return (v / GRAVITY) * Math.sqrt(v * v + 2 * GRAVITY * H);
}

// A block off the screen as it's held (developer, 2026-11-13, Q103: upright
// on the tablet, a block knocked right "was no longer visible", while the
// aim still reached it): every corner of the box round it (`at` its middle,
// `r` its half-size, the most it reaches any way it's turned) shows past the
// same edge of the canvas. `project(p)`: where p shows, [0-1 across, 0-1
// down].
export function offScreen(at, r, project) {
  const uv = [];
  for (const dx of [-r, r]) for (const dy of [-r, r]) for (const dz of [-r, r]) uv.push(project([at[0] + dx, at[1] + dy, at[2] + dz]));
  if (uv.some(p => !p || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) return false;
  return uv.every(p => p[0] < 0) || uv.every(p => p[0] > 1) || uv.every(p => p[1] < 0) || uv.every(p => p[1] > 1);
}

// One drag aims, on a stage whose shorter side is `size` px (dx, dy in px
// from where it started; dy > 0 is down). Returns { power, aim, up, ok (long
// enough to throw), show (long enough to show the dots) }, or null for a
// stage of no size.
// Drag where to throw: sideways aims the same way (0.35 of the size is
// full), up aims higher (flat to 70°, full at 0.4); how hard is the scene's
// (`power`).
export function frontDrag(dx, dy, size, power) {
  if (!(size > 0)) return null;
  const x = dx / size, y = dy / size, moved = Math.hypot(x, y);
  return { power, aim: clamp(x / 0.35, -1, 1) || 0, up: clamp(-y / 0.4, 0, 1) * MAX_UP, ok: moved >= 0.03, show: moved >= 0.015 };
}

// The drag pad (developer, 2026-11-10, Q67: a finger that starts on the ball
// and swipes at the target covers the dots). A round pad with a 👆 to start
// the drag from, beside the slingshot and away from where the dots go, so the
// finger and hand move beside them: the ball is low on the left and the dots
// go up the middle, so the pad is low on the right. A throw starts only on
// the pad (developer, 2026-11-10: "only starting from the guide is more
// intuitive", a control they learn that "always works as they expect"): a
// press within `reach` of its radius counts (a near miss isn't a dead touch).
// In a park w × h px (s its shorter side): the pad's middle and radius, px
// from the park's top left.
export const PAD = { fromRight: 0.24, up: 0.27, r: 0.1, rMin: 30, rMax: 46, reach: 1.5 };
export function padSpot(w, h) {
  if (!(w > 0 && h > 0)) return null;
  const s = Math.min(w, h), r = clamp(PAD.r * s, PAD.rMin, PAD.rMax);
  return { x: Math.round(w - PAD.fromRight * s), y: Math.round(h - PAD.up * s), r: Math.round(r) };
}
// Where a press on the park is: 'pad' (on it, or within PAD.reach of its
// radius), 'ball' (by the slingshot's ball, px), or 'elsewhere'.
export function dragFrom(x, y, pad, ball) {
  if (pad && Math.hypot(x - pad.x, y - pad.y) <= pad.r * PAD.reach) return 'pad';
  if (ball && Math.hypot(x - ball.x, y - ball.y) <= 60) return 'ball';
  return 'elsewhere';
}
// A press on the park: `on` (it starts a drag: on the pad), `from` as
// dragFrom, and `offPx`, how far outside the drawn pad (0 on it; null with
// no pad), logged on a miss to see whether the reach is big enough.
export function padPress(x, y, pad, ball) {
  const from = dragFrom(x, y, pad, ball);
  const offPx = pad ? Math.max(0, Math.round(Math.hypot(x - pad.x, y - pad.y) - pad.r)) : null;
  return { on: from === 'pad', from, offPx };
}
// The pad shown once a scene starts: a see-through finger drags from it as a
// throw would, the dots following, twice, until a finger touches the park.
// Every scene (developer, 2026-11-10: "Every scene"). `demoDrag` is where
// its drag ends (px from the pad), `up`° up, aimed at the structure.
// DEMO_UPS are the angles the screen tries, in turn, for a throw whose path
// touches a block first (a show that hits the bush teaches the wrong thing).
// `demoAt(t, to)` is the finger at t s: { dx, dy, alpha, dots }, or null once
// it's done.
export const DEMO = { in: 0.35, move: 1.2, hold: 0.7, out: 0.35, gap: 1.2, times: 2 };
export const DEMO_UPS = [30, 25, 35, 20, 40, 45, 15, 50, 55, 60];
const DEMO_CYCLE = DEMO.in + DEMO.move + DEMO.hold + DEMO.out + DEMO.gap;
export function demoDrag(size, stand, up = DEMO_UPS[0]) {
  const aim = clamp(Math.atan2(stand.x - HAND.x, HAND.z - stand.z) * R2D / MAX_AIM, -1, 1);
  return { dx: aim * 0.35 * size, dy: -(up / MAX_UP) * 0.4 * size };
}
export function demoAt(t, to) {
  if (!(t >= 0) || t >= DEMO_CYCLE * DEMO.times - DEMO.gap) return null;
  let u = t % DEMO_CYCLE;
  if (u < DEMO.in) return { dx: 0, dy: 0, alpha: u / DEMO.in, dots: false };
  u -= DEMO.in;
  if (u < DEMO.move) { const k = u / DEMO.move, e = k * k * (3 - 2 * k); return { dx: to.dx * e, dy: to.dy * e, alpha: 1, dots: true }; }
  u -= DEMO.move;
  if (u < DEMO.hold) return { dx: to.dx, dy: to.dy, alpha: 1, dots: true };
  u -= DEMO.hold;
  if (u < DEMO.out) return { dx: to.dx, dy: to.dy, alpha: 1 - u / DEMO.out, dots: false };
  return { dx: 0, dy: 0, alpha: 0, dots: false };
}

// The dots: the start of the path, one for every 0.05 s of flight (far apart
// means fast), for 0.3 s, about half the way to the structure (½ s until
// 2026-11-11, Q71: three quarters of the way; developer: "pretty hard to
// miss"); where the ball would touch something sooner they
// stop there, the last one orange. `path` is { hits, pts } (pts every STEP s
// from the hand, topple-world's trace()). Returns { pts, stopped (what it
// touches, or null), lastT }.
export const DOT_DT = 0.05, DOT_SECONDS = 0.3, MAX_DOTS = 90;
export function dotsFor(path, limitT = DOT_SECONDS) {
  const per = Math.round(DOT_DT / STEP), hit = path.hits[0];
  const endT = Math.min(limitT, hit ? hit.t : Infinity);
  const pts = [];
  for (let i = per; i < path.pts.length && i * STEP <= endT + 1e-9; i += per) pts.push(path.pts[i]);
  const stopped = !!hit && hit.t <= limitT;
  if (stopped) pts.push(hit.at);
  pts.length = Math.min(pts.length, MAX_DOTS);
  return { pts, stopped: stopped ? hit.kind : null, lastT: +(stopped ? hit.t : pts.length * DOT_DT).toFixed(2) };
}

// How hard (developer, 2026-11-12, Q96: "selectable levels (keeping the
// current games and calling them ... normal, and then move to harder and
// hardest"): picked on the setup screen, kept with the game. Normal is the
// game as it was; Harder's dots are half as long ("sure - for harder
// level"). Hardest has Harder's dots for now (developer, 2026-11-13, Q98:
// "Use Harder's dots for now"; 10.4's dots for the first ball only were
// "unplayable"): its challenge is to come from harder scenes. `firstOnly`
// (no dots after a scene's first ball) is kept, unused. `used`: the balls
// already thrown in the scene. Returns the dots' seconds, 0 for none.
export const MODES = ['normal', 'harder', 'hardest'];
export const MODE_INFO = {
  normal: { name: 'Normal', dots: DOT_SECONDS, firstOnly: false, line: 'the dots show the way' },
  harder: { name: 'Harder', dots: 0.15, firstOnly: false, line: 'shorter dots' },
  hardest: { name: 'Hardest', dots: 0.15, firstOnly: false, line: 'shorter dots; harder scenes to come' },
};
export function dotSeconds(mode, used) {
  const m = MODE_INFO[mode] ?? MODE_INFO.normal;
  return m.firstOnly && used > 0 ? 0 : m.dots;
}
const okMode = m => MODES.includes(m);

/* ---------- a block down ---------- */

// A block is down once it has fallen: tipped more than 45° (its up side
// turned away from up), or dropped more than 0.6 of its smallest side below
// where it stood. One pushed along the ground still upright hasn't fallen.
// q: [x, y, z, w]. A cube or plank, once down, stays counted down (it lands
// flat, however it falls).
// A tall block (taller than wide and deep: a post) is down only while it
// lies tipped past 45° (developer, 2026-11-10, Q69: two posts leaning on
// each other, counted down, looked standing; 2 of 299 first throws: a post
// tipped to 48° that rocked back to 41°, and the tower's upper post that fell
// to the ground and stood leaning at 29°). A post's lean counts from 30°
// (developer, 2026-11-12, Q91: on the building site everything was down
// "or leaning at a pretty pronounced angle on other debris. It was not
// clear what we left to hit"; "relax the rule a bit (say 60 degrees
// instead of 45)": 60° above the ground, 30° from upright). `wasDown`: it
// was counted down, so it's up again only under 25° (no flicker at 30°).
const TIP = Math.cos(45 / R2D), POST_TIP = Math.cos(30 / R2D), POST_BACK = Math.cos(25 / R2D);
export function isDown(q, y, startY, minDim, tall = false, wasDown = false) {
  const upY = 1 - 2 * (q[0] * q[0] + q[2] * q[2]);
  if (tall) return upY < (wasDown ? POST_BACK : POST_TIP);
  return upY < TIP || startY - y > 0.6 * minDim;
}

/* ---------- the game: level, scene, hearts, jewels ---------- */

export const checkSetup = ({ p1 }) => checkPicks({ onePlayer: true, p1 });

// A new game: level 1, scene 1, 3 hearts, no jewels; its own scenes
// (seed). Levels (developer, 2026-11-11, the map: "jump to any level
// completed or the one you're on, not higher"): `reached` the highest open,
// `done` the levels finished; each level keeps its own place (`places`:
// the levels not being played; the one being played is scene, hearts and
// jewels), and a level played again has the same scenes. `keep`: a game
// whose levels reached and done carry on (new scenes, the same progress).
// `rounds`: how many times each done level has been started again from
// its start, each time with new scenes (seedOf). `mode`: how hard (MODES),
// kept from `keep` unless given; a setting, not progress, so Start over
// keeps it too.
export function createGame(seed, keep = null, mode = keep?.mode ?? 'normal') {
  if (!Number.isInteger(seed) || seed <= 0) throw new Error(`createGame: bad seed: ${seed}`);
  if (!okMode(mode)) throw new Error(`createGame: unknown mode: ${mode}`);
  return { seed, level: 1, scene: 1, hearts: HEARTS, jewels: 0, reached: keep?.reached ?? 1, done: keep?.done ? [...keep.done] : [], places: {}, rounds: {}, mode };
}
// The seed level n's scenes are made from (developer, 2026-11-12: "when
// starting fresh or even using the map to go back to a level I completed
// before, it would be nice to preserve the theme of the scene but be
// presented with different target arrangements"; a heart lost, or all of
// them, still plays the same scenes): the game's, until the level is done
// and started again, then one of its own for each time.
export function seedOf(g, n = g.level) {
  const k = g.rounds?.[n] ?? 0;
  if (!k) return g.seed;
  return 1 + Math.floor(rng((g.seed ^ Math.imul(n, 0x2545F491) ^ Math.imul(k, 0x9E3779B9)) >>> 0)() * (2 ** 31 - 2));
}
const isStart = p => p.scene === 1 && p.hearts === HEARTS && p.jewels === 0;
const freshPlace = () => ({ scene: 1, hearts: HEARTS, jewels: 0 });
const okPlace = p => !!p && Number.isInteger(p.scene) && p.scene >= 1 && p.scene <= SCENES
  && Number.isInteger(p.hearts) && p.hearts >= 1 && p.hearts <= HEARTS && Number.isInteger(p.jewels) && p.jewels >= 0 && p.jewels < SCENES;
const okLevel = n => Number.isInteger(n) && n >= 1 && n <= MAX_LEVEL;
// A game as kept on the device, if it makes sense; else null. One kept
// before levels (9.4: level 1 only) carries on at level 1. The level after
// a level done is open: a game that finished every level when there were
// fewer (10.0: four) opens the new one (developer, 2026-11-12: level 4 done
// in 10.0, and level 5 opened only once level 4 was played through again).
export function readGame(g) {
  if (!g || typeof g !== 'object') return null;
  if (!(Number.isInteger(g.seed) && g.seed > 0 && okLevel(g.level) && okPlace(g))) return null;
  let reached = okLevel(g.reached) && g.reached >= g.level ? g.reached : g.level;
  const done = Array.isArray(g.done) ? [...new Set(g.done.filter(n => okLevel(n) && n <= reached))].sort() : [];
  if (done.length) reached = Math.max(reached, Math.min(MAX_LEVEL, Math.max(...done) + 1));
  const places = {};
  for (const [k, p] of Object.entries(g.places && typeof g.places === 'object' ? g.places : {})) {
    const n = Number(k);
    if (okLevel(n) && n !== g.level && n <= reached && okPlace(p)) places[n] = { scene: p.scene, hearts: p.hearts, jewels: p.jewels };
  }
  // (a game kept before 10.3 has none)
  const rounds = {};
  for (const [k, c] of Object.entries(g.rounds && typeof g.rounds === 'object' ? g.rounds : {})) {
    const n = Number(k);
    if (okLevel(n) && Number.isInteger(c) && c > 0) rounds[n] = c;
  }
  // how hard (a game kept before Q96 has none: Normal, the game it was)
  const mode = okMode(g.mode) ? g.mode : 'normal';
  return { seed: g.seed, level: g.level, scene: g.scene, hearts: g.hearts, jewels: g.jewels, reached, done, places, rounds, mode };
}
// Level n's place: { scene, hearts, jewels }.
export const placeOf = (g, n) => (n === g.level ? { scene: g.scene, hearts: g.hearts, jewels: g.jewels } : { ...(g.places[n] ?? freshPlace()) });
export const isOpen = (g, n) => okLevel(n) && n <= g.reached;
// Play level n (the map, or on to the next level): the level being played
// keeps its place, n's is picked up; a done level picked up at its start
// gets new scenes (seedOf: its round counted on). False (nothing changed)
// for a level not open yet.
export function switchLevel(g, n) {
  if (!isOpen(g, n)) return false;
  if (n === g.level) return true;
  g.places[g.level] = placeOf(g, g.level);
  Object.assign(g, placeOf(g, n));
  delete g.places[n];
  g.level = n;
  if (g.done.includes(n) && isStart(g)) g.rounds = { ...g.rounds, [n]: (g.rounds?.[n] ?? 0) + 1 };
  return true;
}
// The level being played, started again from scene 1 (developer,
// 2026-11-13, Q102: "once you are in a scene you can only start the scene
// again"): 3 hearts, no jewels, new scenes (its round counted on, as a done
// level started again). Free: it loses the level's jewels, as losing the
// last heart does. The levels open and done stay as they are.
export function restartLevel(g) {
  Object.assign(g, freshPlace());
  g.rounds = { ...g.rounds, [g.level]: (g.rounds?.[g.level] ?? 0) + 1 };
  return g;
}

// A scene over: won, a jewel and the next scene ('won'); the level's last
// scene won: the level done, its place back to scene 1, and on to the next
// level ('level'), or every level done ('all'); lost, a heart and the same
// scene again ('lost'), or the last heart gone: back to scene 1 with 3
// hearts and no jewels, the same scenes ('out').
export function sceneOver(g, won) {
  if (won) {
    g.jewels++;
    if (g.scene < SCENES) { g.scene++; return 'won'; }
    if (!g.done.includes(g.level)) g.done = [...g.done, g.level].sort();
    Object.assign(g, freshPlace());
    if (g.level >= MAX_LEVEL) return 'all';
    g.reached = Math.max(g.reached, g.level + 1);
    switchLevel(g, g.level + 1);
    return 'level';
  }
  g.hearts--;
  if (g.hearts > 0) return 'lost';
  Object.assign(g, freshPlace());
  return 'out';
}

/* ---------- a scene being played ---------- */

export const READY_AFTER = 0.9;   // the next ball this long after a throw (s)
// Every block down for WIN_HOLD: cleared at once, the win shown (its sound,
// the jewel, "Cleared!") while the last blocks finish falling; the card
// once every block is calm (the page's `calm`: slower than the world's
// CALM_SPEED) for CARD_HOLD, or CARD_MAX after the win, calm or not.
// (developer, 2026-11-12: "sometimes after completing a scene there is a
// long pause before calling it complete". Until 10.3 the win waited for
// every block, shard and splash to be still: measured, 170 wins of 200
// scenes by the tests' person player, levels 1-5, 8 games: 2.8 s after all
// down at the median, as every ice and glowing block's shards fly for up
// to 2.4 s, and 8 s, the cap, for barrels rolling and posts creeping at
// 0.07-0.14 m/s. Calm at 0.3 m/s: 0.9 s at the median, 1.9 at 90%, 4.15
// at most. A post up again after all were down: 1 of 170, 0.07 s after,
// inside WIN_HOLD; one up again starts the count again.)
export const WIN_HOLD = 0.35;
export const CARD_HOLD = 0.35;
export const CARD_MAX = 4;
export const END_WAIT = 2;        // out of balls: over this long after the last throw, once still
export const END_MAX = 7 * Math.sqrt(SCALE);   // ... or this long, still or not

export function newRound(total) {
  return { total, used: 0, down: 0, t: 0, since: null, allDown: 0, result: null, card: false, cardT: 0, calmFor: 0 };
}
export const ballsLeft = r => BALLS - r.used;
export function canThrow(r) {
  if (r.result) return { ok: false, why: 'scene-over' };
  if (ballsLeft(r) <= 0) return { ok: false, why: 'no-balls' };
  if (r.since != null && r.since < READY_AFTER) return { ok: false, why: 'not-ready' };
  return { ok: true };
}
export function useBall(r) {
  const c = canThrow(r);
  if (!c.ok) return c;
  r.used++;
  r.since = 0;
  return { ok: true, ball: r.used };
}
// The scene `dt` s on: `down` blocks down now, `still` whether every block
// (and the page's shards and spray) has stopped, `calm` whether every block
// is slower than CALM_SPEED (none given: as still). Returns { downChanged,
// ended (the result, once), card (true once: time for the end's card; a
// scene lost has it with its end) }.
export function update(r, dt, { down, still, calm = still }) {
  r.t += dt;
  if (r.since != null) r.since += dt;
  if (r.result) {
    if (r.card === false) {
      // a won scene's card (a round kept before 10.3 has no `card`: it had its card with its end)
      r.cardT += dt;
      r.calmFor = calm ? r.calmFor + dt : 0;
      if (r.calmFor > CARD_HOLD || r.cardT > CARD_MAX) { r.card = true; return { downChanged: false, ended: null, card: true }; }
    }
    return { downChanged: false, ended: null, card: false };
  }
  const downChanged = down !== r.down;
  r.down = down;
  let won = null;
  if (down >= r.total) {
    // allDown: how long every block has been down (a round kept before 2026-11-12 has none)
    r.allDown = (r.allDown ?? 0) + dt;
    if (r.allDown > WIN_HOLD) won = true;
  } else {
    r.allDown = 0;
    if (ballsLeft(r) <= 0 && r.since > END_WAIT && (still || r.since > END_MAX)) won = false;
  }
  if (won === null) return { downChanged, ended: null, card: false };
  r.result = { won, down: r.down, total: r.total, balls: r.used };
  r.card = !won;
  r.cardT = 0;
  r.calmFor = 0;
  return { downChanged, ended: r.result, card: !won };
}

// The blocks left glow after a pause (developer, 2026-11-13, Q101: on the
// phone the building site "looked like all blocks were down ... but there
// was clearly something left I was supposed to hit"; "make them glow or get
// brighter for a few seconds"; a marker over them was "visually noisy",
// Q91). Once a scene has waited GLOW_WAIT s for the next ball (a ball
// thrown already, none in flight, the blocks and shards still, no finger
// aiming: the page counts it, `idle`), the blocks still standing brighten
// and fade back GLOW_PULSES times, GLOW_PULSE_S each; then only after
// another GLOW_WAIT. A throw, a drag or anything moving starts the count
// again. 4 s from 10.7 (developer, 2026-11-13: on the old tablet "a VERY
// long time before the glowing happens. I think a delay of 4 seconds is
// plenty"; 6 s in 10.6).
export const GLOW_WAIT = 4;
export const GLOW_PULSES = 2;
export const GLOW_PULSE_S = 1;
const GLOW_CYCLE = GLOW_WAIT + GLOW_PULSES * GLOW_PULSE_S;
// Whether the scene is waiting on the player (the count goes on), given
// whether everything has stopped: once it has, or at the latest
// GLOW_STILL_MAX s after the next ball is ready, still or not (developer,
// 2026-11-13, Q105: on the old tablet the building site's two towers glowed
// 26.6 s after the throw, game and real time alike, at 30 frames a second:
// the count began only 22.6 s after it, something kept moving; 285
// building-site throws on the computer were all still by 4.8 s after the
// throw, 3.9 s after the ball was ready).
export const GLOW_STILL_MAX = 3;
export const waitingOn = (r, still) => !r.result && r.used > 0 && ballsLeft(r) > 0 && r.since != null && r.since >= READY_AFTER && (still || r.since >= READY_AFTER + GLOW_STILL_MAX);
// How bright the glow is `idle` s into a wait: 0 to 1 (0 before GLOW_WAIT).
export function glowAt(idle) {
  const k = idle % GLOW_CYCLE;
  if (idle < GLOW_WAIT || k < GLOW_WAIT) return 0;
  return Math.sin(Math.PI * (k - GLOW_WAIT) / GLOW_PULSE_S) ** 2;
}
// How many glows have started `idle` s into a wait (the page logs each).
export const glowsBy = idle => (idle < GLOW_WAIT ? 0 : 1 + Math.floor((idle - GLOW_WAIT) / GLOW_CYCLE));

// The card at a scene's end: { title, next (the button's words) }, from
// sceneOver()'s outcome and the game after it.
export function endWords(outcome, g, name) {
  switch (outcome) {
    // the button says what it does, as Bridges' "Next ▸" (developer,
    // 2026-11-11: "Scene 2 of 5" alone wasn't clear as a button "and its
    // purpose is to load the next scene"; "the jewels make it clear where
    // you are, so maybe the popup could just say 'next'")
    case 'won': return { title: `${name} cleared it! 💎`, next: 'Next ▸' };
    // `g` the game before the scene ended (the level just done)
    case 'level': return { title: `Level ${g.level} done! ${'💎'.repeat(SCENES)}`, sub: `On to ${levelInfo(g.level + 1).name}`, next: `Level ${g.level + 1} ▸` };
    case 'all': return { title: `All levels done! 💎`, sub: 'More levels coming', next: 'Play again' };
    case 'lost': return { title: `Out of balls 💔`, sub: `${g.hearts} ${g.hearts === 1 ? 'heart' : 'hearts'} left`, next: 'Try again' };
    case 'out': return { title: 'No hearts left', sub: 'Back to scene 1', next: 'Start again' };
    default: throw new Error(`endWords: unknown outcome: ${outcome}`);
  }
}
