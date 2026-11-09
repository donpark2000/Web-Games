// Tin Can Alley's pictures (no DOM code: strings of SVG): the cans on the
// setup screen's choices, and the home page's tile, the stall in small.
// The cans' colours are the 3D stall's, a colour per row.

import { layoutRows, CAN_COLOURS } from '../core/tin-can-alley.js';

// One can, its bottom left at (x, y - h): a body, a white band, lids.
function can(x, y, w, h, colour, turn = 0) {
  const t = turn ? ` transform="rotate(${turn} ${x + w / 2} ${y + h / 2})"` : '';
  return `<g${t}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.14}" fill="${colour}"/>`
    + `<rect x="${x}" y="${y + h * 0.36}" width="${w}" height="${h * 0.28}" fill="#FFFFFF"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.08}" rx="${w * 0.06}" fill="#D5DCE1"/>`
    + `<rect x="${x}" y="${y + h * 0.92}" width="${w}" height="${h * 0.08}" rx="${w * 0.06}" fill="#D5DCE1"/></g>`;
}

// The cans as they stand on the shelf: a pyramid or the wall, on a shelf
// line, in a 100 x 100 box. `cls` the svg's class.
export function canStackSvg(layout, cls = 'av') {
  const rows = layoutRows(layout), n = Math.max(...rows), high = rows.length;
  const w = Math.min(84 / n, 84 / high / 1.4), h = w * 1.4, gap = w * 0.08;
  const foot = 50 + (high * h) / 2;
  let out = '';
  rows.forEach((k, row) => {
    const x0 = 50 - (k * w + (k - 1) * gap) / 2;
    for (let i = 0; i < k; i++) out += can(x0 + i * (w + gap), foot - (row + 1) * h, w, h, CAN_COLOURS[row % CAN_COLOURS.length]);
  });
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${out}`
    + `<rect x="6" y="${foot}" width="88" height="5" rx="2" fill="#C0915F"/></svg>`;
}

// The home page's tile: the stall's curtain, the shelf on its red cabinet,
// Pyramid 6 with its top can knocked off, and the ball flying in.
export function stallMini(cls = 'tcamini') {
  const w = 22, h = 30, gap = 2, shelfY = 86;
  let cans = '';
  [3, 2].forEach((k, row) => {
    const x0 = 75 - (k * w + (k - 1) * gap) / 2;
    for (let i = 0; i < k; i++) cans += can(x0 + i * (w + gap), shelfY - (row + 1) * h, w, h, CAN_COLOURS[row]);
  });
  cans += can(104, shelfY - 3 * h + 6, w, h, CAN_COLOURS[2], 38);   // the top can, falling off
  const curtain = Array.from({ length: 8 }, (_, i) => `<rect x="${4 + i * 17.75}" y="4" width="17.75" height="96" fill="${i % 2 ? '#2A6378' : '#1F4F60'}"/>`).join('');
  return `<svg class="${cls}" viewBox="0 0 150 150" aria-hidden="true">`
    + `<rect x="0" y="0" width="150" height="150" rx="14" fill="#E2563F"/>`
    + `<rect x="4" y="4" width="142" height="142" rx="11" fill="#FFF6EA"/>`
    + curtain
    + `<rect x="18" y="${shelfY}" width="114" height="6" fill="#C0915F"/>`
    + `<rect x="22" y="${shelfY + 6}" width="106" height="${146 - shelfY - 6}" fill="#D9483B"/>`
    + `<rect x="28" y="${shelfY + 12}" width="94" height="${146 - shelfY - 22}" rx="4" fill="none" stroke="#F7B928" stroke-width="3"/>`
    + cans
    + `<path d="M8 34 q 12 -9 24 -8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"/>`
    + `<circle cx="42" cy="27" r="9" fill="#FFFFFF" stroke="#1E344555" stroke-width="1.5"/>`
    + `<rect x="34" y="24.5" width="16" height="5" fill="#F2724F"/>`
    + `<circle cx="42" cy="27" r="9" fill="none" stroke="#1E344555" stroke-width="1.5"/></svg>`;
}
