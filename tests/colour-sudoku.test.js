// Colour Sudoku's rules, solver, maker and game (src/core/colour-sudoku.js).
// Puzzles made here from fixed seeds (the same ones the mockup's core
// made: its outputs matched these byte for byte, 2026-10-19); nothing is
// written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  N, NN, HEARTS, HINTS, LEVELS, RULE, rowOf, colOf, boxOf, unitsFor, unitKind, newState, nextStep, apply, solve, generate,
  regionsOk, connected, problems, decode, encode, stockOrder, stockAt, firstSeed, coloursFor, unitName, createGame, enter,
  toggleNote, undo, canUndo, endGame, findHint, applyHint, useHint, walkStep, walkLength, fillRest, emptyCount, digitCounts,
  snapshotGame, restoreGame, readProgress, takeNext, recordTime, DEMO,
} from '../src/core/colour-sudoku.js';

// An Easy puzzle and two Harder ones (seed 201's needs "all inside" 33
// times and "the only digit left" twice).
const EASY = generate(100, RULE.easy);
const HARD = generate(201, RULE.harder);
const HARD2 = generate(200, RULE.harder);
const puzzle = (level, g) => ({ level, seed: g.seed, reg: g.reg, givens: g.givens, sol: g.sol });

// Every unit of a filled grid holds 1-9 once.
const sound = (reg, grid) => unitsFor(reg).units.every(u => new Set(u.map(i => grid[i])).size === N && u.every(i => grid[i] >= 1));

test('colour sudoku: units are the rows, columns, boxes and colours, 9 squares each', () => {
  const U = unitsFor(EASY.reg);
  assert.equal(U.units.length, 36);
  assert.ok(U.units.every(u => u.length === 9));
  assert.deepEqual([0, 9, 18, 27].map(unitKind), ['row', 'col', 'box', 'colour']);
  assert.deepEqual(U.cellUnits[40], [rowOf(40), 9 + colOf(40), 18 + boxOf(40), 27 + EASY.reg[40]]);
  // A square sees 8 in its row, 8 in its column, 4 more in its box and
  // some of its colour's 8 not already counted: 20 to 28.
  for (const ps of U.peers) assert.ok(ps.length >= 20 && ps.length <= 28, String(ps.length));
});

test('colour sudoku: made puzzles have nine joined, spread colours, an answer that fits them, and fit their level', () => {
  for (const [level, g] of [['easy', EASY], ['harder', HARD], ['harder', HARD2]]) {
    for (let c = 0; c < N; c++) {
      assert.equal(g.reg.filter(x => x === c).length, N, `${g.seed}: colour ${c}`);
      assert.ok(connected(g.reg, c), `${g.seed}: colour ${c} split`);
    }
    assert.ok(regionsOk(g.reg), `${g.seed}: a colour not spread`);
    assert.ok(sound(g.reg, g.sol), `${g.seed}: the answer repeats a digit`);
    assert.ok(g.nGivens >= 12 && g.nGivens <= 24, `${g.seed}: ${g.nGivens} givens`);
    assert.deepEqual(problems(puzzle(level, g)), [], `${g.seed}`);
  }
  // Harder needs "all inside": the Easy rules get stuck on it.
  assert.ok(HARD.counts.inside > 0 && !solve(HARD.reg, HARD.givens, RULE.easy).solved);
  assert.equal(EASY.counts.inside, undefined);
});

// Every step the solver takes holds for the real answer: a digit it
// places is the answer's, a candidate it rules out isn't. hidden, naked
// and inside are all used.
test('colour sudoku: every solver step is right, and each kind is used', () => {
  const used = {};
  let steps = 0;
  for (const g of [EASY, HARD, HARD2]) {
    const s = newState(g.reg, g.givens);
    for (let st; (st = nextStep(s, 3)); steps++) {
      used[st.kind] = true;
      if (st.kind === 'hidden' || st.kind === 'naked') assert.equal(st.d, g.sol[st.cell], `${g.seed}: ${st.kind} at ${st.cell}`);
      if (st.kind === 'inside') for (const i of st.elim) assert.notEqual(g.sol[i], st.d, `${g.seed}: inside rules out the answer at ${i}`);
      apply(s, st);
    }
    assert.deepEqual(s.grid, g.sol, `${g.seed}: not solved to the answer`);
  }
  assert.ok(used.hidden && used.naked && used.inside, JSON.stringify(used));
  assert.ok(steps > 150, `${steps} steps`);
});

// A pair (rule 3): two squares of a box that can only be 1 or 2 rule 1
// and 2 out of the rest of the box. Built by hand: no stock puzzle needs
// one. And one square left of a full grid is "the only place" in its box.
test('colour sudoku: a pair, and the last square of a grid', () => {
  const s = newState(EASY.reg, new Array(NN).fill(0));
  s.cand[0] = s.cand[1] = 0b110;
  const st = nextStep(s, 3);
  assert.equal(st.kind, 'pair');
  assert.deepEqual([st.unit, st.cells, st.ds], [18, [0, 1], [1, 2]]);
  assert.deepEqual(st.elim, [2, 9, 10, 11, 18, 19, 20]);
  assert.equal(nextStep(s, 2), null, 'pairs are rule 3 only');
  const grid = EASY.sol.slice();
  grid[40] = 0;
  assert.deepEqual(nextStep(newState(EASY.reg, grid), 1), { kind: 'hidden', unit: 18 + boxOf(40), d: EASY.sol[40], cell: 40 });
});

// The maker takes givens out while the solver still finishes, so taking
// out any one more leaves a puzzle its level's rules can't finish.
test('colour sudoku: no given can go (each puzzle as bare as its rules allow)', () => {
  let tried = 0;
  for (const [g, rule] of [[EASY, 1], [HARD, 2]]) {
    for (let i = 0; i < NN; i++) {
      if (!g.givens[i]) continue;
      const less = g.givens.slice();
      less[i] = 0;
      assert.ok(!solve(g.reg, less, rule).solved, `${g.seed}: square ${i} wasn't needed`);
      tried++;
    }
  }
  assert.ok(tried >= 25, `only ${tried} tried`);
});

// A stock entry that's wrong in any way is caught, saying how.
test('colour sudoku: problems catches a broken puzzle', () => {
  const ok = encode(EASY.seed, EASY);
  assert.deepEqual(decode('easy', ok).sol, EASY.sol);
  const broken = (what, change) => {
    const e = [...ok];
    e[1] = [...e[1]];
    e[2] = [...e[2]];
    change(e);
    e[1] = e[1].join('');
    e[2] = e[2].join('');
    assert.throws(() => decode('easy', e), what);
  };
  const given = ok[2].search(/[1-9]/);
  broken(/a given not in the answer|can't finish/, e => { e[2][given] = String(e[2][given] % 9 + 1); });
  broken(/can't finish/, e => { e[2][given] = '0'; });
  broken(/colour \d has 10 squares/, e => { e[1][0] = e[1][0] === '0' ? '1' : '0'; });
  broken(/bad givens/, e => { e[2].pop(); });
  // Two neighbouring squares of different colours swapped: still 9 each,
  // but now a colour can repeat a digit, or a shape is split.
  let swaps = 0;
  for (let i = 0; i < NN - 1 && swaps < 5; i++) {
    if (colOf(i) === 8 || ok[1][i] === ok[1][i + 1]) continue;
    const e = [...ok];
    const r = [...e[1]];
    [r[i], r[i + 1]] = [r[i + 1], r[i]];
    e[1] = r.join('');
    assert.throws(() => decode('easy', e), undefined, `swap at ${i}`);
    swaps++;
  }
  assert.equal(swaps, 5);
  assert.deepEqual(problems({ ...puzzle('harder', EASY) }), ['no step needs "all inside"']);
  assert.match(problems({ ...puzzle('easy', EASY), sol: HARD.sol }).join(), /another answer/);
});

test('colour sudoku: the stock order is fixed, a shuffle of every puzzle; it comes round again', () => {
  const list = Array.from({ length: 200 }, (_, k) => [k]);
  const a = stockOrder('easy', list);
  assert.deepEqual(a, stockOrder('easy', list));
  assert.notDeepEqual(a, list);
  assert.deepEqual([...a].sort((x, y) => x[0] - y[0]), list);
  assert.notDeepEqual(stockOrder('harder', list), a);
  assert.equal(stockAt(a, 200), a[0]);
  assert.deepEqual(LEVELS.map(firstSeed), [100000, 200000]);
});

test('colour sudoku: colours have names and faded copies; units have names', () => {
  const col = coloursFor(EASY.reg, EASY.seed);
  assert.equal(col.length, 9);
  assert.equal(new Set(col.map(c => c.name)).size, 9);
  assert.ok(col.every(c => /^#[0-9A-F]{6}$/i.test(c.c) && /^#[0-9A-F]{6}$/.test(c.fc) && c.fc !== c.c));
  assert.deepEqual([unitName(col, 2), unitName(col, 9), unitName(col, 18, true), unitName(col, 26)], ['row 3', 'column 1', 'The top-left box', 'the bottom-right box']);
  assert.equal(unitName(col, 30), col[3].name);
});

/* ---------- a game ---------- */

const game = (g = EASY, level = 'easy', opts) => createGame(puzzle(level, g), opts);
const firstEmpty = g => g.grid.findIndex(d => !d);
const wrongFor = (g, i) => (g.sol[i] % 9) + 1;

test('colour sudoku game: a right digit stays and tidies notes; a wrong one is red and costs a heart', () => {
  const g = game();
  const i = firstEmpty(g), d = g.sol[i];
  const peer = unitsFor(g.reg).peers[i].find(j => !g.grid[j]);
  assert.ok(toggleNote(g, peer, d).on);
  assert.ok(toggleNote(g, peer, d === 1 ? 2 : 1).on);
  const r = enter(g, i, d);
  assert.deepEqual(r, { ok: true, right: true, won: false });
  assert.equal(g.grid[i], d);
  assert.equal(g.kind[i], 'mine');
  assert.equal(g.notes[peer], 1 << (d === 1 ? 2 : 1), 'Auto tidy: the note for d gone, the other kept');
  assert.deepEqual(enter(g, i, d), { ok: false, why: 'done' });
  const j = firstEmpty(g), w = wrongFor(g, j);
  assert.deepEqual(enter(g, j, w), { ok: true, wrong: true, lost: false });
  assert.deepEqual([g.bad[j], g.grid[j], g.hearts, g.mistakes], [w, 0, HEARTS - 1, 1]);
  assert.deepEqual(enter(g, j, w), { ok: false, why: 'same' }, 'the same wrong digit again costs nothing');
  assert.deepEqual(toggleNote(g, j, 3), { ok: false, why: 'wrong digit' });
  assert.ok(enter(g, j, g.sol[j]).right, 'a right digit replaces a wrong one');
  assert.equal(g.bad[j], 0);
  // I'll do it: notes stay.
  const h = game(EASY, 'easy', { tidy: false });
  toggleNote(h, peer, d);
  enter(h, i, d);
  assert.equal(h.notes[peer], 1 << d);
});

test('colour sudoku game: Undo takes back notes and wrong digits (the heart back, the mistake kept), never a right digit', () => {
  const g = game();
  assert.ok(!canUndo(g));
  assert.deepEqual(undo(g), { ok: false });
  const [a, b] = [0, 1].map(k => g.grid.map((d, i) => (d ? -1 : i)).filter(i => i >= 0)[k]);
  toggleNote(g, a, 5);
  enter(g, b, wrongFor(g, b));
  assert.equal(g.hearts, HEARTS - 1);
  assert.deepEqual(undo(g), { ok: true, t: 'bad', i: b, heart: true });
  assert.deepEqual([g.bad[b], g.hearts, g.mistakes], [0, HEARTS, 1]);
  assert.deepEqual(undo(g), { ok: true, t: 'note', i: a, heart: false });
  assert.equal(g.notes[a], 0);
  // A right digit clears its square's undo steps: they can't come back.
  toggleNote(g, a, 5);
  enter(g, a, wrongFor(g, a) === 5 ? 6 : wrongFor(g, a));
  enter(g, a, g.sol[a]);
  assert.ok(!canUndo(g));
  assert.equal(g.grid[a], g.sol[a]);
});

test('colour sudoku game: three wrong digits end it, the rest of the answer pale', () => {
  const g = game();
  let r;
  for (let k = 0; k < HEARTS; k++) {
    const i = g.grid.findIndex((d, x) => !d && !g.bad[x]);
    r = enter(g, i, wrongFor(g, i));
  }
  assert.deepEqual(r, { ok: true, wrong: true, lost: true });
  assert.equal(g.result, 'lost');
  assert.deepEqual(g.grid, g.sol);
  assert.ok(g.kind.every(k => k === 'given' || k === 'pale'));
  assert.ok(g.bad.every(d => !d));
  assert.deepEqual(enter(g, 0, 1), { ok: false, why: 'over' });
  assert.ok(!canUndo(g));
  assert.ok(!endGame(g, 'gaveup').ok);
});

test('colour sudoku game: a hint takes a wrong digit out first, then places a digit, with words and a Why?', () => {
  const g = game();
  const col = coloursFor(g.reg, g.seed);
  const j = firstEmpty(g);
  enter(g, j, wrongFor(g, j));
  const r1 = useHint(g, col);
  assert.equal(r1.h.kind, 'bad');
  assert.match(r1.h.text, /^The red \d on the ringed square \(row \d, column \d\) is wrong\./);
  assert.deepEqual([g.bad[j], g.hearts, g.hints, g.hintsUsed, canUndo(g)], [0, HEARTS - 1, HINTS - 1, 1, false], 'the heart stays lost; nothing to undo');
  const r2 = useHint(g, col);
  const { h } = r2;
  assert.ok(['hidden', 'naked'].includes(h.kind));
  assert.equal(g.grid[h.cell], g.sol[h.cell]);
  assert.equal(h.d, g.sol[h.cell]);
  assert.equal(g.kind[h.cell], 'hint');
  assert.match(h.text, /the ringed square \(row \d, column \d\)/i);
  assert.ok(h.why.length > 20 && h.tags.length > 0 && h.lit.length > 0);
  assert.doesNotMatch(h.text + h.why, /\ba 8\b|undefined|NaN/);
  // Kept as plain data with the game.
  assert.deepEqual(JSON.parse(JSON.stringify(h)), h);
  useHint(g, col);
  assert.deepEqual(useHint(g, col), { ok: false }, 'three hints only');
});

// A Harder puzzle's hints include "all inside" steps first, named in the
// words, their squares dashed; every hint's digit is the answer's.
test('colour sudoku game: hints and Show me how solve a Harder puzzle to the answer', () => {
  const g = game(HARD, 'harder');
  const col = coloursFor(g.reg, g.seed);
  const n = walkLength(g);
  assert.equal(n, emptyCount(g));
  let steps = 0, dashed = 0, done = false;
  while (!done) {
    const r = walkStep(g, col);
    assert.ok(r, 'stuck');
    assert.equal(g.grid[r.h.cell], g.sol[r.h.cell]);
    if (r.h.pre.length) { dashed++; assert.match(r.h.text, /dashed square/); }
    done = r.done;
    steps++;
  }
  assert.equal(steps, n);
  assert.ok(dashed > 0, 'no hint needed "all inside"');
  assert.deepEqual(g.grid, g.sol);
  assert.equal(g.hints, HINTS, 'Show me how uses no hints');
  // A hint that fills the last square wins.
  const w = game();
  fillRest(w);
  const last = 40;
  w.grid[last] = 0;
  w.kind[last] = '';
  const r = useHint(w, col);
  assert.ok(r.won);
  assert.equal(w.result, 'won');
  // The last right digit wins too.
  const v = game();
  fillRest(v);
  v.grid[last] = 0;
  assert.deepEqual(enter(v, last, v.sol[last]), { ok: true, right: true, won: true });
  assert.equal(v.result, 'won');
  assert.equal(digitCounts(v).slice(1).join(), '9,9,9,9,9,9,9,9,9');
});

test('colour sudoku game: kept as JSON and picked up the same; a game of another puzzle refused', () => {
  const g = game(HARD, 'harder', { tidy: false });
  const col = coloursFor(g.reg, g.seed);
  toggleNote(g, firstEmpty(g), 4);
  const j = g.grid.findIndex((d, i) => !d && !g.notes[i]);
  enter(g, j, wrongFor(g, j));
  useHint(g, col);
  useHint(g, col);
  const kept = JSON.parse(JSON.stringify(snapshotGame(g)));
  const back = restoreGame(puzzle('harder', HARD), kept);
  assert.deepEqual(snapshotGame(back), snapshotGame(g));
  assert.equal(back.tidy, false);
  // Plays on the same.
  const k = firstEmpty(g);
  assert.deepEqual(enter(back, k, back.sol[k]), enter(g, k, g.sol[k]));
  assert.deepEqual(snapshotGame(back), snapshotGame(g));
  assert.throws(() => restoreGame(puzzle('harder', HARD2), kept), /restoreGame/);
  assert.throws(() => restoreGame(puzzle('easy', EASY), kept), /level/);
  assert.throws(() => restoreGame(puzzle('harder', HARD), { ...kept, hearts: 7 }), /counts/);
  assert.throws(() => restoreGame(puzzle('harder', HARD), { ...kept, grid: kept.grid.slice(1) }), /board/);
  assert.throws(() => restoreGame(puzzle('harder', HARD), null), /level/);
});

test('colour sudoku: progress kept per level; a puzzle used as it starts; best times', () => {
  assert.deepEqual(readProgress(null), { next: {}, best: {} });
  assert.deepEqual(readProgress('not json'), { next: {}, best: {} });
  assert.deepEqual(readProgress('{"next":{"easy":3,"harder":-1,"x":2},"best":{"harder":61000,"easy":"fast"}}'), { next: { easy: 3 }, best: { harder: 61000 } });
  const prog = readProgress(null);
  assert.deepEqual([takeNext(prog, 'easy'), takeNext(prog, 'easy'), takeNext(prog, 'harder')], [0, 1, 0]);
  assert.deepEqual(prog.next, { easy: 2, harder: 1 });
  assert.deepEqual(recordTime(prog, 'easy', 300000), { best: null, newBest: true });
  assert.deepEqual(recordTime(prog, 'easy', 400000), { best: 300000, newBest: false });
  assert.deepEqual(recordTime(prog, 'easy', 200000), { best: 300000, newBest: true });
  assert.deepEqual(readProgress(JSON.stringify(prog)), prog);
});

test('colour sudoku: the pictures’ puzzle is a solved one', () => {
  assert.ok(DEMO.reg.length === NN && DEMO.sol.length === NN);
  assert.ok(regionsOk(DEMO.reg));
  assert.ok(sound(DEMO.reg, DEMO.sol));
});
