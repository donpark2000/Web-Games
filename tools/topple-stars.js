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
//     --blast                   only the scenes that offer the blast ball
//                               (Q130), played with it: 2 own balls, the next
//                               going for the 💥, the free blast ball once it's
//                               won, then own balls; par counts own balls only
// Prints a line a scene as it's done, then the scenes not won in 3.
//
//   node tools/topple-stars.js --list-from run.json
// writes src/core/topple-blast-scenes.js, the scenes that offer the blast
// ball, from a full run judged a little off (--miss --out run.json).

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import path from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createWorld } from '../src/core/topple-world.js';
import { createMoonWorld } from '../src/core/topple-moon-world.js';
import { HAND, MAX_AIM, MAX_UP, R2D, BALLS, LEVELS, SCENES, launchVel, starsForBalls } from '../src/core/topple.js';
import { moonScene, newLander, flyStep, steerTo, ringX, moonMode, fallTime, LANDER_Y, DROP_BELOW, TURN_PAST, Z_NEAR, Z_FAR } from '../src/core/topple-moon.js';
import { BLAST, POWER, armBlast, blastAt, offersBlast, parkPowerSpot, moonPowerSpot } from '../src/core/topple-blast.js';
import { rng } from '../src/core/topple.js';

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
// One throw on a copy of the scene: { down, poses } once the blocks are still. `blast`:
// the ball a blast ball (its kicks' spin from a fixed seed, so a run repeats).
export function parkTry(parts, poses, vec, blast = false) {
  const w = parkWorld(parts, poses);
  const body = w.throwBall(vec);
  if (blast) armBlast(w, body, BLAST.park, at => blastAt(w, at, BLAST.park, rng(7)));
  for (let t = 0; t < SETTLE_MAX; t += DT) { w.step(DT); if (t > 1.5 && w.still()) break; }
  return { down: w.downCount(), poses: w.poses() };
}
// A throw's score: the blocks down after it; with `miss`, the least of it and
// it a little off each way (a good throw that still works when not quite right).
// `want`: the block indexes under the 💥: a throw that knocks one wins it, and is picked
// first (judged a little off too: it must win it every way); `blast`: a blast ball's throw.
const knocksOne = (want, q) => !!want && want.some(i => q.poses[i]?.down || q.poses[i]?.broken);
function parkScore(parts, poses, power, c, miss, { want = null, blast = false } = {}) {
  const r = parkTry(parts, poses, c.vec, blast);
  r.won = knocksOne(want, r);
  if (!miss) return { ...r, score: r.down + (r.won ? 1000 : 0) };
  let least = r.down, allWin = r.won;
  for (const [da, du] of [[MISS.aim, 0], [-MISS.aim, 0], [0, MISS.up], [0, -MISS.up]]) {
    const q = parkTry(parts, poses, launchVel(power, c.aim + da, Math.max(0, c.up + du)).vec, blast);
    least = Math.min(least, q.down); allWin &&= knocksOne(want, q);
  }
  return { ...r, score: least + r.down / 100 + (allWin ? 1000 : 0) };
}
// Plays a park scene ({ parts, layout }) as well as it can: { par (balls to
// clear it, null: not in 5), balls: [{ aim, up, down }], total, downAt (down
// after each ball) }.
// `blast` (Q130): the scene offers the blast ball: once POWER.after own balls are thrown
// the 💥 shows over what's left (parkPowerSpot), the next own ball goes for it, and once
// it's won the ball after is the free blast ball (the 💥's clock left out: a good player
// is in time). Balls: { ..., kind: 'own' | 'blast', won (the 💥, the ball going for it) };
// par: own balls only.
export function parkPlay(s, { tries = 30, miss = false, maxBalls = BALLS, log = null, blast = false } = {}) {
  const parts = s.parts, power = s.layout.power, total = parts.blocks.length;
  let poses = null, down = 0, own = 0, spot = null, blastNext = false;
  const balls = [];
  while ((own < maxBalls || blastNext) && down < total) {
    const w0 = parkWorld(parts, poses);
    if (blast && !spot && own === POWER.after) spot = parkPowerSpot(w0) ?? { under: [] };
    const isBlast = blastNext, want = spot && !spot.won && !isBlast ? spot.under : null;
    const cands = parkThrows(w0, power);
    if (!cands.length) cands.push({ aim: 0, up: 30, vec: launchVel(power, 0, 30).vec });
    let best = null;
    const tryOne = c => { const r = parkScore(parts, poses, power, c, miss, { want, blast: isBlast }); if (!best || r.score > best.score) best = { ...r, c }; };
    for (const c of spread(cands, tries)) tryOne(c);
    // round the best: a little either way
    const b0 = best.c;
    for (const [da, du] of [[0.02, 0], [-0.02, 0], [0, 1.5], [0, -1.5]]) {
      const aim = +(b0.aim + da).toFixed(3), up = Math.max(0, b0.up + du);
      tryOne({ aim, up, vec: launchVel(power, aim, up).vec });
    }
    poses = best.poses; down = best.down;
    if (!isBlast) own++;
    blastNext = !!want && best.won;
    if (blastNext) spot.won = true;
    balls.push({ aim: best.c.aim, up: best.c.up, down, kind: isBlast ? 'blast' : 'own', ...(want ? { won: best.won } : {}) });
    log?.(`  ball ${balls.length}${isBlast ? ' (blast)' : ''}: aim ${best.c.aim} up ${best.c.up}° -> ${down}/${total} down${want ? (best.won ? ', 💥 won' : ', 💥 not won') : ''} (${cands.length} throws, ${Math.min(tries, cands.length)} tried)`);
  }
  return { par: down >= total ? own : null, balls, total, downAt: balls.map(b => b.down), ...(blast ? { power: powerSaid(spot) } : {}) };
}
const powerSaid = spot => (!spot ? 'not shown' : spot.won ? 'won' : 'not won');

/* ---------- the moon ---------- */

// One drop on a copy of the scene: steer to tz, wait for the ring to cross tx
// (the ball ready: it waited for the last one already), let go, until the
// blocks are still. `f`: the lander as it was (copied). { down, poses, f,
// dropped (false: the ring never got there in 40 s) }.
export function moonTry(scene, poses, f0, tx, tz, blast = false) {
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
  const ball = W.dropBall([f.x, LANDER_Y - DROP_BELOW, f.z], [f.vx, 0, 0]);
  if (blast) armBlast(W, ball.body, BLAST.moon, at => blastAt(W, at, BLAST.moon, rng(7)));
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
// (`want`, `blast`: as parkScore)
function moonScore(scene, poses, f, c, miss, { want = null, blast = false } = {}) {
  const r = moonTry(scene, poses, f, c.tx, c.tz, blast);
  r.won = r.dropped && knocksOne(want, r);
  if (!miss || !r.dropped) return { ...r, score: r.dropped ? r.down + (r.won ? 1000 : 0) : -1 };
  let least = r.down, allWin = r.won;
  for (const [dx, dz] of [[MISS.x, 0], [-MISS.x, 0], [0, MISS.z], [0, -MISS.z]]) {
    const q = moonTry(scene, poses, f, c.tx + dx, c.tz + dz, blast);
    least = Math.min(least, q.down); allWin &&= q.dropped && knocksOne(want, q);
  }
  return { ...r, score: least + r.down / 100 + (allWin ? 1000 : 0) };
}
// Plays moon scene (level, scene, seed) on `mode` as well as it can: as parkPlay.
// (`blast`: as parkPlay, the 💥 over the structure with the most standing: moonPowerSpot)
export function moonPlay(seed, level, scene, mode = 'normal', { tries = 30, miss = false, maxBalls = BALLS, log = null, blast = false } = {}) {
  const s = moonScene(seed, level, scene), total = s.blocks.length;
  let poses = null, down = 0, f = newLander(s.span, moonMode(mode).speed), own = 0, spot = null, blastNext = false;
  const balls = [];
  while ((own < maxBalls || blastNext) && down < total) {
    if (blast && !spot && own === POWER.after) { const W = createMoonWorld(); W.setScene(s, poses); spot = moonPowerSpot(W, s.structures) ?? { under: [] }; }
    const isBlast = blastNext, want = spot && !spot.won && !isBlast ? spot.under : null;
    const cands = moonDrops(s, poses);
    let best = null;
    const tryOne = c => { const r = moonScore(s, poses, f, c, miss, { want, blast: isBlast }); if (!best || r.score > best.score) best = { ...r, c }; };
    for (const c of spread(cands, tries)) tryOne(c);
    const b0 = best.c;
    for (const [dx, dz] of [[0.1, 0], [-0.1, 0], [0, 0.2], [0, -0.2]]) tryOne({ tx: b0.tx + dx, tz: b0.tz + dz });
    if (!best.dropped) break;
    poses = best.poses; down = best.down; f = best.f;
    if (!isBlast) own++;
    blastNext = !!want && best.won;
    if (blastNext) spot.won = true;
    balls.push({ tx: +best.c.tx.toFixed(2), tz: +best.c.tz.toFixed(2), down, kind: isBlast ? 'blast' : 'own', ...(want ? { won: best.won } : {}) });
    log?.(`  ball ${balls.length}${isBlast ? ' (blast)' : ''}: at x ${best.c.tx.toFixed(2)} z ${best.c.tz.toFixed(2)} -> ${down}/${total} down${want ? (best.won ? ', 💥 won' : ', 💥 not won') : ''} (${cands.length} drops)`);
  }
  return { par: down >= total ? own : null, balls, total, downAt: balls.map(b => b.down), structures: s.structures.map(x => x.name), ...(blast ? { power: powerSaid(spot) } : {}) };
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
// (`blast`: a scene that doesn't offer it isn't played: { ...job, structure, skipped: true })
export function playJob(job, { tries = 30, miss = false, log = null, blast = false } = {}) {
  const t0 = performance.now();
  let r, structure;
  if (job.world === 'park') {
    const w = createWorld(), s = w.makeScene(job.seed, job.level, job.scene, null, job.mode);
    structure = s.layout.stack;
    if (blast && !offersBlast(job.level, structure, job.mode)) return { ...job, structure, skipped: true };
    r = parkPlay(s, { tries, miss, log, blast });
  } else {
    structure = moonScene(job.seed, job.level, job.scene).structures.map(x => x.name).join('+');
    if (blast && !offersBlast(job.level, structure, job.mode)) return { ...job, structure, skipped: true };
    r = moonPlay(job.seed, job.level, job.scene, job.mode, { tries, miss, log, blast });
  }
  return { ...job, structure, par: r.par, stars: r.par ? starsForBalls(r.par) : 0, total: r.total, downAt: r.downAt, ...(blast ? { power: r.power, kinds: r.balls.map(b => b.kind) } : {}), ms: Math.round(performance.now() - t0) };
}
// The report: the scenes not won in STAR_BALLS, grouped by world, mode, level,
// scene and structure (skipped rows left out). Returns { checked, short: [{ key,
// of, won3, pars }], lines } (lines: the report's text).
export function report(rows0) {
  const rows = rows0.filter(r => !r.skipped);
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
    `Checked ${rows.length} scenes (${groups.size} kinds${rows0.length > rows.length ? `; ${rows0.length - rows.length} skipped, no blast ball there` : ''}); won in ${STAR_BALLS} balls: ${won3}; not: ${rows.length - won3}.`,
    ...(short.length ? [`Not always won in ${STAR_BALLS} (won in ${STAR_BALLS} / deals; each deal's balls, - for not cleared in ${BALLS}):`, ...short.map(g => `  ${g.key}: ${g.won3}/${g.of} [${g.pars.join(' ')}]`)] : [`Every scene checked was won in ${STAR_BALLS}.`]),
  ];
  return { checked: rows.length, short, lines };
}

/* ---------- the blast ball's scenes (journal Q130) ---------- */

// The list is kept in BLAST_FILE, written by --list-from from a run's rows, with a
// fingerprint of BLAST_SOURCES (the files every scene is made from): a test fails when
// they've changed since, naming BLAST_REDO. (A change to the physics or the balls isn't
// caught by it: run it again after one of those too.)
export const BLAST_FILE = 'src/core/topple-blast-scenes.js';
export const BLAST_SOURCES = ['src/core/topple-levels.js', 'src/core/topple-moon.js'];
export const BLAST_REDO = 'node tools/topple-stars.js --miss --out run.json, then node tools/topple-stars.js --list-from run.json';
export async function blastFingerprint(root) {
  const h = createHash('sha256');
  for (const f of BLAST_SOURCES) h.update((await readFile(path.join(root, f), 'utf8')).replace(/\r\n/g, '\n'));
  return h.digest('hex').slice(0, 16);
}
// By structure, not by deal (Q130): each world, level and structure with a deal on a
// difficulty not won in STAR_BALLS offers it on that difficulty; the park's Harder deals
// Normal's scenes, so Normal's count there too. The moon's three deal the same scenes,
// only the lander faster, so one listed there is on all three (the 2026-11-19 run had
// Solar Farm's challenges on Normal and Hardest, not Harder: 6 deals' chance, not a
// faster lander being easier). Sorted: the park first, level, stack.
export function blastList(rows) {
  const m = new Map();
  for (const r of rows) {
    if (r.skipped || (r.par != null && r.par <= STAR_BALLS)) continue;
    const key = `${r.world} ${r.level} ${r.structure}`;
    if (!m.has(key)) m.set(key, { world: r.world, level: r.level, stack: r.structure, modes: new Set() });
    const modes = m.get(key).modes;
    if (r.world === 'moon') for (const x of MOON_MODES) modes.add(x);
    else { modes.add(r.mode); if (r.mode === 'normal') modes.add('harder'); }
  }
  const order = ['normal', 'harder', 'hardest'];
  return [...m.values()].map(e => ({ ...e, modes: order.filter(x => e.modes.has(x)) }))
    .sort((a, b) => (a.world === b.world ? 0 : a.world === 'park' ? -1 : 1) || a.level - b.level || (a.stack < b.stack ? -1 : a.stack > b.stack ? 1 : 0));
}
// Why a run can't make the list ([] when it can): it must be every scene of both
// worlds, judged a little off, without the blast ball.
export function listable(run) {
  const o = run?.options ?? {}, why = [];
  if (!o.miss) why.push('not judged a little off (--miss)');
  if (o.world && o.world !== 'both') why.push(`one world only (${o.world})`);
  for (const k of ['levels', 'scenes', 'modes']) if (o[k]) why.push(`--${k} given`);
  if (o.blast) why.push('played with the blast ball (--blast)');
  if (!Array.isArray(run?.rows) || !run.rows.length) why.push('no rows');
  return why;
}
// The file's text.
export function blastFileText(list, { fingerprint, run }) {
  const o = run.options ?? {}, q = s => `'${s}'`;
  return [
    "// Topple!'s scenes that offer the blast ball (DESIGN.md \"Topple!\", The blast ball;",
    "// journal Q130, Q132): the structures a good player can't always win in 3 balls,",
    '// judged a little off. WRITTEN BY tools/topple-stars.js --list-from, not by hand:',
    "// a test fails when the files the scenes are made from have changed since.",
    `export const BLAST_FROM = { made: ${q(run.made)}, scenes: ${run.rows.length}, deals: ${o.deals ?? 6}, seed: ${o.seed ?? 1000}, tries: ${o.tries ?? 30}, fingerprint: ${q(fingerprint)} };`,
    'export const BLAST_SCENES = [',
    ...list.map(e => `  { world: ${q(e.world)}, level: ${e.level}, stack: ${q(e.stack)}, modes: [${e.modes.map(q).join(', ')}] },`),
    '];',
    '',
  ].join('\n');
}
// --list-from: the list written from a run's file (into `root`, the repo by default).
export async function listFrom(file, root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const run = JSON.parse(await readFile(file, 'utf8')), why = listable(run);
  if (why.length) throw new Error(`topple-stars: ${file} can't make the list: ${why.join('; ')}`);
  const list = blastList(run.rows), fingerprint = await blastFingerprint(root);
  await writeFile(path.join(root, BLAST_FILE), blastFileText(list, { fingerprint, run }));
  return list;
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
    else if (a === '--blast') o.blast = true;
    else if (a === '--list-from') o.listFrom = v();
    else if (a === '--verbose') o.verbose = true;
    else throw new Error(`topple-stars: unknown option ${a}`);
  }
  return o;
}
const line = r => `${r.world} ${r.mode} ${r.level}.${r.scene} seed ${r.seed} ${r.structure}: ${r.par ? `${r.par} balls` : `not cleared (${r.downAt.at(-1) ?? 0}/${r.total})`} [${r.downAt.join(' ')}]${r.kinds ? ` ${r.kinds.map(k => (k === 'blast' ? 'B' : 'o')).join('')} (B: the blast ball), 💥 ${r.power}` : ''} ${(r.ms / 1000).toFixed(1)} s`;

async function main(argv) {
  const o = args(argv);
  if (o.listFrom) {
    const list = await listFrom(o.listFrom);
    console.log(`${BLAST_FILE}: ${list.length} structures offer the blast ball:`);
    for (const e of list) console.log(`  ${e.world} level ${e.level} ${e.stack}: ${e.modes.join(', ')}`);
    return;
  }
  const jobs = jobsFor(o);
  const n = Math.max(1, Math.min(o.jobs ?? os.cpus().length - 1, jobs.length));
  const opts = { tries: o.tries ?? 30, miss: !!o.miss, blast: !!o.blast };
  console.log(`topple-stars: ${jobs.length} scenes, ${n} at once, ${opts.tries} tries a ball${opts.miss ? ', judged a little off too' : ''}${opts.blast ? ', with the blast ball (only the scenes that offer it)' : ''}`);
  const t0 = performance.now(), rows = [];
  if (n === 1 || o.verbose) {
    for (const j of jobs) { const r = playJob(j, { ...opts, log: o.verbose ? console.log : null }); rows.push(r); if (!r.skipped) console.log(line(r)); }
  } else {
    let next = 0;
    await Promise.all(Array.from({ length: n }, () => new Promise((done, fail) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: opts });
      const give = () => { if (next < jobs.length) w.postMessage(jobs[next++]); else { w.terminate(); done(); } };
      w.on('message', r => { rows.push(r); if (!r.skipped) console.log(`${line(r)}  (${rows.length}/${jobs.length})`); give(); });
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
