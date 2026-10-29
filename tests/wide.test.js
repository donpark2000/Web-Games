// Sideways screens (DESIGN.md "Sideways screens"): which layout a play
// screen keeps, the both-ways fit (src/ui/fit.js) on a stand-in page, and
// the wiring in the pages and styles. Nothing is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pickLayout } from '../src/core/fit.js';

const read = p => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const fit = (size, fitted = true) => ({ size, fitted, tries: 3 });

test('wide: pickLayout keeps the bigger board that fits; a tie or no wide keeps tall', () => {
  assert.equal(pickLayout(fit(30), fit(48)), 'wide', 'phone sideways: 48 beats 30');
  assert.equal(pickLayout(fit(53), fit(105)), 'wide', 'tablet sideways');
  assert.equal(pickLayout(fit(55), fit(40)), 'tall', 'upright: tall is bigger');
  assert.equal(pickLayout(fit(48), fit(48)), 'tall', 'a tie keeps tall');
  assert.equal(pickLayout(fit(30), null), 'tall', 'wide not tried');
  // One that fits beats a bigger one that doesn't (that page scrolls).
  assert.equal(pickLayout(fit(30, false), fit(31)), 'wide');
  assert.equal(pickLayout(fit(40), fit(60, false)), 'tall');
  // Neither fits: tall, as before; a wide that doesn't fit can be wider
  // than the screen (Five Dice on a sideways phone).
  assert.equal(pickLayout(fit(30, false), fit(35, false)), 'tall', 'neither fits: tall');
});

// A stand-in page for fitEitherWay: a body whose class list records the
// layout, a screen size, and no play screen or footer to move.
async function withScreen(w, h, fn) {
  const saved = { document: globalThis.document, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight };
  const classes = new Set();
  globalThis.document = {
    body: { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), contains: c => classes.has(c) } },
    getElementById: () => null, querySelector: () => null,
  };
  globalThis.innerWidth = w; globalThis.innerHeight = h;
  try {
    const { fitEitherWay } = await import('../src/ui/fit.js');
    return await fn(fitEitherWay, classes);
  } finally {
    Object.assign(globalThis, saved);
  }
}

test('wide: fitEitherWay keeps the wide layout on a sideways screen when its board is bigger', async () => {
  await withScreen(780, 340, (fitEitherWay, classes) => {
    const calls = [];
    const r = fitEitherWay(wide => { calls.push(wide); return fit(wide ? 48 : 30, wide); });
    assert.deepEqual(calls, [false, true]);
    assert.equal(r.layout, 'wide');
    assert.equal(r.size, 48);
    assert.deepEqual([r.tall, r.wide], [30, 48]);
    assert.ok(classes.has('wide-layout'), 'left in the wide layout');
  });
});

test('wide: fitEitherWay goes back to one column, fitted again, when that is bigger', async () => {
  await withScreen(1000, 900, (fitEitherWay, classes) => {
    const calls = [];
    const r = fitEitherWay(wide => { calls.push(wide); return fit(wide ? 50 : 70); });
    assert.deepEqual(calls, [false, true, false], 'tall is fitted again after wide was tried');
    assert.equal(r.layout, 'tall');
    assert.equal(r.size, 70);
    assert.ok(!classes.has('wide-layout'));
  });
});

test('wide: an upright screen never tries the wide layout; no room keeps tall', async () => {
  await withScreen(393, 760, (fitEitherWay, classes) => {
    const calls = [];
    const r = fitEitherWay(wide => { calls.push(wide); return fit(55); });
    assert.deepEqual(calls, [false]);
    assert.deepEqual([r.layout, r.size, r.wide], ['tall', 55, null]);
    assert.ok(!classes.has('wide-layout'));
  });
  // No room beside the column: back to one column, fitted again
  // (2026-10-29: the page was left in the wide layout, wider than the
  // screen).
  await withScreen(500, 400, (fitEitherWay, classes) => {
    const calls = [];
    const r = fitEitherWay(wide => { calls.push(wide); return wide ? null : fit(40); });
    assert.deepEqual([r.layout, r.size, r.wide], ['tall', 40, null]);
    assert.deepEqual(calls, [false, true, false]);
    assert.ok(!classes.has('wide-layout'), 'left in the wide layout');
  });
  // Wide doesn't fit: the same.
  await withScreen(780, 340, (fitEitherWay, classes) => {
    const r = fitEitherWay(wide => fit(wide ? 50 : 30, !wide));
    assert.equal(r.layout, 'tall');
    assert.ok(!classes.has('wide-layout'));
  });
});

const GAMES = ['tic-tac-toe', 'matching', 'connect-four', 'count-to-9', 'snakes-ladders', 'five-dice', 'nim', 'dots-boxes', 'reversi',
  'rock-paper-scissors', 'follow-me', 'bridges', 'hidden-faces', 'colour-sudoku', 'laser-lab'];

test('wide: every game fits both ways, refits on a turn, logs it, and goes back to one column for setup', async () => {
  let checked = 0;
  for (const g of GAMES) {
    const js = await read(`src/ui/${g}.js`);
    // (assert.ok, not match: a failure names the game, not the whole file)
    assert.ok(/import \{ fitPlayScreen, fitEitherWay, setWide, wideRoom(, \w+)* \} from '\.\/fit\.js';/.test(js), `${g}: fit.js not imported`);
    const call = js.match(/const r = fitEitherWay\(wide => \{[\s\S]*?\n  \}\);/)?.[0] ?? '';
    assert.ok(call, `${g}: not fitted both ways`);
    assert.ok(/wide \? (Math\.min\()?wideRoom\(\)/.test(call), `${g}: the wide board isn’t limited by the room beside the column`);
    assert.ok(/if \([^)]*wide[^)]*\) return null;/.test(call), `${g}: no way out when the wide layout has no room`);
    assert.ok(/fitPlayScreen\(/.test(call), `${g}: fitPlayScreen not used`);
    assert.ok(/r\.layout|L\('fit', (r|\{ \.\.\.r)/.test(js), `${g}: the layout kept isn’t logged`);
    assert.ok(/addEventListener\('resize', (fit\)|[\s\S]{0,120}?(fit\w*|layoutGrid)\(\))/.test(js), `${g}: not refitted when the screen turns`);
    // Every way to the setup screen puts the footer back under main.
    const toSetup = [...js.matchAll(/\$\('setup'\)\.hidden = false;\s*(setWide\(false\);)?/g)];
    assert.ok(toSetup.length >= 2, `${g}: ${toSetup.length} ways to setup`);
    for (const m of toSetup) assert.ok(m[1], `${g}: setup shown without setWide(false)`);
    // The play screen has one stage, the wide layout's middle column.
    const html = await read(`${g}.html`);
    const play = html.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.equal((play.match(/class="[^"]*\bstage\b/g) ?? []).length, 1, `${g}: one .stage in the play screen`);
    checked++;
  }
  assert.equal(checked, 15);
});

test('wide: the wide layout’s styles: three columns, the board at full height, the footer at the foot', async () => {
  const css = await read('css/game.css');
  assert.match(css, /body\.wide-layout #play \{[^}]*grid-template-columns: auto auto var\(--side\);/);
  assert.match(css, /body\.wide-layout #play \.top \{ display: contents; \}/);
  assert.match(css, /body\.wide-layout #play > \.stage \{ grid-column: 2; grid-row: 1 \/ -1;/);
  assert.match(css, /body\.wide-layout #play \.homebtn \{ grid-column: 1; grid-row: 1 \/ -1; align-self: start;/);
  assert.match(css, /body\.wide-layout #play > \.site-foot \{ grid-row: -2 \/ -1;/);
  assert.match(css, /body\.wide-layout main\.app, body\.wide-layout #play \{ max-width: none; \}/);
  // Upright, a stack of pieces lays out as if it weren't there.
  assert.match(css, /^\.stage\.stack \{ display: contents; \}/m);
});

test('wide: the home page has more games a row on a screen wider than tall, and logs how many', async () => {
  const css = await read('css/site.css');
  const rule = css.match(/@media \(orientation: landscape\) and \(min-width: 700px\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(rule, /\.home \{ max-width: 1200px; \}/);
  assert.match(rule, /\.games \{ display: flex; flex-wrap: wrap; justify-content: center; \}/);
  assert.match(rule, /\.games \.game, \.games \.game:only-child \{ width: 220px; \}/);
  assert.match(await read('src/ui/scrolllog.js'), /perRow: perRow\(\)/);
});

// 6.3: the game's name on every play screen (journal Q45), and the
// sideways phone fixes (journal "Sideways phone fixes agreed").

test('wide: every play screen shows its game’s name, the setup screen’s heading, at the top', async () => {
  let checked = 0;
  for (const g of GAMES) {
    const html = await read(`${g}.html`);
    const h1 = html.match(/<section id="setup"[\s\S]*?<h1>([^<]+)<\/h1>/)?.[1];
    const top = html.match(/<section id="play"[^>]*>\s*<div class="top[^"]*">([\s\S]*?)\n    <\/div>/)?.[1] ?? '';
    assert.ok(h1, `${g}: no setup heading`);
    assert.ok(/^\s*<a class="homebtn"[^>]*><\/a>\s*<div class="gname">/.test(top), `${g}: the name isn't next after the 🏠`);
    assert.equal(top.match(/<div class="gname">([^<]*)<\/div>/)?.[1], h1, `${g}: the name isn't the setup heading`);
    assert.equal((html.match(/class="gname"/g) ?? []).length, 1, `${g}: one name`);
    checked++;
  }
  assert.equal(checked, 15);
  const css = await read('css/game.css');
  // upright: across the 🏠's row over the words, the 🏠 and 🔊 both rows tall
  assert.match(css, /body:not\(\.wide-layout\) #play > \.top > \.gname \{ grid-column: 1 \/ -1; grid-row: 1;/);
  assert.match(css, /body:not\(\.wide-layout\) #play > \.top > \* \{ grid-column: 2; grid-row: 2; \}/);
  assert.match(css, /body:not\(\.wide-layout\) #play > \.top > \.homebtn \{ grid-column: 1; grid-row: 1 \/ 3; \}/);
  assert.match(css, /body:not\(\.wide-layout\) #play > \.top > \.soundbtn \{ grid-column: -2; grid-row: 1 \/ 3; \}/);
  assert.match(await read('css/snakes-ladders.css'), /#play > \.snl-top > \.die \{ grid-column: 3; grid-row: 1 \/ 3; \}/);
  // sideways: over the board, which moves down --gname-room
  assert.match(css, /body\.wide-layout #play \.top > \.gname \{ grid-column: 2; grid-row: 1 \/ -1; align-self: start;/);
  assert.match(css, /body\.wide-layout #play > \.stage \{ margin-top: var\(--gname-room\); \}/);
  assert.match(css, /:root \{ --side: 300px; --wide-gap: 20px; --gname-room: 18px; \}/);
  // the right column is the last one (Laser Lab has a fourth)
  assert.match(css, /body\.wide-layout #play > \*, body\.wide-layout #play \.top > \* \{ grid-column: -2;/);
});

// A stand-in page with styles: getComputedStyle answers from `vals`.
async function withStyles(w, h, vals, fn) {
  const saved = { getComputedStyle: globalThis.getComputedStyle };
  globalThis.getComputedStyle = () => ({ getPropertyValue: v => vals[v] ?? '' });
  try {
    return await withScreen(w, h, async (fitEitherWay, classes) => {
      globalThis.document.documentElement = {};
      return fn(await import('../src/ui/fit.js'), classes);
    });
  } finally {
    Object.assign(globalThis, saved);
  }
}
const PAGE = { 'padding-left': '16px', 'padding-right': '16px', 'padding-top': '12px', 'padding-bottom': '12px',
  '--homebtn': '80px', '--side': '300px', '--wide-gap': '20px', '--gname-room': '18px' };

test('wide: wideArea estimates the board’s room sideways; none upright', async () => {
  await withStyles(780, 340, PAGE, ({ wideArea }) => {
    // 780 - 32 - 80 - 300 - 40; 340 - 24 - 18 (the room measured in 6.2, 313
    // with Five Dice's 600 limit, is the same less its 15px scrollbar-free main)
    assert.deepEqual(wideArea(), { width: 328, height: 298 });
  });
  await withStyles(393, 760, PAGE, ({ wideArea }) => assert.equal(wideArea(), null));
  await withStyles(500, 500, PAGE, ({ wideArea }) => assert.equal(wideArea(), null, 'a square screen is not wider than tall'));
});

test('wide: words fitted once per screen are fitted again in each layout (fitFor)', async () => {
  await withStyles(780, 340, PAGE, ({ fitFor }, classes) => {
    assert.equal(fitFor(), '780');
    classes.add('wide-layout');
    assert.equal(fitFor(), '780/wide');
  });
  // 6.2's puzzles kept one column's tools in the wide layout (Bridges' Give
  // up and Find the Stars' Hint, Show and Give up were cut): every
  // once-per-screen fit is keyed by fitFor, none by the width alone.
  let checked = 0;
  for (const g of ['bridges', 'hidden-faces', 'colour-sudoku', 'laser-lab']) {
    const js = await read(`src/ui/${g}.js`);
    const keys = [...js.matchAll(/(\w+FitFor) (===|=) ([^;)]+)/g)];
    assert.ok(keys.length >= 2, `${g}: ${keys.length} fit keys`);
    for (const [, name, , key] of keys) {
      if (key === 'null') continue;
      assert.ok(/^fitFor\($|^key$/.test(key), `${g}: ${name} keyed by ${key}`);
      checked++;
    }
    // a key made of more (the words, the puzzle): fitFor is part of it
    for (const m of js.matchAll(/const key = (`[^`]*`);\s*if \([^)]*FitFor === key\)/g)) {
      assert.ok(m[1].includes('${fitFor()}'), `${g}: ${m[1]}`);
      checked++;
    }
    assert.ok(/L\('tools fit', \{[^}]*for: fitFor\(\)/.test(js), `${g}: the tools fit's layout isn't logged`);
  }
  assert.ok(checked >= 10, `checked ${checked}`);
});

test('wide: Five Dice stands the dice and Roll beside the sheet (option B)', async () => {
  const js = await read('src/ui/five-dice.js');
  const call = js.match(/const r = fitEitherWay\(wide => \{[\s\S]*?\n  \}\);/)?.[0] ?? '';
  // the dice are as tall as the sheet's rows let them be, the sheet kept at
  // least WIDE_SHEET wide; no room for that: one column
  assert.match(js, /const WIDE_W = 600, WIDE_DIE = 1\.3, WIDE_SHEET = 240;/);
  assert.match(call, /\? Math\.min\(MAX_DIE, width - 10 - WIDE_SHEET\)/);
  assert.match(call, /if \(wide && dieMax < MIN_ROW\) return null;/);
  assert.match(call, /Math\.round\(px \* \(wide \? WIDE_DIE : 1\.2\)\)/);
  const css = await read('css/five-dice.css');
  assert.match(css, /body\.wide-layout #play > \.stage\.stack \{ width: var\(--stagew\); justify-items: stretch; grid-template-columns: auto minmax\(0, 1fr\);/);
  assert.match(css, /body\.wide-layout \.tray \{ flex-direction: column;/);
  assert.match(css, /body\.wide-layout \.dz\.up \{ transform: translateX\(-9px\)/);
});

test('wide: Laser Lab’s shop stands beside the board, the board’s room less the shop’s', async () => {
  const css = await read('css/laser-lab.css');
  assert.match(css, /body\.wide-layout #play \{ grid-template-columns: auto auto auto var\(--side\);/);
  assert.match(css, /body\.wide-layout #play > \.tray \{ grid-column: 3; grid-row: 1 \/ -1;[^}]*flex-direction: column;/);
  assert.match(css, /body\.wide-layout #tools \.tool \{ padding-block: 6px; \}/);
  assert.match(css, /body\.wide-layout #play \.hintbar \{ font-size: 14px; \}/);
  const js = await read('src/ui/laser-lab.js');
  assert.match(js, /wide \? wideRoom\(\) - shopW\(\) :/);
  assert.match(js, /shopW: r\.layout === 'wide' \? \$\('tray'\)\.offsetWidth : null/);
});

test('wide: Matching cards may be smaller sideways, and setup offers what fits either way', async () => {
  const js = await read('src/ui/matching.js');
  assert.match(js, /const least = wide \? MIN_CARD_WIDE : MIN_CARD;/);
  assert.match(js, /fitPlayScreen\(px => apply\(cols, px\), least, widest\)/);
  assert.match(js, /SIZES\.filter\(s => !sizeOffered\(s, playArea\(\), wide, \{ gap: GAP \}\)\)/);
  assert.ok(/L\('sizes greyed', \{ greyed, [^\n]*wideArea: /.test(js), 'the wide room isn’t logged with the sizes greyed');
});
