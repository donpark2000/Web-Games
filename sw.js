// The offline app (DESIGN.md "Offline app"): a service worker that saves
// every file of the site on the device the first time the site is opened
// with a connection, so all the games play with none (a car, no wifi).
// Registered by src/ui/offline.js on every page.
//
// - Install: save every file in FILES, fresh from the site (not the
//   browser's ordinary cache), into a cache named for this VERSION. If any
//   file fails, this version isn't used and the old one carries on.
// - Activate: delete older versions' caches; take over open pages.
// - Fetch, for this site's own files: the saved copy first (instant, and
//   the same whether online or not); the network for anything not saved.
//   Other sites (the stats counter) are left alone.
//   On localhost the network comes first instead, so the local server
//   shows edits on a reload; the saved copy is used when the server is
//   stopped. (127.0.0.1 behaves like the live site, for testing that.)
//
// A new VERSION (tools/offline.js, after any change to the site) makes
// this file different, so the browser installs it the next time a page
// opens online; the pages opened after that get the new files.

// ---- made by tools/offline.js (don't edit by hand) ----
const VERSION = '19e2c03b21a3';
const FILES = [
  'connect-four.html',
  'count-to-9.html',
  'css/cards.css',
  'css/connect-four.css',
  'css/count-to-9.css',
  'css/five-dice.css',
  'css/follow-me.css',
  'css/game.css',
  'css/log.css',
  'css/matching.css',
  'css/nim.css',
  'css/rock-paper-scissors.css',
  'css/site.css',
  'css/snakes-ladders.css',
  'css/tic-tac-toe.css',
  'data/five-dice-long.bin',
  'five-dice.html',
  'follow-me.html',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'index.html',
  'log.html',
  'manifest.webmanifest',
  'matching.html',
  'nim.html',
  'rock-paper-scissors.html',
  'snakes-ladders.html',
  'src/core/connect-four.js',
  'src/core/count-to-9.js',
  'src/core/fit.js',
  'src/core/five-dice-best.js',
  'src/core/five-dice.js',
  'src/core/follow-me.js',
  'src/core/log.js',
  'src/core/matching.js',
  'src/core/nim.js',
  'src/core/players.js',
  'src/core/rock-paper-scissors.js',
  'src/core/snakes-ladders.js',
  'src/core/stats.js',
  'src/core/tic-tac-toe.js',
  'src/ui/cardback.js',
  'src/ui/connect-four.js',
  'src/ui/count-to-9.js',
  'src/ui/debuglog.js',
  'src/ui/faces.js',
  'src/ui/fit.js',
  'src/ui/five-dice.js',
  'src/ui/fivedice-pics.js',
  'src/ui/fmpads.js',
  'src/ui/follow-me.js',
  'src/ui/logpage.js',
  'src/ui/matching.js',
  'src/ui/matchstick.js',
  'src/ui/nim.js',
  'src/ui/numbercard.js',
  'src/ui/offline.js',
  'src/ui/rock-paper-scissors.js',
  'src/ui/rpspics.js',
  'src/ui/snakes-ladders.js',
  'src/ui/snlart.js',
  'src/ui/sound.js',
  'src/ui/sounds.js',
  'src/ui/stats.js',
  'src/ui/tic-tac-toe.js',
  'tic-tac-toe.html',
];
// ---- end ----

const PREFIX = 'lets-play-';
const CACHE = PREFIX + VERSION;
const SCOPE = new URL(self.registration?.scope ?? './', self.location.href);
const FRESH_FIRST = self.location.hostname === 'localhost';

// The saved file for a request: the folder's address is its index.html;
// a ?query or #hash doesn't matter.
function savedKey(url) {
  const u = new URL(url);
  u.search = ''; u.hash = '';
  if (u.pathname.endsWith('/')) u.pathname += 'index.html';
  return u.href;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES.map(f => new Request(new URL(f, SCOPE).href, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith(PREFIX) && k !== CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = () => cache.match(savedKey(req.url));
    if (FRESH_FIRST) {
      try { return await fetch(req); } catch (e) { return (await saved()) ?? Promise.reject(e); }
    }
    return (await saved()) ?? fetch(req);
  })());
});

// A page can ask which version is running (for its debug log).
self.addEventListener('message', event => {
  if (event.data === 'version') event.source?.postMessage({ version: VERSION, files: FILES.length, freshFirst: FRESH_FIRST });
});
