import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZES, HEARTS, HINTS, SHOWS, LEVEL, MAKE_LEVEL, DEMO, COLORS, PROGRESS_KEY,
  seenBy, units, newState, place, nextStep, solve, generate, connected, hardEnough, problems, colorsFor,
  createGame, foundCount, look, tap, startStroke, strokeTo, endStroke, undo, canUndo, showOne, findHint, useHint,
  explainHint, snapshotGame, restoreGame, knownEmpty, isFull, endGame,
  readProgress, recordTime, clock, mulberry32,
} from '../src/core/hidden-faces.js';

const fromString = (n, s) => [...s].map(Number);
// Puzzles to test with: the 5 x 5 for the pictures, a 6 x 6 that needs
// "try it" (found by generate(6, 172, { maxLevel: 4, ... })) and one
// that needs "group" (generate(6, 60023)).
const TRYIT = { n: 6, reg: fromString(6, '000011204001244431444431443333444555'), faces: [2, 11, 12, 22, 25, 33] };
const GROUP = { n: 6, reg: fromString(6, '122200122200111222132224335224555224'), faces: [4, 6, 15, 19, 29, 32] };
const MADE = [6, 7, 8].map(n => generate(n, n * 10000 + 1));
// Whether two squares touch (corners too).
const touching = (n, a, b) => Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs(a % n - b % n) <= 1;

test('hidden faces: a face rules out its row, column, colour and the 8 around it', () => {
  // 6 x 6, colours = rows: a face in a corner rules out its row (5),
  // column (5) and the one diagonal neighbour not already in either.
  const reg = Array.from({ length: 36 }, (_, i) => Math.floor(i / 6));
  assert.equal(seenBy(6, reg, 0).length, 11);
  assert.ok(!seenBy(6, reg, 0).includes(0));
  // In the middle: row 5 + column 5 + 4 diagonals.
  assert.equal(seenBy(6, reg, 14).length, 14);
  assert.ok(seenBy(6, reg, 14).includes(7) && seenBy(6, reg, 14).includes(21));
  const U = units(6, reg);
  assert.deepEqual(U.map(u => u.type).join(), [...Array(6).fill('row'), ...Array(6).fill('col'), ...Array(6).fill('region')].join());
  assert.ok(U.every(u => u.cells.length === 6));
});

// Every step the solver takes holds for the real answer: a face it places
// is in the answer, a square it rules out isn't. Across the test puzzles,
// every rule is used at least once.
test('hidden faces: every solver step is right, and every rule is used', () => {
  const used = {};
  let steps = 0;
  for (const p of [DEMO, TRYIT, GROUP, ...MADE]) {
    const r = solve(p.n, p.reg, 4);
    assert.ok(r.solved, `${p.n} x ${p.n} not solved`);
    assert.deepEqual(r.faces, [...p.faces].sort((a, b) => a - b));
    for (const st of r.steps) {
      used[st.rule] = (used[st.rule] ?? 0) + 1;
      steps++;
      assert.equal(st.level, LEVEL[st.rule]);
      if (st.place != null) assert.ok(p.faces.includes(st.place), `${st.rule} placed a face at ${st.place}`);
      for (const i of st.out) assert.ok(!p.faces.includes(i), `${st.rule} ruled out the face at ${i}`);
    }
  }
  assert.deepEqual(Object.keys(used).sort(), Object.keys(LEVEL).sort(), JSON.stringify(used));
  assert.ok(steps > 40, `only ${steps} steps checked`);
});

test('hidden faces: the "try it" puzzle needs it; without it the solver stops short', () => {
  const r = solve(6, TRYIT.reg, MAKE_LEVEL);
  assert.equal(r.solved, false);
  assert.equal(r.broken, false);
  assert.ok(r.decided > 0 && r.decided < 36, `decided ${r.decided}`);
  assert.ok(problems(TRYIT).includes('the solver can\'t finish it'));
  assert.deepEqual(problems(TRYIT, { maxLevel: 4 }), []);
});

test('hidden faces: a puzzle with many answers is not finished; one with none is broken', () => {
  // Colours = rows: rows and colours say the same, many answers.
  const rows = Array.from({ length: 36 }, (_, i) => Math.floor(i / 6));
  const many = solve(6, rows);
  assert.equal(many.solved, false);
  assert.equal(many.broken, false);
  // Two one-square colours side by side in the top row (their faces would
  // touch): no answer. Colour 2 is the rest of rows 1-3, then one colour
  // per row.
  const reg = rows.map((g, i) => (i === 0 ? 0 : i === 1 ? 1 : Math.max(2, g)));
  for (let i = 2; i < 6; i++) reg[i] = 2;
  for (let g = 0; g < 6; g++) assert.ok(connected(6, reg, g), `colour ${g}`);
  const none = solve(6, reg);
  assert.equal(none.broken, true);
  assert.equal(none.solved, false);
});

test('hidden faces: made puzzles have one answer, one face per row, column and colour, none touching', () => {
  for (const p of MADE) {
    assert.ok(p, 'not made');
    assert.deepEqual(problems(p), [], `${p.n} x ${p.n}`);
    for (let g = 0; g < p.n; g++) assert.ok(connected(p.n, p.reg, g));
    for (const a of p.faces) for (const b of p.faces) if (a !== b) assert.ok(!touching(p.n, a, b));
  }
  // The same seed makes the same puzzle (the stock depends on it).
  assert.deepEqual(generate(6, 60001), generate(6, 60001));
  assert.notDeepEqual(generate(6, 60001).reg, generate(6, 60002).reg);
  assert.ok(hardEnough(6, 4) && !hardEnough(6, 3), 'the bar: 60% of 6 is 3.6, so 4 steps');
});

// The checks catch each kind of broken puzzle (so a clean result means
// something).
test('hidden faces: problems() reports each kind of broken puzzle', () => {
  const p = MADE[0], n = p.n;
  assert.deepEqual(problems(p), []);
  const faces = [...p.faces];
  // Two faces' columns swapped: still one per row and column, but no
  // longer this puzzle's answer (and maybe touching or sharing a colour).
  const [a, b] = [faces[0], faces[1]];
  const swapped = faces.map(i => (i === a ? Math.floor(a / n) * n + b % n : i === b ? Math.floor(b / n) * n + a % n : i));
  assert.notDeepEqual(problems({ ...p, faces: swapped }), []);
  assert.match(problems({ ...p, faces: faces.slice(1) }).join(), /5 faces, not 6/);
  const twoRow = [...faces];
  twoRow[1] = Math.floor(faces[0] / n) * n + ((faces[0] % n) + 3) % n;
  assert.match(problems({ ...p, faces: twoRow }).join(), /not one face per row/);
  assert.match(problems({ ...p, reg: p.reg.slice(1) }).join(), /35 squares/);
  assert.match(problems({ ...p, reg: p.reg.map(g => (g === 5 ? 9 : g)) }).join(), /outside/);
  // Made-up 6 x 6s, colours = columns: the top right square given to
  // colour 0 (two pieces); faces touching.
  const cols = Array.from({ length: 36 }, (_, i) => i % 6);
  assert.match(problems({ n: 6, reg: cols.map((g, i) => (i === 5 ? 0 : g)), faces: [1, 9, 17, 18, 26, 34] }).join(), /colour 0 missing or not joined/);
  assert.match(problems({ n: 6, reg: cols, faces: [0, 7, 20, 27, 34, 17] }).join(), /touch/);
});

test('hidden faces: colours are different, the same for a seed, from the site\'s list', () => {
  for (const p of [DEMO, ...MADE]) {
    const c = colorsFor(p.n, p.reg, 3);
    assert.equal(c.length, p.n);
    assert.equal(new Set(c.map(x => x.name)).size, p.n);
    assert.ok(c.every(x => COLORS.some(([name, hex]) => name === x.name && hex === x.c)));
    assert.deepEqual(colorsFor(p.n, p.reg, 3), c);
  }
});

/* ---------- a game ---------- */

const game = (opts = {}) => createGame(MADE[0], opts);
const notFace = g => g.marks.findIndex((m, i) => m === '' && !g.sol.has(i));

test('hidden faces game: a tap puts a ✕, a tap on a ✕ looks; a face found Auto-✕es around it', () => {
  const g = game();
  assert.equal(g.hearts, HEARTS);
  assert.equal(g.hints, HINTS);
  assert.equal(g.shows, SHOWS);
  const f = MADE[0].faces[0];
  assert.deepEqual(tap(g, f), { ok: true, did: 'x' });
  assert.equal(g.marks[f], 'x');
  const r = tap(g, f);
  assert.equal(r.did, 'look');
  assert.equal(r.face, true);
  assert.equal(g.marks[f], 'face');
  assert.deepEqual(new Set(r.autoX), new Set(seenBy(6, MADE[0].reg, f)));
  assert.ok(r.autoX.every(i => g.marks[i] === 'x'));
  assert.equal(foundCount(g), 1);
  assert.deepEqual(tap(g, f), { ok: false, why: 'already' });
  // I'll do it: no ✕s around a face.
  const h = game({ auto: false });
  tap(h, f);
  assert.deepEqual(tap(h, f).autoX, []);
  assert.equal(h.marks.filter(m => m === 'x').length, 0);
});

test('hidden faces game: a wrong look is a red ✕ and a heart; the third ends the game', () => {
  const g = game();
  for (let k = 1; k <= HEARTS; k++) {
    const i = notFace(g);
    tap(g, i);
    const r = tap(g, i);
    assert.equal(r.face, false);
    assert.equal(g.marks[i], 'bad');
    assert.equal(g.hearts, HEARTS - k);
    assert.equal(r.lost, k === HEARTS);
  }
  assert.equal(g.result, 'lost');
  assert.equal(g.mistakes, HEARTS);
  assert.deepEqual(tap(g, notFace(g)), { ok: false, why: 'over' });
  assert.equal(useHint(g).ok, false);
  assert.equal(showOne(g).ok, false);
  assert.equal(undo(g), -1);
});

test('hidden faces game: finding every face wins', () => {
  const g = game({ auto: false });
  const faces = MADE[0].faces;
  faces.forEach((f, k) => {
    const r = look(g, f);
    assert.equal(r.won, k === faces.length - 1);
  });
  assert.equal(g.result, 'won');
  assert.equal(look(g, faces[0]).ok, false);
});

test('hidden faces game: drags ✕ or rub out; undo takes back one square at a time, never a face found', () => {
  const g = game({ auto: false });
  const path = [0, 1, 2, 3];
  const s = startStroke(g, 0);
  assert.equal(s.mode, 'mark');
  for (const i of path) strokeTo(g, s, i);
  assert.equal(endStroke(g, s), 4);
  assert.deepEqual(path.map(i => g.marks[i]), ['x', 'x', 'x', 'x']);
  // Rub out from a ✕: 1 and 2.
  const e = startStroke(g, 1);
  assert.equal(e.mode, 'erase');
  strokeTo(g, e, 1);
  strokeTo(g, e, 2);
  endStroke(g, e);
  assert.deepEqual(path.map(i => g.marks[i]), ['x', '', '', 'x']);
  // Undo: the last square rubbed out first, then the one before.
  assert.equal(undo(g), 1);
  assert.deepEqual(path.map(i => g.marks[i]), ['x', '', 'x', 'x']);
  assert.equal(undo(g), 1);
  assert.deepEqual(path.map(i => g.marks[i]), ['x', 'x', 'x', 'x']);
  // A face found on one of them (row 1 has one) stays; the drag's other
  // squares come back one by one, last first.
  const f = path.find(i => g.sol.has(i));
  look(g, f);
  assert.equal(g.marks[f], 'face');
  for (const i of [...path].reverse().filter(j => j !== f)) {
    assert.equal(undo(g), 1);
    assert.equal(g.marks[i], '', `square ${i} not undone in turn`);
  }
  assert.equal(g.marks[f], 'face');
  assert.equal(undo(g), -1);
  assert.equal(canUndo(g), false);
  // A stroke from a face or a red ✕ does nothing.
  assert.equal(startStroke(g, f).mode, null);
  // An empty drag adds no undo step.
  const z = startStroke(g, 30);
  assert.equal(endStroke(g, z), 0);
  assert.equal(undo(g), -1);
});

test('hidden faces game: undo takes back a wrong look; the heart comes back, the mistake still counts', () => {
  const g = game({ auto: false });
  const i = notFace(g);
  tap(g, i);
  tap(g, i);
  assert.equal(g.marks[i], 'bad');
  assert.equal(g.hearts, HEARTS - 1);
  assert.equal(canUndo(g), true);
  assert.equal(undo(g), 1);
  assert.equal(g.marks[i], 'x');
  assert.equal(g.hearts, HEARTS);
  assert.equal(g.mistakes, 1);
  // Then the ✕ itself, then nothing.
  assert.equal(undo(g), 1);
  assert.equal(g.marks[i], '');
  assert.equal(canUndo(g), false);
  assert.equal(undo(g), -1);
  // A wrong look on a dragged ✕ comes back before the drag.
  const s = startStroke(g, 0);
  for (const j of [0, 1, 2, 3, 4, 5]) strokeTo(g, s, j);
  endStroke(g, s);
  const w = [0, 1, 2, 3, 4, 5].find(j => !g.sol.has(j));
  look(g, w);
  assert.equal(undo(g), 1);
  assert.equal(g.marks[w], 'x');
  for (let k = 0; k < 6; k++) assert.equal(undo(g), 1);
  assert.equal(undo(g), -1);
  // The look that ends the game can't be undone: the game is over.
  const h = game();
  for (let k = 0; k < HEARTS; k++) look(h, notFace(h));
  assert.equal(h.result, 'lost');
  assert.equal(canUndo(h), false);
  assert.equal(undo(h), -1);
});

test('hidden faces game: a step with nothing left to change is skipped, not an Undo that does nothing', () => {
  const g = game({ auto: false });
  const f = MADE[0].faces[0];
  tap(g, f);
  tap(g, f);
  assert.equal(g.marks[f], 'face');
  assert.equal(canUndo(g), false);
  assert.equal(undo(g), -1);
  assert.equal(g.undo.length, 0);
  // A rub-out, then a face's Auto ✕ puts that ✕ back: undoing the rub-out
  // would change nothing, so it's skipped too.
  const a = game();
  const face = MADE[0].faces[1];
  const near = seenBy(6, MADE[0].reg, face).find(j => !a.sol.has(j));
  tap(a, near);
  const e = startStroke(a, near);
  strokeTo(a, e, near);
  endStroke(a, e);
  look(a, face);
  assert.equal(a.marks[near], 'x');
  assert.equal(undo(a), 1);   // the rub-out skipped; the ✕ tap undone
  assert.equal(a.marks[near], '');
});

// No wait for a slip any more (developer, 2026-10-14): a double tap is a
// ✕ and a look, and Undo takes a wrong look back.
test('hidden faces game: a second tap on a new ✕ looks at once; Undo takes a wrong one back', () => {
  const g = game();
  const i = notFace(g);
  assert.deepEqual(tap(g, i), { ok: true, did: 'x' });
  const r = tap(g, i);
  assert.equal(r.did, 'look');
  assert.equal(r.face, false);
  assert.equal(g.marks[i], 'bad');
  assert.equal(g.hearts, HEARTS - 1);
  assert.deepEqual(tap(g, i), { ok: false, why: 'already' });
  assert.equal(undo(g), 1);
  assert.equal(g.marks[i], 'x');
  assert.equal(g.hearts, HEARTS);
  assert.equal(g.mistakes, 1);
  // On a star's square, a double tap finds it.
  const s = [...g.sol][0];
  tap(g, s);
  assert.equal(tap(g, s).face, true);
  assert.equal(g.marks[s], 'face');
});

// A look where there's known to be no star (developer, 2026-10-15: a
// double tap on a square a hint had just crossed out cost a heart, and
// Undo kept the mistake): it tells nothing new, so nothing changes or
// counts, and the reason comes back in words. Anywhere else a wrong look
// still costs a heart and counts.
const kindOf = (n, f, j) => {
  const r = Math.floor(j / n), c = j % n, rf = Math.floor(f / n), cf = f % n;
  return Math.abs(r - rf) <= 1 && Math.abs(c - cf) <= 1 ? 'touch' : r === rf ? 'row' : c === cf ? 'col' : 'colour';
};
const unchanged = (g, before) => {
  assert.equal(g.hearts, before.hearts, 'a heart went');
  assert.equal(g.mistakes, before.mistakes, 'a mistake counted');
  assert.equal(g.undo.length, before.undo, 'an undo step added');
};

test('hidden faces game: a look where a found star rules it out changes nothing and counts nothing', () => {
  const kinds = { touch: 0, row: 0, col: 0, colour: 0 };
  for (const p of MADE) {
    const n = p.n;
    for (const f of p.faces) {
      const g = createGame(p, { auto: false });
      look(g, f);
      const name = g.col[p.reg[f]].name;
      const says = {
        touch: 'No star here: it touches a star.', row: `No star here: row ${Math.floor(f / n) + 1} already has its star.`,
        col: `No star here: column ${f % n + 1} already has its star.`, colour: `No star here: ${name} already has its star.`,
      };
      for (const j of seenBy(n, p.reg, f)) {
        if (g.sol.has(j)) continue;
        tap(g, j);
        const before = { hearts: g.hearts, mistakes: g.mistakes, undo: g.undo.length };
        const r = tap(g, j);
        const kind = kindOf(n, f, j);
        assert.deepEqual(r, { ok: true, did: 'look', face: false, known: says[kind], autoX: [], won: false, lost: false }, `${n}x${n} star ${f}, square ${j}`);
        assert.equal(g.marks[j], 'x', 'the ✕ is no longer a ✕');
        unchanged(g, before);
        kinds[kind]++;
      }
      // A square the star doesn't rule out: a wrong look, as before.
      const other = g.marks.findIndex((m, i) => m === '' && !g.sol.has(i));
      assert.equal(knownEmpty(g, other), null);
      tap(g, other);
      assert.equal(tap(g, other).face, false);
      assert.equal(g.marks[other], 'bad');
      assert.equal(g.hearts, HEARTS - 1);
      assert.equal(g.mistakes, 1);
    }
  }
  for (const [kind, k] of Object.entries(kinds)) assert.ok(k > 0, `no "${kind}" square checked: ${JSON.stringify(kinds)}`);
  // With Auto ✕: the ✕s a found star puts round it, looked under.
  const g = game();
  const f = MADE[0].faces[0];
  const { autoX } = look(g, f);
  assert.ok(autoX.length);
  for (const j of autoX) {
    const before = { hearts: g.hearts, mistakes: g.mistakes, undo: g.undo.length };
    assert.match(tap(g, j).known, /^No star here: /);
    unchanged(g, before);
  }
  // A star's own square is never "known empty", and a look there finds it.
  assert.ok(MADE[0].faces.every(s => knownEmpty(g, s) === null));
});

// A game of the first test puzzle, played by its hints (not used) up to
// the first that crosses something out, then that one used. `before(g,
// h)` runs just before it's used.
function toldGame(before = () => {}) {
  const g = game();
  for (let k = 0; k < 50; k++) {
    const h = findHint(g);
    if (h.out.length) { before(g, h); return { g, h: useHint(g) }; }
    if (h.kind !== 'single') throw new Error(`a "${h.kind}" hint crossing nothing out`);
    look(g, h.tgt);
  }
  throw new Error('no hint crosses anything out');
}
const sorted = xs => [...xs].sort((a, b) => a - b);

// A hint takes its step (developer, 2026-10-15): its ✕s are fixed, like a
// found star. Undo never takes them back (here even a ✕ and a rub-out the
// player made on one of its squares just before), a drag can't change
// them, and a tap on one is a look that costs nothing.
test('hidden faces game: a hint’s ✕s are fixed: Undo and drags leave them alone, a look there costs nothing', () => {
  const f = game();
  findHint(f);
  assert.equal(f.told.size, 0, 'findHint alone remembered squares');
  assert.ok(f.marks.every(m => m === ''), 'findHint alone changed the board');
  let j0 = -1;
  const { g, h } = toldGame((g, h) => {
    j0 = h.out[0];
    tap(g, j0);                                    // the player's ✕ ...
    const s = startStroke(g, j0);
    strokeTo(g, s, j0);                            // ... rubbed out: two undo steps on j0
    endStroke(g, s);
    assert.equal(g.marks[j0], '');
  });
  assert.ok(h.out.some(j => !g.marks.some((m, s) => m === 'face' && seenBy(g.n, g.reg, s).includes(j))), 'every square the hint crosses out is a found star’s: no hint words checked');
  assert.deepEqual(sorted(h.hx), sorted(h.out));
  assert.equal(h.star, null);
  assert.ok(h.out.every(j => g.marks[j] === 'hx'), 'the hint’s squares aren’t hint ✕s');
  assert.deepEqual(sorted(g.told), sorted(h.out));
  assert.equal(canUndo(g), false, 'Undo would take back a hint’s ✕');
  assert.equal(undo(g), -1);
  assert.equal(g.marks[j0], 'hx');
  for (const j of h.out) {
    const before = { hearts: g.hearts, mistakes: g.mistakes, undo: g.undo.length };
    const r = tap(g, j);
    assert.equal(r.did, 'look');
    assert.equal(r.known, 'No star here: a hint crossed it out.');
    assert.equal(g.marks[j], 'hx');
    unchanged(g, before);
  }
  // Drags: none from a hint's ✕; a ✕ drag and a rub-out passing over them
  // change only the player's squares.
  assert.equal(startStroke(g, h.out[0]).mode, null, 'a drag from a hint’s ✕ does something');
  const e = g.marks.findIndex((m, i) => m === '' && !g.sol.has(i));
  const s = startStroke(g, e);
  assert.equal(s.mode, 'mark');
  strokeTo(g, s, e);
  for (const j of h.out) assert.equal(strokeTo(g, s, j), false, 'a ✕ drag changed a hint’s ✕');
  endStroke(g, s);
  const r = startStroke(g, e);
  assert.equal(r.mode, 'erase');
  strokeTo(g, r, e);
  for (const j of h.out) assert.equal(strokeTo(g, r, j), false, 'a rub-out took a hint’s ✕');
  endStroke(g, r);
  assert.equal(g.marks[e], '');
  while (undo(g) >= 0);
  assert.ok(h.out.every(j => g.marks[j] === 'hx'), 'Undo took back a hint’s ✕');
  assert.equal(g.hearts, HEARTS);
  // A square no hint or star rules out: a wrong look, as before.
  const other = g.marks.findIndex((m, i) => m === '' && !g.sol.has(i) && !g.told.has(i));
  tap(g, other);
  assert.equal(tap(g, other).known, undefined);
  assert.equal(g.marks[other], 'bad');
  assert.equal(g.mistakes, 1);
});

test('hidden faces game: Show uncovers a face not yet found, once', () => {
  const g = game();
  look(g, MADE[0].faces[0]);
  const r = showOne(g, () => 0);
  assert.equal(r.ok, true);
  assert.equal(r.face, true);
  assert.notEqual(r.square, MADE[0].faces[0]);
  assert.equal(g.marks[r.square], 'face');
  assert.equal(g.shows, 0);
  assert.equal(g.showsUsed, 1);
  assert.deepEqual(showOne(g), { ok: false, why: 'none-left' });
});

/* ---------- hints ---------- */

test('hidden faces hints: a wrong ✕ first, then ✕s a found face implies, then the solver', () => {
  const g = game({ auto: false });
  const f = MADE[0].faces[0], f2 = MADE[0].faces[1];
  g.marks[f2] = 'x';
  const w = findHint(g);
  assert.equal(w.kind, 'wrong');
  assert.equal(w.tgt, f2);
  assert.match(w.text, /The ringed ✕ \(row \d, column \d\) was wrong/);
  g.marks[f2] = '';
  look(g, f);
  const im = findHint(g);
  assert.equal(im.kind, 'implied');
  assert.deepEqual(im.why, [f]);
  assert.ok(im.out.length && im.out.every(i => !g.sol.has(i)));
  assert.match(im.text, /^Row \d already has its star/);
  // Used, it puts its ✕s on as hint ✕s, and nothing else changes.
  const want = g.marks.map((m, i) => (im.out.includes(i) ? 'hx' : m));
  const used = useHint(g);
  assert.equal(used.kind, 'implied');
  assert.deepEqual(sorted(used.hx), sorted(im.out));
  assert.deepEqual(g.marks, want);
  assert.notEqual(findHint(g).text, im.text, 'the same hint again after its step');
  // The board as a fresh game: the solver's first step.
  const fresh = game();
  const h = findHint(fresh);
  assert.ok(Object.keys(LEVEL).includes(h.kind), h.kind);
  assert.ok(h.text.length > 20);
  // A hint never changes the board.
  assert.deepEqual(fresh.marks, game().marks);
});

// Using only hints (each takes its own step, 2026-10-15) solves each test
// puzzle with no wrong look: every hint is right, and each step is just
// the hint's: a star where it rings one with hint ✕s on the empty squares
// the star rules out (Auto ✕ off), or hint ✕s on the empty squares it
// crosses out. The last star, placed by a hint, wins. Every kind of hint
// shows up, each with words.
test('hidden faces hints: following the hints alone solves the puzzle', () => {
  const kinds = {};
  let longest = '', steps = 0;
  for (const p of [DEMO, TRYIT, GROUP, ...MADE]) {
    const g = createGame(p, { auto: false });
    g.hints = Infinity;
    for (let k = 0; k < 400 && !g.result; k++) {
      const before = [...g.marks];
      const pre = findHint(g), why = explainHint(g, pre);
      const h = useHint(g);
      // Its words and Why? the same after its step, and as kept (a reload).
      assert.equal(h.text, pre.text);
      assert.deepEqual(explainHint(g, h), why, `${h.kind}: Why? changed by the hint's step`);
      assert.deepEqual(explainHint(g, JSON.parse(JSON.stringify(h))), why, `${h.kind}: Why? changed as kept`);
      kinds[h.kind] = (kinds[h.kind] ?? 0) + 1;
      if (h.text.length > longest.length) longest = h.text;
      assert.notEqual(h.kind, 'none', `${p.n} x ${p.n}: no hint at step ${k}`);
      const want = [...before];
      if (h.kind === 'single') {
        assert.ok(g.sol.has(h.tgt), 'single rang a square with no face');
        assert.equal(h.star, h.tgt);
        want[h.tgt] = 'face';
        for (const j of seenBy(p.n, p.reg, h.tgt)) if (want[j] === '') want[j] = 'hx';
      } else {
        assert.equal(h.star, null, `${h.kind} placed a star`);
        assert.ok(h.out.length, `${h.kind} crosses nothing out`);
        for (const i of h.out) {
          assert.ok(!g.sol.has(i), `${h.kind}: ✕ on a face`);
          assert.equal(before[i], '', `${h.kind}: crosses out a square already marked`);
          want[i] = 'hx';
        }
      }
      assert.deepEqual(g.marks, want, `${p.n} x ${p.n} step ${k}: the board isn't just the ${h.kind} hint's step`);
      steps++;
    }
    assert.equal(g.result, 'won', `${p.n} x ${p.n}`);
    assert.equal(foundCount(g), p.n);
    assert.equal(g.mistakes, 0);
    assert.ok(!g.marks.includes('x'), 'a ✕ that isn’t a hint’s');
  }
  for (const kind of ['single', 'inside', 'touch', 'group', 'tryit']) assert.ok(kinds[kind], `no ${kind} hint: ${JSON.stringify(kinds)}`);
  assert.ok(steps > 40, `${steps} hints`);
  // The hint bar is 3 lines on a 393 px phone (about 135 characters);
  // longer ones scroll in it.
  assert.ok(longest.length < 200, longest);
});

// A hint that points at a star places it, and hint ✕s go on the empty
// squares it rules out whether Auto ✕ is on or off (developer,
// 2026-10-15: "place the star and add Xs"); the player's own ✕s there
// stay theirs. A wrong ✕ becomes the star.
test('hidden faces hints: a star hint places the star and hint ✕s, Auto ✕ on or off', () => {
  for (const auto of [false, true]) {
    const g = game({ auto });
    const f = MADE[0].faces[1], seen = seenBy(g.n, g.reg, f), mine = seen[0];
    tap(g, f);                                     // a ✕ on a star
    tap(g, mine);                                  // the player's ✕ where the star rules out
    const r = useHint(g);
    assert.equal(r.kind, 'wrong');
    assert.equal(r.star, f);
    assert.equal(g.marks[f], 'face', 'the wrong ✕ isn’t the star');
    assert.deepEqual(sorted(r.hx), sorted(seen.filter(j => j !== mine)), `auto ${auto}`);
    assert.ok(seen.every(j => g.marks[j] === (j === mine ? 'x' : 'hx')), `auto ${auto}: not hint ✕s, or the player’s ✕ taken`);
    assert.equal(g.marks.filter(m => m !== '').length, seen.length + 1, 'other squares changed');
    assert.equal(g.hintsUsed, 1);
    // Undo takes back the player's ✕ only.
    while (undo(g) >= 0);
    assert.equal(g.marks[f], 'face');
    assert.equal(g.marks[mine], '');
    assert.ok(r.hx.every(j => g.marks[j] === 'hx'));
    // One square left: played by the hints (not used) up to one, then used.
    const s = game({ auto });
    let h = findHint(s);
    for (let k = 0; k < 50 && h.kind !== 'single'; k++, h = findHint(s)) for (const i of h.out) s.marks[i] = 'x';
    assert.equal(h.kind, 'single');
    const xs = s.marks.filter(m => m === 'x').length;
    const u = useHint(s);
    assert.equal(u.star, h.tgt);
    assert.equal(s.marks[h.tgt], 'face');
    assert.ok(u.hx.length && seenBy(s.n, s.reg, h.tgt).every(j => s.marks[j] !== ''), 'a square the star rules out left empty');
    assert.equal(s.marks.filter(m => m === 'x').length, xs, 'Auto ✕’s ✕s, not hint ✕s');
    assert.equal(foundCount(s), 1);
    assert.equal(u.won, false);
  }
});

// The last star, placed by a hint, wins as a found one does.
test('hidden faces hints: a star a hint places can win the game', () => {
  const g = game();
  const last = MADE[0].faces.at(-1);
  for (const f of MADE[0].faces) if (f !== last) look(g, f);
  assert.equal(g.result, null);
  const r = useHint(g);
  assert.equal(r.kind, 'single');
  assert.equal(r.star, last);
  assert.equal(r.won, true);
  assert.equal(g.result, 'won');
  assert.equal(foundCount(g), g.n);
  assert.deepEqual(useHint(g), { ok: false, why: 'over' });
});

// Why? (developer, 2026-10-14: "the logic escapes me" when a hint says
// a star would rule out the last squares of a row while others look
// left). Following the hints as above, every hint's deeper reason is
// checked against the board: each lit square's label is the true reason
// it would go, the outlines are the units named.
test('hidden faces why: each "would rule out" square is labelled with its true reason', () => {
  const kinds = {}, tags = {};
  let longest = '';
  for (const p of [DEMO, TRYIT, GROUP, ...MADE]) {
    const g = createGame(p, { auto: false });
    const n = p.n, row = i => Math.floor(i / n);
    for (let k = 0; k < 400 && !g.result; k++) {
      const h = findHint(g);
      const before = g.marks.join();
      const w = explainHint(g, h);
      assert.equal(g.marks.join(), before, 'Why? changed the board');
      if (['wrong', 'implied', 'none', 'tryit'].includes(h.kind)) assert.equal(w, null, h.kind);
      else {
        kinds[h.kind] = (kinds[h.kind] ?? 0) + 1;
        if (w.text.length > longest.length) longest = w.text;
        for (const r of w.rings) assert.ok(h.units.some(u => u.cells.join() === r.cells.join()) || r.style === 'reach', `${h.kind}: a ring that is no unit`);
      }
      if (h.kind === 'touch') {
        const t = h.tgt, u = h.units[0];
        assert.equal(w.pretend, t);
        assert.deepEqual(w.tags.map(x => x[0]).sort((a, b) => a - b), [...h.why].sort((a, b) => a - b), 'not every lit square labelled');
        const seen = new Set(seenBy(n, p.reg, t));
        for (const [j, tag] of w.tags) {
          assert.ok(seen.has(j), 'a labelled square a star there would not rule out');
          const want = touching(n, t, j) ? 'touch' : row(j) === row(t) ? 'row' : j % n === t % n ? 'col' : 'colour';
          assert.equal(tag, want);
          if (tag === 'colour') assert.equal(p.reg[j], p.reg[t]);
          tags[tag] = (tags[tag] ?? 0) + 1;
        }
        assert.equal(w.rings[0].style, 'empty');
        assert.deepEqual(w.rings[0].cells, u.cells);
        const reach = w.rings.find(r => r.style === 'reach');
        assert.equal(!!reach, w.tags.some(x => x[1] === 'colour'));
        if (reach) assert.deepEqual(reach.cells, p.reg.map((_, j) => j).filter(j => p.reg[j] === p.reg[t]));
        assert.match(w.text, /^A star on the ringed square would rule out /);
        assert.match(w.text, /No star left for (row|column) \d+!$|No star left for [A-Z][a-z]+!$/);
      }
      for (const i of h.out) g.marks[i] = 'x';
      if (h.kind === 'single') look(g, h.tgt);
    }
  }
  for (const kind of ['single', 'inside', 'touch']) assert.ok(kinds[kind], `no ${kind} Why?: ${JSON.stringify(kinds)}`);
  for (const tag of ['touch', 'colour']) assert.ok(tags[tag], `no "${tag}" label: ${JSON.stringify(tags)}`);
  // The hint bar's 3 lines hold about 140 characters on a 393 px phone;
  // a few longer ones (in the stock: 26 of 5,110 "would rule out", 13 of
  // 355 "k in k") scroll in it.
  assert.ok(longest.length <= 160, longest);
});

test('hidden faces why: the words for one square, for all of one kind, and for a group', () => {
  const g = game();
  const n = g.n, U = units(n, g.reg);
  // Made-up hints, so each wording is reached: one lit square touching,
  // two both touching. (explainHint only explains; findHint checks.)
  const t = 7, col0 = U[n]; // row 2, column 2; column 1
  const one = explainHint(g, { kind: 'touch', tgt: t, why: [0], out: [t], units: [col0] });
  assert.equal(one.text, "A star on the ringed square would rule out column 1's last square (lit): it touches the star. No star left for column 1!");
  const two = explainHint(g, { kind: 'touch', tgt: t, why: [0, 6], out: [t], units: [col0] });
  assert.match(two.text, /column 1's last 2 squares \(lit\): both touching it\./);
  const at = playTo(GROUP, 'group');
  const gr = explainHint(at.g, at.h);
  assert.match(gr.text, /^.+'s 2 stars are on lit squares, in .+\. Those 2 (rows|columns|colours) have just 2 stars, so no star in the rest of them\.$/);
  assert.equal(gr.rings.length, 4);
  // Nothing more to say for a wrong ✕.
  assert.equal(explainHint(g, { kind: 'wrong', tgt: 0, why: [], out: [] }), null);
});
// A game of puzzle p, played by its hints up to the first of a kind.
function playTo(p, kind) {
  const g = createGame(p, { auto: false });
  for (let k = 0; k < 200; k++) {
    const h = findHint(g);
    if (h.kind === kind) return { g, h };
    for (const i of h.out) g.marks[i] = 'x';
    if (h.kind === 'single') look(g, h.tgt);
  }
  throw new Error(`no "${kind}" hint`);
}

test('hidden faces hints: 3 per puzzle; none is charged when there is no hint', () => {
  const g = game();
  for (let k = 0; k < HINTS; k++) assert.equal(useHint(g).ok, true);
  assert.equal(g.hints, 0);
  assert.equal(g.hintsUsed, HINTS);
  assert.deepEqual(useHint(g), { ok: false, why: 'none-left' });
  // Every face found but the game not over (made up): nothing to hint.
  const h = game();
  h.marks = h.marks.map((_, i) => (h.sol.has(i) ? 'face' : 'x'));
  const r = useHint(h);
  assert.equal(r.kind, 'none');
  assert.equal(h.hints, HINTS);
});

/* ---------- progress ---------- */

test('hidden faces progress: read from what was kept; anything unreadable is nothing', () => {
  assert.equal(PROGRESS_KEY, 'web-games-hidden-faces');
  assert.deepEqual(readProgress(null), { next: {}, best: {} });
  assert.deepEqual(readProgress('not json'), { next: {}, best: {} });
  assert.deepEqual(readProgress(JSON.stringify({ next: { 6: 3, 7: -1, 8: 1.5, 11: 2 }, best: { 6: 61000, 9: 'x', 10: 0 } })),
    { next: { 6: 3 }, best: { 6: 61000 } });
  const prog = readProgress(null);
  assert.deepEqual(recordTime(prog, 8, 90000), { best: null, newBest: true });
  assert.deepEqual(recordTime(prog, 8, 95000), { best: 90000, newBest: false });
  assert.deepEqual(recordTime(prog, 8, 80000), { best: 90000, newBest: true });
  assert.equal(prog.best[8], 80000);
  assert.deepEqual(readProgress(JSON.stringify(prog)), prog);
  assert.equal(clock(252000), '4:12');
  assert.equal(clock(5999), '0:05');
  assert.equal(clock(-5), '0:00');
  assert.equal(clock(3600000), '60:00');
});

test('hidden faces: a bad puzzle can\'t start a game; the sizes are 6 to 10', () => {
  assert.deepEqual(SIZES, [6, 7, 8, 9, 10]);
  assert.throws(() => createGame({ ...MADE[0], faces: MADE[0].faces.slice(1) }), /bad puzzle/);
  // A repeatable random source: same seed, same numbers, in [0, 1).
  const a = mulberry32(5), b = mulberry32(5);
  const xs = Array.from({ length: 100 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 100 }, () => b()));
  assert.ok(xs.every(x => x >= 0 && x < 1));
  // The state helpers agree with seenBy.
  const s = newState(6, MADE[0].reg);
  place(s, MADE[0].faces[0]);
  assert.equal(s.cand.reduce((t, c) => t + c, 0), 36 - seenBy(6, MADE[0].reg, MADE[0].faces[0]).length);
  assert.ok(nextStep(s));
});

// A game kept on the device (DESIGN.md "Coming back to a game"): what
// snapshotGame keeps comes back with restoreGame as the same game, which
// plays on the same; a kept game that isn't this puzzle's, or isn't
// whole, is refused, saying why.
test('hidden faces: a kept game comes back the same and plays on', () => {
  const { g } = toldGame();                   // squares a hint crossed out remembered
  const x = g.marks.findIndex((m, i) => m === '' && !g.sol.has(i) && !knownEmpty(g, i));
  tap(g, x);
  tap(g, x);                                  // a wrong look: a heart gone
  const f = [...g.sol].find(i => g.marks[i] !== 'face');
  look(g, f);                                 // a star, with Auto ✕
  const s = startStroke(g, notFace(g));
  strokeTo(g, s, notFace(g));
  endStroke(g, s);
  const kept = JSON.parse(JSON.stringify(snapshotGame(g)));   // as stored
  const h = restoreGame(MADE[0], kept);
  for (const k of ['n', 'auto', 'marks', 'hearts', 'hints', 'shows', 'mistakes', 'hintsUsed', 'showsUsed', 'undo', 'told', 'result']) {
    assert.deepEqual(h[k], g[k], k);
  }
  assert.ok(h.told.size > 0, 'the hint crossed nothing out: nothing checked');
  assert.ok(kept.marks.includes('hx'), 'no hint ✕ kept: nothing checked');
  // Kept before 2026-10-15 (no `told`): comes back, with nothing told.
  const { told, ...older } = kept;
  assert.equal(restoreGame(MADE[0], older).told.size, 0);
  assert.deepEqual([...h.sol], [...g.sol]);
  assert.deepEqual(h.col, g.col, 'the same colours (same colorSeed)');
  assert.equal(h.hearts, HEARTS - 1);
  // Both play on alike: Undo back to the wrong look gives the heart back.
  while (undo(g) >= 0);
  while (undo(h) >= 0);
  assert.deepEqual(h.marks, g.marks);
  assert.equal(h.hearts, HEARTS);
  assert.notEqual(h.marks, kept.marks, 'not sharing the kept arrays');
});

test('hidden faces: a kept game that is not this puzzle\'s, or not whole, is refused', () => {
  const g = game();
  look(g, [...g.sol][0]);
  const kept = snapshotGame(g);
  const bad = [
    [{ n: 7 }, /size 7, not 6/],
    [{ marks: kept.marks.slice(1) }, /bad marks/],
    [{ marks: kept.marks.map((m, i) => (i === 0 ? 'star' : m)) }, /bad marks/],
    [{ marks: kept.marks.map((m, i) => (i === notFace(g) ? 'face' : m)) }, /a star the puzzle hasn't/],
    [{ marks: kept.marks.map((m, i) => (g.sol.has(i) && m === '' ? 'hx' : m)) }, /a hint’s ✕ on a star/],
    [{ hearts: HEARTS + 1 }, /bad hearts/],
    [{ hints: -1 }, /bad hearts, hints/],
    [{ mistakes: 1.5 }, /bad counts/],
    [{ result: 'maybe' }, /bad result/],
    [{ undo: [[[999, '']]] }, /bad undo/],
    [{ undo: [{ look: -1 }] }, /bad undo/],
    [{ undo: [[[0, 'face']]] }, /bad undo/],
    [{ told: [MADE[0].faces[1]] }, /bad squares crossed out by hints/],
    [{ told: [999] }, /bad squares crossed out by hints/],
    [{ told: 'all' }, /bad squares crossed out by hints/],
  ];
  for (const [change, why] of bad) assert.throws(() => restoreGame(MADE[0], { ...kept, ...change }), why, JSON.stringify(change));
  assert.throws(() => restoreGame(MADE[1], kept), /size 6, not 7/, 'another puzzle');
  assert.throws(() => restoreGame(MADE[0], null), /size/);
  assert.doesNotThrow(() => restoreGame(MADE[0], kept));
});

test('hidden faces: no square left with stars still hidden ends the game; not sooner', () => {
  const g = game({ auto: false });
  const n = g.n, star = [...g.sol][0], row = Math.floor(star / n);
  // A whole row crossed out, its star under a ✕: wrong, but it can be put right.
  for (let c = 0; c < n; c++) tap(g, row * n + c);
  assert.equal(isFull(g), false, 'one row all crossed out');
  assert.deepEqual(endGame(g, 'full'), { ok: false, why: 'not-full' });
  const empty = () => g.marks.map((m, i) => (m === '' ? i : -1)).filter(i => i >= 0);
  for (const i of empty().slice(0, -1)) tap(g, i);
  assert.equal(empty().length, 1);
  assert.equal(isFull(g), false, 'one square left');
  const last = empty()[0];
  tap(g, last);
  assert.equal(isFull(g), true, 'every square crossed out, no star found');
  // Undo before the end: a square empty again, the game goes on.
  undo(g);
  assert.equal(isFull(g), false);
  tap(g, last);
  // Kept and picked up before the end (the screen waits a moment): still full.
  assert.equal(isFull(restoreGame(MADE[0], JSON.parse(JSON.stringify(snapshotGame(g))))), true);
  assert.deepEqual(endGame(g, 'full'), { ok: true });
  assert.equal(g.result, 'full');
  assert.equal(isFull(g), false, 'over: not "full" again');
  assert.deepEqual(tap(g, star), { ok: false, why: 'over' });
  assert.equal(undo(g), -1);
  assert.deepEqual(endGame(g, 'full'), { ok: false, why: 'over' });
  const h = restoreGame(MADE[0], JSON.parse(JSON.stringify(snapshotGame(g))));
  assert.equal(h.result, 'full', 'the end survives keeping');
});

test('hidden faces: hint ✕s count as filled; a full board with every star found is a win, not "full"', () => {
  const { g } = toldGame();
  assert.ok(g.marks.includes('hx'), 'no hint ✕: nothing checked');
  for (let i = 0; i < g.marks.length; i++) if (g.marks[i] === '') tap(g, i);
  assert.equal(isFull(g), true, 'the hint ✕s and the player’s ✕s fill it');
  const w = game();
  for (const f of w.sol) look(w, f);
  assert.equal(w.result, 'won');
  assert.equal(isFull(w), false);
  assert.deepEqual(endGame(w, 'full'), { ok: false, why: 'over' });
});

test('hidden faces: Give up ends the game at any point; only once; the end survives keeping', () => {
  const g = game();
  assert.deepEqual(endGame(g, 'maybe'), { ok: false, why: 'bad-end' });
  assert.equal(g.result, null);
  tap(g, notFace(g));
  assert.deepEqual(endGame(g, 'gaveup'), { ok: true });
  assert.equal(g.result, 'gaveup');
  assert.deepEqual(endGame(g, 'gaveup'), { ok: false, why: 'over' });
  assert.deepEqual(useHint(g), { ok: false, why: 'over' });
  assert.equal(restoreGame(MADE[0], snapshotGame(g)).result, 'gaveup');
});
