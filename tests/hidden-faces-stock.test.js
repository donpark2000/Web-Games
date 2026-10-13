// Hidden Faces' puzzle stock (data/hidden-faces.json, made by
// tools/hidden-faces-puzzles.js): every puzzle sound, and the file what
// the tool makes now (some puzzles remade from their seeds). Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIZES, STOCK, firstSeed, decode, encode, problems, solve, hardEnough, stockPuzzle, MAKE_LEVEL } from '../src/core/hidden-faces.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/hidden-faces.json'), 'utf8'));
const REMAKE = 'stale: run  node tools/hidden-faces-puzzles.js  then  node tools/offline.js';

test('hidden faces stock: 200 puzzles per size, each with one answer, hard enough, none twice', () => {
  assert.deepEqual(Object.keys(data).map(Number), SIZES);
  let checked = 0;
  for (const n of SIZES) {
    assert.equal(data[n].length, STOCK, `${n} x ${n}`);
    const seeds = data[n].map(e => e[0]);
    assert.deepEqual(seeds, [...seeds].sort((a, b) => a - b), `${n} x ${n}: not in seed order`);
    assert.ok(seeds[0] >= firstSeed(n) && seeds.at(-1) < firstSeed(n + 1), `${n} x ${n}: seeds ${seeds[0]}..${seeds.at(-1)}`);
    assert.equal(new Set(data[n].map(e => e[1])).size, STOCK, `${n} x ${n}: a puzzle twice`);
    for (const e of data[n]) {
      const p = decode(n, e);
      assert.deepEqual(problems(p), [], `${n} x ${n}, seed ${p.seed}`);
      assert.ok(hardEnough(n, solve(n, p.reg, MAKE_LEVEL).hard), `${n} x ${n}, seed ${p.seed}: too easy`);
      checked++;
    }
  }
  assert.equal(checked, SIZES.length * STOCK);
});

// The first puzzles remade by the tool's rule (every seed from the first,
// kept or not, up to the 8th kept one at 6 x 6 and 7 x 7, the 3rd at
// 8 x 8): the same seeds kept, the same puzzles. Not 9 x 9 and 10 x 10:
// a seed that isn't kept can take 10 s there (all of this took 36 s); the
// maker is the same code at every size.
test('hidden faces stock: the file is what the tool makes now', () => {
  let remade = 0;
  for (const [n, want] of [[6, 8], [7, 8], [8, 3]]) {
    const kept = [];
    for (let seed = firstSeed(n); kept.length < want; seed++) {
      const p = stockPuzzle(n, seed);
      if (p) kept.push(encode(seed, p));
      remade++;
    }
    assert.deepEqual(kept, data[n].slice(0, want), `${n} x ${n}: ${REMAKE}`);
  }
  assert.ok(remade > 30, `only ${remade} seeds remade`);
});

