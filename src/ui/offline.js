// The offline app on a page (DESIGN.md "Offline app"): registers sw.js,
// which saves the whole site on the device for play with no connection.
// Every page loads this. What happens goes in the debug log ("offline"):
// opened as an installed app or in the browser, the saved version and how
// many files it holds, a new version taking over, or why there's none.

import { log } from './debuglog.js';

const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
log.add('offline', installed ? 'opened as the installed app' : 'opened in the browser', { online: navigator.onLine });

// The running version's details, asked of sw.js.
function askVersion(worker) {
  worker?.postMessage('version');
}

if (!('serviceWorker' in navigator)) {
  log.add('offline', 'not available here', { why: location.protocol === 'file:' ? 'opened as a file' : 'no service workers in this browser' });
} else {
  const sw = navigator.serviceWorker;
  sw.addEventListener('message', e => {
    if (e.data?.version !== undefined) log.add('offline', 'saved for offline', e.data);
  });
  // A new version took over this page (the next page opened uses its files).
  let hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => {
    log.add('offline', hadController ? 'a new version took over' : 'now saved for offline');
    hadController = true;
    askVersion(sw.controller);
  });
  sw.register('sw.js').then(reg => {
    log.add('offline', 'registered', { scope: reg.scope, running: !!sw.controller, installing: !!reg.installing });
    if (sw.controller) askVersion(sw.controller);
  }).catch(e => log.add('offline', 'not registered', { error: String(e) }));
}
