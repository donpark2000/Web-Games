// Topple!'s park drawn with three.js (src/vendor/three), as the Block Game
// Mockup v8 drew it: a mown lawn (its stripes 1 m apart, so they show how far
// away things are), trees far off, the structure's painted wooden blocks, the
// bush, tree and glass backboard of the scene, the slingshot in front with
// the ball in its pouch, and the dots of the path ahead. The sizes are
// src/core/topple.js's (sceneParts()); the bodies' places come from the
// physics (src/core/topple-world.js) each frame. Made by src/ui/topple.js,
// which loads it with import(), so a browser that can't run three.js still
// gets the page's words.

import * as THREE from '../vendor/three/three.module.min.js';
import { HAND, BALL, SCALE, TIPS, FORK_Z, FORK_CROTCH_Y, COLOURS, MAX_DOTS } from '../core/topple.js';

// Whether this device can draw 3D: a WebGL canvas can be made.
export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function makePark3d(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const webgl = renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 0.75, 0.05, 160);
  const look = new THREE.Vector3();

  function canvasTex(w, h, draw, repeat) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  }
  scene.background = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7DBCE6'); gr.addColorStop(0.7, '#CFE7F0'); gr.addColorStop(1, '#E4F1EE');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#7E9A6A', 1.6));
  const sun = new THREE.DirectionalLight('#FFF6E4', 2.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#FFE7C2', 0.8);
  fill.position.set(-2, 3, 3); fill.target.position.set(0, 1, -4);
  scene.add(fill, fill.target);

  /* ---------- the park ---------- */

  {
    const lawn = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = '#8DBE72'; g.fillRect(0, 0, w, h / 2);
      g.fillStyle = '#7CB062'; g.fillRect(0, h / 2, w, h / 2);
      g.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 90; i++) g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
    }, [60, 60]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: lawn, roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; scene.add(m);
    const trunk = new THREE.MeshStandardMaterial({ color: '#7A5638', roughness: 1 });
    const leaves = ['#4F9A55', '#5DAA5E', '#478C4E'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
    const far = [[-9, -22], [-5, -27], [-1.5, -31], [3, -26], [7.5, -23], [12, -29], [-13, -30], [16, -21], [-17, -19], [0.5, -40], [-7, -38], [9, -36]];
    far.forEach(([x, z], i) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 8), trunk); t.position.set(x, 0.8, z); scene.add(t);
      const c = new THREE.Mesh(new THREE.SphereGeometry(1.5 + (i % 3) * 0.3, 14, 10), leaves[i % 3]); c.position.set(x, 2.6 + (i % 2) * 0.4, z); scene.add(c);
    });
  }

  /* ---------- materials ---------- */

  const blockMats = {};
  function blockMat(c) {
    blockMats[c] ??= new THREE.MeshStandardMaterial({
      roughness: 0.6,
      map: canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = COLOURS[c]; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2;
        for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, 14 + i * 17 + Math.sin(i) * 4); g.bezierCurveTo(w / 3, 8 + i * 17, 2 * w / 3, 22 + i * 17, w, 12 + i * 17); g.stroke(); }
        g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 8; g.strokeRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 3; g.strokeRect(7, 7, w - 14, h - 14);
      }),
    });
    return blockMats[c];
  }
  const frameMat = new THREE.MeshStandardMaterial({ color: '#5E6B73', roughness: 0.6, metalness: 0.3 });
  const postMat = new THREE.MeshStandardMaterial({ color: '#7F8A90', roughness: 0.5, metalness: 0.4 });
  // the glass backboard: a faint blue-white pane, two streaks of shine, an
  // orange border and a small square, as on a real one
  const boardTex = canvasTex(256, 170, (g, w, h) => {
    g.fillStyle = 'rgba(205,232,245,0.18)'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (const [x0, wd] of [[30, 16], [62, 7]]) { g.beginPath(); g.moveTo(x0, h); g.lineTo(x0 + wd, h); g.lineTo(x0 + wd + 60, 0); g.lineTo(x0 + 60, 0); g.closePath(); g.fill(); }
    g.strokeStyle = '#F2724F'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.lineWidth = 6; g.strokeRect(w / 2 - 40, h - 82, 80, 58);
  });
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const bushMats = ['#3F8A46', '#4C9A50', '#5AA85C'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));
  const barkMat = new THREE.MeshStandardMaterial({ color: '#7A5638', roughness: 1 });
  const leafMats = ['#4F9A55', '#5DAA5E', '#3E8446'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  // a tree between the side view's camera and the throw is see-through in that view
  const faded = m => { const f = m.clone(); f.transparent = true; f.opacity = 0.22; f.depthWrite = false; return f; };
  const barkFade = faded(barkMat), leafFades = leafMats.map(faded);

  /* ---------- a scene's things and blocks ---------- */

  let built = [], blockMeshes = [];
  const fades = [];   // [mesh, its material, see-through]
  function box(o, mat, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), mat);
    m.position.set(o.x, o.y, o.z); if (o.yaw) m.rotation.y = o.yaw;
    m.castShadow = shadow; m.receiveShadow = true; scene.add(m);
    return m;
  }
  function ball(at, r, mat) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    m.position.set(...at); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    return m;
  }
  function setScene(parts) {
    for (const m of built) { scene.remove(m); m.geometry.dispose(); }
    built = []; blockMeshes = []; fades.length = 0;
    for (const p of parts.props) {
      let m;
      if (p.part === 'bush') m = ball(p.at, p.r, bushMats[p.i % 3]);
      else if (p.part === 'leaves') { m = ball(p.at, p.r, leafMats[p.i % 3]); if (p.faded) fades.push([m, leafMats[p.i % 3], leafFades[p.i % 3]]); } else if (p.part === 'trunk') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.h, 16), barkMat);
        m.position.set(...p.at); m.castShadow = m.receiveShadow = true; scene.add(m);
        if (p.faded) fades.push([m, barkMat, barkFade]);
      } else if (p.part === 'board') m = box(p, [boardMat, boardMat, frameMat, frameMat, frameMat, frameMat], false);
      else m = box(p, postMat);   // the pole and the arm
      built.push(m);
    }
    for (const b of parts.blocks) { const m = box(b, blockMat(b.c)); built.push(m); blockMeshes.push(m); }
    // the shadows cover what the view shows
    const { min, max } = parts.bounds;
    const c = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const R = Math.max(max[0] - min[0], max[2] - min[2], max[1] - min[1]) * 0.75 + 0.5 + 1.2 * SCALE;
    sun.position.set(c.x + 1.4 * SCALE, 4.2 * SCALE + 1, c.z + 2.6 * SCALE); sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: 12 * SCALE + 6 });
    sun.shadow.camera.updateProjectionMatrix();
  }

  /* ---------- the slingshot (drawn only; not in the physics) ---------- */

  const ballGeo = new THREE.SphereGeometry(BALL.r, 24, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    roughness: 0.55,
    map: canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#F2724F'; g.fillRect(0, h * 0.4, w, h * 0.2); }),
  });
  const tips = TIPS.map(t => new THREE.Vector3(...t));
  {
    const wood = new THREE.MeshStandardMaterial({ color: '#8A5A3B', roughness: 0.8 });
    const stick = (a, b, r) => {
      const dir = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 10), wood);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); scene.add(m);
    };
    const crotch = new THREE.Vector3(0, FORK_CROTCH_Y, FORK_Z);
    stick(new THREE.Vector3(0, 0.95, FORK_Z), crotch, 0.018);
    for (const t of tips) stick(crotch, t, 0.014);
  }
  const bandMat = new THREE.MeshStandardMaterial({ color: '#5B2B1E', roughness: 0.7 });
  const bands = tips.map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), bandMat); scene.add(m); return m; });
  function setBand(m, a, b) {
    const dir = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.set(1, dir.length(), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  }
  const held = new THREE.Mesh(ballGeo, ballMat); held.castShadow = true; scene.add(held);
  const rest = new THREE.Vector3(0, 1.22, FORK_Z + 0.02);

  /* ---------- the dots ---------- */

  // Real spheres in the scene, so further dots look smaller (it shows the
  // distance), each white with a dark edge (a slightly bigger back face) to
  // read on sky and lawn; the last orange where the path touches something.
  const dotGeo = new THREE.SphereGeometry(0.016, 12, 8);
  const dots = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), MAX_DOTS);
  const dotEdges = new THREE.InstancedMesh(dotGeo, new THREE.MeshBasicMaterial({ color: '#1E3445', side: THREE.BackSide }), MAX_DOTS);
  for (const m of [dots, dotEdges]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
  const WHITE = new THREE.Color('#FFFFFF'), END = new THREE.Color('#F2724F');
  for (let i = 0; i < MAX_DOTS; i++) dots.setColorAt(i, WHITE);
  const m4 = new THREE.Matrix4(), one = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  /* ---------- the bodies ---------- */

  const ballMeshes = new Map();   // physics body -> its mesh

  return {
    webgl,
    setScene,
    // Each block's mesh where the physics has it; the balls in flight (meshes of balls gone taken away).
    sync(blockBodies, ballBodies) {
      blockBodies.forEach((b, i) => {
        const m = blockMeshes[i];
        if (!m) return;
        m.position.set(b.position.x, b.position.y, b.position.z);
        m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      });
      const live = new Set(ballBodies);
      for (const [b, m] of ballMeshes) if (!live.has(b)) { scene.remove(m); ballMeshes.delete(b); }
      for (const b of ballBodies) {
        let m = ballMeshes.get(b);
        if (!m) { m = new THREE.Mesh(ballGeo, ballMat); m.castShadow = true; scene.add(m); ballMeshes.set(b, m); }
        m.position.set(b.position.x, b.position.y, b.position.z);
        m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      }
    },
    // The ball in the pouch when a throw can be made (pulled back a little
    // as you drag: aim -1 to 1, power 0-1), the bands to it; else the bands slack.
    setSling(ready, aim = 0, power = 0) {
      held.visible = ready;
      held.position.set(HAND.x - aim * 0.04, HAND.y - power * 0.03, HAND.z + power * 0.1);
      const to = ready ? held.position.clone().add(new THREE.Vector3(0, 0, BALL.r * 0.6)) : rest;
      for (let i = 0; i < 2; i++) setBand(bands[i], tips[i], to);
    },
    // The dots (dotsFor()'s), `k` times their size; or none.
    setDots(d, k = 1) {
      const n = d ? d.pts.length : 0;
      for (let i = 0; i < n; i++) {
        pv.set(...d.pts[i]);
        m4.compose(pv, one, sv.setScalar(k)); dots.setMatrixAt(i, m4);
        m4.compose(pv, one, sv.setScalar(1.45 * k)); dotEdges.setMatrixAt(i, m4);
        dots.setColorAt(i, d.stopped && i === n - 1 ? END : WHITE);
      }
      dots.count = dotEdges.count = n;
      dots.instanceMatrix.needsUpdate = dotEdges.instanceMatrix.needsUpdate = true;
      if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
    },
    dotCount: () => dots.count,
    // The camera ({ pos, look, fov }); `side`: the tree on the camera's side see-through.
    setCamera(c, side = false) {
      camera.position.set(...c.pos); look.set(...c.look); camera.lookAt(look);
      if (c.fov && Math.abs(c.fov - camera.fov) > 1e-3) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
      for (const [m, solid, see] of fades) m.material = side ? see : solid;
    },
    // The canvas' size in CSS px; returns its aspect.
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return camera.aspect;
    },
    render() { renderer.render(scene, camera); },
    // ms to draw a frame, averaged over n (the log).
    timeDraw(n = 10) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) renderer.render(scene, camera);
      return (performance.now() - t0) / n;
    },
    // Where a point shows on the canvas (0-1 across and down), with the camera as last set.
    project(p) {
      camera.updateMatrixWorld();
      const v = new THREE.Vector3(...p).project(camera);
      return [(v.x + 1) / 2, (1 - v.y) / 2];
    },
    get fov() { return camera.fov; },
  };
}
