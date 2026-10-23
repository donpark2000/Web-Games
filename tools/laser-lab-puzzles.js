// Makes Laser Lab's puzzle stock (DESIGN.md "Laser Lab"): for each setup
// (size and lasers), from firstSeed(setup) on in seed order, the first
// stockPurple(setup) made puzzles with a purple gem and the first
// stockSize - stockPurple without (src/core/laser-lab.js: stockPuzzle), in
// the order stockOrder gives them (shuffled once with a fixed seed, the
// purple ones spaced out), so the same code always makes the same file. One line per puzzle made; the
// work is spread over the computer's cores. Most seeds make nothing; one
// make, measured 2026-10-22 on one core: 6×6 10-240 ms, 7×7 0.2-3.4 s,
// 8×8 one laser 0.8-1.9 s, 8×8 two lasers minutes (journal, "Laser Lab
// built"); a seed, made or not, 2026-10-22: 6×6 two lasers about 1 ms,
// 7×7 two lasers about 50 ms (journal, "Purple gems spread").
//   node tools/laser-lab-puzzles.js [count] [out] [setups] [--order]
//     -> data/laser-lab.json (count: stockSize per setup; - for the default;
//        setups: e.g. 6-1,7-2,
//        all by default; the others are kept from the file already there;
//        --order: makes nothing, only puts the setups' puzzles already in
//        the file in stockOrder's order: 8-2's make took 102 minutes)
// Run it after changing the puzzle maker (the tests remake some puzzles
// and fail, saying so, when the file is stale); then node tools/offline.js.

import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { readFile, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SETUPS, FAILS, firstSeed, stockSize, stockPurple, isPurple, stockPuzzle, stockOrder, encode } from '../src/core/laser-lab.js';

// A seed that takes longer than this stops the tool (a make is bounded by
// its search budget, but a change to the maker could make it very slow).
const CAP_MS = 300000;

if (!isMainThread) {
  // A worker: makes the puzzle for each seed it's sent.
  parentPort.on('message', ({ setup, seed }) => {
    const t = Date.now();
    const p = stockPuzzle(setup, seed);
    parentPort.postMessage({ seed, ms: Date.now() - t, p: p && encode(p), cheapest: p?.cheapest, answers: p?.answers.length, nodes: p?.nodes, fails: { ...FAILS } });
  });
} else {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const orderOnly = process.argv.includes('--order');
  process.argv = process.argv.filter(a => a !== '--order');
  const countArg = process.argv[2] && process.argv[2] !== '-' ? Number(process.argv[2]) : null;
  const out = path.resolve(process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : path.join(root, 'data', 'laser-lab.json'));
  const only = process.argv[4] ? process.argv[4].split(',') : SETUPS;
  if (countArg !== null && !(Number.isInteger(countArg) && countArg > 0)) throw new Error(`bad count: ${process.argv[2]}`);
  if (only.some(s => !SETUPS.includes(s))) throw new Error(`bad setups: ${process.argv[4]} (${SETUPS.join(',')})`);
  let stock = {};
  if (only !== SETUPS || orderOnly) stock = JSON.parse(await readFile(out, 'utf8').catch(() => '{}'));
  if (orderOnly) {
    for (const setup of only) {
      const list = [...(stock[setup] ?? [])].sort((a, b) => a[0] - b[0]), purple = list.filter(isPurple).length;
      if (list.length !== stockSize(setup) || purple !== stockPurple(setup)) throw new Error(`${setup}: ${list.length} puzzles, ${purple} purple in the file, not ${stockSize(setup)}, ${stockPurple(setup)}: make it`);
      stock[setup] = stockOrder(setup, list);
      console.log(`${setup}: ${list.length} puzzles put in order, purple at ${stock[setup].map((e, i) => (isPurple(e) ? i + 1 : 0)).filter(Boolean).join(', ')}`);
    }
    await write();
    console.log(`wrote ${out}`);
    process.exit(0);
  }
  const t0 = Date.now();
  const workers = Array.from({ length: Math.max(1, availableParallelism() - 1) }, () => new Worker(fileURLToPath(import.meta.url)));
  for (const setup of only) {
    const t = Date.now(), count = countArg ?? stockSize(setup);
    // purple wanted, and the others (a smaller count: the same share)
    const want = [count - Math.round(count * stockPurple(setup) / stockSize(setup))];
    want.push(count - want[0]);
    const kept = new Map();   // seed -> encoded puzzle
    const done = new Set();
    const fails = new Map();  // worker -> its FAILS so far
    let next = firstSeed(setup), tried = 0;
    // The first want[0] kept without a purple gem and want[1] with, in
    // seed order. Enough when there are that many of each and every seed
    // below the last of them is done (so they're the first in seed order).
    const pick = () => {
      const by = [[], []];
      for (const [seed, p] of [...kept.entries()].sort((a, b) => a[0] - b[0])) {
        const g = by[+isPurple(p)];
        if (g.length < want[+isPurple(p)]) g.push([seed, p]);
      }
      return by;
    };
    const enough = () => {
      const by = pick();
      if (by.some((g, i) => g.length < want[i])) return false;
      const cut = Math.max(...by.flat().map(([seed]) => seed));
      for (let s = firstSeed(setup); s <= cut; s++) if (!done.has(s)) return false;
      return true;
    };
    await new Promise((resolve, reject) => {
      let busy = 0;
      const feed = w => {
        clearTimeout(w.cap);
        if (enough()) { if (!busy) resolve(); return; }
        busy++;
        const seed = next++;
        w.cap = setTimeout(() => reject(new Error(`${setup} seed ${seed}: no answer in ${CAP_MS / 1000} s`)), CAP_MS);
        w.postMessage({ setup, seed });
      };
      for (const w of workers) {
        w.removeAllListeners('message');
        w.on('message', ({ seed, ms, p, cheapest, answers, nodes, fails: f }) => {
          busy--;
          tried++;
          done.add(seed);
          fails.set(w, f);
          if (p) {
            kept.set(seed, p);
            const purple = [...kept.values()].filter(isPurple).length;
            console.log(`  ${setup} seed ${seed}: ${ms} ms, kept${isPurple(p) ? ', purple' : ''} (cheapest ${cheapest}, ${answers} ways at it, ${nodes} choices searched); ${kept.size} kept (${purple} purple) of ${tried} seeds, ${Math.round((Date.now() - t) / 1000)} s`);
          } else if (ms > 20000) console.log(`  ${setup} seed ${seed}: ${ms} ms, not kept`);
          feed(w);
        });
        feed(w);
      }
    }).catch(async e => { await Promise.all(workers.map(w => w.terminate())); throw e; });
    stock[setup] = stockOrder(setup, pick().flat().sort((a, b) => a[0] - b[0]).map(([, p]) => p));
    // why the other seeds made nothing (each worker counts from its start)
    const why = {};
    for (const f of fails.values()) for (const [k, v] of Object.entries(f)) why[k] = (why[k] || 0) + v;
    console.log(`${setup}: ${count} puzzles (${want[1]} purple, at ${stock[setup].map((e, i) => (isPurple(e) ? i + 1 : 0)).filter(Boolean).join(', ') || '-'}), ${tried} seeds tried, ${Math.round((Date.now() - t) / 1000)} s; not made (all setups so far): ${JSON.stringify(why)}`);
    // written after each setup, so a long make stopped part way keeps
    // what's done (run again with the setups left)
    await write();
  }
  await Promise.all(workers.map(w => w.terminate()));
  console.log(`wrote ${out} in ${Math.round((Date.now() - t0) / 1000)} s`);

  // One puzzle per line, so a change shows as a readable diff.
  async function write() {
    const body = SETUPS.filter(s => stock[s]).map(s => `"${s}": [\n${stock[s].map(p => JSON.stringify(p)).join(',\n')}\n]`).join(',\n');
    await writeFile(out, `{\n${body}\n}\n`);
  }
}
