// Coming back to where you left off (DESIGN.md "Coming back to a game";
// journal Q20). No DOM code: src/ui/resume.js passes the browser's storage
// and how the page was opened.
//
// The iPhone's installed app reopens on its start page (the home page)
// when its icon is tapped, and the game it showed is gone (developer,
// 2026-10-15; from the app switcher it's still there). So each game keeps
// its state on the device as it goes and picks it up when it opens; and
// the home page, opened by the app's icon, goes straight back to the game
// left there. A 🏠 tap is leaving on purpose: the home page stays (the game
// is still kept, and opening it again carries on).

export const HOME = 'index.html';
export const GAME_PAGES = [
  'tic-tac-toe.html', 'matching.html', 'connect-four.html', 'count-to-9.html', 'snakes-ladders.html',
  'five-dice.html', 'nim.html', 'rock-paper-scissors.html', 'follow-me.html', 'hidden-faces.html',
];
export const LAST_KEY = 'web-games-last-page';
export const gameKey = game => `web-games-resume-${game}`;

// The page the home page should go back to, or null to stay.
//   last      the page last open (LAST_KEY)
//   app       opened as the installed app (a browser tab keeps its own page)
//   navType   how it was opened (Navigation Timing: 'navigate', 'reload',
//             'back_forward'); back to the home page stays
//   fromSite  a link on the site brought you (the referrer is the site)
export function returnTo({ last, app, navType, fromSite }) {
  if (!app || navType === 'back_forward' || fromSite) return null;
  return GAME_PAGES.includes(last) ? last : null;
}

// A game's kept state as stored: its format number (a game changes it when
// what it keeps changes, so an older copy is left alone, not misread), when
// it was kept, and the game's own data ({ screen, ... }).
export const pack = (format, data, at) => JSON.stringify({ format, at, data });

// { data, at } from what was stored, or { data: null, why } ('none',
// 'unreadable', 'old format N', 'empty').
export function unpack(text, format) {
  if (text == null) return { data: null, why: 'none' };
  let v;
  try { v = JSON.parse(text); } catch { return { data: null, why: 'unreadable' }; }
  if (v?.format !== format) return { data: null, why: `old format ${v?.format}` };
  if (!v.data || typeof v.data !== 'object' || typeof v.data.screen !== 'string') return { data: null, why: 'empty' };
  return { data: v.data, at: v.at };
}

// Copies the kept setup picks into the page's own (the page's keys only,
// each the same kind of value, or a null either side: an unpicked face).
// The page checks the picks as usual (Play! stays greyed until they're
// right).
export function mergeSetup(setup, kept) {
  if (!kept || typeof kept !== 'object') return setup;
  for (const k of Object.keys(setup)) {
    if (!(k in kept)) continue;
    const a = setup[k], b = kept[k];
    if (a === null || b === null || typeof a === typeof b) setup[k] = b;
  }
  return setup;
}

// One game's keeping. storage: the browser's localStorage (or null);
// log: the debug log. Returns { saved: the data found (or null), save(data),
// clear() }. Each save is logged only when the screen changes (a save
// follows every move).
export function createResume({ storage, game, format, log, now = () => Date.now() }) {
  const key = gameKey(game);
  let text = null;
  try { text = storage?.getItem(key) ?? null; } catch (e) { log.add('resume', 'storage refused', { error: String(e) }); }
  const found = unpack(text, format);
  if (found.data) log.add('resume', 'kept game found', { game, screen: found.data.screen, keptMinsAgo: Math.round((now() - found.at) / 60000) });
  else if (found.why !== 'none') log.add('resume', 'kept game not used', { game, why: found.why });
  let lastScreen = found.data?.screen ?? null;
  let warned = false;
  return {
    saved: found.data,
    save(data) {
      try {
        storage?.setItem(key, pack(format, data, now()));
      } catch (e) {
        if (!warned) { warned = true; log.add('resume', 'not kept (storage refused)', { game, error: String(e) }); }
        return false;
      }
      if (data.screen !== lastScreen) { lastScreen = data.screen; log.add('resume', 'keeping', { game, screen: data.screen }); }
      return true;
    },
    clear() {
      try { storage?.removeItem(key); } catch { /* nothing kept */ }
      lastScreen = null;
    },
  };
}
