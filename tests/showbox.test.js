// Five Dice 3D: which dice show a box's score once it's picked
// (src/core/showbox.js, Q54), grouped like the box's picture.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { showBox } from '../src/core/showbox.js';
import { BOXES, score } from '../src/core/five-dice.js';

const vals = (dice, groups) => groups.map(g => g.map(i => dice[i]));

test('showbox: each box shows the dice that score it, as its picture', () => {
  const cases = [
    // [box, dice, the numbers shown in each group]
    ['1', [1, 3, 1, 5, 6], [[1, 1]]],
    ['6', [6, 6, 6, 2, 6], [[6, 6, 6, 6]]],
    ['three', [4, 2, 4, 5, 4], [[4, 4, 4]]],
    ['three', [3, 3, 3, 3, 1], [[3, 3, 3, 3]]],   // 4 the same: all four count
    ['four', [2, 5, 5, 5, 5], [[5, 5, 5, 5]]],
    ['five', [6, 6, 6, 6, 6], [[6, 6, 6, 6, 6]]],
    ['house', [2, 5, 2, 5, 5], [[5, 5, 5], [2, 2]]],   // the three, then the two
    ['small', [4, 1, 3, 2, 6], [[1, 2, 3, 4]]],
    ['small', [5, 3, 3, 4, 6], [[3, 4, 5, 6]]],     // one of the two 3s
    ['small', [2, 3, 4, 5, 6], [[2, 3, 4, 5]]],     // a big run: the first 4, as the picture
    ['big', [5, 2, 6, 4, 3], [[2, 3, 4, 5, 6]]],
    ['chance', [5, 1, 6, 1, 3], [[1, 1, 3, 5, 6]]],
  ];
  for (const [box, dice, want] of cases) {
    const groups = showBox(box, dice);
    assert.deepEqual(vals(dice, groups), want, `${box} ${dice}`);
    const flat = groups.flat();
    assert.equal(new Set(flat).size, flat.length, `${box} ${dice}: a die shown twice`);
    assert.ok(flat.every(i => i >= 0 && i < 5), `${box} ${dice}: an index outside the dice`);
  }
  assert.equal(cases.length, 12);
});

test('showbox: the dice shown add up to the box’s points (the boxes that add)', () => {
  // every roll of 5 dice: 7776, checked against the rules' own score
  let checked = 0;
  const adds = ['1', '2', '3', '4', '5', '6', 'three', 'four', 'chance'];
  for (let k = 0; k < 6 ** 5; k++) {
    const dice = [0, 1, 2, 3, 4].map(j => 1 + (Math.floor(k / 6 ** j) % 6));
    for (const box of BOXES.long) {
      const groups = showBox(box, dice), pts = score(box, dice);
      if (!pts) { assert.deepEqual(groups, [], `${box} ${dice} scores 0: nothing shown`); continue; }
      assert.ok(groups.length && groups.every(g => g.length), `${box} ${dice}: some dice shown`);
      if (adds.includes(box) && box !== 'three' && box !== 'four') {
        assert.equal(groups.flat().reduce((a, i) => a + dice[i], 0), pts, `${box} ${dice}`);
      }
      checked++;
    }
  }
  // every roll's every box that scores: 39240 (so "checked nothing" can't pass)
  assert.equal(checked, 39240);
});

test('showbox: a box that scores 0 shows nothing; an unknown box nothing', () => {
  assert.deepEqual(showBox('6', [1, 2, 3, 4, 5]), []);
  assert.deepEqual(showBox('house', [2, 2, 2, 2, 5]), []);
  assert.deepEqual(showBox('five', [3, 3, 3, 3, 4]), []);
  assert.deepEqual(showBox('big', [1, 2, 3, 4, 6]), []);
  assert.throws(() => showBox('bonus', [1, 2, 3, 4, 5]), /unknown box/);
});
