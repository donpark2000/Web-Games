// Topple!'s blast ball (DESIGN.md "Topple!", The blast ball; journal Q130):
// the rules (src/core/topple-blast.js), the round's balls and stars, the list of
// scenes that offer it (written by tools/topple-stars.js: stale when the scenes'
// files change), and the page wired to them (as files, no browser).
// Hermetic: no files written, no clock.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as CANNON from '../src/vendor/cannon-es/cannon-es.js';
import {
  BLAST, POWER, BLAST_SCENES, reachAt, blastAt, gapTo, armBlast, offersBlast, parkGroups, moonPowerSpot, parkPowerSpot,
  newPower, powerClock, powerFrac, powerDue, powerStep, stillFlying, freeWords,
} from '../src/core/topple-blast.js';
import { BLAST_FROM } from '../src/core/topple-blast-scenes.js';
import { newRound, useBall, ballsLeft, canThrow, update, starsForBalls, BALLS, LEVELS, READY_AFTER, END_WAIT, rng } from '../src/core/topple.js';
import { MOON_LEVELS, LEVEL_TARGETS, moonScene, fallTime } from '../src/core/topple-moon.js';
import { createMoonWorld } from '../src/core/topple-moon-world.js';
import { createWorld } from '../src/core/topple-world.js';
import { blastFingerprint, BLAST_REDO } from '../tools/topple-stars.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = async f => (await readFile(path.join(root, f), 'utf8')).replace(/\r\n/g, '\n');

// A world of boxes standing at [x, z] (1 m tall, 0.4 across): { world, blocks } as either world's.
function boxes(spots) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  const blocks = spots.map(([x, z, down = false]) => {
    const body = new CANNON.Body({ mass: 1, shape: new CANNON.Box(new CANNON.Vec3(0.2, 0.5, 0.2)), position: new CANNON.Vec3(x, 0.5, z) });
    world.addBody(body);
    return { body, he: { x: 0.2, y: 0.5, z: 0.2 }, down };
  });
  return { world, blocks };
}
const speed = b => Math.hypot(b.body.velocity.x, b.body.velocity.z);

test('blast: its reach is its least (r) when it catches no block; every block standing (the farthest + spare, up to rMax) when it catches one', () => {
  const cfg = BLAST.park;
  // a block within r of the blast and two farther off, one down
  const W = boxes([[0.3, 0], [2, 0], [3, 0, true]]);
  const caught = reachAt(W, [0, 0.5, 0], cfg);
  assert.equal(caught.caught, true);
  assert.equal(caught.n, 2, 'the standing blocks counted (the one down left out)');
  assert.ok(Math.abs(caught.r - (2 + cfg.spare)) < 1e-9, `reaches the farthest standing block + spare: ${caught.r}`);
  const missed = reachAt(W, [-1.5, 0.5, 0], cfg);
  assert.equal(missed.caught, false);
  assert.equal(missed.r, cfg.r, 'no block within the least reach: the least reach');
  // capped at rMax
  const far = reachAt(boxes([[0.3, 0], [cfg.rMax + 5, 0]]), [0, 0.5, 0], cfg);
  assert.equal(far.r, cfg.rMax);
  // a block far above or below (beyond `column`) isn't counted
  const tall = boxes([[0.3, 0]]);
  tall.blocks[0].body.position.y = 0.5 + cfg.column + 1;
  assert.equal(reachAt(tall, [0, 0.5, 0], cfg).n, 0);
});

test('blast: kicks every block in its reach outward and up; counts the standing ones it knocked apart from those down already (the v2.3 card\'s 16 of 9)', () => {
  const W = boxes([[0.3, 0], [-1.2, 0.5], [1.8, 0, true], [9, 0]]);
  const b = blastAt(W, [0, 0.5, 0], BLAST.park, rng(3));
  assert.equal(b.caught, true);
  assert.equal(b.standing, 3, 'standing then: three (one down)');
  assert.equal(b.reached, 3, 'kicked: the three within its reach, the one down too');
  assert.equal(b.knocked, 2, 'of them standing: two');
  assert.ok(W.blocks[0].body.velocity.x > 0 && W.blocks[0].body.velocity.y > 0, 'outward (+x) and up');
  assert.ok(W.blocks[1].body.velocity.x < 0 && W.blocks[1].body.velocity.z > 0, 'outward (-x, +z)');
  assert.equal(speed(W.blocks[3]), 0, 'beyond its reach: not touched');
  assert.ok(speed(W.blocks[0]) > speed(W.blocks[1]), 'harder near the middle');
  // a missed blast: the least reach, nothing past it
  const M = boxes([[3, 0], [5, 0]]);
  const m = blastAt(M, [0, 0.5, 0], BLAST.park, rng(3));
  assert.deepEqual([m.caught, m.reached, m.knocked], [false, 0, 0]);
});

test('blast: a point\'s gap to a block\'s surface (boxes by their half sizes, 0 inside)', () => {
  const W = boxes([[0, 0]]);
  assert.equal(gapTo(W.blocks[0], new CANNON.Vec3(0, 0.5, 0)), 0);
  assert.ok(Math.abs(gapTo(W.blocks[0], new CANNON.Vec3(0.5, 0.5, 0)) - 0.3) < 1e-9);
  assert.ok(Math.abs(gapTo(W.blocks[0], new CANNON.Vec3(0, 1.4, 0)) - 0.4) < 1e-9);
});

test('blast: armed on the moon, it goes off once, where the ball first touches; the world\'s other listeners still hear the touch', () => {
  const hits = [];
  const W = createMoonWorld({ onHit: h => hits.push(h) });
  W.setScene({ blocks: [{ x: 0, y: 0.2, z: 0, w: 0.4, h: 0.4, d: 0.4, mat: 'crate' }, { x: 1.2, y: 0.2, z: 0, w: 0.4, h: 0.4, d: 0.4, mat: 'crate' }] });
  const ball = W.dropBall([0, 1.5, 0], [0, 0, 0]);
  const booms = [];
  const arm = armBlast(W, ball.body, BLAST.moon, at => booms.push({ at, ...blastAt(W, at, BLAST.moon, rng(5)) }));
  for (let i = 0; i < 240; i++) W.step(1 / 60);
  assert.equal(booms.length, 1, 'once');
  assert.ok(booms[0].at[1] < 0.6 && booms[0].at[1] > 0.3, `where it touched the crate's top: y ${booms[0].at[1]}`);
  assert.equal(booms[0].knocked, 2, 'it caught the crate under it: both crates reached');
  assert.ok(arm.done);
  assert.ok(hits.some(h => h.a === 'ball' && h.b === 'block'), 'the moon world\'s own listener heard the ball on the crate');
  arm.off();
});

test('blast: armed in the park, it goes off as it passes within the fuse of a standing block, before touching it', () => {
  const W = createWorld();
  const s = W.makeScene(1000, 5, 3, 'candles');
  assert.equal(s.layout.stack, 'candles');
  const target = W.blocks[0].body.position;
  // a ball moving slowly straight at the first candle from 0.5 m to its side
  const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(0.07), position: new CANNON.Vec3(target.x - 0.5, target.y, target.z) });
  body.velocity.set(1.5, 0, 0);
  W.world.gravity.set(0, 0, 0);
  W.world.addBody(body);
  let gap = null;
  armBlast(W, body, BLAST.park, () => { gap = gapTo(W.blocks[0], body.position) - 0.07; });
  for (let i = 0; i < 60 && gap === null; i++) W.world.step(1 / 120);
  assert.ok(gap !== null, 'went off');
  assert.ok(gap > 0 && gap <= BLAST.park.fuse + 0.02, `went off near, not touching: ${gap?.toFixed(3)} m from the candle`);
});

test('blast: the round: a blast ball won is a ball left, the next ball, free; your own balls and the stars as before', () => {
  const r = newRound(8);
  assert.deepEqual([r.blasts, r.blastsUsed], [0, 0]);
  for (let k = 0; k < 3; k++) { useBall(r); r.since = READY_AFTER; }
  assert.equal(ballsLeft(r), BALLS - 3);
  r.blasts = 1;
  assert.equal(ballsLeft(r), BALLS - 2, 'the blast ball is a ball left');
  const b = useBall(r);
  assert.deepEqual([b.ok, b.blast, r.used, r.blasts, r.blastsUsed], [true, true, 3, 0, 1], 'free: your own balls still 3');
  r.since = READY_AFTER;
  assert.equal(useBall(r).blast, undefined, 'the one after: your own again');
  assert.equal(r.used, 4);
  // won with 3 own balls and a blast ball: 3 stars (stars by your own balls)
  const w = newRound(2);
  useBall(w); w.since = READY_AFTER; useBall(w); w.since = READY_AFTER; useBall(w); w.blasts = 1; w.since = READY_AFTER; useBall(w);
  update(w, 1, { down: 2, still: true });
  assert.equal(w.result.won, true);
  assert.equal(w.result.balls, 3);
  assert.equal(starsForBalls(w.result.balls), 3);
});

test('blast: a scene isn\'t over while a blast ball won is left, even with your own 5 used', () => {
  const r = newRound(9);
  for (let k = 0; k < BALLS; k++) { useBall(r); r.since = READY_AFTER; }
  r.blasts = 1;
  assert.equal(canThrow(r).ok, true);
  r.since = END_WAIT + 1;
  assert.equal(update(r, 0.1, { down: 3, still: true }).ended, null, 'not lost: the blast ball to throw');
  r.blasts = 0;
  assert.equal(update(r, 0.1, { down: 3, still: true }).ended.won, false, 'without it: out of balls');
});

test('blast: the 💥 shows after your 2nd ball once still, or 5 s on still or not; not again once shown, won or gone', () => {
  const r = newRound(8);
  r.power = newPower();
  assert.equal(powerDue(r, true), false, 'no ball yet');
  useBall(r); r.since = 3;
  assert.equal(powerDue(r, true), false, 'one ball');
  r.since = READY_AFTER; useBall(r);
  r.since = 1;
  assert.equal(powerDue(r, true), false, 'the 2nd just thrown');
  r.since = 2;
  assert.equal(powerDue(r, true), true, 'the 2nd thrown, still');
  assert.equal(powerDue(r, false), false, 'something moving');
  r.since = POWER.stillMaxS;
  assert.equal(powerDue(r, false), true, `${POWER.stillMaxS} s on: still or not`);
  r.power.shown = true;
  assert.equal(powerDue(r, true), false);
  assert.equal(powerDue({ ...newRound(8), used: 2, since: 9, power: null }, true), false, 'not offered');
});

test('blast: the park\'s clock: 10 s, blinking for the last 3, gone at 10 unless a ball is on its way; won by a knock gives a blast ball', () => {
  const r = { ...newRound(8), power: { ...newPower(), shown: true, under: [1] } };
  for (let k = 0; k < 69; k++) powerStep(r, 'park', { dt: 0.1 });
  assert.equal(powerClock('park', r.power).warn, false, '6.9 s: not blinking');
  for (let k = 0; k < 2; k++) powerStep(r, 'park', { dt: 0.1 });
  assert.equal(powerClock('park', r.power).warn, true, '7.1 s: blinking');
  assert.ok(Math.abs(powerFrac('park', r.power) - 0.29) < 0.001);
  for (let k = 0; k < 28; k++) assert.equal(powerStep(r, 'park', { dt: 0.1 }), null);
  assert.equal(powerStep(r, 'park', { dt: 0.2, flying: true }), null, 'out of time, a ball on its way: it waits');
  assert.equal(powerStep(r, 'park', { dt: 0.1, flying: true, knocked: true }), 'won', 'the ball on its way wins it');
  assert.equal(r.blasts, 1);
  assert.equal(powerStep(r, 'park', { dt: 0.1, knocked: true }), null, 'won once');
  const g = { ...newRound(8), power: { ...newPower(), shown: true } };
  let e = null;
  for (let k = 0; k < 101 && !e; k++) e = powerStep(g, 'park', { dt: 0.1 });
  assert.equal(e, 'gone');
  assert.ok(g.power.t >= 10 - 1e-9 && g.power.t < 10.1 + 1e-9, `gone at 10 s (a step of 0.1 s): ${g.power.t}`);
  assert.equal(g.blasts, 0);
  assert.equal(powerStep(g, 'park', { dt: 0.1, knocked: true }), null, 'gone: not won after');
  assert.equal(stillFlying('park', 2), true);
  assert.equal(stillFlying('park', POWER.parkFlyS), false);
  assert.equal(stillFlying('moon', fallTime()), true);
  assert.equal(stillFlying('moon', fallTime() + POWER.moonFlyS + 0.01), false);
});

test('blast: the moon\'s clock: 3 passes, a pass the ring\'s sweep across by distance either way (⇄ costs nothing); its last pass blinks', () => {
  const r = { ...newRound(8), power: { ...newPower(), shown: true } };
  powerStep(r, 'moon', { moved: 7.5, passLen: 7.5 });
  powerStep(r, 'moon', { moved: -6.75, passLen: 7.5 });
  assert.ok(Math.abs(r.power.passes - 1.9) < 1e-9);
  assert.equal(powerClock('moon', r.power).warn, false, '1.9 passes: not blinking yet');
  powerStep(r, 'moon', { moved: 0.85, passLen: 7.5, dt: 50 });
  assert.equal(powerClock('moon', r.power).warn, true, 'its last pass: blinking (time alone doesn\'t count)');
  assert.equal(powerStep(r, 'moon', { moved: -7.5, passLen: 7.5 }), 'gone');
  assert.ok(r.power.passes >= 3 && r.power.passes < 3.02, `gone once 3 passes are done: ${r.power.passes}`);
  const t = { ...newRound(8), power: { ...newPower(), shown: true } };
  assert.equal(powerStep(t, 'moon', { moved: 2, passLen: 7.5, touched: true }), 'won', 'a ball through it wins it');
  assert.equal(t.blasts, 1);
  // a round that's over: nothing
  const o = { ...newRound(8), result: { won: true }, power: { ...newPower(), shown: true } };
  assert.equal(powerStep(o, 'moon', { moved: 30, passLen: 7.5 }), null);
});

test('blast: the 💥 floats over the part with the most blocks standing: the moon\'s structure, the park\'s group across', () => {
  // the moon: Launch Pad's challenge, every block standing, then that structure down
  const s = moonScene(1000, 10, 5), W = createMoonWorld();
  W.setScene(s);
  const sp = moonPowerSpot(W, s.structures);
  let k = 0;
  const sizes = s.structures.map(x => x.blocks.length), most = sizes.indexOf(Math.max(...sizes));
  const idx = s.structures.map(x => x.blocks.map(() => k++));
  assert.deepEqual(sp.under, idx[most], 'over the biggest structure, all its blocks under it');
  assert.ok(sp.at[1] > Math.max(...s.structures[most].blocks.map(b => b.y)), 'over its top');
  for (const i of idx[most]) W.blocks[i].down = true;
  const sp2 = moonPowerSpot(W, s.structures);
  assert.ok(!sp2.under.some(i => idx[most].includes(i)), 'that one down: over another');
  for (const r of W.blocks) r.down = true;
  assert.equal(moonPowerSpot(W, s.structures), null, 'nothing standing: nowhere');
  // the park: Star Light's candles (in two groups across); the 💥 over one, its blocks near the middle under it
  const P = createWorld();
  P.makeScene(1000, 5, 3, 'candles');
  const ps = parkPowerSpot(P);
  assert.ok(ps.under.length >= 1);
  for (const i of ps.under) assert.ok(Math.hypot(P.blocks[i].body.position.x - ps.at[0], P.blocks[i].body.position.z - ps.at[2]) < POWER.under);
  // groups: blocks within 0.5 m across together
  const g = parkGroups([{ x: 0, z: 0, y: 0.5, w: 0.2, h: 1 }, { x: 0.4, z: 0, y: 0.5, w: 0.2, h: 1 }, { x: 2, z: 0, y: 1, w: 0.2, h: 2 }]);
  assert.deepEqual(g.map(x => x.blocks), [[0, 1], [2]]);
  assert.equal(g[1].top, 2);
});

test('blast: the words for the free ball: "3 balls + 💥 free" (developer, 2026-11-19), none without one', () => {
  assert.equal(freeWords(3, 1), '3 balls + 💥 free');
  assert.equal(freeWords(1, 1), '1 ball + 💥 free');
  assert.equal(freeWords(2, 2), '2 balls + 2 💥 free');
  assert.equal(freeWords(4, 0), null);
});

test('blast: the list of scenes that offer it: by structure, each one dealt in its level, on known difficulties', () => {
  assert.ok(BLAST_SCENES.length > 0);
  // (each structure as the level deals it: its own targets in place, Q125)
  const moonPlans = n => { const l = MOON_LEVELS.find(x => x.n === n), sw = LEVEL_TARGETS[n]?.names ?? {}; return [...l.pool, ...l.challenges].map(p => p.map(x => sw[x.name] ?? x.name).join('+')); };
  for (const e of BLAST_SCENES) {
    const where = `${e.world} ${e.level} ${e.stack}`;
    const l = LEVELS[e.level - 1];
    assert.equal(l.world ?? 'park', e.world, `${where}: the level's world`);
    const names = e.world === 'moon' ? moonPlans(e.level) : [...(l.pool ?? []), ...(l.challenges ?? []), ...(l.spread ?? [])];
    assert.ok(names.includes(e.stack), `${where}: dealt in that level`);
    assert.ok(e.modes.length && e.modes.every(m => ['normal', 'harder', 'hardest'].includes(m)), `${where}: modes`);
    if (e.world === 'park' && e.modes.includes('normal')) assert.ok(e.modes.includes('harder'), `${where}: Harder deals Normal's park scenes`);
    for (const m of e.modes) assert.ok(offersBlast(e.level, e.stack, m));
  }
  assert.equal(offersBlast(1, 'bench', 'normal'), false);
  assert.equal(offersBlast(5, 'candles', 'nightmare'), false);
});

test('blast: the list is not stale: written by the tool from the scenes as they are now', async () => {
  const now = await blastFingerprint(root);
  assert.equal(BLAST_FROM.fingerprint, now, `src/core/topple-blast-scenes.js was made from other scenes (fingerprint ${BLAST_FROM.fingerprint}, now ${now}): run ${BLAST_REDO}`);
});

test('blast: the page: offered by the list, its first meeting taught once a device, the tally and the card show it free, logged', async () => {
  const page = await read('topple.html'), js = await read('src/ui/topple.js'), css = await read('css/topple.css');
  // the teaching card, the toast, the end card's line
  assert.match(page, /id="blastTeach"[\s\S]*New: the blast ball![\s\S]*id="btGo"/);
  assert.match(page, /id="blastToast"/);
  assert.match(page, /id="overBlast"/);
  for (const c of ['.blasttoast', '.over.blastteach', '.overblast', '.balls .blastchip']) assert.ok(css.includes(c), c);
  // offered only where the list says, kept in the round
  assert.match(js, /round\.power = offersBlast\(lv, stack, playMode\(\)\) \? newPower\(\) : null/);
  assert.match(js, /if \(p && !tut && powerDue\(round, W\.still\(\)\)\) blastShow\(\)/);
  // taught once a device (kept), the clock waiting and no ball meanwhile
  assert.match(js, /BLAST_TAUGHT_KEY = 'web-games-topple-blast-taught'/);
  assert.match(js, /const ready = \(\) => !!\(round && !busy && !bl\.teach && canThrow\(round\)\.ok\)/);
  assert.match(js, /powerUp\(p\) && !bl\.teach && !round\.result/);
  // both worlds arm their blast balls; both frames tick it
  assert.match(js, /if \(r\.blast\) blastArm\(dropped\.body\)/);
  assert.match(js, /if \(r\.blast\) blastArm\(body\)/);
  assert.equal(js.match(/blastTick\(dt\);/g)?.length, 2);
  assert.equal(js.match(/\n  blastSetup\(\);/g)?.length, 2, 'both scene makers');
  // the tally draws your own balls, the blast ball as "free"; the card: "3 balls + 💥 free = 3 stars", no Aced with its help
  assert.match(js, /const left = BALLS - r\.used;/);
  assert.match(js, /💥 free<\/b>/);
  assert.match(js, /freeWords\(ended\.balls, ended\.blasts\)/);
  assert.match(js, /ended\.balls === 1 && !ended\.blasts/);
  // logged: offered or not, shows, taught, won, gone, on its way, the blast with what it knocked
  for (const m of ['blast: not offered here', 'blast: offered here', 'blast: the 💥 shows', 'blast: taught (Got it)', 'blast: won', 'blast: the 💥 gone, not won', 'blast ball: on its way']) assert.ok(js.includes(`'${m}'`), m);
  assert.match(js, /L\('blast', \{ at: at\.map\(r2\), knocked: b\.knocked, standing: b\.standing/);
  // no mockup left
  assert.doesNotMatch(js, /MOCK\b|testStart|window\.__blast/);
  assert.doesNotMatch(page, /Send to Claude|mockScenes|testCard/);
});
