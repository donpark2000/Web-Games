// The pinch block on the game pages (src/ui/nozoom.js, 3.5): a two-finger
// move and Safari's gesture events are cancelled, one finger is left
// alone, and each pinch is noted once. Node's EventTarget stands in for
// the document.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockPinch } from '../src/ui/nozoom.js';

const ev = (type, touches, cancelable = true) => {
  const e = new Event(type, { cancelable });
  if (touches !== undefined) Object.defineProperty(e, 'touches', { value: Array(touches).fill({}) });
  return e;
};

test('nozoom: a pinch cancelled and noted once; one finger left alone; the next pinch noted again', () => {
  const doc = new EventTarget(), notes = [];
  blockPinch(doc, how => notes.push(how));
  const one = ev('touchmove', 1);
  doc.dispatchEvent(one);
  assert.equal(one.defaultPrevented, false, 'a one-finger move (a scroll) cancelled');
  const moves = [ev('touchmove', 2), ev('touchmove', 2)];
  for (const e of moves) doc.dispatchEvent(e);
  assert.deepEqual(moves.map(e => e.defaultPrevented), [true, true]);
  doc.dispatchEvent(ev('touchend', 1));
  doc.dispatchEvent(ev('touchmove', 3));
  assert.deepEqual(notes, ['two fingers'], 'noted again with a finger still down');
  doc.dispatchEvent(ev('touchend', 0));
  const g = ev('gesturestart');
  doc.dispatchEvent(g);
  doc.dispatchEvent(ev('gesturechange'));
  assert.ok(g.defaultPrevented, 'Safari’s gesture not cancelled');
  assert.deepEqual(notes, ['two fingers', 'gesture']);
});

test('nozoom: a move that can’t be cancelled is left alone and not noted', () => {
  const doc = new EventTarget(), notes = [];
  blockPinch(doc, how => notes.push(how));
  const e = ev('touchmove', 2, false);
  doc.dispatchEvent(e);
  assert.equal(e.defaultPrevented, false);
  assert.deepEqual(notes, []);
});
