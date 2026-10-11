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
// browser may still check by itself as a page opens.

import { log } from './debuglog.js';
import { net } from './net.js';
import { versionLabel } from '../core/appversion.js';
import { VERSION, MADE } from '../core/version.js';

const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
log.add('offline', installed ? 'opened as the installed app' : 'opened in the browser', { online: navigator.onLine, version: VERSION, made: MADE });

const line = document.getElementById('appVersion');   // the home page only
function show(next = null) {
  if (!line) return;
  line.textContent = versionLabel({ version: VERSION, made: MADE }, next);
  line.hidden = false;
}
show();

// The running sw.js's version's details.
function askVersion(worker) {
  worker?.postMessage('version');
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
  net.afterSettle(online => {
    if (!online) {
      log.add('offline', 'no connection: not registering (no check for a new version)', { running: !!sw.controller });
      return;
    }
    sw.register('sw.js').then(reg => {
      log.add('offline', 'registered', { scope: reg.scope, running: !!sw.controller, installing: !!reg.installing });
    }).catch(e => log.add('offline', 'not registered', { error: String(e) }));
  });
}
