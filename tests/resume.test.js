// Coming back to where you left off (src/core/resume.js): one game in
// progress at most (opening a game or the home page clears the others),
// the old device keys removed, how a game's state is kept and read back,
// and the setup picks merged. A fake storage and log; nothing is written
// to disk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PAGES, GAMES, HOME, OLD_LAST_KEY, VISIT_KEY, clearGames, forgetOld, pack, unpack, mergeSetup, createResume, gameKey, visitTag, endVisit } from '../src/core/resume.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function fakeStorage(init = {}, { refuse = false } = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (refuse) throw new Error('QuotaExceededError'); m.set(k, String(v)); },
    removeItem: k => m.delete(k),
    get length() { return m.size; },
    key: i => [...m.keys()][i] ?? null,
  };
}
const fakeLog = () => { const lines = []; return { lines, add: (a, msg, d) => lines.push(`[${a}] ${msg} ${JSON.stringify(d)}`) }; };

test('resume: GAME_PAGES is every game page on the site', async () => {
  const pages = (await readdir(root)).filter(f => f.endsWith('.html') && f !== HOME && f !== 'log.html').sort();
  assert.deepEqual([...GAME_PAGES].sort(), pages);
});

test('resume: opening a game clears every other game’s; the home page clears them all', () => {
  assert.deepEqual(GAMES, GAME_PAGES.map(p => p.slice(0, -5)));
  const all = Object.fromEntries(GAMES.map(g => [gameKey(g), pack(1, { screen: 'play' }, 0)]));
  const storage = fakeStorage({ ...all, 'web-games-log': 'x', 'other': 'y' });
  assert.deepEqual(clearGames(storage, 'nim'), GAMES.filter(g => g !== 'nim'));
  assert.deepEqual([...storage.m.keys()].sort(), ['other', 'web-games-log', gameKey('nim')], 'only nim’s kept, and nothing else touched');
  assert.deepEqual(clearGames(storage, 'nim'), [], 'nothing more to clear');
  assert.deepEqual(clearGames(storage), ['nim'], 'the home page: all');
  assert.deepEqual([...storage.m.keys()].sort(), ['other', 'web-games-log']);
  assert.deepEqual(clearGames(null), [], 'no storage');
  assert.deepEqual(clearGames(fakeStorage({ [gameKey('nim')]: 'x' }, { refuse: true }), 'ttt').length, 1, 'removing still works when saving is refused');
});

test('resume: the old device keys (kept games, last page) are removed once; nothing else', () => {
  const storage = fakeStorage({
    [gameKey('nim')]: pack(1, { screen: 'play' }, 0), [gameKey('hidden-faces')]: 'x', [OLD_LAST_KEY]: 'nim.html',
    'web-games-hidden-faces': '{"next":{"6":3}}', 'web-games-log': '[]', 'web-games-sound': 'on',
  });
  assert.deepEqual(forgetOld(storage).sort(), [OLD_LAST_KEY, gameKey('hidden-faces'), gameKey('nim')]);
  assert.deepEqual([...storage.m.keys()].sort(), ['web-games-hidden-faces', 'web-games-log', 'web-games-sound'], 'Find the Stars’ progress kept');
  assert.deepEqual(forgetOld(storage), [], 'the second time: nothing');
  assert.deepEqual(forgetOld(null), [], 'no storage');
});

test('resume: games keep to the session’s storage; the home page clears and never goes back to a game', async () => {
  const ui = await readFile(path.join(root, 'src/ui/resume.js'), 'utf8');
  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.match(ui, /storage = window\.sessionStorage/);
  assert.doesNotMatch(ui.replace(/forgetOld\(window\.localStorage\)/, ''), /localStorage/, 'games kept on the device');
  assert.doesNotMatch(ui + home, /location\.replace|backToGame|last-page/, 'the home page still jumps back');
  assert.match(home, /homePage\(\);/);
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

// 3.11 (developer: "any version update ... should clear previous state").
test('resume: a game kept by another version (or before 3.11, by none) is not used', () => {
  const data = { screen: 'play', match: { turn: 3 } };
  assert.deepEqual(unpack(pack(1, data, 7, 'v2'), 1, 'v2'), { data, at: 7 });
  assert.deepEqual(unpack(pack(1, data, 7, 'v1'), 1, 'v2'), { data: null, why: 'kept by version v1' });
  assert.deepEqual(unpack(pack(1, data, 7), 1, 'v2'), { data: null, why: 'kept by version unknown' });
  const storage = fakeStorage(), log = fakeLog();
  createResume({ storage, game: 'nim', format: 1, log, version: 'v1' }).save(data);
  assert.deepEqual(createResume({ storage, game: 'nim', format: 1, log, version: 'v1' }).saved, data, 'the same version: picked up');
  assert.equal(createResume({ storage, game: 'nim', format: 1, log, version: 'v2' }).saved, null, 'a new version picked it up');
  assert.match(log.lines.at(-1), /kept game not used .*"why":"kept by version v1"/);
});

// 3.11: the visit a puzzle under way kept on the device belongs to.
test('resume: a visit lasts the session until the home page ends it; its tag holds the version', () => {
  const storage = fakeStorage();
  let n = 0;
  const make = () => `id${++n}`;
  assert.equal(visitTag(storage, 'v1', make), 'id1/v1');
  assert.equal(visitTag(storage, 'v1', make), 'id1/v1', 'the same visit on another page or a reload');
  assert.equal(visitTag(storage, 'v2', make), 'id1/v2', 'a new version: another tag');
  assert.equal(endVisit(storage), true);
  assert.equal(storage.getItem(VISIT_KEY), null);
  assert.equal(endVisit(storage), false, 'nothing to end');
  assert.equal(visitTag(storage, 'v1', make), 'id2/v1', 'after the home page: a new visit');
  assert.equal(visitTag(fakeStorage(), 'v1', make), 'id3/v1', 'a restart (a new session): a new visit');
  const refusing = fakeStorage({}, { refuse: true });
  assert.equal(visitTag(refusing, 'v1', make), 'id4/v1', 'storage refused: a visit all the same');
  assert.equal(visitTag(null, 'v1', make), 'id5/v1');
  assert.equal(endVisit(null), false);
});

test('resume: pages pass the version; the home page ends the visit; Laser Lab alone asks for it', async () => {
  const ui = await readFile(path.join(root, 'src/ui/resume.js'), 'utf8');
  assert.match(ui, /createResume\(\{ storage, game, format, log, version: VERSION \}\)/);
  const home = ui.match(/export function homePage\(\) \{[\s\S]*?\r?\n\}\r?\n/)?.[0] ?? '';
  assert.match(home, /const visitEnded = endVisit\(storage\);/);
  assert.match(home, /log\.add\('resume', 'home page', \{ how, cleared, visitEnded \}\);/);
  assert.match(ui, /export function visit\(\) \{\r?\n  tag \?\?= visitTag\(storage, VERSION\);/);
  const users = [];
  for (const f of await readdir(path.join(root, 'src/ui'))) {
    if (/\bvisit\(\)/.test(await readFile(path.join(root, 'src/ui', f), 'utf8')) && f !== 'resume.js') users.push(f);
  }
  assert.deepEqual(users, ['laser-lab.js'], 'another game keeps a puzzle under way on the device: drop it on a new visit too');
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
