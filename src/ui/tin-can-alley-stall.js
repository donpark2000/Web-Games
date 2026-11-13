// Tin Can Alley's stall drawn with three.js (src/vendor/three), as the
// Fairground Stall Mockup v4 drew it: a wooden counter in front, a shelf
// of cans on a red cabinet ("KNOCK THEM ALL OFF!"), a curtain behind,
// striped walls and roof, a string of bulbs. The measurements are
// src/core/tin-can-alley.js; the bodies' places come from the physics
// (src/core/tin-can-alley-physics.js) each frame. Made by
// src/ui/tin-can-alley.js, which loads it with import(), so a browser
// that can't run three.js still gets the page's words.

import * as THREE from '../vendor/three/three.module.min.js';
import { SHELF, CAN, BALL, HAND, BACK, SIDE_X, COUNTER_Z, STALL_BOXES, CAN_COLOURS } from '../core/tin-can-alley.js';
import { applyCuts } from './drawcuts.js';

// Whether this device can draw 3D: a WebGL canvas can be made.
export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// antialias: false only for the speed test (log.html, Q99), which tries
// the drawing without it; the game always has it.
export function makeStall3d(canvas, { antialias = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const webgl = renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 0.75, 0.05, 80);
  const look = new THREE.Vector3();

  function canvasTex(w, h, draw, repeat) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  }
  scene.background = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7DBCE6'); gr.addColorStop(0.7, '#CFE7F0'); gr.addColorStop(1, '#E4F1EE');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#7E9A6A', 1.7));
  const sun = new THREE.DirectionalLight('#FFF6E4', 2.4);
  sun.position.set(1.4, 4.2, 0.2); sun.target.position.set(0, 1, -3);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.5, far: 10 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#FFE7C2', 0.9);
  fill.position.set(-1, 2, 2); fill.target.position.set(0, 1.2, -3);
  scene.add(fill, fill.target);

  /* ---------- the stall ---------- */

  const wood = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#86B56E', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const signTex = canvasTex(512, 286, (g, w, h) => {
    g.fillStyle = '#D9483B'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#F7B928'; g.lineWidth = 14; g.strokeRect(22, 22, w - 44, h - 44);
    g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 66px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    g.fillText('KNOCK THEM', w / 2, h * 0.38);
    g.fillText('ALL OFF!', w / 2, h * 0.64);
  });
  const curtainTex = canvasTex(512, 64, (g, w, h) => {
    const n = 16, sw = w / n;
    for (let i = 0; i < n; i++) {
      const gr = g.createLinearGradient(i * sw, 0, (i + 1) * sw, 0);
      gr.addColorStop(0, '#173E4C'); gr.addColorStop(0.5, '#2A6378'); gr.addColorStop(1, '#173E4C');
      g.fillStyle = gr; g.fillRect(i * sw, 0, sw, h);
    }
  });
  const red = wood('#D9483B');
  const MATS = {
    shelf: wood('#C0915F'),
    cabinet: [red, red, red, red, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }), red],
    curtain: new THREE.MeshStandardMaterial({ map: curtainTex, roughness: 1 }),
    post: wood('#8A5A3B'),
    counter: wood('#A86F45'),
    'counter-front': wood('#3A94D4'),
  };
  const rightSide = [];   // hidden in the side view, which looks in from outside the stall
  for (const b of STALL_BOXES) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), MATS[b.part]);
    m.position.set(b.x, b.y, b.z);
    m.receiveShadow = true;
    m.castShadow = b.part === 'shelf';
    scene.add(m);
    if (b.side > 0) rightSide.push(m);
  }
  const stripes = (a, b, n) => canvasTex(256, 32, (g, w, h) => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / n, 0, w / n, h); } });
  const sideMat = new THREE.MeshStandardMaterial({ map: stripes('#E2563F', '#FFF6EA', 10), roughness: 0.95, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(COUNTER_Z - BACK, 2.8), sideMat);
    m.rotation.y = -sx * Math.PI / 2; m.position.set(sx * SIDE_X, 1.4, (BACK + COUNTER_Z) / 2); m.receiveShadow = true; scene.add(m);
    if (sx > 0) rightSide.push(m);
  }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(3.0, -0.5 - BACK),
    new THREE.MeshStandardMaterial({ map: stripes('#FFF6EA', '#E2563F', 12), roughness: 1, side: THREE.DoubleSide }));
  roof.rotation.x = Math.PI / 2; roof.position.set(0, 2.85, (BACK - 0.5) / 2); scene.add(roof);
  const valTex = canvasTex(512, 64, (g, w, h) => {
    const n = 12, sw = w / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? '#FFF6EA' : '#E2563F';
      g.fillRect(i * sw, 0, sw, h * 0.6);
      g.beginPath(); g.arc(i * sw + sw / 2, h * 0.6, sw / 2, 0, Math.PI); g.fill();
    }
  });
  const val = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.3),
    new THREE.MeshStandardMaterial({ map: valTex, transparent: true, alphaTest: 0.5, roughness: 1, side: THREE.DoubleSide }));
  val.position.set(0, 2.42, -1.35); scene.add(val);
  const bulbGeo = new THREE.SphereGeometry(0.024, 10, 8);
  const bulbMats = [new THREE.MeshBasicMaterial({ color: '#FFE9A8' }), new THREE.MeshBasicMaterial({ color: '#FFC46B' })];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(bulbGeo, bulbMats[i % 2]); m.position.set(-1.32 + i * 0.24, 2.27, -1.33); scene.add(m);
  }

  /* ---------- cans and balls ---------- */

  const canGeo = new THREE.CylinderGeometry(CAN.r, CAN.r, CAN.h, 28, 1);
  const lidMat = new THREE.MeshStandardMaterial({ color: '#C8D0D6', metalness: 0.35, roughness: 0.35 });
  const star = (g, x, y, R, r) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  };
  const canMats = CAN_COLOURS.map(c => [new THREE.MeshStandardMaterial({
    roughness: 0.4, metalness: 0.15,
    map: canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = c; g.fillRect(0, 0, w, h);
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 46, w, 36);
      g.fillStyle = c;
      for (let i = 0; i < 4; i++) star(g, 32 + i * 64, 64, 13, 6);
      g.fillStyle = '#D5DCE1'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7);
    }),
  }), lidMat, lidMat]);
  const ballGeo = new THREE.SphereGeometry(BALL.r, 24, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    roughness: 0.55,
    map: canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#F2724F'; g.fillRect(0, h * 0.4, w, h * 0.2); }),
  });
  const held = new THREE.Mesh(ballGeo, ballMat); held.castShadow = true; scene.add(held);

  // The ring: where the ball will cross the shelf's front (or land, if short).
  const ring = new THREE.Group();
  for (const [a, b, c, o] of [[0.052, 0.09, '#1E3445', 0.55], [0.06, 0.082, '#FFD23F', 1]]) {
    const m = new THREE.Mesh(new THREE.RingGeometry(a, b, 40),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 5; ring.add(m);
  }
  ring.visible = false; scene.add(ring);

  const meshes = new Map();   // physics body -> its mesh
  function meshFor(body) {
    let m = meshes.get(body);
    if (!m) {
      m = new THREE.Mesh(body.kind === 'can' ? canGeo : ballGeo, body.kind === 'can' ? canMats[body.row % canMats.length] : ballMat);
      m.castShadow = true; m.receiveShadow = body.kind === 'can';
      scene.add(m);
      meshes.set(body, m);
    }
    return m;
  }

  return {
    webgl,
    // Each body's mesh where the physics has it; meshes of bodies gone are taken away.
    sync(bodies) {
      const live = new Set(bodies);
      for (const [b, m] of meshes) if (!live.has(b)) { scene.remove(m); meshes.delete(b); }
      for (const b of bodies) {
        const m = meshFor(b);
        m.position.set(b.position.x, b.position.y, b.position.z);
        m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      }
    },
    // The ball in the hand, pulled back a little as you drag.
    setHeld(visible, power = 0, aim = 0) {
      held.visible = visible;
      held.position.set(HAND.x - aim * 0.04, HAND.y - power * 0.03, HAND.z + power * 0.1);
    },
    // The ring at predict()'s point, or none.
    setRing(p) {
      ring.visible = !!p;
      if (!p) return;
      ring.position.set(...p.hit);
      if (p.where === 'ground') { ring.position.y = 0.01; ring.rotation.set(-Math.PI / 2, 0, 0); } else ring.rotation.set(0, 0, 0);
    },
    // The camera as cameraAt() gives it (the near wall hidden in the side view).
    setCamera(c) {
      camera.position.set(...c.pos); look.set(...c.look); camera.lookAt(look);
      if (c.fov && c.fov !== camera.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
      for (const m of rightSide) m.visible = c.view !== 'side';
    },
    // The canvas' size in CSS px; returns its aspect (the views come from
    // views(aspect, cans) and setCamera).
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return camera.aspect;
    },
    render() { renderer.render(scene, camera); },
    // ms to draw a frame, averaged over n (the log, once at the start).
    timeDraw(n = 10) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) renderer.render(scene, camera);
      return (performance.now() - t0) / n;
    },
    // Where a point of the stall shows on the canvas (0-1 across and down),
    // with the camera as last set (its matrices brought up to date first: a
    // render does that, and setCamera may have come after the last one).
    project(p) {
      camera.updateMatrixWorld();
      const v = new THREE.Vector3(...p).project(camera);
      return [(v.x + 1) / 2, (1 - v.y) / 2];
    },
    shelfY: SHELF.y,
    // The drawing lighter on a slow device (src/core/drawing.js, Q99): what changed.
    setDrawing(c) { return applyCuts({ renderer, scene, sun }, c); },
    // For the speed test (log.html, Q99): the three.js parts it changes,
    // and letting go of the canvas' GPU memory once it's done with.
    three: { renderer, scene, camera, sun },
    dispose() { renderer.dispose(); renderer.forceContextLoss(); },
  };
}
