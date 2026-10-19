// Colour Sudoku's page, style and screen code as files (no browser): what
// the developer decided in the mockups (DESIGN.md "Colour Sudoku") is
// there, and the screen is wired to the site's log, game keeping, sound,
// stats and progress. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('colour-sudoku.html');
const css = await read('css/colour-sudoku.css');
const js = await read('src/ui/colour-sudoku.js');
const play = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';
const rule = sel => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`))?.[1] ?? '';

test('colour sudoku page: its name, the home tile in Puzzles for grown-ups, no mockup bar', async () => {
  assert.match(page, /<title>Colour Sudoku<\/title>/);
  assert.match(page, /<h1>Colour Sudoku<\/h1>/);
  const home = await read('index.html');
  const puz = home.match(/<section class="group" id="puzGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(puz, /<a class="game" id="csLink" href="colour-sudoku.html">\s*<span class="pic cs" id="csPic"[^>]*><\/span>\s*Colour Sudoku\s*<\/a>/);
  assert.match(home, /getElementById\('csPic'\)\.innerHTML = csMini\(/, 'the tile has no picture');
  assert.doesNotMatch(page + css + js, /mockbar|mkNear|mkHarder|notes-n2|Fill all but 3|Play a Harder puzzle/, 'a piece of the mockup bar left');
});

// Two rows of digits, big ones and smaller dashed ones for notes, no
// Notes button (developer, mockup v2: "I always found online games that
// have the toggle feature annoying").
test('colour sudoku page: two rows of digits, the notes row dashed; no Notes toggle', () => {
  assert.match(play, /<div class="keys" id="keys"[^>]*><\/div>\s*<div class="keys notekeys" id="noteKeys"[^>]*><\/div>/);
  assert.doesNotMatch(play, /notesBtn|✏️/);
  assert.match(rule('.notekeys .key'), /border-style: dashed/);
  assert.match(js, /data-note="1"/);
  const tools = play.match(/<div class="tools" id="tools">([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual([...tools.matchAll(/<button[^>]*id="(\w+)"/g)].map(m => m[1]), ['undoBtn', 'hintBtn', 'giveUpBtn']);
});

// Same digits get a ring, not a disc, so the colour shows (developer,
// mockup v2: B); notes as big and dark as fit (37%, near-black) with a
// white edge (N2, mockup v3: to judge on a phone).
test('colour sudoku page: same digits ringed (not a disc); N2 notes, big and dark with a white edge', () => {
  const same = rule('.sq.same .d::before');
  assert.match(same, /box-shadow: inset 0 0 0 2\.5px var\(--ink\)/);
  assert.doesNotMatch(same, /background/, 'a disc hides the square’s colour');
  assert.match(rule('.sq .notes span.hl::before'), /box-shadow: inset/);
  assert.match(js, /has && selD === k \? ' class="hl"'/, 'a note place is ringed without its note (mockup v3.1)');
  const notes = rule('.sq .notes');
  assert.match(notes, /font-size: calc\(var\(--cell\) \* \.37\)/);
  assert.match(notes, /color: #10202C/);
  assert.match(notes, /text-shadow: 0 0 2px #fff/, 'no white edge (N2)');
});

// How hard?: words that say what each level asks of you (developer,
// 2026-10-19, after 2.0: the first ones' "meaning ... is not clear").
test('colour sudoku page: the levels say what they ask of you', () => {
  const lv = d => page.match(new RegExp(`data-level="${d}"[^>]*>\\w+<small>([^<]*)</small>`))?.[1];
  assert.equal(lv('easy'), 'each digit can be found from one row, column, box or colour');
  assert.equal(lv('harder'), 'some digits need two of those looked at together');
});

// The selected square: a ring outside it, over the lines round it, not a
// band inside it (developer, 2026-10-19, after 2.0: the band hid the
// notes; option C).
test('colour sudoku page: the selected square ringed outside it, covering none of its notes', () => {
  const sel = rule('.sq.sel::after');
  assert.match(sel, /inset: -3px/, 'the ring is not outside the square');
  assert.match(sel, /box-shadow: inset 0 0 0 3px var\(--ink\), 0 0 0 1\.5px #fff/);
  assert.doesNotMatch(sel, /inset 0 0 0 5px #fff/, 'the white band inside the square is back');
});

test('colour sudoku page: give up, Show me how, the end; the buttons that start a puzzle count', () => {
  const ask = play.match(/<div class="tools ask" id="askTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual([...ask.matchAll(/<button[^>]*id="(\w+)"[^>]*>([^<]*)</g)].map(m => `${m[1]}:${m[2]}`), ['giveUpHow:Show me how', 'giveUpYes:Just end it', 'giveUpNo:No']);
  const end = play.match(/<div class="tools" id="endTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual([...end.matchAll(/<button[^>]*id="(\w+)"/g)].map(m => m[1]), ['nextBtn', 'againBtn', 'newBtn']);
  assert.match(end, /id="nextBtn" data-play/, 'Next not counted as a game started');
  const walkEnd = js.match(/function walkEnd\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(walkEnd, /endGame\(G, 'shown'\)[\s\S]*L\('show me how: done'/);
  assert.doesNotMatch(walkEnd, /recordTime|takeNext|win\(/, 'Show me how’s end counts as a win');
  const at = id => play.indexOf(`id="${id}"`);
  assert.ok(at('board') < at('hintbar') && at('hintbar') < at('keys') && at('keys') < at('tools'));
});

// Wired to the site: the debug log, the game kept for a reload, progress
// per level (a puzzle used as it starts), sounds, the fit, and the
// iPhone's double-tap zoom blocked on the board and the digits.
test('colour sudoku page: wired to the log, game keeping, progress, sound and fit', () => {
  assert.match(js, /log\.add\('colour-sudoku', msg, data\)/);
  assert.match(js, /startLog\('colour-sudoku'\)/);
  for (const what of ['puzzle used', 'game started', 'digit', 'wrong digit', 'note', 'undo:', 'hint', 'why', 'give up?', 'show me how: step', 'solved', 'resumed', 'fit', 'turn line fit', 'tools fit']) {
    // L('what' ...), or L(r.on ? 'what' ...), L(shown.deep ? 'what' ...)
    const esc = what.replace(/[?]/g, '\\?');
    assert.ok(new RegExp(`L\\((?:[\\w.]+ \\? )?'${esc}`).test(js), `not logged: ${what}`);
  }
  assert.ok(js.includes("L({ lost: 'out of hearts', gaveup: 'gave up' }[how],"), 'the losses not logged');
  assert.match(js, /resumable\('colour-sudoku', 1,/);
  assert.match(js, /const STOCK_FILE = 'data\/colour-sudoku\.json';/);
  assert.match(js, /function startNext\(level\) \{\s*const k = takeNext\(prog, level\);\s*saveProgress\(\);/, 'a puzzle not used as it starts');
  assert.match(js, /\$\('againBtn'\)\.onclick = [^\n]*startGame\(G\.level, G\.k\)/, 'Try again isn’t the same puzzle');
  assert.match(js, /recordTime\(prog, G\.level, ms\)/);
  for (const s of ['tick', 'thud', 'uhoh', 'ping', 'win', 'aww']) assert.match(js, new RegExp(`sound\\.play\\([^)]*'${s}'`), `no ${s}`);
  assert.match(js, /fitPlayScreen\(/);
  assert.match(js, /for \(const el of \[\$\('board'\), \$\('dock'\)\]\) \{[\s\S]*?addEventListener\('touchend'[\s\S]*?e\.preventDefault\(\);[\s\S]*?\{ passive: false \}\);/, 'no double-tap zoom block');
  assert.match(page, /<link rel="stylesheet" href="css\/hidden-faces\.css">\s*(?:<!--[\s\S]*?-->\s*)?<link rel="stylesheet" href="css\/colour-sudoku\.css">|<link rel="stylesheet" href="css\/hidden-faces\.css">[\s\S]*<link rel="stylesheet" href="css\/colour-sudoku\.css">/, 'its sheet must come after Find the Stars’');
});
