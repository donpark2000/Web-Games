// The Topple Lab's levels 2-5 in photos (2026-11-22): the lab's own photos
// its topple-sets.js names are in data/levels/, a fit size, credited and
// saved for offline, and no others are there; the firs' branches keep to
// the physics' tiers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, cp, rm, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB, labFiles } from '../tools/topple-lab.js';
import { reach, firBranches } from '../topple-lab/src/core/fir.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'data/levels';

// The files the lab's topple-sets.js names: surfaces kept in LEVELS_DIR, and
// each level's own sky and ice.
async function named(labRoot) {
  const src = (await readFile(path.join(labRoot, 'src/ui/topple-sets.js'), 'utf8')).replace(/\r\n/g, '\n');
  assert.match(src, new RegExp(`export const LEVELS_DIR = '${DIR}/';`));
  const out = [];
  for (const m of src.matchAll(/^ {2}\w+: \{ asset: '(\w+)', size: [\d.]+, (arm|rough): true, dir: LEVELS_DIR \},$/gm)) out.push(`${m[1]}_col.jpg`, `${m[1]}_nor.jpg`, `${m[1]}_${m[2]}.jpg`);
  for (const m of src.matchAll(/sky: '(\w+)', skyDir: LEVELS_DIR/g)) out.push(`sky_${m[1]}.jpg`);
  for (const m of src.matchAll(/\], ice: '(\w+)',/g)) out.push(`${m[1]}_col.jpg`, `${m[1]}_nor.jpg`);
  return [...new Set(out)];
}
function jpegSize(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) throw new Error('not a JPEG');
  for (let i = 2; i < buf.length;) {
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error('no size');
}
async function problems(labRoot) {
  const out = [], files = await named(labRoot);
  const credits = await readFile(path.join(labRoot, DIR, 'CREDITS.md'), 'utf8').catch(() => '');
  for (const f of files) {
    if (!credits.includes(`\`${f}\``)) out.push(`${f}: not credited`);
    try {
      const [w, h] = jpegSize(await readFile(path.join(labRoot, DIR, f)));
      if (f.startsWith('sky_') ? w !== 4096 || h !== 2048 : w !== h || ![256, 512].includes(w)) out.push(`${f}: ${w}x${h}`);
    } catch (e) { out.push(`${f}: ${e.code === 'ENOENT' ? 'missing' : e.message}`); }
  }
  for (const f of await readdir(path.join(labRoot, DIR))) if (f !== 'CREDITS.md' && !files.includes(f)) out.push(`${f}: named by no level`);
  return { out, checked: files.length };
}

test("lab levels: its photos are there, a fit size, credited and saved for offline; no others", async () => {
  const labRoot = path.join(root, LAB), { out, checked } = await problems(labRoot);
  assert.deepEqual(out, []);
  assert.ok(checked >= 9, `only ${checked} photos checked`);
  const saved = await labFiles(labRoot);
  for (const f of await named(labRoot)) assert.ok(saved.includes(`${DIR}/${f}`), `${f} not saved for offline`);
});

test('lab levels: a missing photo, an uncredited one and a stray one are each reported', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-levels-'));
  try {
    const copy = path.join(tmp, LAB);
    await cp(path.join(root, LAB), copy, { recursive: true });
    assert.deepEqual((await problems(copy)).out, []);
    const [f] = (await named(copy)).filter(x => x.startsWith('sky_'));
    await rename(path.join(copy, DIR, f), path.join(copy, DIR, 'sky_other.jpg'));
    await rm(path.join(copy, DIR, 'CREDITS.md'));
    const { out, checked } = await problems(copy);
    assert.ok(out.includes(`${f}: missing`) && out.includes('sky_other.jpg: named by no level'), out.join('; '));
    assert.equal(out.filter(o => /not credited/.test(o)).length, checked);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

// a pine's tiers as src/core/topple.js deals them (metres)
const TIERS = [{ r: 0.8, at: [1, 1.4, -5] }, { r: 0.62, at: [1, 2.2, -5] }, { r: 0.45, at: [1, 2.9, -5] }, { r: 0.3, at: [1, 3.4, -5] }];

test('lab fir: its branches reach a little past the tiers, narrowing to a point at the top', () => {
  for (const t of TIERS) { const k = reach(TIERS, t.at[1]) / t.r; assert.ok(k > 1 && k < 1.3, `at ${t.at[1]} m: ${k.toFixed(2)} times the tier`); }
  let last = Infinity, n = 0;
  for (let y = TIERS[0].at[1]; y < 4; y += 0.05, n++) { const r = reach(TIERS, y); assert.ok(r <= last + 1e-9, `wider higher up, at ${y.toFixed(2)} m`); last = r; }
  assert.ok(n > 40);
  assert.equal(reach(TIERS, 9), 0);
  assert.ok(reach(TIERS, 0.9) > 0.5, 'under the lowest tier');
});

test('lab fir: the same branches for the same seed, all on the trunk and within reach, a bounded number', () => {
  const a = firBranches(TIERS, { seed: 5 }), b = firBranches(TIERS, { seed: 5 }), c = firBranches(TIERS, { seed: 6 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.ok(a.length > 60 && a.length < 400, `${a.length} branches`);
  for (const q of a) {
    assert.ok(Math.abs(q.at[0] - 1) < 1e-9 && Math.abs(q.at[2] + 5) < 1e-9, 'not on the trunk');
    assert.ok(q.len > 0 && q.len <= 1.15 * 0.8 * 1.1, `a branch ${q.len} m long`);
    assert.ok(q.at[1] > 0.8 && q.at[1] < 4, `a branch at ${q.at[1]} m`);
  }
  assert.ok(firBranches(TIERS, { seed: 5, density: 0.5 }).length < a.length, 'half as dense, fewer');
});
