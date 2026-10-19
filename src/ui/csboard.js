// Colour Sudoku's small board picture (the home page's button, the rules
// on the setup screen): the squares in their colours, thick lines round
// the boxes, thin inside one. The rules: src/core/colour-sudoku.js.

import { coloursFor } from '../core/colour-sudoku.js';

// The right and bottom lines of square i (the frame draws the outer
// edge): thick between boxes, thin inside one.
export function boxLines(i, thick = 3, thin = '1px solid #2B2B3340') {
  const r = Math.floor(i / 9), c = i % 9;
  const line = edge => (edge ? `${thick}px solid var(--thick, #2B2B33)` : thin);
  return `border-right:${c < 8 ? line(c % 3 === 2) : '0'};border-bottom:${r < 8 ? line(r % 3 === 2) : '0'}`;
}

// A small board of puzzle p ({ seed, reg }) showing `digits` (0: empty).
export function miniBoard(p, digits) {
  const col = coloursFor(p.reg, p.seed);
  return `<div class="csmini">${p.reg.map((g, i) =>
    `<span style="background:${col[g].c};${boxLines(i, 2, '1px solid #2B2B3330')}">${digits[i] || ''}</span>`).join('')}</div>`;
}
