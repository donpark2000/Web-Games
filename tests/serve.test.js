import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from '../tools/serve.js';

let dir, site, server, base;

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'web-games-serve-'));
  site = path.join(dir, 'site');
  await mkdir(path.join(site, 'src'), { recursive: true });
  await writeFile(path.join(site, 'index.html'), '<h1>home</h1>');
  await writeFile(path.join(site, 'src', 'a.js'), 'export const a = 1;');
  await writeFile(path.join(dir, 'secret.txt'), 'outside the site');
  server = createServer(site);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(r => server.close(r));
  await rm(dir, { recursive: true, force: true });
});

test('serve: / gives index.html as HTML', async () => {
  const r = await fetch(base + '/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^text\/html/);
  assert.equal(await r.text(), '<h1>home</h1>');
});

test('serve: modules get a JavaScript type (browsers refuse modules otherwise)', async () => {
  const r = await fetch(base + '/src/a.js');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^text\/javascript/);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('serve: a missing file is 404', async () => {
  assert.equal((await fetch(base + '/nope.html')).status, 404);
});

test('serve: files outside the site folder are refused', async () => {
  // fetch() tidies "/../", so send the raw, encoded path by hand.
  for (const p of ['/%2e%2e/secret.txt', '/src/%2e%2e/%2e%2e/secret.txt', '/..%5csecret.txt']) {
    const r = await fetch(base + p);
    assert.ok(r.status === 403 || r.status === 404, `${p} gave ${r.status}`);
    assert.notEqual(await r.text(), 'outside the site', p);
  }
});

test('serve: a malformed address is 400; other methods are 405', async () => {
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});
