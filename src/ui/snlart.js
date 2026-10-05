// Snakes and Ladders drawings (from mockup v3), shared by the game screen
// and the home page's button: wooden ladders, friendly snakes, and the die
// (a 3D cube while waiting; one flat face once rolled). All SVG, drawn in
// units of 100 per square; nothing loaded from other sites.

import { centre, ROWS } from '../core/snakes-ladders.js';
import { DOTS } from './numbercard.js';

const at = n => { const p = centre(n); return { x: p.x * 100, y: p.y * 100 }; };

// Two rails with rungs, foot to top, a little short of each square's middle.
export function ladderSvg(foot, top) {
  const p = at(foot), q = at(top);
  const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy * 15, ny = ux * 15;
  const s = { x: p.x + ux * 14, y: p.y + uy * 14 }, e = { x: q.x - ux * 14, y: q.y - uy * 14 };
  let rungs = '';
  for (let t = 18; t < len - 34; t += 24) {
    const x = s.x + ux * t, y = s.y + uy * t;
    rungs += `<path d="M${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)} L${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}"/>`;
  }
  return `<g stroke-linecap="round"><g stroke="#C98A4E" stroke-width="7">${rungs}</g>`
    + `<path d="M${s.x + nx} ${s.y + ny} L${e.x + nx} ${e.y + ny} M${s.x - nx} ${s.y - ny} L${e.x - nx} ${e.y - ny}" stroke="#8E5A2C" stroke-width="8" fill="none"/></g>`;
}

// The snake's body as points from head to tail (a gentle wave); the piece
// slides along these.
export function snakePoints(head, tail) {
  const p = at(head), q = at(tail), dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len, waves = Math.max(1.5, len / 70), pts = [];
  for (let k = 0; k <= 48; k++) {
    const t = k / 48, w = Math.sin(t * Math.PI * waves) * 18 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08));
    pts.push({ x: p.x + dx * t + nx * w, y: p.y + dy * t + ny * w });
  }
  return pts;
}

// Green with yellow bands, and a smiling head on its top square.
export function snakeSvg(head, tail) {
  const pts = snakePoints(head, tail), d = 'M' + pts.map(o => `${o.x.toFixed(1)} ${o.y.toFixed(1)}`).join(' L');
  const h = pts[0], h2 = pts[3], a = Math.atan2(h.y - h2.y, h.x - h2.x) * 180 / Math.PI;
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="${d}" stroke="#3F8A3A" stroke-width="22"/><path d="${d}" stroke="#6CC25A" stroke-width="16"/>`
    + `<path d="${d}" stroke="#F7D046" stroke-width="16" stroke-dasharray="5 17"/></g>`
    + `<g transform="translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${(a + 90).toFixed(1)})">`
    + `<ellipse cx="0" cy="0" rx="19" ry="16" fill="#6CC25A" stroke="#3F8A3A" stroke-width="3"/>`
    + `<circle cx="-7" cy="-3" r="5" fill="#fff"/><circle cx="7" cy="-3" r="5" fill="#fff"/><circle cx="-7" cy="-2" r="2.6" fill="#1E3445"/><circle cx="7" cy="-2" r="2.6" fill="#1E3445"/>`
    + `<path d="M-6 6 Q0 11 6 6" stroke="#1E3445" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
}

// Everything drawn over the squares: snakes first, ladders on top.
export function boardArtSvg({ ladders, snakes }, cols = 6) {
  return `<svg class="art" viewBox="0 0 ${cols * 100} ${ROWS * 100}" aria-hidden="true">`
    + Object.entries(snakes).map(([h, t]) => snakeSvg(Number(h), t)).join('')
    + Object.entries(ladders).map(([f, t]) => ladderSvg(Number(f), t)).join('') + '</svg>';
}

// One flat face with n dots (laid out like Count to 9's); 0 is blank.
export const dotsSvg = n => `<svg class="av" viewBox="0 0 100 100" aria-hidden="true">${(DOTS[n] || []).map(k =>
  `<circle cx="${22 + (k % 3) * 28}" cy="${22 + Math.floor(k / 3) * 28}" r="10" fill="#1E3445"/>`).join('')}</svg>`;

// The waiting die: a cube seen corner-on (no face toward you), its three
// faces showing 1, 2 and 3, outlined in `ring` (whose turn it is). Each
// face is a parallelogram (o + s*u + t*v); its dots are drawn on a unit
// square and mapped onto it.
const CUBE_FACES = [
  { o: [12, 30], u: [38, -20], v: [38, 20], fill: '#FFFFFF', n: 1 },
  { o: [12, 30], u: [38, 20], v: [0, 42], fill: '#E6EDF1', n: 2 },
  { o: [50, 50], u: [38, -20], v: [0, 42], fill: '#CBD7DF', n: 3 },
];
export function cubeSvg(ring) {
  return `<svg class="av" viewBox="0 0 100 100" aria-hidden="true">` + CUBE_FACES.map(f => {
    const [ox, oy] = f.o, [ux, uy] = f.u, [vx, vy] = f.v;
    const pts = [[ox, oy], [ox + ux, oy + uy], [ox + ux + vx, oy + uy + vy], [ox + vx, oy + vy]].map(q => q.join(',')).join(' ');
    const pips = DOTS[f.n].map(k => `<circle cx="${0.22 + (k % 3) * 0.28}" cy="${0.22 + Math.floor(k / 3) * 0.28}" r=".1"/>`).join('');
    return `<polygon points="${pts}" fill="${f.fill}" stroke="${ring}" stroke-width="4" stroke-linejoin="round"/>`
      + `<g transform="matrix(${ux} ${uy} ${vx} ${vy} ${ox} ${oy})" fill="#1E3445">${pips}</g>`;
  }).join('') + '</svg>';
}
