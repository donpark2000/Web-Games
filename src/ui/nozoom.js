// No pinch zoom on the game pages (3.5; developer: on the phone the board
// "seems to zoom in", probably from a two-finger touch by accident). iOS
// Safari ignores the viewport's user-scalable=no, so the page cancels the
// pinch itself: Safari's own gesture events, and (other browsers) a touch
// move with two fingers or more. One finger still scrolls. The home page
// and log.html keep zoom (they don't load this). Double-tap zoom is
// stopped where it mattered, on the boards (Find the Stars, 2026-10-13).

// `target`: the document (an EventTarget in the tests); `note(how)` is
// told once per pinch that it was blocked.
export function blockPinch(target, note = () => {}) {
  let pinching = false;
  const stop = (e, how) => {
    if (!e.cancelable) return;
    e.preventDefault();
    if (!pinching) { pinching = true; note(how); }
  };
  target.addEventListener('gesturestart', e => stop(e, 'gesture'), { passive: false });
  target.addEventListener('gesturechange', e => stop(e, 'gesture'), { passive: false });
  target.addEventListener('touchmove', e => { if (e.touches?.length > 1) stop(e, 'two fingers'); }, { passive: false });
  const done = e => { if (!e.touches?.length) pinching = false; };
  target.addEventListener('touchend', done);
  target.addEventListener('touchcancel', done);
  target.addEventListener('gestureend', () => { pinching = false; });
}

if (typeof document !== 'undefined') {
  import('./debuglog.js').then(({ log }) => blockPinch(document, how => log.add('zoom', 'pinch blocked', { how })));
}
