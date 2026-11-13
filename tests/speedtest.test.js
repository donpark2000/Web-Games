// The speed test (log.html, Q99): its list of runs, its sums, and the log
// page wired to it, the games' drawing taking its two changes (no
// antialiasing; the three.js parts handed over) without changing the
// games. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNS, GROUPS, CUT_KEYS, checkRuns, frameStats, pixelsFor, summary, WARM_S, MEASURE_S } from '../src/core/speedtest.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');

test('speed test: the runs: each scene first as now, every cut known, about 3 minutes', () => {
  assert.deepEqual(checkRuns(), []);
  assert.equal(RUNS.length, 19);
  assert.deepEqual(GROUPS.map(g => RUNS.filter(r => r.group === g.id).length), [11, 3, 5]);
  // every cut tried by itself somewhere, and in an "all cut" run
  for (const k of CUT_KEYS) {
    assert.ok(RUNS.some(r => Object.keys(r.cut).length === 1 && k in r.cut), `${k}: never tried by itself`);
  }
  for (const g of GROUPS) {
    const mine = RUNS.filter(r => r.group === g.id), all = mine.find(r => r.name === 'all cut');
    assert.ok(all, `${g.id}: no "all cut"`);
    // (a smaller shadow map is moot with the shadows off)
    const moot = k => k === 'shadowSize' && all.cut.shadows === 'off';
    for (const r of mine) for (const k of Object.keys(r.cut)) assert.ok(k in all.cut || moot(k), `${g.id}: "all cut" misses ${k}`);
  }
  // the time: 19 runs of 5 s, plus making each canvas (up to ~5 s on the tablet)
  assert.ok(RUNS.length * (WARM_S + MEASURE_S + 5) <= 200, 'longer than about 3 minutes');
});

test('speed test: a wrong list of runs is reported, each fault by name', () => {
  const runs = [
    { group: 'site', name: 'as now', cut: {} },
    { group: 'site', name: 'odd', cut: { blur: true } },
    { group: 'site', name: 'odd', cut: { pixels: 0 } },
    { group: 'moon', name: 'x', cut: { shadowSize: 1000 } },
    { group: 'park', name: 'no far trees', cut: { farTrees: false } },
  ];
  const got = checkRuns(runs);
  assert.deepEqual(got, [
    'park: doesn\'t start "as now" with nothing cut',
    'stall: no runs',
    'site/odd: unknown cut blur',
    'site/odd: twice',
    'site/odd: pixels can\'t be 0',
    'x: unknown group moon',
    'moon/x: shadowSize can\'t be 1000',
  ]);
});

test('speed test: the frame rate, median and worst frame from the frames\' times', () => {
  const steady = Array.from({ length: 121 }, (_, i) => 1000 + i * 1000 / 30);
  assert.deepEqual(frameStats(steady, [2, 4]), { frames: 121, fps: 30, medianMs: 33.3, worstMs: 33.3, cpuMs: 3 });
  // one hitch: the worst frame shows it, the median doesn't move
  const hitch = [0, 100, 200, 700, 800, 900];
  assert.deepEqual(frameStats(hitch), { frames: 6, fps: 5.6, medianMs: 100, worstMs: 500, cpuMs: null });
  // an even count of gaps: the median between the middle two
  assert.equal(frameStats([0, 100, 300, 600, 1000]).medianMs, 250);
  // too few frames to say
  assert.deepEqual(frameStats([5]), { frames: 1, fps: 0, medianMs: null, worstMs: null, cpuMs: null });
  assert.deepEqual(frameStats([]), { frames: 0, fps: 0, medianMs: null, worstMs: null, cpuMs: null });
});

test('speed test: the pixel ratio a run draws at, and the summary line', () => {
  assert.equal(pixelsFor({}, 1.33), 1.33);
  assert.equal(pixelsFor({}, 3), 2, 'the game draws at 2 at most');
  assert.equal(pixelsFor({}, 0), 1);
  assert.equal(pixelsFor({ pixels: 0.75 }, 3), 0.75);
  const s = summary([
    { group: 'site', name: 'as now', fps: 3.1 }, { group: 'site', name: 'all cut', fps: 14 },
    { group: 'stall', name: 'as now', fps: null, error: 'x' },
  ]);
  assert.deepEqual(s, { 'Topple! building site': { 'as now': 3.1, 'all cut': 14 }, 'Tin Can Alley': { 'as now': null } });
});

test('speed test: the log page has the button, loads the test only when pressed, and keeps each line', async () => {
  const page = await read('log.html'), js = await read('src/ui/logpage.js'), ui = await read('src/ui/speedtest.js');
  assert.match(page, /<button type="button" class="pill" id="speedBtn">Speed test<\/button>/);
  assert.match(js, /await import\('\.\/speedtest\.js'\)/);
  assert.doesNotMatch(js, /^import .*'\.\/speedtest\.js'/m, 'the test (and three.js) loaded with the page');
  assert.doesNotMatch(await read('src/core/speedtest.js'), /^import /m, 'the list the page loads brings in more');
  assert.match(js, /log\.begin\(`speed test, /);
  assert.match(js, /const say = \(msg, data\) => \{ log\.add\('speed', msg, data\); log\.save\(\); \};/);
  assert.match(js, /\$\{RUNS\.length\} ways/);
  // each run's drawing let go of, even when it fails
  assert.match(ui, /finally \{\s*try \{ stage\?\.dispose\(\); \}/);
});

test('speed test: the games keep antialiasing; the drawing hands over its three.js parts', async () => {
  for (const [f, fn] of [['src/ui/topple-scene.js', 'makePark3d'], ['src/ui/tin-can-alley-stall.js', 'makeStall3d']]) {
    const s = await read(f);
    assert.match(s, new RegExp(`export function ${fn}\\(canvas, \\{ antialias = true \\} = \\{\\}\\)`), f);
    assert.match(s, /new THREE\.WebGLRenderer\(\{ canvas, antialias \}\)/, f);
    assert.match(s, /three: \{ renderer, scene, camera, sun \},/, f);
    assert.match(s, /dispose\(\) \{ renderer\.dispose\(\); renderer\.forceContextLoss\(\); \}/, f);
  }
  // the games make their drawing with the canvas alone (antialiasing on)
  assert.match(await read('src/ui/topple.js'), /stage = park3d\.makePark3d\(canvas\);/);
  assert.match(await read('src/ui/tin-can-alley.js'), /stage = stall3d\.makeStall3d\(canvas\);/);
});
