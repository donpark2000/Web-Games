import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNT_TO, ROBOT, ROBOT_TUNING, checkFaces, makeDeck, createMatch, newRound, flip, settle, robotPick,
} from '../src/core/count-to-9.js';
import { DOTS } from '../src/ui/numbercard.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const never = () => 0.99;    // rand: the robot never remembers (0.99 >= remember)
const always = () => 0;      // rand: the robot always remembers
// A match with a known deck: deck[i] is the number on card i.
function withDeck(opts, deck) {
  const m = createMatch({ p1: 'bear', p2: 'cat', ...opts });
  newRound(m, seeded(1));
  m.deck = [...deck];
  return m;
}
const DECK = [5, 2, 9, 1, 7, 3, 8, 4, 6];
const cardOf = (m, n) => m.deck.indexOf(n);
// Turns over the cards holding these numbers, in order.
const count = (m, ...nums) => nums.map(n => flip(m, cardOf(m, n), never));

test('deck: the numbers 1 to 9, shuffled, repeatable with a seed', () => {
  const d = makeDeck(COUNT_TO, seeded(3));
  assert.deepEqual([...d].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.deepEqual(makeDeck(COUNT_TO, seeded(3)), d);
  assert.notDeepEqual(d, [1, 2, 3, 4, 5, 6, 7, 8, 9], 'seed 3 should move something');
});

test('setup: faces checked per mode; bad mode, level or rule refused', () => {
  assert.equal(checkFaces({ mode: 'solo', p1: 'bear' }), '');
  assert.equal(checkFaces({ mode: 'robot', p1: 'bear', p2: 'bear' }), '', 'player 2 ignored against the robot');
  assert.equal(checkFaces({ mode: 'two', p1: 'bear', p2: 'bear' }), 'same-face');
  assert.equal(checkFaces({ mode: 'two', p1: 'bear' }), 'p2-missing');
  assert.deepEqual(createMatch({ mode: 'robot', p1: 'fox' }).faces, ['fox', ROBOT]);
  assert.deepEqual(createMatch({ mode: 'solo', p1: 'fox' }).faces, ['fox', null]);
  assert.throws(() => createMatch({ mode: 'three', p1: 'fox' }), /unknown mode/);
  assert.throws(() => createMatch({ mode: 'solo', p1: 'fox', level: 'medium' }), /unknown level/);
  assert.throws(() => createMatch({ mode: 'solo', p1: 'fox', firstRule: 'oldest' }), /unknown first rule/);
  assert.throws(() => createMatch({ mode: 'two', p1: 'fox', p2: 'fox' }), /same-face/);
});

test('play: the right numbers keep the turn; a wrong one is pending, then the turn passes', () => {
  const m = withDeck({ mode: 'two' }, DECK);
  const [a, b] = count(m, 1, 2);
  assert.ok(a.ok && a.correct && b.correct);
  assert.equal(m.turn, 1, 'still player 1');
  assert.equal(m.next, 3);
  const miss = flip(m, cardOf(m, 7), never);
  assert.deepEqual(miss, { ok: true, correct: false, number: 7, result: null });
  assert.equal(m.pending, 'miss');
  assert.equal(m.wrong, cardOf(m, 7));
  assert.deepEqual(flip(m, cardOf(m, 3), never), { ok: false, why: 'wait' }, 'no taps while the wrong card shows');
  const s = settle(m);
  assert.deepEqual(s, { ok: true, reset: false, turn: 2 });
  assert.equal(m.up[cardOf(m, 7)], false, 'the wrong card turned back');
  assert.deepEqual(settle(m), { ok: false, why: 'nothing-pending' });
});

test('easy: counted numbers stay up and the next player carries on', () => {
  const m = withDeck({ mode: 'two', level: 'easy' }, DECK);
  count(m, 1, 2, 3, 8);
  settle(m);
  assert.equal(m.next, 4, 'the count is shared');
  assert.deepEqual([1, 2, 3].map(n => m.up[cardOf(m, n)]), [true, true, true]);
  assert.deepEqual([1, 2, 3].map(n => m.by[cardOf(m, n)]), [1, 1, 1], 'tinted player 1');
  assert.equal(m.turn, 2);
  const r = count(m, 4);
  assert.ok(r[0].correct);
  assert.equal(m.by[cardOf(m, 4)], 2);
});

test('hard: a miss turns every card back and the count starts at 1', () => {
  const m = withDeck({ mode: 'two', level: 'hard' }, DECK);
  count(m, 1, 2, 3, 8);
  assert.deepEqual(settle(m), { ok: true, reset: true, turn: 2 });
  assert.equal(m.next, 1);
  assert.ok(m.up.every(u => !u), 'all face down');
  assert.ok(m.by.every(b => b === 0));
});

test('win: whoever turns over the 9 wins (easy and hard); the round is then over', () => {
  for (const level of ['easy', 'hard']) {
    const m = withDeck({ mode: 'two', level, firstRule: 'alt' }, DECK);
    count(m, 4);           // player 1 misses straight away
    settle(m);
    const rs = count(m, 1, 2, 3, 4, 5, 6, 7, 8, 9);
    assert.deepEqual(rs.at(-1).result, { winner: 2, turns: 2 }, level);
    assert.deepEqual(m.wins, { 1: 0, 2: 1 }, level);
    assert.equal(m.starter, 2, `${level}: take turns, so player 2 starts next`);
    assert.deepEqual(flip(m, 0, never), { ok: false, why: 'round-over' });
  }
});

test('refusals: a bad card or a face-up card', () => {
  const m = withDeck({ mode: 'solo' }, DECK);
  assert.deepEqual(flip(m, 9, never), { ok: false, why: 'bad-card' });
  assert.deepEqual(flip(m, -1, never), { ok: false, why: 'bad-card' });
  assert.deepEqual(flip(m, 1.5, never), { ok: false, why: 'bad-card' });
  count(m, 1);
  assert.deepEqual(flip(m, cardOf(m, 1), never), { ok: false, why: 'face-up' });
});

test('just me: turns counted; the best per level is the fewest', () => {
  const m = withDeck({ mode: 'solo', level: 'easy' }, DECK);
  count(m, 1, 5);
  settle(m);
  assert.equal(m.turn, 1, 'alone, the turn stays');
  count(m, 2, 3, 4, 5, 6, 7, 8);
  const last = count(m, 9)[0];
  assert.deepEqual(last.result, { winner: 1, turns: 2 });
  assert.deepEqual(m.best, { easy: 2 });
  newRound(m, seeded(2));
  m.deck = [...DECK];
  count(m, 3); settle(m); count(m, 3); settle(m);
  count(m, 1, 2, 3, 4, 5, 6, 7, 8, 9);
  assert.equal(m.result.turns, 3);
  assert.deepEqual(m.best, { easy: 2 }, 'a worse round keeps the best');
  assert.deepEqual(m.wins, { 1: 0, 2: 0 }, 'nothing "won" alone');
});

test('play again mid-round: a new deck, same starter, nothing scored', () => {
  const m = createMatch({ mode: 'robot', p1: 'bear' });
  newRound(m, seeded(5));
  const first = [...m.deck];
  flip(m, 0, always);
  newRound(m, seeded(6));
  assert.notDeepEqual(m.deck, first);
  assert.equal(m.turn, 1);
  assert.equal(m.next, 1);
  assert.ok(m.up.every(u => !u) && m.seen.every(s => !s), 'robot memory cleared');
  assert.deepEqual(m.wins, { 1: 0, 2: 0 });
});

test('robot memory: only cards turned over, each with chance "remember"', () => {
  assert.equal(ROBOT_TUNING.remember, 0.6);
  const m = withDeck({ mode: 'robot' }, DECK);
  flip(m, cardOf(m, 1), () => 0.59);   // remembered
  flip(m, cardOf(m, 8), () => 0.6);    // forgotten (a miss)
  assert.deepEqual(m.seen.map((s, i) => (s ? m.deck[i] : 0)).filter(Boolean), [1]);
  const two = withDeck({ mode: 'two' }, DECK);
  flip(two, 0, () => { throw new Error('rand used without a robot'); });
  assert.ok(two.seen.every(s => !s));
});

test('robot: takes the next number when it remembers where it is', () => {
  const m = withDeck({ mode: 'robot' }, DECK);
  m.turn = 2;
  m.seen[cardOf(m, 1)] = true;
  m.seen[cardOf(m, 6)] = true;
  assert.deepEqual(robotPick(m, () => { throw new Error('no guess needed'); }), { card: cardOf(m, 1), reason: 'remembered' });
});

test('robot: never peeks; guesses only among cards it does not remember', () => {
  // Same rand, two different decks, nothing remembered: the same card.
  // If the robot looked at the numbers, it would pick the 1 in each.
  const a = withDeck({ mode: 'robot' }, DECK);
  const b = withDeck({ mode: 'robot' }, [...DECK].reverse());
  for (const r of [0, 0.3, 0.5, 0.99]) {
    assert.deepEqual(robotPick(a, () => r), robotPick(b, () => r), `rand ${r}`);
    assert.equal(robotPick(a, () => r).reason, 'guess');
  }
  // It remembers the 5 and the 9 (not the 1 it wants): it never picks them,
  // nor a face-up card.
  const m = withDeck({ mode: 'robot', level: 'easy' }, DECK);
  m.seen[cardOf(m, 5)] = m.seen[cardOf(m, 9)] = true;
  count(m, 1);
  m.next = 2;
  const rand = seeded(9);
  for (let n = 0; n < 200; n++) {
    const { card } = robotPick(m, rand);
    assert.ok(![cardOf(m, 5), cardOf(m, 9), cardOf(m, 1)].includes(card), `picked card ${card} (${m.deck[card]})`);
  }
});

test('robot: whole rounds against a random player always finish, both levels', () => {
  const rand = seeded(42);
  let robotWins = 0;
  for (const level of ['easy', 'hard']) {
    for (let round = 0; round < 50; round++) {
      const m = createMatch({ mode: 'robot', p1: 'bear', level });
      newRound(m, rand);
      for (let steps = 0; !m.result; steps++) {
        if (steps > 2000) throw new Error(`${level}: round never ended`);
        if (m.pending) { settle(m); continue; }
        const down = m.up.map((u, i) => (u ? -1 : i)).filter(i => i >= 0);
        const card = m.turn === 2 ? robotPick(m, rand).card : down[Math.floor(rand() * down.length)];
        assert.ok(flip(m, card, rand).ok);
      }
      if (m.result.winner === 2) robotWins++;
    }
  }
  // A child who remembers nothing should usually lose to it, but not always.
  assert.ok(robotWins > 50 && robotWins < 100, `robot won ${robotWins} of 100`);
});

test('number cards: 1 to 9 dots, all different, each on the 3x3 grid', () => {
  const seen = new Set();
  for (let n = 1; n <= 9; n++) {
    assert.equal(DOTS[n].length, n, `${n}`);
    assert.ok(DOTS[n].every(k => k >= 0 && k <= 8 && Number.isInteger(k)), `${n}`);
    assert.equal(new Set(DOTS[n]).size, n, `${n}: a dot twice`);
    seen.add(DOTS[n].join());
  }
  assert.equal(seen.size, 9);
});
