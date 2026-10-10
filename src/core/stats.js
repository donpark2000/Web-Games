// The site's stats (DESIGN.md "Stats"; developer, 2026-10-10): which games
// are opened and played, from which countries, over time. No DOM code:
// src/ui/stats.js sends the counts.
//
// The counts go to GoatCounter (goatcounter.com: free, no cookies, nothing
// personal kept), as one small request each: the page's own few lines, no
// script from another site. Its dashboard is public, linked from every
// footer ("Stats"). Only the live site counts, so testing on localhost or
// with an automated browser doesn't add to the numbers.

export const GOATCOUNTER = 'donpark2000';   // the site's code: https://<code>.goatcounter.com
export const LIVE_HOST = 'donpark2000.github.io';

// The dashboard (the footer's "Stats" link).
export const statsPage = (code = GOATCOUNTER) => `https://${code}.goatcounter.com/`;

// Whether this page should send counts: only on the live site, and not in
// an automated browser (navigator.webdriver).
export function shouldCount({ hostname, webdriver = false }) {
  return hostname === LIVE_HOST && !webdriver;
}

// The page as the dashboard shows it: its full path, which GoatCounter
// links to on the site's domain (donpark2000.github.io), with the home
// page always as its folder: '/Web-Games/nim.html', '/Web-Games/'.
export function pagePath(pathname) {
  const parts = String(pathname || '/').split('/');
  if (parts.at(-1) === 'index.html') parts[parts.length - 1] = '';
  const path = parts.join('/');
  return path.startsWith('/') ? path : `/${path}`;
}

// The event for a game started on page `path`: 'play-nim'. (GoatCounter:
// an event's name can't start with '/'.)
export function gameEvent(path) {
  const name = pagePath(path).split('/').pop().replace(/\.html$/, '');
  if (!name) throw new Error('gameEvent: the home page has no game');
  return `play-${name}`;
}

// The referrer worth keeping: another site that sent the visitor, not a page
// of this site (the home page leading to a game).
export function otherSite(referrer, hostname) {
  try {
    const u = new URL(referrer);
    return u.hostname && u.hostname !== hostname ? referrer : '';
  } catch {
    return '';
  }
}

// The count's address (GoatCounter's /count, help page "Tracking pixel"):
// p the page or event name, t the title, r the referrer, s the screen
// (width,height,scale), e an event, rnd a cache buster so a repeat is sent.
export function countUrl(code, { path, title = '', referrer = '', screen = '', event = false, rnd = '' }) {
  if (!path) throw new Error('countUrl: no path');
  if (event && path.startsWith('/')) throw new Error(`countUrl: an event name can't start with '/': ${path}`);
  if (!event && !path.startsWith('/')) throw new Error(`countUrl: a page must start with '/': ${path}`);
  const q = new URLSearchParams({ p: path });
  if (title) q.set('t', title);
  if (referrer) q.set('r', referrer);
  if (screen) q.set('s', screen);
  if (event) q.set('e', 'true');
  if (rnd) q.set('rnd', rnd);
  return `https://${code}.goatcounter.com/count?${q}`;
}
