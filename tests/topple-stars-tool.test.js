// Topple!'s star check (tools/topple-stars.js, journal Q132): the search
// player of each world, the jobs, the report, and the command end to end.
// Hermetic: the command's file goes in a temp folder, removed after.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld } from '../src/core/topple-world.js';
import { moonScene, newLander } from '../src/core/topple-moon.js';
import { launchVel } from '../src/core/topple.js';
import { spread, parkPlay, parkThrows, parkTry, moonPlay, moonTry, moonDrops, jobsFor, report, args, playJob, PARK, MOON, STAR_BALLS } from '../tools/topple-stars.js';

const TOOL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools', 'topple-stars.js');

test('topple stars tool: spread picks evenly over a list; a short one whole', () => {
  assert.deepEqual(spread([1, 2, 3], 5), [1, 2, 3]);
  assert.deepEqual(spread([...Array(10).keys()], 2), [2, 7]);
  assert.equal(spread([...Array(379).keys()], 30).length, 30);
  assert.equal(new Set(spread([...Array(379).keys()], 30)).size, 30);
});

test('topple stars tool: the park player clears an easy scene in 3 or fewer, the same each time; judged a little off too', () => {
  const s = createWorld().makeScene(1000, 3, 5);
  const a = parkPlay(s, { tries: 12 }), b = parkPlay(createWorld().makeScene(1000, 3, 5), { tries: 12 });
  assert.ok(a.par != null && a.par <= STAR_BALLS, `par ${a.par} [${a.downAt}]`);
  assert.deepEqual(a, b, 'the same each run');
  assert.equal(a.downAt.at(-1), a.total);
  assert.equal(a.balls.length, a.par);
  const m = parkPlay(createWorld().makeScene(1000, 3, 5), { tries: 12, miss: true });
  assert.ok(m.par != null && m.par <= STAR_BALLS, `a little off: par ${m.par} [${m.downAt}]`);
});

test('topple stars tool: a post left behind fallen blocks, no throw touching it first, still gets throws tried (Tower Wall)', () => {
  // level 2 scene 5, seed 1002: the player judged a little off left one steel post at the back after
  // these two throws, and with no throw whose path first touched it, threw one fallback ball 3 times
  const s = createWorld().makeScene(1002, 2, 5), power = s.layout.power;
  const a = parkTry(s.parts, null, launchVel(power, -0.184, 24).vec), b = parkTry(s.parts, a.poses, launchVel(power, -0.062, 9).vec);
  assert.equal(b.down, s.parts.blocks.length - 1, 'one block left');
  const w = createWorld();
  w.setScene(s.parts, b.poses);
  const c = parkThrows(w, power);
  assert.ok(c.length > 30, `${c.length} throws`);
  assert.ok(spread(c, 30).some(t => parkTry(s.parts, b.poses, t.vec).down === s.parts.blocks.length), 'no throw tried clears it');
});

test('topple stars tool: with too few balls a scene is not cleared (par null), its balls counted', () => {
  // Mining Site's challenge: four structures (journal Q130)
  const r = moonPlay(1000, 9, 5, 'normal', { tries: 8, maxBalls: 1 });
  assert.equal(r.par, null);
  assert.equal(r.balls.length, 1);
  assert.ok(r.downAt[0] > 0 && r.downAt[0] < r.total, `${r.downAt[0]}/${r.total}`);
  assert.equal(r.structures.length, 4);
});

test('topple stars tool: a moon drop where the ring never goes is not made; one on a block knocks some', () => {
  const s = moonScene(1000, 6, 1), f = newLander(s.span, 1);
  const never = moonTry(s, null, f, s.span[1] + 5, -5);
  assert.equal(never.dropped, false);
  assert.equal(never.down, 0);
  const c = moonDrops(s, null);
  assert.ok(c.length >= s.blocks.length, `${c.length} drops for ${s.blocks.length} blocks`);
  const hit = c.map(d => moonTry(s, null, f, d.tx, d.tz)).reduce((a, r) => (r.down > a.down ? r : a));
  assert.equal(hit.dropped, true);
  assert.ok(hit.down > 0, 'no drop knocked anything');
  assert.equal(f.x, newLander(s.span, 1).x, 'the lander given is left as it was');
});

test('topple stars tool: the jobs cover every level, scene, mode and deal asked for', () => {
  assert.deepEqual(PARK, [1, 2, 3, 4, 5]);
  assert.deepEqual(MOON, [6, 7, 8, 9, 10]);
  assert.equal(jobsFor({ deals: 2 }).length, 5 * 5 * 2 * 2 + 5 * 5 * 3 * 2);
  const j = jobsFor({ world: 'moon', levels: [7], scenes: [5], modes: ['hardest'], deals: 3, seed: 50 });
  assert.deepEqual(j.map(x => [x.world, x.level, x.scene, x.mode, x.seed]), [50, 51, 52].map(sd => ['moon', 7, 5, 'hardest', sd]));
  assert.equal(jobsFor({ world: 'park', levels: [7] }).length, 0, 'a moon level is not in the park');
});

test('topple stars tool: the report lists each kind of scene not always won in 3, and says how many it checked', () => {
  const row = (par, structure = 'tower', scene = 5) => ({ world: 'moon', mode: 'normal', level: 9, scene, structure, par });
  const all = report([row(2), row(3), row(1, 'arch', 1)]);
  assert.equal(all.checked, 3);
  assert.equal(all.short.length, 0);
  assert.match(all.lines.join('\n'), /Checked 3 scenes \(2 kinds\); won in 3 balls: 3; not: 0\.\nEvery scene checked was won in 3\./);
  const some = report([row(2), row(4), row(null), row(1, 'arch', 1)]);
  assert.equal(some.short.length, 1);
  assert.deepEqual(some.short[0], { key: 'moon normal level 9 scene 5: tower', of: 3, won3: 1, pars: [2, 4, '-'] });
  assert.match(some.lines.join('\n'), /not: 2\.[\s\S]*moon normal level 9 scene 5: tower: 1\/3 \[2 4 -\]/);
  assert.doesNotMatch(some.lines.join('\n'), /arch/);
});

test('topple stars tool: options read; an unknown one stops it', () => {
  assert.deepEqual(args(['--world', 'park', '--levels', '1,3', '--modes', 'normal', '--deals', '4', '--miss']), { world: 'park', levels: [1, 3], modes: ['normal'], deals: 4, miss: true });
  assert.throws(() => args(['--fast']), /unknown option --fast/);
});

test('topple stars tool: a job says its structure, balls and stars', () => {
  const r = playJob({ world: 'park', level: 1, scene: 1, seed: 1000, mode: 'normal' }, { tries: 8 });
  assert.equal(typeof r.structure, 'string');
  assert.ok(r.par >= 1 && r.par <= 5, `par ${r.par}`);
  assert.equal(r.stars, r.par <= 3 ? 3 : r.par === 4 ? 2 : 1);
});

test('topple stars tool: the command plays its scenes (two at once), prints a line each and the report, and writes its file', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'topple-stars-'));
  try {
    const out = path.join(dir, 'r.json');
    const r = spawnSync(process.execPath, [TOOL, '--world', 'park', '--levels', '1', '--scenes', '1,2', '--deals', '1', '--modes', 'normal', '--tries', '6', '--jobs', '2', '--out', out], { encoding: 'utf8', timeout: 120000 });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /topple-stars: 2 scenes, 2 at once, 6 tries a ball/);
    assert.equal((r.stdout.match(/^park normal 1\.\d seed 1000 /gm) ?? []).length, 2, r.stdout);
    assert.match(r.stdout, /Checked 2 scenes/);
    const kept = JSON.parse(await readFile(out, 'utf8'));
    assert.equal(kept.rows.length, 2);
    assert.deepEqual(kept.rows.map(x => x.scene).sort(), [1, 2]);
    const bad = spawnSync(process.execPath, [TOOL, '--nope'], { encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /unknown option --nope/);
    assert.deepEqual(await readdir(dir), ['r.json'], 'nothing else left');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
