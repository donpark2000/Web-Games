// How every Topple Lab page starts (DESIGN.md "Topple Lab"), given the
// window, the page and a loader (lab/start.js gives the real ones; the
// tests fakes): keeps the lab's saves apart from the main site's
// (./storage.js), then loads the page's scripts, listed on its start tag
// (data-load), in order, as the main site's page loads them. The page's
// import map sends the main site's code to the lab's copies where it has
// them (tools/topple-lab.js). If the saves can't be kept apart, nothing
// else is loaded and the page says so.

import { guard, PREFIX } from './storage.js';

export const STOPPED = 'The Topple Lab can’t keep its games apart from Topple!’s on this browser, so it won’t start.';

// What it did: { ok, why?, loaded: [scripts], failed: [scripts] }.
export async function begin({ win, doc, load }) {
  const kept = guard(win);
  const tag = doc.querySelector('script[data-load]');
  const entries = (tag?.dataset.load ?? '').split(/\s+/).filter(Boolean);
  const url = e => new URL(e, doc.baseURI).href;
  if (!kept.ok) {
    win.console?.error('Topple Lab not started:', kept.why);
    const p = doc.createElement('p');
    p.className = 'labstop';
    p.textContent = STOPPED;
    doc.querySelector('main')?.replaceChildren(p);
    return { ok: false, why: kept.why, loaded: [], failed: [] };
  }
  const { log } = await load(url('../src/ui/debuglog.js'));
  log.add('lab', 'saves kept apart', { prefix: PREFIX, stores: kept.stores, load: entries });
  const loaded = [], failed = [];
  for (const e of entries) {
    try { await load(url(e)); loaded.push(e); } catch (err) {
      win.console?.error(err);
      log.add('lab', 'a script failed', { script: e, error: String(err) });
      failed.push(e);
    }
  }
  return { ok: true, loaded, failed };
}
