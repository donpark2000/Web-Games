import { test } from 'node:test';
import assert from 'node:assert/strict';
import { largestFitting } from '../src/core/fit.js';

// A fake page: its height grows with the size; it fits under `screen`.
// Records every size tried, and which one was applied last.
function page(screen, perPx = 5.76, fixed = 224) {
  const p = { tried: [], applied: null };
  p.fits = s => { p.tried.push(s); p.applied = s; return fixed + perPx * s <= screen; };
  return p;
}

test('fit: finds the largest size that fits, and leaves it applied', () => {
  const p = page(659);                          // an iPhone 16 in Safari, tic-tac-toe's numbers
  const r = largestFitting(p.fits, 40, 113);
  assert.equal(r.size, 75);                     // 224 + 5.76 * 75 = 656 <= 659; 76 gives 661.8
  assert.equal(r.fitted, true);
  assert.equal(p.applied, 75);
  assert.equal(r.tries, p.tried.length);
  assert.ok(r.tries <= 10, `${r.tries} tries`);
});

test('fit: the biggest size when everything fits (one try)', () => {
  const p = page(2000);
  assert.deepEqual(largestFitting(p.fits, 40, 113), { size: 113, tries: 1, fitted: true });
});

test('fit: nothing fits: the smallest size, marked not fitted', () => {
  const p = page(300);
  assert.deepEqual(largestFitting(p.fits, 40, 113), { size: 40, tries: 2, fitted: false });
  assert.equal(p.applied, 40);
});

test('fit: every answer over a range of screens is exactly the largest fitting size', () => {
  let checked = 0;
  for (let screen = 400; screen <= 1000; screen += 7) {
    const p = page(screen);
    const r = largestFitting(p.fits, 40, 113);
    const best = Math.max(40, Math.min(113, Math.floor((screen - 224) / 5.76)));
    assert.equal(r.size, best, `screen ${screen}`);
    assert.equal(p.applied, r.size, `screen ${screen}: answer left applied`);
    checked++;
  }
  assert.equal(checked, 86);
});

test('fit: fractional limits are rounded inward; a bad range is refused', () => {
  const p = page(2000);
  assert.equal(largestFitting(p.fits, 40.2, 113.9).size, 113);
  assert.throws(() => largestFitting(p.fits, 50, 40), /bad range/);
  assert.throws(() => largestFitting(p.fits, NaN, 40), /bad range/);
});
