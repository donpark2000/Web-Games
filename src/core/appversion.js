// The home page's version line (DESIGN.md "Offline app"; developer,
// 2026-10-11: to see on a phone whether a new version has arrived). No DOM
// code: src/ui/offline.js asks sw.js which version is running and shows
// this under the footer.
//
// `running` is the version this page was opened with ({ version, made },
// from sw.js), or null when the site isn't saved on the device. `next` is
// a newer version that took over while the page was open: its files are
// used from the next page opened.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-11' -> 'Oct 11, 2026'; anything else as it is.
export function dayLabel(made) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(made ?? '');
  if (!m || +m[2] < 1 || +m[2] > 12) return made ?? '';
  return `${MONTHS[m[2] - 1]} ${+m[3]}, ${m[1]}`;
}

// 'Oct 11, 2026 · 19e2c0' (the version's first 6 characters are enough to
// tell two apart).
const short = v => [dayLabel(v.made), String(v.version).slice(0, 6)].filter(Boolean).join(' · ');

export function versionLabel(running, next = null) {
  if (!running) return 'Not saved for offline yet';
  let s = `Version ${short(running)}`;
  if (next && next.version !== running.version) s += ` (new version next time: ${short(next)})`;
  return s;
}
