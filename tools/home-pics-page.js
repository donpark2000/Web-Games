// The 3D games' home pictures (journal, Q66: the flat drawings "do not seem
// to suggest a 3D experience"; "something like a screen shot of the actual
// game might be better"): a still from each game, drawn by the game's own
// page in a hidden frame at a moment set here, cut square around what
// matters, as WebP. tools/home-pics.js runs this page in headless Edge and
// saves what make() returns; opened by hand (from tools/serve.js) it shows
// the stills it would save. Not part of the site.

import { SHELF, CAN, predict } from '../src/core/tin-can-alley.js';

export const SIZE = 300;        // px: the home tile is 150 px, twice for sharp screens
export const QUALITY = 0.85;    // WebP's
const TOPPLE_SEED = 7;          // a game whose scenes include an arch (checked as it's made)

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
const toWebp = c => new Promise(r => c.toBlob(r, 'image/webp', QUALITY));
const dataUrl = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });

/* ---------- the games ---------- */

// Topple!: an arch close up, its top cube just knocked by the ball.
async function topple() {
  localStorage.setItem('web-games-topple-game', JSON.stringify({ seed: TOPPLE_SEED, level: 1, scene: 1, hearts: 3, jewels: 0 }));
  const { win, doc } = await openGame('../topple.html', 600, 900, { freeze: true });
  await until(() => win.topple && !doc.getElementById('playBtn').disabled, 'Topple! ready');
  doc.getElementById('playBtn').click();
  await until(() => win.topple.state().ready, 'Topple!\'s scene');
  const tp = win.topple;
  let scene = 0;
  for (let i = 1; i <= 4 && tp.state().stack !== 'arch'; i++) { await tp.scene(i); scene = i; }
  const st = tp.state();
  if (st.stack !== 'arch') throw new Error(`topple: seed ${TOPPLE_SEED} has no arch in scenes 1-4`);
  // the throw whose path first touches the highest block
  const { world, current, launchVel } = tp.inside();
  let best = null;
  for (let up = 4; up <= 45; up += 0.5) {
    for (let aim = -0.6; aim <= 0.6; aim += 0.02) {
      const h = world.trace(launchVel(current.layout.power, aim, up).vec, 0).hits[0];
      if (h?.kind === 'block' && (!best || h.at[1] > best.y + 1e-3)) best = { up, aim: +aim.toFixed(2), y: h.at[1], t: h.t };
    }
  }
  const at0 = tp.blocks().map(b => b.at);
  tp.throw(best.aim, best.up);
  // on until a block has moved 3 cm, then a little more
  let t = 0;
  while (t < 3 && !tp.blocks().some((b, i) => Math.hypot(...b.at.map((v, k) => v - at0[i][k])) > 0.03)) { tp.step(1 / 60); t += 1 / 60; }
  tp.step(0.12);
  const canvas = doc.getElementById('c');
  // the blocks from the ground up (a block's middle and the ground under it)
  const uvs = tp.blocks().flatMap(b => [tp.project(b.at), tp.project([b.at[0], 0, b.at[2]]), tp.project([b.at[0], b.at[1] + 0.2, b.at[2]])]);
  const shot = cut(canvas, boxOf(uvs), 0.18);
  return { name: 'topple', scene, throw: best, hitAfter: +t.toFixed(2), ...shot };
}

// Tin Can Alley: the pyramid of 6 on the shelf, the ball just into it.
async function tinCanAlley() {
  const { win, doc } = await openGame('../tin-can-alley.html', 600, 900, { freeze: true });
  await until(() => win.tinCanAlley && !doc.getElementById('playBtn').disabled, 'Tin Can Alley ready');
  doc.getElementById('playBtn').click();
  await until(() => win.tinCanAlley.state()?.ready, 'Tin Can Alley\'s cans');
  const tca = win.tinCanAlley;
  // the power whose path reaches the shelf's front a can and a half up
  const aimY = SHELF.y + CAN.h * 1.5;
  let power = null;
  for (let p = 0.06; p <= 1; p += 0.0025) {
    const r = predict(p, 0);
    if (r.where === 'shelf' && (power == null || Math.abs(r.hit[1] - aimY) < Math.abs(predict(power, 0).hit[1] - aimY))) power = +p.toFixed(4);
  }
  const t = predict(power, 0).t;
  tca.throw(power, 0);
  tca.step(t + 0.1);
  const canvas = doc.getElementById('c');
  const pts = [];
  for (const x of [-0.4, 0.4]) for (const y of [SHELF.y - 0.12, SHELF.y + CAN.h * 3.4]) pts.push(tca.project([x, y, SHELF.z]));
  const shot = cut(canvas, boxOf(pts), 0.2);
  return { name: 'tin-can-alley', power, camera: tca.state().camera, ...shot };
}

// Five Dice 3D: the dice tumbling into the tray, the moment a set time
// after Roll (its own frames run: the roll is animated, not stepped).
// 1.8 s: the five tumbling over the felt, the cup tipped away (tried by eye:
// at 0.4-0.9 s they're still in the cup; at 2.2 s they've landed). The box:
// where they are then, 0-1 of the tray's picture.
async function fiveDice3d({ after = 1800, box = { x0: 0.17, x1: 0.65, y0: 0.08, y1: 0.86 }, whole = false } = {}) {
  const { win, doc, hooks } = await openGame('../five-dice-3d.html', 600, 900);
  win.Math.random = seeded(5);   // the same throw each time (as near as the frames' timing lets it)
  // the page's code runs after three.js has loaded: Play does nothing till then
  await until(() => win.dice3d && !doc.getElementById('playBtn').disabled, 'Five Dice 3D ready');
  doc.getElementById('playBtn').click();
  const roll = doc.getElementById('rollBtn');
  await until(() => !doc.getElementById('play').hidden && !roll.disabled, 'Five Dice 3D\'s tray');
  await wait(500);
  const canvas = doc.getElementById('c');
  const got = new Promise(resolve => {
    let t0 = null;
    hooks.onFrame = t => {
      if (t0 == null) { t0 = t; return; }
      if (t - t0 < after) return;
      hooks.onFrame = null;
      resolve(whole ? wholeOf(canvas) : cut(canvas, box, 0));
    };
  });
  roll.click();
  const shot = await Promise.race([got, wait(15000).then(() => {
    let tail = [];
    try { tail = JSON.parse(win.localStorage.getItem('web-games-log') || '[]').slice(-6); } catch { /* none */ }
    throw new Error(`five-dice-3d: no frames after Roll: ${JSON.stringify({ frames: win.dice3d.frames(), rolling: win.dice3d.rolling(), roll: roll.className, sameDoc: doc === win.document, playShown: !win.document.getElementById('play').hidden, canvas: [canvas.width, canvas.height], log: tail })}`);
  })]);
  return { name: 'five-dice-3d', afterMs: after, ...shot };
}

const GAMES = { topple, 'tin-can-alley': tinCanAlley, 'five-dice-3d': fiveDice3d };

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
