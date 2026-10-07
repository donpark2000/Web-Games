import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLog, formatReport, LOG_KEY } from '../src/core/log.js';

const clock = () => { let t = 1000; const now = () => t; now.advance = ms => { t += ms; }; return now; };

test('log: lines carry time since start, area, message and data', () => {
  const now = clock();
  const log = createLog({ now });
  now.advance(1500);
  assert.equal(log.add('ttt', 'move', { square: 4 }), '+1.500s [ttt] move {"square":4}');
  assert.equal(log.add('page', 'loaded'), '+1.500s [page] loaded');
  assert.equal(log.lines().length, 2);
});

test('log: keeps only the newest lines and says how many were dropped', () => {
  const log = createLog({ max: 3, now: clock() });
  for (let i = 1; i <= 5; i++) log.add('t', `line ${i}`);
  assert.deepEqual(log.lines().map(l => l.split('] ')[1]), ['line 3', 'line 4', 'line 5']);
  assert.equal(log.dropped(), 2);
  assert.match(formatReport(log, {}), /lines: 3 \(oldest 2 dropped\)/);
});

test('log: data that cannot be printed does not break logging', () => {
  const log = createLog({ now: clock() });
  const loop = {}; loop.self = loop;
  assert.match(log.add('t', 'odd', loop), /\(data not printable\)$/);
});

test('log: listeners hear each line; unsubscribe stops them; clear empties', () => {
  const log = createLog({ now: clock() });
  const heard = [];
  const off = log.onLine(l => heard.push(l));
  log.add('t', 'a');
  off();
  log.add('t', 'b');
  assert.equal(heard.length, 1);
  log.clear();
  assert.equal(log.lines().length, 0);
});

// A stand-in for the browser's localStorage (nothing touches the disk).
function fakeStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), map: m };
}

test('kept on the device: the next page starts with the lines saved by the last', () => {
  const storage = fakeStorage();
  const a = createLog({ storage, now: clock() });
  a.begin('five-dice.html, 393x852');
  a.add('dice', 'roll', { dice: [1, 2, 3, 4, 5] });
  assert.equal(a.save(), true);
  const b = createLog({ storage, now: clock() });
  b.begin('index.html, 393x852');
  b.add('page', 'home loaded');
  assert.equal(b.lines().length, 4);
  assert.match(b.lines()[0], /^=== \d{4}-\d\d-\d\d \d\d:\d\d:\d\d five-dice\.html, 393x852 ===$/);
  assert.equal(b.lines()[1], '+0.000s [dice] roll {"dice":[1,2,3,4,5]}');
  assert.match(b.lines()[2], /index\.html/);
  // Not saved yet: still only the first page's lines on the device.
  assert.equal(JSON.parse(storage.getItem(LOG_KEY)).length, 2);
});

test('kept on the device: only the newest lines, across pages', () => {
  const storage = fakeStorage();
  const a = createLog({ storage, max: 3, now: clock() });
  for (let i = 1; i <= 3; i++) a.add('t', `a${i}`);
  a.save();
  const b = createLog({ storage, max: 3, now: clock() });
  b.add('t', 'b1');
  b.save();
  assert.deepEqual(createLog({ storage, max: 3 }).lines().map(l => l.split('] ')[1]), ['a2', 'a3', 'b1']);
  assert.equal(b.dropped(), 1);
});

test('kept on the device: clear empties it; a bad or missing record is an empty log', () => {
  const storage = fakeStorage();
  const a = createLog({ storage, now: clock() });
  a.add('t', 'x');
  a.save();
  a.clear();
  assert.equal(storage.getItem(LOG_KEY), null);
  assert.deepEqual(createLog({ storage }).lines(), []);
  for (const bad of ['not json', '{"a":1}', '[1, null, "kept"]']) {
    storage.setItem(LOG_KEY, bad);
    assert.deepEqual(createLog({ storage }).lines(), bad.includes('kept') ? ['kept'] : [], bad);
  }
});

test('kept on the device: a storage that refuses still logs in memory', () => {
  const refuses = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('blocked'); } };
  const a = createLog({ storage: refuses, now: clock() });
  a.add('t', 'still here');
  assert.equal(a.save(), false);
  assert.equal(a.lines().length, 1);
  a.clear();
  assert.equal(a.lines().length, 0);
  assert.equal(createLog({ now: clock() }).save(), false, 'no storage at all');
});

test('report: environment first, then every line', () => {
  const log = createLog({ now: clock() });
  log.add('t', 'one');
  const text = formatReport(log, { userAgent: 'TestBrowser/1', viewport: '390x844' });
  const rows = text.split('\n');
  assert.equal(rows[0], 'Web Games debug log');
  assert.ok(rows.includes('userAgent: TestBrowser/1'));
  assert.ok(rows.includes('viewport: 390x844'));
  assert.ok(rows.indexOf('viewport: 390x844') < rows.findIndex(r => r.includes('[t] one')));
});
