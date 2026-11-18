// Topple!'s world tutorial (journal Q124, then Q129, release 11.2). The
// developer, trying 11.1: "the tutorials should be bare bones scenes with no
// distractions like complex targets and landscapes - it should just focus on
// the mechanics of aiming ... clear one and a second appears ... Each part of
// the tutorial and end with a 'next' or 'skip'"; "once per device the first
// time you enter the first level of a world you have never played before.
// Skip means end the tutorial and proceed to game play on scene 1 of level 1."
//
// Bare scenes (the park: lawn and sky, no trees, bushes or birds; the moon:
// ground and sky, no base), one short stack of 3 blocks a part, each part
// needing one more control than the one before. A card after each part
// (Next ▸ and Skip), the balls free, nothing kept. Pure rules, no DOM:
// src/ui/topple.js shows it. (11.1's: one practice scene of the world's
// own, steps that waited for a press, a drag, a turn; from the map too.)
import { worldOf, firstOfWorld } from './topple-levels.js';
import { HAND, SCALE, GRAVITY, V_MIN, V_MAX, REACH, sceneParts } from './topple.js';
import { MOON_STRUCTURES, ZS, Z_START, fallTime, newLander } from './topple-moon.js';

// Each part: what it teaches (its name: the card before it says "Next: ..."),
// the bar's words, and on a computer the keys
// (the moon only: the park is a drag).
export const TUTORIALS = {
  park: {
    title: 'How to throw',
    parts: [
      { id: 'ahead', name: 'straight ahead', say: 'Put your finger on 👆, drag up a little and let go' },
      { id: 'side', name: 'one off to the side', say: 'This one is off to the side: drag left as you drag up' },
      { id: 'far', name: 'one farther away', say: 'This one is farther away: drag higher to throw farther' },
    ],
  },
  moon: {
    title: 'How to drop',
    parts: [
      { id: 'line', name: 'right on the line', say: 'Tap 👆 just as the ring reaches the blocks', keys: 'or press Space' },
      { id: 'far', name: 'farther away', say: 'These are farther away: hold 👆 and drag up to fly over them, then let go', keys: 'or ↑, then Space' },
      { id: 'turn', name: 'turning round', say: 'The ring is going away from them: tap ⇄ to turn round, then drop', keys: 'or ←, then Space' },
    ],
  },
};
export const tutorialParts = id => TUTORIALS[id].parts.length;

// A tutorial under way for world `id` ('park' or 'moon'): its part (0 on), and whether that part's blocks are all down.
export function startTutorial(id) {
  if (!TUTORIALS[id]) throw new Error(`startTutorial: no tutorial for ${id}`);
  return { world: id, part: 0, cleared: false };
}
export const tutorialPart = t => TUTORIALS[t.world].parts[t.part];
export const lastPart = t => t.part >= tutorialParts(t.world) - 1;
// The bar's words: the part's, with its keys on a computer (`keys`: a mouse or trackpad is the pointer).
export const tutorialSay = (t, keys = false) => { const p = tutorialPart(t); return keys && p.keys ? `${p.say} (${p.keys})` : p.say; };
// Every block of the part down: { last } (the last part: the tutorial is done).
export function partCleared(t) { t.cleared = true; return { last: lastPart(t) }; }
// Next ▸: on to the next part (false: there is none).
export function nextPart(t) {
  if (lastPart(t)) return false;
  t.part++; t.cleared = false;
  return true;
}

/* ---------- the park's parts ---------- */

// A short stack of 3 blocks, upright so a hit tips them (Near metres, as a
// layout's blocks after SIZE: src/core/topple.js makeLayout).
const e = 0.001;
const PARK_STACK = [['red', 0], ['yellow', 1], ['blue', 2]].map(([c, i]) => ({ w: 0.16, h: 0.22, d: 0.16, x: 0, y: 0.11 + i * (0.22 + e) + e, z: 0, c }));
// Where each part's stack stands (Near metres: x right, z away from the
// hand): straight ahead; off to the left (18° of the 22° the aim reaches);
// farther away.
export const PARK_AT = { ahead: { x: 0, z: -2.7 }, side: { x: -0.8, z: -2.6 }, far: { x: 0, z: -4.0 } };
// The throw's strength: the park's own rule (a 45° throw reaches REACH times
// as far as the structure) for the farthest part, the same in every part, so
// a farther stack needs a higher drag, not a harder one.
const far = Math.hypot(PARK_AT.far.x - HAND.x, PARK_AT.far.z - HAND.z);
export const PARK_POWER = +((Math.sqrt(GRAVITY * REACH * far) - V_MIN) / (V_MAX - V_MIN)).toFixed(3);

// Part `id`'s layout (as makeLayout's: no things, so nothing in the way).
export function parkPracticeLayout(id) {
  const at = PARK_AT[id];
  if (!at) throw new Error(`parkPracticeLayout: no part ${id}`);
  const blocks = PARK_STACK.map(b => ({ ...b, x: at.x + b.x, z: at.z + b.z }));
  return { seed: 0, n: 0, level: 1, stack: `practice ${id}`, table: { w: 0.3, d: 0.3, top: 0, x: at.x, z: at.z }, blocks, things: [], power: PARK_POWER, reach: 0, unplaced: [], tooNear: 0, practice: id };
}
// Part `id` in the world's metres (sceneParts), the view fitted to all three
// parts at once, so a new stack shows up somewhere else in the same view.
export function parkPracticeParts(id) {
  const all = Object.keys(PARK_AT).map(k => sceneParts(parkPracticeLayout(k)));
  const p = sceneParts(parkPracticeLayout(id));
  p.bounds = { min: [0, 1, 2].map(i => Math.min(...all.map(q => q.bounds.min[i]))), max: [0, 1, 2].map(i => Math.max(...all.map(q => q.bounds.max[i]))) };
  p.stand = { ...p.stand, x: 0, z: (all[0].stand.z + all[2].stand.z) / 2 };
  return p;
}
export const PARK_SCALE = SCALE;   // (the tests: Near to world)

/* ---------- the moon's parts ---------- */

// One run for every part (so the view doesn't move), the moon's narrowest.
export const MOON_SPAN = [-2.5, 2.5];
// Each part's arch (two posts and a beam across: 3 blocks; a tower of 3 crates
// let a ball rest on its top, the lander slow after a turn: 20 of 32 drops over
// it at 0.1 m/s brought all 3 down, the arch's 38 of 38): on the lander's line, ahead;
// farther away; and the one the ring is going away from at the start.
export const MOON_AT = { line: { x: 0, z: Z_START }, far: { x: 0, z: ZS.f }, turn: { x: -1.2, z: Z_START } };
// Part `id`'s scene (as moonScene's), the Earth always in the same place.
export function moonPracticeScene(id) {
  const at = MOON_AT[id];
  if (!at) throw new Error(`moonPracticeScene: no part ${id}`);
  const blocks = MOON_STRUCTURES.arch().map(b => ({ ...b, x: at.x + b.x, z: at.z + b.z }));
  return { level: 6, scene: 1, seed: 0, practice: id, structures: [{ name: 'arch', x: at.x, z: at.z, ledge: false, blocks }], ledges: [], span: [...MOON_SPAN], earth: { az: 0.62, el: 0.7, spin: 1 }, blocks };
}
// Part `id`'s lander: from the left as in play; for ⇄'s part, starting with
// the ring just past the stack and going away from it, and waiting at the
// end of the run (not turning itself) until ⇄ turns it.
// (0.6 m past: the ball let go at once still clipped the tower's top on its way down, the lander being behind it)
export const TURN_START_PAST = 1.5;
export function moonPracticeLander(id, speed) {
  const f = newLander(MOON_SPAN, speed);
  if (id === 'turn') { f.x = MOON_AT.turn.x + TURN_START_PAST - speed * fallTime(); f.ends = 'wait'; }
  return f;
}

/* ---------- once a device ---------- */

// The worlds taught on this device: read from what was kept (anything
// unreadable: none).
export function readTaught(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(id => typeof id === 'string' && TUTORIALS[id]))];
}
// Whether starting level `lv` shows its world's tutorial first: the world's
// first level, the world not taught yet on this device.
export function needsTutorial(taught, lv) {
  const w = worldOf(lv);
  return !!w && !!TUTORIALS[w.id] && !!firstOfWorld(lv) && !taught.includes(w.id);
}
export function markTaught(taught, id) {
  return taught.includes(id) ? taught : [...taught, id];
}
