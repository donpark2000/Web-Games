// Topple!'s worlds (Q122) and each world's tutorial (Q124, src/core/topple-tutorial.js),
// and how the page uses them (its source, as the other page tests). No browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  TUTORIALS, PRACTICE, startTutorial, tutorialStep, tutorialSteps, tutorialDid, readTaught, needsTutorial, markTaught,
} from '../src/core/topple-tutorial.js';
import { WORLDS, worldOf, worldLevels, levelInWorld, firstOfWorld, MAX_LEVEL, isMoonLevel, levelInfo, endWords, SCENES } from '../src/core/topple.js';
import { moonScene } from '../src/core/topple-moon.js';

const read = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const js = read('../src/ui/topple.js'), html = read('../topple.html'), css = read('../css/topple.css');

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

test('tutorial: each world has one, its steps in order, every block down the last (Q124)', () => {
  for (const w of WORLDS) {
    const T = TUTORIALS[w.id];
    assert.ok(T, `${w.name}: a tutorial`);
    assert.ok(T.title && T.steps.length >= 3, `${w.name}: a title and steps`);
    assert.equal(T.steps[0].until, 'press', 'first: a finger on the pad');
    assert.equal(T.steps.at(-1).until, 'clear', 'last: every block down');
    assert.ok(T.steps.some(s => s.until === 'throw'), 'a ball thrown or dropped');
    for (const s of T.steps) assert.ok(s.say.length > 8 && s.say.length < 80, `${w.name}: "${s.say}" fits the bar`);
    assert.ok(PRACTICE[w.id] && worldOf(PRACTICE[w.id].level) === w, `${w.name}: its practice scene in that world`);
  }
  assert.deepEqual(TUTORIALS.park.steps.map(s => s.until), ['press', 'aim', 'throw', 'clear']);
  assert.deepEqual(TUTORIALS.moon.steps.map(s => s.until), ['press', 'steer', 'turn', 'throw', 'clear']);
  assert.throws(() => startTutorial('mars'), /no tutorial for mars/);
});

test('tutorial: a step moves on only for what it waits for, in order; a short drag goes back; every block down finishes it', () => {
  const t = startTutorial('moon');
  assert.deepEqual([t.step, tutorialStep(t).until, tutorialSteps(t)], [0, 'press', 5]);
  assert.equal(tutorialDid(t, 'throw').moved, false, 'a drop before its step: a ball dropped, no step');
  assert.equal(tutorialDid(t, 'press').step, 1);
  assert.equal(tutorialDid(t, 'press').moved, false, 'a second press: nothing');
  assert.equal(tutorialDid(t, 'turn').moved, false, 'the turn before the steer: nothing');
  tutorialDid(t, 'steer'); tutorialDid(t, 'turn');
  assert.equal(tutorialStep(t).until, 'throw');
  tutorialDid(t, 'throw');
  assert.equal(tutorialDid(t, 'short').moved, false, 'a short drag after the throw is learnt: stays');
  assert.deepEqual([tutorialStep(t).until, t.done], ['clear', false]);
  assert.deepEqual(tutorialDid(t, 'clear'), { moved: false, done: true, step: 4 });
  assert.equal(tutorialDid(t, 'press').moved, false, 'done: nothing more');

  const p = startTutorial('park');
  tutorialDid(p, 'press'); tutorialDid(p, 'aim');
  assert.equal(tutorialStep(p).until, 'throw');
  assert.deepEqual(tutorialDid(p, 'short'), { moved: true, done: false, step: 0 }, 'let go too soon: from the top');
  assert.equal(tutorialDid(p, 'short').moved, false, 'at the top: stays');
  // cleared early (a first ball knocks all): done whatever the step
  const q = startTutorial('park');
  assert.deepEqual(tutorialDid(q, 'clear'), { moved: true, done: true, step: 3 });
});

test('tutorial: shown before a world\'s first scene until taught; the list kept is read safely', () => {
  assert.deepEqual(readTaught(null), []);
  assert.deepEqual(readTaught('park'), []);
  assert.deepEqual(readTaught(['park', 'park', 7, 'mars', 'moon']), ['park', 'moon']);
  assert.equal(needsTutorial([], 1), true);
  assert.equal(needsTutorial([], 6), true);
  assert.equal(needsTutorial(['park'], 3), false);
  assert.equal(needsTutorial(['park'], 6), true, 'the moon taught apart');
  assert.equal(needsTutorial(['park', 'moon'], 10), false);
  assert.equal(needsTutorial([], 99), false, 'no such level: none');
  const a = markTaught([], 'moon');
  assert.deepEqual(a, ['moon']);
  assert.equal(markTaught(a, 'moon'), a, 'taught once');
});

test('tutorial: the moon\'s practice scene is made like any other (the same each time)', () => {
  const P = PRACTICE.moon, a = moonScene(P.seed, P.level, P.scene), b = moonScene(P.seed, P.level, P.scene);
  assert.deepEqual(a, b);
  assert.ok(a.blocks.length > 0 && a.structures.length >= 1);
});

test('topple page: the tutorial before a world\'s first scene, from the map\'s gate too; nothing of the game kept (Q124)', () => {
  // first time: before startLevel does anything
  assert.match(js, /function startLevel\(n, scene = null\) \{\s*\/\/[^\n]*\n\s*if \(needsTutorial\(taught, n\) && isOpen\(game, n\)\) \{[^\n]*openTutorial\(worldOf\(n\)\.id, 'play', \(\) => startLevel\(n, scene\)\); return; \}/);
  // the gate's button (an open world only), and the road's click
  assert.match(js, /\(open \? `<button type="button" class="pill rhow" data-w="\$\{w\.id\}">🎯 \$\{TUTORIALS\[w\.id\]\.title\}<\/button>`/);
  assert.match(js, /const how = e\.target\.closest\?\.\('\.rhow'\);\s*if \(how\) \{ if \(!walking\) \{[^\n]*openTutorial\(how\.dataset\.w, 'map'\); \} return; \}/);
  // taught on done or Skip, kept on the device; Map leaves it untaught
  assert.match(js, /if \(how !== 'left'\) \{ taught = markTaught\(taught, t\.world\); saveTaught\(\); \}/);
  assert.match(js, /export const TAUGHT_KEY = 'web-games-topple-taught';/);
  assert.match(js, /if \(tut\) \{ endTutorial\(ended\?\.tut \? 'done' : 'left', true\); return; \}/);
  assert.match(js, /\$\('tutSkip'\)\.onclick = \(\) => endTutorial\('skipped'\);/);
  // free balls, no stars or hearts, not picked up again after a reload
  assert.equal((js.match(/if \(tut\) round\.used = 0;/g) ?? []).length, 2, 'a throw and a drop');
  assert.match(js, /function endScene\(result\) \{\s*\/\/[^\n]*\n\s*if \(tut\) \{[\s\S]*?return;\s*\}\s*const was = \{ \.\.\.game \};/, 'the practice ends before the game is touched');
  assert.match(js, /screen: playing && !tut \? 'play' : 'setup'/);
  // each step told by what the page sees
  for (const e of ["tutEvent('press', { how: 'pad' })", "tutEvent('press', { how: 'key' })", "tutEvent('aim'", "tutEvent('steer'", "tutEvent('turn'", "tutEvent('throw'", "tutEvent('short')", "tutEvent('clear')"]) assert.ok(js.includes(e), `told: ${e}`);
  for (const what of ["'tutorial: start'", "'tutorial: step'", "'tutorial: cleared'", '`tutorial: ${how}`', "'tutorial first: the world not taught yet'", "'map: a world\\'s tutorial'"]) assert.ok(js.includes(`L(${what}`), `not logged: ${what}`);
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
