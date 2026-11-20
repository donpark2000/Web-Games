// The Topple Lab (DESIGN.md "Topple Lab"; Q139): a copy of Topple! in
// topple-lab/, for trying bigger changes (a more realistic look, the moon's
// sounds) apart from the live game. Its own address and installed app, its
// own offline files, saves and caches; the main site's files untouched.
//
// The lab runs the main site's Topple! code (../src/...) except the files
// it has its own copy of (topple-lab/src/..., topple-lab/css/...): each lab
// page's import map sends the main site's imports of those to the lab's
// copy, and a lab copy's own imports back to the main site's files.
//
//   node tools/topple-lab.js copy src/ui/topple-scene.js
//       -> copies a main-site file into the lab, to change it there (the
//          only way the lab changes a main-site file), and brings the lab
//          up to date
//   node tools/topple-lab.js check
//       -> the main-site files that differ from `main` (git): none while
//          working on the lab
//   node tools/offline.js
//       -> (as for any change) the main site, then the lab: its pages made
//          from the main site's (PAGES), its sw.js from ../sw.js, its file
//          list and version
// The tests fail while the lab is out of date, naming the command.

import { readdir, readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { siteFiles, check as checkApp, update as updateApp, today } from './offline.js';

export const LAB = 'topple-lab';
// Its offline caches' names start with this (the main site's: 'lets-play-').
// Both apps share donpark2000.github.io's storage, and each deletes only
// old caches with its own start.
export const CACHE_PREFIX = 'topple-lab-';
const MAIN_CACHE_LINE = "const PREFIX = 'lets-play-';";

// The lab's pages made from the main site's: { lab page: [main page, title] }.
// Its home page (index.html) is its own.
export const PAGES = {
  'topple.html': ['topple.html', 'Topple Lab'],
  'log.html': ['log.html', 'Topple Lab log'],
};
// Its own code (not copies of the main site's) is in lab/; its copies in
// src/ and css/, at the main site's paths.
// What the lab may copy from the main site: its scripts and styles.
const COPYABLE = /^(src|css)\//;
// The main site's files the lab uses: scripts, styles and Topple!'s
// pictures and home-page picture (not the other games' data, not its
// icons or pages).
const USED = /^((css|src|data\/topple)\/|icons\/home\/topple\.webp$)/;
// Main-site scripts a lab page doesn't load: the visit counter (the lab's
// visits aren't the site's).
const NOT_LOADED = ['src/ui/stats.js'];
const NOTES = /\.md$/;

const lf = s => s.replace(/\r\n/g, '\n');
async function readText(f) {
  try { return lf(await readFile(f, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
async function exists(f) { try { await access(f); return true; } catch { return false; } }

async function walk(root, dir) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(root, dir), { withFileTypes: true }); } catch (e) { if (e.code === 'ENOENT') return out; throw e; }
  for (const e of entries) {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...await walk(root, rel));
    else if (!NOTES.test(e.name)) out.push(rel);
  }
  return out;
}

// The lab's copies of main-site files (paths from the lab's folder, which
// are the main site's paths too), sorted. Its version and release number
// (src/core/version.js, release.js) count: the main site's pages' code
// reads them, and must get the lab's.
export async function copies(root) {
  return [...new Set([...(await walk(path.join(root, LAB), '')).filter(f => COPYABLE.test(f)), 'src/core/version.js'])].sort();
}

// The lab's files for offline, from its folder: its own and the main-site
// files it uses ('../src/ui/topple.js'), sorted; always with its version
// file. `labRoot` is the lab's folder.
export async function labFiles(labRoot) {
  const root = path.join(labRoot, '..');
  const own = (await walk(labRoot, '')).filter(f => f !== 'sw.js');
  const used = (await siteFiles(root)).filter(f => USED.test(f)).map(f => `../${f}`);
  return [...new Set([...own, ...used, 'src/core/version.js'])].sort();
}

// The lab's sw.js before its list: the main site's (LF), with the lab's
// cache names.
export function labSwBase(mainSw) {
  const sw = lf(mainSw);
  if (!sw.includes(MAIN_CACHE_LINE)) throw new Error(`sw.js: no ${MAIN_CACHE_LINE}`);
  return "// The Topple Lab's sw.js: the main site's (../sw.js) with the lab's cache\n"
    + "// names. Made by tools/offline.js (tools/topple-lab.js); don't edit by hand.\n"
    + sw.replace(MAIN_CACHE_LINE, `const PREFIX = '${CACHE_PREFIX}';`);
}

// The import map for the lab's copies: a copy's own imports go to the main
// site's files ("./src/" -> "../src/"), unless the lab has that one too;
// the main site's imports of a copied file go to the lab's copy.
export function importMap(copied) {
  const imports = { './src/': '../src/' };
  for (const f of copied.filter(f => f.endsWith('.js'))) {
    imports[`./${f}`] = `./${f}`;
    imports[`../${f}`] = `./${f}`;
  }
  return `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>`;
}
const MAP = /<script type="importmap">[\s\S]*?<\/script>/;

// The start of the lab's pages' scripts: lab/start.js keeps the lab's
// saves apart, then loads `entries` (main-site scripts, through the map).
const startTag = entries => `<script type="module" src="lab/start.js" data-load="${entries.join(' ')}"></script>`;

// A lab page made from a main-site page (LF): its styles and scripts from
// the main site unless copied, the lab's name, the import map, the lab's
// start; the lab's own manifest, icons and home page (same names). Refuses
// a page with a script written in it (it would run before the lab's start).
export function labPage(mainHtml, { from, title, copied }) {
  let s = lf(mainHtml);
  if (/<script(?![^>]*\bsrc=)[^>]*>/.test(s)) throw new Error(`${from}: a script written in the page; the lab can't keep its saves apart from it`);
  const own = new Set(copied);
  s = s.replace(/href="(css\/[^"]+)"/g, (m, f) => `href="${own.has(f) ? f : `../${f}`}"`);
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  s = s.replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="Topple Lab">');
  const entries = [];
  s = s.replace(/<script type="module" src="([^"]+)"><\/script>\n?/g, (m, f) => {
    if (!NOT_LOADED.includes(f)) entries.push(`../${f}`);
    return '';
  });
  if (!entries.length) throw new Error(`${from}: no scripts`);
  s = s.replace('</head>', `${importMap(copied)}\n</head>`);
  s = s.replace('</body>', `${startTag(entries)}\n</body>`);
  return s.replace('<!doctype html>\n', `<!doctype html>\n<!-- The Topple Lab's ${from}: made from ../${from} by tools/topple-lab.js; don't edit by hand. -->\n`);
}

// The lab's own pages (its home page) with the import map brought up to date.
const ownPage = (html, copied) => lf(html).replace(MAP, importMap(copied));

// What the lab's pages should be: { lab page: text }.
async function wanted(root) {
  const copied = await copies(root);
  const out = {};
  for (const [p, [from, title]] of Object.entries(PAGES)) out[p] = labPage(await readFile(path.join(root, from), 'utf8'), { from, title, copied });
  const home = await readText(path.join(root, LAB, 'index.html'));
  if (home !== null) out['index.html'] = ownPage(home, copied);
  return out;
}

const labOpts = async root => ({ list: labFiles, swBase: labSwBase(await readFile(path.join(root, 'sw.js'), 'utf8')) });

// What's out of date in the lab: [] when it's current.
export async function check(root) {
  const problems = [];
  if (!await exists(path.join(root, LAB, 'index.html'))) return { problems: [`no ${LAB}/index.html`] };
  for (const [p, text] of Object.entries(await wanted(root))) {
    if (await readText(path.join(root, LAB, p)) !== text) problems.push(`${LAB}/${p} out of date`);
  }
  const app = await checkApp(path.join(root, LAB), await labOpts(root));
  return { files: app.files, version: app.version, problems: [...problems, ...app.problems.map(p => `${LAB}: ${p}`)] };
}

// Brings the lab up to date: its pages, then its sw.js and version. What
// it did, for the console.
export async function update(root, day) {
  const changed = [];
  for (const [p, text] of Object.entries(await wanted(root))) {
    const f = path.join(root, LAB, p);
    if (await readText(f) !== text) { await writeFile(f, text); changed.push(p); }
  }
  const app = await updateApp(path.join(root, LAB), day, await labOpts(root));
  return `${LAB}: ${changed.length ? `${changed.join(', ')} made; ` : ''}${app}`;
}

// Copies a main-site script or style into the lab, to be changed there.
export async function copy(root, file, day) {
  const f = file.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!COPYABLE.test(f) || !(await siteFiles(root)).includes(f)) throw new Error(`${f}: not a main-site script or style (src/..., css/...)`);
  const to = path.join(root, LAB, f);
  if (await exists(to)) throw new Error(`${LAB}/${f}: the lab has its copy already`);
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(path.join(root, f), to);
  return `copied ${f} to ${LAB}/${f}: change it there\n${await update(root, day)}`;
}

// The main-site files (the site's, its sw.js, and the lab's main-site
// pages' sources) that differ from git's `base`, committed or not.
export async function mainChanges(root, base = 'main') {
  const site = new Set([...await siteFiles(root), 'sw.js']);
  const out = execFileSync('git', ['diff', '--name-only', base, '--'], { cwd: root, encoding: 'utf8' });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' });
  return [...new Set([...out.split('\n'), ...untracked.split('\n')])].map(s => s.trim()).filter(f => site.has(f)).sort();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'copy' && arg) console.log(await copy(root, arg, today()));
    else if (cmd === 'update') console.log(await update(root, today()));   // node tools/offline.js runs this
    else if (cmd === 'check') {
      const changed = await mainChanges(root);
      const { problems } = await check(root);
      console.log(changed.length ? `main-site files changed since main (the lab must not change them):\n  ${changed.join('\n  ')}` : 'main-site files changed since main: none');
      console.log(problems.length ? `the lab is out of date (node tools/offline.js):\n  ${problems.join('\n  ')}` : 'the lab is up to date');
      if (changed.length || problems.length) process.exitCode = 1;
    } else {
      console.log('node tools/topple-lab.js copy <main-site file>   (src/..., css/...)\nnode tools/topple-lab.js check');
      process.exitCode = 2;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
