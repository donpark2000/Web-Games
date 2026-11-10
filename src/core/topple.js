// Topple! rules, scenes and camera (DESIGN.md "Topple!", agreed from the
// Block Game Mockup v8, 2026-11-10). No DOM, three.js or physics here: the
// cannon-es world, the path ahead and the scene check are
// src/core/topple-world.js; the screen is src/ui/.
//
// Knock every block of a structure down with 5 balls from a slingshot, in a
// park. A game is levels of 5 scenes (level 1 for now): a scene cleared wins
// a jewel, one not cleared loses one of 3 hearts and is played again; the
// last heart lost goes back to the level's first scene, the same scenes.
// One drag aims: from behind, sideways and up (how hard is the scene's); from
// the side, the drag's direction how high and its length how hard.
//
// Sizes are made in "Near" metres (the mockup's) and drawn at Far: SCALE
// times bigger and further from the hand, so the camera, at a person's
// height, looks down on them less. The ball keeps its size, weighs SCALE³ as
// much (a hit does the same) and is thrown √SCALE as fast (it reaches SCALE
// as far).

import { FACE_NAMES, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES };

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
};

// A level's scenes: 1-4 about the same (one thing in the way, a smaller
// structure), the 5th harder (two things, a bigger structure).
export const SCENES = 5, HEARTS = 3, BALLS = 5;
export const sceneOpts = i => (i < SCENES ? { n: 1, stacks: ['arch', 'posts', 'pyramid'] } : { n: 2, stacks: ['tower', 'fence'] });
export const KINDS = ['bush', 'tree', 'backboard'];

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
// level, so a scene played again is still the same one. Never the same
// structure twice in a row, never the same structure and thing twice in a
// level. Returns [{ stack, thing }] for scenes 1 to SCENES - 1.
export function levelPlan(gameSeed, level) {
  const random = rng((gameSeed ^ Math.imul(level, 0x27D4EB2F) ^ 0x165667B1) >>> 0);
  const combos = sceneOpts(1).stacks.flatMap(stack => KINDS.map(thing => ({ stack, thing })));
  const plan = [];
  for (let i = 1; i < SCENES; i++) {
    const prev = plan[plan.length - 1];
    const left = combos.filter(c => !plan.includes(c) && c.stack !== prev?.stack);
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
  if (t.kind === 'bush') return t.balls.map(b => ({ x: b.x, z: b.z, r: b.r }));
  if (t.kind === 'tree') return [{ x: t.x, z: t.z, r: t.r }];
  const out = [{ x: t.pole.x, z: t.pole.z, r: 0.035 }];
  if (t.y - t.H / 2 < reachH) for (let i = -3; i <= 3; i++) out.push({ x: t.x + Math.sin(t.yaw) * t.W / 2 * i / 3, z: t.z + Math.cos(t.yaw) * t.W / 2 * i / 3, r: 0.02 });
  return out;
}
// How far the nearest of the parts is from a footprint (a rectangle).
export const gapFrom = (rect, parts) => Math.min(...parts.map(p => Math.hypot(Math.max(rect.x0 - p.x, 0, p.x - rect.x1), Math.max(rect.z0 - p.z, 0, p.z - rect.z1)) - p.r));

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
  // rest of the layout comes out as before.
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
  const table = { w: 2 * half + TABLE.side * 2, d: TABLE.d * SIZE, top: 0, x: R(-0.35, 0.35), z: R(-3.1, -2.5) };
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
    if (t.kind === 'bush') {
      const shapes = t.balls.map(b => ({ type: 'sphere', r: X(b.r), at: [X(b.x), Y(b.y), Z(b.z)] }));
      bodies.push({ kind: 'bush', shapes });
      // drawn as one leafy bush over all its balls
      props.push({ part: 'bush', balls: shapes.map(sh => ({ r: sh.r, at: sh.at })) });
      shapes.forEach(sh => fitBox(...sh.at, sh.r, sh.r, sh.r));
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
  const blocks = L.blocks.map(b => ({ w: X(b.w), h: Y(b.h), d: X(b.d), x: X(b.x), y: Y(b.y), z: Z(b.z), c: b.c }));
  for (const b of blocks) fitBox(b.x, b.y, b.z, b.w / 2, b.h / 2, b.d / 2);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const bx of boxes) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], bx[i]); max[i] = Math.max(max[i], bx[i + 3]); }
  for (const p of extra) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
  const st = L.table;
  return { blocks, bodies, props, stand: { w: X(st.w), d: X(st.d), top: 0, x: X(st.x), z: Z(st.z) }, bounds: { min, max } };
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

// The side view: from the right of the throw, looking across it, a little
// forward (25°, so the structure's front shows, at a slant) and down (8°):
// the slingshot on the left, the structure on the right; fitted to the
// whole way, room over the structure for a lob. Returns { pos, look, fov, dist }.
export const SIDE_FOV = 35;
export function sideView(aspect, { bounds: b, stand }) {
  const pts = [];
  for (const x of [b.min[0], b.max[0]]) for (const y of [0, b.max[1]]) for (const z of [b.min[2], b.max[2]]) pts.push([x, y, z]);
  pts.push([stand.x, b.max[1] + 0.5 * SCALE, stand.z]);
  pts.push([HAND.x, 0, HAND.z + 0.15], [HAND.x, HAND.y + 0.15, HAND.z + 0.15]);
  const TH = 25 / R2D, PH = 8 / R2D;
  const f = norm3([-Math.cos(TH) * Math.cos(PH), -Math.sin(PH), -Math.sin(TH) * Math.cos(PH)]);
  const r = norm3(cross(f, [0, 1, 0])), u = cross(r, f);
  const lo = [0, 1, 2].map(i => Math.min(...pts.map(p => p[i]))), hi = [0, 1, 2].map(i => Math.max(...pts.map(p => p[i])));
  const c = lo.map((v, i) => (v + hi[i]) / 2);
  const tanV = Math.tan(SIDE_FOV / 2 / R2D), tanH = tanV * aspect;
  let D = 0;
  for (const p of pts) {
    const d = sub(p, c), x = dot(d, r), y = dot(d, u), z = dot(d, f);
    D = Math.max(D, Math.abs(x) / tanH - z, Math.abs(y) / tanV - z);
  }
  D *= 1.06;
  return { pos: c.map((v, i) => v - f[i] * D), look: c, fov: SIDE_FOV, dist: D };
}
// The dots are drawn bigger in the side view, the camera being metres off.
export const dotScaleFor = (view, side) => (view === 'side' ? clamp(side.dist * 0.3, 1, 8) : 1);

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

/* ---------- the throw ---------- */

// The ball's speed (× √SCALE), turn and lift, and its velocity.
export function launchVel(power, aim, up) {
  const v = (V_MIN + power * (V_MAX - V_MIN)) * Math.sqrt(SCALE), yaw = aim * MAX_AIM / R2D, el = up / R2D;
  return { v, yaw, el, vec: [Math.sin(yaw) * Math.cos(el) * v, Math.sin(el) * v, -Math.cos(yaw) * Math.cos(el) * v] };
}

// One drag aims, on a stage whose shorter side is `size` px (dx, dy in px
// from where it started; dy > 0 is down). Returns { power, aim, up, ok (long
// enough to throw), show (long enough to show the dots) }, or null for a
// stage of no size.
// From behind: drag where to throw. Sideways aims the same way (0.35 of the
// size is full), up aims higher (flat to 70°, full at 0.4); how hard is the
// scene's (`power`).
export function frontDrag(dx, dy, size, power) {
  if (!(size > 0)) return null;
  const x = dx / size, y = dy / size, moved = Math.hypot(x, y);
  return { power, aim: clamp(x / 0.35, -1, 1) || 0, up: clamp(-y / 0.4, 0, 1) * MAX_UP, ok: moved >= 0.03, show: moved >= 0.015 };
}
// From the side (mockup v8): drag the way the ball should go. Its direction
// sets how high (straight right: flat; up: up to 70°; left or down: flat),
// its length how hard (0.4-1.15 times the front view's throw, full at 0.4 of
// the size); always straight at the structure (`stand`).
export function sideDrag(dx, dy, size, power, stand) {
  if (!(size > 0)) return null;
  const x = dx / size, y = dy / size, moved = Math.hypot(x, y);
  const up = clamp(Math.atan2(-y, x) * R2D, 0, MAX_UP);
  const k = clamp(moved / 0.4, 0, 1);
  const v = (V_MIN + power * (V_MAX - V_MIN)) * (0.4 + 0.75 * k);
  const aim = Math.atan2(stand.x - HAND.x, HAND.z - stand.z) * R2D / MAX_AIM;
  return { power: (v - V_MIN) / (V_MAX - V_MIN), aim, up, pull: +k.toFixed(2), ok: moved >= 0.05, show: moved >= 0.02 };
}

// The dots: the start of the path, one for every 0.05 s of flight (far apart
// means fast), for ½ s; where the ball would touch something sooner they
// stop there, the last one orange. `path` is { hits, pts } (pts every STEP s
// from the hand, topple-world's trace()). Returns { pts, stopped (what it
// touches, or null), lastT }.
export const DOT_DT = 0.05, DOT_SECONDS = 0.5, MAX_DOTS = 90;
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

/* ---------- a block down ---------- */

// A block is down once it has fallen: tipped more than 45° (its up side
// turned away from up), or dropped more than 0.6 of its smallest side below
// where it stood. One pushed along the ground still upright hasn't fallen.
// q: [x, y, z, w]. Once down, the game keeps it counted down.
const TIP = Math.cos(45 / R2D);
export function isDown(q, y, startY, minDim) {
  const upY = 1 - 2 * (q[0] * q[0] + q[2] * q[2]);
  return upY < TIP || startY - y > 0.6 * minDim;
}

/* ---------- the game: level, scene, hearts, jewels ---------- */

export const checkSetup = ({ p1 }) => checkPicks({ onePlayer: true, p1 });

// A new game: level 1, scene 1, 3 hearts, no jewels; its own scenes (seed).
export function createGame(seed) {
  if (!Number.isInteger(seed) || seed <= 0) throw new Error(`createGame: bad seed: ${seed}`);
  return { seed, level: 1, scene: 1, hearts: HEARTS, jewels: 0 };
}
// A game as kept on the device, if it makes sense; else null.
export function readGame(g) {
  if (!g || typeof g !== 'object') return null;
  const ok = Number.isInteger(g.seed) && g.seed > 0 && g.level === 1 && Number.isInteger(g.scene) && g.scene >= 1 && g.scene <= SCENES
    && Number.isInteger(g.hearts) && g.hearts >= 1 && g.hearts <= HEARTS && Number.isInteger(g.jewels) && g.jewels >= 0 && g.jewels < SCENES;
  return ok ? { seed: g.seed, level: g.level, scene: g.scene, hearts: g.hearts, jewels: g.jewels } : null;
}

// A scene over: won, a jewel and the next scene ('won'), or the level done
// ('level': the caller starts a new game; level 2 isn't made yet); lost, a
// heart and the same scene again ('lost'), or the last heart gone: back to
// scene 1 with 3 hearts and no jewels, the same scenes ('out').
export function sceneOver(g, won) {
  if (won) {
    g.jewels++;
    if (g.scene >= SCENES) return 'level';
    g.scene++;
    return 'won';
  }
  g.hearts--;
  if (g.hearts > 0) return 'lost';
  g.scene = 1; g.hearts = HEARTS; g.jewels = 0;
  return 'out';
}

/* ---------- a scene being played ---------- */

export const READY_AFTER = 0.9;   // the next ball this long after a throw (s)
export const WIN_HOLD = 0.35;     // every block down for this long: cleared
export const END_WAIT = 2;        // out of balls: over this long after the last throw, once still
export const END_MAX = 7 * Math.sqrt(SCALE);   // ... or this long, still or not

export function newRound(total) {
  return { total, used: 0, down: 0, t: 0, since: null, winHold: 0, result: null };
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
// has stopped. Returns { downChanged, ended } (ended: the result, once).
export function update(r, dt, { down, still }) {
  r.t += dt;
  if (r.since != null) r.since += dt;
  if (r.result) return { downChanged: false, ended: null };
  const downChanged = down !== r.down;
  r.down = down;
  let won = null;
  if (down >= r.total) {
    r.winHold += dt;
    if (r.winHold > WIN_HOLD) won = true;
  } else {
    r.winHold = 0;
    if (ballsLeft(r) <= 0 && r.since > END_WAIT && (still || r.since > END_MAX)) won = false;
  }
  if (won === null) return { downChanged, ended: null };
  r.result = { won, down: r.down, total: r.total, balls: r.used };
  return { downChanged, ended: r.result };
}

// The card at a scene's end: { title, next (the button's words) }, from
// sceneOver()'s outcome and the game after it.
export function endWords(outcome, g, name) {
  switch (outcome) {
    case 'won': return { title: `${name} cleared it! 💎`, next: `Scene ${g.scene} of ${SCENES}` };
    case 'level': return { title: `Level ${g.level} done! ${'💎'.repeat(SCENES)}`, sub: 'New scenes next time', next: 'Play again' };
    case 'lost': return { title: `Out of balls 💔`, sub: `${g.hearts} ${g.hearts === 1 ? 'heart' : 'hearts'} left`, next: 'Try again' };
    case 'out': return { title: 'No hearts left', sub: 'Back to scene 1', next: 'Start again' };
    default: throw new Error(`endWords: unknown outcome: ${outcome}`);
  }
}
