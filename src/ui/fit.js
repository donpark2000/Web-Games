// Fitting a game's play screen to the screen with no scrolling, footer
// included (developer, 2026-10-04: on an iPhone 16 the scoreboard was
// below the bottom of the screen). The search is src/core/fit.js; this
// file measures the page.

import { largestFitting } from '../core/fit.js';

// The page's full height as laid out now: the body's top and bottom
// padding, the game and the footer.
export function pageHeight() {
  const cs = getComputedStyle(document.body);
  const h = sel => document.querySelector(sel)?.getBoundingClientRect().height ?? 0;
  return parseFloat(cs.paddingTop) + h('main') + h('.site-foot') + parseFloat(cs.paddingBottom);
}

// Tries sizes between min and max with apply(size) (which sets the game's
// CSS sizes) and leaves the largest one at which the page fits the screen
// applied. Returns { size, fitted, tries, page, screen } for the debug log;
// fitted is false when even min doesn't fit (the page then scrolls).
export function fitPlayScreen(apply, min, max) {
  const r = largestFitting(s => { apply(s); return pageHeight() <= innerHeight + 0.5; }, min, Math.max(min, max));
  return { ...r, page: Math.round(pageHeight()), screen: `${innerWidth}x${innerHeight}` };
}
