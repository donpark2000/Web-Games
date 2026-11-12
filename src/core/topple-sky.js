// Star Light's sky: where the moon goes in the view, and the cloud's drift.
// No DOM: the page (src/ui/topple-sets.js sky()) measures the skyline on
// the screen and draws.
//
// Developer, 2026-11-12, on the first build: the moon and the cloud "look
// low in the sky and between the mountains in the back and the trees and
// targets in the foreground" (they were drawn over the sky photo, at a
// fixed place on the screen: over the ridge on a phone), and "the cloud
// moves too fast. It should be about 20% of its current speed". Now the
// photo's land hides them (a depth mask made from its skyline: the page),
// and the moon goes where the view shows the most sky, as high as fits.

// Where a direction (x, y, z, length 1) falls on an equirectangular photo,
// as three.js maps a scene's background: u across (0-1), v up (0 the
// bottom, 1 the top).
export function equirect(x, y, z) {
  return { u: Math.atan2(z, x) / (2 * Math.PI) + 0.5, v: Math.asin(Math.max(-1, Math.min(1, y))) / Math.PI + 0.5 };
}

// The moon's place on the screen (NDC: -1 to 1 across and up). sky: the
// skyline's height on the screen, sampled across it ([{ x, y }], x rising;
// y above 1 when the land fills the view there). r: the moon's radius
// { x, y } (NDC). covers: what's drawn over the view's top (the level's
// name, the hearts: [{ x0, x1, y0 }], their bottom y0), which the moon
// keeps below. Picks the column with the most sky over it, nearest
// `prefer` among near-equals (the first build's place, by the owl); the
// moon sits `gap` over the skyline under it, but no higher than `high`,
// and its top under `top` and the covers. room: the sky there (NDC);
// short of the moon's height, the moon rises from behind the land.
export const MOON = { r: 0.068, prefer: 0.45, high: 0.78, top: 0.95, gap: 0.08, xs: 0.75 };
export function moonSpot(sky, r, { covers = [], prefer = MOON.prefer, high = MOON.high, top = MOON.top, gap = MOON.gap, xs = MOON.xs } = {}) {
  if (!Array.isArray(sky) || sky.length === 0) throw new Error('moonSpot: no skyline');
  // the land's top under the moon's whole width, at x; and the most it can rise to there
  const under = x => Math.max(...sky.filter(p => Math.abs(p.x - x) <= r.x).map(p => p.y), -1);
  const limit = x => Math.min(top, ...covers.filter(c => c.x1 > x - r.x && c.x0 < x + r.x).map(c => c.y0 - 0.02));
  let best = null;
  for (const { x } of sky) {
    if (Math.abs(x) > xs) continue;
    const lim = limit(x), low = under(x), room = lim - low;
    const score = room - 0.15 * Math.abs(x - prefer);
    if (!best || score > best.score) best = { x, lim, low, room, score };
  }
  if (!best) throw new Error('moonSpot: no column inside the view');
  const y = Math.min(best.lim - r.y, Math.max(best.low + gap + r.y, high));
  return { x: best.x, y, room: Math.round(best.room * 1000) / 1000, clear: y - r.y >= best.low };
}

// The cloud: across the view (NDC) at SPEED a second, then a while clear,
// on a loop; a visit starts with it in view on the left, drifting towards
// the moon. 0.0109 a second is a fifth of the first build's (3 across in
// 55 s): about 4 minutes across a phone's view.
export const CLOUD = { speed: 0.2 * 3 / 55, from: -1.6, to: 1.6, clear: 40, start: -0.8 };
export function cloudAt(t, c = CLOUD) {
  const across = (c.to - c.from) / c.speed, loop = across + c.clear;
  const k = ((t + (c.start - c.from) / c.speed) % loop + loop) % loop;
  return k < across ? { x: c.from + k * c.speed, shown: true } : { x: c.to, shown: false };
}
