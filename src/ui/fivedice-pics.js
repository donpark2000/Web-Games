// Five Dice's score-sheet pictures (from mockup v5), shared by the game
// screen and the home page's button: a die for the 1s-6s, 3 dice for 3 the
// same, 4 for 4 the same, 3 + 2 dice under a roof for a full house, dice as
// stairs for the runs, 5 dice and a star for 5 the same, a "?" die for
// anything, a star and 35 for the bonus. All SVG; nothing loaded from
// other sites. Also the words for each picture's pop-up.

import { DOTS } from './numbercard.js';

const INK = '#1E3445';
const FONT = 'font-family="ui-rounded, Arial Rounded MT Bold, sans-serif"';

// A small die at (x, y), s across, showing n (0: blank).
function mini(x, y, s, n, extra = '') {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.22}" fill="#fff" stroke="${INK}" stroke-width="${Math.max(0.9, s * 0.07)}"/>`
    + (n ? DOTS[n].map(k => `<circle cx="${x + s * (0.22 + 0.28 * (k % 3))}" cy="${y + s * (0.22 + 0.28 * Math.floor(k / 3))}" r="${s * 0.1}" fill="${INK}"/>`).join('') : '')
    + extra;
}
const pic = inner => `<svg viewBox="0 0 64 40" aria-hidden="true">${inner}</svg>`;
function star(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="#F7B928" stroke="#C98F0A" stroke-width="1.2" stroke-linejoin="round"/>`;
}

export const BOX_PICS = {
  three: pic([4, 23.5, 43].map(x => mini(x, 11.5, 17, 4)).join('')),
  four: pic([[14, 2], [33, 2], [14, 21], [33, 21]].map(([x, y]) => mini(x, y, 17, 2)).join('')),
  house: pic(`<path d="M7 14 L32 1.5 L57 14 Z" fill="#F2724F" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
    + [11.5, 25.5, 39.5].map(x => mini(x, 13.5, 13, 5)).join('') + [18.5, 32.5].map(x => mini(x, 27, 13, 2)).join('')),
  small: pic([0, 1, 2, 3].map(i => mini(4 + i * 14.5, 24 - i * 7.5, 14, i + 1)).join('')),
  big: pic([0, 1, 2, 3, 4].map(i => mini(2 + i * 12.2, 27 - i * 6.5, 12, i + 1)).join('')),
  five: pic(star(32, 10, 10) + [0, 1, 2, 3, 4].map(i => mini(2 + i * 12.2, 25, 12, 6)).join('')),
  chance: pic(mini(14, 2, 36, 0, `<text x="32" y="31" text-anchor="middle" font-size="28" font-weight="800" fill="${INK}" ${FONT}>?</text>`)),
  bonus: pic(star(14, 20, 12) + `<text x="44" y="27" text-anchor="middle" font-size="18" font-weight="800" fill="${INK}" ${FONT}>35</text>`),
};
for (let n = 1; n <= 6; n++) BOX_PICS[n] = pic(mini(14, 2, 36, n));

// What each picture means, for the pop-up: a title, the rule in a few
// words, and an example roll (the screen works out its score).
export const HELP = {
  1: ['Ones', 'Add up the 1s.', [1, 1, 3, 1, 5]],
  2: ['Twos', 'Add up the 2s.', [2, 4, 2, 6, 1]],
  3: ['Threes', 'Add up the 3s.', [3, 3, 5, 3, 1]],
  4: ['Fours', 'Add up the 4s.', [4, 2, 4, 6, 4]],
  5: ['Fives', 'Add up the 5s.', [5, 5, 1, 3, 2]],
  6: ['Sixes', 'Add up the 6s.', [6, 6, 6, 2, 4]],
  three: ['3 the same', '3 dice the same? Add up all 5 dice.', [4, 4, 4, 2, 6]],
  four: ['4 the same', '4 dice the same? Add up all 5 dice.', [2, 2, 2, 2, 5]],
  house: ['Full house', '3 the same and 2 the same. Always 25.', [5, 5, 5, 2, 2]],
  small: ['4 in a row', '4 dice in a row, like 1 2 3 4. Always 30.', [1, 2, 3, 4, 6]],
  big: ['5 in a row', 'All 5 in a row: 1 to 5 or 2 to 6. Always 40.', [2, 3, 4, 5, 6]],
  five: ['5 the same!', 'All 5 dice the same. 50!', [6, 6, 6, 6, 6]],
  chance: ['Anything', 'Any dice at all. Add them all up.', [3, 5, 2, 6, 4]],
  bonus: ['Bonus', 'Get 63 or more in the 1s to 6s, and get 35 more!', null],
};
