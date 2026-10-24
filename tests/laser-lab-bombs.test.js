// Directional bombs (src/core/laser-lab.js; 3.9, from mockups v8-v9): a beam of
// the bomb's colour coming in from behind sets it off and the wall it
// points at comes down; another colour, or a beam from another side,
// stops at it; the lasers shine in the order switched on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  trace, check, checkLamp, solveCheap, cheapest, answerMap, boardOf, encode, decode, makeCheap, makeOptions,
  createGame, tapSquare, inOrder, workingOrder,
} from '../src/core/laser-lab.js';

const none = new Map();
// 6 x 6, one laser left of row 2 shining right; a bomb at (2, 2) pointing
// right at a wall at (2, 3), a gem at the row's end
const one = { n: 6, lamps: [{ side: 3, k: 2, c: 1 }], walls: [[2, 3]], gems: [[2, 5, 1]], bombs: [[2, 2, 1, 1]] };

test('bombs: the beam sets it off, the wall beyond comes down, the beam carries on', () => {
  const t = trace(one, none);
  assert.deepEqual([...t.gone].sort((a, b) => a - b), [14, 15], 'the bomb and the wall gone');
  assert.equal(t.lit.get(17), 1, 'the gem behind the wall lit');
  assert.equal(t.blasts.length, 1);
  assert.ok(check(one, none).ok);
  const wall = { ...one, walls: [[2, 3], [2, 2]], bombs: [] };
  assert.ok(!check(wall, none).ok, 'with a wall in its place the gem stays dark');
});

test('bombs: only a beam from behind sets one off; from the side it stops there', () => {
  // the laser above column 2: the beam comes down on the bomb's side
  const down = { ...one, lamps: [{ side: 0, k: 2, c: 1 }], gems: [[2, 5, 1], [5, 2, 1]] };
  const t = trace(down, none);
  assert.ok(!t.gone.size, 'nothing went off');
  assert.equal(t.lit.get(32), undefined, 'the beam stopped at the bomb');
  const c = checkLamp(down, none, 0, []);
  assert.deepEqual(c.blocked, [{ i: 14, why: 'side' }], 'the miss says it came from the side');
  // pointing down instead, the same beam sets it off (no wall below: the
  // beam carries on)
  const below = { ...down, bombs: [[2, 2, 1, 2]] };
  const u = trace(below, none);
  assert.ok(u.gone.has(14) && !u.gone.has(15) && u.lit.get(32) === 1, 'set off from behind, the beam on down');
});

// two lasers: red left of row 2, blue above column 3; a red bomb at (2, 2)
// before a wall at (2, 3), which blue's column runs into; red's gem at the
// row's end, blue's at the column's foot
const two = {
  n: 6, lamps: [{ side: 3, k: 2, c: 1 }, { side: 0, k: 3, c: 2 }],
  walls: [[2, 3]], gems: [[2, 5, 1], [5, 3, 2]], bombs: [[2, 2, 1, 1]],
};

test('colour bombs: red first opens the way for blue; blue first is wrong', () => {
  assert.ok(checkLamp(two, none, 0, []).ok, 'red alone right');
  assert.ok(!checkLamp(two, none, 1, []).ok, 'blue first stops at the wall');
  const after = checkLamp(two, none, 1, [0]);
  assert.ok(after.ok && after.solved, 'blue after red: solved');
  assert.ok(check(two, none).ok);
  assert.ok(inOrder(two, none, [0, 1]) && !inOrder(two, none, [1, 0]));
  assert.deepEqual(workingOrder(two, none), [0, 1]);
});

test('colour bombs: the other colour stops at the bomb, and carries on once it goes', () => {
  // blue above column 2 runs into the red bomb; red then sets it off
  const q = { ...two, lamps: [{ side: 3, k: 2, c: 1 }, { side: 0, k: 2, c: 2 }], gems: [[2, 5, 1], [5, 2, 2]] };
  const blue = checkLamp(q, none, 1, []);
  assert.ok(!blue.ok && blue.blocked.some(x => x.i === 14 && x.why === 'colour'), 'blue stopped at the red bomb');
  const t = trace(q, none, [1, 0]);
  assert.equal(t.lit.get(32), 2, 'blue carried on down once red set it off');
  assert.ok(t.segs.some(g => g.li === 1 && g.phase === 1), 'blue’s carrying on drawn with red’s turn');
  // a blue bomb isn't set off by red
  const blueBomb = { ...two, bombs: [[2, 2, 2, 1]] };
  assert.ok(!trace(blueBomb, none, [0]).gone.size, 'red leaves a blue bomb');
});

test('bombs: the solver finds the cheapest ways the rules allow, and only those', () => {
  // every placement of up to two pieces on a 5 x 5 with a red bomb, its
  // pieces all touched by a beam, judged by check, against the solver
  const p = {
    n: 5, lamps: [{ side: 3, k: 1, c: 1 }, { side: 0, k: 3, c: 2 }],
    walls: [[1, 3], [3, 0]], gems: [[4, 3, 2], [3, 4, 1]], bombs: [[1, 2, 1, 1]],
  };
  const b = boardOf(p), free = [...b.keys()].filter(i => b[i] === '.');
  const opts = [{ t: 'm', o: 0 }, { t: 'm', o: 1 }, { t: 's', o: 0 }, { t: 's', o: 1 }];
  const key = m => [...m].sort((x, y) => x[0] - y[0]).map(([i, pc]) => `${i}${pc.t}${pc.o}`).join(' ');
  const want = new Set();
  const judge = m => { const c = check(p, m); if (c.ok && c.touched.size === m.size) want.add(key(m)); };
  judge(new Map());
  for (const i of free) for (const a of opts) {
    judge(new Map([[i, a]]));
    for (const j of free) if (j > i) for (const b2 of opts) judge(new Map([[i, a], [j, b2]]));
  }
  const cost = m => [...m.values()].reduce((k, pc) => k + (pc.t === 'm' ? 1 : 2), 0);
  const cap = 4;
  const got = new Set(solveCheap(p, cap, 1e6).answers.map(a => key(answerMap(a, p.n))));
  const twoOrLess = [...got].filter(k => k.split(' ').filter(Boolean).length <= 2);
  const wanted = [...want].filter(k => cost(new Map(k.split(' ').filter(Boolean).map(w => [Number(w.match(/^\d+/)[0]), { t: w.at(-2), o: Number(w.at(-1)) }]))) <= cap);
  assert.ok(wanted.length > 0, 'nothing to compare');
  assert.deepEqual(twoOrLess.sort(), wanted.sort(), `solver ${twoOrLess.length} ways, check ${wanted.length}`);
  for (const a of solveCheap(p, cap, 1e6).answers) assert.ok(check(p, answerMap(a, p.n)).ok, 'a solver answer check refuses');
});

test('bombs: the maker puts in a bomb that saves coins; kept and read back', () => {
  for (const [setup, seed0] of [['6-1', 1], ['6-2', 1]]) {
    let p = null, seed = seed0;
    for (let k = 0; !p && k < 3000; k++) p = makeCheap(seed++, { ...makeOptions(setup), bomb: true });
    assert.ok(p, `${setup}: no bomb puzzle in 3000 seeds`);
    assert.equal(p.bombs.length, 1);
    assert.ok(check(p, answerMap(p.answer, p.n)).ok, `${setup}: its answer isn't right`);
    const w = { ...p, walls: [...p.walls, ...p.bombs.map(([r, c]) => [r, c])], bombs: [] };
    const without = solveCheap(w, p.cheapest, 1, 5e6);
    assert.ok(!without.over && !without.answers.length, `${setup}: the bomb saves nothing (a way at ${p.cheapest} without it)`);
    const back = decode(setup, encode(p));
    assert.deepEqual(back.bombs, p.bombs, 'bombs kept');
    if (setup === '6-2') assert.ok(p.bombs[0][2] === 1 || p.bombs[0][2] === 2, 'a two-laser bomb is red or blue');
    const [r, c, , d] = p.bombs[0], ahead = [r + [-1, 0, 1, 0][d], c + [0, 1, 0, -1][d]];
    assert.ok(p.walls.some(([wr, wc]) => wr === ahead[0] && wc === ahead[1]), `${setup}: the bomb doesn't point at a wall`);
  }
});

test('bombs: a bomb’s square takes no piece', () => {
  const g = createGame(one, '6-1', 0);
  assert.deepEqual(tapSquare(g, one, 14, 'm'), { ok: false, why: 'bomb' });
});

// The same against every placement of up to two pieces, on random 5 x 5
// boards with one or two lasers, a bomb and a wall beside it: the solver's
// ways (cost 4 or less) are exactly the ones check passes.
test('bombs: on random small boards the solver and check agree', async () => {
  const { mulberry32 } = await import('../src/core/hidden-faces.js');
  const R = mulberry32(11), ri = k => Math.floor(R() * k);
  const opts = [{ t: 'm', o: 0 }, { t: 'm', o: 1 }, { t: 's', o: 0 }, { t: 's', o: 1 }];
  const key = m => [...m].sort((x, y) => x[0] - y[0]).map(([i, pc]) => `${i}${pc.t}${pc.o}`).join(' ');
  const cost = m => [...m.values()].reduce((k, pc) => k + (pc.t === 'm' ? 1 : 2), 0);
  let boards = 0, ways = 0;
  for (let b0 = 0; b0 < 40; b0++) {
    const n = 5, lasers = 1 + (b0 % 2), used = new Set();
    const spot = () => { let i; do i = ri(n * n); while (used.has(i)); used.add(i); return [Math.floor(i / n), i % n]; };
    const lamps = [{ side: 3, k: ri(n), c: 1 }, { side: 0, k: ri(n), c: 2 }].slice(0, lasers);
    const [br, bc] = spot(), d = ri(4), wr = br + [-1, 0, 1, 0][d], wc = bc + [0, 1, 0, -1][d];
    if (wr < 0 || wc < 0 || wr >= n || wc >= n || used.has(wr * n + wc)) continue;
    used.add(wr * n + wc);
    const walls = [[wr, wc], spot()], gems = [[...spot(), 1], ...(lasers > 1 ? [[...spot(), 2]] : [[...spot(), 1]])];
    const p = { n, lamps, walls, gems, bombs: [[br, bc, 1 + ri(lasers), d]] };
    const b = boardOf(p), free = [...b.keys()].filter(i => b[i] === '.');
    const want = new Set();
    const judge = m => { if (cost(m) > 4) return; const c = check(p, m); if (c.ok && c.touched.size === m.size) want.add(key(m)); };
    judge(new Map());
    for (const i of free) for (const a of opts) {
      judge(new Map([[i, a]]));
      for (const j of free) if (j > i) for (const b2 of opts) judge(new Map([[i, a], [j, b2]]));
    }
    const got = solveCheap(p, 4, 1e6).answers.map(a => key(answerMap(a, p.n))).filter(k => k.split(' ').filter(Boolean).length <= 2);
    assert.deepEqual(got.sort(), [...want].sort(), `board ${b0}: ${JSON.stringify(p)}`);
    boards++; ways += want.size;
  }
  assert.ok(boards >= 20 && ways >= 20, `only ${boards} boards, ${ways} ways compared`);
});

test('colour bombs: a laser wrong before the bomb went off can go on once it has', async () => {
  const { switchLamp } = await import('../src/core/laser-lab.js');
  // the blue bomb opens red's way: red first is wrong, then blue, then red
  const q = { ...two, bombs: [[2, 2, 2, 1]], lamps: [{ side: 0, k: 3, c: 1 }, { side: 3, k: 2, c: 2 }], gems: [[5, 3, 1], [2, 5, 2]] };
  const g = createGame(q, '6-2', 0);
  g.pieces[0] = 'm0';   // something on the board (an untouched mirror), so the lasers can go on
  assert.ok(!switchLamp(g, q, 0).res.ok, 'red first wrong');
  assert.equal(switchLamp(g, q, 0).refused, 'nothing moved', 'red again at once: refused');
  assert.ok(switchLamp(g, q, 1).res.ok, 'blue right');
  const r = switchLamp(g, q, 0);
  assert.ok(!r.refused && r.res.ok && r.res.solved, 'red after blue: solved');
});
