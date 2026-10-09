import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZES, LEVELS, PAD_FACES, ARRANGEMENTS, padsFor, speed, nextStep, bestKey, checkFaces,
  createMatch, newGame, addStep, showAgain, yourTurn, tap,
} from '../src/core/follow-me.js';
import { FACE_NAMES } from '../src/core/players.js';
import { PAD_COLORS, padStyle } from '../src/ui/fmpads.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Plays the order the robot shows, all right.
function playRight(m) {
  yourTurn(m);
  let r;
  for (const p of m.seq) r = tap(m, p);
  return r;
}
// A wrong pad for the next step.
const wrongFor = m => (m.seq[m.pos] + 1) % m.size;

test('follow me: 4, 6 or 9 pads, each its own face, colour and note; never your face', () => {
  assert.deepEqual(SIZES, [4, 6, 9]);
  for (const size of SIZES) {
    for (const me of [...FACE_NAMES, null]) {
      const pads = padsFor(size, me);
      assert.equal(pads.length, size, `${size} for ${me}`);
      assert.ok(!pads.some(p => p.face === me), `${me} is a pad`);
      for (const key of ['face', 'color', 'note']) assert.equal(new Set(pads.map(p => p[key])).size, size, `${size} for ${me}: ${key} repeated`);
      for (const p of pads) assert.ok(FACE_NAMES.includes(p.face) && PAD_COLORS[p.color], JSON.stringify(p));
      const notes = pads.map(p => p.note);
      assert.deepEqual(notes, [...notes].sort((a, b) => a - b), `${size}: notes low to high`);
    }
  }
  // The mockup's four, and its notes (G4 C5 E5 G5).
  assert.deepEqual(padsFor(4, 'bear').map(p => [p.face, p.note]), [['frog', 392], ['chick', 523.25], ['pig', 659.25], ['bunny', 783.99]]);
  // Your face is skipped: the next one comes in.
  assert.deepEqual(padsFor(4, 'frog').map(p => p.face), ['chick', 'pig', 'bunny', 'fox']);
  assert.equal(new Set(PAD_FACES.map(p => p.color)).size, PAD_FACES.length);
  assert.throws(() => padsFor(5, 'bear'), /bad size/);
  assert.match(padStyle('g'), /--c: #4FB264; --soft: #DDF1DF; --edge: #3A8A4C/);
  assert.throws(() => padStyle('x'), /unknown colour/);
});

test('follow me: layouts: 2x2, 2 across 3 down or 3x2, 3x3', () => {
  for (const size of SIZES) for (const [c, r] of ARRANGEMENTS[size]) assert.equal(c * r, size);
  assert.deepEqual(ARRANGEMENTS[6][0], [2, 3], 'upright first');
});

test('follow me: speed: Easy at Hard’s starting pace all game; Hard quicker each round, down to its floor', () => {
  // Easy was 650/280: slower was harder to remember (developer, 2026-10-09).
  assert.deepEqual(speed('easy', 1), { on: 450, gap: 170 });
  assert.deepEqual(speed('easy', 20), { on: 450, gap: 170 });
  assert.deepEqual(speed('hard', 1), speed('easy', 1));
  assert.deepEqual(speed('hard', 1), { on: 450, gap: 170 });
  assert.deepEqual(speed('hard', 2), { on: 423, gap: 160 });   // 6% quicker
  let prev = Infinity;
  for (let r = 1; r <= 40; r++) {
    const s = speed('hard', r);
    assert.ok(s.on <= prev && s.on >= 260 && s.gap >= 104, `round ${r}: ${JSON.stringify(s)}`);
    prev = s.on;
  }
  assert.deepEqual(speed('hard', 40), { on: 260, gap: 104 });
  assert.throws(() => speed('medium', 1), /unknown level/);
  assert.throws(() => speed('easy', 0), /bad round/);
});

test('follow me: every pad comes up, but never the same one three times running', () => {
  for (const size of SIZES) {
    const rand = seeded(size), seq = [], seen = new Set();
    for (let i = 0; i < 3000; i++) {
      const p = nextStep(seq, size, rand);
      assert.ok(Number.isInteger(p) && p >= 0 && p < size, `${p}`);
      if (seq.length >= 2) assert.ok(!(seq.at(-1) === p && seq.at(-2) === p), `three ${p}s at ${i}`);
      seq.push(p);
      seen.add(p);
    }
    assert.equal(seen.size, size);
  }
  // At the edges of rand: still a real pad, still not a third in a row.
  assert.equal(nextStep([3, 3], 4, () => 0.999999), 2);
  assert.equal(nextStep([0, 0], 4, () => 0), 1);
});

test('follow me: setup picks are checked', () => {
  assert.equal(checkFaces({ p1: 'bear' }), '');
  assert.equal(checkFaces({ p1: '' }), 'p1-missing');
  assert.equal(checkFaces({ p1: 'robot' }), 'unknown-face');
  const m = createMatch({ p1: 'lion', size: 9, level: 'hard' });
  assert.deepEqual([m.face, m.size, m.level, m.hearts, m.done, m.seq.length], ['lion', 9, 'hard', 1, 0, 0]);
  assert.equal(m.pads.length, 9);
  assert.equal(createMatch({ p1: 'bear' }).size, 4, '4 by default');
  assert.equal(createMatch({ p1: 'bear' }).hearts, 3, 'easy by default');
  assert.throws(() => createMatch({ p1: '' }), /p1-missing/);
  assert.throws(() => createMatch({ p1: 'bear', size: 8 }), /unknown size/);
  assert.throws(() => createMatch({ p1: 'bear', level: 'medium' }), /unknown level/);
});

test('follow me: the order right: one more step each round; the score is the longest right', () => {
  const rand = seeded(7);
  const m = createMatch({ p1: 'bear', size: 6 });
  for (let n = 1; n <= 8; n++) {
    addStep(m, rand);
    assert.equal(m.seq.length, n);
    const r = playRight(m);
    assert.deepEqual(r, { ok: true, right: true, complete: true, want: m.seq.at(-1), gameOver: false, newBest: false });
    assert.equal(m.done, n);
    assert.equal(m.hearts, 3);
  }
});

test('follow me: taps only on your turn, and only real pads', () => {
  const m = createMatch({ p1: 'bear' });
  assert.deepEqual(tap(m, 0), { ok: false, why: 'not-your-turn' }, 'before the robot has shown anything');
  addStep(m, seeded(1));
  assert.deepEqual(tap(m, m.seq[0]), { ok: false, why: 'not-your-turn' }, 'while the robot shows it');
  assert.equal(yourTurn(m), true);
  assert.equal(yourTurn(m), false, 'already your turn');
  for (const bad of [-1, 4, 1.5, '0', null]) assert.deepEqual(tap(m, bad), { ok: false, why: 'bad-pad' }, String(bad));
  assert.equal(m.pos, 0);
  assert.equal(m.hearts, 3, 'a bad tap costs nothing');
  tap(m, m.seq[0]);
  assert.deepEqual(tap(m, m.seq[0]), { ok: false, why: 'not-your-turn' }, 'done: the robot adds a step next');
});

test('follow me: Easy: a miss costs a heart and the same order is shown again; the third ends it', () => {
  const rand = seeded(3);
  const m = createMatch({ p1: 'bear', size: 4, level: 'easy' });
  for (let n = 1; n <= 3; n++) { addStep(m, rand); playRight(m); }
  addStep(m, rand);
  const order = m.seq.slice();
  yourTurn(m);
  tap(m, m.seq[0]);
  const want = m.seq[1];
  const r = tap(m, wrongFor(m));
  assert.deepEqual(r, { ok: true, right: false, complete: false, want, gameOver: false, newBest: false });
  assert.equal(m.hearts, 2);
  showAgain(m);
  assert.deepEqual(m.seq, order, 'the same order');
  assert.equal(m.pos, 0, 'from the start again');
  assert.equal(playRight(m).complete, true, 'and it can still be got right');
  assert.equal(m.done, 4);
  addStep(m, rand);
  for (const hearts of [1, 0]) {
    yourTurn(m);
    const x = tap(m, wrongFor(m));
    assert.equal(m.hearts, hearts);
    assert.equal(x.gameOver, hearts === 0);
    if (hearts) showAgain(m);
  }
  assert.deepEqual(m.result, { score: 4, newBest: true });
  assert.equal(m.phase, 'over');
  assert.deepEqual(tap(m, 0), { ok: false, why: 'not-your-turn' });
  assert.throws(() => addStep(m), /game is over/);
  assert.throws(() => showAgain(m), /game is over/);
});

test('follow me: Hard: the first miss ends it; a game at 0 is no best', () => {
  const best = {};
  const m = createMatch({ p1: 'bear', size: 9, level: 'hard' }, best);
  addStep(m, seeded(9));
  yourTurn(m);
  const r = tap(m, wrongFor(m));
  assert.equal(r.gameOver, true);
  assert.deepEqual(m.result, { score: 0, newBest: false });
  assert.deepEqual(best, {}, 'nothing kept for 0');
});

test('follow me: the best is kept per size and level, across games and matches', () => {
  const best = {};
  const rand = seeded(11);
  const playTo = (m, n) => {
    newGame(m);
    for (let i = 0; i < n; i++) { addStep(m, rand); playRight(m); }
    addStep(m, rand);
    while (!m.result) { if (m.phase !== 'input') { if (m.phase === 'ready') showAgain(m); yourTurn(m); } tap(m, wrongFor(m)); }
    return m.result;
  };
  const easy4 = createMatch({ p1: 'bear', size: 4, level: 'easy' }, best);
  assert.deepEqual(playTo(easy4, 5), { score: 5, newBest: true });
  assert.deepEqual(playTo(easy4, 3), { score: 3, newBest: false });
  assert.deepEqual(playTo(easy4, 5), { score: 5, newBest: false }, 'equal is not a new best');
  assert.deepEqual(playTo(easy4, 6), { score: 6, newBest: true });
  const hard9 = createMatch({ p1: 'bear', size: 9, level: 'hard' }, best);
  assert.deepEqual(playTo(hard9, 2), { score: 2, newBest: true }, 'its own best');
  assert.deepEqual(best, { [bestKey(4, 'easy')]: 6, [bestKey(9, 'hard')]: 2 });
  // New game, back to 4 on Easy: the best is still there.
  const again = createMatch({ p1: 'cat', size: 4, level: 'easy' }, best);
  assert.deepEqual(playTo(again, 4), { score: 4, newBest: false });
});

test('follow me: Play again mid-game starts over, full hearts, nothing scored', () => {
  const best = {};
  const m = createMatch({ p1: 'bear', level: 'easy' }, best);
  addStep(m, seeded(2));
  playRight(m);
  addStep(m, seeded(2));
  yourTurn(m);
  tap(m, wrongFor(m));
  newGame(m);
  assert.deepEqual([m.seq.length, m.pos, m.hearts, m.done, m.phase, m.result], [0, 0, 3, 0, 'ready', null]);
  assert.deepEqual(best, {});
  assert.equal(LEVELS.hard.hearts, 1);
});
