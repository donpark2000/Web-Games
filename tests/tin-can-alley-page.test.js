// Tin Can Alley's page, style and screen code as files (no browser): what
// the developer agreed (DESIGN.md "Tin Can Alley"; 2026-11-09: the setup
// screen has the cans and your face; it goes with the other one-player
// games; the play screen gives the stall the most room either way up) is
// there, and the screen is wired to the site's log, game keeping, sound
// and stats. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PAGES } from '../src/core/resume.js';
import { LAYOUTS } from '../src/core/tin-can-alley.js';
import { canStackSvg, stallMini } from '../src/ui/tcapics.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('tin-can-alley.html');
const css = await read('css/tin-can-alley.css');
const js = await read('src/ui/tin-can-alley.js');
const stallJs = await read('src/ui/tin-can-alley-stall.js');
const setupHtml = page.match(/<section id="setup"[\s\S]*?<\/section>/)?.[0] ?? '';
const playHtml = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';

test('tin can alley page: its name, the home tile with the one-player games, kept one game at a time', async () => {
  assert.match(page, /<title>Tin Can Alley<\/title>/);
  assert.match(setupHtml, /<h1>Tin Can Alley<\/h1>/);
  assert.match(playHtml, /<div class="gname">Tin Can Alley<\/div>/);
  const home = await read('index.html');
  const one = home.match(/<section class="group" id="oneGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(one, /<a class="game" id="tcaLink" href="tin-can-alley.html">\s*<span class="pic shot" id="tcaPic"[^>]*><img src="icons\/home\/tin-can-alley\.webp"[^>]*><\/span>\s*Tin Can Alley\s*<\/a>/);
  assert.ok(GAME_PAGES.includes('tin-can-alley.html'), 'not one of the games kept one at a time');
  assert.match(js, /resumable\('tin-can-alley', 1,/);
});

test('tin can alley page: the setup screen: your face and the four lots of cans, Pyramid 6 first', () => {
  assert.match(setupHtml, /<div class="faces" id="p1Faces"><\/div>/);
  const layouts = [...setupHtml.matchAll(/class="layout" data-layout="(\w+)" aria-pressed="(\w+)"/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(layouts, [['6', 'true'], ['10', 'false'], ['15', 'false'], ['wall', 'false']]);
  assert.deepEqual(layouts.map(l => l[0]), LAYOUTS);
  assert.match(js, /const setup = \{ p1: 'bear', layout: '6' \};/);
  // each choice's picture: that many cans
  for (const l of LAYOUTS) {
    const cans = (canStackSvg(l).match(/<g>/g) || []).length;
    assert.equal(cans, { 6: 6, 10: 10, 15: 15, wall: 9 }[l], `${l}: ${cans} cans drawn`);
  }
  assert.equal((stallMini().match(/<g/g) || []).length, 6, 'the rules picture\'s cans');
  assert.doesNotMatch(page + js, /Balls a round|Cans weigh|Knocked over|mockup/i, 'a mockup choice left');
});

test('tin can alley page: a device that can\'t show 3D is told so; three.js and cannon-es loaded with import()', () => {
  assert.match(setupHtml, /<div class="panel no3d" id="no3d" hidden>\s*<p>This phone or tablet can’t show the 3D stall\.<\/p>/);
  assert.match(js, /await Promise\.all\(\[import\('\.\/tin-can-alley-stall\.js'\), import\('\.\.\/core\/tin-can-alley-physics\.js'\)\]\)/);
  assert.doesNotMatch(js, /^import .*(tin-can-alley-stall|tin-can-alley-physics|vendor)/m, 'loaded at the top: a failure would blank the page');
  assert.match(js, /el\.hidden = el\.id !== 'no3d'/);
  assert.match(stallJs, /from '\.\.\/vendor\/three\/three\.module\.min\.js'/);
});

test('tin can alley page: the stall: no double-tap zoom, the drag is pointer events, no page scroll', () => {
  assert.match(js, /canvas\.addEventListener\('touchend', e => e\.preventDefault\(\), \{ passive: false \}\)/);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.match(js, new RegExp(`addEventListener\\('${ev}'`), ev);
  assert.match(css, /\.stall \{[^}]*touch-action: none/);
});

// The developer (2026-11-09): "the buttons and score can move so we
// maximize the actual game play area for each orientation".
test('tin can alley page: the play screen fills the screen; upright a bar under the stall, sideways a column beside it', () => {
  const rule = sel => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.#]/g, m => `\\${m}`)} \\{([^}]*)\\}`))?.[1] ?? '';
  const playRule = rule('#play');
  assert.match(playRule, /position: fixed; inset: 0/);
  assert.match(playRule, /grid-template-areas: "top top" "stall stall" "tally restart"/);
  assert.match(playRule, /grid-template-rows: auto minmax\(0, 1fr\) auto/, 'the stall doesn\'t take the room left');
  const wide = css.match(/@media \(orientation: landscape\) \{([\s\S]*)\}\s*$/)?.[1] ?? '';
  assert.match(wide, /grid-template-areas: "home stall" "name stall" "tally stall" "restart stall" "\. stall" "sound stall"/);
  assert.match(wide, /#play > \.top \{ display: contents; \}/);
  assert.match(css, /body\.tca-playing \.site-foot \{ display: none; \}/);
  // the stall's grid cell sizes the canvas; the canvas never sizes the cell
  assert.match(css, /\.stall canvas \{ position: absolute; inset: 0;/);
  assert.match(js, /new ResizeObserver\(fit\)\.observe\(\$\('stall'\)\)/);
  // Start again asks first, over the stall
  assert.match(playHtml, /<div class="over" id="ask" hidden>[\s\S]*Start this round again\?/);
  assert.match(js, /\$\('restartBtn'\)\.onclick = \(\) => \{[\s\S]*?\$\('ask'\)\.hidden = false;/);
});

test('tin can alley page: logged: 3D start, the fit, each throw, cans off, the camera, round ends', () => {
  for (const what of ["'3D started'", "'fit'", "'throw'", "'cans off'", '`camera: ${cam.view}`', "'round over'", "'first can hit'", "'no 3D: told this device can’t show it'", "'resumed'"]) {
    assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  }
  assert.match(js, /startLog\('tin-can-alley'\)/);
});
