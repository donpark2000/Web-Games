// Topple!'s star check (journal Q132): can every scene of both worlds be won
// with 3 stars, that is in 3 balls or fewer? A scene is dealt from a seed,
// so this plays many deals of every level and scene, on each difficulty
// whose scenes differ, with a player that plays like a good player, and
// lists the scenes it can't win in 3. The developer then plays only those.
//
// The player searches: for each ball it tries many throws (the park) or
// drops (the moon) on copies of the scene as it stands, and keeps the one
// that knocks down the most; it goes on until the scene is cleared or the 5
// balls are used. The balls it took are the scene's "par" (kept out of the
// game's sight: Q130). It aims perfectly, so a scene it can't win in 3 is
// one no player can be expected to; one it wins only with a pinpoint throw
// may still be hard for a child (`--miss` judges each throw by how it does
// a little off as well).
//
// What it leaves out (as a good player would): the park's Hardest movers
// (a good player waits for its way to clear; the tests show a timed throw is
// never stopped), and anything still moving when it throws again (it waits
// for the blocks to be still, or 8 s; a moon ball still rolling is taken
// away then).
//
//   node tools/topple-stars.js [options]
//     --world park|moon|both   (both)
//     --levels 1,2,...          (every level of the worlds)
//     --scenes 1,2,...          (1-5)
//     --modes normal,hardest    (the park: normal, hardest (Harder deals
//                               Normal's scenes); the moon: normal, harder,
//                               hardest (only the lander's speed differs))
//     --deals N                 how many deals (level seeds) of each (6)
//     --seed S                  the first deal's seed (1000); deal k: S + k
//     --tries K                 throws or drops tried a ball (30)
//     --miss                    judge a throw also a little off (slower)
//     --jobs N                  scenes played at once (the CPUs less one)
//     --out file.json           every scene's result, to a file
//     --verbose                 each ball's pick, as it goes
// Prints a line a scene as it's done, then the scenes not won in 3.

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createWorld } from '../src/core/topple-world.js';
import { createMoonWorld } from '../src/core/topple-moon-world.js';
import { HAND, MAX_AIM, MAX_UP, R2D, BALLS, LEVELS, SCENES, launchVel, starsForBalls } from '../src/core/topple.js';
import { moonScene, newLander, flyStep, steerTo, ringX, moonMode, fallTime, LANDER_Y, DROP_BELOW, TURN_PAST, Z_NEAR, Z_FAR } from '../src/core/topple-moon.js';

const DT = 1 / 60;
export const STAR_BALLS = 3;              // 3 stars: won in this many balls or fewer
export const SETTLE_MAX = 8;              // s: after a ball, until still or this long
export const PARK_MODES = ['normal', 'hardest'];
export const MOON_MODES = ['normal', 'harder', 'hardest'];
export const PARK = LEVELS.filter(l => !l.world).map(l => l.n);
export const MOON = LEVELS.filter(l => l.world === 'moon').map(l => l.n);
// --miss: the throw's aim and lift off by this much each way (a share of
// MAX_AIM, °); the moon's drop this far along and across (m)
export const MISS = { aim: 0.03, up: 2, x: 0.15, z: 0.2 };

// Up to k of the list, evenly spread over it (all of it when it's short).
export function spread(list, k) {
  if (list.length <= k) return list.slice();
  return Array.from({ length: k }, (_, i) => list[Math.floor((i + 0.5) * list.length / k)]);
}

/* ---------- the park ---------- */

// The throws a person can make at strength `power` whose path first touches a
// standing block (one they can see when there is any: frontSeen), on a grid
// of aim (a share of MAX_AIM) and lift (°): [{ aim, up, vec }]. When none
// does, every throw of the grid towards the standing blocks.
export function parkThrows(w, power) {
  const standing = w.blocks.filter(b => !b.down && !b.broken);
  if (!standing.length) return [];
  const seen = w.frontSeen();
  const visible = new Set(w.blocks.filter((b, i) => !b.down && !b.broken && seen[i] > 0).map(b => b.body));
  const any = new Set(standing.map(b => b.body));
  const obs = w.obstacles(), seenOut = [], anyOut = [], allOut = [];
  const az = standing.map(b => Math.atan2(b.body.position.x - HAND.x, HAND.z - b.body.position.z) * R2D / MAX_AIM);
  const a0 = Math.max(-1, Math.min(...az) - 0.2), a1 = Math.min(1, Math.max(...az) + 0.2);
  for (let up = 0; up <= MAX_UP; up += 3) for (let a = a0; a <= a1 + 1e-9; a += 0.04) {
    const aim = +a.toFixed(3), vec = launchVel(power, aim, up).vec, h = w.trace(vec, 0, obs).hits[0];
    allOut.push({ aim, up, vec });
    if (h?.kind !== 'block') continue;
    if (visible.has(h.body)) seenOut.push({ aim, up, vec });
    else if (any.has(h.body)) anyOut.push({ aim, up, vec });
  }
  // none touches a standing block first (a post left behind fallen blocks, Tower Wall:
  // journal Q132): every throw towards them, as a person would try over or through
  return seenOut.length ? seenOut : anyOut.length ? anyOut : allOut;
}
// A world with the scene's parts, its blocks at `poses` (null: as set up).
function parkWorld(parts, poses) {
  const w = createWorld();
  w.setScene(parts, poses);
  return w;
}
// One throw on a copy of the scene: { down, poses } once the blocks are still.
export function parkTry(parts, poses, vec) {
  const w = parkWorld(parts, poses);
  w.throwBall(vec);
  for (let t = 0; t < SETTLE_MAX; t += DT) { w.step(DT); if (t > 1.5 && w.still()) break; }
  return { down: w.downCount(), poses: w.poses() };
}
// A throw's score: the blocks down after it; with `miss`, the least of it and
// it a little off each way (a good throw that still works when not quite right).
function parkScore(parts, poses, power, c, miss) {
  const r = parkTry(parts, poses, c.vec);
  if (!miss) return { ...r, score: r.down };
  let least = r.down;
  for (const [da, du] of [[MISS.aim, 0], [-MISS.aim, 0], [0, MISS.up], [0, -MISS.up]]) least = Math.min(least, parkTry(parts, poses, launchVel(power, c.aim + da, Math.max(0, c.up + du)).vec).down);
  return { ...r, score: least + r.down / 100 };
}
// Plays a park scene ({ parts, layout }) as well as it can: { par (balls to
// clear it, null: not in 5), balls: [{ aim, up, down }], total, downAt (down
// after each ball) }.
export function parkPlay(s, { tries = 30, miss = false, maxBalls = BALLS, log = null } = {}) {
  const parts = s.parts, power = s.layout.power, total = parts.blocks.length;
  let poses = null, down = 0;
  const balls = [];
  while (balls.length < maxBalls && down < total) {
    const cands = parkThrows(parkWorld(parts, poses), power);
    if (!cands.length) cands.push({ aim: 0, up: 30, vec: launchVel(power, 0, 30).vec });
    let best = null;
    const tryOne = c => { const r = parkScore(parts, poses, power, c, miss); if (!best || r.score > best.score) best = { ...r, c }; };
    for (const c of spread(cands, tries)) tryOne(c);
    // round the best: a little either way
    const b0 = best.c;
    for (const [da, du] of [[0.02, 0], [-0.02, 0], [0, 1.5], [0, -1.5]]) {
      const aim = +(b0.aim + da).toFixed(3), up = Math.max(0, b0.up + du);
      tryOne({ aim, up, vec: launchVel(power, aim, up).vec });
    }
    poses = best.poses; down = best.down;
    balls.push({ aim: best.c.aim, up: best.c.up, down });
    log?.(`  ball ${balls.length}: aim ${best.c.aim} up ${best.c.up}° -> ${down}/${total} down (${cands.length} throws, ${Math.min(tries, cands.length)} tried)`);
  }
  return { par: down >= total ? balls.length : null, balls, total, downAt: balls.map(b => b.down) };
}

/* ---------- the moon ---------- */

// One drop on a copy of the scene: steer to tz, wait for the ring to cross tx
// (the ball ready: it waited for the last one already), let go, until the
// blocks are still. `f`: the lander as it was (copied). { down, poses, f,
// dropped (false: the ring never got there in 40 s) }.
export function moonTry(scene, poses, f0, tx, tz) {
  const W = createMoonWorld();
  W.setScene(scene, poses);
  const f = { ...f0 };
  steerTo(f, tz);
  let was = null, go = false, down = 0;
  for (let t = 0; t < 40 && !go; t += DT) {
    flyStep(f, DT, scene.span);
    ({ down } = W.step(DT));
    const rx = ringX(f);
    if (was !== null && Math.abs(f.z - f.zT) <= 0.04 && (was - tx) * (rx - tx) <= 0) go = true;
    was = rx;
  }
  if (!go) return { down, poses: W.poses(), f, dropped: false };
  W.dropBall([f.x, LANDER_Y - DROP_BELOW, f.z], [f.vx, 0, 0]);
  for (let t = 0; t < SETTLE_MAX; t += DT) {
    flyStep(f, DT, scene.span);
    ({ down } = W.step(DT));
    if (t > fallTime() + 0.5 && W.still()) break;
  }
  return { down, poses: W.poses(), f, dropped: true };
}
// The drops to try: at each standing block, its middle and near either end
// along the line, at its distance, kept within where the ring goes.
export function moonDrops(scene, poses) {
  const W = createMoonWorld();
  W.setScene(scene, poses);
  const lo = scene.span[0] - TURN_PAST + 0.01, hi = scene.span[1] + TURN_PAST - 0.01, out = [], seen = new Set();
  for (const r of W.blocks) {
    if (r.down) continue;
    const p = r.body.position;
    for (const e of [0, 0.9, -0.9]) {
      const tx = Math.min(hi, Math.max(lo, p.x + e * r.he.x)), tz = Math.min(Z_NEAR, Math.max(Z_FAR, p.z));
      const key = `${tx.toFixed(2)} ${tz.toFixed(2)}`;
      if (!seen.has(key)) { seen.add(key); out.push({ tx, tz }); }
    }
  }
  return out;
}
function moonScore(scene, poses, f, c, miss) {
  const r = moonTry(scene, poses, f, c.tx, c.tz);
  if (!miss || !r.dropped) return { ...r, score: r.dropped ? r.down : -1 };
  let least = r.down;
  for (const [dx, dz] of [[MISS.x, 0], [-MISS.x, 0], [0, MISS.z], [0, -MISS.z]]) least = Math.min(least, moonTry(scene, poses, f, c.tx + dx, c.tz + dz).down);
  return { ...r, score: least + r.down / 100 };
}
// Plays moon scene (level, scene, seed) on `mode` as well as it can: as parkPlay.
export function moonPlay(seed, level, scene, mode = 'normal', { tries = 30, miss = false, maxBalls = BALLS, log = null } = {}) {
  const s = moonScene(seed, level, scene), total = s.blocks.length;
  let poses = null, down = 0, f = newLander(s.span, moonMode(mode).speed);
  const balls = [];
  while (balls.length < maxBalls && down < total) {
    const cands = moonDrops(s, poses);
    let best = null;
    const tryOne = c => { const r = moonScore(s, poses, f, c, miss); if (!best || r.score > best.score) best = { ...r, c }; };
    for (const c of spread(cands, tries)) tryOne(c);
    const b0 = best.c;
    for (const [dx, dz] of [[0.1, 0], [-0.1, 0], [0, 0.2], [0, -0.2]]) tryOne({ tx: b0.tx + dx, tz: b0.tz + dz });
    if (!best.dropped) break;
    poses = best.poses; down = best.down; f = best.f;
    balls.push({ tx: +best.c.tx.toFixed(2), tz: +best.c.tz.toFixed(2), down });
    log?.(`  ball ${balls.length}: at x ${best.c.tx.toFixed(2)} z ${best.c.tz.toFixed(2)} -> ${down}/${total} down (${cands.length} drops)`);
  }
  return { par: down >= total ? balls.length : null, balls, total, downAt: balls.map(b => b.down), structures: s.structures.map(x => x.name) };
}

/* ---------- the check ---------- */

// The scenes to play: [{ world, level, scene, seed, mode }].
export function jobsFor({ world = 'both', levels = null, scenes = null, modes = null, deals = 6, seed = 1000 } = {}) {
  const out = [];
  const ws = world === 'both' ? ['park', 'moon'] : [world];
  for (const wd of ws) {
    const lv = (wd === 'park' ? PARK : MOON).filter(n => !levels || levels.includes(n));
    const ms = (wd === 'park' ? PARK_MODES : MOON_MODES).filter(m => !modes || modes.includes(m));
    for (const mode of ms) for (const level of lv) for (const sc of scenes ?? [1, 2, 3, 4, 5]) for (let k = 0; k < deals; k++) out.push({ world: wd, level, scene: sc, seed: seed + k, mode });
  }
  return out;
}
// Plays one job: { ...job, structure, par, stars, total, downAt, ms }.
export function playJob(job, { tries = 30, miss = false, log = null } = {}) {
  const t0 = performance.now();
  let r, structure;
  if (job.world === 'park') {
    const w = createWorld(), s = w.makeScene(job.seed, job.level, job.scene, null, job.mode);
    structure = s.layout.stack;
    r = parkPlay(s, { tries, miss, log });
  } else {
    r = moonPlay(job.seed, job.level, job.scene, job.mode, { tries, miss, log });
    structure = r.structures.join('+');
  }
  return { ...job, structure, par: r.par, stars: r.par ? starsForBalls(r.par) : 0, total: r.total, downAt: r.downAt, ms: Math.round(performance.now() - t0) };
}
// The report: the scenes not won in STAR_BALLS, grouped by world, mode, level,
// scene and structure. Returns { checked, short: [{ key, of, won3, pars }],
// lines } (lines: the report's text).
export function report(rows) {
  const groups = new Map();
  for (const r of rows) {
    const key = `${r.world} ${r.mode} level ${r.level} scene ${r.scene}: ${r.structure}`;
    if (!groups.has(key)) groups.set(key, { key, of: 0, won3: 0, pars: [] });
    const g = groups.get(key);
    g.of++;
    if (r.par != null && r.par <= STAR_BALLS) g.won3++;
    g.pars.push(r.par ?? '-');
  }
  const short = [...groups.values()].filter(g => g.won3 < g.of);
  const won3 = rows.filter(r => r.par != null && r.par <= STAR_BALLS).length;
  const lines = [
    `Checked ${rows.length} scenes (${groups.size} kinds); won in ${STAR_BALLS} balls: ${won3}; not: ${rows.length - won3}.`,
    ...(short.length ? [`Not always won in ${STAR_BALLS} (won in ${STAR_BALLS} / deals; each deal's balls, - for not cleared in ${BALLS}):`, ...short.map(g => `  ${g.key}: ${g.won3}/${g.of} [${g.pars.join(' ')}]`)] : [`Every scene checked was won in ${STAR_BALLS}.`]),
  ];
  return { checked: rows.length, short, lines };
}

/* ---------- the command ---------- */

export function args(argv) {
  const o = {}, list = v => v.split(',').map(x => (/^\d+$/.test(x) ? Number(x) : x));
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = () => argv[++i];
    if (a === '--world') o.world = v();
    else if (a === '--levels') o.levels = list(v());
    else if (a === '--scenes') o.scenes = list(v());
    else if (a === '--modes') o.modes = list(v());
    else if (a === '--deals') o.deals = Number(v());
    else if (a === '--seed') o.seed = Number(v());
    else if (a === '--tries') o.tries = Number(v());
    else if (a === '--jobs') o.jobs = Number(v());
    else if (a === '--out') o.out = v();
    else if (a === '--miss') o.miss = true;
    else if (a === '--verbose') o.verbose = true;
    else throw new Error(`topple-stars: unknown option ${a}`);
  }
  return o;
}
const line = r => `${r.world} ${r.mode} ${r.level}.${r.scene} seed ${r.seed} ${r.structure}: ${r.par ? `${r.par} balls` : `not cleared (${r.downAt.at(-1) ?? 0}/${r.total})`} [${r.downAt.join(' ')}] ${(r.ms / 1000).toFixed(1)} s`;

async function main(argv) {
  const o = args(argv), jobs = jobsFor(o);
  const n = Math.max(1, Math.min(o.jobs ?? os.cpus().length - 1, jobs.length));
  const opts = { tries: o.tries ?? 30, miss: !!o.miss };
  console.log(`topple-stars: ${jobs.length} scenes, ${n} at once, ${opts.tries} tries a ball${opts.miss ? ', judged a little off too' : ''}`);
  const t0 = performance.now(), rows = [];
  if (n === 1 || o.verbose) {
    for (const j of jobs) { const r = playJob(j, { ...opts, log: o.verbose ? console.log : null }); rows.push(r); console.log(line(r)); }
  } else {
    let next = 0;
    await Promise.all(Array.from({ length: n }, () => new Promise((done, fail) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: opts });
      const give = () => { if (next < jobs.length) w.postMessage(jobs[next++]); else { w.terminate(); done(); } };
      w.on('message', r => { rows.push(r); console.log(`${line(r)}  (${rows.length}/${jobs.length})`); give(); });
      w.on('error', fail);
      give();
    })));
  }
  const rep = report(rows);
  console.log(`\n${rep.lines.join('\n')}\nTook ${((performance.now() - t0) / 60000).toFixed(1)} min.`);
  if (o.out) { await writeFile(o.out, JSON.stringify({ made: new Date().toISOString(), options: o, rows }, null, 1)); console.log(`Every scene's result: ${o.out}`); }
}

if (!isMainThread) parentPort.on('message', j => parentPort.postMessage(playJob(j, workerData)));
else if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
