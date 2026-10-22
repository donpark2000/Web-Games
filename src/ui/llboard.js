// Laser Lab's pictures (mockup v7): the pieces, a laser, the gems, a wall,
// and a small solved board as one picture (the rules on the setup screen,
// the home page's button). The rules: src/core/laser-lab.js.
//
// Each picture carries its colours as attributes, so it looks right with
// no stylesheet (the home page); css/laser-lab.css restyles the board's
// gems and lasers as they light (classes win over attributes).

import { boardOf, gemColours, trace, lampAt, DR, DC, answerMap } from '../core/laser-lab.js';

export const NIGHT = '#22313F';
const INK = '#101A23';

const svg = (inner, cls = '', vb = '0 0 100 100') => `<svg viewBox="${vb}" class="${cls}" aria-hidden="true">${inner}</svg>`;
const strip = s => s.replace(/^<svg[^>]*>|<\/svg>$/g, '');

// A mirror (white) or a splitter (green with dark stripes, "glass the beam
// gets through"; developer, v2), '/' (o 0) or '\' (o 1). `fixed`: on a
// plate with a white edge (a hint's piece, which can't be changed).
export function pieceSvg(t, o, fixed = false) {
  const [x1, y1, x2, y2] = o === 0 ? [20, 80, 80, 20] : [20, 20, 80, 80];
  const base = fixed ? '<rect x="8" y="8" width="84" height="84" rx="12" fill="#3A4A58" stroke="#fff" stroke-width="5"/>' : '';
  const bar = (w, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  if (t === 'm') return svg(base + bar(20, INK) + bar(11, '#FFFFFF'));
  return svg(base + bar(20, INK) + bar(11, '#4BE07F') + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="11" stroke-dasharray="4 8" stroke-dashoffset="-6"/>`);
}

// A laser (v7; a lamp until v6), drawn shining down in a box a square wide
// and 70 high, and turned to face the board: an emitter box in its colour
// (k 0: the one laser's yellow, 1 red, 2 blue) with three vents and a
// highlight, a dark nozzle and its aperture (dark off, nearly white on),
// and a crack shown when it's broken.
export const LASER = ['#FFC21A', '#FF2E46', '#1F86FF'];
const APERTURE_ON = ['#FFF6C2', '#FFD6DB', '#D2E8FF'];
export function lampSvg(k = 0, on = false) {
  return svg(`<rect x="14" y="3" width="72" height="38" rx="6" class="lb" fill="${LASER[k]}" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M26 13 H46 M26 22 H46 M26 31 H46" stroke="${INK}" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>`
    + '<rect x="56" y="12" width="20" height="20" rx="3" fill="#FFFFFF59"/>'
    + `<rect x="34" y="41" width="32" height="14" fill="#2E3A46" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`
    + `<rect x="39" y="54" width="22" height="13" rx="3" class="lh" fill="${on ? APERTURE_ON[k] : '#3A4652'}" stroke="${INK}" stroke-width="5"/>`
    + `<path class="crack" d="M30 6 L44 20 L36 28 L52 38 L46 52" display="none" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`, 'lamp', '0 0 100 70');
}

// A gem of colour k (the bits it wants: 1, 2, 3 purple). One laser: pale
// blue; two: red, blue, or purple drawn half red, half blue with its
// outline in two halves at the red gem's thickness (developer, v5). Dim
// until lit; `lit` draws it lit (the small pictures).
const GEM = {
  one: { fill: '#3E566B', stroke: '#9BB3C6', facet: '#9BB3C655', litFill: '#9BF0FF', litFacet: '#3BA9C7' },
  1: { fill: '#5E2A36', stroke: '#FF8A96', facet: '#FFFFFF30', litFill: '#FF7484', litFacet: '#FFFFFF99' },
  2: { fill: '#213A60', stroke: '#80BAFF', facet: '#FFFFFF30', litFill: '#6DB6FF', litFacet: '#FFFFFF99' },
  3: { fill: '#432D63', stroke: '#C9A2FF', facet: '#FFFFFF30', litFill: '#C58FFF', litFacet: '#FFFFFF99' },
};
export function gemSvg(k, two = false, lit = false) {
  const c = two ? GEM[k] : GEM.one;
  const purple = two && k === 3;
  let s = `<polygon class="gm" points="50,12 86,40 50,90 14,40" fill="${lit ? c.litFill : c.fill}" stroke="${lit ? '#fff' : c.stroke}" stroke-width="5" stroke-linejoin="round"/>`;
  if (purple) {
    s += `<polygon class="gh gl" points="50,12 14,40 50,90" fill="${lit ? GEM[1].litFill : '#6A2A3A'}"/><polygon class="gh gr" points="50,12 86,40 50,90" fill="${lit ? GEM[2].litFill : '#244270'}"/>`
      + `<path class="gh gho gol" d="M50 12 L14 40 L50 90" fill="none" stroke="${lit ? '#fff' : GEM[1].stroke}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<path class="gh gho gor" d="M50 12 L86 40 L50 90" fill="none" stroke="${lit ? '#fff' : GEM[2].stroke}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  s += `<path class="gf" d="M14 40 H86 M32 40 L50 12 L68 40 M32 40 L50 90 L68 40" fill="none" stroke="${lit ? c.litFacet : c.facet}" stroke-width="3"/>`;
  return svg(s, `gem k${k}`);
}

export const wallSvg = () => svg('<rect x="4" y="4" width="92" height="92" rx="10" fill="#6A7B89"/><rect x="4" y="4" width="92" height="92" rx="10" fill="none" stroke="#4E5E6B" stroke-width="5"/><path d="M8 37 H92 M8 66 H92 M38 8 V37 M64 37 V66 M34 66 V92" stroke="#55656F" stroke-width="5"/>');

// What's on square i: a wall, a gem, a piece (`fixed`: the squares a hint
// fixed), or nothing.
export function cellSvg(p, i, placed, fixed = []) {
  const code = boardOf(p)[i];
  if (code === '#') return wallSvg();
  if (code === 'G') return gemSvg(gemColours(p).get(i), p.lamps.length > 1);
  const pc = placed.get(i);
  return pc ? pieceSvg(pc.t, pc.o, fixed.includes(i)) : '';
}
// the colour a laser and its beam are drawn in: k 0 (yellow) for one laser
export const lampColour = (p, l) => (p.lamps.length > 1 ? l.c : 0);
const BEAM = ['#FFD54A', '#FF4D5E', '#3D9BFF'];

// A small board solved with `answer`, every laser on, its beams and lit
// gems, the lasers beside it: one picture.
export function miniSvg(p, answer = p.answer) {
  const n = p.n, W = n * 100, M = 70, two = p.lamps.length > 1, placed = answerMap(answer, n);
  let s = `<svg viewBox="${-M} ${-M} ${W + 2 * M} ${W + 2 * M}" class="llmini" aria-hidden="true"><rect width="${W}" height="${W}" fill="${NIGHT}" stroke="#2B2B33" stroke-width="10"/>`;
  const b = boardOf(p);
  for (let i = 0; i < n * n; i++) {
    if (b[i] === 'G') continue;
    s += `<g transform="translate(${(i % n) * 100} ${Math.floor(i / n) * 100})">${strip(cellSvg(p, i, placed))}</g>`;
  }
  for (const g of trace(p, placed).segs) s += `<line x1="${g.x1 * 100}" y1="${g.y1 * 100}" x2="${g.x2 * 100}" y2="${g.y2 * 100}" stroke="${BEAM[two ? g.col : 0]}" stroke-width="14" stroke-linecap="round"/>`;
  for (const [r, c, k] of p.gems) s += `<g transform="translate(${c * 100} ${r * 100})">${strip(gemSvg(k, two, true))}</g>`;
  for (const l of p.lamps) {
    const a = lampAt(l, n), cx = a.c * 100 + 50, cy = a.r * 100 + 50;
    // the laser's box just outside the board, its aperture at the edge
    const ox = cx + DC[a.d] * 15, oy = cy + DR[a.d] * 15;
    s += `<g transform="translate(${ox} ${oy}) rotate(${l.side * 90}) translate(-50 -35)">${strip(lampSvg(lampColour(p, l), true))}</g>`;
  }
  return s + '</svg>';
}
