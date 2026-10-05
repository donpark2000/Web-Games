// Checks the site's pages as files (no browser): every page has the
// footer, its "Source code" link opens in a new tab, every local file a
// page refers to exists, and the home page and the games link to each
// other. Read-only; nothing is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = (await readdir(root)).filter(f => f.endsWith('.html')).sort();
const games = pages.filter(p => p !== 'index.html');
const html = Object.fromEntries(await Promise.all(pages.map(async p => [p, await readFile(path.join(root, p), 'utf8')])));
// The local files a page loads or links to (stylesheets, scripts, pages,
// module imports in inline scripts), without any ?query or #hash.
const localRefs = s => [...s.matchAll(/(?:href|src)="([^"]+)"|from '(\.\/[^']+)'/g)]
  .map(m => m[1] ?? m[2]).filter(u => !/^(https?:|mailto:|#)/.test(u)).map(u => u.replace(/[?#].*$/, ''));

test('pages: the home page and the five games exist', () => {
  assert.ok(pages.includes('index.html'));
  for (const g of ['tic-tac-toe.html', 'matching.html', 'connect-four.html', 'count-to-9.html', 'rock-paper-scissors.html']) assert.ok(games.includes(g), `${g} missing: ${games.join()}`);
});

test('pages: every page has the footer, and "Source code" opens in a new tab', () => {
  for (const p of pages) {
    const foot = html[p].match(/<footer class="site-foot">([\s\S]*?)<\/footer>/);
    assert.ok(foot, `${p}: no footer`);
    assert.match(foot[1], /© 2026 Donald Parker · Free software under the GPL-3\.0/, p);
    const a = foot[1].match(/<a [^>]*>Source code<\/a>/)?.[0];
    assert.ok(a, `${p}: no "Source code" link`);
    assert.match(a, /href="https:\/\/github\.com\/donpark2000\/Web-Games"/, p);
    assert.match(a, /target="_blank"/, `${p}: the link would replace the game`);
    assert.match(a, /rel="noopener"/, p);
  }
});

test('pages: every local file a page refers to exists', async () => {
  let checked = 0;
  for (const p of pages) {
    for (const ref of localRefs(html[p])) {
      await assert.doesNotReject(access(path.join(root, ref)), `${p} refers to a missing file: ${ref}`);
      checked++;
    }
  }
  assert.ok(checked >= pages.length * 3, `only ${checked} references checked`);
});

test('pages: the home page links to every game; every game has a 🏠 back to it', () => {
  for (const g of games) {
    assert.match(html['index.html'], new RegExp(`<a class="game"[^>]*href="${g}"`), `home has no button for ${g}`);
    assert.ok((html[g].match(/<a class="homebtn" href="index.html"/g) || []).length >= 2, `${g}: 🏠 missing on setup or play`);
  }
});
