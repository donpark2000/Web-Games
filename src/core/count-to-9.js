// Count to 9 rules. No DOM or UI code: the screens live in src/ui/.
//
// The developer's game (2026-10-04): 9 cards face down, numbered 1 to 9 in
// a random order. A player turns cards over one at a time; while each is
// the next number, they keep going. A wrong number shows for a moment
// (the screen flashes it red), then turns back and the turn passes.
//   Easy: the numbers already counted stay face up, and the next player
//         carries on from the next number (the count is shared).
//   Hard: a miss turns every card back, and the next player starts at 1.
// Whoever turns over the 9 wins, in either level.
//
// A match is a plain object. A miss leaves a "pending" state that the
// screen shows and then settles; the rules don't keep time themselves.
// Cards are numbered 0..8 in reading order; players are 1 and 2.

import { ROBOT, FIRST_RULES, nextStarter, checkFaces as checkPicks } from './players.js';
import { shuffle } from './matching.js';

export { ROBOT, FIRST_RULES };

export const COUNT_TO = 9;
export const MODES = ['solo', 'robot', 'two'];   // just me, me and the robot, two players
export const LEVELS = ['easy', 'hard'];

export const checkFaces = ({ mode, p1, p2 }) => checkPicks({ onePlayer: mode !== 'two', p1, p2 });

// The cards for a round: the numbers 1..n, shuffled.
export function makeDeck(n = COUNT_TO, rand = Math.random) {
  return shuffle(Array.from({ length: n }, (_, i) => i + 1), rand);
}

// A new match: nothing won yet, player 1 starts the first round. Throws if
// the picks aren't valid (the screen keeps "Play!" greyed until they are).
export function createMatch({ mode, p1, p2, level = 'easy', firstRule = 'alt' }) {
  if (!MODES.includes(mode)) throw new Error(`unknown mode: ${mode}`);
  if (!LEVELS.includes(level)) throw new Error(`unknown level: ${level}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  const why = checkFaces({ mode, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  return {
    mode,
    faces: [p1, mode === 'robot' ? ROBOT : mode === 'two' ? p2 : null],
    level,
    firstRule,
    starter: 1,
    wins: { 1: 0, 2: 0 },   // rounds won (no ties: someone always turns over the 9)
    best: {},               // playing alone: fewest turns, per level
    // the round (set by newRound):
    deck: [], up: [], by: [], next: 1, turn: 1, turns: 0, wrong: -1, pending: null, result: null,
    seen: [],               // against the robot: the cards it remembers
  };
}

// Deals a new round; the match's starter goes first. Also "Play again":
// mid-round, that restarts the round unscored, with the same starter (the
// starter only changes when a round finishes).
export function newRound(match, rand = Math.random) {
  match.deck = makeDeck(COUNT_TO, rand);
  match.up = match.deck.map(() => false);   // face up: counted, or the wrong card showing
  match.by = match.deck.map(() => 0);       // who counted each face-up card
  match.next = 1;
  match.turn = match.starter;
  match.turns = 0;
  match.wrong = -1;
  match.pending = null;
  match.result = null;
  match.seen = match.deck.map(() => false);
}

// The player whose turn it is turns card i over.
// Returns { ok: true, correct, number, result } (result is set when that
// was the 9), or { ok: false, why } where why is 'round-over', 'wait' (a
// wrong card is still showing), 'bad-card' or 'face-up'.
// Against the robot, every card turned over may be remembered by it
// (ROBOT_TUNING.remember for the match's level); `rand` decides.
export function flip(match, i, rand = Math.random, tuning = ROBOT_TUNING) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (match.pending) return { ok: false, why: 'wait' };
  if (!Number.isInteger(i) || i < 0 || i >= match.deck.length) return { ok: false, why: 'bad-card' };
  if (match.up[i]) return { ok: false, why: 'face-up' };
  const number = match.deck[i];
  match.up[i] = true;
  if (match.mode === 'robot' && !match.seen[i] && rand() < tuning.remember[match.level]) match.seen[i] = true;
  if (number !== match.next) {
    match.wrong = i;
    match.pending = 'miss';
    return { ok: true, correct: false, number, result: null };
  }
  match.by[i] = match.turn;
  match.next++;
  if (match.next > match.deck.length) finishRound(match);
  return { ok: true, correct: true, number, result: match.result };
}

// After the screen has shown the wrong card: it turns back (hard: every
// card turns back and the count starts again at 1), and the turn passes.
// Returns { ok: true, reset, turn } or { ok: false, why: 'nothing-pending' }.
export function settle(match) {
  if (!match.pending) return { ok: false, why: 'nothing-pending' };
  match.up[match.wrong] = false;
  const reset = match.level === 'hard';
  if (reset) {
    match.up.fill(false);
    match.by.fill(0);
    match.next = 1;
  }
  match.wrong = -1;
  match.pending = null;
  match.turns++;
  if (match.mode !== 'solo') match.turn = 3 - match.turn;
  return { ok: true, reset, turn: match.turn };
}

function finishRound(match) {
  match.turns++;
  const winner = match.turn;
  match.result = { winner, turns: match.turns };
  if (match.mode === 'solo') {
    const best = match.best[match.level];
    match.best[match.level] = best === undefined ? match.turns : Math.min(best, match.turns);
    return;
  }
  match.wins[winner]++;
  match.starter = nextStarter(match.starter, winner, match.firstRule);
}

// The robot never peeks: it only knows the cards it remembers seeing
// (match.seen; each card turned over is remembered with chance
// `remember` for the level, so it can be beaten). If it remembers where
// the next number is, it takes it; otherwise it guesses among the
// face-down cards it doesn't remember (those it remembers are some other
// number). Tunable. Was 0.6 for both levels; the developer found it too
// strong, "especially in hard mode" (2026-10-04).
export const ROBOT_TUNING = { remember: { easy: 0.4, hard: 0.3 } };

// Picks the robot's card. Returns { card, reason } where reason is
// 'remembered' or 'guess' (for the debug log). Reads match.deck only for
// cards in match.seen.
export function robotPick(match, rand = Math.random) {
  const down = match.deck.map((_, i) => i).filter(i => !match.up[i]);
  if (!down.length) throw new Error('robotPick: no face-down cards');
  const known = down.find(i => match.seen[i] && match.deck[i] === match.next);
  if (known !== undefined) return { card: known, reason: 'remembered' };
  const unknown = down.filter(i => !match.seen[i]);
  const choices = unknown.length ? unknown : down;
  return { card: choices[Math.min(choices.length - 1, Math.floor(rand() * choices.length))], reason: 'guess' };
}
