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
    assert.ok(/import \{ fitPlayScreen, fitEitherWay, setWide, wideRoom \} from '\.\/fit\.js';/.test(js), `${g}: fit.js not imported`);
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
