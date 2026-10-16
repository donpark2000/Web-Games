// Checks a release before it's published, and gives its notes (DESIGN.md
// "Releases"). The release number is set by hand in src/core/release.js
// (x.0 for a new game, x.1, x.2 ... for fixes and changes) and its notes
// go in RELEASES.md under "## X.Y (YYYY-MM-DD, version <the site's
// version>)". Every publish is a new release: a git tag vX.Y on main and
// a GitHub release with these notes.
//   node tools/release.js          -> "ready", or what's missing (exit 1)
//   node tools/release.js notes    -> the newest release's notes

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check, readRelease, RELEASE_FILE } from './offline.js';

export const NOTES_FILE = 'RELEASES.md';

// RELEASES.md's releases, newest first: [{ head, release, made, version,
// notes }] (release, made and version null when the heading isn't
// "X.Y (YYYY-MM-DD, version <12 hex>)").
export function parseReleases(md) {
  return md.replace(/\r\n/g, '\n').split(/^## /m).slice(1).map(part => {
    const [head, ...rest] = part.split('\n');
    const m = /^(\S+) \((\d{4}-\d\d-\d\d), version ([0-9a-f]{12})\)$/.exec(head.trim());
    return { head: head.trim(), release: m?.[1] ?? null, made: m?.[2] ?? null, version: m?.[3] ?? null, notes: rest.join('\n').trim() };
  });
}

export const isRelease = r => /^\d+\.\d+$/.test(r ?? '');
// Whether release a comes after b (1.10 after 1.9).
export function after(a, b) {
  const [a1, a2] = a.split('.').map(Number), [b1, b2] = b.split('.').map(Number);
  return a1 > b1 || (a1 === b1 && a2 > b2);
}

// What stops `release` being published, [] when it's ready.
//   release   the number in src/core/release.js
//   releases  parseReleases(RELEASES.md)
//   version   the site's version (tools/offline.js)
//   tags      the repository's git tags
//   offline   tools/offline.js check()'s problems
export function problems({ release, releases, version, tags, offline = [] }) {
  const out = [];
  if (!isRelease(release)) out.push(`${RELEASE_FILE}: "${release}" is not a release number like 1.0 or 1.2`);
  const top = releases[0];
  if (!top) out.push(`${NOTES_FILE}: no releases`);
  else if (!top.release) out.push(`${NOTES_FILE}: the newest heading isn't "## X.Y (YYYY-MM-DD, version <12 hex>)": ${top.head}`);
  else {
    if (top.release !== release) out.push(`${NOTES_FILE}: the newest release is ${top.release}, ${RELEASE_FILE} says ${release}`);
    if (top.version !== version) out.push(`${NOTES_FILE}: ${top.release} says version ${top.version}, the site's is ${version}`);
    if (!top.notes) out.push(`${NOTES_FILE}: no notes for ${top.release}`);
  }
  const done = tags.filter(t => /^v\d+\.\d+$/.test(t)).map(t => t.slice(1));
  if (done.includes(release)) out.push(`v${release} is already a release: every publish needs a new number`);
  else if (isRelease(release)) {
    const last = done.reduce((a, b) => (!a || after(b, a) ? b : a), null);
    if (last && !after(release, last)) out.push(`${release} doesn't come after the last release, ${last}`);
  }
  out.push(...offline.map(p => `tools/offline.js: ${p}`));
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const releases = parseReleases(await readFile(path.join(root, NOTES_FILE), 'utf8'));
  if (process.argv[2] === 'notes') {
    process.stdout.write(`${releases[0]?.notes ?? ''}\n`);
  } else {
    const release = await readRelease(root);
    const { version, problems: offline } = await check(root);
    const tags = execFileSync('git', ['tag', '-l'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
    const found = problems({ release, releases, version, tags, offline });
    if (found.length) {
      console.log(`Release ${release} is not ready:\n- ${found.join('\n- ')}`);
      process.exitCode = 1;
    } else {
      console.log(`Release ${release} is ready: version ${version}; tag v${release} not made yet.`);
    }
  }
}
