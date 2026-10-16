// Releases (tools/release.js; DESIGN.md "Releases"): RELEASES.md read, and
// what stops a release being published. Plain data; nothing written. The
// repository's own number and notes are checked to agree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseReleases, problems, isRelease, after, NOTES_FILE } from '../tools/release.js';
import { RELEASE } from '../src/core/release.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const V = 'f4c8e57d3a6d', W = '720f7406cc4a';
const MD = `# Releases\r\n\r\nIntro.\r\n\r\n## 1.1 (2026-10-20, version ${W})\r\n\r\n- A fix.\r\n\r\n## 1.0 (2026-10-16, version ${V})\r\n\r\n- Everything.\r\n`;

test('release: RELEASES.md is read newest first, Windows line ends or not', () => {
  const r = parseReleases(MD);
  assert.deepEqual(r.map(x => [x.release, x.made, x.version, x.notes]), [['1.1', '2026-10-20', W, '- A fix.'], ['1.0', '2026-10-16', V, '- Everything.']]);
  assert.deepEqual(parseReleases('# Releases\n\nnone yet\n'), []);
  const bad = parseReleases('## 1.2 soon\n\n- x\n')[0];
  assert.deepEqual([bad.release, bad.version, bad.head], [null, null, '1.2 soon']);
});

test('release: numbers are x.y and compare by part', () => {
  for (const r of ['1.0', '2.13', '10.0']) assert.ok(isRelease(r), r);
  for (const r of ['1', '1.0.1', 'v1.0', '', undefined, '1.a']) assert.ok(!isRelease(r), String(r));
  assert.ok(after('1.10', '1.9'), '1.10 after 1.9');
  assert.ok(after('2.0', '1.12'));
  assert.ok(!after('1.0', '1.0'));
  assert.ok(!after('1.2', '1.10'));
});

test('release: ready when the number, notes, version and tags agree', () => {
  const ok = { release: '1.1', releases: parseReleases(MD), version: W, tags: ['v1.0'] };
  assert.deepEqual(problems(ok), []);
  assert.deepEqual(problems({ ...ok, release: '1.0', releases: parseReleases(MD).slice(1), version: V, tags: [] }), [], 'the first release');
});

test('release: each thing that stops a release is reported', () => {
  const ok = { release: '1.1', releases: parseReleases(MD), version: W, tags: ['v1.0'] };
  const one = (change, re) => {
    const p = problems({ ...ok, ...change });
    assert.equal(p.length, 1, `${JSON.stringify(change)}: ${p.join(' | ')}`);
    assert.match(p[0], re);
  };
  one({ tags: ['v1.0', 'v1.1'] }, /v1\.1 is already a release: every publish needs a new number/);
  one({ tags: ['v1.0', 'v1.3'] }, /1\.1 doesn't come after the last release, 1\.3/);
  one({ version: 'aaaaaaaaaaaa' }, /RELEASES\.md: 1\.1 says version 720f7406cc4a, the site's is aaaaaaaaaaaa/);
  one({ offline: ['version x, the files make y'] }, /^tools\/offline\.js: version x/);
  one({ releases: parseReleases(MD.replace('- A fix.', '')) }, /no notes for 1\.1/);
  one({ releases: parseReleases(MD.replace(`## 1.1 (2026-10-20, version ${W})`, '## 1.1 soon')) }, /the newest heading isn't/);
  one({ releases: [] }, /RELEASES\.md: no releases/);
  const p = problems({ ...ok, release: '1.2' });
  assert.ok(p.some(x => /the newest release is 1\.1, src\/core\/release\.js says 1\.2/.test(x)), p.join(' | '));
  assert.ok(problems({ ...ok, release: 'one' }).some(x => /"one" is not a release number/.test(x)));
});

test('release: the site’s number is x.y and is RELEASES.md’s newest', async () => {
  assert.ok(isRelease(RELEASE), RELEASE);
  const releases = parseReleases(await readFile(path.join(root, NOTES_FILE), 'utf8'));
  assert.equal(releases[0]?.release, RELEASE, `${NOTES_FILE}'s newest release is not src/core/release.js's ${RELEASE}`);
  assert.ok(releases.every(r => r.release && r.notes), 'a release with a bad heading or no notes');
});
