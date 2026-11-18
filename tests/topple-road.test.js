// Topple!'s road (Q117, src/core/topple-road.js): where the 25 scenes stand
// for any screen width. Pure sums; no browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roadGeom, nodeAt, roadJoins, openWorlds, ROAD_MIN_CIRCLE, GATE_H, BARRIER_H } from '../src/core/topple-road.js';
import { SCENES, MAX_LEVEL, WORLDS, worldLevels } from '../src/core/topple.js';

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
    // the first world's gate at the foot, the last level's band to the top
    assert.equal(g.gates[0].bottom, g.H);
    assert.equal(g.bands[MAX_LEVEL - 1].top, 0);
  }
});

test('road: the same width gives the same road (nothing random)', () => {
  assert.deepEqual(roadGeom(375), roadGeom(375));
  assert.notDeepEqual(roadGeom(375).nodes, roadGeom(460).nodes);
});

test('road: each world has a gate under its first level, the bands and gates fill the road with no gap or overlap (Q122)', () => {
  for (const w of WIDTHS) {
    const g = roadGeom(w);
    assert.equal(g.gates.length, WORLDS.length, `${w}: a gate a world`);
    // every strip from the foot up: gate, its levels' bands, the next gate...
    const strips = [];
    for (const gate of g.gates) {
      strips.push({ what: `gate ${gate.world}`, top: gate.top, bottom: gate.bottom });
      for (const lv of worldLevels(gate.world)) strips.push({ what: `level ${lv}`, ...g.bands[lv - 1] });
      assert.ok(gate.bottom - gate.top >= GATE_H, `${w}: gate ${gate.world} ${gate.bottom - gate.top} px`);
      assert.ok(gate.y > gate.top && gate.y < gate.bottom, `${w}: gate ${gate.world}'s banner inside it`);
      // the world's first scene above its gate, the scene before (the last world's) under it
      const first = worldLevels(gate.world)[0];
      assert.ok(nodeAt(g, first, 1).y < gate.top, `${w}: level ${first} above its gate`);
      if (first > 1) assert.ok(nodeAt(g, first - 1, SCENES).y > gate.bottom, `${w}: level ${first - 1} under the gate`);
    }
    assert.equal(strips.length, WORLDS.length + MAX_LEVEL);
    for (let i = 1; i < strips.length; i++) assert.equal(strips[i].bottom, strips[i - 1].top, `${w}: ${strips[i].what} meets ${strips[i - 1].what}`);
  }
});

// Q128 (developer, 2026-11-18: "a teaser is OK but don't show the levels"): a world not open yet is closed off.
test('road: the next world closed off: its barrier at the top, none of its levels; the strips still meet (Q128)', () => {
  const firstMoon = worldLevels('moon')[0], parkLevels = worldLevels('park').length;
  for (const w of WIDTHS) {
    const g = roadGeom(w, 1), full = roadGeom(w);
    assert.equal(g.open, 1);
    assert.equal(g.nodes.length, parkLevels * SCENES, `${w}: Earth's scenes only`);
    assert.ok(g.nodes.every(n => n.lv < firstMoon) && g.bands.every(b => b.lv < firstMoon), `${w}: no moon level`);
    assert.deepEqual(g.gates.map(x => x.world), ['park']);
    assert.deepEqual([g.barrier.world, g.barrier.top], ['moon', 0]);
    assert.equal(g.barrier.bottom - g.barrier.top, BARRIER_H);
    assert.ok(g.barrier.y > g.barrier.top && g.barrier.y < g.barrier.bottom, `${w}: its sign inside it`);
    // from the foot up: Earth's gate, its levels, the barrier, meeting with no gap
    const strips = [g.gates[0], ...g.bands, g.barrier];
    for (let i = 1; i < strips.length; i++) assert.equal(strips[i].bottom, strips[i - 1].top, `${w}: strip ${i} meets the one under it`);
    // the levels shown sit as far up from the foot as on the whole road (the road only grows above)
    for (let i = 0; i < g.nodes.length; i++) assert.equal(g.H - g.nodes[i].y, full.H - full.nodes[i].y, `${w}: scene ${i + 1} the same from the foot`);
    assert.equal(full.barrier, null, `${w}: every world open: no barrier`);
  }
  // how many worlds are open: in order, at least the first; one shown shut while its barrier is about to open
  assert.equal(openWorlds(() => false), 1);
  assert.equal(openWorlds(lv => lv <= 5), 1);
  assert.equal(openWorlds(lv => lv <= firstMoon), 2);
  assert.equal(openWorlds(lv => lv <= firstMoon, 'moon'), 1);
  assert.equal(openWorlds(lv => lv === firstMoon), 1, 'worlds open in order (Earth first)');
});

test('road: the road joins scenes within a world and breaks between worlds', () => {
  const g = roadGeom(360);
  let breaks = 0;
  for (let i = 1; i < g.nodes.length; i++) if (!roadJoins(g.nodes[i - 1], g.nodes[i])) { breaks++; assert.deepEqual([g.nodes[i - 1].lv, g.nodes[i].lv], [5, 6], 'the break: Earth to the Moon'); }
  assert.equal(breaks, WORLDS.length - 1);
});
