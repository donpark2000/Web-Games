// Keeps the offline app's file list up to date (DESIGN.md "Offline app").
// sw.js saves every file of the site on the device; this writes into it
// the list of those files and a version made from their contents, so that
// any change to the site makes a new version that devices pick up.
//   node tools/offline.js        -> updates sw.js
// Run it after changing any page, style, script, data file or icon (the
// tests fail until it's run, saying so).

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// What the site is made of: the pages and the manifest at the top, and
// everything in these folders. Not the tests, tools, notes or sw.js.
const TOP = /\.(html|webmanifest)$/;
const FOLDERS = ['css', 'src', 'data', 'icons'];

async function walk(root, dir) {
  const out = [];
  for (const e of await readdir(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...await walk(root, rel));
    else out.push(rel);
  }
  return out;
}

// The site's files, as paths from the top (e.g. 'src/ui/nim.js'), sorted.
export async function siteFiles(root) {
  const top = (await readdir(root, { withFileTypes: true })).filter(e => e.isFile() && TOP.test(e.name)).map(e => e.name);
  const deeper = [];
  for (const d of FOLDERS) {
    try { deeper.push(...await walk(root, d)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return [...top, ...deeper].sort();
}

// A short version made from the files' names and contents. Text files
// count with plain (LF) line ends, so a Windows checkout (CRLF) makes the
// same version as the files GitHub serves.
const TEXT = /\.(html|webmanifest|css|js|svg|json)$/;
export async function siteVersion(root, files) {
  const h = createHash('sha256');
  for (const f of files) {
    h.update(f + '\0');
    const data = await readFile(path.join(root, f));
    h.update(TEXT.test(f) ? data.toString('utf8').replace(/\r\n/g, '\n') : data);
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

const START = '// ---- made by tools/offline.js (don\'t edit by hand) ----';
const END = '// ---- end ----';

export function generated(version, files) {
  return `${START}\nconst VERSION = '${version}';\nconst FILES = [\n${files.map(f => `  '${f}',`).join('\n')}\n];\n${END}`;
}

// sw.js with its list and version brought up to date.
export function withList(sw, version, files) {
  const a = sw.indexOf(START), b = sw.indexOf(END);
  if (a < 0 || b < a) throw new Error('sw.js: the made-by-tools/offline.js lines are missing');
  return sw.slice(0, a) + generated(version, files) + sw.slice(b + END.length);
}

// What's out of date in `root`'s sw.js: [] when it's current.
export async function check(root) {
  const files = await siteFiles(root);
  const version = await siteVersion(root, files);
  const sw = await readFile(path.join(root, 'sw.js'), 'utf8');
  const problems = [];
  const listed = [...(sw.match(/const FILES = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
  const missing = files.filter(f => !listed.includes(f)), extra = listed.filter(f => !files.includes(f));
  if (missing.length) problems.push(`not saved for offline: ${missing.join(', ')}`);
  if (extra.length) problems.push(`listed but not in the site: ${extra.join(', ')}`);
  const has = sw.match(/const VERSION = '([^']*)';/)?.[1];
  if (has !== version) problems.push(`version ${has}, the files make ${version}`);
  return { files, version, problems };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = await siteFiles(root);
  const version = await siteVersion(root, files);
  const file = path.join(root, 'sw.js');
  const before = await readFile(file, 'utf8');
  const after = withList(before, version, files);
  if (after === before) {
    console.log(`sw.js is up to date: version ${version}, ${files.length} files`);
  } else {
    await writeFile(file, after);
    console.log(`sw.js: version ${version}, ${files.length} files`);
  }
}
