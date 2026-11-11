// The 3D games' physics stepping (src/core/fixed-step.js; Q65): fixed steps
// with the time short of a step carried over, at most MAX_SUBSTEPS a call;
// the clock read only when one is handed over. A busy machine (a clock that
// runs fast) doesn't change a throw in either game, where it does change
// cannon-es's own world.step (the old stepping); given the clock, the stepper
// does what cannon-es's own step does (the game's behaviour kept). Seconds of
// physics, nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixedStepper } from '../src/core/fixed-step.js';
import { createStall, STEP as TCA_STEP, MAX_SUBSTEPS as TCA_MAX } from '../src/core/tin-can-alley-physics.js';
import { createMatch, throwBall, update, cameraAt } from '../src/core/tin-can-alley.js';
import { createWorld, MAX_SUBSTEPS as TP_MAX } from '../src/core/topple-world.js';
import { STEP as TP_STEP, HAND, MAX_AIM, R2D, ALL_KINDS, launchVel, makeLayout, sceneSeed, sceneOpts, sceneParts } from '../src/core/topple.js';

const DT = 1 / 60;

// performance.now replaced while `body` runs (cannon-es reads it).
function withClock(now, body) {
  performance.now = now;
  try { return body(); } finally { delete performance.now; }
}
// A machine so busy every read of the clock is 20 ms on (a step "takes" 20 ms).
const busyClock = () => { let t = 0; return () => (t += 20); };

// A world that only counts its steps.
const countingWorld = () => ({ steps: 0, time: 0, internalStep(dt) { this.steps++; this.lastDt = dt; } });

test('fixed step: steps of `step` s, the rest carried over, at most `max` a call', () => {
  const w = countingWorld(), advance = fixedStepper(w, 1 / 120, 8);
  for (let i = 0; i < 60; i++) assert.deepEqual(advance(1 / 60), { steps: 2, dropped: 0 });
  assert.equal(w.steps, 120);
  assert.equal(w.lastDt, 1 / 120);
  assert.ok(Math.abs(w.time - 1) < 1e-9, `world time ${w.time}`);
  // 3/4 of a step a call: 0, 1, 1, 1, then again (the part short of a step carried over)
  const w2 = countingWorld(), adv2 = fixedStepper(w2, 1 / 120, 8);
  const seen = [];
  for (let i = 0; i < 8; i++) seen.push(adv2(0.75 / 120).steps);
  assert.deepEqual(seen, [0, 1, 1, 1, 0, 1, 1, 1]);
  // a long frame: 8 steps taken, the rest dropped (not carried over)
  const w3 = countingWorld(), adv3 = fixedStepper(w3, 1 / 120, 8);
  assert.deepEqual(adv3(0.2), { steps: 8, dropped: 16 });
  assert.deepEqual(adv3(1 / 120), { steps: 1, dropped: 0 });
});

test('fixed step: with no clock the clock is never read; with one, out of time gives up catching up', () => {
  const w = countingWorld(), advance = fixedStepper(w, 1 / 120, 8);
  withClock(() => { throw new Error('the clock was read'); }, () => {
    for (let i = 0; i < 10; i++) advance(1 / 30);
  });
  assert.equal(w.steps, 40);
  // a step "taking" 20 ms of a step's 8.3: one a frame, the rest dropped
  const w2 = countingWorld(), adv2 = fixedStepper(w2, 1 / 120, 8);
  const clock = busyClock();
  assert.deepEqual(adv2(1 / 30, clock), { steps: 1, dropped: 3 });
  // a clock with time to spare: every step
  assert.deepEqual(adv2(1 / 30, () => 0), { steps: 4, dropped: 0 });
});

// Pyramid 6, a straight throw at power 0.4, 3 s on; each frame stepped by `stepOnce`.
function tinCanThrow(stepOnce) {
  const s = createStall(), m = createMatch({ p1: 'bear', layout: '6' });
  s.setCans('6');
  const frame = () => { stepOnce(s); update(m, DT, { off: s.offCount(), still: s.still() }); };
  while (cameraAt(m.round.since).view !== 'behind') frame();
  const r = throwBall(m, 0.4, 0);
  assert.ok(r.ok, `throw refused: ${r.why}`);
  s.throwBall(r.vec, r.ball);
  for (let i = 0; i < 180; i++) frame();
  return { poses: s.poses(), off: s.offCount(), hits: s.hits };
}
// Topple! game 12345 scene 3, a throw at the structure's middle 10° up (3 of
// its 7 blocks down), 3 s on.
function toppleThrow(stepOnce) {
  // the layout by its seed (game 12345's scene 3 before scenes were dealt), so
  // the test doesn't move when the game's choice of scenes does
  const L = makeLayout(sceneSeed(12345, 1, 3), sceneOpts(3), ALL_KINDS), sc = { layout: L, parts: sceneParts(L) }, w = createWorld();
  w.setScene(sc.parts);
  const st = sc.parts.stand, aim = Math.atan2(st.x - HAND.x, HAND.z - st.z) * R2D / MAX_AIM;
  w.throwBall(launchVel(sc.layout.power, aim, 10).vec);
  for (let i = 0; i < 180; i++) stepOnce(w);
  return { poses: w.poses().map(({ p, q }) => ({ p, q })), down: w.downCount() };
}

for (const [name, run, STEP, MAX] of [['tin can alley', tinCanThrow, TCA_STEP, TCA_MAX], ['topple', toppleThrow, TP_STEP, TP_MAX]]) {
  test(`fixed step: ${name}: a busy machine doesn't change a throw (it did, stepped by cannon-es itself)`, () => {
    const calm = run(s => s.step(DT));
    if (name === 'tin can alley') assert.ok(calm.hits > 0 && calm.off >= 2, `the throw knocked ${calm.off} off`);
    else assert.ok(calm.down >= 1, 'the throw knocked nothing down');
    const busy = withClock(busyClock(), () => run(s => s.step(DT)));
    assert.deepEqual(busy, calm, 'the busy machine changed the throw');
    // the old stepping: cannon-es's own catch-up, which reads the clock
    const old = withClock(busyClock(), () => run(s => s.world.step(STEP, DT, MAX)));
    assert.notDeepEqual(old.poses, calm.poses, 'the busy clock changed nothing in cannon-es\'s own step either');
  });

  test(`fixed step: ${name}: given the clock, the same as cannon-es's own step, busy or not`, () => {
    for (const [what, clock] of [['time to spare', () => () => 0], ['busy', busyClock]]) {
      const own = withClock(clock(), () => run(s => s.world.step(STEP, DT, MAX)).poses);
      const ours = withClock(clock(), () => run(s => s.step(DT, () => performance.now())).poses);
      assert.deepEqual(ours, own, `${what}: not as cannon-es steps`);
    }
  });
}
