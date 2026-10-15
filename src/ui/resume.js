// Coming back to where you left off, in the browser (src/core/resume.js;
// DESIGN.md "Coming back to a game"). A game page calls resumable(); the
// home page calls backToGame() before anything else.

import { createResume, returnTo, HOME, LAST_KEY } from '../core/resume.js';
import { log } from './debuglog.js';

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing kept */ }
const page = location.pathname.split('/').pop() || HOME;
function setLast(p) { try { storage?.setItem(LAST_KEY, p); } catch { /* not kept */ } }

// A game page. `snapshot()` returns what to keep ({ screen: 'setup' or
// 'play', ... }); the page calls keep() after each change, and it's kept
// too as the page is hidden or left (another app, the phone locked, the
// app's icon). Returns { saved: what was kept last time, or null; keep;
// clear }.
export function resumable(game, format, snapshot) {
  const r = createResume({ storage, game, format, log });
  setLast(page);
  // 🏠 is leaving on purpose: the app's icon then opens the home page.
  for (const a of document.querySelectorAll('a.homebtn')) a.addEventListener('click', () => setLast(HOME));
  const keep = () => r.save(snapshot());
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') keep(); });
  return { saved: r.saved, keep, clear: r.clear };
}

// The home page: opened by the installed app's icon after leaving a game
// (not with 🏠), goes back to that game. Returns true when it does.
export function backToGame() {
  let last = null;
  try { last = storage?.getItem(LAST_KEY) ?? null; } catch { /* nothing kept */ }
  const app = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const navType = performance.getEntriesByType?.('navigation')[0]?.type ?? 'navigate';
  let fromSite = false;
  try { fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* no referrer */ }
  const to = returnTo({ last, app, navType, fromSite });
  log.add('resume', to ? 'back to the game left' : 'home page', { last, app, navType, fromSite });
  if (to) {
    log.save();
    location.replace(to);
    return true;
  }
  setLast(HOME);
  return false;
}
