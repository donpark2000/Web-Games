import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZES, freshBoard, at, flipsFor, legalMoves, discCounts, createMatch, newRound, play, squareWeight, robotMove, ROBOT,
} from '../src/core/reversi.js';

// A small repeatable random source (mulberry32), as in the other tests.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const robotMatch = (o = {}) => createMatch({ vsRobot: true, p1: 'bear', firstRule: 'alt', ...o });
const twoMatch = (o = {}) => createMatch({ vsRobot: false, p1: 'bear', p2: 'cat', firstRule: 'alt', ...o });

// A board from rows of '.', 'x' (player 1) and 'o' (player 2).
function boardOf(rows) {
  return { n: rows.length, cells: rows.join('').split('').map(ch => (ch === 'x' ? 1 : ch === 'o' ? 2 : 0)) };
}

test('the starting four: the starter (black) on the top-right and bottom-left', () => {
  for (const n of SIZES) {
    const b = freshBoard(n, 1);
    const m = n / 2;
    assert.equal(at(b, m - 1, m), 1);
    assert.equal(at(b, m, m - 1), 1);
    assert.equal(at(b, m - 1, m - 1), 2);
    assert.equal(at(b, m, m), 2);
    assert.deepEqual(discCounts(b), { 1: 2, 2: 2 });
    assert.equal(legalMoves(b, 1).length, 4, `${n}: black has four first moves`);
  }
  assert.equal(at(freshBoard(6, 2), 2, 3), 2, 'player 2 starting is black');
});

test('flips: a trapped line flips, a line with a gap or nothing to trap does not', () => {
  const b = boardOf([
    '......',
    '.xoo..',
    '..o...',
    '..ox..',
    '...o..',
    '......',
  ]);
  assert.deepEqual(flipsFor(b, 1, 4, 1), [[1, 3], [1, 2]], 'two trapped, nearest first');
  assert.deepEqual(flipsFor(b, 5, 3, 1), [[4, 3]], 'one trapped, upwards');
  assert.deepEqual(flipsFor(b, 0, 2, 1), [], 'down runs o o o, then a gap');
  assert.deepEqual(flipsFor(b, 1, 0, 2), [[1, 1]], 'o traps x against o');
  assert.deepEqual(flipsFor(b, 1, 1, 2), [], 'a taken square');
  assert.deepEqual(flipsFor(b, -1, 0, 1), [], 'off the board');
});

test('a move in all eight directions flips them all', () => {
  const b = boardOf([
    'x.x.x.',
    '.ooo..',
    'xo.ox.',
    '.ooo..',
    'x.x.x.',
    '......',
  ]);
  assert.equal(flipsFor(b, 2, 2, 1).length, 8);
});

test('play: flips, then the turn passes; refused moves change nothing', () => {
  const m = twoMatch();
  const before = JSON.stringify(m.board);
  assert.deepEqual(play(m, 0, 0), { ok: false, why: 'no-flips' });
  assert.deepEqual(play(m, 2, 2), { ok: false, why: 'taken' });
  assert.deepEqual(play(m, 9, 9), { ok: false, why: 'bad-square' });
  assert.equal(JSON.stringify(m.board), before);
  assert.equal(m.turn, 1);
  // Above the top-left white disc: traps it against black's (3, 2).
  assert.deepEqual(play(m, 1, 2), { ok: true, flips: [[2, 2]] });
  assert.equal(m.turn, 2);
  assert.deepEqual(discCounts(m.board), { 1: 4, 2: 1 });
  assert.deepEqual(m.last, { r: 1, c: 2, by: 1, flips: [[2, 2]] });
  play(m, 1, 1);
  assert.equal(m.last.by, 2);
});

test('the end when neither can move: scored, the next starter', () => {
  const m = twoMatch();
  m.board = boardOf([
    'xo....',
    '......',
    '......',
    '......',
    '......',
    '.....x',
  ]);
  play(m, 0, 2);   // traps (0, 1): no o left, so nobody can move
  assert.deepEqual(m.result, { winner: 1, discs: { 1: 4, 2: 0 } });
  assert.deepEqual(m.scores, { 1: 1, 2: 0 });
  assert.equal(m.starter, 2, 'take turns: the other starts next');
  assert.deepEqual(play(m, 3, 3), { ok: false, why: 'round-over' });
});

test('a pass: no move for one player, so the other goes again', () => {
  const m = twoMatch();
  m.board = boardOf([
    'xoo...',
    'o.....',
    '......',
    '......',
    '......',
    '......',
  ]);
  assert.ok(play(m, 0, 3).ok);
  // x x x x along the top, o at (1, 0): o has nothing to trap against; x
  // can still trap (1, 0) from (2, 0).
  assert.equal(m.passed, 2);
  assert.equal(m.turn, 1);
  assert.equal(m.result, null);
  play(m, 2, 0);
  assert.ok(m.result, 'then o is gone: over');
});

test('a tie scores nobody', () => {
  const m = twoMatch();
  m.board = boardOf([
    'xxxooo',
    'xxxooo',
    'xxxooo',
    'xxxooo',
    'xxxooo',
    'xo.ooo',
  ]);
  play(m, 5, 2);   // flips (5, 1) only: 18 each, the board full
  assert.deepEqual(m.result, { winner: 0, discs: { 1: 18, 2: 18 } });
  assert.deepEqual(m.scores, { 1: 0, 2: 0 });
});

test('whole random rounds at both sizes: whoever has the turn can move, the starter plays black', () => {
  const rand = seeded(7);
  for (const size of SIZES) {
    for (const firstRule of ['alt', 'win', 'lose']) {
      const m = twoMatch({ size, firstRule });
      for (let round = 0; round < 4; round++) {
        assert.equal(m.black, m.starter);
        assert.equal(m.turn, m.starter, 'black moves first');
        let moves = 0;
        while (!m.result) {
          const legal = legalMoves(m.board, m.turn);
          assert.ok(legal.length, 'whoever has the turn can move');
          const pick = legal[Math.floor(rand() * legal.length)];
          assert.ok(play(m, pick.r, pick.c).ok);
          assert.ok(++moves <= size * size - 4, 'at most one move per empty square');
        }
        assert.equal(legalMoves(m.board, 1).length + legalMoves(m.board, 2).length, 0, 'over only when neither can move');
        newRound(m);
      }
    }
  }
});

test('square weights: corners best, the squares by a corner worst', () => {
  for (const n of SIZES) {
    const e = n - 1;
    for (const [r, c] of [[0, 0], [0, e], [e, 0], [e, e]]) assert.equal(squareWeight(n, r, c), 100);
    for (const [r, c] of [[1, 1], [1, e - 1], [e - 1, 1], [e - 1, e - 1]]) assert.equal(squareWeight(n, r, c), -50);
    assert.equal(squareWeight(n, 0, 1), -20);
    assert.equal(squareWeight(n, e, e - 1), -20);
    assert.equal(squareWeight(n, 0, 2), 10);
    assert.equal(squareWeight(n, 2, 2), -1);
  }
});

test('the robot: always a legal move; Hard takes the corner on offer', () => {
  const rand = seeded(3);
  for (const level of ['easy', 'hard']) {
    const m = robotMatch({ size: 6 });
    while (!m.result) {
      const legal = legalMoves(m.board, m.turn);
      const pick = m.turn === 2 ? robotMove(m.board, 2, level, rand) : legal[Math.floor(rand() * legal.length)];
      assert.ok(legal.some(x => x.r === pick.r && x.c === pick.c), `${level}: ${JSON.stringify(pick)} is legal`);
      play(m, pick.r, pick.c);
    }
  }
  const b = boardOf([
    '.xxo..',
    '......',
    '......',
    '...ox.',
    '......',
    '......',
  ]);
  // o's moves: the corner (0, 0), trapping two along the edge, or (3, 5),
  // trapping one.
  assert.equal(legalMoves(b, 2).length, 2);
  const m = robotMove(b, 2, 'hard', seeded(1));
  assert.deepEqual([m.r, m.c], [0, 0]);
  assert.throws(() => robotMove(boardOf(['xx', 'xx']), 2), /no moves/);
});

test('Hard beats Easy in most games, at both sizes', () => {
  const rand = seeded(11);
  for (const size of SIZES) {
    let hardWins = 0;
    const games = size === 6 ? 20 : 8;
    for (let g = 0; g < games; g++) {
      const m = twoMatch({ size });
      if (g % 2) { m.starter = 2; newRound(m); }
      // player 2 Hard, player 1 Easy; each starts half the games
      while (!m.result) {
        const pick = robotMove(m.board, m.turn, m.turn === 2 ? 'hard' : 'easy', rand);
        play(m, pick.r, pick.c);
      }
      if (m.result.winner === 2) hardWins++;
    }
    assert.ok(hardWins >= games * 0.75, `${size}: Hard won ${hardWins} of ${games}`);
  }
});

test('setup checks', () => {
  assert.throws(() => createMatch({ vsRobot: true, p1: null, firstRule: 'alt' }), /can't start/);
  assert.throws(() => robotMatch({ size: 7 }), /unknown size/);
  assert.throws(() => robotMatch({ level: 'medium' }), /unknown level/);
  assert.equal(robotMatch().faces[1], ROBOT);
  assert.equal(robotMatch().size, 6, '6 x 6 by default');
});
