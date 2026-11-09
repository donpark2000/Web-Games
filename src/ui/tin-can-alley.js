// Tin Can Alley's screens (DESIGN.md "Tin Can Alley"): the setup screen
// (your face and the cans, developer 2026-11-09) and the play screen, the
// stall filling the screen. The rules are src/core/tin-can-alley.js, the
// physics src/core/tin-can-alley-physics.js (cannon-es), the drawing
// src/ui/tin-can-alley-stall.js (three.js); this file keeps time, handles
// the drag and the buttons, plays the sounds and logs.
//
// The physics and three.js are loaded with import(), not at the top, so a
// browser that can't run them still gets this page's words, and is told
// it can't show the 3D stall (as Five Dice 3D).

import {
  FACE_NAMES, LAYOUTS, LAYOUT_NAMES, BALLS, checkSetup, createMatch, newRound, canThrow, throwBall, update, ballsLeft,
  dragToThrow, predict, cameraAt, endWords, END_WAIT,
} from '../core/tin-can-alley.js';
import { nameOf, endSound } from '../core/players.js';
import { mergeSetup } from '../core/resume.js';
import { svg, pickerFace } from './faces.js';
import { canStackSvg, stallMini } from './tcapics.js';
import { log, startLog } from './debuglog.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('tin-can-alley', msg, data);
const r2 = v => Math.round(v * 100) / 100;

startLog('tin-can-alley');

// Setup screen picks; "New game" comes back here with them kept.
const setup = { p1: 'bear', layout: '6' };
let match = null;      // from createMatch, while on the play screen
// The round as it last stood still (no ball in flight, the cans at rest):
// the round's numbers and each can's pose, kept for coming back to it.
let settled = null;

const resume = resumable('tin-can-alley', 1, () => ({ screen: match ? 'play' : 'setup', setup, match, settled }));

/* ---------- loading the 3D ---------- */

let stall3d = null, physics = null, why = '';
try {
  [stall3d, physics] = await Promise.all([import('./tin-can-alley-stall.js'), import('../core/tin-can-alley-physics.js')]);
  if (!stall3d.webglOk()) why = 'no WebGL';
} catch (e) {
  why = `three.js or cannon-es not loaded: ${e.message ?? e}`;
}

/* ---------- setup screen ---------- */

const WHY = { 'p1-missing': 'Pick your face first.', 'unknown-face': 'Pick a face from the list.', 'unknown-cans': 'Pick the cans.' };

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
  for (const b of document.querySelectorAll('.layout')) b.setAttribute('aria-pressed', String(b.dataset.layout === setup.layout));
  const code = checkSetup(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code] : '';
  resume.keep();
}
$('rulesPic').innerHTML = stallMini('av');
for (const b of document.querySelectorAll('.layout')) {
  b.querySelector('.ico').innerHTML = canStackSvg(b.dataset.layout);
  b.onclick = () => { setup.layout = b.dataset.layout; L('cans', { layout: setup.layout }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkSetup(setup)) return;
  match = createMatch(setup);
  settled = null;
  L('match started', { face: match.face, layout: match.layout, cans: match.round.total });
  showPlay();
  startRound(false);
};

/* ---------- the play screen ---------- */

let stage = null;       // the 3D drawing (made the first time the play screen shows)
let world = null;       // the physics
let running = false, last = 0;
let drag = null;        // { id, x0, y0, x, y } while a finger is down
let firstHit = false;   // the ball has touched a can this round (logged once)
const perf = { frames: 0, physMs: 0, at: 0 };

function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  document.body.classList.add('tca-playing');
  if (!stage) makeStage();
  fit();
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}
function showSetup() {
  running = false;
  drag = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  document.body.classList.remove('tca-playing');
  renderSetup();
  scrollTo(0, 0);
}

function makeStage() {
  const canvas = $('c');
  stage = stall3d.makeStall3d(canvas);
  world = physics.createStall({ onHit });
  L('3D started', { webgl: stage.webgl, three: 'r160', cannon: '0.20.0', pixelRatio: Math.min(devicePixelRatio || 1, 2) });
  new ResizeObserver(fit).observe($('stall'));
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { if (drag) L('drag cancelled'); drag = null; });
  // no double-tap zoom on the stall (as Five Dice 3D's tray); the drag is pointer events
  canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });
}

// The canvas takes the stall's box (upright: between the top row and the
// bar; sideways: beside the column); the camera keeps the stall in view.
let lastFit = '';
function fit() {
  if (!stage || $('play').hidden) return;
  const box = $('stall').getBoundingClientRect(), w = Math.round(box.width), h = Math.round(box.height);
  if (!w || !h) return;
  const fov = stage.resize(w, h);
  const key = `${w}x${h}`;
  if (key === lastFit) return;
  lastFit = key;
  L('fit', { stall: key, fov: r2(fov), screen: `${innerWidth}x${innerHeight}`, way: innerWidth > innerHeight ? 'sideways' : 'upright' });
}

function startRound(next = true) {
  if (next) newRound(match);
  world.setCans(match.layout);
  settled = null;
  firstHit = false;
  drag = null;
  $('over').hidden = true;
  $('ask').hidden = true;
  $('hint').hidden = false;
  perf.frames = 0; perf.physMs = 0; perf.at = performance.now();
  renderTally();
  L('round', { n: match.rounds, layout: match.layout, cans: match.round.total, balls: BALLS });
  resume.keep();
}

function renderTally() {
  const r = match.round;
  $('s1Chip').innerHTML = svg(match.face, r.result ? (r.result.won ? 'winner' : 'sad') : 'normal');
  $('offN').textContent = r.off;
  $('offWho').textContent = `of ${r.total} off`;
  const left = ballsLeft(r);
  $('balls').innerHTML = Array.from({ length: BALLS }, (_, i) => `<i class="${i < left ? '' : 'used'}"></i>`).join('');
  $('balls').setAttribute('aria-label', `${left} ball${left === 1 ? '' : 's'} left`);
  $('restartBtn').parentElement.classList.toggle('ended', !!r.result);
}

/* ---------- the drag and the throw ---------- */

const stallSize = () => { const b = $('stall').getBoundingClientRect(); return Math.min(b.width, b.height); };
const dragNow = () => (drag ? dragToThrow(drag.x - drag.x0, drag.y - drag.y0, stallSize()) : { power: 0, aim: 0 });

function onDown(e) {
  sound.unlock();
  if (!match || !canThrow(match).ok || drag) return;
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  try { $('c').setPointerCapture(e.pointerId); } catch { /* an old browser: the drag still works over the canvas */ }
}
function onMove(e) {
  if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; }
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const { power, aim } = dragNow();
  drag = null;
  doThrow(power, aim);
}
function doThrow(power, aim) {
  const r = throwBall(match, power, aim);
  if (!r.ok) {
    L(r.why === 'too-short' ? 'drag too short: no throw' : 'throw refused', { why: r.why, power: r2(power) });
    return false;
  }
  world.throwBall(r.vec, r.ball);
  $('hint').hidden = true;
  sound.play('whoosh', 0, { level: power });
  L('throw', { ball: r.ball, power: r2(power), aim: r2(aim), speed: r2(r.v), turn: Math.round(r.yaw * 180 / Math.PI), toward: { where: r.toward.where, x: r2(r.toward.hit[0]), y: r2(r.toward.hit[1]) } });
  renderTally();
  resume.keep();
  return true;
}

/* ---------- sounds ---------- */

let lastClink = 0, lastThud = 0;
function onHit({ a, b, v, ball }) {
  const now = performance.now();
  if (a === 'ball' && b === 'can') {
    if (!firstHit) {
      firstHit = true;
      L('first can hit', { ball, v: r2(v), t: r2(match.round.t) });
    }
  }
  if (b === 'can' || a === 'can') {
    if (now - lastClink < 35) return;
    lastClink = now;
    sound.play('clink', 0, { level: Math.min(1, (v + (a === 'ball' ? 1 : 0)) / 6), quiet: true });
  } else if (a === 'ball' && v > 0.6 && now - lastThud > 60) {
    lastThud = now;
    sound.play('thud', 0, { quiet: true });
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
  const t0 = performance.now();
  world.step(dt);
  perf.physMs += performance.now() - t0;
  perf.frames++;
  const before = match.round.since;
  const { offChanged, ended } = update(match, dt, { off: world.offCount(), still: world.still() });
  if (offChanged) { L('cans off', { off: match.round.off, of: match.round.total, t: r2(match.round.t) }); renderTally(); }
  const cam = cameraAt(match.round.since);
  if (before != null && cameraAt(before).view !== cam.view) L(`camera: ${cam.view}`);
  if (ended) endRound(ended);
  noteSettled(cam);
  if (!draw) return;
  stage.setCamera(cam);
  stage.sync([...world.cans, ...world.balls]);
  const ok = canThrow(match).ok, { power, aim } = dragNow();
  stage.setHeld(ok, drag ? power : 0, drag ? aim : 0);
  stage.setRing(drag && ok && power > 0.03 ? predict(power, aim) : null);
  stage.render();
}

// Kept for coming back: the round and the cans' poses, once the cans are
// at rest and the camera is back (checked twice a second).
let settledAt = 0;
function noteSettled(cam) {
  const r = match.round;
  if (r.t - settledAt < 0.5) return;
  settledAt = r.t;
  if (cam.view !== 'behind' && !r.result) return;
  if (r.since != null && r.since < END_WAIT && !r.result) return;
  if (!world.still()) return;
  const was = settled && JSON.stringify(settled.round);
  settled = { round: JSON.parse(JSON.stringify(r)), poses: world.poses() };
  if (JSON.stringify(settled.round) !== was) resume.keep();
}

function endRound(result, quiet = false) {
  renderTally();
  $('hint').hidden = true;
  $('overChip').innerHTML = svg(match.face, result.won ? 'winner' : 'sad');
  $('overTitle').textContent = endWords(result, nameOf(match.face));
  $('over').hidden = false;
  if (quiet) return;
  const secs = (performance.now() - perf.at) / 1000;
  L('round over', { ...result, cleared: match.cleared, rounds: match.rounds, fps: Math.round(perf.frames / Math.max(secs, 0.001)), physicsMs: r2(perf.physMs / Math.max(1, perf.frames)) });
  sound.play(result.won ? endSound(1, { solo: true }) : 'aww');
  resume.keep();
}

$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => { L('new game'); match = null; settled = null; showSetup(); };

// Start again (every game has one: developer, 2026-10-15): asks first,
// over the stall, so a stray tap can't lose a round.
$('restartBtn').onclick = () => {
  if (!match || match.round.result) return;
  drag = null;
  L('start again?', { used: match.round.used, off: match.round.off });
  $('ask').hidden = false;
  $('restartNo').focus({ preventScroll: true });
};
$('restartNo').onclick = () => { L('start again: no'); $('ask').hidden = true; };
$('restartYes').onclick = () => { L('start again: yes'); startRound(); };

/* ---------- coming back to a game ---------- */

// The game kept last time: the setup's picks, and a round as it last
// stood still (a ball in flight when the page was left comes back to
// the hand).
function restore() {
  const kept = resume.saved;
  if (!kept) return false;
  try {
    mergeSetup(setup, kept.setup);
    if (!LAYOUTS.includes(setup.layout)) setup.layout = '6';
    if (kept.screen !== 'play' || !kept.match) { renderSetup(); return true; }
    match = kept.match;
    if (checkSetup({ p1: match.face, layout: match.layout })) throw new Error('kept match: bad face or cans');
    showPlay();
    world.setCans(match.layout, kept.settled?.poses ?? null);
    if (kept.settled) match.round = kept.settled.round;
    else { newRound(match); match.rounds--; }   // nothing at rest kept: the round from the start
    match.round.since = match.round.since == null ? null : 99;   // the camera back behind
    settled = kept.settled ?? null;
    firstHit = match.round.used > 0;
    $('hint').hidden = match.round.used > 0;
    renderTally();
    if (match.round.result) endRound(match.round.result, true);
    L('resumed', { face: match.face, layout: match.layout, used: match.round.used, off: match.round.off, result: match.round.result, poses: !!kept.settled });
    return true;
  } catch (e) {
    L('resume failed: a new game', { error: String(e) });
    resume.clear();
    match = null;
    settled = null;
    showSetup();
    return false;
  }
}

/* ---------- start ---------- */

if (why) {
  L('no 3D: told this device can’t show it', { why, ua: navigator.userAgent });
  for (const el of document.querySelectorAll('#setup > .panel, #setup > .go')) el.hidden = el.id !== 'no3d';
} else {
  restore() || renderSetup();
}

// For checking the game in a browser (not used by the page): step the
// stall by hand (a hidden tab barely animates), throw, read the state.
window.tinCanAlley = {
  step(sec, dt = 1 / 60) { for (let i = 0, n = Math.round(sec / dt); i < n; i++) tick(dt, i === n - 1); return this.state(); },
  throw(power, aim = 0) { return doThrow(power, aim); },
  state: () => (match ? { ...match.round, cleared: match.cleared, ready: canThrow(match).ok, camera: cameraAt(match.round.since).view, awake: world.awake(), names: LAYOUT_NAMES[match.layout] } : null),
  project: p => stage?.project(p),
};
