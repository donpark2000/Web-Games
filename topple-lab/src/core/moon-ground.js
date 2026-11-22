// The Topple Lab's moon (2026-11-22): how high the ground is, kept apart
// from the drawing so it can be tested. Flat (0) wherever anything stands or
// falls; hills past `from` m from the middle of what's in play (0, 0, -8),
// up to about 7 m, far off. No DOM, no three.js.

export const MIDDLE = [0, -8];

// Smooth noise, the same everywhere for the same place (about -0.5 to 0.5).
function noise(x, z) {
  const q = a => a * a * (3 - 2 * a), h = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const xi = Math.floor(x), zi = Math.floor(z), fx = q(x - xi), fz = q(z - zi);
  const a = h(xi, zi), b = h(xi + 1, zi), c = h(xi, zi + 1), d = h(xi + 1, zi + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz - 0.5;
}

export function groundHeight(x, z, from) {
  if (!from) return 0;
  const dist = Math.hypot(x - MIDDLE[0], z - MIDDLE[1]);
  if (dist <= from) return 0;
  const k = Math.min(1, (dist - from) / 30), ramp = k * k * (3 - 2 * k);
  let v = 0, amp = 1, f = 0.045;
  for (let o = 0; o < 4; o++) { v += amp * noise(x * f + o * 9.7, z * f + o * 4.3); amp *= 0.48; f *= 2.1; }
  return ramp * Math.max(-0.4, 2.6 + 6.5 * v);
}
