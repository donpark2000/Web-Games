// Five Dice 3D's tray (DESIGN.md "3D games"), from play screen mockup v2:
// a wooden tray with green felt seen from a fixed camera, drawn with
// three.js (src/vendor/three). Tap a die to pick it up (it lifts over a
// ring); on Roll the dice kept slide to a row along the back, the picked
// ones hop into a leather cup that shakes, tips and pours them onto the
// felt, and once landed they line up along the front, then each row puts
// itself in order, smallest to highest (Q53, Q56). A box picked:
// the dice that score it stand forward, grouped like its picture, and hop
// (Q54); Undo puts them back. The maths (the throw, landing spots, camera, the tray's shape for
// the room) is src/core/dice3d.js; this file draws it and fits the play
// screen. Made by src/ui/five-dice-3d.js for src/ui/five-dice-game.js
// (its "tray").

import * as THREE from '../vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import {
  v3, upright, topFace, trayPlaces, trayCorners, backRow, pickSpots, planThrow, throwPose, slide, slidePose, cupPose, restPose,
  aim, project, trayShape, bestRow, lineUp, flat, FOV, TRAY, CUP_H, CORNER, DIE_GAP, sortRow, intoRow,
} from '../core/dice3d.js';
import { showBox } from '../core/showbox.js';
import { UNDO_MS } from './five-dice-game.js';
import { pageHeight, setWide, wideRoom } from './fit.js';
import { sound } from './sound.js';

// Whether this device can draw 3D: a WebGL canvas can be made.
export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// The dice's colours, picked on the setup screen (developer, 2026-11-07):
// the body and its dots.
export const COLOURS = {
  white: { body: '#FBFAF6', pip: '#1E2328' },
  red: { body: '#C9342C', pip: '#FBFAF6' },
  blue: { body: '#2F6DB5', pip: '#FBFAF6' },
  black: { body: '#25282C', pip: '#FBFAF6' },
};

const $ = id => document.getElementById(id);

// The turn line once the dice are rolled (Q57, developer, 2026-11-08:
// "The score card does not really look like boxes"; "tap" not "select").
// Five the same: its own words, not before the others (4 lines on an
// upright phone, where Roll's row leaves no room for a 4th).
export const PICK_WORDS = { more: 'Tap dice to roll again, or pick your score', last: 'Pick your score', yay: 'Five the same! Pick your score' };
const RING = { 1: 0xF2724F, 2: 0x3A94D4 };   // css: --p1, --p2
const FELT = '#2F7A57', WOOD = 0xA9703F, SKY = 0xE4F1EE;

export function makeTray3d({ tapDie, tapRoll, tapUndo, L }) {
  const tray = $('tray'), canvas = $('c'), rollBtn = $('rollBtn'), trayBox = $('trayBox');
  let view = null, rollDone = null, lastYay = false, lastScored = null;

  /* ---------- the scene ---------- */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(SKY);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  let cam = null, aspect = 1;   // the camera as src/core/dice3d.js aims it
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x6A7F70, 1.5));
  const sun = new THREE.DirectionalLight(0xFFF6E8, 2.6);
  sun.position.set(-3.5, 10, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true;
  scene.add(ground);

  function feltTexture() {
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = FELT; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) {
      const l = Math.random() < .5 ? 255 : 0;
      g.fillStyle = `rgba(${l},${l},${l},${Math.random() * .07})`;
      g.fillRect(Math.random() * S, Math.random() * S, 1.5, 1.5);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const feltMap = feltTexture();
  const feltMat = new THREE.MeshStandardMaterial({ map: feltMap, roughness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: WOOD, roughness: .55 });
  const trayGroup = new THREE.Group();
  scene.add(trayGroup);
  let places = null;
  function setTray(ix, iz) {
    if (places && places.ix === ix && places.iz === iz) return;
    for (const m of [...trayGroup.children]) { m.geometry.dispose(); trayGroup.remove(m); }
    const felt = new THREE.Mesh(new THREE.PlaneGeometry(ix * 2, iz * 2), feltMat);
    felt.rotation.x = -Math.PI / 2; felt.receiveShadow = true; trayGroup.add(felt);
    feltMap.repeat.set(ix * 1.2, iz * 1.2);
    const { rim, rimH } = TRAY;
    for (const [w, d, x, z] of [
      [ix * 2 + rim * 2, rim, 0, -iz - rim / 2], [ix * 2 + rim * 2, rim, 0, iz + rim / 2],
      [rim, iz * 2, -ix - rim / 2, 0], [rim, iz * 2, ix + rim / 2, 0],
    ]) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, rimH, d, 2, .08), wood);
      m.position.set(x, rimH / 2, z); m.castShadow = m.receiveShadow = true; trayGroup.add(m);
    }
    const was = places;
    places = trayPlaces(ix, iz);
    // a different tray (the screen turned): the dice at rest come back in,
    // and any in the back row stand in the new one (the rows lined up are
    // worked out again once the camera is aimed: reline); so do the places
    // Undo would put them back to
    if (was) {
      const inside = p => {
        if (Math.abs(p.z - was.backZ) < .05) p.z = places.backZ;
        p.x = Math.min(ix - .6, Math.max(-ix + .6, p.x));
        p.z = Math.min(iz - .6, Math.max(-iz + .6, p.z));
      };
      for (const d of dice) { settle(d); inside(d.pos); }
      for (const s of shown?.was ?? []) inside(s.pos);
    }
  }

  /* ---------- the dice: pressed-in dots, a little round ---------- */

  const A = .26, B = .74, M = .5;
  const PIPS = {
    1: [[M, M]], 2: [[A, A], [B, B]], 3: [[A, A], [M, M], [B, B]],
    4: [[A, A], [B, A], [A, B], [B, B]], 5: [[A, A], [B, A], [M, M], [A, B], [B, B]],
    6: [[A, .24], [A, M], [A, .76], [B, .24], [B, M], [B, .76]],
  };
  function faceCanvas(v, { body, pip }) {
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d'), r = S * .088;
    g.fillStyle = body; g.fillRect(0, 0, S, S);
    for (const [x, y] of PIPS[v]) {
      const cx = x * S, cy = y * S;
      const gr = g.createRadialGradient(cx + r * .3, cy + r * .3, r * .1, cx, cy, r);
      gr.addColorStop(0, pip); gr.addColorStop(.8, pip); gr.addColorStop(1, '#3A3F45');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    }
    return cv;
  }
  function bumpCanvas(v) {
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d'), r = S * .088;
    g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
    for (const [x, y] of PIPS[v]) {
      const gr = g.createRadialGradient(x * S, y * S, r * .55, x * S, y * S, r * 1.05);
      gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff');
      g.fillStyle = gr; g.beginPath(); g.arc(x * S, y * S, r * 1.05, 0, Math.PI * 2); g.fill();
    }
    return cv;
  }
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  // the box's faces in three.js's order: +x, -x, +y, -y, +z, -z (dice3d FACES)
  const FACE_V = [2, 5, 1, 6, 3, 4];
  const bumps = FACE_V.map(v => new THREE.CanvasTexture(bumpCanvas(v)));
  const mats = FACE_V.map((v, k) => {
    const m = new THREE.MeshStandardMaterial({ roughness: .3, metalness: 0 });
    m.bumpMap = bumps[k]; m.bumpScale = 2.2;
    return m;
  });
  let colour = null;
  function setColour(name) {
    const c = COLOURS[name] ? name : 'white';
    if (c === colour) return;
    colour = c;
    mats.forEach((m, k) => {
      m.map?.dispose();
      m.map = new THREE.CanvasTexture(faceCanvas(FACE_V[k], COLOURS[c]));
      m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = aniso;
      m.needsUpdate = true;
    });
    L('dice colour', { colour: c });
    wake();
  }
  const dieGeo = new RoundedBoxGeometry(1, 1, 1, 4, CORNER);
  const ringGeo = new THREE.RingGeometry(.66, .84, 48);
  const dice = [];
  for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(dieGeo, mats);
    mesh.castShadow = true;
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: RING[1], transparent: true, opacity: 0 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .012;
    scene.add(mesh, ring);
    dice.push({ i, mesh, ring, pos: v3((i - 2) * DIE_GAP, 0, 0), quat: upright(i + 1), lift: 0, anim: null, move: null, hop: null });
  }

  const cup = new THREE.Group();
  {
    const leather = new THREE.MeshStandardMaterial({ color: 0x7B3B27, roughness: .65, side: THREE.DoubleSide });
    const inside = new THREE.MeshStandardMaterial({ color: 0x2E140C, roughness: .9, side: THREE.DoubleSide });
    const h = CUP_H / 2, v2 = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(v2([[0, -h], [.72, -h], [.8, -h + .07], [.9, h - .04], [.9, h], [.82, h]]), 48), leather);
    const lining = new THREE.Mesh(new THREE.LatheGeometry(v2([[.82, h], [.74, -h + .14], [0, -h + .14]]), 48), inside);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.885, .04, 10, 48), new THREE.MeshStandardMaterial({ color: 0xD3A548, roughness: .35, metalness: .4 }));
    band.rotation.x = Math.PI / 2; band.position.y = h - .2;
    body.castShadow = band.castShadow = true;
    cup.add(body, lining, band);
    cup.visible = false;
    scene.add(cup);
  }
  let cupPlan = null;

  /* ---------- the turn ---------- */

  let clock = 0;
  const rolling = () => !!cupPlan || dice.some(d => d.anim);

  // Shows the roll just made: the dice `rolled` get view.dice's numbers.
  function roll(rolled, done) {
    const idx = rolled.flatMap((u, i) => (u ? [i] : []));
    const thrown = idx.map(i => dice[i]);
    // a die still sliding to the back row (a new turn) is thrown from where
    // it is: a slide left over would run after it lands and turn it back
    for (const d of thrown) {
      if (d.move) { d.pos = v3(d.mesh.position.x, 0, d.mesh.position.z); d.quat = qOf(d.mesh.quaternion); d.move = null; }
      d.hop = null;
    }
    const kept = dice.filter(d => !rolled[d.i]);
    // a kept die still lining up is put where it was going first
    for (const d of kept) settle(d);
    row = null; shown = null;
    justThrown = idx;
    const plan = planThrow({
      thrown: thrown.map(d => ({ i: d.i, pos: v3(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z), quat: qOf(d.mesh.quaternion) })),
      kept: kept.map(d => ({ i: d.i, pos: d.pos, quat: d.quat })),
      values: idx.map(i => view.dice[i]), places, now: clock,
    });
    for (const d of kept) { if (plan.moves[d.i]) d.move = plan.moves[d.i]; d.hop = null; }
    for (const d of thrown) { d.anim = plan.anims[d.i]; d.bounced = 0; }
    cupPlan = plan.cup;
    cupPlan.shook = false;
    rollDone = done;
    // where the dice will land: in front of the kept ones, anywhere clear
    // of them, or in rows; how far apart (1.75 with room to spare)
    L('spots', { where: plan.where, gap: plan.gap, kept: kept.length, tray: [places.ix, places.iz] });
    renderRoll();
    wake();
  }
  function landed() {
    const seen = dice.map(d => topFace(d.quat));
    const same = seen.every((v, i) => v === view.dice[i]);
    L('landed', { rules: view.dice, seen, same });
    const done = rollDone;
    rollDone = null;
    tidy();   // first, so a hop for five the same waits for it
    renderRoll();
    done?.();
  }

  /* ---------- the dice lined up: after a roll (Q53), a box (Q54) ---------- */

  // row: the dice standing in a row along the front ({ groups, backFree },
  // groups of die indices left to right), worked out again when the tray
  // changes. shown: a box's dice standing forward, with where every die
  // was (Undo puts them back) and the row before.
  let row = null, shown = null, justThrown = [], tidyUntil = 0;
  const LINE_T = .4;                 // s: a die's slide into a box's row
  const ONE_T = .7;                  // s: the rolled dice into the row in order, the kept row too
  const HOP_T = .45, HOP_STAG = .09;  // a scoring die's hop, one after another
  // The robot waits this much longer after scoring, for its dice to show
  // (five-dice-game.js; 2.4 s in all, as in the mockup): the slide, the
  // hops, a moment to look.
  const SHOW_MS = 900;
  const r2 = x => Math.round(x * 100) / 100;
  // A die still sliding is put where it was going (after the slide that
  // follows it, if any: then).
  function settle(d) {
    let m = d.move;
    while (m?.then) m = m.then;
    if (m) { d.pos = { ...m.p1 }; d.quat = m.q1; d.move = null; }
  }
  const spot = s => v3(s.x, 0, s.z);
  const lineFor = (r, groups) => lineUp({ groups: groups ?? r.groups, places, backFree: r.backFree });

  // Q53: the dice just rolled go to a row centred along the front, square
  // to the front; the kept dice stay along the back. Every die rolled
  // leaves the back row free. Q56, in one step (since 7.3): each rolled
  // die goes straight to its place in order, smallest to highest, going
  // over the others where their ways would meet (intoRow); the kept row
  // puts itself in order where it stands at the same time (sortRow).
  function tidy() {
    if (!justThrown.length) return;
    const ds = justThrown.map(i => dice[i]).sort((a, b) => a.pos.x - b.pos.x);
    const kept = dice.filter(d => !justThrown.includes(d.i));
    justThrown = [];
    const r = { groups: [ds.map(d => d.i)], backFree: ds.length === 5 };
    const line = lineFor(r);
    if (!line) return L('line up: no row', { dice: r.groups[0], tray: [places.ix, places.iz] });
    const back = inOrderRow(kept, clock);
    // the kept dice as the rolled ones must miss them: their sort, or still
    const others = kept.map(d => { let m = d.move; while (m?.then) m = m.then; return m?.t0 === clock ? m : { pos: d.pos }; });
    for (const d of ds) settle(d);
    const into = intoRow({ ds: ds.map(d => ({ value: view.dice[d.i], pos: d.pos, quat: d.quat })), spots: line.spots.map(spot), others, dur: ONE_T });
    ds.forEach((d, k) => { d.move = { ...into.moves[k], t0: clock }; });
    const order = into.order.map(k => ds[k].i);
    r.groups = [order];
    row = r;
    tidyUntil = clock + ONE_T;
    L('line up', {
      landed: ds.map(d => d.i), z: r2(line.z), gap: line.gap, x: line.spots.map(s => r2(s.x)),
      order, shows: order.map(i => view.dice[i]), heights: into.heights,
      over: Object.fromEntries(ds.map((d, k) => [d.i, r2(into.moves[k].over)])),
      back: back.order, backShows: back.order.map(i => view.dice[i]), backMoved: back.moved, backLayers: back.layers,
    });
    wake();
  }
  // A row of dice (each where it will be at t0, after any slide it's on)
  // put in order from t0, each slide after the one it's on. Returns the
  // dice left to right once in order, how many move, and the heights used.
  function inOrderRow(ds, t0) {
    const at = d => { let m = d.move; while (m?.then) m = m.then; return m ? { pos: m.p1, quat: m.q1 } : { pos: d.pos, quat: d.quat }; };
    const now = ds.map(at);
    const { moves, layers } = sortRow(ds.map((d, k) => ({ value: view.dice[d.i], pos: now[k].pos })));
    let moved = 0;
    ds.forEach((d, k) => {
      const { to, over } = moves[k], { pos, quat } = now[k];
      if (!over && flat(pos, to) < .05) return;
      if (flat(pos, to) >= .05) moved++;
      const m = { t0, dur: ONE_T, p0: { ...pos }, p1: spot(to), q0: quat, q1: quat, over };
      if (d.move) { let last = d.move; while (last.then) last = last.then; last.then = m; } else d.move = m;
    });
    const order = ds.map((d, k) => [d.i, moves[k].to.x]).sort((a, b) => a[1] - b[1]).map(([i]) => i);
    return { order, moved, layers };
  }

  // Q54: a box just scored: the dice that make its score stand forward in
  // a row, grouped as its picture, and hop once, one after another; the
  // others step back to the back row. A box scoring 0 moves nothing.
  function showScored(box) {
    for (const d of dice) settle(d);
    const groups = showBox(box, view.dice);
    if (!groups.length) return L('show box', { box, dice: 'none (0 points)' });
    // dice of one number keep their left-to-right order
    const ordered = groups.map(g => [...g].sort((a, b) => view.dice[a] - view.dice[b] || dice[a].pos.x - dice[b].pos.x));
    const counted = ordered.flat(), rest = dice.filter(d => !counted.includes(d.i)).sort((a, b) => a.pos.x - b.pos.x);
    const r = { groups: ordered, backFree: !rest.length };
    const line = lineFor(r);
    if (!line) return L('show box: no row', { box, groups: ordered });
    shown = { box, was: dice.map(d => ({ pos: { ...d.pos }, quat: { ...d.quat } })), row };
    row = r;
    const back = backRow(rest.length, places.backZ);
    counted.forEach((i, j) => {
      const d = dice[i];
      d.move = slide(d, spot(line.spots[j]), clock, LINE_T);
      d.hop = { t0: clock + LINE_T + .1 + j * HOP_STAG };
    });
    rest.forEach((d, j) => { if (flat(d.pos, back[j]) > .05) d.move = slide(d, back[j], clock, LINE_T); });
    L('show box', { box, groups: ordered, back: rest.map(d => d.i), z: r2(line.z), gap: line.gap, x: line.spots.map(s => r2(s.x)) });
    wake();
  }
  // Undo: every die back where it was before the box.
  function unshow() {
    if (!shown) return;
    const { was } = shown;
    row = shown.row;
    shown = null;
    for (const d of dice) {
      settle(d);
      d.hop = null;
      const w = was[d.i];
      if (flat(d.pos, w.pos) > .05) d.move = { t0: clock, dur: LINE_T, p0: { ...d.pos }, p1: { ...w.pos }, q0: { ...d.quat }, q1: w.quat };
      else { d.pos = w.pos; d.quat = w.quat; }
    }
    L('show box undone');
    wake();
  }
  // The tray changed (the screen turned): the rows lined up are worked out
  // again for the new tray, straight to their places.
  function reline() {
    if (!row && !shown?.row) return;
    if (row) {
      const line = lineFor(row);
      if (line) row.groups.flat().forEach((i, j) => { settle(dice[i]); dice[i].pos = spot(line.spots[j]); });
      L('lined up again', { dice: row.groups, z: line && r2(line.z), found: !!line });
    }
    if (shown?.row) {
      const line = lineFor(shown.row);
      if (line) shown.row.groups.flat().forEach((i, j) => { shown.was[i].pos = spot(line.spots[j]); });
    }
  }

  // Stops a roll being shown: every die straight to where it was going,
  // the cup away. (Play again, New game: a quick tap mid-roll.)
  function stop() {
    for (const d of dice) {
      if (d.anim) { d.pos = { ...d.anim.to }; d.quat = d.anim.qT; d.anim = null; d.lift = 0; }
      settle(d);
      d.hop = null;
    }
    cupPlan = null;
    cup.visible = false;
    rollDone = null;
    row = null; shown = null; justThrown = [];
    wake();
  }

  // A turn's start: the dice wait in a row along the back, not rolled.
  function newTurn() {
    if (!places) return;
    row = null; shown = null; justThrown = [];
    backRow(5, places.backZ).forEach((p, j) => {
      const d = dice[j];
      settle(d);
      d.hop = null;
      if (Math.hypot(d.pos.x - p.x, d.pos.z - p.z) > .05) d.move = slide(d, p, clock);
    });
    wake();
  }

  // The dice where they'd be with nothing moving: waiting along the back,
  // or (a game picked up again) lined up along the front showing their
  // numbers, as after a roll.
  let placed = false;
  function place(v) {
    placed = true;
    row = null; shown = null; justThrown = [];
    if (v.wait) {
      backRow(5, places.backZ).forEach((p, j) => { dice[j].pos = p; });
      return;
    }
    const r = { groups: [[0, 1, 2, 3, 4].sort((a, b) => v.dice[a] - v.dice[b] || a - b)], backFree: true }, line = lineFor(r);
    if (line) row = r;
    const spots = line?.spots ?? pickSpots({ n: 5, fixed: [], places, kept: 0 })?.spots ?? backRow(5, places.backZ);
    r.groups[0].forEach((i, j) => { dice[i].pos = v3(spots[j].x, 0, spots[j].z); dice[i].quat = upright(v.dice[i], spots[j].yaw ?? 0); });
    L('dice placed', { dice: v.dice, lined: !!line });
  }

  function show(setup) {
    setColour(setup.colour);
    placed = false;
  }

  function render(v) {
    view = v;
    for (const d of dice) d.ring.material.color.setHex(RING[v.turn] ?? RING[1]);
    if (!placed && places) place(v);
    // five the same: the dice hop, one after another, once lined up
    if (v.yay && !lastYay) dice.forEach((d, j) => { d.hop = { t0: Math.max(clock, tidyUntil) + j * .08 }; });
    lastYay = v.yay;
    // a box just scored: its dice show it (Q54; Undo: undone)
    if (v.scored && v.scored !== lastScored && placed) showScored(v.scored);
    lastScored = v.scored ?? null;
    renderRoll();
    wake();
  }

  // Roll over the tray (Q55), greyed while the dice roll; Undo for a few
  // seconds after scoring.
  function renderRoll() {
    if (!view) return;
    const b = rollBtn;
    if (view.showUndo) {
      b.className = 'roll undo'; b.disabled = false; b.style.setProperty('--undo', `${UNDO_MS}ms`);
      b.innerHTML = '↩<small>Undo</small>';
      b.setAttribute('aria-label', 'Undo');
      b.onclick = tapUndo;
      return;
    }
    const n = view.up.filter(Boolean).length, out = rolling();
    b.className = 'roll' + (view.canRoll && !out && (view.rolls === 0 || n) ? ' nudge' : '');
    b.disabled = !view.canRoll || out;
    b.innerHTML = 'Roll<span class="pips">' + [0, 1, 2].map(k => `<i class="${k < view.rolls ? 'used' : ''}"></i>`).join('') + '</span>';
    b.setAttribute('aria-label', `Roll, ${view.left} left`);
    b.onclick = tapRoll;
  }

  // A tap on a die picks it up or puts it back (five-dice-game.js decides).
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener('pointerdown', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(dice.map(d => d.mesh))[0];
    if (!hit) return L('tap on the tray, no die');
    const d = dice.find(x => x.mesh === hit.object);
    if (rolling()) return L('die tap ignored', { die: d.i, why: 'still landing' });
    tapDie(d.i);
  });
  // Two quick taps on a die (pick it, put it back) could zoom the iPhone
  // in (developer, 2026-11-08, after 7.4: the screen "zoom in" a couple of
  // times): touch-action alone doesn't stop the double-tap zoom (Find the
  // Stars, 2026-10-13), cancelling each touch's end does, as on every
  // other game's board. The taps above are pointer events, which still
  // come; the canvas is never redrawn, so the end always reaches it.
  let lastEnd = 0;
  canvas.addEventListener('touchend', e => {
    if (!e.cancelable) return;
    e.preventDefault();
    if (e.timeStamp - lastEnd < 400) L('quick second tap: zoom blocked', { ms: Math.round(e.timeStamp - lastEnd) });
    lastEnd = e.timeStamp;
  }, { passive: false });

  /* ---------- drawing ---------- */

  const qOf = q => ({ x: q.x, y: q.y, z: q.z, w: q.w });
  const setPose = (d, p, q) => { d.mesh.position.set(p.x, p.y, p.z); d.mesh.quaternion.set(q.x, q.y, q.z, q.w); };
  // Moves die d on by dt; true while it's still moving.
  function update(d, dt) {
    const a = d.anim;
    if (a) {
      const s = throwPose(a, clock - a.t0);
      d.mesh.visible = s.visible;
      if (s.phase === 'done') { d.anim = null; d.lift = 0; d.pos = { ...a.to }; d.quat = a.qT; }
      else {
        setPose(d, s.p, s.q);
        d.ring.material.opacity = s.ring * .95 * d.lift;
        // the first time it hits the felt: a clack (the bounces after it in the sound)
        if (s.phase === 'fly' && !d.bounced && s.tt >= a.b.list[0].t) { d.bounced = 1; sound.play('clack'); }
        return true;
      }
    }
    if (d.move) {
      const s = slidePose(d.move, clock - d.move.t0);
      setPose(d, s.p, s.q);
      if (s.done) { d.pos = { ...d.move.p1 }; d.quat = d.move.q1; d.move = d.move.then ?? null; }
      return true;
    }
    const up = view?.up[d.i] ? 1 : 0;
    d.lift += (up - d.lift) * Math.min(1, dt * 12);
    if (Math.abs(up - d.lift) < .002) d.lift = up;
    const s = restPose(d.pos, d.quat, d.lift);
    let hopping = false;
    if (d.hop) {
      const k = (clock - d.hop.t0) / .45;
      if (k >= 1) d.hop = null;
      else if (k > 0) { s.p.y += .6 * Math.sin(Math.PI * k); hopping = true; }
      else hopping = true;
    }
    setPose(d, s.p, s.q);
    d.mesh.visible = true;
    d.ring.position.x = d.pos.x; d.ring.position.z = d.pos.z;
    d.ring.material.opacity = .95 * d.lift;
    return hopping || d.lift !== up;
  }
  function updateCup() {
    if (!cupPlan) return false;
    const t = clock - cupPlan.t0, s = cupPose(cupPlan, t, places);
    if (s.shaking && !cupPlan.shook) { cupPlan.shook = true; sound.play('shake'); }
    cup.visible = s.visible;
    cup.position.set(s.pos.x, s.pos.y, s.pos.z);
    cup.quaternion.set(s.quat.x, s.quat.y, s.quat.z, s.quat.w);
    cup.scale.setScalar(s.scale);
    if (!s.visible) { cupPlan = null; renderRoll(); }
    return true;
  }

  // Frames are drawn only while something moves (a roll, a slide, a die
  // lifting, a hop), so a waiting tray costs nothing. A page that gets no
  // animation frames (the built-in browser's pane hidden: the first roll
  // never landed, 0 frames in 3 s) gets them from a timer instead, as in
  // the mockup.
  let last = 0, running = false, wasRolling = false, frames = 0, timerFrames = false;
  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt;
    let moving = false;
    for (const d of dice) moving = update(d, dt) || moving;
    moving = updateCup() || moving;
    const r = rolling();
    if (wasRolling && !r) landed();
    wasRolling = r;
    // landing starts the line-up in this very frame (without this the
    // drawing stopped with the slides pending: mockup v1)
    if (dice.some(d => d.move)) moving = true;
    renderer.render(scene, camera);
    frames++;
    return moving || r;
  }
  // one chain of frames at a time: a late animation frame after the
  // timer took over is dropped
  let chain = 0;
  const nextFrame = id => (timerFrames ? setTimeout(() => loop(performance.now(), id), 16) : requestAnimationFrame(now => loop(now, id)));
  function loop(now, id) {
    if (id !== chain) return;
    if (frame(now)) nextFrame(id);
    else running = false;
  }
  function wake() {
    if (running || !cam) return;
    running = true;
    last = performance.now();
    const before = frames;
    nextFrame(++chain);
    if (!timerFrames) setTimeout(() => {
      if (frames > before || !running) return;
      timerFrames = true;
      L('no animation frames: a timer draws them');
      nextFrame(++chain);
    }, 300);
  }

  /* ---------- the camera, and fitting the play screen ---------- */

  // The layouts tried: one column (the tray over the sheet); sideways, the
  // tray over the sheet in the middle column (a tablet), or (a phone) the
  // tray in the right column under the turn line with the sheet in the
  // middle, Play again / New game in the left column between the 🏠 and
  // the 🔊 and the scoreboard upright beside the sheet (option A of play
  // screen mockup v2), so nothing scrolls. One column is tried with Roll
  // over the tray and (tall-rollside) beside it at its right (Q55: over it,
  // an upright phone's dice were 22px, 35 in 7.1). Each is fitted for the
  // biggest dice and score rows together; the biggest wins (a tie: the
  // first tried).
  const MIN_ROW = 28, MAX_ROW = 64, MIN_TRAY = 90, STAGE_MAX = 760;
  const play = $('play'), stage = $('stage'), board = $('scoreboard');
  function applyLayout(kind) {
    const tall = kind.startsWith('tall'), side = kind === 'side';
    setWide(!tall);
    document.body.classList.toggle('tray-side', side);
    document.body.classList.toggle('roll-side', kind === 'tall-rollside');
    if (side) play.insertBefore(trayBox, stage);
    else if (trayBox.parentElement !== stage) stage.prepend(trayBox);
    if (side) stage.append(board);
    else if (board.parentElement !== play) stage.after(board);
    if (!tall) play.style.setProperty('--stagew', `${Math.min(wideRoom(), STAGE_MAX)}px`);
  }
  const setRow = r => play.style.setProperty('--row', `${r}px`);
  const setTrayH = h => play.style.setProperty('--trayh', `${h}px`);
  const fits = () => document.documentElement.scrollWidth <= innerWidth && pageHeight() <= innerHeight + .5;
  // The tallest tray with which the page still fits, or 0. The page grows
  // with the tray px for px (while the tray's column is the tallest), so
  // the room left with no tray is tried first, and then the 2px over it;
  // only when that's wrong is the range halved (9 page layouts a try:
  // 521 ms for a sideways tablet's three layouts).
  function tallestTray() {
    setTrayH(0);
    if (!fits()) return 0;
    let lo = 0, hi = innerHeight;
    const guess = Math.floor(innerHeight - pageHeight());
    if (guess > 0 && guess < hi) {
      setTrayH(guess);
      if (fits()) { lo = guess; setTrayH(guess + 2); if (!fits()) return guess; }
      else hi = guess;
    }
    while (hi - lo > 2) { const mid = Math.floor((lo + hi) / 2); setTrayH(mid); if (fits()) lo = mid; else hi = mid; }
    return lo;
  }
  function tryLayout(kind) {
    applyLayout(kind);
    const best = bestRow(MIN_ROW, MAX_ROW, 2, r => {
      setRow(r);
      const T = tallestTray();
      if (T < MIN_TRAY) return null;
      setTrayH(T);
      const W = tray.clientWidth, s = trayShape(W, T);
      return { die: s.die, T, W, shape: s };
    });
    return best && { kind, ...best };
  }
  // Fitted with the longest words the turn line says in place, so none
  // makes the page scroll later (an upright phone, 393 x 760, fitted with
  // two lines scrolled when these took three).
  const LONGEST = PICK_WORDS.more;
  // Roll's size, from the screen, set before fitting (it takes height from
  // the tray and sheet; sized from the dice after, the page could no
  // longer fit).
  function sizeRoll() {
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const h = Math.round(clamp(Math.min(innerWidth, innerHeight) * .13, 44, 64));
    play.style.setProperty('--rollh', `${h}px`);
    play.style.setProperty('--rollw', `${Math.round(h * 3.3)}px`);
    play.style.setProperty('--rollfont', `${Math.round(h * .42)}px`);
    // beside the tray: a column, about 64 x 122 on a phone
    play.style.setProperty('--rollsw', `${Math.round(clamp(innerWidth * .16, 56, 76))}px`);
    play.style.setProperty('--rollsh', `${Math.round(h * 2.4)}px`);
    return h;
  }
  function fit() {
    const t0 = performance.now();
    const rollH = sizeRoll();
    const turn = $('turn'), said = turn.innerHTML, cls = turn.className;
    turn.className = 'turn';
    turn.innerHTML = `<span class="chip"></span><span class="say">${LONGEST}</span>`;
    const kinds = innerWidth > innerHeight ? ['tall', 'tall-rollside', 'mid', 'side'] : ['tall', 'tall-rollside'];
    const tried = kinds.map(tryLayout);
    const pick = tried.reduce((a, b) => ((b?.value ?? -1) > (a?.value ?? -1) ? b : a), null);
    const kind = pick?.kind ?? 'tall';
    applyLayout(kind);
    setRow(pick?.row ?? MIN_ROW);
    const h = pick ? Math.min(pick.T, pick.shape.needH) : 200;
    setTrayH(h);
    if (pick) setTray(pick.shape.ix, pick.shape.iz);
    else setTray(TRAY.xRange[1], TRAY.zRange[0]);
    turn.innerHTML = said;
    turn.className = cls;
    sizeCanvas();
    if (view && !placed) place(view);
    else reline();
    wake();
    if (!running) renderer.render(scene, camera);
    return {
      screen: `${innerWidth}x${innerHeight}`, layout: kind, row: pick?.row, tray: [tray.clientWidth, h], die: pick?.die, rollH,
      shape: pick && [pick.shape.ix, pick.shape.iz], scrolls: document.documentElement.scrollHeight > innerHeight + 1,
      tried: tried.map(r => r && { kind: r.kind, row: r.row, die: r.die, tries: r.tries }), ms: Math.round(performance.now() - t0),
    };
  }
  function sizeCanvas() {
    const w = tray.clientWidth, h = tray.clientHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    cam = aim(aspect, trayCorners(places.ix, places.iz));
    camera.aspect = aspect;
    camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    camera.lookAt(cam.look.x, cam.look.y, cam.look.z);
    camera.updateProjectionMatrix();
  }

  L('3D ready', { webgl2: renderer.capabilities.isWebGL2, revision: THREE.REVISION, pixelRatio: renderer.getPixelRatio() });
  // for checking from the console
  window.dice3d = { dice, places: () => places, camera: () => cam, frames: () => frames, rolling, row: () => row, shown: () => shown };
  return { render, roll, stop, newTurn, show, fit, undone: unshow, scoreShowMs: SHOW_MS };
}
