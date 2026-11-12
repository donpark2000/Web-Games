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
import { HAND, BALL, SCALE, TIPS, FORK_Z, FORK_CROTCH_Y, COLOURS, MAX_DOTS, rng, FAR_TREES, farBalls, treeBalls, CORE } from '../core/topple.js';
import { makeSetting } from './topple-sets.js';

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
  const parkSky = scene.background = canvasTex(4, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#7DBCE6'); gr.addColorStop(0.7, '#CFE7F0'); gr.addColorStop(1, '#E4F1EE');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  const hemi = new THREE.HemisphereLight('#FFFFFF', '#7E9A6A', 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF6E4', 2.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#FFE7C2', 0.8);
  fill.position.set(-2, 3, 3); fill.target.position.set(0, 1, -4);
  scene.add(fill, fill.target);

  /* ---------- leaves (the Bush Looks mockup v2's "leafy") ---------- */

  // Small leaves all over a set of balls ([{ r, at }]), pointing outwards at
  // odd angles, over a dark core so the gaps look like shade; darker low down
  // (y0-y1: the heights it darkens over). L: a leaf's length. The same leaves
  // each time for the same balls (seeded by them). A group; its leaf count
  // in userData.leaves.
  const DARK = new THREE.Color('#24502A');
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.5); leafShape.quadraticCurveTo(0.42, -0.05, 0, 0.5); leafShape.quadraticCurveTo(-0.42, -0.05, 0, -0.5);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 3);
  const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide });
  const coreMats = {};
  const tmp = new THREE.Object3D(), col = new THREE.Color(), dir = new THREE.Vector3();
  function leafy(balls, pal, y0, y1, L, shadow = true) {
    const g = new THREE.Group(), rand = rng(1 + Math.round(Math.abs(balls[0].at[0] * 7919 + balls[0].at[2] * 104729 + balls.length)));
    const core = coreMats[pal[0]] ??= new THREE.MeshStandardMaterial({ color: new THREE.Color(pal[0]).lerp(DARK, 0.6), roughness: 1 });
    for (const b of balls) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(b.r * CORE, 14, 10), core);
      m.position.set(...b.at); m.castShadow = shadow; m.receiveShadow = true; g.add(m);
    }
    const inOther = (p, self) => balls.some(o => o !== self && Math.hypot(p[0] - o.at[0], p[1] - o.at[1], p[2] - o.at[2]) < o.r * 0.86);
    const spots = [];
    for (const b of balls) {
      const n = Math.round(4 * Math.PI * b.r * b.r / (L * L * 0.5));
      for (let i = 0; i < n; i++) {
        const u = rand() * 2 - 1, a = rand() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = [s * Math.cos(a), u, s * Math.sin(a)];
        const k = b.r * (0.93 + 0.14 * rand()), p = [b.at[0] + d[0] * k, b.at[1] + d[1] * k, b.at[2] + d[2] * k];
        if (p[1] < 0.02 || inOther(p, b)) continue;
        spots.push([p, d]);
      }
    }
    const leaves = new THREE.InstancedMesh(leafGeo, leafMat, spots.length);
    const cols = pal.map(c => new THREE.Color(c));
    spots.forEach(([p, d], i) => {
      tmp.position.set(...p); tmp.lookAt(dir.set(...p).add(new THREE.Vector3(...d)));
      tmp.rotateZ(rand() * Math.PI * 2); tmp.rotateX((rand() - 0.5) * 1.1);
      tmp.scale.setScalar(L * (0.8 + 0.5 * rand())); tmp.updateMatrix(); leaves.setMatrixAt(i, tmp.matrix);
      leaves.setColorAt(i, col.copy(cols[Math.floor(rand() * 3)]).offsetHSL(0, 0, (rand() - 0.5) * 0.06)
        .lerp(DARK, Math.max(0, Math.min(0.4, 0.4 * (y1 - p[1]) / (y1 - y0)))));
    });
    leaves.castShadow = shadow; leaves.receiveShadow = true; g.add(leaves);
    g.userData.leaves = spots.length;
    return g;
  }
  // (a tree's clump drawn as a little bush: clumpBalls, in src/core/topple.js)
  const BUSH_GREENS = ['#3F8A46', '#4C9A50', '#5AA85C'], LEAF_GREENS = ['#4F9A55', '#5DAA5E', '#3E8446'];
  const LEAF = 0.075 * SCALE;
  const barkMat = new THREE.MeshStandardMaterial({ color: '#7A5638', roughness: 1 });
  // a tapering limb from a to b, radius r0 to r1
  function limb(a, b, r0, r1) {
    const v = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, v.length(), 10), barkMat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  /* ---------- the park ---------- */

  let farLeaves = 0;
  const parkGroup = new THREE.Group();   // the lawn and the trees far off: level 1's setting
  scene.add(parkGroup);
  {
    const lawn = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = '#8DBE72'; g.fillRect(0, 0, w, h / 2);
      g.fillStyle = '#7CB062'; g.fillRect(0, h / 2, w, h / 2);
      g.fillStyle = 'rgba(255,255,255,.06)';
      for (let i = 0; i < 90; i++) g.fillRect(Math.random() * w, Math.random() * h, 1.5, 3);
    }, [60, 60]);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: lawn, roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; parkGroup.add(m);
    // the trees far off (FAR_TREES): the same leaves 4 times as big (they
    // still read from that far), casting no shadow (out of the shadows' reach
    // anyway); the trunk up into the clump's middle
    for (const f of FAR_TREES) {
      const t = limb(new THREE.Vector3(f.x, 0, f.z), new THREE.Vector3(f.x, f.trunk.top, f.z), f.trunk.r0, f.trunk.r1);
      t.castShadow = false; parkGroup.add(t);
      const c = leafy(farBalls(f), ['#4F9A55', '#5DAA5E', '#478C4E'], f.y - f.r, f.y + f.r, 0.3, false);
      parkGroup.add(c); farLeaves += c.userData.leaves;
    }
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

  /* ---------- a scene's things and blocks ---------- */

  let built = [], blockMeshes = [];
  let set = null, level = 1;   // the setting drawn (levels 2-4: topple-sets.js), null for the park
  const sets = new Map();      // level -> its setting (made once a visit), or null if its photos didn't load
  function box(o, mat, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), mat);
    m.position.set(o.x, o.y, o.z); if (o.yaw) m.rotation.y = o.yaw;
    m.castShadow = shadow; m.receiveShadow = true; scene.add(m);
    return m;
  }
  // A tree: the trunk tapering up into the middle clump, a branch from the
  // trunk to each other clump, the clumps little leafy bushes.
  function tree(p) {
    const g = new THREE.Group(), [mid, ...side] = p.clumps, base = new THREE.Vector3(...p.at);
    g.add(limb(base, new THREE.Vector3(...mid.at), p.r, p.r * 0.55));
    for (const c of side) g.add(limb(new THREE.Vector3(...c.from), new THREE.Vector3(...c.at), p.r * 0.5, p.r * 0.28));
    const { balls } = treeBalls(p);
    const leaves = leafy(balls, LEAF_GREENS, Math.min(...balls.map(b => b.at[1] - b.r)), Math.max(...balls.map(b => b.at[1] + b.r)), LEAF);
    g.add(leaves); g.userData.leaves = leaves.userData.leaves;
    return g;
  }
  // What a scene drew: { leaves, ms }.
  function setScene(parts) {
    const t0 = performance.now();
    for (const m of built) {
      scene.remove(m);
      m.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry && o.geometry !== leafGeo) o.geometry.dispose(); });
    }
    built = []; blockMeshes = [];
    let leaves = 0;
    for (const p of parts.props) {
      let m;
      if (p.part === 'bush') {
        const ys = p.balls.map(b => b.at[1] + b.r);
        m = leafy(p.balls, BUSH_GREENS, 0, Math.max(...ys), LEAF); scene.add(m);
      } else if (p.part === 'tree') { m = tree(p); scene.add(m); } else if (p.part === 'board') m = box(p, [boardMat, boardMat, frameMat, frameMat, frameMat, frameMat], false);
      else if (p.part === 'pole' || p.part === 'arm') m = box(p, postMat);   // the backboard's pole and arm
      else { m = set?.thing(p) ?? new THREE.Group(); scene.add(m); }   // levels 2-4's things
      leaves += m.userData.leaves || 0;
      built.push(m);
    }
    parts.blocks.forEach((b, i) => {
      let m;
      if (set && b.mat !== 'toy') {
        const geo = set.blockGeo(b); set.prepare(geo, b, i);
        m = new THREE.Mesh(geo, set.blockMat(b)); m.position.set(b.x, b.y, b.z); m.castShadow = m.receiveShadow = true; scene.add(m);
      } else m = box(b, blockMat(b.c));
      built.push(m); blockMeshes.push(m);
    });
    set?.clearEffects();
    // the shadows cover what the view shows
    const { min, max } = parts.bounds;
    const c = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const R = Math.max(max[0] - min[0], max[2] - min[2], max[1] - min[1]) * 0.75 + 0.5 + 1.2 * SCALE;
    const sd = set?.sun ?? [1.4, 4.2, 2.6];
    sun.position.set(c.x + sd[0] * SCALE, sd[1] * SCALE + 1, c.z + sd[2] * SCALE); sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: 12 * SCALE + 6 });
    sun.shadow.camera.updateProjectionMatrix();
    return { leaves, ms: Math.round(performance.now() - t0) };
  }

  /* ---------- the slingshot (drawn only; not in the physics) ---------- */

  let ballGeo = new THREE.SphereGeometry(BALL.r, 24, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    roughness: 0.55,
    map: canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#F2724F'; g.fillRect(0, h * 0.4, w, h * 0.2); }),
  });
  const tips = TIPS.map(t => new THREE.Vector3(...t));
  const slingParts = [];
  {
    const wood = new THREE.MeshStandardMaterial({ color: '#8A5A3B', roughness: 0.8 });
    const stick = (a, b, r) => {
      const dir = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 10), wood);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); scene.add(m);
      m.userData.wood = wood; slingParts.push(m);
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
  // the ball: level 1's painted one; from level 2 the iron ball with a lifting ring (mockup v3)
  let ballLook = null;
  function makeBall() {
    if (!ballLook) { const m = new THREE.Mesh(ballGeo, ballMat); m.castShadow = true; return m; }
    const { r, mat } = ballLook, m = new THREE.Mesh(ballGeo, mat); m.castShadow = true;
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.3, r * 0.25, 12), mat); boss.position.y = r * 0.98; m.add(boss);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.42, r * 0.11, 8, 20), mat); ring.position.y = r * 1.42; m.add(ring);
    return m;
  }
  let held = makeBall(); scene.add(held);
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
    farLeaves,
    setScene,
    // Each block's mesh where the physics has it; the balls in flight (meshes of balls gone taken away).
    sync(blockRecs, ballBodies) {
      blockRecs.forEach((rec, i) => {
        const m = blockMeshes[i], b = rec.body ?? rec;
        if (!m) return;
        m.visible = !rec.broken;
        m.position.set(b.position.x, b.position.y, b.position.z);
        m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      });
      const live = new Set(ballBodies);
      for (const [b, m] of ballMeshes) if (!live.has(b)) { scene.remove(m); ballMeshes.delete(b); }
      for (const b of ballBodies) {
        let m = ballMeshes.get(b);
        if (!m) { m = makeBall(); scene.add(m); ballMeshes.set(b, m); }
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
    // The camera ({ pos, look, fov }).
    setCamera(c) {
      camera.position.set(...c.pos); look.set(...c.look); camera.lookAt(look);
      if (c.fov && Math.abs(c.fov - camera.fov) > 1e-3) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
    },
    // The canvas' size in CSS px; returns its aspect.
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return camera.aspect;
    },
    render() { renderer.render(scene, camera); },
    // The setting for level n: the park (1), or a photo setting (2-4: its
    // photos loaded the first time). Resolves to { level, photos (true: the
    // photo look; false: the park drawn instead, its photos not loaded),
    // ms, error }.
    async setLevel(n) {
      const t0 = performance.now();
      let error = null;
      if (n > 1 && !sets.has(n)) {
        try { sets.set(n, await makeSetting(n, { renderer, leafy, LEAF })); } catch (e) { error = String(e.message ?? e); sets.set(n, null); }
      }
      if (set) scene.remove(set.group);
      set = n > 1 ? sets.get(n) ?? null : null;
      level = n;
      parkGroup.visible = !set;
      if (set) scene.add(set.group);
      scene.background = set ? set.background : parkSky;
      scene.environment = set ? set.environment : null;
      scene.fog = set ? set.fog : null;
      hemi.intensity = set ? set.hemi : 1.6;
      // the ball and the slingshot
      ballLook = set ? { r: 0.07, mat: set.ballMat } : null;
      ballGeo = new THREE.SphereGeometry(ballLook ? 0.07 : BALL.r, 28, 18);
      scene.remove(held); held = makeBall(); scene.add(held);
      for (const m of ballMeshes.values()) scene.remove(m);
      ballMeshes.clear();
      for (const m of slingParts) m.material = set ? set.slingMat : m.userData.wood;
      return { level: n, photos: !!set, ms: Math.round(performance.now() - t0), ...(error ? { error } : {}) };
    },
    // A block broke (ice shattered, a barrel burst): its pieces fly.
    burst(b, at, q, v) { set?.burst(b, at, q, v); },
    // The setting's moving parts (the effects, the snake) dt s on.
    tick(dt) { set?.tick(dt, performance.now() / 1000); },
    // Shards and drops still flying (a scene isn't cleared until they're down).
    get fxLive() { return set?.fxLive?.() ?? 0; },
    get level() { return level; },
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
