// The 3D games' home pictures (journal, Q66: the flat drawings "do not seem
// to suggest a 3D experience"; "something like a screen shot of the actual
// game might be better"): a still from each game, drawn by the game's own
// page in a hidden frame at a moment set here, cut square around what
// matters, as WebP. tools/home-pics.js runs this page in headless Edge and
// saves what make() returns; opened by hand (from tools/serve.js) it shows
// the stills it would save. Not part of the site.

import { SHELF, CAN, BALL as TCA_BALL, HAND as TCA_HAND, GRAVITY, predict, launchVel as tcaLaunch } from '../src/core/tin-can-alley.js';
import { BALL as TOPPLE_BALL } from '../src/core/topple.js';

export const SIZE = 300;        // px: the home tile is 150 px, twice for sharp screens
export const QUALITY = 0.85;    // WebP's
const TOPPLE_SEED = 7;          // a game whose 5th scene is the tower (checked as it's made)

const $ = id => document.getElementById(id);
const log = (...a) => { $('log').textContent += a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n'; };
const wait = ms => new Promise(r => setTimeout(r, ms));
// Until `ok()` (checked every 100 ms), at most `ms`; else an error saying `what`.
async function until(ok, what, ms = 20000) {
  for (const t0 = performance.now(); performance.now() - t0 < ms; await wait(100)) if (ok()) return;
  throw new Error(`timed out: ${what}`);
}

// A game page in a hidden frame, w x h CSS px; resolves once it has loaded.
// `freeze`: its animation frames never run, so only this page moves it on
// (the game's step(), which draws on its last step) and every still is the
// same. Otherwise `onFrame` runs after each of its frames, while the
// picture just drawn can still be read.
function openGame(page, w, h, { freeze = false } = {}) {
  return new Promise((resolve, reject) => {
    const f = document.createElement('iframe');
    f.width = w; f.height = h;
    f.src = page;
    const hooks = { onFrame: null };
    f.onload = () => {
      const win = f.contentWindow;
      const raf = win.requestAnimationFrame.bind(win), timer = win.setTimeout.bind(win);
      win.requestAnimationFrame = freeze ? () => 0 : cb => raf(t => { cb(t); hooks.onFrame?.(win.performance.now()); });
      // a game that gets no animation frames draws on a timer (Five Dice 3D)
      if (!freeze) win.setTimeout = (cb, ms, ...a) => timer(() => { cb(...a); hooks.onFrame?.(win.performance.now()); }, ms);
      resolve({ win, doc: f.contentDocument, frame: f, hooks });
    };
    f.onerror = reject;
    document.body.append(f);
  });
}

// The canvas cut square around the box { x0, y0, x1, y1 } (0-1 across and
// down), grown by `margin` of its size and kept inside the canvas, scaled
// to SIZE px. Returns a 2D canvas.
function cut(src, box, margin = 0.25) {
  const W = src.width, H = src.height;
  const cx = (box.x0 + box.x1) / 2 * W, cy = (box.y0 + box.y1) / 2 * H;
  let side = Math.max((box.x1 - box.x0) * W, (box.y1 - box.y0) * H) * (1 + 2 * margin);
  side = Math.min(side, W, H);
  const x = Math.min(Math.max(cx - side / 2, 0), W - side), y = Math.min(Math.max(cy - side / 2, 0), H - side);
  const out = document.createElement('canvas');
  out.width = out.height = SIZE;
  const g = out.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, x, y, side, side, 0, 0, SIZE, SIZE);
  return { canvas: out, crop: { x: Math.round(x), y: Math.round(y), side: Math.round(side), of: `${W}x${H}` } };
}
// The whole canvas, 600 px wide (to choose a moment and a cut by eye).
function wholeOf(src) {
  const out = document.createElement('canvas');
  out.width = 600; out.height = Math.round(600 * src.height / src.width);
  out.getContext('2d').drawImage(src, 0, 0, out.width, out.height);
  return { canvas: out, crop: { whole: `${src.width}x${src.height}` } };
}
// The box round points projected to 0-1 (from a game's project()).
function boxOf(uvs) {
  const xs = uvs.map(p => p[0]), ys = uvs.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
// Numbers 0-1 from a seed (mulberry32), for a game's Math.random.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Motion lines behind a moving ball (developer, Q66: "some 'woosh' lines to
// imply the trajectory the ball had come from and that it was moving"),
// drawn onto a cut picture: `path` the ball's last places, 0-1 across and
// down the game's canvas (its project()), the last one where the ball is
// now; `rPx` the ball's radius in the cut. Three tapering streaks along the
// path, the middle one longest, white edged a little dark (to read on sky,
// grass and stripes), from a little behind the ball back `len` ball widths.
// Returns how long the middle streak is (px), for the log.
function streaks(shot, src, path, rPx, { len = 5, gap = 1.25 } = {}) {
  const { x, y, side } = shot.crop, k = SIZE / side;
  const pts = path.map(([u, v]) => [(u * src.width - x) * k, (v * src.height - y) * k]);
  // back along the path from the ball: [px along, point] until `want` px
  const back = want => {
    const out = [];
    let along = 0;
    for (let i = pts.length - 1; i > 0 && along < want; i--) {
      const [ax, ay] = pts[i], [bx, by] = pts[i - 1], d = Math.hypot(bx - ax, by - ay);
      if (!out.length) out.push([0, ax, ay]);
      const step = Math.min(d, want - along);
      along += step;
      if (d > 0) out.push([along, ax + (bx - ax) * step / d, ay + (by - ay) * step / d]);
    }
    return out;
  };
  const g = shot.canvas.getContext('2d');
  g.lineCap = 'round';
  const total = back(len * 2 * rPx + gap * rPx);
  const lengths = [];
  for (const [off, share, w] of [[-0.55, 0.7, 0.32], [0, 1, 0.42], [0.55, 0.7, 0.32]]) {
    const line = total.filter(([a]) => a >= gap * rPx && a <= (gap + 2 * len * share) * rPx);
    if (line.length < 2) continue;
    lengths.push(Math.round(line.at(-1)[0] - line[0][0]));
    // each point moved sideways off the path by `off` ball radii
    const side = line.map(([a, px, py], i) => {
      const [, qx, qy] = line[Math.min(i + 1, line.length - 1)], [, ox, oy] = line[Math.max(i - 1, 0)];
      const dx = qx - ox, dy = qy - oy, d = Math.hypot(dx, dy) || 1;
      return [a, px - dy / d * off * rPx, py + dx / d * off * rPx];
    });
    const a0 = side[0][0], a1 = side.at(-1)[0];
    for (const [colour, extra, alpha] of [['30,40,50', 2.2, 0.28], ['255,255,255', 0, 0.95]]) {
      for (let i = 1; i < side.length; i++) {
        const f = 1 - (side[i][0] - a0) / (a1 - a0);   // 1 at the ball's end, 0 at the tail
        g.strokeStyle = `rgba(${colour},${(alpha * f).toFixed(3)})`;
        g.lineWidth = Math.max(0.5, w * rPx * 2 * f + extra * f);
        g.beginPath(); g.moveTo(side[i - 1][1], side[i - 1][2]); g.lineTo(side[i][1], side[i][2]); g.stroke();
      }
    }
  }
  return lengths;
}

const toWebp = c => new Promise(r => c.toBlob(r, 'image/webp', QUALITY));
const dataUrl = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });

/* ---------- the games ---------- */

// Topple!: the 5th scene's two-storey tower well into its fall, a second
// ball on its way in with motion lines behind it (developer, Q66: "a more
// complex structure that is a little bit further along falling down, and the
// 'woosh' lines for the ball"). The first ball, which starts the fall,
// bounces back off the tower, so its lines would point the wrong way: it's
// taken away once it has hit, and the second (thrown in the physics, as the
// game waits READY_AFTER between throws) is the one in the picture.
// `height`: where on the tower the first ball touches (0 its foot, 1 its
// top); `after`: s from that touch to the picture; `lead`: s the second ball
// is then short of the tower.
async function topple({ seed = TOPPLE_SEED, height = 0.72, height2 = 0.6, after = 0.45, lead = 0.1, margin = 0.14, whole = false } = {}) {
  localStorage.setItem('web-games-topple-game', JSON.stringify({ seed, level: 1, scene: 5, hearts: 3, jewels: 4 }));
  const { win, doc } = await openGame('../topple.html', 600, 900, { freeze: true });
  await until(() => win.topple && !doc.getElementById('playBtn').disabled, 'Topple! ready');
  doc.getElementById('playBtn').click();
  await until(() => win.topple.state().ready, 'Topple!\'s scene');
  const tp = win.topple;
  if (tp.state().stack !== 'tower') await tp.scene(5);
  if (tp.state().stack !== 'tower') throw new Error(`topple: seed ${seed}'s 5th scene is ${tp.state().stack}, not the tower`);
  const { world, current, launchVel } = tp.inside();
  const top = Math.max(...world.blocks.map(b => b.body.position.y)) + 0.05;
  // throws whose path first touches a block: the straightest at `height`
  // (the first), the quickest there at `height2` (the second)
  let first = null, second = null;
  for (let up = 4; up <= 45; up += 0.5) {
    for (let aim = -0.6; aim <= 0.6; aim += 0.02) {
      const h = world.trace(launchVel(current.layout.power, aim, up).vec, 0).hits[0];
      if (h?.kind !== 'block') continue;
      const miss = Math.abs(h.at[1] - height * top) + 0.05 * Math.abs(aim);
      if (!first || miss < first.miss) first = { up, aim: +aim.toFixed(2), y: +h.at[1].toFixed(3), t: +h.t.toFixed(3), miss };
      if (Math.abs(h.at[1] - height2 * top) < 0.08 && (!second || h.t < second.t)) second = { up, aim: +aim.toFixed(2), y: +h.at[1].toFixed(3), t: +h.t.toFixed(3) };
    }
  }
  if (!second) throw new Error('topple: no second throw reaches the tower');
  // the pad's show over first (its dots are drawn in the park)
  await until(() => { tp.step(1 / 60); return tp.state().demo == null; }, "the pad's show over", 20000);
  const at0 = tp.blocks().map(b => b.at);
  const lowY = [...at0.map(p => p[1])].sort((x, y) => x - y)[2] - 0.01;   // the lower plank's (above the two posts)
  tp.throw(first.aim, first.up);
  const ball1 = world.balls[0];
  // on, a step at a time; the second ball thrown so it's `lead` s short of the
  // tower at the picture (the first's touch as its path said, then `after`)
  const throw2 = first.t + after - (second.t - lead);
  const dt = 1 / 60, path = [];
  let t = 0, touched = null, ball2 = null;
  while (t < 4) {
    if (!ball2 && t >= throw2 - 1e-9) ball2 = world.throwBall(launchVel(current.layout.power, second.aim, second.up).vec);
    tp.step(dt);
    t += dt;
    if (ball2) path.push([ball2.position.x, ball2.position.y, ball2.position.z]);
    if (touched == null && tp.blocks().some((b, i) => Math.hypot(...b.at.map((v, k) => v - at0[i][k])) > 0.03)) touched = t;
    if (touched != null && t - touched > 0.1 && world.balls.includes(ball1)) ball1.position.set(0, -5, 0);   // gone on the next step
    if (ball2 && path.length * dt >= second.t - lead) break;
  }
  if (!ball2) throw new Error(`topple: the second ball would be thrown before the first (at ${throw2.toFixed(2)} s)`);
  const canvas = doc.getElementById('c');
  if (whole) return { name: 'topple', seed, ...wholeOf(canvas) };
  // the upper storey and the plank it stands on (where the fall is; the bush
  // in front of the lower storey left mostly out), and the ball
  const now = path.at(-1);
  const upper = tp.blocks().filter((b, i) => at0[i][1] >= lowY);
  const uvs = upper.flatMap(b => [tp.project(b.at), tp.project([b.at[0], b.at[1] - 0.12, b.at[2]]), tp.project([b.at[0], b.at[1] + 0.12, b.at[2]])]);
  uvs.push(tp.project(now));
  const shot = cut(canvas, boxOf(uvs), margin);
  const [u0, v0] = tp.project(now), [, v1] = tp.project([now[0], now[1] + TOPPLE_BALL.r, now[2]]);
  const rPx = Math.abs(v1 - v0) * canvas.height * SIZE / shot.crop.side;
  const lines = streaks(shot, canvas, path.map(p => tp.project(p)), rPx);
  return {
    name: 'topple', seed, stack: 'tower', first, second, touchedAt: +(touched ?? -1).toFixed(2), pictureAt: +t.toFixed(2),
    ball: { u: +u0.toFixed(3), v: +v0.toFixed(3), rPx: +rPx.toFixed(1) }, lines, down: world.downCount(), ...shot,
  };
}

// Tin Can Alley: the pyramid of 6 on the shelf, the ball just reaching it,
// its motion lines behind it (developer, Q66: as it was, "the ball is
// leaning on the cans"). `after`: s from its first touch to the picture.
async function tinCanAlley({ after = 0.02, up = 2.5 } = {}) {
  const { win, doc } = await openGame('../tin-can-alley.html', 600, 900, { freeze: true });
  await until(() => win.tinCanAlley && !doc.getElementById('playBtn').disabled, 'Tin Can Alley ready');
  doc.getElementById('playBtn').click();
  await until(() => win.tinCanAlley.state()?.ready, 'Tin Can Alley\'s cans');
  const tca = win.tinCanAlley;
  // the power whose path reaches the shelf's front `up` cans up (2.5: the top can,
  // the one the ball isn't hidden behind from the side view)
  const aimY = SHELF.y + CAN.h * up;
  let power = null;
  for (let p = 0.06; p <= 1; p += 0.0025) {
    const r = predict(p, 0);
    if (r.where === 'shelf' && (power == null || Math.abs(r.hit[1] - aimY) < Math.abs(predict(power, 0).hit[1] - aimY))) power = +p.toFixed(4);
  }
  // on until the ball first touches a can (they sleep until then), then
  // `after` s; the ball's places from its path in the air (the page's ball
  // isn't reachable), so the picture is taken while it's still on that path
  tca.throw(power, 0);
  let t = 0;
  while (t < 2 && !tca.state().awake) { tca.step(1 / 120, 1 / 120); t += 1 / 120; }
  tca.step(after, 1 / 120);
  t += after;
  const { vec } = tcaLaunch(power, 0);
  const at = s => [TCA_HAND.x + vec[0] * s, TCA_HAND.y + vec[1] * s - 0.5 * GRAVITY * s * s, TCA_HAND.z + vec[2] * s];
  const path = [];
  for (let s = 0; s <= t + 1e-9; s += 1 / 120) path.push(at(s));
  const canvas = doc.getElementById('c');
  const pts = [];
  for (const x of [-0.4, 0.4]) for (const y of [SHELF.y - 0.12, SHELF.y + CAN.h * 3.4]) pts.push(tca.project([x, y, SHELF.z]));
  const shot = cut(canvas, boxOf(pts), 0.2);
  const now = path.at(-1), [u0, v0] = tca.project(now), [, v1] = tca.project([now[0], now[1] + TCA_BALL.r, now[2]]);
  const rPx = Math.abs(v1 - v0) * canvas.height * SIZE / shot.crop.side;
  const lines = streaks(shot, canvas, path.map(p => tca.project(p)), rPx, { len: 4, gap: 1.7 });
  return { name: 'tin-can-alley', power, camera: tca.state().camera, touchAt: +(t - after).toFixed(3), after, ball: { u: +u0.toFixed(3), v: +v0.toFixed(3), rPx: +rPx.toFixed(1) }, lines, ...shot };
}

// Five Dice 3D, the cup holding the dice up over the table (developer, Q66:
// "a shot of the cup holding the dice above the table might convey a more
// 3D feel"). The roll lifts the cup off the felt and shakes it; the game's
// camera looks steeply down, so the lift hardly shows. The tool moves that
// camera (not the game: the page's own copy of three.js, imported again in
// its frame, is the same module, so its camera can be found as it's drawn)
// to look at the cup from lower down and nearer, `from` (x, y, z from the
// cup), at `after` ms after Roll.
async function fiveDiceCup({ after = 900, from = [1.5, 2.2, 6.5], look = [-0.4, -0.4, 0], margin = 0.06, whole = false } = {}) {
  const { win, doc, hooks } = await openGame('../five-dice-3d.html', 600, 900);
  win.Math.random = seeded(5);
  await until(() => win.dice3d && !doc.getElementById('playBtn').disabled, 'Five Dice 3D ready');
  // the camera and the scene, as three.js brings them up to date to draw them
  const got3 = {};
  win.__homePics = got3;
  const s = doc.createElement('script');
  s.type = 'module';
  s.textContent = `import * as T from './src/vendor/three/three.module.min.js';
    const up = T.Object3D.prototype.updateMatrixWorld, h = window.__homePics;
    T.Object3D.prototype.updateMatrixWorld = function (f) { if (this.isPerspectiveCamera) h.camera = this; else if (this.isScene) h.scene = this; return up.call(this, f); };
    h.T = T;`;
  doc.head.append(s);
  await until(() => got3.T, 'three.js in the frame');
  doc.getElementById('playBtn').click();
  const roll = doc.getElementById('rollBtn');
  await until(() => !doc.getElementById('play').hidden && !roll.disabled && got3.camera, 'Five Dice 3D\'s tray');
  await wait(500);
  const { T, camera, scene } = got3;
  // the cup: the group holding the lathe-turned body
  let cup = null;
  scene.traverse(o => { if (!cup && o.geometry?.type === 'LatheGeometry') cup = o.parent; });
  if (!cup) throw new Error('five-dice-3d: no cup found');
  const canvas = doc.getElementById('c');
  const got = new Promise(resolve => {
    let t0 = null;
    hooks.onFrame = t => {
      if (t0 == null) { t0 = t; return; }
      const c = cup.position;
      camera.position.set(c.x + from[0], c.y + from[1], c.z + from[2]);
      camera.lookAt(c.x + look[0], c.y + look[1], c.z + look[2]);
      if (t - t0 < after) return;
      hooks.onFrame = null;
      if (whole) return resolve({ ...wholeOf(canvas), cupAt: [c.x, c.y, c.z].map(v => +v.toFixed(2)) });
      // the dice over the cup's top, the felt in front of it and to its left
      // (the tray it's over)
      const uv = p => { const v = new T.Vector3(...p).project(camera); return [(v.x + 1) / 2, (1 - v.y) / 2]; };
      const pts = [uv([c.x, c.y + 1.4, c.z]), uv([c.x, 0, c.z + 1.2]), uv([c.x - 2.2, 0, c.z]), uv([c.x + 1.1, c.y, c.z])];
      resolve({ ...cut(canvas, boxOf(pts), margin), cupAt: [c.x, c.y, c.z].map(v => +v.toFixed(2)) });
    };
  });
  roll.click();
  const shot = await Promise.race([got, wait(15000).then(() => { throw new Error('five-dice-3d: no frames after Roll'); })]);
  return { name: 'five-dice-3d', afterMs: after, from, ...shot };
}

const GAMES = { topple, 'tin-can-alley': tinCanAlley, 'five-dice-3d': fiveDiceCup };

// Every still: [{ name, data (a WebP data URL), bytes, ...how it was made }].
// `opts` by game, to try other moments: { 'five-dice-3d': { after: 800 } }.
export async function make(names = Object.keys(GAMES), opts = {}) {
  const out = [];
  for (const n of names) {
    log(`${n}: making`);
    const r = await GAMES[n](opts[n]);
    document.querySelectorAll('iframe').forEach(f => f.remove());   // one game at a time
    const blob = await toWebp(r.canvas);
    if (!blob || blob.type !== 'image/webp') throw new Error(`${n}: this browser can't make WebP`);
    const { canvas, ...about } = r;
    out.push({ ...about, bytes: blob.size, data: await dataUrl(blob) });
    log(n, { ...about, bytes: blob.size });
  }
  return out;
}

window.homePics = { make };

// Opened by hand: show them (headless, the tool calls make() itself).
if (!new URLSearchParams(location.search).has('tool')) {
  make().then(pics => {
    $('status').textContent = 'Made: as the home page shows them, and twice as big.';
    for (const p of pics) {
      const f = document.createElement('figure');
      f.innerHTML = `<img src="${p.data}" alt=""><img class="big" src="${p.data}" alt=""><figcaption>${p.name}: ${(p.bytes / 1024).toFixed(1)} KB</figcaption>`;
      $('out').append(f);
    }
  }).catch(e => { $('status').textContent = `Failed: ${e.message}`; log(e.stack ?? String(e)); });
}
