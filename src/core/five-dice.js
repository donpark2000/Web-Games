// Five Dice rules (Yahtzee-style). No DOM or UI code: the screens live in
// src/ui/.
//
// Agreed 2026-10-06 from mockup v5 (journal). Five dice, up to 3 rolls a
// turn. The first roll rolls all five; after that only the dice picked up
// are rolled again (the rest stay put, as with real dice). Then the
// player puts the roll in one empty box of their column, and the turn
// passes. A game ends when every box is filled; most points wins (ties
// possible).
//   Short: 7 boxes, the 1s-6s and 5 the same.
//   Long:  all 13 boxes, plus a bonus of 35 for 63 or more in the 1s-6s.
// No extra 5-the-same bonuses or "joker" rules.
//
// A match is a plain object, as in the other games. After a box is
// scored the turn waits (match.scored) so the screen can offer Undo; the
// screen calls endTurn when that time is up. The rules don't keep time
// themselves. Players are 1 and 2. The robot's play is in
// five-dice-best.js.

import { FACE_NAMES, ROBOT, checkFaces as checkPicks } from './players.js';

export { FACE_NAMES, ROBOT };

export const DICE = 5;
export const SIDES = 6;
export const ROLLS = 3;          // rolls a turn
export const BONUS_AT = 63;      // long game: this much in the 1s-6s...
export const BONUS = 35;         // ...gets this much more
export const MODES = ['solo', 'robot', 'two'];   // just me, me and the robot, two players
export const LENGTHS = ['short', 'long'];
export const UPPER = ['1', '2', '3', '4', '5', '6'];
// The boxes of each game, in the score sheet's order.
export const BOXES = {
  short: [...UPPER, 'five'],
  long: [...UPPER, 'three', 'four', 'house', 'small', 'big', 'five', 'chance'],
};

export const checkFaces = ({ mode, p1, p2 }) => checkPicks({ onePlayer: mode !== 'two', p1, p2 });

/* ---------- scoring ---------- */

// How many of each number: counts(d)[v] for v in 1..6.
export function counts(dice) {
  const c = [0, 0, 0, 0, 0, 0, 0];
  for (const v of dice) c[v]++;
  return c;
}
const total = dice => dice.reduce((a, b) => a + b, 0);
const most = dice => Math.max(...counts(dice));
// The longest run of numbers in a row (1 2 3 4 is 4).
export function run(dice) {
  let best = 0, cur = 0;
  for (let v = 1; v <= SIDES; v++) { cur = dice.includes(v) ? cur + 1 : 0; best = Math.max(best, cur); }
  return best;
}

// What `dice` would score in `box`.
export function score(box, dice) {
  if (UPPER.includes(box)) { const n = Number(box); return counts(dice)[n] * n; }
  switch (box) {
    case 'three': return most(dice) >= 3 ? total(dice) : 0;
    case 'four': return most(dice) >= 4 ? total(dice) : 0;
    case 'house': { const c = counts(dice).filter(Boolean).sort(); return c.length === 2 && c[0] === 2 ? 25 : 0; }
    case 'small': return run(dice) >= 4 ? 30 : 0;
    case 'big': return run(dice) === 5 ? 40 : 0;
    case 'five': return most(dice) === 5 ? 50 : 0;
    case 'chance': return total(dice);
    default: throw new Error(`unknown box: ${box}`);
  }
}

// A player's card is { box: points } for the boxes filled so far.
export const upper = card => UPPER.reduce((a, b) => a + (card[b] ?? 0), 0);
export const bonusOf = (card, length) => (length === 'long' && upper(card) >= BONUS_AT ? BONUS : 0);
export const points = (card, length) => Object.values(card).reduce((a, b) => a + b, 0) + bonusOf(card, length);
export const openBoxes = (card, length) => BOXES[length].filter(b => !(b in card));

export const rollDie = (rand = Math.random) => 1 + Math.min(SIDES - 1, Math.floor(rand() * SIDES));

/* ---------- a match ---------- */

export const players = match => (match.mode === 'solo' ? [1] : [1, 2]);

// A new match: nothing won yet, player 1 starts the first game. Throws if
// the picks aren't valid (the screen keeps "Play!" greyed until they are).
export function createMatch({ mode, p1, p2, length = 'short' }) {
  if (!MODES.includes(mode)) throw new Error(`unknown mode: ${mode}`);
  if (!LENGTHS.includes(length)) throw new Error(`unknown length: ${length}`);
  const why = checkFaces({ mode, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  const match = {
    mode,
    length,
    faces: [p1, mode === 'robot' ? ROBOT : mode === 'two' ? p2 : null],
    starter: 1,
    wins: { 1: 0, 2: 0 },   // games won
    best: {},               // playing alone: the most points, per length
  };
  newRound(match);
  return match;
}

// A new game; the match's starter goes first. Also "Play again": mid-game,
// that restarts the game unscored, with the same starter (the starter only
// changes when a game finishes).
export function newRound(match) {
  match.cards = { 1: {}, 2: {} };
  match.turn = match.starter;
  match.result = null;
  startTurn(match);
}

function startTurn(match) {
  match.dice = [1, 2, 3, 4, 5];   // not rolled yet (the screen shows cubes)
  match.up = Array(DICE).fill(false);   // picked up to roll again
  match.rolls = 0;
  match.scored = null;            // the box just scored, until endTurn (Undo can take it back)
}

// Rolls the dice: the first roll all five, after that the ones picked up.
// Returns { ok: true, dice, rolled, rolls } (rolled: which dice were
// rolled), or { ok: false, why } where why is 'round-over', 'scored' (a
// box was just scored), 'no-rolls-left' or 'none-picked-up' (the screen
// then offers to pick all five up).
export function roll(match, rand = Math.random) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (match.scored) return { ok: false, why: 'scored' };
  if (match.rolls >= ROLLS) return { ok: false, why: 'no-rolls-left' };
  if (match.rolls > 0 && !match.up.some(Boolean)) return { ok: false, why: 'none-picked-up' };
  const rolled = match.rolls === 0 ? Array(DICE).fill(true) : match.up.slice();
  match.dice = match.dice.map((v, i) => (rolled[i] ? rollDie(rand) : v));
  match.up = Array(DICE).fill(false);
  match.rolls++;
  return { ok: true, dice: match.dice.slice(), rolled, rolls: match.rolls };
}

// Why the dice can't be picked up now ('' if they can).
function cantPickUp(match) {
  if (match.result) return 'round-over';
  if (match.scored) return 'scored';
  if (match.rolls === 0) return 'not-rolled';
  if (match.rolls >= ROLLS) return 'no-rolls-left';
  return '';
}

// Picks die i up to roll again, or puts it back. Returns { ok: true, up }
// or { ok: false, why } ('bad-die', or as for cantPickUp).
export function toggle(match, i) {
  if (!Number.isInteger(i) || i < 0 || i >= DICE) return { ok: false, why: 'bad-die' };
  const why = cantPickUp(match);
  if (why) return { ok: false, why };
  match.up[i] = !match.up[i];
  return { ok: true, up: match.up[i] };
}

// Picks all five up (Roll with none picked up: the screen asks "Roll them
// all?" and a second Roll rolls them).
export function pickUpAll(match) {
  const why = cantPickUp(match);
  if (why) return { ok: false, why };
  match.up.fill(true);
  return { ok: true };
}

// Puts this roll in `box` of the player whose turn it is. Returns
// { ok: true, box, points } or { ok: false, why } where why is
// 'round-over', 'not-rolled', 'scored' (one box a turn), 'bad-box' (not in
// this game) or 'filled'.
export function scoreBox(match, box) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (match.rolls === 0) return { ok: false, why: 'not-rolled' };
  if (match.scored) return { ok: false, why: 'scored' };
  if (!BOXES[match.length].includes(box)) return { ok: false, why: 'bad-box' };
  const card = match.cards[match.turn];
  if (box in card) return { ok: false, why: 'filled' };
  card[box] = score(box, match.dice);
  match.scored = box;
  match.up.fill(false);
  return { ok: true, box, points: card[box] };
}

// Takes the box just scored back out; the turn carries on with the same
// dice and rolls. Returns { ok: true, box } or { ok: false, why:
// 'nothing-to-undo' }. There's no undo for a roll: after seeing the new
// dice it would be a free extra roll.
export function undo(match) {
  if (match.result || !match.scored) return { ok: false, why: 'nothing-to-undo' };
  const box = match.scored;
  delete match.cards[match.turn][box];
  match.scored = null;
  return { ok: true, box };
}

// After a box is scored (and Undo's time is up): the turn passes, or, when
// every box is filled, the game ends. Returns { ok: true, turn, result }
// or { ok: false, why: 'not-scored' }.
// result: { winner (0 for a tie; 1 playing alone), points: {1, 2}, best }
// (best: playing alone, a new best for that length).
export function endTurn(match) {
  if (match.result || !match.scored) return { ok: false, why: 'not-scored' };
  const done = players(match).every(p => openBoxes(match.cards[p], match.length).length === 0);
  if (done) {
    finishRound(match);
    return { ok: true, turn: match.turn, result: match.result };
  }
  if (match.mode !== 'solo') match.turn = 3 - match.turn;
  startTurn(match);
  return { ok: true, turn: match.turn, result: null };
}

function finishRound(match) {
  match.scored = null;
  const pts = { 1: points(match.cards[1], match.length), 2: points(match.cards[2], match.length) };
  if (match.mode === 'solo') {
    const best = match.best[match.length];
    const isBest = best === undefined || pts[1] > best;
    if (isBest) match.best[match.length] = pts[1];
    match.result = { winner: 1, points: pts, best: isBest };
    return;
  }
  const winner = pts[1] > pts[2] ? 1 : pts[2] > pts[1] ? 2 : 0;
  if (winner) match.wins[winner]++;
  match.result = { winner, points: pts, best: false };
  match.starter = 3 - match.starter;   // players take turns starting each game
}
