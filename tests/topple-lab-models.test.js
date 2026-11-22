// The Topple Lab's photographed models and level photos (2026-11-22): every
// model its code names is there and adds up, its pictures too, all credited,
// small enough and saved for offline; a broken, missing or uncredited one is
// reported (tried on a copy in a temp folder). The photo ground's few
// triangles: flat out to its edge, a wall and the sky beyond.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, cp, rm, stat, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB, labFiles } from '../tools/topple-lab.js';
import { decodeModel } from '../topple-lab/src/core/model-data.js';
import { groundRings, groundPoint } from '../topple-lab/src/core/park-ground.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TRIS = 1500;                       // a model's triangles
const MAX_BYTES = 12 * 1024 * 1024;          // all the lab's own photos and models together

const read = f => readFile(f, 'utf8').then(s => s.replace(/\r\n/g, '\n'));
// The models the lab's topple-models.js names: { name: file }.
async function models(labRoot) {
  const src = await read(path.join(labRoot, 'src/ui/topple-models.js'));
  const body = src.match(/export const MODELS = \{\n([\s\S]*?)\n\};/)?.[1];
  assert.ok(body, 'MODELS not found in topple-models.js');
  return Object.fromEntries([...body.matchAll(/^\s+(\w+): '(\w+)',$/gm)].map(m => [m[1], m[2]]));
}
// A JPEG's or PNG's width and height, from its header.
function imageSize(buf) {
  if (buf.readUInt32BE(0) === 0x89504E47) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) throw new Error('not a JPEG or PNG');
  for (let i = 2; i < buf.length;) {
    if (buf[i] !== 0xFF) throw new Error(`a JPEG with a broken marker at ${i}`);
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  throw new Error('a JPEG with no size');
}
const pow2 = v => v >= 64 && v <= 1024 && Number.isInteger(Math.log2(v));

// What's wrong with the lab's models at `labRoot`: [] when all's well.
async function problems(labRoot) {
  const out = [], dir = path.join(labRoot, 'data/models');
  const credits = await readFile(path.join(dir, 'CREDITS.md'), 'utf8').catch(() => '');
  let checked = 0, bytes = 0;
  for (const [name, file] of Object.entries(await models(labRoot))) {
    checked++;
    if (!credits.includes(`\`${file}`)) out.push(`${file}: not in data/models/CREDITS.md`);
    try {
      const d = decodeModel(JSON.parse(await readFile(path.join(dir, `${file}.json`), 'utf8')));
      const tris = d.index.length / 3;
      if (tris > MAX_TRIS) out.push(`${name}: ${tris} triangles, over ${MAX_TRIS}`);
      for (let k = 0; k < d.position.length; k += 3) if (!(d.position[k + 1] > -1e-6 && d.position[k + 1] <= d.size[1] + 1e-6 && Math.abs(d.position[k]) <= d.size[0] / 2 + 1e-6)) { out.push(`${name}: a corner outside its size`); break; }
    } catch (e) { out.push(`${file}.json: ${e.code === 'ENOENT' ? 'missing' : e.message}`); }
    for (const k of ['col', 'nor', 'arm']) {
      try {
        const buf = await readFile(path.join(dir, `${file}_${k}.jpg`)), s = imageSize(buf);
        bytes += buf.length;
        if (!pow2(s.width) || !pow2(s.height)) out.push(`${file}_${k}.jpg: ${s.width}x${s.height}, not powers of two from 64 to 1024`);
      } catch (e) { out.push(`${file}_${k}.jpg: ${e.code === 'ENOENT' ? 'missing' : e.message}`); }
    }
  }
  return { out, checked, bytes };
}

test('lab models: each is there, adds up, its pictures too, credited, small enough and saved for offline', async () => {
  const labRoot = path.join(root, LAB);
  const { out, checked, bytes } = await problems(labRoot);
  assert.deepEqual(out, []);
  assert.ok(checked >= 3 && bytes > 100000, `only ${checked} models, ${bytes} bytes checked`);
  const files = await labFiles(labRoot);
  const saved = files.filter(f => f.startsWith('data/models/'));
  for (const file of Object.values(await models(labRoot))) for (const end of ['.json', '_col.jpg', '_nor.jpg', '_arm.jpg']) assert.ok(saved.includes(`data/models/${file}${end}`), `${file}${end} not saved for offline`);
  // nothing in the folder that no code names
  const named = new Set(Object.values(await models(labRoot)).flatMap(f => ['.json', '_col.jpg', '_nor.jpg', '_arm.jpg'].map(e => f + e)));
  for (const f of await readdir(path.join(labRoot, 'data/models'))) assert.ok(f === 'CREDITS.md' || named.has(f), `data/models/${f}: named by no model`);
});

test("lab photos: all the lab's own photos and models together under 12 MB", async () => {
  const labRoot = path.join(root, LAB);
  let bytes = 0, n = 0;
  for (const f of (await labFiles(labRoot)).filter(f => f.startsWith('data/'))) { bytes += (await stat(path.join(labRoot, f))).size; n++; }
  assert.ok(n > 10, `only ${n} files found`);
  assert.ok(bytes < MAX_BYTES, `${(bytes / 1048576).toFixed(2)} MB in ${n} files`);
});

test('lab models: a missing picture, a model that does not add up, and an uncredited one are each reported', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-models-'));
  try {
    const copy = path.join(tmp, LAB);
    await cp(path.join(root, LAB), copy, { recursive: true });
    assert.deepEqual((await problems(copy)).out, []);
    const dir = path.join(copy, 'data/models'), [first, second, third] = Object.values(await models(copy));
    await rm(path.join(dir, `${first}_nor.jpg`));
    const J = JSON.parse(await readFile(path.join(dir, `${second}.json`), 'utf8'));
    await writeFile(path.join(dir, `${second}.json`), JSON.stringify({ ...J, tris: J.tris + 1 }));
    const credits = await readFile(path.join(dir, 'CREDITS.md'), 'utf8');
    await writeFile(path.join(dir, 'CREDITS.md'), credits.replaceAll(third, 'something'));
    const { out } = await problems(copy);
    assert.equal(out.length, 3, out.join('; '));
    for (const w of [`${first}_nor.jpg: missing`, `not ${J.tris + 1} triangles`, `${third}: not in data/models/CREDITS.md`]) assert.ok(out.some(o => o.includes(w)), `${w}: not reported in ${out.join('; ')}`);
    // a triangle pointing at a corner that isn't there
    const i = new Uint16Array(Buffer.from(J.i, 'base64').buffer.slice(0)); void i;
    const bad = Buffer.from(J.i, 'base64'); bad.writeUInt16LE(65535, 0);
    assert.throws(() => decodeModel({ ...J, i: bad.toString('base64') }), /corner 65535/);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('lab models: read back as made: metres, its foot on the ground, its middle over 0, v turned up', () => {
  // one triangle: corners at min, max and half way
  const b64 = a => Buffer.from(a.buffer).toString('base64');
  const J = { asset: 'x', size: [2, 4, 6], verts: 3, tris: 1, uv: [0, 0.2, 1, 0.8],
    p: b64(new Int16Array([-32768, -32768, -32768, 32767, 32767, 32767, 0, 0, 0])), n: b64(new Int8Array([127, 0, 0, 0, 127, 0, 0, 0, -127])), u: b64(new Uint16Array([0, 0, 65535, 65535, 0, 65535])), i: b64(new Uint16Array([0, 1, 2])) };
  const d = decodeModel(J);
  const r = a => [...a].map(v => Math.round(v * 1000) / 1000 || 0);
  assert.deepEqual(r(d.position), [-1, 0, -3, 1, 4, 3, 0, 2, 0]);
  assert.deepEqual(r(d.normal), [1, 0, 0, 0, 1, 0, 0, 0, -1]);
  assert.deepEqual(r(d.uv), [0, 0.8, 1, 0.2, 0, 0.2]);
  assert.deepEqual([...d.index], [0, 1, 2]);
});

test("lab ground: its few rings: straight down to straight up, the ground's edge and the horizon among them", () => {
  for (const [h, R] of [[1.7, 120], [1.2, 60]]) {
    const rings = groundRings(h, R);
    assert.ok(rings.length < 20, `${rings.length} rings`);
    assert.ok(rings.every((v, k) => !k || v > rings[k - 1]), `not rising: ${rings}`);
    assert.ok(Math.abs(rings[0] + Math.PI / 2) < 1e-9 && Math.abs(rings.at(-1) - Math.PI / 2) < 1e-9);
    assert.ok(rings.includes(0), 'no ring at the horizon');
    // every ring up to the edge lies on the ground; none between them, so the ground is flat
    const on = rings.filter(el => Math.abs(groundPoint([Math.cos(el), Math.sin(el), 0], h, R)[1] + h) < 1e-6);
    assert.equal(on.length, 2, 'the ground: its middle and its edge');
    const edge = groundPoint([Math.cos(on[1]), Math.sin(on[1]), 0], h, R);
    assert.ok(Math.abs(Math.hypot(...edge) - R) < 1e-6, `the edge is ${Math.hypot(...edge)} m away, not ${R}`);
  }
});
