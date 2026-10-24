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

// Size and lasers to pick (v3); prices that read as prices (v7: "1 coin
// each", the name over it; the word since 3.2); the setup's words say
// laser, not lamp.
test('laser lab page: Size and Lasers; the pieces priced "each"; laser in the words', () => {
  assert.deepEqual([...page.matchAll(/class="size" data-n="(\d)"/g)].map(m => m[1]), ['6', '7', '8']);
  assert.deepEqual([...page.matchAll(/class="level" data-l="(\d)"/g)].map(m => m[1]), ['1', '2']);
  assert.match(page, /<b>Mirror<\/b> \(1 coin each\)/);
  assert.match(page, /<b>Splitter<\/b> \(2 coins each\)/);
  assert.match(js, /<span>\$\{coins\(PRICE\[t\]\)\} each<\/span>/, 'the shop’s price doesn’t read as a price');
  assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->/g, ''), /\blamp\b/i, 'the page says lamp');
});

// Each laser a switch (v4, no ▶ Shine); a budget (v6): Clear, Hint with
// its price; 3.2 (developer, after 3.0 on the phone): ❤️ Try again, Show
// answer (Give up renamed: it "sounded like a retry") and New game during
// play ("New game is the quit": no Quit). Show answer and Try again ask
// first. The end: Next / New game, no Try again there (DESIGN.md: it
// would let a solved puzzle be played again for more savings).
test('laser lab page: tools Clear, Hint (priced), Try again; Show answer, New game; no Quit or Give up; the end Next and New game', () => {
  assert.deepEqual(ids(play.match(/<div class="tools" id="tools">([\s\S]*?)<\/div>/)?.[1] ?? ''), ['clearBtn', 'hintBtn', 'againBtn', 'answerBtn', 'playNewBtn']);
  assert.match(play, /id="againBtn">❤️ Try again</);
  assert.match(play, /id="answerBtn">🔑 Show answer</);
  assert.match(play, /id="playNewBtn">New game</);
  assert.match(js, /\$\('hintPrice'\)\.textContent = coins\(nextHintPrice\(G\)\)/, 'the hint’s price not in words');
  assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->/g, '') + js.replace(/\/\/.*$/gm, ''), /Shine|shineBtn|Quit|quitBtn|giveUpBtn/);
  assert.doesNotMatch(page.replace(/<!--[\s\S]*?-->/g, ''), /Give up/, 'Give up still on the page');
  assert.doesNotMatch(js.replace(/\/\/.*$/gm, ''), /'[^'\n]*[Gg]ave up[^'\n]*'|`[^`\n]*[Gg]ave up[^`\n]*`/, 'giving up still in the words');
  assert.deepEqual(ids(play.match(/<div class="tools ask" id="askTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? ''), ['askYes', 'askNo']);
  assert.match(js, /ask\('answer', `Show answer: \$\{coins\(-P\.budget\)\}\?`\)/);
  assert.match(js, /ask\('again', 'Try again: uses a ❤️\?'\)/);
  assert.match(js, /if \(what === 'answer'\) showAnswer\(\);\s*if \(what === 'again'\) again\(\);/, 'Yes doesn’t do what was asked');
  const end = play.match(/<div class="tools" id="endTools" hidden>([\s\S]*?)<\/div>/)?.[1] ?? '';
  assert.deepEqual(ids(end), ['bestBtn', 'nextBtn', 'newBtn']);
  assert.match(end, /id="bestBtn" hidden>See best</, 'See best shows before an end says so');
  assert.match(end, /id="nextBtn" data-play/, 'Next not counted as a game started');
  assert.match(js, /e\.done \? 'New run' : 'Next ▸'/);
  const at = id => play.indexOf(`id="${id}"`);
  assert.ok(at('board') < at('lamps') && at('lamps') < at('tray') && at('tray') < at('hintbar') && at('hintbar') < at('tools'));
});

// 3.0 on the phone (developer, 2026-10-22): after a puzzle's end hid the
// tools, Next ▸ started the next puzzle with no Clear, Hint or Give up
// (only New game showed them again). Every puzzle not yet over starts
// with the tools showing and the end's buttons hidden. 3.2: before the
// fit, since the tools' two rows are taller than the end's one (Next ▸
// fitted the board to the end's row: the page 801 px on a 760 px screen).
test('laser lab page: a puzzle started by Next ▸ (or any way) shows its tools, before the fit', () => {
  const start = js.match(/function startGame\([\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.ok(start, 'startGame not found');
  assert.match(start, /const over = !!G\.result;\s*\$\('tools'\)\.hidden = over;\s*\$\('endTools'\)\.hidden = !over;/, 'an unfinished puzzle starts without its tools, or with the end buttons');
  assert.ok(start.indexOf("$('tools').hidden = over;") < start.indexOf('fit();'), 'the board fitted before the tools are in place');
  assert.match(js, /\$\('nextBtn'\)\.onclick = \(\) => \{[^\n]*startRun\(/,'Next ▸ no longer starts the next puzzle through startRun');
  assert.match(js, /function startRun\([\s\S]*?startGame\(/, 'startRun no longer starts the puzzle with startGame');
});

// 3.2: words in place of 🪙 and 🏦 (developer: the coin "looks like a ball
// - not meaningful", the bank "not idea what that means"): the budget and
// savings on a row of their own at a steady 17px, not shrunk with the top
// line; the top line just "Puzzle 4 of 10" (no board size); the hearts
// beside it with the clock.
test('laser lab page: "Puzzle 4 of 10" alone on top; hearts and clock; "Budget … · Savings …" a row of its own at 17px; no 🪙 or 🏦', () => {
  const top = play.match(/<div class="topinfo">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] ?? '';
  assert.match(top, /<div class="turn" id="turn"><\/div>/);
  assert.deepEqual([...top.matchAll(/<span class="\w+" id="(\w+)"/g)].map(m => m[1]), ['hearts', 'clock'], 'beside the 🏠: the hearts and the clock');
  assert.match(play, /<div class="money" id="money"><span class="budget" id="budget"><\/span><span class="dot"> · <\/span><span class="savings" id="savings"><\/span><\/div>/);
  assert.ok(play.indexOf('id="money"') > play.indexOf('id="clock"') && play.indexOf('id="money"') < play.indexOf('id="boardwrap"'), 'the budget row not between the top and the board');
  assert.match(js, /\$\('turn'\)\.textContent = `Puzzle \$\{/, 'the top line isn’t "Puzzle 4 of 10"');
  assert.doesNotMatch(js, /\$\{n\}×\$\{n\}/, 'the board size still on top');
  assert.match(js, /`Budget <b>\$\{k\}<\/b> of \$\{P\.budget\} left`/);
  assert.match(js, /`Budget <b class="neg">\$\{-k\}<\/b> <span class="neg">over<\/span>`/, '"over" not red');
  assert.match(js, /\$\('savings'\)\.innerHTML = `Savings \$\{sv < 0 \? neg\(sv\)/, 'minus savings not red');
  const money = css.match(/^\.money \{[^}]*\}/m)?.[0] ?? '';
  assert.match(money, /font-size: 17px;/, 'the budget row not a steady 17px');
  assert.doesNotMatch(money, /--tif/);
  const strip = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(strip(page) + strip(js) + strip(css), /🪙|🏦/, 'an icon left in place of the words');
});

// 3.2: ❤️ Try again (3 per run, src/core tryAgain) wired to the screen:
// asks first, then the run's heart used and kept on the device; greyed with
// none left; the hearts drawn from the run (or, at the end, as they were).
test('laser lab page: Try again wired to the run’s hearts, kept on the device; greyed with none left', () => {
  const again = js.match(/function again\(\) \{[\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.match(again, /const r = tryAgain\(prog, G\);/);
  assert.match(again, /keep\(\);/, 'the heart used not kept on the device');
  assert.match(again, /render\(\);/);
  assert.match(js, /\$\('againBtn'\)\.disabled = !!G\.result \|\| hearts <= 0;/);
  assert.match(js, /const hearts = G\.result \? \(ui\.end\?\.hearts \?\? r\.hearts\) : r\.hearts;/);
  assert.match(js, /\$\('hearts'\)\.textContent = heartsOf\(hearts\);/);
  assert.match(js, /if \(!back\) \{ refuseAgain\('nothing spent'\); return; \}/, 'Try again asks for a heart with nothing to give back');
});

// 3.5 (developer): the setup's words in the developer's own, with "Your
// goal" and one rule of theirs left out put back: over the budget, the
// savings pay.
test('laser lab page: the setup’s words are the developer’s (3.5)', () => {
  const rules = page.match(/<div class="rules">([\s\S]*?)<\/div>/)?.[1].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? '';
  assert.equal(rules, "Buy mirrors and splitters so the laser reaches every 💎. A beam must never shine into a laser: it breaks."
    + " Use as many pieces as you need, but each piece has a cost. Each puzzle has a budget for buying pieces and what's left after solving the puzzle goes into your savings. Go over the budget and the rest comes out of your savings. Your goal is to maximize your savings over a run of 10 puzzles."
    + " Select a mirror or a splitter and place it on the board by tapping a square. Tap it again to turn it, and once more to take it off. Tap a laser to switch it on: if its beam isn't right, it goes off and costs 1 coin. Moving a piece switches the lasers off. ❤️ Try again (3 in a run) starts a puzzle over and restores your budget. Show answer costs its whole budget.");
});

// 3.5: the end's words from src/core endWords (pieces and coins), with the
// best way they count kept with the end; See best / Your way draws that
// way, free, only when solved for more than the cheapest; the best way
// refined to the one closest to the board once the cheapest ways are
// worked out, after the sparkle starts.
test('laser lab page: the end’s words from endWords; See best shows the best way they count', () => {
  assert.match(js, /\.\.\.endWords\(G, P, best, f\), best,/);
  assert.match(js, /b = ui\.seeing && ui\.end\?\.best \? bestView\(G, P, ui\.end\.best\) : G, placed = placedOf\(b\)/, 'the board not drawn from the best way');
  assert.match(js, /\$\('bestBtn'\)\.hidden = !\(e\.how === 'solved' && e\.best && !e\.isBest\);/);
  assert.match(js, /\$\('bestBtn'\)\.onclick = \(\) => \{[\s\S]*?refineBest\(\);\s*ui\.seeing = !ui\.seeing;/, 'See best can show a way the words didn’t count');
  assert.match(js, /if \(!ui\.end\.isBest && !ui\.end\.refined\) setTimeout\(\(\) => \{ if \(G === game\) refineBest\(\); \}, 400\);/);
  assert.match(js, /paused: null, seeing: false \}\);/, 'a new puzzle starts showing the last one’s best way');
  assert.match(js, /\(e\.lines \?\? \[e\.line \?\? ''\]\)/, 'an end kept by 3.4 (one line) not shown');
  assert.match(css, /#endTools \{ grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 1fr; \}/);
});

// 3.6 (developer: "the jewels light up before the laser beam hits
// them"): a gem lights, and a laser breaks, by its beam line's
// animation, not by a timer of its own (which ran about 30 ms ahead of
// the drawing in the browser); a timer behind it for an animation that
// doesn't run, and the beam shown whole with reduced motion.
test('laser lab page: a gem lights by its beam’s line, not by a timer of its own', () => {
  const draw = js.match(/function drawSegs\([\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  // 3.7: the gem as its last line starts (developer: "the lag could be a
  // bit shorter"), the laser as the tip arrives
  assert.match(draw, /onArrive\(line, 'animationstart', \(\) => cb\.gem\(i\)\)/, 'the gem not lit as its line starts');
  assert.match(draw, /onArrive\(line, 'animationend', \(\) => cb\.lamp\(g\.lamp\)\)/, 'the laser not broken by its line’s end');
  assert.match(draw, /line\.addEventListener\(when, go, \{ once: true \}\);\s*growTimers\.push\(setTimeout\(go, ARRIVE_MS\)\);/);
  assert.doesNotMatch(draw, /setTimeout\(\(\) => cb\.(gem|lamp)/, 'a gem or laser still on a timer of its own');
  assert.match(draw, /const finish = \(\) => \{ if \(timeUp && !waiting\) cb\.done\(\); \};/, 'done before every gem is lit');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.beam \.grow \{ stroke-dashoffset: 0; \} \}/);
});

// 3.8 (developer, of 3.7: the gems "still seem to have a momentary delay
// lighting up after the laser hits them"): measured in the browser, the
// bounce from 60% size was at 86% as the beam's tip got there, full size
// 67 ms later, and it ran again on every redraw (a new picture), at the
// beam's end and when another laser went on. Now a lit gem is only a
// look, and the pop is the beam's alone: big at once, settling.
test('laser lab page: a gem pops once, big at once, as its beam lights it', () => {
  const rules = css.match(/[^}\n]*\.lit[12]?\b[^{}]*\{[^}]*\}/g) ?? [];
  assert.ok(rules.length >= 10, `only ${rules.length} lit rules found`);
  for (const r of rules) assert.doesNotMatch(r, /animation/, `a lit gem animates on every redraw: ${r}`);
  assert.match(css, /\.llcell\.pop svg \{ animation: gempop \.25s ease-out; \}/);
  const from = css.match(/@keyframes gempop \{ from \{ transform: scale\(([\d.]+)\); \}/)?.[1];
  assert.ok(Number(from) > 1, `the pop starts at ${from}, not bigger than the gem`);
  const draw = js.match(/function render\(\) \{[\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.match(draw, /c\.classList\.remove\('unlit', 'lit', 'lit1', 'lit2', 'pop'\);/, 'a redraw keeps the pop');
  assert.doesNotMatch(draw, /classList\.(add|toggle)\([^)]*'pop'/, 'a redraw pops the gems');
  assert.match(js, /gem: i => \{[\s\S]*?c\.classList\.remove\('lit1', 'lit2', 'pop'\);\s*void c\.offsetWidth;\s*c\.classList\.add\(gemLit\(i, lit\.get\(i\)\), 'pop'\);/, 'the beam doesn’t pop the gem (again for a purple’s second colour)');
  assert.match(js, /L\('gems lit', \{ laser: li, ms: litAt\.join\(' '\) \}\)/, 'the gems’ times not logged');
});

// 3.2: New game during play (developer: "New game is the quit"): back to
// setup with the run kept, the puzzle under way kept in it first.
test('laser lab page: New game during play keeps the run and the puzzle under way', () => {
  assert.match(js, /\$\('playNewBtn'\)\.onclick = \(\) => \{ if \(G && !G\.result && !ui\.busy\) newGame\(\); \};/);
  assert.match(js, /\$\('newBtn'\)\.onclick = \(\) => newGame\(\);/);
  const ng = js.match(/function newGame\(\) \{[\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.match(ng, /if \(during\) keep\(\);/, 'the puzzle under way not kept in its run');
  assert.match(ng, /\$\('setup'\)\.hidden = false;/);
  assert.match(ng, /renderSetup\(\);/);
  assert.doesNotMatch(ng, /finishPuzzle|runs\[[^\]]*\] = /, 'New game changes the run');
});

// 3.2: the end's words in the bar's 3 lines, shrunk to fit (in coins they
// were cut at 320 px; so were 3.1's gave-up words): every end fits them,
// on a reload too (startGame shows the end through showEnd), and again
// when the screen changes size.
test('laser lab page: the end’s words fitted to the bar at every end, and on a resize', () => {
  const show = js.match(/function showEnd\(\) \{[\s\S]*?\r?\n}\r?\n/)?.[0] ?? '';
  assert.match(show, /endFitFor = null;\s*fitEnd\(\);/, 'an end shown without fitting its words');
  assert.match(js, /function fitEnd\(\) \{[\s\S]*?largestFitting\([\s\S]*?--rf/);
  assert.match(js, /if \(G\.result\) fitEnd\(\);/, 'not fitted again on a resize');
  assert.match(css, /#play \.res b \{ font-size: calc\(21px \* var\(--rf, 1\)\); \}/);
  assert.match(css, /#play \.res span \{ font-size: calc\(15px \* var\(--rf, 1\)\); \}/);
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
// 3.11 (developer: "Any time I go to the game selection page, it should
// start fresh"; "Same puzzle, clean board, coins back"): a puzzle under
// way left in another visit is dropped as the page opens, before anything
// can pick it up, and the run saved without it.
test('laser lab page: a puzzle under way from another visit dropped as it opens, logged and saved', () => {
  assert.match(js, /import \{ resumable, visit \} from '\.\/resume\.js';/);
  const at = js.indexOf('const VISIT = visit();');
  assert.ok(at > js.indexOf('function saveProgress()') && at < js.indexOf('fetch(STOCK_FILE)'), 'the visit not read before the puzzles load');
  assert.match(js, /const dropped = dropOtherVisits\(prog, VISIT\);\r?\nif \(dropped\.length\) \{\r?\n  L\('puzzle under way dropped \(home page, restart or new version\): starts clean', \{ setups: dropped, visit: VISIT \}\);\r?\n  saveProgress\(\);\r?\n\}/);
});

test('laser lab page: wired to the log, game keeping, runs, sound and fit', () => {
  assert.match(js, /log\.add\('laser-lab', msg, data\)/);
  assert.match(js, /startLog\('laser-lab'\)/);
  for (const what of ['puzzles loaded', 'puzzle started', 'puzzle picked up', 'piece', 'square refused', 'piece picked', 'clear', 'laser on', 'laser off', 'laser refused', 'hint', 'cheapest ways worked out', 'answer?', 'answer shown', 'again?', 'try again', 'try again refused', 'end words fit', 'see best', 'best way', 'solved', 'run over', 'puzzle done', 'next', 'new game', 'resumed', 'fit', 'turn line fit', 'tools fit', 'clock paused']) {
    const esc = what.replace(/[?]/g, '\\?');
    // L('what' ...), or either word of L(x ? 'what' : 'other' ...)
    assert.ok(new RegExp(`L\\((?:[\\w.]+ \\? (?:'[^']*' : )?)?'${esc}'`).test(js), `not logged: ${what}`);
  }
  assert.match(js, /resumable\('laser-lab', 1,/);
  assert.match(js, /const STOCK_FILE = 'data\/laser-lab\.json';/);
  assert.match(js, /keepCurrent\(prog, G\.setup, G, VISIT\)/, 'the puzzle under way not kept in its run, with its visit');
  assert.match(js, /finishPuzzle\(prog, G\.setup, G\.saved\)/);
  for (const s of ['tick', 'ding', 'uhoh', 'ping', 'win']) assert.match(js, new RegExp(`sound\\.play\\('${s}'`), `no ${s}`);
  assert.match(js, /fitPlayScreen\(/);
  assert.match(js, /for \(const el of \[\$\('boardwrap'\), \$\('tray'\)\]\) \{[\s\S]*?addEventListener\('touchend'[\s\S]*?e\.preventDefault\(\);[\s\S]*?\{ passive: false \}\);/, 'no double-tap zoom block');
  // 3.7 (a double tap on a piece still zoomed the iPhone): the touch's own
  // element stays in the page, so its end reaches that block. A square's
  // picture, redrawn by the tap, takes no touches; the shop's buttons are
  // made once, not on each render.
  assert.match(css.match(/\.llcell svg \{[^}]*\}/)?.[0] ?? '', /pointer-events: none/, 'a square’s picture takes the touch, and is redrawn under it');
  assert.match(js, /c\.innerHTML = cellSvg\(/, 'the square’s picture no longer redrawn: check the pointer-events note');
  const ren = js.match(/function render\(\) \{[\s\S]*?\r?\n\}\r?\n/)?.[0] ?? '';
  assert.match(ren, /if \(!\$\('tray'\)\.children\.length\) \$\('tray'\)\.innerHTML = /, 'the shop’s buttons made on every render');
  assert.match(ren, /for \(const b of \$\('tray'\)\.children\) \{ b\.setAttribute\('aria-pressed', String\(ui\.sel === b\.dataset\.t\)\); b\.disabled = !!G\.result; \}/, 'the picked piece or the end not shown on the kept buttons');
  assert.equal((js.match(/\$\('tray'\)\.innerHTML/g) || []).length, 1, 'the shop’s buttons rebuilt somewhere else');
  assert.match(page, /<link rel="stylesheet" href="css\/hidden-faces\.css">[\s\S]*<link rel="stylesheet" href="css\/laser-lab\.css">/, 'its sheet must come after Find the Stars’');
});
