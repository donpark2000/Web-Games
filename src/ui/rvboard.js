// Reversi's board as SVG: the play screen's board and the setup screen's
// pictures (src/ui/reversi.js). The rules: src/core/reversi.js.
//
// Drawn in squares: square (r, c) from x = c, y = r. The colours are
// inline, so a picture looks right with no game stylesheet;
// css/reversi.css adds the animations (a disc flipping, one put down).
//
// The discs look like real playing pieces (developer, 2026-10-25: "make
// the discs look like 3d playing pieces instead of just circles"), **seen
// at an angle** (sample C of the disc samples; developer: "It looks more
// like real pieces"; mockup v1's shaded round top "looks more like a ball
// than a disc"): the top an oval with a flat face, the side a band of its
// own colour over a band of the other (a real disc is black on one side
// and white on the other), shaded as a cylinder, with a shadow on the
// board.

export const RIM = 0.3;   // the board's wooden rim, in squares
export const viewBox = n => `${-RIM} ${-RIM} ${n + 2 * RIM} ${n + 2 * RIM}`;

const FELT = '#2E8B57', FELT_DARK = '#23704A', GRID = '#17543A';
const WOOD = '#8B5A2B', WOOD_DARK = '#6B4220';
const EDGE = { b: '#000', w: '#A9A9A0' };    // a layer's outline

// The disc's shape, in squares: the top's centre (DISC_Y down the square),
// its oval's half width and half height, and each colour's thickness.
const DISC_Y = 0.43, DISC_RX = 0.4, DISC_RY = 0.3, DISC_H = 0.085;

// The gradients the discs and felt use. `id` makes them unique per
// picture, since several share a page: the sides (s), lit from the left
// as a cylinder, and the flat tops (t), a little lighter at the back.
export function defs(id) {
  const side = (k, a, b, c) => `<linearGradient id="${id}s${k}" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset=".35" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const top = (k, a, b) => `<linearGradient id="${id}t${k}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  return `<defs>`
    + side('b', '#0A0A0A', '#454545', '#050505') + side('w', '#B4B4AA', '#F4F4EE', '#9C9C92')
    + top('b', '#323232', '#111111') + top('w', '#FFFFFF', '#E2E2DA')
    + `<linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${FELT}"/><stop offset="1" stop-color="${FELT_DARK}"/></linearGradient>`
    + `</defs>`;
}

// One disc on square (r, c), `colour` 'b' or 'w' on top: a soft shadow,
// the side's lower band (the other colour), its upper band, and the top.
export function discSvg(id, r, c, colour, cls = '') {
  const x = c + 0.5, y = r + DISC_Y, rx = DISC_RX, ry = DISC_RY, h = DISC_H;
  const other = colour === 'b' ? 'w' : 'b';
  // A band of the side from `top` down by h: straight up at the ends,
  // round along the bottom; the band above covers its top.
  const band = (top, k) => `<path d="M${x - rx} ${top}V${top + h}A${rx} ${ry} 0 0 0 ${x + rx} ${top + h}V${top}Z" style="fill:url(#${id}s${k});stroke:${EDGE[k]};stroke-width:.012"/>`;
  return `<g class="disc${cls ? ` ${cls}` : ''}">`
    + `<ellipse cx="${x + 0.03}" cy="${y + 2 * h + 0.05}" rx="${rx + 0.02}" ry="${ry + 0.02}" style="fill:#000;opacity:.3"/>`
    + band(y + h, other) + band(y, colour)
    + `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="fill:url(#${id}t${colour});stroke:${EDGE[colour]};stroke-width:.012"/>`
    + `<ellipse cx="${x}" cy="${y}" rx="${rx * 0.86}" ry="${ry * 0.84}" style="fill:none;stroke:${colour === 'b' ? '#fff' : '#000'};stroke-opacity:${colour === 'b' ? '.1' : '.05'};stroke-width:.025"/>`
    + `</g>`;
}

// The board under the discs: the rim, the felt, the lines, and the four
// small dots a real board has round the middle.
function base(id, n) {
  let s = `<rect x="${-RIM}" y="${-RIM}" width="${n + 2 * RIM}" height="${n + 2 * RIM}" rx=".28" style="fill:${WOOD}"/>`
    + `<rect x="${-RIM + 0.07}" y="${-RIM + 0.07}" width="${n + 2 * RIM - 0.14}" height="${n + 2 * RIM - 0.14}" rx=".22" style="fill:none;stroke:${WOOD_DARK};stroke-width:.04"/>`
    + `<rect x="0" y="0" width="${n}" height="${n}" style="fill:url(#${id}f)"/>`;
  for (let i = 0; i <= n; i++) {
    s += `<line x1="${i}" y1="0" x2="${i}" y2="${n}" style="stroke:${GRID};stroke-width:.03"/>`
      + `<line x1="0" y1="${i}" x2="${n}" y2="${i}" style="stroke:${GRID};stroke-width:.03"/>`;
  }
  for (const y of [2, n - 2]) for (const x of [2, n - 2]) s += `<circle cx="${x}" cy="${y}" r=".07" style="fill:${GRID}"/>`;
  return s;
}

const SPOT = { b: '#000', w: '#fff' };

// A board's inside. `b`: { n, cells } holding players 1 and 2; `colourOf`:
// player -> 'b' or 'w'. Options: `moves`: squares where `mover` can play,
// each marked with a faint dot of their colour; `last`: the robot's latest
// disc, ringed; `flipping`: discs just flipped, as [r, c, delay in ms]
// (they turn over one after another out from the disc put down); `put`:
// the disc just put down, as [r, c] (it drops in); `win`: the winner,
// whose discs bob one after another.
export function boardContent(b, colourOf, { id, moves = [], mover = 1, last = null, flipping = [], put = null, win = 0 }) {
  const { n, cells } = b;
  const out = [defs(id), base(id, n)];
  const turning = new Map(flipping.map(([r, c, ms]) => [`${r}:${c}`, ms]));
  let wins = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const p = cells[r * n + c];
      if (!p) continue;
      const col = colourOf(p);
      const ms = turning.get(`${r}:${c}`);
      if (ms !== undefined) {
        // The old colour turns away, then the new one turns in.
        out.push(`<g class="flipping" style="--d:${ms}ms">${discSvg(id, r, c, col === 'b' ? 'w' : 'b', 'out')}${discSvg(id, r, c, col, 'in')}</g>`);
      } else if (win && p === win) {
        out.push(`<g style="--d:${(wins++ % 12) * 60}ms">${discSvg(id, r, c, col, 'win')}</g>`);
      } else {
        out.push(discSvg(id, r, c, col, put && put[0] === r && put[1] === c ? 'put' : ''));
      }
    }
  }
  if (last) out.push(`<circle class="lastmark" cx="${last[1] + 0.5}" cy="${last[0] + 0.48}" r=".47" style="fill:none;stroke:var(--p2);stroke-width:.07"/>`);
  for (const [r, c] of moves) out.push(`<circle cx="${c + 0.5}" cy="${r + 0.5}" r=".11" style="fill:${SPOT[colourOf(mover)]};opacity:.4"/>`);
  return out.join('');
}

// A disc shown faintly where the finger is (or where the robot is about
// to play), with a spot on each disc it would flip.
export function aimContent(id, r, c, colour, flips = []) {
  return `<g class="aim"><g style="opacity:.55">${discSvg(id, r, c, colour)}</g>`
    + flips.map(([y, x]) => `<circle cx="${x + 0.5}" cy="${y + DISC_Y}" r=".17" style="fill:${SPOT[colour]};opacity:.8;stroke:${SPOT[colour === 'b' ? 'w' : 'b']};stroke-width:.03"/>`).join('')
    + `</g>`;
}

const blackWhite = p => (p === 1 ? 'b' : 'w');
const picture = (id, b, o = {}) => `<svg viewBox="${viewBox(b.n)}" aria-hidden="true">${boardContent(b, blackWhite, { id, ...o })}</svg>`;

// The rules' picture: black has just put down a disc at the end of a line
// of two white ones, which flip (over and over, slowly; css .rules-pic).
export function rulesSvg() {
  const n = 4;
  const cells = Array(n * n).fill(0);
  [[1, 0, 1], [1, 1, 1], [1, 2, 1], [1, 3, 1], [2, 1, 2], [2, 2, 1], [0, 2, 2], [3, 3, 2]]
    .forEach(([r, c, p]) => { cells[r * n + c] = p; });
  return picture('rvrules', { n, cells }, { flipping: [[1, 2, 500], [1, 1, 620]], put: [1, 3] });
}

// "How big?": each size's starting board.
export function startSvg(n) {
  const cells = Array(n * n).fill(0);
  const m = n / 2;
  cells[(m - 1) * n + (m - 1)] = 2; cells[m * n + m] = 2;
  cells[(m - 1) * n + m] = 1; cells[m * n + (m - 1)] = 1;
  return picture(`rvstart${n}`, { n, cells });
}

// A disc on its own, for the tally and the turn line.
export function chipDisc(colour) {
  const id = `rvchip${colour}`;
  return `<svg class="cd" viewBox="0.06 .04 .88 .98" aria-hidden="true">${defs(id)}${discSvg(id, 0, 0, colour)}</svg>`;
}

// The home page's button: a 4 x 4 corner of a game under way, black's
// line of three just made.
export function miniSvg(cls = '') {
  const n = 4;
  const cells = Array(n * n).fill(0);
  [[0, 1, 2], [1, 1, 1], [1, 2, 1], [1, 3, 1], [2, 1, 2], [2, 2, 1], [2, 3, 2], [3, 2, 2], [0, 3, 1]]
    .forEach(([r, c, p]) => { cells[r * n + c] = p; });
  return `<svg class="${cls}" viewBox="${viewBox(n)}" aria-hidden="true">${boardContent({ n, cells }, blackWhite, { id: 'rvhome' })}</svg>`;
}
