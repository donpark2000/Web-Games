// The map's road (Q117, DESIGN.md "Topple!", The map): where each scene
// (levels of 5) stands on a winding road that runs up the screen, level 1 at
// the bottom. Each world starts with a gate of its own (Q122, developer,
// 2026-11-17: "a more dramatic separation"), the road broken between one
// world and the next. A world not open yet is closed off (Q128, developer,
// 2026-11-18: "a teaser is OK but don't show the levels"): the road ends at
// its barrier, with nothing past it. Pure sums, no DOM: src/ui/topple.js
// draws it.
import { SCENES, WORLDS, worldOf, worldLevels } from './topple.js';

export const ROAD_MIN_CIRCLE = 46;   // px: a scene's circle is never smaller (a finger)
export const GATE_H = 150;           // px: a world's gate, under its first level
export const BARRIER_H = 230;        // px: the next world's barrier at the road's top (its teaser behind it)

// For a road `w` px wide, the first `open` worlds shown (the next one as its
// barrier, if there is one): the circles (46-60 px across), the room per
// scene and per level's banner, and each scene's centre, winding from side to
// side; `gates` the open worlds' (top, bottom, y: the banner's centre);
// `barrier` the next world's (top, bottom, y), or null.
export function roadGeom(w, open = WORLDS.length) {
  const size = Math.round(Math.max(ROAD_MIN_CIRCLE, Math.min(60, w * 0.15))), step = Math.round(size * 1.32), band = 60, pad = 18;
  const sect = band + SCENES * step;
  const all = WORLDS.filter(x => worldLevels(x).length);
  const worlds = all.slice(0, Math.max(1, Math.min(open, all.length))), next = all[worlds.length] ?? null;
  const levels = worlds.flatMap(x => worldLevels(x)), last = levels.length;
  // (with a barrier at the top, it takes the top's padding: no gap under it)
  const H = pad + last * sect + worlds.length * GATE_H + (next ? BARRIER_H : pad);
  const amp = Math.min(w * 0.3, 120);
  // how far up from the foot each level's section starts: the gates of its world and those under it, the levels under it
  const base = lv => pad + (worlds.indexOf(worldOf(lv)) + 1) * GATE_H + (lv - 1) * sect;
  const nodes = [];
  for (let lv = 1; lv <= last; lv++) {
    for (let sc = 1; sc <= SCENES; sc++) {
      const i = (lv - 1) * SCENES + sc - 1;
      nodes.push({ lv, sc, x: Math.round(w / 2 + amp * Math.sin(i * 1.15)), y: Math.round(H - base(lv) - band - (sc - 0.5) * step) });
    }
  }
  // each level's band behind its scenes: top, bottom, and where its banner sits (under its first scene)
  // (the top level's band runs to the road's top, unless the barrier is there)
  const bands = Array.from({ length: last }, (_, k) => {
    const lv = k + 1, bottom = H - base(lv);
    return { lv, top: lv === last && !next ? 0 : bottom - sect, bottom, y: Math.round(bottom - band / 2) };
  });
  // each world's gate: under its first level (the first world's to the road's foot)
  const gates = worlds.map((x, k) => {
    const first = worldLevels(x)[0], top = H - base(first), bottom = k === 0 ? H : top + GATE_H;
    return { world: x.id, n: x.n, top, bottom, y: Math.round((top + bottom - (k === 0 ? pad : 0)) / 2) };
  });
  const barrier = next ? { world: next.id, n: next.n, top: 0, bottom: BARRIER_H, y: Math.round(BARRIER_H * 0.62) } : null;
  return { size, step, H, w, nodes, bands, gates, barrier, open: worlds.length };
}
export const nodeAt = (geo, lv, sc) => geo.nodes[(lv - 1) * SCENES + sc - 1];
// The road between two scenes is broken where a world ends (the gate between).
export const roadJoins = (a, b) => worldOf(a.lv) === worldOf(b.lv);
// How many worlds are open (their levels on the map), for a game where
// `isOpenLevel(lv)` says whether level lv is open: a world is open once its
// first level is, and the worlds open in order. `shut`: a world shown closed
// still (its barrier about to open, Q128).
export function openWorlds(isOpenLevel, shut = null) {
  let n = 0;
  for (const x of WORLDS) {
    const first = worldLevels(x)[0];
    if (first == null || !isOpenLevel(first) || x.id === shut) break;
    n++;
  }
  return Math.max(1, n);
}
