// The Topple Lab's fir trees, drawn (2026-11-22): a barked trunk and sprays
// of needles (one picture of a spray, drawn needle by needle at the start,
// on a bent card), with snow lying along them, placed by src/core/fir.js
// round the physics' tiers. One instanced mesh for all a tree's sprays.

import * as THREE from '../vendor/three/three.module.min.js';
import { rng } from '../core/topple.js';
import { firBranches } from '../core/fir.js';

// A spray seen from above: its stem left to right, side twigs swept forward,
// needles all along them, dark to mid greens; snow in clumps over it
// (snow 0-1). Premultiplied edges filled with the needles' own green.
function sprayTexture(snow) {
  const W = 512, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), r = rng(snow ? 91 : 90);
  g.clearRect(0, 0, W, H);
  g.lineCap = 'round';
  const GREENS = ['#1E3A24', '#25452A', '#2E5230', '#375E36', '#1A3220', '#42683C'];
  const needles = (x0, y0, x1, y1, len, step) => {
    const L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    for (let s = 0; s < L; s += step) for (const side of [-1, 1]) {
      const x = x0 + (x1 - x0) * s / L, y = y0 + (y1 - y0) * s / L, b = a + side * (0.55 + r() * 0.5), l = len * (0.7 + 0.5 * r()) * (1 - 0.35 * s / L);
      g.strokeStyle = GREENS[Math.floor(r() * GREENS.length)]; g.lineWidth = 2.2 + r() * 1.4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke();
    }
  };
  const twigs = [];
  for (let k = 0; k < 13; k++) {
    const f = 0.06 + k / 13 * 0.86, x0 = 10 + f * (W - 60), half = (H / 2 - 26) * Math.sin(Math.PI * Math.min(1, 0.28 + 0.72 * (1 - f)) * 0.5 + 0.25) * (1 - 0.72 * f ** 2.2);
    for (const side of [-1, 1]) { const ang = side * (0.85 - 0.2 * f + (r() - 0.5) * 0.2), l = half * (0.85 + 0.3 * r()); twigs.push([x0, H / 2, Math.min(W - 14, x0 + Math.cos(ang) * l * 1.25), H / 2 + Math.sin(ang) * l]); }
  }
  g.strokeStyle = '#4A3A28'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W - 50, H / 2); g.stroke();
  g.lineWidth = 3;
  for (const [a, b, d, e] of twigs) { g.beginPath(); g.moveTo(a, b); g.lineTo(d, e); g.stroke(); needles(a, b, d, e, 19, 3.1); }
  needles(0, H / 2, W - 34, H / 2, 24, 3);
  if (snow) {
    // snow lying on the twigs, thicker near the middle: soft white clumps with a blue underside
    for (const [a, b, d, e] of [...twigs, [40, H / 2, W - 40, H / 2], [20, H / 2, W - 90, H / 2]]) {
      const n = Math.round(Math.hypot(d - a, e - b) / 9);
      for (let i = 1; i < n; i++) {
        if (r() > snow) continue;
        const x = a + (d - a) * i / n + (r() - 0.5) * 7, y = b + (e - b) * i / n + (r() - 0.5) * 7, R = 5 + r() * 8;
        g.fillStyle = 'rgba(186,204,226,.95)'; g.beginPath(); g.ellipse(x, y + 2.5, R * 1.15, R * 0.8, 0, 0, 7); g.fill();
        g.fillStyle = r() < 0.8 ? '#F3F7FB' : '#E2EAF4'; g.beginPath(); g.ellipse(x, y, R, R * 0.72, 0, 0, 7); g.fill();
      }
    }
  }
  // under the needles, where nothing is drawn: the green (see-through), so edges aren't dark or white
  const im = g.getImageData(0, 0, W, H), d = im.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] < 8) { d[i] = 44; d[i + 1] = 74; d[i + 2] = 46; d[i + 3] = 0; }
  const data = new THREE.DataTexture(new Uint8Array(d.buffer), W, H, THREE.RGBAFormat);
  data.flipY = true; data.colorSpace = THREE.SRGBColorSpace; data.generateMipmaps = true;
  data.minFilter = THREE.LinearMipmapLinearFilter; data.magFilter = THREE.LinearFilter; data.anisotropy = 4; data.needsUpdate = true;
  return data;
}

// The card: along +x from the trunk, 1 long and 0.62 wide, bent down along its
// length and a little across it; its normals lean up, as a spray lit from above.
function sprayGeometry() {
  const geo = new THREE.PlaneGeometry(1, 0.62, 4, 2), p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + 0.5, w = p.getY(i);
    p.setXYZ(i, x, -0.24 * x * x - 0.5 * w * w, -w);
    const v = new THREE.Vector3(0.25 * x, 1, 0.5 * w).normalize(); n.setXYZ(i, v.x, v.y, v.z);
  }
  return geo;
}

let geo = null;
const mats = {};
// The sprays' material: lit the same from both sides (the normals lean up), snow 0-1.
export function firMaterial(snow = 0.34, tint = '#FFFFFF') {
  const k = `${snow}${tint}`;
  if (mats[k]) return mats[k];
  const m = new THREE.MeshStandardMaterial({ map: sprayTexture(snow), alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.95, metalness: 0, color: tint, envMapIntensity: 0.7 });
  // (a card's back would be lit as if it faced down: keep the normal as it is)
  m.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <normal_fragment_begin>', 'vec3 normal = normalize( vNormal ); vec3 nonPerturbedNormal = normal;'); };
  mats[k] = m;
  return m;
}

// A fir: { tiers (the physics'), h (its trunk), r (its foot's radius) } in
// `bark`; opts: firBranches' and { snow, tint, cast }. A group; userData.sprays.
export function fir({ tiers, h, r }, bark, { snow = 0.34, tint = '#FFFFFF', cast = true, ...opts } = {}) {
  geo ??= sprayGeometry();
  const g = new THREE.Group(), [x, , z] = tiers[0].at;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r, h, 10), bark);
  trunk.position.set(x, h / 2, z); trunk.castShadow = cast; trunk.receiveShadow = true; g.add(trunk);
  const list = firBranches(tiers, opts), im = new THREE.InstancedMesh(geo, firMaterial(snow, tint), list.length), o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((b, i) => {
    o.position.set(...b.at); o.rotation.set(b.roll, b.yaw, -b.droop, 'YZX'); o.scale.set(b.len, b.len * 0.9 + 0.1, b.len * 0.85 + 0.12); o.updateMatrix();
    im.setMatrixAt(i, o.matrix); im.setColorAt(i, c.setScalar(b.shade));
  });
  im.castShadow = cast; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  g.userData.sprays = list.length;
  return g;
}
export const firGeometry = () => geo;
