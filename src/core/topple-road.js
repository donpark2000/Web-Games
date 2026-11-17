// The map's road (Q117, DESIGN.md "Topple!", The map): where each of the 25
// scenes (5 levels of 5) stands on a winding road that runs up the screen,
// level 1 at the bottom. Pure sums, no DOM: src/ui/topple.js draws it.
import { SCENES, MAX_LEVEL } from './topple.js';

export const ROAD_MIN_CIRCLE = 46;   // px: a scene's circle is never smaller (a finger)

// For a road `w` px wide: the circles (46-60 px across), the room per scene
// and per level's banner, and each scene's centre, winding from side to side.
export function roadGeom(w) {
  const size = Math.round(Math.max(ROAD_MIN_CIRCLE, Math.min(60, w * 0.15))), step = Math.round(size * 1.32), band = 60, pad = 18;
  const sect = band + SCENES * step, H = pad * 2 + MAX_LEVEL * sect;
  const amp = Math.min(w * 0.3, 120);
  const nodes = [];
  for (let lv = 1; lv <= MAX_LEVEL; lv++) {
    for (let sc = 1; sc <= SCENES; sc++) {
      const i = (lv - 1) * SCENES + sc - 1;
      nodes.push({ lv, sc, x: Math.round(w / 2 + amp * Math.sin(i * 1.15)), y: Math.round(H - pad - (lv - 1) * sect - band - (sc - 0.5) * step) });
    }
  }
  // each level's band behind its scenes: top, bottom, and where its banner sits (under its first scene)
  const bands = Array.from({ length: MAX_LEVEL }, (_, k) => ({
    lv: k + 1, top: k === MAX_LEVEL - 1 ? 0 : H - pad - (k + 1) * sect, bottom: k === 0 ? H : H - pad - k * sect, y: Math.round(H - pad - k * sect - band / 2),
  }));
  return { size, step, H, w, nodes, bands };
}
export const nodeAt = (geo, lv, sc) => geo.nodes[(lv - 1) * SCENES + sc - 1];
