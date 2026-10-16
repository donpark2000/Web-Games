// Keeps the offline app's file list up to date (DESIGN.md "Offline app").
// sw.js saves every file of the site on the device; this writes into it
// the list of those files and a version made from their contents, so that
// any change to the site makes a new version that devices pick up, and the
// day that version was made (kept while the version stays the same). It
// also writes both into src/core/version.js, which the pages load, so a
// page knows its own files' version however it was loaded (the home page's
// version line). It copies the release number (RELEASE_FILE, set by hand
// at each publish: DESIGN.md "Releases") into sw.js too.
//   node tools/offline.js        -> updates sw.js and src/core/version.js
// Run it after changing any page, style, script, data file or icon (the
// tests fail until it's run, saying so).

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
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

// The version file this writes; part of the site, but not of its version
// (it's made from it).
export const VERSION_FILE = 'src/core/version.js';
// The release number, set by hand (DESIGN.md "Releases").
export const RELEASE_FILE = 'src/core/release.js';

// The release number in `root`'s RELEASE_FILE, or '' when there's none.
export async function readRelease(root) {
  const text = await readText(path.join(root, RELEASE_FILE));
  return text?.match(/export const RELEASE = '([^']*)';/)?.[1] ?? '';
}

// The site's files, as paths from the top (e.g. 'src/ui/nim.js'), sorted;
// always with VERSION_FILE.
export async function siteFiles(root) {
  const top = (await readdir(root, { withFileTypes: true })).filter(e => e.isFile() && TOP.test(e.name)).map(e => e.name);
  const deeper = [];
  for (const d of FOLDERS) {
    try { deeper.push(...await walk(root, d)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return [...new Set([...top, ...deeper, VERSION_FILE])].sort();
}

// A short version made from the files' names and contents (not
// VERSION_FILE's, which holds the version). Text files
// count with plain (LF) line ends, so a Windows checkout (CRLF) makes the
// same version as the files GitHub serves.
const TEXT = /\.(html|webmanifest|css|js|svg|json)$/;
export async function siteVersion(root, files) {
  const h = createHash('sha256');
  for (const f of files) {
    if (f === VERSION_FILE) continue;
    h.update(f + '\0');
    const data = await readFile(path.join(root, f));
    h.update(TEXT.test(f) ? data.toString('utf8').replace(/\r\n/g, '\n') : data);
    h.update('\0');
  }
  return h.digest('hex').slice(0, 12);
}

const START = '// ---- made by tools/offline.js (don\'t edit by hand) ----';
const END = '// ---- end ----';

export function generated(version, files, made, release = '') {
  if (!/^\d{4}-\d\d-\d\d$/.test(made ?? '')) throw new Error(`sw.js: the version's day must be YYYY-MM-DD: ${made}`);
  return `${START}\nconst VERSION = '${version}';\nconst MADE = '${made}';\nconst RELEASE = '${release}';\nconst FILES = [\n${files.map(f => `  '${f}',`).join('\n')}\n];\n${END}`;
}

// sw.js with its list, version, the version's day and the release number
// brought up to date.
export function withList(sw, version, files, made, release = '') {
  const a = sw.indexOf(START), b = sw.indexOf(END);
  if (a < 0 || b < a) throw new Error('sw.js: the made-by-tools/offline.js lines are missing');
  return sw.slice(0, a) + generated(version, files, made, release) + sw.slice(b + END.length);
}

// A text file with plain (LF) line ends, or null if there's none.
async function readText(file) {
  try { return (await readFile(file, 'utf8')).replace(/\r\n/g, '\n'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

// VERSION_FILE's contents.
export function versionModule(version, made) {
  return `// The site's version (DESIGN.md "Offline app"), made by tools/offline.js
// from the site's files, and the day it was made. Don't edit by hand.
// Pages show their own files' version from this, so it's right however
// the page was loaded (a hard reload skips sw.js).
export const VERSION = '${version}';
export const MADE = '${made}';
`;
}

// The day a version was made: the one sw.js has if its version is the
// same, otherwise `today` (YYYY-MM-DD).
export function madeDay(sw, version, today) {
  const same = sw.match(/const VERSION = '([^']*)';/)?.[1] === version;
  return (same && sw.match(/const MADE = '(\d{4}-\d\d-\d\d)';/)?.[1]) || today;
}

// Today on this computer, YYYY-MM-DD.
export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const made = sw.match(/const MADE = '(\d{4}-\d\d-\d\d)';/)?.[1];
  if (!made) problems.push('no day for the version (MADE)');
  const release = await readRelease(root);
  const swRelease = sw.match(/const RELEASE = '([^']*)';/)?.[1];
  if (swRelease !== release) problems.push(`release ${swRelease}, ${RELEASE_FILE} says ${release || 'none'}`);
  const mod = await readText(path.join(root, VERSION_FILE));
  if (mod === null) problems.push(`no ${VERSION_FILE}`);
  else if (made && mod !== versionModule(version, made)) problems.push(`${VERSION_FILE} doesn't say version ${version} (${made})`);
  return { files, version, problems };
}

// Brings `root`'s sw.js and VERSION_FILE up to date; `day` (YYYY-MM-DD) is
// the day for a new version. What it did, for the console.
export async function update(root, day) {
  const files = await siteFiles(root);
  const version = await siteVersion(root, files);
  const file = path.join(root, 'sw.js');
  const before = await readFile(file, 'utf8');
  const made = madeDay(before, version, day);
  const release = await readRelease(root);
  const after = withList(before, version, files, made, release);
  const changed = [];
  if (after !== before) { await writeFile(file, after); changed.push('sw.js'); }
  const vfile = path.join(root, VERSION_FILE);
  const had = await readText(vfile);
  if (had !== versionModule(version, made)) { await mkdir(path.dirname(vfile), { recursive: true }); await writeFile(vfile, versionModule(version, made)); changed.push(VERSION_FILE); }
  const what = `${release ? `release ${release}, ` : ''}version ${version} (${made}), ${files.length} files`;
  return changed.length ? `${changed.join(' and ')}: ${what}` : `sw.js and ${VERSION_FILE} are up to date: ${what}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  console.log(await update(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), today()));
}
