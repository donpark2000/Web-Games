// Topple!'s road (Q117, src/core/topple-road.js): where the 25 scenes stand
// for any screen width. Pure sums; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadGeom, nodeAt, ROAD_MIN_CIRCLE } from '../src/core/topple-road.js';
import { SCENES, MAX_LEVEL } from '../src/core/topple.js';

const WIDTHS = [280, 320, 360, 400, 460];

test('road: every scene (5 levels of 5 in each world), level 1 at the bottom, each above the one before', () => {
  for (const w of WIDTHS) {
    const g = roadGeom(w);
    assert.equal(g.nodes.length, MAX_LEVEL * SCENES, `${w}: scenes`);
    for (let i = 1; i < g.nodes.length; i++) assert.ok(g.nodes[i].y < g.nodes[i - 1].y, `${w}: scene ${i + 1} is above scene ${i}`);
    assert.deepEqual([nodeAt(g, 1, 1).lv, nodeAt(g, 1, 1).sc, nodeAt(g, MAX_LEVEL, 5).lv, nodeAt(g, MAX_LEVEL, 5).sc], [1, 1, MAX_LEVEL, 5]);
    assert.ok(nodeAt(g, 1, 1).y > g.H / 2 && nodeAt(g, MAX_LEVEL, 5).y < g.H / 2, `${w}: the journey runs up`);
  }
});

test('road: every circle fits the width and is big enough for a finger; none touch; a banner clears its scenes', () => {
  for (const w of [...WIDTHS, 200]) {   // 200: narrower than any screen, still sound
    const g = roadGeom(w), r = g.size / 2;
    assert.ok(g.size >= ROAD_MIN_CIRCLE, `${w}: circle ${g.size} px`);
    for (const n of g.nodes) assert.ok(n.x - r >= 0 && n.x + r <= w, `${w}: scene ${n.lv}.${n.sc} inside the width`);
    for (let i = 1; i < g.nodes.length; i++) assert.ok(g.nodes[i - 1].y - g.nodes[i].y >= g.size + 14, `${w}: room for the stars under scene ${i}`);
    assert.equal(g.bands.length, MAX_LEVEL);
    for (const b of g.bands) {
      // the banner sits under its level's first scene, with room for that scene's stars
      const first = nodeAt(g, b.lv, 1);
      assert.ok(b.y - first.y >= g.size / 2 + 15 + 14, `${w}: banner ${b.lv} clear of scene 1's stars (${b.y - first.y})`);
      assert.ok(b.top < first.y && b.bottom > b.y, `${w}: band ${b.lv} holds its scenes and banner`);
    }
    assert.equal(g.bands[0].bottom, g.H);
    assert.equal(g.bands[MAX_LEVEL - 1].top, 0);
  }
});

test('road: the same width gives the same road (nothing random)', () => {
  assert.deepEqual(roadGeom(375), roadGeom(375));
  assert.notDeepEqual(roadGeom(375).nodes, roadGeom(460).nodes);
});
