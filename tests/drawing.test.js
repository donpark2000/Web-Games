// The 3D games' drawing made lighter on a slow device (src/core/drawing.js,
// src/ui/drawcuts.js, src/ui/drawwatch.js; Q99, release 10.6): the levels,
// the frame watcher (fake clocks: no real time read), the level kept with
// the release, the cuts made to a three.js scene (a stand-in renderer), and
// both games wired to it. Nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../src/vendor/three/three.module.min.js';
import { LEVELS, SLOW_MS, WARM_S, WINDOW_S, GAP_MS, watcher, keptLevel, keepLevel, KEY } from '../src/core/drawing.js';
import { checkRuns, GROUPS } from '../src/core/speedtest.js';
import { applyCuts } from '../src/ui/drawcuts.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');

// Frames every `ms` for `secs` s from t0 into watch; what it returned (the
// steps) and `t`, the next frame's time (not yet given: carry on from it).
function play(watch, ms, secs, t0 = 0) {
  const steps = [];
  let t = t0;
  for (; t <= t0 + secs * 1000; t += ms) { const s = watch.frame(t); if (s) steps.push({ ...s, at: t }); }
  return { steps, t };
}

test('drawing: three levels, each lighter; only cuts the speed test measured; smoothing and the sky kept', () => {
  assert.deepEqual(LEVELS.map(l => l.name), ['as drawn', 'light', 'lightest']);
  assert.deepEqual(LEVELS[0].cuts, {});
  assert.equal(LEVELS[1].cuts.shadows, 'basic', 'light keeps shadows, read once a pixel');
  assert.equal(LEVELS[2].cuts.shadows, 'off');
  const { shadows: s1, ...rest1 } = LEVELS[1].cuts, { shadows: s2, ...rest2 } = LEVELS[2].cuts;
  assert.deepEqual(rest2, rest1, 'lightest is light with no shadows');
  for (const l of LEVELS) {
    assert.ok(!('smooth' in l.cuts) && !('sky' in l.cuts), `${l.name}: cuts what cost nothing measurable`);
    // each cut one the speed test's list knows (so its cost was measured)
    assert.deepEqual(checkRuns([...GROUPS.map(g => ({ group: g.id, name: 'as now', cut: {} })), { group: 'site', name: l.name, cut: l.cuts }]), [], l.name);
  }
});

test('drawing: a slow device steps down a level at a time, after the warm-up, and stops at the lightest', () => {
  const w = watcher();
  // 334 ms frames (the tablet's building site): nothing in the warm-up and first window
  const warm = play(w, 334, WARM_S + WINDOW_S - 0.5);
  assert.deepEqual(warm.steps, [], 'judged too soon');
  const a = play(w, 334, 3, warm.t);
  assert.equal(a.steps.length, 1);
  assert.deepEqual({ from: a.steps[0].from, to: a.steps[0].to, medianMs: a.steps[0].medianMs }, { from: 0, to: 1, medianMs: 334 });
  assert.equal(w.level, 1);
  // still slow: warmed up again, then the next level
  const b = play(w, 100, WARM_S + WINDOW_S + 0.5, a.t);
  assert.deepEqual(b.steps.map(s => [s.from, s.to]), [[1, 2]]);
  // the lightest: never further, however slow
  assert.deepEqual(play(w, 200, 20, b.t).steps, []);
  assert.equal(w.level, 2);
});

test('drawing: a device that keeps up never changes; 30 frames a second is fast enough', () => {
  for (const ms of [16.7, 33.4, SLOW_MS]) {
    const w = watcher();
    assert.deepEqual(play(w, ms, 60).steps, [], `${ms} ms frames stepped down`);
    assert.equal(w.level, 0);
  }
  // one hitch in a steady 60: the median doesn't move
  const w = watcher();
  let t = 0;
  for (let i = 0; i < 600; i++) { t += i === 300 ? 450 : 16.7; assert.equal(w.frame(t), null); }
});

test('drawing: a gap (the page hidden) starts again; a restart warms up again', () => {
  // slow frames broken by a long gap every 2 s: never a whole window, so no step
  const w = watcher();
  let t = 0;
  for (let k = 0; k < 10; k++) { const r = play(w, 100, 2, t); assert.deepEqual(r.steps, []); t = r.t + GAP_MS + 1; }
  // restart: the same
  const w2 = watcher();
  t = 0;
  for (let k = 0; k < 10; k++) { const r = play(w2, 100, WARM_S + 1, t); assert.deepEqual(r.steps, []); t = r.t + 100; w2.restart(); }
  // a level given (kept on the device) starts there; nonsense starts at the top
  assert.equal(watcher(2).level, 2);
  assert.equal(watcher(9).level, 2);
  assert.equal(watcher(-1).level, 0);
  assert.equal(watcher('2').level, 0);
});

test('drawing: the level kept per game with the release; another release measures again', () => {
  assert.equal(KEY, 'web-games-3d-drawing');
  const v = keepLevel(null, 'topple', 2, '10.6');
  assert.deepEqual(v, { topple: { level: 2, release: '10.6' } });
  const both = keepLevel(v, 'tin-can-alley', 1, '10.6');
  assert.deepEqual(both, { topple: { level: 2, release: '10.6' }, 'tin-can-alley': { level: 1, release: '10.6' } });
  assert.equal(keptLevel(both, 'topple', '10.6'), 2);
  assert.equal(keptLevel(both, 'tin-can-alley', '10.6'), 1);
  assert.equal(keptLevel(both, 'topple', '10.7'), 0, 'a new release starts as drawn');
  assert.equal(keptLevel(both, 'five-dice-3d', '10.6'), 0);
  for (const junk of [null, 'x', 5, [], { topple: 'x' }, { topple: { level: 'two', release: '10.6' } }]) assert.equal(keptLevel(junk, 'topple', '10.6'), 0);
  assert.deepEqual(keepLevel([1], 'topple', 1, '10.6'), { topple: { level: 1, release: '10.6' } });
});

// A stand-in renderer (applyCuts uses only these) and a scene like the games'.
function fakeThree() {
  let ratio = 1.33;
  const renderer = { getPixelRatio: () => ratio, setPixelRatio(v) { ratio = v; }, shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap } };
  const scene = new THREE.Scene();
  scene.environment = new THREE.Texture();
  scene.background = new THREE.Texture();
  const photo = new THREE.MeshStandardMaterial({ normalMap: new THREE.Texture(), roughnessMap: new THREE.Texture() });
  const plain = new THREE.MeshStandardMaterial({ color: '#888888' });
  const block = new THREE.Mesh(new THREE.BoxGeometry(), photo), lawn = new THREE.Mesh(new THREE.PlaneGeometry(), plain);
  const far = new THREE.Mesh(new THREE.SphereGeometry(), plain); far.userData.far = true;
  scene.add(block, lawn, far);
  const sun = new THREE.DirectionalLight();
  return { three: { renderer, scene, sun }, photo, plain, far, ratio: () => ratio };
}

test('drawing: the light cuts made to a scene: pixels, Basic shadows (shaders remade), no sky light, plain surfaces, no far trees', () => {
  const f = fakeThree(), v0 = f.plain.version, v1 = f.photo.version;
  const did = applyCuts(f.three, LEVELS[1].cuts);
  assert.deepEqual(did.sort(), ['farTrees', 'pixels', 'reflections', 'shadows', 'surfaces']);
  assert.equal(f.ratio(), 0.75);
  assert.equal(f.three.renderer.shadowMap.enabled, true);
  assert.equal(f.three.renderer.shadowMap.type, THREE.BasicShadowMap);
  assert.ok(f.plain.version > v0, 'a material with no maps not remade for the new shadows');
  assert.equal(f.three.scene.environment, null);
  assert.ok(f.three.scene.background.isTexture, 'the sky kept');
  assert.equal(f.photo.normalMap, null); assert.equal(f.photo.roughnessMap, null);
  assert.ok(f.photo.version > v1);
  assert.equal(f.far.visible, false);
  // again: nothing to do (each scene and setting has them made again)
  assert.deepEqual(applyCuts(f.three, LEVELS[1].cuts), []);
  // a new block added later gets its surfaces cut
  const late = new THREE.MeshStandardMaterial({ metalnessMap: new THREE.Texture() });
  f.three.scene.add(new THREE.Mesh(new THREE.BoxGeometry(), late));
  assert.deepEqual(applyCuts(f.three, LEVELS[1].cuts), ['surfaces']);
  assert.equal(late.metalnessMap, null);
  // then lightest: the shadows off, every shader remade
  const v2 = f.plain.version;
  assert.deepEqual(applyCuts(f.three, LEVELS[2].cuts), ['shadows']);
  assert.equal(f.three.renderer.shadowMap.enabled, false);
  assert.ok(f.plain.version > v2);
});

test('drawing: as drawn changes nothing', () => {
  const f = fakeThree(), v = f.plain.version;
  assert.deepEqual(applyCuts(f.three, LEVELS[0].cuts), []);
  assert.equal(f.ratio(), 1.33);
  assert.equal(f.three.renderer.shadowMap.type, THREE.PCFSoftShadowMap);
  assert.ok(f.three.scene.environment);
  assert.equal(f.plain.version, v);
  assert.equal(f.far.visible, true);
});

test('drawing: both games watch their frames, start again on a scene or round, log the level; the drawings keep the cuts', async () => {
  for (const [f, game, start] of [['src/ui/topple.js', 'topple', 'startScene'], ['src/ui/tin-can-alley.js', 'tin-can-alley', 'startRound']]) {
    const js = await read(f);
    assert.match(js, new RegExp(`drawing = drawWatch\\('${game}', stage, L\\);`), f);
    assert.match(js, /stage\.render\(\);\r?\n  drawing\?\.frame\(performance\.now\(\)\);\r?\n\}/, `${f}: each frame drawn watched`);
    const body = js.slice(js.indexOf(`function ${start}(`), js.indexOf(`function ${start}(`) + 3000);
    assert.match(body, /drawing\?\.restart\(\);/, `${f}: not restarted in ${start}`);
    assert.match(js, /drawing: drawing\?\.level/, `${f}: the level not in the end's log line`);
    assert.match(js, /const dt = Math\.min\(MAX_FRAME_S, /, `${f}: frame not capped at MAX_FRAME_S`);
    assert.doesNotMatch(js, /Math\.min\(0\.05, /, `${f}: the old 0.05 s cap`);
  }
  const scene = await read('src/ui/topple-scene.js');
  assert.match(scene, /setDrawing\(c\) \{ cuts = \{ \.\.\.c \}; return applyCuts\(three, cuts\); \}/);
  assert.equal((scene.match(/applyCuts\(three, cuts\);/g) ?? []).length, 3, 'topple-scene: cuts made again on each scene and setting');
  assert.match(await read('src/ui/tin-can-alley-stall.js'), /setDrawing\(c\) \{ return applyCuts\(\{ renderer, scene, sun \}, c\); \}/);
  const watch = await read('src/ui/drawwatch.js');
  assert.match(watch, /say\('drawing lighter', \{/);
  assert.match(watch, /keepLevel\(read\(\), game, s\.to, RELEASE\)/);
  // the speed test makes its cuts the same way
  assert.match(await read('src/ui/speedtest.js'), /applyCuts\(stage\.three, cut\);/);
});
