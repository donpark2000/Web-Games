// The connection as a page sees it (DESIGN.md "Offline app"). No DOM code:
// src/ui/net.js makes the page's one copy with the browser's navigator,
// timers and events.
//
// An iPhone's installed app opened in airplane mode can say it's online
// (navigator.onLine true) as it opens (journal, "navigator.onLine at
// launch"), and iOS shows an alert when an app then tries the network. So
// what needs the network on opening (the page count, sw.js's registration)
// waits SETTLE_MS and asks again. The log gets navigator.onLine a few times
// after opening, and each online/offline event, to see when it's right.

export const SETTLE_MS = 2000;                      // wait before trying the network on opening
export const SAMPLES_MS = [500, 1000, 2000, 4000];  // navigator.onLine logged at these times

// nav: { onLine }; wait(fn, ms): a timer; on(type, fn): window events;
// log: the debug log.
export function createNet({ nav, wait, on, log }) {
  for (const ms of SAMPLES_MS) wait(() => log.add('net', `after ${ms / 1000} s`, { online: nav.onLine }), ms);
  on('online', () => log.add('net', 'online event', { online: nav.onLine }));
  on('offline', () => log.add('net', 'offline event', { online: nav.onLine }));
  return {
    // fn(online) once the page has settled, with navigator.onLine then.
    afterSettle(fn) { wait(() => fn(nav.onLine !== false), SETTLE_MS); },
  };
}
