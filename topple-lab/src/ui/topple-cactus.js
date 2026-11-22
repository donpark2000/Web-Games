// The Topple Lab's saguaro, drawn (2026-11-22): a ribbed trunk and two arms
// round the physics' shapes (the trunk's cylinder, each arm's elbow and
// upright), grooves in shade, a weathered skin, corky at its foot, and tufts
// of spines along every rib (one instanced mesh of small cards).

import * as THREE from '../vendor/three/three.module.min.js';
import { rng } from '../core/topple.js';
import { RIBS, rib, ribR } from '../core/cactus.js';   // (the lab's own)

function canvas(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
let skin = null, tuft = null, tuftGeo = null;
// The skin: waxy grey-green, mottled, with scars and pale scratches (the ribs' shade is in the corners' colours).
const skinMat = () => skin ??= new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.62, metalness: 0,
  map: canvas(256, 256, (g, w, h) => {
    const r = rng(17);
    g.fillStyle = '#7C8F63'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = ['rgba(70,92,52,.18)', 'rgba(150,160,112,.16)', 'rgba(96,112,74,.2)', 'rgba(122,118,80,.13)'][Math.floor(r() * 4)]; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 12, 1 + r() * 5, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(112,92,62,.55)'; g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 4, 2 + r() * 7, r() * 0.5, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(200,200,160,.25)'; for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; g.lineWidth = 0.6 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 12, y + r() * 22); g.stroke(); }
  }, [3, 2]),
});
// A tuft: a pale woolly spot with a dozen spines out of it.
const tuftMat = () => tuft ??= new THREE.MeshStandardMaterial({
  alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9,
  map: canvas(64, 64, (g, w, h) => {
    const r = rng(8);
    g.fillStyle = 'rgba(214,198,160,0)'; g.fillRect(0, 0, w, h);
    g.lineCap = 'round';
    for (let i = 0; i < 15; i++) { const a = i / 15 * 6.283 + r() * 0.3, l = 15 + r() * 15; g.strokeStyle = ['#D6C9A0', '#B5A272', '#7F6C46'][Math.floor(r() * 3)]; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.cos(a) * l, h / 2 + Math.sin(a) * l); g.stroke(); }
    g.fillStyle = '#B9AB82'; g.beginPath(); g.arc(w / 2, h / 2, 5, 0, 7); g.fill();
  }),
});

const shadeOf = (a, f) => {   // the corner's colour at angle a, f up (0-1): grooves dark, ridges light, the foot corky
  const k = 0.42 + 0.68 * Math.pow(rib(a), 0.7), cork = Math.max(0, 1 - f / 0.16);
  return [k * (1 + 0.15 * cork), k * (1 - 0.22 * cork), k * (1 - 0.3 * cork)];
};
// An upright ribbed stem h tall, radius r, rounded at its top, from (0, 0, 0).
function stem(r, h, foot) {
  const rows = 8, cap = 5, seg = RIBS * 4, pos = [], col = [], uv = [], idx = [];
  const prof = [];
  for (let i = 0; i <= rows; i++) { const f = i / rows; prof.push([f * (h - r), r * (foot ? 0.93 + 0.1 * Math.sin(Math.PI * Math.min(1, f * 1.1)) : 1)]); }
  for (let i = 1; i <= cap; i++) { const a = i / cap * Math.PI / 2; prof.push([h - r + r * Math.sin(a), Math.max(0.002, (foot ? 0.93 : 1) * r * Math.cos(a))]); }
  prof.forEach(([y, q], j) => { for (let k = 0; k <= seg; k++) { const a = k / seg * 2 * Math.PI, R = q * (j > rows + cap - 2 ? 1 : ribR(a)); pos.push(Math.cos(a) * R, y, Math.sin(a) * R); col.push(...shadeOf(a, foot ? y / h : 1)); uv.push(k / seg, y / (r * 6)); } });
  for (let j = 0; j < prof.length - 1; j++) for (let k = 0; k < seg; k++) { const a = j * (seg + 1) + k, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  return geometry(pos, col, uv, idx);
}
// A ribbed tube along `curve`, radius r.
function bend(curve, r) {
  const n = 10, seg = RIBS * 4, fr = curve.computeFrenetFrames(n), pos = [], col = [], uv = [], idx = [], p = new THREE.Vector3();
  for (let j = 0; j <= n; j++) {
    curve.getPointAt(j / n, p);
    const q = r * (0.82 + 0.18 * Math.min(1, j / n * 3));
    for (let k = 0; k <= seg; k++) { const a = k / seg * 2 * Math.PI, R = q * ribR(a), N = fr.normals[j], B = fr.binormals[j]; pos.push(p.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * R, p.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * R, p.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * R); col.push(...shadeOf(a, 1)); uv.push(k / seg, j / n * 2); }
  }
  for (let j = 0; j < n; j++) for (let k = 0; k < seg; k++) { const a = j * (seg + 1) + k, b = a + seg + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  return geometry(pos, col, uv, idx);
}
function geometry(pos, col, uv, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// The saguaro of a scene's cactus { at, r, h, arms: [{ x, z, y0, y1, r, a, out }] }.
export function saguaro(p) {
  const g = new THREE.Group(), [x, , z] = p.at, mat = skinMat(), tufts = [];
  const add = (geo, at) => { const m = new THREE.Mesh(geo, mat); m.position.set(...at); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const rows = (cx, y0, y1, cz, r) => { for (let k = 0; k < RIBS; k++) { const a = k * 2 * Math.PI / RIBS; for (let y = y0 + (k % 2) * 0.045; y < y1; y += 0.11) tufts.push([cx, y, cz, a, r * ribR(a)]); } };
  add(stem(p.r, p.h, true), [x, 0, z]);
  rows(x, 0.35, p.h - p.r * 0.7, z, p.r * 0.99);
  for (const a of p.arms) {
    const from = new THREE.Vector3(x + Math.cos(a.a) * p.r * 0.6, a.y0 - a.out * 0.5, z + Math.sin(a.a) * p.r * 0.36);
    const curve = new THREE.CatmullRomCurve3([from, new THREE.Vector3((from.x + a.x) / 2 + (a.x - x) * 0.15, a.y0 - a.out * 0.2, (from.z + a.z) / 2), new THREE.Vector3(a.x, a.y0 + a.out * 0.15, a.z), new THREE.Vector3(a.x, a.y0 + a.out * 0.35, a.z)]);
    add(bend(curve, a.r), [0, 0, 0]);
    const y = a.y0 + a.out * 0.3;
    add(stem(a.r, a.y1 - y + a.r, false), [a.x, y, a.z]);
    rows(a.x, y, a.y1, a.z, a.r);
  }
  tuftGeo ??= new THREE.PlaneGeometry(1, 1);
  const im = new THREE.InstancedMesh(tuftGeo, tuftMat(), tufts.length), o = new THREE.Object3D(), out = new THREE.Vector3();
  tufts.forEach(([cx, y, cz, a, R], i) => {
    o.position.set(cx + Math.cos(a) * (R + 0.008), y, cz + Math.sin(a) * (R + 0.008));
    o.lookAt(out.set(o.position.x + Math.cos(a), y, o.position.z + Math.sin(a))); o.rotateZ(i * 1.7);
    o.scale.setScalar(0.062); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  });
  im.computeBoundingSphere(); g.add(im);
  g.userData.tufts = tufts.length;
  return g;
}
