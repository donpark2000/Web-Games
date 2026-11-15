// Topple! things not to hit (journal Q97; developer, 2026-11-12: hitting one
// "loses the scene ... the challenge is making it clear you should not hit
// it"; 2026-11-14: "Since we lose a heart, maybe the ball turns into a heart
// and then explodes?"; "Use the red slashed ring and the notice line").
// No DOM, three.js or physics here: what each level's thing is, its size and
// physics, where a scene may stand it, and when a scene has one. The drawing
// (src/ui/topple-keepout.js) and the page (src/ui/topple.js) take it from
// here; the scene check (src/core/topple-world.js) judges the places.
//
// Built in the first pass (session 4 of the Hardest build, 2026-11-14): one
// thing a scene in scenes 2 and 4 (the spread-out ones: no moving thing
// there), Hardest only, in the levels whose Hardest is built (1-3). Harder's
// scenes are Normal's, with no spread-out scene to stand one in, so it waits
// for the developer's word (journal Q108).
//
// Sizes are world metres (Far: twice real). A thing is one box to the physics
// (the shape a ball touches), standing on the ground, facing the camera.

// The scenes of a level that have one, and the how-hard choices that do.
export const KEEP_SCENES = [2, 4];
export const KEEP_MODES = ['hardest'];

// By level: Park, Building site, Frosty Times (Cactus Canyon and Star Light
// follow their Hardest). `the` is the words the notice and the card use.
export const KEEP = { 1: 'nest', 2: 'pane', 3: 'lantern' };
export const THINGS = {
  // a bird's nest with eggs on a tree stump: it tumbles
  nest: { name: 'bird\'s nest', the: 'the bird\'s nest', w: 0.7, h: 0.62, d: 0.7, reacts: 'tumbles' },
  // a pane of glass leaning in a wooden frame (a window waiting to go in): it shatters
  pane: { name: 'window pane', the: 'the window pane', w: 1.0, h: 1.1, d: 0.2, reacts: 'shatters' },
  // a glass lantern on a post, lit: it shatters and goes out
  lantern: { name: 'lantern', the: 'the lantern', w: 0.5, h: 0.95, d: 0.5, reacts: 'shatters' },
};
export const KEEP_THINGS = Object.keys(THINGS);

// The thing a scene has, or null: how hard (`mode`), the level and the scene.
export const keepFor = (mode, level, scene) => (KEEP_MODES.includes(mode) && KEEP_SCENES.includes(scene) ? KEEP[level] ?? null : null);

// The warning line for the notice shown while a scene is set up (the thing
// with its picture, as the developer agreed: "Don't hit the nest!").
export const keepLine = thing => (THINGS[thing] ? `Don't hit ${THINGS[thing].the}!` : null);
// The picture beside it: the thing's emoji
export const KEEP_EMOJI = { nest: '🐦', pane: '🖼️', lantern: '🏮' };

// A thing placed: { thing, x, z } (world m, its base's middle on the ground).
// Its physics ({ kind, thing, shapes }), what's drawn ({ part, ... }) and the
// box the view must show ([cx, cy, cz, hx, hy, hz]).
export function keepoutParts(k) {
  const t = THINGS[k.thing], { w, h, d } = t;
  const body = { kind: 'keepout', thing: k.thing, shapes: [{ type: 'box', half: [w / 2, h / 2, d / 2], at: [k.x, h / 2, k.z], yaw: 0 }] };
  const prop = { part: 'keepout', thing: k.thing, at: [k.x, 0, k.z], w, h, d };
  return { body, prop, fit: [k.x, h / 2, k.z, w / 2, h / 2, d / 2] };
}

// Where a scene may stand its thing, tried in this order: on the line from
// the hand to a block, partly in the way of the straight throws to it (not all
// of them: the scene check judges that, and that every block still shows and
// is hit from the front). `parts` is sceneParts()'s, `hand` the slingshot's
// spot, `rand` the scene's seeded random, `meets` (meetsThings(parts)) the
// test for the scene's other things. Never on a block's or the structure's
// ground, never on another thing, never off to a side of the view, and never
// nearer the hand than KEEP_NEAR of the way to the block.
export const SHARES = [0.75, 0.62, 0.88];
export const OFFSETS = [0, 0.45, -0.45, 0.8, -0.8];
export const KEEP_NEAR = 0.55;
export const KEEP_ROOM = 0.15;   // clear of a block or the structure by at least this (m)
export function keepCandidates(parts, thing, hand, rand, meets = () => null) {
  const t = THINGS[thing], seen = new Set(), out = [];
  const { min, max } = parts.bounds, st = parts.stand;
  for (const b of parts.blocks) {
    const dx = b.x - hand.x, dz = b.z - hand.z, dist = Math.hypot(dx, dz);
    if (dist < 1e-6) continue;
    const ux = dx / dist, uz = dz / dist;
    for (const share of SHARES) for (const off of OFFSETS) {
      const x = +(hand.x + dx * share - uz * off).toFixed(3), z = +(hand.z + dz * share + ux * off).toFixed(3), key = `${x},${z}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (share < KEEP_NEAR) continue;
      // inside the view's width as it is (the view fits the scene: a thing at the side would widen it)
      if (x - t.w / 2 < min[0] || x + t.w / 2 > max[0] || z > hand.z - 1.5) continue;
      const hw = t.w / 2 + KEEP_ROOM, hd = t.d / 2 + KEEP_ROOM;
      if (Math.abs(x - st.x) < st.w / 2 + hw && Math.abs(z - st.z) < st.d / 2 + hd) continue;
      if (parts.blocks.some(o => Math.abs(x - o.x) < o.w / 2 + hw && Math.abs(z - o.z) < o.d / 2 + hd)) continue;
      if (meets([x, t.h / 2, z], [t.w / 2 + 0.1, t.h / 2, t.d / 2 + 0.1])) continue;
      out.push({ thing, x, z, near: b.c ?? null, share, off });
    }
  }
  // a seeded shuffle, so a scene's choice is its own and the same every time
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// How many places of a scene are tried with the scene check before its layout
// is thrown away and the next made.
export const KEEP_TRIES = 10;
// The scene check's judgement of a place: of the scan's straight throws that
// hit a block with nothing in the way (`base`), at least KEEP_MIN hit the
// thing first (it is in the way), and no more than KEEP_MAX_SHARE of them
// (the structure is still the target).
export const KEEP_MIN = 6;
export const KEEP_MAX_SHARE = 0.35;
