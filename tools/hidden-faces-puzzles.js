// Makes Hidden Faces' puzzle stock (DESIGN.md "Hidden Faces"): for each
// size, the first STOCK seeds from firstSeed(n) on whose puzzle is hard
// enough (src/core/hidden-faces.js: stockPuzzle), in seed order, so the
// same code always makes the same file. The work is spread over the
// computer's cores (a 10 x 10 takes about 4 s to make, up to 13 s, and
// about 1 in 3 is kept).
//   node tools/hidden-faces-puzzles.js [count] [out]
//     -> data/hidden-faces.json (count: STOCK per size)
// Run it after changing the puzzle maker or the difficulty bar (the tests
// remake some puzzles and fail, saying so, when the file is stale); then
// node tools/offline.js.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, STOCK, firstSeed, stockPuzzle, encode } from '../src/core/hidden-faces.js';

if (!isMainThread) {
  // A worker: makes the puzzle for each seed it's sent.
  parentPort.on('message', ({ n, seed }) => {
    const p = stockPuzzle(n, seed);
    parentPort.postMessage({ n, seed, p: p && encode(seed, p) });
  });
} else {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const count = Number(process.argv[2] ?? STOCK);
  const out = path.resolve(process.argv[3] ?? path.join(root, 'data', 'hidden-faces.json'));
  if (!(Number.isInteger(count) && count > 0)) throw new Error(`bad count: ${process.argv[2]}`);
  const t0 = Date.now();
  const workers = Array.from({ length: Math.max(1, availableParallelism() - 1) }, () => new Worker(fileURLToPath(import.meta.url)));
  const stock = {};
  for (const n of SIZES) {
    const t = Date.now();
    const kept = new Map();   // seed -> encoded puzzle
    let next = firstSeed(n), tried = 0;
    // Enough kept when `count` seeds are kept and every seed below the
    // count-th kept one is done (so it's the first `count` in seed order).
    const done = new Set();
    const enough = () => {
      if (kept.size < count) return false;
      const cut = [...kept.keys()].sort((a, b) => a - b)[count - 1];
      for (let s = firstSeed(n); s <= cut; s++) if (!done.has(s)) return false;
      return true;
    };
    await new Promise(resolve => {
      let busy = 0;
      const feed = w => {
        if (enough()) { if (!busy) resolve(); return; }
        busy++;
        w.postMessage({ n, seed: next++ });
      };
      for (const w of workers) {
        w.removeAllListeners('message');
        w.on('message', ({ seed, p }) => {
          busy--;
          tried++;
          done.add(seed);
          if (p) kept.set(seed, p);
          if (tried % 50 === 0) console.log(`  ${n}x${n}: ${kept.size} kept of ${tried} tried`);
          feed(w);
        });
        feed(w);
      }
    });
    stock[n] = [...kept.entries()].sort((a, b) => a[0] - b[0]).slice(0, count).map(([, p]) => p);
    console.log(`${n}x${n}: ${count} puzzles, ${tried} seeds tried, ${Math.round((Date.now() - t) / 1000)} s`);
  }
  await Promise.all(workers.map(w => w.terminate()));
  // One puzzle per line, so a change shows as a readable diff.
  const body = SIZES.map(n => `"${n}": [\n${stock[n].map(p => JSON.stringify(p)).join(',\n')}\n]`).join(',\n');
  await writeFile(out, `{\n${body}\n}\n`);
  console.log(`wrote ${out} in ${Math.round((Date.now() - t0) / 1000)} s`);
}
