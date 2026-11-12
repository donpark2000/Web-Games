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
  3: { name: 'snow', sky: 'lago_disola', ground: 'snow', surfaces: ['snow', 'bark', 'planks', 'steel'],
    mats: { ice: 'ice', wood: 'planks' }, sling: 'planks', sun: [-1.2, 4.2, 2.6], hemi: 0.8 },
  4: { name: 'desert', sky: 'goegap', ground: 'sand', surfaces: ['sand', 'barrel', 'timber', 'rock', 'planks', 'steel'],
    mats: { wood: 'timber', barrel: 'barrel' }, sling: 'planks', sun: [1.6, 4.4, 2.4], hemi: 0.75 },
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
  // the sky: the photo all round; it lights the shiny parts too
  const bg = skyTex.clone(); bg.mapping = THREE.EquirectangularReflectionMapping; bg.colorSpace = THREE.SRGBColorSpace; bg.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(ctx.renderer), env = pm.fromEquirectangular(bg).texture; pm.dispose();
  const horizon = horizonColour(skyTex.image);
  const group = new THREE.Group();
  const out = {
    level: n, name: S.name, group, background: bg, environment: env, fog: new THREE.Fog(horizon, 60, 250), hemi: S.hemi, sun: S.sun, horizon,
    files: 0, ms: 0,
  };

  // block materials: a photo surface on uv1 (worldUV), or ice
  const blockMats = {};
  for (const [mat, sk] of Object.entries(S.mats)) {
    if (sk === 'ice') blockMats.ice = iceMat();
    else if (sk === 'barrel') blockMats.barrel = barrelMats(maps.barrel, maps.timber);
    else blockMats[mat] = photoMat(maps[sk], { channel: 1, extra: sk === 'steel' ? { envMapIntensity: 1.2 } : {} });
  }
  out.blockMat = b => blockMats[b.mat] ?? blockMats.wood ?? std({ color: '#999' });
  out.prepare = (geo, b, i) => { if (b.shape !== 'cyl' && b.mat !== 'ice') worldUV(geo, b.w, b.h, b.d, SURFACES[S.mats[b.mat]]?.size ?? 1, n * 1000 + i + 1, b.mat === 'wood' && b.h > b.w); };
  out.blockGeo = b => (b.shape === 'cyl' ? barrelGeo(b.r, b.h) : new THREE.BoxGeometry(b.w, b.h, b.d));

  // the iron ball: rusty steel, darkened, with its lifting ring
  out.ballMat = photoMat(maps.steel, { repeat: [0.3, 0.3], extra: { color: '#6A6F76', metalness: 0.7, envMapIntensity: 1.1 } });
  out.slingMat = photoMat(maps.planks, { repeat: [0.15, 0.6], extra: { color: '#C9A27A' } });

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
    const g = mesh(new THREE.CircleGeometry(R, 64), photoMat(maps[S.ground], { repeat: [2 * R / sk.size, 2 * R / sk.size], extra: { alphaMap: fadeTex(), transparent: true, metalness: 0, ...(S.ground === 'snow' ? { color: '#F4F8FC' } : { color: '#E8C9A0' }) } }), [0, 0, -6], { cast: false });
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
    drift(p) {
      // a heap of snow, lopsided, in the snow's own photo
      const hf = heapShape(p.rx, p.rz, p.H, p.seed);
      const m = mesh(heapGeo(hf, p.rx, p.rz, 0, [40, 30]), photoMat(maps.snow, { repeat: [p.rx, p.rz], extra: { color: '#F7FAFD', metalness: 0 } }));
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
    for (const [px, pz, s] of [[-8, -15, 1.3], [-10.5, -18, 1.6], [9.5, -17, 1.4], [12, -21, 1.8]]) {
      const tiers = [[1.4, 0.8], [2.2, 0.62], [2.9, 0.45], [3.4, 0.3]].map(([y, r]) => ({ r: r * s, at: [px, y * s, pz] }));
      group.add(builders.pine({ at: [px, 0, pz], r: 0.12 * s, h: 3.9 * s, tiers }));
    }
  } else if (S.name === 'desert') {
    // boulders off to the sides (the photo's rock formations beyond), and a rattlesnake on the move
    // (first drawn smooth and tinted orange, they looked like tomatoes: rougher, the photo's own colour, more of it)
    const rock = photoMat(maps.rock, { repeat: [3.5, 3.5], extra: { color: '#E8D6C2', metalness: 0 } });
    for (const [rx, rz, s, seed] of [[-7.5, -12, 1.6, 3], [8.5, -14, 2.2, 5], [5, -21, 2.8, 7], [-12, -19, 3.2, 9], [-4.5, -9.5, 0.7, 11]]) {
      const geo = new THREE.IcosahedronGeometry(1, 4), q = geo.attributes.position, r = rng(seed);
      const bumps = Array.from({ length: 9 }, () => [r() * 2 - 1, r() * 0.8 - 0.1, r() * 2 - 1, (r() - 0.35) * 0.5, 2 + r() * 6]);
      // crisp planes, as weathered rock breaks: a few flat cuts
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
      const m = mesh(geo, rock, [rx, s * 0.25, rz]);
      m.scale.setScalar(s); m.rotation.y = seed;
      group.add(m);
    }
    decor.push(snake(group));
  }

  /* ---------- effects: ice shattering, a barrel bursting ---------- */
  const fx = makeEffects(group, blockMats, S);
  out.burst = (b, at, q, v) => fx.burst(b, at, q, v);
  out.tick = (dt, t) => { fx.tick(dt); for (const d of decor) d.tick(dt, t); };
  out.clearEffects = () => fx.clear();
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

/* ---------- the rattlesnake (decor: out of the ball's way, behind the structure) ---------- */

// A chain of spheres down to the tail, banded tan and brown, sliding along
// in S-curves, across and back.
function snake(group) {
  const N = 34, geo = new THREE.SphereGeometry(1, 12, 8), mat = std({ roughness: 0.6 });
  const im = new THREE.InstancedMesh(geo, mat, N), o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < N; i++) im.setColorAt(i, c.set(i === 0 ? '#7A5A3A' : (Math.floor(i / 2) % 2 ? '#6B4A2E' : '#C9A274')));
  im.castShadow = true; im.receiveShadow = true;
  group.add(im);
  const eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 6, 4), std({ color: '#111' }), 2); group.add(eyes);
  let x = 1.8, dir = 1;
  const z0 = -8.4;
  return {
    tick(dt, t) {
      x += dir * dt * 0.12;
      if (x > 4.5) dir = -1; else if (x < 1.2) dir = 1;
      for (let i = 0; i < N; i++) {
        const s = i * 0.045, px = x - dir * s, r = i === 0 ? 0.042 : 0.036 * (1 - i / N * 0.75);
        o.position.set(px, r * 0.8, z0 + 0.12 * Math.sin(px * 7 - t * 2.4 * dir)); o.scale.setScalar(r); o.scale.x = r * 1.3; o.updateMatrix(); im.setMatrixAt(i, o.matrix);
        if (i === 0) for (const k of [0, 1]) { o.position.set(px + dir * 0.03, r * 1.25, o.position.z + (k ? 0.022 : -0.022)); o.scale.setScalar(1); o.updateMatrix(); eyes.setMatrixAt(k, o.matrix); }
      }
      im.instanceMatrix.needsUpdate = true; eyes.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ---------- effects ---------- */

// Shards of ice flying from where a block shattered; water bursting from a
// barrel, a dark wet patch growing where it lands, and a few staves.
function makeEffects(group, blockMats, S) {
  const MAX = 240, live = [];
  const shardGeo = new THREE.TetrahedronGeometry(1, 0);
  const shardMat = blockMats.ice ? blockMats.ice.clone() : std({ color: '#C9A27A' });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, MAX); shards.count = 0; shards.frustumCulled = false; shards.castShadow = true; group.add(shards);
  const dropGeo = new THREE.SphereGeometry(1, 6, 4), dropMat = new THREE.MeshStandardMaterial({ color: '#9FD3F5', transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.5 });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, MAX); drops.count = 0; drops.frustumCulled = false; group.add(drops);
  const staveMat = blockMats.barrel ? blockMats.barrel[0] : std({ color: '#7A5A3A' }), staveGeo = new THREE.BoxGeometry(0.07, 0.6, 0.02);
  const patches = [], pieces = [];
  const o = new THREE.Object3D();
  function burst(b, at, q, v) {
    const r = rng(Math.floor(at[0] * 1000 + at[2] * 7777) >>> 0);
    if (b.mat === 'ice') {
      const n = Math.min(30, Math.round(12 + 60 * b.w * b.h * b.d / 0.02));
      for (let i = 0; i < n; i++) live.push({ kind: 'shard', p: [at[0] + (r() - 0.5) * b.w, at[1] + (r() - 0.5) * b.h, at[2] + (r() - 0.5) * b.d], v: [v[0] * 0.5 + (r() - 0.5) * 3, v[1] * 0.5 + r() * 2.5, v[2] * 0.5 + (r() - 0.5) * 3], s: 0.02 + r() * 0.05, spin: [r() * 6, r() * 6, r() * 6], t: 0, life: 1.6 + r() * 0.8 });
    } else if (b.mat === 'barrel') {
      for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, sp = 1 + r() * 3.2; live.push({ kind: 'drop', p: [at[0] + Math.cos(a) * b.r * 0.6, at[1] + (r() - 0.3) * b.h * 0.5, at[2] + Math.sin(a) * b.r * 0.6], v: [Math.cos(a) * sp + v[0] * 0.3, 1 + r() * 3, Math.sin(a) * sp + v[2] * 0.3], s: 0.018 + r() * 0.03, t: 0, life: 1.2 + r() * 0.5 }); }
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
    let ns = 0, nd = 0;
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
      else { o.rotation.set(0, 0, 0); o.updateMatrix(); drops.setMatrixAt(nd++, o.matrix); }
    }
    shards.count = ns; drops.count = nd;
    shards.instanceMatrix.needsUpdate = true; drops.instanceMatrix.needsUpdate = true;
    for (const p of patches) { p.t += dt; const k = Math.min(1, p.t / 0.9); p.m.scale.setScalar(Math.max(0.01, p.size * Math.sqrt(k))); p.m.material.opacity = 0.42 * k; }
    for (const p of pieces) {
      if (p.m.position.y <= 0.012 && p.t > 0.1) continue;
      p.t += dt; p.v[1] -= 9.82 * dt;
      p.m.position.x += p.v[0] * dt; p.m.position.y = Math.max(0.012, p.m.position.y + p.v[1] * dt); p.m.position.z += p.v[2] * dt;
      if (p.m.position.y <= 0.012) { p.m.rotation.set(-Math.PI / 2, p.m.rotation.y, 0); } else p.m.rotation.set(p.spin[0] * p.t, p.spin[1] * p.t, p.spin[2] * p.t);
    }
  }
  function clear() {
    live.length = 0; shards.count = 0; drops.count = 0;
    for (const p of patches) { group.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); }
    for (const p of pieces) group.remove(p.m);
    patches.length = 0; pieces.length = 0;
  }
  return { burst, tick, clear, get live() { return live.length; } };
}
