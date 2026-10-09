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
const games = pages.filter(p => p !== 'index.html' && p !== 'log.html');
const html = Object.fromEntries(await Promise.all(pages.map(async p => [p, await readFile(path.join(root, p), 'utf8')])));
// The local files a page loads or links to (stylesheets, scripts, pages,
// module imports in inline scripts), without any ?query or #hash.
const localRefs = s => [...s.matchAll(/(?:href|src)="([^"]+)"|from '(\.\/[^']+)'/g)]
  .map(m => m[1] ?? m[2]).filter(u => !/^(https?:|mailto:|#)/.test(u)).map(u => u.replace(/[?#].*$/, ''));

test('pages: the home page and the nine games exist', () => {
  assert.ok(pages.includes('index.html'));
  for (const g of ['tic-tac-toe.html', 'matching.html', 'connect-four.html', 'count-to-9.html', 'snakes-ladders.html', 'five-dice.html', 'nim.html', 'rock-paper-scissors.html', 'follow-me.html']) assert.ok(games.includes(g), `${g} missing: ${games.join()}`);
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

// The log page is reached by its address only (developer, 2026-10-07), and
// the games have no on-screen debug panel or ?dev any more.
test('pages: the log page exists; no page links to it; no ?dev panel left', async () => {
  assert.ok(pages.includes('log.html'));
  for (const p of pages) assert.doesNotMatch(html[p], /href="log\.html/, `${p} links to the log page`);
  const ui = await readdir(path.join(root, 'src/ui'));
  let checked = 0;
  for (const f of [...ui.map(f => `src/ui/${f}`), ...pages]) {
    const s = await readFile(path.join(root, f), 'utf8');
    assert.doesNotMatch(s, /installDebugPanel|withDev|[?&]dev\b/, f);
    checked++;
  }
  assert.ok(checked > 20, `only ${checked} files checked`);
});

// The home page's groups (developer, 2026-10-04): a game with a two-player
// choice (a person or the robot as player 2) is a two-player game; one with
// no way to play another person is a one-player game. Each game in exactly
// one group.
test('pages: the home page groups the games: two players, then one player', () => {
  const groups = [...html['index.html'].matchAll(/<section class="group" id="(\w+)"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/g)]
    .map(([, id, title, body]) => ({ id, title: title.replace(/<[^>]+>/g, '').trim(), games: [...body.matchAll(/<a class="game"[^>]*href="([^"]+)"/g)].map(m => m[1]) }));
  assert.deepEqual(groups.map(g => [g.id, g.title]), [['twoGroup', '👥 Two players'], ['oneGroup', '👤 One player']]);
  assert.deepEqual(groups[0].games, ['tic-tac-toe.html', 'matching.html', 'connect-four.html', 'count-to-9.html', 'snakes-ladders.html', 'five-dice.html', 'nim.html']);
  assert.deepEqual(groups[1].games, ['rock-paper-scissors.html', 'follow-me.html']);
  const all = groups.flatMap(g => g.games);
  assert.deepEqual([...all].sort(), [...games].sort(), 'every game in exactly one group');
  assert.equal((html['index.html'].match(/<a class="game"/g) || []).length, all.length, 'a game button outside the groups');
});

// Nim's "How hard?": just the stars and the word, no line under them
// (developer, 2026-10-08: "robot doesn't know the trick" won't inspire
// anyone to play).
test('pages: Nim’s Easy and Hard have no explaining line', () => {
  const levels = [...html['nim.html'].matchAll(/<button [^>]*class="level"[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1]);
  assert.deepEqual(levels, ['<span class="ico">⭐</span>Easy', '<span class="ico">⭐⭐⭐</span>Hard']);
});

// The home page pictures: their grid columns must be minmax(0, 1fr). A
// plain 1fr column grows to fit what's in it: the matching-cards columns
// came out 20, 59 and 59 px and the Connect Four board's 5th column stuck
// out of the frame (developer's screenshot, 2026-10-04).
test('pages: the home page pictures share their width equally (no plain 1fr)', async () => {
  const css = await readFile(path.join(root, 'css/site.css'), 'utf8');
  const rules = [...css.matchAll(/(\.game \.pic[^{]*)\{([^}]*grid-template-columns[^}]*)\}/g)];
  assert.ok(rules.length >= 2, `only ${rules.length} picture grids found`);
  for (const [, sel, body] of rules) {
    const cols = body.match(/grid-template-columns:\s*([^;]+)/)[1];
    assert.match(cols, /^repeat\(\d+, minmax\(0, 1fr\)\)$/, `${sel.trim()}: ${cols}`);
  }
});

// The end of a Follow Me game (developer, 2026-10-09, mockup v3): Play
// again and New game only in the "Game over" banner over the pads, hidden
// during a game; the 🏠 outside it, so it still works with the banner up.
test('pages: Follow Me’s buttons are only in the Game over banner; the 🏠 stays outside it', async () => {
  const play = html['follow-me.html'].match(/<section id="play"[\s\S]*?<\/section>/)?.[0];
  assert.ok(play, 'no play screen');
  const board = play.match(/<div class="board">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0];
  assert.ok(board, 'no .board around the pads and the banner');
  assert.match(board, /<div class="pads wait" id="pads"><\/div>/);
  const over = board.match(/<div class="over" id="over"([^>]*)>([\s\S]*)/);
  assert.ok(over, 'no banner');
  assert.match(over[1], /\bhidden\b/, 'the banner shows during a game');
  assert.match(over[2], /Game over/);
  const buttons = [...play.matchAll(/<button[^>]*id="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(buttons, ['againBtn', 'newBtn'], `the play screen's buttons: ${buttons}`);
  for (const id of buttons) assert.match(over[2], new RegExp(`id="${id}"`), `${id} outside the banner`);
  assert.doesNotMatch(play, /class="controls"/, 'a Play again / New game row under the scoreboard');
  assert.match(play.slice(0, play.indexOf('<div class="board">')), /class="homebtn" href="index\.html"/, 'no 🏠 above the board');
  assert.doesNotMatch(board, /homebtn/, 'the 🏠 is under the banner');
  // The screen shows and hides it, and the banner sits over the pads,
  // out of the page's flow (so the fitted pads don't move).
  const js = await readFile(path.join(root, 'src/ui/follow-me.js'), 'utf8');
  assert.match(js, /later\(showBanner, BANNER_MS\)/);
  assert.equal((js.match(/hideBanner\(\);/g) || []).length, 2, 'hidden on Play again and on New game');
  const css = await readFile(path.join(root, 'css/follow-me.css'), 'utf8');
  assert.match(css, /\.board \{ position: relative; \}/);
  assert.match(css, /\.over \{ position: absolute; inset: 0;/);
});

