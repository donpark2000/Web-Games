// The offline app (DESIGN.md "Offline app"): sw.js lists every file of the
// site with a version made from them (tools/offline.js), and saves, serves
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
import { siteFiles, siteVersion, withList, check } from '../tools/offline.js';
import { iconSvg, pngSize, PNGS } from '../tools/make-icons.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const swSource = await readFile(path.join(root, 'sw.js'), 'utf8');

/* ---------- the file list and version ---------- */

test('offline: sw.js lists every file of the site, with their version', async () => {
  const { files, version, problems } = await check(root);
  assert.deepEqual(problems, [], `sw.js is out of date: run  node tools/offline.js\n${problems.join('\n')}`);
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.ok(files.length >= 60, `only ${files.length} files`);
});

test('offline: the list has every page, style, script, data file and icon, and nothing else', async () => {
  const files = await siteFiles(root);
  const pages = (await readdir(root)).filter(f => f.endsWith('.html'));
  for (const f of [...pages, 'manifest.webmanifest', 'css/site.css', 'src/ui/offline.js', 'src/core/nim.js', 'data/five-dice-long.bin', 'icons/apple-touch-icon.png']) {
    assert.ok(files.includes(f), `${f} not saved`);
  }
  for (const f of files) assert.doesNotMatch(f, /^(tests|tools|sw\.js|package\.json|.*\.md$)/, `${f} shouldn't be saved`);
});

// A small site in a temp folder, its sw.js made current.
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
  const files = await siteFiles(dir);
  await writeFile(path.join(dir, 'sw.js'), withList(swSource, await siteVersion(dir, files), files));
  return dir;
}

test('offline: a current list passes; a changed, added or removed file is reported', async t => {
  const dir = await tinySite(t);
  assert.deepEqual((await check(dir)).problems, []);
  assert.deepEqual(await siteFiles(dir), ['css/a.css', 'index.html', 'src/x.js']);

  await writeFile(path.join(dir, 'css/a.css'), 'p { color: blue }\n');
  const changed = (await check(dir)).problems;
  assert.equal(changed.length, 1, changed.join('\n'));
  assert.match(changed[0], /^version [0-9a-f]{12}, the files make [0-9a-f]{12}$/);

  await writeFile(path.join(dir, 'src/y.js'), '');
  assert.ok((await check(dir)).problems.some(p => p === 'not saved for offline: src/y.js'));

  await rm(path.join(dir, 'index.html'));
  assert.ok((await check(dir)).problems.some(p => p === 'listed but not in the site: index.html'));
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
  assert.throws(() => withList('const x = 1;', 'abc', []), /missing/);
});

/* ---------- sw.js at work, with a fake cache and network ---------- */

const SITE = 'https://donpark2000.github.io/Web-Games/';

// Runs sw.js for `host` with FILES and VERSION set, a fake cache store and
// a fake network: `net.down` makes every fetch fail; `net.missing` files
// answer 404. Returns the handlers and what they did.
function runSw({ host = 'donpark2000.github.io', files = ['index.html', 'nim.html', 'src/a.js'], version = 'v2', store = new Map() } = {}) {
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
  vm.runInNewContext(withList(swSource, version, files), { self, caches, fetch, Request, Response, URL });
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
  assert.deepEqual([...saved.keys()], [`${SITE}index.html`, `${SITE}nim.html`, `${SITE}src/a.js`]);
  assert.ok(sw.net.calls.every(c => c.cache === 'reload'), JSON.stringify(sw.net.calls));
  assert.equal(sw.did.skipWaiting, 1);
});

test('offline sw: if one file fails, the install fails and saves nothing', async () => {
  const sw = runSw();
  sw.net.missing = ['src/a.js'];
  await assert.rejects(sw.install(), /a\.js: 404/);
  assert.equal(sw.store.get('lets-play-v2').size, 0);
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

test('offline sw: tells a page its version', () => {
  const sw = runSw({ files: ['a.html', 'b.html'], version: 'abc' });
  const posted = [];
  sw.handlers.message({ data: 'version', source: { postMessage: m => posted.push(m) } });
  sw.handlers.message({ data: 'something else', source: { postMessage: m => posted.push(m) } });
  // (made inside the vm, so compared as JSON: its objects have their own prototype)
  assert.deepEqual(JSON.parse(JSON.stringify(posted)), [{ version: 'abc', files: 2, freshFirst: false }]);
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
  assert.match(await readFile(path.join(root, 'index.html'), 'utf8'), /<title>Let's Play!<\/title>/);
});
