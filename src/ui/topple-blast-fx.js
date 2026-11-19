// Topple!'s blast ball, drawn (journal Q130; from mockup v2.3), in either world's
// three.js scene: the 💥 floating with its clock (a gold ring that drains as
// its time or the lander's passes run out, blinking at the end, fading as it
// goes), the blast ball in hand (red, glowing), the orange circle of its
// reach where it would land, and the blast (a flash, a fireball, sparks).
import * as THREE from '../vendor/three/three.module.min.js';

export function makeBlastFx(scene) {
  const S = scene;
  const root = new THREE.Group();
  S.add(root);
  // the 💥: a glowing core and shell, the sign with its clock ring over them, a light
  const power = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), new THREE.MeshBasicMaterial({ color: '#ffb02e', transparent: true }));
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshBasicMaterial({ color: '#ff5a1f', transparent: true, opacity: 0.28, depthWrite: false }));
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sign.scale.set(0.8, 0.8, 1); sign.position.y = 0.6; sign.renderOrder = 6;
  const glow = new THREE.PointLight('#ff8a2e', 2.5, 3);
  power.add(core, shell, sign, glow);
  power.visible = false;
  root.add(power);
  let drawn = -1, home = [0, 0, 0], fade = 1, going = false;
  function drawSign(frac) {
    const k = Math.round(frac * 100);
    if (k === drawn) return;
    drawn = k;
    cx.clearRect(0, 0, 128, 128);
    cx.lineWidth = 11; cx.lineCap = 'round';
    cx.strokeStyle = 'rgba(20, 14, 8, 0.55)';
    cx.beginPath(); cx.arc(64, 64, 52, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = frac > 0.3 ? '#ffcf5a' : '#ff6a2a';
    if (frac > 0) { cx.beginPath(); cx.arc(64, 64, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); cx.stroke(); }
    cx.font = '62px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('💥', 64, 69);
    tex.needsUpdate = true;
  }
  // the blast ball in hand, and its reach
  const hotMat = new THREE.MeshStandardMaterial({ color: '#d8432a', emissive: '#ff7a1a', emissiveIntensity: 0.8, roughness: 0.4 });
  const hot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), hotMat);
  hot.visible = false; root.add(hot);
  const reach = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 72), new THREE.MeshBasicMaterial({ color: '#ff5a1f', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthTest: false }));
  reach.rotation.x = -Math.PI / 2; reach.renderOrder = 5; reach.visible = false; root.add(reach);
  // the blast ball on its way (developer, v2: it must not look like a normal ball once
  // thrown): red and glowing over the physics' ball, a trail of sparks, until it goes off
  const flyHot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), hotMat);
  flyHot.visible = false; root.add(flyHot);
  const flyGlow = new THREE.PointLight('#ff7a1a', 3, 2.5);
  flyGlow.visible = false; root.add(flyGlow);
  let flying = null, trailT = 0;
  const fx = [];
  let t = 0;

  function boom(at, r) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.85, depthWrite: false }));
    ball.position.set(...at); root.add(ball);
    const light = new THREE.PointLight('#ffa040', 30, 12); light.position.set(at[0], at[1] + 0.5, at[2]); root.add(light);
    fx.push({ t: 0, ball, light, r, ...sparks(at, 60, 2, 3, 0.12, '#ffd27a') });
  }
  function sparkle(at) { fx.push({ t: 0, small: true, ...sparks(at, 30, 0.8, 1.2, 0.09, '#ffb02e') }); }
  function sparks(at, n, s0, s1, size, color) {
    const pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set(at, i * 3); const a = Math.random() * 6.28, e = Math.random() * 1.2, s = s0 + Math.random() * s1; vel.push([Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 1, Math.sin(a) * Math.cos(e) * s]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true }));
    root.add(pts);
    return { pts, vel, pos };
  }

  return {
    // the 💥 at `at` (null: none); gone(): it fades out
    showPower(at) { home = at.slice(); power.position.set(...at); power.visible = true; power.scale.setScalar(1); fade = 1; going = false; drawn = -1; },
    hidePower() { power.visible = false; going = false; },
    gone() { going = true; },
    get powerShown() { return power.visible; },
    // a frame on: frac (0-1) of its clock left, warn (blinking), g: the world's gravity for the sparks
    tick(dt, { frac = 1, warn = false, g = 9.82 } = {}) {
      t += dt;
      if (power.visible) {
        if (going) { fade -= dt / 0.6; if (fade <= 0) power.visible = false; }
        const blink = warn && !going ? (Math.sin(t * 18) > 0 ? 1 : 0.25) : 1;
        power.position.y = home[1] + Math.sin(t * 2.2) * 0.06;
        core.rotation.y = t * 2; core.rotation.x = t * 1.3;
        shell.scale.setScalar((1 + Math.sin(t * 6) * 0.06) * Math.max(0.01, fade));
        core.scale.setScalar(Math.max(0.01, fade));
        sign.material.opacity = fade * blink; core.material.opacity = fade * blink; shell.material.opacity = 0.28 * fade * blink;
        glow.intensity = 2.5 * fade * blink;
        drawSign(Math.max(0, frac));
      }
      hotMat.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 9);
      if (flying) {
        const p = flying.position;
        flyHot.position.set(p.x, p.y, p.z); flyGlow.position.set(p.x, p.y, p.z);
        trailT -= dt;
        if (trailT <= 0) { trailT = 0.05; fx.push({ t: 0, small: true, ...sparks([p.x, p.y, p.z], 4, 0.2, 0.4, 0.035, '#ffb02e') }); }
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const e = fx[i]; e.t += dt;
        const life = e.small ? 0.9 : 1.4;
        if (e.ball) { const k = Math.min(1, e.t / 0.35); e.ball.scale.setScalar(0.2 + k * e.r * 0.8); e.ball.material.opacity = 0.85 * (1 - k); e.light.intensity = 30 * Math.max(0, 1 - e.t / 0.5); }
        for (let j = 0; j < e.vel.length; j++) { e.vel[j][1] -= g * 0.4 * dt; for (let k = 0; k < 3; k++) e.pos[j * 3 + k] += e.vel[j][k] * dt; }
        e.pts.geometry.attributes.position.needsUpdate = true;
        e.pts.material.opacity = Math.max(0, 1 - e.t / life);
        if (e.t > life) { for (const o of [e.ball, e.light, e.pts]) if (o) { root.remove(o); o.geometry?.dispose(); o.material?.dispose(); } fx.splice(i, 1); }
      }
    },
    // the blast ball in hand at p, radius r (null: none)
    setHot(p, r = 0.2) { hot.visible = !!p; if (p) { hot.position.set(...p); hot.scale.setScalar(r); } },
    // its reach: a circle of radius r on the ground round p (null: none)
    setReach(p, r) { reach.visible = !!p; if (p) { reach.position.set(p[0], (p[1] ?? 0) + 0.03, p[2]); reach.scale.setScalar(r); } },
    // the blast ball on its way: drawn over the physics' ball `body` (radius r); null: none
    fly(body, r = 0.2) { flying = body; flyHot.visible = flyGlow.visible = !!body; if (body) { flyHot.scale.setScalar(r); trailT = 0; } },
    boom, sparkle,
    get busy() { return fx.length; },
    dispose() { S.remove(root); },
  };
}
