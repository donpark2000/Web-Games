// Colour Sudoku's puzzle stock (data/colour-sudoku.json, made by
// tools/colour-sudoku-puzzles.js): every puzzle sound for its level, and
// the file what the tool makes now (the first puzzles remade from their
// seeds, the order stockOrder's). Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS, STOCK, EASY_GIVENS, firstSeed, stockOrder, decode, encode, stockPuzzle } from '../src/core/colour-sudoku.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/colour-sudoku.json'), 'utf8'));
const REMAKE = 'stale: run  node tools/colour-sudoku-puzzles.js  then  node tools/offline.js';

// decode throws, saying why, for a puzzle that isn't one: colours not
// nine joined, spread shapes; givens its level's rules can't finish (so
// not one answer) or not in the answer; a Harder one that doesn't need
// "all inside" (src/core: problems).
test('colour sudoku stock: 200 puzzles per level, each sound for its level, none twice', () => {
  assert.deepEqual(Object.keys(data), LEVELS);
  let checked = 0;
  for (const level of LEVELS) {
    assert.equal(data[level].length, STOCK, level);
    const seeds = data[level].map(e => e[0]);
    const bySeed = [...seeds].sort((a, b) => a - b);
    assert.deepEqual(seeds, stockOrder(level, bySeed), `${level}: not in stockOrder's order: ${REMAKE}`);
    assert.ok(bySeed[0] >= firstSeed(level) && bySeed.at(-1) < firstSeed(level) + 100000, `${level}: seeds ${bySeed[0]}..${bySeed.at(-1)}`);
    assert.equal(new Set(data[level].map(e => e[2])).size, STOCK, `${level}: a puzzle twice`);
    for (const e of data[level]) {
      assert.doesNotThrow(() => decode(level, e), `${level}, seed ${e[0]}`);
      checked++;
    }
  }
  assert.equal(checked, LEVELS.length * STOCK);
});

// Easy starts with EASY_GIVENS digits, at least 2 in every box (journal
// Q31, release 3.4; 3.3's had 13-20, and 121 of 200 an empty box);
// Harder with what the maker leaves (12-20).
test('colour sudoku stock: Easy starts with 30 digits spread over the boxes, Harder with fewer', () => {
  const box = i => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3);
  const given = e => [...e[2]].flatMap((d, i) => (d === '0' ? [] : [i]));
  for (const e of data.easy) {
    const g = given(e);
    assert.equal(g.length, EASY_GIVENS, `easy seed ${e[0]}: ${g.length} digits to start: ${REMAKE}`);
    const per = new Array(9).fill(0);
    for (const i of g) per[box(i)]++;
    assert.ok(Math.min(...per) >= 2, `easy seed ${e[0]}: per box ${per}`);
  }
  for (const e of data.harder) {
    const n = given(e).length;
    assert.ok(n >= 12 && n <= 20, `harder seed ${e[0]}: ${n} digits to start`);
  }
});

// The first puzzles remade by the tool's rule (every seed from the first,
// kept or not, up to the 2nd kept one): the same seeds kept, the same
// puzzles. About 4 s.
test('colour sudoku stock: the file is what the tool makes now', () => {
  let remade = 0;
  for (const level of LEVELS) {
    const kept = [];
    for (let seed = firstSeed(level); kept.length < 2; seed++) {
      const p = stockPuzzle(level, seed);
      if (p) kept.push(encode(seed, p));
      remade++;
    }
    assert.deepEqual(kept, [...data[level]].sort((a, b) => a[0] - b[0]).slice(0, 2), `${level}: ${REMAKE}`);
  }
  assert.ok(remade >= 4, `only ${remade} seeds remade`);
});
