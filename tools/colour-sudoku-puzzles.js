// Makes Colour Sudoku's puzzle stock (DESIGN.md "Colour Sudoku"): for
// each level, the first STOCK seeds from firstSeed(level) on whose puzzle
// is kept (src/core/colour-sudoku.js: stockPuzzle), in the order
// stockOrder gives them (seed order, shuffled once with a fixed seed), so
// the same code always makes the same file. One line per make; the work
// is spread over the computer's cores (an Easy make takes about 0.4 s, a
// Harder one 1.5 s; measured 2026-10-19).
//   node tools/colour-sudoku-puzzles.js [count] [out]
//     -> data/colour-sudoku.json (count: STOCK per level)
// Run it after changing the puzzle maker (the tests remake some puzzles
// and fail, saying so, when the file is stale); then node tools/offline.js.

import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEVELS, STOCK, firstSeed, stockPuzzle, stockOrder, encode } from '../src/core/colour-sudoku.js';

// A make that takes longer than this stops the tool (a make is bounded,
// but a change to the maker could make it very slow).
const CAP_MS = 60000;

if (!isMainThread) {
  // A worker: makes the puzzle for each seed it's sent.
  parentPort.on('message', ({ level, seed }) => {
    const t = Date.now();
    const p = stockPuzzle(level, seed);
    parentPort.postMessage({ level, seed, ms: Date.now() - t, p: p && encode(seed, p), givens: p?.nGivens, counts: p?.counts });
  });
} else {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const count = Number(process.argv[2] ?? STOCK);
  const out = path.resolve(process.argv[3] ?? path.join(root, 'data', 'colour-sudoku.json'));
  if (!(Number.isInteger(count) && count > 0)) throw new Error(`bad count: ${process.argv[2]}`);
  const t0 = Date.now();
  const workers = Array.from({ length: Math.max(1, availableParallelism() - 1) }, () => new Worker(fileURLToPath(import.meta.url)));
  const stock = {};
  for (const level of LEVELS) {
    const t = Date.now();
    const kept = new Map();   // seed -> encoded puzzle
    const done = new Set();
    let next = firstSeed(level), tried = 0;
    // Enough when `count` seeds are kept and every seed below the
    // count-th kept one is done (so it's the first `count` in seed order).
    const enough = () => {
      if (kept.size < count) return false;
      const cut = [...kept.keys()].sort((a, b) => a - b)[count - 1];
      for (let s = firstSeed(level); s <= cut; s++) if (!done.has(s)) return false;
      return true;
    };
    await new Promise((resolve, reject) => {
      let busy = 0;
      const feed = w => {
        clearTimeout(w.cap);
        if (enough()) { if (!busy) resolve(); return; }
        busy++;
        const seed = next++;
        w.cap = setTimeout(() => reject(new Error(`${level} seed ${seed}: no answer in ${CAP_MS / 1000} s`)), CAP_MS);
        w.postMessage({ level, seed });
      };
      for (const w of workers) {
        w.removeAllListeners('message');
        w.on('message', ({ seed, ms, p, givens, counts }) => {
          busy--;
          tried++;
          done.add(seed);
          if (p) kept.set(seed, p);
          console.log(`  ${level} seed ${seed}: ${ms} ms, ${p ? `kept (${givens} givens, ${JSON.stringify(counts)})` : 'not kept'}; ${kept.size} kept of ${tried}`);
          feed(w);
        });
        feed(w);
      }
    }).catch(async e => { await Promise.all(workers.map(w => w.terminate())); throw e; });
    stock[level] = stockOrder(level, [...kept.entries()].sort((a, b) => a[0] - b[0]).slice(0, count).map(([, p]) => p));
    console.log(`${level}: ${count} puzzles, ${tried} seeds tried, ${Math.round((Date.now() - t) / 1000)} s`);
  }
  await Promise.all(workers.map(w => w.terminate()));
  // One puzzle per line, so a change shows as a readable diff.
  const body = LEVELS.map(lv => `"${lv}": [\n${stock[lv].map(p => JSON.stringify(p)).join(',\n')}\n]`).join(',\n');
  await writeFile(out, `{\n${body}\n}\n`);
  console.log(`wrote ${out} in ${Math.round((Date.now() - t0) / 1000)} s`);
}
