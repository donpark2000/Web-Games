// Checks a release before it's published, and gives its notes (DESIGN.md
// "Releases"). The release number is set by hand in src/core/release.js
// (x.0 for a new game, x.1, x.2 ... for fixes and changes) and its notes
// go in RELEASES.md under "## X.Y (YYYY-MM-DD, version <the site's
// version>)". Every publish is a new release: a git tag vX.Y on main and
// a GitHub release with these notes.
//   node tools/release.js          -> "ready", or what's missing (exit 1)
//   node tools/release.js notes    -> the newest release's notes, one line
//                                     per paragraph or list item (GitHub)
// The Topple Lab (DESIGN.md "Topple Lab") has release numbers of its own
// (topple-lab/src/core/release.js), its notes under RELEASES.md's
// "# Topple Lab" heading, and tags lab-vX.Y; a publish that changes only
// the lab is a lab release, and the site's release stays as it was:
//   node tools/release.js lab        -> the same check, for the lab
//   node tools/release.js lab notes  -> the lab's newest notes

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check, readRelease, RELEASE_FILE } from './offline.js';
import { check as checkLab, LAB } from './topple-lab.js';

export const NOTES_FILE = 'RELEASES.md';
export const LAB_HEADING = '# Topple Lab';
// Each app's tags: the site's vX.Y, the lab's lab-vX.Y.
export const TAG = { site: 'v', lab: 'lab-v' };

// RELEASES.md's releases, newest first: [{ head, release, made, version,
// notes }] (release, made and version null when the heading isn't
// "X.Y (YYYY-MM-DD, version <12 hex>)"). The site's are the ones before
// the "# Topple Lab" heading, the lab's ({ lab: true }) the ones after it.
export function parseReleases(md, { lab = false } = {}) {
  const [site, labPart = ''] = md.replace(/\r\n/g, '\n').split(new RegExp(`^${LAB_HEADING}$`, 'm'));
  return (lab ? labPart : site).split(/^## /m).slice(1).map(part => {
    const [head, ...rest] = part.split('\n');
    const m = /^(\S+) \((\d{4}-\d\d-\d\d), version ([0-9a-f]{12})\)$/.exec(head.trim());
    return { head: head.trim(), release: m?.[1] ?? null, made: m?.[2] ?? null, version: m?.[3] ?? null, notes: rest.join('\n').trim() };
  });
}

// Notes for GitHub, which shows every line break in a release's text (2026-10-16:
// 1.0's notes broke mid-sentence): each paragraph and list item joined onto
// one line; blank lines, headings and the start of each list item kept.
export function unwrap(notes) {
  const out = [];
  for (const line of notes.replace(/\r\n/g, '\n').split('\n')) {
    const starts = /^\s*([-*+]|\d+\.)\s|^#/.test(line);
    if (line.trim() && !starts && out.length && out.at(-1).trim() && !/^#/.test(out.at(-1))) out[out.length - 1] += ` ${line.trim()}`;
    else out.push(line);
  }
  return out.join('\n');
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
//   lab       true for the Topple Lab's release (its file, notes and tags)
export function problems({ release, releases, version, tags, offline = [], lab = false }) {
  const out = [];
  const file = lab ? `${LAB}/${RELEASE_FILE}` : RELEASE_FILE;
  const notes = lab ? `${NOTES_FILE} (${LAB_HEADING})` : NOTES_FILE;
  const tag = lab ? TAG.lab : TAG.site;
  if (!isRelease(release)) out.push(`${file}: "${release}" is not a release number like 1.0 or 1.2`);
  const top = releases[0];
  if (!top) out.push(`${notes}: no releases`);
  else if (!top.release) out.push(`${notes}: the newest heading isn't "## X.Y (YYYY-MM-DD, version <12 hex>)": ${top.head}`);
  else {
    if (top.release !== release) out.push(`${notes}: the newest release is ${top.release}, ${file} says ${release}`);
    if (top.version !== version) out.push(`${notes}: ${top.release} says version ${top.version}, the ${lab ? 'lab' : 'site'}'s is ${version}`);
    if (!top.notes) out.push(`${notes}: no notes for ${top.release}`);
  }
  const done = tags.filter(t => t.startsWith(tag) && isRelease(t.slice(tag.length))).map(t => t.slice(tag.length));
  if (done.includes(release)) out.push(`${tag}${release} is already a release: every publish needs a new number`);
  else if (isRelease(release)) {
    const last = done.reduce((a, b) => (!a || after(b, a) ? b : a), null);
    if (last && !after(release, last)) out.push(`${release} doesn't come after the last release, ${last}`);
  }
  out.push(...offline.map(p => `tools/offline.js: ${p}`));
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const lab = args[0] === 'lab';
  if (lab) args.shift();
  const releases = parseReleases(await readFile(path.join(root, NOTES_FILE), 'utf8'), { lab });
  const name = lab ? 'Topple Lab release' : 'Release';
  if (args[0] === 'notes') {
    process.stdout.write(`${unwrap(releases[0]?.notes ?? '')}\n`);
  } else {
    const release = await readRelease(lab ? path.join(root, LAB) : root);
    const { version, problems: offline } = lab ? await checkLab(root) : await check(root);
    const tags = execFileSync('git', ['tag', '-l'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
    const found = problems({ release, releases, version, tags, offline, lab });
    const tag = lab ? TAG.lab : TAG.site;
    if (found.length) {
      console.log(`${name} ${release} is not ready:\n- ${found.join('\n- ')}`);
      process.exitCode = 1;
    } else {
      console.log(`${name} ${release} is ready: version ${version}; tag ${tag}${release} not made yet.`);
    }
  }
}
