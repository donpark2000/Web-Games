// Coming back to where you left off, in the browser (src/core/resume.js;
// DESIGN.md "Coming back to a game"). A game page calls resumable(); the
// home page calls homePage().
//
// At most one game in progress, kept in the browser's per-session storage
// (sessionStorage): a reload and a trip to another app keep it; a restart
// of the app, 🏠, the home page and opening another game clear it
// (developer, 2026-10-15, journal Q22).

import { createResume, clearGames, forgetOld, gameKey } from '../core/resume.js';
import { log } from './debuglog.js';

let storage = null;
try { storage = window.sessionStorage; } catch { /* blocked: nothing kept */ }

// Once, on the first load after the update: the games kept on the device
// before Q22, and the last page the app's icon went back to.
try {
  const gone = forgetOld(window.localStorage);
  if (gone.length) log.add('resume', 'old kept games removed from the device', { keys: gone });
} catch { /* no device storage: nothing old */ }

// A game page. `snapshot()` returns what to keep ({ screen: 'setup' or
// 'play', ... }); the page calls keep() after each change, and it's kept
// too as the page is hidden or left (another app, the phone locked).
// Opening this game clears any other game's. 🏠 clears this one. Returns
// { saved: what was kept (this visit), or null; keep; clear }.
export function resumable(game, format, snapshot) {
  const others = clearGames(storage, game);
  if (others.length) log.add('resume', 'another game’s kept state cleared', { opened: game, cleared: others });
  const r = createResume({ storage, game, format, log });
  let leaving = false;
  const keep = () => (leaving ? false : r.save(snapshot()));
  // 🏠 is leaving the game on purpose: nothing kept after it.
  for (const a of document.querySelectorAll('a.homebtn')) {
    a.addEventListener('click', () => {
      leaving = true;
      r.clear();
      log.add('resume', '🏠: the game cleared', { game });
      log.save();
    });
  }
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') keep(); });
  // Back (or forward) to this page from the browser's memory, after the
  // home page or another game cleared it: start fresh, as a new visit would.
  addEventListener('pageshow', e => {
    if (!e.persisted || !storage) return;
    let kept = true;
    try { kept = storage.getItem(gameKey(game)) != null; } catch { /* can't tell: carry on */ }
    if (kept && !leaving) return;
    log.add('resume', 'back to a cleared game: starting fresh', { game, leaving });
    log.save();
    location.reload();
  });
  return { saved: r.saved, keep, clear: r.clear };
}

// The home page: clears any game in progress, as it opens and when it's
// shown again from the browser's memory (back to it).
export function homePage() {
  const clear = how => {
    const cleared = clearGames(storage);
    log.add('resume', 'home page', { how, cleared });
  };
  clear('opened');
  addEventListener('pageshow', e => { if (e.persisted) clear('back (from memory)'); });
}
