// Topple!'s world tutorial (journal Q124, developer, 2026-11-17: "a 'world
// launching' screen that is not part of game play or scoring but explains
// the aiming and firing controls for the world you are about to enter. A
// mini interactive tutorial"; "first time plus button"; the park too).
// A practice scene with one easy structure, the balls free, nothing kept;
// steps that each wait for you to do the thing they say, in order; Skip
// any time. Shown before the first scene of a world is played (once a
// device: `taught`), and again from the world's banner on the map.
// Pure rules, no DOM: src/ui/topple.js shows it.
import { worldOf } from './topple-levels.js';

// What each step waits for (the page tells it, `tutorialDid`):
//   press  a finger on the pad (or Space held, on the moon)
//   aim    the park: a drag far enough to show the dots
//   steer  the moon: the lander steered 0.5 m nearer or farther
//   turn   the moon: ⇄ (or ← →), not the turn at the ends
//   throw  a ball thrown (the park) or dropped (the moon)
//   clear  every block down
//   short  the park: let go with too short a drag (back to the first step)
export const TUTORIALS = {
  park: {
    title: 'How to throw',
    steps: [
      { until: 'press', say: 'Put your finger on 👆' },
      { until: 'aim', say: 'Keep it there and drag up: the dots show where the ball goes' },
      { until: 'throw', say: 'Let go to throw!' },
      { until: 'clear', say: 'Knock every block down. The balls are free here!' },
    ],
  },
  moon: {
    title: 'How to drop',
    steps: [
      { until: 'press', say: 'Hold your finger on 👆: the ring shows where the ball lands' },
      { until: 'steer', say: 'Keep holding and drag up or down to fly farther or nearer' },
      { until: 'turn', say: 'Tap ⇄ to turn the lander round' },
      { until: 'throw', say: 'Hold 👆 and let go when the ring is on a block' },
      { until: 'clear', say: 'Knock every block down. The balls are free here!' },
    ],
  },
};
export const STEER_TAUGHT_M = 0.5;
// The practice scene: the park's level 1 scene 1, the moon's Landing Zone
// scene 1 (one line of structures), on Normal (the dots; the ring and the
// glowing block), always the same deal. The park's seed picked (2026-11-17,
// seeds 1-60 measured): the arch, which comes down whole from one post, with
// only a bush in the way (164 throws of the check's fan hit it direct; seed
// 424242 had a tree trunk across it).
export const PRACTICE = { park: { level: 1, scene: 1, seed: 40 }, moon: { level: 6, scene: 1, seed: 424242 } };

// A tutorial under way for world `id` ('park' or 'moon').
export function startTutorial(id, from = 'play') {
  if (!TUTORIALS[id]) throw new Error(`startTutorial: no tutorial for ${id}`);
  return { world: id, step: 0, from, done: false };
}
export const tutorialStep = t => TUTORIALS[t.world].steps[Math.min(t.step, TUTORIALS[t.world].steps.length - 1)];
export const tutorialSteps = t => TUTORIALS[t.world].steps.length;
// Something done: the step moves on if it is what the step waited for (in
// order: a drop before the steer step is a ball dropped, not a step done).
// Every block down finishes it whatever the step. Returns
// { moved, done, step } (moved: the step changed).
export function tutorialDid(t, event) {
  const steps = TUTORIALS[t.world].steps, was = t.step;
  if (t.done) return { moved: false, done: true, step: t.step };
  if (event === 'clear') { t.done = true; t.step = steps.length - 1; return { moved: t.step !== was, done: true, step: t.step }; }
  // a drag too short to throw, before the throw was learnt: from the top
  if (event === 'short') { const ti = steps.findIndex(s => s.until === 'throw'); if (t.step > 0 && t.step <= ti) t.step = 0; return { moved: t.step !== was, done: false, step: t.step }; }
  if (steps[t.step]?.until === event) t.step++;
  return { moved: t.step !== was, done: false, step: t.step };
}

// The worlds taught on this device: read from what was kept (anything
// unreadable: none), so a tutorial shows the first time a world is entered.
export function readTaught(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(id => typeof id === 'string' && TUTORIALS[id]))];
}
// Whether starting level `lv` shows its world's tutorial first: the world not taught yet.
export function needsTutorial(taught, lv) {
  const w = worldOf(lv);
  return !!w && !!TUTORIALS[w.id] && !taught.includes(w.id);
}
export function markTaught(taught, id) {
  return taught.includes(id) ? taught : [...taught, id];
}
