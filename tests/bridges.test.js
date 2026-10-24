// Bridges' rules, solvers, maker, hints and game (src/core/bridges.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIZES, edgesOf, counts, joined, isSolved, countAnswers, solveByLogic, nextStep, makePuzzle, MAKE, stockPuzzle, firstSeed,
  shapeKey, encode, decode, problems, DEMO, createGame, cycle, undo, canUndo, clear, standing, nextHint, useHint, walkStep,
  walkLength, fillRest, endGame, snapshotGame, restoreGame, readProgress, takeNext, recordTime,
} from '../src/core/bridges.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data/bridges.json'), 'utf8'));
const P = (n, list, size = 'medium') => ({ size, n, seed: 0, islands: list.map(([r, c, need]) => ({ r, c, need })) });
const edgeOf = (g, a, b) => g.edges.findIndex(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));

test('bridges: edges join islands that see each other; a cross is found both ways', () => {
  // a plus: (1,0)-(1,2) across, (0,1)-(2,1) down, crossing at (1,1)
  const p = P(3, [[0, 1, 1], [1, 0, 1], [1, 2, 1], [2, 1, 1]]);
  const g = edgesOf(p);
  assert.equal(g.edges.length, 2);
  const h = g.edges.findIndex(e => e.k === 'h'), v = g.edges.findIndex(e => e.k === 'v');
  assert.deepEqual([g.edges[h].crosses, g.edges[v].crosses], [[v], [h]]);
  // an island in between blocks the line of sight
  const q = P(5, [[0, 0, 1], [0, 2, 2], [0, 4, 1]]);
  assert.deepEqual(edgesOf(q).edges.map(e => [e.a, e.b]), [[0, 1], [1, 2]]);
  assert.equal(edgeOf(edgesOf(q), 0, 2), -1);
});

// The mockup's checks, shown able to fail: four 3s in a square have two
// answers (reasoning gets stuck); four 4s have one (reasoning solves it).
test('bridges: the solver counts two answers for four 3s, one for four 4s; reasoning agrees', () => {
  const sq = need => P(3, [[0, 0, need], [0, 2, need], [2, 0, need], [2, 2, need]]);
  assert.equal(countAnswers(sq(3)).found, 2);
  assert.equal(solveByLogic(sq(3)), null);
  const four = countAnswers(sq(4));
  assert.equal(four.found, 1);
  assert.deepEqual(four.answer, [2, 2, 2, 2]);
  assert.deepEqual(solveByLogic(sq(4)).board, four.answer);
  // problems says so (the same islands on a Medium board)
  assert.deepEqual(problems({ ...sq(3), n: 7 }), ['2 answers']);
  assert.deepEqual(problems({ ...sq(3), n: 3 }), ['n 3, not 7']);
});

test('bridges: solved needs every number and all joined', () => {
  // two pairs that can't see each other: every island right, not joined
  const p = P(5, [[0, 0, 1], [0, 2, 1], [2, 1, 1], [2, 3, 1]]);
  const g = edgesOf(p);
  const board = g.edges.map(() => 1);
  assert.deepEqual(counts(p, g, board), [1, 1, 1, 1]);
  assert.equal(joined(p, g, board), false);
  assert.equal(isSolved(p, g, board), false);
  assert.equal(countAnswers(p).found, 0);
  const G = createGame(p);
  G.board = board;
  assert.equal(standing(G).notJoined, true);
  assert.equal(standing(G).done, 4);
});

test('bridges: a tap cycles 0, 1, 2, 0; a crossing is refused; Undo and Clear', () => {
  const p = P(3, [[0, 1, 2], [1, 0, 2], [1, 2, 2], [2, 1, 2]]);
  const G = createGame(p);
  const h = G.g.edges.findIndex(e => e.k === 'h'), v = G.g.edges.findIndex(e => e.k === 'v');
  assert.deepEqual([cycle(G, h).count, cycle(G, h).count, cycle(G, h).count], [1, 2, 0]);
  assert.equal(G.undo.length, 3);
  cycle(G, h);
  const r = cycle(G, v);
  assert.deepEqual([r.ok, r.why, r.by], [false, 'crosses', [h]]);
  assert.equal(G.board[v], 0);
  assert.equal(G.undo.length, 4, 'a refused bridge is an Undo step');
  assert.ok(undo(G).ok);
  assert.equal(G.board[h], 0);
  assert.equal(cycle(G, v).ok, true, 'once the other is gone, it goes down');
  assert.ok(clear(G).ok);
  assert.deepEqual(G.board, [0, 0]);
  assert.ok(undo(G).ok, 'Clear can be undone');
  assert.equal(G.board[v], 1);
  assert.deepEqual(cycle(G, 99), { ok: false, why: 'no edge' });
  assert.equal(standing(G).state.filter(s => s === 'over').length, 0);
});

test('bridges: the last bridge solves it; then the board takes no more', () => {
  const p = P(3, [[0, 0, 2], [0, 2, 2]], 'small');
  p.n = 5;
  const G = createGame(p);
  assert.equal(cycle(G, 0).won, false);
  const r = cycle(G, 0);
  assert.deepEqual([r.ok, r.won, G.result], [true, true, 'won']);
  assert.equal(cycle(G, 0).ok, false);
  assert.equal(canUndo(G), false);
});

// Hints take their step and say why: from an empty board they solve a
// stock puzzle of each size, every one a reasoning step with its words.
test('bridges: hints alone solve a stock puzzle of each size, each with its reason', () => {
  for (const size of SIZES) {
    const p = decode(size, data[size][0]);
    const G = createGame(p);
    let k = 0, r;
    do {
      r = useHint(G);
      assert.ok(r.ok, `${size}: hint ${k + 1} not taken: ${r.why}`);
      assert.equal(r.h.kind, 'step', `${size}: hint ${k + 1} is ${r.h.kind}`);
      assert.ok(r.h.island >= 0 && r.h.put.length >= 1);
      if (size === 'small') assert.match(r.h.text, /^Here (is a bridge|are bridges) for the ringed island\.$/);
      else assert.match(r.h.text, /^The ringed island needs \d\. It can take at most .*: \d in all\. So (it takes every one of them:|even with the most everywhere else, it needs) /);
      k++;
    } while (!r.won && k < 100);
    assert.equal(G.result, 'won', size);
    assert.equal(G.hints, k);
    assert.deepEqual(G.board, G.answer);
    assert.deepEqual(useHint(G), { ok: false, why: 'over' });
  }
});

// A bridge not in the answer comes off first (one of two, when the answer
// has one there).
test('bridges: a hint takes off a wrong bridge first', () => {
  const p = decode('large', data.large[0]);
  const G = createGame(p);
  const e = G.answer.findIndex(k => k === 0);
  G.board[e] = 2;
  const r = useHint(G);
  assert.equal(r.h.kind, 'wrong');
  assert.deepEqual(r.h.put, [{ edge: e, count: 0 }]);
  assert.equal(G.board[e], 0);
  assert.match(r.h.text, /isn’t part of the answer, so it came off/);
  const one = G.answer.findIndex(k => k === 1);
  G.board[one] = 2;
  assert.match(useHint(G).h.text, /so one of the two came off/);
  assert.equal(G.board[one], 1);
  const kid = createGame(decode('small', data.small[0]));
  const ke = kid.answer.findIndex(k => k < 2);
  kid.board[ke] = kid.answer[ke] + 1;
  assert.equal(useHint(kid).h.text, 'That bridge doesn’t belong there, so it came off.');
});

// Show me how: from the player's board, the same steps with no hint used,
// as many as walkLength says; the last one doesn't end the game.
test('bridges: Show me how walks from the player’s board; ⏩ The rest fills in the answer', () => {
  const p = decode('medium', data.medium[3]);
  const G = createGame(p);
  // the player's own start: two bridges of the answer and a wrong one
  const right = G.answer.map((k, e) => (k ? e : -1)).filter(e => e >= 0).slice(0, 2);
  for (const e of right) G.board[e] = G.answer[e];
  const wrong = G.answer.findIndex((k, e) => k === 0 && !G.g.edges[e].crosses.some(f => G.board[f]));
  G.board[wrong] = 1;
  const total = walkLength(G);
  assert.deepEqual(G.board[wrong], 1, 'walkLength changed the board');
  let steps = 0, r;
  do { r = walkStep(G); steps++; } while (r.ok && !r.won && steps < 100);
  assert.equal(steps, total);
  assert.equal(G.hints, 0);
  assert.equal(G.result, null);
  assert.deepEqual(G.board, G.answer);
  endGame(G, 'shown');
  assert.equal(G.result, 'shown');
  // the rest at once
  const H = createGame(p);
  H.board[right[0]] = H.answer[right[0]];
  const changed = fillRest(H);
  assert.deepEqual(H.board, H.answer);
  assert.equal(changed.includes(right[0]), false);
  assert.equal(changed.length, H.answer.filter(Boolean).length - 1);
});

test('bridges: nextHint gives nothing on a solved board; nextStep nothing when stuck', () => {
  const p = decode('small', data.small[1]);
  const G = createGame(p);
  G.board = [...G.answer];
  assert.equal(nextHint(G), null);
  const sq = P(3, [[0, 0, 3], [0, 2, 3], [2, 0, 3], [2, 2, 3]]);
  const g = edgesOf(sq);
  assert.equal(nextStep(sq, g, g.edges.map(() => 1)), null);
});

test('bridges: a game is kept and picked up as it was; one that doesn’t fit is refused', () => {
  const p = decode('medium', data.medium[0]);
  const G = createGame(p);
  useHint(G);
  assert.ok(cycle(G, G.board.findIndex((k, e) => k === 0 && !G.g.edges[e].crosses.some(f => G.board[f]))).ok);
  const kept = JSON.parse(JSON.stringify(snapshotGame(G)));
  const H = restoreGame(p, kept);
  assert.deepEqual([H.board, H.undo, H.hints, H.result], [G.board, G.undo, G.hints, G.result]);
  assert.throws(() => restoreGame(p, { ...kept, board: [1, 2] }), /doesn’t fit/);
  assert.throws(() => restoreGame(p, { ...kept, undo: [[3]] }), /doesn’t fit/);
  assert.equal(restoreGame(p, { ...kept, result: 'nonsense', hints: -2 }).result, null);
});

test('bridges: progress per size: the next puzzle counted as it starts, the best time', () => {
  assert.deepEqual(readProgress('not json'), { next: {}, best: {} });
  assert.deepEqual(readProgress('{"next":{"small":3,"huge":2,"large":-1},"best":{"medium":5000,"small":0}}'), { next: { small: 3 }, best: { medium: 5000 } });
  const prog = readProgress(null);
  assert.deepEqual([takeNext(prog, 'small'), takeNext(prog, 'small'), takeNext(prog, 'large')], [0, 1, 0]);
  assert.deepEqual(recordTime(prog, 'small', 9000), { best: null, newBest: true });
  assert.deepEqual(recordTime(prog, 'small', 12000), { best: 9000, newBest: false });
  assert.deepEqual(recordTime(prog, 'small', 4000), { best: 9000, newBest: true });
  assert.equal(prog.best.small, 4000);
});

// The maker: the same seed makes the same puzzle; a kept one is sound; the
// stored form round-trips; problems names what's wrong.
test('bridges: the maker is seeded; decode refuses a puzzle that isn’t one', () => {
  const s = firstSeed('medium');
  let seed = s, p = null;
  while (!(p = stockPuzzle('medium', seed))) seed++;
  assert.deepEqual(stockPuzzle('medium', seed), p);
  assert.deepEqual(makePuzzle(MAKE.medium.n, seed, MAKE.medium).islands, p.islands);
  assert.deepEqual(decode('medium', encode(p)).islands, p.islands);
  assert.throws(() => decode('medium', [1, '001 011']), /side by side/);
  assert.throws(() => decode('small', [1, '009 041']), /wants 9/);
  assert.throws(() => decode('huge', [1, '001 021']), /bad size/);
  assert.throws(() => decode('small', [1, '003 023 203 223']), /2 answers/);
  const fail = {};
  for (let k = 0; k < 50; k++) stockPuzzle('large', firstSeed('large') + k, fail);
  assert.ok(Object.values(fail).reduce((a, b) => a + b, 0) > 0, 'nothing turned away in 50 seeds');
});

test('bridges: a puzzle turned or flipped has the same shape key; another doesn’t', () => {
  const p = decode('medium', data.medium[0]);
  const m = p.n - 1;
  const turned = { ...p, islands: p.islands.map(s => ({ r: s.c, c: m - s.r, need: s.need })) };
  const flipped = { ...p, islands: p.islands.map(s => ({ r: s.r, c: m - s.c, need: s.need })) };
  assert.equal(shapeKey(turned), shapeKey(p));
  assert.equal(shapeKey(flipped), shapeKey(p));
  assert.notEqual(shapeKey(decode('medium', data.medium[1])), shapeKey(p));
});

test('bridges: the rules picture’s puzzle is sound', () => {
  assert.deepEqual(problems(DEMO), []);
  assert.equal(DEMO.islands.length, 6);
});
