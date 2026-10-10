// The site's stats (src/core/stats.js): only the live site counts, the
// page names and game events, the referrer kept only from another site, and
// GoatCounter's count address. Pure functions; nothing is sent or written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOATCOUNTER, LIVE_HOST, statsPage, shouldCount, pagePath, gameEvent, otherSite, countUrl } from '../src/core/stats.js';

test('stats: only the live site counts, and not an automated browser', () => {
  assert.equal(LIVE_HOST, 'donpark2000.github.io');
  assert.equal(shouldCount({ hostname: 'donpark2000.github.io' }), true);
  assert.equal(shouldCount({ hostname: 'donpark2000.github.io', webdriver: true }), false, 'automated browser');
  for (const hostname of ['localhost', '127.0.0.1', '', 'donpark2000.github.io.evil.example', 'github.io']) {
    assert.equal(shouldCount({ hostname }), false, hostname || '(a file)');
  }
});

test('stats: page names keep the site folder; the home page is its folder', () => {
  assert.equal(pagePath('/Web-Games/nim.html'), '/Web-Games/nim.html');
  assert.equal(pagePath('/Web-Games/'), '/Web-Games/');
  assert.equal(pagePath('/Web-Games/index.html'), '/Web-Games/');
  assert.equal(pagePath('/follow-me.html'), '/follow-me.html');   // localhost: no folder
  assert.equal(pagePath('/'), '/');
  assert.equal(pagePath(''), '/');
});

test('stats: a game started is an event named after its page', () => {
  assert.equal(gameEvent('/Web-Games/nim.html'), 'play-nim');
  assert.equal(gameEvent('/Web-Games/follow-me.html'), 'play-follow-me');
  assert.equal(gameEvent('/rock-paper-scissors.html'), 'play-rock-paper-scissors');
  assert.throws(() => gameEvent('/Web-Games/'), /home page/);
  assert.throws(() => gameEvent('/Web-Games/index.html'), /home page/);
});

test('stats: the referrer is kept only when another site sent the visitor', () => {
  assert.equal(otherSite('https://www.google.com/search?q=x', LIVE_HOST), 'https://www.google.com/search?q=x');
  assert.equal(otherSite('https://donpark2000.github.io/Web-Games/', LIVE_HOST), '', 'the home page leading to a game');
  assert.equal(otherSite('', LIVE_HOST), '', 'typed in or a bookmark');
  assert.equal(otherSite('not a url', LIVE_HOST), '');
});

test('stats: a page count and a game event as GoatCounter takes them', () => {
  const page = new URL(countUrl('donpark2000', {
    path: '/Web-Games/nim.html', title: 'Nim & co', referrer: 'https://example.com/a?b=1', screen: '393,852,3', rnd: 'abc',
  }));
  assert.equal(page.origin + page.pathname, 'https://donpark2000.goatcounter.com/count');
  assert.deepEqual(Object.fromEntries(page.searchParams), {
    p: '/Web-Games/nim.html', t: 'Nim & co', r: 'https://example.com/a?b=1', s: '393,852,3', rnd: 'abc',
  });
  const ev = new URL(countUrl('donpark2000', { path: 'play-nim', event: true }));
  assert.deepEqual(Object.fromEntries(ev.searchParams), { p: 'play-nim', e: 'true' }, 'only what was given');
});

test('stats: a bad count is refused, not sent', () => {
  assert.throws(() => countUrl('x', { path: '' }), /no path/);
  assert.throws(() => countUrl('x', { path: '/play-nim', event: true }), /can't start with '\/'/);
  assert.throws(() => countUrl('x', { path: 'nim.html' }), /must start with '\/'/);
});

test('stats: the dashboard is the site code’s GoatCounter page', () => {
  assert.match(GOATCOUNTER, /^[a-z0-9-]+$/);
  assert.equal(statsPage(), `https://${GOATCOUNTER}.goatcounter.com/`);
});
