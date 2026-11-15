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
import { CABLE_TOP, DROP_FROM, ZIP_Y, SNOWMAN, MACHINE, MUZZLE_Y, machineAt } from '../core/topple-movers.js';

// Where the crane's cable goes up to (out of sight): the jib; a drop's from
// higher, over the load hauled up out of sight.
const cableTop = m => (m.move === 'drop' ? DROP_FROM + 3 : CABLE_TOP);
import { makeSetting, birds } from './topple-sets.js';
import { applyCuts } from './drawcuts.js';
import { makeKeepout } from './topple-keepout.js';

// Whether this device can draw 3D: a WebGL canvas can be made.
export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// antialias: false only for the speed test (log.html, Q99), which tries
// the drawing without it; the game always has it.
export function makePark3d(canvas, { antialias = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const webgl = renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1';
  // A material's shader that the graphics chip can't build (Q109: blocks and
  // the snowflake not drawn on the tablet, the rock and trees fine: their
  // materials were new to that page, theirs not): three.js skips what it
  // can't draw and says so only in the console, which the site's log
  // doesn't read. Kept here, and told to the page (onError) at once.
  const shaderErrors = [];
  let onError = null;
  renderer.debug.onShaderError = (gl, program, vs, fs) => {
    const cut = f => { try { return String(f()).slice(0, 240); } catch { return '?'; } };
    const e = { program: cut(() => gl.getProgramInfoLog(program)), vertex: cut(() => gl.getShaderInfoLog(vs)), fragment: cut(() => gl.getShaderInfoLog(fs)) };
    shaderErrors.push(e);
    onError?.(e);
  };

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
      t.userData.far = c.userData.far = true;   // (the speed test hides them)
    }
  }
  // two birds circling over the trees beyond (developer, 2026-11-12: "maybe a bird or two for the first level")
  const parkBirds = birds(parkGroup);
  // What the page draws over the view's top (the level's name, the hearts:
  // .hudpill), in NDC: [{ x0, x1, y0: its bottom }] (Star Light's moon
  // keeps below them).
  const hudCovers = () => {
    const c = renderer.domElement.getBoundingClientRect();
    if (!c.width || !c.height) return [];
    return [...document.querySelectorAll('.hudpill')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0)
      .map(r => ({ x0: 2 * (r.left - c.left) / c.width - 1, x1: 2 * (r.right - c.left) / c.width - 1, y0: 1 - 2 * (r.bottom - c.top) / c.height }));
  };
  // The view's sides along y, z as [left x, right x], with the camera as now
  // (the animals start and end their crossing just out of sight): where the
  // line's points show at the canvas' edges, found by halving.
  const viewEdges = (y, z) => {
    camera.updateMatrixWorld();
    const u = x => (new THREE.Vector3(x, y, z).project(camera).x + 1) / 2;
    const find = goal => { let lo = -60, hi = 60; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (u(mid) < goal) lo = mid; else hi = mid; } return (lo + hi) / 2; };
    return [find(0), find(1)];
  };

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
  // Hardest's thing not to hit (Q97): its look, its warning mark, what a hit does
  const keep = makeKeepout({ THREE, scene, canvasTex });
  // The blocks left glowing after a pause (Q101): each block's own shape a
  // little bigger over it, a warm white added to what's under it, hidden
  // except while it glows (so it costs nothing the rest of the time).
  const glowMat = new THREE.MeshBasicMaterial({ color: '#FFF1C4', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  let glowing = false;
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
    // the animals cross once a scene
    if (set) set.newScene?.(viewEdges); else parkBirds.reset(viewEdges);
    keep.reset();
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
      else if (p.part === 'keepout') { m = keep.build(p); scene.add(m); }   // Hardest's thing not to hit (Q97)
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
      set?.decorate?.(m, b, i);
      const over = new THREE.Mesh(m.geometry, glowMat);
      over.scale.setScalar(1.03); over.visible = false; over.renderOrder = 2; m.add(over); m.userData.glow = over;
      built.push(m); blockMeshes.push(m);
    });
    set?.placed?.(blockMeshes, parts);
    set?.clearEffects();
    // the shadows cover what the view shows
    const { min, max } = parts.bounds;
    const c = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const R = Math.max(max[0] - min[0], max[2] - min[2], max[1] - min[1]) * 0.75 + 0.5 + 1.2 * SCALE;
    const sd = set?.sun ?? [1.4, 4.2, 2.6];
    sun.position.set(c.x + sd[0] * SCALE, sd[1] * SCALE + 1, c.z + sd[2] * SCALE); sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 0.5, far: 12 * SCALE + 6 });
    sun.shadow.camera.updateProjectionMatrix();
    applyCuts(three, cuts);   // the new blocks' and things' surfaces too
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
    set?.decorateBall?.(m);
    if (set?.ballRing === false) return m;
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

  /* ---------- the thing that moves in the way (Hardest, Q106) ---------- */

  // The crane's load (mockup v2; developer, 2026-11-14, of v1's yellow
  // skip: "did not really look like anything. Maybe make it look more like
  // bricks or some other building material"), drawn to fill the physics'
  // box (m.load), round the body's middle, turned as the body is (the
  // swing's lean), so the cable always points at its top (CABLE_TOP):
  // - girders: a bundle of six orange steel I-beams, two deep and three high,
  //   slung on two chains (orange, so it doesn't read as the structure's
  //   grey steel posts);
  // - bricks: a strapped pallet of bricks on four chains (v1's first look,
  //   a plain pallet, read as part of a brick structure; this one has its
  //   pallet, mortar lines and blue straps).
  let moverMeshes = [];
  const chainMat = new THREE.MeshStandardMaterial({ color: '#3A3D40', roughness: 0.5, metalness: 0.6 });
  const hookMat = new THREE.MeshStandardMaterial({ color: '#E8B22A', roughness: 0.5, metalness: 0.3 });
  const girderMat = new THREE.MeshStandardMaterial({ color: '#E0641F', roughness: 0.5, metalness: 0.35 });
  const brickTex = (rows, cols) => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#C9C1B4'; g.fillRect(0, 0, w, h);           // mortar
    const bh = h / rows, bw = w / cols;
    for (let r = 0; r < rows; r++) for (let c = -1; c < cols + 1; c++) {
      const x = c * bw + (r % 2 ? bw / 2 : 0), shade = 0.85 + 0.3 * (((r * 7 + c * 13) % 5) / 5);
      g.fillStyle = `rgb(${Math.round(178 * shade)},${Math.round(74 * shade)},${Math.round(52 * shade)})`;
      g.fillRect(x + 3, r * bh + 3, bw - 6, bh - 6);
    }
    // two blue straps round the stack
    g.fillStyle = '#2C6FD6';
    for (const sx of [0.27, 0.73]) g.fillRect(w * sx - 7, 0, 14, h);
  });
  const brickSide = new THREE.MeshStandardMaterial({ map: brickTex(6, 4), roughness: 0.85 });
  const brickTop = new THREE.MeshStandardMaterial({ map: brickTex(4, 4), roughness: 0.85 });
  const palletMat = new THREE.MeshStandardMaterial({ color: '#B98A55', roughness: 0.9 });
  const part = (w, h, d, mat, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); return o; };
  function girders(g, { w, h, d }) {
    // each I-beam: two flanges and a web; two deep, three high, filling the box
    const bh = h / 3, fd = d / 2 - 0.02, ft = 0.035;
    for (let row = 0; row < 3; row++) for (const sz of [-1, 1]) {
      const y = -h / 2 + bh * (row + 0.5), z = sz * d / 4;
      g.add(part(w, ft, fd, girderMat, 0, y - bh / 2 + ft / 2 + 0.005, z));
      g.add(part(w, ft, fd, girderMat, 0, y + bh / 2 - ft / 2 - 0.005, z));
      g.add(part(w, bh - 2 * ft - 0.01, 0.03, girderMat, 0, y, z));
    }
  }
  function bricks(g, { w, h, d }) {
    const ph = 0.12;
    // the pallet: a deck, three runners under it
    g.add(part(w, 0.03, d, palletMat, 0, -h / 2 + ph - 0.015, 0));
    for (const sx of [-0.42, 0, 0.42]) g.add(part(0.09, ph - 0.03, d, palletMat, sx * w, -h / 2 + (ph - 0.03) / 2, 0));
    // the stack, a little in from the pallet's edges
    const sh = h - ph;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, sh, d * 0.94), [brickSide, brickSide, brickTop, palletMat, brickSide, brickSide]));
    g.children.at(-1).position.y = -h / 2 + ph + sh / 2;
  }
  // The park's (Q106, session 2): a tyre on a rope up to a branch out of
  // sight (the swing's pivot, CABLE_TOP); a black bucket seat on two chains
  // from a trolley on the zip line's cable (ZIP_Y, drawn across the park);
  // a kite (red and yellow, two spars, a tail of bows) on a string to
  // someone behind you, off the right of the view. Drawn only: the rope,
  // chains, cable, tail and string (the physics has the tyre's ring, the
  // seat's box and the kite's diamond).
  const rubberMat = new THREE.MeshStandardMaterial({ color: '#232323', roughness: 0.92 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#9C7A4E', roughness: 0.95 });
  const seatMat = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.85, side: THREE.DoubleSide });
  const seatIn = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.9 });
  const kiteMats = ['#E23B2E', '#F5C636'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide }));
  const sparMat = new THREE.MeshStandardMaterial({ color: '#4A3826', roughness: 0.8 });
  const stringMat = new THREE.MeshBasicMaterial({ color: '#F4F1EA' });
  const rod = (r, L, mat) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), mat);
  // a line from a to b (Vector3s, in g's frame)
  const span = (g, a, b, r, mat) => { const v = b.clone().sub(a), c = rod(r, v.length(), mat); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(c); return c; };
  function tyre(g, m) {
    const { w, d, hole } = m.load, R = w / 2, tube = (R - hole) / 2;
    const t = new THREE.Mesh(new THREE.TorusGeometry(hole + tube, tube, 12, 28), rubberMat);
    t.scale.z = d / (2 * tube); g.add(t);
    // the rope tied round its top, up to the branch
    const L = CABLE_TOP - m.y - R;
    const rope = rod(0.025, L, ropeMat); rope.position.y = R + L / 2; g.add(rope);
  }
  function zipSeat(g, m) {
    const { w, h } = m.load;
    // a black rubber bucket seat (a red box read as one of the blocks): open at the top, a rim, a floor
    const b = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w * 0.42, h, 24, 1, true), seatMat); g.add(b);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.035, 8, 24), seatMat); rim.rotation.x = Math.PI / 2; rim.position.y = h / 2; g.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(w * 0.42, 24), seatIn); floor.rotation.x = -Math.PI / 2; floor.position.y = -h / 2 + 0.02; g.add(floor);
    const ty = ZIP_Y - m.y - 0.12;   // the trolley, just under the cable
    g.add(part(0.22, 0.12, 0.1, chainMat, 0, ty, 0));
    for (const sx of [-1, 1]) span(g, new THREE.Vector3(sx * w * 0.45, h / 2, 0), new THREE.Vector3(sx * 0.06, ty - 0.06, 0), 0.012, chainMat);
  }
  function kite(g, m) {
    const { w, h } = m.load;
    const tri = (pts, mat) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); geo.computeVertexNormals(); g.add(new THREE.Mesh(geo, mat)); };
    const T = [0, h / 2, 0], B = [0, -h / 2, 0], Lf = [-w / 2, 0, 0], Rt = [w / 2, 0, 0], C = [0, 0, 0];
    tri([T, Lf, C], kiteMats[0]); tri([T, C, Rt], kiteMats[1]); tri([Lf, B, C], kiteMats[1]); tri([C, B, Rt], kiteMats[0]);
    const v = rod(0.012, h, sparMat); v.position.z = -0.01; g.add(v);
    const x = rod(0.012, w, sparMat); x.rotation.z = Math.PI / 2; x.position.z = -0.01; g.add(x);
    // the tail: a line and five bows below the bottom point
    span(g, new THREE.Vector3(...B), new THREE.Vector3(0.05, -h / 2 - 1.1, 0), 0.006, stringMat);
    for (let k = 1; k <= 5; k++) { const bow = part(0.12, 0.05, 0.01, kiteMats[k % 2], 0.01 * k, -h / 2 - 0.2 * k, 0); bow.rotation.z = 0.5 * (k % 2 ? 1 : -1); g.add(bow); }
  }
  // Frosty Times' (Q106, session 3): drawn round the physics' shapes (the
  // snowman's three balls, a snowball, the snowflake's arms and branches),
  // with what is drawn only: the snowman's skates, stick arms, scarf, coal
  // and carrot and his top hat (knocked off by a ball at his head, it
  // tumbles to the snow); the snowball machine; the snowflake's darker
  // edge. Snow a little blue in its shade (white on the snow would vanish);
  // the snowflake icy blue with a darker blue edge and a glint.
  const snowMat = new THREE.MeshStandardMaterial({ color: '#F6F9FD', roughness: 0.85 });
  const coalMat = new THREE.MeshStandardMaterial({ color: '#1C1C1E', roughness: 0.6 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: '#E8742A', roughness: 0.7 });
  const stickMat = new THREE.MeshStandardMaterial({ color: '#5A3E28', roughness: 0.9 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: '#C8283A', roughness: 0.8 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: '#C9CED3', roughness: 0.3, metalness: 0.8 });
  const flakeMat = new THREE.MeshStandardMaterial({ color: '#A9DDF7', emissive: '#3C86BA', emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.15 });
  const flakeEdge = new THREE.MeshStandardMaterial({ color: '#2B6A9A', roughness: 0.4 });
  const machineMat = new THREE.MeshStandardMaterial({ color: '#2F7BD0', roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide });
  const ball = (r, mat, x, y, z, seg = 24) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 2 / 3)), mat); o.position.set(x, y, z); return o; };
  function snowman(g, m) {
    const [b, md, hd] = m.load.shapes, h = m.load.h;
    for (const sh of [b, md, hd]) g.add(ball(sh.r, snowMat, ...sh.at));
    // coal eyes and buttons, a carrot nose, all facing you (+z)
    const [hx, hy, hz] = hd.at, fr = hd.r;
    for (const sx of [-1, 1]) g.add(ball(0.035, coalMat, hx + sx * 0.09, hy + 0.06, hz + fr * 0.92, 8));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.26, 10), carrotMat); nose.rotation.x = Math.PI / 2; nose.position.set(hx, hy - 0.01, hz + fr + 0.1); g.add(nose);
    for (const k of [-0.12, 0.05]) g.add(ball(0.04, coalMat, 0, md.at[1] + k, md.r * 0.97, 8));
    // a red scarf at his neck, its end hanging
    const neck = (md.at[1] + md.r + hd.at[1] - hd.r) / 2;
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(hd.r * 0.82, 0.06, 8, 20), scarfMat); scarf.rotation.x = Math.PI / 2; scarf.position.y = neck; g.add(scarf);
    g.add(part(0.11, 0.3, 0.04, scarfMat, 0.12, neck - 0.16, hd.r * 0.8));
    // stick arms, out and up
    for (const sx of [-1, 1]) span(g, new THREE.Vector3(sx * md.r * 0.8, md.at[1] + 0.05, 0), new THREE.Vector3(sx * (md.r + 0.5), md.at[1] + 0.35, 0.05), 0.022, stickMat);
    // two skates under him: black boots, silver blades along the way he goes
    for (const sz of [-1, 1]) {
      g.add(part(0.34, 0.07, 0.14, coalMat, 0, -h / 2 + SNOWMAN.skate - 0.035 + 0.01, sz * 0.16));
      g.add(part(0.46, 0.035, 0.025, bladeMat, 0, -h / 2 + 0.018, sz * 0.16));
    }
    // the top hat (its own group: knocked off, it leaves him), a red band round it
    const hat = new THREE.Group(), top = hd.at[1] + hd.r - 0.04;
    hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20), coalMat));
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, SNOWMAN.hat - 0.03, 20), coalMat); crown.position.y = (SNOWMAN.hat - 0.03) / 2 + 0.015; hat.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.183, 0.183, 0.05, 20), scarfMat); band.position.y = 0.05; hat.add(band);
    hat.position.set(0, top, 0); hat.rotation.z = -0.12; g.add(hat);
    Object.assign(g.userData, { snowman: true, hat, lastX: null, lean: 0 });
  }
  // a snowball: a smooth ball of snow (lumpy, its facets showed), a few clumps stuck on so its roll shows
  function snowball(g, m) {
    const r = m.load.w / 2;
    g.add(ball(r, snowMat, 0, 0, 0, 28));
    for (const [a, b] of [[0.4, 0.3], [2.3, -0.5], [4.1, 0.9], [5.4, -1.1]]) g.add(ball(r * 0.22, snowMat, r * 0.9 * Math.cos(a) * Math.cos(b), r * 0.9 * Math.sin(a) * Math.cos(b), r * 0.9 * Math.sin(b), 10));
    g.userData.snowball = true;
  }
  function snowflake(g, m) {
    // each arm and branch as the physics has it, over a darker one a little bigger behind (its edge)
    for (const sh of m.load.shapes) {
      const [hx, hy, hz] = sh.half;
      const face = part(2 * hx, 2 * hy, 2 * hz, flakeMat, ...sh.at); face.rotation.z = sh.rot; g.add(face);
      const edge = part(2 * hx + 0.04, 2 * hy + 0.04, 2 * hz * 0.6, flakeEdge, sh.at[0], sh.at[1], sh.at[2] - hz * 0.7); edge.rotation.z = sh.rot; g.add(edge);
    }
    g.userData.flake = true;
  }
  // The snowball machine: a blue box on skids, a hopper of snow on top, a chute up to the right (its muzzle where the snowballs start)
  function machine(m) {
    const g = new THREE.Group(), [x, , z] = machineAt(m), { w, h, d } = MACHINE;
    g.add(part(w, h * 0.7, d, machineMat, 0, h * 0.35 + 0.08, 0));
    for (const sz of [-1, 1]) g.add(part(w + 0.2, 0.06, 0.08, coalMat, 0, 0.03, sz * d * 0.4));
    const hop = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.28, h * 0.3, 16), machineMat); hop.position.set(-0.08, h * 0.85 + 0.08, 0); g.add(hop);
    g.add(ball(w * 0.36, snowMat, -0.08, h + 0.08, 0, 16));
    // the chute: from the box's right side up to the muzzle (MACHINE.back to its right, MUZZLE_Y up)
    const a = new THREE.Vector3(w * 0.2, h * 0.45, 0), b = new THREE.Vector3(MACHINE.back, MUZZLE_Y, 0), v = b.clone().sub(a);
    const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.28, v.length() + 0.2, 16, 1, true), machineMat);
    chute.position.copy(a).add(b).multiplyScalar(0.5); chute.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(chute);
    g.position.set(x, 0, z);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  // Puffs of snow (a snowball burst, or come down) and sparkles (the snowflake breaking up): little bits flying out and fading
  const puffGeo = new THREE.IcosahedronGeometry(1, 0);
  const puffMats = { snow: new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.9, depthWrite: false }), sparkle: new THREE.MeshBasicMaterial({ color: '#CDEFFF', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }) };
  let puffs = [];
  function puff(kind, at, n = 26, size = 0.08) {
    const rand = rng((Math.abs(Math.round(at[0] * 997 + at[1] * 131 + at[2] * 17)) >>> 0) || 1);
    for (let i = 0; i < n; i++) {
      const o = new THREE.Mesh(puffGeo, puffMats[kind].clone()), a = rand() * 2 * Math.PI, up = rand() * 2 - 0.4, sp = 1 + rand() * 2.2;
      o.position.set(...at); o.scale.setScalar(size * (0.6 + rand()));
      scene.add(o);
      puffs.push({ o, v: [Math.cos(a) * sp, up * sp, Math.sin(a) * sp * 0.6], life: 0.6 + rand() * 0.5, t: 0, g: kind === 'snow' ? 6 : 1.5, top: kind === 'snow' ? 0.9 : 0.95 });
    }
  }
  function stepPuffs(dt) {
    puffs = puffs.filter(p => {
      p.t += dt;
      if (p.t >= p.life) { scene.remove(p.o); p.o.material.dispose(); return false; }
      p.v[1] -= p.g * dt;
      p.o.position.x += p.v[0] * dt; p.o.position.y = Math.max(0.02, p.o.position.y + p.v[1] * dt); p.o.position.z += p.v[2] * dt;
      p.o.material.opacity = p.top * (1 - p.t / p.life);
      return true;
    });
  }
  // The snowman's hat knocked off: flies up and out to the side he's skating towards (straight back, it
  // fell behind him out of sight), tumbling, and lies on the snow.
  let hatFly = null;
  function knockHat(g, dir = 1) {
    const hat = g.userData.hat;
    if (!hat || hatFly) return;
    const p = new THREE.Vector3(); hat.getWorldPosition(p);
    g.remove(hat); hat.position.copy(p); hat.rotation.set(0, 0, -0.12); scene.add(hat);
    hatFly = { hat, v: [1.3 * dir, 3.4, -0.5], spin: [-3.5, 1.2, 2.4 * dir], rest: false };
    moverStatic.push(hat);
  }
  function stepHat(dt) {
    if (!hatFly || hatFly.rest) return;
    const h = hatFly.hat, v = hatFly.v;
    v[1] -= 9.82 * dt;
    h.position.x += v[0] * dt; h.position.y += v[1] * dt; h.position.z += v[2] * dt;
    h.rotation.x += hatFly.spin[0] * dt; h.rotation.y += hatFly.spin[1] * dt; h.rotation.z += hatFly.spin[2] * dt;
    // on the snow: lying on its side
    if (h.position.y <= 0.18 && v[1] < 0) { h.position.y = 0.18; h.rotation.set(Math.PI / 2, h.rotation.y, 0.3); hatFly.rest = true; }
  }
  // The kite's string: to someone behind you, off the right of the view (world m)
  const KITE_HAND = new THREE.Vector3(7, 1.3, 2.5);
  let moverStatic = [];   // the zip line's cable, the kite's string, the snowball machine, a knocked-off hat: not on a body
  let lastT = null;       // syncMovers' last time (s): the puffs' and the hat's steps
  const OWN = { tyre, zip: zipSeat, kite, snowman, snowball, flake: snowflake };
  function loadMesh(m) {
    if (OWN[m.look]) {
      const g = new THREE.Group();
      g.userData = { kite: m.look === 'kite' };
      OWN[m.look](g, m);
      g.traverse(o => { if (o.isMesh && o.material !== stringMat) { o.castShadow = true; o.receiveShadow = true; } });
      return g;
    }
    const g = new THREE.Group(), { w, h, d } = m.load, top = h / 2;
    (m.look === 'bricks' ? bricks : girders)(g, m.load);
    // the chains from the load's top to the hook (girders: two, at a third from each end; bricks: four corners), the hook, the cable up
    const hookY = top + 0.55, hook = new THREE.Vector3(0, hookY, 0);
    const ends = m.look === 'bricks' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => [sx * w * 0.47, sz * d * 0.45]) : [[-w * 0.33, 0], [w * 0.33, 0]];
    for (const [x, z] of ends) {
      const a = new THREE.Vector3(x, top, z), v = hook.clone().sub(a);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, v.length(), 6), chainMat);
      c.position.copy(a).add(hook).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
      g.add(c);
    }
    const blockH = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.1), hookMat); blockH.position.y = hookY + 0.11; g.add(blockH);
    // (a drop's cable from higher up, so it reaches the load hauled up out of sight; its length follows the load: syncMovers)
    const L = cableTop(m) - m.y - hookY - 0.22;
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, L, 6), chainMat);
    cable.position.y = hookY + 0.22 + L / 2; g.add(cable);
    g.userData = { cable, cableL: L, cableFrom: hookY + 0.22, drop: m.move === 'drop', top: cableTop(m) };
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  function setMovers(m) {
    for (const g of [...moverMeshes, ...moverStatic]) { scene.remove(g); g.traverse(o => o.geometry?.dispose()); }
    moverMeshes = []; moverStatic = [];
    for (const p of puffs) { scene.remove(p.o); p.o.material.dispose(); }
    puffs = []; hatFly = null; lastT = null;
    if (!m) return;
    for (let i = 0; i < m.n; i++) { const g = loadMesh(m); scene.add(g); moverMeshes.push(g); }
    if (m.look === 'zip') {
      // the cable across the park, well past both ends of the seat's way
      const c = rod(0.016, 2 * (m.span + 12), chainMat);
      c.rotation.z = Math.PI / 2; c.position.set(m.x0, ZIP_Y, m.z);
      scene.add(c); moverStatic.push(c);
    }
    if (m.look === 'kite') {
      const s = rod(0.005, 1, stringMat);
      s.userData.string = true;
      scene.add(s); moverStatic.push(s);
    }
    if (m.look === 'snowball') { const g = machine(m); scene.add(g); moverStatic.push(g); }
    applyCuts(three, cuts);
  }

  /* ---------- the bodies ---------- */

  const ballMeshes = new Map();   // physics body -> its mesh
  let onSound = null;             // a setting's own sounds (the owl's hoot): set by the page
  const three = { renderer, scene, camera, sun };
  let cuts = {};                  // the drawing's cuts (src/core/drawing.js's level): made again on each scene and setting

  return {
    set onSound(f) { onSound = f; },
    set onError(f) { onError = f; for (const e of shaderErrors) f?.(e); },
    webgl,
    farLeaves,
    setScene,
    // Hardest's thing that moves (Q106): its look (moverFor()'s, or null), and each load where the physics has it.
    setMovers,
    syncMovers(bodies, t = 0) {
      const dt = lastT == null ? 0 : Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      bodies.forEach((b, i) => {
        const g = moverMeshes[i];
        if (!g) return;
        const u0 = g.userData, was = g.position.clone();
        // Frosty Times': a snowball burst, or come down on the snow; the snowflake broken up (puffs, sparkles), hidden till back
        const hidden = !!(b.gone || b.burst);
        if (hidden && g.visible && dt > 0) {
          if (u0.snowball) puff('snow', [was.x, was.y, was.z], b.burst ? 30 : 18, b.burst ? 0.09 : 0.06);
          if (u0.flake) puff('sparkle', [was.x, was.y, was.z], 34, 0.05);
        }
        g.visible = !hidden;
        g.position.set(b.position.x, b.position.y, b.position.z);
        g.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
        if (u0.snowman) {
          // leaning into the way he skates (drawn only); his hat off once a ball has hit his head
          const vx = dt > 0 && u0.lastX != null ? (b.position.x - u0.lastX) / dt : 0;
          u0.lastX = b.position.x;
          u0.lean += (Math.max(-0.2, Math.min(0.2, -0.06 * vx)) - u0.lean) * Math.min(1, dt * 6);
          g.rotation.z = u0.lean;
          if (b.hatOff && u0.hat?.parent === g) knockHat(g, vx < 0 ? -1 : 1);
        }
        // the snowflake rocks a little as it falls (drawn only: the physics keeps its arms face on)
        if (u0.flake) g.rotateY(0.28 * Math.sin(1.9 * t));
        if (g.userData.kite) {
          // the kite flutters as it hangs in the wind (drawn only: the physics' diamond stays upright)
          g.rotation.z += 0.1 * Math.sin(2.7 * t) + 0.04 * Math.sin(7.3 * t);
          const s = moverStatic.find(o => o.userData.string);
          if (s) {
            const a = g.position, v = KITE_HAND.clone().sub(a), L = v.length();
            s.position.copy(a).add(KITE_HAND).multiplyScalar(0.5);
            s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
            s.scale.y = L;
          }
        }
        // a drop: the cable from the load up to the jib, however high the load is
        const u = g.userData;
        if (u.drop) {
          const len = Math.max(0.01, u.top - b.position.y - u.cableFrom);
          u.cable.scale.y = len / u.cableL;
          u.cable.position.y = u.cableFrom + len / 2;
        }
      });
      stepPuffs(dt); stepHat(dt);
    },
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
        m.visible = !b.struck;   // a ball that hit the thing not to hit has turned into a heart (keepHit)
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
    // what the glow is drawing now, for the log (Q109): the glowing meshes shown, and how bright
    glowState: () => ({ shown: blockMeshes.filter(m => m.userData.glow.visible).length, of: blockMeshes.length, opacity: Math.round(glowMat.opacity * 100) / 100 }),
    // The blocks left glowing (Q101): a, 0-1 (glowAt()'s); standing[i]
    // whether block i is still standing (only those glow).
    setGlow(a, standing = null) {
      if (!a && !glowing) return;
      glowing = a > 0;
      glowMat.opacity = 0.5 * a;
      blockMeshes.forEach((m, i) => { m.userData.glow.visible = glowing && m.visible && !!standing?.[i]; });
    },
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
        try { sets.set(n, await makeSetting(n, { renderer, leafy, LEAF, camera, covers: hudCovers, sound: name => onSound?.(name) })); } catch (e) { error = String(e.message ?? e); sets.set(n, null); }
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
      // the lights' colours: the day's, or the setting's own (the night's)
      const li = set?.lights;
      hemi.color.set(li?.hemi?.[0] ?? '#FFFFFF'); hemi.groundColor.set(li?.hemi?.[1] ?? '#7E9A6A');
      sun.color.set(li?.sun?.[0] ?? '#FFF6E4'); sun.intensity = li?.sun?.[1] ?? 2.4;
      fill.color.set(li?.fill?.[0] ?? '#FFE7C2'); fill.intensity = li?.fill?.[1] ?? 0.8;
      // the ball and the slingshot
      ballLook = set ? { r: 0.07, mat: set.ballMat } : null;
      ballGeo = new THREE.SphereGeometry(ballLook ? 0.07 : BALL.r, 28, 18);
      scene.remove(held); held = makeBall(); scene.add(held);
      for (const m of ballMeshes.values()) scene.remove(m);
      ballMeshes.clear();
      for (const m of slingParts) m.material = set ? set.slingMat : m.userData.wood;
      applyCuts(three, cuts);   // the setting's sky light and surfaces too
      return { level: n, photos: !!set, ms: Math.round(performance.now() - t0), ...(set?.nightMs !== undefined ? { nightMs: set.nightMs, skyline: set.skyline } : {}), ...(error ? { error } : {}) };
    },
    // A block broke (ice shattered, a barrel burst): its pieces fly.
    burst(b, at, q, v) { set?.burst(b, at, q, v); },
    // The setting's moving parts (the effects, the snake) dt s on.
    tick(dt) { const t = performance.now() / 1000; if (set) set.tick(dt, t); else parkBirds.tick(dt, t); keep.tick(dt); },
    // The ball at `at` hit the thing not to hit (Q97): it turns into a heart, pops, the thing reacts; how long it takes (s).
    keepHit(at) { return keep.hit(at); },
    get keepActive() { return keep.active; },
    get keepLive() { return keep.live; },
    // A block fell at x: the animals in view are startled and run off
    // (developer, 2026-11-12: "acted frightened ... and run off"); what each did.
    fright(x) { return set ? set.fright(x) : [parkBirds.fright(x)].filter(Boolean); },
    // where the animals are (for checking in a browser)
    animals() { return set ? set.animals() : [parkBirds.state()]; },
    // What the scene has drawn, for the log (Q109: a scene on the tablet drew no
    // blocks): each block's mesh (shown, where it is on the canvas, its
    // material), what the last frame drew, the graphics chip's memory and
    // whether it has lost the canvas or reported an error.
    diagnose() {
      camera.updateMatrixWorld();
      const at = p => { const v = new THREE.Vector3(...p).project(camera); return [Math.round(((v.x + 1) / 2) * 100) / 100, Math.round(((1 - v.y) / 2) * 100) / 100]; };
      const gl = renderer.getContext(), info = renderer.info;
      const mat = m => { const t = [m.material].flat()[0]; return t ? `${t.type}${t.transparent ? ' transparent' : ''} ${t.opacity}${t.map ? ` map ${t.map.image?.width ?? '?'}` : ''}${t.visible === false ? ' hidden' : ''}` : 'none'; };
      let err = null; try { err = gl.getError(); } catch (e) { err = String(e); }
      return {
        meshes: blockMeshes.length, shown: blockMeshes.filter(m => m.visible && m.parent).length,
        blocks: blockMeshes.slice(0, 6).map(m => ({ at: at([m.position.x, m.position.y, m.position.z]), vis: m.visible, mat: mat(m) })),
        frame: { calls: info.render.calls, triangles: info.render.triangles }, memory: { geometries: info.memory.geometries, textures: info.memory.textures },
        lost: gl.isContextLost(), glError: err, pixelRatio: renderer.getPixelRatio(), level,
        programs: info.programs?.length ?? null, shaderErrors: shaderErrors.length, ...(shaderErrors.length ? { firstShaderError: shaderErrors[0] } : {}),
      };
    },
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
    // the view's sides along y, z (the animals' crossings; for checking too)
    viewEdges,
    // The drawing lighter on a slow device (src/core/drawing.js, Q99): the
    // cuts now and on every scene and setting to come; what changed now.
    setDrawing(c) { cuts = { ...c }; return applyCuts(three, cuts); },
    // For the speed test (log.html, Q99): the three.js parts it changes,
    // and letting go of the canvas' GPU memory once it's done with.
    three: { renderer, scene, camera, sun },
    dispose() { renderer.dispose(); renderer.forceContextLoss(); },
  };
}
