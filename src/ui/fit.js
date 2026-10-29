// Fitting a game's play screen to the screen with no scrolling, footer
// included (developer, 2026-10-04: on an iPhone 16 the scoreboard was
// below the bottom of the screen). The search is src/core/fit.js; this
// file measures the page.

import { largestFitting, pickLayout } from '../core/fit.js';

const foot = () => document.querySelector('.site-foot');

// The page's full height as laid out now: the body's top and bottom
// padding, the game and the footer (counted once: in the wide layout it
// is inside main).
export function pageHeight() {
  const cs = getComputedStyle(document.body);
  const h = sel => document.querySelector(sel)?.getBoundingClientRect().height ?? 0;
  const footH = foot()?.closest('main') ? 0 : h('.site-foot');
  return parseFloat(cs.paddingTop) + h('main') + footH + parseFloat(cs.paddingBottom);
}

// Tries sizes between min and max with apply(size) (which sets the game's
// CSS sizes) and leaves the largest one at which the page fits the screen
// applied. Returns { size, fitted, tries, page, screen } for the debug log;
// fitted is false when even min doesn't fit (the page then scrolls). In
// the wide layout the page mustn't be wider than the screen either.
export function fitPlayScreen(apply, min, max) {
  const fits = () => pageHeight() <= innerHeight + 0.5
    && (!document.body.classList.contains('wide-layout') || document.documentElement.scrollWidth <= innerWidth);
  const r = largestFitting(s => { apply(s); return fits(); }, min, Math.max(min, max));
  return { ...r, page: Math.round(pageHeight()), screen: `${innerWidth}x${innerHeight}` };
}

// Sideways screens (DESIGN.md "Sideways screens"; developer, 2026-10-29:
// on a tablet held sideways "Boards are quite a bit smaller and there is
// a lot of unused space beside the game board"). The wide layout
// (css/game.css, body.wide-layout) puts the 🏠 and 🔊 on the left, the board in
// the middle at the screen's full height, and the rest in a column on
// the right, the footer at its foot.

// Puts the play screen in the wide layout, or back to one column. The
// footer moves into the play screen and back under main. Call it with
// false whenever the setup screen shows: the footer mustn't be left
// inside the hidden play screen.
export function setWide(on) {
  document.body.classList.toggle('wide-layout', on);
  const play = document.getElementById('play'), f = foot();
  if (!play || !f) return;
  if (on && f.parentElement !== play) play.appendChild(f);
  if (!on && f.parentElement === play) document.querySelector('main').after(f);
}

// The width the board can have in the wide layout: the page's width less
// the 🏠's column, the right column (--side) and the two gaps.
export function wideRoom() {
  const play = document.getElementById('play'), cs = getComputedStyle(play);
  const home = play.querySelector('.homebtn')?.offsetWidth ?? 0;
  return document.querySelector('main').clientWidth - home - parseFloat(cs.getPropertyValue('--side')) - 2 * parseFloat(cs.columnGap);
}

// What words fitted to the screen once (the puzzles' tools and turn
// lines) were fitted for: the screen's width and the layout. The right
// column is narrower than one column, so each layout fits its own (6.3:
// fitted once per width, the wide layout kept one column's sizes, and
// Bridges' and Find the Stars' tools had their words cut).
export const fitFor = () => `${innerWidth}${document.body.classList.contains('wide-layout') ? '/wide' : ''}`;

// The board's room in the wide layout, estimated without it showing (a
// setup screen deciding what fits; wideRoom() measures the play screen):
// { width, height }, or null on a screen not wider than tall. The width
// is the screen's less the page's sides, the 🏠, the right column and the
// two gaps; the height the screen's less the page's top and bottom and
// the game's name over the board (css/game.css).
export function wideArea() {
  if (innerWidth <= innerHeight) return null;
  const css = (el, v) => parseFloat(getComputedStyle(el).getPropertyValue(v)) || 0;
  const root = document.documentElement, body = document.body;
  return {
    width: innerWidth - css(body, 'padding-left') - css(body, 'padding-right') - css(root, '--homebtn') - css(root, '--side') - 2 * css(root, '--wide-gap'),
    height: innerHeight - css(body, 'padding-top') - css(body, 'padding-bottom') - css(root, '--gname-room'),
  };
}

// Fits the play screen both ways and keeps the one with the bigger board
// (pickLayout). fit(wide) sets that layout's limits and returns
// fitPlayScreen's result, or null when the layout has no room. Only a
// screen wider than tall tries the wide layout. Returns the kept result
// with { layout, tall, wide } (each way's size, wide null if not tried)
// for the debug log.
export function fitEitherWay(fit) {
  setWide(false);
  const tall = fit(false);
  const tried = innerWidth > innerHeight;
  let wide = null;
  if (tried) {
    setWide(true);
    wide = fit(true);
  }
  const layout = pickLayout(tall, wide);
  let kept = layout === 'wide' ? wide : tall;
  // Back to one column, fitted again, whenever wide was tried and not
  // kept, also when it had no room (wide null).
  if (layout === 'tall' && tried) { setWide(false); kept = fit(false); }
  return { ...kept, layout, tall: tall.size, wide: wide?.size ?? null };
}
