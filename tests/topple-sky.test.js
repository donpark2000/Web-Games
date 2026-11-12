// Star Light's moon and cloud (src/core/topple-sky.js): the moon where the
// view shows sky, below what covers the view's top; the cloud at a fifth of
// the first build's speed (developer, 2026-11-12). That the land hides them
// is the page's (a depth mask; tests/topple-page.test.js, and seen in the
// browser: journal).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equirect, moonSpot, MOON, cloudAt, CLOUD } from '../src/core/topple-sky.js';

const R = { x: 0.1, y: MOON.r };
// a skyline across the view: y(x) sampled every 0.025, as the page does
const line = f => Array.from({ length: 81 }, (_, i) => { const x = -1 + i * 0.025; return { x: +x.toFixed(3), y: f(x) }; });
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

test('topple sky: a direction to the photo, as three.js maps a background', () => {
  // +x is the middle of the photo across, -x its edges; +z a quarter on from the middle; up and down its top and bottom
  assert.ok(near(equirect(1, 0, 0).u, 0.5) && near(equirect(1, 0, 0).v, 0.5));
  assert.ok(near(equirect(0, 0, 1).u, 0.75));
  assert.ok(near(equirect(0, 0, -1).u, 0.25));
  assert.ok(near(Math.abs(equirect(-1, 0, 0).u - 0.5), 0.5), 'behind: an edge');
  assert.ok(near(equirect(0, 1, 0).v, 1) && near(equirect(0, -1, 0).v, 0));
  // 30° up: a third of the way from the middle to the top
  const s = Math.sin(Math.PI / 6), c = Math.cos(Math.PI / 6);
  assert.ok(near(equirect(c, s, 0).v, 0.5 + 1 / 6));
  // a little over 1 (rounding) doesn't make NaN
  assert.ok(Number.isFinite(equirect(0, 1.0000001, 0).v));
});

test('topple sky: the moon goes over the lowest land, clear of it, as high as allowed', () => {
  // a valley at x -0.5 (the land 0.3 there, 0.9 elsewhere)
  const sky = line(x => (Math.abs(x + 0.5) < 0.2 ? 0.3 : 0.9));
  const m = moonSpot(sky, R);
  assert.ok(Math.abs(m.x + 0.5) <= 0.1 + 1e-9, `over the valley: ${m.x}`);
  assert.ok(m.clear, 'clear of the land');
  assert.ok(m.y - R.y >= 0.3 + MOON.gap - 1e-9, 'a gap over the land');
  assert.ok(near(m.y, MOON.high), `as high as allowed: ${m.y}`);
  // the view all sky: the place nearest `prefer`, at `high`
  const open = moonSpot(line(() => -1), R);
  assert.ok(near(open.x, MOON.prefer) && near(open.y, MOON.high), JSON.stringify(open));
});

test("topple sky: the moon keeps below the level's name and the hearts", () => {
  const sky = line(() => 0.4);
  // the name over the left, the hearts over the right, their bottoms at 0.87; a gap in the middle
  const covers = [{ x0: -0.95, x1: 0.1, y0: 0.87 }, { x0: 0.5, x1: 0.98, y0: 0.87 }];
  const m = moonSpot(sky, R, { covers, high: 0.9 });
  const under = covers.filter(c => c.x1 > m.x - R.x && c.x0 < m.x + R.x);
  assert.equal(under.length, 0, `in the gap between them: ${m.x}`);
  // with only a little room under a cover, the moon tops out below it
  const low = moonSpot(line(() => 0.6), R, { covers: [{ x0: -1, x1: 1, y0: 0.87 }], high: 0.9 });
  assert.ok(low.y + R.y <= 0.87 - 0.02 + 1e-9, `below the cover: ${low.y}`);
});

test('topple sky: no room over the land: the moon at the top, rising from behind it (not clear)', () => {
  const m = moonSpot(line(() => 0.97), R);
  assert.equal(m.clear, false);
  assert.ok(near(m.y, MOON.top - R.y), `at the top: ${m.y}`);
  assert.ok(m.room < 0);
  // the skyline above the view (no sky at all): the same, not an error
  assert.equal(moonSpot(line(() => 1.05), R).clear, false);
  assert.throws(() => moonSpot([], R), /no skyline/);
});

test('topple sky: the cloud drifts at a fifth of the first speed, in view at the start, on a loop', () => {
  // the first build: 3 across in 55 s
  assert.ok(near(CLOUD.speed, 0.2 * 3 / 55));
  const a = cloudAt(0), b = cloudAt(10);
  assert.ok(a.shown && near(a.x, CLOUD.start), 'in view on the left at the start');
  assert.ok(near(b.x - a.x, 10 * CLOUD.speed, 1e-9), 'a fifth of the speed');
  // across the view (-1 to 1) takes about 3 minutes
  assert.ok(2 / CLOUD.speed > 170 && 2 / CLOUD.speed < 190, `${2 / CLOUD.speed} s`);
  // off the right, then a while clear, then from the left again
  const across = (CLOUD.to - CLOUD.from) / CLOUD.speed, toEnd = (CLOUD.to - CLOUD.start) / CLOUD.speed;
  assert.equal(cloudAt(toEnd + 1).shown, false, 'clear after it leaves');
  const back = cloudAt(toEnd + CLOUD.clear + 1);
  assert.ok(back.shown && back.x < -1.5, `back from the left: ${back.x}`);
  assert.ok(near(cloudAt(5).x, cloudAt(5 + across + CLOUD.clear).x, 1e-6), 'a loop');
});
