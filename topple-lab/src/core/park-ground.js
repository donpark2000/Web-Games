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
