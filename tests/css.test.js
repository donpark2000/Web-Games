// Checks the stylesheets as files (no browser): a class styled in a
// shared sheet (site.css, game.css: loaded on every game page) and again
// in a game's own sheet must be one meant to be shared. On 2026-10-13
// Hidden Faces' small board pictures were styled in site.css as `.mini`,
// a name Nim and Matching already used for their own pictures: Nim's
// 3-5-7 picture became one row in a black-edged square (developer,
// 2026-10-14). Read-only; nothing is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cssDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'css');
const SHARED = ['site.css', 'game.css'];

// The class names in a stylesheet's selectors (comments and declarations
// left out, so numbers like .5 and file names don't count).
function classesIn(css) {
  // The innermost { } are declarations; an @media block's selectors stay.
  const s = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, ';');
  return new Set([...s.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
}

// The shared pieces a game may restyle: the turn line, chips, faces,
// scoreboard sides, buttons and the like, and Hidden Faces' small board
// (its own, styled in site.css for the home page too). A new name here
// is a decision, not a fix for a failing test.
const MEANT_SHARED = new Set([
  'app', 'av', 'big', 'brmini', 'c1', 'c2', 'chip', 'controls', 'csmini', 'die', 'hfmini', 'ico', 'level', 'lit', 'llmini', 'n', 'nm', 'now',
  'num', 'o1', 'o2', 'p1', 'p2', 'pic', 'pill', 'primary', 'side', 'turn', 'who', 'why', 'with-sound',
]);

test('css: classesIn finds selector classes, not numbers, files or comments', () => {
  const got = classesIn('/* .gone */ .a, .b .c:hover { width: .5em; background: url(x.svg); } @media (max-width: 420px) { .d { gap: 1.5px; } }');
  assert.deepEqual([...got].sort(), ['a', 'b', 'c', 'd']);
});

test('css: a game sheet restyles only classes meant to be shared', async () => {
  const files = (await readdir(cssDir)).filter(f => f.endsWith('.css'));
  const read = async f => classesIn(await readFile(path.join(cssDir, f), 'utf8'));
  const shared = new Map();
  for (const f of SHARED) for (const c of await read(f)) shared.set(c, [...(shared.get(c) ?? []), f]);
  const games = files.filter(f => !SHARED.includes(f));
  assert.ok(games.length >= 10 && shared.size >= 30, `checked ${games.length} game sheets against ${shared.size} shared classes`);
  const clashes = [];
  for (const f of games) {
    for (const c of await read(f)) if (shared.has(c) && !MEANT_SHARED.has(c)) clashes.push(`.${c}: ${shared.get(c).join(', ')} and ${f}`);
  }
  assert.deepEqual(clashes, [], 'the same class in a shared sheet and a game sheet: rename one, or add it to MEANT_SHARED if it is meant');
});
