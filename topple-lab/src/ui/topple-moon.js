// The moon base drawn (DESIGN.md "Topple!", The moon; journal Q119, mockups
// v1-v6): three.js on its own canvas over the park's. The ground, the stars
// and the Earth (in a slightly different place and turn each scene, turning
// slowly: developer, 2026-11-17), the odd shooting star, the base behind
// (each level its own extras), the lander with its shadow and the line under
// its path, the ring where a drop would land and the block it would hit lit
// (Normal), the blocks and balls where src/core/topple-moon-world.js puts
// them. Canvas textures only: no image files.

import * as THREE from '../vendor/three/three.module.min.js';
import { LANDER_Y, DROP_BELOW, MOON_BALL, Z_START, ZS, TURN_PAST, MOON_MATS, MOON_G, POP_S } from '../core/topple-moon.js';
import { levelLook } from './topple-moon-looks.js';
import { applyCuts } from './drawcuts.js';
import { moonPhotos } from './topple-moon-photos.js';   // (the lab's own)
import { copyMaterial } from './topple-tri.js';   // (the lab's own)
import { copies, contacts, plainMetal } from './topple-models.js';   // (the lab's own)

const Z_NEAR_LINE = ZS.n + 0.3;   // the nearest structures' front

const DEG = Math.PI / 180;

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const moonTex = () => canvasTex(512, 512, (g, w, h) => {
  const r = rand(11);
  g.fillStyle = '#8d8d8f'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = 110 + r() * 70 | 0; g.fillStyle = `rgba(${v},${v},${v + 2},.35)`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rr = 6 + r() * 34, gr = g.createRadialGradient(x, y, rr * 0.2, x, y, rr);
    gr.addColorStop(0, 'rgba(70,70,74,.55)'); gr.addColorStop(0.75, 'rgba(95,95,99,.35)'); gr.addColorStop(0.92, 'rgba(190,190,194,.45)'); gr.addColorStop(1, 'rgba(190,190,194,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
  }
}, [8, 8]);
const crateTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#e8ebef'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f08a24'; g.fillRect(0, h * 0.42, w, h * 0.16);
  g.strokeStyle = '#7c8594'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#7c8594'; for (const [x, y] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
});
const solarTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#1d3266'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(160,190,255,.55)'; g.lineWidth = 2;
  for (let x = 16; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 16; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = '#c8ced8'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
});
const oreTex = () => canvasTex(128, 128, (g, w, h) => {
  const r = rand(4);
  g.fillStyle = '#5b5148'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.3 ? '#e0913a' : `hsl(30,10%,${25 + r() * 25}%)`; g.beginPath(); g.arc(r() * w, r() * h, 3 + r() * 9, 0, 7); g.fill(); }
  g.strokeStyle = '#8a8f98'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
});
const tankTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#eef0f3'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f08a24'; g.fillRect(0, h * 0.18, w, h * 0.08); g.fillRect(0, h * 0.74, w, h * 0.08);
  g.fillStyle = '#3a4250'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('H₂', w / 2, h * 0.55);
});
// Q125: the new targets' looks
const drumTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#c8322b'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9e231e'; for (const y of [0.12, 0.88]) g.fillRect(0, h * y - 4, w, 8);
  g.fillStyle = '#ffcf33'; g.fillRect(0, h * 0.36, w, h * 0.28);
  g.fillStyle = '#2b2b2b'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FUEL', w / 2, h / 2 + 1);
});
const o2Tex = (big = false) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2f7fe0'; g.fillRect(0, h * 0.14, w, h * 0.1); g.fillRect(0, h * 0.78, w, h * 0.1);
  g.fillStyle = '#1d5fb8'; g.font = `bold ${big ? 30 : 38}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('O₂', w / 2, h / 2 + 2);
});
const glassTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(150,220,255,0.8)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(230,248,255,0.9)'; g.lineWidth = 2;
  for (let x = 21; x < w; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 21; y < h; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(10, 0); g.lineTo(40, 0); g.lineTo(0, 50); g.lineTo(0, 20); g.fill();
  g.strokeStyle = '#e8edf3'; g.lineWidth = 7; g.strokeRect(3, 3, w - 6, h - 6);
});
const CRYSTAL = ['#a970ff', '#3fe0d0', '#ff6fb5'];
// a crystal: a six-sided prism with a pointed tip (flat facets catch the light)
const crystalGeo = (r, h) => { const tip = h * 0.28; return new THREE.LatheGeometry([[0, -h / 2], [r, -h / 2], [r * 1.05, h / 2 - tip], [0, h / 2]].map(([x, y]) => new THREE.Vector2(x, y)), 6); };
const crystalMat = i => new THREE.MeshStandardMaterial({ color: CRYSTAL[i % 3], emissive: CRYSTAL[i % 3], emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.92, flatShading: true });
// a boulder's lumps: each vertex pushed in or out a little (r: a seeded random)
function lumpy(geo, r) {
  const pos = geo.attributes.position, seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!seen.has(k)) seen.set(k, 0.82 + r() * 0.3);
    const f = seen.get(k); pos.setXYZ(i, pos.getX(i) * f, pos.getY(i) * f, pos.getZ(i) * f);
  }
  geo.computeVertexNormals();
  return geo;
}
const earthTex = () => canvasTex(256, 128, (g, w, h) => {
  const r = rand(5);
  g.fillStyle = '#2b66c9'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4f9a4a'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(r() * w, 20 + r() * (h - 40), 8 + r() * 26, 5 + r() * 14, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 30, 2 + r() * 4, 0, 0, 7); g.fill(); }
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
});

// The base behind the blocks (scenery, no physics): domes, a greenhouse, a
// habitat module, tubes, a radio mast with a turning dish, a landing pad with
// a rocket, solar arrays, a rover driving to and fro (mockup v2), and each
// level's own: more panels (Solar Farm), a crater's rim (Crater Rim), ore
// heaps and a drill (Mining Site), the big rocket on its tower (Launch Pad).
// (the lab: ph, its photos (topple-moon-photos.js): in panelled, worn metal; null: as before)
function moonBase(S, level, ph) {
  const white = ph ? ph.plate('#e4e6ea') : new THREE.MeshStandardMaterial({ color: '#e4e7ec', roughness: 0.45, metalness: 0.1 });
  const grey = ph ? ph.plate('#8f979f', { metalness: 0.5, roughness: 0.45 }) : new THREE.MeshStandardMaterial({ color: '#8f98a4', roughness: 0.55, metalness: 0.4 });
  const dark = ph ? ph.plate('#454b55', { metalness: 0.4 }) : new THREE.MeshStandardMaterial({ color: '#3a4250', roughness: 0.6, metalness: 0.3 });
  const orange = ph ? ph.plate('#d9741c', { metalness: 0.15 }) : new THREE.MeshStandardMaterial({ color: '#f08a24', roughness: 0.5 });
  const lit = new THREE.MeshBasicMaterial({ color: '#ffd27a' });
  const red = new THREE.MeshBasicMaterial({ color: '#ff3b30' });
  const rock = new THREE.MeshStandardMaterial({ color: '#7d7d80', roughness: 1, flatShading: true });
  const add = (geo, mat, x, y, z, parent = S, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; };
  const blink = [], spin = [];
  const dome = (x, z, r, glass) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g);
    if (glass) {
      add(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#cfefff', transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false }), 0, 0, 0, g, false);
      const leaf = new THREE.MeshStandardMaterial({ color: '#5fbf5a', emissive: '#2f7a2c', emissiveIntensity: 0.6, roughness: 0.8 }), rr = rand(31);
      for (let i = 0; i < 14; i++) { const a = rr() * Math.PI * 2, d = rr() * r * 0.7; add(new THREE.SphereGeometry(0.2 + rr() * 0.25, 10, 8), leaf, Math.cos(a) * d, 0.15, Math.sin(a) * d, g); }
    } else {
      add(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), white, 0, 0, 0, g);
      for (const e of [0.35, 0.75]) for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, w = add(new THREE.BoxGeometry(r * 0.16, r * 0.09, 0.04), lit, Math.sin(a) * r * Math.cos(e), r * Math.sin(e), Math.cos(a) * r * Math.cos(e), g, false);
        w.lookAt(g.position.x, ph ? 0 : r * Math.sin(e), g.position.z);   // (the lab: flat on the dome)
      }
      add(new THREE.BoxGeometry(r * 0.35, r * 0.45, r * 0.3), grey, 0, r * 0.22, r * 0.92, g);
      add(new THREE.BoxGeometry(r * 0.22, r * 0.34, 0.02), lit, 0, r * 0.2, r * 1.08, g, false);
    }
    for (let i = 1; i < 4; i++) { const a = i * Math.PI / 8, t = add(new THREE.TorusGeometry(r * Math.cos(a) + 0.02, 0.035, 6, 48), grey, 0, r * Math.sin(a), 0, g); t.rotation.x = Math.PI / 2; }
    blink.push(add(new THREE.SphereGeometry(0.09, 10, 8), red, 0, r + 0.05, 0, g, false));
  };
  const tube = (x1, z1, x2, z2, y = 0.45, r = 0.32) => {
    const dx = x2 - x1, dz = z2 - z1, t = add(new THREE.CylinderGeometry(r, r, Math.hypot(dx, dz), 16), white, (x1 + x2) / 2, y, (z1 + z2) / 2);
    t.rotation.z = Math.PI / 2; t.rotation.y = -Math.atan2(dz, dx);
  };
  const rocket = (x, z, s) => {
    const g = new THREE.Group(); g.position.set(x, 0.12, z); g.scale.setScalar(s); S.add(g);
    add(new THREE.CylinderGeometry(0.42, 0.48, 2.6, 24), white, 0, 1.5, 0, g);
    add(new THREE.ConeGeometry(0.42, 0.9, 24), orange, 0, 3.25, 0, g);
    add(new THREE.CylinderGeometry(0.44, 0.44, 0.2, 24), orange, 0, 2.2, 0, g);
    for (let i = 0; i < 3; i++) { const f = add(new THREE.BoxGeometry(0.05, 0.7, 0.5), orange, 0, 0.45, 0, g); f.rotation.y = i * Math.PI * 2 / 3; f.translateZ(0.5); }
    return g;
  };
  // the base: Landing Zone only (Q125: each level its own look; until then every level)
  const S0 = S, BG = new THREE.Group(); BG.visible = level === 6; S0.add(BG); S = BG;
  dome(5.2, -16.5, 2.5); dome(9.4, -14.8, 1.4); dome(1.6, -14.2, 1.3, true);
  tube(7.0, -16.0, 8.4, -15.2); tube(2.8, -14.6, 3.2, -15.6);
  const hab = add(new THREE.CylinderGeometry(0.75, 0.75, 3.4, 24), white, -1.9, 0.85, -14.8); hab.rotation.z = Math.PI / 2;
  for (const x of [-3.6, -0.2]) add(new THREE.SphereGeometry(0.75, 20, 12), white, x, 0.85, -14.8);
  const band = add(new THREE.CylinderGeometry(0.77, 0.77, 0.25, 24), orange, -1.9, 0.85, -14.8); band.rotation.z = Math.PI / 2;
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.28, 0.2, 0.04), lit, -3.1 + i * 0.6, 1.05, -14.06, S, false);
  // the radio mast and its dish
  const mx = -6.4, mz = -15.5;
  for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = add(new THREE.CylinderGeometry(0.035, 0.035, 5.6, 6), grey, mx + ox * 0.17, 2.8, mz + oz * 0.17); leg.rotation.set(-oz * 0.04, 0, ox * 0.04); }
  for (let y = 0.8; y < 5.5; y += 0.9) add(new THREE.BoxGeometry(0.42 - y * 0.05, 0.04, 0.42 - y * 0.05), grey, mx, y, mz);
  const dishPivot = new THREE.Group(); dishPivot.position.set(mx, 5.7, mz); S.add(dishPivot);
  const dish = add(new THREE.SphereGeometry(0.85, 24, 12, 0, Math.PI * 2, 0, 0.75), new THREE.MeshStandardMaterial({ color: '#eef1f5', roughness: 0.4, side: THREE.DoubleSide }), 0, 0.55, 0, dishPivot);
  dish.rotation.x = Math.PI * 0.62;
  spin.push([dishPivot, 0.35]);
  blink.push(add(new THREE.SphereGeometry(0.1, 10, 8), red, mx, 5.65, mz, S, false));
  // the landing pad and a rocket
  add(new THREE.CylinderGeometry(1.7, 1.8, 0.12, 40), dark, -10.2, 0.06, -13.2);
  const padRing = add(new THREE.TorusGeometry(1.35, 0.05, 6, 48), orange, -10.2, 0.13, -13.2); padRing.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; blink.push(add(new THREE.SphereGeometry(0.07, 8, 6), lit, -10.2 + Math.cos(a) * 1.6, 0.16, -13.2 + Math.sin(a) * 1.6, S, false)); }
  rocket(-10.2, -13.2, 1);
  // solar arrays
  const solarM = ph ? ph.solar(4, 3) : new THREE.MeshStandardMaterial({ map: solarTex(), roughness: 0.3, metalness: 0.4 });
  const arrays = (x0, z0, nx, nz) => { for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 + i * 1.5, z = z0 - j * 1.4; add(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), grey, x, 0.35, z); const p = add(new THREE.BoxGeometry(1.2, 0.04, 0.8), solarM, x, 0.72, z); p.rotation.x = 0.5; } };
  arrays(-4.6, -11.6, 4, 2);
  // a rover driving to and fro
  const rover = new THREE.Group(); rover.position.set(-7, 0, -9.6); S.add(rover);
  add(new THREE.BoxGeometry(1.0, 0.3, 0.6), white, 0, 0.42, 0, rover);
  add(new THREE.BoxGeometry(0.4, 0.22, 0.5), orange, -0.2, 0.68, 0, rover);
  const wheels = [];
  for (const wx of [-0.38, 0, 0.38]) for (const wz of [-0.34, 0.34]) { const w = add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), dark, wx, 0.16, wz, rover); w.rotation.x = Math.PI / 2; wheels.push(w); }
  const rv = { x: -7, v: 0.55 };
  S = S0;
  // each level's own look (Q125: topple-moon-looks.js)
  const look = levelLook(THREE, S, level, { ph, copies, contacts, canvasTex, rand, mats: { white, grey, dark, orange, lit, red }, drumTex, o2Tex, solarTex, oreTex, moonTex, crystalMat, lumpy, crystalGeo });
  return {
    update(t, dt) {
      for (const [o, s] of spin) o.rotation.y += s * dt;
      const on = Math.sin(t * 4) > 0;
      blink.forEach((b, i) => { b.visible = i % 2 ? on : !on; });
      rv.x += rv.v * dt; if (rv.x > 7.5 || rv.x < -8) rv.v = -rv.v;
      rover.position.x = rv.x; rover.rotation.y = rv.v > 0 ? 0 : Math.PI;
      for (const w of wheels) w.rotation.y -= rv.v * dt / 0.16;
      look.update(t, dt);
    },
    look,
  };
}

// Each block material's look (the mockups' crates, panels and posts; ore carts, beams and tanks new).
function blockMats(ph) {
  // (the lab: the same markings, worn, over panelled metal; photo cells; rock)
  if (ph) {
    return {
      crate: ph.painted(crateTex(), { wear: { seed: 4 } }),
      panel: ph.solar(3, 3),
      post: ph.plate('#b9bfc7', { metalness: 0.4, size: 0.9 }),
      beam: ph.plate('#c8922e', { metalness: 0.3, size: 0.9 }),
      ore: ph.painted(oreTex(), { wear: { seed: 6, dust: 0.2 }, roughness: 0.9 }),
      tank: ph.painted(tankTex(), { wear: { seed: 8 }, roughness: 0.35 }),
      drum: ph.drumMat,
      oxygen: ph.painted(o2Tex(), { wear: { seed: 9 }, roughness: 0.32 }),
      glass: new THREE.MeshStandardMaterial({ map: glassTex(), transparent: true, roughness: 0.04, metalness: 0.4, emissive: '#2a6c9c', emissiveIntensity: 0.22, side: THREE.DoubleSide, envMap: ph.env, envMapIntensity: 1.5 }),
      boulder: ph.rock('#A7A198', 0.7),
      crystal: crystalMat(0),
    };
  }
  return {
    crate: new THREE.MeshStandardMaterial({ map: crateTex(), roughness: 0.6 }),
    panel: new THREE.MeshStandardMaterial({ map: solarTex(), roughness: 0.3, metalness: 0.3 }),
    post: new THREE.MeshStandardMaterial({ color: '#c3c9d2', roughness: 0.5, metalness: 0.3 }),
    beam: new THREE.MeshStandardMaterial({ color: '#d9a43a', roughness: 0.5, metalness: 0.4 }),
    ore: new THREE.MeshStandardMaterial({ map: oreTex(), roughness: 0.9 }),
    tank: new THREE.MeshStandardMaterial({ map: tankTex(), roughness: 0.4, metalness: 0.1 }),
    drum: new THREE.MeshStandardMaterial({ map: drumTex(), roughness: 0.45, metalness: 0.3 }),
    oxygen: new THREE.MeshStandardMaterial({ map: o2Tex(), roughness: 0.35, metalness: 0.15 }),
    glass: new THREE.MeshStandardMaterial({ map: glassTex(), transparent: true, roughness: 0.05, metalness: 0.3, emissive: '#2a6c9c', emissiveIntensity: 0.35, side: THREE.DoubleSide }),
    boulder: new THREE.MeshStandardMaterial({ color: '#8f8a82', roughness: 1, flatShading: true }),
    crystal: crystalMat(0),
  };
}

// (the lab) The lander's small parts: struts to its legs, foot pads, an engine bell under it, thrusters
// round it, a ring and frame to its glass, an aerial (drawn only, as the rest of it).
function landerParts(g, ph, metal) {
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const dark = ph.plate('#3A3F47', { metalness: 0.5 });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    add(new THREE.CylinderGeometry(0.075, 0.09, 0.03, 14), metal, c * 0.62, -0.555, s * 0.62);
    for (const k of [-1, 1]) { const A = new THREE.Vector3(c * 0.42 - s * 0.16 * k, -0.17, s * 0.42 + c * 0.16 * k), B = new THREE.Vector3(c * 0.56, -0.4, s * 0.56), v = B.clone().sub(A), m = add(new THREE.CylinderGeometry(0.012, 0.012, v.length(), 6), metal, 0, 0, 0); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); }
    const b = i * Math.PI / 2;
    const box = add(new THREE.BoxGeometry(0.12, 0.1, 0.12), dark, Math.cos(b) * 0.46, 0.06, Math.sin(b) * 0.46); box.rotation.y = -b;
    const noz = add(new THREE.CylinderGeometry(0.018, 0.04, 0.07, 10), metal, Math.cos(b) * 0.53, -0.02, Math.sin(b) * 0.53); noz.rotation.z = Math.cos(b) * 0.5; noz.rotation.x = -Math.sin(b) * 0.5;
  }
  add(new THREE.TorusGeometry(0.3, 0.022, 8, 32), metal, 0, 0.185, 0).rotation.x = Math.PI / 2;
  for (const a of [0, Math.PI / 3, 2 * Math.PI / 3]) { const t = add(new THREE.TorusGeometry(0.301, 0.009, 6, 24, Math.PI), metal, 0, 0.18, 0); t.rotation.y = a; }
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 5), metal, 0.1, 0.56, 0.02); add(new THREE.SphereGeometry(0.02, 8, 6), metal, 0.1, 0.72, 0.02);
  add(new THREE.CylinderGeometry(0.505, 0.52, 0.03, 8), dark, 0, -0.18, 0); add(new THREE.CylinderGeometry(0.425, 0.425, 0.02, 8), dark, 0, 0.185, 0);
}
// (the lab) A ledge's sides a little broken (in, never out: the physics' box), its top as it is.
function raggedSides(geo) {
  const p = geo.attributes.position, b = new THREE.Box3().setFromBufferAttribute(p), s = b.getSize(new THREE.Vector3());
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 37.1 + y * 17.3 + z * 29.7) * 0.5 + 0.5, low = y < b.max.y - 1e-4 ? 1 : 0.35;
    p.setX(i, x - Math.sign(x) * (Math.abs(x) > s.x / 2 - 1e-4 ? 0.05 * n * low : 0));
    p.setZ(i, z - Math.sign(z) * (Math.abs(z) > s.z / 2 - 1e-4 ? 0.05 * n * low : 0));
  }
  geo.computeVertexNormals();
}

export function makeMoon3d(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
  let S = null, base = null, level = 0, t = 0, aspect = 1;
  let blocks = [], balls = [], ledges = [], earth = null, lander = null, flame = null, shadow = null, track = null, ring = null, held = null;
  const shooting = [];   // the odd shooting star: { line, t, life }
  let nextStar = 6 + Math.random() * 10;
  // (the lab: the photos, loaded as the moon is first drawn; `ready` once they have, or can't
  // be: the moon is drawn plain then, and they're tried again the next time)
  let ph = null, cuts = {}, sunLight = null;
  let mats = blockMats(null);
  let ballMat = new THREE.MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.75, roughness: 0.3 });
  const photos = () => moonPhotos(renderer).then(p => {
    ph = p; mats = blockMats(p); ballMat = p.chrome(); level = 0;   // (drawn again, in the photos)
    return { photos: p.files, models: 4, ms: p.ms };
  }, e => ({ error: String(e.message ?? e) }));
  const three = () => ({ renderer, scene: S, camera, sun: sunLight });
  function cut() {
    if (!S) return [];
    const did = applyCuts(three(), cuts);
    if (cuts.reflections === false) S.traverse(o => { for (const m of [o.material].flat()) if (m?.envMap) { m.envMap = null; m.needsUpdate = true; } });
    if (cuts.surfaces === 'plain') plainMetal(S);
    if (cuts.surfaces === 'plain') S.traverse(o => { for (const m of [o.material].flat()) { if (m && (m.tri || m.ground) && !m.defines?.TRI_PLAIN) { m.defines = { ...(m.defines ?? {}), TRI_PLAIN: '', GROUND_PLAIN: '' }; m.needsUpdate = true; } } });
    return did;
  }
  const ballGeo = new THREE.SphereGeometry(MOON_BALL.r, 24, 16);
  // The blocks left glowing after a pause (Q133, as the park's Q101 in topple-scene.js): each
  // block's own shape a little bigger over it, added light, shown only while it glows.
  const glowMat = new THREE.MeshBasicMaterial({ color: '#FFF1C4', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  let glowing = false;
  let ledgeTex = null;

  // The view from in front of the base and above, fitted to the scene: across, where the ring
  // can go (the span and TURN_PAST each side) and a margin, at the nearest line (it's widest
  // there); so a narrow scene or an upright phone comes closer (a fixed 6.6 m each side, the
  // mockups', made the blocks small on a phone held upright).
  let span = [-3.3, 3.3];
  function fitCamera() {
    camera.aspect = aspect; camera.fov = 45;
    const hf = 2 * Math.atan(Math.tan(22.5 * DEG) * aspect), half = (span[1] - span[0]) / 2 + TURN_PAST + 0.7, cx = (span[0] + span[1]) / 2;
    const dist = Math.max(8.5, half / Math.tan(hf / 2) + (Z_NEAR_LINE - Z_START));
    camera.position.set(cx, 3.1, Z_START + dist); camera.lookAt(cx, 1.9, Z_START);
    camera.updateProjectionMatrix();
  }

  // The moon, the sky and the base for level n (made again only when the level changes);
  // 'bare' (a tutorial, Q129: "bare bones scenes"): the ground and the sky, no base or rocks.
  function setLevel(n) {
    if (S && level === n) return;
    if (S) S.traverse(o => { o.geometry?.dispose(); for (const m of [].concat(o.material || [])) if (!Object.values(mats).includes(m) && m !== ballMat && m !== glowMat) { if (!ph) m.map?.dispose(); m.dispose(); } });   // (the lab: the photos are shared)
    level = n;
    S = new THREE.Scene();
    S.background = new THREE.Color('#04050a');
    const hemiLight = new THREE.HemisphereLight(0x9aa8c8, ph ? 0x35332f : 0x222226, 0.45); S.add(hemiLight);
    const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(6, 9, 5); sun.target.position.set(0, 0, -5);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8, near: 0.5, far: 30 }); sun.shadow.bias = -0.0005;
    S.add(sun, sun.target); sunLight = sun;
    // (the lab: a photo of moon dust over craters, hills far off; not in Solar Farm's way, nor at Crater Rim, whose ground ends at its rim)
    const ground = ph ? ph.ground(n === 8 ? { width: 80, depth: 30, z: 0 } : { width: 190, depth: 150, z: -45, from: n === 7 ? 46 : 22 }) : new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: moonTex(), roughness: 1 }));
    if (ph) ground.material.ground = true;
    else { ground.rotation.x = -Math.PI / 2; ground.position.z = -20; ground.receiveShadow = true; }
    S.add(ground);
    const r = rand(21 + (n === 'bare' ? 0 : n)), rockMat = new THREE.MeshStandardMaterial({ color: '#7d7d80', roughness: 1, flatShading: true });
    const strewn = [[], [], []];
    for (let i = 0; i < (n === 'bare' ? 0 : ph ? 46 : 22); i++) {
      const x = (r() - 0.5) * (ph ? 34 : 26), z = -2 - r() * (ph ? 24 : 18); if (z > -8.5 && Math.abs(x) < 5.5) continue;
      if (ph) {   // (the lab: photographed moon rocks, most of them small)
        const k = Math.floor(r() * 3), s = (0.12 + 0.75 * r() ** 4) / ph.models[['moonRockA', 'moonRockB', 'moonRockC'][k]].size[0];
        if (n === 7 && z < -9) continue;   // (the panels stand there)
        strewn[k].push({ x, z, y: -0.06 * s * 0.1, yaw: r() * 6.3, s: [s, s * (0.8 + 0.3 * r()), s], tilt: (r() - 0.5) * 0.4 });
        continue;
      }
      const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + r() * 0.45, 0), rockMat);
      rk.position.set(x, 0.05, z); rk.rotation.set(r() * 3, r() * 3, 0); rk.scale.y = 0.6; rk.castShadow = rk.receiveShadow = true; S.add(rk);
    }
    if (ph) strewn.forEach((at, k) => {
      if (!at.length) return;
      const m = copies(ph.models[['moonRockA', 'moonRockB', 'moonRockC'][k]], at); S.add(m);
    });
    if (ph) {
      // many faint stars, a few bright, some warm or blue
      const pos = [], col = [];
      for (let i = 0; i < 2600; i++) { const a = r() * Math.PI * 2, el = 0.01 + Math.asin(r()) * 0.98, R = 150, m = 0.16 + 0.84 * r() ** 7, w = r(); pos.push(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R - 20); col.push(m * (w < 0.15 ? 1 : 0.92), m * 0.92, m * (w > 0.85 ? 1 : w < 0.15 ? 0.72 : 0.92)); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      S.add(new THREE.Points(g, new THREE.PointsMaterial({ vertexColors: true, size: 1.7, sizeAttenuation: false, transparent: true, depthWrite: false })));
    }
    const sp = [];
    for (let i = 0; i < (ph ? 0 : 900); i++) { const a = r() * Math.PI * 2, el = 0.05 + r() * 1.4, R = 90; sp.push(Math.cos(a) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(a) * Math.cos(el) * R - 20); }
    const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    S.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false })));
    earth = ph ? ph.earth(2.4) : new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 16), new THREE.MeshBasicMaterial({ map: earthTex() }));
    earth.rotation.z = 0.41;   // its tilt
    S.add(earth);
    base = n === 'bare' ? null : moonBase(S, n, ph);
    const L = base?.look?.light;
    if (L) { sun.position.set(...L.sun); if (L.color) sun.color.set(L.color); if (L.intensity) sun.intensity = L.intensity; hemiLight.intensity = L.hemi ?? 0.45; }
    if (base?.look?.ground && !ph) { ground.geometry.dispose(); ground.geometry = new THREE.PlaneGeometry(80, base.look.ground.depth); ground.position.z = base.look.ground.z; }
    fx.length = 0;
    // the lander (mockup v1-v6)
    lander = new THREE.Group();
    const foil = ph ? ph.foil() : new THREE.MeshStandardMaterial({ color: '#d4a63a', metalness: 0.6, roughness: 0.35 });
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.36, 8), foil); hull.castShadow = true;
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), ph ? ph.glass() : new THREE.MeshStandardMaterial({ color: '#9fd8ff', metalness: 0.2, roughness: 0.1 }));
    cab.position.y = 0.18;
    const legMat = ph ? ph.chrome('#B8BEC8', 0.35) : new THREE.MeshStandardMaterial({ color: '#b8bec8', metalness: 0.5, roughness: 0.4 });
    if (ph) landerParts(lander, ph, legMat);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5), legMat);
      leg.position.set(Math.cos(a) * 0.5, -0.32, Math.sin(a) * 0.5); leg.rotation.set(Math.sin(a) * (ph ? -0.5 : 0.5), 0, Math.cos(a) * (ph ? 0.5 : -0.5)); lander.add(leg);   // (the lab: its feet outwards)
    }
    flame = ph ? ph.flame(0.34, 0.6) : new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), new THREE.MeshBasicMaterial({ color: '#7fd0ff', transparent: true, opacity: 0.7 }));
    flame.rotation.z = ph ? -Math.PI / 2 : Math.PI / 2; flame.position.set(ph ? -0.5 : -0.62, 0, 0);
    lander.add(hull, cab, flame);
    S.add(lander);
    shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; S.add(shadow);
    track = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.07), new THREE.MeshBasicMaterial({
      map: canvasTex(256, 8, (g, w) => { g.fillStyle = '#ffffff'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 18, 8); }, [9, 1]), transparent: true, opacity: 0.3, depthWrite: false }));
    track.rotation.x = -Math.PI / 2; track.position.y = 0.012; S.add(track);
    ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 32), new THREE.MeshBasicMaterial({ color: '#f08a24', side: THREE.DoubleSide, depthTest: false, transparent: true }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 5; ring.visible = false; S.add(ring);
    held = new THREE.Mesh(ballGeo, ballMat); held.castShadow = true; S.add(held);
    blocks = []; balls = []; ledges = []; shooting.length = 0;
    fitCamera();
    cut();
  }

  // A scene's blocks and ledges, and the Earth where the scene puts it.
  function setScene(scene) {
    for (const m of [...blocks, ...ledges]) { S.remove(m); m.geometry.dispose(); if (m.material !== mats.crate) m.material.dispose?.(); }
    for (const b of balls) S.remove(b);
    balls = [];
    for (const f of fx) { S.remove(f.m); f.m.material.dispose(); }
    fx.length = 0; seenList = null;
    let blocksMade = 0;
    ledgeTex ??= moonTex();
    blocks = scene.blocks.map(b => {
      const mat0 = (b.mat === 'crystal' ? crystalMat(b.i ?? blocksMade) : (mats[b.mat] ?? mats.crate));
      const mat = copyMaterial(mat0);   // its own, so it can light up alone
      if (ph && b.mat === 'crystal') Object.assign(mat, { emissiveIntensity: 0.28, roughness: 0.06, metalness: 0.15, opacity: 0.86, envMap: ph.env, envMapIntensity: 1.7 });   // (the lab: glassy, less of its own light)
      blocksMade++;
      const shape = MOON_MATS[b.mat]?.shape;
      const geo = ph && b.mat === 'drum' ? ph.drumGeo(b.w, b.h) : shape === 'cyl' ? new THREE.CylinderGeometry(b.w / 2, b.w / 2, b.h, 24)
        : shape === 'hex' ? crystalGeo(b.w / 2, b.h)
          : shape === 'ball' ? (ph ? ph.boulder(b.w / 2 * 1.02, rand(7 + blocksMade)) : lumpy(new THREE.IcosahedronGeometry(b.w / 2 * 1.04, 1), rand(7 + blocksMade)))
            : new THREE.BoxGeometry(b.w, b.h, b.d);
      const m = new THREE.Mesh(geo, mat);
      m.userData.em = [mat.emissive.getHex(), mat.emissiveIntensity];
      m.castShadow = m.receiveShadow = true; m.position.set(b.x, b.y, b.z); S.add(m);
      const over = new THREE.Mesh(m.geometry, glowMat);
      over.scale.setScalar(1.03); over.visible = false; over.renderOrder = 2; m.add(over); m.userData.glow = over;
      return m;
    });
    glowing = false;
    const rockM = ph ? ph.rock('#98948C', 1.1) : new THREE.MeshStandardMaterial({ map: ledgeTex, color: '#b8b4ac', roughness: 1, flatShading: true });   // (Q125: rock, not a plain box)
    ledges = (scene.ledges ?? []).map(l => { const m = new THREE.Mesh(new THREE.BoxGeometry(l.w, l.h, l.d, 3, 2, 3), rockM); m.position.set(l.x, l.h / 2, l.z); m.castShadow = m.receiveShadow = true; S.add(m); return m; });
    if (ph) for (const l of ledges) raggedSides(l.geometry);
    span = scene.span ?? span;
    fitCamera();
    cut();
    // the Earth: across the sky by az (0 left, 1 right), up by el, its turn
    const e = scene.earth ?? { az: 0.6, el: 0.7, spin: 0 };
    earth.position.set(-30 + e.az * 60, 10 + e.el * 12, -48);
    earth.rotation.y = e.spin;
    return { blocks: blocks.length, ledges: ledges.length };
  }

  // Q125: what bursts, shatters and vents, drawn. Bits fly under the moon's gravity
  // and fade; puffs grow and fade. (No lights added: a new light makes every material recompile.)
  const fx = [];   // { m, v, spin, life, t, grow, fade0, ground }
  let seenList = null, seen = 0;
  const blocksH = r => r.he.y * 2;
  const bitGeo = new THREE.BoxGeometry(0.1, 0.025, 0.08), shardGeo = new THREE.BufferGeometry();
  shardGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.07, 0, -0.05, -0.04, 0, 0.06, -0.03, 0.01], 3)); shardGeo.computeVertexNormals();
  // a puff: a soft round cloud (a sprite with a fading edge), tinted
  const puffTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  function puff(at, r0, r1, color, op, life) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color, transparent: true, opacity: op, depthWrite: false }));
    r0 *= 2; r1 *= 2;
    m.position.copy(at); m.scale.setScalar(r0); S.add(m);
    fx.push({ m, v: new THREE.Vector3(0, 0.15, 0), spin: null, life, t: 0, grow: [r0, r1], op, g: 0 });
  }
  function bits(at, n, geo, matOf, speed, up, life) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, matOf(i)); m.position.copy(at); m.rotation.set(Math.random() * 6, Math.random() * 6, 0); S.add(m);
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      fx.push({ m, v: new THREE.Vector3(Math.cos(a) * s, up * (0.5 + Math.random()), Math.sin(a) * s), spin: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), life: life * (0.7 + Math.random() * 0.5), t: 0, op: 1, g: MOON_G, ground: true });
    }
  }
  function effect(e, W) {
    const at = new THREE.Vector3(...e.at);
    if (e.what === 'burst') {
      puff(at, 0.3, 1.7, '#e6ebf0', 0.65, 1.1);
      puff(at, 0.15, 0.8, '#ffb347', 0.9, 0.3);
      bits(at, 14, bitGeo, () => new THREE.MeshStandardMaterial({ color: Math.random() < 0.6 ? '#c8322b' : '#ffcf33', roughness: 0.5, transparent: true }), 2.6, 2.4, 2.6);
    } else if (e.what === 'shatter' && e.mat === 'glass') {
      bits(at, 24, shardGeo, () => new THREE.MeshStandardMaterial({ color: '#a8dcff', emissive: '#3a7fb8', emissiveIntensity: 0.3, roughness: 0.05, metalness: 0.4, transparent: true, side: THREE.DoubleSide }), 1.4, 1.6, 2.0);
    } else if (e.what === 'shatter') {
      const c = CRYSTAL[(blocks[e.i]?.material.color.getHex() === 0x3fe0d0) ? 1 : (blocks[e.i]?.material.color.getHex() === 0xff6fb5 ? 2 : 0)];
      puff(at, 0.2, 1.1, c, 0.55, 0.45);
      bits(at, 20, shardGeo, () => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.1, transparent: true, side: THREE.DoubleSide }), 1.6, 1.8, 2.2);
    } else if (e.what === 'pop') {
      puff(at, 0.2, 1.2, '#f4f8fc', 0.7, 0.8);
    }
    void W;
  }
  function fxTick(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i]; f.t += dt;
      const u = Math.min(1, f.t / f.life);
      if (f.g) f.v.y -= f.g * dt;
      f.m.position.addScaledVector(f.v, dt);
      if (f.ground && f.m.position.y < 0.03) { f.m.position.y = 0.03; f.v.set(f.v.x * 0.3, 0, f.v.z * 0.3); if (f.spin) f.spin.multiplyScalar(0.2); }
      if (f.spin) { f.m.rotation.x += f.spin.x * dt; f.m.rotation.y += f.spin.y * dt; f.m.rotation.z += f.spin.z * dt; }
      if (f.grow) f.m.scale.setScalar(f.grow[0] + (f.grow[1] - f.grow[0]) * (1 - (1 - u) * (1 - u)));
      f.m.material.opacity = f.op * (f.grow ? 1 - u : Math.min(1, (1 - u) * 3));
      if (u >= 1) { S.remove(f.m); f.m.material.dispose(); fx.splice(i, 1); }
    }
  }

  // The blocks and balls where the physics has them (W: createMoonWorld's).
  function sync(W) {
    W.blocks.forEach((r, i) => {
      const m = blocks[i]; if (!m) return;
      m.visible = !r.broken;
      m.position.copy(r.body.position); m.quaternion.copy(r.body.quaternion);
      // an oxygen tank venting: a jet out of its foot, puffs left behind
      if (r.venting) {
        if (!m.userData.jet) { const j = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 12), new THREE.MeshBasicMaterial({ color: '#e9f6ff', transparent: true, opacity: 0.85, depthWrite: false })); j.position.y = -(blocksH(r) / 2 + 0.33); m.add(j); m.userData.jet = j; }
        m.userData.jet.visible = true; m.userData.jet.scale.set(1, 0.7 + Math.random() * 0.6, 1);
        if (Math.random() < 0.5) { const foot = new THREE.Vector3(0, -blocksH(r) / 2 - 0.4, 0).applyQuaternion(m.quaternion).add(m.position); puff(foot, 0.15, 0.6, '#eef4fa', 0.5, 0.7); }
      } else if (m.userData.jet) m.userData.jet.visible = false;
    });
    if (W.events !== seenList) { seenList = W.events; seen = 0; }
    for (; seen < W.events.length; seen++) effect(W.events[seen], W);
    while (balls.length < W.balls.length) { const m = new THREE.Mesh(ballGeo, ballMat); m.castShadow = true; S.add(m); balls.push(m); }
    while (balls.length > W.balls.length) S.remove(balls.pop());
    W.balls.forEach((b, i) => { balls[i].position.copy(b.body.position); balls[i].quaternion.copy(b.body.quaternion); });
  }

  // The lander at f (topple-moon.js's), the ball under it while one is ready.
  function setLander(f, ready, steering) {
    lander.position.set(f.x, LANDER_Y + Math.sin(t * 2) * 0.04, f.z);
    if (Math.abs(f.vx) > 0.05) lander.rotation.y = f.vx > 0 ? 0 : Math.PI;
    lander.rotation.z = -f.vx * 0.06;
    flame.scale.set(1, (0.8 + Math.random() * 0.4) * Math.max(0.2, Math.abs(f.vx)), 1);
    shadow.position.set(f.x, 0.01, f.z);
    track.position.z = f.z;
    track.material.opacity = steering ? 0.75 : 0.3;
    held.visible = ready;
    held.position.set(f.x, LANDER_Y - DROP_BELOW, f.z);
  }

  // The aim: the ring at p (null: none), and block `lit` glowing (-1: none).
  function setAim(p, lit = -1) {
    ring.visible = !!p;
    if (p) ring.position.set(p[0], p[1] + 0.02, p[2]);
    blocks.forEach((m, i) => {
      const on = i === lit;
      m.material.emissive.set(on ? '#ff9a2e' : m.userData.em[0]);
      m.material.emissiveIntensity = on ? 0.45 + 0.25 * Math.sin(t * 10) : m.userData.em[1];
    });
  }

  // The blocks left glowing (Q133): a, 0-1 (glowAt()'s); standing[i] whether block i is
  // still standing (only those glow).
  function setGlow(a, standing = null) {
    if (!a && !glowing) return;
    glowing = a > 0;
    glowMat.opacity = 0.5 * a;
    blocks.forEach((m, i) => { m.userData.glow.visible = glowing && !!standing?.[i]; });
  }

  // Time on: the base's movements, the Earth turning slowly, the odd shooting star.
  function tick(dt) {
    t += dt;
    base?.update(t, dt);
    fxTick(dt);
    if (earth) earth.rotation.y += dt * 0.02;
    nextStar -= dt;
    if (nextStar <= 0 && S) {
      nextStar = 8 + Math.random() * 14;   // "the odd shooting star (not too much)"
      const a = (Math.random() - 0.5) * 1.2, x0 = -40 + Math.random() * 80, y0 = 30 + Math.random() * 25, len = 6 + Math.random() * 6;
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-len * Math.cos(a), len * Math.sin(Math.abs(a)) * 0.5 + len * 0.3, 0)]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }));
      line.position.set(x0, y0, -70);
      S.add(line);
      shooting.push({ line, t: 0, life: 0.9, v: new THREE.Vector3(len * 1.6 * Math.cos(a), -len * 0.9, 0) });
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const s = shooting[i]; s.t += dt;
      s.line.position.addScaledVector(s.v, dt);
      s.line.material.opacity = Math.sin(Math.PI * Math.min(1, s.t / s.life)) * 0.9;
      if (s.t >= s.life) { S.remove(s.line); s.line.geometry.dispose(); s.line.material.dispose(); shooting.splice(i, 1); }
    }
  }

  return {
    get level() { return level; },
    // (the lab) the photos: resolves to what was loaded, or why not; the moon's drawing made lighter (src/ui/drawwatch.js)
    photos() { return ph ? Promise.resolve(null) : photos(); },
    setDrawing(c) { cuts = { ...c }; return cut(); },
    setLevel, setScene, sync, setLander, setAim, setGlow, tick,
    // what the glow is drawing now, for the log (Q109, Q133): the glowing meshes shown, and how bright
    glowState: () => ({ shown: blocks.filter(m => m.userData.glow.visible).length, of: blocks.length, opacity: Math.round(glowMat.opacity * 100) / 100 }),
    render() { if (S) renderer.render(S, camera); },
    resize(w, h) { renderer.setSize(w, h, false); aspect = w / h; fitCamera(); return aspect; },
    // a point in the world to where it is on the canvas: [0-1 across, 0-1 down]
    project(p) { const v = new THREE.Vector3(...p).project(camera); return [(v.x + 1) / 2, (1 - v.y) / 2]; },
    shootingStars: () => shooting.length,
    fxLive: () => fx.length,
    earthAt: () => earth && [earth.position.x, earth.position.y, earth.rotation.y].map(v => Math.round(v * 100) / 100),
    three: { renderer, camera, get scene() { return S; } },
  };
}
