// Five Dice 3D: which dice make a box's score, so they can stand forward
// once the box is picked (Q54, developer, 2026-11-08: "Dice show score"),
// grouped like the box's picture on the sheet. No DOM or UI code.
//
// showBox(box, dice) returns groups of die indices, each group in the
// order shown, or [] when the box scores 0 (no die counts):
// - 1s-6s: the dice of that number;
// - 3 the same, 4 the same, 5 the same: the dice of the number there are
//   most of;
// - full house: the three, then the two (a wider gap between groups);
// - small run: one die of each number of the first run of 4 (as its
//   picture), low to high; big run: all five, low to high;
// - ?: all five, low to high.
// Dice of the same number keep their index order (the tray then orders
// them left to right).

import { UPPER, SIDES, counts, score } from './five-dice.js';

const all = dice => dice.map((_, i) => i);
const byValue = (dice, idx) => [...idx].sort((a, b) => dice[a] - dice[b] || a - b);

export function showBox(box, dice) {
  if (!score(box, dice)) return [];
  const c = counts(dice), of = v => all(dice).filter(i => dice[i] === v);
  if (UPPER.includes(box)) return [of(Number(box))];
  switch (box) {
    case 'three': case 'four': case 'five':
      return [of(c.indexOf(Math.max(...c)))];
    case 'house':
      return [of(c.indexOf(3)), of(c.indexOf(2))];
    case 'small': case 'big': {
      const n = box === 'small' ? 4 : 5;
      for (let v0 = 1; v0 + n - 1 <= SIDES; v0++) {
        const vs = Array.from({ length: n }, (_, k) => v0 + k);
        if (vs.every(v => c[v])) return [vs.map(v => of(v)[0])];
      }
      return [];
    }
    case 'chance': return [byValue(dice, all(dice))];
    default: return [];
  }
}
