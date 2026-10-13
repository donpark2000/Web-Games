// Hidden Faces boards as HTML: the lines between squares (thick between
// colours, thin inside one) and the small board pictures on the home
// page and the setup screen. The rules: src/core/hidden-faces.js.

import { colorsFor } from '../core/hidden-faces.js';
import { svg } from './faces.js';

// The right and bottom lines of square i (the board's frame draws the
// outer edge). `thick` is the line between colours.
export function borderStyle(n, reg, i, thick = 3) {
  const r = Math.floor(i / n), c = i % n;
  const line = other => (other !== reg[i] ? `${thick}px solid var(--thick)` : '1px solid var(--thin)');
  return `border-right:${c < n - 1 ? line(reg[i + 1]) : '0'};border-bottom:${r < n - 1 ? line(reg[i + n]) : '0'}`;
}

// A small board: `face` on the squares in `faces`, ✕ on those in `xs`.
export function miniBoard(p, face, faces, xs = [], mood = 'normal') {
  const col = colorsFor(p.n, p.reg, 5);
  return `<div class="mini" style="--mn:${p.n}">${p.reg.map((g, i) =>
    `<span style="background:${col[g].c};${borderStyle(p.n, p.reg, i, 2)}">${faces.includes(i) ? svg(face, mood) : xs.includes(i) ? '✕' : ''}</span>`).join('')}</div>`;
}
