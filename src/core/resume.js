// Coming back to where you left off (DESIGN.md "Coming back to a game";
// journal Q20, Q22). No DOM code: src/ui/resume.js passes the browser's
// storage.
//
// At most one game is in progress, and only for a reload or a trip to
// another app (developer, 2026-10-15: "A restart should always start
// clean. In fact I would suggest that starting any new game clears out
// any in-progress games. It is one app."; "clicking Home should also wipe
// out current state of any one game"). So a game keeps its state in the
// browser's per-session storage (a restart of the app starts a new
// session, with nothing in it), opening a game clears every other game's,
// and the home page (🏠, or back to it) clears them all.

export const HOME = 'index.html';
export const GAME_PAGES = [
  'tic-tac-toe.html', 'matching.html', 'connect-four.html', 'count-to-9.html', 'snakes-ladders.html',
  'five-dice.html', 'nim.html', 'dots-boxes.html', 'rock-paper-scissors.html', 'follow-me.html', 'bridges.html', 'hidden-faces.html',
  'colour-sudoku.html', 'laser-lab.html',
];
export const GAMES = GAME_PAGES.map(p => p.replace(/\.html$/, ''));
export const gameKey = game => `web-games-resume-${game}`;

// Clears every game's kept state but `keep`'s (null: all of them), from
// storage (the per-session one). Returns the games cleared.
export function clearGames(storage, keep = null) {
  const cleared = [];
  for (const g of GAMES) {
    if (g === keep) continue;
    try {
      if (storage?.getItem(gameKey(g)) == null) continue;
      storage.removeItem(gameKey(g));
      cleared.push(g);
    } catch { /* storage refused: nothing kept to clear */ }
  }
  return cleared;
}

// Until 2026-10-15 (Q22) each game was kept on the device (localStorage)
// until finished, and the home page went back to the last page
// (OLD_LAST_KEY) when the app's icon opened it. Removes those keys from
// storage (the device's); returns the keys removed.
export const OLD_LAST_KEY = 'web-games-last-page';
export function forgetOld(storage) {
  const keys = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k === OLD_LAST_KEY || k?.startsWith('web-games-resume-')) keys.push(k);
    }
    for (const k of keys) storage.removeItem(k);
  } catch { /* storage refused, or none */ }
  return keys;
}

// A game's kept state as stored: its format number (a game changes it when
// what it keeps changes, so an older copy is left alone, not misread), when
// it was kept, the site's version it was kept by (3.11), and the game's own
// data ({ screen, ... }).
export const pack = (format, data, at, version) => JSON.stringify({ format, at, version, data });

// { data, at } from what was stored, or { data: null, why } ('none',
// 'unreadable', 'old format N', 'kept by version V', 'empty'). With a
// `version`, a game kept by another version isn't used (3.11; developer:
// "any version update ... should clear previous state").
export function unpack(text, format, version) {
  if (text == null) return { data: null, why: 'none' };
  let v;
  try { v = JSON.parse(text); } catch { return { data: null, why: 'unreadable' }; }
  if (v?.format !== format) return { data: null, why: `old format ${v?.format}` };
  if (version !== undefined && v.version !== version) return { data: null, why: `kept by version ${v.version ?? 'unknown'}` };
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

// The visit (3.11; developer: "Any time I go to the game selection page,
// it should start fresh"): what a game keeps on the device for the puzzle
// under way (Laser Lab's runs) is tagged with it, and picked up only in
// the same visit and version. Kept in the per-session storage, so a
// restart of the app starts a new one; the home page ends it (endVisit);
// the tag holds the site's version, so a new version is a new visit too.
export const VISIT_KEY = 'web-games-visit';
const newId = () => Math.random().toString(36).slice(2, 10);
// 'id/version': this visit's tag (one is started if there's none).
export function visitTag(storage, version, make = newId) {
  let id = null;
  try { id = storage?.getItem(VISIT_KEY) ?? null; } catch { /* storage refused: a visit of this page only */ }
  if (!id) {
    id = make();
    try { storage?.setItem(VISIT_KEY, id); } catch { /* as above */ }
  }
  return `${id}/${version}`;
}
// Ends the visit; true if there was one.
export function endVisit(storage) {
  try {
    if (storage?.getItem(VISIT_KEY) == null) return false;
    storage.removeItem(VISIT_KEY);
    return true;
  } catch { return false; }
}

// One game's keeping. storage: the browser's sessionStorage (or null);
// log: the debug log; version: the site's (a game kept by another isn't
// used). Returns { saved: the data found (or null), save(data), clear() }.
// Each save is logged only when the screen changes (a save follows every
// move).
export function createResume({ storage, game, format, log, version, now = () => Date.now() }) {
  const key = gameKey(game);
  let text = null;
  try { text = storage?.getItem(key) ?? null; } catch (e) { log.add('resume', 'storage refused', { error: String(e) }); }
  const found = unpack(text, format, version);
  if (found.data) log.add('resume', 'kept game found', { game, screen: found.data.screen, keptMinsAgo: Math.round((now() - found.at) / 60000) });
  else if (found.why !== 'none') log.add('resume', 'kept game not used', { game, why: found.why });
  let lastScreen = found.data?.screen ?? null;
  let warned = false;
  return {
    saved: found.data,
    save(data) {
      try {
        storage?.setItem(key, pack(format, data, now(), version));
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
