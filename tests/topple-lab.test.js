// The Topple Lab (DESIGN.md "Topple Lab"; Q139): its files up to date with
// the main site's (tools/topple-lab.js, run by node tools/offline.js), and
// the guards that keep it from touching the live game: the main site never
// lists or links it; it changes a main-site file only by copying it first;
// its saves are under its own names (lab/storage.js), and its offline
// caches under its own start, each app clearing only its own. Copies and
// stale pages are tried on a small site in a temp folder, removed after.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteFiles, check as checkMain, update as updateMain } from '../tools/offline.js';
import { LAB, CACHE_PREFIX, PAGES, check, update, copy, copies, labFiles, labPage, labSwBase, importMap } from '../tools/topple-lab.js';
import { labIconSvg, iconSvg, pngSize, PNGS } from '../tools/make-icons.js';
import { LabStorage, guard, PREFIX } from '../topple-lab/lab/storage.js';
import { begin, STOPPED } from '../topple-lab/lab/begin.js';
import { forgetOld } from '../src/core/resume.js';
import { runSw } from './sw-harness.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const labRoot = path.join(root, LAB);
const read = f => readFile(path.join(root, f), 'utf8').then(s => s.replace(/\r\n/g, '\n'));

/* ---------- up to date ---------- */

test('lab: its pages, sw.js, file list and version are up to date with the main site', async () => {
  const { problems, files, version } = await check(root);
  assert.deepEqual(problems, [], `the Topple Lab is out of date: run  node tools/offline.js\n${problems.join('\n')}`);
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.ok(files.length >= 100, `only ${files.length} files`);
});

test('lab: it saves for offline its own files and the main-site files Topple! uses, nothing else', async () => {
  const files = await labFiles(labRoot);
  for (const f of ['index.html', 'topple.html', 'log.html', 'manifest.webmanifest', 'lab/start.js', 'lab/begin.js', 'lab/storage.js', 'icons/icon-192.png',
    'src/core/version.js', 'src/core/release.js', 'src/ui/topple-sets.js',
    '../src/ui/topple.js', '../src/ui/topple-scene.js', '../src/vendor/three/three.module.min.js', '../css/topple.css', '../data/topple/sky_goegap.jpg', '../icons/home/topple.webp']) {
    assert.ok(files.includes(f), `${f} not saved`);
  }
  for (const f of files) {
    assert.doesNotMatch(f, /^(sw\.js|.*\.md)$|^\.\.\/(\w[\w-]*\.html|manifest\.webmanifest|sw\.js|icons\/icon|data\/(?!topple\/)|tests|tools)/, `${f} shouldn't be saved`);
  }
});

/* ---------- the main site never lists, links or loads the lab ---------- */

test('lab: the main site neither saves, links nor loads anything of the lab', async () => {
  const main = await siteFiles(root);
  assert.ok(main.length > 100);
  const of = main.filter(f => f.startsWith(`${LAB}/`));
  assert.deepEqual(of, [], 'lab files in the main site\'s offline list');
  const texts = main.filter(f => /\.(html|js|css|webmanifest)$/.test(f));
  for (const f of [...texts, 'sw.js']) assert.ok(!(await read(f)).includes(LAB), `${f} mentions ${LAB}`);
  assert.deepEqual((await checkMain(root)).problems, [], 'the main site out of date');
});

/* ---------- pages ---------- */

const MAIN_PAGE = `<!doctype html>
<html lang="en">
<head>
<title>Topple!</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="Let's Play!">
<link rel="stylesheet" href="css/site.css">
<link rel="stylesheet" href="css/topple.css">
</head>
<body>
<a class="homebtn" href="index.html"></a>
<script type="module" src="src/ui/topple.js"></script>
<script type="module" src="src/ui/nozoom.js"></script>
<script type="module" src="src/ui/stats.js"></script>
<script type="module" src="src/ui/offline.js"></script>
</body>
</html>
`;

test('lab: a lab page made from the main site\'s: styles from the main site unless copied, its scripts through the lab\'s start, no visit counter', () => {
  const s = labPage(MAIN_PAGE, { from: 'topple.html', title: 'Topple Lab', copied: ['css/topple.css', 'src/ui/topple-sets.js'] });
  assert.match(s, /^<!doctype html>\n<!-- The Topple Lab's topple\.html: made from \.\.\/topple\.html by tools\/topple-lab\.js; don't edit by hand\. -->\n/);
  assert.ok(s.includes('<title>Topple Lab</title>'));
  assert.ok(s.includes('<meta name="apple-mobile-web-app-title" content="Topple Lab">'));
  assert.ok(s.includes('href="../css/site.css"') && s.includes('href="css/topple.css"'), 'styles');
  assert.ok(s.includes('<link rel="manifest" href="manifest.webmanifest">') && s.includes('href="index.html"'), "the lab's own manifest and home page");
  const scripts = [...s.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(scripts, ['<script type="importmap">', '<script type="module" src="lab/start.js" data-load="../src/ui/topple.js ../src/ui/nozoom.js ../src/ui/offline.js">'], 'only the map and the start, the scripts in order, no stats.js');
  assert.ok(s.indexOf('<script type="importmap">') < s.indexOf('</head>'), 'the map in the head, before any script');
  assert.throws(() => labPage(MAIN_PAGE.replace('</body>', '<script type="module">x()</script>\n</body>'), { from: 'x.html', title: 'X', copied: [] }), /a script written in the page/);
  assert.throws(() => labPage('<!doctype html>\n<head></head><body></body>', { from: 'y.html', title: 'Y', copied: [] }), /no scripts/);
});

// An installed app's identity, worked out as a browser does (the manifest
// spec's "id"): from the start address's origin, NOT the manifest's folder;
// none, or another origin's, and it's the start address.
function appId(manifest, at) {
  const start = new URL(manifest.start_url, at);
  let id = start;
  if (manifest.id) {
    const u = new URL(manifest.id, start.origin);
    if (u.origin === start.origin) id = u;
  }
  return id.href.replace(/#.*$/, '');
}

test("lab: its installed app isn't the main site's (Q140: one id, so Chrome took the lab for an update of Let's Play!)", async () => {
  const site = 'https://donpark2000.github.io/Web-Games/';
  const main = JSON.parse(await read('manifest.webmanifest'));
  const lab = JSON.parse(await read(`${LAB}/manifest.webmanifest`));
  const mainAt = `${site}manifest.webmanifest`, labAt = `${site}${LAB}/manifest.webmanifest`;
  assert.equal(appId(lab, labAt), `${site}${LAB}/`, "the lab's id isn't its own address");
  assert.notEqual(appId(lab, labAt), appId(main, mainAt), 'one id for both: a browser takes them for the same app');
  // the main site's never changes: an installed Let's Play! would be another app
  assert.equal(appId(main, mainAt), 'https://donpark2000.github.io/', "Let's Play!'s id changed");
  // the working out: what went wrong, and the other ways an id is read
  assert.equal(appId({ ...lab, id: './' }, labAt), appId(main, mainAt), 'lab 0.1-0.4, as Edge read it');
  assert.equal(appId({ start_url: './', id: `/Web-Games/${LAB}/` }, labAt), `${site}${LAB}/`);
  assert.equal(appId({ start_url: './#x', id: '' }, labAt), `${site}${LAB}/`);
  assert.equal(appId({ start_url: './', id: 'https://example.com/a' }, labAt), `${site}${LAB}/`);
});

test("lab: every lab page loads only the lab's start, links the lab's manifest and icons; its home page has the version line", async () => {
  const pages = (await readdir(labRoot)).filter(f => f.endsWith('.html'));
  assert.deepEqual(pages.sort(), ['index.html', ...Object.keys(PAGES)].sort());
  for (const p of pages) {
    const s = await read(`${LAB}/${p}`);
    for (const tag of ['<link rel="manifest" href="manifest.webmanifest">', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">', '<meta name="apple-mobile-web-app-title" content="Topple Lab">']) {
      assert.ok(s.includes(tag), `${p}: no ${tag}`);
    }
    const scripts = [...s.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
    assert.equal(scripts[0], '<script type="importmap">', `${p}: the import map first`);
    assert.equal(scripts.length, 2, `${p}: ${scripts.join(' ')}`);
    assert.match(scripts[1], /^<script type="module" src="lab\/start\.js" data-load="[^"]*\.\.\/src\/ui\/offline\.js[^"]*">$/, `${p}: not started by the lab, or no offline app`);
    assert.doesNotMatch(s, /stats\.js/, `${p}: counted as a visit`);
  }
  const home = await read(`${LAB}/index.html`);
  assert.match(home, /<a class="app-version" id="appVersion" href="log\.html" hidden><\/a><\/footer>/);
  assert.ok(home.includes('href="topple.html"'));
});

// Import maps, as the browser applies them to a module's address: an exact
// entry, or else the longest entry ending in "/" that starts it.
function resolve(map, page, from, spec) {
  const imports = JSON.parse(map.replace(/^<script type="importmap">\n|\n<\/script>$/g, '')).imports;
  const abs = Object.fromEntries(Object.entries(imports).map(([k, v]) => [new URL(k, page).href, new URL(v, page).href]));
  const url = new URL(spec, from).href;
  if (abs[url]) return abs[url];
  const pre = Object.keys(abs).filter(k => k.endsWith('/') && url.startsWith(k)).sort((a, b) => b.length - a.length)[0];
  return pre ? abs[pre] + url.slice(pre.length) : url;
}

test("lab: the import map sends the main site's code to the lab's copies, and a copy's own imports back to the main site", () => {
  const site = 'https://donpark2000.github.io/Web-Games/';
  const page = `${site}${LAB}/topple.html`;
  const map = importMap(['src/core/release.js', 'src/core/version.js', 'src/ui/topple-sets.js', 'css/topple.css']);
  const main = f => `${site}${f}`, lab = f => `${site}${LAB}/${f}`;
  // the main site's Topple! importing a copied file gets the lab's
  assert.equal(resolve(map, page, main('src/ui/topple-scene.js'), './topple-sets.js'), lab('src/ui/topple-sets.js'));
  assert.equal(resolve(map, page, main('src/ui/offline.js'), '../core/release.js'), lab('src/core/release.js'));
  assert.equal(resolve(map, page, main('src/ui/offline.js'), '../core/version.js'), lab('src/core/version.js'));
  // ...and anything else the main site's
  assert.equal(resolve(map, page, main('src/ui/topple-scene.js'), '../core/topple.js'), main('src/core/topple.js'));
  // a copy's own imports go to the main site's files (one three.js), or the lab's copies
  assert.equal(resolve(map, page, lab('src/ui/topple-sets.js'), '../vendor/three/three.module.min.js'), main('src/vendor/three/three.module.min.js'));
  assert.equal(resolve(map, page, lab('src/ui/topple-sets.js'), '../core/release.js'), lab('src/core/release.js'));
  // the page's start (lab/, not src/) is the lab's own
  assert.equal(resolve(map, page, page, 'lab/start.js'), lab('lab/start.js'));
  assert.doesNotMatch(map, /topple\.css/, 'styles are linked, not mapped');
});

/* ---------- the lab changes a main-site file only by copying it ---------- */

// A small site with a lab, in a temp folder, made current.
async function tinySite(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'lab-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const d of ['src/ui', 'src/core', 'css', `${LAB}/lab`, `${LAB}/src/core`]) await mkdir(path.join(dir, d), { recursive: true });
  await writeFile(path.join(dir, 'topple.html'), MAIN_PAGE);
  await writeFile(path.join(dir, 'log.html'), MAIN_PAGE.replace('Topple!', 'Web Games log'));
  await writeFile(path.join(dir, 'css/topple.css'), 'p { color: red }\n');
  await writeFile(path.join(dir, 'src/ui/topple.js'), "import './topple-sets.js';\n");
  await writeFile(path.join(dir, 'src/ui/topple-sets.js'), "export const PHOTO_DIR = 'data/topple/';\n");
  await writeFile(path.join(dir, 'src/core/release.js'), "export const RELEASE = '1.0';\n");
  await writeFile(path.join(dir, 'sw.js'), await read('sw.js'));
  await writeFile(path.join(dir, `${LAB}/index.html`), '<!doctype html>\n<head>\n<script type="importmap">\n</script>\n</head>\n');
  await writeFile(path.join(dir, `${LAB}/lab/start.js`), '');
  await writeFile(path.join(dir, `${LAB}/src/core/release.js`), "export const RELEASE = '0.1';\n");
  await updateMain(dir, '2026-11-20');
  await update(dir, '2026-11-20');
  assert.deepEqual((await check(dir)).problems, []);
  return dir;
}

test('lab: copy puts a main-site script or style in the lab, verbatim, and the lab uses it; the main file untouched', async t => {
  const dir = await tinySite(t);
  const before = await readFile(path.join(dir, 'src/ui/topple-sets.js'), 'utf8');
  assert.match(await copy(dir, 'src/ui/topple-sets.js', '2026-11-21'), /^copied src\/ui\/topple-sets\.js to topple-lab\/src\/ui\/topple-sets\.js: change it there\n/);
  assert.equal(await readFile(path.join(dir, LAB, 'src/ui/topple-sets.js'), 'utf8'), before, 'not verbatim');
  assert.equal(await readFile(path.join(dir, 'src/ui/topple-sets.js'), 'utf8'), before, 'the main file changed');
  assert.deepEqual(await copies(dir), ['src/core/release.js', 'src/core/version.js', 'src/ui/topple-sets.js']);
  assert.ok((await readFile(path.join(dir, LAB, 'topple.html'), 'utf8')).includes('"../src/ui/topple-sets.js": "./src/ui/topple-sets.js"'), 'not mapped');
  assert.ok((await readFile(path.join(dir, LAB, 'index.html'), 'utf8')).includes('"../src/ui/topple-sets.js": "./src/ui/topple-sets.js"'), "the home page's map not updated");
  assert.deepEqual((await check(dir)).problems, []);
  // a style: the lab's pages link the lab's copy
  await copy(dir, 'css/topple.css', '2026-11-21');
  assert.ok((await readFile(path.join(dir, LAB, 'topple.html'), 'utf8')).includes('href="css/topple.css"'));
  // refused: twice, not a main-site file, not a script or style
  await assert.rejects(copy(dir, 'src/ui/topple-sets.js', '2026-11-21'), /the lab has its copy already/);
  await assert.rejects(copy(dir, 'src/ui/nothing.js', '2026-11-21'), /not a main-site script or style/);
  await assert.rejects(copy(dir, 'topple.html', '2026-11-21'), /not a main-site script or style/);
});

test('lab: a hand-edited lab page, a changed main page, sw.js or a lab file is reported', async t => {
  const dir = await tinySite(t);
  const f = path.join(dir, LAB, 'topple.html');
  await writeFile(f, (await readFile(f, 'utf8')) + '<!-- edited -->\n');
  assert.ok((await check(dir)).problems.includes(`${LAB}/topple.html out of date`));
  await update(dir, '2026-11-20');
  await writeFile(path.join(dir, 'topple.html'), MAIN_PAGE.replace('<a class', '<p>new</p>\n<a class'));
  assert.ok((await check(dir)).problems.includes(`${LAB}/topple.html out of date`), 'a main-page change not followed');
  await update(dir, '2026-11-20');
  await writeFile(path.join(dir, 'sw.js'), (await readFile(path.join(dir, 'sw.js'), 'utf8')).replace('// - Activate:', '// - Activate (changed):'));
  assert.ok((await check(dir)).problems.includes(`${LAB}: sw.js isn't the one it's made from`), 'a main sw.js change not followed');
  await update(dir, '2026-11-20');
  await writeFile(path.join(dir, LAB, 'lab/start.js'), '// changed\n');
  const p = (await check(dir)).problems;
  assert.ok(p.some(x => /^topple-lab: version [0-9a-f]{12}, the files make [0-9a-f]{12}$/.test(x)) && p.includes('topple-lab: hashes out of date: lab/start.js'), p.join('\n'));
  await update(dir, '2026-11-20');
  assert.deepEqual((await check(dir)).problems, []);
});

/* ---------- saves: the lab's own names ---------- */

// A browser store (localStorage's methods) over a Map.
function fakeStore(entries = []) {
  const m = new Map(entries);
  return {
    m,
    get length() { return m.size; },
    key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    clear: () => m.clear(),
  };
}

test("lab: its saves are under its own names; the main site's are never read, changed or cleared", () => {
  const real = fakeStore([['web-games-topple-game', 'main game'], ['web-games-log', 'main log'], ['web-games-resume-topple', 'main resume']]);
  const lab = new LabStorage(real);
  assert.equal(lab.getItem('web-games-topple-game'), null, "the main site's game read");
  lab.setItem('web-games-topple-game', 'lab game');
  lab.setItem('web-games-resume-topple', 'lab resume');
  assert.equal(lab.getItem('web-games-topple-game'), 'lab game');
  assert.equal(real.getItem('web-games-topple-game'), 'main game');
  assert.equal(real.getItem(`${PREFIX}web-games-topple-game`), 'lab game');
  assert.equal(lab.length, 2);
  assert.deepEqual([lab.key(0), lab.key(1), lab.key(2)], ['web-games-topple-game', 'web-games-resume-topple', null]);
  // the main site's clean-up, run in the lab, clears the lab's own only
  assert.deepEqual(forgetOld(lab), ['web-games-resume-topple']);
  assert.equal(real.getItem('web-games-resume-topple'), 'main resume');
  lab.removeItem('web-games-log');
  lab.clear();
  assert.equal(lab.length, 0);
  assert.deepEqual([...real.m.keys()], ['web-games-topple-game', 'web-games-log', 'web-games-resume-topple'], "the main site's names touched");
  // ...and the main site's, run on the main site, leaves the lab's alone
  real.setItem(`${PREFIX}web-games-resume-topple`, 'lab resume');
  assert.deepEqual(forgetOld(real), ['web-games-resume-topple']);
  assert.equal(real.getItem(`${PREFIX}web-games-resume-topple`), 'lab resume');
});

test("lab: no main-site name, and no name the main site clears by its start, overlaps the lab's", async () => {
  const main = (await siteFiles(root)).filter(f => /^src\/.*\.js$/.test(f) && !f.startsWith('src/vendor/'));
  let names = 0;
  for (const f of main) {
    for (const [, s] of (await read(f)).matchAll(/['`](web-games-[^'`$]*)/g)) {
      names++;
      assert.ok(!s.startsWith(PREFIX), `${f}: ${s} is a lab name`);
      assert.ok(!PREFIX.startsWith(s), `${f}: '${s}' starts the lab's names (a clean-up by it would clear the lab's)`);
    }
  }
  assert.ok(names >= 15, `only ${names} names checked`);
});

// A window whose stores are like the browser's (own getters that can be
// redefined), or can't be redefined, or are blocked.
function fakeWin({ fixed = false, blocked = false } = {}) {
  const win = { console: { error() {} } };
  for (const name of ['localStorage', 'sessionStorage']) {
    const store = fakeStore();
    Object.defineProperty(win, name, { configurable: !fixed, enumerable: true, get: () => { if (blocked) throw new Error('SecurityError'); return store; } });
  }
  return win;
}

test("lab: the page's stores are swapped for the lab's; if they can't be, it won't start", () => {
  const win = fakeWin();
  const realLocal = win.localStorage;
  const g = guard(win);
  assert.deepEqual(g, { ok: true, stores: ["localStorage: the lab's", "sessionStorage: the lab's"] });
  assert.ok(win.localStorage instanceof LabStorage && win.sessionStorage instanceof LabStorage);
  win.localStorage.setItem('web-games-sound', 'off');
  assert.equal(realLocal.getItem('web-games-sound'), null);
  assert.equal(realLocal.getItem(`${PREFIX}web-games-sound`), 'off');
  assert.deepEqual(guard(win).stores, ["localStorage: the lab's already", "sessionStorage: the lab's already"], 'wrapped twice');
  assert.deepEqual(guard(fakeWin({ fixed: true })), { ok: false, why: "localStorage couldn't be kept apart from the main site's" });
  assert.deepEqual(guard(fakeWin({ blocked: true })), { ok: true, stores: ['localStorage: blocked', 'sessionStorage: blocked'] }, 'blocked stays blocked');
});

// A page for begin(): its start tag's list, its <main>, and what's loaded.
function fakePage(win, list) {
  const loaded = [], logged = [];
  const main = { children: ['the game'], replaceChildren(...c) { this.children = c; } };
  const doc = {
    baseURI: 'https://donpark2000.github.io/Web-Games/topple-lab/topple.html',
    querySelector: q => (q === 'main' ? main : q === 'script[data-load]' ? { dataset: { load: list } } : null),
    createElement: () => ({}),
  };
  const load = async url => {
    if (url.endsWith('/debuglog.js')) return { log: { add: (...a) => logged.push(a) } };
    if (url.endsWith('/bad.js')) throw new Error('bad');
    loaded.push(url);
    return {};
  };
  return { doc, load, loaded, logged, main };
}

test('lab: a page starts with its saves kept apart, then loads its scripts in order; with none kept apart, nothing loads', async () => {
  const win = fakeWin();
  const page = fakePage(win, '../src/ui/topple.js ../src/ui/bad.js ../src/ui/offline.js');
  const r = await begin({ win, doc: page.doc, load: page.load });
  assert.deepEqual(r, { ok: true, loaded: ['../src/ui/topple.js', '../src/ui/offline.js'], failed: ['../src/ui/bad.js'] });
  assert.deepEqual(page.loaded, ['https://donpark2000.github.io/Web-Games/src/ui/topple.js', 'https://donpark2000.github.io/Web-Games/src/ui/offline.js']);
  assert.ok(win.localStorage instanceof LabStorage, 'loaded before the stores were swapped');
  assert.deepEqual(page.logged.map(a => a[1]), ['saves kept apart', 'a script failed']);
  // can't keep them apart: nothing loaded, and the page says so
  const fixed = fakeWin({ fixed: true });
  const stopped = fakePage(fixed, '../src/ui/topple.js');
  assert.deepEqual(await begin({ win: fixed, doc: stopped.doc, load: stopped.load }), { ok: false, why: "localStorage couldn't be kept apart from the main site's", loaded: [], failed: [] });
  assert.deepEqual(stopped.loaded, []);
  assert.equal(stopped.main.children[0].textContent, STOPPED);
});

/* ---------- offline caches: each app's own ---------- */

const SITE = 'https://donpark2000.github.io/Web-Games/';
const LAB_SITE = `${SITE}${LAB}/`;

test("lab: its sw.js is the main site's with only the caches' names changed", async () => {
  assert.ok(!CACHE_PREFIX.startsWith('lets-play-') && !'lets-play-'.startsWith(CACHE_PREFIX), 'the two apps\' cache names overlap');
  const base = labSwBase(await read('sw.js'));
  assert.ok(base.includes(`const PREFIX = '${CACHE_PREFIX}';`) && !base.includes("'lets-play-'"));
  assert.throws(() => labSwBase('const PREFIX = \'x-\';'), /no const PREFIX = 'lets-play-';/);
});

test("lab: its offline app saves the main site's files it uses, plays with no connection, and keeps nothing from the main site's caches", async () => {
  const labSw = labSwBase(await read('sw.js'));
  const mainSw = await read('sw.js');
  const store = new Map();
  // the main site saved first, with the same file and hash
  const main = runSw(mainSw, { files: ['index.html', 'src/a.js'], version: 'm1', store, hashes: { 'index.html': 'i1', 'src/a.js': 'a1' } });
  await main.install();
  const lab = runSw(labSw, { dir: `/Web-Games/${LAB}/`, files: ['index.html', '../src/a.js'], version: 'l1', store, hashes: { 'index.html': 'L1', '../src/a.js': 'a1' } });
  await lab.install();
  assert.deepEqual(lab.net.calls.map(c => c.url), [`${LAB_SITE}index.html`, `${SITE}src/a.js`], "kept from the main site's cache");
  assert.deepEqual([...store.get('topple-lab-l1').keys()], [`${LAB_SITE}index.html`, `${SITE}src/a.js`, `${LAB_SITE}offline-record.json`]);
  await lab.activate();
  assert.deepEqual([...store.keys()], ['lets-play-m1', 'topple-lab-l1'], "the lab cleared the main site's cache");
  lab.net.down = true;
  assert.equal(await (await lab.get(`${SITE}src/a.js`)).text(), 'net:/Web-Games/src/a.js', 'not played offline');
  assert.equal(await (await lab.get(LAB_SITE)).text(), `net:/Web-Games/${LAB}/index.html`);
  // a new lab version keeps its own unchanged files
  const lab2 = runSw(labSw, { dir: `/Web-Games/${LAB}/`, files: ['index.html', '../src/a.js'], version: 'l2', store, hashes: { 'index.html': 'L2', '../src/a.js': 'a1' } });
  await lab2.install();
  assert.deepEqual(lab2.net.calls.map(c => c.url), [`${LAB_SITE}index.html`]);
  await lab2.activate();
  assert.deepEqual([...store.keys()], ['lets-play-m1', 'topple-lab-l2']);
  // and the main site's new version clears its own old cache, not the lab's
  const main2 = runSw(mainSw, { files: ['index.html', 'src/a.js'], version: 'm2', store, hashes: { 'index.html': 'i2', 'src/a.js': 'a1' } });
  await main2.install();
  assert.deepEqual(main2.net.calls.map(c => c.url), [`${SITE}index.html`], "kept from the lab's cache, or not from its own");
  await main2.activate();
  assert.deepEqual([...store.keys()].sort(), ['lets-play-m2', 'topple-lab-l2'], "the main site cleared the lab's cache");
});

/* ---------- its own installed app ---------- */

test('lab: its manifest names it "Topple Lab", its own app; its icon is the bear on lab purple, at every size', async () => {
  const m = JSON.parse(await read(`${LAB}/manifest.webmanifest`));
  assert.equal(m.name, 'Topple Lab');
  assert.equal(m.short_name, 'Topple Lab');
  assert.deepEqual([m.id, m.start_url, m.scope], [undefined, './', './'], "its own app: the lab's folder, and no id (Q140: './' is the whole site)");
  assert.equal(await read(`${LAB}/icons/icon.svg`), labIconSvg(), 'run  node tools/make-icons.js lab');
  assert.notEqual(labIconSvg(), iconSvg());
  for (const { file, size } of PNGS) assert.deepEqual(pngSize(await readFile(path.join(labRoot, 'icons', file))), { width: size, height: size }, file);
  for (const i of m.icons) assert.ok((await readdir(path.join(labRoot, 'icons'))).includes(i.src.replace('icons/', '')), i.src);
});

test("lab: its copy of topple-sets.js finds the main site's pictures, one folder up", async () => {
  const s = await read(`${LAB}/src/ui/topple-sets.js`);
  const dir = s.match(/export const PHOTO_DIR = '([^']+)';/)[1];
  assert.equal(dir, '../data/topple/');
  const pics = (await readdir(path.join(labRoot, dir))).filter(f => f.endsWith('.jpg'));
  assert.ok(pics.length >= 20, `${pics.length} pictures`);
});
