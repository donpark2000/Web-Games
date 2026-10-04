import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLog, formatReport } from '../src/core/log.js';

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
