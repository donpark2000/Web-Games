// Makes Laser Lab's puzzle stock (DESIGN.md "Laser Lab"): for each setup
// (size and lasers), in seed order, the first made puzzles of each kind
// as many as stockKinds says (src/core/laser-lab.js: stockPuzzle; a purple
// gem or not; 3.9: without a bomb from firstSeed(setup) on, with one from
// bombSeed(setup) on), in the order stockOrder gives them (each kind
// shuffled once with a fixed seed, the purple ones spaced out, the bombs
// half of each run), so the same code always makes the same file. One
// line per puzzle made; the work is spread over the computer's cores.
// Most seeds make nothing; one make, measured 2026-10-22 on one core: 6×6
// 10-240 ms, 7×7 0.2-3.4 s, 8×8 one laser 0.8-1.9 s, 8×8 two lasers
// minutes (journal, "Laser Lab built"); a seed, made or not, 2026-10-22:
// 6×6 two lasers about 1 ms, 7×7 two lasers about 50 ms (journal, "Purple
// gems spread"); a bomb puzzle, 2026-10-23 (median of 10, seeds not made
// included): 6×6 15-52 ms, 7×7 0.2-1.1 s, 8×8 one laser 1.1 s (journal,
// "Mockup v8 played; v9").
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
import { SETUPS, FAILS, firstSeed, bombSeed, stockSize, stockKinds, isPurple, hasBomb, kindOf, stockPuzzle, stockOrder, encode } from '../src/core/laser-lab.js';

// A seed that takes longer than this stops the tool (a make is bounded by
// its search budget, but a change to the maker could make it very slow).
const CAP_MS = 300000;

// where each kind is in a setup's stock, for the log
const places = list => ['purple', 'bombs'].map((w, b) => `${w} at ${list.map((e, i) => ((b ? hasBomb(e) : isPurple(e)) ? i + 1 : 0)).filter(Boolean).join(', ') || '-'}`).join('; ');

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
      const list = [...(stock[setup] ?? [])].sort((a, b) => a[0] - b[0]);
      const have = [0, 1, 2, 3].map(k => list.filter(e => kindOf(e) === k).length), want = stockKinds(setup);
      if (have.join() !== want.join()) throw new Error(`${setup}: ${have.join('/')} puzzles of each kind in the file (plain/purple/bomb/both), not ${want.join('/')}: make it`);
      stock[setup] = stockOrder(setup, list);
      console.log(`${setup}: ${list.length} puzzles put in order, ${places(stock[setup])}`);
    }
    await write();
    console.log(`wrote ${out}`);
    process.exit(0);
  }
  const t0 = Date.now();
  const workers = Array.from({ length: Math.max(1, availableParallelism() - 1) }, () => new Worker(fileURLToPath(import.meta.url)));
  const fails = new Map();  // worker -> its FAILS so far (all setups)
  for (const setup of only) {
    const t = Date.now(), count = countArg ?? stockSize(setup);
    // [without a purple gem, with] wanted, without bombs and with (a
    // smaller count: the same shares)
    const kinds = stockKinds(setup, count), made = [];
    let tried = 0;
    for (const [from, want] of [[firstSeed(setup), kinds.slice(0, 2)], [bombSeed(setup), kinds.slice(2)]]) {
      if (!want[0] && !want[1]) continue;
      const r = await makeRun(setup, from, want);
      made.push(...r.picked);
      tried += r.tried;
    }
    stock[setup] = stockOrder(setup, made.sort((a, b) => a[0] - b[0]));
    console.log(`${setup}: ${count} puzzles (${kinds.join('/')} plain/purple/bomb/both; ${places(stock[setup])}), ${tried} seeds tried, ${Math.round((Date.now() - t) / 1000)} s; not made (all setups so far): ${JSON.stringify(why())}`);
    // written after each setup, so a long make stopped part way keeps
    // what's done (run again with the setups left)
    await write();
  }
  await Promise.all(workers.map(w => w.terminate()));
  console.log(`wrote ${out} in ${Math.round((Date.now() - t0) / 1000)} s`);

  // From seed `from` on: the first want[0] kept without a purple gem and
  // want[1] with, in seed order.
  async function makeRun(setup, from, want) {
    const t = Date.now();
    const kept = new Map();   // seed -> encoded puzzle
    const done = new Set();
    let next = from, tried = 0;
    const pick = () => {
      const by = [[], []];
      for (const [seed, p] of [...kept.entries()].sort((a, b) => a[0] - b[0])) {
        const g = by[+isPurple(p)];
        if (g.length < want[+isPurple(p)]) g.push([seed, p]);
      }
      return by;
    };
    // Enough when there are that many of each and every seed below the
    // last of them is done (so they're the first in seed order).
    const enough = () => {
      const by = pick();
      if (by.some((g, i) => g.length < want[i])) return false;
      const cut = Math.max(...by.flat().map(([seed]) => seed));
      for (let s = from; s <= cut; s++) if (!done.has(s)) return false;
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
            console.log(`  ${setup} seed ${seed}: ${ms} ms, kept${isPurple(p) ? ', purple' : ''}${hasBomb(p) ? ', bomb' : ''} (cheapest ${cheapest}, ${answers} ways at it, ${nodes} choices searched); ${kept.size} kept (${purple} purple) of ${tried} seeds, ${Math.round((Date.now() - t) / 1000)} s`);
          } else if (ms > 20000) console.log(`  ${setup} seed ${seed}: ${ms} ms, not kept`);
          feed(w);
        });
        feed(w);
      }
    }).catch(async e => { await Promise.all(workers.map(w => w.terminate())); throw e; });
    return { picked: pick().flat().map(([, p]) => p), tried };
  }

  // why the other seeds made nothing (each worker counts from its start)
  function why() {
    const out = {};
    for (const f of fails.values()) for (const [k, v] of Object.entries(f)) out[k] = (out[k] || 0) + v;
    return out;
  }

  // One puzzle per line, so a change shows as a readable diff.
  async function write() {
    const body = SETUPS.filter(s => stock[s]).map(s => `"${s}": [\n${stock[s].map(p => JSON.stringify(p)).join(',\n')}\n]`).join(',\n');
    await writeFile(out, `{\n${body}\n}\n`);
  }
}
