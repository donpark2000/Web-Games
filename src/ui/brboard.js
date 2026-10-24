// Bridges' board as SVG: the play screen's board, the setup screen's
// picture and the home page's button (src/ui/bridges.js, index.html). The
// rules: src/core/bridges.js.
//
// Drawn in squares: island (r, c) at x = c + 0.5, y = r + 0.5. The colours
// are inline styles (the site's colours from site.css, on every page, and
// the board's own below), so a picture looks right with no game stylesheet
// (the home page); css/bridges.css adds the animations (a hint's bridges
// blinking, the islands' wiggle at a win, the board's shake). Nothing in
// it takes a touch: the board's <svg> gets them all, so a redraw never
// takes away the element a touch began on (3.7: a double tap zoomed when
// it did).

import { edgesOf, counts, countAnswers, DEMO } from '../core/bridges.js';

export const SEA = '#D4ECF4', SEA_LINE = '#A9D3E2', WOOD = '#7A4E2D', DONE = '#FFE58A', OVER = '#FFD3C7', RED = '#D8452B';
export const viewBox = n => `0 0 ${n} ${n}`;
const X = s => s.c + 0.5, Y = s => s.r + 0.5;

// 1 to 4 dots, as on a die (Small: the kids').
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]] };

// A board's inside. opt: dots (pips, not numbers), ring (an island ringed:
// a hint's), lit (edges whose bridges blink: a hint's), ghost ({ edge,
// count }: the bridge a drag would lay, faint), pale (edges drawn pale:
// the rest of the answer, shown at a give-up), cheer (every island
// wiggles: solved).
export function boardContent(p, g, board, opt = {}) {
  const out = [];
  const isl = new Set(p.islands.map(s => `${s.r},${s.c}`));
  for (let r = 0; r < p.n; r++) for (let c = 0; c < p.n; c++) {
    if (!isl.has(`${r},${c}`)) out.push(`<circle cx="${c + 0.5}" cy="${r + 0.5}" r=".05" style="fill:${SEA_LINE}"/>`);
  }
  const lit = new Set(opt.lit ?? []), pale = new Set(opt.pale ?? []);
  g.edges.forEach((e, i) => {
    const ghost = opt.ghost?.edge === i;
    const k = ghost ? opt.ghost.count : board[i];
    if (!k) return;
    const A = p.islands[e.a], B = p.islands[e.b];
    const cls = ['bline', ghost && 'ghost', lit.has(i) && 'new', pale.has(i) && 'pale'].filter(Boolean).join(' ');
    const style = ghost ? `stroke:var(--ink);opacity:.25` : `stroke:${WOOD}${pale.has(i) ? ';opacity:.4' : ''}`;
    for (const o of k === 2 ? [-0.09, 0.09] : [0]) {
      const [dx, dy] = e.k === 'h' ? [0, o] : [o, 0];
      out.push(`<line class="${cls}" x1="${X(A) + dx}" y1="${Y(A) + dy}" x2="${X(B) + dx}" y2="${Y(B) + dy}" style="${style};stroke-width:.09;stroke-linecap:round"/>`);
    }
  });
  const have = counts(p, g, board);
  const R = opt.dots ? 0.4 : 0.36;
  p.islands.forEach((s, i) => {
    const state = have[i] === s.need ? 'done' : have[i] > s.need ? 'over' : '';
    if (opt.ring === i) {
      out.push(`<circle class="ring" cx="${X(s)}" cy="${Y(s)}" r="${R + 0.1}" style="fill:none;stroke:#fff;stroke-width:.15"/>`,
        `<circle class="ring" cx="${X(s)}" cy="${Y(s)}" r="${R + 0.1}" style="fill:none;stroke:var(--ink);stroke-width:.07"/>`);
    }
    const fill = state === 'done' ? DONE : state === 'over' ? OVER : '#fff';
    const edge = state === 'over' ? RED : 'var(--ink)';
    let inner = `<circle cx="${X(s)}" cy="${Y(s)}" r="${R}" style="fill:${fill};stroke:${edge};stroke-width:.05"/>`;
    if (opt.dots) {
      for (const [dx, dy] of PIPS[s.need] ?? PIPS[1]) inner += `<circle cx="${X(s) + dx * 0.15}" cy="${Y(s) + dy * 0.15}" r=".075" style="fill:var(--ink)"/>`;
    } else {
      inner += `<text x="${X(s)}" y="${Y(s) + 0.02}" style="font-size:.48px;font-weight:800;fill:var(--ink);text-anchor:middle;dominant-baseline:central;font-family:var(--font)">${s.need}</text>`;
    }
    out.push(`<g class="isl${state ? ` ${state}` : ''}${opt.cheer ? ' cheer' : ''}">${inner}</g>`);
  });
  return `<g style="pointer-events:none">${out.join('')}</g>`;
}

// The rules' picture (setup) and the home page's button: DEMO solved.
export function miniSvg(cls = '') {
  const g = edgesOf(DEMO);
  const { answer } = countAnswers(DEMO, 1, g);
  return `<svg class="${cls}" viewBox="${viewBox(DEMO.n)}" aria-hidden="true" style="display:block;background:${SEA};border-radius:12%">${boardContent(DEMO, g, answer)}</svg>`;
}
