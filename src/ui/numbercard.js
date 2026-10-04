// Count to 9's card fronts: a big number with the same number of dots
// under it, laid out like a die (developer, 2026-10-04: dots help a child
// who isn't sure of 7 vs 8 yet). Drawn in currentColor, so the CSS can
// colour a wrong card red. The number uses the device's own rounded font
// (css/count-to-9.css; nothing loaded from other sites).

// The dots for 1..9 on a 3x3 grid (0..8 in reading order).
export const DOTS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8], 7: [0, 2, 3, 4, 5, 6, 8], 8: [0, 1, 2, 3, 5, 6, 7, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

export function numberSvg(n) {
  const dots = (DOTS[n] || []).map(k =>
    `<circle cx="${40 + (k % 3) * 10}" cy="${72 + Math.floor(k / 3) * 10}" r="3.4"/>`).join('');
  return `<svg class="av num" viewBox="0 0 100 100" aria-hidden="true" fill="currentColor">`
    + `<text x="50" y="58" text-anchor="middle" font-size="60" font-weight="800">${n}</text>`
    + `<g opacity=".8">${dots}</g></svg>`;
}
