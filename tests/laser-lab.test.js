// Laser Lab's rules, solver, maker, game and runs (src/core/laser-lab.js).
// Hand-made boards for the rules; made puzzles for the maker; the
// expected values from the mockup's core (lp-core.js, v7), which the
// port matched on 1,500 seeds (journal, "Laser Lab built").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN, MARGIN, PRICE, SETUPS, trace, check, checkLamp, solveCheap, cheapest, answersFor, costOf, answerCost, answerMap,
  makeCheap, makeOptions, stockPuzzle, bothUsePieces, firstSeed, stockOrder, isPurple, encode, decode, DEMO, MAKE,
  createGame, placedOf, budgetLeft, tapSquare, clearBoard, switchLamp, readyLamps, missWords, rightWords, useHint, giveUp, tryAgain, coins, HEARTS,
  closest, snapshotGame, restoreGame, readProgress, runOf, keepCurrent, finishPuzzle, boardOf, endWords, bestView, spent,
} from '../src/core/laser-lab.js';
import { mulberry32 } from '../src/core/hidden-faces.js';

const M0 = { t: 'm', o: 0 }, S0 = { t: 's', o: 0 };
// 5 x 5, one lamp left of row 2 shining right; a gem at its end
const p1 = { n: 5, lamps: [{ side: 3, k: 2, c: 1 }], walls: [], gems: [[2, 4, 1]] };
// two lamps: red from the left of row 2, blue from above column 4; one gem
// at (2, 4) where both arrive
const p2 = { n: 5, lamps: [{ side: 3, k: 2, c: 1 }, { side: 0, k: 4, c: 2 }], walls: [], gems: [[2, 4, 3]] };

test('laser lab: a beam runs straight, turns at a mirror, leaves an open edge, breaks a laser it shines into', () => {
  let c = check(p1, new Map());
  assert.ok(c.ok && c.lit.get(14) === 1, 'straight in: the gem lit');
  c = check(p1, new Map([[12, M0]]));
  assert.ok(!c.ok && c.unlit.length === 1 && !c.hits.size && c.segs.some(s => s.end === 'edge'), 'turned up by "/": off the top edge');
  c = check({ ...p1, lamps: [...p1.lamps, { side: 0, k: 2, c: 2 }] }, new Map([[12, M0]]));
  assert.ok(c.hits.has(0) && c.hits.has(1), 'into the top laser, and its beam into the left one: both broken');
  c = check(p1, new Map([[12, S0]]));
  assert.ok(c.ok && c.touched.has(12) && c.segs.some(s => s.end === 'edge'), 'a splitter: through to the gem, and a copy up off the edge');
});

test('laser lab: two colours; purple wants both, red only red', () => {
  let c = check(p2, new Map());
  assert.ok(c.ok && c.lit.get(14) === 3, 'purple lit by red and blue');
  c = check({ ...p2, gems: [[2, 4, 1]] }, new Map());
  assert.ok(!c.ok && c.wrong.length === 1, 'a red gem lit by both: wrong');
});

// Each laser a switch (v4): judged on its own colour; the last one right
// solves it.
test('laser lab: each laser judged on its own colour; the last right one solves', () => {
  let k = checkLamp(p2, new Map(), 0);
  assert.ok(k.ok && !k.solved && k.lit.get(14) === 1, 'red alone on purple: right, not solved');
  k = checkLamp(p2, new Map(), 1, [0]);
  assert.ok(k.ok && k.solved, 'then blue: solved');
  k = checkLamp({ ...p2, gems: [[2, 4, 1]] }, new Map(), 1, [0]);
  assert.ok(!k.ok && k.wrong.length === 1, 'blue on a red gem: wrong');
  k = checkLamp({ ...p2, gems: [[2, 4, 2]] }, new Map(), 0);
  assert.ok(!k.ok && k.wrong.length === 1, 'red on a blue gem: wrong');
  k = checkLamp(p1, new Map([[12, M0]]), 0);
  assert.ok(!k.ok && k.unlit.length === 1 && k.solved === false, 'turned away: unlit');
  k = checkLamp({ ...p2, lamps: [p2.lamps[0], { side: 0, k: 2, c: 2 }] }, new Map([[12, M0]]), 0);
  assert.ok(!k.ok && k.hits.has(1) && !k.last, 'red turned up into the blue laser: broken, not the last');
  k = checkLamp(p1, new Map([[0, M0]]), 0);
  assert.ok(k.ok && k.solved, 'a piece no beam touches is allowed (only money wasted)');
});

test('laser lab: the cheapest cost, proved; every answer up to a cap', () => {
  const v = { n: 5, lamps: [{ side: 3, k: 2, c: 1 }], walls: [], gems: [[0, 2, 1]] };
  const ch = cheapest(v);
  assert.equal(ch.cost, 1);
  assert.deepEqual(ch.answers, [[{ r: 2, c: 2, t: 'm', o: 0 }]]);
  // with 2 to spend: also the splitter, and two mirrors up and along the
  // top row from columns 1, 2, 4 and 5 (the mockup's count)
  assert.equal(solveCheap(v, 2, 20).answers.length, 6);
  assert.equal(solveCheap(v, 0, 10).answers.length, 0);
  // two gems, one straight on and one below: only a '\' splitter at (2, 2)
  // lights both (a search that never tried it found none)
  const sp = { n: 5, lamps: [{ side: 3, k: 2, c: 1 }], walls: [], gems: [[2, 4, 1], [4, 2, 1]] };
  assert.deepEqual(cheapest(sp), { cost: 2, answers: [[{ r: 2, c: 2, t: 's', o: 1 }]], nodes: cheapest(sp).nodes });
  assert.equal(costOf(new Map([[12, S0], [3, { t: 'm', o: 1 }]])), PRICE.s + PRICE.m);
  assert.equal(answerCost([{ t: 's' }, { t: 'm' }, { t: 'm' }]), 4);
  const over = solveCheap({ ...v, gems: [[4, 4, 1]] }, 8, 50, 10);
  assert.ok(over.over && over.nodes > 10, 'the search budget stops it');
});

// The maker: walls until nothing is cheaper than the floor; the cheapest
// proved; every kept answer right at it. A few puzzles per small setup.
test('laser lab: made puzzles: cheapest at or over the floor, proved; answers right; budget = cheapest + margin', () => {
  let made = 0, turnedFails = 0;
  for (const setup of ['6-1', '6-2']) {
    const opt = makeOptions(setup);
    for (let seed = firstSeed(setup), k = 0; k < 4; seed++) {
      const p = makeCheap(seed, opt);
      if (!p) continue;
      k++; made++;
      const pl = answerMap(p.answer, p.n);
      assert.ok(check(p, pl).ok, `${setup} ${seed}: the answer isn't right`);
      assert.equal(costOf(pl), p.cheapest);
      assert.equal(p.budget, p.cheapest + MARGIN);
      assert.ok(p.cheapest >= MAKE[p.n].minCost, `${setup} ${seed}: cheapest ${p.cheapest} under the floor`);
      assert.equal(solveCheap(p, p.cheapest - 1, 1).answers.length, 0, `${setup} ${seed}: something cheaper`);
      for (const a of p.answers) assert.ok(answerCost(a) === p.cheapest && check(p, answerMap(a, p.n)).ok);
      assert.deepEqual(answersFor(p).answers, p.answers, 'the device’s search finds the maker’s answers');
      const [i0, a0] = [...pl][0];
      if (!check(p, new Map([...pl, [i0, { t: a0.t, o: 1 - a0.o }]])).ok) turnedFails++;
    }
  }
  assert.equal(made, 8);
  assert.ok(turnedFails >= 6, `a turned piece failed in only ${turnedFails} of ${made}`);
});

// Every laser right, switched on one by one in either order, is the same
// as check passing: on the answers of made puzzles with 0-3 pieces moved
// or turned.
test('laser lab: lasers switched on in turn agree with check', () => {
  const R = mulberry32(7);
  let same = 0, right = 0, tried = 0;
  for (const setup of ['6-2', '6-1']) {
    for (let seed = firstSeed(setup), k = 0; k < 3; seed++) {
      const p = stockPuzzle(setup, seed);
      if (!p) continue;
      k++;
      for (let t = 0; t < 60; t++) {
        const pl = answerMap(p.answer, p.n);
        const b = boardOf(p), free = [...b.keys()].filter(i => b[i] === '.' && !pl.has(i));
        for (let m = 0; m < t % 4; m++) {
          const ks = [...pl.keys()], i = ks[Math.floor(R() * ks.length)], pc = pl.get(i);
          if (R() < .5) pl.set(i, { t: pc.t, o: 1 - pc.o });
          else { pl.delete(i); pl.set(free.splice(Math.floor(R() * free.length), 1)[0], pc); }
        }
        const want = check(p, pl).ok;
        for (const order of p.lamps.length > 1 ? [[0, 1], [1, 0]] : [[0]]) {
          const on = [];
          let good = true;
          for (const li of order) { if (!checkLamp(p, pl, li, on).ok) { good = false; break; } on.push(li); }
          tried++;
          if (good === want) same++;
          if (good) right++;
        }
      }
    }
  }
  assert.equal(same, tried, `agree on ${same} of ${tried}`);
  assert.ok(right > 0 && right < tried, `both kinds seen (${right} right of ${tried})`);
});

// Two lasers in the stock: both beams pass through a piece of the answer.
test('laser lab: two-laser stock puzzles use pieces in both beams', () => {
  const plain = { ...p2, answer: [] };
  assert.equal(bothUsePieces(plain), false, 'no pieces: neither beam uses one');
  // red turned down at (2, 2) to a gem at (4, 2); blue straight down column 4
  const q = { n: 5, lamps: p2.lamps, walls: [], gems: [[4, 2, 1], [4, 4, 2]], answer: [{ r: 2, c: 2, t: 'm', o: 1 }] };
  assert.ok(check(q, answerMap(q.answer, 5)).ok);
  assert.equal(bothUsePieces(q), false, 'blue uses no piece');
  // and blue turned left at (2, 4) to a gem at (2, 3)
  const r = { ...q, gems: [[4, 2, 1], [2, 3, 2]], answer: [{ r: 2, c: 2, t: 'm', o: 1 }, { r: 2, c: 4, t: 'm', o: 0 }] };
  assert.ok(check(r, answerMap(r.answer, 5)).ok, 'the both-ways board isn’t right');
  assert.equal(bothUsePieces(r), true);
  let made = 0;
  for (let seed = firstSeed('6-2'); made < 3; seed++) { const s = stockPuzzle('6-2', seed); if (s) { made++; assert.ok(bothUsePieces(s), `seed ${seed}`); } }
});

test('laser lab: stock entries round-trip; a broken entry is refused, saying why', () => {
  const p = stockPuzzle('6-2', firstSeed('6-2') + 72);
  assert.ok(p, 'seed made no puzzle');
  const e = encode(p);
  const q = decode('6-2', e);
  for (const k of ['n', 'seed', 'lamps', 'cheapest', 'budget', 'answer']) assert.deepEqual(q[k], p[k], k);
  assert.deepEqual([...q.walls].sort(), [...p.walls].sort());
  assert.deepEqual([...q.gems].sort(), [...p.gems].sort());
  const bad = (what, f, re) => { const x = JSON.parse(JSON.stringify(e)); f(x); assert.throws(() => decode('6-2', x), re, what); };
  bad('a wall on the answer', x => { const i = Number(x[4].split(' ')[0].match(/^\d+/)[0]); x[2] = x[2].slice(0, i) + '#' + x[2].slice(i + 1); }, /wall or gem/);
  bad('the cost changed', x => { x[3]++; }, /costs/);
  bad('a piece turned', x => { x[4] = x[4].replace(/([ms])([01])/, (m, t, o) => `${t}${1 - o}`); }, /isn't right/);
  bad('both lasers on one side', x => { x[1][1][0] = x[1][0][0]; }, /one side/);
  bad('the board short', x => { x[2] = x[2].slice(1); }, /6×6/);
  bad('one laser for a two-laser setup', x => { x[1].pop(); }, /1 lasers, not 2/);
  bad('not an entry', x => { x[4] = 'xyz'; }, /not a puzzle/);
  assert.throws(() => decode('6-2', null), /not a puzzle/);
});

test('laser lab: the stock order is a fixed shuffle, purple spaced out; seeds per setup apart', () => {
  // entries as [seed, lamps, board]: every 7th purple (a '3' on the board)
  const list = Array.from({ length: 30 }, (_, i) => [i, [], i % 7 ? '1.2' : '1.3']);
  const a = stockOrder('7-2', list);
  assert.deepEqual(a, stockOrder('7-2', list), 'not the same each time');
  assert.notDeepEqual(a, list);
  assert.deepEqual([...a].sort((x, y) => x[0] - y[0]), list);
  assert.notDeepEqual(stockOrder('6-1', list), a, 'the setups share an order');
  // 5 purple in 30: at 3, 9, 15, 21, 27 (every 6th, from the middle of the first 6)
  assert.deepEqual(a.map((e, i) => (isPurple(e) ? i : -1)).filter(i => i >= 0), [3, 9, 15, 21, 27]);
  assert.deepEqual(a.filter(isPurple).map(e => e[0]).sort((x, y) => x - y), [0, 7, 14, 21, 28]);
  // none purple: the plain shuffle (3.0-3.2's order, kept for one laser)
  const plain = list.map(e => [e[0], [], '1.2']);
  const rnd = mulberry32(firstSeed('6-1') + 1), want = plain.map(e => e[0]);
  for (let i = want.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [want[i], want[j]] = [want[j], want[i]]; }
  assert.deepEqual(stockOrder('6-1', plain).map(e => e[0]), want);
  const firsts = SETUPS.map(firstSeed).sort((x, y) => x - y);
  for (let i = 1; i < firsts.length; i++) assert.ok(firsts[i] - firsts[i - 1] >= 1000000, 'seed ranges overlap');
});

test('laser lab: the rules picture’s puzzle: its answer right, and the cheapest 3', () => {
  assert.ok(check(DEMO, answerMap(DEMO.answer, DEMO.n)).ok);
  assert.equal(cheapest(DEMO).cost, DEMO.cheapest);
  assert.equal(answerCost(DEMO.answer), 3);
});

/* ---------- a game ---------- */

// A small puzzle as the game sees it: p1 with a budget
const gp = () => ({ ...p1, seed: 5, cheapest: 1, budget: 1 + MARGIN, gems: [[0, 2, 1]], walls: [[4, 4]], answer: [{ r: 2, c: 2, t: 'm', o: 0 }] });

test('laser lab game: a tap puts the picked piece down, turns it, takes it off; prices paid while on the board', () => {
  const p = gp(), g = createGame(p, '5-1', 0);
  assert.equal(budgetLeft(g, p), 4);
  assert.deepEqual(tapSquare(g, p, 7, 's'), { ok: true, did: 'put', t: 's' });
  assert.equal(budgetLeft(g, p), 2);
  assert.equal(tapSquare(g, p, 7, 'm').did, 'turn', 'a piece turns whatever is picked');
  assert.equal(g.pieces[7], 's1');
  assert.equal(tapSquare(g, p, 7, 'm').did, 'off');
  assert.equal(budgetLeft(g, p), 4, 'the price back');
  assert.deepEqual(tapSquare(g, p, 24, 'm'), { ok: false, why: 'wall' });
  assert.deepEqual(tapSquare(g, p, 2, 'm'), { ok: false, why: 'gem' });
  for (const i of [0, 1, 3, 5, 6]) tapSquare(g, p, i, 'm');
  assert.equal(budgetLeft(g, p), -1, 'past the budget: the savings pay');
  assert.equal(clearBoard(g), 5);
  assert.equal(budgetLeft(g, p), 4);
});

test('laser lab game: a laser wrong costs 1 and goes off; tapped again with nothing moved, refused for free; right, solved', () => {
  const p = gp(), g = createGame(p, '5-1', 0);
  assert.deepEqual(readyLamps(g, p), [], 'nothing on the board: no laser pulses');
  tapSquare(g, p, 12, 'm'); tapSquare(g, p, 12, 'm');   // a '\': the beam goes down
  assert.deepEqual(readyLamps(g, p), [0]);
  let r = switchLamp(g, p, 0);
  assert.ok(!r.res.ok && g.fees === 1 && g.wrongLamps === 1 && g.on.length === 0 && g.miss.li === 0);
  assert.equal(missWords(p, r.res, 0), 'Not yet: 1 💎 not lit. That cost 1 coin.');
  assert.deepEqual(switchLamp(g, p, 0), { refused: 'nothing moved' });
  assert.equal(g.fees, 1, 'refused for free');
  assert.deepEqual(readyLamps(g, p), []);
  tapSquare(g, p, 12, 'm'); tapSquare(g, p, 12, 'm');   // off, then '/' again
  assert.equal(g.miss, null, 'a piece moved: the faint beam gone');
  r = switchLamp(g, p, 0);
  assert.ok(r.res.ok && g.result === 'solved');
  assert.equal(g.saved, p.budget - 1 - 1, 'budget less the mirror and the wrong laser');
  assert.deepEqual(switchLamp(g, p, 0), { refused: 'over' });
});

test('laser lab game: a laser shone into breaks; refused until a piece moves; on goes off free', () => {
  const p = { ...p2, seed: 9, cheapest: 0, budget: 3, answer: [] };
  const g = createGame(p, '5-2', 0);
  // blue above column 2: red turned up at (2, 2) shines into it
  const q = { ...p, lamps: [p.lamps[0], { side: 0, k: 2, c: 2 }] };
  const h = createGame(q, '5-2', 0);
  tapSquare(h, q, 12, 'm');
  let r = switchLamp(h, q, 0);
  assert.ok(!r.res.ok && h.broken.includes(1));
  assert.match(missWords(q, r.res, 0), /^The red beam isn't right: it broke the blue laser/);
  assert.deepEqual(switchLamp(h, q, 1), { refused: 'broken' });
  tapSquare(h, q, 12, 'm');
  assert.deepEqual(h.broken, [], 'a piece moved mends it');
  // p: nothing in the way; red right, then off for free
  r = switchLamp(g, p, 0);
  assert.ok(r.res.ok && g.on.includes(0));
  assert.equal(rightWords(g, p, 0), 'The red beam is right. Now the blue laser.');
  assert.deepEqual(switchLamp(g, p, 0), { did: 'off' });
  assert.equal(g.fees, 0);
});

test('laser lab game: hints cost 1, 2, 3; take off, turn, put down along the beam; free when all is right', () => {
  // a gem at (0, 0) with a wall under it: '/' on row 3 turns the beam up a
  // column, '\' on the top row turns it left to the gem (4 ways at 2 🪙)
  const p = { n: 5, seed: 3, lamps: [{ side: 3, k: 2, c: 1 }], walls: [[1, 0]], gems: [[0, 0, 1]], cheapest: 2, budget: 5 };
  const { cost, answers } = cheapest(p);
  assert.deepEqual([cost, answers.length], [2, 4]);
  const g = createGame(p, '5-1', 0);
  tapSquare(g, p, 24, 's');   // a splitter nowhere useful
  let h = useHint(g, p, answers);
  assert.equal(h.kind, 'off');
  assert.equal(h.price, 1);
  assert.match(h.text, /The splitter at row 5, column 5 isn't in a cheapest way: the hint takes it off \(2 coins back\)\. That hint cost 1 coin\./);
  assert.equal(g.pieces[24], '');
  h = useHint(g, p, answers);
  assert.ok(h.kind === 'put' && h.price === 2 && g.fixed.includes(h.i));
  const a = closest(g, p, answers);
  assert.ok(a.some(x => x.r * 5 + x.c === h.i), 'not a piece of the closest way');
  // the other piece put the wrong way round: turned and fixed
  const other = a.find(x => x.r * 5 + x.c !== h.i);
  const j = other.r * 5 + other.c;
  g.pieces[j] = `${other.t}${1 - other.o}`;
  h = useHint(g, p, answers);
  assert.ok(h.kind === 'turn' && h.i === j && h.price === 3);
  assert.equal(g.fees, 6);
  h = useHint(g, p, answers);
  assert.deepEqual([h.kind, h.price, g.fees, g.hintsUsed], ['none', 0, 6, 3], 'all right: no charge');
  assert.ok(switchLamp(g, p, 0).res.solved);
  assert.equal(g.saved, 5 - 2 - 6);
});

test('laser lab game: Give up shows the closest cheapest way and costs the whole budget', () => {
  const p = gp(), g = createGame(p, '5-1', 0);
  const answers = solveCheap(p, p.cheapest, 50).answers;
  assert.ok(giveUp(g, p, answers));
  assert.equal(g.result, 'gaveup');
  assert.equal(g.saved, -p.budget);
  assert.ok(check(p, placedOf(g)).ok);
  assert.deepEqual(g.on, [0]);
  assert.equal(giveUp(g, p, answers), false, 'once');
});

test('laser lab game: kept as JSON and picked up again; refused for another puzzle or a bad board', () => {
  const p = gp(), g = createGame(p, '5-1', 3);
  tapSquare(g, p, 12, 'm'); switchLamp(g, p, 0);
  g.ms = 4000;
  const back = restoreGame(p, JSON.parse(JSON.stringify(snapshotGame(g))));
  assert.deepEqual(back, g);
  assert.equal(restoreGame({ ...p, seed: 6 }, g), null, 'another puzzle');
  assert.equal(restoreGame(p, { ...g, pieces: g.pieces.map((x, i) => (i === 24 ? 'm0' : x)) }), null, 'a piece on a wall');
  assert.equal(restoreGame(p, { ...g, on: [3] }), null, 'a laser that isn’t there');
  assert.equal(restoreGame(p, null), null);
});

/* ---------- runs ---------- */

test('laser lab runs: savings over 10 puzzles, below 0 allowed; the best run kept; anything unreadable is nothing', () => {
  const prog = readProgress(null);
  assert.deepEqual(runOf(prog, '7-2'), { no: 0, at: 0, savings: 0, hearts: HEARTS, cur: null });
  let f;
  for (let k = 0; k < RUN - 1; k++) f = finishPuzzle(prog, '7-2', k === 4 ? -10 : 2);
  assert.deepEqual([f.done, f.savings, runOf(prog, '7-2').at], [false, 6, 9]);
  const g = createGame(gp(), '7-2', 9);
  keepCurrent(prog, '7-2', g);
  assert.equal(runOf(prog, '7-2').cur.seed, 5, 'the puzzle under way kept');
  f = finishPuzzle(prog, '7-2', 3);
  assert.deepEqual([f.done, f.best, f.savings], [true, true, 9]);
  assert.deepEqual(runOf(prog, '7-2'), { no: 1, at: 0, savings: 0, hearts: HEARTS, cur: null }, 'a new run');
  for (let k = 0; k < RUN; k++) f = finishPuzzle(prog, '7-2', -1);
  assert.deepEqual([f.done, f.best, f.savings, prog.best['7-2']], [true, false, -10, 9], 'a worse run: the best kept');
  const back = readProgress(JSON.stringify(prog));
  assert.deepEqual(back.best, { '7-2': 9 });
  assert.deepEqual(runOf(back, '7-2'), { no: 2, at: 0, savings: 0, hearts: HEARTS, cur: null });
  assert.deepEqual(readProgress('{"runs":{"6-1":{"no":0,"at":12,"savings":1},"9-9":{"no":0,"at":1,"savings":1}},"best":{"6-1":"x"}}'), { runs: {}, best: {} });
  assert.deepEqual(readProgress('not json'), { runs: {}, best: {} });
});

// 3.2 (developer, on the phone: the 🪙 "looks like a ball - not
// meaningful"): prices and costs in words.
// 3.5 (developer: "Pieces 7, cheapest 6" read as pieces, though both were
// coins; "You used 7 pieces and 9 coins. Best solution used 6 pieces and
// 7 coins"): the player's pieces and their cost, the best way's.
test('laser lab end: the words say pieces and coins, yours and the best way’s', () => {
  const p = gp(), best = p.answer;   // one mirror, 1 coin
  // solved with a splitter (2 coins), a hint first (1) and a wrong laser (1)
  let g = createGame(p, '5-1', 0);
  Object.assign(g, { result: 'solved', hintsUsed: 1, wrongLamps: 1, fees: 2 });
  g.pieces[12] = 's0';
  g.saved = p.budget - spent(g) - g.fees;
  let w = endWords(g, p, best);
  assert.deepEqual(w, { how: 'solved', head: 'Solved! Saved 0 coins', lines: ['You used 1 piece (2 coins) · hints 1 coin · lasers 1 coin', 'Best: 1 piece (1 coin)'], isBest: false });
  // the best: one line, ticked
  g = createGame(p, '5-1', 0);
  Object.assign(g, { result: 'solved' });
  g.pieces[12] = 'm0';
  g.saved = p.budget - 1;
  w = endWords(g, p, best);
  assert.deepEqual(w.lines, ['You used 1 piece (1 coin): the best ✓']);
  assert.ok(w.isBest);
  // over the budget: two splitters and a mirror (5 coins), budget 4
  g.pieces[12] = 's0'; g.pieces[7] = 's0'; g.pieces[0] = 'm0';
  g.saved = p.budget - spent(g);
  w = endWords(g, p, [{ r: 2, c: 2, t: 'm', o: 0 }, { r: 1, c: 2, t: 'm', o: 0 }]);
  assert.equal(w.head, 'Solved, 1 coin over');
  assert.deepEqual(w.lines, ['You used 3 pieces (5 coins)', 'Best: 2 pieces (1 coin)'], 'the best way counted is the one given');
  // the answer shown, and a run's end
  g = createGame(p, '5-1', 0);
  giveUp(g, p, [best]);
  assert.deepEqual(endWords(g, p, best), { how: 'lost', head: 'Answer shown: −4 coins', lines: ['Best: 1 piece (1 coin)'], isBest: false });
  assert.deepEqual(endWords(g, p, best, { done: true, savings: 17, best: true }).lines, ['This one: −4 coins · Best run!', 'Best: 1 piece (1 coin)']);
  assert.equal(endWords(g, p, best, { done: true, savings: -3 }).head, 'Run over! Savings −3 coins');
});

test('laser lab end: See best draws the best way with every laser on, the game itself untouched', () => {
  const p = { ...p2, seed: 7, cheapest: 1, budget: 4, answer: [] }, g = createGame(p, '5-2', 0);
  g.pieces[3] = 's1'; g.fixed = [3]; g.miss = { li: 0, others: [] }; g.result = 'solved';
  const before = JSON.stringify(g), v = bestView(g, p, [{ r: 1, c: 1, t: 'm', o: 1 }]);
  assert.equal(v.pieces[6], 'm1');
  assert.equal(v.pieces.filter(Boolean).length, 1, 'the player’s pieces drawn too');
  assert.deepEqual([v.on, v.fixed, v.miss, v.result], [[0, 1], [], null, 'solved']);
  assert.equal(JSON.stringify(g), before, 'the game changed');
});

test('laser lab: coins in words, one coin or more, minus in front', () => {
  assert.deepEqual([coins(1), coins(3), coins(0), coins(-9), coins(-1)], ['1 coin', '3 coins', '0 coins', '−9 coins', '−1 coin']);
  assert.doesNotMatch(coins(2), /🪙/);
});

// 3.2: ❤️ Try again, 3 hearts per run (developer: "lets try per run
// first"): the board cleared, hint pieces too, and everything spent on the
// puzzle given back (pieces, wrong lasers, hints), for a heart.
test('laser lab game: Try again gives back all the puzzle cost, hint pieces too, for a heart of the run', () => {
  const p = { n: 5, seed: 3, lamps: [{ side: 3, k: 2, c: 1 }], walls: [[1, 0]], gems: [[0, 0, 1]], cheapest: 2, budget: 5 };
  const { answers } = cheapest(p), prog = readProgress(null), g = createGame(p, '5-1', 0);
  tapSquare(g, p, 24, 's');
  switchLamp(g, p, 0);                 // wrong: 1
  useHint(g, p, answers);              // the splitter off: 1
  useHint(g, p, answers);              // a piece put down and fixed: 2
  g.ms = 7000;
  assert.ok(g.fixed.length === 1 && g.fees === 4 && budgetLeft(g, p) === 0, 'the whole budget spent first');
  const r = tryAgain(prog, g);
  assert.deepEqual(r, { ok: true, back: 5, pieces: 1, fees: 4, hearts: HEARTS - 1 });
  assert.deepEqual([g.pieces.filter(Boolean).length, g.fixed, g.fees, g.wrongLamps, g.hintsUsed, g.on, g.miss, g.failed, g.result], [0, [], 0, 0, 0, [], null, [], null]);
  assert.equal(budgetLeft(g, p), p.budget, 'the budget as at the start');
  assert.equal(g.ms, 7000, 'the clock keeps running');
  assert.equal(runOf(prog, '5-1').hearts, HEARTS - 1, 'the heart kept with the run');
  assert.equal(runOf(prog, '5-1').savings, 0, 'the savings untouched');
});

test('laser lab game: Try again refused with no hearts, with nothing to give back, or at the end; no heart used', () => {
  const p = gp(), prog = readProgress(null), g = createGame(p, '5-1', 0);
  assert.deepEqual(tryAgain(prog, g), { ok: false, why: 'nothing spent' });
  assert.equal(runOf(prog, '5-1').hearts, HEARTS, 'no heart for nothing');
  tapSquare(g, p, 12, 'm');
  for (let k = HEARTS; k > 0; k--) { assert.equal(tryAgain(prog, g).hearts, k - 1); tapSquare(g, p, 12, 'm'); }
  assert.deepEqual(tryAgain(prog, g), { ok: false, why: 'no hearts' });
  assert.equal(g.pieces[12], 'm0', 'refused: the board as it was');
  switchLamp(g, p, 0);
  assert.equal(g.result, 'solved');
  assert.deepEqual(tryAgain({ runs: { '5-1': { ...runOf(prog, '5-1'), hearts: 2 } }, best: {} }, g), { ok: false, why: 'over' });
});

test('laser lab runs: 3 hearts per run, kept over its puzzles, 3 again in a new run; a run kept before 3.2 has 3', () => {
  const prog = readProgress(null), p = gp(), g = createGame(p, '6-1', 0);
  tapSquare(g, p, 12, 'm');
  tryAgain(prog, g);
  assert.equal(finishPuzzle(prog, '6-1', 3).run.hearts, HEARTS - 1, 'kept to the next puzzle');
  keepCurrent(prog, '6-1', g);
  assert.equal(readProgress(JSON.stringify(prog)).runs['6-1'].hearts, HEARTS - 1, 'kept on the device');
  for (let k = 1; k < RUN; k++) finishPuzzle(prog, '6-1', 1);
  assert.equal(runOf(prog, '6-1').hearts, HEARTS, 'a new run: 3 again');
  const old = readProgress('{"runs":{"6-1":{"no":0,"at":4,"savings":7,"cur":null}},"best":{}}');
  assert.equal(runOf(old, '6-1').hearts, HEARTS, 'kept by 3.1: 3 hearts');
  for (const bad of [-1, 4, 1.5, 'x']) assert.equal(readProgress(`{"runs":{"6-1":{"no":0,"at":4,"savings":7,"hearts":${JSON.stringify(bad)}}}}`).runs['6-1'].hearts, HEARTS, `hearts ${bad}`);
  assert.equal(readProgress('{"runs":{"6-1":{"no":0,"at":4,"savings":7,"hearts":0}}}').runs['6-1'].hearts, 0);
});
