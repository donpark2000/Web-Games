import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZES, PICTURES, MIN_CARD, sizeKey, parseSize, shuffle, makeDeck, fitLayout, sizeFits,
  createMatch, newRound, flip, settle,
} from '../src/core/matching.js';

// A small repeatable random source (mulberry32).
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const count = items => items.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
// Indexes of the face-down cards, grouped by picture.
const groups = m => {
  const g = new Map();
  m.deck.forEach((f, i) => { if (m.state[i] === 'down') g.set(f, [...(g.get(f) || []), i]); });
  return [...g.values()];
};
const play = (m, a, b) => { flip(m, a); flip(m, b); return settle(m); };

test('sizes: every grid has an even number of cards; 4x4 is offered', () => {
  for (const [a, b] of SIZES) assert.equal((a * b) % 2, 0, `${a}x${b}`);
  assert.deepEqual(parseSize('4x4'), [4, 4]);
  assert.throws(() => parseSize('5x5'), /unknown grid size/);
});

test('pictures: the 16 faces plus the robot', () => {
  assert.equal(PICTURES.length, 17);
  assert.ok(PICTURES.includes('robot'));
});

test('shuffle: same items, original untouched, repeatable with a seed', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = shuffle(items, seeded(1));
  assert.deepEqual([...a].sort(), items);
  assert.deepEqual(items, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(shuffle(items, seeded(1)), a);
  assert.notDeepEqual(a, items, 'seed 1 should move something');
});

test('deck: every size, both players excluded: every picture appears an even number of times', () => {
  let decks = 0;
  for (const [a, b] of SIZES) {
    for (let s = 1; s <= 50; s++) {
      const deck = makeDeck(a * b / 2, ['bear', 'cat'], seeded(s));
      assert.equal(deck.length, a * b);
      assert.ok(!deck.includes('bear') && !deck.includes('cat'), 'a player face is on a card');
      for (const [pic, n] of count(deck)) assert.equal(n % 2, 0, `${a}x${b} seed ${s}: ${pic} x${n}`);
      decks++;
    }
  }
  assert.equal(decks, SIZES.length * 50);
});

test('deck: pictures repeat only when there are more pairs than pictures', () => {
  // 15 pictures left after two players; 15 pairs (5x6) fit with no repeats.
  const d15 = makeDeck(15, ['bear', 'cat'], seeded(3));
  assert.ok([...count(d15).values()].every(n => n === 2));
  // 18 pairs (6x6): 3 pictures appear 4 times, the rest twice.
  const d18 = makeDeck(18, ['bear', 'cat'], seeded(3));
  const n = [...count(d18).values()].sort();
  assert.deepEqual(n, [...Array(12).fill(2), 4, 4, 4]);
  assert.throws(() => makeDeck(2, PICTURES), /no pictures/);
});

test('layout: upright on a phone, sideways when wide; card size fits both ways', () => {
  const phone = fitLayout([4, 6], 343, 470);
  assert.equal(phone.cols, 4);
  assert.equal(phone.rows, 6);
  assert.ok(phone.cs * 4 + 8 * 3 <= 343 && phone.cs * 6 + 8 * 5 <= 470, JSON.stringify(phone));
  const wide = fitLayout([4, 6], 900, 400);
  assert.equal(wide.cols, 6);
  assert.ok(fitLayout([3, 4], 2000, 2000).cs <= 130, 'cards have a maximum size');
});

test('layout: big grids are refused on a small screen, allowed on a big one', () => {
  assert.ok(sizeFits([4, 4], 343, 470));
  assert.ok(!sizeFits([6, 6], 343, 470), '6x6 cards would be under the minimum on a phone');
  assert.ok(sizeFits([6, 6], 736, 820), 'a tablet fits 6x6');
  assert.ok(fitLayout([6, 6], 343, 470).cs < MIN_CARD);
});

test('createMatch: two players can never share a face; alone needs one face', () => {
  assert.throws(() => createMatch({ solo: false, p1: 'cat', p2: 'cat' }), /same-face/);
  assert.throws(() => createMatch({ solo: false, p1: 'cat' }), /p2-missing/);
  assert.throws(() => createMatch({ solo: true, p1: 'cat', size: '7x7' }), /unknown grid size/);
  const m = createMatch({ solo: true, p1: 'cat', p2: 'cat' });
  assert.deepEqual(m.faces, ['cat', null]);
  assert.deepEqual(m.size, [4, 4]);
});

test('a round: the players\' faces are never on the cards', () => {
  const m = createMatch({ solo: false, p1: 'bear', p2: 'fox', size: '6x6' });
  newRound(m, seeded(9));
  assert.equal(m.deck.length, 36);
  assert.ok(!m.deck.includes('bear') && !m.deck.includes('fox'));
});

test('flip: a match scores and passes the turn; a miss turns back and passes the turn', () => {
  const m = createMatch({ solo: false, p1: 'bear', p2: 'fox', size: '3x4' });
  newRound(m, seeded(2));
  const [g1, g2] = groups(m);
  // Player 1 finds a pair.
  assert.deepEqual(flip(m, g1[0]), { ok: true, pending: null });
  assert.deepEqual(flip(m, g1[1]), { ok: true, pending: 'match' });
  assert.deepEqual(settle(m), { ok: true, was: 'match', scorer: 1, result: null });
  assert.equal(m.state[g1[0]], 'found');
  assert.equal(m.foundBy[g1[1]], 1);
  assert.equal(m.turn, 2, 'a match passes the turn too');
  // Player 2 misses.
  flip(m, g2[0]);
  const other = groups(m).find(g => m.deck[g[0]] !== m.deck[g2[0]]);   // a different picture
  assert.equal(flip(m, other[0]).pending, 'miss');
  assert.equal(settle(m).was, 'miss');
  assert.equal(m.state[g2[0]], 'down');
  assert.equal(m.turn, 1);
  assert.deepEqual(m.pairs, { 1: 1, 2: 0 });
  assert.equal(m.turns, 2);
});

test('flip: refused while two cards show, on a face-up or found card, off the grid, after the end', () => {
  const m = createMatch({ solo: true, p1: 'bear', size: '3x4' });
  newRound(m, seeded(4));
  const [g1, g2] = groups(m);
  flip(m, g1[0]);
  assert.deepEqual(flip(m, g1[0]), { ok: false, why: 'not-face-down' });
  flip(m, g2[0]);
  assert.deepEqual(flip(m, g1[1]), { ok: false, why: 'wait' });
  assert.deepEqual(settle(m).ok, true);
  assert.deepEqual(settle(m), { ok: false, why: 'nothing-pending' });
  for (const bad of [-1, 12, 1.5, '3']) assert.deepEqual(flip(m, bad), { ok: false, why: 'bad-card' });
  while (!m.result) { const [x, y] = groups(m)[0]; play(m, x, y); }
  assert.deepEqual(flip(m, 0), { ok: false, why: 'round-over' });
});

test('two players: the winner has more pairs; wins, ties and the next starter are kept', () => {
  const m = createMatch({ solo: false, p1: 'bear', p2: 'fox', size: '3x4', firstRule: 'lose' });
  newRound(m, seeded(5));
  // 6 pairs: players alternate finding them -> 3-3, a tie.
  while (!m.result) { const [x, y] = groups(m)[0]; play(m, x, y); }
  assert.deepEqual(m.pairs, { 1: 3, 2: 3 });
  assert.deepEqual(m.result, { winner: 0, turns: 6 });
  assert.deepEqual(m.wins, { 1: 0, 2: 0, ties: 1 });
  assert.equal(m.starter, 2, 'after a tie the other player starts');
  // Round 2: player 2 starts; player 1 misses every turn, player 2 finds every pair.
  newRound(m, seeded(6));
  assert.equal(m.turn, 2);
  while (!m.result) {
    const g = groups(m);
    if (m.turn === 1 && g.length > 1) play(m, g[0][0], g[1][0]);
    else play(m, g[0][0], g[0][1]);
  }
  assert.equal(m.result.winner, 2);
  assert.deepEqual(m.wins, { 1: 0, 2: 1, ties: 1 });
  assert.equal(m.starter, 1, 'loser goes first');
});

test('the last pair ends the round without passing the turn', () => {
  const m = createMatch({ solo: false, p1: 'bear', p2: 'fox', size: '3x4' });
  newRound(m, seeded(7));
  while (groups(m).length > 1) { const [x, y] = groups(m)[0]; play(m, x, y); }
  const turnBefore = m.turn;
  const [x, y] = groups(m)[0];
  const r = play(m, x, y);
  assert.equal(r.scorer, turnBefore);
  assert.ok(r.result);
  assert.equal(m.turn, turnBefore);
});

test('alone: turns are counted; the best (fewest turns) is kept per grid size', () => {
  const m = createMatch({ solo: true, p1: 'bear', size: '3x4' });
  newRound(m, seeded(8));
  play(m, groups(m)[0][0], groups(m)[1][0]);   // one miss
  while (!m.result) { const [x, y] = groups(m)[0]; play(m, x, y); }
  assert.deepEqual(m.result, { winner: 1, turns: 7 });
  assert.equal(m.turn, 1, 'alone, the turn never passes');
  assert.deepEqual(m.best, { '3x4': 7 });
  newRound(m, seeded(9));
  while (!m.result) { const [x, y] = groups(m)[0]; play(m, x, y); }
  assert.deepEqual(m.best, { '3x4': 6 }, 'a better round replaces the best');
  newRound(m, seeded(10));
  for (let k = 0; k < 3; k++) play(m, groups(m)[0][0], groups(m)[1][0]);
  while (!m.result) { const [x, y] = groups(m)[0]; play(m, x, y); }
  assert.deepEqual(m.best, { '3x4': 6 }, 'a worse round does not');
  assert.equal(sizeKey(m.size), '3x4');
});

test('Play again mid-round: a fresh deal, unscored, same starter', () => {
  const m = createMatch({ solo: false, p1: 'bear', p2: 'fox', size: '3x4' });
  newRound(m, seeded(11));
  const [x, y] = groups(m)[0];
  play(m, x, y);
  flip(m, groups(m)[0][0]);
  newRound(m, seeded(12));
  assert.ok(m.state.every(s => s === 'down'));
  assert.deepEqual(m.pairs, { 1: 0, 2: 0 });
  assert.deepEqual(m.wins, { 1: 0, 2: 0, ties: 0 });
  assert.equal(m.turn, 1);
  assert.equal(m.pending, null);
});
