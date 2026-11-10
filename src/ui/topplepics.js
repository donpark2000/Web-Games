// Topple!'s pictures (no DOM code: strings of SVG): the home page's tile
// and the setup screen's rules picture, the same drawing. A park's sky and
// lawn, an arch of the game's blocks with its top cube knocked off, the ball
// flying in from a slingshot. The colours are the 3D blocks'.

import { COLOURS } from '../core/topple.js';

// A block: its colour, a darker edge, a light line inside (as the 3D ones).
function block(x, y, w, h, colour, turn = 0) {
  const t = turn ? ` transform="rotate(${turn} ${x + w / 2} ${y + h / 2})"` : '';
  return `<g class="blk"${t}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${colour}" stroke="#1E344566" stroke-width="2"/>`
    + `<rect x="${x + 3}" y="${y + 3}" width="${Math.max(0, w - 6)}" height="${Math.max(0, h - 6)}" rx="1" fill="none" stroke="#FFFFFF55" stroke-width="1.5"/></g>`;
}

// In a 150 x 150 box (the home tile is 150 px; the rules picture smaller).
export function toppleMini(cls = 'tpmini') {
  const ground = 118;
  const blocks = block(60, ground - 52, 12, 52, COLOURS.blue) + block(108, ground - 52, 12, 52, COLOURS.blue)
    + block(52, ground - 64, 76, 12, COLOURS.yellow)
    + block(64, ground - 82, 18, 18, COLOURS.green)
    + block(118, ground - 88, 18, 18, COLOURS.purple, 32);   // knocked off
  const sling = '<path d="M24 132 V112 M24 112 L16 98 M24 112 L32 98" fill="none" stroke="#8A5A3B" stroke-width="4" stroke-linecap="round"/>';
  return `<svg class="${cls}" viewBox="0 0 150 150" aria-hidden="true">`
    + '<rect x="0" y="0" width="150" height="150" rx="14" fill="#7DBCE6"/>'
    + `<rect x="0" y="${ground}" width="150" height="${150 - ground}" fill="#8DBE72"/>`
    + `<rect x="0" y="${ground + 12}" width="150" height="${150 - ground - 12}" fill="#7CB062"/>`
    + '<rect x="0" y="0" width="150" height="150" rx="14" fill="none" stroke="#3A94D4" stroke-width="4"/>'
    + '<circle cx="24" cy="24" r="11" fill="#F7B928"/>'
    + blocks + sling
    // the ball where the purple cube stood, just after knocking it off
    + '<path d="M26 94 Q 52 22 92 38" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/>'
    + '<circle cx="102" cy="42" r="8" fill="#FFFFFF" stroke="#1E344555" stroke-width="1.5"/>'
    + '<rect x="94" y="39.5" width="16" height="5" fill="#F2724F"/>'
    + '<circle cx="102" cy="42" r="8" fill="none" stroke="#1E344555" stroke-width="1.5"/></svg>';
}
