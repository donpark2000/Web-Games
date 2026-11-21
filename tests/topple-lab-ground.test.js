// The Topple Lab's park on its photo's own field (2026-11-21): the photo's
// directions (three.js's equirectangular ones, which the ground's shader
// uses too), where the ground's sphere puts each direction (flat on the
// ground below the horizon, never past its edge), and the photo's sun.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { photoDir, groundPoint } from '../topple-lab/src/core/park-ground.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sets = () => readFile(path.join(root, 'topple-lab/src/ui/topple-sets.js'), 'utf8');
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const deg = r => r * 180 / Math.PI;

test('lab ground: photo points as directions, the way three.js lays out a 360° photo', () => {
  const cases = [
    [[0.5, 0.5], [1, 0, 0], 'the middle: +x'],
    [[0.25, 0.5], [0, 0, -1], 'a quarter across: -z, the way the park looks'],
    [[0.75, 0.5], [0, 0, 1], 'three quarters: +z'],
    [[0.3, 0], [0, 1, 0], 'the top: straight up'],
    [[0.3, 1], [0, -1, 0], 'the bottom: straight down'],
  ];
  for (const [[u, v], want, what] of cases) {
    const d = photoDir(u, v);
    assert.ok(d.every((x, i) => near(x, want[i])), `${what}: got ${d.map(x => x.toFixed(3))}`);
  }
  let n = 0;
  for (let i = 0; i < 20; i++) for (let j = 0; j <= 20; j++, n++) assert.ok(near(Math.hypot(...photoDir(i / 20, j / 20)), 1), `not a unit direction at ${i / 20}, ${j / 20}`);
  assert.equal(n, 420, `${n} points checked, not 420`);
});

test("lab ground: the ground's shader reads the photo the same way (its numbers from the lab's topple-sets.js)", async () => {
  const src = await sets();
  const m = src.match(/vec2 uv = vec2\(atan\(d\.z, d\.x\) \* ([\d.]+) \+ 0\.5, asin\(clamp\(d\.y, -1\.0, 1\.0\)\) \* ([\d.]+) \+ 0\.5\);/);
  assert.ok(m, "the ground's shader no longer works out uv as before: update this test");
  const [ku, kv] = [Number(m[1]), Number(m[2])];
  // the shader's (u, v up) back from each direction: v up is 1 - v down
  let n = 0;
  for (let u = 0.01; u < 1; u += 0.07) for (let v = 0.02; v < 1; v += 0.07, n++) {
    const [x, y, z] = photoDir(u, v);
    const su = Math.atan2(z, x) * ku + 0.5, sv = Math.asin(y) * kv + 0.5;
    assert.ok(near(su, u, 1e-5) && near(sv, 1 - v, 1e-5), `at ${u.toFixed(2)}, ${v.toFixed(2)} the shader reads ${su.toFixed(4)}, ${(1 - sv).toFixed(4)}`);
  }
  assert.ok(n > 150, `only ${n} points checked`);
});

test('lab ground: below the horizon flat on the ground, never past its edge; the horizon and sky at the edge', () => {
  const h = 1.7, R = 120;
  // straight down: under the camera; 30° down: h / tan 30° away
  assert.deepEqual(groundPoint([0, -1, 0], h, R).map(v => +v.toFixed(9)), [0, -h, 0]);
  const a = 30 * Math.PI / 180, p = groundPoint([Math.cos(a), -Math.sin(a), 0], h, R);
  assert.ok(near(p[1], -h) && near(p[0], h / Math.tan(a)), `30° down: ${p}`);
  // just under the horizon, at it, and above: R away (not infinitely far)
  for (const y of [-1e-9, -0.001, 0, -0, 0.3, 1]) {
    const d = [Math.sqrt(1 - y * y), y, 0], q = groundPoint(d, h, R);
    assert.ok(near(Math.hypot(...q), R, 1e-6), `y ${y}: ${Math.hypot(...q)} m away, not ${R}`);
  }
  // a sweep: nothing below the ground, nothing past R
  let n = 0;
  for (let el = -90; el <= 90; el += 1.5) for (let az = 0; az < 360; az += 15, n++) {
    const e = el * Math.PI / 180, z = az * Math.PI / 180;
    const q = groundPoint([Math.cos(e) * Math.cos(z), Math.sin(e), Math.cos(e) * Math.sin(z)], h, R);
    assert.ok(q[1] >= -h - 1e-9, `below the ground at ${el}°, ${az}°: ${q[1]}`);
    assert.ok(Math.hypot(...q) <= R + 1e-9, `past the edge at ${el}°, ${az}°`);
    if (el < 0 && h / Math.sin(-e) < R) assert.ok(near(q[1], -h), `not on the ground at ${el}°`);
  }
  assert.ok(n > 2500, `only ${n} directions checked`);
});

test("lab ground: the photo's sun, as measured (to the right and behind the park's camera, 17.5° up)", async () => {
  const m = (await sets()).match(/sunAt: \[([\d.]+), ([\d.]+)\]/);
  assert.ok(m, 'PARK.sunAt not found in the lab\'s topple-sets.js');
  const [x, y, z] = photoDir(Number(m[1]), Number(m[2]));
  assert.ok(near(deg(Math.asin(y)), 17.46, 0.05), `up ${deg(Math.asin(y)).toFixed(2)}°`);
  assert.ok(near(deg(Math.atan2(z, x)), 36, 0.05), `round ${deg(Math.atan2(z, x)).toFixed(2)}°`);
  assert.ok(x > 0 && z > 0, 'not to the right and behind (the camera looks to -z)');
});
