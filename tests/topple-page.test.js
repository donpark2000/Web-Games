// Topple!'s page, style and screen code as files (no browser): what the
// developer agreed (DESIGN.md "Topple!"; 2026-11-10: the name, a setup
// screen as Tin Can Alley's, with the one-player games after it, one view
// from behind with the drag pad) is there, and the screen is
// wired to the site's log, game keeping, sound and stats. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PAGES } from '../src/core/resume.js';
import { toppleMini } from '../src/ui/topplepics.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('topple.html');
const css = await read('css/topple.css');
const js = await read('src/ui/topple.js');
const sceneJs = await read('src/ui/topple-scene.js');
const core = await read('src/core/topple.js');
const setupHtml = page.match(/<section id="setup"[\s\S]*?<\/section>/)?.[0] ?? '';
const playHtml = page.match(/<section id="play"[\s\S]*?<\/section>/)?.[0] ?? '';

test('topple page: its name, the home tile after Tin Can Alley, kept one game at a time', async () => {
  assert.match(page, /<title>Topple!<\/title>/);
  assert.match(setupHtml, /<h1>Topple!<\/h1>/);
  assert.match(playHtml, /<div class="gname">Topple!<\/div>/);
  const home = await read('index.html');
  const one = home.match(/<section class="group" id="oneGroup"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(one, /id="tcaLink"[\s\S]*<a class="game" id="tpLink" href="topple.html">\s*<span class="pic tp" id="tpPic"[^>]*><\/span>\s*Topple!\s*<\/a>/);
  assert.match(home, /getElementById\('tpPic'\)\.innerHTML = toppleMini\(/, 'the tile has no picture');
  assert.equal((toppleMini().match(/class="blk"/g) || []).length, 5, 'the tile\'s blocks');
  assert.ok(GAME_PAGES.includes('topple.html'), 'not one of the games kept one at a time');
  assert.match(js, /resumable\('topple', 1,/);
});

test('topple page: the setup screen: your face, Play! or Carry on where the game is, new scenes from the start', () => {
  assert.match(setupHtml, /<div class="faces" id="p1Faces"><\/div>/);
  assert.match(setupHtml, /id="playBtn">Play!<\/button>/);
  assert.match(setupHtml, /id="freshBtn" hidden>New scenes from scene 1<\/button>/);
  assert.match(js, /const setup = \{ p1: 'bear' \};/);
  assert.match(js, /\$\('playBtn'\)\.textContent = fresh \? 'Play!' : 'Carry on';/);
  assert.match(setupHtml, /Knock <b>every block<\/b> down with <b>5 balls<\/b>/);
});

test('topple page: no mockup choices left; no side view (developer, 2026-11-10, Q70: one view, from behind)', () => {
  assert.doesNotMatch(page + js + core, /mockup only|Skip scene|sideAim|Pull back|'pull'|sideFit|Which things/i, 'a mockup choice left');
  assert.doesNotMatch(page + js + core + css, /sideDrag|sideView|sideTarget|dotScaleFor|viewBtn|viewbtn|Side view|setView/, 'the side view left');
  assert.match(js, /const aimFor = \(dx, dy\) => \(current \? frontDrag\(dx, dy, parkSize\(\), current\.layout\.power\) : null\)/);
});

test('topple page: a device that can\'t show 3D is told so; three.js and cannon-es loaded with import()', () => {
  assert.match(setupHtml, /<div class="panel no3d" id="no3d" hidden>\s*<p>This phone or tablet can’t show the 3D park\.<\/p>/);
  assert.match(js, /await Promise\.all\(\[import\('\.\/topple-scene\.js'\), import\('\.\.\/core\/topple-world\.js'\)\]\)/);
  assert.doesNotMatch(js, /^import .*(topple-scene|topple-world|vendor)/m, 'loaded at the top: a failure would blank the page');
  assert.match(js, /el\.hidden = el\.id !== 'no3d'/);
  assert.match(sceneJs, /from '\.\.\/vendor\/three\/three\.module\.min\.js'/);
  assert.doesNotMatch(page + js + sceneJs, /https?:\/\/(?!github\.com|donpark2000\.goatcounter\.com)/, 'something loaded from another site');
});

test('topple page: the park: no double-tap zoom, the drag is pointer events, no page scroll; it fills the screen either way up', () => {
  assert.match(js, /canvas\.addEventListener\('touchend', e => e\.preventDefault\(\), \{ passive: false \}\)/);
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.match(js, new RegExp(`addEventListener\\('${ev}'`), ev);
  assert.match(css, /\.park \{[^}]*touch-action: none/);
  const rule = sel => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.#]/g, m => `\\${m}`)} \\{([^}]*)\\}`))?.[1] ?? '';
  assert.match(rule('#play'), /position: fixed; inset: 0/);
  assert.match(rule('#play'), /grid-template-areas: "top top" "park park" "tally restart"/);
  const wide = css.match(/@media \(orientation: landscape\) \{([\s\S]*)\}\s*$/)?.[1] ?? '';
  assert.match(wide, /grid-template-areas: "home park" "name park" "tally park" "restart park" "\. park" "sound park"/);
  assert.match(css, /body\.tp-playing \.site-foot \{ display: none; \}/);
  assert.match(css, /\.park canvas \{ position: absolute; inset: 0;/);
  assert.match(js, /new ResizeObserver\(fit\)\.observe\(\$\('park'\)\)/);
});

test('topple page: the level\'s jewels and the hearts over the park; Start again asks and costs a heart', () => {
  assert.match(playHtml, /id="hudLevel"/);
  assert.match(playHtml, /id="hudHearts"/);
  assert.match(playHtml, /<div class="over" id="ask" hidden>[\s\S]*Start this scene again\? You lose a ❤️/);
  assert.match(js, /\$\('restartYes'\)\.onclick = \(\) => \{[\s\S]*?sceneOver\(game, false\)/);
});

test('topple page: the game kept on the device for every visit, the scene under way for this one', () => {
  assert.match(js, /export const GAME_KEY = 'web-games-topple-game';/);
  assert.doesNotMatch(js, /GAME_KEY = 'web-games-resume-/, 'a key the old-games cleanup removes');
  assert.match(js, /readGame\(JSON\.parse\(storage\?\.getItem\(GAME_KEY\)/);
  // kept as each scene ends, before its card shows
  assert.match(js, /const outcome = sceneOver\(game, result\.won\);[\s\S]*?saveGame\(\);[\s\S]*?showEnd\(\);/);
});

test('topple page: logged: 3D start, the fit, each scene, throw, touch, block down (and a post up again), the end', () => {
  for (const what of ["'3D started'", "'fit'", "kept ? 'scene picked up again' : 'scene'", "'layout thrown away'", "'throw'", "'ball touched'", "'block down'", "'block up again: a post leaning, not lying'", "'blocks down'", "'scene over'", "'start again: yes, a heart lost'", "'no 3D: told this device can’t show it'", "'resumed'", "'the game on this device'"]) {
    assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  }
  assert.match(js, /startLog\('topple'\)/);
});

// The drag pad (journal, "9.2 on the phone; home pictures and aiming", Q67).
test('topple page: the drag pad and its show: over the park, the touch going through to it, placed by padSpot; where a drag starts logged', () => {
  assert.match(playHtml, /<div class="pad" id="pad" aria-hidden="true" hidden><span>👆<\/span><\/div>/);
  assert.match(playHtml, /<div class="ghost" id="ghost" aria-hidden="true" hidden>👆<\/div>/);
  assert.match(playHtml, /id="hint"[^>]*>Drag from 👆, then let go<\/p>/);
  assert.match(js, /const HINT = 'Drag from 👆, then let go'/);
  for (const sel of ['.pad', '.ghost']) {
    const rule = css.match(new RegExp('\\n\\' + sel + ' \\{[^}]*\\}'))?.[0] ?? '';
    assert.match(rule, /pointer-events: none/, `${sel} would take the touch from the park`);
  }
  assert.match(js, /pad = padSpot\(box\.width, box\.height\)/);
  // a throw starts only on the pad: a press elsewhere makes it pulse, and is logged
  assert.match(js, /const p = padPress\(e\.clientX - box\.left, e\.clientY - box\.top, pad, ballPx\(\)\);\s*if \(!p\.on\) \{\s*L\('press off the pad', \{ from: p\.from, offPx: p\.offPx,[^\n]*\n\s*pulsePad\(\);\s*return;/);
  assert.match(css, /\n\.pad\.pulse \{ animation: tp-pad-pulse [^}]*\}/);
  assert.match(css, /@keyframes tp-pad-pulse/);
  assert.doesNotMatch(js + css, /\.wait\b|'wait'/, 'the pad never goes faint (it\'s the one control)');
  // no press, no dots: a mouse moving over the park only follows a drag
  assert.match(js, /function onMove\(e\) \{\s*if \(drag && e\.pointerId === drag\.id\) \{ drag\.x = e\.clientX; drag\.y = e\.clientY; \}\s*\}/);
  assert.match(js, /const dragNow = \(\) => \(drag \? /);
  assert.match(js, /const d = dragNow\(\) \?\? \(ok \? demoFrame\(\) : null\);/, 'the dots come from a drag or the show, nothing else');
  // the show runs on the clock, stops at a press on the pad, and aims at a block
  assert.match(js, /demo\.t = \(performance\.now\(\) - demo\.t0\) \/ 1000/);
  assert.match(js, /pulsePad\(\);\s*return;\s*\}\s*stopDemo\('a finger'\);/);
  assert.match(js, /if \(first === 'block'\)/);
  for (const what of ["'pad show'", "'pad show done'", "'pad show stopped'", "'drag too short: no throw'", "'press off the pad'"]) {
    assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  }
});
