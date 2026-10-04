// Matching-cards rules. No DOM or UI code: the screens live in src/ui/.
//
// A match is a plain object (players, grid size, scores, the current
// round). Turning two cards over leaves a "pending" result (a match or a
// miss) that the screen shows for a moment and then settles; the rules
// don't keep time themselves.
//
// Cards are numbered 0..n-1 in reading order. Players are 1 and 2.

import { FACE_NAMES, ROBOT, FIRST_RULES, nextStarter, checkFaces } from './players.js';

export { FIRST_RULES, checkFaces };

// Grid sizes as [short side, long side]. Every one has an even number of
// cards, so every card has a match.
export const SIZES = [[3, 4], [4, 4], [4, 5], [4, 6], [5, 6], [6, 6]];
export const DEFAULT_SIZE = '4x4';
// Smaller cards are hard for small fingers; sizes that would need them
// aren't offered on that screen.
export const MIN_CARD = 56;
// Every drawn face can be a card picture, the robot included.
export const PICTURES = [...FACE_NAMES, ROBOT];

export const sizeKey = ([a, b]) => `${a}x${b}`;
export function parseSize(key) {
  const size = SIZES.find(s => sizeKey(s) === key);
  if (!size) throw new Error(`unknown grid size: ${key}`);
  return [...size];
}

// A shuffled copy (Fisher-Yates). `rand` returns numbers in [0, 1).
export function shuffle(items, rand = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The cards for a round: `pairs` pairs of pictures, none of them in
// `exclude` (the players' faces), shuffled. Pictures repeat (4 of a kind)
// only when there are more pairs than pictures.
export function makeDeck(pairs, exclude = [], rand = Math.random) {
  const pool = PICTURES.filter(p => !exclude.includes(p));
  if (!pool.length) throw new Error('makeDeck: no pictures left');
  const pics = [];
  while (pics.length < pairs) pics.push(...shuffle(pool, rand).slice(0, pairs - pics.length));
  return shuffle([...pics, ...pics], rand);
}

// How to lay a grid size out in a width x height area (pixels): upright
// (short side across) or sideways, whichever gives bigger cards.
// Returns { cols, rows, cs } where cs is the card size in whole pixels.
export function fitLayout([a, b], width, height, { gap = 8, max = 130 } = {}) {
  const fit = (cols, rows) => Math.floor(Math.min(
    (width - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows, max));
  const upright = fit(a, b);
  const sideways = fit(b, a);
  return upright >= sideways ? { cols: a, rows: b, cs: upright } : { cols: b, rows: a, cs: sideways };
}
export const sizeFits = (size, width, height, opts) => fitLayout(size, width, height, opts).cs >= MIN_CARD;

// A new match: scores 0-0, player 1 starts. `solo` is playing alone.
// Throws if the picks aren't valid (the screen keeps "Play!" greyed until
// they are, so this is a guard, not the normal path).
export function createMatch({ solo, p1, p2, firstRule = 'alt', size = DEFAULT_SIZE }) {
  const why = checkFaces({ onePlayer: solo, p1, p2 });
  if (why) throw new Error(`can't start: ${why}`);
  if (!FIRST_RULES.includes(firstRule)) throw new Error(`unknown first rule: ${firstRule}`);
  return {
    solo: !!solo,
    faces: [p1, solo ? null : p2],
    firstRule,
    size: parseSize(size),
    starter: 1,
    wins: { 1: 0, 2: 0, ties: 0 },   // two players: rounds won
    best: {},                         // playing alone: fewest turns per grid size
    // the round (set by newRound):
    deck: [], state: [], foundBy: [], turn: 1, pairs: { 1: 0, 2: 0 }, turns: 0,
    open: [], pending: null, result: null,
  };
}

// Deals a new round. The match's starter goes first. Called for "Play
// again" too: mid-round, that restarts the round unscored, with the same
// starter (the starter only changes when a round finishes).
export function newRound(match, rand = Math.random) {
  const [a, b] = match.size;
  match.deck = makeDeck(a * b / 2, match.faces.filter(Boolean), rand);
  match.state = match.deck.map(() => 'down');   // 'down' | 'up' | 'found'
  match.foundBy = match.deck.map(() => 0);
  match.turn = match.starter;
  match.pairs = { 1: 0, 2: 0 };
  match.turns = 0;
  match.open = [];
  match.pending = null;
  match.result = null;
}

// The player whose turn it is turns card i face up.
// Returns { ok: true, pending } (pending is null after the first card,
// 'match' or 'miss' after the second), or { ok: false, why } where why is
// 'round-over', 'wait' (two cards are still showing), 'bad-card' or
// 'not-face-down'.
export function flip(match, i) {
  if (match.result) return { ok: false, why: 'round-over' };
  if (match.pending) return { ok: false, why: 'wait' };
  if (!Number.isInteger(i) || i < 0 || i >= match.deck.length) return { ok: false, why: 'bad-card' };
  if (match.state[i] !== 'down') return { ok: false, why: 'not-face-down' };
  match.state[i] = 'up';
  match.open.push(i);
  if (match.open.length === 2) {
    const [x, y] = match.open;
    match.turns++;
    match.pending = match.deck[x] === match.deck[y] ? 'match' : 'miss';
  }
  return { ok: true, pending: match.pending };
}

// After the screen has shown the two cards: a match stays face up and
// scores; a miss turns back face down. Either way the turn passes (unless
// that was the last pair: then the round is over and scored).
// Returns { ok: true, was, scorer, result } (scorer: who found the pair,
// or 0), or { ok: false, why: 'nothing-pending' }.
export function settle(match) {
  if (!match.pending) return { ok: false, why: 'nothing-pending' };
  const was = match.pending;
  const [x, y] = match.open;
  let scorer = 0;
  if (was === 'match') {
    scorer = match.turn;
    match.state[x] = match.state[y] = 'found';
    match.foundBy[x] = match.foundBy[y] = scorer;
    match.pairs[scorer]++;
  } else {
    match.state[x] = match.state[y] = 'down';
  }
  match.open = [];
  match.pending = null;
  if (match.state.every(s => s === 'found')) finishRound(match);
  else if (!match.solo) match.turn = 3 - match.turn;
  return { ok: true, was, scorer, result: match.result };
}

function finishRound(match) {
  if (match.solo) {
    const key = sizeKey(match.size);
    const best = match.best[key];
    match.best[key] = best === undefined ? match.turns : Math.min(best, match.turns);
    match.result = { winner: 1, turns: match.turns };
    return;
  }
  const { 1: a, 2: b } = match.pairs;
  const winner = a > b ? 1 : b > a ? 2 : 0;
  match.result = { winner, turns: match.turns };
  if (winner) match.wins[winner]++;
  else match.wins.ties++;
  match.starter = nextStarter(match.starter, winner, match.firstRule);
}
