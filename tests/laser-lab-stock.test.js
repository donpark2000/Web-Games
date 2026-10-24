// Laser Lab's puzzle stock (data/laser-lab.json, made by
// tools/laser-lab-puzzles.js): every puzzle sound, its cheapest cost
// proved on a sample, and the file what the tool makes now (puzzles remade
// from their seeds, the order stockOrder's). Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SETUPS, stockSize, stockPurple, stockBombs, isPurple, hasBomb, RUN, MAKE, firstSeed, bombSeed, stockOrder, decode, encode, stockPuzzle, cheapest, bothUsePieces, orderMatters, parseSetup } from '../src/core/laser-lab.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/laser-lab.json'), 'utf8'));
const REMAKE = 'stale: run  node tools/laser-lab-puzzles.js  then  node tools/offline.js';

// decode throws, saying why, for a puzzle that isn't one (the board, the
// lasers, the gems, an answer that isn't right or doesn't cost the
// cheapest: src/core problems).
test('laser lab stock: 100 puzzles per size and lasers (50 at 8×8 with two), each sound, none twice, in stockOrder', () => {
  assert.deepEqual(Object.keys(data), SETUPS);
  let checked = 0;
  for (const s of SETUPS) {
    const { n, lasers } = parseSetup(s);
    assert.equal(data[s].length, stockSize(s), s);
    const seeds = data[s].map(e => e[0]);
    const bySeed = [...seeds].sort((a, b) => a - b);
    assert.deepEqual(seeds, stockOrder(s, [...data[s]].sort((a, b) => a[0] - b[0])).map(e => e[0]), `${s}: not in stockOrder's order: ${REMAKE}`);
    assert.ok(bySeed[0] >= firstSeed(s) && bySeed.at(-1) < firstSeed(s) + 1000000, `${s}: seeds ${bySeed[0]}..${bySeed.at(-1)}`);
    assert.equal(new Set(data[s].map(e => e[2])).size, stockSize(s), `${s}: a board twice`);
    for (const e of data[s]) {
      let p;
      assert.doesNotThrow(() => { p = decode(s, e); }, `${s}, seed ${e[0]}`);
      assert.equal(p.n, n);
      assert.ok(p.cheapest >= MAKE[n].minCost, `${s} ${e[0]}: cheapest ${p.cheapest} under the floor`);
      if (lasers > 1) assert.ok(bothUsePieces(p) || (hasBomb(e) && orderMatters(p)), `${s} ${e[0]}: a laser that uses no piece`);
      // a bomb puzzle's seed from bombSeed on, the others' below it (8 x 8
      // with two lasers: no bombs, its seeds past bombSeed)
      assert.equal(stockBombs(s) > 0 && e[0] >= bombSeed(s), hasBomb(e), `${s} ${e[0]}: seed and bomb don't agree`);
      assert.ok(p.bombs.length <= 1, `${s} ${e[0]}: ${p.bombs.length} bombs`);
      checked++;
    }
  }
  assert.equal(checked, SETUPS.reduce((k, s) => k + stockSize(s), 0));
  assert.equal(stockSize('8-2'), 50);
});

// Purple gems (developer, 2026-10-22): about 1 in 3 two-laser puzzles at
// 6 x 6 and 7 x 7, spread so every run of 10 has 3 or 4, never side by
// side; 8 x 8's 3 in different runs; none with one laser.
test('laser lab stock: purple gems in about 1 in 3 two-laser puzzles, spread through every run', () => {
  let runs = 0;
  for (const s of SETUPS) {
    const at = data[s].map((e, i) => (isPurple(e) ? i : -1)).filter(i => i >= 0);
    assert.equal(at.length, stockPurple(s), `${s}: ${at.length} purple, not ${stockPurple(s)}: ${REMAKE}`);
    const perRun = Array.from({ length: data[s].length / RUN }, (_, k) => at.filter(i => Math.floor(i / RUN) === k).length);
    runs += perRun.length;
    if (s.endsWith('-1')) assert.equal(at.length, 0, s);
    else if (s === '8-2') assert.deepEqual(perRun.filter(Boolean), [1, 1, 1], `${s}: purple per run ${perRun}`);
    else {
      assert.ok(at.length >= 0.3 * data[s].length && at.length <= 0.35 * data[s].length, `${s}: ${at.length} purple of ${data[s].length}`);
      assert.ok(perRun.every(c => c >= 3 && c <= 4), `${s}: purple per run ${perRun}`);
      // round the end too (after the last puzzle the first comes again)
      at.forEach((i, j) => assert.ok(((at[(j + 1) % at.length] - i + data[s].length) % data[s].length) >= 2, `${s}: purple side by side at ${i + 1}`));
    }
  }
  assert.equal(runs, SETUPS.reduce((k, s) => k + stockSize(s) / RUN, 0));
});

// Directional bombs (developer, 2026-10-23: "about 50% ... does not have
// to be exactly 'every second game'"): half of each run of 10, never
// three bomb puzzles (or three without) side by side in a run; none at
// 8 x 8 with two lasers yet.
test('laser lab stock: bombs in half of every run, mixed in', () => {
  let runs = 0;
  for (const s of SETUPS) {
    const has = data[s].map(hasBomb);
    assert.equal(has.filter(Boolean).length, stockBombs(s), `${s}: ${has.filter(Boolean).length} bombs, not ${stockBombs(s)}: ${REMAKE}`);
    if (s === '8-2') { assert.equal(stockBombs(s), 0); runs += data[s].length / RUN; continue; }
    assert.equal(stockBombs(s), data[s].length / 2, s);
    for (let at = 0; at < data[s].length; at += RUN) {
      const run = has.slice(at, at + RUN);
      assert.equal(run.filter(Boolean).length, RUN / 2, `${s}: run ${at / RUN + 1}: ${run.filter(Boolean).length} bombs`);
      run.forEach((x, i) => assert.ok(i < 2 || x !== run[i - 1] || x !== run[i - 2], `${s}: three ${x ? 'bomb puzzles' : 'without a bomb'} in a row at ${at + i - 1}`));
      runs++;
    }
    // with two lasers, purple bomb puzzles too
    if (parseSetup(s).lasers > 1) assert.ok(data[s].some(e => hasBomb(e) && isPurple(e)), `${s}: no purple bomb puzzle`);
  }
  assert.equal(runs, SETUPS.reduce((k, s) => k + stockSize(s) / RUN, 0));
});

// The cheapest cost stored is proved (nothing cheaper lights every gem),
// on the first two of each setup, and (bombs) its first two with a bomb.
test('laser lab stock: the cheapest cost proved, two per setup and two with a bomb', () => {
  let proved = 0;
  for (const s of SETUPS) for (const e of [...data[s].slice(0, 2), ...data[s].filter(hasBomb).slice(0, 2)]) {
    const p = decode(s, e);
    assert.equal(cheapest(p).cost, p.cheapest, `${s} ${e[0]}: ${REMAKE}`);
    proved++;
  }
  assert.equal(proved, SETUPS.length * 2 + SETUPS.filter(s => stockBombs(s)).length * 2);
});

// Remade from their seeds by the maker as it is now: two puzzles per
// setup the same; and for 6 x 6, one laser, every seed from the first up
// to the second kept one (made or not) as the tool's rule says.
test('laser lab stock: the file is what the tool makes now', () => {
  let remade = 0;
  for (const s of SETUPS) for (const e of data[s].slice(0, 2)) {
    const p = stockPuzzle(s, e[0]);
    assert.ok(p, `${s} seed ${e[0]} makes nothing now: ${REMAKE}`);
    assert.deepEqual(encode(p), e, `${s} seed ${e[0]}: ${REMAKE}`);
    remade++;
  }
  const kept = [];
  for (let seed = firstSeed('6-1'); kept.length < 2; seed++) {
    const p = stockPuzzle('6-1', seed);
    if (p) kept.push(encode(p));
    remade++;
  }
  assert.deepEqual(kept, [...data['6-1']].sort((a, b) => a[0] - b[0]).slice(0, 2), `6-1: ${REMAKE}`);
  // 6 x 6, two lasers: the first two purple and first two others the
  // file's, in seed order (the others made are passed over)
  const by = [[], []];
  for (let seed = firstSeed('6-2'); by.some(g => g.length < 2); seed++) {
    const p = stockPuzzle('6-2', seed);
    if (p) { const e = encode(p), g = by[+isPurple(e)]; if (g.length < 2) g.push(e); }
    remade++;
  }
  const file = [...data['6-2']].sort((a, b) => a[0] - b[0]);
  const plain = file.filter(e => !hasBomb(e));
  assert.deepEqual(by, [plain.filter(e => !isPurple(e)).slice(0, 2), plain.filter(isPurple).slice(0, 2)], `6-2: ${REMAKE}`);
  // bombs (3.9): from bombSeed on, 6 x 6 one laser's first two the file's
  const bombs = [];
  for (let seed = bombSeed('6-1'); bombs.length < 2; seed++) {
    const p = stockPuzzle('6-1', seed);
    if (p) { assert.equal(p.bombs.length, 1, `6-1 seed ${seed}: no bomb`); bombs.push(encode(p)); }
    remade++;
  }
  assert.deepEqual(bombs, [...data['6-1']].filter(hasBomb).sort((a, b) => a[0] - b[0]).slice(0, 2), `6-1 bombs: ${REMAKE}`);
  assert.ok(remade > SETUPS.length * 2 + 2, `only ${remade} seeds remade`);
});
