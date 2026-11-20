// The Topple Lab's park in photos (lab 0.2, journal Q139): the photos its
// code names are in topple-lab/data/park/, the right size, credited, small
// enough and saved for offline; the photo loader is never handed a list's
// index as its folder (the bug that sent levels 2-4's surfaces to "0…").
// A missing or uncredited photo is tried on a copy in a temp folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, cp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB, labFiles } from '../tools/topple-lab.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8').then(s => s.replace(/\r\n/g, '\n'));
const MAX_BYTES = 3 * 1024 * 1024;   // the park's photos all together (about 2.5 MB: the sky 2.2)

// The photos the lab's topple-sets.js names for the park: [file, width, height].
function parkPhotos(src) {
  const dir = src.match(/export const PARK_DIR = '([^']+)';/)?.[1];
  const park = src.match(/export const PARK = \{ sky: '([^']+)', lawn: '([^']+)'/);
  assert.ok(dir && park, 'PARK_DIR and PARK not found in the lab\'s topple-sets.js');
  assert.match(src, /'leaf\.png'\]\.map\(f => loadTex\(f, PARK_DIR\)\)/, 'the leaf no longer loaded as before: update this test');
  const [, sky, lawn] = park;
  return { dir, files: [[sky, 4096, 2048], ...['col', 'nor', 'rough'].map(k => [`${lawn}_${k}.jpg`, 512, 512]), ['leaf.png', 96, 192]] };
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

// What's wrong with the park's photos in the lab at `labRoot`: [] when all's well.
async function problems(labRoot) {
  const out = [];
  const { dir, files } = parkPhotos(await readFile(path.join(labRoot, 'src/ui/topple-sets.js'), 'utf8'));
  const credits = await readFile(path.join(labRoot, dir, 'CREDITS.md'), 'utf8').catch(() => '');
  let bytes = 0;
  for (const [f, w, h] of files) {
    let buf;
    try { buf = await readFile(path.join(labRoot, dir, f)); } catch { out.push(`${f}: missing`); continue; }
    bytes += buf.length;
    const s = imageSize(buf);
    if (s.width !== w || s.height !== h) out.push(`${f}: ${s.width}x${s.height}, not ${w}x${h}`);
    if (!credits.includes(f)) out.push(`${f}: not in ${dir}CREDITS.md`);
  }
  if (bytes > MAX_BYTES) out.push(`${(bytes / 1048576).toFixed(2)} MB in all, over ${MAX_BYTES / 1048576} MB`);
  return { out, checked: files.length, bytes };
}

test("lab park: its photos are there, the right size, credited, under 3 MB in all, and saved for offline", async () => {
  const labRoot = path.join(root, LAB);
  const { out, checked, bytes } = await problems(labRoot);
  assert.deepEqual(out, []);
  assert.equal(checked, 5, 'the sky, the lawn\'s three, the leaf');
  assert.ok(bytes > 1e6, `only ${bytes} bytes checked`);
  const offline = await labFiles(labRoot);
  const { dir, files } = parkPhotos(await read(`${LAB}/src/ui/topple-sets.js`));
  for (const [f] of files) assert.ok(offline.includes(dir + f), `${dir}${f} not saved for offline`);
  assert.ok(!offline.includes(`${dir}CREDITS.md`), 'the credits are notes, not saved');
});

test('lab park: a missing photo, a wrong size and an uncredited photo are each reported', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-park-'));
  try {
    const lab = path.join(tmp, LAB);
    await cp(path.join(root, LAB, 'src/ui/topple-sets.js'), path.join(lab, 'src/ui/topple-sets.js'));
    await cp(path.join(root, LAB, 'data/park'), path.join(lab, 'data/park'), { recursive: true });
    assert.deepEqual((await problems(lab)).out, [], 'the copy as it is');
    await rm(path.join(lab, 'data/park/grass005_nor.jpg'));
    await cp(path.join(root, LAB, 'data/park/grass005_col.jpg'), path.join(lab, 'data/park/leaf.png'));
    const credits = path.join(lab, 'data/park/CREDITS.md');
    await cp(credits, credits + '.bak');
    const { writeFile } = await import('node:fs/promises');
    await writeFile(credits, (await readFile(credits, 'utf8')).replace('`sky_je_gray_park.jpg`', '`(sky)`'));
    assert.deepEqual((await problems(lab)).out.sort(), ['grass005_nor.jpg: missing', 'leaf.png: 512x512, not 96x192', 'sky_je_gray_park.jpg: not in data/park/CREDITS.md'].sort());
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test("lab park: the photo loader is never given a list's index for its folder", async () => {
  // loadTex(file, dir): .map(loadTex) would pass each file's index as dir
  // (it sent level 3's bark to "0knotted_pine_bark_col.jpg", 2026-11-20)
  const src = await read(`${LAB}/src/ui/topple-sets.js`);
  assert.match(src, /function loadTex\(file, dir = PHOTO_DIR\)/);
  assert.doesNotMatch(src, /\.map\(loadTex\)/);
  assert.doesNotMatch('files.map(f => loadTex(f))', /\.map\(loadTex\)/);
  assert.match('files.map(loadTex)', /\.map\(loadTex\)/, 'the check catches the bug as it was');
});

test("lab park: the lab's park photos are its own: the main site's Topple! code never names them", async () => {
  for (const f of ['src/ui/topple-sets.js', 'src/ui/topple-scene.js', 'src/ui/topple.js']) {
    const s = await read(f);
    assert.ok(!/parkPhotos|PARK_DIR|je_gray_park|grass005/.test(s), `${f} (the main site's) names the lab's park`);
  }
  assert.ok((await stat(path.join(root, LAB, 'data/park'))).isDirectory());
  assert.ok((await readdir(path.join(root, 'data/topple'))).every(f => !/grass005|je_gray|leaf\.png/.test(f)), "the lab's photos are in the lab's folder only");
});
