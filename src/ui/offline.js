// The offline app on a page (DESIGN.md "Offline app"): registers sw.js,
// which saves the whole site on the device for play with no connection.
// Every page loads this. What happens goes in the debug log ("offline"):
// opened as an installed app or in the browser, the saved version and how
// many files it holds, a new version taking over, or why there's none.
// On the home page it also shows the running version under the footer
// (#appVersion; src/core/appversion.js), so a phone shows whether a new
// version has arrived.
//
// With no connection (navigator.onLine false) it doesn't register sw.js,
// which can mean a check for a new version: nothing could be fetched, and
// an iPhone in airplane mode shows an alert when an app tries the network
// (journal, "The offline app on the developer's iPhone"). The saved copy
// works without it. The browser may still check by itself as a page opens.

import { log } from './debuglog.js';
import { versionLabel } from '../core/appversion.js';

const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
log.add('offline', installed ? 'opened as the installed app' : 'opened in the browser', { online: navigator.onLine });

// The running version's details, asked of sw.js.
function askVersion(worker) {
  worker?.postMessage('version');
}

const line = document.getElementById('appVersion');   // the home page only
let running = null;   // the version this page was opened with
function show(next = null) {
  if (!line) return;
  line.textContent = versionLabel(running, next);
  line.hidden = false;
}

if (!('serviceWorker' in navigator)) {
  log.add('offline', 'not available here', { why: location.protocol === 'file:' ? 'opened as a file' : 'no service workers in this browser' });
} else {
  const sw = navigator.serviceWorker;
  sw.addEventListener('message', e => {
    if (e.data?.version === undefined) return;
    log.add('offline', 'saved for offline', e.data);
    running ??= e.data;
    show(e.data);
  });
  if (!sw.controller) show();
  // A new version took over this page (the next page opened uses its files).
  let hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => {
    log.add('offline', hadController ? 'a new version took over' : 'now saved for offline');
    hadController = true;
    askVersion(sw.controller);
  });
  if (navigator.onLine) {
    sw.register('sw.js').then(reg => {
      log.add('offline', 'registered', { scope: reg.scope, running: !!sw.controller, installing: !!reg.installing });
      if (sw.controller) askVersion(sw.controller);
    }).catch(e => log.add('offline', 'not registered', { error: String(e) }));
  } else {
    log.add('offline', 'no connection: not registering (no check for a new version)', { running: !!sw.controller });
    askVersion(sw.controller);
  }
}
