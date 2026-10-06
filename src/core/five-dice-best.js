// Five Dice: the best play, for the robot. No DOM or UI code.
//
// "Best" is the most points on average over the rest of the game
// (developer, 2026-10-06: the robot should make the best move, to show the
// kids good play). Worked out exactly, by going backwards from a full card:
// the value of a card (which boxes are filled and, in the long game, how far
// the 1s-6s are towards the bonus) is what the best play scores on average
// from there. With those values, one turn's choices (which dice to roll
// again, which box to fill) are a small calculation over the 252 possible
// rolls of five dice.
//
// Short game: 2^7 cards, worked out in a few milliseconds when first
// needed. Long game: 2^13 cards x 64 bonus steps, about a minute's work, so
// it's worked out once by tools/five-dice-table.js and saved as
// data/five-dice-long.bin, which the screen loads (useValues).
// Check: an empty long card is worth 245.87 points, as James Glenn reports
// for the best play with no extra-Yahtzee bonuses (journal, "Five Dice: the
// robot plays its best").

import { DICE, SIDES, BOXES, UPPER, BONUS_AT, BONUS, score, counts } from './five-dice.js';

/* ---------- the rolls ---------- */

// A handful of dice is kept as how many of each number: key = c1 + 6 c2 +
// 36 c3 + ... (each count 0-5).
const POW = [1, 6, 36, 216, 1296, 7776];
const keyOf = c => c.reduce((a, n, v) => a + n * POW[v], 0);   // c[0..5]: the 1s to 6s
const FACT = [1, 1, 2, 6, 24, 120];

// Every handful of 0-5 dice: its counts and the chance of rolling it.
const HANDS = [];
(function make(c, v, n) {
  if (v === SIDES) {
    const total = c.reduce((a, b) => a + b, 0);
    const ways = FACT[total] / c.reduce((a, k) => a * FACT[k], 1);
    HANDS.push({ c: c.slice(), n: total, key: keyOf(c), p: ways / 6 ** total });
    return;
  }
  for (let k = 0; k + n <= DICE; k++) { c[v] = k; make(c, v + 1, n + k); }
  c[v] = 0;
})([0, 0, 0, 0, 0, 0], 0, 0);
const HAND_AT = new Int16Array(6 ** 6).fill(-1);
HANDS.forEach((h, i) => { HAND_AT[h.key] = i; });
const ROLLS5 = HANDS.map((h, i) => i).filter(i => HANDS[i].n === DICE);   // the 252 rolls of five
const ROLL_AT = new Int16Array(HANDS.length).fill(-1);
ROLLS5.forEach((h, j) => { ROLL_AT[h] = j; });
const R = ROLLS5.length;
const diceOf = c => c.flatMap((n, v) => Array(n).fill(v + 1));

// For each kept handful: each way the other dice can land (the roll of five
// it makes, and its chance). Flattened, for speed.
const K = HANDS.length;
const outStart = new Int32Array(K + 1), outRoll = [], outP = [];
for (let k = 0; k < K; k++) {
  outStart[k] = outRoll.length;
  for (const o of HANDS) {
    if (o.n !== DICE - HANDS[k].n) continue;
    outRoll.push(ROLL_AT[HAND_AT[keyOf(HANDS[k].c.map((n, v) => n + o.c[v]))]]);
    outP.push(o.p);
  }
}
outStart[K] = outRoll.length;
const OUT_ROLL = Int16Array.from(outRoll), OUT_P = Float64Array.from(outP);

// For each roll of five: every handful that can be kept from it, all five
// (keep them all) first.
const subStart = new Int32Array(R + 1), subs = [];
for (let j = 0; j < R; j++) {
  subStart[j] = subs.length;
  const c = HANDS[ROLLS5[j]].c, here = [];
  (function make(s, v) {
    if (v === SIDES) { here.push(HAND_AT[keyOf(s)]); return; }
    for (let k = c[v]; k >= 0; k--) { s[v] = k; make(s, v + 1); }
  })([0, 0, 0, 0, 0, 0], 0);
  subs.push(...here);   // here[0] is all five
}
subStart[R] = subs.length;
const SUBS = Int16Array.from(subs);
const EMPTY = HAND_AT[0];

/* ---------- the values of cards ---------- */

// A card is a mask of the boxes filled (bit i: BOXES[length][i]) and, in
// the long game, its 1s-6s total so far, capped at 63 ("up"). The short
// game has no bonus, so up is always 0 there.
const UPS = { short: 1, long: BONUS_AT + 1 };
const SCORES = {};   // SCORES[length][j * boxes + b]: roll j's points in box b
for (const length of ['short', 'long']) {
  const boxes = BOXES[length], t = new Int16Array(R * boxes.length);
  ROLLS5.forEach((h, j) => boxes.forEach((b, i) => { t[j * boxes.length + i] = score(b, diceOf(HANDS[h].c)); }));
  SCORES[length] = t;
}

// One turn, from a card with the values V of every card: the best average
// over the rest of the game after each roll and each keep.
//   v3[j]: after the last roll j (the best box)
//   e3[k]: keeping k before the last roll; v2[j]: after roll 2 is j
//   e2[k]: keeping k before roll 2;        v1[j]: after roll 1 is j
//   value: before the turn
function turn(length, V, mask, up, want = false) {
  const boxes = BOXES[length], nb = boxes.length, U = UPS[length], S = SCORES[length];
  const v3 = new Float64Array(R);
  for (let j = 0; j < R; j++) {
    let best = -Infinity;
    for (let b = 0; b < nb; b++) {
      if (mask & (1 << b)) continue;
      const s = S[j * nb + b];
      let nextUp = up, bonus = 0;
      if (U > 1 && b < UPPER.length) {
        nextUp = Math.min(BONUS_AT, up + s);
        if (up < BONUS_AT && nextUp >= BONUS_AT) bonus = BONUS;
      }
      const v = s + bonus + V[(mask | (1 << b)) * U + nextUp];
      if (v > best) best = v;
    }
    v3[j] = best;
  }
  const keep = vr => {   // the average of vr after rolling the rest, per kept handful
    const e = new Float64Array(K);
    for (let k = 0; k < K; k++) {
      let s = 0;
      for (let q = outStart[k]; q < outStart[k + 1]; q++) s += OUT_P[q] * vr[OUT_ROLL[q]];
      e[k] = s;
    }
    return e;
  };
  const best = e => {    // the best keep after each roll
    const v = new Float64Array(R);
    for (let j = 0; j < R; j++) {
      let m = -Infinity;
      for (let q = subStart[j]; q < subStart[j + 1]; q++) if (e[SUBS[q]] > m) m = e[SUBS[q]];
      v[j] = m;
    }
    return v;
  };
  const e3 = keep(v3), v2 = best(e3), e2 = keep(v2), v1 = best(e2);
  let value = 0;
  for (let q = outStart[EMPTY]; q < outStart[EMPTY + 1]; q++) value += OUT_P[q] * v1[OUT_ROLL[q]];
  return want ? { v3, e3, e2, value } : value;
}

// The 1s-6s totals (capped at 63) a set of filled 1s-6s boxes can have.
function reachableUps(mask) {
  let can = new Set([0]);
  for (let b = 0; b < UPPER.length; b++) {
    if (!(mask & (1 << b))) continue;
    const next = new Set();
    for (const u of can) for (let n = 0; n <= DICE; n++) next.add(Math.min(BONUS_AT, u + n * (b + 1)));
    can = next;
  }
  return can;
}

// Works out the value of every card: a Float64Array, card (mask, up) at
// mask * UPS[length] + up. Cards that can't happen are left at 0.
// `progress(done, of)`, if given, is called now and then (the long game
// takes about a minute).
export function solve(length, progress) {
  const nb = BOXES[length].length, U = UPS[length], full = (1 << nb) - 1;
  const V = new Float64Array((full + 1) * U);
  const upperBits = (1 << UPPER.length) - 1;
  for (let mask = full - 1; mask >= 0; mask--) {
    const ups = U > 1 ? reachableUps(mask & upperBits) : [0];
    for (const up of ups) V[mask * U + up] = turn(length, V, mask, up);
    if (progress && mask % 256 === 0) progress(full - mask, full);
  }
  return V;
}

// The values the robot plays by. The short game's are worked out when
// first needed; the long game's come from data/five-dice-long.bin
// (useValues), or, until then, from the short-sighted stand-in below.
const VALUES = {};
export function useValues(length, V) {
  const want = (1 << BOXES[length].length) * UPS[length];
  if (V.length !== want) throw new Error(`useValues: ${length} needs ${want} values, got ${V.length}`);
  VALUES[length] = V;
}
export const hasValues = length => Boolean(VALUES[length]);
export function values(length) {
  if (!VALUES[length] && length === 'short') VALUES.short = solve('short');
  // Not loaded: every later card is worth 0, so the robot plays for the
  // most points this turn (logged by the screen; better than not playing).
  return VALUES[length] ?? new Float64Array((1 << BOXES[length].length) * UPS[length]);
}

// The long game's file: the values as 16-bit whole hundredths (an empty
// card is about 24587), little-endian (as on every phone, tablet and
// computer), card order as in solve(). Half a hundredth is far below any
// choice that matters.
export const toFile = V => Uint16Array.from(V, v => Math.round(v * 100));
export const fromFile = u16 => Float64Array.from(u16, v => v / 100);

/* ---------- the robot's choice ---------- */

// Which card a player's card is: { mask, up }.
export function cardState(card, length) {
  const boxes = BOXES[length];
  let mask = 0;
  boxes.forEach((b, i) => { if (b in card) mask |= 1 << i; });
  const up = UPS[length] > 1 ? Math.min(BONUS_AT, UPPER.reduce((a, b) => a + (card[b] ?? 0), 0)) : 0;
  return { mask, up };
}

// The best play with these dice after roll `rolls` (1-3): { box, points }
// to score, or { up } (which dice to pick up and roll again; never none).
// Also `worth`: the average points to come with that play, for the log.
export function bestPlay(dice, rolls, card, length, V = values(length)) {
  const { mask, up } = cardState(card, length);
  const boxes = BOXES[length], nb = boxes.length;
  if (mask === (1 << nb) - 1) throw new Error('bestPlay: no open boxes');
  if (!(rolls >= 1 && rolls <= 3)) throw new Error(`bestPlay: bad rolls: ${rolls}`);
  const t = turn(length, V, mask, up, true);
  const j = ROLL_AT[HAND_AT[keyOf(counts(dice).slice(1))]];
  // Scoring now: the box with the best points now plus value after.
  const S = SCORES[length], U = UPS[length];
  let box = -1, boxWorth = -Infinity;
  for (let b = 0; b < nb; b++) {
    if (mask & (1 << b)) continue;
    const s = S[j * nb + b];
    let nextUp = up, bonus = 0;
    if (U > 1 && b < UPPER.length) { nextUp = Math.min(BONUS_AT, up + s); if (up < BONUS_AT && nextUp >= BONUS_AT) bonus = BONUS; }
    const w = s + bonus + V[(mask | (1 << b)) * U + nextUp];
    if (w > boxWorth) { boxWorth = w; box = b; }
  }
  const scoreNow = () => ({ box: boxes[box], points: S[j * nb + box], worth: boxWorth });
  if (rolls >= 3) return scoreNow();
  // Rolling again: keep the handful worth most, with the rolls left after
  // this one. Keeping all five is the same as scoring now (best above).
  const e = rolls === 1 ? t.e2 : t.e3;
  let k = -1, keepWorth = -Infinity;
  for (let q = subStart[j] + 1; q < subStart[j + 1]; q++) if (e[SUBS[q]] > keepWorth) { keepWorth = e[SUBS[q]]; k = SUBS[q]; }
  if (boxWorth >= keepWorth) return scoreNow();
  const left = HANDS[k].c.slice();
  return { up: dice.map(v => (left[v - 1] > 0 ? (left[v - 1]--, false) : true)), worth: keepWorth };
}

// What an empty card is worth: the best play's average points for a game.
export const gameWorth = (length, V = values(length)) => V[0];

// A card's value as stored, and worked out again from the values of the
// cards after it (they agree, for a correct set of values; the tests check
// the saved long-game file this way).
export function storedWorth(card, length, V = values(length)) {
  const { mask, up } = cardState(card, length);
  return V[mask * UPS[length] + up];
}
export function worthFromNext(card, length, V = values(length)) {
  const { mask, up } = cardState(card, length);
  return turn(length, V, mask, up);
}
