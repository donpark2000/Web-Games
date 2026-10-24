// Makes Bridges' puzzle stock (DESIGN.md "Bridges"): for each size, the
// first STOCK seeds from firstSeed(size) on whose puzzle is kept
// (src/core/bridges.js: stockPuzzle) and isn't the same shape, turned or
// flipped, as one kept before it (shapeKey), in the order stockOrder
// gives them (seed order, shuffled once with a fixed seed), so the same
// code always makes the same file. One line per puzzle kept. A seed takes
// under 1 ms on average (measured 2026-10-24: 100,000 seeds in 3-6 s a
// size; Large keeps about 1 in 600, Small has about 630 shapes in all).
//   node tools/bridges-puzzles.js [count] [out]
//     -> data/bridges.json (count: STOCK per size)
// Run it after changing the puzzle maker (the tests remake some puzzles
// and fail, saying so, when the file is stale); then node tools/offline.js.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, STOCK, firstSeed, stockPuzzle, stockOrder, shapeKey, encode } from '../src/core/bridges.js';

// A size that keeps going this many seeds past its first without enough
// puzzles stops the tool (a change to the maker could keep almost none).
const MAX_SEEDS = 2000000;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const count = process.argv[2] == null ? null : Number(process.argv[2]);
const out = path.resolve(process.argv[3] ?? path.join(root, 'data', 'bridges.json'));
if (count !== null && !(Number.isInteger(count) && count > 0)) throw new Error(`bad count: ${process.argv[2]}`);
const t0 = Date.now();
const stock = {};
for (const size of SIZES) {
  const want = count ?? STOCK[size];
  const t = Date.now();
  const kept = [], shapes = new Set(), fail = {};
  let seed = firstSeed(size), slowest = 0;
  for (; kept.length < want; seed++) {
    if (seed - firstSeed(size) >= MAX_SEEDS) throw new Error(`${size}: only ${kept.length} of ${want} in ${MAX_SEEDS} seeds`);
    const t1 = Date.now();
    const p = stockPuzzle(size, seed, fail);
    slowest = Math.max(slowest, Date.now() - t1);
    if (!p) continue;
    const key = shapeKey(p);
    if (shapes.has(key)) { fail.sameShape = (fail.sameShape ?? 0) + 1; continue; }
    shapes.add(key);
    kept.push(p);
    console.log(`  ${size} seed ${seed}: ${p.islands.length} islands, ${p.steps} steps; ${kept.length} kept`);
  }
  stock[size] = stockOrder(size, kept.map(encode));
  console.log(`${size}: ${want} puzzles from ${seed - firstSeed(size)} seeds in ${Date.now() - t} ms (slowest seed ${slowest} ms); not kept: ${JSON.stringify(fail)}`);
}
// One puzzle per line, so a change shows as a readable diff.
const body = SIZES.map(s => `"${s}": [\n${stock[s].map(p => JSON.stringify(p)).join(',\n')}\n]`).join(',\n');
await writeFile(out, `{\n${body}\n}\n`);
console.log(`wrote ${out} in ${Math.round((Date.now() - t0) / 1000)} s`);
