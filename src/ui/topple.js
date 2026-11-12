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
  update, ballsLeft, endWords, frontDrag, launchVel, dotsFor, behindView, sceneParts, END_WAIT,
  padSpot, padPress, demoDrag, demoAt, DEMO_UPS, trunksIn, MAX_LEVEL, levelInfo, switchLevel, placeOf, isOpen, MAP_NODES, mapRoad, roadAt, roadTo,
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
// the level after one done, opened as the game is read (a game from 10.0, which had four)
try { const was = JSON.parse(storage.getItem(GAME_KEY)).reached; if (game && game.reached > was) L('level opened: the one after a level done', { was, reached: game.reached, done: game.done }); } catch { /* nothing kept */ }
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
// The scene left for the map (its id, layout and the blocks as they last stood still): carried on when it's played again.
let parked = null;

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
  if (fresh && game.reached > 1) $('where').textContent = `Level ${game.reached} reached`;
  $('playBtn').textContent = fresh ? 'Play!' : 'Carry on';
  $('freshBtn').hidden = fresh;
  // Start over only once another level is open (before that, New scenes from scene 1 does the same)
  $('overBtn').hidden = game.reached <= 1 || !$('overAsk').hidden;
  const code = checkSetup(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code] : '';
  resume.keep();
}
$('rulesPic').innerHTML = toppleMini('av');
// Play! opens the map (level 2 mockup v1); a level on it opens its screen.
$('playBtn').onclick = () => {
  if (checkSetup(setup)) return;
  L('play: the map', { face: setup.p1, ...game });
  showMap();
};
// New scenes: a new seed, every level from scene 1; the levels reached and done are kept (Claude's pick).
$('freshBtn').onclick = () => {
  if (checkSetup(setup)) return;
  const was = { ...game };
  game = createGame(newSeed(), game);
  saveGame();
  L('new scenes from scene 1', { was, seed: game.seed, reached: game.reached });
  showMap();
};
// Start over (developer, 2026-11-12, Q92: "start the whole game over with no
// memory of levels" and "the map locking everything but level 1"): asks
// first; then a new game, level 1 the only one open, new scenes.
$('overBtn').onclick = () => {
  L('start over: asked', { reached: game.reached, done: game.done });
  $('overAsk').hidden = false;
  renderSetup();
};
$('overNo').onclick = () => { L('start over: no'); $('overAsk').hidden = true; renderSetup(); };
$('overYes').onclick = () => {
  const was = { ...game };
  game = createGame(newSeed());
  parked = null;
  saveGame();
  $('overAsk').hidden = true;
  L('start over: a new game, level 1 only', { was, seed: game.seed, reached: game.reached });
  renderSetup();
};

/* ---------- the map and a level's screen ---------- */

// Each level's picture on the map and its screen: level 1's drawing (the
// home tile's), the others a sign of their setting (Claude's pick, to
// review: the mockup's were pictures the 3D drew).
const LOOKS = {
  1: { pic: () => toppleMini('lvsvg'), bg: '#7DBCE6' },
  2: { pic: () => '🏗️', bg: 'linear-gradient(#8FB8D8, #C9BFAE)' },
  3: { pic: () => '❄️', bg: 'linear-gradient(#8DB7DC, #F2F7FB)' },
  4: { pic: () => '🌵', bg: 'linear-gradient(#7FB3E0, #E2B48A)' },
  5: { pic: () => '🌙', bg: 'linear-gradient(#0B1430, #2A3A6A)' },
};
// The setup screen's view: 'faces' (the picks) or 'map'.
function setupView(v) {
  $('setup').classList.toggle('tp-map', v === 'map');
  $('mapView').hidden = v !== 'map';
  if (v !== 'faces') $('overAsk').hidden = true;   // Start over's question doesn't wait behind the map
  scrollTo(0, 0);
}
// The map: the levels on a road, your face at the one you're on. After a
// level (developer, 2026-11-12, Q81: instead of the next level's screen,
// "show the map, see an animation of the next level unlocking, and moving
// a small version of the avatar from where it was ... to the new level"):
// walk = { from, to, unlock } plays that: the lock shakes and pops, the
// level's picture shows, your face goes along the road as its dots turn
// orange, and the new level is started from the map (its button, or a tap
// on it), not from its screen.
let walking = null;    // the walk under way: { to, timers }
let arrived = 0;       // the level the last walk came to (a tap on it starts it)
const roadPath = P => `M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`;
function placeFace(n) {
  const el = $('mapFace');
  if (el) { el.style.left = `${n[0]}%`; el.style.top = `${n[1]}%`; }
}
function showMap(walk = null) {
  if (playing) showSetup();
  stopWalk();
  setupView('map');
  const segs = MAP_NODES.slice(1, MAX_LEVEL).map((p, i) => mapRoad(MAP_NODES[i], p));
  // the road's dots orange up to the level reached (the walk's own leg grey, filled as the face goes)
  const on = i => game.reached >= i + 2 && !(walk && i === walk.to - 2);
  const dots = (P, lit, id = '') => `<path${id ? ` id="${id}"` : ''} d="${P ? roadPath(P) : ''}" fill="none" stroke="${lit ? '#F2724F' : '#9FB0B7'}" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:10px;stroke-dasharray:0 22px"/>`;
  const road = P => `<path d="${roadPath(P)}" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:30px"/>`;
  $('mapBox').innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${segs.map(road).join('')}${segs.map((P, i) => dots(P, on(i))).join('')}${dots(null, true, 'mapFill')}</svg>`;
  MAP_NODES.slice(0, MAX_LEVEL).forEach((n, i) => {
    const lv = i + 1, info = levelInfo(lv), done = game.done.includes(lv), now = game.level === lv && !walk;
    // the level the walk unlocks shows locked until its lock pops
    const locked = !isOpen(game, lv) || (walk?.unlock && lv === walk.to);
    const pl = placeOf(game, lv), mid = pl.scene > 1 || pl.jewels > 0 || pl.hearts < HEARTS;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `node${lv}`;
    b.className = `node ${locked ? 'locked' : now ? 'now' : done ? 'done' : 'open'}`;
    b.style.left = `${n.x}%`; b.style.top = `${n.y}%`;
    const sub = locked ? 'Locked' : mid ? `Scene ${pl.scene} of ${SCENES}` : done ? '💎💎💎💎💎' : 'Start here';
    b.innerHTML = `<span class="disc"><span class="pic" style="background:${LOOKS[lv].bg}">${locked ? '<span class="lock">🔒</span>' : LOOKS[lv].pic()}</span>${done ? '<span class="badge">✔</span>' : ''}</span>`
      + `<span class="nname">${lv} · ${info.name}</span><span class="nsub">${sub}</span>`;
    b.setAttribute('aria-label', `Level ${lv}, ${info.name}${locked ? ', locked' : ''}`);
    b.onclick = () => {
      if (walking) return;   // let the walk finish
      if (!isOpen(game, lv)) {
        b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        $('mapToast').textContent = `Finish level ${lv - 1} first`;
        L('map: a locked level', { level: lv, reached: game.reached });
        return;
      }
      // straight into play (developer, 2026-11-12, Q90: no Level screen): carry on, start, or play a done level again
      L('map: a level, straight into play', { level: lv, walkedTo: lv === arrived, done, place: pl });
      startLevel(lv);
    };
    $('mapBox').append(b);
  });
  // your face, at the level you're on (or where the walk starts)
  const face = document.createElement('span');
  face.id = 'mapFace'; face.className = 'mapface'; face.setAttribute('aria-hidden', 'true');
  face.innerHTML = svg(setup.p1, walk ? 'winner' : 'normal');
  $('mapBox').append(face);
  const at = MAP_NODES[(walk ? walk.from : game.level) - 1];
  placeFace([at.x, at.y]);
  $('mapGo').hidden = true;
  $('mapToast').textContent = '';
  arrived = 0;
  if (walk) playWalk(walk, segs[walk.to - 2]);
  resume.keep();
}
// The walk, step by step (on timers and the frames; all at once with reduced motion).
function playWalk(walk, P) {
  const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const node = $(`node${walk.to}`), timers = [];
  walking = { to: walk.to, timers };
  const later = (ms, fn) => timers.push(setTimeout(fn, quick ? 0 : ms));
  L('map: the walk', { ...walk, quick });
  if (walk.unlock) {
    later(500, () => { node.classList.add('shake'); });
    later(1000, () => {
      // the lock pops; the level's picture shows
      const pic = node.querySelector('.pic');
      node.classList.remove('locked', 'shake'); node.classList.add('open', 'unlocked');
      pic.innerHTML = `${LOOKS[walk.to].pic()}<span class="lock pop">🔒</span>`;
      node.querySelector('.nsub').textContent = 'Start here';
      node.setAttribute('aria-label', `Level ${walk.to}, ${levelInfo(walk.to).name}`);
      sound.play('clink');
      L('map: unlocked', { level: walk.to });
    });
  }
  // the face along the road, the dots filling in behind it (1.6 s, easing in and out)
  later(walk.unlock ? 1500 : 300, () => {
    const t0 = performance.now(), D = quick ? 0 : 1600, fill = $('mapFill');
    $('mapFace').classList.add('walking');
    sound.play('climb');
    const step = now => {
      if (walking?.timers !== timers) return;
      const k = D ? Math.min(1, (now - t0) / D) : 1, e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
      placeFace(roadAt(P, e));
      fill.setAttribute('d', e > 0 ? roadPath(roadTo(P, e)) : '');
      if (k < 1) { requestAnimationFrame(step); return; }
      arrive(walk);
    };
    requestAnimationFrame(step);
  });
}
function arrive(walk) {
  const face = $('mapFace');
  face.classList.remove('walking'); face.classList.add('landed');
  const node = $(`node${walk.to}`);
  node.classList.remove('open', 'done'); node.classList.add('now');
  arrived = walk.to;
  $('mapGo').textContent = `Play level ${walk.to} ▸`;
  $('mapGo').hidden = false;
  sound.play('ding');
  walking = null;
  L('map: arrived', { level: walk.to });
}
function stopWalk() {
  if (!walking) return;
  for (const t of walking.timers) clearTimeout(t);
  walking = null;
}
// Play level n straight from the map (a tap on it, or Play after a walk).
function startLevel(n) {
  if (!switchLevel(game, n)) { L('level not open', { level: n, reached: game.reached }); showMap(); return; }
  saveGame();
  L('level: start', { ...game });
  showPlay();
  startScene();
}
$('mapGo').onclick = () => { if (arrived) startLevel(arrived); };
$('mapBack').onclick = () => { setupView('faces'); renderSetup(); };

/* ---------- the play screen ---------- */

let stage = null;       // the 3D drawing (made the first time the play screen shows)
let world = null;       // the physics
let running = false, last = 0, busy = false;
let drag = null;        // { id, x0, y0, x, y } while a finger is down
let camView = null;     // the view from behind, for the park's shape and the scene
let aspect = 0.75;
let shot = null;        // the latest throw: { body, at, pred, touches, last }
let pad = null;         // the drag pad: { x, y, r } px in the park
let demo = null;        // the pad's show as a scene starts: { t } s, until a finger touches
const perf = { frames: 0, physMs: 0, dropped: 0, at: 0 };

function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  playing = true;
  document.body.classList.add('tp-playing');
  if (!stage) makeStage();
  // The canvas still holds the last scene drawn (developer, 2026-11-12: a
  // new level "briefly shows the old level before redrawing"): hidden until
  // startScene has drawn the new one; the park's own colour and "Setting up
  // the scene…" meanwhile.
  if (!current || stage.level !== game.level) hideCanvas(true);
  fit();
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
}
function hideCanvas(on) {
  const c = $('c');
  if (c.style.visibility === (on ? 'hidden' : '')) return;
  c.style.visibility = on ? 'hidden' : '';
  L(on ? 'canvas hidden: a new scene to draw' : 'canvas shown: the scene drawn', { level: game.level, scene: game.scene });
}
function showSetup() {
  running = false;
  playing = false;
  drag = null;
  stopDemo();
  $('play').hidden = true;
  $('setup').hidden = false;
  document.body.classList.remove('tp-playing');
  setupView('faces');
  renderSetup();
  scrollTo(0, 0);
}

function makeStage() {
  const canvas = $('c');
  stage = park3d.makePark3d(canvas);
  // a setting's own sounds: Star Light's owl hooting now and then
  stage.onSound = name => { if (!SET_SOUND[name] || !playing) return; sound.play(SET_SOUND[name], 0, { quiet: true }); L('owl hoots', { t: r2(round?.t ?? 0) }); };
  world = physics.createWorld({ onHit });
  L('3D started', { webgl: stage.webgl, three: 'r160', cannon: '0.20.0', pixelRatio: Math.min(devicePixelRatio || 1, 2), farLeaves: stage.farLeaves, farTrunkInLeavesM: trunksIn().far });
  new ResizeObserver(fit).observe($('park'));
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { if (drag) L('drag cancelled'); drag = null; });
  // no double-tap zoom on the park (as Tin Can Alley's stall); the drag is pointer events
  canvas.addEventListener('touchend', e => e.preventDefault(), { passive: false });
}

// The canvas takes the park's box (upright: between the top row and the
// bar; sideways: beside the column); the view is fitted to the scene at the
// park's shape, worked out again on every fit.
let lastFit = '';
function fit() {
  if (!stage || $('play').hidden) return;
  const box = $('park').getBoundingClientRect(), w = Math.round(box.width), h = Math.round(box.height);
  if (!w || !h) return;
  aspect = stage.resize(w, h);
  if (!current) return;
  camView = behindView(aspect, current.parts);
  stage.setCamera(camView);
  placePad();
  const key = `${w}x${h} ${current.layout.seed}`;
  if (key === lastFit) return;
  lastFit = key;
  L('fit', {
    park: `${w}x${h}`, fov: r2(camView.fov), by: camView.by, pad,
    screen: `${innerWidth}x${innerHeight}`, way: innerWidth > innerHeight ? 'sideways' : 'upright',
  });
}
// The drag pad where padSpot puts it (away from the dots).
function placePad() {
  const box = $('park').getBoundingClientRect();
  pad = padSpot(box.width, box.height);
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
  // the scene left for the map, if it's the one the game is at: carried on as it was
  if (!kept && parked && JSON.stringify(parked.id) === JSON.stringify(sceneId())) { kept = parked; L('scene carried on after the map', { used: parked.settled?.round.used ?? 0 }); }
  parked = null;
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
  if (stage.level !== game.level) {
    hideCanvas(true);
    const r = await stage.setLevel(game.level);
    L('setting', { ...r, name: levelInfo(game.level).name });
  }
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
  // drawn once now, so the canvas never shows the scene before
  stage.sync(world.blocks, world.balls);
  stage.render();
  hideCanvas(false);
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
    leaves: drawn.leaves, drawMs: drawn.ms, trunkInLeavesM: trunksIn(current.parts.props).scene,
    ...(current.check ? { check: { ok: current.check.ok, why: current.check.why, direct: current.check.direct, fewest: current.check.fewest, bank: current.check.bank, share: current.check.share, seen: current.check.seen } } : {}),
    ...(kept ? { used: round.used, down: round.down } : {}),
  });
  busy = false;
  resume.keep();
  return current;
}

function renderTally() {
  const r = round;
  $('s1Chip').innerHTML = svg(setup.p1, ended ? (ended.won ? 'winner' : 'sad') : 'normal');
  // the balls left, drawn as the level's ball (developer, 2026-11-12, Q80: no blocks-down count)
  const left = ballsLeft(r);
  $('balls').classList.toggle('iron', levelInfo(current?.id.level ?? game.level).ball === 'iron');
  $('balls').innerHTML = Array.from({ length: BALLS }, (_, i) => `<i class="${i < left ? '' : 'used'}"></i>`).join('');
  $('balls').setAttribute('aria-label', `${left} ball${left === 1 ? '' : 's'} left`);
  renderHud();
  // Start again only once there's something to start again (developer, 2026-11-12: pressed before a throw, it did nothing)
  $('restartBtn').disabled = !!r.result || r.used === 0;
  $('restartBtn').classList.toggle('notyet', $('restartBtn').disabled);
}
// The pills over the park (shown as a scene is set up too).
function renderHud() {
  const g = ended?.shown ?? game;
  // the level's name with its number (developer, 2026-11-12: "show the level name")
  const name = levelInfo(g.level).name;
  $('hudLevelName').textContent = `${g.level} · ${name}`;
  $('hudJewels').textContent = jewels(g);
  $('hudLevel').setAttribute('aria-label', `Level ${g.level}, ${name}, ${g.jewels} of ${SCENES} jewels`);
  $('hudHearts').textContent = hearts(g);
  $('hudHearts').setAttribute('aria-label', `${g.hearts} heart${g.hearts === 1 ? '' : 's'}`);
}

/* ---------- the drag and the throw ---------- */

const HINT = 'Drag from 👆, then let go';
const parkSize = () => { const b = $('park').getBoundingClientRect(); return Math.min(b.width, b.height); };
const aimFor = (dx, dy) => (current ? frontDrag(dx, dy, parkSize(), current.layout.power) : null);
const dragNow = () => (drag ? aimFor(drag.x - drag.x0, drag.y - drag.y0) : null);
const ready = () => !!(round && !busy && canThrow(round).ok);

// A throw starts only on the pad (or within PAD.reach of it); a press
// anywhere else aims nothing: the pad pulses to show where to start, and the
// miss is logged (how far off, and whether by the ball) to see whether the
// reach is big enough for a child's finger. No press, no dots: a mouse
// moving over the park does nothing (onMove only follows a drag).
function onDown(e) {
  sound.unlock();
  if (!ready() || drag) return;
  const box = $('park').getBoundingClientRect();
  const p = padPress(e.clientX - box.left, e.clientY - box.top, pad, ballPx());
  if (!p.on) {
    L('press off the pad', { from: p.from, offPx: p.offPx, r: pad?.r ?? null, at: [Math.round(e.clientX - box.left), Math.round(e.clientY - box.top)] });
    pulsePad();
    return;
  }
  stopDemo('a finger');
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  $('hint').hidden = true;   // out of the dots' way
  try { $('c').setPointerCapture(e.pointerId); } catch { /* an old browser: the drag still works over the canvas */ }
}
function onMove(e) {
  if (drag && e.pointerId === drag.id) { drag.x = e.clientX; drag.y = e.clientY; }
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX; drag.y = e.clientY;
  const d = dragNow();
  drag = null;
  if (!d) return;
  if (!d.ok) {
    L('drag too short: no throw', { up: Math.round(d.up), aim: r2(d.aim) });
    if (!round.used) $('hint').hidden = false;
    return;
  }
  doThrow(d);
}
// The pad grows and glows for a moment (started again on every miss).
function pulsePad() {
  const el = $('pad');
  if (el.hidden) return;
  el.classList.remove('pulse');
  void el.offsetWidth;   // so the animation starts again
  el.classList.add('pulse');
}
function doThrow(d) {
  if (!ready()) { L('throw refused', { why: canThrow(round).why ?? 'busy' }); return false; }
  const r = useBall(round);
  const { v, yaw, el, vec } = launchVel(d.power, d.aim, d.up);
  const aimed = world.trace(vec, 1);
  const body = world.throwBall(vec);
  shot = { body, at: world.time, pred: aimed.hits.map(h => ({ kind: h.kind, at: h.at })), touches: [], last: null };
  $('hint').hidden = true;
  sound.play('whoosh', 0, { level: d.power });
  L('throw', {
    ball: r.ball, speed: r2(v), up: Math.round(el * 180 / Math.PI), aim: Math.round(yaw * 180 / Math.PI), power: r2(d.power),
    toward: aimed.hits.map(h => ({ kind: h.kind, at: h.at.map(r2), t: r2(h.t) })),
  });
  renderTally();
  resume.keep();
  return true;
}

/* ---------- sounds, and where the ball touched ---------- */

let lastKnock = 0, lastThud = 0;
const MAT_SOUND = { wood: 'plank', brick: 'brick', steel: 'ring', concrete: 'crash', ice: 'iceknock', barrel: 'barrel', glow: 'chime' };
// a setting's own (stage.onSound): the owl's hoot (Star Light)
const SET_SOUND = { hoot: 'hoot' };
// the ball into the wheelbarrow's gravel, or into snow
// (the snowy rock: the iron ball's clonk on stone)
const SOFT_SOUND = { barrow: 'crunch', rock: 'clonk' };
function onHit({ a, b, v, y, ball, other, mat, thing }) {
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
    // each material its own (level 2 mockup v4-v6: wood C, brick B, steel C, concrete C); level 1's toy knock
    sound.play(MAT_SOUND[mat] ?? 'knock', 0, { level: Math.min(1, (vs + (a === 'ball' ? 1 : 0)) / 6), quiet: true });
  } else if (a === 'ball' && v >= 0.5) {
    if (b === 'glass') sound.play('boing', 0, { quiet: true });
    else if (b === 'soft') sound.play(SOFT_SOUND[thing] ?? 'crunch', 0, { level: Math.min(1, vs / 6), quiet: true });
    else if (thing === 'light') sound.play('ring', 0, { level: Math.min(1, vs / 6), quiet: true });
    else if (b === 'bush' || (b === 'tree' && thing !== 'cactus' && y > 1.0 * SCALE)) sound.play('rustle', 0, { quiet: true });
    else if (vs > 0.6 && now - lastThud > 60) { lastThud = now; sound.play(stage.level > 1 ? 'clonk' : 'thud', 0, { level: Math.min(1, vs / 6), quiet: true }); }
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
  const { down, fell, rose, broke, dropped } = world.step(dt, () => performance.now());   // a slow phone drops steps (Q65)
  for (const k of broke) brokeUp(k);
  perf.physMs += performance.now() - t0;
  perf.dropped += dropped;
  perf.frames++;
  for (const b of fell) L('block down', { c: b.c, t: r2(round.t) });
  // the animals take fright at the first block to fall, shatter or burst while they're in view
  const fx0 = fell[0]?.body.position.x ?? broke[0]?.at[0];
  if (fx0 !== undefined) { const scared = stage.fright(fx0); if (scared.length) L('animal frightened', { t: r2(round.t), by: fell.length ? 'fell' : 'broke', scared }); }
  for (const b of rose) L('block up again: a post leaning, not lying', { c: b.c, t: r2(round.t) });
  // still: the blocks, and any shards or spray (the effects move on every step, drawn or not)
  stage.tick(dt);
  const still = world.still(), fx = stage.fxLive;
  const { downChanged, ended: result } = update(round, dt, { down, still: still && fx === 0 });
  if (downChanged) { L('blocks down', { down: round.down, of: round.total, t: r2(round.t) }); renderTally(); }
  if (downChanged && round.down >= round.total) L('all down: cleared once still', { t: r2(round.t), still, fx });
  if (result) endScene(result);
  noteSettled();
  if (!draw) return;
  stage.sync(world.blocks, world.balls);
  const ok = ready();
  const d = dragNow() ?? (ok ? demoFrame() : null);
  stage.setSling(ok, d && ok ? d.aim : 0, d && ok ? d.power : 0);
  stage.setDots(d && ok && d.show ? dotsFor(world.trace(launchVel(d.power, d.aim, d.up).vec, 0)) : null, 1);
  stage.render();
}

// A block broke (ice shattered, a barrel burst): its pieces fly, a sound, the log.
function brokeUp({ rec, at, q, v }) {
  const i = world.blocks.indexOf(rec), b = current?.parts.blocks[i];
  if (!b) return;
  stage.burst(b, at, q, v);
  sound.play(b.mat === 'barrel' ? 'splash' : 'shatter', 0, { level: 1, quiet: true });
  L('block broke', { mat: b.mat, i, t: r2(round.t), at: at.map(r2), speed: r2(Math.hypot(...v)) });
}

// Where the show's drag ends: the first of DEMO_UPS whose path touches a
// block first (else the first), worked out once a scene and park size.
function demoTarget() {
  const size = parkSize();
  let pick = null, tried = 0;
  for (const up of DEMO_UPS) {
    tried++;
    const to = demoDrag(size, current.parts.stand, up), d = aimFor(to.dx, to.dy);
    const first = d ? world.trace(launchVel(d.power, d.aim, d.up).vec, 0).hits[0]?.kind ?? 'nothing' : 'nothing';
    if (first === 'block') { pick = { ...to, up, first }; break; }
    if (!pick) pick = { ...to, up, first };
  }
  L('pad show', { pad, up: pick.up, first: pick.first, tried });
  return pick;
}

// The pad's show, a frame on: the see-through finger from the pad, and the
// aim its drag would make (for the dots), or null.
// On the clock, not the frames (a slow phone's frames are capped at 0.05 s:
// the finger would crawl).
function demoFrame() {
  if (!demo || !pad || !current) return null;
  demo.t = (performance.now() - demo.t0) / 1000;
  if (!demo.to) demo.to = demoTarget();
  const s = demoAt(demo.t, demo.to);
  if (!s) { L('pad show done'); stopDemo(); return null; }
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
  // a level done: the game is on to the next level (or every level done: 'all')
  const outcome = sceneOver(game, result.won), lvDone = outcome === 'level' || outcome === 'all';
  saveGame();
  const words = endWords(outcome, lvDone ? was : game, nameOf(setup.p1));
  // the pills over the park show the scene's end until the next one starts
  // (no hearts left, or all 5 jewels), not the game already moved on
  const shown = outcome === 'out' ? { ...game, hearts: 0, jewels: was.jewels } : lvDone ? { ...was, jewels: SCENES } : null;
  ended = { outcome, words, won: result.won, shown, unlocked: game.reached > was.reached };
  // the blocks as the scene ended (the last may still be falling): a reload shows it as it was
  settled = { round: JSON.parse(JSON.stringify(round)), poses: world.poses() };
  showEnd();
  const secs = (performance.now() - perf.at) / 1000;
  L('scene over', { ...result, outcome, was, now: { ...game }, allDownS: r2(round.allDown ?? 0), fps: Math.round(perf.frames / Math.max(secs, 0.001)), physicsMs: r2(perf.physMs / Math.max(1, perf.frames)), stepsDropped: perf.dropped, moon: stage.animals?.().find(a => a.moon)?.moon });
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

// After a level: the next level's screen; after the last: a new game's scenes, the map.
$('nextBtn').onclick = () => {
  const o = ended?.outcome;
  L('next', { outcome: o, ...game });
  // a level done: the map, the next level unlocking, your face walking there (Q81)
  if (o === 'level') {
    const walk = { from: game.level - 1, to: game.level, unlock: !!ended.unlocked };
    current = null; round = null; ended = null; settled = null;
    showMap(walk);
    return;
  }
  if (o === 'all') { game = createGame(newSeed(), game); saveGame(); current = null; round = null; ended = null; settled = null; showMap(); return; }
  startScene();
};
$('newBtn').onclick = () => { L('new game: the setup screen'); current = null; round = null; ended = null; settled = null; showSetup(); };

// Start again (every game has one: developer, 2026-10-15): asks first, over
// the park, and costs a heart (else it would be a way round losing one).
// The map from a scene (developer, 2026-11-12: "there seems to be no way to get to the map"):
// the scene under way is kept (parked), so coming back to it carries on, not a free start again.
$('mapBtn').onclick = () => {
  if (busy) return;
  parked = current && !ended ? { id: current.id, layout: current.layout, settled } : null;
  L('map from the scene', { ...game, used: round?.used ?? 0, kept: !!parked });
  current = null; round = null; ended = null; settled = null;
  showMap();
};

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
  // a drag on the park, as a finger would (px from where it starts)
  drag(dx, dy) { const d = aimFor(dx, dy); if (!d?.ok) return { thrown: false, ...d }; return { thrown: doThrow(d), ...d }; },
  hold(dx, dy) { drag = { id: -1, x0: 0, y0: 0, x: dx, y: dy }; tick(1 / 60); return dragNow(); },
  letGo() { drag = null; tick(1 / 60); },
  // a scene of the game (its jewels so far, 3 hearts), for checking it
  async scene(i) { game.scene = i; game.jewels = i - 1; game.hearts = HEARTS; saveGame(); await startScene(); return this.state(); },
  // level n open and being played (for checking it; not a way the page offers)
  async level(n, i = 1) { game.reached = Math.max(game.reached, n); switchLevel(game, n); saveGame(); showPlay(); return this.scene(i); },
  map: () => showMap(),
  // the walk after a level (Q81), without clearing one: from level a to b, its lock popping if unlock
  walk: (from, to, unlock = true) => showMap({ from, to, unlock }),
  walkState: () => ({ walking: !!walking, arrived, go: !$('mapGo').hidden, face: $('mapFace')?.style.cssText }),
  // Each sound's loudness, rendered offline as the game plays it (hard,
  // 0.9): its peak and its loudest 50 ms RMS (for SITE_GAIN in sounds.js).
  async soundLevels(names) {
    const { RECIPES, kitFor } = await import('./sounds.js');
    const out = {};
    for (const name of names ?? Object.keys(RECIPES)) {
      const sr = 44100, oc = new OfflineAudioContext(1, sr * 2, sr), buf = oc.createBuffer(1, sr, sr), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const g = oc.createGain(); g.gain.value = 0.5; g.connect(oc.destination);
      RECIPES[name](kitFor(oc, g, buf), 0.02, 0.9);
      const data = (await oc.startRendering()).getChannelData(0), W = Math.round(sr * 0.05);
      let peak = 0, s = 0, best = 0;
      for (let i = 0; i < data.length; i++) { peak = Math.max(peak, Math.abs(data[i])); s += data[i] * data[i]; if (i >= W) s -= data[i - W] * data[i - W]; if (i >= W - 1) best = Math.max(best, s / W); }
      out[name] = { peak: +peak.toFixed(3), rms: +Math.sqrt(best).toFixed(4) };
    }
    return out;
  },
  broken: () => world.blocks.filter(b => b.broken).length,
  animals: () => stage.animals(),
  fx: () => stage.fxLive,
  state: () => (round ? {
    ...round, game: { ...game }, ready: ready(), busy, ended: ended?.outcome ?? null, card: $('over').hidden ? '' : $('overTitle').textContent,
    stack: current?.layout.stack, things: current?.layout.things.map(t => t.kind + (t.where ? ` ${t.where}` : '')), power: current?.layout.power,
    awake: world.awake(), dots: stage.dotCount(), fov: r2(stage.fov), touches: shot?.touches ?? [], pad, demo: demo ? r2(demo.t) : null,
  } : { game: { ...game }, busy }),
  blocks: () => world.blocks.map(b => ({ c: b.c, at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2), down: b.down })),
  project: p => stage?.project(p),
  edges: (y, z) => stage?.viewEdges(y, z),
  hand: HAND,
  // the physics and the scene, for a test player in the page (as the mockup's)
  inside: () => ({ world, current, launchVel }),
};
