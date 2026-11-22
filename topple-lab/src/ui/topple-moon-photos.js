// The Topple Lab's moon in photos (2026-11-22, journal "The lab's moon"):
// the pictures (topple-lab/data/moon/, its CREDITS.md) and models, and the
// materials and shapes made of them for topple-moon.js and
// topple-moon-looks.js: the ground (a photo of moon dust over a map of
// craters, hills far off), panelled metal, rock, foil, solar cells, the Earth.

import * as THREE from '../vendor/three/three.module.min.js';
import { triplanar, smooth } from './topple-tri.js';
import { loadModels } from './topple-models.js';
import { groundHeight } from '../core/moon-ground.js';

export const MOON_DIR = 'data/moon/';
const FILES = { dustCol: ['moon_01_col.jpg', 1], dustNor: ['moon_01_nor.jpg'], craters: ['craters.jpg'], plateCol: ['plate_col.jpg', 1], plateNor: ['plate_nor.jpg'], solar: ['solarpanel003_col.jpg', 1], foilNor: ['foil002_nor.jpg'], earth: ['earth.jpg', 1] };
// The rock's photo is levels 3 and 5's (data/levels/).
const ROCK = ['data/levels/rock_boulder_dry_col.jpg', 'data/levels/rock_boulder_dry_nor.jpg'];

const loader = new THREE.TextureLoader();
const load = (url, colour) => new Promise((ok, fail) => loader.load(url, t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace; ok(t);
}, undefined, () => fail(new Error(`${url} not loaded`))));

// Everything the moon is drawn in: rejects if a picture doesn't load (the moon
// is drawn plain then).
export async function moonPhotos(renderer) {
  const t0 = performance.now();
  const [tex, rockCol, rockNor, models] = await Promise.all([
    Promise.all(Object.entries(FILES).map(async ([k, [f, colour]]) => [k, await load(MOON_DIR + f, colour)])).then(Object.fromEntries),
    load(ROCK[0], true), load(ROCK[1]),
    loadModels(['moonRockA', 'moonRockB', 'moonRockC', 'drum']),
  ]);
  const env = environment(renderer);
  // the rock's photo with most of its colour taken out (the moon is grey)
  const rockGrey = (() => {
    const i = rockCol.image, c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const g = c.getContext('2d'); g.filter = 'saturate(0.22) brightness(1.15)'; g.drawImage(i, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  // the ground: depth m from front to back with its middle at z; hills past `from` m (0: none)
  function ground({ width = 80, depth = 80, z = -20, from = 0 }) {
    const seg = from ? [60, 44] : [1, 1];
    const geo = new THREE.PlaneGeometry(width, depth, ...seg).rotateX(-Math.PI / 2).translate(0, 0, z);
    if (from) {
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, groundHeight(p.getX(i), p.getZ(i), from));
      geo.computeVertexNormals();
    }
    const mat = new THREE.MeshStandardMaterial({ color: '#ACADB0', roughness: 1, metalness: 0 });
    mat.onBeforeCompile = s => {
      Object.assign(s.uniforms, { gCol: { value: tex.dustCol }, gNor: { value: tex.dustNor }, gMap: { value: tex.craters } });
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vG;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvG = (modelMatrix * vec4(position, 1.0)).xyz;');
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vG; uniform sampler2D gCol, gNor, gMap;')
        .replace('#include <map_fragment>', `
          vec2 gP = vec2(vG.x, vG.z);
          vec3 gM = texture2D(gMap, gP / 48.0 + 0.5).rgb;
          float gNear = 1.0 - smoothstep(9.0, 34.0, -vViewPosition.z * -1.0);
          diffuseColor.rgb *= texture2D(gCol, gP / 3.1).rgb * 2.5 * (0.55 + 0.9 * gM.b);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          {
            vec2 slope = (gM.rg * 2.0 - 1.0) * 1.5;
            #ifndef GROUND_PLAIN
              slope += (texture2D(gNor, gP / 3.1).xy * 2.0 - 1.0) * 0.85 * gNear;
            #endif
            normal = normalize(normal + mat3(viewMatrix) * vec3(slope.x, 0.0, slope.y));
          }`);
    };
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = true;
    return m;
  }

  // panelled, worn metal in `color` (the panels' own light and dark greys)
  const plate = (color, { size = 1.5, ...opts } = {}) => triplanar(tex.plateCol, tex.plateNor, size, { roughness: 0.5, metalness: 0.2, ...opts, color: new THREE.Color(color).multiplyScalar(1.35) });
  const rock = (color = '#9A968F', size = 1.0) => triplanar(rockGrey, rockNor, size, { color: new THREE.Color(color).multiplyScalar(1.25), roughness: 0.96, bump: 1.1 });
  const foil = () => { const n = tex.foilNor.clone(); n.repeat.set(3, 1); n.needsUpdate = true; return new THREE.MeshStandardMaterial({ color: '#E0AE45', metalness: 1, roughness: 0.32, normalMap: n, normalScale: new THREE.Vector2(1.3, 1.3), envMap: env, envMapIntensity: 1.5 }); };
  const glass = (color = '#9FD8FF') => new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.06, envMap: env, envMapIntensity: 1.6 });
  const chrome = (color = '#9AA3AD', roughness = 0.24) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, envMap: env, envMapIntensity: 1.2 });
  // solar cells, `n` by `m` of them, under a frame drawn round the edge
  const solar = (n = 4, m = 4) => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), im = tex.solar.image, w = im.width * n / 8, h = im.height * m / 8;
    g.drawImage(im, 0, 0, Math.min(w, im.width), Math.min(h, im.height), 0, 0, 256, 256);
    g.strokeStyle = '#B9BEC6'; g.lineWidth = 12; g.strokeRect(0, 0, 256, 256); g.strokeStyle = '#6E747E'; g.lineWidth = 3; g.strokeRect(7, 7, 242, 242);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map: t, color: '#FFFFFF', roughness: 0.22, metalness: 0.45, envMap: env, envMapIntensity: 0.8 });
  };
  // a drawn picture (a crate's or tank's markings) worn: the panels' light and dark over it, dust low down, scratches
  function worn(canvas, { dust = 0.35, scratches = 30, seed = 3 } = {}) {
    const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    let s = seed * 7919; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.75; g.filter = 'brightness(1.25)'; g.drawImage(tex.plateCol.image, 0, 0, w, h); g.restore();
    for (let i = 0; i < scratches; i++) { g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.28)' : 'rgba(40,38,36,.3)'; g.lineWidth = 0.5 + r(); const x = r() * w, y = r() * h, a = r() * 6.3, l = 3 + r() * w * 0.12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const gr = g.createLinearGradient(0, h, 0, h * 0.55); gr.addColorStop(0, `rgba(120,116,110,${dust})`); gr.addColorStop(1, 'rgba(120,116,110,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // a material of a drawn, worn picture over the panels' bumps
  const painted = (map, { wear, ...opts } = {}) => { worn(map.image, wear); map.needsUpdate = true; const n = tex.plateNor.clone(); n.repeat.set(0.4, 0.4); n.needsUpdate = true; return new THREE.MeshStandardMaterial({ map, normalMap: n, roughness: 0.5, metalness: 0.2, ...opts }); };
  // a boulder's shape about r across its middle: a ball in lumps and flats, smooth (r seeded by `rand`)
  function boulder(R, rand, detail = 5) {
    const geo = new THREE.IcosahedronGeometry(R, detail), p = geo.attributes.position, v = new THREE.Vector3();
    const waves = Array.from({ length: 6 }, () => [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1, 1.5 + rand() * 3.5, rand() * 6.3]);
    const cuts = Array.from({ length: 5 }, () => [new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize(), 0.86 + rand() * 0.08]);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).divideScalar(R);
      let k = 1 + 0.035 * waves.reduce((t, [a, b, c, f, ph]) => t + Math.sin(f * (a * v.x + b * v.y + c * v.z) * 2 + ph), 0) / 2;
      for (const [n, d] of cuts) { const q = v.dot(n) * k; if (q > d) k *= d / q + (1 - d / q) * 0.15; }
      p.setXYZ(i, v.x * R * k, v.y * R * k, v.z * R * k);
    }
    return smooth(geo);
  }
  // the fuel drum's shape, w across and h tall, its middle at 0
  const drums = new Map();
  function drumGeo(w, h) {
    const key = `${w.toFixed(3)},${h.toFixed(3)}`;
    if (!drums.has(key)) { const [sx, sy, sz] = models.drum.size, g = models.drum.geo.clone(); g.scale(w / sx, h / sy, w / sz); g.translate(0, -h / 2, 0); g.computeBoundingSphere(); drums.set(key, g); }
    return drums.get(key);
  }
  // the Earth: its photo, lit by the sun, a thin blue air round it
  function earth(r) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ map: tex.earth, roughness: 0.75, metalness: 0, emissive: '#0A1830', emissiveIntensity: 0.6 }));
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 92, 128, 128, 128);
    gr.addColorStop(0, 'rgba(110,170,255,0)'); gr.addColorStop(0.12, 'rgba(120,180,255,.55)'); gr.addColorStop(0.4, 'rgba(90,150,255,.16)'); gr.addColorStop(1, 'rgba(80,140,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const air = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    air.scale.setScalar(r * 2 * 128 / 96); m.add(air);
    return m;
  }
  // a flame: a soft streak of light, white-hot at its root, along -y from 0
  let flameTex = null;
  function flame(width, length, colour = '#9FDCFF') {
    if (!flameTex) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 128;
      const g = c.getContext('2d'), im = g.createImageData(64, 128), d = im.data;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { const v = y / 127, half = 0.16 + 0.3 * Math.sqrt(v) * (1 - v * 0.7), q = Math.abs(x / 63 - 0.5) / half, k = Math.max(0, 1 - q * q) * Math.pow(1 - v, 1.4), hot = Math.max(0, 1 - v * 2.4) * Math.max(0, 1 - q * 1.6), i = (y * 64 + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255 * Math.min(1, k * 0.8 + hot); d[i + 3] = 255 * Math.min(1, k + hot); }
      g.putImageData(im, 0, 0); flameTex = new THREE.CanvasTexture(c); flameTex.colorSpace = THREE.SRGBColorSpace;
    }
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ map: flameTex, color: colour, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (const a of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(width, length).translate(0, -length / 2, 0), mat); m.rotation.y = a; g.add(m); }
    return g;
  }

  return {
    tex, env, models, ground, plate, rock, foil, glass, chrome, solar, painted, boulder, drumGeo, drumMat: models.drum.mat, earth, flame, smooth,
    files: Object.keys(FILES).length + ROCK.length, ms: Math.round(performance.now() - t0),
  };
}

// What shiny things on the moon reflect: a black sky, a bright sun, grey dust below.
function environment(renderer) {
  const s = new THREE.Scene();
  const ball = (r, colour, at) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide })); m.position.set(...at); s.add(m); return m; };
  s.background = new THREE.Color('#05070C');
  const dust = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshBasicMaterial({ color: '#6E6C69', side: THREE.DoubleSide })); dust.rotation.x = -Math.PI / 2; dust.position.y = -3; s.add(dust);
  ball(3.2, new THREE.Color(9, 8.8, 8.2), [13, 19, 11]);
  ball(2.4, '#5C86C8', [-14, 12, -20]);
  const pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(s, 0.03).texture;
  pm.dispose(); s.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  return env;
}
