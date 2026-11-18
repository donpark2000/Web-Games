// The map's road (Q117, DESIGN.md "Topple!", The map): where each scene
// (levels of 5) stands on a winding road that runs up the screen, level 1 at
// the bottom. Each world starts with a gate of its own (Q122, developer,
// 2026-11-17: "a more dramatic separation"): its banner and How to play,
// the road broken between one world and the next. Pure sums, no DOM:
// src/ui/topple.js draws it.
import { SCENES, MAX_LEVEL, WORLDS, worldOf, worldLevels } from './topple.js';

export const ROAD_MIN_CIRCLE = 46;   // px: a scene's circle is never smaller (a finger)
export const GATE_H = 150;           // px: a world's gate, under its first level

// For a road `w` px wide: the circles (46-60 px across), the room per scene
// and per level's banner, and each scene's centre, winding from side to side;
// `gates` the worlds' (top, bottom, y: the banner's centre).
export function roadGeom(w) {
  const size = Math.round(Math.max(ROAD_MIN_CIRCLE, Math.min(60, w * 0.15))), step = Math.round(size * 1.32), band = 60, pad = 18;
  const sect = band + SCENES * step;
  const worlds = WORLDS.filter(x => worldLevels(x).length);
  const H = pad * 2 + MAX_LEVEL * sect + worlds.length * GATE_H;
  const amp = Math.min(w * 0.3, 120);
  // how far up from the foot each level's section starts: the gates of its world and those under it, the levels under it
  const base = lv => pad + (worlds.indexOf(worldOf(lv)) + 1) * GATE_H + (lv - 1) * sect;
  const nodes = [];
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    for (let sc = 1; sc <= SCENES; sc++) {
      const i = (lv - 1) * SCENES + sc - 1;
      nodes.push({ lv, sc, x: Math.round(w / 2 + amp * Math.sin(i * 1.15)), y: Math.round(H - base(lv) - band - (sc - 0.5) * step) });
    }
  }
  // each level's band behind its scenes: top, bottom, and where its banner sits (under its first scene)
  const bands = Array.from({ length: MAX_LEVEL }, (_, k) => {
    const lv = k + 1, bottom = H - base(lv);
    return { lv, top: lv === MAX_LEVEL ? 0 : bottom - sect, bottom, y: Math.round(bottom - band / 2) };
  });
  // each world's gate: under its first level (the first world's to the road's foot)
  const gates = worlds.map((x, k) => {
    const first = worldLevels(x)[0], top = H - base(first), bottom = k === 0 ? H : top + GATE_H;
    return { world: x.id, n: x.n, top, bottom, y: Math.round((top + bottom - (k === 0 ? pad : 0)) / 2) };
  });
  return { size, step, H, w, nodes, bands, gates };
}
export const nodeAt = (geo, lv, sc) => geo.nodes[(lv - 1) * SCENES + sc - 1];
// The road between two scenes is broken where a world ends (the gate between).
export const roadJoins = (a, b) => worldOf(a.lv) === worldOf(b.lv);
