// The Topple Lab's moon in photos (2026-11-22): its pictures are in
// data/moon/, a fit size, credited and saved for offline, and no others are
// there; the ground is flat wherever anything stands or falls; a material's
// copy keeps its shader (each block has its own copy); the light drawing
// leaves nothing all metal; the page waits for the photos and watches the
// moon's frames.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LAB, labFiles } from '../tools/topple-lab.js';
import { groundHeight } from '../topple-lab/src/core/moon-ground.js';
import { moonScene, TURN_PAST } from '../src/core/topple-moon.js';
import { sharedDrawing } from '../topple-lab/src/core/shared-drawing.js';
import { drawWatch } from '../src/ui/drawwatch.js';
import { LEVELS } from '../src/core/drawing.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8').then(s => s.replace(/\r\n/g, '\n'));
const DIR = 'data/moon';

async function named(labRoot) {
  const src = (await readFile(path.join(labRoot, 'src/ui/topple-moon-photos.js'), 'utf8')).replace(/\r\n/g, '\n');
  const body = src.match(/const FILES = \{(.*)\};/)?.[1];
  assert.ok(body, 'FILES not found in topple-moon-photos.js');
  assert.match(src, new RegExp(`export const MOON_DIR = '${DIR}/';`));
  return [...body.matchAll(/\['([\w.]+)'/g)].map(m => m[1]);
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
      if (f === 'earth.jpg' ? w !== 1024 || h !== 512 : w !== h || ![256, 512, 1024].includes(w)) out.push(`${f}: ${w}x${h}`);
    } catch (e) { out.push(`${f}: ${e.code === 'ENOENT' ? 'missing' : e.message}`); }
  }
  for (const f of await readdir(path.join(labRoot, DIR))) if (f !== 'CREDITS.md' && !files.includes(f)) out.push(`${f}: named by nothing`);
  return { out, checked: files.length };
}

test('lab moon: its pictures are there, a fit size, credited and saved for offline; no others', async () => {
  const labRoot = path.join(root, LAB), { out, checked } = await problems(labRoot);
  assert.deepEqual(out, []);
  assert.equal(checked, 8, `${checked} pictures checked`);
  const saved = await labFiles(labRoot);
  for (const f of await named(labRoot)) assert.ok(saved.includes(`${DIR}/${f}`), `${f} not saved for offline`);
  // the rock's photo is levels 3 and 5's, there too
  for (const f of ['rock_boulder_dry_col.jpg', 'rock_boulder_dry_nor.jpg']) assert.ok(saved.includes(`data/levels/${f}`), `${f} not saved for offline`);
});

test('lab moon: a missing picture, an uncredited one and a stray one are each reported', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-moon-'));
  try {
    const copy = path.join(tmp, LAB);
    await cp(path.join(root, LAB), copy, { recursive: true });
    assert.deepEqual((await problems(copy)).out, []);
    await rm(path.join(copy, DIR, 'craters.jpg'));
    await writeFile(path.join(copy, DIR, 'extra.jpg'), 'x');
    const credits = path.join(copy, DIR, 'CREDITS.md');
    await writeFile(credits, (await readFile(credits, 'utf8')).replace('`earth.jpg`', '`(the earth)`'));
    assert.deepEqual((await problems(copy)).out.sort(), ['craters.jpg: missing', 'earth.jpg: not credited', 'extra.jpg: named by nothing'].sort());
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('lab moon: the ground is flat wherever anything stands, falls or flies over; hills only beyond, not too high', () => {
  let flat = 0;
  for (const level of [6, 7, 9, 10]) {
    const from = level === 7 ? 46 : 22;
    for (let scene = 1; scene <= 5; scene++) for (let seed = 1; seed <= 4; seed++) {
      const s = moonScene(seed * 9173, level, scene);
      const xs = [s.span[0] - TURN_PAST - 1, s.span[1] + TURN_PAST + 1, ...s.blocks.map(b => b.x)];
      for (const x of xs) for (const z of [-9, -4, 0, 3]) { assert.equal(groundHeight(x, z, from), 0, `level ${level}: ${x.toFixed(1)}, ${z}`); flat++; }
    }
    // the base behind: as far as it stands (its things at x -12 to 12.5, z to -22)
    for (let x = -12.5; x <= 12.5; x += 0.5) for (let z = -22; z <= 0; z += 0.5, flat++) if (Math.hypot(x, z + 8) < from) assert.equal(groundHeight(x, z, from), 0);
  }
  assert.ok(flat > 4000, `only ${flat} places checked`);
  // Solar Farm's rows to z -46, x -44 to 44: flat where its panels stand nearest
  for (let x = -20; x <= 20; x += 2) for (let z = -46; z <= -9; z += 2) if (Math.hypot(x, z + 8) <= 46) assert.equal(groundHeight(x, z, 46), 0);
  let most = -9, least = 9;
  for (let x = -95; x <= 95; x += 1) for (let z = -120; z <= 20; z += 1) { const h = groundHeight(x, z, 22); most = Math.max(most, h); least = Math.min(least, h); }
  assert.ok(most > 3 && most < 9, `the highest hill ${most.toFixed(1)} m`);
  assert.ok(least >= -0.4, `a hollow ${least.toFixed(1)} m deep`);
  assert.equal(groundHeight(60, -60, 0), 0, 'from 0: no hills');
});

// The lab's drawing code imported for a check: its imports of the main site's
// three.js (through the page's import map) pointed at the file.
async function labModule(file, tmp) {
  const src = (await read(`${LAB}/${file}`)).replace(/'\.\.\/vendor\/three\/three\.module\.min\.js'/g, `'${pathToFileURL(path.join(root, 'src/vendor/three/three.module.min.js'))}'`)
    .replace(/'\.\.\/core\/model-data\.js'/g, `'${pathToFileURL(path.join(root, LAB, 'src/core/model-data.js'))}'`);
  const to = path.join(tmp, path.basename(file).replace('.js', '.mjs'));
  await writeFile(to, src);
  return import(pathToFileURL(to));
}

test("lab moon: a material's copy keeps its shader; three.js's own copy doesn't (each block has a copy)", async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-tri-'));
  try {
    const THREE = await import(pathToFileURL(path.join(root, 'src/vendor/three/three.module.min.js')));
    const { triplanar, copyMaterial, smooth } = await labModule('src/ui/topple-tri.js', tmp);
    const m = triplanar(new THREE.Texture(), new THREE.Texture(), 2, { color: '#ff0000' }), c = copyMaterial(m);
    assert.equal(c.onBeforeCompile, m.onBeforeCompile);
    assert.equal(c.tri, m.tri);
    assert.notEqual(c, m);
    assert.equal(c.color.getHex(), 0xff0000);
    assert.notEqual(m.clone().onBeforeCompile, m.onBeforeCompile, "three.js now keeps it: copyMaterial isn't needed");
    assert.ok(!('tri' in m.userData), 'the pictures would be copied through JSON');
    const plain = new THREE.MeshStandardMaterial();
    assert.equal(copyMaterial(plain).type, plain.type);
    // the shader's changes land on three.js's own shader (every marker found)
    const s = { uniforms: {}, vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader };
    m.onBeforeCompile(s);
    for (const w of ['vTriP = position', 'triMap, triP.zy', 'vTriM * d']) assert.ok((s.vertexShader + s.fragmentShader).includes(w), `${w} not in the shader`);
    // smooth: corners in the same place share a normal
    const g = smooth(new THREE.IcosahedronGeometry(1, 2)), p = g.attributes.position, n = g.attributes.normal, seen = new Map();
    for (let i = 0; i < p.count; i++) { const k = [p.getX(i), p.getY(i), p.getZ(i)].map(v => v.toFixed(3)).join(), v = [n.getX(i), n.getY(i), n.getZ(i)].map(x => x.toFixed(4)).join(); if (seen.has(k)) assert.equal(v, seen.get(k)); else seen.set(k, v); }
    assert.ok(seen.size < p.count / 3, `${seen.size} places of ${p.count} corners`);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

test('lab: in the light drawing nothing is left all metal with nothing to reflect (near black); what still has its map or a sky is left', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lab-metal-'));
  try {
    const THREE = await import(pathToFileURL(path.join(root, 'src/vendor/three/three.module.min.js')));
    const { plainMetal } = await labModule('src/ui/topple-models.js', tmp);
    const scene = new THREE.Scene(), mk = o => { const m = new THREE.MeshStandardMaterial(o); scene.add(new THREE.Mesh(new THREE.BoxGeometry(), m)); return m; };
    const bare = mk({ metalness: 1 }), mapped = mk({ metalness: 1, metalnessMap: new THREE.Texture() }), shiny = mk({ metalness: 1, envMap: new THREE.Texture() }), paint = mk({ metalness: 0.2 });
    assert.equal(plainMetal(scene), 1);
    assert.deepEqual([bare, mapped, shiny, paint].map(m => m.metalness), [0.2, 1, 1, 0.2]);
    assert.equal(plainMetal(null), 0);
    // called wherever the cuts are made, in both worlds' drawings
    const scene3d = await read(`${LAB}/src/ui/topple-scene.js`), moon = await read(`${LAB}/src/ui/topple-moon.js`);
    assert.equal(scene3d.match(/plainMetal\(scene\)/g)?.length, 3);
    assert.match(moon, /if \(cuts\.surfaces === 'plain'\) plainMetal\(S\);/);
  } finally { await rm(tmp, { recursive: true, force: true }); }
});

// Frames `ms` apart to a watch for `secs`, from time t; returns the time after.
function frames(w, t, secs, ms) { for (const end = t + secs * 1000; t < end; t += ms) w.frame(t); return t; }
const fakeDrawing = () => ({ got: [], setDrawing(c) { this.got.push(c); return c.shadows ? ['shadows'] : []; } });

test('lab: the lighter drawing a device needs is for both worlds: shown by either, kept for a world drawn later (Q142)', () => {
  // the park slow: the park drawn lighter, and the moon from its start
  let park = fakeDrawing(), moon = null;
  const said = [], all = sharedDrawing(() => [park, moon]);
  let w = drawWatch('topple', all, (m, d) => said.push([m, d]));
  assert.deepEqual(park.got, [{}], 'as drawn at first');
  let t = frames(w, 0, 6, 100);
  assert.equal(w.level, LEVELS[1].name);
  assert.deepEqual(park.got.at(-1), LEVELS[1].cuts);
  moon = fakeDrawing();
  all.catchUp(moon);
  assert.deepEqual(moon.got, [LEVELS[1].cuts], 'the moon starts as light as the park');
  // still too slow, on the moon: both go to the lightest, and it's said once with what changed
  w.restart();
  t = frames(w, t + 5000, 6, 100);
  assert.equal(w.level, LEVELS[2].name);
  assert.deepEqual([park.got.at(-1), moon.got.at(-1)], [LEVELS[2].cuts, LEVELS[2].cuts]);
  assert.deepEqual(said.filter(([m]) => m === 'drawing lighter').map(([, d]) => [d.from, d.to, d.cut]), [['as drawn', 'light', ['shadows']], ['light', 'lightest', ['shadows']]]);
  // the moon slow first (the park not): the park is drawn lighter too
  park = fakeDrawing(); moon = fakeDrawing();
  const both = sharedDrawing(() => [park, moon]);
  w = drawWatch('topple', both, () => {});
  frames(w, 0, 6, 80);
  assert.deepEqual([park.got.at(-1), moon.got.at(-1)], [LEVELS[1].cuts, LEVELS[1].cuts]);
  // a device that keeps up: never changed
  park = fakeDrawing(); moon = fakeDrawing();
  w = drawWatch('topple', sharedDrawing(() => [park, moon]), () => {});
  frames(w, 0, 20, 17);
  assert.equal(w.level, LEVELS[0].name);
  assert.deepEqual([park.got, moon.got], [[{}], [{}]]);
});

test('lab moon: the page waits for the photos, logs them, and watches its frames (drawn lighter on a slow device); drawn plain without them', async () => {
  const js = await read(`${LAB}/src/ui/topple.js`), moon = await read(`${LAB}/src/ui/topple-moon.js`);
  assert.match(js, /const got = await moon3d\.photos\(\);\n  if \(got\) L\('moon photos', got\);\n  const look/);
  // one watch for both worlds (Q142)
  assert.match(js, /allDrawings = sharedDrawing\(\(\) => \[stage, moon3d\]\);\n  drawing = drawWatch\('topple', allDrawings, /);
  assert.equal(js.match(/drawWatch\(/g)?.length, 1, 'one watch');
  assert.match(js, /moon3d\.render\(\);\n  drawing\?\.frame\(performance\.now\(\)\);/);
  assert.equal(js.match(/drawing\?\.restart\(\);/g)?.length, 2, 'a park scene and a moon scene each warm up again');
  assert.match(js, /allDrawings\.catchUp\(moon3d\)/, 'the moon, made later, at the level so far');
  assert.match(moon, /\}, e => \(\{ error: String\(e\.message \?\? e\) \}\)\);/, 'a photo that cannot load is no error to the game');
  assert.match(moon, /setDrawing\(c\) \{ cuts = \{ \.\.\.c \}; return cut\(\); \},/);
  // every block its own copy, its shader kept; the physics' shapes (the lit block and the glow) as before
  assert.match(moon, /const mat = copyMaterial\(mat0\);   \/\/ its own/);
  assert.match(moon, /m\.add\(over\); m\.userData\.glow = over;/);
});
