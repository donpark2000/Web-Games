// No zooming in on the game pages (3.5; developer: on the phone the board
// "seems to zoom in", probably from a two-finger touch by accident). iOS
// Safari ignores the viewport's user-scalable=no, so the page does it:
// - a pinch is cancelled (Safari's own gesture events, and, for other
//   browsers, a touch move with two fingers or more), but only while the
//   page is at its normal size: zoomed in somehow, it can always be
//   pinched back out (3.6; with 3.5's block on the iPhone the page still
//   zoomed, and the developer pinched it back out);
// - a double tap anywhere doesn't zoom (3.6: touch-action manipulation on
//   the whole page; until then only on the boards, Find the Stars
//   2026-10-13, and a quick second tap off the board could still zoom).
// One finger still scrolls. The home page and log.html keep zoom (they
// don't load this). Logged ("zoom"): each pinch blocked, a pinch that
// couldn't be cancelled, and every change of zoom with the touches just
// before it, so the phone's log shows how a zoom got through.

const ZOOMED = 1.01;   // a page scale above this is zoomed in

// `target`: the document (an EventTarget in the tests). `note(what,
// data)` is told of each pinch blocked (once per pinch) and of one that
// couldn't be cancelled. `scale()`: the page's zoom now (1: normal).
// `root`: the element whose touch-action stops double-tap zoom. Returns
// what it saw of the last touches (for the zoom log).
export function blockPinch(target, { note = () => {}, scale = () => 1, root = null } = {}) {
  if (root) root.style.touchAction = 'manipulation';
  const seen = { fingers: 0, last: 0, at: 0, lastTapGap: null, blocked: 0, uncancelable: 0 };
  let pinching = false, lastEnd = 0;
  const stop = (e, how) => {
    if (scale() > ZOOMED) return;   // zoomed in: zooming out is let through
    if (!e.cancelable) {
      seen.uncancelable++;
      if (!pinching) { pinching = true; note('pinch not cancelable', { how }); }
      return;
    }
    e.preventDefault();
    seen.blocked++;
    if (!pinching) { pinching = true; note('pinch blocked', { how }); }
  };
  target.addEventListener('gesturestart', e => stop(e, 'gesture'), { passive: false });
  target.addEventListener('gesturechange', e => stop(e, 'gesture'), { passive: false });
  target.addEventListener('touchstart', e => { seen.fingers = Math.max(seen.fingers, e.touches?.length ?? 0); seen.at = e.timeStamp; }, { passive: true });
  target.addEventListener('touchmove', e => { if (e.touches?.length > 1) stop(e, 'two fingers'); }, { passive: false });
  const done = e => {
    if (e.touches?.length) return;
    pinching = false;
    if (seen.fingers === 1) { seen.lastTapGap = lastEnd ? Math.round(e.timeStamp - lastEnd) : null; lastEnd = e.timeStamp; }
    seen.last = seen.fingers;
    seen.fingers = 0;
  };
  target.addEventListener('touchend', done);
  target.addEventListener('touchcancel', done);
  target.addEventListener('gestureend', () => { pinching = false; });
  return seen;
}

if (typeof document !== 'undefined') {
  import('./debuglog.js').then(({ log }) => {
    const vv = window.visualViewport;
    const seen = blockPinch(document, {
      note: (what, data) => log.add('zoom', what, data),
      scale: () => vv?.scale ?? 1,
      root: document.documentElement,
    });
    // every change of zoom, with what the last touches were
    let was = vv?.scale ?? 1;
    vv?.addEventListener('resize', () => {
      if (Math.abs(vv.scale - was) < 0.01) return;
      log.add('zoom', 'page zoom changed', { from: +was.toFixed(2), to: +vv.scale.toFixed(2), fingers: seen.fingers || seen.last, msSinceTouch: Math.round(performance.now() - seen.at), lastTapGap: seen.lastTapGap, blocked: seen.blocked, uncancelable: seen.uncancelable });
      was = vv.scale;
    });
    log.add('zoom', 'blocking zoom in', { touchAction: getComputedStyle(document.documentElement).touchAction, scale: was, visualViewport: !!vv });
  });
}
