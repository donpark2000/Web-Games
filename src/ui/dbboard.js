// Dots and Boxes' board as SVG: the play screen's board, the setup
// screen's picture and the home page's button (src/ui/dots-boxes.js,
// index.html). The rules: src/core/dots-boxes.js.
//
// Drawn in boxes: dot (r, c) at x = c, y = r. The colours are inline
// styles from the site's colours (site.css, on every page), so a picture
// looks right with no game stylesheet (the home page); css/dots-boxes.css
// adds the animations (the robot's last line, a box's face popping in, the
// winner's faces).

import { freshBoard } from '../core/dots-boxes.js';
import { svg } from './faces.js';

// Room round the dots, in boxes: for a finger at the board's edge.
export const MARGIN = 0.35;
export const viewBox = n => `${-MARGIN} ${-MARGIN} ${n + 2 * MARGIN} ${n + 2 * MARGIN}`;

export const ends = ({ k, r, c }) => (k === 'h' ? [c, r, c + 1, r] : [c, r, c, r + 1]);
export const sameLine = (a, b) => !!a && !!b && a.k === b.k && a.r === b.r && a.c === b.c;

const STROKE = { 1: 'var(--p1)', 2: 'var(--p2)' };
const FILL = { 1: 'var(--p1-soft)', 2: 'var(--p2-soft)' };
const GUIDE = 'stroke:#B9CCD0;stroke-width:.045;stroke-dasharray:.09 .11;stroke-linecap:round';

// One line: drawn by player p (1 or 2), or a faint dashed guide (p 0).
export function lineSvg(l, p, cls = '') {
  const [x1, y1, x2, y2] = ends(l);
  const style = p ? `stroke:${STROKE[p]};stroke-width:.14;stroke-linecap:round` : GUIDE;
  return `<line class="${p ? 'ln' : 'g'}${cls ? ` ${cls}` : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="${style}"/>`;
}

// A board's inside. `faces`: each player's face; `last`: the line to
// blink (the robot's); `glow`: lines marked with a soft band of their
// colour under them (the robot's latest turn, until the person draws;
// developer, 2026-10-24, 4.1: on the phone a finger hid the robot's line
// while it blinked); `fresh`: boxes ("r:c") whose faces pop in; `win`:
// the winner, whose boxes smile and wiggle; `guides`: dashes where a line
// can go.
export function boardContent(b, { faces, last = null, glow = [], fresh = [], win = 0, guides = true }) {
  const out = [];
  b.boxes.forEach((row, r) => row.forEach((p, c) => {
    if (!p) return;
    const cls = 'fc' + (fresh.includes(`${r}:${c}`) ? ' pop' : '') + (win === p ? ' win' : '');
    out.push(`<rect class="bx" x="${c + 0.07}" y="${r + 0.07}" width=".86" height=".86" rx=".14" style="fill:${FILL[p]}"/>`,
      `<g class="${cls}">${svg(faces[p - 1], win === p ? 'winner' : 'normal').replace('<svg class="av"', `<svg class="av" x="${c + 0.14}" y="${r + 0.14}" width=".72" height=".72"`)}</g>`);
  }));
  // over the boxes' fill, under every line
  for (const l of glow) {
    const p = b[l.k][l.r][l.c];
    if (!p) continue;
    const [x1, y1, x2, y2] = ends(l);
    out.push(`<line class="glow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${STROKE[p]};stroke-width:.36;stroke-linecap:round;opacity:.3"/>`);
  }
  for (const k of ['h', 'v']) {
    b[k].forEach((row, r) => row.forEach((p, c) => {
      const l = { k, r, c };
      if (p) out.push(lineSvg(l, p, sameLine(l, last) ? 'last' : ''));
      else if (guides) out.push(lineSvg(l, 0));
    }));
  }
  for (let r = 0; r <= b.n; r++) for (let c = 0; c <= b.n; c++) out.push(`<circle cx="${c}" cy="${r}" r=".1" style="fill:var(--ink)"/>`);
  return out.join('');
}

// The rules' picture (setup) and the home page's button: a 3 x 3 corner of
// a game under way, a box won by each player.
export function miniSvg(faces, cls = '') {
  const b = freshBoard(3);
  const lines = [['h', 0, 0, 1], ['h', 1, 0, 1], ['v', 0, 0, 2], ['v', 0, 1, 1], ['h', 0, 1, 2], ['h', 1, 1, 2],
    ['v', 0, 2, 2], ['h', 2, 2, 1], ['v', 1, 3, 2], ['h', 3, 0, 1]];
  for (const [k, r, c, p] of lines) b[k][r][c] = p;
  b.boxes[0][0] = 1;
  b.boxes[0][1] = 2;
  return `<svg class="${cls}" viewBox="${viewBox(3)}" aria-hidden="true">${boardContent(b, { faces })}</svg>`;
}

// "How big?": just the dots of an n x n board.
export function dotsSvg(n) {
  let dots = '';
  for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) dots += `<circle cx="${c}" cy="${r}" r="${0.6 / Math.sqrt(n)}" style="fill:var(--ink)"/>`;
  return `<svg class="ico" viewBox="-.5 -.5 ${n + 1} ${n + 1}" aria-hidden="true">${dots}</svg>`;
}
