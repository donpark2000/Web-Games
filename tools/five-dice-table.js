// Works out the long Five Dice game's card values for the robot (see
// src/core/five-dice-best.js) and saves them for the screen to load:
//   node tools/five-dice-table.js              -> data/five-dice-long.bin
//   node tools/five-dice-table.js <file>       -> somewhere else
// About 20 seconds. Run it again only if the long game's rules change; the
// tests check the saved file against the rules.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { solve, toFile } from '../src/core/five-dice-best.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? path.join(root, 'data', 'five-dice-long.bin'));
const t = Date.now();
const V = solve('long', (done, of) => process.stdout.write(`\r${Math.round((done / of) * 100)}%`));
const bytes = toFile(V);
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, bytes);
console.log(`\rAn empty card is worth ${V[0].toFixed(4)} points. ${bytes.byteLength} bytes to ${out} in ${((Date.now() - t) / 1000).toFixed(1)} s`);
