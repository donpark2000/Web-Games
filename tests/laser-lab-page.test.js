// Laser Lab's page, style and screen code as files (no browser): what the
// developer agreed in the mockups (DESIGN.md "Laser Lab") is there, and
// the screen is wired to the site's log, game keeping, sound, stats and
// the runs kept on the device. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('laser-lab.html');
const css = await read('css/laser-lab.css');
const js = await read('src/ui/laser-lab.js');
const art = await read('src/ui/llboard.js');
const play = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';
const ids = block => [...block.matchAll(/<button[^>]*id="(\w+)"/g)].map(m => m[1]);

test('laser lab page: its name, the home tile in Puzzles for grown-ups, no mockup bar', async () => {
  assert.match(page, /<title>Laser Lab<\/title>/);
  assert.match(page, /<h1>Laser Lab<\/h1>/);
  const home = await read('index.html');
  const puz = home.match(/<section class="group" id="puzGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(puz, /<a class="game" id="llLink" href="laser-lab.html">\s*<span class="pic ll" id="llPic"[^>]*><\/span>\s*Laser Lab\s*<\/a>/);
  assert.match(home, /getElementById\('llPic'\)\.innerHTML = llMini\(/, 'the tile has no picture');
  assert.doesNotMatch(page + css + js, /mockbar|fillBtn|resetRunBtn|Mockup v7/, 'a piece of the mockup bar left');
  assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->/g, ''), /Mirror Light/, 'the old name on the page');
});

// Size and lasers to pick (v3); prices that read as prices (v7: "1 🪙
// each", the name over it); the setup's words say laser, not lamp.
test('laser lab page: Size and Lasers; the pieces priced "each"; laser in the words', () => {
  assert.deepEqual([...page.matchAll(/class="size" data-n="(\d)"/g)].map(m => m[1]), ['6', '7', '8']);
  assert.deepEqual([...page.matchAll(/class="level" data-l="(\d)"/g)].map(m => m[1]), ['1', '2']);
  assert.match(page, /<b>Mirror<\/b> \(1 🪙 each\)/);
  assert.match(page, /<b>Splitter<\/b> \(2 🪙 each\)/);
  assert.match(js, /<span>\$\{PRICE\[t\]\} 🪙 each<\/span>/, 'the shop’s price doesn’t read as a price');
  assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->/g, ''), /\blamp\b/i, 'the page says lamp');
});

// Each laser a switch (v4, no ▶ Shine); a budget (v6): Clear, Hint with
// its price, Give up asking with its cost; the end: Next / New game, no
// Try again (DESIGN.md: it would let a puzzle be played again for more
// savings).
test('laser lab page: tools Clear, Hint (priced), Give up; no Shine; the end Next and New game, no Try again', () => {
  assert.deepEqual(ids(play.match(/<div class="tools" id="tools">([\s\S]*?)<\/div>/)?.[1] ?? ''), ['clearBtn', 'hintBtn', 'giveUpBtn']);
  assert.match(play, /id="hintPrice"/);
  assert.doesNotMatch(page + js, /Shine|shineBtn/);
  assert.deepEqual(ids(play.match(/<div class="tools ask" id="askTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? ''), ['giveUpYes', 'giveUpNo']);
  assert.match(js, /\$\('giveUpYes'\)\.textContent = `Give up: \$\{coins\(-P\.budget\)\}`/);
  const end = play.match(/<div class="tools" id="endTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual(ids(end), ['nextBtn', 'newBtn']);
  assert.match(end, /id="nextBtn" data-play/, 'Next not counted as a game started');
  assert.doesNotMatch(page + js, /againBtn|Try again/);
  assert.match(js, /e\.done \? 'New run' : 'Next ▸'/);
  const at = id => play.indexOf(`id="${id}"`);
  assert.ok(at('board') < at('lamps') && at('lamps') < at('tray') && at('tray') < at('hintbar') && at('hintbar') < at('tools'));
});

// 3.0 on the phone (developer, 2026-10-22): after a puzzle's end hid the
// tools, Next ▸ started the next puzzle with no Clear, Hint or Give up
// (only New game showed them again). Every puzzle not yet over starts
// with the tools showing and the end's buttons hidden.
test('laser lab page: a puzzle started by Next ▸ (or any way) shows Clear, Hint and Give up', () => {
  const start = js.match(/function startGame\([\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.ok(start, 'startGame not found');
  const open = start.slice(start.indexOf('if (G.result)'));
  assert.match(open, /\$\('tools'\)\.hidden = false;/, 'an unfinished puzzle starts without its tools');
  assert.match(open, /\$\('endTools'\)\.hidden = true;/, 'an unfinished puzzle starts with the end buttons');
  assert.match(js, /\$\('nextBtn'\)\.onclick = \(\) => \{[^\n]*startRun\(/,'Next ▸ no longer starts the next puzzle through startRun');
  assert.match(js, /function startRun\([\s\S]*?startGame\(/, 'startRun no longer starts the puzzle with startGame');
});

// The look agreed: the purple gem half red, half blue with its outline in
// two halves (v5); the splitter green and striped (v2); lasers bright, on
// shown in the aperture (v5).
test('laser lab page: purple gem in halves, striped green splitter, bright lasers', () => {
  assert.match(art, /class="gh gl"[\s\S]*class="gh gr"[\s\S]*class="gh gho gol"[\s\S]*class="gh gho gor"/);
  assert.match(art, /bar\(11, '#4BE07F'\) \+ `<line[^`]*stroke-dasharray="4 8"/);
  assert.match(art, /LASER = \['#FFC21A', '#FF2E46', '#1F86FF'\]/);
  assert.match(css, /\.on\.k1 \.lamp \.lh \{ fill: #FFD6DB; \}/);
  assert.match(css, /\.broken \.lamp \.crack \{ display: inline; \}/);
});

// Wired to the site: the debug log, the game kept for a reload, the runs
// kept on the device, sounds, stats, the fit, and the iPhone's double-tap
// zoom blocked on the board, the lasers and the shop.
test('laser lab page: wired to the log, game keeping, runs, sound and fit', () => {
  assert.match(js, /log\.add\('laser-lab', msg, data\)/);
  assert.match(js, /startLog\('laser-lab'\)/);
  for (const what of ['puzzles loaded', 'puzzle started', 'puzzle picked up', 'piece', 'square refused', 'piece picked', 'clear', 'laser on', 'laser off', 'laser refused', 'hint', 'cheapest ways worked out', 'give up?', 'give up: no', 'gave up', 'solved', 'run over', 'puzzle done', 'next', 'new game', 'resumed', 'fit', 'turn line fit', 'tools fit', 'clock paused']) {
    const esc = what.replace(/[?]/g, '\\?');
    // L('what' ...), or either word of L(x ? 'what' : 'other' ...)
    assert.ok(new RegExp(`L\\((?:[\\w.]+ \\? (?:'[^']*' : )?)?'${esc}'`).test(js), `not logged: ${what}`);
  }
  assert.match(js, /resumable\('laser-lab', 1,/);
  assert.match(js, /const STOCK_FILE = 'data\/laser-lab\.json';/);
  assert.match(js, /keepCurrent\(prog, G\.setup, G\)/, 'the puzzle under way not kept in its run');
  assert.match(js, /finishPuzzle\(prog, G\.setup, G\.saved\)/);
  for (const s of ['tick', 'ding', 'uhoh', 'ping', 'win']) assert.match(js, new RegExp(`sound\\.play\\('${s}'`), `no ${s}`);
  assert.match(js, /fitPlayScreen\(/);
  assert.match(js, /for \(const el of \[\$\('boardwrap'\), \$\('tray'\)\]\) \{[\s\S]*?addEventListener\('touchend'[\s\S]*?e\.preventDefault\(\);[\s\S]*?\{ passive: false \}\);/, 'no double-tap zoom block');
  assert.match(page, /<link rel="stylesheet" href="css\/hidden-faces\.css">[\s\S]*<link rel="stylesheet" href="css\/laser-lab\.css">/, 'its sheet must come after Find the Stars’');
});
