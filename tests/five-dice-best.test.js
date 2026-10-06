import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROLLS, BOXES, UPPER, counts, score, points, openBoxes, rollDie,
  createMatch, newRound, roll, toggle, scoreBox, endTurn,
} from '../src/core/five-dice.js';
import {
  solve, values, useValues, hasValues, fromFile, toFile, bestPlay, gameWorth, storedWorth, worthFromNext, cardState,
} from '../src/core/five-dice-best.js';

const LONG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'five-dice-long.bin');
const loadLong = async () => fromFile(new Uint16Array((await readFile(LONG_FILE)).buffer.slice(0)));

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One game alone, the best play; returns the points.
function soloGame(length, rand) {
  const m = createMatch({ mode: 'solo', p1: 'bear', length });
  while (!m.result) {
    roll(m, rand);
    for (;;) {
      const plan = bestPlay(m.dice, m.rolls, m.cards[1], length);
      if (plan.box) { assert.ok(scoreBox(m, plan.box).ok); break; }
      plan.up.forEach((u, i) => { if (u) toggle(m, i); });
      assert.ok(roll(m, rand).ok);
    }
    endTurn(m);
  }
  return m.result.points[1];
}
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = xs => Math.sqrt(mean(xs.map(x => (x - mean(xs)) ** 2)));

// Run first: nothing loaded yet in this process.
test('best: the long game without its values: plays for the most points this turn', () => {
  assert.equal(hasValues('long'), false);
  assert.ok(values('long').every(v => v === 0));
  assert.deepEqual(bestPlay([1, 1, 1, 2, 2], 3, { five: 0 }, 'long').box, 'house');
  assert.equal(bestPlay([6, 6, 6, 6, 6], 1, {}, 'long').box, 'five');
});

test('best: the short game is worth 70.41 points; the best play scores that on average', () => {
  const t = Date.now();
  const V = solve('short');
  assert.ok(Date.now() - t < 2000, `short solve took ${Date.now() - t} ms`);
  assert.equal(gameWorth('short').toFixed(2), '70.41');
  assert.equal(V[0], gameWorth('short'));
  const rand = seeded(7), pts = Array.from({ length: 3000 }, () => soloGame('short', rand));
  const err = 3 * sd(pts) / Math.sqrt(pts.length);
  assert.ok(Math.abs(mean(pts) - 70.41) < err, `3000 games: ${mean(pts).toFixed(2)} ± ${err.toFixed(2)}`);
});

test('best: the saved long-game file: an empty card is worth 245.87 (James Glenn\'s figure)', async () => {
  const V = await loadLong();
  assert.equal(V.length, 2 ** 13 * 64);
  assert.throws(() => useValues('long', V.subarray(1)), /needs 524288 values/);
  useValues('long', V);
  assert.equal(hasValues('long'), true);
  assert.equal(gameWorth('long').toFixed(2), '245.87');
  assert.deepEqual(Array.from(toFile(fromFile(Uint16Array.of(0, 1, 24587)))), [0, 1, 24587]);
});

// A random card part way through a long game: some boxes filled with
// points they could have.
function randomCard(rand) {
  const card = {};
  for (const b of BOXES.long) {
    if (rand() < 0.5) continue;
    const dice = Array.from({ length: 5 }, () => rollDie(rand));
    card[b] = UPPER.includes(b) && rand() < 0.5 ? Number(b) * Math.floor(rand() * 6) : score(b, dice);
  }
  if (Object.keys(card).length === BOXES.long.length) delete card.chance;
  return card;
}
// Each card's saved value against the one worked out again from the
// saved values of the cards after it. The file holds hundredths, so they
// agree to within about 0.01.
function checkFile(V, cards) {
  const bad = [];
  for (const card of cards) {
    const a = storedWorth(card, 'long', V), b = worthFromNext(card, 'long', V);
    if (Math.abs(a - b) > 0.011) bad.push(`${JSON.stringify(card)}: saved ${a}, worked out ${b.toFixed(3)}`);
  }
  return bad;
}

test('best: the saved long-game file agrees with the rules (300 cards checked)', async () => {
  const V = await loadLong(), rand = seeded(11);
  const cards = [{}, ...Array.from({ length: 299 }, () => randomCard(rand))];
  assert.deepEqual(checkFile(V, cards), [], 'checked 300 cards');
  // The check can fail: one saved value off by 0.05 is reported.
  const broken = V.slice(), card = cards[5];
  const { mask, up } = cardState(card, 'long');
  broken[mask * 64 + up] += 0.05;
  const bad = checkFile(broken, [card]);
  assert.equal(bad.length, 1, 'a value off by 0.05 was not caught');
});

test('best: five the same goes in 5 the same (the developer\'s game: not 15 in the 3s)', () => {
  for (const length of ['short', 'long']) {
    for (const rolls of [1, 2, 3]) {
      const plan = bestPlay([3, 3, 3, 3, 3], rolls, { 1: 2, 2: 6 }, length);
      assert.deepEqual([plan.box, plan.points], ['five', 50], `${length}, roll ${rolls}`);
    }
  }
  assert.deepEqual(bestPlay([2, 3, 4, 5, 6], 1, {}, 'long').box, 'big', '5 in a row at once');
});

test('best: keeps the right dice; never a filled box, never rolls nothing; refuses bad input', () => {
  // Three 6s on the first roll of an empty short card: keep the 6s.
  assert.deepEqual(bestPlay([6, 2, 6, 1, 6], 1, {}, 'short').up, [false, true, false, true, false]);
  const rand = seeded(21);
  let boxes = 0, plans = 0;
  for (let k = 0; k < 3000; k++) {
    const length = k % 2 ? 'long' : 'short';
    const card = length === 'long' ? randomCard(rand) : Object.fromEntries(BOXES.short.filter(() => rand() < 0.5).map(b => [b, 0]));
    if (!openBoxes(card, length).length) continue;
    const dice = Array.from({ length: 5 }, () => rollDie(rand)), rolls = 1 + (k % 3);
    const plan = bestPlay(dice, rolls, card, length);
    plans++;
    if (plan.box) {
      boxes++;
      assert.ok(openBoxes(card, length).includes(plan.box), `${plan.box} is filled`);
      assert.equal(plan.points, score(plan.box, dice));
    } else {
      assert.ok(rolls < ROLLS, 'no rolls left: it must score');
      assert.equal(plan.up.length, 5);
      assert.ok(plan.up.some(Boolean), `rolls nothing: ${dice}`);
    }
  }
  assert.ok(boxes > 800 && plans - boxes > 800, `${boxes} boxes of ${plans}`);
  const full = Object.fromEntries(BOXES.short.map(b => [b, 0]));
  assert.throws(() => bestPlay([1, 2, 3, 4, 5], 1, full, 'short'), /no open boxes/);
  assert.throws(() => bestPlay([1, 2, 3, 4, 5], 0, {}, 'short'), /bad rolls/);
});

test('best: a long game scores 245.87 on average (1000 games)', () => {
  assert.equal(hasValues('long'), true, 'loaded by the test above');
  const rand = seeded(3), pts = Array.from({ length: 1000 }, () => soloGame('long', rand));
  const err = 3 * sd(pts) / Math.sqrt(pts.length);
  assert.ok(Math.abs(mean(pts) - 245.87) < err, `1000 games: ${mean(pts).toFixed(2)} ± ${err.toFixed(2)}`);
});

// A simple player, the yardstick (journal, mockup v2): keeps the most
// common number (the higher one on a tie), uses all 3 rolls, then takes the
// biggest score among its open boxes.
function simplePlan(dice, rolls, open) {
  if (rolls >= ROLLS) return { box: open.map(box => ({ box, s: score(box, dice) })).sort((a, b) => b.s - a.s)[0].box };
  const c = counts(dice), v = [6, 5, 4, 3, 2, 1].sort((a, b) => c[b] - c[a])[0];
  const up = dice.map(x => x !== v);
  return up.some(Boolean) ? { up } : simplePlan(dice, ROLLS, open);
}
function robotVsSimple(length, games, rand) {
  const m = createMatch({ mode: 'two', p1: 'bear', p2: 'cat', length });
  for (let g = 0; g < games; g++) {
    newRound(m);
    while (!m.result) {
      roll(m, rand);
      for (;;) {
        const p = m.turn, open = openBoxes(m.cards[p], length);
        const plan = p === 1 ? bestPlay(m.dice, m.rolls, m.cards[p], length) : simplePlan(m.dice, m.rolls, open);
        if (plan.box) { scoreBox(m, plan.box); break; }
        plan.up.forEach((u, i) => { if (u) toggle(m, i); });
        roll(m, rand);
      }
      endTurn(m);
    }
    assert.equal(m.result.points[1], points(m.cards[1], length));
  }
  return m.wins[1] / games;
}

// The robot plays its best now (developer, 2026-10-06), so it beats a
// simple player more often than not; the old robot was about even. Measured
// 2026-10-06 (journal): short 69-72%, long 93-96% (the simple player
// averages 152 in the long game, the best play 245).
test('best: beats a simple player more often than not, short and long (1000 games each)', () => {
  const rand = seeded(33);
  const short = robotVsSimple('short', 1000, rand), long = robotVsSimple('long', 1000, rand);
  console.log(`robot won ${(short * 100).toFixed(1)}% short, ${(long * 100).toFixed(1)}% long`);
  assert.ok(short > 0.5 && short < 0.9, `short: robot won ${(short * 100).toFixed(1)}%`);
  assert.ok(long > 0.5 && long < 0.99, `long: robot won ${(long * 100).toFixed(1)}%`);
});
