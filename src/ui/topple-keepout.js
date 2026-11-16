// Topple!'s things in the way, drawn (src/core/topple-keepout.js has what and
// where; journal Q97, Q112): each level's own look (a bird's nest on a stump, a
// window pane in its frame, a glowing lantern, a clay pot, a telescope), and
// what a hit does: the ball is wasted and the thing reacts in its own way (the
// nest tumbles and its eggs roll off; glass shatters, the lantern goes out;
// the telescope's tube falls). No warning mark: it looked like an obstacle and
// hid targets (developer, 2026-11-15). Made by src/ui/topple-scene.js, which
// owns the three.js scene; every step of it drawn only (the physics only stops
// the ball and takes the thing away).

export function makeKeepout({ THREE, scene, canvasTex }) {
  /* ---------- the textures and materials, made once ---------- */

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
  // a clay pot with a red flower on a green stem (Cactus Canyon): a terracotta pot with a rim, a little earth, the flower; it shatters in clay shards
  const clay = M('#C4693A', { roughness: 0.85 }), clayDark = M('#9C4A25', { roughness: 0.9 }), earth = M('#4A3426'), stem = M('#4E8A3C'), petal = M('#E0262E', { roughness: 0.6 }), centre = M('#F5C42A');
  function pot(g, p) {
    const h = p.h, pg = new THREE.Group(); g.add(pg);
    add(pg, cyl(0.27, 0.19, h * 0.62, clay, 20), 0, h * 0.31, 0);
    add(pg, cyl(0.3, 0.3, h * 0.12, clayDark, 20), 0, h * 0.62 + h * 0.06, 0);
    add(pg, cyl(0.25, 0.25, 0.02, earth, 20), 0, h * 0.74 + 0.005, 0);
    const top = h * 0.74;
    add(g, cyl(0.025, 0.03, h * 0.3, stem, 8), 0, top + h * 0.15, 0);
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), stem); l.scale.set(1.8, 0.4, 1); l.position.set(s * 0.1, top + h * 0.08, 0); l.rotation.z = s * 0.5; g.add(l); }
    const fy = top + h * 0.3 + 0.02;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, pe = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), petal); pe.scale.set(1, 1, 0.45); pe.position.set(Math.cos(a) * 0.1, fy + Math.sin(a) * 0.1, 0); g.add(pe); }
    add(g, new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), centre), 0, fy, 0.03);
    g.userData = { glass: [pg], extra: g.children.filter(c => c !== pg), shard: clay, shatter: { w: 0.5, h: h * 0.7, y: h * 0.35 } };
  }
  // a telescope on a tripod (Star Light): dark wood legs, a brass tube on its mount pointing up at the sky, rings round it, a glass lens in the end;
  // dark and brass, so it can't be taken for one of the level's glowing blocks. A hit knocks the tube off its mount; the lens pops.
  const brass = M('#B98A3E', { roughness: 0.4, metalness: 0.7 }), brassDark = M('#7A5A24', { roughness: 0.5, metalness: 0.6 }), legWood = M('#3E2C20', { roughness: 0.9 });
  function telescope(g, p) {
    const h = p.h, head = h * 0.62, spread = p.w * 0.42, legL = Math.hypot(head, spread);
    // three legs from the mount down to the ground: two to the front sides, one behind
    for (const [sx, sz] of [[-1, 0.6], [1, 0.6], [0, -1]]) {
      const leg = cyl(0.03, 0.022, legL, legWood, 6), tx = sx * spread, tz = sz * spread * 0.7;
      leg.position.set(tx / 2, head / 2, tz / 2);
      leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(tx, -head, tz).normalize().negate());
      g.add(leg);
    }
    add(g, cyl(0.07, 0.07, 0.08, brassDark, 12), 0, head, 0);
    // the tube along its own +y, tipped up and to the right: eyepiece end low on the left, lens end high
    const tube = new THREE.Group(); tube.position.set(0, head + 0.04, 0); tube.rotation.z = -40 * Math.PI / 180; g.add(tube);
    const L = h * 0.78, back = L * 0.3;
    add(tube, cyl(0.075, 0.065, L, brass, 18), 0, (L - 2 * back) / 2, 0);   // from -back to L - back along its own y
    add(tube, cyl(0.1, 0.1, 0.1, brassDark, 18), 0, L - back - 0.05, 0);                  // the lens end's hood
    add(tube, cyl(0.04, 0.04, 0.14, brassDark, 10), 0, -back - 0.05, 0);                  // the eyepiece
    for (const y of [0.12, 0.3]) add(tube, cyl(0.082, 0.082, 0.025, brassDark, 18), 0, y, 0);   // two rings
    const lens = cyl(0.088, 0.088, 0.012, glass.clone(), 18); lens.material.opacity = 0.6; add(tube, lens, 0, L - back + 0.002, 0);
    g.userData = { tube, lens, tubeTo: new THREE.Vector3(0, head + 0.04, 0) };
  }
  const BUILD = { nest, pane, lantern, pot, telescope };

  /* ---------- a thing ---------- */

  let fx = [], thingG = null, reacted = false;
  // The drawn thing (a group, not yet added to the scene) for a scene's prop
  // ({ thing, at, w, h, d }).
  function build(p) {
    reset();
    const g = new THREE.Group();
    g.position.set(...p.at);
    BUILD[p.thing](g, p);
    g.userData.thing = p.thing; g.userData.top = p.h;
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    thingG = g; reacted = false;
    return g;
  }
  // A scene's fx taken away (a new scene is drawn): shards, eggs.
  function reset() {
    for (const f of fx) { scene.remove(f.o); f.o.material?.dispose?.(); }
    fx = []; thingG = null; reacted = false;
  }

  /* ---------- the hit ---------- */

  const GRAV = 9.82;
  const spawn = (o, f) => { scene.add(o); const rec = { o, age: 0, ...f }; fx.push(rec); return rec; };
  // The ball hit the thing: it reacts at once, in its own way. False if it has (a thing is hit once).
  function hit() {
    if (!thingG || reacted) return false;
    reacted = true;
    react();
    return true;
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
    } else if (u.thing === 'telescope') {
      // the tube is knocked off its mount and falls to the left, tumbling; the lens pops off in glass
      const tube = u.tube, wp = new THREE.Vector3(), q = new THREE.Quaternion(), lp = new THREE.Vector3();
      tube.getWorldPosition(wp); tube.getWorldQuaternion(q); u.lens.getWorldPosition(lp);
      g.remove(tube); tube.position.copy(wp); tube.quaternion.copy(q); scene.add(tube);
      spawn(tube, { kind: 'fall', v: [-1.1, 1.8, 0.35], spin: [0.5, 0.2, 3.4], floor: 0.1, rest: [0, 0, Math.PI / 2], life: 99, keep: true });
      for (let i = 0; i < 12; i++) {
        const o = new THREE.Mesh(new THREE.BoxGeometry(0.05 + (i % 3) * 0.02, 0.04 + (i % 4) * 0.02, 0.01), shardMat.clone());
        o.position.copy(lp); o.rotation.set(i, i * 0.7, i * 1.3);
        spawn(o, { kind: 'fall', v: [((i * 0.53) % 1 - 0.3) * 2.4, 1.4 + (i % 4) * 0.5, 0.4 + (i % 3) * 0.4], spin: [4 + i % 3, 3, 5 - i % 4], floor: 0.02, rest: null, life: 99, keep: true, fade: false });
      }
      u.lens.visible = false;
    } else {
      // glass shatters in shards; the lantern's light goes out
      for (const m of u.glass) m.visible = false;
      for (const m of u.extra ?? []) m.visible = false;   // (the pot's flower and stem go with it)
      if (u.core) { u.core.material.color.set('#3A2F28'); }
      const s = u.shatter, wp = new THREE.Vector3(); g.getWorldPosition(wp);
      for (let i = 0; i < 22; i++) {
        const o = new THREE.Mesh(new THREE.BoxGeometry(0.06 + (i % 3) * 0.03, 0.05 + (i % 4) * 0.03, u.shard ? 0.03 : 0.012), (u.shard ?? shardMat).clone());
        o.position.set(wp.x + ((i * 0.37) % 1 - 0.5) * s.w, wp.y + s.y + (((i * 0.61) % 1) - 0.5) * s.h, wp.z + 0.02);
        o.rotation.set(i, i * 0.7, i * 1.3);
        spawn(o, { kind: 'fall', v: [((i * 0.53) % 1 - 0.5) * 2.2, 0.8 + (i % 4) * 0.5, 0.6 + (i % 3) * 0.4], spin: [4 + i % 3, 3, 5 - i % 4], floor: 0.02, rest: null, life: 99, keep: true, fade: false });
      }
    }
  }

  /* ---------- each frame ---------- */

  // dt s on (the scene's tick): the hit's bits fly.
  function tick(dt) {
    fx = fx.filter(f => {
      f.age += dt;
      const o = f.o;
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

  return { build, reset, hit, tick, get live() { return fx.length; }, get active() { return !!thingG; } };
}
