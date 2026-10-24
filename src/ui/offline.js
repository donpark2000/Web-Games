// The offline app on a page (DESIGN.md "Offline app"): registers sw.js,
// which saves the whole site on the device for play with no connection.
// Every page loads this. What happens goes in the debug log ("offline"):
// opened as an installed app or in the browser, this page's version,
// whether it came from the saved copy, the saved version and how many
// files it holds, a new version taking over, or why there's none.
// On the home page it also shows this page's version under the footer
// (#appVersion; src/core/appversion.js), and a new version that took over
// while it was open, so a phone shows whether a new version has arrived.
//
// It registers sw.js (which can mean a check for a new version) only once
// the page has settled and only with a connection: an iPhone in airplane
// mode shows an alert when an app tries the network, and its installed app
// can say it's online as it opens (src/core/net.js; journal,
// "navigator.onLine at launch"). The saved copy works without it. The
// browser may still check by itself as a page opens. Then it asks for a
// check itself (3.11), and the home page loads again when a new version is
// running, so a new version shows a moment after the app opens.

import { log } from './debuglog.js';
import { net } from './net.js';
import { versionLabel, reloadFor } from '../core/appversion.js';
import { VERSION, MADE } from '../core/version.js';
import { RELEASE } from '../core/release.js';

const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
log.add('offline', installed ? 'opened as the installed app' : 'opened in the browser', { online: navigator.onLine, release: RELEASE, version: VERSION, made: MADE });

const line = document.getElementById('appVersion');   // the home page only
function show(next = null) {
  if (!line) return;
  line.textContent = versionLabel({ release: RELEASE, version: VERSION, made: MADE }, next);
  line.hidden = false;
}
show();

// The running sw.js's version's details.
function askVersion(worker) {
  worker?.postMessage('version');
}

// The home page loads again when the version running isn't its own (3.11;
// src/core/appversion.js reloadFor), so a new version shows a moment after
// the app opens, not only on the page after. Once per version: the
// per-session storage remembers the one reloaded for.
const RELOADED_KEY = 'web-games-reloaded-for';
let session = null;
try { session = window.sessionStorage; } catch { /* blocked: no reload (it couldn't be limited to once) */ }
function reloadIfNew(running) {
  let reloadedFor = null;
  try { reloadedFor = session?.getItem(RELOADED_KEY) ?? null; } catch { /* as above */ }
  const d = reloadFor({ home: !!line, own: { version: VERSION }, running, reloadedFor });
  if (d.why === 'same version') return;
  if (d.reload && session) {
    try { session.setItem(RELOADED_KEY, running.version); } catch { return; }
    log.add('offline', 'reloading the home page for the new version', { from: VERSION, to: running.version });
    log.save();
    location.reload();
  } else log.add('offline', 'not reloading for the version running', { own: VERSION, running: running.version, why: d.why });
}

if (!('serviceWorker' in navigator)) {
  log.add('offline', 'not available here', { why: location.protocol === 'file:' ? 'opened as a file' : 'no service workers in this browser' });
} else {
  const sw = navigator.serviceWorker;
  let tookOver = false;   // a version took over while this page was open
  sw.addEventListener('message', e => {
    if (e.data?.version === undefined) return;
    log.add('offline', 'saved for offline', e.data);
    if (tookOver) show(e.data);
    reloadIfNew(e.data);
  });
  if (!sw.controller) log.add('offline', 'this page is not from the saved copy', { why: 'not saved yet, or a hard reload (which skips sw.js)' });
  let hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => {
    log.add('offline', hadController ? 'a new version took over' : 'now saved for offline');
    hadController = true;
    tookOver = true;
    askVersion(sw.controller);
  });
  askVersion(sw.controller);
  // What's on the device as the page opens, and each new version's steps
  // (found, installed, activated), to see when an update arrives.
  const stateOf = reg => ({ active: reg?.active?.state ?? null, waiting: reg?.waiting?.state ?? null, installing: reg?.installing?.state ?? null });
  const watched = new WeakSet();
  const watch = reg => {
    if (!reg || watched.has(reg)) return;
    watched.add(reg);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      log.add('offline', 'a new version found: installing');
      w?.addEventListener('statechange', () => log.add('offline', `the new version ${w.state}`));
    });
  };
  sw.getRegistration().then(reg => {
    log.add('offline', reg ? 'on the device at opening' : 'nothing on the device at opening', reg ? stateOf(reg) : undefined);
    watch(reg);
  }).catch(e => log.add('offline', 'registration not read', { error: String(e) }));
  net.afterSettle(online => {
    if (!online) {
      log.add('offline', 'no connection: not registering (no check for a new version)', { running: !!sw.controller });
      return;
    }
    sw.register('sw.js').then(reg => {
      log.add('offline', 'registered', { scope: reg.scope, running: !!sw.controller, ...stateOf(reg) });
      watch(reg);
      // Registering again doesn't check for a new version, and a browser
      // may not check by itself as the app opens (3.11): ask.
      if (!sw.controller || reg.installing || reg.waiting) return;
      return reg.update().then(() => log.add('offline', 'checked for a new version', stateOf(reg)));
    }).catch(e => log.add('offline', 'not registered, or the check failed', { error: String(e) }));
  });
}
