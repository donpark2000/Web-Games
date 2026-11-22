// The Topple Lab's photographed models, drawn (2026-11-22): each a small JSON
// of triangles (src/core/model-data.js) and three pictures (colour, normal,
// arm: ambient occlusion, roughness and metalness), in topple-lab/data/models/
// (sources and licence: its CREDITS.md). Loaded once each; scenery only (the
// physics has none of them).

import * as THREE from '../vendor/three/three.module.min.js';
import { decodeModel } from '../core/model-data.js';

export const MODEL_DIR = 'data/models/';
// Each model: its file's name and its pictures' (the same unless `tex`).
export const MODELS = {
  barrier: 'concrete_road_barrier',
  cement: 'cement_bag',
  barrelBlue: 'barrel_03',
  boulderA: 'namaqualand_boulder_03',
  boulderB: 'namaqualand_boulder_04',
  boulderC: 'namaqualand_boulder_05',
};

const loader = new THREE.TextureLoader();
const made = new Map();   // name -> Promise<{ geo, mat, size, tris }>
function texture(file, colour) {
  return new Promise((ok, fail) => loader.load(MODEL_DIR + file, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    ok(t);
  }, undefined, () => fail(new Error(`${file} not loaded`))));
}
async function make(name) {
  const file = MODELS[name];
  const r = await fetch(`${MODEL_DIR}${file}.json`);
  if (!r.ok) throw new Error(`${file}.json not loaded`);
  const d = decodeModel(await r.json());
  const [col, nor, arm] = await Promise.all([texture(`${file}_col.jpg`, true), texture(`${file}_nor.jpg`), texture(`${file}_arm.jpg`)]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(d.uv, 2));
  geo.setIndex(new THREE.BufferAttribute(d.index, 1));
  geo.computeBoundingSphere();
  const mat = new THREE.MeshStandardMaterial({ map: col, normalMap: nor, aoMap: arm, roughnessMap: arm, metalnessMap: arm, roughness: 1, metalness: 1 });
  return { geo, mat, size: d.size, tris: d.index.length / 3 };
}
// The model `name`, loaded (the same one each time; a load that failed is
// forgotten, so the next scene tries again).
export function loadModel(name) {
  if (!made.has(name)) made.set(name, make(name).catch(e => { made.delete(name); throw e; }));
  return made.get(name);
}
export const loadModels = async names => Object.fromEntries(await Promise.all(names.map(async n => [n, await loadModel(n)])));

// A soft shade on the ground under things out of the sun's shadow (the shadows
// cover only what's in play): at: [{ x, z, w, d, yaw }], one mesh.
let shadeTex = null;
export function contacts(at, a = 0.5) {
  if (!shadeTex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    shadeTex = new THREE.CanvasTexture(cv);
  }
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: shadeTex, transparent: true, opacity: a, depthWrite: false }), at.length), o = new THREE.Object3D();
  at.forEach((c, i) => { o.position.set(c.x, 0.006, c.z); o.rotation.set(0, c.yaw ?? 0, 0); o.scale.set(c.w, 1, c.d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.computeBoundingSphere();
  return im;
}

// Copies of a model as one mesh: at: [{ x, y, z, yaw, s (its size times), tilt }].
export function copies(model, at, { cast = true, receive = true, mat = model.mat } = {}) {
  const im = new THREE.InstancedMesh(model.geo, mat, at.length), o = new THREE.Object3D();
  at.forEach((a, i) => {
    o.position.set(a.x, a.y ?? 0, a.z); o.rotation.set(a.tilt ?? 0, a.yaw ?? 0, a.roll ?? 0, 'YXZ');
    o.scale.set(...(Array.isArray(a.s) ? a.s : [a.s ?? 1, a.s ?? 1, a.s ?? 1])); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  });
  im.castShadow = cast; im.receiveShadow = receive;
  im.computeBoundingSphere();
  return im;
}
