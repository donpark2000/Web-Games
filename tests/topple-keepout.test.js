// Topple! Hardest's things not to hit (journal Q97; developer, 2026-11-14:
// "the ball turns into a heart and then explodes"; "Use the red slashed ring
// and the notice line"): which level and scene has one, where the scene
// check stands it, what a ball that hits it does in the physics, the scene it
// ends, and the words on the card. Seconds of physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEEP, KEEP_SCENES, KEEP_MODES, THINGS, KEEP_TRIES, KEEP_MIN, KEEP_MAX_SHARE, SHARES, OFFSETS, KEEP_NEAR, KEEP_ROOM,
  keepFor, keepoutParts, keepCandidates,
} from '../src/core/topple-keepout.js';
import { createWorld } from '../src/core/topple-world.js';
import { meetsThings } from '../src/core/topple-movers.js';
import {
  STEP, HAND, HEARTS, SCENES, MAX_LEVEL, MODES, createGame, sceneOver, newRound, useBall, update, endWords, launchVel, rng, sceneParts, layoutFor,
} from '../src/core/topple.js';

const BUILT = [1, 2, 3, 4, 5];   // the levels whose Hardest is built so far (all of them)

test('keepout: only Hardest, scenes 2 and 4, in the levels with a Hardest built; every thing named and worded', () => {
  assert.deepEqual(KEEP_MODES, ['hardest']);
  assert.deepEqual(KEEP_SCENES, [2, 4]);
  for (const mode of MODES) for (let level = 1; level <= MAX_LEVEL; level++) for (let scene = 1; scene <= SCENES; scene++) {
    const want = mode === 'hardest' && BUILT.includes(level) && (scene === 2 || scene === 4) ? KEEP[level] : null;
    assert.equal(keepFor(mode, level, scene), want, `${mode} level ${level} scene ${scene}`);
  }
  assert.deepEqual(Object.values(KEEP), ['nest', 'pane', 'lantern', 'pot', 'telescope']);
  for (const k of Object.values(KEEP)) {
    const t = THINGS[k];
    assert.ok(t && t.w > 0 && t.h > 0 && t.d > 0 && t.the && t.name, `${k} has a size and words`);
  }
});

test('keepout: its parts: a box on the ground to the physics, a prop for the drawing, a box for the view', () => {
  for (const thing of Object.keys(THINGS)) {
    const t = THINGS[thing], { body, prop, fit } = keepoutParts({ thing, x: 0.5, z: -3 });
    assert.equal(body.kind, 'keepout'); assert.equal(body.thing, thing);
    const [sh] = body.shapes;
    assert.equal(sh.type, 'box'); assert.deepEqual(sh.half, [t.w / 2, t.h / 2, t.d / 2]); assert.deepEqual(sh.at, [0.5, t.h / 2, -3]);
    assert.equal(prop.part, 'keepout'); assert.deepEqual(prop.at, [0.5, 0, -3]);
    assert.deepEqual(fit, [0.5, t.h / 2, -3, t.w / 2, t.h / 2, t.d / 2]);
  }
});

// every Hardest scene 2 and 4 of a few games in levels 1-3, made as the game makes them
const GAMES = [4242, 91011, 777, 31337];
const made = [];
for (const level of BUILT) for (const scene of KEEP_SCENES) for (const seed of GAMES) {
  const w = createWorld(), s = w.makeScene(seed, level, scene, null, 'hardest');
  made.push({ w, s, level, scene, seed });
}

test('keepout: each Hardest scene 2 and 4 (levels 1-3) has its level\'s thing, the check accepting it; in the physics, the props and the view', () => {
  assert.equal(made.length, BUILT.length * KEEP_SCENES.length * GAMES.length);
  for (const { w, s, level, scene, seed } of made) {
    const at = `level ${level} scene ${scene} game ${seed}`;
    assert.equal(s.layout.keepout?.thing, KEEP[level], at);
    assert.ok(s.check.ok, `${at}: ${s.check.why}`);
    // in the physics, the props, and the view's width
    const body = s.parts.bodies.filter(b => b.kind === 'keepout');
    assert.equal(body.length, 1, at);
    assert.equal(s.parts.props.filter(p => p.part === 'keepout').length, 1, at);
    assert.equal(w.statics.filter(o => o.body.kind === 'keepout').length, 1, at);
    const t = THINGS[KEEP[level]], { x, z } = s.layout.keepout;
    assert.ok(x - t.w / 2 >= s.parts.bounds.min[0] - 1e-9 && x + t.w / 2 <= s.parts.bounds.max[0] + 1e-9, `${at}: inside the view's width`);
    // on its own ground: clear of every block and the structure's footprint, nearer the hand than the structure
    for (const b of s.parts.blocks) assert.ok(Math.abs(x - b.x) >= b.w / 2 + t.w / 2 || Math.abs(z - b.z) >= b.d / 2 + t.d / 2, `${at}: clear of a block`);
    assert.ok(z < HAND.z - 1.5, `${at}: well away from the hand (z ${z})`);
    // in the way of some straight throws, not most; every block still hit from the front
    assert.ok(s.check.keep >= KEEP_MIN, `${at}: ${s.check.keep} throws at it`);
    assert.ok(s.check.keep <= KEEP_MAX_SHARE * s.check.clear, `${at}: ${s.check.keep} of ${s.check.clear} throws at it`);
    assert.equal(s.check.unhit, 0, `${at}: every block still hit from the front`);
    assert.ok(s.check.keepTried >= 1 && s.check.keepTried <= KEEP_TRIES, `${at}: full checks run ${s.check.keepTried}`);
  }
  // the cheap test sends nearly every scene's first full check through (journal: 1 in 71 of 72 tries in the probe)
  const tried = made.map(m => m.s.check.keepTried), mean = tried.reduce((a, b) => a + b, 0) / tried.length;
  assert.ok(mean <= 1.5, `the full check seldom refuses a place that passed the cheap test: mean ${mean.toFixed(2)} of ${tried.join(',')}`);
});

test('keepout: a scene made again is the same; the other scenes and the other how hards have none', () => {
  const a = made[0], again = createWorld().makeScene(a.seed, a.level, a.scene, null, 'hardest');
  assert.deepEqual(again.layout.keepout, a.s.layout.keepout, 'the same place for the same game, level and scene');
  const w = createWorld();
  for (const level of BUILT) {
    for (const scene of [1, 3, 5]) assert.equal(w.makeScene(4242, level, scene, null, 'hardest').layout.keepout, undefined, `level ${level} scene ${scene} (a mover's)`);
    for (const mode of ['normal', 'harder']) for (const scene of KEEP_SCENES) {
      const s = w.makeScene(4242, level, scene, null, mode);
      assert.equal(s.layout.keepout, undefined, `${mode} level ${level} scene ${scene}`);
      assert.ok(!s.parts.bodies.some(b => b.kind === 'keepout') && !s.parts.props.some(p => p.part === 'keepout'));
    }
  }
  // (every level's Hardest is built now: none without a thing to stand)
  assert.equal(BUILT.length, MAX_LEVEL);
});

test('keepout: the places are the scene\'s own, the same every time, off the blocks, the structure and other things; none when there is no room', () => {
  const { s } = made.find(m => m.level === 2 && m.scene === 2 && m.seed === 91011);   // 120 places offered
  const parts = sceneParts({ ...s.layout, keepout: undefined });
  const one = () => keepCandidates(parts, KEEP[1], HAND, rng(99), meetsThings(parts));
  const a = one(), b = one();
  assert.ok(a.length >= 20, `${a.length} places for the nest`);
  assert.deepEqual(a, b, 'the same order from the same seed');
  assert.notDeepEqual(keepCandidates(parts, KEEP[1], HAND, rng(100), meetsThings(parts)).map(c => c.x), a.map(c => c.x), 'another seed, another order');
  for (const c of a) {
    assert.ok(c.share >= KEEP_NEAR && SHARES.includes(c.share) && OFFSETS.includes(c.off), 'one of the offered places');
    assert.ok(Math.abs(c.x - parts.stand.x) >= parts.stand.w / 2 + THINGS.nest.w / 2 + KEEP_ROOM || Math.abs(c.z - parts.stand.z) >= parts.stand.d / 2 + THINGS.nest.d / 2 + KEEP_ROOM, 'off the structure');
  }
  // no room: a structure's footprint covering the whole view, or things everywhere
  assert.deepEqual(keepCandidates({ ...parts, stand: { ...parts.stand, w: 100, d: 100 } }, 'nest', HAND, rng(1)), [], 'the structure everywhere');
  assert.deepEqual(keepCandidates(parts, 'nest', HAND, rng(1), () => 'rock'), [], 'a thing everywhere');
  assert.deepEqual(keepCandidates({ ...parts, blocks: [] }, 'nest', HAND, rng(1)), [], 'no block to stand it by');
});

test('keepout: no place the check accepts: the layout is thrown away (not ok, and says why), never a scene with the thing in a bad place', () => {
  // a world whose scan finds nothing in the way: every candidate "hardly in the way" is refused by the cheap test
  const w = createWorld();
  const s = w.makeScene(4242, 2, 2, null, 'hardest');
  // the check on the same layout with the thing moved far off to the side: hardly in the way, refused
  const L = { ...s.layout, keepout: { thing: 'pane', x: s.parts.bounds.max[0] - 0.4, z: s.parts.stand.z - 8 } };
  const p = sceneParts(L); w.setScene(p);
  const c = w.check(L);
  assert.equal(c.ok, false);
  assert.match(c.why, /the thing not to hit is hardly in the way/, c.why);
  // just in front of a block: in the way of too many, or the check refuses it for what it hides; never accepted past the share
  const mid = s.parts.blocks[0];
  const L2 = { ...s.layout, keepout: { thing: 'pane', x: mid.x, z: mid.z + 1.2 } };
  w.setScene(sceneParts(L2));
  const c2 = w.check(L2);
  assert.ok(c2.ok ? c2.keep <= KEEP_MAX_SHARE * c2.clear : /too many throws|hard to hit|too little shows|mostly behind/.test(c2.why), `a pane just in front of a block: ${c2.ok} ${c2.keep} of ${c2.clear} ${c2.why}`);
  assert.equal(c2.ok && c2.why !== '', false);
});

// A straight throw whose first touch is the thing (the scan's), from the scene's own check
function throwAtThing(w, s) {
  for (let up = 0; up <= 70; up += 3) for (let a = -1; a <= 1.0001; a += 0.04) {
    const { vec } = launchVel(s.layout.power, a, up);
    if (w.trace(vec, 0).hits[0]?.kind === 'keepout') return vec;
  }
  return null;
}
function throwAtBlock(w, s) {
  for (let up = 0; up <= 70; up += 3) for (let a = -1; a <= 1.0001; a += 0.04) {
    const { vec } = launchVel(s.layout.power, a, up);
    if (w.trace(vec, 0).hits[0]?.kind === 'block') return vec;
  }
  return null;
}

test('keepout: a ball that hits the thing is stopped, never touches it twice, and tells the page once; one at a block does what it did', () => {
  for (const { s, level } of made.filter(m => m.scene === 2)) {
    const hits = [], w = createWorld({ onHit: h => { if (h.a === 'ball') hits.push({ b: h.b, thing: h.thing }); } });
    w.setScene(s.parts);
    const vec = throwAtThing(w, s), bv = throwAtBlock(w, s);   // (both before the thing goes: the path ahead leaves it out after)
    assert.ok(vec, `level ${level}: a throw that hits the thing first`);
    const ball = w.throwBall(vec);
    for (let k = 0; k < 360; k++) w.step(STEP);
    assert.equal(hits[0].b, 'keepout', `level ${level}: ${hits.map(h => h.b).join(', ')}`);
    assert.equal(hits[0].thing, KEEP[level]);
    assert.equal(hits.filter(h => h.b === 'keepout').length, 1, 'told once');
    assert.ok(ball.struck, 'marked struck (the page draws a heart in its place)');
    assert.equal(ball.collisionFilterMask, 0, 'touches nothing after');
    assert.equal(w.downCount(), 0, 'the thing, not the blocks, took it');
    // the thing is out of the world (it fell or shattered): the same throw again passes where it stood
    const ball2 = w.throwBall(vec);
    for (let k = 0; k < 360; k++) w.step(STEP);
    assert.equal(hits.filter(h => h.b === 'keepout').length, 1, 'gone: a second ball does not meet it');
    assert.ok(!ball2.struck, 'the second ball was not wasted');
    // the same throw with no thing there (the scene without it) goes on to a block, and a throw at a block never meets the thing first
    assert.ok(bv, 'a throw at a block');
    const w2 = createWorld({ onHit: h => { if (h.a === 'ball') hits.push({ b: h.b }); } });
    w2.setScene(s.parts); hits.length = 0;
    w2.throwBall(bv);
    for (let k = 0; k < 240; k++) w2.step(STEP);
    assert.ok(hits.some(h => h.b === 'block') && !hits.some(h => h.b === 'keepout'), `a throw at a block: ${hits.map(h => h.b).join(', ')}`);
  }
});

test('keepout: a hit wastes the ball and nothing more (Q112): the round goes on, no heart, the words as they were', () => {
  const r = newRound(5);
  useBall(r);
  // nothing in the round or the game knows of a hit: the scene is still open, nothing ends it, a win is still a win
  assert.equal(r.result, null);
  assert.deepEqual(update(r, 1, { down: 0, still: true }), { downChanged: false, ended: null, card: false });
  assert.deepEqual(update(r, 1, { down: 2, still: true }), { downChanged: true, ended: null, card: false });
  const g = createGame(5);
  assert.equal(g.hearts, HEARTS);
  assert.equal(endWords('lost', g, 'Teddy').title, 'Out of balls 💔');
  assert.equal(endWords('won', { hearts: 2 }, 'Teddy').title, 'Teddy cleared it! 💎');
});

test('keepout: the scene kept as JSON (a scene picked up again) draws the same thing in the same place', () => {
  const { s } = made[3];
  const back = JSON.parse(JSON.stringify(s.layout));
  assert.deepEqual(back.keepout, s.layout.keepout);
  const p = sceneParts(back);
  assert.deepEqual(p.bodies.filter(b => b.kind === 'keepout'), s.parts.bodies.filter(b => b.kind === 'keepout'));
  assert.deepEqual(p.bounds, s.parts.bounds);
  // and the layout's own seed gives the layout again, then the thing on top
  const fresh = layoutFor(4242, 1, 2);
  assert.equal(fresh.keepout, undefined, 'the layout alone has none: the scene check places it');
});
