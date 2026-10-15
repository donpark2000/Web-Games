// Coming back to where you left off (src/core/resume.js): when the home
// page goes back to a game, how a game's state is kept and read back, and
// the setup picks merged. A fake storage and log; nothing is written to
// disk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PAGES, HOME, returnTo, pack, unpack, mergeSetup, createResume, gameKey } from '../src/core/resume.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function fakeStorage(init = {}, { refuse = false } = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (refuse) throw new Error('QuotaExceededError'); m.set(k, String(v)); },
    removeItem: k => m.delete(k),
  };
}
const fakeLog = () => { const lines = []; return { lines, add: (a, msg, d) => lines.push(`[${a}] ${msg} ${JSON.stringify(d)}`) }; };

test('resume: GAME_PAGES is every game page on the site', async () => {
  const pages = (await readdir(root)).filter(f => f.endsWith('.html') && f !== HOME && f !== 'log.html').sort();
  assert.deepEqual([...GAME_PAGES].sort(), pages);
});

test('resume: the app opened by its icon goes back to the game left', () => {
  const base = { last: 'nim.html', app: true, navType: 'navigate', fromSite: false };
  assert.equal(returnTo(base), 'nim.html');
  assert.equal(returnTo({ ...base, navType: 'reload' }), 'nim.html', 'a reload of the start page');
  assert.equal(returnTo({ ...base, last: 'hidden-faces.html' }), 'hidden-faces.html');
});

test('resume: the home page stays: a browser tab, back, a link on the site, 🏠, or nothing left', () => {
  const base = { last: 'nim.html', app: true, navType: 'navigate', fromSite: false };
  const cases = [
    [{ app: false }, 'a browser tab'],
    [{ navType: 'back_forward' }, 'back to the home page (Android back)'],
    [{ fromSite: true }, 'a link on the site'],
    [{ last: HOME }, 'left with 🏠'],
    [{ last: null }, 'nothing kept'],
    [{ last: 'log.html' }, 'the log page'],
    [{ last: 'https://example.com/' }, 'not one of our pages'],
  ];
  for (const [change, why] of cases) assert.equal(returnTo({ ...base, ...change }), null, why);
});

test('resume: kept data reads back; other formats, junk and nothing are not used', () => {
  const data = { screen: 'play', setup: { p1: 'bear' }, match: { board: [0, 1, 2] } };
  assert.deepEqual(unpack(pack(2, data, 1000), 2), { data, at: 1000 });
  assert.deepEqual(unpack(null, 2), { data: null, why: 'none' });
  assert.deepEqual(unpack('{not json', 2), { data: null, why: 'unreadable' });
  assert.deepEqual(unpack(pack(1, data, 1000), 2), { data: null, why: 'old format 1' });
  assert.deepEqual(unpack(JSON.stringify({ format: 2, at: 1, data: { setup: {} } }), 2), { data: null, why: 'empty' });
  assert.deepEqual(unpack('null', 2), { data: null, why: 'old format undefined' });
});

test('resume: setup picks merge by the page\'s keys and kinds only', () => {
  const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt', size: 6 };
  mergeSetup(setup, { vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 7, size: 8, extra: 'x' });
  assert.deepEqual(setup, { vsRobot: false, p1: 'cat', p2: 'dog', firstRule: 'alt', size: 8 });
  mergeSetup(setup, { p2: null });
  assert.equal(setup.p2, null, 'a face can go back to unpicked');
  assert.doesNotThrow(() => mergeSetup(setup, null));
  assert.doesNotThrow(() => mergeSetup(setup, 'junk'));
});

test('resume: a game keeps its state and finds it next time; logged once per screen', () => {
  const storage = fakeStorage(), log = fakeLog();
  let t = 0;
  const a = createResume({ storage, game: 'nim', format: 1, log, now: () => t });
  assert.equal(a.saved, null);
  assert.deepEqual(log.lines, [], 'nothing kept: nothing to say');
  assert.equal(a.save({ screen: 'setup', setup: { p1: 'cat' } }), true);
  assert.equal(a.save({ screen: 'play', match: { turn: 1 } }), true);
  assert.equal(a.save({ screen: 'play', match: { turn: 2 } }), true);
  assert.deepEqual(log.lines, ['[resume] keeping {"game":"nim","screen":"setup"}', '[resume] keeping {"game":"nim","screen":"play"}']);
  t = 5 * 60000;
  const b = createResume({ storage, game: 'nim', format: 1, log, now: () => t });
  assert.deepEqual(b.saved, { screen: 'play', match: { turn: 2 } });
  assert.match(log.lines.at(-1), /kept game found .*"screen":"play","keptMinsAgo":5/);
  assert.equal(createResume({ storage, game: 'ttt', format: 1, log }).saved, null, 'another game\'s is its own');
  b.clear();
  assert.equal(storage.getItem(gameKey('nim')), null);
});

test('resume: an old format is left alone and logged; refused storage is logged once', () => {
  const storage = fakeStorage({ [gameKey('nim')]: pack(1, { screen: 'play' }, 0) }), log = fakeLog();
  const r = createResume({ storage, game: 'nim', format: 2, log });
  assert.equal(r.saved, null);
  assert.match(log.lines[0], /kept game not used .*old format 1/);
  const full = fakeStorage({}, { refuse: true }), log2 = fakeLog();
  const f = createResume({ storage: full, game: 'nim', format: 1, log: log2 });
  assert.equal(f.save({ screen: 'play' }), false);
  assert.equal(f.save({ screen: 'play' }), false);
  assert.equal(log2.lines.length, 1);
  assert.match(log2.lines[0], /not kept \(storage refused\)/);
  const none = createResume({ storage: null, game: 'nim', format: 1, log: fakeLog() });
  assert.equal(none.saved, null);
  assert.doesNotThrow(() => none.save({ screen: 'setup' }));
});
