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
  FACE_NAMES, SCENES, HEARTS, BALLS, SCALE, HAND, checkSetup, createGame, readProfile, createProfile, sceneOver, newRound, useBall, canThrow,
  update, ballsLeft, endWords, seedOf, frontDrag, launchVel, dotsFor, behindView, sceneParts, END_WAIT,
  padSpot, padPress, demoDrag, demoAt, DEMO_UPS, trunksIn, MAX_LEVEL, levelInfo, switchLevel, restartLevel, placeOf, isOpen, offScreen,
  starsForBalls, starsOf, starTotal, STARS_ALL, recordStars, playableScene, furthestScene, startAtScene,
  MODES, MODE_INFO, dotSeconds, waitingOn, glowAt, glowsBy, isMoonLevel, PARK_LEVELS,
  WORLDS, worldOf, worldLevels, levelInWorld, firstOfWorld,
} from '../core/topple.js';
import {
  TUTORIALS, startTutorial, tutorialPart, tutorialParts, tutorialSay, partCleared, nextPart, lastPart,
  parkPracticeLayout, parkPracticeParts, moonPracticeScene, moonPracticeLander, readTaught, needsTutorial, markTaught,
} from '../core/topple-tutorial.js';
import {
  moonScene, newLander, flyStep, steerTo, turnNow, flyTo, dropPath, moonMode, showsRing, ringX,
  LANDER_Y, DROP_BELOW, MOON_BALL, STEER_PX, STEER_M, STEER_KEY, STEER_TAP, MOON_FIRST,
} from '../core/topple-moon.js';
import { nameOf, endSound } from '../core/players.js';
import { mergeSetup } from '../core/resume.js';
import { svg, pickerFace } from './faces.js';
import { toppleMini } from './topplepics.js';
import { roadGeom, nodeAt, roadJoins, openWorlds, mapView } from '../core/topple-road.js';
import { log, startLog } from './debuglog.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';
import { drawWatch } from './drawwatch.js';
import { MAX_FRAME_S } from '../core/fixed-step.js';
import { moverFor, openShare, gaps, flakesOn, meetsThings } from '../core/topple-movers.js';

// Hardest's thing that moves in the way (journal Q106; the mockup v1-v2
// through window.TOPPLE_MOCKUP, 2026-11-14, now the game): in a level with
// a mover (levels 1-3 so far), on Hardest, scenes 1, 3 and 5 have
// it, each its own way and load, 2 and 4 are spread out (hardestDeal;
// kept in the scene's layout as `hardest`). window.topple.mover() changes
// the scene's mover, for checking in a browser (null: none; undefined in
// moverOverride: the deal's).
let moverOverride;

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
// One game for each difficulty (Q116), and the one being played: `game`.
let profile = null;
try { profile = readProfile(JSON.parse(storage?.getItem(GAME_KEY) ?? 'null')); } catch { /* unreadable: a new game */ }
let game = profile ? profile.games[profile.mode] : null;
// the level after one done, opened as the game is read (a game from 10.0, which had four)
try { const raw = JSON.parse(storage.getItem(GAME_KEY)), was = raw.v === 2 ? raw.games?.[game.mode]?.reached : raw.reached; if (game && game.reached > was) L('level opened: the one after a level done', { was, reached: game.reached, done: game.done }); } catch { /* nothing kept */ }
const newSeed = () => 1 + Math.floor(Math.random() * (2 ** 31 - 2));
function saveGame() {
  profile.games[game.mode] = game;
  profile.mode = game.mode;
  try { storage?.setItem(GAME_KEY, JSON.stringify(profile)); } catch (e) { L('game not kept on the device', { error: String(e) }); }
}
// A new game is kept at once: its seed makes its scenes, and a scene picked
// up again is checked against it (kept only as a scene ended, a reload made
// a new seed and the scene under way was lost).
if (!game) { game = createGame(newSeed()); profile = createProfile(game); saveGame(); }
const isFresh = g => g.scene === 1 && g.hearts === HEARTS && g.jewels === 0;
// The worlds taught on this device (Q129): each world's tutorial shows as its
// first level is entered, once. One list for every difficulty (the controls
// are the same in each). A new key in 11.2, so everyone sees the new
// tutorials once (11.1's list, 'web-games-topple-taught', let go of).
export const TAUGHT_KEY = 'web-games-topple-taught-2';
const TAUGHT_KEY_11_1 = 'web-games-topple-taught';
let taught = [];
try { taught = readTaught(JSON.parse(storage?.getItem(TAUGHT_KEY) ?? 'null')); } catch { /* unreadable: none taught */ }
try { if (storage?.getItem(TAUGHT_KEY_11_1) != null) { storage.removeItem(TAUGHT_KEY_11_1); L('taught: 11.1\'s list let go of (the new tutorials show once)'); } } catch { /* blocked */ }
function saveTaught() {
  try { storage?.setItem(TAUGHT_KEY, JSON.stringify(taught)); } catch (e) { L('taught worlds not kept on the device', { error: String(e) }); }
}
// A level's name as the game shows it: its number within its world (Q122: the moon's first is 1).
const levelTag = lv => `${levelInWorld(lv)} · ${levelInfo(lv).name}`;
// The tutorial under way (null: none): startTutorial's, with `then` (what follows it).
let tut = null;
const playMode = () => (tut ? 'normal' : game.mode);   // the practice is on Normal (the dots; the ring and the light)
const sceneId = () => ({ seed: seedOf(game), level: game.level, scene: game.scene });

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
  // (the practice is never picked up again: a reload in it comes back to the setup screen)
  screen: playing && !tut ? 'play' : 'setup', setup,
  scene: playing && current && !tut ? { id: current.id, layout: current.layout } : null,
  settled, ended,
}));

/* ---------- loading the 3D ---------- */

let park3d = null, physics = null, moonDraw = null, moonPhysics = null, why = '';
try {
  [park3d, physics, moonDraw, moonPhysics] = await Promise.all([import('./topple-scene.js'), import('../core/topple-world.js'), import('./topple-moon.js'), import('../core/topple-moon-world.js')]);
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
  $('setupModes').replaceChildren(...MODES.map(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'level';
    b.dataset.mode = m;
    b.textContent = MODE_INFO[m].name;
    b.setAttribute('aria-pressed', String(m === game.mode));
    b.onclick = () => pickMode(m);
    return b;
  }));
  $('hardLine').textContent = MODE_INFO[game.mode].line;
  const fresh = isFresh(game);
  $('where').textContent = fresh ? '' : `${MODE_INFO[game.mode].name}: ${worldOf(game.level).name} level ${levelInWorld(game.level)} · scene ${game.scene} of ${SCENES} · ${hearts(game)} · ${'💎'.repeat(game.jewels)}`;
  if (fresh && game.reached > 1) $('where').textContent = `${MODE_INFO[game.mode].name}: ${worldOf(game.reached).name} level ${levelInWorld(game.reached)} reached`;
  $('playBtn').textContent = fresh ? 'Play!' : 'Carry on';
  // Start over only once another level is open (before that, Start again's "Level 1 from scene 1"
  // does the same; New scenes from scene 1 dropped in 10.7, Q102)
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
  game = createGame(newSeed(), { stars: game.stars }, game.mode);   // how hard and the stars are kept
  parked = null;
  saveGame();
  $('overAsk').hidden = true;
  L('start over: a new game, level 1 only', { was, seed: game.seed, reached: game.reached });
  renderSetup();
};

/* ---------- the map: a road of scenes (Q117) ---------- */

// Each level's sign on its banner: level 1's drawing (the home tile's), the
// others a sign of their setting (Claude's pick, to review). `tint` is the
// level's band behind its scenes on the road, `ink` the dots of the road over it.
const LOOKS = {
  1: { pic: () => toppleMini('lvsvg'), tint: '#CFE6F4', ink: 'rgba(30,52,69,.38)' },
  2: { pic: () => '🏗️', tint: '#DDD6C8', ink: 'rgba(30,52,69,.38)' },
  3: { pic: () => '❄️', tint: '#E0EDF7', ink: 'rgba(30,52,69,.38)' },
  4: { pic: () => '🌵', tint: '#F0D9BC', ink: 'rgba(30,52,69,.38)' },
  5: { pic: () => '🌙', tint: '#2A3A6A', ink: 'rgba(255,255,255,.55)' },
  // the moon base (Q119): space-dark bands, a sign of each place
  6: { pic: () => '🛬', tint: '#1B2236', ink: 'rgba(255,255,255,.5)' },
  7: { pic: () => '🔆', tint: '#202941', ink: 'rgba(255,255,255,.5)' },
  8: { pic: () => '🌑', tint: '#1B2236', ink: 'rgba(255,255,255,.5)' },
  9: { pic: () => '⛏️', tint: '#202941', ink: 'rgba(255,255,255,.5)' },
  10: { pic: () => '🚀', tint: '#1B2236', ink: 'rgba(255,255,255,.5)' },
};
// The setup screen's view: 'faces' (the picks) or 'map'.
function setupView(v) {
  $('setup').classList.toggle('tp-map', v === 'map');
  $('mapView').hidden = v !== 'map';
  if (v !== 'faces') $('overAsk').hidden = true;   // Start over's question doesn't wait behind the map
  scrollTo(0, 0);
}
// The map (Q117, developer, 2026-11-16: "the map no longer looks like a map",
// "scrolling just makes the game feel bigger"): one winding road up the
// screen, the 25 scenes (5 levels of 5) as circles with their stars under
// them, level 1 at the bottom. It shows the difficulty being played (a game
// of its own each), never a way to change it: that is on the setup screen. It
// opens scrolled to the scene last played, with your face on it; winning moves
// on to the next scene. A tap on a scene you can reach starts it (a won one
// with new scenes, to win more stars); a later one is shut. After a level
// (developer, 2026-11-12, Q81: "an animation of the next level unlocking")
// the next level's first scene shakes and its lock pops. A world not open yet
// is closed off (Q128, developer, 2026-11-18: "a teaser is OK but don't show
// the levels"): the road ends at its barrier; once the world before is done,
// the map after its last card plays the barrier opening and the new road
// rolling out (the unlock: once a game, as the world opens).
let walking = null;    // the unlocking under way: { to, timers, popped }
let shownAt = null;    // where the face was last drawn on the road: { level, scene }
const STAR_D = 'M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5 6 20.9l1.3-6.7-5-4.7 6.8-.8z';
const starSvg = on => `<svg class="tstar${on ? '' : ' unlit'}" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_D}"/></svg>`;
const starsRow = (n, max = 3) => Array.from({ length: max }, (_, i) => starSvg(i < n)).join('');
// `opt.roll`: a world just opened, its road rolling out (Q128).
function renderMap(unlock = 0, opt = {}) {
  const prev = shownAt;
  $('mapMode').textContent = MODE_INFO[game.mode].name;
  const road = $('road');
  const hold = unlock > 0 && !!walking && !walking.popped;   // the lock still on
  // a world about to open: drawn shut, behind its barrier, until it does (Q128)
  const opening = hold && unlock > 1 && firstOfWorld(unlock) ? worldOf(unlock).id : null;
  const geo = roadGeom(Math.max(280, Math.min(460, road.clientWidth || 360)), openWorlds(lv => isOpen(game, lv), opening));
  const { size, H, w } = geo;
  // what rolls out (a world just opened): its scenes one after another from its first, the rest fading in
  const rolls = lv => !!opt.roll && worldOf(lv)?.id === opt.roll;
  const fade = lv => (rolls(lv) ? ' fadein' : '');
  const pl = placeOf(game, game.level), here = { level: game.level, scene: pl.scene };
  let h = `<div class="rd" style="width:${w}px;height:${H}px">`;
  for (const b of geo.bands) h += `<div class="rband${fade(b.lv)}" style="top:${b.top}px;height:${b.bottom - b.top}px;background:${LOOKS[b.lv].tint}"></div>`;
  h += `<svg class="rpath" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" aria-hidden="true">`;
  // (the road broken between worlds: the gate between them, Q122)
  for (let i = 1; i < geo.nodes.length; i++) {
    const a = geo.nodes[i - 1], b = geo.nodes[i];
    if (roadJoins(a, b)) h += `<line${rolls(b.lv) ? ' class="fadein"' : ''} x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${LOOKS[b.lv].ink}"/>`;
  }
  h += '</svg>';
  // each open world's gate (Q122): its sign and "World N · its name" (11.1: its tutorial's button too, Q124)
  for (const g of geo.gates) {
    const w = WORLDS.find(x => x.id === g.world);
    h += `<div class="rgate ${w.id}${rolls(levelForWorld(w)) ? ' fadein' : ''}" style="top:${g.top}px;height:${g.bottom - g.top}px">`
      + `<div class="rgsign" style="top:${g.y - g.top}px"><span class="rgpic" aria-hidden="true">${w.sign}</span><b>World ${w.n} · ${w.name}</b></div></div>`;
  }
  // the next world, closed off (Q128): its barrier across the road's top, the world in the sky behind it, no levels
  if (geo.barrier) {
    const w = WORLDS.find(x => x.id === geo.barrier.world), first = levelForWorld(w);
    h += `<div class="rbar ${w.id}" id="rbar" role="img" aria-label="World ${w.n}, ${w.name}: shut. ${shutWords(first)}" style="top:${geo.barrier.top}px;height:${geo.barrier.bottom - geo.barrier.top}px">`
      + '<span class="rbsky" aria-hidden="true"></span><span class="rbgate l" aria-hidden="true"></span><span class="rbgate r" aria-hidden="true"></span>'
      + `<div class="rgsign" style="top:${geo.barrier.y}px" aria-hidden="true"><span class="rgpic">🔒</span><b>World ${w.n} · ${w.name} ${w.sign}</b><small>${shutWords(first)}</small></div></div>`;
  }
  for (const b of geo.bands) {
    const shut = !isOpen(game, b.lv);
    h += `<div class="rbanner${shut ? ' shut' : ''}${fade(b.lv)}" style="top:${b.y}px"><span class="rpic" aria-hidden="true">${LOOKS[b.lv].pic()}</span><b>${levelTag(b.lv)}</b></div>`;
  }
  for (const n of geo.nodes) {
    const { lv, sc } = n, stars = starsOf(game, lv)[sc - 1], done = game.done.includes(lv);
    const locked = !playableScene(game, lv, sc) || (hold && unlock === lv && sc === 1);
    const won = !locked && (stars > 0 || done), cur = !locked && lv === here.level && sc === here.scene;
    const cls = locked ? 'locked' : won ? 'got' : 'open';
    const label = `${worldOf(lv).name}, level ${levelInWorld(lv)}, scene ${sc}, ${locked ? 'shut' : `${stars} of 3 stars`}${cur ? ', you are here' : ''}`;
    // (rolling out: one after another up the new road, 45 ms apart)
    const roll = rolls(lv) ? ' roll' : '', k = (lv - levelForWorld(worldOf(lv))) * SCENES + sc - 1;
    h += `<button type="button" class="rn ${cls}${cur ? ' cur' : ''}${roll}" id="n${lv}_${sc}" data-l="${lv}" data-s="${sc}" aria-label="${label}" style="left:${n.x - size / 2 - 6}px;top:${n.y - size / 2}px;width:${size + 12}px${roll ? `;animation-delay:${k * 45}ms` : ''}">`
      + `<span class="rc" style="width:${size}px;height:${size}px">${locked ? '🔒' : sc}</span>`
      + `<span class="rs">${locked ? '' : starsRow(stars)}</span></button>`;
  }
  // your face on the scene you are on (in place of its number); it walks there from where it was last drawn
  const at = hold ? (shownAt ?? here) : here;
  // (a scene past a barrier isn't drawn: the face waits on the road's last scene)
  const faceXY = p => { const n = nodeAt(geo, p.level, p.scene) ?? geo.nodes.at(-1); return { x: n.x, y: n.y - 1 }; };
  // (a walk only when both ends fit on the screen; a longer way: the face put on its scene, Q134)
  const moved = !hold && !!prev && (prev.level !== here.level || prev.scene !== here.scene);
  const view = mapView(moved ? faceXY(prev).y : null, faceXY(here).y, innerHeight);
  const move = moved && view.walk;
  const f0 = faceXY(move ? prev : at), fs = Math.round(size * 0.82);
  h += `<span class="rface" id="rface" style="width:${fs}px;height:${fs}px;left:${f0.x - fs / 2}px;top:${f0.y - fs / 2}px">${svg(setup.p1)}</span></div>`;
  road.innerHTML = h;
  if (moved && !move) L('map: too far to walk, the face put on its scene', { from: prev, to: here, apart: Math.abs(faceXY(here).y - faceXY(prev).y), viewH: innerHeight });
  if (move) {
    const f1 = faceXY(here), el = $('rface'), quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quick) { el.style.left = `${f1.x - fs / 2}px`; el.style.top = `${f1.y - fs / 2}px`; } else {
      void el.offsetWidth;
      el.classList.add('walk');
      el.style.left = `${f1.x - fs / 2}px`; el.style.top = `${f1.y - fs / 2}px`;
    }
    L('map: the face walks', { from: prev, to: here, quick });
  }
  if (!hold) shownAt = here;
  return { geo, here, prev, move, centre: view.centre };
}
// The page scrolled so road y `y` is in the window's middle (Q134).
function centreRoad(y) {
  const rd = document.querySelector('#road .rd');
  if (rd) scrollTo(0, Math.max(0, Math.round(rd.getBoundingClientRect().top + scrollY + y - innerHeight / 2)));
}
// A world's first level (for its gate).
const levelForWorld = w => worldLevels(w)[0];
// Why level lv is shut, in words: the level before it in its world, or the world before.
const shutWords = lv => (firstOfWorld(lv) ? (isMoonLevel(lv) ? `Finish ${worldOf(lv - 1).name} to fly to the moon` : `Finish ${worldOf(lv - 1).name} first`) : `Finish level ${levelInWorld(lv - 1)} first`);
function tapScene(lv, sc, el) {
  if (walking) return;
  const shake = () => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  if (!isOpen(game, lv)) {
    shake();
    $('mapToast').textContent = shutWords(lv);
    L('map: a locked level', { level: lv, scene: sc, reached: game.reached });
    return;
  }
  if (!playableScene(game, lv, sc)) {
    shake();
    $('mapToast').textContent = `Win scene ${furthestScene(game, lv)} first`;
    L('map: a scene shut', { level: lv, scene: sc, furthest: furthestScene(game, lv) });
    return;
  }
  L('map: a scene, straight into play', { level: lv, scene: sc, stars: starsOf(game, lv)[sc - 1], mode: game.mode });
  startLevel(lv, sc);
}
$('road').onclick = e => {
  const b = e.target.closest?.('.rn');
  if (b) tapScene(Number(b.dataset.l), Number(b.dataset.s), b);
};
// How hard, picked on the setup screen: each is a game of its own (the map shows the one being played).
function pickMode(m) {
  if (game.mode === m) return;
  const was = game.mode, fresh = !profile.games[m];
  profile.games[was] = game;
  game = profile.games[m] ?? createGame(newSeed(), null, m);
  parked = null;
  shownAt = null;
  saveGame();
  L('how hard picked', { mode: m, was, dots: MODE_INFO[m].dots, firstOnly: MODE_INFO[m].firstOnly, reached: game.reached, stars: starTotal(game), fresh });
  renderSetup();
}
function showMap(unlock = 0) {
  if (playing) showSetup();
  stopWalk();
  setupView('map');
  if (unlock) walking = { to: unlock, timers: [], popped: false };
  const { geo, here, move, centre } = renderMap(unlock);
  $('mapToast').textContent = '';
  // scrolled to the scene last played (Q134: between it and where the face was, when it walks; to the barrier, when it is about to open)
  if (walking && firstOfWorld(unlock) && unlock > 1) $('rbar')?.scrollIntoView?.({ block: 'center' }); else centreRoad(centre);
  L('map: shown', { mode: game.mode, level: here.level, scene: here.scene, road: geo.H, size: geo.size, move, centre, scrollY: Math.round(scrollY), viewH: innerHeight, unlock, worldsOpen: geo.open, barrier: geo.barrier?.world ?? null });
  if (unlock) playUnlock(unlock);
  resume.keep();
}
// The unlocking, step by step (on timers; all at once with reduced motion).
function playUnlock(lv) {
  if (lv > 1 && firstOfWorld(lv)) { playWorldOpen(lv); return; }
  const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = walking, after = (ms, fn) => w.timers.push(setTimeout(fn, quick ? 0 : ms));
  L('map: unlocking', { level: lv, quick });
  after(500, () => { const n = $(`n${lv}_1`); n?.classList.remove('shake'); void n?.offsetWidth; n?.classList.add('shake'); });
  after(1000, () => {
    w.popped = true;
    renderMap(lv);   // open now; the lock pops off its first scene
    $(`n${lv}_1`)?.querySelector('.rc')?.insertAdjacentHTML('beforeend', '<span class="lock pop">🔒</span>');
    sound.play('clink');
    L('map: unlocked', { level: lv });
  });
  after(1600, () => { sound.play('ding'); walking = null; L('map: arrived', { level: lv }); });
}
// A world opening (Q128): the barrier shakes and opens, the new world's road
// rolls out above it (the page kept where it was as the road grows), the
// face walks on to its first scene and the map goes up to it.
function playWorldOpen(lv) {
  const quick = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = walking, id = worldOf(lv).id, after = (ms, fn) => w.timers.push(setTimeout(fn, quick ? 0 : ms));
  L('map: a world opening', { level: lv, world: id, quick });
  after(600, () => { const b = $('rbar'); b?.classList.remove('shake'); void b?.offsetWidth; b?.classList.add('shake'); });
  after(1300, () => { $('rbar')?.classList.add('opening'); sound.play('clink'); L('map: the barrier opens', { world: id }); });
  after(2400, () => {
    const y0 = $('rbar')?.getBoundingClientRect().bottom ?? null;
    w.popped = true;
    renderMap(lv, { roll: id });
    // the road grew above: scrolled by as much, so the gate is where the barrier was
    const gate = document.querySelector(`.rgate.${id}`);
    if (gate && y0 != null) scrollBy(0, gate.getBoundingClientRect().bottom - y0);
    L('map: the new road rolls out', { world: id, scenes: document.querySelectorAll('.rn.roll').length });
  });
  after(3400, () => $(`n${lv}_1`)?.scrollIntoView?.({ block: 'center', behavior: quick ? 'auto' : 'smooth' }));
  after(4400, () => { sound.play('ding'); walking = null; L('map: arrived', { level: lv, world: id }); });
}
function stopWalk() {
  if (!walking) return;
  for (const t of walking.timers) clearTimeout(t);
  walking = null;
}
// Play level n from the map: at its place (carried on), or at a scene (a won
// one: new scenes, the best stars kept).
function startLevel(n, scene = null) {
  // a world's first level, the world not taught yet on this device: its tutorial first, then this (Q129)
  if (needsTutorial(taught, n) && isOpen(game, n)) { L('tutorial first: the world not taught yet', { level: n, scene, world: worldOf(n).id, taught }); openTutorial(worldOf(n).id, () => startLevel(n, scene)); return; }
  const was = game.rounds?.[n] ?? 0;
  if (!(scene ? startAtScene(game, n, scene) : switchLevel(game, n))) { L('level not open', { level: n, scene, reached: game.reached }); showMap(); return; }
  saveGame();
  // a done level started again from its start: new scenes (seedOf)
  L('level: start', { ...game, newScenes: (game.rounds?.[n] ?? 0) > was, levelSeed: seedOf(game) });
  showPlay();
  startScene();
}
$('mapBack').onclick = () => { setupView('faces'); renderSetup(); };

/* ---------- a world's tutorial (Q129) ---------- */

// World `id`'s tutorial (src/core/topple-tutorial.js), before its first
// level's scene: its parts one bare scene each, then `then` (the scene that
// was asked for). Nothing of the game changes.
function openTutorial(id, then = () => showMap()) {
  if (busy) return;
  stopWalk();
  parked = null;
  tut = { ...startTutorial(id), then, t0: performance.now(), thrown: false };
  current = null; round = null; ended = null; settled = null;
  L('tutorial: start', { world: id, parts: TUTORIALS[id].parts.map(p => p.id), taught });
  showPlay();
  startScene();
}
// A mouse or trackpad (a computer): the bar says the keys too (the moon's).
const keysToo = () => { try { return matchMedia('(pointer: fine)').matches; } catch { return false; } };
// The bar over the park: the part's words, its number, Skip.
function renderTut() {
  const bar = $('tut');
  bar.hidden = !tut || tut.cleared;   // (cleared: its card says so)
  if (bar.hidden) return;
  $('tutSay').textContent = tutorialSay(tut, keysToo());
  $('tutNum').textContent = `${tut.part + 1} of ${tutorialParts(tut.world)}`;
  $('tutTitle').textContent = TUTORIALS[tut.world].title;
}
// Done (every part cleared) or skipped: the world is taught, then what was waiting.
// Left by the map: not taught (it shows again as the world's first level is entered).
function endTutorial(how, toMap = false) {
  if (!tut) return;
  const t = tut;
  if (how !== 'left') { taught = markTaught(taught, t.world); saveTaught(); }
  L(`tutorial: ${how}`, { world: t.world, part: t.part + 1, of: tutorialParts(t.world), cleared: t.cleared, s: r2((performance.now() - t.t0) / 1000), taught, toMap });
  tut = null;
  stopDemo();
  renderTut();
  current = null; round = null; ended = null; settled = null;
  if (toMap) showMap(); else t.then();
}
$('tutSkip').onclick = () => endTutorial('skipped');
// the road is drawn for the screen's width: again when it turns or changes
let roadW = 0;
addEventListener('resize', () => {
  if ($('mapView').hidden || walking) return;
  const w = $('road').clientWidth;
  if (Math.abs(w - roadW) < 2) return;
  roadW = w;
  // (the road's sizes change with its width: the scene you're on centred again, Q134)
  centreRoad(renderMap().centre);
  L('map: drawn again', { width: w, scrollY: Math.round(scrollY) });
});

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
let drawing = null;        // the drawing's level, watched (src/ui/drawwatch.js)
let glowIdle = 0, glowsSaid = 0, glowPeak = 0;   // the wait for the next ball, and its glows logged (Q101)
let thrownAt = 0;          // performance.now() of the latest throw (the glow's log: real time since it)
// The moon base (levels 6-10, Q119): its drawing and physics (made the first
// time a moon scene starts), and the scene under way: { scene, f: the lander,
// held (the pad: steering), z0 (where it was steered from), lit, keys }.
let moon3d = null, moonWorld = null;
const mo = { on: false, scene: null, f: null, held: false, z0: 0, lit: -1, keys: { up: false, down: false } };
const onMoon = () => mo.on && !!mo.scene;

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
// The notice while a scene is set up (Q104): over the park, the last scene
// dimmed under it (or the park's colour, the canvas hidden, for a new
// level). Logged with how long it was up.
let waitAt = 0;
function showWait(on) {
  const w = $('settingUp');
  if (w.hidden === !on) return;
  w.hidden = !on;
  if (on) { waitAt = performance.now(); L('setting up: the notice shown', { level: game.level, scene: game.scene, canvasShown: $('c').style.visibility !== 'hidden' }); }
  else L('setting up: the notice gone', { level: game.level, scene: game.scene, ms: Math.round(performance.now() - waitAt) });
}
function showSetup() {
  running = false;
  playing = false;
  drag = null;
  mo.held = false; mo.keys.up = mo.keys.down = false;
  stopDemo();
  $('play').hidden = true;
  $('setup').hidden = false;
  document.body.classList.remove('tp-playing');
  setupView('faces');
  renderSetup();
  scrollTo(0, 0);
}

// Where a block is, for the log (Q103): its middle, its angle from the
// slingshot (° right +), how far out (m) against the farthest throw, and
// whether it's off the screen as held.
function whereIs(b) {
  const p = b.body.position, at = [p.x, p.y, p.z];
  return {
    at: at.map(r2), deg: Math.round(Math.atan2(p.x - HAND.x, HAND.z - p.z) * 180 / Math.PI), m: r2(Math.hypot(p.x - HAND.x, p.z - HAND.z)), farM: r2(world.far),
    offScreen: unseenNow(b),
  };
}

// A block off the screen as it's held (Q103): its own corners, as it's turned (Q107).
function unseenNow(b) {
  const p = b.body.position, q = b.body.quaternion;
  return offScreen([p.x, p.y, p.z], [b.he.x, b.he.y, b.he.z], [q.x, q.y, q.z, q.w], v => stage.project(v));
}

function makeStage() {
  const canvas = $('c');
  stage = park3d.makePark3d(canvas);
  // a material the chip can't build, or the canvas lost (Q109): logged at once
  stage.onError = e => L('shader error: its objects are not drawn', e);
  canvas.addEventListener('webglcontextlost', () => L('webgl context lost'));
  canvas.addEventListener('webglcontextrestored', () => L('webgl context restored'));
  // a setting's own sounds: Star Light's owl hooting now and then
  stage.onSound = name => { if (!SET_SOUND[name] || !playing) return; sound.play(SET_SOUND[name], 0, { quiet: true }); L('owl hoots', { t: r2(round?.t ?? 0) }); };
  world = physics.createWorld({ onHit });
  // a block knocked off the screen as it's held counts as down (Q103: the aim may reach past an upright view's side)
  world.unseen = unseenNow;
  drawing = drawWatch('topple', stage, L);   // lighter on a slow device (Q99)
  L('3D started', { webgl: stage.webgl, three: 'r160', cannon: '0.20.0', pixelRatio: Math.min(devicePixelRatio || 1, 2), farLeaves: stage.farLeaves, farTrunkInLeavesM: trunksIn().far });
  new ResizeObserver(fit).observe($('park'));
  for (const cv of [canvas, $('cm')]) {
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { L('drag cancelled'); drag = null; mo.held = false; } });
    // no double-tap zoom on the park (as Tin Can Alley's stall); the drag is pointer events
    cv.addEventListener('touchend', e => e.preventDefault(), { passive: false });
  }
}
// The moon's drawing and physics, the first time a moon scene starts.
function makeMoonStage() {
  if (moon3d) return;
  moon3d = moonDraw.makeMoon3d($('cm'));
  moonWorld = moonPhysics.createMoonWorld({ onHit: moonHit });
  L('moon: 3D started', { pixelRatio: Math.min(devicePixelRatio || 1, 2) });
}
// Which canvas shows: the moon's for a moon scene, else the park's; the turn button with the moon's.
function showWorld(moonOn) {
  mo.on = moonOn;
  $('cm').hidden = !moonOn;
  $('c').hidden = moonOn;
  $('turnBtn').hidden = !moonOn;
}

// The canvas takes the park's box (upright: between the top row and the
// bar; sideways: beside the column); the view is fitted to the scene at the
// park's shape, worked out again on every fit.
let lastFit = '';
function fit() {
  if (!stage || $('play').hidden) return;
  const box = $('park').getBoundingClientRect(), w = Math.round(box.width), h = Math.round(box.height);
  if (!w || !h) return;
  if (onMoon()) {
    aspect = moon3d.resize(w, h);
    placePad();
    const key = `${w}x${h} moon ${current?.layout.seed}`;
    if (key !== lastFit) { lastFit = key; L('fit', { park: `${w}x${h}`, moon: true, pad, screen: `${innerWidth}x${innerHeight}`, way: innerWidth > innerHeight ? 'sideways' : 'upright' }); }
    return;
  }
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
  // the moon's ⇄ level with the pad, as far in from the left as the pad is from the right (for the other thumb)
  const tb = $('turnBtn'), tr = Math.round(pad.r * 0.9);
  Object.assign(tb.style, { left: `${Math.round(box.width - pad.x - tr)}px`, top: `${pad.y - tr}px`, bottom: 'auto', width: `${2 * tr}px`, height: `${2 * tr}px`, fontSize: `${Math.round(tr * 0.75)}px` });
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
// A throw while it's made is caught: the notice goes, the game can be played on
// from the map (review TOP-1: it stayed on "Setting up the scene…" for good).
async function startScene(kept = null) {
  try { return await makeTheScene(kept); } catch (e) {
    L('scene set-up failed', { error: String(e?.message ?? e), stack: String(e?.stack ?? '').split('\n').slice(0, 4).join(' | '), ...game });
    busy = false;
    showWait(false);
    try { hideCanvas(false); } catch { /* the canvas isn't there */ }
    $('hint').textContent = 'The scene did not load. Tap Map to try again.';
    $('hint').hidden = false;
    return null;
  }
}
async function makeTheScene(kept) {
  if (busy) return;
  // the scene left for the map, if it's the one the game is at: carried on as it was
  if (!kept && !tut && parked && JSON.stringify(parked.id) === JSON.stringify(sceneId())) { kept = parked; L('scene carried on after the map', { used: parked.settled?.round.used ?? 0 }); }
  parked = null;
  // the scene to make: the game's, or the tutorial's part (Q129: a bare scene, always the same, on Normal)
  const part = tut ? tutorialPart(tut).id : null, tutLv = tut?.world === 'moon' ? MOON_FIRST : 1;
  const spec = tut ? { level: tutLv, part, id: { tutorial: tut.world, part, level: tutLv } } : { seed: seedOf(game), level: game.level, scene: game.scene, id: sceneId() };
  busy = true;
  drag = null; shot = null; ended = null;
  stopDemo();
  $('over').hidden = true;
  $('ask').hidden = true;
  $('cleared').hidden = true;
  // the notice over the park, the hint out of its way (Q104; until 10.7 the
  // hint at the park's foot said "Setting up the scene…")
  $('hint').hidden = true;
  showWait(true);
  renderHud();
  // let the notice show before the scene's made (up to a second or so on a
  // phone, 7 s on the old tablet): a frame drawn with it, then on
  // (setTimeout 30 ms until 10.7, which a slow device could pass before
  // drawing; 100 ms at most, as a frame may never come in a hidden tab)
  await new Promise(r => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 100); });
  // a kept scene in its own level's setting: a level's last scene, won, kept
  // with the game already on the next level (a reload on its card drew it in
  // the next level's setting and failed: "reading 'col'", 10.0-10.2)
  const lv = kept ? (kept.layout.level ?? 1) : spec.level;
  if (isMoonLevel(lv)) return makeMoonScene(lv, kept, spec);
  showWorld(false);
  mo.scene = null;
  if (stage.level !== lv || !stage.hasSetting(lv)) {
    hideCanvas(true);
    const r = await stage.setLevel(lv);
    L('setting', { ...r, name: levelInfo(lv).name });
  }
  // the tutorial's park: the lawn and the sky only (no trees far off, no birds: Q129)
  stage.setBare(!!tut);
  const t0 = performance.now();
  if (kept) {
    const parts = sceneParts(kept.layout);
    world.setScene(parts, kept.settled?.poses ?? null);
    current = { id: spec.id, layout: kept.layout, parts, check: null, tries: 0 };
  } else if (tut) {
    const parts = parkPracticeParts(part);
    world.setScene(parts);
    current = { id: spec.id, layout: parkPracticeLayout(part), parts, check: null, tries: 0 };
  } else {
    const s = world.makeScene(spec.seed, spec.level, spec.scene, null, playMode());
    current = { id: spec.id, layout: s.layout, parts: s.parts, check: s.check, tries: s.tries };
    for (const t of s.thrown) L('layout thrown away', t);
  }
  current.ms = Math.round(performance.now() - t0);
  const drawn = stage.setScene(current.parts);
  moverOverride = undefined;
  placeMover();
  round = kept?.settled?.round ?? newRound(world.blocks.length);
  if (round.since != null) round.since = 99;   // a ball in flight when the page was left comes back to the pouch
  settled = kept?.settled ?? null;
  lastFit = '';
  fit();
  // drawn once now, so the canvas never shows the scene before
  stage.sync(world.blocks, world.balls);
  stage.render();
  hideCanvas(false);
  // what was drawn (Q109: a scene on the tablet showed no blocks): now, and again once frames have run
  const drawnId = JSON.stringify(current.id);
  L('blocks drawn', stage.diagnose());
  setTimeout(() => { if (current && JSON.stringify(current.id) === drawnId && stage) L('blocks drawn: 3 s on', stage.diagnose()); }, 3000);
  showWait(false);
  // no hint's line (Q123, developer, 2026-11-18: "drop it", then for a drag too short to throw too: "Drop
  // it"; 11.1 showed "Drag from 👆, then let go" before each scene's first ball and after a short drag).
  // The line is only for a scene that did not load.
  $('hint').hidden = true;
  // the pad's show: in the park tutorial's first part only (Q123, developer, 2026-11-17: "remove the existing
  // 'aiming tip' that starts at the beginning of each scene"; until 11.1 before every scene's first ball)
  if (tut?.world === 'park' && part === 'ahead') demo = { t: 0, t0: performance.now(), to: null };
  renderTut();
  perf.frames = 0; perf.physMs = 0; perf.dropped = 0; perf.at = performance.now();
  drawing?.restart();
  glowIdle = 0; glowsSaid = 0;
  renderTally();
  const L0 = current.layout;
  L(kept ? 'scene picked up again' : tut ? 'tutorial: a part' : 'scene', {
    ...(tut ? { tutorial: tut.world, part, of: tutorialParts(tut.world), mode: playMode() } : game), stack: L0.stack, layoutSeed: L0.seed, power: L0.power, reachCm: Math.round(L0.reach * 100),
    things: L0.things.map(t => ({ kind: t.kind, ...(t.where ? { where: t.where } : {}), gapCm: Math.round(t.gap * 100), ...(t.arm ? { armCm: Math.round(t.arm * 100) } : {}), ...(t.aside ? { asideCm: Math.round(t.aside * 100) } : {}) })),
    ...(L0.unplaced.length ? { noRoomFor: L0.unplaced } : {}), blocks: world.blocks.length, ms: current.ms, tries: current.tries,
    leaves: drawn.leaves, drawMs: drawn.ms, trunkInLeavesM: trunksIn(current.parts.props).scene,
    ...(current.check ? { check: { ok: current.check.ok, why: current.check.why, direct: current.check.direct, fewest: current.check.fewest, bank: current.check.bank, share: current.check.share, seen: current.check.seen, fewestSeen: current.check.fewestSeen, ...(current.check.mover ? { mover: current.check.mover } : {}) } } : {}),
    ...(L0.hardest ? { hardest: L0.hardest.spread ? { spread: L0.hardest.spread } : { mover: L0.hardest.mover.move, look: L0.hardest.mover.look, timing: L0.hardest.mover.timing } } : {}),
    ...(kept ? { used: round.used, down: round.down } : {}),
  });
  busy = false;
  resume.keep();
  return current;
}

/* ---------- the moon base (levels 6-10, Q119) ---------- */

// A moon scene: made from the level's seed (moonScene), or `kept` (its scene
// and the blocks as they stood), or the tutorial's part (spec.part: bare ground, no base).
async function makeMoonScene(lv, kept, spec) {
  makeMoonStage();
  showWorld(true);
  const look = spec.part ? 'bare' : lv;
  if (moon3d.level !== look) { const t0 = performance.now(); moon3d.setLevel(look); L('setting', { level: look, name: spec.part ? 'the tutorial: no base' : levelInfo(lv).name, moon: true, ms: Math.round(performance.now() - t0) }); }
  const t0 = performance.now();
  const scene = kept?.layout.moon ?? (spec.part ? moonPracticeScene(spec.part) : moonScene(spec.seed, spec.level, spec.scene));
  moonWorld.setScene(scene, kept?.settled?.poses ?? null);
  moon3d.setScene(scene);
  current = { id: spec.id, layout: { level: lv, seed: scene.seed, moon: scene, stack: scene.structures.map(s => s.name).join('+'), things: [] }, parts: null, check: null, tries: 0, ms: 0 };
  current.ms = Math.round(performance.now() - t0);
  mo.scene = scene;
  mo.f = spec.part ? moonPracticeLander(spec.part, moonMode(playMode()).speed) : newLander(scene.span, moonMode(playMode()).speed);
  mo.held = false; mo.lit = -1;
  round = kept?.settled?.round ?? newRound(moonWorld.blocks.length);
  if (round.since != null) round.since = 99;
  settled = kept?.settled ?? null;
  lastFit = '';
  fit();
  moon3d.sync(moonWorld);
  moon3d.setLander(mo.f, ready(), false);
  moon3d.render();
  showWait(false);
  // no hint's line (Q123; 11.1: "Hold 👆 to aim, let go to drop" before each scene's first ball)
  $('hint').hidden = true;
  renderTut();
  perf.frames = 0; perf.physMs = 0; perf.dropped = 0; perf.at = performance.now();
  renderTally();
  L(kept ? 'moon scene picked up again' : tut ? 'tutorial: a part' : 'moon scene', {
    ...(tut ? { tutorial: tut.world, part: spec.part, of: tutorialParts(tut.world), mode: playMode(), waitsAtEnds: !!mo.f.ends } : game), structures: scene.structures.map(s => ({ name: s.name, x: s.x, z: s.z, ...(s.ledge ? { ledge: true } : {}) })), blocks: scene.blocks.length,
    span: scene.span, earth: scene.earth, speed: mo.f.speed, light: moonMode(playMode()).light, ring: moonMode(playMode()).ring, ms: current.ms,
    ...(kept ? { used: round.used, down: round.down } : {}),
  });
  busy = false;
  resume.keep();
  return current;
}

// Where a drop now would land, and the block it would hit (dropPath): { p, hit }.
function moonAim() {
  const f = mo.f;
  return dropPath([f.x, LANDER_Y - DROP_BELOW, f.z], f.vx, moonWorld.boxes(), mo.scene.ledges);
}
// Let go: the ball falls from under the lander with its speed.
function moonDrop(how) {
  if (!ready()) { L('drop refused', { why: canThrow(round).why ?? 'busy', how }); return false; }
  const f = mo.f, aimNow = moonAim();
  const r = useBall(round);
  if (tut) { round.used = 0; tut.balls = (tut.balls ?? 0) + 1; }   // the tutorial's balls are free (Q124), counted for the log
  moonWorld.dropBall([f.x, LANDER_Y - DROP_BELOW, f.z], [f.vx, 0, 0]);
  thrownAt = performance.now();
  $('hint').hidden = true;
  sound.play('whoosh', 0, { level: 0.35, quiet: true });
  L('drop', { ball: r.ball, how, mode: playMode(), at: [f.x, f.z].map(r2), vx: r2(f.vx), ringX: r2(aimNow.x), toward: aimNow.hit == null ? 'ground' : aimNow.hit < 0 ? 'ledge' : `block ${aimNow.hit}`, ringShown: showsRing(playMode(), r.ball - 1), ...(tut ? { tutorial: tut.world } : {}) });
  renderTally();
  resume.keep();
  return true;
}
// Turn the lander round (⇄, or ← → towards the other way).
function moonTurn(how, dir = 0) {
  if (!onMoon() || !round || round.result) return false;
  const f = mo.f, turned = dir ? flyTo(f, dir) : (turnNow(f), true);
  if (turned) L('lander: turn', { how, at: r2(f.x), heading: f.dir > 0 ? 'right' : 'left' });
  return turned;
}
// The moon's sounds: a block knocked (a metal clonk), the ball into the dust (a soft thud).
let moonKnock = 0;
function moonHit({ a, b, v, mat }) {
  const now = performance.now();
  if ((a === 'block' || b === 'block') && v > 0.4 && now - moonKnock > 40) { moonKnock = now; sound.play(mat === 'panel' ? 'ring' : 'clonk', 0, { level: Math.min(1, v / 4), quiet: true }); }
  else if (a === 'ball' && b === 'ground' && v > 1) sound.play('thud', 0, { level: Math.min(1, v / 5), quiet: true });
}
// A moon frame: the lander on, the physics, the round's rules (as the park's), the drawing.
function moonTick(dt, draw) {
  const f = mo.f, t0 = performance.now();
  const ends = flyStep(f, dt, mo.scene.span);
  if (ends === 'turned') L('lander turns at the end', { at: r2(f.x), ringX: r2(ringX(f)) });
  else if (ends === 'waits') L('lander waits at the end for ⇄ (the tutorial)', { at: r2(f.x), ringX: r2(ringX(f)) });
  const kz = (mo.keys.down ? 1 : 0) - (mo.keys.up ? 1 : 0);
  if (kz) steerTo(f, f.zT + kz * STEER_KEY * dt);
  const { down, fell, dropped } = moonWorld.step(dt, () => performance.now());
  perf.physMs += performance.now() - t0; perf.dropped += dropped; perf.frames++;
  for (const b of fell) L(b.away ? 'block down: out of reach' : 'block down', { mat: b.mat, i: b.i, t: r2(round.t), at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2) });
  const still = moonWorld.still(), calm = moonWorld.calm();
  const { downChanged, ended: result, card } = update(round, dt, { down, still, calm });
  if (downChanged) { L('blocks down', { down: round.down, of: round.total, t: r2(round.t) }); renderTally(); }
  if (result) endScene(result);
  if (card && ended && $('over').hidden) { L('the card', { won: ended.won, afterWinS: r2(round.cardT), calm, still }); showEnd(); }
  noteSettled();
  if (!draw) return;
  moon3d.tick(dt);
  moon3d.sync(moonWorld);
  // the ring whenever a ball is ready (Q131, 11.2: until then only while the pad or Space was held)
  const ok = ready();
  moon3d.setLander(f, ok, mo.held && ok);
  let lit = -1, p = null;
  if (ok && showsRing(playMode(), round.used)) {
    const a = moonAim();
    p = [a.x, a.hit == null ? 0 : a.y - MOON_BALL.r, a.z];
    if (moonMode(playMode()).light && a.hit != null && a.hit >= 0) lit = a.hit;   // (null >= 0 is true)
  }
  if (lit !== mo.lit) { mo.lit = lit; if (lit >= 0) L('drop would hit block', { i: lit, mat: moonWorld.blocks[lit]?.mat }); }
  moon3d.setAim(p, lit);
  moon3d.render();
}

// The thing that moves in the way, for the scene drawn (Q106): the one its
// layout was dealt on Hardest (a scene picked up again too; none on
// Normal or Harder, nor in a level without one yet), or the checking
// hook's; started from the start of its path; logged with how much of the
// time the throw line is clear.
function placeMover() {
  const dealt = current?.layout.hardest?.mover ?? null;
  const choice = moverOverride === null ? null : moverOverride ? { ...(dealt ?? {}), ...moverOverride } : dealt;
  if (!choice) { world.setMovers(null); stage.setMovers(null); return; }
  const m = moverFor(current.parts, choice, current.layout.seed);
  world.setMovers(m);
  stage.setMovers(m);
  stage.syncMovers(world.movers, world.moverT);
  // (Frosty Times': where it crosses, the snowman's ends short of a thing, where the snowballs burst, the snowflakes on a thing)
  const frosty = m.load.clear ? { share: m.at, ...(m.spanL != null ? { endsM: [m.spanL, m.spanR] } : {}), ...(m.plan.end != null ? { burstX: r2(m.plan.end - m.x0), farM: r2(m.plan.far) } : {}), ...(m.move === 'fall' ? { flakes: m.plan.flakes.length, onThings: flakesOn(m, meetsThings(current.parts)).share } : {}) } : {};
  L('mover', { move: m.move, pace: m.pace, height: m.height, timing: m.timing, look: m.look, crossS: m.cross, planS: r2(m.plan.len), at: [m.x0, m.y, m.z], spanM: m.span, loads: m.n, open: openShare(m), ...gaps(m), ...frosty });
}

function renderTally() {
  const r = round;
  $('s1Chip').innerHTML = svg(setup.p1, ended ? (ended.won ? 'winner' : 'sad') : 'normal');
  // the balls left, drawn as the level's ball (developer, 2026-11-12, Q80: no blocks-down count)
  const left = ballsLeft(r);
  // (the moon's ball drawn as the iron one: grey metal)
  $('balls').classList.toggle('iron', ['iron', 'moon'].includes(levelInfo(current?.id.level ?? game.level).ball));
  $('balls').innerHTML = Array.from({ length: BALLS }, (_, i) => `<i class="${i < left ? '' : 'used'}"></i>`).join('');
  $('balls').setAttribute('aria-label', `${left} ball${left === 1 ? '' : 's'} left`);
  renderHud();
  // Start again any time in a scene (Q102: the level or the whole game too); not once it's over
  // (the game has moved on; the card has its own buttons)
  // (not in the practice: Skip and Map leave it)
  $('restartBtn').disabled = !!r.result || !!tut;
  $('restartBtn').classList.toggle('notyet', $('restartBtn').disabled);
}
// The pills over the park (shown as a scene is set up too).
function renderHud() {
  // the practice (Q124): its world and "Practice", no jewels or hearts (nothing is kept)
  $('hudHearts').hidden = !!tut;
  if (tut) {
    const w = WORLDS.find(x => x.id === tut.world);
    $('hudLevelName').textContent = `${w.sign} Practice`;
    $('hudJewels').textContent = '';
    $('hudLevel').setAttribute('aria-label', `Practice for ${w.name}`);
    return;
  }
  const g = ended?.shown ?? game;
  // the level's name with its number within its world (developer, 2026-11-12: "show the level name"; Q122)
  const name = levelInfo(g.level).name;
  $('hudLevelName').textContent = levelTag(g.level);
  $('hudJewels').textContent = jewels(g);
  $('hudLevel').setAttribute('aria-label', `${worldOf(g.level).name}, level ${levelInWorld(g.level)}, ${name}, ${g.jewels} of ${SCENES} jewels`);
  $('hudHearts').textContent = hearts(g);
  $('hudHearts').setAttribute('aria-label', `${g.hearts} heart${g.hearts === 1 ? '' : 's'}`);
}

/* ---------- the drag and the throw ---------- */

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
  // (on the moon there's no slingshot's ball to press by: the pad only)
  const p = padPress(e.clientX - box.left, e.clientY - box.top, pad, onMoon() ? { x: -9999, y: -9999 } : ballPx());
  if (!p.on) {
    L('press off the pad', { from: p.from, offPx: p.offPx, r: pad?.r ?? null, at: [Math.round(e.clientX - box.left), Math.round(e.clientY - box.top)] });
    pulsePad();
    return;
  }
  stopDemo('a finger');
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  // the moon: holding shows the aim; dragging steers from where the lander is going
  if (onMoon()) { mo.held = true; mo.z0 = mo.f.zT; }
  $('hint').hidden = true;   // out of the dots' way
  try { e.target.setPointerCapture(e.pointerId); } catch { /* an old browser: the drag still works over the canvas */ }
}
function onMove(e) {
  if (drag && e.pointerId === drag.id) {
    drag.x = e.clientX; drag.y = e.clientY;
    // drag up = farther away, down = nearer (110 px = 2.2 m: mockup v3)
    if (onMoon()) { const z = steerTo(mo.f, mo.z0 + (drag.y - drag.y0) / STEER_PX * STEER_M); if (Math.abs(z - (mo.zLogged ?? z)) >= 0.5 || mo.zLogged == null) { mo.zLogged = z; L('lander: steer', { z: r2(z), how: 'pad' }); } }
  }
}
function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (onMoon()) { drag = null; mo.held = false; moonDrop('pad'); return; }
  const d = dragNow();
  drag = null;
  if (!d) return;
  if (!d.ok) {
    L('drag too short: no throw', { up: Math.round(d.up), aim: r2(d.aim) });
    return;
  }
  doThrow(d);
}
// The moon's ⇄: turns the lander round (a tap, so it works with the other thumb while the pad is held).
$('turnBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  sound.unlock();
  if (!moonTurn('button')) return;
  const b = $('turnBtn');
  b.classList.add('on');
  setTimeout(() => b.classList.remove('on'), 180);
});
// The moon's keys (for a computer: mockup v4): ↑ ↓ farther / nearer (a tap a
// step, held on), ← → fly that way, Space drops at once (Q131, developer,
// 2026-11-18: "more natural for me to use the space bar down event to drop the
// ball"; until 11.2 hold Space to aim, let go to drop).
const MOON_KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Space: 'space' };
const keysOn = () => playing && onMoon() && $('over').hidden && $('ask').hidden;
addEventListener('keydown', e => {
  const k = MOON_KEYS[e.code];
  if (!k || !keysOn()) return;
  e.preventDefault();
  if (e.repeat) return;
  sound.unlock();
  L('key', { key: k });
  if (k === 'left' || k === 'right') { moonTurn('key', k === 'left' ? -1 : 1); return; }
  if (k === 'up' || k === 'down') { mo.keys[k] = true; steerTo(mo.f, mo.f.zT + (k === 'up' ? -STEER_TAP : STEER_TAP)); return; }
  if (k === 'space') moonDrop('key');
});
addEventListener('keyup', e => {
  const k = MOON_KEYS[e.code];
  // (Space let go: not a click on a button that has the focus)
  if (k === 'space' && keysOn()) { e.preventDefault(); return; }
  if (!k || !(k in mo.keys) || !mo.keys[k]) return;
  e.preventDefault();
  mo.keys[k] = false;
});
addEventListener('blur', () => { mo.keys.up = mo.keys.down = false; });

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
  if (tut) { round.used = 0; tut.balls = (tut.balls ?? 0) + 1; }   // the tutorial's balls are free (Q124), counted for the log
  const { v, yaw, el, vec } = launchVel(d.power, d.aim, d.up);
  const aimed = world.trace(vec, 1);
  const body = world.throwBall(vec);
  shot = { body, at: world.time, pred: aimed.hits.map(h => ({ kind: h.kind, at: h.at })), touches: [], last: null };
  thrownAt = performance.now();
  $('hint').hidden = true;
  sound.play('whoosh', 0, { level: d.power });
  L('throw', {
    ball: r.ball, speed: r2(v), up: Math.round(el * 180 / Math.PI), aim: Math.round(yaw * 180 / Math.PI), power: r2(d.power),
    mode: playMode(), dotsS: dotSeconds(playMode(), r.ball - 1),
    toward: aimed.hits.map(h => ({ kind: h.kind, at: h.at.map(r2), t: r2(h.t) })), ...(tut ? { tutorial: tut.world } : {}),
  });
  if (tut) tut.thrown = true;   // (the pad's show stops for good)
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
// the park's movers (Q106): the tyre's rubber and the bucket seat a thud, the kite a rustle;
// Frosty Times': the snowman and a snowball a soft poof, the snowflake an icy clink
// Cactus Canyon's: a tumbleweed a dry rustle, the cart's iron a clonk, the vulture a soft thud
const MOVER_SOUND = { tyre: 'thud', zip: 'thud', kite: 'rustle', snowman: 'poof', snowball: 'poof', flake: 'iceknock', tumbleweed: 'rustle', cart: 'clonk', vulture: 'thud', sled: 'thud', paperLantern: 'rustle', star: 'chime' };
const THROUGH = { tyre: 'ball through the tyre', flake: 'ball through the snowflake', tumbleweed: 'ball through the tumbleweed', star: 'ball through the star' };
// (Star Light's: the sled a thud, the paper lantern a rustle, the star a crystal chime)
function onHit({ a, b, v, y, ball, other, mat, thing, offM }) {
  const now = performance.now(), vs = v / Math.sqrt(SCALE);
  // through the tyre's hole (Q106): told, no touch
  if (b === 'through') { L(THROUGH[thing] ?? 'ball through the mover', { t: r2(world.time - (shot?.at ?? 0)), moverT: r2(world.moverT), offM, at: [ball.position.x, ball.position.y, ball.position.z].map(r2), speed: r2(vs) }); return; }
  // Frosty Times (Q106, session 3): the snowman's hat knocked off by a ball at his head; a snowball burst
  if (b === 'hat') { sound.play('boing', 0, { level: 0.6, quiet: true }); L('snowman\'s hat knocked off', { t: r2(world.time - (shot?.at ?? 0)), moverT: r2(world.moverT), at: [ball.position.x, ball.position.y, ball.position.z].map(r2), speed: r2(vs) }); return; }
  if (b === 'burst') { L('snowball burst', { moverT: r2(world.moverT), at: [other.position.x, other.position.y, other.position.z].map(r2) }); return; }
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
    if (b === 'mover') {
      sound.play(MOVER_SOUND[thing] ?? 'clonk', 0, { level: Math.min(1, vs / 6 + 0.3), quiet: true });
      L('ball stopped by the mover', { look: thing, t: r2(world.time - (shot?.at ?? 0)), moverT: r2(world.moverT), at: [ball.position.x, ball.position.y, ball.position.z].map(r2), speed: r2(vs) });
    } else if (b === 'glass') sound.play('boing', 0, { quiet: true });
    else if (b === 'soft') sound.play(SOFT_SOUND[thing] ?? 'crunch', 0, { level: Math.min(1, vs / 6), quiet: true });
    else if (thing === 'light') sound.play('ring', 0, { level: Math.min(1, vs / 6), quiet: true });
    else if (b === 'bush' || (b === 'tree' && thing !== 'cactus' && y > 1.0 * SCALE)) sound.play('rustle', 0, { quiet: true });
    else if (vs > 0.6 && now - lastThud > 60) { lastThud = now; sound.play(stage.level > 1 ? 'clonk' : 'thud', 0, { level: Math.min(1, vs / 6), quiet: true }); }
  }
}

/* ---------- the loop ---------- */

function frame(now) {
  if (!running) return;
  const dt = Math.min(MAX_FRAME_S, Math.max(0, (now - last) / 1000));   // real time down to 10 frames a second (Q99; 0.05 until 10.6)
  last = now;
  tick(dt);
  requestAnimationFrame(frame);
}

function tick(dt, draw = true) {
  if (!round || busy) return;
  if (onMoon()) { moonTick(dt, draw); return; }
  const t0 = performance.now();
  const { down, fell, rose, broke, dropped } = world.step(dt, () => performance.now());   // a slow phone drops steps (Q65)
  for (const k of broke) brokeUp(k);
  perf.physMs += performance.now() - t0;
  perf.dropped += dropped;
  perf.frames++;
  for (const b of fell) {
    if (b.away) L('block down: out of reach', { c: b.c, t: r2(round.t), why: b.away, ...whereIs(b) });   // Q85, Q103
    else L('block down', { c: b.c, t: r2(round.t) });
  }
  // the animals take fright at the first block to fall, shatter or burst while they're in view
  const fx0 = fell[0]?.body.position.x ?? broke[0]?.at[0];
  if (fx0 !== undefined) { const scared = stage.fright(fx0); if (scared.length) L('animal frightened', { t: r2(round.t), by: fell.length ? 'fell' : 'broke', scared }); }
  for (const b of rose) L('block up again: a post leaning, not lying', { c: b.c, t: r2(round.t) });
  // still: the blocks, and any shards or spray (the effects move on every step, drawn or not)
  stage.tick(dt);
  // calm: the blocks slow enough for the card after a win (the shards fly on behind it)
  const still = world.still(), fx = stage.fxLive, calm = world.calm();
  const { downChanged, ended: result, card } = update(round, dt, { down, still: still && fx === 0, calm });
  if (downChanged) { L('blocks down', { down: round.down, of: round.total, t: r2(round.t) }); renderTally(); }
  if (downChanged && round.down >= round.total) L('all down: cleared unless one gets up', { t: r2(round.t), still, calm, fx });
  if (result) endScene(result);
  if (card && ended && $('over').hidden) { L('the card', { won: ended.won, afterWinS: r2(round.cardT), calm, still, fx }); showEnd(); }
  // the blocks left glow once the scene has waited a while for the next ball (Q101)
  glowIdle = waitingOn(round, still && fx === 0) && !drag && !demo ? glowIdle + dt : 0;
  // the count started though something still moves (Q105): what, once a throw
  if (glowIdle > 0 && glowIdle <= dt && !(still && fx === 0)) {
    L('glow: counting though not still', { gameS: r2(round.since), fx, moving: world.moving().slice(0, 6).map(b => ({ mat: b.mat, tall: b.tall, down: b.down, v: r2(b.body.velocity.length()), spin: r2(b.body.angularVelocity.length()), at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2) })) });
  }
  const glow = glowAt(glowIdle), glows = glowsBy(glowIdle);
  // the glow's wait, the game's time since the throw and the real time since it: a slow
  // frame rate shows as realS over gameS, things still moving as gameS over waitS + 0.9
  if (glows > glowsSaid) L('blocks left glow', { left: round.total - round.down, waitS: r2(glowIdle), n: glows, t: r2(round.t), gameS: r2(round.since), realS: r2((performance.now() - thrownAt) / 1000) });
  glowsSaid = glowIdle ? glows : 0;
  noteSettled();
  if (!draw) return;
  stage.sync(world.blocks, world.balls);
  if (world.movers.length) stage.syncMovers(world.movers, world.moverT);
  const ok = ready();
  const d = dragNow() ?? (ok ? demoFrame() : null);
  stage.setSling(ok, d && ok ? d.aim : 0, d && ok ? d.power : 0);
  // the dots as long as how hard says (Q96; Hardest Harder's for now, Q98)
  const secs = dotSeconds(playMode(), round.used);
  stage.setDots(d && ok && d.show && secs > 0 ? dotsFor(world.trace(launchVel(d.power, d.aim, d.up).vec, 0), secs) : null, 1);
  stage.setGlow(glow, glow > 0 ? world.blocks.map(b => !(b.down || b.broken || b.away)) : null);
  // (Q109: what the glow drew at its brightest, once a pulse: are the glowing meshes there, how bright)
  if (!glowIdle) glowPeak = 0;
  if (glow > 0.6 && glowPeak !== glows) { glowPeak = glows; L('glow at its brightest', { ...stage.glowState(), a: r2(glow), n: glows }); }
  stage.render();
  drawing?.frame(performance.now());
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
// On the clock, not the frames (a slow phone's frames are capped at 0.1 s:
// the finger would crawl).
function demoFrame() {
  if (!demo || !pad || !current) return null;
  demo.t = (performance.now() - demo.t0) / 1000;
  if (!demo.to) demo.to = demoTarget();
  const s = demoAt(demo.t, demo.to);
  if (!s) {
    // in the tutorial's first part it starts again until a ball is thrown
    if (tut && !tut.thrown) { demo.t0 = performance.now(); return null; }
    L('pad show done'); stopDemo(); return null;
  }
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
  if (r.t < settledAt) settledAt = 0;   // a new round's clock restarts at 0 (review TOP-2)
  if (r.t - settledAt < 0.5) return;
  settledAt = r.t;
  if (r.since != null && r.since < END_WAIT && !r.result) return;
  const w = onMoon() ? moonWorld : world;
  if (!w.still()) return;
  const was = settled && JSON.stringify(settled.round);
  settled = { round: JSON.parse(JSON.stringify(r)), poses: w.poses() };
  if (JSON.stringify(settled.round) !== was) resume.keep();
}

// The scene's over: a jewel and on, or a heart lost (sceneOver()); kept on
// the device at once, so coming back starts where the game is. The level
// done: a new game (level 2 isn't made yet), new scenes.
function endScene(result) {
  // a tutorial's part cleared (Q129): its own card (Next ▸ and Skip; the last, Let's go ▸), nothing of the game kept
  if (tut) {
    const w = WORLDS.find(x => x.id === tut.world), { last } = partCleared(tut);
    renderTut();
    const after = last ? null : TUTORIALS[tut.world].parts[tut.part + 1];
    ended = { tut: true, last, won: true, outcome: 'practice', words: last ? { title: 'You’ve got it! 🎯', sub: `Now for ${w.name}`, next: 'Let’s go ▸' } : { title: 'Well done! 🎯', sub: `Next: ${after.name}`, next: 'Next ▸' } };
    settled = null;
    showCleared();
    L('tutorial: a part cleared', { world: tut.world, part: tutorialPart(tut).id, n: tut.part + 1, of: tutorialParts(tut.world), last, ballsSoFar: tut.balls ?? 0, t: r2(round.t), s: r2((performance.now() - tut.t0) / 1000) });
    sound.play(endSound(1, { solo: true }));
    return;
  }
  const was = { ...game };
  // the stars of a scene won, before the game moves on (Q116): by the balls it took; the best only goes up
  const stars = result.won ? recordStars(game, game.level, game.scene, starsForBalls(round.used)) : null;
  // a level done: the game is on to the next level (or every level done: 'all')
  const outcome = sceneOver(game, result.won), lvDone = outcome === 'level' || outcome === 'all';
  saveGame();
  const words = endWords(outcome, lvDone ? was : game, nameOf(setup.p1));
  // the pills over the park show the scene's end until the next one starts
  // (no hearts left, or all 5 jewels), not the game already moved on
  const shown = outcome === 'out' ? { ...game, hearts: 0, jewels: was.jewels } : lvDone ? { ...was, jewels: SCENES } : null;
  ended = { outcome, words, won: result.won, level: was.level, scene: was.scene, shown, unlocked: game.reached > was.reached, stars, balls: round.used };
  // the blocks as the scene ended (the last may still be falling): a reload shows it as it was
  settled = { round: JSON.parse(JSON.stringify(round)), poses: (onMoon() ? moonWorld : world).poses() };
  // won: the win shown at once ("Cleared!", the jewel, the sound), the card once the blocks are calm (tick);
  // lost: the card now (out of balls already waits for everything to be still)
  if (result.won) showCleared(); else showEnd();
  const secs = (performance.now() - perf.at) / 1000;
  L('scene over', { ...result, outcome, stars, was, now: { ...game }, allDownS: r2(round.allDown ?? 0), fps: Math.round(perf.frames / Math.max(secs, 0.001)), physicsMs: r2(perf.physMs / Math.max(1, perf.frames)), stepsDropped: perf.dropped, drawing: drawing?.level,
    // the blocks left standing, where they are (Q103: why a scene couldn't be cleared)
    standing: result.won ? undefined : onMoon()
      ? moonWorld.blocks.filter(b => !b.down).map(b => ({ mat: b.mat, i: b.i, at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2) }))
      : world.blocks.filter(b => !b.down && !b.broken).map(b => ({ c: b.c, mat: b.mat, ...whereIs(b) })),
    moon: onMoon() ? undefined : stage.animals?.().find(a => a.moon)?.moon });
  sound.play(result.won ? endSound(1, { solo: true }) : 'aww');
  resume.keep();
}
// A scene won, before its card (developer, 2026-11-12: a long pause before
// a cleared scene was called complete): "Cleared! 💎" over the park's top,
// not over the blocks, as the last of them finish falling.
function showCleared() {
  drag = null;
  stopDemo();
  renderTally();
  $('hint').hidden = true;
  $('cleared').textContent = tut ? 'Cleared! 🎯' : 'Cleared! 💎';
  $('cleared').hidden = false;
}
function showEnd() {
  drag = null;
  stopDemo();
  renderTally();
  $('hint').hidden = true;
  $('cleared').hidden = true;
  $('overChip').innerHTML = svg(setup.p1, ended.won ? 'winner' : 'sad');
  $('overTitle').textContent = ended.words.title;
  $('overSub').textContent = ended.words.sub ?? '';
  $('nextBtn').textContent = ended.words.next;
  // a scene won: its stars, and the best (Q116)
  const st = ended.won ? ended.stars : null;
  // (a tutorial's part: Skip in its place, none after the last; else New game)
  $('newBtn').textContent = ended.tut ? 'Skip' : 'New game';
  $('newBtn').hidden = !!ended.tut && !!ended.last;
  $('overStars').hidden = $('overBest').hidden = !st;
  // the first ball cleared it all: a badge (developer, 2026-11-17)
  $('overAced').hidden = !(st && ended.balls === 1);
  // fewer than 3 stars in the best so far: the scene can be played again at once (Q118; a card kept
  // from before has no scene to go back to)
  $('againStars').hidden = !(st && ended.level && ended.scene && Math.max(st.best, st.stars) < 3);
  if (st) {
    $('overStars').innerHTML = Array.from({ length: 3 }, (_, i) => `<span class="bs${i < st.stars ? ' on' : ''}">${starSvg(i < st.stars)}</span>`).join('');
    $('overStars').setAttribute('aria-label', `${st.stars} of 3 stars`);
    $('overBest').className = `overbest${st.improved ? ' new' : ''}`;
    $('overBest').textContent = st.best === 0 ? 'New! Your first stars here' : st.improved ? `New best - ${st.stars} ${st.stars === 1 ? 'star' : 'stars'}!` : st.stars === 3 ? 'The best there is!' : `Your best here: ${st.best} ${st.best === 1 ? 'star' : 'stars'}`;
  }
  $('over').hidden = false;
}

// After a level: the next level's screen; after the last: a new game's scenes, the map.
$('nextBtn').onclick = () => {
  const o = ended?.outcome;
  // a tutorial's part: on to the next (a new stack where the last one stood), or done after the last
  if (ended?.tut) {
    if (ended.last) { endTutorial('done'); return; }
    nextPart(tut);
    L('tutorial: next part', { world: tut.world, part: tutorialPart(tut).id, n: tut.part + 1, of: tutorialParts(tut.world) });
    current = null; round = null; ended = null; settled = null;
    startScene();
    return;
  }
  L('next', { outcome: o, ...game });
  // a level done: the map, the next level unlocking, your face walking there (Q81)
  if (o === 'level') {
    const unlock = ended.unlocked ? game.level : 0;
    current = null; round = null; ended = null; settled = null;
    showMap(unlock);
    return;
  }
  if (o === 'all') { game = createGame(newSeed(), game); saveGame(); current = null; round = null; ended = null; settled = null; showMap(); return; }
  startScene();
};
// Try again for more stars (Q118, developer, 2026-11-17): the scene just won, as a scene tapped on the
// map: new scenes, 3 hearts and the balls again; the best stars only go up. The game was on to the next
// scene (or level) as the scene ended; this puts it back on this one.
$('againStars').onclick = () => {
  const lv = ended?.level, sc = ended?.scene;
  if (!lv || !sc || busy) return;
  const was = { ...game };
  if (!startAtScene(game, lv, sc)) { L('try again for more stars: not playable', { level: lv, scene: sc, reached: game.reached }); return; }
  saveGame();
  L('try again for more stars', { level: lv, scene: sc, stars: ended.stars?.stars, best: ended.stars?.best, was, now: { ...game }, levelSeed: seedOf(game) });
  current = null; round = null; ended = null; settled = null;
  startScene();
};
$('newBtn').onclick = () => {
  if (ended?.tut) { endTutorial('skipped'); return; }   // (a tutorial part's card: Skip)
  L('new game: the setup screen'); current = null; round = null; ended = null; settled = null; showSetup(); };

// The map from a scene (developer, 2026-11-12: "there seems to be no way to get to the map"):
// the scene under way is kept (parked), so coming back to it carries on, not a free start again.
$('mapBtn').onclick = () => {
  if (busy) return;
  // out of the practice: back to the map, the world not taught (it shows again before the world's first scene)
  if (tut) { endTutorial(ended?.tut && ended.last ? 'done' : 'left', true); return; }
  parked = current && !ended ? { id: current.id, layout: current.layout, settled } : null;
  L('map from the scene', { ...game, used: round?.used ?? 0, kept: !!parked });
  current = null; round = null; ended = null; settled = null;
  showMap();
};

// Start again (every game has one: developer, 2026-10-15), from the play
// bar or the map (developer, 2026-11-13, Q102: "the ability to start a
// scene or level again is not available everywhere and it is confusing to
// figure out how to find it"): one question, three answers. This scene
// (in play, once a ball is thrown) costs a heart, else it would be a way
// round losing one; the level from scene 1 is free (its jewels go, as with
// the last heart) and has new scenes; the whole game (once another level
// is open) as Start over. Each goes straight into play.
function askAgain(from) {
  if (busy || walking) return;
  const scene = from === 'play' && !!round && !round.result && round.used > 0;
  $('againScene').hidden = !scene;
  $('againLevel').firstChild.textContent = `Level ${game.level} from scene 1 `;
  $('againGame').hidden = game.reached <= 1;
  drag = null;
  stopDemo();
  L('start again?', { from, scene, level: game.level, reached: game.reached, used: round?.used ?? 0, down: round?.down ?? 0 });
  $('ask').hidden = false;
  $('againNo').focus({ preventScroll: true });
}
$('restartBtn').onclick = () => { if (round && !round.result) askAgain('play'); };
$('mapAgain').onclick = () => askAgain('map');
$('againNo').onclick = () => { L('start again: no'); $('ask').hidden = true; };
$('againScene').onclick = () => {
  if (!round || round.result || !round.used) return;
  $('ask').hidden = true;
  const was = { ...game }, outcome = sceneOver(game, false);
  saveGame();
  L('start again: this scene, a heart lost', { outcome, was, now: { ...game } });
  startScene();
};
$('againLevel').onclick = () => {
  $('ask').hidden = true;
  const was = { ...game };
  restartLevel(game);
  parked = null;
  L('start again: the level from scene 1', { was, now: { ...game }, levelSeed: seedOf(game) });
  startLevel(game.level);
};
$('againGame').onclick = () => {
  $('ask').hidden = true;
  const was = { ...game };
  game = createGame(newSeed(), { stars: game.stars }, game.mode);   // as Start over: how hard and the stars are kept
  parked = null;
  L('start again: the whole game from level 1', { was, seed: game.seed, reached: game.reached });
  startLevel(1);
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
  // the drawing's level and what it draws (Q99; for checking in a browser)
  drawing() {
    const t = stage?.three;
    return t && { level: drawing?.level, pixelRatio: t.renderer.getPixelRatio(), shadows: t.renderer.shadowMap.enabled ? t.renderer.shadowMap.type : 'off', reflections: !!t.scene.environment };
  },
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
  // a world's tutorial (Q124): its state; start one as the map's gate does; the worlds taught (set them, for checking)
  tutorial: () => (tut ? { world: tut.world, part: tut.part + 1, of: tutorialParts(tut.world), id: tutorialPart(tut).id, say: $('tutSay').textContent, cleared: tut.cleared, balls: tut.balls ?? 0, shown: !$('tut').hidden, waiting: !!mo.f?.waiting } : null),
  tutorialStart: (id = 'park') => openTutorial(id),
  taught(list) { if (list !== undefined) { taught = readTaught(list); saveTaught(); L('taught set (checking)', { taught }); } return [...taught]; },
  // the unlocking after a level (Q81), without clearing one: level `to`'s lock popping
  walk: (from, to, unlock = true) => showMap(unlock ? to : 0),
  walkState: () => ({ walking: !!walking, shownAt, locked: [...document.querySelectorAll('.rn.locked')].map(e => e.id) }),
  // Q116: the difficulty and its stars, for checking
  stars: () => ({ mode: game.mode, stars: game.stars ?? {}, total: starTotal(game), games: Object.fromEntries(MODES.map(m => [m, !!profile.games[m]])) }),
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
    ...round, game: { ...game }, ready: ready(), busy, ended: ended?.outcome ?? null, card: $('over').hidden ? '' : $('overTitle').textContent, cleared: !$('cleared').hidden,
    stack: current?.layout.stack, things: current?.layout.things.map(t => t.kind + (t.where ? ` ${t.where}` : '')), power: current?.layout.power,
    awake: world.awake(), dots: stage.dotCount(), fov: r2(stage.fov), touches: shot?.touches ?? [], pad, demo: demo ? r2(demo.t) : null,
  } : { game: { ...game }, busy }),
  blocks: () => world.blocks.map(b => ({ c: b.c, at: [b.body.position.x, b.body.position.y, b.body.position.z].map(r2), down: b.down })),
  project: p => stage?.project(p),
  edges: (y, z) => stage?.viewEdges(y, z),
  hand: HAND,
  // the physics and the scene, for a test player in the page (as the mockup's)
  inside: () => ({ world, current, launchVel, stage }),
  // Hardest's thing that moves (Q106): change this scene's ({ move, pace, height, timing, look } over the
  // deal's, null for none, 'deal' for the deal's again; until the next scene); where it is
  mover(choice) {
    if (choice !== undefined) {
      moverOverride = choice === 'deal' ? undefined : choice ? { ...(moverOverride || {}), ...choice } : null;
      L('mover changed', { choice: moverOverride ?? 'the deal' }); placeMover();
    }
    return world.mover && { ...world.mover, t: r2(world.moverT), loads: world.movers.map(b => [b.position.x, b.position.y, b.position.z].map(r2)) };
  },
  // the moon base (Q119): its state; drop, turn, steer, hold the aim as the pad or keys would
  moon: () => (onMoon() ? {
    f: { ...mo.f }, span: mo.scene.span, structures: mo.scene.structures.map(s => s.name), blocks: moonWorld.blocks.length, down: moonWorld.blocks.filter(b => !b.down).length,
    lit: mo.lit, held: mo.held, aim: moonAim(), earth: moon3d.earthAt(), shootingStars: moon3d.shootingStars(), turnShown: !$('turnBtn').hidden,
  } : null),
  moonDrop: () => moonDrop('hook'),
  moonTurn: (dir = 0) => moonTurn('hook', dir),
  moonSteer: z => steerTo(mo.f, z),
  moonHold(on = true) { mo.held = on; tick(1 / 60); return mo.lit; },
  moonWorld: () => moonWorld,
  moonProject: p => moon3d?.project(p),
  // the next scene of the level (1-5, round again), with 3 hearts
  async nextScene() { if (busy) return null; return this.scene(game.scene % SCENES + 1); },
  // the scene ended as won (or lost) now, whatever the blocks are doing, for checking the end's card and the stars
  finish(won = true) {
    if (!round || round.result) return null;
    round.result = { won, down: round.down, total: round.total, balls: round.used };
    round.card = !won;
    endScene(round.result);
    return this.state();
  },
};
