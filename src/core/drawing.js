// The 3D games' drawing made lighter on a slow device (Q99, release 10.6;
// DESIGN.md "3D games"). The developer, 2026-11-13: "responsiveness when
// aiming and hitting targets is more important than cosmetic details".
//
// The speed test on the 2019 Galaxy Tab A (journal, "The speed test on the
// old tablet"): Topple!'s building site 3.5 frames a second as drawn, 60
// (the screen's own rate) with every cut; the cost is the graphics chip's
// work for each pixel. Shadows were 60% of the frame (three.js's soft and
// PCF shadows both read the shadow map 16-17 times a pixel), fewer pixels
// (0.75) 55%, reflections 35%, the surfaces' maps 20%, the park's far trees
// 25%; antialiasing and the photo sky nothing measurable, so they stay.
//
// So three levels: as drawn; light (every cut that saved time, the shadows
// kept but read once a pixel, three.js's Basic shadows, so a child still
// sees where a block or the ball is); lightest (light with no shadows).
// While a game plays, its frames are watched; a level whose frames take
// over SLOW_MS (under 25 a second) steps to the next. Never back up within
// a release: the level is kept on the device with the release, and a new
// release measures again from the top (so a device slow for a moment once
// isn't drawn lighter for good). A device that keeps up never changes.
// No DOM or UI code; the cuts are made by src/ui/drawcuts.js.

export const LEVELS = [
  { name: 'as drawn', cuts: {} },
  { name: 'light', cuts: { pixels: 0.75, shadows: 'basic', reflections: false, surfaces: 'plain', farTrees: false } },
  { name: 'lightest', cuts: { pixels: 0.75, shadows: 'off', reflections: false, surfaces: 'plain', farTrees: false } },
];

export const SLOW_MS = 40;    // a median frame longer than this is too slow (25 frames a second)
export const WARM_S = 1.5;    // not counted after a start or a change (the shaders made again)
export const WINDOW_S = 3;    // the frames judged together
export const GAP_MS = 500;    // a longer gap: the page was hidden or busy, so start again

// Watches a game's frames: watch.frame(ms) with each frame drawn (the
// clock's time); returns null, or { from, to, medianMs, frames } when the
// frames of the last WINDOW_S were too slow and it stepped to a lighter
// level (then it warms up again). watch.restart(): warm up again (a new
// scene made). watch.level: the level now.
export function watcher(level = 0, { slowMs = SLOW_MS, warmS = WARM_S, windowS = WINDOW_S, gapMs = GAP_MS } = {}) {
  let lvl = clampLevel(level), start = null, from = null, last = null, gaps = [];
  const restart = () => { start = null; from = null; last = null; gaps = []; };
  return {
    get level() { return lvl; },
    restart,
    frame(t) {
      if (last !== null && t - last > gapMs) restart();
      if (start === null) { start = t; last = t; return null; }
      const gap = t - last;
      last = t;
      if (t - start < warmS * 1000) return null;
      if (from === null) { from = t; return null; }
      gaps.push(gap);
      if (t - from < windowS * 1000) return null;
      const medianMs = median(gaps), frames = gaps.length;
      gaps = []; from = t;
      if (medianMs <= slowMs || lvl >= LEVELS.length - 1) return null;
      const was = lvl;
      lvl++;
      restart();
      return { from: was, to: lvl, medianMs: Math.round(medianMs * 10) / 10, frames };
    },
  };
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const clampLevel = n => (Number.isInteger(n) && n >= 0 ? Math.min(n, LEVELS.length - 1) : 0);

// Kept on the device: { [game]: { level, release } }, one key for both games.
export const KEY = 'web-games-3d-drawing';

// The level kept for `game` (0 if none, unreadable, or kept by another release).
export function keptLevel(raw, game, release) {
  const k = raw && typeof raw === 'object' ? raw[game] : null;
  if (!k || k.release !== release) return 0;
  return clampLevel(k.level);
}
// The value to keep once `game` is at `level`.
export function keepLevel(raw, game, level, release) {
  const out = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  out[game] = { level: clampLevel(level), release };
  return out;
}
