// The connection as a page sees it (src/core/net.js): what needs the
// network on opening waits SETTLE_MS and gets navigator.onLine then, not as
// the page opens; the log gets navigator.onLine a few times after opening
// and each online/offline event. Fake timers and events; nothing is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNet, SETTLE_MS, SAMPLES_MS } from '../src/core/net.js';

function fakePage(onLine) {
  const nav = { onLine }, timers = [], handlers = {}, lines = [];
  let now = 0;
  const net = createNet({
    nav,
    wait: (fn, ms) => timers.push({ at: now + ms, fn }),
    on: (type, fn) => { handlers[type] = fn; },
    log: { add: (tag, msg, data) => lines.push(`${now} ${tag} ${msg} ${JSON.stringify(data)}`) },
  });
  // Runs the timers due by `to`, in time order.
  const runTo = to => {
    for (;;) {
      const due = timers.filter(t => t.at <= to).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      timers.splice(timers.indexOf(due), 1);
      now = due.at;
      due.fn();
    }
    now = to;
  };
  return { nav, net, handlers, lines, runTo };
}

test('net: on opening, waits to settle and uses navigator.onLine then (online at first, offline by then)', () => {
  const p = fakePage(true);   // the iPhone in airplane mode, as it opens
  const got = [];
  p.net.afterSettle(online => got.push(online));
  p.runTo(SETTLE_MS - 1);
  assert.deepEqual(got, [], 'nothing before it settles');
  p.nav.onLine = false;
  p.runTo(SETTLE_MS);
  assert.deepEqual(got, [false]);
});

test('net: online after settling is online; a missing onLine counts as online', () => {
  const p = fakePage(true);
  const got = [];
  p.net.afterSettle(online => got.push(online));
  p.runTo(SETTLE_MS);
  const q = fakePage(undefined);
  q.net.afterSettle(online => got.push(online));
  q.runTo(SETTLE_MS);
  assert.deepEqual(got, [true, true]);
});

test('net: the log gets navigator.onLine after opening, and each online/offline event', () => {
  const p = fakePage(true);
  p.runTo(1000);
  p.nav.onLine = false;
  p.handlers.offline();
  p.runTo(10000);
  assert.deepEqual(p.lines, [
    '500 net after 0.5 s {"online":true}',
    '1000 net after 1 s {"online":true}',
    '1000 net offline event {"online":false}',
    '2000 net after 2 s {"online":false}',
    '4000 net after 4 s {"online":false}',
  ]);
  assert.equal(SAMPLES_MS.length, 4);
  assert.ok(SETTLE_MS >= 1000 && SETTLE_MS <= 5000, `SETTLE_MS ${SETTLE_MS}`);
});
