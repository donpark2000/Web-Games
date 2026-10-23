// The zoom block on the game pages (src/ui/nozoom.js; 3.5, 3.6): a pinch
// (a two-finger move, Safari's gesture events) cancelled while the page
// is at its normal size and let through once it's zoomed in, so it can
// be pinched back out; one finger left alone; each pinch noted once; a
// double tap stopped by touch-action on the whole page; the last touches
// kept for the zoom log. Node's EventTarget stands in for the document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockPinch } from '../src/ui/nozoom.js';

const ev = (type, touches, { cancelable = true, at } = {}) => {
  const e = new Event(type, { cancelable });
  if (touches !== undefined) Object.defineProperty(e, 'touches', { value: Array(touches).fill({}) });
  if (at !== undefined) Object.defineProperty(e, 'timeStamp', { value: at });
  return e;
};
const setup = (scale = () => 1) => {
  const doc = new EventTarget(), notes = [], root = { style: {} };
  const seen = blockPinch(doc, { note: (what, data) => notes.push(`${what}: ${data.how}`), scale, root });
  return { doc, notes, root, seen };
};

test('nozoom: a pinch cancelled and noted once; one finger left alone; the next pinch noted again', () => {
  const { doc, notes, seen } = setup();
  const one = ev('touchmove', 1);
  doc.dispatchEvent(one);
  assert.equal(one.defaultPrevented, false, 'a one-finger move (a scroll) cancelled');
  const moves = [ev('touchmove', 2), ev('touchmove', 2)];
  for (const e of moves) doc.dispatchEvent(e);
  assert.deepEqual(moves.map(e => e.defaultPrevented), [true, true]);
  doc.dispatchEvent(ev('touchend', 1));
  doc.dispatchEvent(ev('touchmove', 3));
  assert.deepEqual(notes, ['pinch blocked: two fingers'], 'noted again with a finger still down');
  doc.dispatchEvent(ev('touchend', 0));
  const g = ev('gesturestart');
  doc.dispatchEvent(g);
  doc.dispatchEvent(ev('gesturechange'));
  assert.ok(g.defaultPrevented, 'Safari’s gesture not cancelled');
  assert.deepEqual(notes, ['pinch blocked: two fingers', 'pinch blocked: gesture']);
  assert.equal(seen.blocked, 5, 'every move and gesture event cancelled counted');
});

// 3.6: on the iPhone 3.5's page still zoomed in, and the developer pinched
// it back out: a zoomed page must never be stuck.
test('nozoom: zoomed in, a pinch is let through, so the page can be pinched back out', () => {
  let s = 1.8;
  const { doc, notes } = setup(() => s);
  const out = ev('touchmove', 2), g = ev('gesturestart');
  doc.dispatchEvent(out);
  doc.dispatchEvent(g);
  assert.deepEqual([out.defaultPrevented, g.defaultPrevented], [false, false], 'zooming out blocked');
  assert.deepEqual(notes, []);
  doc.dispatchEvent(ev('touchend', 0));
  s = 1;
  const back = ev('touchmove', 2);
  doc.dispatchEvent(back);
  assert.ok(back.defaultPrevented, 'at the normal size again, not blocked');
});

test('nozoom: a move that can’t be cancelled is left alone, noted once and counted', () => {
  const { doc, notes, seen } = setup();
  const e = ev('touchmove', 2, { cancelable: false });
  doc.dispatchEvent(e);
  doc.dispatchEvent(ev('touchmove', 2, { cancelable: false }));
  assert.equal(e.defaultPrevented, false);
  assert.deepEqual(notes, ['pinch not cancelable: two fingers']);
  assert.equal(seen.uncancelable, 2);
});

// 3.6: a double tap off the board could zoom; touch-action manipulation on
// the whole page stops it. The last touches are kept for the zoom log:
// fingers, and the gap between one-finger taps (a double tap's is short).
test('nozoom: the whole page gets touch-action manipulation; the last touches kept', () => {
  const { doc, root, seen } = setup();
  assert.equal(root.style.touchAction, 'manipulation');
  doc.dispatchEvent(ev('touchstart', 1, { at: 1000 }));
  doc.dispatchEvent(ev('touchend', 0, { at: 1050 }));
  doc.dispatchEvent(ev('touchstart', 1, { at: 1200 }));
  doc.dispatchEvent(ev('touchend', 0, { at: 1250 }));
  assert.deepEqual([seen.last, seen.lastTapGap, seen.at], [1, 200, 1200]);
  assert.equal(seen.touched, doc, 'the element touched not kept (3.7: the zoom log says if a tap redrew it)');
  doc.dispatchEvent(ev('touchstart', 1, { at: 2000 }));
  doc.dispatchEvent(ev('touchstart', 2, { at: 2010 }));
  doc.dispatchEvent(ev('touchend', 1, { at: 2300 }));
  assert.equal(seen.fingers, 2, 'a finger still down: the touch not over');
  doc.dispatchEvent(ev('touchend', 0, { at: 2310 }));
  assert.deepEqual([seen.fingers, seen.last, seen.lastTapGap], [0, 2, 200], 'a two-finger touch taken for a tap');
});
