// Topple!'s settings after the park (DESIGN.md "Topple!" Levels): the
// building site (level 2), Frosty Times (3) and Cactus Canyon (4), drawn
// with three.js in the photo look (developer, 2026-11-11, mockup v7:
// "Photo look"): a 360° photo for the sky and the land beyond the play
// area, photographed surfaces on the blocks, the ground and the things in
// the way (Q76: "Yes, all three"), all CC0 from Poly Haven, kept in
// data/topple/ (sources and licence: data/topple/CREDITS.md). Made by
// src/ui/topple-scene.js, which owns the renderer, the camera, the
// slingshot and the dots; this file gives each level its sky, ground,
// lights, block materials, things, decor and effects (shattering ice,
// bursting barrels). The sizes are world metres (src/core/topple.js's
// sceneParts()).

import * as THREE from '../vendor/three/three.module.min.js';
import { rng } from '../core/topple.js';
import { crossing, perched } from '../core/topple-animals.js';
import { equirect, moonSpot, MOON, cloudAt } from '../core/topple-sky.js';

export const PHOTO_DIR = 'data/topple/';

// Each surface: its files and how many metres one copy covers (Poly
// Haven's sizes). arm: ambient occlusion, roughness and metalness in one
// file; else a roughness file (rough) or none.
export const SURFACES = {
  steel: { asset: 'rusty_metal_02', size: 1.0, arm: true },
  concrete: { asset: 'concrete_floor_worn_001', size: 3.0, arm: true },
  brick: { asset: 'brick_wall_001', size: 3.0, arm: true },
  planks: { asset: 'brown_planks_09', size: 1.0, arm: true },
  pad: { asset: 'gravel_concrete', size: 2.12, rough: true },
  paint: { asset: 'green_metal_rust', size: 1.0, arm: true },
  galv: { asset: 'corrugated_iron_02', size: 2.7, arm: true },
  snow: { asset: 'snow_02', size: 2.0, arm: true },
  bark: { asset: 'knotted_pine_bark', size: 1.7, arm: true },
  sand: { asset: 'sand_01', size: 1.5, arm: true },
  barrel: { asset: 'wooden_barrel', size: 1.29, arm: true },
  timber: { asset: 'weathered_brown_planks', size: 1.8, arm: true },
  rock: { asset: 'cliff_side', size: 1.83, arm: true },
};

// Each level: its sky photo, ground, which surface each block material
// wears, the sun (from the structure, × SCALE as level 1's), and what else
// is drawn. fog: the haze far off, the colour of the photo's horizon.
export const SETTINGS = {
  2: { name: 'site', sky: 'construction_yard', ground: 'pad', surfaces: ['steel', 'concrete', 'brick', 'planks', 'pad', 'paint', 'galv'],
    mats: { steel: 'steel', concrete: 'concrete', brick: 'brick', wood: 'planks' }, sling: 'planks', sun: [1.4, 4.2, 2.6], hemi: 0.7 },
  3: { name: 'snow', sky: 'lago_disola', ground: 'snow', surfaces: ['snow', 'bark', 'planks', 'steel', 'concrete'],
    mats: { ice: 'ice', wood: 'planks' }, sling: 'planks', sun: [-1.2, 4.2, 2.6], hemi: 0.8 },
  4: { name: 'desert', sky: 'goegap', ground: 'sand', surfaces: ['sand', 'barrel', 'timber', 'rock', 'planks', 'steel'],
    mats: { wood: 'timber', barrel: 'barrel' }, sling: 'planks', sun: [1.6, 4.4, 2.4], hemi: 0.75 },
  // Star Light (developer, 2026-11-12, Q87: "Night time with a moon and
  // stars in the sky. Similar vista to the winter level but low light"):
  // level 3's photo at night (its sky swapped for stars, its land moonlit:
  // nightSky()), the moon for the sun; `lights` the scene's own at night.
  5: { name: 'night', sky: 'lago_disola', night: true, ground: 'snow', surfaces: ['snow', 'bark', 'planks', 'steel', 'concrete'],
    mats: { glow: 'glow' }, sling: 'planks', sun: [1.8, 4.4, 1.6], hemi: 0.45,
    lights: { hemi: ['#7C90C8', '#1C2236'], sun: ['#B8C8FF', 0.55], fill: ['#8496D8', 0.12] } },
};

const loader = new THREE.TextureLoader();
const images = new Map();   // file -> Promise<Texture> (the one image each)
function loadTex(file) {
  if (!images.has(file)) images.set(file, new Promise((ok, fail) => loader.load(PHOTO_DIR + file, ok, undefined, () => fail(new Error(`${file} not loaded`)))));
  return images.get(file);
}
// A copy of a loaded texture: colour (sRGB) or data, on uv `channel`, repeated.
function variant(t, { colour = false, channel = 0, repeat = null } = {}) {
  const v = t.clone();
  v.wrapS = v.wrapT = THREE.RepeatWrapping; v.anisotropy = 8; v.channel = channel;
  v.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) v.repeat.set(...repeat);
  v.needsUpdate = true;
  return v;
}
// The three maps of a surface, loaded: { col, nor, arm|rough }.
async function loadSurface(key) {
  const s = SURFACES[key], a = s.asset;
  const files = [`${a}_col.jpg`, `${a}_nor.jpg`, ...(s.arm ? [`${a}_arm.jpg`] : s.rough ? [`${a}_rough.jpg`] : [])];
  const [col, nor, third] = await Promise.all(files.map(loadTex));
  return { col, nor, arm: s.arm ? third : null, rough: s.rough ? third : null };
}
// A material in a surface's photos: on uv `channel` (1: the blocks' metres,
// worldUV), repeated; `extra` for colour tints and the like.
function photoMat(maps, { channel = 0, repeat = null, extra = {} } = {}) {
  const o = { channel, repeat };
  const m = new THREE.MeshStandardMaterial({
    map: variant(maps.col, { ...o, colour: true }), normalMap: variant(maps.nor, o), roughness: 1, ...extra,
  });
  if (maps.arm) { const t = variant(maps.arm, o); m.roughnessMap = t; m.aoMap = t; m.aoMapIntensity = 0.8; m.metalnessMap = t; m.metalness = extra.metalness ?? 1; }
  else if (maps.rough) m.roughnessMap = variant(maps.rough, o);
  return m;
}
// A box's second set of UVs in metres (one copy of a surface covers `size`
// m; each block starts somewhere different; upright wood's boards run up it).
export function worldUV(geo, w, h, d, size, seed, upright = false) {
  const uv = geo.attributes.uv, out = new Float32Array(uv.count * 2), r = rng(seed), ou = r(), ov = r();
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) {
    const f = Math.floor(i / 4), [fu, fv] = faces[f] ?? [1, 1], u = uv.getX(i) * fu / size, v = uv.getY(i) * fv / size;
    const side = f !== 2 && f !== 3;
    out[i * 2] = (upright && side ? v : u) + ou; out[i * 2 + 1] = (upright && side ? u : v) + ov;
  }
  geo.setAttribute('uv1', new THREE.BufferAttribute(out, 2));
}

function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const std = o => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
function mesh(geo, mat, at, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat); if (at) m.position.set(...at); m.castShadow = cast; m.receiveShadow = receive; return m;
}
const rodTo = (a, b, r, mat, seg = 10) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), v = B.clone().sub(A);
  const m = mesh(new THREE.CylinderGeometry(r, r, v.length(), seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return m;
};
// A radial fade for a ground disc's edge (opaque inside 0.6 of its radius).
const fadeTex = () => canvasTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2);
  gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#000000');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

/* ---------- gravel and heaps (the mockup's: stones over a lopsided heap) ---------- */

export function heapShape(rx, rz, H, seed) {
  const r = rng(seed), lumps = Array.from({ length: 6 }, () => ({ x: (r() - 0.5) * rx * 1.2, z: (r() - 0.5) * rz * 1.2, s: 0.22 + r() * 0.3, a: (r() - 0.35) * 0.5 }));
  return (x, z) => {
    const q = Math.hypot(x / rx, z / rz); if (q >= 1) return 0;
    let k = Math.pow(1 - q * q, 1.1);
    for (const l of lumps) k += l.a * Math.exp(-((x - l.x) ** 2 + (z - l.z) ** 2) / (l.s * l.s * rx * rx)) * (1 - q);
    return H * Math.max(0, k);
  };
}
// A boulder (unit size: about 2 across, 1.2 tall, its middle at 0): a
// lumpy ball with a few flat cuts, as weathered rock breaks (level 4's
// first, smooth and tinted, looked like tomatoes), flattened.
function boulderGeo(seed) {
  const geo = new THREE.IcosahedronGeometry(1, 4), q = geo.attributes.position, r = rng(seed);
  const bumps = Array.from({ length: 9 }, () => [r() * 2 - 1, r() * 0.8 - 0.1, r() * 2 - 1, (r() - 0.35) * 0.5, 2 + r() * 6]);
  const cuts = Array.from({ length: 4 }, () => { const n = new THREE.Vector3(r() - 0.5, r() * 0.6, r() - 0.5).normalize(); return { n, d: 0.7 + r() * 0.2 }; });
  for (let i = 0; i < q.count; i++) {
    const v = new THREE.Vector3(q.getX(i), q.getY(i), q.getZ(i)); let k = 1;
    for (const [bx, by, bz, a, sh] of bumps) k += a * Math.exp(-((v.x - bx) ** 2 + (v.y - by) ** 2 + (v.z - bz) ** 2) * sh);
    k += 0.04 * Math.sin(v.x * 9 + seed) * Math.sin(v.z * 11) + 0.03 * Math.sin(v.y * 17);
    v.multiplyScalar(k);
    for (const c of cuts) { const p = v.dot(c.n); if (p > c.d) v.addScaledVector(c.n, c.d - p); }
    v.y *= 0.62; q.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
function heapGeo(hf, rx, rz, y0 = 0, seg = [48, 36]) {
  const geo = new THREE.PlaneGeometry(2 * rx, 2 * rz, ...seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const h = hf(p.getX(i), p.getZ(i)); p.setY(i, y0 + (h > 0 ? h * 0.97 : -0.02)); }
  geo.computeVertexNormals();
  return geo;
}
const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
const GRAVEL = ['#8F8B84', '#A7A196', '#77726B', '#B8AD9A', '#857A6C', '#9B9488', '#6A665F', '#C2B8A5'];
function stones(n, at, [s0, s1], seed, mat) {
  const r = rng(seed), im = new THREE.InstancedMesh(stoneGeo, mat, n), o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const [x, y, z] = at(r(), r()), s = s0 + r() * (s1 - s0);
    o.position.set(x, y + s * 0.25, z); o.rotation.set(r() * 6.3, r() * 6.3, r() * 6.3);
    o.scale.set(s * (0.8 + r() * 0.5), s * (0.5 + r() * 0.35), s * (0.8 + r() * 0.5)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, c.set(GRAVEL[Math.floor(r() * GRAVEL.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.08));
  }
  im.castShadow = true; im.receiveShadow = true;
  return im;
}

/* ---------- a setting ---------- */

// The setting for level n (2-4), its photos loaded. ctx: { renderer,
// leafy (topple-scene's leaves), LEAF }. Returns { group (ground and
// decor), background, environment, fog, hemi, sun, blockMat(b, i),
// prepare(geo, b, i), thing(p), ballMat, slingMat, tick(dt, t), burst(...),
// files, bytes, ms }; null when the photos can't be loaded (the caller
// draws the plain look then).
export async function makeSetting(n, ctx) {
  const S = SETTINGS[n];
  if (!S) return null;
  const t0 = performance.now();
  const maps = {};
  await Promise.all(S.surfaces.map(async k => { maps[k] = await loadSurface(k); }));
  const skyTex = await loadTex(`sky_${S.sky}.jpg`);
  // the sky: the photo all round (at night, made dark: nightSky); it lights the shiny parts too
  let bg, night = null;
  if (S.night) { night = nightSky(skyTex.image); bg = night.tex; } else bg = skyTex.clone();
  bg.mapping = THREE.EquirectangularReflectionMapping; bg.colorSpace = THREE.SRGBColorSpace; bg.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(ctx.renderer), env = pm.fromEquirectangular(bg).texture; pm.dispose();
  const horizon = S.night ? '#141C33' : horizonColour(skyTex.image);
  const group = new THREE.Group();
  const out = {
    level: n, name: S.name, group, background: bg, environment: S.night ? null : env, fog: new THREE.Fog(horizon, S.night ? 40 : 60, 250), hemi: S.hemi, sun: S.sun, horizon,
    lights: S.lights ?? null, files: 0, ms: 0, ...(night ? { nightMs: night.ms, skyline: night.skyline } : {}),
  };

  // block materials: a photo surface on uv1 (worldUV), ice, or glowing (one a colour)
  const blockMats = {};
  for (const [mat, sk] of Object.entries(S.mats)) {
    if (sk === 'ice') blockMats.ice = iceMat();
    else if (sk === 'barrel') blockMats.barrel = barrelMats(maps.barrel, maps.timber);
    else if (sk === 'glow') blockMats.glow = glowMats();
    else blockMats[mat] = photoMat(maps[sk], { channel: 1, extra: sk === 'steel' ? { envMapIntensity: 1.2 } : {} });
  }
  out.blockMat = b => (b.mat === 'glow' && blockMats.glow ? blockMats.glow(b.c) : blockMats[b.mat] ?? blockMats.wood ?? std({ color: '#999' }));
  out.prepare = (geo, b, i) => { if (b.shape !== 'cyl' && b.mat !== 'ice' && b.mat !== 'glow') worldUV(geo, b.w, b.h, b.d, SURFACES[S.mats[b.mat]]?.size ?? 1, n * 1000 + i + 1, b.mat === 'wood' && b.h > b.w); };
  out.blockGeo = b => (b.shape === 'cyl' ? (b.mat === 'glow' ? new THREE.CylinderGeometry(b.r, b.r, b.h, 28) : barrelGeo(b.r, b.h)) : new THREE.BoxGeometry(b.w, b.h, b.d));

  // the iron ball: rusty steel, darkened, with its lifting ring; at night a
  // glowing pale-gold ball, no ring (developer: "Blocks and balls glow")
  if (S.night) {
    out.ballMat = new THREE.MeshStandardMaterial({ color: '#5E5640', emissive: '#FFDD88', emissiveIntensity: 0.8, roughness: 0.4 });
    out.ballRing = false;
    out.decorateBall = m => m.add(halo('#FFE6A0', 0.07 * 3.2, 0.35));
  } else out.ballMat = photoMat(maps.steel, { repeat: [0.3, 0.3], extra: { color: '#6A6F76', metalness: 0.7, envMapIntensity: 1.1 } });
  out.slingMat = photoMat(maps.planks, { repeat: [0.15, 0.6], extra: { color: '#C9A27A' } });
  // glowing blocks: a halo each, and a light among them that dims as they break
  if (blockMats.glow) {
    out.decorate = (m, b) => { if (b.mat === 'glow') m.add(halo(b.c, Math.max(b.w, b.h, b.d) * 2.4, 0.42)); };
    const glowLight = new THREE.PointLight('#C9BEFF', 0, 9, 1.6); group.add(glowLight);
    let lit = [];
    out.placed = (meshes, parts) => {
      lit = meshes.filter((m, i) => parts.blocks[i]?.mat === 'glow');
      // among the blocks, a little in front (parts.bounds take in the things in the way too)
      const bs = parts.blocks.filter(b => b.mat === 'glow');
      if (!bs.length) return;
      const mid = k => (Math.min(...bs.map(b => b[k])) + Math.max(...bs.map(b => b[k]))) / 2;
      glowLight.position.set(mid('x'), Math.min(1.2, mid('y')), Math.max(...bs.map(b => b.z + b.d / 2)) + 0.4);
    };
    out.glowNow = () => { const on = lit.filter(m => m.visible).length; glowLight.intensity = lit.length ? 7 * on / lit.length : 0; return on; };
  }

  /* ---------- the ground ---------- */
  if (S.ground === 'pad') {
    // the building site's poured pad (mockup v7), opaque, its 1 m joints on top; the photo's yard beyond
    const pad = mesh(new THREE.PlaneGeometry(16, 26), photoMat(maps.pad, { repeat: [16 / 2.12, 26 / 2.12], extra: { polygonOffset: true, polygonOffsetFactor: -2, metalness: 0 } }), [0, 0.002, -7], { cast: false });
    pad.rotation.x = -Math.PI / 2; group.add(pad);
    const joints = canvasTex(512, 512, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(60,55,50,.55)'; for (let i = 0; i < 4; i++) { g.fillRect(i * 128, 0, 3, h); g.fillRect(0, i * 128, w, 3); } }, [16 / 4, 26 / 4]);
    const jm = mesh(new THREE.PlaneGeometry(16, 26), new THREE.MeshStandardMaterial({ map: joints, transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false }), [0, 0.003, -7], { cast: false });
    jm.rotation.x = -Math.PI / 2; group.add(jm);
  } else {
    // snow or sand all round, fading at its edge into the photo's own land
    const R = 34, sk = SURFACES[S.ground];
    const g = mesh(new THREE.CircleGeometry(R, 64), photoMat(maps[S.ground], { repeat: [2 * R / sk.size, 2 * R / sk.size], extra: { alphaMap: fadeTex(), transparent: true, metalness: 0, ...(S.ground === 'snow' ? { color: S.night ? '#B4C0D8' : '#F4F8FC' } : { color: '#E8C9A0' }) } }), [0, 0, -6], { cast: false });
    g.rotation.x = -Math.PI / 2; g.renderOrder = -1; group.add(g);
  }

  /* ---------- the things in the way (world metres, from sceneParts' props) ---------- */
  const greyMetal = std({ color: '#8E989D', roughness: 0.5, metalness: 0.4 }), black = std({ color: '#222426', roughness: 0.8 });
  const stoneMat = std({ roughness: 0.95, flatShading: true });
  const builders = {
    barrow(p) {
      // a wheelbarrow of gravel, side on (mockup v3), its tray in painted metal
      const g = new THREE.Group(), paint = photoMat(maps.paint, { repeat: [1, 1], extra: { metalness: 0.4 } }), dark = std({ color: '#225C37', roughness: 0.5, metalness: 0.3 });
      const tray = new THREE.BoxGeometry(1.0, 0.34, 0.68, 4, 2, 4), q = tray.attributes.position;
      for (let i = 0; i < q.count; i++) if (q.getY(i) < 0) { q.setX(i, q.getX(i) * 0.6 + 0.1); q.setZ(i, q.getZ(i) * 0.68); }
      tray.computeVertexNormals();
      g.add(mesh(tray, paint, [0, 0.47, 0]));
      g.add(mesh(new THREE.BoxGeometry(1.06, 0.04, 0.05), dark, [0, 0.645, 0.345]), mesh(new THREE.BoxGeometry(1.06, 0.04, 0.05), dark, [0, 0.645, -0.345]));
      g.add(mesh(new THREE.BoxGeometry(0.05, 0.04, 0.74), dark, [0.515, 0.645, 0]), mesh(new THREE.BoxGeometry(0.05, 0.04, 0.74), dark, [-0.515, 0.645, 0]));
      const hf = heapShape(0.48, 0.32, 0.17, 5);
      g.add(mesh(heapGeo(hf, 0.48, 0.32, 0.6), std({ color: '#5E5850', roughness: 1 })));
      g.add(stones(520, (u, v) => { const r = Math.sqrt(u) * 0.98, a = v * Math.PI * 2, x = r * 0.48 * Math.cos(a), z = r * 0.32 * Math.sin(a); return [x, 0.6 + hf(x, z), z]; }, [0.025, 0.05], 17, stoneMat));
      g.add(mesh(new THREE.TorusGeometry(0.17, 0.055, 12, 30), black, [0.66, 0.225, 0]));
      const hub = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), greyMetal, [0.66, 0.225, 0]); hub.rotation.x = Math.PI / 2; g.add(hub);
      for (const s of [-1, 1]) {
        g.add(rodTo([0.66, 0.225, s * 0.06], [0.3, 0.33, s * 0.2], 0.018, greyMetal));
        g.add(rodTo([0.42, 0.31, s * 0.22], [-0.82, 0.6, s * 0.3], 0.024, greyMetal));
        g.add(rodTo([-0.8, 0.595, s * 0.3], [-1.0, 0.64, s * 0.3], 0.032, black));
        g.add(rodTo([-0.32, 0.36, s * 0.24], [-0.38, 0.02, s * 0.27], 0.02, greyMetal));
        g.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), greyMetal, [-0.38, 0.015, s * 0.27]));
      }
      g.position.set(...p.at); g.rotation.y = p.yaw;
      return g;
    },
    light(p) {
      // a site light: a galvanised pole on a concrete foot, two lamps on a bar
      const g = new THREE.Group(), h = p.h;
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.28, 0.5), photoMat(maps.concrete ?? maps.steel, { repeat: [0.2, 0.1] }), [0, 0.14, 0]));
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, h, 14), photoMat(maps.galv, { repeat: [0.15, 1.3], extra: { metalness: 0.8, envMapIntensity: 1.2 } }), [0, h / 2, 0]));
      g.add(mesh(new THREE.BoxGeometry(1.0, 0.1, 0.12), greyMetal, [0, h, 0]));
      const bulb = std({ color: '#FFF6D0', emissive: '#FFE9A0', emissiveIntensity: 0.6 });
      for (const dx of [-0.32, 0.32]) {
        g.add(mesh(new THREE.BoxGeometry(0.36, 0.3, 0.16), std({ color: '#2E3438', roughness: 0.6 }), [dx, h + 0.2, 0]));
        g.add(mesh(new THREE.BoxGeometry(0.3, 0.24, 0.02), bulb, [dx, h + 0.2, 0.09], { cast: false }));
      }
      g.position.set(...p.at);
      return g;
    },
    rock(p) {
      // a grey boulder half buried (the building site's worn concrete photo:
      // grey stone; the cliff photo came out rusty brown, like wood). Its snow
      // went (developer, 2026-11-12: the snow on top didn't look like snow:
      // "I suggest we just make it a rock").
      const m = mesh(boulderGeo(p.seed), photoMat(maps.concrete, { repeat: [1.2, 1.2], extra: { color: '#A3A8AE', metalness: 0 } }));
      m.scale.set(p.rx / 0.95, p.H / 0.6, p.rz / 0.95);
      m.position.set(...p.at); m.rotation.y = p.yaw;
      return m;
    },
    pine(p) {
      // a pine: a barked trunk and four tiers of drooping, snow-topped branches
      const g = new THREE.Group(), [x, , z] = p.at;
      g.add(mesh(new THREE.CylinderGeometry(p.r * 0.5, p.r, p.h, 12), photoMat(maps.bark, { repeat: [0.4, 2] }), [x, p.h / 2, z]));
      const needles = std({ map: needleTex(), color: '#FFFFFF', roughness: 0.9 });
      const snow = photoMat(maps.snow, { repeat: [0.6, 0.6], extra: { color: '#F7FAFD', metalness: 0 } });
      p.tiers.forEach((t, i) => {
        const r = t.r * 1.25, h = t.r * 1.6, y0 = t.at[1] - t.r * 0.7;
        const cone = jaggedCone(r, h, 22, 2 + i, 0.22);
        g.add(mesh(cone, needles, [x, y0 + h / 2, z]));
        const cap = jaggedCone(r * 0.82, h * 0.55, 22, 9 + i, 0.18);
        g.add(mesh(cap, snow, [x, y0 + h * 0.62, z]));
      });
      return g;
    },
    scrub(p) {
      // desert scrub: level 1's leafy bush in sagebrush's grey-greens, smaller leaves
      const ys = p.balls.map(b => b.at[1] + b.r);
      return ctx.leafy(p.balls, ['#8C9A6E', '#9DAA7E', '#77865C'], 0, Math.max(...ys), ctx.LEAF * 0.75);
    },
    cactus(p) {
      // a saguaro: a ribbed trunk with a rounded top, two arms bending up
      const g = new THREE.Group(), [x, , z] = p.at, mat = std({ map: cactusTex(), color: '#FFFFFF', roughness: 0.7 });
      g.add(mesh(ribbed(p.r, p.h), mat, [x, 0, z]));
      for (const a of p.arms) {
        const from = new THREE.Vector3(x + Math.cos(a.a) * p.r * 0.6, a.y0 - a.out * 0.5, z + Math.sin(a.a) * p.r * 0.36);
        const curve = new THREE.CatmullRomCurve3([from, new THREE.Vector3((from.x + a.x) / 2 + (a.x - x) * 0.15, a.y0 - a.out * 0.2, (from.z + a.z) / 2), new THREE.Vector3(a.x, a.y0 + a.out * 0.15, a.z), new THREE.Vector3(a.x, a.y1, a.z)]);
        g.add(mesh(new THREE.TubeGeometry(curve, 24, a.r, 14), mat));
        g.add(mesh(new THREE.SphereGeometry(a.r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, [a.x, a.y1, a.z]));
      }
      return g;
    },
  };
  out.thing = p => builders[p.part]?.(p) ?? null;

  /* ---------- decor, out of play ---------- */
  const decor = [];
  if (S.name === 'site') {
    // cones, pipes and a pallet of bricks by the yard's edge (mockup v1), well out of reach
    const cone = std({ color: '#F06A28', roughness: 0.6 }), white = std({ color: '#FFFFFF' });
    for (const [cx, cz] of [[-4.6, -16.5], [-3.2, -16.2], [3.6, -15.8], [5.1, -16.4], [-7.5, -15], [9.5, -15.4]]) {
      group.add(mesh(new THREE.ConeGeometry(0.2, 0.55, 18), cone, [cx, 0.3, cz]), mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.09, 18), white, [cx, 0.31, cz]), mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), cone, [cx, 0.02, cz]));
    }
    const pipe = photoMat(maps.paint, { repeat: [1, 2], extra: { color: '#7FA6D8', metalness: 0.5 } });
    [[-0.5, 0.25], [0, 0.25], [0.5, 0.25], [-0.25, 0.68], [0.25, 0.68], [0, 1.11]].forEach(([dx, y]) => { const m = mesh(new THREE.CylinderGeometry(0.25, 0.25, 4, 18), pipe, [-9 + dx, y, -17.5]); m.rotation.x = Math.PI / 2; group.add(m); });
    group.add(mesh(new THREE.BoxGeometry(1.1, 0.14, 1.1), photoMat(maps.planks, { repeat: [1, 1] }), [6.5, 0.07, -16.8]));
    const pal = new THREE.BoxGeometry(1.0, 0.8, 1.0); worldUV(pal, 1, 0.8, 1, 3, 99);
    group.add(mesh(pal, photoMat(maps.brick, { channel: 1 }), [6.5, 0.54, -16.8]));
    decor.push(rat(group));
  } else if (S.name === 'snow') {
    // a snowman off to the right, and young pines at the edge of the snow
    const snow = photoMat(maps.snow, { repeat: [0.7, 0.7], extra: { color: '#FAFCFE', metalness: 0 } });
    const sm = new THREE.Group(), coal = std({ color: '#1C1C1E', roughness: 0.6 });
    [[0.42, 0.38], [0.3, 0.98], [0.21, 1.42]].forEach(([r, y]) => sm.add(mesh(new THREE.SphereGeometry(r, 24, 16), snow, [0, y, 0])));
    for (const s of [-1, 1]) sm.add(mesh(new THREE.SphereGeometry(0.025, 8, 6), coal, [s * 0.07, 1.48, 0.19]));
    for (const y of [0.9, 1.04, 1.18]) sm.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), coal, [0, y, 0.29]));
    const nose = mesh(new THREE.ConeGeometry(0.035, 0.2, 10), std({ color: '#E8742A' }), [0, 1.42, 0.29]); nose.rotation.x = Math.PI / 2; sm.add(nose);
    const stick = std({ color: '#5A3E28', roughness: 0.9 });
    sm.add(rodTo([0.27, 1.05, 0], [0.62, 1.32, 0.05], 0.018, stick), rodTo([-0.27, 1.05, 0], [-0.6, 1.25, -0.05], 0.018, stick));
    sm.add(mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 16), coal, [0, 1.68, 0]), mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16), coal, [0, 1.585, 0]));
    sm.position.set(4.2, 0, -10.5); sm.rotation.y = -0.45; group.add(sm);
    decor.push(bunny(group));
    for (const [px, pz, s] of [[-8, -15, 1.3], [-10.5, -18, 1.6], [9.5, -17, 1.4], [12, -21, 1.8]]) {
      const tiers = [[1.4, 0.8], [2.2, 0.62], [2.9, 0.45], [3.4, 0.3]].map(([y, r]) => ({ r: r * s, at: [px, y * s, pz] }));
      group.add(builders.pine({ at: [px, 0, pz], r: 0.12 * s, h: 3.9 * s, tiers }));
    }
  } else if (S.name === 'desert') {
    // boulders off to the sides (the photo's rock formations beyond), and a rattlesnake on the move
    // (first drawn smooth and tinted orange, they looked like tomatoes: rougher, the photo's own colour, more of it)
    const rock = photoMat(maps.rock, { repeat: [3.5, 3.5], extra: { color: '#E8D6C2', metalness: 0 } });
    for (const [rx, rz, s, seed] of [[-7.5, -12, 1.6, 3], [8.5, -14, 2.2, 5], [5, -21, 2.8, 7], [-12, -19, 3.2, 9], [-4.5, -9.5, 0.7, 11]]) {
      const geo = boulderGeo(seed);
      const m = mesh(geo, rock, [rx, s * 0.25, rz]);
      m.scale.setScalar(s); m.rotation.y = seed;
      group.add(m);
    }
    decor.push(snake(group));
  } else if (S.name === 'night') {
    // young pines at the edge of the snow (as level 3's), the moon, a cloud
    // drifting past it (not frightened: developer, "it does not 'get
    // frightened'"), and the owl on a bare tree at the view's side
    for (const [px, pz, s] of [[-8, -15, 1.3], [-10.5, -18, 1.6], [9.5, -19, 1.4], [12, -22, 1.8]]) {
      const tiers = [[1.4, 0.8], [2.2, 0.62], [2.9, 0.45], [3.4, 0.3]].map(([y, r]) => ({ r: r * s, at: [px, y * s, pz] }));
      group.add(builders.pine({ at: [px, 0, pz], r: 0.12 * s, h: 3.9 * s, tiers }));
    }
    decor.push(sky(group, ctx.camera, night, ctx.covers ?? (() => [])));
    decor.push(owl(group, photoMat(maps.bark, { repeat: [0.4, 2], extra: { color: '#8D8A96' } }), ctx.sound ?? (() => {})));
  }

  /* ---------- effects: ice shattering, a barrel bursting ---------- */
  const fx = makeEffects(group, blockMats, S);
  out.burst = (b, at, q, v) => fx.burst(b, at, q, v);
  out.tick = (dt, t) => { fx.tick(dt); for (const d of decor) d.tick(dt, t); out.glowNow?.(); };
  // a new scene: the animals cross again, once
  out.newScene = edges => { for (const d of decor) d.reset?.(edges); };
  // a block fell at x: the animals in view take fright (what each did, for the log)
  out.fright = x => decor.map(d => d.fright?.(x)).filter(Boolean);
  out.animals = () => decor.map(d => d.state?.()).filter(Boolean);
  out.clearEffects = () => fx.clear();
  out.fxLive = () => fx.live;
  out.ms = Math.round(performance.now() - t0);
  out.files = images.size;
  return out;
}

// The photo's horizon colour (for the haze): a band across its middle, averaged.
function horizonColour(img) {
  try {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0, 256, 128);
    const d = g.getImageData(0, 60, 256, 6).data; let r = 0, gg = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return `rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})`;
  } catch { return '#C8D4DC'; }
}

/* ---------- the night (Star Light) ---------- */

// Level 3's photo at night, as a canvas (2048 x 1024, equirectangular): the
// sky found column by column (blue: its blue well over its red; the snowy
// peaks, the forest and the clouds' white aren't), from 0.3 of the way
// down (above that it's all sky: the sun is there) to the horizon; above
// that skyline a night sky with stars, below it the land in moonlight
// (its brightness, in blues). { tex, ms, skyline: the rows (0-1), a sample }.
export function nightSky(img, W = 2048, H = 1024) {
  const t0 = performance.now();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, W, H);
  const im = g.getImageData(0, 0, W, H), d = im.data;
  const sky = i => d[i + 2] - d[i] > 22 && d[i + 2] > 110;
  const top = Math.round(0.3 * H), low = Math.round(0.52 * H), line = new Int32Array(W);
  for (let x = 0; x < W; x++) {
    let y = top, run = 0;
    for (; y < low; y++) { if (sky((y * W + x) * 4)) run = 0; else if (++run >= 4) { y -= 3; break; } }
    line[x] = Math.min(y, low);
  }
  // a stray column (a gap between trees) evened out by its neighbours
  const sm = Int32Array.from(line, (v, x) => { const a = [-2, -1, 0, 1, 2].map(k => line[(x + k + W) % W]).sort((p, q) => p - q); return a[2]; });
  const r = rng(77);
  for (let x = 0; x < W; x++) {
    const s = sm[x];
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 4;
      if (y < s) {
        // the sky: deep blue overhead, a little lighter low down
        const k = y / s, f = k * k;
        d[i] = 5 + 14 * f; d[i + 1] = 9 + 24 * f; d[i + 2] = 26 + 46 * f;
      } else {
        // the land, moonlit (feathered over 2 rows into the sky's colour)
        const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2], k = Math.min(1, (y - s + 1) / 3);
        d[i] = d[i] * (1 - k) * 0.1 + k * l * 0.3; d[i + 1] = d[i + 1] * (1 - k) * 0.1 + k * l * 0.36; d[i + 2] = d[i + 2] * (1 - k) * 0.2 + k * l * 0.52;
      }
    }
  }
  g.putImageData(im, 0, 0);
  // stars, over the sky only; fewer high up (rows there are squeezed on the sphere)
  for (let n = 0; n < 2600; n++) {
    const x = r() * W, y = Math.pow(r(), 0.7) * H * 0.5;
    if (y > sm[Math.floor(x)] - 3 || r() > Math.sin(Math.PI * y / H) * 1.1) continue;
    const b = r(), s = b > 0.97 ? 1.6 : b > 0.85 ? 1.1 : 0.7;
    g.fillStyle = `rgba(${b > 0.9 ? '255,240,220' : b < 0.15 ? '200,215,255' : '255,255,255'},${0.35 + 0.65 * r()})`;
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  return { tex, ms: Math.round(performance.now() - t0), rows: sm, H, skyline: [0, 0.25, 0.5, 0.75].map(f => Math.round(1000 * sm[Math.floor(f * W)] / H) / 1000) };
}

// A soft round glow, added onto what glows (a block, the ball): a sprite
// `size` m across, its colour, see-through `a` at its middle; light added.
const haloTex = (() => { let t = null; return () => t ??= canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}); })();
function halo(colour, size, a) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: colour, transparent: true, opacity: a, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); s.renderOrder = 2;
  return s;
}
// Glowing blocks: a material a colour (made once each), lit from inside: the
// colour glowing, brighter at the edges (frosted), a little see-through.
function glowMats() {
  const edge = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#9A9A9A'; g.fillRect(0, 0, w, h);
    const r = rng(23);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.1 + 0.2 * r()})`; g.fillRect(r() * w, r() * h, 2, 2); }
    for (const [x0, y0, x1, y1] of [[0, 0, 0, 14], [0, h, 0, h - 14]]) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), w, 14); }
    for (const [x0, x1] of [[0, 14], [w, w - 14]]) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 14, h); }
  });
  edge.colorSpace = THREE.NoColorSpace;
  const made = new Map();
  return c => {
    const key = c || '#FFFFFF';
    if (!made.has(key)) made.set(key, new THREE.MeshStandardMaterial({ color: new THREE.Color(key).multiplyScalar(0.35), emissive: key, emissiveMap: edge, emissiveIntensity: 1.15, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.93 }));
    return made.get(key);
  };
}

// The moon and a cloud that drifts across past it (src/core/topple-sky.js).
// Both are behind the photo's land: a sphere 150 m round the camera writes
// depth (no colour) wherever the photo is land (its skyline, from
// nightSky()), and the moon and cloud are drawn beyond it, so the
// mountains hide them as they would (developer, 2026-11-12: they showed
// "between the mountains in the back and the trees"). The moon goes where
// the view shows the most sky (moonSpot), worked out again whenever the
// camera moves or the view changes shape; the cloud drifts at a fifth of
// the first build's speed, a wisp (cloudTex), not round puffs.
const MASK_R = 150, CLOUD_D = 153, MOON_D = 156;   // the camera's far plane: 160
function sky(group, camera, night, covers) {
  // the land's mask: the skyline (rows from the top, 0-1) a 1-pixel-high float texture
  const W = night.rows.length, line = new Float32Array(W);
  for (let x = 0; x < W; x++) line[x] = night.rows[x] / night.H;
  const lineTex = new THREE.DataTexture(line, W, 1, THREE.RedFormat, THREE.FloatType);
  lineTex.wrapS = THREE.RepeatWrapping; lineTex.magFilter = lineTex.minFilter = THREE.NearestFilter; lineTex.needsUpdate = true;
  const mask = new THREE.Mesh(new THREE.SphereGeometry(MASK_R, 48, 24), new THREE.ShaderMaterial({
    uniforms: { line: { value: lineTex } },
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    // as three.js maps the background (equirectUv): land where the row is below the skyline
    fragmentShader: 'uniform sampler2D line; varying vec3 vW; void main() { vec3 d = normalize(vW - cameraPosition); float u = atan(d.z, d.x) * 0.1591549 + 0.5; float v = asin(clamp(d.y, -1.0, 1.0)) * 0.3183099 + 0.5; if (1.0 - v < texture2D(line, vec2(u, 0.5)).r) discard; gl_FragColor = vec4(0.0); }',
    side: THREE.BackSide, colorWrite: false, depthWrite: true,
  }));
  mask.frustumCulled = false; mask.renderOrder = -1; group.add(mask);
  const isLand = d => { const { u, v } = equirect(d.x, d.y, d.z); return 1 - v >= line[Math.min(W - 1, Math.floor(u * W))]; };

  const moonTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,248,225,.55)'); gr.addColorStop(1, 'rgba(255,248,225,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFF6DE'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.2, 0, Math.PI * 2); g.fill();
    const r = rng(9);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(190,180,160,${0.25 + 0.25 * r()})`; const a = r() * 6.3, q = r() * w * 0.14; g.beginPath(); g.arc(w / 2 + Math.cos(a) * q, h / 2 + Math.sin(a) * q, 4 + r() * 12, 0, Math.PI * 2); g.fill(); }
  });
  const sprite = (tex, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, fog: false })); group.add(s); return s; };
  const moon = sprite(moonTex, 1), cloud = sprite(cloudTex(), 1);
  const v = new THREE.Vector3(), MOON_SIZE = MOON.r / 0.4;   // the sprite: its disc 0.4 of it across
  let t = 0, key = '', spot = null;
  const dirAt = (nx, ny) => v.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
  const at = (s, nx, ny, dist, size, aspect = 1) => {
    s.position.copy(camera.position).addScaledVector(dirAt(nx, ny), dist);
    const hgt = 2 * dist * Math.tan(camera.fov * Math.PI / 360);
    s.scale.set(hgt * size * aspect, hgt * size, 1);
  };
  // the skyline on the screen: at each x, the lowest y with sky above it all the way up (above 1: none)
  const skyline = () => {
    const out = [];
    for (let x = -1; x <= 1.0001; x += 0.025) {
      let y = 1;
      if (isLand(dirAt(x, 1))) y = 1.05;
      else while (y > -1 && !isLand(dirAt(x, y - 0.01))) y -= 0.01;
      out.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
    }
    return out;
  };
  return {
    tick(dt) {
      if (!camera) return;
      mask.position.copy(camera.position);
      // the moon's place, again only when the view or what covers it changed
      const cv = covers().map(c => ({ x0: +c.x0.toFixed(2), x1: +c.x1.toFixed(2), y0: +c.y0.toFixed(2) }));
      const k = [camera.position.x, camera.position.y, camera.position.z, camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.fov, camera.aspect].map(n => n.toFixed(4)).join() + JSON.stringify(cv);
      if (k !== key) { key = k; spot = moonSpot(skyline(), { x: MOON.r / camera.aspect, y: MOON.r }, { covers: cv }); }
      at(moon, spot.x, spot.y, MOON_D, MOON_SIZE);
      t += dt;
      const c = cloudAt(t);
      cloud.visible = c.shown;
      if (c.shown) at(cloud, c.x, spot.y - 0.01, CLOUD_D, 0.15, 3.2);
    },
    state: () => ({ moon: spot, cloud: Math.round(cloudAt(t).x * 100) / 100, cloudShown: cloudAt(t).shown, maskR: MASK_R }),
  };
}

// A wisp of cloud, lit by the moon: noise stretched sideways into streaks
// (3 across, 14 up; bent a little by a second noise), in a long lens that
// fades out before the picture's edges, see-through where thin, lighter on
// top (the first build's was 26 round puffs: "looks a lot like a pile of
// spheres"; three tries side by side in the page, this the wispiest).
function cloudTex() {
  return canvasTex(512, 160, (g, w, h) => {
    const r = rng(15), P = Array.from({ length: 512 }, () => r());
    const hash = (x, y) => P[(x * 73 + y * 151 + ((x * y) & 255)) & 511];
    const sm = a => a * a * (3 - 2 * a);
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
    const fbm = (x, y, k) => { let n = 0, amp = 0.5, f = 1; for (let o = 0; o < 5; o++) { n += amp * noise(x * f, y * f + o * 7 + k); amp *= 0.5; f *= 2.1; } return n; };
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w, ny = y / h;
        const n = fbm(nx * 3, (ny + 0.25 * (fbm(nx * 3, ny * 3, 50) - 0.5)) * 14, 0);
        const ex = (nx - 0.5) / 0.47, ey = (ny - 0.5 + 0.07 * Math.sin(nx * 6 + 1)) / 0.34;
        const env = Math.max(0, 1 - ex * ex - ey * ey);
        const den = Math.max(0, Math.min(1, (n * 1.5 + env * 0.9 - 1.05) / 0.7)) * Math.sqrt(env);
        const i = (y * w + x) * 4, lit = 0.55 + 0.45 * (1 - ny) * (0.6 + 0.8 * (n - 0.3));
        d[i] = 60 + 110 * lit; d[i + 1] = 68 + 112 * lit; d[i + 2] = 95 + 120 * lit; d[i + 3] = 225 * Math.pow(den, 1.3);
      }
    }
    g.putImageData(im, 0, 0);
  });
}

// The owl (Star Light) on a branch of a bare tree at the side of the view:
// sitting, it turns its head now and then and hoots ("who"); frightened,
// it starts, spreads its wings and flies off, away from the block, out of
// sight. Its sitting, hooting and flying: src/core/topple-animals.js's
// perched().
function owl(group, bark, sound) {
  const tree = new THREE.Group(); group.add(tree);
  const Z = -13, H = 2.6;   // the tree's depth, the owl's branch's height
  tree.add(mesh(new THREE.CylinderGeometry(0.1, 0.17, 4.2, 10), bark, [0, 2.1, 0]));
  // branches: the owl's goes in towards the middle (local -x); a few others bare
  const limbs = [[[0, H - 0.2, 0], [-1.2, H, 0.1], 0.05], [[0, 3.2, 0], [0.9, 4.1, -0.2], 0.05], [[0, 3.7, 0], [-0.6, 4.6, 0.2], 0.04], [[0, 2.2, 0], [0.7, 2.7, 0.3], 0.04], [[-0.7, H - 0.08, 0.06], [-1.0, H + 0.5, 0.15], 0.025]];
  for (const [a, b, r] of limbs) tree.add(rodTo(a, b, r, bark, 8));
  const g = new THREE.Group(); group.add(g);
  const fur = std({ color: '#6B5A48', roughness: 0.95 }), pale = std({ color: '#B9A88E', roughness: 0.95 }), face = std({ color: '#D6C8AE', roughness: 0.9 });
  const eye = std({ color: '#FFD24A', emissive: '#FFC21A', emissiveIntensity: 0.9 }), black = std({ color: '#111111', roughness: 0.3 }), horn = std({ color: '#3A3128' });
  part(g, ballGeo, fur, [0, 0.16, 0], [0.12, 0.17, 0.11]);                 // body
  part(g, ballGeo, pale, [0, 0.14, 0.05], [0.09, 0.13, 0.07]);             // breast
  const head = new THREE.Group(); head.position.set(0, 0.34, 0); g.add(head);
  part(head, ballGeo, fur, [0, 0, 0], [0.105, 0.09, 0.095]);
  part(head, ballGeo, face, [0, -0.005, 0.055], [0.085, 0.07, 0.045]);   // the face's disc
  for (const s of [-1, 1]) {
    part(head, ballGeo, eye, [s * 0.036, 0.008, 0.092], [0.022, 0.022, 0.012]);
    part(head, ballGeo, black, [s * 0.036, 0.008, 0.103], [0.011, 0.011, 0.006]);
    part(head, new THREE.ConeGeometry(0.02, 0.07, 6), fur, [s * 0.06, 0.09, 0.0]).rotation.z = -s * 0.35;   // ear tufts
  }
  part(head, new THREE.ConeGeometry(0.012, 0.035, 6), horn, [0, -0.02, 0.1]).rotation.x = Math.PI * 0.6;   // beak
  // wings: hinged at the shoulder, folded down its sides; spread to fly
  const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(s * 0.1, 0.25, 0); g.add(w); part(w, ballGeo, fur, [s * 0.015, -0.1, 0], [0.025, 0.12, 0.08]); return w; });
  for (const s of [-1, 1]) part(g, ballGeo, horn, [s * 0.04, 0.0, 0.04], [0.02, 0.012, 0.03]);   // feet on the branch
  g.scale.setScalar(2);
  const go = perched(55);
  let look = 0, lookTo = 0, lookIn = 2, hoot = 0, edges = null, placed = false;
  // the tree at the view's right side, the owl on its branch (worked out at
  // the scene's first frame: the camera is placed after the scene is set)
  const place = () => {
    const x = (edges ? edges(H, Z)[1] : 5) - 0.5;
    tree.position.set(x, 0, Z);
    go.setSeat([x - 1.0, H + 0.05, Z + 0.1]);
    placed = true;
  };
  return {
    // each scene: the owl back on its branch, calm
    reset(e) { edges = e ?? edges; placed = false; go.reset(e); look = lookTo = 0; lookIn = 2; hoot = 0; },
    fright: x => go.fright(x), state: () => ({ owl: true, ...go.state, tree: Math.round(tree.position.x * 100) / 100 }),
    tick(dt, t) {
      if (!placed) place();
      if (go.tick(dt)) { hoot = 1; sound('hoot'); }
      g.visible = go.on;
      if (!go.on) return;
      g.position.set(go.x, go.y, go.seat[2]);
      const startle = Math.sin(Math.PI * go.startled);
      if (go.flying) {
        // flying: turned the way it goes, wings out and beating
        g.rotation.y = go.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (1.25 + 0.6 * Math.sin(go.flown * 16)); });
        head.rotation.set(0, 0, 0);
        return;
      }
      g.rotation.y = 0;
      // startled: it bobs up, wings half open; sitting: now and then its head turns
      g.position.y += startle * 0.08;
      wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * startle * 0.8; });
      if ((lookIn -= dt) <= 0) { lookTo = go.rand() < 0.4 ? 0 : (go.rand() - 0.5) * 2.2; lookIn = 1.5 + 3 * go.rand(); }
      look += (lookTo - look) * Math.min(1, dt * 4);
      // a hoot: the head dips forward and back up, twice ("who-who")
      hoot = Math.max(0, hoot - dt / 0.9);
      head.rotation.set(Math.max(0, Math.sin(hoot * Math.PI * 2)) * 0.3, go.scared ? 0 : look, 0);
    },
  };
}

/* ---------- materials made in the page ---------- */

// Ice: pale, see-through a little, glossy (the snowy sky in it), frosted at
// the edges, a few cracks inside.
function iceMat() {
  const map = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#DDF3FF'); gr.addColorStop(0.5, '#BFE6FA'); gr.addColorStop(1, '#D4EEFB');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(41);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) { g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 70; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 260; i++) g.fillRect(r() * w, r() * h, 2, 2);
    const e = g.createLinearGradient(0, 0, 0, 22); e.addColorStop(0, 'rgba(255,255,255,.75)'); e.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = e; g.fillRect(0, 0, w, 22); g.save(); g.translate(0, h); g.scale(1, -1); g.fillRect(0, 0, w, 22); g.restore();
    g.save(); g.rotate(-Math.PI / 2); g.translate(-h, 0); g.fillRect(0, 0, h, 22); g.restore();
    g.save(); g.translate(w, 0); g.rotate(Math.PI / 2); g.fillRect(0, 0, h, 22); g.restore();
  });
  return new THREE.MeshStandardMaterial({ map, transparent: true, opacity: 0.82, roughness: 0.08, metalness: 0.05, envMapIntensity: 1.6 });
}
// A barrel: its staves and hoops round the side, its lid in plain boards.
function barrelMats(barrel, timber) {
  const side = photoMat(barrel, { repeat: [2, 1], extra: { metalness: 0.3 } });
  const lid = photoMat(timber, { repeat: [0.4, 0.4], extra: { color: '#8C6A4C', metalness: 0 } });
  return [side, lid, lid];
}
// A barrel's shape: a cylinder bulging a little at the middle.
function barrelGeo(r, h) {
  const g = new THREE.CylinderGeometry(r, r, h, 26, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / (h / 2), k = 1 + 0.07 * (1 - y * y); if (Math.hypot(p.getX(i), p.getZ(i)) > r * 0.99) { p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
  g.computeVertexNormals();
  return g;
}
// A cone whose rim is jagged and droops (a tier of pine branches, or snow on it).
function jaggedCone(r, h, n, seed, jag) {
  const g = new THREE.ConeGeometry(r, h, n, 3, true), p = g.attributes.position, rr = rng(seed);
  const k = Array.from({ length: n + 1 }, () => 1 + (rr() - 0.5) * 2 * jag);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i), d = Math.hypot(x, z);
    if (d < 1e-4) continue;
    const a = (Math.atan2(z, x) + Math.PI) / (2 * Math.PI) * n, f = k[Math.round(a) % n] * (0.5 + 0.5 * (1 - (y + h / 2) / h));
    const s = 1 + (f - 1) * (1 - (y + h / 2) / h);
    p.setX(i, x * s); p.setZ(i, z * s); if (y < -h / 2 + 1e-4) p.setY(i, y - (f - 0.9) * h * 0.25);
  }
  g.computeVertexNormals();
  return g;
}
const needleTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#1F4A2C'; g.fillRect(0, 0, w, h);
  const r = rng(13);
  for (let i = 0; i < 700; i++) { g.strokeStyle = ['#2C6038', '#18402A', '#3A7046', '#264F31'][Math.floor(r() * 4)]; g.lineWidth = 1.4; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y + 6 + r() * 6); g.stroke(); }
}, [3, 2]);
// The saguaro's skin: grooves between ribs, dots of spines.
const cactusTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#5E8A43'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) { const x = (i + 0.5) * w / 12; const gr = g.createLinearGradient(x - 10, 0, x + 10, 0); gr.addColorStop(0, 'rgba(30,55,25,0)'); gr.addColorStop(0.5, 'rgba(30,55,25,.55)'); gr.addColorStop(1, 'rgba(30,55,25,0)'); g.fillStyle = gr; g.fillRect(x - 10, 0, 20, h); }
  const r = rng(5); g.fillStyle = 'rgba(235,225,190,.85)';
  for (let i = 0; i < 12; i++) for (let y = 4; y < h; y += 14) g.fillRect(i * w / 12 + (r() - 0.5) * 2 - 1, y + r() * 3, 2, 2);
}, [2, 3]);
// A ribbed trunk h tall, radius r, with a rounded top (origin at its foot).
function ribbed(r, h) {
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(r, (i / 10) * (h - r)));
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.001, r * Math.cos(a)), h - r + r * Math.sin(a))); }
  const g = new THREE.LatheGeometry(pts, 48), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.07 * Math.cos(12 * a); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals();
  return g;
}

/* ---------- the animals (decor: out of the ball's way, behind the structure) ----------
   The rattlesnake (level 4), and birds over the park, a rat on the building
   site, a snow bunny in the snow (developer, 2026-11-12: "I like the snake
   ... a bird or two for the first level, a rat on the construction site, a
   snow bunny for the winter level"). Each crosses the view once a scene,
   a while after it starts, from off one side to off the other, and is gone
   till the next (developer, 2026-11-12: "maybe make it less active and more
   subtle. If it just hopped across a scene once that should be plenty.
   Same with the other little creatures"). The walk itself (and the fright:
   a block falling startles it, then it runs off away from it) is
   src/core/topple-animals.js's crossing(); fright(x) here passes it on. */

// A part placed in a group: geometry, material, position, scale.
const part = (g, geo, mat, at, sc = [1, 1, 1]) => { const m = mesh(geo, mat, at); m.scale.set(...sc); g.add(m); return m; };
const ballGeo = new THREE.SphereGeometry(1, 16, 12);

// A rattlesnake: a chain of spheres down to the tail, banded tan and brown,
// sliding along in S-curves: the head weaves, and the body follows the
// head's path (so, frightened and turning back, it turns in a U, its body
// following round; a body drawn along a wave flipped to the other side).
function snake(group) {
  const N = 34, geo = new THREE.SphereGeometry(1, 12, 8), mat = std({ roughness: 0.6 });
  const im = new THREE.InstancedMesh(geo, mat, N), o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < N; i++) im.setColorAt(i, c.set(i === 0 ? '#7A5A3A' : (Math.floor(i / 2) % 2 ? '#6B4A2E' : '#C9A274')));
  im.castShadow = true; im.receiveShadow = true;
  group.add(im);
  const eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 6, 4), std({ color: '#111' }), 2); group.add(eyes);
  const z0 = -8.4, go = crossing(11, 0, z0, 1.8);
  const GAP = 0.045, STEP = 0.01, LEN = N * GAP;
  // path: the head's points, newest last, STEP apart; d: m travelled (the
  // weave); turnAt: d when it turned back (it swings out 0.25 m, away from
  // the camera, so it doesn't go back through its own body), else null
  let path = [], d = 0, turnAt = null, wasDir = 0;
  const headZ = () => z0 + 0.12 * Math.sin(d * 7) - (turnAt === null ? 0 : 0.25 * Math.min(1, (d - turnAt) / 0.5));
  // The point s m back along the path (straight on past its end).
  const back = s => {
    let i = path.length - 1, left = s;
    while (i > 0) {
      const [ax, az] = path[i], [bx, bz] = path[i - 1], seg = Math.hypot(ax - bx, az - bz);
      if (left <= seg) { const f = left / seg; return [ax + (bx - ax) * f, az + (bz - az) * f]; }
      left -= seg; i--;
    }
    return [path[0][0] - wasDir * left, path[0][1]];
  };
  return {
    reset(e) { go.reset(e); path = []; d = 0; turnAt = null; },
    fright: x => go.fright(x), state: () => go.state,
    tick(dt, t) {
      go.tick(dt);
      im.visible = eyes.visible = go.on;
      if (!go.on) return;
      if (!path.length) { wasDir = go.dir; path.push([go.x, headZ()]); }
      if (go.dir !== wasDir && turnAt === null) turnAt = d;
      const x0 = go.x;
      go.advance(dt * 0.45 * go.pace);
      d += Math.abs(go.x - x0);
      const [lx, lz] = path[path.length - 1], hz = headZ();
      if (Math.hypot(go.x - lx, hz - lz) >= STEP) { path.push([go.x, hz]); if (path.length > LEN / STEP + 20) path.shift(); }
      // startled: its head and neck rear up, then down again
      const rear = Math.sin(Math.PI * go.startled) * 0.09, dir = go.dir;
      for (let i = 0; i < N; i++) {
        const r = i === 0 ? 0.042 : 0.036 * (1 - i / N * 0.75), [px, pz] = i === 0 ? [go.x, hz] : back(i * GAP);
        o.position.set(px, r * 0.8 + rear * Math.max(0, 1 - i / 6), pz); o.scale.setScalar(r); o.scale.x = r * 1.3; o.updateMatrix(); im.setMatrixAt(i, o.matrix);
        if (i === 0) for (const k of [0, 1]) { o.position.set(px + dir * 0.03, r * 1.25 + rear, pz + (k ? 0.022 : -0.022)); o.scale.setScalar(1); o.updateMatrix(); eyes.setMatrixAt(k, o.matrix); }
      }
      im.instanceMatrix.needsUpdate = true; eyes.instanceMatrix.needsUpdate = true;
    },
  };
}

// A rat (the building site): grey-brown, a long bare tail, scurrying across
// in dashes, stopping once or twice to sniff.
function rat(group) {
  const g = new THREE.Group(), fur = std({ color: '#6E625A', roughness: 0.95 }), pink = std({ color: '#D9A3A0', roughness: 0.7 }), black = std({ color: '#111111', roughness: 0.3 });
  part(g, ballGeo, fur, [0, 0.07, 0], [0.16, 0.075, 0.085]);              // body
  const head = new THREE.Group(); head.position.set(0.15, 0.08, 0); g.add(head);
  part(head, ballGeo, fur, [0.03, 0, 0], [0.07, 0.05, 0.05]);
  part(head, new THREE.ConeGeometry(0.035, 0.08, 10), fur, [0.1, -0.005, 0]).rotation.z = -Math.PI / 2;
  part(head, ballGeo, pink, [0.14, -0.005, 0], [0.008, 0.008, 0.008]);    // nose
  for (const s of [-1, 1]) {
    part(head, ballGeo, pink, [0.0, 0.045, s * 0.035], [0.012, 0.025, 0.022]);  // ears
    part(head, ballGeo, black, [0.06, 0.02, s * 0.03], [0.007, 0.007, 0.007]);  // eyes
  }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.15, 0.06, 0], [-0.3, 0.03, 0.03], [-0.42, 0.015, -0.02], [-0.52, 0.01, 0.02]].map(p => new THREE.Vector3(...p))), 16, 0.008, 6), pink);
  tail.castShadow = true; g.add(tail);
  const feet = [-1, 1].flatMap(s => [-0.09, 0.08].map(x => part(g, ballGeo, pink, [x, 0.012, s * 0.06], [0.02, 0.012, 0.014])));
  // twice a real rat's size, so it reads from the slingshot (15 m off)
  g.scale.setScalar(2);
  group.add(g);
  const z0 = -8, go = crossing(21, 0, z0, 1.4);
  let moving = true, left = 0;
  return {
    reset(e) { go.reset(e); moving = true; left = 1.5 + 2 * go.rand(); },
    fright: x => go.fright(x), state: () => go.state,
    tick(dt, t) {
      go.tick(dt);
      g.visible = go.on;
      if (!go.on) return;
      left -= dt;
      // dashes of 1.5-3.5 s, stops of 0.6-1.4 s; frightened, one dash out of sight
      if (go.scared) moving = true;
      else if (left <= 0) { moving = !moving; left = moving ? 1.5 + 2 * go.rand() : 0.6 + 0.8 * go.rand(); }
      if (moving) go.advance(dt * 1.4 * go.pace);
      const legs = t * 22 * go.pace, jump = Math.sin(Math.PI * go.startled) * 0.1;   // startled: a jump on the spot
      g.position.set(go.x, jump + (moving && !jump ? Math.abs(Math.sin(legs)) * 0.012 : 0), z0);
      g.rotation.y = go.dir > 0 ? 0 : Math.PI;
      head.rotation.z = moving ? 0 : 0.12 + 0.08 * Math.sin(t * 9);   // sniffing
      feet.forEach((f, i) => { f.position.y = 0.012 + (moving && !jump ? Math.max(0, Math.sin(legs + i * 1.6)) * 0.015 : 0); });
    },
  };
}

// A snow bunny (the winter level): white, long ears, a round tail; hops
// across, now and then sitting a moment, its ears twitching.
function bunny(group) {
  const g = new THREE.Group(), fur = std({ color: '#F6F7F9', roughness: 0.95 }), pink = std({ color: '#E7B3B8', roughness: 0.8 }), black = std({ color: '#111111', roughness: 0.3 });
  const body = new THREE.Group(); g.add(body);
  part(body, ballGeo, fur, [0, 0.13, 0], [0.15, 0.12, 0.11]);
  part(body, ballGeo, fur, [-0.15, 0.13, 0], [0.045, 0.045, 0.045]);      // tail
  part(body, ballGeo, fur, [0.06, 0.04, 0], [0.11, 0.05, 0.09]);           // haunches and feet
  const head = new THREE.Group(); head.position.set(0.14, 0.24, 0); body.add(head);
  part(head, ballGeo, fur, [0, 0, 0], [0.075, 0.07, 0.065]);
  part(head, ballGeo, pink, [0.072, -0.01, 0], [0.01, 0.009, 0.012]);     // nose
  const ears = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(-0.01, 0.05, s * 0.03); head.add(e); part(e, ballGeo, fur, [0, 0.08, 0], [0.022, 0.085, 0.03]); part(e, ballGeo, pink, [0.008, 0.08, 0], [0.012, 0.065, 0.018]); return e; });
  for (const s of [-1, 1]) part(head, ballGeo, black, [0.045, 0.02, s * 0.042], [0.01, 0.011, 0.011]);
  // twice a real one's size, so it reads from the slingshot
  g.scale.setScalar(2);
  group.add(g);
  const z0 = -8, go = crossing(33, 0.3, z0, 0.8);
  let hop = 0, rest = 0;   // into a hop (s); sitting (s left)
  return {
    reset(e) { go.reset(e); hop = 0; rest = 0; },
    fright: x => go.fright(x), state: () => go.state,
    tick(dt, t) {
      go.tick(dt);
      g.visible = go.on;
      if (!go.on) return;
      if (go.scared) rest = 0;
      if (go.startled) {
        // startled: sits up tall, ears straight up, a moment
        hop = 0;
        body.position.y = 0; body.rotation.z = 0.3 * Math.sin(Math.PI * go.startled);
      } else if (rest > 0) {
        rest -= dt;
        body.position.y = 0; body.rotation.z = 0;
      } else {
        // a hop: 0.84 m in 0.34 s, 0.16 m up (body scale), leaning in and out;
        // frightened, the hops come pace times as quick, with no sitting
        const was = hop; hop += dt * go.pace;
        const k = Math.min(1, hop / 0.34);
        go.advance((Math.min(hop, 0.34) - Math.min(was, 0.34)) / 0.34 * 0.84);
        body.position.y = Math.sin(Math.PI * k) * 0.16;
        body.rotation.z = (0.5 - k) * 0.5;
        if (k >= 1) { hop = 0; if (!go.scared && go.rand() < 0.2) rest = 0.6 + 1.2 * go.rand(); }
      }
      g.position.set(go.x, 0, z0);
      g.rotation.y = go.dir > 0 ? 0 : Math.PI;
      head.rotation.z = rest > 0 ? 0.05 * Math.sin(t * 7) : 0;
      // ears: up when startled, laid back running off
      const ear = go.startled ? 0.02 : go.scared ? 0.1 : null;
      ears.forEach((e, i) => {
        e.rotation.x = (i ? 1 : -1) * (ear ?? (0.15 + (rest > 0 ? 0.06 * Math.sin(t * 3 + i) : 0.25)));
        e.rotation.z = go.scared && !go.startled ? 0.9 : 0;
      });
    },
  };
}

// Two birds (the park): flying across together, high over the trees
// beyond, flapping and gliding by turns.
export function birds(group) {
  const make = (col, dz, dy) => {
    const g = new THREE.Group(), body = std({ color: col, roughness: 0.8 }), beak = std({ color: '#E3A21A' });
    part(g, ballGeo, body, [0, 0, 0], [0.14, 0.06, 0.06]);
    part(g, ballGeo, body, [0.13, 0.03, 0], [0.05, 0.045, 0.045]);
    part(g, new THREE.ConeGeometry(0.018, 0.06, 8), beak, [0.2, 0.025, 0]).rotation.z = -Math.PI / 2;
    part(g, new THREE.BoxGeometry(0.1, 0.01, 0.07), body, [-0.16, 0.01, 0]);        // tail
    const wings = [-1, 1].map(s => { const w = new THREE.Group(); w.position.set(0, 0.03, s * 0.04); g.add(w); part(w, new THREE.BoxGeometry(0.13, 0.008, 0.22), body, [0, 0, s * 0.11]); return w; });
    // twice a real one's size, low enough to be seen over the trees beyond
    g.scale.setScalar(2); group.add(g);
    return { g, wings, dz, dy };
  };
  const bs = [make('#3B3F4A', 0, 0), make('#5B4636', -1.2, 0.5)];
  // in the air: no stop when frightened, straight off (and up a little)
  const go = crossing(41, 3.6, -12.5, 2.5, 0);
  // first: the way they set off (the second stays on that side when they turn back)
  let climb = 0, first = go.dir;
  return {
    reset(e) { go.reset(e); climb = 0; first = go.dir; },
    fright: x => go.fright(x), state: () => go.state,
    tick(dt, t) {
      go.tick(dt);
      for (const b of bs) b.g.visible = go.on;
      if (!go.on) return;
      go.advance(dt * 2.6 * go.pace);
      if (go.scared) climb = Math.min(1.5, climb + dt * 0.8);
      bs.forEach((b, i) => {
        const x = go.x - first * i * 1.4;   // the second a little behind
        b.g.position.set(x, 3.6 + b.dy + climb + 0.25 * Math.sin(t * 0.8 + i), -12.5 + b.dz);
        b.g.rotation.y = go.dir > 0 ? 0 : Math.PI;
        const flap = go.scared || (t + i * 0.7) % 3 < 1.6;   // flapping, then a glide; frightened, flapping hard
        b.wings.forEach((w, k) => { w.rotation.x = (k ? -1 : 1) * (flap ? 0.7 * Math.sin(t * (go.scared ? 20 : 13) + i) : 0.12); });
      });
    },
  };
}

/* ---------- effects ---------- */

// Shards of ice flying from where a block shattered; water bursting from a
// barrel, a dark wet patch growing where it lands, and a few staves.
function makeEffects(group, blockMats, S) {
  const MAX = 400, live = [];
  const shardGeo = new THREE.TetrahedronGeometry(1, 0);
  const shardMat = blockMats.ice ? blockMats.ice.clone() : std({ color: '#C9A27A' });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, MAX); shards.count = 0; shards.frustumCulled = false; shards.castShadow = true; group.add(shards);
  // glowing shards: each the colour of the block it was (developer: "the fragments matching the color of the glow")
  const sparks = new THREE.InstancedMesh(shardGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), MAX);
  sparks.count = 0; sparks.frustumCulled = false; group.add(sparks);
  const spark = new THREE.Color();
  const dropGeo = new THREE.SphereGeometry(1, 6, 4), dropMat = new THREE.MeshStandardMaterial({ color: '#9FD3F5', transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.5 });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, MAX); drops.count = 0; drops.frustumCulled = false; group.add(drops);
  const staveMat = blockMats.barrel ? blockMats.barrel[0] : std({ color: '#7A5A3A' }), staveGeo = new THREE.BoxGeometry(0.07, 0.6, 0.02);
  const patches = [], pieces = [];
  const o = new THREE.Object3D();
  function burst(b, at, q, v) {
    const r = rng(Math.floor(at[0] * 1000 + at[2] * 7777) >>> 0);
    if (b.mat === 'ice' || b.mat === 'glow') {
      const n = Math.min(b.mat === 'glow' ? 40 : 30, Math.round(12 + 60 * b.w * b.h * b.d / 0.02)), kind = b.mat === 'glow' ? 'spark' : 'shard';
      for (let i = 0; i < n; i++) live.push({ kind, c: b.c || '#FFFFFF', p: [at[0] + (r() - 0.5) * b.w, at[1] + (r() - 0.5) * b.h, at[2] + (r() - 0.5) * b.d], v: [v[0] * 0.5 + (r() - 0.5) * 3, v[1] * 0.5 + r() * 2.5, v[2] * 0.5 + (r() - 0.5) * 3], s: 0.02 + r() * 0.05, spin: [r() * 6, r() * 6, r() * 6], t: 0, life: 1.6 + r() * 0.8 });
    } else if (b.mat === 'barrel') {
      for (let i = 0; i < 150; i++) { const a = r() * Math.PI * 2, sp = 1 + r() * 3.2; live.push({ kind: 'drop', p: [at[0] + Math.cos(a) * b.r * 0.6, at[1] + (r() - 0.3) * b.h * 0.5, at[2] + Math.sin(a) * b.r * 0.6], v: [Math.cos(a) * sp + v[0] * 0.3, 1 + r() * 3, Math.sin(a) * sp + v[2] * 0.3], s: 0.035 + r() * 0.045, t: 0, life: 1.2 + r() * 0.5 }); }
      const patch = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: '#5A3B22', transparent: true, opacity: 0, roughness: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6 }));
      patch.rotation.x = -Math.PI / 2; patch.position.set(at[0], 0.004, at[2]); patch.scale.setScalar(0.01); patch.receiveShadow = true; group.add(patch);
      patches.push({ m: patch, t: 0, size: 0.6 + b.h * 0.9 });
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(staveGeo, staveMat); m.castShadow = true; const a = r() * Math.PI * 2;
        m.position.set(at[0] + Math.cos(a) * b.r, at[1], at[2] + Math.sin(a) * b.r); group.add(m);
        pieces.push({ m, v: [Math.cos(a) * (1 + r() * 2), 1.5 + r() * 2, Math.sin(a) * (1 + r() * 2)], spin: [r() * 8, r() * 8, r() * 8], t: 0 });
      }
    }
    while (live.length > MAX) live.shift();
  }
  function tick(dt) {
    let ns = 0, nd = 0, nk = 0;
    for (let i = live.length - 1; i >= 0; i--) {
      const e = live[i]; e.t += dt;
      if (e.t > e.life) { live.splice(i, 1); continue; }
      e.v[1] -= 9.82 * dt;
      for (let k = 0; k < 3; k++) e.p[k] += e.v[k] * dt;
      if (e.p[1] < e.s * 0.5) { e.p[1] = e.s * 0.5; if (e.kind === 'drop') { e.life = Math.min(e.life, e.t + 0.05); } else { e.v[1] *= -0.3; e.v[0] *= 0.6; e.v[2] *= 0.6; } }
    }
    for (const e of live) {
      const fade = Math.min(1, (e.life - e.t) / 0.4);
      o.position.set(...e.p); o.scale.setScalar(e.s * fade);
      if (e.kind === 'shard') { o.rotation.set(e.spin[0] * e.t, e.spin[1] * e.t, e.spin[2] * e.t); o.updateMatrix(); shards.setMatrixAt(ns++, o.matrix); }
      else if (e.kind === 'spark') { o.rotation.set(e.spin[0] * e.t, e.spin[1] * e.t, e.spin[2] * e.t); o.updateMatrix(); sparks.setMatrixAt(nk, o.matrix); sparks.setColorAt(nk++, spark.set(e.c)); }
      else { o.rotation.set(0, 0, 0); o.updateMatrix(); drops.setMatrixAt(nd++, o.matrix); }
    }
    shards.count = ns; drops.count = nd; sparks.count = nk;
    shards.instanceMatrix.needsUpdate = true; drops.instanceMatrix.needsUpdate = true; sparks.instanceMatrix.needsUpdate = true;
    if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
    for (const p of patches) { p.t += dt; const k = Math.min(1, p.t / 0.9); p.m.scale.setScalar(Math.max(0.01, p.size * Math.sqrt(k))); p.m.material.opacity = 0.42 * k; }
    for (const p of pieces) {
      if (p.m.position.y <= 0.012 && p.t > 0.1) continue;
      p.t += dt; p.v[1] -= 9.82 * dt;
      p.m.position.x += p.v[0] * dt; p.m.position.y = Math.max(0.012, p.m.position.y + p.v[1] * dt); p.m.position.z += p.v[2] * dt;
      if (p.m.position.y <= 0.012) { p.m.rotation.set(-Math.PI / 2, p.m.rotation.y, 0); } else p.m.rotation.set(p.spin[0] * p.t, p.spin[1] * p.t, p.spin[2] * p.t);
    }
  }
  function clear() {
    live.length = 0; shards.count = 0; drops.count = 0; sparks.count = 0;
    for (const p of patches) { group.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); }
    for (const p of pieces) group.remove(p.m);
    patches.length = 0; pieces.length = 0;
  }
  return { burst, tick, clear, get live() { return live.length; } };
}
