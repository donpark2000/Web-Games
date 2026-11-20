// Q125: each moon level looks like its name (developer, 2026-11-18: "Unlike
// world one where the name of every level clearly fits with the scenery and the
// objects that are targets, the moon world seems much less so"). Scenery only, no
// physics: all of it stands behind the blocks (z < -8.5) or off to the sides.
//
//   6 Landing Zone: landing pads with chasing lights, a lander coming down and
//     lifting off again, a parked cargo lander, a control tower, cargo and fuel drums
//     (the base's domes behind, as before: it's the base's landing zone).
//   7 Solar Farm: rows of panels to the skyline, a substation and pylon, a cleaning
//     robot driving along a row.
//   8 Crater Rim: the ground ends at the rim; the crater's bowl falls away behind, its
//     far wall lit by a low sun (long shadows); boulders, a survey flag.
//   9 Mining Site: dark, under work lights; a drill rig, a conveyor carrying ore up
//     to a hopper, ore heaps with crystals in them, an ore cart on rails.
//  10 Launch Pad: the big rocket on its gantry, venting; the flame trench; tall
//     floodlights; the oxygen tank farm; lightning masts.
//
// levelLook(THREE, S, level, kit) → { update(t, dt), light: { sun, hemi } } ; kit: the
// moon drawing's helpers (canvasTex, rand, the base's materials).

export function levelLook(THREE, S, level, kit) {
  const { canvasTex, rand, mats } = kit;
  const { white, grey, dark, orange, lit, red } = mats;
  const add = (geo, mat, x, y, z, parent = S, shadow = false) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow; parent.add(m); return m; };
  const blink = [], spin = [], movers = [];
  const out = { light: null, update(t, dt) {
    for (const [o, s] of spin) o.rotation.y += s * dt;
    const on = Math.sin(t * 4) > 0;
    blink.forEach((b, i) => { b.visible = i % 2 ? on : !on; });
    for (const f of movers) f(t, dt);
  } };
  const lamp = c => new THREE.MeshBasicMaterial({ color: c });
  const glowSprite = (color, size) => {
    const tex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(size); return s;
  };
  // a floodlight / work light: a pole, a lamp head, a glow (and a pool of light on the ground)
  const lightTower = (x, z, h, color = '#fff2c8', pool = 0) => {
    add(new THREE.CylinderGeometry(0.06, 0.09, h, 8), grey, x, h / 2, z);
    const head = add(new THREE.BoxGeometry(0.9, 0.35, 0.25), dark, x, h, z);
    for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(0.22, 0.2, 0.02), lamp(color), x - 0.27 + i * 0.27, h, z + 0.13);
    const g = glowSprite('rgba(255,240,200,0.9)', 2.2); g.position.set(x, h, z + 0.3); S.add(g);
    if (pool) {
      const poolTex = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,231,168,0.5)'); gr.addColorStop(1, 'rgba(255,231,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const p = add(new THREE.CircleGeometry(pool, 32), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }), x, 0.02, z + pool * 0.5);
      p.rotation.x = -Math.PI / 2;
    }
    void head;
  };
  const crateTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#d9dde3'; g.fillRect(0, 0, w, h); g.fillStyle = '#f08a24'; g.fillRect(0, h * 0.4, w, h * 0.2); g.strokeStyle = '#6c7584'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); });
  const crateM = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.6 });
  const drumM = new THREE.MeshStandardMaterial({ map: kit.drumTex(), roughness: 0.45, metalness: 0.3 });

  if (level === 6) {
    // two pads behind the scene: a cargo lander parked on one; on the other a lander comes down and lifts off
    const padTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#3b4250'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#ffcf33'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h / 2, w * 0.4, 0, 7); g.stroke();
      g.fillStyle = '#ffcf33'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', w / 2, h / 2 + 6);
    });
    const pad = (x, z, r) => {
      const d = add(new THREE.CylinderGeometry(r, r + 0.1, 0.1, 48), [new THREE.MeshStandardMaterial({ color: '#3b4250', roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.8 }), dark], x, 0.05, z, S, true);
      void d;
      const n = 16, lights = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; lights.push(add(new THREE.SphereGeometry(0.07, 8, 6), lamp('#7fd0ff'), x + Math.cos(a) * (r + 0.15), 0.14, z + Math.sin(a) * (r + 0.15))); }
      movers.push(t => { const k = Math.floor(t * 8) % n; lights.forEach((l, i) => { l.visible = (i - k + n) % n < 4; }); });
    };
    pad(-4.8, -11.5, 2.2); pad(4.6, -12.2, 2.2);
    const landerAt = (s, foil) => {
      const g = new THREE.Group(); g.scale.setScalar(s);
      add(new THREE.CylinderGeometry(0.42, 0.5, 0.36, 8), foil, 0, 0, 0, g, true);
      add(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#9fd8ff', metalness: 0.2, roughness: 0.1 }), 0, 0.18, 0, g);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, leg = add(new THREE.CylinderGeometry(0.025, 0.025, 0.5), grey, Math.cos(a) * 0.5, -0.32, Math.sin(a) * 0.5, g); leg.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); }
      S.add(g); return g;
    };
    // the parked cargo lander, boxy, with crates stacked by it
    const cargo = landerAt(2.6, new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 0.5, roughness: 0.4 }));
    cargo.position.set(-4.8, 1.25, -11.5);
    for (const [x, y, z] of [[-2.2, 0.25, -10.4], [-2.2, 0.75, -10.4], [-1.65, 0.25, -10.6], [-7.4, 0.25, -10.2], [-7.4, 0.75, -10.2], [-6.9, 0.25, -10.0]]) add(new THREE.BoxGeometry(0.5, 0.5, 0.5), crateM, x, y, z, S, true);
    // a rack of fuel drums (the targets' kin)
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) add(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 16), drumM, 1.6 + i * 0.44, 0.28 + j * 0.56, -10.6, S, true);
    // the lander coming down and lifting off (a 26 s loop), its flame and the dust when near the pad
    const visitor = landerAt(2.0, new THREE.MeshStandardMaterial({ color: '#d4a63a', metalness: 0.6, roughness: 0.35 }));
    const flame = add(new THREE.ConeGeometry(0.35, 1.4, 16), new THREE.MeshBasicMaterial({ color: '#9fdcff', transparent: true, opacity: 0.75 }), 0, -1.6, 0, visitor);
    flame.rotation.x = Math.PI;
    const dust = add(new THREE.RingGeometry(0.6, 2.4, 32), new THREE.MeshBasicMaterial({ color: '#cfcfd4', transparent: true, opacity: 0, depthWrite: false }), 4.6, 0.12, -12.2);
    dust.rotation.x = -Math.PI / 2;
    movers.push(t => {
      const k = (t % 26) / 26;   // 0-0.35 down, 0.35-0.6 on the pad, 0.6-0.95 up, then gone
      let y, burn;
      if (k < 0.35) { const u = k / 0.35; y = 1.05 + 14 * (1 - u) * (1 - u); burn = 1; } else if (k < 0.6) { y = 1.05; burn = 0; } else if (k < 0.95) { const u = (k - 0.6) / 0.35; y = 1.05 + 14 * u * u; burn = 1; } else { y = 40; burn = 0; }
      visitor.position.set(4.6, y, -12.2);
      flame.visible = burn > 0; flame.scale.y = 0.8 + Math.random() * 0.4;
      dust.material.opacity = burn && y < 4 ? 0.35 * (1 - (y - 1) / 3) : 0;
      dust.scale.setScalar(1 + Math.random() * 0.1);
    });
    // the control tower: a column, a glass cab lit, a beacon turning on top
    add(new THREE.CylinderGeometry(0.45, 0.6, 4.2, 12), white, 8.2, 2.1, -13.2, S, true);
    add(new THREE.CylinderGeometry(1.1, 0.8, 0.9, 12), new THREE.MeshStandardMaterial({ color: '#9fd8ff', emissive: '#3a8acb', emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.3 }), 8.2, 4.6, -13.2);
    add(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 12), white, 8.2, 5.1, -13.2);
    const beacon = new THREE.Group(); beacon.position.set(8.2, 5.4, -13.2); S.add(beacon);
    add(new THREE.BoxGeometry(0.5, 0.18, 0.18), lamp('#ff5a3c'), 0.25, 0, 0, beacon);
    spin.push([beacon, 2.2]);
    // yellow guide lines on the ground from the pads towards the base
    const lineM = new THREE.MeshBasicMaterial({ color: '#ffcf33', transparent: true, opacity: 0.55 });
    for (const [x0, z0, x1, z1] of [[-4.8, -9.2, -4.8, -15], [4.6, -9.9, 4.6, -15], [-4.8, -9.2, 4.6, -9.9]]) {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(len / 0.8);
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, m = add(new THREE.PlaneGeometry(0.45, 0.1), lineM, x0 + (x1 - x0) * u, 0.015, z0 + (z1 - z0) * u); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(z1 - z0, x1 - x0); }
    }
    blink.push(add(new THREE.SphereGeometry(0.1, 8, 6), red, 8.2, 5.75, -13.2));
  }

  if (level === 7) {
    // panels in rows to the skyline (instanced), tilted to the sun
    const solarM = new THREE.MeshStandardMaterial({ map: kit.solarTex(), roughness: 0.25, metalness: 0.5 });
    const rows = [];
    for (let z = -9.5; z > -46; z -= 2.1) for (let x = -44; x <= 44; x += 1.5) { if (z > -14 && Math.abs(x) < 3.4 && z > -12) continue; rows.push([x + (Math.abs(z * 7) % 1) * 0.2, z]); }
    const pan = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 0.04, 0.9), solarM, rows.length);
    const post = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), grey, rows.length);
    const o = new THREE.Object3D();
    rows.forEach(([x, z], i) => {
      o.position.set(x, 0.75, z); o.rotation.set(0.55, 0, 0); o.updateMatrix(); pan.setMatrixAt(i, o.matrix);
      o.position.set(x, 0.35, z); o.rotation.set(0, 0, 0); o.updateMatrix(); post.setMatrixAt(i, o.matrix);
    });
    S.add(pan, post);
    // the substation: a box, transformers, a pylon with lines running off to the farm
    add(new THREE.BoxGeometry(2.2, 1.2, 1.4), white, -8.5, 0.6, -12.5, S, true);
    for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 12), grey, -9.3 + i * 0.8, 1.65, -12.5);
    blink.push(add(new THREE.SphereGeometry(0.08, 8, 6), lamp('#5dff7a'), -7.5, 1.3, -11.8));
    // a cleaning robot driving along the front row, its brush turning
    const bot = new THREE.Group(); S.add(bot);
    add(new THREE.BoxGeometry(0.7, 0.3, 0.5), white, 0, 1.0, 0, bot);
    add(new THREE.BoxGeometry(0.25, 0.12, 0.3), orange, 0.2, 1.2, 0, bot);
    const brush = add(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#4a8fe0', roughness: 0.9 }), 0, 0.85, 0, bot); brush.rotation.x = Math.PI / 2;
    blink.push(add(new THREE.SphereGeometry(0.05, 8, 6), lamp('#ffd27a'), -0.3, 1.2, 0, bot));
    const bv = { x: -14, v: 0.6 };
    movers.push((t, dt) => { bv.x += bv.v * dt; if (bv.x > 14 || bv.x < -14) bv.v = -bv.v; bot.position.set(bv.x, 0, -13.7); bot.rotation.y = bv.v > 0 ? 0 : Math.PI; brush.rotation.y += dt * 8; });
    out.light = { sun: [4, 10, 7], hemi: 0.5 };
  }

  if (level === 8) {
    // the crater: the ground ends at z -15 (setLevel cuts it: out.ground), the bowl falls away
    // behind, its far wall 60 m off; the sun low across it
    const rockM = new THREE.MeshStandardMaterial({ color: '#8a8780', roughness: 1, flatShading: true });
    const bowlM = new THREE.MeshStandardMaterial({ map: kit.moonTex(), color: '#b0aca4', roughness: 1, side: THREE.DoubleSide, flatShading: true });
    const prof = [[0, -14], [12, -13.6], [20, -12], [26, -8], [29.5, -3], [31, 0], [32, 0.7], [34, 0.3], [40, 0.1]].map(([r, y]) => new THREE.Vector2(r, y));
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), bowlM);
    bowl.position.set(0, 0, -46); bowl.receiveShadow = true; S.add(bowl);
    // the far wall: the far half of the rim, high, terraced, lit by the low sun (a half lathe: phi from π/2 to 3π/2 is the far side)
    const wallM = new THREE.MeshStandardMaterial({ map: kit.moonTex(), color: '#d8d0c2', roughness: 1, side: THREE.DoubleSide, flatShading: true });
    const wall = [[22, -12], [25, -7], [27, -4.5], [28.5, -1], [30, 2.4], [31.5, 4.2], [33, 5.2], [35, 4.8], [40, 2.6], [48, 0.5]].map(([r, y]) => new THREE.Vector2(r, y));
    const far = new THREE.Mesh(new THREE.LatheGeometry(wall, 48, Math.PI * 0.5, Math.PI), wallM);
    far.position.set(0, 0, -46); S.add(far);
    // the near lip: a broken ridge of rocks along z -15
    const rr = rand(8);
    for (let i = 0; i < 34; i++) { const b = add(new THREE.DodecahedronGeometry(0.4 + rr() * 0.9, 0), rockM, -24 + i * 1.45 + rr() * 0.6, 0.05, -14.6 - rr() * 0.8); b.scale.y = 0.4 + rr() * 0.4; b.rotation.set(rr(), rr() * 3, 0); b.castShadow = true; }
    // boulders about the foreground's sides and middle distance
    for (let i = 0; i < 26; i++) {
      const x = (rr() - 0.5) * 30, z = -3 - rr() * 11; if (Math.abs(x) < 6.5 && z > -9) continue;
      const g = new THREE.IcosahedronGeometry(0.25 + rr() * 0.6, 1);
      kit.lumpy(g, rr);
      const b = add(g, rockM, x, 0.2, z, S, true); b.rotation.set(rr() * 3, rr() * 3, 0);
    }
    // a survey outpost: a small dome, a flag, a tripod with a light
    add(new THREE.SphereGeometry(1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, -9.5, 0, -12.2, S, true);
    add(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), grey, -7.3, 1.2, -12.6);
    const flag = canvasTex(96, 64, (g, w, h) => { g.fillStyle = '#2f6fd6'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☾', w / 2, h / 2); });
    add(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ map: flag, side: THREE.DoubleSide }), -6.83, 2.1, -12.6);
    for (let i = 0; i < 3; i++) { const a = i * 2.1, l = add(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 5), grey, 7.5 + Math.cos(a) * 0.25, 0.6, -12 + Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); }
    blink.push(add(new THREE.SphereGeometry(0.09, 8, 6), red, 7.5, 1.3, -12));
    out.ground = { depth: 30, z: 0 };   // the ground only to z -15
    out.light = { sun: [12, 3.2, 7], color: '#ffe2b8', hemi: 0.22, intensity: 3.0 };
  }

  if (level === 9) {
    // a drill rig: an orange lattice derrick, its bit turning, a red light
    const dx = 7.2, dz = -12.8;
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = add(new THREE.CylinderGeometry(0.07, 0.07, 6.4, 6), orange, dx + ox * 0.7, 3.1, dz + oz * 0.7, S, true); leg.rotation.set(-oz * 0.09, 0, ox * 0.09); }
    for (let y = 0.8; y < 6; y += 1.0) { const s = 1.5 - y * 0.16; add(new THREE.BoxGeometry(s, 0.06, 0.06), orange, dx, y, dz - s / 2); add(new THREE.BoxGeometry(s, 0.06, 0.06), orange, dx, y, dz + s / 2); }
    const bit = add(new THREE.CylinderGeometry(0.22, 0.03, 2.2, 8), grey, dx, 1.1, dz); spin.push([bit, 3]);
    blink.push(add(new THREE.SphereGeometry(0.12, 8, 6), red, dx, 6.5, dz));
    // ore heaps, crystals poking out of them
    const oreM = new THREE.MeshStandardMaterial({ map: kit.oreTex(), roughness: 0.95 });
    const rr = rand(19);
    for (const [x, z, r] of [[-8.4, -10.5, 1.6], [-5.6, -12.4, 1.2], [3.6, -11.0, 1.1], [10.6, -10.4, 1.4], [-11.5, -13.5, 1.9]]) {
      const h = add(new THREE.ConeGeometry(r, r * 1.1, 12), oreM, x, r * 0.55, z, S, true); h.rotation.y = x;
      for (let i = 0; i < 4; i++) { const a = rr() * Math.PI * 2, c = add(kit.crystalGeo(0.09, 0.5), kit.crystalMat(i), x + Math.cos(a) * r * 0.5, r * 0.35 + rr() * 0.2, z + Math.sin(a) * r * 0.5); c.rotation.set(rr() - 0.5, 0, rr() - 0.5); }
    }
    // a conveyor from the ground up to a hopper, ore lumps riding it
    const cx0 = -3.2, cz = -13.5, len = 6.5, ang = 0.42;
    const belt = add(new THREE.BoxGeometry(len, 0.08, 0.6), dark, cx0 + Math.cos(ang) * len / 2, Math.sin(ang) * len / 2 + 0.3, cz, S, true); belt.rotation.z = ang;
    for (let i = 0; i < 5; i++) { const u = i / 4; add(new THREE.CylinderGeometry(0.05, 0.05, 0.3 + Math.sin(ang) * len * u, 5), grey, cx0 + Math.cos(ang) * len * u, (0.3 + Math.sin(ang) * len * u) / 2, cz + 0.25); }
    add(new THREE.BoxGeometry(1.2, 1.0, 1.2), orange, cx0 + Math.cos(ang) * len + 0.4, Math.sin(ang) * len + 0.1, cz, S, true);
    add(new THREE.CylinderGeometry(0.3, 0.3, Math.sin(ang) * len - 0.3, 8), grey, cx0 + Math.cos(ang) * len + 0.4, (Math.sin(ang) * len - 0.3) / 2, cz);
    const lumps = [];
    for (let i = 0; i < 8; i++) { const g = new THREE.IcosahedronGeometry(0.13, 0); lumps.push(add(g, oreM, 0, 0, cz)); }
    movers.push(t => lumps.forEach((l, i) => { const u = ((t * 0.08 + i / lumps.length) % 1); l.position.set(cx0 + Math.cos(ang) * len * u, Math.sin(ang) * len * u + 0.45, cz); l.rotation.set(t, t * 0.7, 0); }));
    // rails and an ore cart going to and fro
    const railM = new THREE.MeshStandardMaterial({ color: '#7b7f87', metalness: 0.7, roughness: 0.4 });
    for (const oz of [-0.3, 0.3]) add(new THREE.BoxGeometry(30, 0.05, 0.06), railM, 0, 0.03, -15.6 + oz);
    for (let x = -15; x <= 15; x += 0.7) add(new THREE.BoxGeometry(0.12, 0.03, 0.9), dark, x, 0.015, -15.6);
    const cart = new THREE.Group(); S.add(cart);
    add(new THREE.BoxGeometry(1.0, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: '#8d6a43', roughness: 0.7, metalness: 0.4 }), 0, 0.45, 0, cart, true);
    add(new THREE.SphereGeometry(0.42, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), oreM, 0, 0.66, 0, cart);
    const cv = { x: -12, v: 0.7 };
    movers.push((t, dt) => { cv.x += cv.v * dt; if (cv.x > 12 || cv.x < -12) cv.v = -cv.v; cart.position.set(cv.x, 0, -15.6); });
    // work lights over it all
    lightTower(-6.8, -9.8, 4.2, '#fff2c8', 2.4); lightTower(4.8, -9.6, 4.2, '#fff2c8', 2.4); lightTower(11.5, -12, 5, '#fff2c8', 2.6);
    out.light = { sun: [5, 9, 4], intensity: 1.3, hemi: 0.25, color: '#ffe9c8' };
  }

  if (level === 10) {
    // the big rocket on its gantry, with a swing arm to the rocket and steam venting from its side
    const g = new THREE.Group(); g.position.set(8.8, 0.12, -19); g.scale.setScalar(2.8); S.add(g);
    add(new THREE.CylinderGeometry(0.42, 0.48, 2.6, 24), white, 0, 1.5, 0, g, true);
    add(new THREE.ConeGeometry(0.42, 0.9, 24), orange, 0, 3.25, 0, g, true);
    add(new THREE.CylinderGeometry(0.44, 0.44, 0.2, 24), orange, 0, 2.2, 0, g);
    for (let i = 0; i < 3; i++) { const f = add(new THREE.BoxGeometry(0.05, 0.7, 0.5), orange, 0, 0.45, 0, g); f.rotation.y = i * Math.PI * 2 / 3; f.translateZ(0.5); }
    const tx = 12.0, rz = -19;
    for (let y = 0.6; y < 10.5; y += 1.2) add(new THREE.BoxGeometry(1.4, 0.08, 1.4), grey, tx, y, rz);
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new THREE.CylinderGeometry(0.07, 0.07, 10.8, 6), grey, tx + ox * 0.65, 5.4, rz + oz * 0.65, S, true);
    add(new THREE.BoxGeometry(1.9, 0.18, 0.3), grey, tx - 1.4, 7.6, rz);   // the swing arm to the rocket
    blink.push(add(new THREE.SphereGeometry(0.16, 8, 6), red, tx, 10.9, rz));
    // the flame trench under the rocket: a dark slot, a glow deep inside
    const trench = add(new THREE.PlaneGeometry(3.4, 9), new THREE.MeshBasicMaterial({ color: '#0d0e12' }), 8.8, 0.02, rz); trench.rotation.x = -Math.PI / 2;
    const deep = add(new THREE.PlaneGeometry(2.4, 8), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }), 8.8, 0.025, rz); deep.rotation.x = -Math.PI / 2;
    movers.push(t => { deep.material.opacity = 0.18 + 0.1 * Math.sin(t * 3) + Math.random() * 0.04; });
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, 0.25, 9), new THREE.MeshStandardMaterial({ color: '#5a5f68', roughness: 0.8 }), 8.8 + sx * 1.8, 0.12, rz, S, true);
    // steam puffs from the rocket's side
    const puffM = () => new THREE.MeshBasicMaterial({ color: '#f2f5f8', transparent: true, opacity: 0, depthWrite: false });
    const puffs = Array.from({ length: 6 }, () => add(new THREE.SphereGeometry(0.4, 10, 8), puffM(), 0, -50, 0));
    movers.push(t => puffs.forEach((p, i) => { const u = ((t * 0.35 + i / puffs.length) % 1); p.position.set(7.6 - u * 1.8, 5.2 + u * 1.2, rz + 0.4); p.scale.setScalar(0.4 + u * 1.8); p.material.opacity = 0.45 * (1 - u); }));
    // the oxygen tank farm: big white spheres on legs, O₂ in blue
    const o2M = new THREE.MeshStandardMaterial({ map: kit.o2Tex(true), roughness: 0.35, metalness: 0.1 });
    for (const [x, z, r] of [[-9.0, -15.5, 1.0], [-6.4, -17.0, 0.9], [-11.8, -17.5, 1.1]]) {
      add(new THREE.SphereGeometry(r, 24, 16), o2M, x, r + 0.7, z, S, true);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; add(new THREE.CylinderGeometry(0.06, 0.06, r + 0.7, 6), grey, x + Math.cos(a) * r * 0.7, (r + 0.7) / 2, z + Math.sin(a) * r * 0.7); }
    }
    add(new THREE.CylinderGeometry(0.1, 0.1, 13, 8), white, -4.0, 0.4, -16.4).rotation.z = Math.PI / 2;
    // floodlights on tall poles, aimed at the rocket; lightning masts with red lights
    lightTower(-3.6, -14.5, 7.0); lightTower(16, -15.5, 7.0);
    for (const [x, z] of [[4.2, -21], [15.6, -21.5]]) { add(new THREE.CylinderGeometry(0.05, 0.1, 14, 6), grey, x, 7, z); blink.push(add(new THREE.SphereGeometry(0.14, 8, 6), red, x, 14.1, z)); }
    out.light = { sun: [6, 9, 5], hemi: 0.45 };
  }
  return out;
}
