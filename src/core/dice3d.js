// Five Dice 3D's tray: the maths of its dice, cup and camera (DESIGN.md
// "3D games"), from the play screen mockup v2 (play3d.js) and the tray
// mockup v2's throw. No DOM, and no three.js: plain vectors { x, y, z } and
// quaternions { x, y, z, w }, so the tests run it under Node; src/ui/tray3d.js
// copies the results into three.js's objects to draw them.
//
// The rules (src/core/five-dice.js) pick the numbers; each tumble is
// steered to land on them: a die's turn runs back from the pose that shows
// its number, so the throw always ends there.
//
// The tray is centred on the origin, the felt at y = 0, x across and z
// towards the camera; a die is 1 across. Times are in seconds.

/* ---------- vectors ---------- */

export const v3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const add = (a, b) => v3(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a, b) => v3(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a, s) => v3(a.x * s, a.y * s, a.z * s);
export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a, b) => v3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const len = a => Math.hypot(a.x, a.y, a.z);
export const norm = a => scale(a, 1 / (len(a) || 1));
export const lerp = (a, b, t) => v3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
// The distance between two points seen from above (y left out).
export const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const UP = v3(0, 1, 0);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = x => x * x * (3 - 2 * x);

/* ---------- quaternions (as three.js's Quaternion) ---------- */

export const Q0 = { x: 0, y: 0, z: 0, w: 1 };
export function qAxis(axis, angle) {
  const s = Math.sin(angle / 2), a = norm(axis);
  return { x: a.x * s, y: a.y * s, z: a.z * s, w: Math.cos(angle / 2) };
}
// a then turned by b's frame: three.js's a.multiply(b).
export function qMul(a, b) {
  return {
    x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
    y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
    z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}
function qNorm(q) {
  const l = Math.hypot(q.x, q.y, q.z, q.w) || 1;
  return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l };
}
// v turned by q.
export function qRotate(q, v) {
  const u = v3(q.x, q.y, q.z), t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q.w)), cross(u, t));
}
// The turn from unit vector a to unit vector b (three.js's setFromUnitVectors).
export function qFromUnitVectors(a, b) {
  let r = dot(a, b) + 1;
  if (r < 1e-8) {
    r = 0;
    return qNorm(Math.abs(a.x) > Math.abs(a.z) ? { x: -a.y, y: a.x, z: 0, w: r } : { x: 0, y: -a.z, z: a.y, w: r });
  }
  const c = cross(a, b);
  return qNorm({ x: c.x, y: c.y, z: c.z, w: r });
}
export function qSlerp(a, b, t) {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let c = b;
  if (cos < 0) { c = { x: -b.x, y: -b.y, z: -b.z, w: -b.w }; cos = -cos; }
  if (cos > 0.9995) return qNorm({ x: a.x + (c.x - a.x) * t, y: a.y + (c.y - a.y) * t, z: a.z + (c.z - a.z) * t, w: a.w + (c.w - a.w) * t });
  const th = Math.acos(cos), s = Math.sin(th), ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
  return { x: a.x * ka + c.x * kb, y: a.y * ka + c.y * kb, z: a.z * ka + c.z * kb, w: a.w * ka + c.w * kb };
}
// A turn picked evenly from every turn there is.
export function qRandom(rand = Math.random) {
  const u = rand(), a = Math.sqrt(1 - u), b = Math.sqrt(u), t1 = 2 * Math.PI * rand(), t2 = 2 * Math.PI * rand();
  return { x: a * Math.sin(t1), y: a * Math.cos(t1), z: b * Math.sin(t2), w: b * Math.cos(t2) };
}

/* ---------- a die ---------- */

// Each face's number and its outward direction on the die, in three.js's
// box face order (+x, -x, +y, -y, +z, -z); opposite faces add up to 7.
export const FACES = [
  { v: 2, n: v3(1, 0, 0) }, { v: 5, n: v3(-1, 0, 0) },
  { v: 1, n: v3(0, 1, 0) }, { v: 6, n: v3(0, -1, 0) },
  { v: 3, n: v3(0, 0, 1) }, { v: 4, n: v3(0, 0, -1) },
];
export const CORNER = 0.09;   // the die's rounded corners
export const DIE_GAP = 1.3;   // dice standing in a row: centre to centre

// A die showing v on top, turned yaw about the upright.
export function upright(v, yaw = 0) {
  const f = FACES.find(x => x.v === v);
  if (!f) throw new Error(`no face ${v}`);
  return qMul(qAxis(UP, yaw), qFromUnitVectors(f.n, UP));
}
// The number on top of a die turned q.
export function topFace(q) {
  let best = null, bestY = -2;
  for (const f of FACES) { const y = qRotate(q, f.n).y; if (y > bestY) { bestY = y; best = f.v; } }
  return best;
}
// How high a die turned q stands its centre to touch the felt: 0.5 flat
// on a face, more on an edge or a corner.
export function support(q) {
  const k = .5 - CORNER;
  return k * (Math.abs(qRotate(q, v3(1, 0, 0)).y) + Math.abs(qRotate(q, v3(0, 1, 0)).y) + Math.abs(qRotate(q, v3(0, 0, 1)).y)) + CORNER;
}

/* ---------- the tray and the cup ---------- */

// The inside's half width (ix) and half depth (iz) are picked for the room
// on the screen (trayShape), from these ranges in these steps.
export const TRAY = { rim: 0.36, rimH: 0.55, xRange: [3.3, 4.1], xStep: 0.4, zRange: [1.8, 2.7], zStep: 0.3 };
export const CUP_H = 1.4;
export const TIP = 115 * Math.PI / 180;   // the cup tipped this far, pouring

// What the camera keeps in view: the tray's corners, and the tops of dice
// standing in the back row (they rise above the back rim).
export function trayCorners(ix, iz) {
  const { rim, rimH } = TRAY, out = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [0, rimH]) out.push(v3(x * (ix + rim), y, z * (iz + rim)));
  for (const x of [-1, 1]) out.push(v3(x * (ix - .2), 1.08, -iz + .2));
  return out;
}

// Where things go in a tray: the kept dice's row along the back (its z),
// the cup over the front right, tipping towards the back left (pour: the
// way it tips, flat; cupAxis: the turn's axis), and the cup's mouth once
// tipped.
export function trayPlaces(ix, iz) {
  const backZ = -iz + .72;
  const cupAt = v3(ix - 1.6, 1.95, iz - 1.3);
  const pour = norm(v3(-1 - cupAt.x, 0, -.2 - cupAt.z));
  const cupAxis = norm(cross(UP, pour));
  const mouth = add(qRotate(qAxis(cupAxis, TIP), v3(0, CUP_H / 2, 0)), cupAt);
  return { ix, iz, backZ, cupAt, pour, cupAxis, mouth };
}

// n dice standing in a row along the back, left to right.
export const backRow = (n, backZ) => Array.from({ length: n }, (_, j) => v3((j - (n - 1) / 2) * DIE_GAP, 0, backZ));

/* ---------- where thrown dice come to rest ---------- */

// Whether two dice resting at a and b ({ x, z, yaw }) are at least `m`
// apart: seen from above each is a square (1 across, yaw turned; a quarter
// turn looks the same), apart if some side of either has a gap between
// them along it. Spots apart by the gap alone could still touch: a die's
// corner reaches 0.67 from its centre, and the gap can shrink to 1.05.
export function apart(a, b, m = .06) {
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const yaw of [a.yaw ?? 0, b.yaw ?? 0]) for (const t of [yaw, yaw + Math.PI / 2]) {
    const ax = Math.cos(t), az = Math.sin(t), reach = s => .5 * (Math.abs(Math.cos(s - t)) + Math.abs(Math.sin(s - t)));
    if (Math.abs(dx * ax + dz * az) >= reach(a.yaw ?? 0) + reach(b.yaw ?? 0) + m) return true;
  }
  return false;
}

// In front of the kept dice (`fixed`: where they'll stand), clear of them
// and of each other, past the cup, and not under the Roll button
// (blocked(spot): the screen's check, on its projection), with a clear
// last stretch from the cup's mouth. A shallow tray has less room, so the
// gap shrinks until they fit (and, last, the clear stretch is dropped).
// The spots are picked one at a time, so the first can leave no room for
// the last: each gap gets SETS fresh starts before it shrinks (with one,
// the shallowest tray, an upright phone's, found room for 4 dice beside 1
// kept only 21-24 times in 50). front: only in front of the kept dice's
// row (false: anywhere clear of them). Returns { spots, gap, sets }, or
// null when no room was found.
const SETS = 8;
export function pickSpots({ n, fixed, places, kept, blocked = () => false, rand = Math.random, front = true }) {
  const { ix, iz, backZ, cupAt, pour, mouth } = places;
  const zMin = kept && front ? backZ + 1.15 : -iz + .7, zMax = iz - .6;
  const fits = (to, gap) => dot(v3(to.x - mouth.x, 0, to.z - mouth.z), pour) > 1.0
    && flat(to, cupAt) > Math.min(1.7, gap + .3) && !blocked(to);
  for (let gap = 1.75; gap > 1.04; gap -= .1) for (let set = 1; set <= SETS; set++) {
    const spots = [];
    let ok = true;
    for (let k = 0; k < n && ok; k++) {
      ok = false;
      for (let tries = 0; tries < 150 && !ok; tries++) {
        const to = { ...v3(-ix + .7 + rand() * (2 * ix - 1.4), 0, zMin + rand() * (zMax - zMin)), yaw: rand() * Math.PI * 2 };
        if (!fits(to, gap)) continue;
        if ([...spots, ...fixed].some(s => flat(s, to) < gap || !apart(s, to))) continue;
        let clear = true;
        for (let s = .5; s <= 1.0001 && clear && gap > 1.3; s += .05) {
          const p = lerp(mouth, to, s);
          if (fixed.some(q => flat(q, p) < 1.25)) clear = false;
        }
        if (clear) { spots.push(to); ok = true; }
      }
    }
    if (ok) return { spots, gap: Math.round(gap * 100) / 100, sets: set };
  }
  return null;
}

// No room found: two staggered rows left of the cup, square to the front.
export function fallbackSpots({ n, places, kept }) {
  const { ix, iz, backZ, cupAt } = places;
  const x0 = -ix + .7, x1 = cupAt.x - 1.4, z0 = kept ? backZ + 1.15 : -iz + .7, z1 = iz - .6;
  return Array.from({ length: n }, (_, k) => ({ ...v3(x0 + (x1 - x0) * (n > 1 ? k / (n - 1) : .5), 0, k % 2 ? z1 : z0), yaw: 0 }));
}

/* ---------- dice lined up (Q53, Q54) ---------- */

// After a roll the dice just rolled line up at the front (Q53), and when a
// box is picked the dice that score it stand in a row there, grouped like
// the box's picture (Q54; src/core/showbox.js). From the dice moves mockup
// (developer, 2026-11-08: "line up at front", "Dice show score").
// Spacing tried in turn: centre to centre, and the extra gap between
// groups. An upright phone's tray (3.7 x 1.8) has no room for 5 dice at
// 1.3 beside Roll in the middle; 1.2 fit (mockup v1).
export const ROW_GAPS = [[DIE_GAP, .45], [1.2, .35], [1.12, .28]];
const EDGE = .6;   // a die's centre this far in from the tray's sides

// A row across the tray at depth z for `groups` (die indices, each group
// left to right), centred, moved left a step at a time while a die would
// be under Roll (blocked(spot)); closer together when no spacing clears
// it. Returns { spots, gap } (spots in groups' order), or null.
export function rowAt(z, groups, places, blocked = () => false) {
  const n = groups.reduce((a, g) => a + g.length, 0);
  for (const [gap, extra] of ROW_GAPS) {
    const span = (n - 1) * gap + (groups.length - 1) * extra;
    const xs = [];
    let x = -span / 2;
    for (const g of groups) { for (let j = 0; j < g.length; j++) { xs.push(x); x += gap; } x += extra; }
    for (let shift = 0; shift <= places.ix; shift += .1) {
      const spots = xs.map(px => ({ ...v3(px - shift, 0, z), yaw: 0 }));
      // (centred, then only moved left: the left end is the one to check)
      if (spots[0].x < -places.ix + EDGE - 1e-9) break;
      if (!spots.some(s => blocked(s))) return { spots, gap };
    }
  }
  return null;
}

// Where a row goes: along the front; where Roll leaves no room there, from
// halfway back a step at a time, as far as the back row when no die stays
// in it (backFree), else 1.1 in front of it. (A sideways phone's tray, 780
// x 340: 5 dice fit neither at the front nor halfway beside Roll.) Returns
// { spots, gap, z }, or null when there's no room anywhere.
export function lineUp({ groups, places, blocked = () => false, backFree = false }) {
  const { iz, backZ } = places;
  const last = backFree ? backZ : backZ + 1.1;
  const zs = [iz - .62];
  for (let z = (backZ + iz - EDGE) / 2; z > last; z -= .25) zs.push(z);
  zs.push(last);
  for (const z of zs) {
    const r = rowAt(z, groups, places, blocked);
    if (r) return { ...r, z: Math.round(z * 1000) / 1000 };
  }
  return null;
}

/* ---------- a throw ---------- */

const BOUNCE = .42;
export const THROW_T = 1.25;   // a die's flight from the cup to rest
// A die dropped from `drop` landing at 0.3 T, then bouncing lower each
// time: the bounce times (t) and how hard each is (v, the first 1).
export function bounces(T, drop) {
  const t0 = .3 * T, g = 2 * drop / (t0 * t0), v0 = g * t0, list = [{ t: t0, v: 1 }];
  let tk = t0, v = v0 * BOUNCE;
  while (v > .12 * v0) { tk += 2 * v / g; list.push({ t: tk, v: v / v0 }); v *= BOUNCE; }
  return { drop, t0, g, v0, list };
}
export function heightAt(b, t) {
  if (t < b.t0) return b.drop - .5 * b.g * t * t;
  let tk = b.t0, v = b.v0 * BOUNCE;
  while (v > .12 * b.v0) {
    const dur = 2 * v / b.g;
    if (t < tk + dur) { const s = t - tk; return v * s - .5 * b.g * s * s; }
    tk += dur; v *= BOUNCE;
  }
  return 0;
}

// The cup's timings, from when Roll is tapped: the dice hop in, one after
// another (HOP each, STAG apart); it shakes, tips, pours, then rises away.
const HOP = .28, STAG = .05, IN0 = .12;
export function cupTimes(n) {
  const inEnd = IN0 + (n - 1) * STAG + HOP;
  const shake0 = inEnd + .02, shake1 = shake0 + .42, tip1 = shake1 + .22;
  return { shake0, shake1, tip1, out0: tip1 + .3, out1: tip1 + .65 };
}

// Plans a roll at time `now`. thrown: the dice rolled, { i, pos, quat }
// as drawn now, with values[k] the rules' number for thrown[k]; kept:
// the others, { i, pos, quat } at rest. Returns the cup's plan, each
// thrown die's flight (anims[i]), each kept die's slide to the back row
// (moves[i], only those not there yet), and how the spots were found
// (where: 'front' of the kept dice, anywhere in the 'tray' clear of them,
// or in 'rows'). With the dice kept from touching, the shallowest tray
// had room in front for 4 dice beside 1 kept only 1-3 times in 50: there
// they may land beside the kept one.
export function planThrow({ thrown, kept, values, places, blocked, rand = Math.random, now = 0 }) {
  const n = thrown.length;
  const keptSorted = [...kept].sort((a, b) => a.pos.x - b.pos.x);
  const keptTo = backRow(keptSorted.length, places.backZ);
  const ask = front => pickSpots({ n, fixed: keptTo, places, kept: keptSorted.length, blocked, rand, front });
  let where = 'front', found = ask(true);
  if (!found && keptSorted.length) { where = 'tray'; found = ask(false); }
  if (!found) where = 'rows';
  const spots = found?.spots ?? fallbackSpots({ n, places, kept: keptSorted.length });
  const moves = {};
  keptSorted.forEach((d, j) => {
    if (flat(d.pos, keptTo[j]) > .05) moves[d.i] = slide(d, keptTo[j], now);
  });
  const times = cupTimes(n);
  const cup = { t0: now, ...times };
  // the dice nearer the cup's far side leave first, so none crosses another
  const order = thrown.map((_, k) => k).sort((a, b) => dot(spots[a], places.cupAxis) - dot(spots[b], places.cupAxis));
  const anims = {};
  order.forEach((k, j) => {
    const d = thrown[k], to = spots[k], mid = j - (n - 1) / 2;
    const from = add(places.mouth, scale(places.cupAxis, mid * .3)); from.y = 0;
    const qT = upright(values[k], to.yaw);
    const dir = norm(v3(to.x - from.x, 0, to.z - from.z));
    anims[d.i] = {
      t0: now, T: THROW_T, p0: { ...d.pos }, q0: { ...d.quat }, from, to, qT, value: values[k],
      axis: norm(cross(UP, dir)), A: (1 + Math.floor(rand() * 2)) * Math.PI * 2 + rand() * Math.PI,
      axis2: norm(v3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)), B: .8 + rand(),
      b: bounces(THROW_T, Math.max(.5, places.mouth.y - .55)),
      inStart: IN0 + j * STAG, inDur: HOP, throwAt: times.tip1 - .08 + j * .07,
      hold: add(places.cupAt, v3(0, .1, 0)), qHold: qRandom(rand),
    };
  });
  return { cup, anims, moves, spots, gap: found?.gap ?? null, where };
}

// A die at rest sliding (with a little hop) to `to`, turned square to the front.
export function slide(d, to, now, dur = .45) {
  return { t0: now, dur, p0: { ...d.pos }, p1: { ...to }, q0: { ...d.quat }, q1: upright(topFace(d.quat), 0) };
}
// Where a sliding die is, t after its start (before it: where it starts);
// done at the end. A slide with `over` (sortRow's) rises that high in its
// first quarter, moves across in the middle half, and comes down in the
// last quarter; over 0 moves across on the felt in that same middle half.
export function slidePose(m, t) {
  const k = clamp(t / m.dur, 0, 1);
  if (m.over == null) {
    const e = ease(k), q = qSlerp(m.q0, m.q1, e), p = lerp(m.p0, m.p1, e);
    p.y = support(q) + .7 * Math.sin(Math.PI * k);
    return { p, q, done: k >= 1 };
  }
  const e = ease(clamp((k - .25) / .5, 0, 1)), up = Math.min(ease(clamp(k / .25, 0, 1)), ease(clamp((1 - k) / .25, 0, 1)));
  const q = qSlerp(m.q0, m.q1, e), p = lerp(m.p0, m.p1, e);
  p.y = support(q) + m.over * up;
  return { p, q, done: k >= 1 };
}

/* ---------- a row put in order (Q56) ---------- */

// Dice smallest to highest (developer, 2026-11-08: clearer which to roll
// again), dice of one number in their left-to-right order. ds: [{ value,
// pos }]; returns them sorted (a new array).
export const inOrder = ds => [...ds].sort((a, b) => a.value - b.value || a.pos.x - b.pos.x);

// A row of dice put in order where they stand: each die to the place of
// its number's order (the row's own places, so the row doesn't move). The
// longest run already in order slides along the felt; the others pass
// over them, and over each other, at heights by layer: each layer the
// longest run in order of those left, so no two dice of one layer ever
// cross. All move across together in the middle half of the move (none
// while any is rising), so a die can only meet one of its own layer,
// which it never passes. ds: [{ value, pos }] in one row. Returns
// [{ to, over }] for each of ds (to: its place, over: its height), and
// layers (how many heights: 1 when the row was in order already).
export const LAYER_UP = 1.2;   // a die is 1 high
// Each of ds's layer, and its place in order (rank), as above: layer 0
// the longest run (left to right) already in order, layer 1 the longest
// of those left, and so on.
function runLayers(ds) {
  const byX = ds.map((d, k) => k).sort((a, b) => ds[a].pos.x - ds[b].pos.x);
  const rank = new Map(inOrder(ds.map((d, k) => ({ ...d, k }))).map((d, j) => [d.k, j]));
  const layer = ds.map(() => 0);
  let left = byX, n = 0;
  while (left.length) {
    const best = left.map(() => 1), prev = left.map(() => -1);
    for (let a = 0; a < left.length; a++) for (let b = 0; b < a; b++)
      if (rank.get(left[b]) < rank.get(left[a]) && best[b] + 1 > best[a]) { best[a] = best[b] + 1; prev[a] = b; }
    let end = best.indexOf(Math.max(...best));
    const run = new Set();
    for (; end >= 0; end = prev[end]) run.add(left[end]);
    for (const k of run) layer[k] = n;
    left = left.filter(k => !run.has(k));
    n++;
  }
  return { byX, rank, layer, layers: n };
}
export function sortRow(ds) {
  const { byX, rank, layer, layers } = runLayers(ds);
  const places = byX.map(k => ds[k].pos);
  return { moves: ds.map((d, k) => ({ to: { ...places[rank.get(k)] }, over: layer[k] * LAYER_UP })), layers };
}

// Whether two dice ever meet on their way: a and b slides started
// together, or { pos } a die standing still. Checked at n points (a die
// moves at most about 0.1 between two): closer across than 1.05 (a die is
// 1) and under 1 apart in height. Dice already that close where they
// start or end (they don't touch) count only if they come closer.
const poseAt = (x, t) => (x.p1 ? slidePose(x, t).p : { ...x.pos, y: .5 });
export function slidesMeet(a, b, n = 120) {
  const T = Math.max(a.dur ?? 0, b.dur ?? 0);
  const ends = [0, T].map(t => flat(poseAt(a, t), poseAt(b, t)));
  const near = Math.min(1.05, ...ends) - 1e-6;
  for (let s = 0; s <= n; s++) {
    const pa = poseAt(a, s / n * T), pb = poseAt(b, s / n * T);
    if (flat(pa, pb) < near && Math.abs(pa.y - pb.y) < 1) return true;
  }
  return false;
}

// Q56 in one step (developer, 2026-11-08: "they move into their sorted
// order instead of 'jumping' around"): the dice just rolled go from where
// they landed straight to their places in order along the row (until 7.2
// they lined up as they landed, then sorted). Each moves as sortRow's do
// (rising, across with all the others, down), turning square to the
// front, at the lowest height where it meets no die placed before it and
// none of `others` (the kept dice: slides from t 0, or { pos } standing
// still). Tried in sortRow's layer order, so the longest run already in
// order goes first, on the felt. ds: [{ value, pos, quat }]; spots: the
// row's places left to right, one per die. Returns moves (one slide per
// die, from t 0, dur long), order (ds's indices left to right once in
// place) and heights (how many used).
export function intoRow({ ds, spots, others = [], dur = .7 }) {
  const { rank, layer } = runLayers(ds);
  const moves = ds.map(() => null);
  const turns = ds.map((d, k) => k).sort((a, b) => layer[a] - layer[b] || ds[a].pos.x - ds[b].pos.x);
  let top = 0;
  for (const k of turns) {
    const d = ds[k];
    const m = { t0: 0, dur, p0: { ...d.pos, y: 0 }, p1: { ...spots[rank.get(k)], y: 0 }, q0: { ...d.quat }, q1: upright(topFace(d.quat), 0), over: 0 };
    delete m.p1.yaw;
    const placed = [...moves.filter(Boolean), ...others];
    for (let h = 0; h < ds.length + others.length + 2; h++) {
      m.over = h * LAYER_UP;
      if (!placed.some(o => slidesMeet(m, o))) break;
    }
    top = Math.max(top, m.over / LAYER_UP + 1);
    moves[k] = m;
  }
  const order = ds.map((d, k) => k).sort((a, b) => rank.get(a) - rank.get(b));
  return { moves, order, heights: Math.round(top) };
}

// A thrown die t after Roll: hopping into the cup (hidden once inside),
// waiting in it, then flying out and tumbling to rest on its number.
// ring: how much of its picked-up ring still shows (fading as it leaves).
export function throwPose(a, t) {
  if (t < a.throwAt) {
    if (t < a.inStart) return { p: { ...a.p0 }, q: { ...a.q0 }, visible: true, ring: 1, phase: 'wait' };
    const k = Math.min(1, (t - a.inStart) / a.inDur), e = ease(k), m = 1 - k;
    const ctl = v3(a.hold.x, a.hold.y + 1.9, a.hold.z);
    const p = add(add(scale(a.p0, m * m), scale(ctl, 2 * k * m)), scale(a.hold, k * k));
    return { p, q: qSlerp(a.q0, a.qHold, e), visible: k < .9, ring: 1 - e, phase: 'in' };
  }
  const tt = t - a.throwAt;
  if (tt >= a.T) return { p: { ...a.to }, q: { ...a.qT }, visible: true, ring: 0, phase: 'done', tt };
  const u = Math.min(1, tt / (.8 * a.T)), s = 1 - Math.pow(1 - u, 2.2);
  const ur = Math.min(1, tt / (.86 * a.T)), sr = 1 - Math.pow(1 - ur, 2.4);
  const q = qMul(qMul(qAxis(a.axis, -a.A * (1 - sr)), qAxis(a.axis2, a.B * Math.pow(1 - sr, 1.5))), a.qT);
  const p = lerp(a.from, a.to, s);
  p.y = support(q) + heightAt(a.b, tt);
  return { p, q, visible: true, ring: 0, phase: 'fly', tt };
}

// The cup t after Roll: popping up over the front right, shaking, tipping
// to pour, then rising away and shrinking. Hidden once done.
export function cupPose(P, t, places) {
  let wob = 0;
  if (t >= P.shake0 && t < P.shake1) wob = Math.sin((t - P.shake0) * 2 * Math.PI * 7);
  const pop = ease(Math.min(1, t / .18));
  const tip = TIP * ease(clamp((t - P.shake1) / (P.tip1 - P.shake1), 0, 1));
  const out = ease(clamp((t - P.out0) / .35, 0, 1));
  const pos = add(places.cupAt, scale(places.cupAxis, .12 * wob));
  pos.y += .1 * Math.abs(wob) + 1.4 * out;
  const quat = qMul(qAxis(places.cupAxis, tip * (1 - .5 * out)), qAxis(places.pour, .14 * wob));
  return { pos, quat, scale: Math.max(.001, (.4 + .6 * pop) * (1 - out)), visible: out < 1, shaking: t >= P.shake0 && t < P.shake1 };
}

// A die at rest, picked up by `lift` (0 down, 1 up): it rises and tilts.
const TILT = norm(v3(1, 0, -.4));
export function restPose(pos, quat, lift) {
  const q = qMul(qAxis(TILT, -.32 * lift), quat);
  return { p: v3(pos.x, support(q) + .9 * lift, pos.z), q };
}

/* ---------- the camera ---------- */

// A fixed camera, looking down at the tray from the front, its height
// field of view FOV degrees (three.js's PerspectiveCamera). Only how far
// away it is and where it looks change, to fit the tray in its canvas.
export const FOV = 34;
export const VIEW = norm(v3(0, 1, .66));   // from where it looks to the camera
export const camAt = (look, dist) => ({ pos: add(look, scale(VIEW, dist)), look });

// Where point p shows in a canvas of this aspect (width / height), seen by
// camera cam: x and y from -1 to 1 across and up the canvas (three.js's
// Vector3.project).
export function project(p, cam, aspect) {
  const z = norm(sub(cam.pos, cam.look)), x = norm(cross(UP, z)), y = cross(z, x);
  const d = sub(p, cam.pos), t = Math.tan(FOV * Math.PI / 360), depth = -dot(d, z);
  return { x: dot(d, x) / depth / (t * aspect), y: dot(d, y) / depth / t };
}
// How far away the camera must be to keep every corner in view.
function fitDist(aspect, corners, look) {
  let lo = 3, hi = 60;
  for (let k = 0; k < 20; k++) {
    const mid = (lo + hi) / 2, cam = camAt(look, mid);
    const ok = corners.every(c => { const s = project(c, cam, aspect); return Math.abs(s.x) <= .97 && Math.abs(s.y) <= .96; });
    if (ok) hi = mid; else lo = mid;
  }
  return hi;
}
// The camera for a canvas of this aspect: the tray in the middle of it,
// top to bottom (a fixed point left room under the tray, so the canvas
// couldn't be cut to the tray), as close as keeps it all in view.
export function aim(aspect, corners) {
  const look = v3(0, 0, 0);
  for (let k = 0; k < 2; k++) {
    const cam = camAt(look, fitDist(aspect, corners, look));
    let y0 = Infinity, y1 = -Infinity;
    for (const c of corners) { const y = project(c, cam, aspect).y; y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const dy = project(v3(look.x, 0, look.z + 1), cam, aspect).y - project(v3(look.x, 0, look.z), cam, aspect).y;
    look.z -= ((y0 + y1) / 2) / dy;
  }
  return camAt(look, fitDist(aspect, corners, look));
}
// A die's width in px at the middle of the tray, in a W x H canvas.
export function dieAt(W, H, ix, iz) {
  const cam = aim(W / H, trayCorners(ix, iz));
  return (project(v3(.5, .5, 0), cam, W / H).x - project(v3(-.5, .5, 0), cam, W / H).x) / 2 * W;
}

// The tray's shape for a W x H canvas: the biggest dice; then, of shapes
// within 3% of that, the biggest tray (more room to roll). needH: the
// least height at which that tray still fills the width (the canvas can
// be cut to it; with less, the height limits the camera instead).
// Remembered for each W x H, all it depends on (the ranges are fixed).
const shapes = new Map();
export function trayShape(W, H) {
  const key = `${W}x${H}`;
  if (shapes.has(key)) return shapes.get(key);
  const { xRange, xStep, zRange, zStep } = TRAY, tries = [];
  for (let ix = xRange[0]; ix <= xRange[1] + 1e-6; ix += xStep)
    for (let iz = zRange[0]; iz <= zRange[1] + 1e-6; iz += zStep) tries.push({ ix, iz, die: dieAt(W, H, ix, iz) });
  const top = Math.max(...tries.map(t => t.die));
  const pick = tries.filter(t => t.die >= .97 * top).sort((a, b) => b.ix * b.iz - a.ix * a.iz)[0];
  const corners = trayCorners(pick.ix, pick.iz);
  const fillsWidth = h => {
    const cam = aim(W / h, corners);
    return Math.max(...corners.map(c => Math.abs(project(c, cam, W / h).x))) > .96;
  };
  let lo = 40, hi = H;
  if (fillsWidth(H)) for (let k = 0; k < 10; k++) { const mid = (lo + hi) / 2; if (fillsWidth(mid)) hi = mid; else lo = mid; }
  const out = { ix: +pick.ix.toFixed(2), iz: +pick.iz.toFixed(2), die: Math.round(pick.die), needH: Math.ceil(hi) };
  shapes.set(key, out);
  return out;
}
export const shapesKnown = () => shapes.size;

/* ---------- fitting the play screen ---------- */

// The score rows' size for a layout: the biggest dice and rows together, a
// die about RATIO rows (as in Five Dice). measure(row) sets the rows and
// returns the dice's size that leaves (smaller for bigger rows: the tray
// has less height), or null when the tray has no room. The value of a row
// size is min(die, RATIO x row); the best is where the two cross, so it's
// found by halving the steps between min and max (the mockup tried every
// step, 19 of them, each with a dozen tray shapes: 0.9-1.6 s on a
// sideways tablet). Returns { row, die, value, tries } or null.
export const RATIO = 1.2;
export function bestRow(min, max, step, measure) {
  const rows = [];
  for (let r = max; r >= min; r -= step) rows.push(r);   // big to small
  const seen = new Map();
  const at = k => {
    if (!seen.has(k)) { const m = measure(rows[k]); seen.set(k, m ? { row: rows[k], ...m, value: Math.min(m.die, RATIO * rows[k]) } : null); }
    return seen.get(k);
  };
  // the rows limit the value (RATIO x row <= die) from some step on, to the
  // smallest rows: find the first such step
  const rowLimited = k => { const m = at(k); return !!m && RATIO * m.row <= m.die; };
  let lo = 0, hi = rows.length - 1;
  if (rowLimited(0)) hi = 0;
  else if (!rowLimited(hi)) lo = hi;
  else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (rowLimited(mid)) hi = mid; else lo = mid; } }
  // the best is that step or the one before it (its die limits the value)
  const cands = [at(hi), at(Math.max(0, hi - 1)), at(lo)].filter(Boolean);
  if (!cands.length) return null;
  let best = cands.reduce((a, b) => (b.value > a.value + .5 || (Math.abs(b.value - a.value) <= .5 && b.row > a.row) ? b : a));
  // Bigger rows that keep the dice as big are better (a bigger sheet):
  // where the tray isn't in the sheet's column, the dice don't shrink as
  // the rows grow (a sideways phone: rows 30 for dice 34, the page fitting
  // rows 34). The biggest such row, by halving the steps above the best.
  const keeps = k => { const m = at(k); return !!m && m.value >= best.value - .5; };
  let a = 0, b = rows.indexOf(best.row);   // b keeps; is there a bigger row (smaller index) that does?
  if (b > 0 && keeps(b - 1)) {
    b--;
    if (keeps(0)) b = 0;
    else { while (b - a > 1) { const mid = (a + b) >> 1; if (keeps(mid)) b = mid; else a = mid; } }
  }
  best = at(b);
  return { ...best, value: Math.round(best.value), tries: seen.size };
}
