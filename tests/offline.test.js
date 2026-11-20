// The offline app (DESIGN.md "Offline app"): sw.js lists every file of the
// site with a version made from them, also in src/core/version.js for the
// pages (tools/offline.js), and saves, serves
// and replaces them as it should (run here with a fake cache and network);
// the manifest and icons are right; every page links them and loads
// src/ui/offline.js. Stale-list checks run on a small site in a temp
// folder, removed afterwards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { siteFiles, siteVersion, withList, check, madeDay, today, update, versionModule, VERSION_FILE, RELEASE_FILE, readRelease, fileHashes, listedHashes } from '../tools/offline.js';
import { versionLabel, dayLabel, reloadFor } from '../src/core/appversion.js';
import { iconSvg, pngSize, PNGS } from '../tools/make-icons.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const swSource = await readFile(path.join(root, 'sw.js'), 'utf8');

/* ---------- the file list and version ---------- */

test('offline: sw.js lists every file of the site, with their version', async () => {
  const { files, version, problems } = await check(root);
  assert.deepEqual(problems, [], `sw.js or ${VERSION_FILE} is out of date: run  node tools/offline.js\n${problems.join('\n')}`);
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.ok(files.length >= 60, `only ${files.length} files`);
});

test('offline: the list has every page, style, script, data file and icon, and nothing else', async () => {
  const files = await siteFiles(root);
  const pages = (await readdir(root)).filter(f => f.endsWith('.html'));
  for (const f of [...pages, 'manifest.webmanifest', 'css/site.css', 'src/ui/offline.js', VERSION_FILE, 'src/core/nim.js', 'data/five-dice-long.bin', 'icons/apple-touch-icon.png',
    // three.js, for the 3D games (DESIGN.md "3D games"), with its licence
    'src/vendor/three/three.module.min.js', 'src/vendor/three/RoundedBoxGeometry.js', 'src/vendor/three/LICENSE']) {
    assert.ok(files.includes(f), `${f} not saved`);
  }
  for (const f of files) assert.doesNotMatch(f, /^(tests|tools|sw\.js|package\.json|.*\.md$)/, `${f} shouldn't be saved`);
});

// A small site in a temp folder, made current by the tool (its version's
// day 2026-10-11).
async function tinySite(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'offline-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'css'));
  await mkdir(path.join(dir, 'src'));
  await mkdir(path.join(dir, 'tests'));
  await writeFile(path.join(dir, 'index.html'), '<p>hi</p>\n');
  await writeFile(path.join(dir, 'css/a.css'), 'p { color: red }\n');
  await writeFile(path.join(dir, 'src/x.js'), 'export const x = 1;\n');
  await writeFile(path.join(dir, 'tests/x.test.js'), '');
  await writeFile(path.join(dir, 'README.md'), '');
  await writeFile(path.join(dir, 'sw.js'), swSource);
  assert.match(await update(dir, '2026-10-11'), /^sw\.js and src\/core\/version\.js: version [0-9a-f]{12} \(2026-10-11\), 4 files$/);
  return dir;
}

test('offline: a current list passes; a changed, added or removed file is reported', async t => {
  const dir = await tinySite(t);
  assert.deepEqual((await check(dir)).problems, []);
  assert.deepEqual(await siteFiles(dir), ['css/a.css', 'index.html', 'src/core/version.js', 'src/x.js']);
  assert.match(await update(dir, '2026-12-25'), /^sw\.js and src\/core\/version\.js are up to date: .*\(2026-10-11\)/, 'nothing to do');

  await writeFile(path.join(dir, 'css/a.css'), 'p { color: blue }\n');
  const changed = (await check(dir)).problems;
  assert.equal(changed.length, 3, changed.join('\n'));
  assert.match(changed[0], /^version [0-9a-f]{12}, the files make [0-9a-f]{12}$/);
  assert.equal(changed[1], 'hashes out of date: css/a.css', 'only the changed file');
  assert.match(changed[2], /^src\/core\/version\.js doesn't say version [0-9a-f]{12} \(2026-10-11\)$/);

  await writeFile(path.join(dir, 'src/y.js'), '');
  assert.ok((await check(dir)).problems.some(p => p === 'not saved for offline: src/y.js'));

  await rm(path.join(dir, 'index.html'));
  assert.ok((await check(dir)).problems.some(p => p === 'listed but not in the site: index.html'));
  assert.ok((await check(dir)).problems.some(p => p === 'hashes for files not in the site: index.html'));
});

// Q139 (11.6): each file's hash, for keeping unchanged files at a release.
test('offline: sw.js has each file\'s hash (not the version file\'s); a hand-edited hash is reported', async t => {
  const dir = await tinySite(t);
  const sw = await readFile(path.join(dir, 'sw.js'), 'utf8');
  const hashes = listedHashes(sw);
  assert.deepEqual(Object.keys(hashes), ['css/a.css', 'index.html', 'src/x.js']);
  assert.deepEqual(hashes, await fileHashes(dir, await siteFiles(dir)));
  for (const h of Object.values(hashes)) assert.match(h, /^[0-9a-f]{12}$/);
  await writeFile(path.join(dir, 'sw.js'), sw.replace(`'src/x.js': '${hashes['src/x.js']}'`, "'src/x.js': '000000000000'"));
  assert.deepEqual((await check(dir)).problems, ['hashes out of date: src/x.js']);
  // Windows line ends: the same hash.
  await writeFile(path.join(dir, 'css/a.css'), 'p { color: red }\r\n');
  assert.equal((await fileHashes(dir, ['css/a.css']))['css/a.css'], hashes['css/a.css']);
});

test('offline: src/core/version.js says the version and its day; stale or missing is reported', async t => {
  const dir = await tinySite(t);
  const sw = await readFile(path.join(dir, 'sw.js'), 'utf8');
  const version = sw.match(/const VERSION = '([^']*)';/)[1];
  const mod = await readFile(path.join(dir, VERSION_FILE), 'utf8');
  assert.equal(mod, versionModule(version, '2026-10-11'));
  assert.ok(mod.includes(`export const VERSION = '${version}';`) && mod.includes("export const MADE = '2026-10-11';"), mod);
  // It holds the version, so it isn't part of it (or the version could never settle).
  await writeFile(path.join(dir, VERSION_FILE), '// anything\n');
  assert.equal(await siteVersion(dir, await siteFiles(dir)), version);
  assert.deepEqual((await check(dir)).problems, [`${VERSION_FILE} doesn't say version ${version} (2026-10-11)`]);
  await writeFile(path.join(dir, VERSION_FILE), mod.replace(/\n/g, '\r\n'));
  assert.deepEqual((await check(dir)).problems, [], 'Windows line ends: the same file');
  await rm(path.join(dir, VERSION_FILE));
  assert.deepEqual((await check(dir)).problems, [`no ${VERSION_FILE}`]);
  // A new version: both files change, with that day.
  await writeFile(path.join(dir, 'index.html'), '<p>hello</p>\n');
  assert.match(await update(dir, '2026-12-25'), /^sw\.js and src\/core\/version\.js: version [0-9a-f]{12} \(2026-12-25\)/);
  assert.deepEqual((await check(dir)).problems, []);
  assert.match(await readFile(path.join(dir, VERSION_FILE), 'utf8'), /export const MADE = '2026-12-25';/);
});

test('offline: Windows line ends make the same version; a binary file is taken as it is', async t => {
  const dir = await tinySite(t);
  const files = await siteFiles(dir);
  const before = await siteVersion(dir, files);
  await writeFile(path.join(dir, 'css/a.css'), 'p { color: red }\r\n');
  assert.equal(await siteVersion(dir, files), before);
  await mkdir(path.join(dir, 'data'));
  await writeFile(path.join(dir, 'data/b.bin'), Buffer.from([1, 13, 10, 2]));
  const v1 = await siteVersion(dir, [...files, 'data/b.bin']);
  await writeFile(path.join(dir, 'data/b.bin'), Buffer.from([1, 10, 2]));
  assert.notEqual(await siteVersion(dir, [...files, 'data/b.bin']), v1);
});

test('offline: sw.js without its made-by-the-tool lines is refused', () => {
  assert.throws(() => withList('const x = 1;', 'abc', [], '2026-10-11'), /missing/);
});

test("offline: the version's day is kept while the version stays, and is today for a new one", async t => {
  const dir = await tinySite(t);
  const sw = await readFile(path.join(dir, 'sw.js'), 'utf8');
  const version = sw.match(/const VERSION = '([^']*)';/)[1];
  assert.match(sw, /const MADE = '2026-10-11';/);
  assert.equal(madeDay(sw, version, '2026-12-25'), '2026-10-11', 'same version: its day kept');
  assert.equal(madeDay(sw, 'another', '2026-12-25'), '2026-12-25', 'a new version: today');
  assert.equal(madeDay('no lines at all', version, '2026-12-25'), '2026-12-25');
  assert.equal(today(new Date(2026, 0, 5, 23, 59)), '2026-01-05', 'local day, zero-padded');
  // A bad day is refused; a sw.js without one is reported.
  assert.throws(() => withList(sw, version, ['index.html'], '11 Oct'), /YYYY-MM-DD/);
  assert.throws(() => withList(sw, version, ['index.html']), /YYYY-MM-DD/);
  await writeFile(path.join(dir, 'sw.js'), sw.replace(/const MADE = .*\n/, ''));
  assert.deepEqual((await check(dir)).problems, ['no day for the version (MADE)']);
});

test("offline: the home page's version line", () => {
  const v1 = { version: '19e2c03b21a3', made: '2026-10-11' }, v2 = { version: 'a1b2c3d4e5f6', made: '2026-10-12' };
  assert.equal(versionLabel(v1), 'Version Oct 11, 2026 · 19e2c0');
  assert.equal(versionLabel(v1, v1), 'Version Oct 11, 2026 · 19e2c0', 'the same version is no news');
  assert.equal(versionLabel(v1, v2), 'Version Oct 11, 2026 · 19e2c0 (new version next time: Oct 12, 2026 · a1b2c3)');
  assert.equal(versionLabel({ version: 'abcdef123456' }), 'Version abcdef', 'an older sw.js has no day');
  assert.equal(dayLabel('2026-01-05'), 'Jan 5, 2026');
  assert.equal(dayLabel('2026-13-05'), '2026-13-05', 'not a day: as it is');
  assert.equal(dayLabel(undefined), '');
});

// 3.11 (developer: new versions "not happening right away. Even if I fully
// close the app"; measured: the new version took over 1.7 s after opening
// and the page on screen stayed old): the home page loads again, once per
// version; a game page never does.
test('offline: the home page reloads for a new version running; not a game, not localhost, not twice', () => {
  const own = { version: 'aaa' }, run = { version: 'bbb', freshFirst: false };
  assert.deepEqual(reloadFor({ home: true, own, running: run }), { reload: true, why: 'a new version is running' });
  assert.equal(reloadFor({ home: true, own, running: { version: 'aaa' } }).why, 'same version');
  assert.equal(reloadFor({ home: true, own, running: {} }).why, 'same version', 'an answer with no version');
  assert.match(reloadFor({ home: false, own, running: run }).why, /^not the home page/);
  assert.equal(reloadFor({ home: true, own, running: { ...run, freshFirst: true } }).reload, false, 'localhost');
  assert.deepEqual(reloadFor({ home: true, own, running: run, reloadedFor: 'bbb' }), { reload: false, why: 'already reloaded for it' });
  assert.equal(reloadFor({ home: true, own, running: { version: 'ccc' }, reloadedFor: 'bbb' }).reload, true, 'a later version: once more');
});

test('offline: the page reloads through reloadFor, asks for a check, and logs each step', async () => {
  const ui = await readFile(path.join(root, 'src/ui/offline.js'), 'utf8');
  assert.match(ui, /reloadFor\(\{ home: !!line, own: \{ version: VERSION \}, running, reloadedFor \}\)/);
  assert.match(ui, /session\.setItem\(RELOADED_KEY, running\.version\);[\s\S]*?location\.reload\(\);/, 'the reload not remembered before it happens');
  assert.equal((ui.match(/location\.reload\(\)/g) || []).length, 1, 'a reload not through reloadFor');
  assert.match(ui, /reg\.update\(\)/, 'no check for a new version');
  for (const what of ['on the device at opening', 'a new version found: installing', 'checked for a new version', 'reloading the home page for the new version', 'not reloading for the version running']) {
    assert.ok(ui.includes(`'${what}'`), `not logged: ${what}`);
  }
});

/* ---------- sw.js at work, with a fake cache and network ---------- */

const SITE = 'https://donpark2000.github.io/Web-Games/';

// Runs sw.js for `host` with FILES and VERSION set, a fake cache store and
// a fake network: `net.down` makes every fetch fail; `net.missing` files
// answer 404. Returns the handlers and what they did.
function runSw({ host = 'donpark2000.github.io', files = ['index.html', 'nim.html', 'src/a.js'], version = 'v2', made = '2026-10-11', release = '', store = new Map(), hashes = {} } = {}) {
  const scope = `https://${host}/Web-Games/`;
  const net = { down: false, missing: [], calls: [] };
  const fetch = async r => {
    const url = typeof r === 'string' ? r : r.url;
    net.calls.push({ url, cache: r.cache });
    if (net.down) throw new TypeError('Failed to fetch');
    const status = net.missing.some(m => url.endsWith(m)) ? 404 : 200;
    return new Response(`net:${new URL(url).pathname}`, { status });
  };
  const caches = {
    async open(name) {
      if (!store.has(name)) store.set(name, new Map());
      const m = store.get(name);
      return {
        async addAll(reqs) {   // all or nothing, like the real one
          const got = [];
          for (const r of reqs) {
            const res = await fetch(r);
            if (!res.ok) throw new TypeError(`${r.url}: ${res.status}`);
            got.push([r.url, res]);
          }
          for (const [u, res] of got) m.set(u, res);
        },
        async match(u) { return m.get(u)?.clone(); },
        async put(u, res) { m.set(u, res); },
      };
    },
    async keys() { return [...store.keys()]; },
    async delete(name) { return store.delete(name); },
  };
  const handlers = {}, did = { skipWaiting: 0, claim: 0, posted: [] };
  const self = {
    location: new URL(`${scope}sw.js`), registration: { scope },
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: async () => { did.skipWaiting++; },
    clients: { claim: async () => { did.claim++; } },
  };
  vm.runInNewContext(withList(swSource, version, files, made, release, hashes), { self, caches, fetch, Request, Response, URL });
  const wait = type => { const e = { waitUntil(p) { e.p = p; } }; handlers[type](e); return e.p; };
  // A fetch event: the response, or null if sw.js leaves it to the browser.
  const get = async (url, method = 'GET') => {
    const e = { request: new Request(url, { method }), respondWith(p) { e.p = p; } };
    handlers.fetch(e);
    return e.p ? e.p : null;
  };
  return { handlers, did, net, store, scope, install: () => wait('install'), activate: () => wait('activate'), get };
}

test('offline sw: install saves every file fresh from the site, then takes over', async () => {
  const sw = runSw();
  await sw.install();
  const saved = sw.store.get('lets-play-v2');
  assert.deepEqual([...saved.keys()], [`${SITE}index.html`, `${SITE}nim.html`, `${SITE}src/a.js`, `${SITE}offline-record.json`]);
  assert.ok(sw.net.calls.every(c => c.cache === 'reload'), JSON.stringify(sw.net.calls));
  assert.equal(sw.did.skipWaiting, 1);
});

test('offline sw: if one file fails, the install fails and saves nothing', async () => {
  const sw = runSw();
  sw.net.missing = ['src/a.js'];
  await assert.rejects(sw.install(), /a\.js: 404/);
  assert.equal(sw.store.has('lets-play-v2'), false);
  assert.equal(sw.did.skipWaiting, 0);
});

test('offline sw: activate deletes older versions only, and takes over open pages', async () => {
  const store = new Map([['lets-play-v1', new Map()], ['lets-play-v2', new Map()], ['someone-else', new Map()]]);
  const sw = runSw({ store });
  await sw.activate();
  assert.deepEqual([...store.keys()], ['lets-play-v2', 'someone-else']);
  assert.equal(sw.did.claim, 1);
});

test('offline sw: the live site plays from the saved files, with or without a connection', async () => {
  const sw = runSw();
  await sw.install();
  sw.net.calls.length = 0;
  sw.net.down = true;
  assert.equal(await (await sw.get(`${SITE}nim.html`)).text(), 'net:/Web-Games/nim.html');
  assert.equal(await (await sw.get(SITE)).text(), 'net:/Web-Games/index.html', 'the folder is its index.html');
  assert.equal(await (await sw.get(`${SITE}nim.html?x=1#y`)).text(), 'net:/Web-Games/nim.html', 'a ?query is ignored');
  assert.equal(sw.net.calls.length, 0, 'no network used');
  // A file that isn't saved goes to the network (and fails with none).
  await assert.rejects(sw.get(`${SITE}other.html`), /Failed to fetch/);
  sw.net.down = false;
  assert.equal(await (await sw.get(`${SITE}other.html`)).text(), 'net:/Web-Games/other.html');
});

test('offline sw: other sites (the stats counter) and anything but GET are left alone', async () => {
  const sw = runSw();
  await sw.install();
  assert.equal(await sw.get('https://donpark2000.goatcounter.com/count?p=/Web-Games/'), null);
  assert.equal(await sw.get(`${SITE}nim.html`, 'POST'), null);
});

test('offline sw: on localhost the network comes first; the saved copy when the server is stopped', async () => {
  const sw = runSw({ host: 'localhost' });
  const local = sw.scope;
  await sw.install();
  sw.store.get('lets-play-v2').set(`${local}nim.html`, new Response('saved'));
  assert.equal(await (await sw.get(`${local}nim.html`)).text(), 'net:/Web-Games/nim.html', 'edits show on a reload');
  sw.net.down = true;
  assert.equal(await (await sw.get(`${local}nim.html`)).text(), 'saved');
  await assert.rejects(sw.get(`${local}other.html`), /Failed to fetch/);
});

test('offline sw: tells a page its version, and what its install did', async () => {
  const sw = runSw({ files: ['a.html', 'b.html'], version: 'abc', made: '2026-10-12', release: '1.0', hashes: { 'a.html': '111', 'b.html': '222' } });
  const posted = [];
  const ask = async data => { const e = { data, source: { postMessage: m => posted.push(m) }, waitUntil(p) { e.p = p; } }; sw.handlers.message(e); await e.p; };
  await ask('version');   // not installed yet: no record
  await ask('something else');
  await sw.install();
  await ask('version');
  // (made inside the vm, so compared as JSON: its objects have their own prototype)
  const base = { release: '1.0', version: 'abc', made: '2026-10-12', files: 2, freshFirst: false };
  assert.deepEqual(JSON.parse(JSON.stringify(posted)), [{ ...base, install: null }, { ...base, install: { kept: 0, fetched: 2, from: null } }]);
});

// Q139 (11.6): a release downloads only the files that changed.
test('offline sw: a new version keeps the saved files whose hash is the same, and fetches the rest', async () => {
  const files = ['index.html', 'nim.html', 'src/a.js', 'data/big.jpg'];
  const store = new Map();
  const v1 = runSw({ files, version: 'v1', store, hashes: { 'index.html': 'i1', 'nim.html': 'n1', 'src/a.js': 'a1', 'data/big.jpg': 'b1' } });
  await v1.install();
  assert.equal(v1.net.calls.length, 4);
  const v2 = runSw({ files: [...files, 'src/new.js'], version: 'v2', store, hashes: { 'index.html': 'i2', 'nim.html': 'n1', 'src/a.js': 'a1', 'data/big.jpg': 'b1', 'src/new.js': 'x1' } });
  await v2.install();
  assert.deepEqual(v2.net.calls.map(c => c.url), [`${SITE}index.html`, `${SITE}src/new.js`], 'only the changed and the new file downloaded');
  assert.ok(v2.net.calls.every(c => c.cache === 'reload'));
  const saved = store.get('lets-play-v2');
  for (const f of [...files, 'src/new.js']) assert.equal(await (await saved.get(`${SITE}${f}`)).clone().text(), `net:/Web-Games/${f}`, f);
  const rec = JSON.parse(await saved.get(`${SITE}offline-record.json`).clone().text());
  assert.deepEqual({ kept: rec.kept, fetched: rec.fetched, from: rec.from }, { kept: 3, fetched: 2, from: 'v1' });
  // Played with no connection: every file there.
  await v2.activate();
  v2.net.down = true;
  assert.equal(await (await v2.get(`${SITE}data/big.jpg`)).text(), 'net:/Web-Games/data/big.jpg');
  assert.deepEqual([...store.keys()], ['lets-play-v2']);
});

test('offline sw: a cache from before 11.6 (no hashes), or a hash with no saved file, means a fresh download', async () => {
  const files = ['index.html', 'nim.html'], hashes = { 'index.html': 'i1', 'nim.html': 'n1' };
  const store = new Map([['lets-play-old', new Map([[`${SITE}index.html`, new Response('old')], [`${SITE}nim.html`, new Response('old')]])]]);
  const sw = runSw({ files, version: 'v2', store, hashes });
  await sw.install();
  assert.equal(sw.net.calls.length, 2, 'nothing kept from a cache with no record');
  // A record says the file was saved, but it isn't there: fetched.
  store.get('lets-play-v2').delete(`${SITE}nim.html`);
  const v3 = runSw({ files, version: 'v3', store, hashes });
  await v3.install();
  assert.deepEqual(v3.net.calls.map(c => c.url), [`${SITE}nim.html`]);
});

test('offline sw: a failed install removes its cache and leaves the old version as it was', async () => {
  const files = ['index.html', 'nim.html'];
  const store = new Map();
  const v1 = runSw({ files, version: 'v1', store, hashes: { 'index.html': 'i1', 'nim.html': 'n1' } });
  await v1.install();
  const v2 = runSw({ files, version: 'v2', store, hashes: { 'index.html': 'i1', 'nim.html': 'n2' } });
  v2.net.missing = ['nim.html'];
  await assert.rejects(v2.install(), /nim\.html: 404/);
  assert.deepEqual([...store.keys()], ['lets-play-v1'], 'the half-made cache is gone');
  assert.equal(store.get('lets-play-v1').size, 3, "v1's two files and its record untouched");
  assert.equal(v2.did.skipWaiting, 0);
});

/* ---------- the manifest, icons and pages ---------- */

test('offline: the manifest names the app "Let\'s Play!" and its icons exist at their sizes', async () => {
  const m = JSON.parse(await readFile(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.name, "Let's Play!");
  assert.ok(m.short_name.length <= 12, `"${m.short_name}" is cut off on a phone`);
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some(i => i.purpose === 'maskable' && i.sizes === '512x512'), 'no maskable icon (Android)');
  let checked = 0;
  for (const i of m.icons.filter(i => i.type === 'image/png')) {
    const [w, h] = i.sizes.split('x').map(Number);
    assert.deepEqual(pngSize(await readFile(path.join(root, i.src))), { width: w, height: h }, i.src);
    checked++;
  }
  assert.ok(checked >= 3, `only ${checked} icons checked`);
});

test('offline: the icons are the happy bear, made by tools/make-icons.js', async () => {
  assert.equal((await readFile(path.join(root, 'icons/icon.svg'), 'utf8')).replace(/\r\n/g, '\n'), iconSvg(),
    'icons/icon.svg is out of date: run  node tools/make-icons.js');
  for (const { file, size } of PNGS) {
    assert.deepEqual(pngSize(await readFile(path.join(root, 'icons', file))), { width: size, height: size }, file);
  }
  assert.throws(() => pngSize(Buffer.from('not a picture at all, no')), /not a PNG/);
});

test('offline: every page links the manifest and icons, and loads src/ui/offline.js', async () => {
  const pages = (await readdir(root)).filter(f => f.endsWith('.html'));
  assert.ok(pages.length >= 11);
  for (const p of pages) {
    const s = await readFile(path.join(root, p), 'utf8');
    for (const tag of ['<link rel="manifest" href="manifest.webmanifest">', '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
      '<meta name="apple-mobile-web-app-title" content="Let\'s Play!">', '<script type="module" src="src/ui/offline.js"></script>']) {
      assert.ok(s.includes(tag), `${p}: no ${tag}`);
    }
  }
  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  // The version line shows the page's own version (developer, 2026-10-11:
  // "The version should always be the version"), not "Not saved for offline yet".
  const ui = await readFile(path.join(root, 'src/ui/offline.js'), 'utf8');
  assert.match(ui, /import \{ VERSION, MADE \} from '\.\.\/core\/version\.js';/);
  assert.doesNotMatch(ui + await readFile(path.join(root, 'src/core/appversion.js'), 'utf8'), /'Not saved for offline yet'/);
  assert.match(home, /<title>Let's Play!<\/title>/);
  assert.match(home, /<footer class="site-foot">[\s\S]*<a class="app-version" id="appVersion" href="log.html" hidden><\/a><\/footer>/, 'the home page has no version line');
});

// Releases (DESIGN.md "Releases", 2026-10-16): the release number, set by
// hand in src/core/release.js, is copied into sw.js and shown first on the
// version line; a changed number with sw.js not brought up to date is
// reported.
test('offline: the release number goes into sw.js and leads the version line', async t => {
  const dir = await tinySite(t);
  assert.match(await readFile(path.join(dir, 'sw.js'), 'utf8'), /const RELEASE = '';/, 'no release file: none');
  await mkdir(path.join(dir, 'src/core'), { recursive: true });
  await writeFile(path.join(dir, RELEASE_FILE), "export const RELEASE = '1.0';\n");
  assert.equal(await readRelease(dir), '1.0');
  const stale = (await check(dir)).problems;
  assert.ok(stale.includes(`release , ${RELEASE_FILE} says 1.0`), stale.join('\n'));
  assert.match(await update(dir, '2026-10-16'), /: release 1\.0, version [0-9a-f]{12} \(2026-10-16\), 5 files$/);
  assert.match(await readFile(path.join(dir, 'sw.js'), 'utf8'), /const RELEASE = '1\.0';/);
  assert.deepEqual((await check(dir)).problems, []);
  const v = { release: '1.0', version: '19e2c03b21a3', made: '2026-10-11' };
  assert.equal(versionLabel(v), 'Version 1.0 · Oct 11, 2026 · 19e2c0');
  assert.equal(versionLabel(v, { release: '1.1', version: 'a1b2c3d4e5f6', made: '2026-10-12' }), 'Version 1.0 · Oct 11, 2026 · 19e2c0 (new version next time: 1.1 · Oct 12, 2026 · a1b2c3)');
  assert.equal(versionLabel(v, { version: 'a1b2c3d4e5f6', made: '2026-10-12' }), 'Version 1.0 · Oct 11, 2026 · 19e2c0 (new version next time: Oct 12, 2026 · a1b2c3)', 'an older sw.js: no release');
  // The live sw.js tells the page its release.
  assert.match(swSource, /postMessage\(\{ release: RELEASE, version: VERSION,/);
});
