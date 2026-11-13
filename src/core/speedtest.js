// The speed test for the 3D games (log.html; Q99, 2026-11-13): Topple! and
// Tin Can Alley drawn still, a few seconds in each of several ways, the
// frame rate of each logged, so a slow device's log says which part of the
// drawing costs it most. On the 2019 Galaxy Tab A (the bar for the 3D
// games) Topple!'s building site drew 3 frames a second and Tin Can Alley
// 8, the physics a few % of each frame. What runs, and the sums; the
// drawing is src/ui/speedtest.js. No DOM or UI code.

export const WARM_S = 1;      // drawn this long before the frames count (s)
export const MEASURE_S = 4;   // the frames counted for this long (s)

// The ways a run can differ from the game as it is (a run's `cut`):
//   pixels       the pixel ratio drawn at (the game: the device's, at most 2)
//   smooth       false: no antialiasing
//   shadows      'hard' (three.js PCF, not PCF soft) or 'off'
//   shadowSize   the sun's shadow map, px a side (Topple! 2048, Tin Can Alley 1024)
//   surfaces     'plain': the photo surfaces' bump, roughness, shade and
//                metal maps taken off (their colour photo kept)
//   reflections  false: no photo sky lighting the shiny parts
//   sky          'plain': one colour for the photo sky
//   farTrees     false: the park's trees far off hidden (level 1)
export const CUT_KEYS = ['pixels', 'smooth', 'shadows', 'shadowSize', 'surfaces', 'reflections', 'sky', 'farTrees'];

// The scenes: the building site the tablet played (the developer's game
// seed, level 2 scene 5: twin towers, 24 blocks), the park's first scene,
// and Pyramid 6.
export const SEED = 822869261;
export const GROUPS = [
  { id: 'site', game: 'topple', title: 'Topple! building site', level: 2, scene: 5 },
  { id: 'park', game: 'topple', title: 'Topple! park', level: 1, scene: 1 },
  { id: 'stall', game: 'tin-can-alley', title: 'Tin Can Alley', layout: '6' },
];

const SITE_ALL = { pixels: 0.75, smooth: false, shadows: 'off', surfaces: 'plain', reflections: false, sky: 'plain' };
export const RUNS = [
  ['site', 'as now', {}],
  ['site', 'pixels 1', { pixels: 1 }],
  ['site', 'pixels 0.75', { pixels: 0.75 }],
  ['site', 'no smoothing', { smooth: false }],
  ['site', 'hard shadows', { shadows: 'hard' }],
  ['site', 'small shadows', { shadowSize: 1024 }],
  ['site', 'no shadows', { shadows: 'off' }],
  ['site', 'plain surfaces', { surfaces: 'plain' }],
  ['site', 'no reflections', { reflections: false }],
  ['site', 'plain sky', { sky: 'plain' }],
  ['site', 'all cut', SITE_ALL],
  ['park', 'as now', {}],
  ['park', 'no far trees', { farTrees: false }],
  ['park', 'all cut', { pixels: 0.75, smooth: false, shadows: 'off', farTrees: false }],
  ['stall', 'as now', {}],
  ['stall', 'pixels 0.75', { pixels: 0.75 }],
  ['stall', 'no smoothing', { smooth: false }],
  ['stall', 'no shadows', { shadows: 'off' }],
  ['stall', 'all cut', { pixels: 0.75, smooth: false, shadows: 'off' }],
].map(([group, name, cut]) => ({ group, name, cut }));

// What's wrong with a list of runs ([] if nothing): an unknown group or
// cut, a group not starting "as now" with nothing cut, a name twice in a
// group, a value a cut can't take.
export function checkRuns(runs = RUNS, groups = GROUPS) {
  const out = [], ids = new Set(groups.map(g => g.id)), seen = new Set();
  const ok = {
    pixels: v => typeof v === 'number' && v > 0 && v <= 3, smooth: v => v === false, shadows: v => v === 'hard' || v === 'off',
    shadowSize: v => Number.isInteger(v) && v >= 256 && (v & (v - 1)) === 0, surfaces: v => v === 'plain', reflections: v => v === false,
    sky: v => v === 'plain', farTrees: v => v === false,
  };
  for (const g of groups) {
    const first = runs.find(r => r.group === g.id);
    if (!first) out.push(`${g.id}: no runs`);
    else if (first.name !== 'as now' || Object.keys(first.cut).length) out.push(`${g.id}: doesn't start "as now" with nothing cut`);
  }
  for (const r of runs) {
    if (!ids.has(r.group)) out.push(`${r.name}: unknown group ${r.group}`);
    const key = `${r.group}/${r.name}`;
    if (seen.has(key)) out.push(`${key}: twice`);
    seen.add(key);
    for (const [k, v] of Object.entries(r.cut)) {
      if (!ok[k]) out.push(`${key}: unknown cut ${k}`);
      else if (!ok[k](v)) out.push(`${key}: ${k} can't be ${JSON.stringify(v)}`);
    }
  }
  return out;
}

// The pixel ratio a run draws at, on a device of pixel ratio dpr.
export const pixelsFor = (cut, dpr) => cut.pixels ?? Math.min(dpr || 1, 2);

// The frames of a run: `times` the frames' timestamps (ms), `cpu` each
// frame's draw call (ms, the part the processor spends; the graphics
// chip's own work shows only in the frame rate). Returns { frames, fps,
// medianMs, worstMs, cpuMs } (fps 0 and nulls with under 2 frames).
export function frameStats(times, cpu = []) {
  const r1 = v => Math.round(v * 10) / 10;
  const gaps = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
  const span = times.length > 1 ? times.at(-1) - times[0] : 0;
  const cpuMs = cpu.length ? r1(cpu.reduce((s, v) => s + v, 0) / cpu.length) : null;
  if (!gaps.length || span <= 0) return { frames: times.length, fps: 0, medianMs: null, worstMs: null, cpuMs };
  const mid = gaps.length >> 1, median = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
  return { frames: times.length, fps: r1(gaps.length / (span / 1000)), medianMs: r1(median), worstMs: r1(gaps.at(-1)), cpuMs };
}

// The log's last line: each group's frame rates by run name, e.g.
// { 'Topple! building site': { 'as now': 3.1, ... } } (null: the run failed).
export function summary(results, groups = GROUPS) {
  const out = {};
  for (const g of groups) {
    const mine = results.filter(r => r.group === g.id);
    if (mine.length) out[g.title] = Object.fromEntries(mine.map(r => [r.name, r.fps ?? null]));
  }
  return out;
}
