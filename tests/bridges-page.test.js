// Bridges' page, style and screen code as files (no browser): what the
// developer decided (DESIGN.md "Bridges") is there, and the screen is
// wired to the site's log, game keeping, sound, stats and progress.
// Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { miniSvg } from '../src/ui/brboard.js';
import { GAME_PAGES } from '../src/core/resume.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('bridges.html');
const js = await read('src/ui/bridges.js');
const css = await read('css/bridges.css');
const play = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';
const buttonsOf = html => [...html.matchAll(/<button[^>]*id="(\w+)"[^>]*>([^<]*)</g)].map(m => `${m[1]}:${m[2]}`);

// In 👤 One player, listed once (developer, 2026-10-24: "I do not want to
// list the same game twice. I suggest we put it in the kids section and
// make the smaller grid the default").
test('bridges page: its name, one home tile in One player, Small preselected', async () => {
  assert.match(page, /<title>Bridges<\/title>/);
  assert.match(page, /<h1>Bridges<\/h1>/);
  const home = await read('index.html');
  const one = home.match(/<section class="group" id="oneGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(one, /<a class="game" id="brLink" href="bridges.html">\s*<span class="pic bridges" id="brPic"[^>]*><\/span>\s*Bridges\s*<\/a>/);
  assert.equal((home.match(/href="bridges\.html"/g) || []).length, 1, 'listed more than once');
  assert.match(home, /getElementById\('brPic'\)\.innerHTML = brMini\(/, 'the tile has no picture');
  const sizes = [...page.matchAll(/data-size="(\w+)" aria-pressed="(\w+)"/g)].map(m => `${m[1]}:${m[2]}`);
  assert.deepEqual(sizes, ['small:true', 'medium:false', 'large:false']);
  assert.match(js, /const setup = \{ size: 'small' \};/);
  assert.ok(GAME_PAGES.includes('bridges.html'), 'not one of the games kept one at a time');
});

// The home tile's picture draws with no game sheet: a solved Small puzzle,
// its colours inline.
test('bridges page: the picture is the solved Small puzzle, coloured inline', () => {
  const s = miniSvg('brmini');
  assert.match(s, /^<svg class="brmini" viewBox="0 0 5 5"/);
  assert.equal((s.match(/<g class="isl done">/g) || []).length, 6, 'not every island done');
  assert.match(s, /class="bline"[^>]*style="stroke:#7A4E2D/);
  assert.doesNotMatch(s, /class="[^"]*\bbr\b/, 'a .br class (Snakes and Ladders’)');
});

// Give up asks first (developer, 2026-10-24, after v1: "a 'give up' option
// to show the solution"; Q42): Show me how, a step at a time, or Just show
// it, all at once; either way no best time.
test('bridges page: tools, Give up’s question, Show me how, the end; the buttons that start a puzzle count', () => {
  const tools = play.match(/<div class="tools" id="tools">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual(buttonsOf(tools), ['undoBtn:↩ Undo', 'hintBtn:💡 Hint', 'clearBtn:↺ Clear', 'giveUpBtn:🏳 Give up']);
  const ask = play.match(/<div class="tools ask" id="askTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.match(ask, /<span class="askq">Give up\?<\/span>/);
  assert.deepEqual(buttonsOf(ask), ['giveUpHow:Show me how', 'giveUpYes:Just show it', 'giveUpNo:No']);
  const walk = play.match(/<div class="tools hinttools" id="walkTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual(buttonsOf(walk), ['walkRest:⏩ The rest', 'walkNext:Next ▸']);
  const end = play.match(/<div class="tools" id="endTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual(buttonsOf(end), ['nextBtn:Next', 'againBtn:Try again', 'newBtn:New game']);
  assert.match(end, /id="nextBtn" data-play/, 'Next not counted as a game started');
  const at = id => play.indexOf(`id="${id}"`);
  assert.ok(at('board') < at('hintbar') && at('hintbar') < at('tools'), 'the hint bar is not between the board and the tools');
  for (const f of ['walkEnd', 'win']) assert.match(js, new RegExp(`function ${f}\\(\\) \\{`));
  const walkEnd = js.match(/function walkEnd\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(walkEnd, /endGame\(G, 'shown'\)[\s\S]*L\('show me how: done'/);
  const yes = js.match(/\$\('giveUpYes'\)\.onclick = [\s\S]*?\n\};/)?.[0] ?? '';
  assert.match(yes, /fillRest\(G\)[\s\S]*endGame\(G, 'gaveup'\)/);
  for (const s of [walkEnd, yes]) assert.doesNotMatch(s, /recordTime|takeNext|win\(/, 'a give-up counts as a win');
  assert.doesNotMatch(js, /\bconfirm\(/, 'asks with the browser’s pop-up');
});

// Wired to the site: the debug log, the game kept for a reload, progress
// per size (a puzzle used as it starts), sounds, the fit, and the iPhone's
// double-tap zoom blocked on the board.
test('bridges page: wired to the log, game keeping, progress, sound and fit', () => {
  assert.match(js, /log\.add\('bridges', msg, data\)/);
  assert.match(js, /startLog\('bridges'\)/);
  for (const what of ['puzzles loaded', 'puzzle used', 'game started', 'bridge', 'refused: would cross', 'undo', 'clear', 'hint', 'give up?',
    'give up: just show it', 'give up: show me how', 'show me how: step', 'show me how: the rest', 'solved', 'resumed', 'fit', 'tools fit', 'end buttons']) {
    assert.ok(js.includes(`L('${what}'`), `not logged: ${what}`);
  }
  assert.match(js, /resumable\('bridges', 1,/);
  assert.match(js, /const STOCK_FILE = 'data\/bridges\.json';/);
  assert.match(js, /function startNext\(size\) \{\s*const k = takeNext\(prog, size\);\s*saveProgress\(\);/, 'a puzzle not used as it starts');
  assert.match(js, /\$\('againBtn'\)\.onclick = [^\n]*startGame\(G\.size, G\.k\)/, 'Try again isn’t the same puzzle');
  assert.match(js, /recordTime\(prog, G\.size, ms\)/);
  for (const s of ['tick', 'uhoh', 'ping', 'win']) assert.match(js, new RegExp(`sound\\.play\\('${s}'\\)`), `no ${s}`);
  assert.match(js, /fitPlayScreen\(/);
  const block = js.match(/svg\.addEventListener\('touchend', [\s\S]*?\}, \{ passive: false \}\);/)?.[0] ?? '';
  assert.match(block, /if \(!e\.cancelable\) return;\s*e\.preventDefault\(\);/, 'no double-tap zoom block');
  assert.match(css.match(/\.brboard \{[^}]*\}/)?.[0] ?? '', /touch-action: none/, 'the board lets the browser pan or zoom');
  assert.match(page, /<link rel="stylesheet" href="css\/hidden-faces\.css">[\s\S]*<link rel="stylesheet" href="css\/bridges\.css">/, 'its sheet must come after Find the Stars’');
});

// Nothing inside the board takes a touch, so a redraw never removes the
// element a touch began on (3.7: Laser Lab's pieces zoomed on a double tap
// when it did).
test('bridges page: the board’s drawing takes no touches', async () => {
  const board = await read('src/ui/brboard.js');
  assert.match(board, /return `<g style="pointer-events:none">\$\{out\.join\(''\)\}<\/g>`;/);
});
