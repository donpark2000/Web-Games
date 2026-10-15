// Coming back to a game (DESIGN.md "Coming back to a game"): each game's
// state is kept on the device as JSON, so after some play every game's
// match must come back from JSON exactly as it was (no Sets, Maps or
// functions in it), and play on the same as the one never stored. Fixed
// random numbers; nothing is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/core/hidden-faces.js';
import * as ttt from '../src/core/tic-tac-toe.js';
import * as c4 from '../src/core/connect-four.js';
import * as cards from '../src/core/matching.js';
import * as count from '../src/core/count-to-9.js';
import * as snl from '../src/core/snakes-ladders.js';
import * as dice from '../src/core/five-dice.js';
import * as nim from '../src/core/nim.js';
import * as rps from '../src/core/rock-paper-scissors.js';
import * as fm from '../src/core/follow-me.js';

const stored = m => JSON.parse(JSON.stringify(m));

// Plays `steps` on a match, stores it, checks it comes back the same, then
// plays `more` on both and checks they stay the same.
function check(name, m, steps, more) {
  steps(m);
  const back = stored(m);
  assert.deepEqual(back, m, `${name}: not the same after JSON`);
  const r1 = more(m), r2 = more(back);
  assert.deepEqual(back, m, `${name}: plays on differently`);
  assert.deepEqual(r2, r1, `${name}: a different result`);
}

test('resume: every game\'s match comes back from JSON and plays on the same', () => {
  const faces = { p1: 'bear', p2: 'cat' };
  check('tic-tac-toe', ttt.createMatch({ vsRobot: true, ...faces, firstRule: 'alt' }),
    m => { ttt.place(m, 4); ttt.place(m, 0); }, m => ttt.place(m, 8));
  check('connect four', c4.createMatch({ vsRobot: false, ...faces, firstRule: 'win' }),
    m => { c4.drop(m, 3); c4.drop(m, 3); c4.drop(m, 2); }, m => c4.drop(m, 4));
  check('matching', cards.createMatch({ solo: false, ...faces }),
    m => { cards.newRound(m, mulberry32(1)); cards.flip(m, 0); cards.flip(m, 1); }, m => [cards.settle(m), cards.flip(m, 2)]);
  check('count to 9', count.createMatch({ mode: 'robot', p1: 'bear', level: 'hard' }),
    m => { count.newRound(m, mulberry32(2)); count.flip(m, 0, mulberry32(3)); }, m => [count.settle(m), count.robotPick(m, mulberry32(4))]);
  check('snakes and ladders', snl.createMatch({ vsRobot: true, ...faces, firstRule: 'alt' }),
    m => { snl.newRound(m, mulberry32(5)); snl.move(m, 4); snl.move(m, 6); }, m => snl.move(m, 3));
  check('five dice', dice.createMatch({ mode: 'two', ...faces, length: 'long' }),
    m => { dice.roll(m, mulberry32(6)); dice.toggle(m, 1); dice.roll(m, mulberry32(7)); dice.scoreBox(m, 'chance'); },
    m => [dice.endTurn(m), dice.roll(m, mulberry32(8))]);
  check('nim', nim.createMatch({ vsRobot: true, ...faces, firstRule: 'alt', level: 'hard' }),
    m => { nim.take(m, 2, [0, 1]); }, m => nim.take(m, 0, [2]));
  check('rock paper scissors', rps.createMatch({ p1: 'bear' }),
    m => { rps.newRound(m, mulberry32(9)); rps.unlock(m); rps.choose(m, 'rock'); rps.newRound(m, mulberry32(10)); rps.unlock(m); },
    m => rps.choose(m, 'paper'));
  check('follow me', fm.createMatch({ p1: 'bear', size: 6, level: 'hard' }, {}),
    m => { fm.addStep(m, mulberry32(11)); fm.yourTurn(m); fm.tap(m, m.seq[0]); fm.addStep(m, mulberry32(12)); fm.yourTurn(m); },
    m => fm.tap(m, (m.seq[0] + 1) % m.size));
});
