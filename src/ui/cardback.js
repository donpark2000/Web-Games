// The matching cards' back (DESIGN.md "Matching cards"): a yellow star on
// teal-blue dots, the same on every card. From the approved mockup, except
// that the dots are drawn one by one instead of with an SVG <pattern>: a
// pattern needs an id, and with many cards on a page every copy would
// point at the first one (which breaks if that one is hidden).

const DOTS = [];
for (let y = 7; y < 100; y += 14) {
  for (let x = 7; x < 100; x += 14) DOTS.push(`<circle cx="${x}" cy="${y}" r="2.2"/>`);
}

export const CARD_BACK = `<svg class="av" viewBox="0 0 100 100" aria-hidden="true">`
  + `<rect width="100" height="100" fill="#2C6E8F"/><g fill="#3F86A8">${DOTS.join('')}</g>`
  + `<circle cx="50" cy="50" r="24" fill="#2C6E8F"/>`
  + `<path d="M50 31 L55.6 43.3 L69 44.8 L59 53.9 L61.8 67.1 L50 60.4 L38.2 67.1 L41 53.9 L31 44.8 L44.4 43.3 Z" fill="#F7B928" stroke="#C98F0A" stroke-width="2" stroke-linejoin="round"/>`
  + `</svg>`;
