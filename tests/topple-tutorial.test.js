// Topple!'s worlds (Q122) and each world's tutorial (Q124, then Q129 in 11.2:
// src/core/topple-tutorial.js), and how the page uses them (its source, as
// the other page tests). Each part's stack is played in the physics: it can
// be hit, and only with the control the part teaches. No browser, no clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TUTORIALS, startTutorial, tutorialPart, tutorialParts, tutorialSay, partCleared, nextPart, lastPart,
  PARK_AT, PARK_POWER, parkPracticeLayout, parkPracticeParts, MOON_AT, MOON_SPAN, moonPracticeScene, moonPracticeLander,
  readTaught, needsTutorial, markTaught,
} from '../src/core/topple-tutorial.js';
import { WORLDS, worldOf, worldLevels, levelInWorld, firstOfWorld, MAX_LEVEL, isMoonLevel, levelInfo, endWords, SCENES, launchVel, HAND } from '../src/core/topple.js';
import { createWorld } from '../src/core/topple-world.js';
import { flyStep, steerTo, turnNow, flyTo, ringX, dropPath, moonMode, LANDER_Y, DROP_BELOW, Z_START, TURN_PAST } from '../src/core/topple-moon.js';

const read = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const js = read('../src/ui/topple.js'), html = read('../topple.html'), css = read('../css/topple.css');
const sceneJs = read('../src/ui/topple-scene.js'), moonJs = read('../src/ui/topple-moon.js');

test('worlds: every level in one world, numbered 1-5 within it; the moon\'s first is 1 (Q122)', () => {
  let seen = 0;
  for (const w of WORLDS) {
    const lvs = worldLevels(w);
    assert.equal(lvs.length, 5, `${w.name}: 5 levels`);
    lvs.forEach((lv, i) => { assert.equal(worldOf(lv), w); assert.equal(levelInWorld(lv), i + 1); assert.equal(firstOfWorld(lv), i === 0); });
    seen += lvs.length;
  }
  assert.equal(seen, MAX_LEVEL, 'every level counted once');
  assert.deepEqual([worldOf(1).id, worldOf(5).id, worldOf(6).id, worldOf(10).id], ['park', 'park', 'moon', 'moon']);
  assert.deepEqual([levelInWorld(6), levelInWorld(10)], [1, 5]);
  for (let lv = 1; lv <= MAX_LEVEL; lv++) assert.equal(worldOf(lv).id === 'moon', isMoonLevel(lv), `level ${lv}: world and isMoonLevel agree`);
  // no such level: none
  for (const lv of [0, MAX_LEVEL + 1, NaN]) { assert.equal(worldOf(lv), null); assert.equal(levelInWorld(lv), 0); assert.ok(!firstOfWorld(lv)); }
});

test('worlds: a level done says its number within the world; the last of a world goes on to the next world', () => {
  const g = lv => ({ level: lv, hearts: 3, jewels: SCENES });
  assert.deepEqual(endWords('level', g(2), 'Teddy'), { title: `Level 2 done! ${'💎'.repeat(SCENES)}`, sub: `On to ${levelInfo(3).name}`, next: 'Level 3 ▸' });
  assert.deepEqual(endWords('level', g(5), 'Teddy'), { title: `Level 5 done! ${'💎'.repeat(SCENES)}`, sub: 'On to The Moon', next: 'The Moon ▸' });
  assert.deepEqual(endWords('level', g(7), 'Teddy'), { title: `Level 2 done! ${'💎'.repeat(SCENES)}`, sub: `On to ${levelInfo(8).name}`, next: 'Level 3 ▸' });
});

test('tutorial: each world has three parts, each needing one more control; the words fit the bar (Q129)', () => {
  assert.deepEqual(TUTORIALS.park.parts.map(p => p.id), ['ahead', 'side', 'far']);
  assert.deepEqual(TUTORIALS.moon.parts.map(p => p.id), ['line', 'far', 'turn']);
  for (const w of WORLDS) {
    const T = TUTORIALS[w.id];
    assert.ok(T.title, `${w.name}: a title`);
    assert.equal(tutorialParts(w.id), 3);
    for (const p of T.parts) {
      assert.ok(p.say.length > 20 && p.say.length <= 80, `${w.name} ${p.id}: "${p.say}" fits the bar`);
      assert.ok(p.name, `${w.name} ${p.id}: a name for the card before it`);
      if (p.keys) assert.ok(`${p.say} (${p.keys})`.length <= 100, `${w.name} ${p.id}: with its keys`);
    }
  }
  // the moon's keys on a computer; never the park's (a drag)
  assert.ok(TUTORIALS.moon.parts.every(p => p.keys) && TUTORIALS.park.parts.every(p => !p.keys));
  const t = startTutorial('moon');
  assert.equal(tutorialSay(t), TUTORIALS.moon.parts[0].say);
  assert.equal(tutorialSay(t, true), `${TUTORIALS.moon.parts[0].say} (or press Space)`);
  assert.throws(() => startTutorial('mars'), /no tutorial for mars/);
});

test('tutorial: a part cleared waits for Next; Next goes on to the next part; the last is the end', () => {
  const t = startTutorial('park');
  assert.deepEqual([t.part, t.cleared, tutorialPart(t).id, lastPart(t)], [0, false, 'ahead', false]);
  assert.deepEqual(partCleared(t), { last: false });
  assert.equal(t.cleared, true);
  assert.equal(nextPart(t), true);
  assert.deepEqual([t.part, t.cleared, tutorialPart(t).id], [1, false, 'side']);
  nextPart(t);
  assert.deepEqual([tutorialPart(t).id, lastPart(t)], ['far', true]);
  assert.deepEqual(partCleared(t), { last: true });
  assert.equal(nextPart(t), false, 'no part after the last');
  assert.equal(t.part, 2);
});

test('tutorial: only as a world\'s first level is entered, until taught on this device; the list kept is read safely', () => {
  assert.deepEqual(readTaught(null), []);
  assert.deepEqual(readTaught('park'), []);
  assert.deepEqual(readTaught(['park', 'park', 7, 'mars', 'moon']), ['park', 'moon']);
  assert.equal(needsTutorial([], 1), true);
  assert.equal(needsTutorial([], 6), true);
  assert.equal(needsTutorial([], 3), false, 'not a world\'s first level (11.1: any level of a world not taught)');
  assert.equal(needsTutorial([], 7), false);
  assert.equal(needsTutorial(['park'], 1), false);
  assert.equal(needsTutorial(['park'], 6), true, 'the moon taught apart');
  assert.equal(needsTutorial(['park', 'moon'], 6), false);
  assert.equal(needsTutorial([], 99), false, 'no such level: none');
  const a = markTaught([], 'moon');
  assert.deepEqual(a, ['moon']);
  assert.equal(markTaught(a, 'moon'), a, 'taught once');
});

// The park's parts, scanned as the scene check scans (src/core/topple-world.js
// check): up 0-70° by 1°, the aim across by 0.02; the throws whose first
// touch is a block of the stack.
function parkHits(id) {
  const W = createWorld(), p = parkPracticeParts(id);
  W.setScene(p);
  const hits = [];
  for (let up = 0; up <= 70; up += 1) for (let a = -1; a <= 1.0001; a += 0.02) {
    const h = W.trace(launchVel(p.power, a, up).vec, 0).hits[0];
    if (h?.kind === 'block') hits.push({ up, a: +a.toFixed(2) });
  }
  return { hits, p, W };
}
test('tutorial, the park: bare, a stack of 3 a part; ahead flat and straight, the side one only by aiming, the far one only higher', () => {
  const r = Object.fromEntries(Object.keys(PARK_AT).map(id => [id, parkHits(id)]));
  for (const [id, { hits, p, W }] of Object.entries(r)) {
    assert.equal(p.blocks.length, 3, `${id}: 3 blocks`);
    assert.equal(p.bodies.length, 0, `${id}: nothing in the way (no bush, tree or board)`);
    assert.ok(hits.length >= 100, `${id}: ${hits.length} throws hit it`);
    assert.equal(p.power, PARK_POWER, `${id}: the same strength in every part`);
    const b = p.blocks[0];
    assert.ok(Math.hypot(b.x - HAND.x, b.z - HAND.z) < W.far - 1, `${id}: well inside a throw's reach`);
    assert.equal(parkPracticeLayout(id).things.length, 0);
  }
  // the same view in every part: the new stack shows up elsewhere in it
  assert.deepEqual(r.side.p.bounds, r.ahead.p.bounds);
  assert.deepEqual(r.far.p.bounds, r.ahead.p.bounds);
  // ahead: a straight drag (aim within 0.15 of the middle), up a little (under 20°)
  assert.ok(r.ahead.hits.every(h => Math.abs(h.a) <= 0.15 && h.up < 20), `ahead: ${JSON.stringify(r.ahead.hits.slice(0, 3))}`);
  // the side: never hit straight ahead, only aimed left
  assert.ok(r.side.hits.every(h => h.a <= -0.5), 'the side one needs the aim');
  // far: never by the throws that hit the near one at their flattest; it takes a higher drag
  const flat = Math.min(...r.ahead.hits.map(h => h.up)), farLow = Math.min(...r.far.hits.map(h => h.up));
  assert.ok(farLow >= flat + 10, `far needs at least 10° more: ${farLow}° vs ${flat}°`);
  assert.ok(!r.far.hits.some(h => h.up <= 8), 'a flat throw falls short of it');
  assert.throws(() => parkPracticeLayout('mars'), /no part mars/);
});

// The moon's parts: the lander flown (the game's flyStep), dropping when the
// ring is over the stack (dropPath, as the page's ring): `steer` the
// distance flown to first, `turnAt` s when ⇄ is tapped (null: never).
function moonRun(id, { steer = null, turnAt = null, s = 40 } = {}) {
  const sc = moonPracticeScene(id), speed = moonMode('normal').speed, f = moonPracticeLander(id, speed);
  if (steer != null) steerTo(f, steer);
  const boxes = sc.blocks.map(b => [b.x - b.w / 2, b.y - b.h / 2, b.z - b.d / 2, b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2]);
  let hitAt = null, waits = 0;
  const rings = [];
  for (let t = 0; t < s; t += 1 / 60) {
    if (turnAt != null && Math.abs(t - turnAt) < 1 / 120) turnNow(f);
    if (flyStep(f, 1 / 60, sc.span) === 'waits') waits++;
    rings.push(ringX(f));
    if (hitAt == null && dropPath([f.x, LANDER_Y - DROP_BELOW, f.z], f.vx, boxes).hit != null) hitAt = t;
  }
  return { hitAt, waits, f, rings, sc };
}
test('tutorial, the moon: bare, a stack of 3 a part; on the line a drop reaches it, far only once steered, the turn only after ⇄', () => {
  for (const id of Object.keys(MOON_AT)) {
    const sc = moonPracticeScene(id);
    assert.equal(sc.blocks.length, 3, `${id}: 3 crates`);
    assert.deepEqual(sc.span, MOON_SPAN, `${id}: the same run (the same view)`);
    assert.equal(sc.ledges.length, 0);
  }
  // the line: the ring comes over it within 10 s, as the lander flies in
  const line = moonRun('line');
  assert.ok(line.hitAt != null && line.hitAt < 10, `the line: over it at ${line.hitAt} s`);
  // far: never at the distance it starts at (it flies to and fro over the line); once steered there, yes
  assert.equal(moonRun('far').hitAt, null, 'far: not without steering');
  const far = moonRun('far', { steer: MOON_AT.far.z });
  assert.ok(far.hitAt != null, 'far: once steered farther');
  // the turn: the ring starts just past the stack, going away; the lander waits at the end, never coming back by itself
  const stay = moonRun('turn');
  assert.equal(stay.hitAt, null, 'the turn: never without ⇄');
  assert.equal(stay.waits, 1, 'it waits at the end');
  assert.ok(stay.rings[0] > MOON_AT.turn.x && stay.rings.every((x, i) => i === 0 || x >= stay.rings[i - 1] - 1e-9), 'the ring only goes away from it');
  assert.ok(Math.abs(Math.max(...stay.rings) - (MOON_SPAN[1] + TURN_PAST)) < 0.05, 'stopping at the end of the run');
  const back = moonRun('turn', { turnAt: 6 });
  assert.ok(back.hitAt != null && back.hitAt > 6, `⇄ at 6 s: over it at ${back.hitAt} s`);
  // ← → turn it too; the one it heads already, nothing
  const g = moonPracticeLander('turn', 1);
  for (let k = 0; k < 600; k++) flyStep(g, 1 / 60, MOON_SPAN);
  assert.equal(g.waiting, true);
  assert.equal(flyTo(g, 1), false);
  assert.equal(flyTo(g, -1), true);
  assert.equal(g.waiting, false);
  assert.equal(g.ringV, -1);
  // in play the lander never waits
  assert.equal(moonPracticeLander('line', 1).ends, undefined);
  assert.equal(Z_START, MOON_AT.line.z, 'the line: where the lander starts');
  assert.throws(() => moonPracticeScene('mars'), /no part mars/);
});

test('topple page: the tutorial as a world\'s first level is entered, in parts with Next and Skip; none on the map; nothing of the game kept (Q129)', () => {
  // first time: before startLevel does anything
  assert.match(js, /function startLevel\(n, scene = null\) \{\s*\/\/[^\n]*\n\s*if \(needsTutorial\(taught, n\) && isOpen\(game, n\)\) \{[^\n]*openTutorial\(worldOf\(n\)\.id, \(\) => startLevel\(n, scene\)\); return; \}/);
  // no tutorial on the map (11.1: the gate's 🎯 button)
  assert.doesNotMatch(js, /rhow|openTutorial\([^)]*'map'\)/);
  // a new list kept (so everyone sees the new tutorials once); 11.1's let go of
  assert.match(js, /export const TAUGHT_KEY = 'web-games-topple-taught-2';/);
  assert.match(js, /const TAUGHT_KEY_11_1 = 'web-games-topple-taught';/);
  assert.match(js, /storage\.removeItem\(TAUGHT_KEY_11_1\)/);
  // taught on done or Skip; Map leaves it untaught unless the last part was cleared
  assert.match(js, /if \(how !== 'left'\) \{ taught = markTaught\(taught, t\.world\); saveTaught\(\); \}/);
  assert.match(js, /if \(tut\) \{ endTutorial\(ended\?\.tut && ended\.last \? 'done' : 'left', true\); return; \}/);
  assert.match(js, /\$\('tutSkip'\)\.onclick = \(\) => endTutorial\('skipped'\);/);
  // a part's card: Next ▸ (a new part) and Skip; the last: Let's go ▸ alone
  assert.match(js, /if \(ended\?\.tut\) \{\s*if \(ended\.last\) \{ endTutorial\('done'\); return; \}\s*nextPart\(tut\);/);
  assert.match(js, /\$\('newBtn'\)\.textContent = ended\.tut \? 'Skip' : 'New game';\s*\$\('newBtn'\)\.hidden = !!ended\.tut && !!ended\.last;/);
  assert.match(js, /\$\('newBtn'\)\.onclick = \(\) => \{\s*if \(ended\?\.tut\) \{ endTutorial\('skipped'\); return; \}/);
  assert.match(js, /next: 'Let’s go ▸'/);
  assert.match(js, /next: 'Next ▸'/);
  // the parts' scenes: bare
  assert.match(js, /stage\.setBare\(!!tut\);/);
  assert.match(js, /const parts = parkPracticeParts\(part\);\s*world\.setScene\(parts\);/);
  assert.match(js, /const look = spec\.part \? 'bare' : lv;/);
  assert.match(js, /mo\.f = spec\.part \? moonPracticeLander\(spec\.part, /);
  assert.match(sceneJs, /setBare\(on\) \{ bare = !!on; farGroup\.visible = birdGroup\.visible = !bare; return bare; \},/);
  assert.match(moonJs, /base = n === 'bare' \? null : moonBase\(S, n\);/);
  // the keys on a computer
  assert.match(js, /\$\('tutSay'\)\.textContent = tutorialSay\(tut, keysToo\(\)\);/);
  // free balls, no stars or hearts, not picked up again after a reload
  assert.equal((js.match(/if \(tut\) \{ round\.used = 0; tut\.balls = /g) ?? []).length, 2, 'a throw and a drop');
  assert.match(js, /function endScene\(result\) \{\s*\/\/[^\n]*\n\s*if \(tut\) \{[\s\S]*?return;\s*\}\s*const was = \{ \.\.\.game \};/, 'the practice ends before the game is touched');
  assert.match(js, /screen: playing && !tut \? 'play' : 'setup'/);
  // 11.1's steps gone
  assert.doesNotMatch(js, /tutEvent|tutorialStep\b|STEER_TAUGHT_M|PRACTICE/);
  for (const what of ["'tutorial: start'", "'tutorial: a part cleared'", "'tutorial: next part'", '`tutorial: ${how}`', "'tutorial first: the world not taught yet'", "'lander waits at the end for ⇄ (the tutorial)'"]) assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
  // the bar over the park
  assert.match(html, /<div class="tut" id="tut" role="status" aria-live="polite" hidden>[\s\S]*?id="tutSay"[\s\S]*?id="tutSkip">Skip<\/button>/);
  assert.match(css, /\n\.tut\[hidden\] \{ display: none; \}/);
});

test('topple page: the map\'s worlds: a gate each, the road broken between, levels numbered within (Q122)', () => {
  assert.match(js, /if \(roadJoins\(a, b\)\) h \+= `<line /);
  assert.match(js, /for \(const g of geo\.gates\) \{/);
  assert.match(js, /<b>World \$\{w\.n\} · \$\{w\.name\}<\/b>/);
  assert.match(js, /<b>\$\{levelTag\(b\.lv\)\}<\/b>/);
  assert.match(css, /\n\.rgate\.moon \{/);
  assert.match(css, /\n\.rgate\.park \{/);
});
