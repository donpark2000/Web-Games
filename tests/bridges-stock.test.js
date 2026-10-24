// Bridges' puzzle stock (data/bridges.json, made by
// tools/bridges-puzzles.js): every puzzle sound for its size (one answer,
// reached by reasoning alone), no shape twice, and the file what the tool
// makes now (the first puzzles remade from their seeds, the order
// stockOrder's). Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, STOCK, MAKE, firstSeed, stockOrder, decode, encode, stockPuzzle, shapeKey, edgesOf } from '../src/core/bridges.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/bridges.json'), 'utf8'));
const REMAKE = 'stale: run  node tools/bridges-puzzles.js  then  node tools/offline.js';

// decode throws, saying why, for a puzzle that isn't one (src/core:
// problems): islands off the board, side by side or wanting too many; not
// exactly one answer; reasoning alone stuck.
test('bridges stock: 200 puzzles per size, each sound, no shape twice', () => {
  assert.deepEqual(Object.keys(data), SIZES);
  let checked = 0;
  for (const size of SIZES) {
    assert.equal(data[size].length, STOCK[size], size);
    const seeds = data[size].map(e => e[0]);
    const bySeed = [...seeds].sort((a, b) => a - b);
    assert.deepEqual(seeds, stockOrder(size, bySeed), `${size}: not in stockOrder's order: ${REMAKE}`);
    // Large keeps about 1 in 600 seeds: its 200 run past the next 100,000
    assert.ok(bySeed[0] >= firstSeed(size) && bySeed.at(-1) < firstSeed(size) + 1000000, `${size}: seeds ${bySeed[0]}..${bySeed.at(-1)}`);
    assert.equal(new Set(seeds).size, seeds.length, `${size}: a seed twice`);
    const shapes = new Set();
    for (const e of data[size]) {
      let p;
      assert.doesNotThrow(() => { p = decode(size, e); }, `${size}, seed ${e[0]}`);
      assert.equal(p.islands.length, MAKE[size].islands, `${size} seed ${e[0]}: islands`);
      assert.ok(edgesOf(p).edges.length / p.islands.length >= MAKE[size].minRatio, `${size} seed ${e[0]}: too few possible bridges`);
      shapes.add(shapeKey(p));
      checked++;
    }
    assert.equal(shapes.size, STOCK[size], `${size}: the same puzzle twice (turned or flipped)`);
  }
  assert.equal(checked, SIZES.reduce((s, z) => s + STOCK[z], 0));
});

// Small is the kids': every island wants 1 to 4, drawn as a die's dots.
test('bridges stock: Small wants at most 4 bridges an island', () => {
  for (const e of data.small) assert.ok(e[1].split(' ').every(t => t[2] >= '1' && t[2] <= '4'), `small seed ${e[0]}: ${e[1]}`);
});

// The first puzzles remade by the tool's rule (every seed from the first,
// kept or not, skipping a shape already kept): the same seeds kept, the
// same puzzles. Under a second.
test('bridges stock: the file is what the tool makes now', () => {
  let remade = 0;
  for (const size of SIZES) {
    const kept = [], shapes = new Set();
    for (let seed = firstSeed(size); kept.length < 10; seed++) {
      const p = stockPuzzle(size, seed);
      remade++;
      if (!p || shapes.has(shapeKey(p))) continue;
      shapes.add(shapeKey(p));
      kept.push(encode(p));
    }
    assert.deepEqual(kept, [...data[size]].sort((a, b) => a[0] - b[0]).slice(0, 10), `${size}: ${REMAKE}`);
  }
  assert.ok(remade >= 30, `only ${remade} seeds remade`);
});
