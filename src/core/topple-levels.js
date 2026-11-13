// Topple!'s levels after the first (DESIGN.md "Topple!" Levels): what each
// is called, the materials its blocks are made of, its five structures in
// a fixed order (the 5th the challenge: developer, 2026-11-11) and the
// things in its way. Data only, no imports: src/core/topple.js lays the
// scenes out, src/core/topple-world.js runs the physics, src/ui/ draws.
//
// Level 1, "The park", is src/core/topple.js's own (its scenes 1-4 dealt
// from six structures; "the way in", kept as it is).
// Level 2, "The building site" (journal Q73, Q75, Q76; mockups v1-v7).
// Level 3, "Frosty Times" (developer, 2026-11-11: "the winter theme with
// ice blocks. Background scene can be snow and mountains").
// Level 4, "Cactus Canyon" (developer: "the desert. Background is sand,
// cactus, maybe some snakes, and rock formations similar to deserts in the
// US. Structural components of targets can be water barrels (that spew
// water when broken) and wooden beams"; the name Claude's pick, to review).
//
// Sizes here are world metres (as the mockups had them), each structure
// from its own middle at the ground (y 0 the ground); topple.js turns them
// into its "Near" metres.

/* ---------- materials ---------- */

// kg/m³ (level 1's toy blocks 27), how much of its speed the ball keeps off
// one (bounce), how they grip, and `breaks`: the speed of a knock (m/s, along
// the knock) that breaks one (ice shatters, a barrel bursts); null: never.
// Wood lightest, steel heaviest, closer together than real ones so the ball
// can still tip a steel post (mockup v3). Ice slippery (Claude's pick: it
// slides as well as falls). A barrel full of water, a little heavier than
// wood; it bursts at a hard knock (the ball's, or a fall).
export const MATS = {
  toy: { density: 27, bounce: 0.3, friction: 0.5, breaks: null },
  wood: { density: 18, bounce: 0.30, friction: 0.50, breaks: null },
  brick: { density: 30, bounce: 0.12, friction: 0.60, breaks: null },
  concrete: { density: 36, bounce: 0.15, friction: 0.55, breaks: null },
  steel: { density: 45, bounce: 0.45, friction: 0.35, breaks: null },
  // ice down (fallen, tipped) shatters as it lands (developer, 2026-11-12, Q83: a cube that fell
  // whole looked like one still to knock down): whole ice is always ice still standing
  ice: { density: 22, bounce: 0.25, friction: 0.15, breaks: 2.2, downBreaks: true, slides: true },
  barrel: { density: 24, bounce: 0.25, friction: 0.5, breaks: 3.0 },
  // Star Light's glowing blocks (developer, 2026-11-12, Q87: "When a block is
  // hit it breaks similar to ice blocks but with the fragments matching the
  // color of the glow"): break as ice does, down too; they grip (not ice's slide).
  glow: { density: 22, bounce: 0.25, friction: 0.5, breaks: 2.2, downBreaks: true },
};
// The glows' colours, given round a structure's blocks in turn (so pieces
// side by side differ): cyan, pink, lime, amber, violet.
export const GLOWS = ['#6FF3FF', '#FF7AE0', '#B6FF6A', '#FFC85C', '#A98BFF'];

/* ---------- pieces (world metres) ---------- */

const E = 0.002;   // a hair between stacked pieces
const topOf = b => b.y + b.h / 2;
const box = (mat, w, h, d, x, y0, z, c = '') => ({ mat, w, h, d, x, y: y0 + E + h / 2, z, c });
// a barrel standing on its end: a cylinder of radius r (w and d are 2r)
const barrel = (x, y0, z, r = 0.27, h = 0.8) => ({ mat: 'barrel', shape: 'cyl', r, w: 2 * r, h, d: 2 * r, x, y: y0 + E + h / 2, z, c: '' });

// four posts at (cx ± hx, cz ± hz) and a slab on them: { bs, y: the slab's top }
function storey(cx, cz, y0, hx, hz, h, sw, sd, m = { post: 'steel', slab: 'concrete', pw: 0.2, st: 0.1 }) {
  const ps = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([i, k]) => box(m.post, m.pw, h, m.pw, cx + i * hx, y0, cz + k * hz));
  const s = box(m.slab, sw, m.st, sd, cx, topOf(ps[0]), cz);
  return { bs: [...ps, s], y: topOf(s) };
}
// two posts and a slab across them, seen face on (a flat frame): { bs, y }
function gate(cx, cz, y0, hx, h, sw, sd, m) {
  const ps = [-1, 1].map(i => box(m.post, m.pw, h, m.pd ?? m.pw, cx + i * hx, y0, cz));
  const s = box(m.slab, sw, m.st, sd, cx, topOf(ps[0]), cz);
  return { bs: [...ps, s], y: topOf(s) };
}
const stack = (n, args, m) => { const out = []; let y = 0; for (let i = 0; i < n; i++) { const s = storey(0, 0, y, ...args, m); out.push(...s.bs); y = s.y; } return { bs: out, y }; };

const SITE = { post: 'steel', slab: 'concrete', pw: 0.2, st: 0.1 };
const SITE_WOOD = { post: 'wood', slab: 'wood', pw: 0.2, st: 0.1 };
const ICE = { post: 'ice', slab: 'ice', pw: 0.26, pd: 0.3, st: 0.18 };
const TIMBER = { post: 'wood', slab: 'wood', pw: 0.16, st: 0.12 };
const GLOW = { post: 'glow', slab: 'glow', pw: 0.2, pd: 0.24, st: 0.14 };
// an upright glowing column (a cylinder of radius r)
const column = (x, y0, z, r, h) => ({ mat: 'glow', shape: 'cyl', r, w: 2 * r, h, d: 2 * r, x, y: y0 + E + h / 2, z, c: '' });
// a structure's blocks, each given a glow colour in turn (`from`: the first)
const lit = (bs, from = 0) => bs.map((b, i) => ({ ...b, c: GLOWS[(i + from) % GLOWS.length] }));

// `k(name)`: the seed's small changes, 0.95-1.05 (so a new game isn't identical).
export const STRUCTURES = {
  /* ---------- level 2, the building site (journal: "Level 2's scenes, Claude's picks") ---------- */
  // 1. A storey on a storey: the level 1 lesson (hit a bottom post) on a taller frame.
  twoStoreys: k => {
    const a = storey(0, 0, 0, 0.55, 0.4, 0.9 * k('a'), 1.4, 1.0, SITE), b = storey(0, 0, a.y, 0.45, 0.3, 0.8 * k('b'), 1.2, 0.8, SITE);
    return [...a.bs, ...b.bs, box('brick', 0.3, 0.3, 0.3, 0, b.y, 0)];
  },
  // 2. Tall and thin: 3 m.
  threeStoreys: k => { const s = stack(3, [0.33, 0.28, 0.8 * k('h'), 0.9, 0.8], SITE); return [...s.bs, box('brick', 0.28, 0.28, 0.28, 0, s.y, 0)]; },
  // 3. Two towers and a wooden plank: two targets, the first scene that can't fall to one ball.
  bridge: k => {
    const g = 0.75 * k('g'), l = storey(-g, 0, 0, 0.18, 0.18, 1.0, 0.6, 0.6, SITE), r = storey(g, 0, 0, 0.18, 0.18, 1.0, 0.6, 0.6, SITE);
    const p = box('wood', 2 * g + 0.5, 0.12, 0.32, 0, l.y, 0);
    return [...l.bs, ...r.bs, p, box('brick', 0.3, 0.3, 0.3, 0, topOf(p), 0)];
  },
  // 4. A low wooden frame in front of a two-storey steel one: the first hidden blocks.
  steps: k => {
    const f = storey(0, 0.35, 0, 0.5, 0.2, 0.7 * k('f'), 1.2, 0.62, SITE_WOOD);
    const b1 = storey(0, -0.42, 0, 0.6, 0.25, 0.9, 1.4, 0.72, SITE), b2 = storey(0, -0.42, b1.y, 0.5, 0.2, 0.8, 1.2, 0.62, SITE);
    return [...f.bs, box('brick', 0.28, 0.28, 0.28, 0.25, f.y, 0.35), ...b1.bs, ...b2.bs];
  },
  // 5. The challenge: a three-storey tower behind a low wall of upright bricks,
  // which fall in parts and hide the tower's lower posts (four storeys behind five, then three, bricks were won 31% of the time).
  towerWall: k => {
    const t = stack(3, [0.3, 0.25, 0.75 * k('h'), 0.82, 0.72], SITE);
    const tower = [...t.bs, box('brick', 0.26, 0.26, 0.26, 0, t.y, 0)].map(b => ({ ...b, z: b.z - 0.55 }));
    const wall = [-0.25, 0.25].map((x, i) => box('brick', 0.46, 0.55 * (i ? 1 : 0.94), 0.14, x, 0, 0.45));
    return [...wall, ...tower];
  },

  // (10.3, more to deal from: developer, 2026-11-12, "different target arrangements")
  // A scaffold: one wide storey on four tall steel posts, two bricks on its slab.
  scaffold: k => {
    const s = storey(0, 0, 0, 0.7 * k('w'), 0.35, 1.0 * k('h'), 1.7, 0.9, SITE);
    return [...s.bs, box('brick', 0.3, 0.3, 0.3, -0.45, s.y, 0), box('brick', 0.3, 0.3, 0.3, 0.45, s.y, 0)];
  },
  // Brick stacks: three steel posts, a brick on each, in a row slanting away to the right (falls in parts).
  brickStacks: k => {
    const s = 0.55 * k('s'), out = [];
    [1.0, 1.15, 0.9].forEach((h, i) => { const p = box('steel', 0.2, h * k('h' + i), 0.2, (i - 1) * s, 0, -i * 0.14); out.push(p, box('brick', 0.28, 0.28, 0.28, p.x, topOf(p), p.z)); });
    return out;
  },
  // A challenge: two towers of two storeys side by side behind a low wall of two upright bricks.
  twinTowers: k => {
    const g = 0.62 * k('g'), out = [];
    for (const cx of [-g, g]) {
      // (two storeys each behind a 0.5 m wall: won 1 of 6; the upper storeys shorter, the wall lower)
      const a = storey(cx, -0.5, 0, 0.22, 0.2, 0.85, 0.62, 0.58, SITE), b = storey(cx, -0.5, a.y, 0.18, 0.16, 0.55, 0.52, 0.48, SITE);
      out.push(...a.bs, ...b.bs, box('brick', 0.26, 0.26, 0.26, cx, b.y, -0.5));
    }
    const wall = [-0.3, 0.3].map((x, i) => box('brick', 0.5, 0.4 * (i ? 1 : 0.94), 0.14, x * k('w'), 0, 0.4));
    return [...wall, ...out];
  },

  /* ---------- level 3, Frosty Times: ice (Claude's picks, to review) ---------- */
  // 1. An ice gate: two pillars, a lintel, two cubes on it.
  iceGate: k => {
    const g = gate(0, 0, 0, 0.45 * k('w'), 0.95, 1.25, 0.36, ICE);
    return [...g.bs, box('ice', 0.3, 0.3, 0.3, -0.3, g.y, 0), box('ice', 0.3, 0.3, 0.3, 0.3, g.y, 0)];
  },
  // 2. An ice tower: three gates stacked, a cube on top.
  iceTower: k => {
    const out = []; let y = 0;
    [[0.4, 0.8], [0.34, 0.7], [0.28, 0.6]].forEach(([hx, h], i) => { const g = gate(0, 0, y, hx, h * k('h' + i), 2 * hx + 0.36, 0.38, ICE); out.push(...g.bs); y = g.y; });
    return [...out, box('ice', 0.3, 0.3, 0.3, 0, y, 0)];
  },
  // 3. An ice wall with battlements: two pairs of pillars, a slab across each pair, a cube on each slab (falls in parts).
  iceWall: k => {
    const xs = [-0.95, -0.35, 0.35, 0.95].map(x => x * k('w')), h = 0.85;
    const ps = xs.map(x => box('ice', 0.24, h, 0.3, x, 0, 0));
    // (five pillars, the middle one alone, was won 44% of the time: two pairs since)
    const sl = [0, 2].map(i => box('ice', xs[i + 1] - xs[i] + 0.3, 0.16, 0.36, (xs[i] + xs[i + 1]) / 2, topOf(ps[0]), 0));
    return [...ps, ...sl, ...sl.map(s => box('ice', 0.26, 0.26, 0.26, s.x, topOf(s), 0))];
  },
  // 4. An ice pyramid: 4, 3, 2 and 1 cubes, stepped back as they rise (each cube breaks; the ones above drop).
  icePyramid: k => {
    const s = 0.3 * k('s'), out = [];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 4 - row; i++) out.push(box('ice', s, s, s, (i - (3 - row) / 2) * (s + 0.01), row * (s + E), -row * 0.04));
    return out;
  },
  // 5. The challenge: an ice castle. Two towers of two storeys joined by a
  // bridge slab, a cube on each tower, behind two wide upright ice
  // slabs that hide the towers' feet until they fall.
  iceCastle: k => {
    const g = 0.72 * k('g'), out = [];
    let top1 = 0;
    for (const cx of [-g, g]) {
      const a = gate(cx, -0.45, 0, 0.2, 0.75, 0.9, 0.36, ICE), b = gate(cx, -0.45, a.y, 0.17, 0.6, 0.6, 0.36, ICE);
      out.push(...a.bs, ...b.bs, box('ice', 0.26, 0.26, 0.26, cx, b.y, -0.45));
      top1 = a.y;
    }
    // the bridge rests on the lower slabs' inner ends (13 cm each), short of the upper towers' posts
    out.push(box('ice', 2 * g - 0.64, 0.14, 0.34, 0, top1, -0.45));
    const front = [-0.42, 0.42].map(x => box('ice', 0.7, 0.5, 0.12, x * k('w'), 0, 0.3));
    return [...front, ...out];
  },

  // (10.3) Ice steps: columns of one, two and three cubes side by side.
  iceSteps: k => {
    const s = 0.3 * k('s'), out = [];
    for (let c = 0; c < 3; c++) for (let r = 0; r <= c; r++) out.push(box('ice', s, s, s, (c - 1) * (s + 0.08), r * (s + E), -c * 0.05));
    return out;
  },
  // Ice pillars: three tall pillars, a cube on each, slanting away to the right (falls in parts).
  icePillars: k => {
    const s = 0.55 * k('s'), out = [];
    [0.95, 1.1, 0.85].forEach((h, i) => { const p = box('ice', 0.24, h, 0.3, (i - 1) * s, 0, -i * 0.14); out.push(p, box('ice', 0.28, 0.28, 0.28, p.x, topOf(p), p.z)); });
    return out;
  },
  // A challenge: an ice keep. A tower of two gates and a cube, behind a low ice gate that hides its feet.
  iceKeep: k => {
    const a = gate(0, -0.5, 0, 0.36, 0.85 * k('h'), 1.08, 0.36, ICE), b = gate(0, -0.5, a.y, 0.3, 0.7, 0.92, 0.36, ICE);
    const tower = [...a.bs, ...b.bs, box('ice', 0.3, 0.3, 0.3, 0, b.y, -0.5)];
    const front = gate(0, 0.32, 0, 0.42 * k('w'), 0.42, 1.2, 0.3, { ...ICE, pd: 0.24, st: 0.14 });
    return [...front.bs, ...tower];
  },

  /* ---------- level 4, Cactus Canyon: wooden beams and water barrels (Claude's picks, to review) ---------- */
  // 1. A trestle: two barrels, a beam across them, a barrel on the beam.
  trestle: k => {
    const g = 0.42 * k('g'), a = barrel(-g, 0, 0), b = barrel(g, 0, 0);
    const beam = box('wood', 2 * g + 0.6, 0.12, 0.3, 0, topOf(a), 0);
    return [a, b, beam, barrel(0, topOf(beam), 0, 0.24, 0.66)];
  },
  // 2. Barrels stacked 3, 2, 1 with beams between.
  barrelStack: k => {
    const s = 0.6 * k('s'), out = [-s, 0, s].map(x => barrel(x, 0, 0));
    const b1 = box('wood', 2 * s + 0.6, 0.1, 0.3, 0, topOf(out[0]), 0);
    const mid = [-s / 2, s / 2].map(x => barrel(x, topOf(b1), 0, 0.25, 0.7));
    const b2 = box('wood', s + 0.56, 0.1, 0.28, 0, topOf(mid[0]), 0);
    return [...out, b1, ...mid, b2, barrel(0, topOf(b2), 0, 0.23, 0.62)];
  },
  // 3. A hitching rail: three posts and two rails, and barrels behind it.
  hitchingRail: k => {
    const xs = [-0.8, 0, 0.8].map(x => x * k('w')), posts = xs.map(x => box('wood', 0.14, 0.95, 0.14, x, 0, 0.2));
    const rails = [0, 1].map(i => box('wood', xs[i + 1] - xs[i] - 0.02, 0.1, 0.16, (xs[i] + xs[i + 1]) / 2, topOf(posts[0]), 0.2));
    const bs = [-0.42, 0.42].map(x => barrel(x * k('b'), 0, -0.35));
    return [...posts, ...rails, ...bs, barrel(0, topOf(rails[0]), 0.2, 0.2, 0.5)];
  },
  // 4. A water tower: four tall legs, two cross beams and a deck, the tank (a big barrel) on top.
  waterTower: k => {
    const h = 1.25 * k('h'), legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([i, j]) => box('wood', 0.14, h, 0.14, i * 0.38, 0, j * 0.32));
    const cross = [0.32, -0.32].map(z => box('wood', 0.98, 0.1, 0.16, 0, topOf(legs[0]), z));
    const deck = box('wood', 1.0, 0.08, 0.9, 0, topOf(cross[0]), 0);
    return [...legs, ...cross, deck, barrel(0, topOf(deck), 0, 0.38, 0.72)];
  },
  // 5. The challenge: a two-storey timber frame with a barrel on each floor,
  // behind a row of barrels that hides its lower posts.
  saloon: k => {
    const a = storey(0, -0.5, 0, 0.55, 0.32, 0.95 * k('a'), 1.4, 0.94, { ...TIMBER, st: 0.1 });
    const b = storey(0, -0.5, a.y, 0.45, 0.26, 0.8, 1.2, 0.8, { ...TIMBER, st: 0.1 });
    const front = [-0.6, 0, 0.6].map(x => barrel(x * k('f'), 0, 0.35, 0.26, 0.76));
    return [...front, ...a.bs, barrel(-0.15, a.y, -0.5, 0.18, 0.5), ...b.bs, barrel(0, b.y, -0.5, 0.22, 0.6)];
  },

  // (10.3) A row of barrels slanting away to the right, a small one on the second (falls in parts).
  // (0.62 m apart, a small one on each of the middle two: won 69-75%; closer, so one falling knocks the next)
  barrelRow: k => {
    const s = 0.56 * k('s'), out = [];
    for (let i = 0; i < 4; i++) {
      const b = barrel((i - 1.5) * s, 0, -i * 0.12, 0.25, 0.75);
      out.push(b);
      if (i === 1) out.push(barrel(b.x, topOf(b), b.z, 0.18, 0.5));
    }
    return out;
  },
  // A sign: two tall posts and a board across their tops, a small barrel at each end of it.
  signboard: k => {
    const g = gate(0, 0, 0, 0.5 * k('w'), 1.15 * k('h'), 1.3, 0.3, { ...TIMBER, pw: 0.14, st: 0.14 });
    return [...g.bs, barrel(-0.42, g.y, 0, 0.14, 0.42), barrel(0.42, g.y, 0, 0.14, 0.42)];
  },
  // A challenge: a mine's head frame. A two-storey timber frame with a barrel on top,
  // behind a trestle (two barrels and a beam) that hides its lower posts.
  mineHead: k => {
    // (a barrel on top only, the trestle's barrels 0.62 m: won 6 of 6; a barrel on each floor and the trestle
    // taller: 9 of 10; the trestle's beam carrying a barrel too)
    const a = storey(0, -0.5, 0, 0.42, 0.28, 0.9 * k('a'), 1.1, 0.8, { ...TIMBER, st: 0.1 });
    const b = storey(0, -0.5, a.y, 0.34, 0.22, 0.8, 0.92, 0.66, { ...TIMBER, st: 0.1 });
    const l = barrel(-0.45 * k('f'), 0, 0.35, 0.26, 0.76), r = barrel(0.45 * k('f'), 0, 0.35, 0.26, 0.76);
    const beam = box('wood', 0.9 * k('f') + 0.56, 0.1, 0.28, 0, topOf(l), 0.35);
    return [l, r, beam, barrel(0, topOf(beam), 0.35, 0.18, 0.46), ...a.bs, barrel(0.18, a.y, -0.5, 0.17, 0.48), ...b.bs, barrel(0, b.y, -0.5, 0.2, 0.55)];
  },

  /* ---------- level 5, Star Light: glowing blocks at night (Claude's picks, to review) ---------- */
  // 1. A lantern arch: two glowing columns, a slab across, a cube at each end and one in the middle.
  lanternArch: k => {
    const g = 0.42 * k('g'), h = 0.9, cols = [-g, g].map(x => column(x, 0, 0, 0.13, h));
    const s = box('glow', 2 * g + 0.4, 0.14, 0.36, 0, topOf(cols[0]), 0);
    return lit([...cols, s, ...[-g, 0, g].map(x => box('glow', 0.26, 0.26, 0.26, x, topOf(s), 0))]);
  },
  // 2. A lighthouse: four drums, each narrower, and a lamp (a cube) on top: tall, and one good hit brings it down.
  lighthouse: k => {
    const out = []; let y = 0;
    [[0.24, 0.5], [0.21, 0.45], [0.18, 0.42], [0.15, 0.38]].forEach(([r, h], i) => { const c = column(0, y, 0, r * k('r'), h * k('h' + i)); out.push(c); y = topOf(c); });
    return lit([...out, box('glow', 0.24, 0.24, 0.24, 0, y, 0)], 1);
  },
  // 3. Candles: four columns of different heights in a row, a cube on each, slanting away
  // to the right, close enough that one falling can knock the next (falls in parts).
  candles: k => {
    const s = 0.5 * k('s'), out = [];
    [0.75, 1.0, 0.85, 0.65].forEach((h, i) => { const c = column((i - 1.5) * s, 0, -i * 0.12, 0.12, h); out.push(c, box('glow', 0.22, 0.22, 0.22, c.x, topOf(c), c.z)); });
    return lit(out, 2);
  },
  // 4. Twin lanterns: two gates with a long slab across them and a cube on each gate: two targets.
  twinLanterns: k => {
    const g = 0.72 * k('g'), l = gate(-g, 0, 0, 0.2, 0.8, 0.66, 0.36, GLOW), r = gate(g, 0, 0, 0.2, 0.8, 0.66, 0.36, GLOW);
    const p = box('glow', 2 * g - 0.5, 0.12, 0.3, 0, l.y, 0);
    return lit([...l.bs, ...r.bs, p, box('glow', 0.26, 0.26, 0.26, -g - 0.15, l.y, 0), box('glow', 0.26, 0.26, 0.26, g + 0.15, r.y, 0), box('glow', 0.24, 0.24, 0.24, 0, topOf(p), 0)], 3);
  },
  // 5. The challenge: a star palace. Two storeys of glowing columns and slabs,
  // a cube on top, behind a low wall of three glowing cubes that hides its feet.
  starPalace: k => {
    const z = -0.5, out = [];
    const a = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([i, j]) => column(i * 0.5, 0, z + j * 0.28, 0.1, 0.85 * k('a')));
    const s1 = box('glow', 1.3, 0.12, 0.86, 0, topOf(a[0]), z);
    const b = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([i, j]) => column(i * 0.4, topOf(s1), z + j * 0.22, 0.09, 0.7));
    const s2 = box('glow', 1.08, 0.12, 0.72, 0, topOf(b[0]), z);
    out.push(...a, s1, ...b, s2, box('glow', 0.28, 0.28, 0.28, 0, topOf(s2), z));
    const wall = [-0.5, 0, 0.5].map(x => box('glow', 0.28, 0.36, 0.22, x * k('w'), 0, 0.35));
    return lit([...wall, ...out], 4);
  },
  // (10.3) A crystal stack: four glowing cubes, each smaller, one on another.
  // (0.36-0.23 m cubes: the pine left the top ones hard to hit, 6.5 layouts a
  // scene to find one; two columns side by side, never)
  crystalStack: k => {
    const out = []; let y = 0;
    [0.44, 0.39, 0.35, 0.31].forEach(s => { const c = box('glow', s * k('s'), s * k('s'), s * k('s'), 0, y, 0); out.push(c); y = topOf(c); });
    return lit(out, 2);
  },
  // A star gate: two glowing posts, a slab across, three cubes on it, two and one.
  starGate: k => {
    const g = gate(0, 0, 0, 0.42 * k('w'), 0.9, 1.2, 0.36, GLOW), c = 0.26;
    const low = [-0.16, 0.16].map(x => box('glow', c, c, c, x, g.y, 0));
    return lit([...g.bs, ...low, box('glow', c, c, c, 0, topOf(low[0]), 0)], 1);
  },
  // A challenge: a moon temple. Four columns, a slab, two cubes on it, behind a
  // low gate (two cubes and a slab across them) that hides its feet.
  moonTemple: k => {
    // (a low gate of 0.3 m legs, two cubes on top: won 6 of 6; the gate taller, a third cube on the two)
    const z = -0.5, a = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([i, j]) => column(i * 0.45 * k('w'), 0, z + j * 0.26, 0.1, 0.95 * k('h')));
    const s = box('glow', 1.2 * k('w'), 0.12, 0.8, 0, topOf(a[0]), z);
    const top = [-0.16, 0.16].map(x => box('glow', 0.28, 0.28, 0.28, x, topOf(s), z));
    const legs = [-0.4, 0.4].map(x => box('glow', 0.26, 0.48, 0.22, x, 0, 0.35)), slab = box('glow', 1.1, 0.1, 0.24, 0, topOf(legs[0]), 0.35);
    return lit([...legs, slab, ...a, s, ...top, box('glow', 0.26, 0.26, 0.26, 0, topOf(top[0]), z)], 3);
  },
};

/* ---------- the levels ---------- */

// Each level's things in the way, by the job they do: `soft` catches the
// ball (it keeps 0.1 of its speed and drops: level 1's bush), `tall`
// stands to the left, its trunk in the way of a straight throw and its top
// of a lob (level 1's tree). Scenes 1-4 one, the 5th both.
// `ball`: 'iron' from level 2 on (mockup v3: "the iron ball feel[s] right").
// `pool`: the structures scenes 1-4 are dealt from, easiest first (4 of
// the 6 each game, played in this order, so the climb is sure);
// `challenges`: the 5th scene's, one of them (10.3; until then five in a
// fixed order: developer, 2026-11-12, "different target arrangements").
export const LEVELS = [
  { n: 1, name: 'The park', line: 'Knock every block down. 5 balls a scene.', soft: 'bush', tall: 'tree', ball: 'toy' },
  { n: 2, name: 'The building site', line: 'Tall frames: knock the front down to get at the back.', soft: 'barrow', tall: 'light', ball: 'iron',
    pool: ['twoStoreys', 'scaffold', 'threeStoreys', 'bridge', 'brickStacks', 'steps'], challenges: ['towerWall', 'twinTowers'] },
  { n: 3, name: 'Frosty Times', line: 'Ice blocks slide, and smash when they’re hit hard.', soft: 'rock', tall: 'pine', ball: 'iron',
    pool: ['iceGate', 'iceSteps', 'iceTower', 'icePyramid', 'icePillars', 'iceWall'], challenges: ['iceCastle', 'iceKeep'] },
  { n: 4, name: 'Cactus Canyon', line: 'Burst the water barrels and the beams come down.', soft: 'scrub', tall: 'cactus', ball: 'iron',
    pool: ['waterTower', 'signboard', 'trestle', 'barrelStack', 'barrelRow', 'hitchingRail'], challenges: ['saloon', 'mineHead'] },
  // (developer, 2026-11-12, Q87: "Night time with a moon and stars in the
  // sky. Similar vista to the winter level but low light. Blocks and balls
  // glow"; the things in the way level 3's, at night: Claude's pick)
  { n: 5, name: 'Star Light', line: 'Glowing blocks at night: hit them and they shatter.', soft: 'rock', tall: 'pine', ball: 'iron',
    pool: ['crystalStack', 'lanternArch', 'lighthouse', 'candles', 'starGate', 'twinLanterns'], challenges: ['starPalace', 'moonTemple'] },
];
export const MAX_LEVEL = LEVELS.length;
export const levelInfo = n => LEVELS[n - 1] ?? null;
// The balls (world metres and kg): level 1's painted one; the iron ball
// with its lifting ring (mockup v3: 0.07 m, 3 kg).
export const BALLS_BY = { toy: { r: 0.06, kg: 2 }, iron: { r: 0.07, kg: 3 } };

/* ---------- the map ---------- */

// Where each level sits on the map (% across and down its box), and the
// road between two: a curve leaving one level sideways and coming into the
// next from below (the map's look since level 2 mockup v1).
export const MAP_NODES = [{ x: 30, y: 89 }, { x: 68, y: 70 }, { x: 32, y: 51 }, { x: 68, y: 32 }, { x: 32, y: 13 }];
export function mapRoad(a, b) {
  return [[a.x, a.y], [a.x + (b.x - a.x) * 0.9, a.y], [b.x - (b.x - a.x) * 0.1, b.y + 14], [b.x, b.y]];
}
// A point t (0-1) along a curve [P0, P1, P2, P3].
export function roadAt(P, t) {
  const u = 1 - t, k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map(d => P.reduce((s, p, i) => s + k[i] * p[d], 0));
}
// The curve from its start to t (0-1), as its own curve (de Casteljau):
// the road travelled so far, drawn as the dots fill in behind your face.
export function roadTo(P, t) {
  const mix = (p, q) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const a = mix(P[0], P[1]), b = mix(P[1], P[2]), c = mix(P[2], P[3]), ab = mix(a, b), bc = mix(b, c);
  return [P[0], a, ab, mix(ab, bc)];
}
