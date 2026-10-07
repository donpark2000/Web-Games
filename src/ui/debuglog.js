// The debug log on every page (DESIGN.md "Structure"; standards §1). Pages
// log through `log`; the lines are kept on this device (localStorage) and
// shown, saved or cleared on log.html, which nothing links to (developer,
// 2026-10-07: no panel on the game screens; reached by its address only).

import { createLog, LOG_KEY, LOG_MAX } from '../core/log.js';

const SAVE_MS = 500;   // the lines are written this long after the last one

// The browser's storage, or null where it can't be used.
let storage = null;
try { storage = window.localStorage; } catch { /* blocked: the log stays in memory */ }

export const log = createLog({ max: LOG_MAX, storage, key: LOG_KEY });
// The page's heading, before anything the page logs while it loads.
log.begin(`${location.pathname.split('/').pop() || 'index.html'}, ${innerWidth}x${innerHeight}`);

// Call once per page: uncaught errors logged, and the lines written to the
// device shortly after each one and when the page is left.
export function startLog(pageName) {
  log.add('page', `${pageName} loaded`);
  addEventListener('error', e => log.add('error', e.message, { at: `${e.filename}:${e.lineno}:${e.colno}` }));
  addEventListener('unhandledrejection', e => log.add('error', 'unhandled rejection', { reason: String(e.reason) }));
  let timer = null, warned = false;
  const save = () => {
    clearTimeout(timer);
    timer = null;
    if (!log.save() && !warned) { warned = true; log.add('log', 'not kept on this device (storage refused); this page only'); }
  };
  log.onLine(() => { if (!timer) timer = setTimeout(save, SAVE_MS); });
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  save();
}
