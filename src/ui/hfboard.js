// Find the Stars boards as HTML (called Hidden Faces until 2026-10-14):
// the lines between squares (thick between colours, thin inside one), the
// star and the ✕, and the small board pictures on the home page and the
// setup screen. The rules: src/core/hidden-faces.js.

import { colorsFor } from '../core/hidden-faces.js';

// The star that hides: white with a dark edge, so it stands out on every
// square colour and is never taken for one (developer, 2026-10-14: a
// coloured face could hide its square's colour, which the logic needs).
export const STAR = '<svg class="star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 L61.2 38.6 L93.7 39.8 L68.1 59.9 L77 91.2 L50 73 L23 91.2 L31.9 59.9 L6.3 39.8 L38.8 38.6 Z" fill="#fff" stroke="#2B2B33" stroke-width="7" stroke-linejoin="round"/></svg>';

// A ✕ as two lines in the text colour, so it looks the same on every
// device (the ✕ character's size and weight depend on the device's fonts).
export const XMARK = '<svg class="xm" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 22 L78 78 M78 22 L22 78" stroke="currentColor" stroke-width="13" stroke-linecap="round"/></svg>';

// The right and bottom lines of square i (the board's frame draws the
// outer edge). `thick` is the line between colours.
export function borderStyle(n, reg, i, thick = 3) {
  const r = Math.floor(i / n), c = i % n;
  const line = other => (other !== reg[i] ? `${thick}px solid var(--thick)` : '1px solid var(--thin)');
  return `border-right:${c < n - 1 ? line(reg[i + 1]) : '0'};border-bottom:${r < n - 1 ? line(reg[i + n]) : '0'}`;
}

// A small board: a star on the squares in `stars`, ✕ on those in `xs`.
export function miniBoard(p, stars, xs = []) {
  const col = colorsFor(p.n, p.reg, 5);
  return `<div class="hfmini" style="--mn:${p.n}">${p.reg.map((g, i) =>
    `<span style="background:${col[g].c};${borderStyle(p.n, p.reg, i, 2)}">${stars.includes(i) ? STAR : xs.includes(i) ? XMARK : ''}</span>`).join('')}</div>`;
}
