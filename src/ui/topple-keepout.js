// Topple!'s things not to hit, drawn (src/core/topple-keepout.js has what and
// where; journal Q97): each level's own look (a bird's nest on a stump, a
// window pane in its frame, a glowing lantern), the one warning mark on
// every one of them (a small red ring with a slash, bobbing over it), and
// what a hit does: the ball turns into a heart, the heart pops in hearts
// and sparks, and the thing reacts in its own way (the nest tumbles and its
// eggs roll off; glass shatters, the lantern goes out). Made by
// src/ui/topple-scene.js, which owns the three.js scene; every step of it
// drawn only (the physics only stops the ball).

export const RING_COLOUR = '#E02424';

export function makeKeepout({ THREE, scene, canvasTex }) {
  /* ---------- the textures and materials, made once ---------- */

  // the warning mark: a red ring with a slash on a white disc, so it reads on any sky or lawn
  const ringTex = canvasTex(128, 128, (g, w, h) => {
    const c = w / 2, r = 50;
    g.fillStyle = 'rgba(255,255,255,0.88)'; g.beginPath(); g.arc(c, c, r, 0, 2 * Math.PI); g.fill();
    g.strokeStyle = RING_COLOUR; g.lineWidth = 15; g.lineCap = 'round';
    g.beginPath(); g.arc(c, c, r - 2, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(c - 0.7 * (r - 2), c - 0.7 * (r - 2)); g.lineTo(c + 0.7 * (r - 2), c + 0.7 * (r - 2)); g.stroke();
  });
  // the heart the ball turns into
  const heartTex = canvasTex(128, 128, (g, w) => {
    const s = w / 2, x = w / 2, y = w * 0.52;
    const path = () => {
      g.beginPath();
      g.moveTo(x, y + s * 0.62);
      g.bezierCurveTo(x - s * 1.1, y + s * 0.05, x - s * 0.75, y - s * 0.78, x, y - s * 0.28);
      g.bezierCurveTo(x + s * 0.75, y - s * 0.78, x + s * 1.1, y + s * 0.05, x, y + s * 0.62);
      g.closePath();
    };
    path(); g.fillStyle = '#E8344B'; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#A8142C'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - s * 0.42, y - s * 0.28, s * 0.14, s * 0.09, -0.6, 0, 2 * Math.PI); g.fill();
  });
  const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const wood = M('#8A5A3B'), bark = M('#6E4A30'), twig = M('#9C7A4E'), twigDark = M('#5B432B'), egg = M('#A9DCEB', { roughness: 0.4 });
  const frameWood = M('#B07A45'), glass = M('#BFE6F2', { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.38 });
  const shardMat = M('#CFEFF8', { roughness: 0.1, transparent: true, opacity: 0.6 });
  const iron = M('#2F3438', { roughness: 0.5, metalness: 0.5 });

  /* ---------- the things ---------- */

  const add = (g, mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  const cyl = (r0, r1, h, mat, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat);
  const bx = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

  // a bird's nest on a tree stump: a ring of twigs round a dark hollow, three pale blue eggs
  function nest(g) {
    add(g, cyl(0.2, 0.24, 0.3, bark), 0, 0.15, 0);
    add(g, cyl(0.19, 0.19, 0.012, M('#A9825A')), 0, 0.306, 0);
    const n = new THREE.Group(); n.position.set(0, 0.34, 0); g.add(n);
    const cup = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.085, 10, 24), twig); cup.rotation.x = Math.PI / 2; cup.scale.set(1, 1, 0.8); n.add(cup);
    add(n, cyl(0.26, 0.2, 0.1, twigDark), 0, -0.01, 0);
    // twigs sticking out, round
    for (let i = 0; i < 12; i++) {
      const a = i * 2 * Math.PI / 12 + (i % 2) * 0.15, t = cyl(0.012, 0.012, 0.22 + (i % 3) * 0.04, i % 2 ? twig : twigDark, 5);
      t.position.set(Math.cos(a) * 0.3, 0.02 + (i % 3) * 0.025, Math.sin(a) * 0.3);
      t.rotation.set(Math.PI / 2 * Math.sin(a) * 0.6, 0, -Math.PI / 2 * Math.cos(a) * 0.7 + (i % 2 ? 0.3 : -0.3));
      n.add(t);
    }
    const eggs = [[-0.09, 0.07, 0.03], [0.1, 0.07, 0.0], [0.0, 0.07, -0.1]].map(([x, y, z]) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), egg); e.scale.y = 1.25; e.position.set(x, y, z); n.add(e); return e;
    });
    g.userData = { nest: n, eggs };
  }
  // a window pane in a wooden frame, on two feet: pale blue glass with a glint
  function pane(g, p) {
    const { w, h, d } = p, t = 0.08;
    const gl = bx(w - 2 * t, h - 0.12 - 2 * t, 0.025, glass); add(g, gl, 0, 0.12 + (h - 0.12) / 2, 0);
    gl.material = glass.clone();
    add(g, bx(w, t, d, frameWood), 0, h - t / 2, 0); add(g, bx(w, t, d, frameWood), 0, 0.12 + t / 2, 0);
    add(g, bx(t, h - 0.12, d, frameWood), -(w - t) / 2, 0.12 + (h - 0.12) / 2, 0); add(g, bx(t, h - 0.12, d, frameWood), (w - t) / 2, 0.12 + (h - 0.12) / 2, 0);
    add(g, bx(w * 0.9, 0.12, d * 1.9, wood), 0, 0.06, 0);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.1, h * 0.55), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45 }));
    glint.rotation.z = 0.5; glint.position.set(-w * 0.18, 0.12 + (h - 0.12) * 0.55, 0.02); g.add(glint);
    g.userData = { glass: [gl, glint], shatter: { w: w - 2 * t, h: h - 0.12 - 2 * t, y: 0.12 + (h - 0.12) / 2 } };
  }
  // a lantern on a post: a lit glass box in an iron frame under a cap, a ring on top
  function lantern(g, p) {
    const { h } = p;
    add(g, cyl(0.19, 0.24, 0.08, iron), 0, 0.04, 0);
    add(g, cyl(0.035, 0.045, h * 0.45, iron, 8), 0, 0.08 + h * 0.225, 0);
    const y0 = 0.08 + h * 0.45, gh = h * 0.36;
    add(g, bx(0.34, 0.05, 0.34, iron), 0, y0 + 0.025, 0);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshBasicMaterial({ color: '#FFD36B' }));
    add(g, core, 0, y0 + gh / 2 + 0.05, 0);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.3, gh, 0.3), glass.clone()); gl.material.opacity = 0.3; add(g, gl, 0, y0 + gh / 2 + 0.05, 0);
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) add(g, bx(0.025, gh, 0.025, iron), sx * 0.15, y0 + gh / 2 + 0.05, sz * 0.15);
    add(g, bx(0.34, 0.04, 0.34, iron), 0, y0 + gh + 0.07, 0);
    add(g, cyl(0.02, 0.19, 0.12, iron, 4), 0, y0 + gh + 0.15, 0).rotation.y = Math.PI / 4;
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 14), iron); add(g, loop, 0, y0 + gh + 0.25, 0);
    g.userData = { glass: [gl], core, shatter: { w: 0.3, h: gh, y: y0 + gh / 2 + 0.05 } };
  }
  const BUILD = { nest, pane, lantern };

  /* ---------- a thing and its mark ---------- */

  let ringSprite = null, fx = [], thingG = null, bobT = 0, reacted = false;
  // The drawn thing (a group, not yet added to the scene) for a scene's prop
  // ({ thing, at, w, h, d }), with its warning mark over it.
  function build(p) {
    reset();
    const g = new THREE.Group();
    g.position.set(...p.at);
    BUILD[p.thing](g, p);
    g.userData.thing = p.thing; g.userData.top = p.h;
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, depthTest: false, transparent: true }));
    sp.scale.set(0.46, 0.46, 1); sp.renderOrder = 20; sp.position.set(0, p.h + 0.4, 0);
    sp.userData.base = p.h + 0.4;
    g.add(sp);
    ringSprite = sp; thingG = g; reacted = false;
    return g;
  }
  // A scene's fx taken away (a new scene is drawn): hearts, shards, sparks.
  function reset() {
    for (const f of fx) { scene.remove(f.o); f.o.material?.dispose?.(); }
    fx = []; timers = []; ringSprite = null; thingG = null; reacted = false;
  }

  /* ---------- the hit ---------- */

  const GRAV = 9.82;
  const spawn = (o, f) => { scene.add(o); const rec = { o, age: 0, ...f }; fx.push(rec); return rec; };
  const heartSprite = (size, at) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, depthTest: false, transparent: true }));
    s.scale.set(size, size, 1); s.position.set(...at); s.renderOrder = 30; return s;
  };
  // The ball at `at` (world m) hit the thing: it turns into a heart (grows, with a pulse),
  // pops into little hearts and sparks, and the thing reacts. Returns how long it takes (s).
  function hit(at) {
    if (!thingG || reacted) return 0;
    reacted = true;
    const heart = heartSprite(0.12, at);
    spawn(heart, { kind: 'heart', life: 0.4, at });
    // the pop, once the heart is whole
    setTimeoutS(0.4, () => {
      pop(at);
      react();
    });
    return POP_END;
  }
  const POP_END = 1.5;
  // (timers on the scene's own step, not the clock: a hidden tab or a slow device keeps the order)
  let timers = [];
  function setTimeoutS(s, fn) { timers.push({ s, fn }); }
  function pop(at) {
    for (let i = 0; i < 9; i++) {
      const a = i * 2 * Math.PI / 9 + 0.3, sp = 1.3 + (i % 3) * 0.5;
      const h = heartSprite(0.16, at);
      spawn(h, { kind: 'bit', v: [Math.cos(a) * sp, 1.4 + (i % 2) * 0.8, Math.sin(a) * sp * 0.5], life: 0.9, g: 3.5, fade: true });
    }
    for (let i = 0; i < 14; i++) {
      const a = i * 2 * Math.PI / 14, sp = 1 + (i % 4) * 0.45;
      const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? '#FFB3C1' : '#E8344B', transparent: true }));
      o.position.set(...at);
      spawn(o, { kind: 'bit', v: [Math.cos(a) * sp, 0.6 + (i % 3) * 0.7, Math.sin(a) * sp * 0.6], life: 0.7, g: 5, fade: true });
    }
  }
  // The thing's own reaction.
  function react() {
    const g = thingG;
    if (!g) return;
    const u = g.userData;
    if (u.thing === 'nest') {
      // the nest tips off its stump to the side and the eggs roll away
      const side = 1;
      const n = u.nest, wp = new THREE.Vector3(); n.getWorldPosition(wp);
      g.remove(n); n.position.copy(wp); scene.add(n);
      spawn(n, { kind: 'fall', v: [0.9 * side, 1.6, 0.3], spin: [0.8, 0.3, -3.2 * side], floor: 0.1, rest: [0.35, 0, -1.25 * side], life: 99, keep: true });
      u.eggs.forEach((e, i) => {
        const p = new THREE.Vector3(); e.getWorldPosition(p);
        n.remove(e); e.position.copy(p); scene.add(e);
        spawn(e, { kind: 'fall', v: [(1.0 + i * 0.5) * side, 2 + i * 0.5, (i - 1) * 0.5], spin: [2 + i, 0, -4], floor: 0.075, rest: null, life: 99, keep: true, roll: true });
      });
    } else {
      // glass shatters in shards; the lantern's light goes out
      for (const m of u.glass) m.visible = false;
      if (u.core) { u.core.material.color.set('#3A2F28'); }
      const s = u.shatter, wp = new THREE.Vector3(); g.getWorldPosition(wp);
      for (let i = 0; i < 22; i++) {
        const o = new THREE.Mesh(new THREE.BoxGeometry(0.06 + (i % 3) * 0.03, 0.05 + (i % 4) * 0.03, 0.012), shardMat.clone());
        o.position.set(wp.x + ((i * 0.37) % 1 - 0.5) * s.w, wp.y + s.y + (((i * 0.61) % 1) - 0.5) * s.h, wp.z + 0.02);
        o.rotation.set(i, i * 0.7, i * 1.3);
        spawn(o, { kind: 'fall', v: [((i * 0.53) % 1 - 0.5) * 2.2, 0.8 + (i % 4) * 0.5, 0.6 + (i % 3) * 0.4], spin: [4 + i % 3, 3, 5 - i % 4], floor: 0.02, rest: null, life: 99, keep: true, fade: false });
      }
    }
  }

  /* ---------- each frame ---------- */

  // dt s on (the scene's tick): the mark bobs, the hit's bits fly.
  function tick(dt) {
    bobT += dt;
    if (ringSprite) ringSprite.position.y = ringSprite.userData.base + 0.07 * Math.sin(bobT * 3.2);
    for (const t of timers) t.s -= dt;
    const due = timers.filter(t => t.s <= 0); timers = timers.filter(t => t.s > 0);
    for (const t of due) t.fn();
    fx = fx.filter(f => {
      f.age += dt;
      const o = f.o;
      if (f.kind === 'heart') {
        // growing with a pulse until it pops
        const k = Math.min(1, f.age / f.life), s = 0.12 + 0.3 * k + 0.04 * Math.sin(f.age * 38);
        o.scale.set(s, s, 1);
        if (f.age >= f.life) { scene.remove(o); o.material.dispose(); return false; }
        return true;
      }
      if (f.kind === 'bit') {
        f.v[1] -= f.g * dt;
        o.position.x += f.v[0] * dt; o.position.y = Math.max(0.03, o.position.y + f.v[1] * dt); o.position.z += f.v[2] * dt;
        if (f.fade && o.material) o.material.opacity = Math.max(0, 1 - f.age / f.life);
        if (f.age >= f.life) { scene.remove(o); o.material?.dispose?.(); return false; }
        return true;
      }
      if (f.kind === 'fall') {
        if (f.rest !== undefined && f.landed) return true;
        f.v[1] -= GRAV * dt;
        o.position.x += f.v[0] * dt; o.position.y += f.v[1] * dt; o.position.z += f.v[2] * dt;
        if (f.spin) { o.rotation.x += f.spin[0] * dt; o.rotation.y += f.spin[1] * dt; o.rotation.z += f.spin[2] * dt; }
        if (o.position.y <= f.floor && f.v[1] < 0) {
          o.position.y = f.floor;
          f.v[1] *= -0.3; f.v[0] *= 0.7; f.v[2] *= 0.7;
          if (f.spin) f.spin = f.spin.map(s => s * 0.6);
          if (Math.abs(f.v[1]) < 0.5) {
            // at rest: a nest on its side; an egg stops rolling (it rolls a little first)
            if (f.rest) o.rotation.set(...f.rest);
            if (f.roll && Math.hypot(f.v[0], f.v[2]) > 0.15) { f.v[1] = 0; f.v[0] *= 0.96; f.v[2] *= 0.96; o.rotation.z -= f.v[0] * dt * 12; return true; }
            f.landed = true;
          }
        }
        return true;
      }
      return true;
    });
  }

  return { build, reset, hit, tick, get live() { return fx.length; }, get active() { return !!thingG; }, POP_END };
}
