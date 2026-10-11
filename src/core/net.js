// The connection as a page sees it (DESIGN.md "Offline app"). No DOM code:
// src/ui/net.js makes the page's one copy with the browser's navigator,
// timers and events.
//
// An iPhone's installed app opened in airplane mode can say it's online
// (navigator.onLine true) as it opens (journal, "navigator.onLine at
// launch"), and iOS shows an alert when an app then tries the network. So
// what needs the network on opening (the page count, sw.js's registration)
// waits SETTLE_MS and asks again. The log gets each online/offline event.
// (Until 2026-10-11 it also got navigator.onLine 0.5, 1, 2 and 4 s after
// opening, which showed when it turned; no longer needed.)

export const SETTLE_MS = 2000;   // wait before trying the network on opening

// nav: { onLine }; wait(fn, ms): a timer; on(type, fn): window events;
// log: the debug log.
export function createNet({ nav, wait, on, log }) {
  on('online', () => log.add('net', 'online event', { online: nav.onLine }));
  on('offline', () => log.add('net', 'offline event', { online: nav.onLine }));
  return {
    // fn(online) once the page has settled, with navigator.onLine then.
    afterSettle(fn) { wait(() => fn(nav.onLine !== false), SETTLE_MS); },
  };
}
