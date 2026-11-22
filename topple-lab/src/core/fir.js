// The Topple Lab's fir trees (2026-11-22, journal "The lab's level 3"): where
// a fir's branches go, round the physics' tiers (its spheres of branches),
// so what is drawn is about what the ball bounces off. No DOM, no three.js.
import { rng } from '../../../src/core/topple.js';

// How far the branches reach at height y: along straight lines between the
// tiers ([{ r, at: [x, y, z] }], lowest first) at `out` times their radius,
// a little less under the lowest, and to a point at the top tier's top.
export function reach(tiers, y, out = 1.15) {
  const first = tiers[0], last = tiers.at(-1), top = last.at[1] + last.r * 1.1;
  if (y <= first.at[1]) return first.r * out * (0.92 + 0.08 * Math.max(0, 1 - (first.at[1] - y) / first.r));
  if (y >= top) return 0;
  for (let i = 1; i < tiers.length; i++) {
    const a = tiers[i - 1], b = tiers[i];
    if (y <= b.at[1]) { const k = (y - a.at[1]) / (b.at[1] - a.at[1]); return out * (a.r + (b.r - a.r) * k); }
  }
  return out * last.r * (top - y) / (top - last.at[1]);
}

// The branches of a fir: [{ at: [x, y, z] (on the trunk), yaw, droop (below
// level, radians), roll, len, shade }], in rows about `gap` apart from a
// little under the lowest tier up to the tip. The same for the same seed.
export function firBranches(tiers, { seed = 1, gap = 0.17, density = 1, out = 1.15 } = {}) {
  const r = rng(seed), first = tiers[0], last = tiers.at(-1), [x, , z] = first.at;
  const low = first.at[1] - first.r * 0.35, top = last.at[1] + last.r * 1.02, list = [];
  const rows = Math.max(4, Math.round((top - low) / gap));
  for (let k = 0; k < rows; k++) {
    const f = k / (rows - 1), y = low + (top - low) * f;
    const R = Math.max(0.05, reach(tiers, y, out));
    const n = Math.max(4, Math.round(density * (5 + 2 * Math.PI * R / 0.34)));
    const turn = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const len = R * (0.78 + 0.3 * r());
      list.push({
        at: [x, y + (r() - 0.5) * gap * 0.7 + R * 0.12, z], yaw: turn + (i + (r() - 0.5) * 0.7) / n * Math.PI * 2,
        droop: (1 - f) * (0.18 + 0.2 * r()) - f * (0.35 + 0.25 * r()), roll: (r() - 0.5) * 1.1, len, shade: 0.78 + 0.22 * r(),
      });
    }
  }
  return list;
}
