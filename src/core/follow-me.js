// Follow Me rules. No DOM or UI code: the screen lives in src/ui/.
//
// Simon-style, one player (agreed 2026-10-09 from the Follow Me mockup,
// v1-v2, and the grid sizes for v3; built without v3, developer: "go
// straight to publish"). The robot lights the pads in an order; you tap
// the same pads in the same order. All right: the robot shows it again
// with one more step. A miss costs a heart; Easy has 3 (the robot then
// shows the same order again), Hard 1. No hearts left: the game is over,
// and your score is the longest order you got right.
//
// A match is a plain object (your face, how many pads, how hard, the best
// scores, the current game); everything here is a pure function of its
// inputs or mutates only the match passed in.

import { FACE_NAMES, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES };

// How many faces (pads): 4 (2x2, preselected), 6 or 9 (3x3).
export const SIZES = [4, 6, 9];
export const DEFAULT_SIZE = 4;

// Per level: hearts, and the robot's speed (ms): each step lit `on`, then
// `gap` before the next. Easy stays the same all game; Hard starts quicker
// and gets `faster` (6%) quicker each round, down to `minOn` lit (and the
// gap down to 40% of that).
export const LEVELS = {
  easy: { hearts: 3, on: 650, gap: 280, faster: 1, minOn: 650 },
  hard: { hearts: 1, on: 450, gap: 170, faster: 0.94, minOn: 260 },
};

// The pads' faces and colours, in the order they're used: the first
// `size` of these that aren't your own face (so your face on the
// scoreboard is never a pad). Every pad its own animal and colour.
export const PAD_FACES = [
  { face: 'frog', color: 'g' }, { face: 'chick', color: 'y' }, { face: 'pig', color: 'k' },
  { face: 'bunny', color: 'b' }, { face: 'fox', color: 'o' }, { face: 'panda', color: 'v' },
  { face: 'lion', color: 't' }, { face: 'mouse', color: 'r' }, { face: 'monkey', color: 'n' },
  { face: 'cat', color: 'c' },
];

// The notes (Hz), low to high, from one pentatonic scale (C major
// pentatonic, from G4): any order sounds pleasant. Pads are given notes
// in reading order, low to high; 4 pads keep the mockup's G4 C5 E5 G5.
const SCALE = { G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66 };
const NOTES = {
  4: ['G4', 'C5', 'E5', 'G5'],
  6: ['G4', 'A4', 'C5', 'D5', 'E5', 'G5'],
  9: ['G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'],
};

// The pads for a game: [{ face, color, note }], `size` of them.
export function padsFor(size, playerFace) {
  if (!SIZES.includes(size)) throw new Error(`padsFor: bad size: ${size}`);
  const faces = PAD_FACES.filter(p => p.face !== playerFace).slice(0, size);
  return faces.map((p, i) => ({ ...p, note: SCALE[NOTES[size][i]] }));
}

// The ways to lay the pads out, as [cols, rows]: the screen tries each and
// keeps the one with the biggest pads that fit (6: 2 across and 3 down on
// an upright phone, 3x2 when wide).
export const ARRANGEMENTS = { 4: [[2, 2]], 6: [[2, 3], [3, 2]], 9: [[3, 3]] };

// The robot's speed in round `round` (1 = one step): { on, gap } in ms.
export function speed(level, round) {
  const L = LEVELS[level];
  if (!L) throw new Error(`speed: unknown level: ${level}`);
  if (!(Number.isInteger(round) && round >= 1)) throw new Error(`speed: bad round: ${round}`);
  const k = L.faster ** (round - 1);
  return { on: Math.round(Math.max(L.minOn, L.on * k)), gap: Math.round(Math.max(L.minOn * 0.4, L.gap * k)) };
}

// The next step: any pad, but never the same pad three times running.
// `rand` returns numbers in [0, 1).
export function nextStep(seq, size, rand = Math.random) {
  const twice = seq.length >= 2 && seq.at(-1) === seq.at(-2) ? seq.at(-1) : -1;
  const choices = [...Array(size).keys()].filter(p => p !== twice);
  return choices[Math.min(choices.length - 1, Math.floor(rand() * choices.length))];
}

// The best score is kept per size and level (7 on 9 faces is much harder
// than 7 on 4).
export const bestKey = (size, level) => `${size}-${level}`;

export const checkFaces = ({ p1 }) => checkPicks({ onePlayer: true, p1 });

// A new match. `best` is kept by the screen for the visit (across New
// game, since it's per size and level) and updated here. Throws if the
// picks aren't valid (the screen keeps "Play!" greyed until they are).
export function createMatch({ p1, size = DEFAULT_SIZE, level = 'easy' }, best = {}) {
  const why = checkFaces({ p1 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!SIZES.includes(size)) throw new Error(`unknown size: ${size}`);
  if (!Object.hasOwn(LEVELS, level)) throw new Error(`unknown level: ${level}`);
  const match = { face: p1, size, level, pads: padsFor(size, p1), best };
  newGame(match);
  return match;
}

// A new game: no steps yet, full hearts. Also "Play again" mid-game: the
// game restarts, not counted.
export function newGame(match) {
  match.seq = [];
  match.pos = 0;              // how many of the order you've tapped this time
  match.hearts = LEVELS[match.level].hearts;
  match.done = 0;             // the longest order got right this game: the score
  match.phase = 'ready';      // 'show' (the robot), 'input' (you), 'over'
  match.result = null;
}

// The robot adds a step and shows the order (round = its length).
export function addStep(match, rand = Math.random) {
  if (match.result) throw new Error('addStep: the game is over');
  match.seq.push(nextStep(match.seq, match.size, rand));
  match.phase = 'show';
  match.pos = 0;
  return match.seq.at(-1);
}

// The robot shows the same order again (after a miss with hearts left).
export function showAgain(match) {
  if (match.result) throw new Error('showAgain: the game is over');
  match.phase = 'show';
  match.pos = 0;
}

// The robot has shown the order: your turn.
export function yourTurn(match) {
  if (match.phase !== 'show') return false;
  match.phase = 'input';
  match.pos = 0;
  return true;
}

// You tap pad `pad`. Returns { ok: false, why } ('not-your-turn',
// 'bad-pad') or { ok: true, right, complete, want, gameOver, newBest }:
//   right    the pad was the next one in the order
//   complete the whole order is done (then the robot adds a step)
//   want     on a miss, the pad that was next (the screen blinks it)
//   gameOver a miss with no hearts left; match.result is { score, newBest }
export function tap(match, pad) {
  if (match.phase !== 'input') return { ok: false, why: 'not-your-turn' };
  if (!Number.isInteger(pad) || pad < 0 || pad >= match.size) return { ok: false, why: 'bad-pad' };
  const want = match.seq[match.pos];
  if (pad === want) {
    match.pos++;
    const complete = match.pos === match.seq.length;
    if (complete) {
      match.done = match.seq.length;
      match.phase = 'ready';
    }
    return { ok: true, right: true, complete, want, gameOver: false, newBest: false };
  }
  match.hearts--;
  if (match.hearts > 0) {
    match.phase = 'ready';
    return { ok: true, right: false, complete: false, want, gameOver: false, newBest: false };
  }
  const key = bestKey(match.size, match.level);
  const newBest = match.done > (match.best[key] ?? 0);
  if (newBest) match.best[key] = match.done;
  match.phase = 'over';
  match.result = { score: match.done, newBest };
  return { ok: true, right: false, complete: false, want, gameOver: true, newBest };
}
