// Topple!'s screens (DESIGN.md "Topple!"): the setup screen (your face, and
// Play! where the game is) and the play screen, the park filling the screen.
// The rules are src/core/topple.js, the physics and the scene check
// src/core/topple-world.js (cannon-es), the drawing src/ui/topple-scene.js
// (three.js); this file keeps time, handles the drag and the buttons, keeps
// the game, plays the sounds and logs.
//
// The physics and three.js are loaded with import(), not at the top, so a
// browser that can't run them still gets this page's words, and is told it
// can't show the 3D park (as Tin Can Alley).
//
// Two things are kept: the game (level, scene, hearts, jewels and its seed)
// on the device for every visit, so a child carries on where they got to
// (developer, 2026-11-10: the game remembers the level reached); and, as in
// every game, the scene under way for this visit only (src/ui/resume.js).

import {
  FACE_NAMES, SCENES, HEARTS, BALLS, SCALE, HAND, checkSetup, createGame, readGame, sceneOver, newRound, useBall, canThrow,
  update, ballsLeft, endWords, frontDrag, sideDrag, launchVel, dotsFor, behindView, sideView, dotScaleFor, sceneParts, END_WAIT,
  padSpot, dragFrom, demoDrag, demoAt, DEMO_UPS, sideTarget,
} from '../core/topple.js';
import { nameOf, endSound } from '../core/players.js';
import { mergeSetup } from '../core/resume.js';
import { svg, pickerFace } from './faces.js';
import { toppleMini } from './topplepics.js';
import { log, startLog } from './debuglog.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('topple', msg, data);
const r2 = v => Math.round(v * 100) / 100;

startLog('topple');

// Setup screen picks; "New game" comes back here with them kept.
const setup = { p1: 'bear' };

/* ---------- the game, kept on the device ---------- */

export const GAME_KEY = 'web-games-topple-game';
let storage = null;
try { storage = window.localStorage; } catch { /* blocked: the game lasts this visit */ }
let game = null;
try { game = readGame(JSON.parse(storage?.getItem(GAME_KEY) ?? 'null')); } catch { /* unreadable: a new game */ }
const newSeed = () => 1 + Math.floor(Math.random() * (2 ** 31 - 2));
function saveGame() {
  try { storage?.setItem(GAME_KEY, JSON.stringify(game)); } catch (e) { L('game not kept on the device', { error: String(e) }); }
}
// A new game is kept at once: its seed makes its scenes, and a scene picked
// up again is checked against it (kept only as a scene ended, a reload made
// a new seed and the scene under way was lost).
if (!game) { game = createGame(newSeed()); saveGame(); }
const isFresh = g => g.scene === 1 && g.hearts === HEARTS && g.jewels === 0;
const sceneId = () => ({ seed: game.seed, level: game.level, scene: game.scene });

/* ---------- the scene under way ---------- */

let playing = false;   // on the play screen
let current = null;    // { id, layout, parts, check, tries, ms }
let round = null;      // newRound()'s
let ended = null;      // the scene's end: { outcome, words, won }
// The scene as it last stood still (no ball in flight, the blocks at rest):
// the round and each block's pose, kept for coming back to it.
let settled = null;

const resume = resumable('topple', 1, () => ({
  screen: playing ? 'play' : 'setup', setup,
  scene: playing && current ? { id: current.id, layout: current.layout } : null,
  settled, ended,
}));

/* ---------- loading the 3D ---------- */

let park3d = null, physics = null, why = '';
try {
  [park3d, physics] = await Promise.all([import('./topple-scene.js'), import('../core/topple-world.js')]);
  if (!park3d.webglOk()) why = 'no WebGL';
} catch (e) {
  why = `three.js or cannon-es not loaded: ${e.message ?? e}`;
}

/* ---------- setup screen ---------- */

const WHY = { 'p1-missing': 'Pick your face first.', 'unknown-face': 'Pick a face from the list.' };
const jewels = g => '💎'.repeat(g.jewels) + '○'.repeat(Math.max(0, SCENES - g.jewels));
const hearts = g => '❤️'.repeat(g.hearts) + '🤍'.repeat(Math.max(0, HEARTS - g.hearts));

function renderSetup() {
  $('p1Faces').replaceChildren(...FACE_NAMES.map(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'face';
    b.innerHTML = pickerFace(f);
    b.setAttribute('aria-label', nameOf(f));
    b.setAttribute('aria-pressed', String(f === setup.p1));
    b.onclick = () => { setup.p1 = f; L('p1 picked', { face: f }); renderSetup(); };
    return b;
  }));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  const fresh = isFresh(game);
  $('where').textContent = fresh ? '' : `Level ${game.level} · scene ${game.scene} of ${SCENES} · ${hearts(game)} · ${'💎'.repeat(game.jewels)}`;
  $('playBtn').textContent = fresh ? 'Play!' : 'Carry on';
  $('freshBtn').hidden = fresh;
  const code = checkSetup(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code] : '';
  resume.keep();
}
$('rulesPic').innerHTML = toppleMini('av');
$('playBtn').onclick = () => {
  if (checkSetup(setup)) return;
  L('play', { face: setup.p1, ...game });
  showPlay();
  startScene();
};
$('freshBtn').onclick = () => {
  if (checkSetup(setup)) return;
  const was = { ...game };
  game = createGame(newSeed());
  saveGame();
  L('new scenes from scene 1', { was, seed: game.seed });
  showPlay();
  startScene();
};

/* ---------- the play screen ---------- */

let stage = null;       // the 3D drawing (made the first time the play screen shows)
let world = null;       // the physics
let running = false, last = 0, busy = false;
let drag = null;        // { id, x0, y0, x, y } while a finger is down
let view = 'front';     // 'front' (from behind) or 'side'
let camViews = null;    // { front, side } for the park's shape and the scene
let aspect = 0.75;
let shot = null;        // the latest throw: { body, at, pred, touches, last }
let pad = null;         // the drag pad: { x, y, r } px in the park, for the view shown
let demo = null;        // the pad's show as a scene starts: { t } s, until a finger touches
const perf = { frames: 0, physMs: 0, dropped: 0, at: 0 };

function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  playing = true;
  document.body.classList.add('tp-playing');
  if (!stage) makeStage();
  fit();
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}
function showSetup() {
  running = false;
  playing = false;
  drag = null;
  stopDemo();
  $('play').hidden = true;
  $('setup').hidden = false;
  document.body.classList.remove('tp-playing');
  renderSetup();
  scrollTo(0, 0);
}

function makeStage() {
  const canvas = $('c');
  stage = park3d.makePark3d(canvas);
  world = physics.createWorld({ onHit });
  L('3D started', { webgl: stage.webgl, three: 'r160', cannon: '0.20.0', pixelRatio: Math.min(devicePixelRatio || 1, 2), farLeaves: stage.farLeaves });
  new ResizeObserver(fit).observe($('park'));
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { if (drag) L('drag cancelled'); drag = null; });
  // no double-tap zoom on the park (as Tin Can Alley's stall); the drag is pointer events
  canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });
}

// The canvas takes the park's box (upright: between the top row and the
// bar; sideways: beside the column); both views are fitted to the scene at
// the park's shape, worked out again on every fit.
let lastFit = '';
function fit() {
  if (!stage || $('play').hidden) return;
  const box = $('park').getBoundingClientRect(), w = Math.round(box.width), h = Math.round(box.height);
  if (!w || !h) return;
  aspect = stage.resize(w, h);
  if (!current) return;
  camViews = { front: behindView(aspect, current.parts), side: sideView(aspect, current.parts) };
  placeCamera();
  placePad();
  const key = `${w}x${h} ${current.layout.seed}`;
  if (key === lastFit) return;
  lastFit = key;
  L('fit', {
    park: `${w}x${h}`, fov: r2(camViews.front.fov), by: camViews.front.by, sideFov: camViews.side.fov, sideDist: r2(camViews.side.dist), pad,
    screen: `${innerWidth}x${innerHeight}`, way: innerWidth > innerHeight ? 'sideways' : 'upright',
  });
}
function placeCamera() {
  if (camViews) stage.setCamera(camViews[view]);
}
// The drag pad where the view shown puts it (padSpot: away from the dots).
function placePad() {
  const box = $('park').getBoundingClientRect();
  pad = padSpot(view, box.width, box.height);
  if (demo) demo.to = null;   // the show's drag worked out again for the new size
  const el = $('pad');
  el.hidden = !pad;
  if (!pad) return;
  Object.assign(el.style, { left: `${pad.x - pad.r}px`, top: `${pad.y - pad.r}px`, width: `${2 * pad.r}px`, height: `${2 * pad.r}px`, fontSize: `${Math.round(pad.r * 0.95)}px` });
  $('ghost').style.fontSize = `${Math.round(pad.r * 1.25)}px`;
}
// The slingshot's ball on the screen, px in the park (for the log's "from").
function ballPx() {
  const box = $('park').getBoundingClientRect(), [u, v] = stage.project([HAND.x, HAND.y, HAND.z]);
  return { x: Math.round(u * box.width), y: Math.round(v * box.height) };
}
function stopDemo(why) {
  if (!demo) return;
  if (why) L('pad show stopped', { why, t: r2(demo.t) });
  demo = null;
  $('ghost').hidden = true;
}

// The scene the game is at: made from its seed and checked (the same every
// time), or `kept` (a scene picked up again: its layout and the blocks at rest).
async function startScene(kept = null) {
  if (busy) return;
  busy = true;
  drag = null; shot = null; ended = null;
  stopDemo();
  $('over').hidden = true;
  $('ask').hidden = true;
  $('hint').hidden = false;
  $('hint').textContent = 'Setting up the scene…';
  renderHud();
  // let the words show before the scene's made (up to a second or so on a phone)
  await new Promise(r => setTimeout(r, 30));
  const t0 = performance.now();
  if (kept) {
    const parts = sceneParts(kept.layout);
    world.setScene(parts, kept.settled?.poses ?? null);
    current = { id: sceneId(), layout: kept.layout, parts, check: null, tries: 0 };
  } else {
    const s = world.makeScene(game.seed, game.level, game.scene);
    current = { id: sceneId(), layout: s.layout, parts: s.parts, check: s.check, tries: s.tries };
    for (const t of s.thrown) L('layout thrown away', t);
  }
  current.ms = Math.round(performance.now() - t0);
  const drawn = stage.setScene(current.parts);
  round = kept?.settled?.round ?? newRound(world.blocks.length);
  if (round.since != null) round.since = 99;   // a ball in flight when the page was left comes back to the pouch
  settled = kept?.settled ?? null;
  lastFit = '';
  fit();
  $('hint').textContent = HINT;
  $('hint').hidden = round.used > 0;
  // the pad's show, before the scene's first ball (not on a scene that had ended)
  if (!round.used && !round.result) demo = { t: 0, t0: performance.now(), to: null };
  perf.frames = 0; perf.physMs = 0; perf.dropped = 0; perf.at = performance.now();
  renderTally();
  const L0 = current.layout;
  L(kept ? 'scene picked up again' : 'scene', {
    ...game, stack: L0.stack, layoutSeed: L0.seed, power: L0.power, reachCm: Math.round(L0.reach * 100),
    things: L0.things.map(t => ({ kind: t.kind, ...(t.where ? { where: t.where } : {}), gapCm: Math.round(t.gap * 100), ...(t.arm ? { armCm: Math.round(t.arm * 100) } : {}) })),
    ...(L0.unplaced.length ? { noRoomFor: L0.unplaced } : {}), blocks: world.blocks.length, ms: current.ms, tries: current.tries,
    leaves: drawn.leaves, drawMs: drawn.ms,
    ...(current.check ? { check: { ok: current.check.ok, why: current.check.why, direct: current.check.direct, fewest: current.check.fewest, bank: current.check.bank, share: current.check.share, seen: current.check.seen, seenSide: current.check.seenSide } } : {}),
    ...(kept ? { used: round.used, down: round.down } : {}),
  });
  busy = false;
  resume.keep();
  return current;
}

function renderTally() {
  const r = round;
  $('s1Chip').innerHTML = svg(setup.p1, ended ? (ended.won ? 'winner' : 'sad') : 'normal');
  $('downN').textContent = r.down;
  $('downWho').textContent = `of ${r.total} down`;
  const left = ballsLeft(r);
  $('balls').innerHTML = Array.from({ length: BALLS }, (_, i) => `<i class="${i < left ? '' : 'used'}"></i>`).join('');
  $('balls').setAttribute('aria-label', `${left} ball${left === 1 ? '' : 's'} left`);
  renderHud();
  $('restartBtn').disabled = !!r.result || r.used === 0;
  $('restartBtn').parentElement.classList.toggle('ended', !!r.result);
}
// The pills over the park and the view switch (shown as a scene is set up too).
function renderHud() {
  const g = ended?.shown ?? game;
  $('hudLevel').textContent = `Level ${g.level} ${jewels(g)}`;
  $('hudLevel').setAttribute('aria-label', `Level ${g.level}, ${g.jewels} of ${SCENES} jewels`);
  $('hudHearts').textContent = hearts(g);
  $('hudHearts').setAttribute('aria-label', `${g.hearts} heart${g.hearts === 1 ? '' : 's'}`);
  $('viewBtn').textContent = view === 'side' ? 'Front view' : 'Side view';
}

/* ---------- the drag and the throw ---------- */

const HINT = 'Drag from 👆, then let go';
const parkSize = () => { const b = $('park').getBoundingClientRect(); return Math.min(b.width, b.height); };
function aimFor(dx, dy) {
  if (!current) return null;
  return view === 'side'
    ? sideDrag(dx, dy, parkSize(), current.layout.power, sideAt())
    : frontDrag(dx, dy, parkSize(), current.layout.power);
}
// The side view's target: a block still standing (sideTarget), as they stand now.
const sideAt = () => sideTarget(world.blocks.map(b => ({ x: b.body.position.x, z: b.body.position.z, down: b.down, c: b.c })), current.parts.stand);
const dragNow = () => (drag ? aimFor(drag.x - drag.x0, drag.y - drag.y0) : null);
const ready = () => !!(round && !busy && canThrow(round).ok);

function onDown(e) {
  sound.unlock();
  stopDemo('a finger');
  if (!ready() || drag) return;
  // where it started (the pad, the ball, elsewhere): logged with the throw, to
  // see whether children start on the pad (Q67)
  const box = $('park').getBoundingClientRect();
  const from = dragFrom(e.clientX - box.left, e.clientY - box.top, pad, ballPx());
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, from };
  $('hint').hidden = true;   // out of the dots' way
  try { $('c').setPointerCapture(e.pointerId); } catch { /* an old browser: the drag still works over the canvas */ }
}
function onMove(e) {
  if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; }
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const d = dragNow(), from = drag.from;
  drag = null;
  if (!d) return;
  if (!d.ok) {
    L('drag too short: no throw', { view, from, up: Math.round(d.up), aim: r2(d.aim) });
    if (!round.used) $('hint').hidden = false;
    return;
  }
  doThrow(d, from);
}
function doThrow(d, from = null) {
  if (!ready()) { L('throw refused', { why: canThrow(round).why ?? 'busy' }); return false; }
  const r = useBall(round);
  const { v, yaw, el, vec } = launchVel(d.power, d.aim, d.up);
  const aimed = world.trace(vec, 1);
  const body = world.throwBall(vec);
  shot = { body, at: world.time, pred: aimed.hits.map(h => ({ kind: h.kind, at: h.at })), touches: [], last: null };
  $('hint').hidden = true;
  sound.play('whoosh', 0, { level: d.power });
  L('throw', {
    ball: r.ball, view, ...(from ? { from } : {}), ...(view === 'side' ? { at: sideAt().c ?? 'middle' } : {}), speed: r2(v), up: Math.round(el * 180 / Math.PI), aim: Math.round(yaw * 180 / Math.PI), power: r2(d.power), ...(d.pull != null ? { pull: d.pull } : {}),
    toward: aimed.hits.map(h => ({ kind: h.kind, at: h.at.map(r2), t: r2(h.t) })),
  });
  renderTally();
  resume.keep();
  return true;
}

/* ---------- sounds, and where the ball touched ---------- */

let lastKnock = 0, lastThud = 0;
function onHit({ a, b, v, y, ball, other }) {
  const now = performance.now(), vs = v / Math.sqrt(SCALE);
  if (a === 'ball' && shot && shot.body === ball && shot.touches.length < 2 && shot.last !== other) {
    // where it touched, against the path worked out for it (its first two touches)
    shot.last = other;
    const n = shot.touches.length, at = [ball.position.x, ball.position.y, ball.position.z], pred = shot.pred[n];
    const t = { kind: b, t: r2(world.time - shot.at), at: at.map(r2) };
    if (pred) { t.predicted = pred.kind; t.offCm = Math.round(Math.hypot(...at.map((x, i) => x - pred.at[i])) * 100); }
    shot.touches.push(t);
    L('ball touched', { touch: n + 1, ...t });
  }
  if (a === 'block' || b === 'block') {
    if (v < 0.5 || now - lastKnock < 30) return;
    lastKnock = now;
    sound.play('knock', 0, { level: Math.min(1, (vs + (a === 'ball' ? 1 : 0)) / 6), quiet: true });
  } else if (a === 'ball' && v >= 0.5) {
    if (b === 'glass') sound.play('boing', 0, { quiet: true });
    else if (b === 'bush' || (b === 'tree' && y > 1.6 * SCALE)) sound.play('rustle', 0, { quiet: true });
    else if (vs > 0.6 && now - lastThud > 60) { lastThud = now; sound.play('thud', 0, { quiet: true }); }
  }
}

/* ---------- the loop ---------- */

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  tick(dt);
  requestAnimationFrame(frame);
}

function tick(dt, draw = true) {
  if (!round || busy) return;
  const t0 = performance.now();
  const { down, fell, dropped } = world.step(dt, () => performance.now());   // a slow phone drops steps (Q65)
  perf.physMs += performance.now() - t0;
  perf.dropped += dropped;
  perf.frames++;
  for (const b of fell) L('block down', { c: b.c, t: r2(round.t) });
  const { downChanged, ended: result } = update(round, dt, { down, still: world.still() });
  if (downChanged) { L('blocks down', { down: round.down, of: round.total, t: r2(round.t) }); renderTally(); }
  if (result) endScene(result);
  noteSettled();
  if (!draw) return;
  stage.sync(world.blocks.map(b => b.body), world.balls);
  const ok = ready();
  $('pad').classList.toggle('wait', !ok);
  const d = dragNow() ?? (ok ? demoFrame() : null);
  stage.setSling(ok, d && ok ? d.aim : 0, d && ok ? d.power : 0);
  stage.setDots(d && ok && d.show ? dotsFor(world.trace(launchVel(d.power, d.aim, d.up).vec, 0)) : null, camViews ? dotScaleFor(view, camViews.side) : 1);
  stage.render();
}

// Where the show's drag ends, in the view shown: the first of DEMO_UPS whose
// path touches a block first (else the first), worked out once a view.
function demoTarget() {
  const size = parkSize(), ups = DEMO_UPS[view];
  let pick = null, tried = 0;
  for (const up of ups) {
    tried++;
    const to = demoDrag(view, size, current.parts.stand, up), d = aimFor(to.dx, to.dy);
    const first = d ? world.trace(launchVel(d.power, d.aim, d.up).vec, 0).hits[0]?.kind ?? 'nothing' : 'nothing';
    if (first === 'block') { pick = { ...to, up, first }; break; }
    if (!pick) pick = { ...to, up, first };
  }
  L('pad show', { view, pad, up: pick.up, first: pick.first, tried });
  return { ...pick, view };
}

// The pad's show, a frame on: the see-through finger from the pad, and the
// aim its drag would make (for the dots), or null.
// On the clock, not the frames (a slow phone's frames are capped at 0.05 s:
// the finger would crawl).
function demoFrame() {
  if (!demo || !pad || !current) return null;
  demo.t = (performance.now() - demo.t0) / 1000;
  if (!demo.to || demo.to.view !== view) demo.to = demoTarget();
  const s = demoAt(demo.t, demo.to);
  if (!s) { L('pad show done', { view }); stopDemo(); return null; }
  const g = $('ghost');
  g.hidden = false;
  g.style.left = `${pad.x + s.dx}px`;
  g.style.top = `${pad.y + s.dy}px`;
  g.style.opacity = String(r2(s.alpha * 0.85));
  return s.dots ? aimFor(s.dx, s.dy) : null;
}

// Kept for coming back: the round and the blocks' poses, once no ball is in
// flight and the blocks are at rest (checked twice a second).
let settledAt = 0;
function noteSettled() {
  const r = round;
  if (r.t - settledAt < 0.5) return;
  settledAt = r.t;
  if (r.since != null && r.since < END_WAIT && !r.result) return;
  if (!world.still()) return;
  const was = settled && JSON.stringify(settled.round);
  settled = { round: JSON.parse(JSON.stringify(r)), poses: world.poses() };
  if (JSON.stringify(settled.round) !== was) resume.keep();
}

// The scene's over: a jewel and on, or a heart lost (sceneOver()); kept on
// the device at once, so coming back starts where the game is. The level
// done: a new game (level 2 isn't made yet), new scenes.
function endScene(result, quiet = false) {
  const was = { ...game };
  const outcome = sceneOver(game, result.won);
  if (outcome === 'level') game = createGame(newSeed());
  saveGame();
  const words = endWords(outcome, outcome === 'level' ? was : game, nameOf(setup.p1));
  // the pills over the park show the scene's end until the next one starts
  // (no hearts left, or all 5 jewels), not the game already moved on
  const shown = outcome === 'out' ? { ...game, hearts: 0, jewels: was.jewels } : outcome === 'level' ? { ...was, jewels: SCENES } : null;
  ended = { outcome, words, won: result.won, shown };
  // the blocks as the scene ended (the last may still be falling): a reload shows it as it was
  settled = { round: JSON.parse(JSON.stringify(round)), poses: world.poses() };
  showEnd();
  const secs = (performance.now() - perf.at) / 1000;
  L('scene over', { ...result, outcome, was, now: { ...game }, fps: Math.round(perf.frames / Math.max(secs, 0.001)), physicsMs: r2(perf.physMs / Math.max(1, perf.frames)), stepsDropped: perf.dropped });
  if (!quiet) sound.play(result.won ? endSound(1, { solo: true }) : 'aww');
  resume.keep();
}
function showEnd() {
  drag = null;
  stopDemo();
  renderTally();
  $('hint').hidden = true;
  $('overChip').innerHTML = svg(setup.p1, ended.won ? 'winner' : 'sad');
  $('overTitle').textContent = ended.words.title;
  $('overSub').textContent = ended.words.sub ?? '';
  $('nextBtn').textContent = ended.words.next;
  $('over').hidden = false;
}

$('nextBtn').onclick = () => { L('next', { outcome: ended?.outcome, ...game }); startScene(); };
$('newBtn').onclick = () => { L('new game: the setup screen'); current = null; round = null; ended = null; settled = null; showSetup(); };

// Start again (every game has one: developer, 2026-10-15): asks first, over
// the park, and costs a heart (else it would be a way round losing one).
$('restartBtn').onclick = () => {
  if (!round || round.result || !round.used) return;
  drag = null;
  stopDemo();
  L('start again?', { used: round.used, down: round.down });
  $('ask').hidden = false;
  $('restartNo').focus({ preventScroll: true });
};
$('restartNo').onclick = () => { L('start again: no'); $('ask').hidden = true; };
$('restartYes').onclick = () => {
  const was = { ...game }, outcome = sceneOver(game, false);
  saveGame();
  L('start again: yes, a heart lost', { outcome, was, now: { ...game } });
  startScene();
};

// The view, any time (developer, 2026-11-10: "free", as often as wanted).
$('viewBtn').onclick = () => setView(view === 'side' ? 'front' : 'side');
function setView(v) {
  if (v === view || !camViews) return;
  view = v;
  drag = null;
  placeCamera();
  placePad();
  renderTally();
  L('view', { view, fov: r2(stage.fov), dotScale: r2(dotScaleFor(view, camViews.side)), pad });
  // the pad's show again from the start, in this view, while no ball's been thrown
  if (demo) demo.t0 = performance.now();
}

/* ---------- coming back to a game ---------- */

// The scene kept last time, if it's the one the game is at (another tab may
// have moved the game on): its layout, and the blocks as they last stood
// still (a ball in flight comes back to the pouch); a scene that had ended
// shows its card again.
async function restore() {
  const kept = resume.saved;
  if (!kept) return false;
  try {
    mergeSetup(setup, kept.setup);
    if (checkSetup(setup)) setup.p1 = 'bear';
    const same = kept.scene && JSON.stringify(kept.scene.id) === JSON.stringify(sceneId());
    if (kept.screen !== 'play' || !kept.scene || (!same && !kept.ended)) { renderSetup(); return true; }
    showPlay();
    if (kept.ended) {
      // the game has moved on already (kept on the device as the scene ended)
      await startScene({ layout: kept.scene.layout, settled: kept.settled });
      ended = kept.ended;
      round.result = round.result ?? { won: ended.won, down: round.down, total: round.total, balls: round.used };
      showEnd();
    } else await startScene({ layout: kept.scene.layout, settled: kept.settled });
    L('resumed', { ...game, used: round.used, down: round.down, ended: kept.ended?.outcome ?? null, poses: !!kept.settled });
    return true;
  } catch (e) {
    L('resume failed: the setup screen', { error: String(e) });
    resume.clear();
    current = null; round = null; ended = null; settled = null;
    showSetup();
    return false;
  }
}

/* ---------- start ---------- */

if (why) {
  L('no 3D: told this device can’t show it', { why, ua: navigator.userAgent });
  for (const el of document.querySelectorAll('#setup > .panel, #setup > .go')) el.hidden = el.id !== 'no3d';
} else {
  L('the game on this device', { ...game, fresh: isFresh(game) });
  (await restore()) || renderSetup();
}

// For checking the game in a browser (not used by the page): step the park
// by hand (a hidden tab barely animates), throw, drag, read the state.
window.topple = {
  step(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) tick(dt, i === n - 1); return this.state(); },
  throw(aim = 0, up = 20) { return doThrow({ power: current.layout.power, aim, up }); },
  // a drag on the park, as a finger would (px from where it starts), in the view shown
  drag(dx, dy) { const d = aimFor(dx, dy); if (!d?.ok) return { thrown: false, ...d }; return { thrown: doThrow(d), ...d }; },
  hold(dx, dy) { drag = { id: -1, x0: 0, y0: 0, x: dx, y: dy }; tick(1 / 60); return dragNow(); },
  letGo() { drag = null; tick(1 / 60); },
  view(v) { setView(v); return { view, fov: r2(stage.fov) }; },
  // a scene of the game (its jewels so far, 3 hearts), for checking it
  async scene(i) { game.scene = i; game.jewels = i - 1; game.hearts = HEARTS; saveGame(); await startScene(); return this.state(); },
  state: () => (round ? {
    ...round, game: { ...game }, view, ready: ready(), busy, ended: ended?.outcome ?? null, card: $('over').hidden ? '' : $('overTitle').textContent,
    stack: current?.layout.stack, things: current?.layout.things.map(t => t.kind + (t.where ? ` ${t.where}` : '')), power: current?.layout.power,
    awake: world.awake(), dots: stage.dotCount(), fov: r2(stage.fov), touches: shot?.touches ?? [], pad, demo: demo ? r2(demo.t) : null,
  } : { game: { ...game }, busy }),
  blocks: () => world.blocks.map(b => ({ c: b.c, at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2), down: b.down })),
  project: p => stage?.project(p),
  hand: HAND,
  // the physics and the scene, for a test player in the page (as the mockup's)
  inside: () => ({ world, current, launchVel }),
};
