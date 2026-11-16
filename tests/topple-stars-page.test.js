// Topple!'s stars on the page (Q116), as files (no browser): the map's
// difficulty buttons, stars and level cards; a scene won showing its stars
// and best; one game for each difficulty kept; all of it logged. Read-only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');
const page = await read('topple.html');
const css = await read('css/topple.css');
const js = await read('src/ui/topple.js');

test('topple stars page: the map has how hard, the stars so far and a card for each level', () => {
  const map = page.match(/<div class="panel tpmap" id="mapView" hidden>[\s\S]*?<\/div>\s*<\/section>/)?.[0] ?? '';
  for (const id of ['mapModes', 'starTotal', 'starFill', 'mapBox', 'mapToast', 'mapBack', 'mapAgain']) assert.ok(map.includes(`id="${id}"`), `the map lacks ${id}`);
  assert.match(js, /Array\.from\(\{ length: MAX_LEVEL \}, \(_, i\) => levelCard\(i \+ 1, unlock\)\)/);
  // each card: a head that opens it, five scenes with stars, a Play button
  assert.match(js, /class="scn \$\{cls\}" data-s="\$\{sc\}"/);
  assert.match(js, /class="big playlv"/);
  // a scene: won (stars), open, the level's place (glowing), or shut
  for (const c of ["'sdone'", "'next'", "'open'", "'later'"]) assert.ok(js.includes(c), `no scene state ${c}`);
  assert.match(js, /Win scene \$\{sc - 1\} first/);
  assert.match(js, /Finish level \$\{lv - 1\} first/);
});

test('topple stars page: a scene tapped starts it (a won one again); the level button carries on', () => {
  assert.match(js, /startLevel\(lv, sc\);/);
  assert.match(js, /function startLevel\(n, scene = null\) \{[\s\S]*?scene \? startAtScene\(game, n, scene\) : switchLevel\(game, n\)/);
  assert.match(js, /\.playlv'\)\.onclick = \(\) => \{[\s\S]*?startLevel\(lv\);/);
  // how hard picked on the map: its own game, made on first pick, saved, the parked scene dropped
  assert.match(js, /function pickMode\(m\) \{[\s\S]*?profile\.games\[was\] = game;[\s\S]*?parked = null;[\s\S]*?saveGame\(\);/);
});

test('topple stars page: a scene won records its stars before the game moves on, and the card shows them and the best', () => {
  const end = js.match(/function endScene\(result\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  const iStars = end.indexOf('recordStars(game, game.level, game.scene, starsForBalls(round.used))');
  const iOver = end.indexOf('sceneOver(game, result.won)');
  assert.ok(iStars > 0 && iOver > iStars, 'the stars are recorded after the scene moved on');
  assert.match(end, /result\.won \? recordStars/, 'a lost scene earns none');
  assert.match(end, /ended = \{[^}]*stars, balls: round\.used \}/);
  assert.match(page, /<div class="bigstars" id="overStars" hidden><\/div>\s*<p class="overbest" id="overBest" hidden><\/p>/);
  const show = js.match(/function showEnd\(\) \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(show, /ended\.won \? ended\.stars : null/);
  assert.match(show, /New! Your first stars here/);
  assert.match(show, /Your best was/);
  assert.match(show, /The best there is!/);
  assert.match(css, /\.bigstars \.bs\.on \{ animation: tpstar/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{[^}]*\.bigstars \.bs\.on \{ animation: none/);
  assert.match(js, /L\('scene over', \{ \.\.\.result, outcome, stars,/, 'the log names the stars');
});

test('topple stars page: a game for each difficulty; Start over and Start again keep the stars; the logs say which', () => {
  assert.match(js, /game = profile \? profile\.games\[profile\.mode\] : null;|let game = profile \? profile\.games\[profile\.mode\] : null;/);
  assert.match(js, /if \(!game\) \{ game = createGame\(newSeed\(\)\); profile = createProfile\(game\); saveGame\(\); \}/);
  assert.equal((js.match(/createGame\(newSeed\(\), \{ stars: game\.stars \}, game\.mode\)/g) ?? []).length, 2, 'Start over and the whole game again');
  assert.match(js, /game = createGame\(newSeed\(\), game\); saveGame\(\)/, 'every level done: a new game keeps the stars (and the levels)');
  for (const what of ["'how hard picked'", "'map: a scene, straight into play'", "'map: a scene shut'", "'map: unlocking'"]) assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  // the faces screen says which difficulty carries on
  assert.match(js, /\$\{MODE_INFO\[game\.mode\]\.name\}: level \$\{game\.level\}/);
});

test('topple stars page: the star classes are the page’s own (no clash with the shared sheets)', () => {
  assert.match(css, /\.tstar \{/);
  assert.match(css, /\.tstar\.unlit path/);
  assert.doesNotMatch(css, /(^|\n)\.star[ .{]/, 'a bare .star');
  assert.match(js, /class="tstar\$\{on \? '' : ' unlit'\}"/);
});
