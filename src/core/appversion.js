// The home page's version line (DESIGN.md "Offline app"; developer,
// 2026-10-11: to see on a phone whether a new version has arrived). No DOM
// code: src/ui/offline.js shows this under the footer.
//
// `own` is the version of the page's own files ({ version, made }, from
// src/core/version.js), so it's always known, however the page was loaded.
// (Until 2026-10-11 it was asked of sw.js; a hard reload, which skips
// sw.js, showed "Not saved for offline yet".) `next` is a version that took
// over while the page was open (from sw.js): its files are used from the
// next page opened.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-11' -> 'Oct 11, 2026'; anything else as it is.
export function dayLabel(made) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(made ?? '');
  if (!m || +m[2] < 1 || +m[2] > 12) return made ?? '';
  return `${MONTHS[m[2] - 1]} ${+m[3]}, ${m[1]}`;
}

// '1.0 · Oct 11, 2026 · 19e2c0': the release number for people (DESIGN.md
// "Releases"; none from an older sw.js), the day, and the version's first
// 6 characters (enough to tell two apart).
const short = v => [v.release, dayLabel(v.made), String(v.version).slice(0, 6)].filter(Boolean).join(' · ');

// Whether the page loads again to show the version now running (3.11;
// developer: "new versions do not seem to be happening right away. Even if
// I fully close the app"; measured: a new version took over 1.7 s after
// opening, and the page on screen stayed the old one). Only the home page
// (a game is never cut short), only when the running version isn't the
// page's own, not on localhost (its pages come from the network, newer than
// what's saved), and once per version (`reloadedFor`: the version last
// reloaded for, so a reload that still brings the old page can't loop).
// own, running: { version }. Returns { reload, why }.
export function reloadFor({ home, own, running, reloadedFor = null }) {
  if (!running?.version || running.version === own.version) return { reload: false, why: 'same version' };
  if (!home) return { reload: false, why: 'not the home page (the next page opened has it)' };
  if (running.freshFirst) return { reload: false, why: 'localhost: pages from the network' };
  if (reloadedFor === running.version) return { reload: false, why: 'already reloaded for it' };
  return { reload: true, why: 'a new version is running' };
}

export function versionLabel(own, next = null) {
  let s = `Version ${short(own)}`;
  if (next && next.version !== own.version) s += ` (new version next time: ${short(next)})`;
  return s;
}
