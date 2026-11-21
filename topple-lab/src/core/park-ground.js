// The Topple Lab's park on its photo's own field (2026-11-21, journal
// "Lab 0.2's park judged"): the arithmetic, kept apart from the drawing so
// it can be tested. No DOM, no three.js.
//
// Directions follow three.js's equirectangular photos: a point u across
// (0-1, left to right) and v down (0-1, top to bottom) of the photo is the
// direction atan2(z, x) = (u - 0.5) * 2π round, (0.5 - v) * π up; so the
// photo's middle (u 0.5) is +x and a quarter across (u 0.25) is -z, the way
// the park's camera looks.

// A point of the photo (u across, v down) as a unit direction [x, y, z].
export function photoDir(u, v) {
  const az = (u - 0.5) * 2 * Math.PI, el = (0.5 - v) * Math.PI;
  return [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
}

// Where the ground's sphere puts a unit direction [x, y, z] (from the
// photo's camera, h m over the ground): below the horizon, on the ground
// (y = -h), as far as R m; at or above it, R m away (the sky, and a wall of
// the photo's far field low down).
export function groundPoint([x, y, z], h, R) {
  const t = y < 0 ? Math.min(R, h / -y) : R;
  return [x * t, y * t, z * t];
}

// The bush's leaves (the lab's bush looks, 2026-11-21): the layers leafy()
// puts leaves in, each [from, spread, shade, size]: leaves from..from+spread
// of a ball's radius out, darkened by shade, counted as for a sphere size
// times the ball. Lab 0.3's bush: one layer, [0.93, 0.14, 0, 1]. ragged
// (0-1) spreads the outer layer further in and out; inner adds a shaded
// layer inside it, so a gap shows leaves, not the core.
export function leafLayers({ ragged = 0, inner = false } = {}) {
  return [[0.93 - 0.12 * ragged, 0.14 + 0.3 * ragged, 0, 1], ...(inner ? [[0.74, 0.12, 0.35, 0.8]] : [])];
}

// Lumps over a bush's outline: a function of a unit direction giving how far
// in or out (a fraction of a ball's radius, at most amp), from 5 waves
// across the directions drawn from rand. amp 0: always 0, and rand is not
// used at all (so the leaves land as they did without lumps).
export function lumps(rand, amp) {
  if (!amp) return () => 0;
  const waves = Array.from({ length: 5 }, () => {
    const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    return [s * Math.cos(a), u, s * Math.sin(a), 2 + 3 * rand(), rand() * 6.3];
  });
  return d => waves.reduce((t, [x, y, z, f, ph]) => t + Math.sin(f * (d[0] * x + d[1] * y + d[2] * z) + ph), 0) / waves.length * amp;
}
