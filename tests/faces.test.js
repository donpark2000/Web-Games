import { test } from 'node:test';
import assert from 'node:assert/strict';
import { svg, DRAWN_FACES, MOODS } from '../src/ui/faces.js';
import { FACE_NAMES, ROBOT } from '../src/core/tic-tac-toe.js';

test('faces: every pickable face and the robot has a drawing, and nothing extra', () => {
  assert.deepEqual([...DRAWN_FACES].sort(), [...FACE_NAMES, ROBOT].sort());
});

test('faces: each drawing, in both moods, is one well-formed SVG with no missing values', () => {
  let drawings = 0;
  for (const name of DRAWN_FACES) {
    for (const mood of MOODS) {
      const s = svg(name, mood);
      assert.match(s, /^<svg [^>]*viewBox="0 0 100 100"[^>]*>/, `${name} ${mood}`);
      assert.equal((s.match(/<svg/g) || []).length, 1, `${name} ${mood}: one <svg>`);
      assert.ok(s.endsWith('</svg>'), `${name} ${mood}: closed`);
      assert.doesNotMatch(s, /undefined|NaN|null/, `${name} ${mood}: a missing value`);
      assert.ok(s.length > 300, `${name} ${mood}: suspiciously short (${s.length})`);
      drawings++;
    }
  }
  assert.equal(drawings, 51);
});

test('faces: the three versions (normal, winner, sad) all differ, for every face', () => {
  for (const name of DRAWN_FACES) {
    const [n, w, s] = MOODS.map(m => svg(name, m));
    assert.equal(new Set([n, w, s]).size, 3, name);
  }
});

test('faces: unknown face or mood is an error, not a blank picture', () => {
  assert.throws(() => svg('dragon'), /no drawing/);
  assert.throws(() => svg('cat', 'happy'), /unknown mood/);
});
