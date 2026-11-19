// Topple!'s blast ball (DESIGN.md "Topple!", The blast ball; journal Q130):
// the rules, no DOM, so the tests, the star tool and the page use the same
// sums.
//
// A 💥 shows in the scenes that can't be won in 3 balls without it (Q132's
// list, BLAST_SCENES, written by tools/topple-stars.js), once 2 of your own
// balls are thrown and the scene is still, over the part with the most blocks
// still standing. Knock a block under it (or touch it with a ball) before it
// goes and your next ball is a blast ball: free (the stars count only your
// own balls), and where it goes off it kicks the blocks within its reach
// outward and up and sets them tumbling; if it catches any block still
// standing, it reaches all of them. The 💥 goes: on the moon after 3 passes
// of the lander (a pass: the ring's sweep one way across), in the park after
// 10 s; a ball already on its way when it goes still counts.

import { fallTime } from './topple-moon.js';
import { BLAST_SCENES } from './topple-blast-scenes.js';

export { BLAST_SCENES };

// The blast: reach r (m), kick (m/s at the middle, less by `fall` of it at the edge),
// up (share of the kick), spin (rad/s); column: r is measured across the ground only,
// for blocks up to this far above or below (m); fuse: goes off this near a standing
// block's surface (m; none: only where it first touches). Sized where it goes off
// (reachAt): r is its least reach; a blast that catches a block standing within r
// reaches every block standing (the farthest + `spare` m), up to `rMax`.
// Measured with the star tool's good player (journal "Q130 mockup v2"): the moon r 1.8
// kick 4 took 1 or more whole structures in 94% of blasts, 2 or more in 20% (the target:
// "1 in about 9 of 10, 2 in about 1 of 5"); the park r 0.6 kick 4, the smallest that won
// every listed deal in 3 own balls. The park's fuse (v2.2, developer: a blast ball thrown
// between two stacks went off on the ground behind them) and the reach set by what's left
// (v2.3, developer: "the power has to be dynamic and dependent on when it appears in the
// game play and what is left to hit"); tried by the developer: "About right" in 4 of 4.
export const BLAST = {
  moon: { r: 1.8, kick: 4.0, up: 0.45, spin: 6, fall: 0.6, column: 3.0, spare: 0.3, rMax: 6.0 },
  park: { r: 0.6, kick: 4.0, up: 0.5, spin: 8, fall: 0.6, column: 1.6, fuse: 0.15, spare: 0.15, rMax: 4.0 },
};

export const POWER = {
  after: 2,          // the 💥 shows once this many of your own balls are thrown (v2.2-v2.3, developer: "timing is good")
  settleS: 1.5,      // ... the last at least this long ago (s), and the scene still,
  stillMaxS: 5,      // ... or this long after it, still or not (as the glow, Q105: a moon ball rolling slowly kept a
                     //     scene from being still 11 s after the drop, checking 11.4 in the browser)
  catchR: 0.5,       // a ball this near the 💥's middle (m, plus its radius) wins it
  under: 0.45,       // the park: a block whose middle is this near the 💥 across the ground (m) is under it
  above: 0.45,       // it floats this far over the top of what's under it (m)
  passes: 3,         // the moon: gone after this many passes of the lander (developer, 2026-11-18)
  parkS: 10,         // the park: gone after this long (s) (developer, 2026-11-18)
  warnS: 3,          // the park: blinks for its last this many s (the moon: its last pass)
  parkFlyS: 2.5,     // the park: a ball thrown this recently is still on its way
  moonFlyS: 1,       // the moon: a ball dropped within its fall + this is still on its way
};

const standing = r => !r.broken && !r.down;

// The blast's reach going off at c = [x, y, z] in W (either world's: { blocks: [{ body,
// down?, broken? }] }), measured across the ground (x, z) to the middles of the blocks
// still standing (within cfg.column up or down).
// Returns { r, caught (a block within the least reach), far (m to the farthest), n (standing) }.
export function reachAt(W, c, cfg) {
  let near = Infinity, far = 0, n = 0;
  for (const b of W.blocks) {
    if (!standing(b)) continue;
    const p = b.body.position;
    if (cfg.column && Math.abs(p.y - c[1]) > cfg.column) continue;
    const d = Math.hypot(p.x - c[0], p.z - c[2]);
    near = Math.min(near, d); far = Math.max(far, d); n++;
  }
  const caught = n > 0 && near <= cfg.r;
  const r = caught && cfg.spare != null ? Math.min(cfg.rMax ?? Infinity, Math.max(cfg.r, far + cfg.spare)) : cfg.r;
  return { r, caught, far, n };
}

// Kick the blocks of W from c = [x, y, z] with `cfg` (BLAST.moon / .park), its reach
// sized there (reachAt). Returns { reached (every block kicked, down already or not),
// knocked (those of them still standing: the journal's record fix, v2.3's card counted
// the first against the second), r, caught, standing (how many stood) }.
export function blastAt(W, c, cfg0, random = Math.random) {
  const ra = reachAt(W, c, cfg0), cfg = { ...cfg0, r: ra.r };
  let reached = 0, knocked = 0;
  for (const rec of W.blocks) {
    if (rec.broken) continue;
    const p = rec.body.position;
    const dx = p.x - c[0], dy = p.y - c[1], dz = p.z - c[2];
    const d = cfg.column ? Math.hypot(dx, dz) : Math.hypot(dx, dy, dz);
    if (d > cfg.r || (cfg.column && Math.abs(dy) > cfg.column)) continue;
    const f = cfg.kick * (1 - cfg.fall * d / cfg.r);
    const h = Math.hypot(dx, dz);
    let ux = dx / h, uz = dz / h;
    if (!(h > 0.1)) { const a = random() * Math.PI * 2; ux = Math.cos(a); uz = Math.sin(a); }
    rec.body.wakeUp();
    rec.body.velocity.x += f * ux;
    rec.body.velocity.z += f * uz;
    rec.body.velocity.y += f * cfg.up;
    rec.body.angularVelocity.x += (random() - 0.5) * cfg.spin;
    rec.body.angularVelocity.z += (random() - 0.5) * cfg.spin;
    reached++;
    if (!rec.down) knocked++;
  }
  return { reached, knocked, r: ra.r, caught: ra.caught, standing: ra.n };
}

// How far the point p (a cannon Vec3) is from block rec's surface (m; 0 inside).
// Boxes by their half sizes (rec.he), barrels (cylinders) by their radius.
export function gapTo(rec, p) {
  const l = rec.body.pointToLocalFrame(p.clone());
  const sh = rec.body.shapes[0];
  if (sh?.radiusTop) {
    const across = Math.max(0, Math.hypot(l.x, l.z) - sh.radiusTop), up = Math.max(0, Math.abs(l.y) - sh.height / 2);
    return Math.hypot(across, up);
  }
  const h = rec.he;
  return Math.hypot(Math.max(0, Math.abs(l.x) - h.x), Math.max(0, Math.abs(l.y) - h.y), Math.max(0, Math.abs(l.z) - h.z));
}

// Arm a ball (its cannon body) as a blast ball in W (either world, W.world its cannon
// world): onBlast([x, y, z]) is called once, where it first touches anything, or
// (cfg.fuse) as its surface passes within cfg.fuse of a standing block's.
// Returns { off(), done }. (It doesn't take its listeners away as it fires: cannon-es
// sends an event by index over its listeners, so one taken away mid-send skips the next
// and calls past the end. The owner calls off() later: the page as the next scene starts.)
export function armBlast(W, body, cfg, onBlast) {
  const cworld = W.world;
  let done = false;
  const fire = () => { if (done) return; done = true; const p = body.position; onBlast([p.x, p.y, p.z]); };
  const touch = e => { if (!done && (e.bodyA === body || e.bodyB === body)) fire(); };
  const near = () => {
    if (done) return;
    const rad = body.shapes[0]?.radius ?? 0;
    if (W.blocks.some(r => standing(r) && gapTo(r, body.position) - rad <= cfg.fuse)) fire();
  };
  const off = () => { cworld.removeEventListener('beginContact', touch); cworld.removeEventListener('postStep', near); };
  cworld.addEventListener('beginContact', touch);
  if (cfg.fuse) cworld.addEventListener('postStep', near);
  return { off() { done = true; off(); }, get done() { return done; } };
}

// Whether the scene offers it: `stack` the park's layout.stack, the moon's structures
// joined with + (BLAST_SCENES: by structure, not by deal; modes: the difficulties).
export const offersBlast = (level, stack, mode) => BLAST_SCENES.some(s => s.level === level && s.stack === stack && s.modes.includes(mode));

// The park's blocks in groups across (x): blocks within `gap` m of each other in a
// group; each group's middle, top and blocks (indexes into `blocks`: [{ x, y, z, w, h }]).
export function parkGroups(blocks, gap = 0.5) {
  const order = blocks.map((b, i) => ({ b, i })).sort((u, v) => u.b.x - v.b.x);
  const groups = [];
  for (const o of order) {
    const g = groups.at(-1), half = o.b.w / 2;
    if (g && o.b.x - half - g.x1 < gap) { g.items.push(o); g.x1 = Math.max(g.x1, o.b.x + half); } else groups.push({ items: [o], x1: o.b.x + half });
  }
  return groups.map(g => {
    const bs = g.items.map(o => o.b);
    return { x: bs.reduce((s, b) => s + b.x, 0) / bs.length, z: bs.reduce((s, b) => s + b.z, 0) / bs.length, top: Math.max(...bs.map(b => b.y + b.h / 2)), blocks: g.items.map(o => o.i) };
  });
}

// Where the 💥 floats as it shows, over what's left (developer, on v2.1: "it could show up
// part way through game play"): { at: [x, y, z], under: [block indexes] }, or null with
// nothing standing.
// The moon: over the structure with the most blocks standing, its standing blocks under it.
// `structures`: the scene's, each { blocks: [...] } in the order of W.blocks.
export function moonPowerSpot(W, structures) {
  let k = 0;
  const parts = structures.map(s => s.blocks.map(() => k++).filter(i => W.blocks[i] && standing(W.blocks[i]))).filter(p => p.length);
  if (!parts.length) return null;
  const g = parts.reduce((a, b) => (b.length > a.length ? b : a));
  const ps = g.map(i => W.blocks[i].body.position);
  const top = Math.max(...g.map(i => { const r = W.blocks[i]; return r.body.position.y + Math.max(r.he.x, r.he.y, r.he.z); }));
  return { at: [ps.reduce((t, q) => t + q.x, 0) / ps.length, top + POWER.above, ps.reduce((t, q) => t + q.z, 0) / ps.length], under: g };
}
// The park: over the group across with the most blocks standing, the blocks within
// POWER.under of its middle under it (the nearest, if none is).
export function parkPowerSpot(W) {
  const idx = W.blocks.map((r, i) => i).filter(i => standing(W.blocks[i]));
  if (!idx.length) return null;
  const bs = idx.map(i => {
    const r = W.blocks[i], q = r.body.position, rad = r.body.shapes[0]?.radiusTop;
    return { x: q.x, y: q.y, z: q.z, w: rad ? 2 * rad : 2 * r.he.x, h: rad ? r.body.shapes[0].height : 2 * Math.max(r.he.x, r.he.y, r.he.z) };
  });
  const g = parkGroups(bs).reduce((a, b) => (b.blocks.length > a.blocks.length ? b : a));
  const across = k => Math.hypot(bs[k].x - g.x, bs[k].z - g.z);
  let under = g.blocks.filter(k => across(k) < POWER.under);
  if (!under.length) under = [g.blocks.reduce((a, k) => (across(k) < across(a) ? k : a), g.blocks[0])];
  return { at: [g.x, Math.max(...under.map(k => bs[k].y + bs[k].h / 2)) + POWER.above, g.z], under: under.map(k => idx[k]) };
}

/* ---------- the 💥 in a round (kept in round.power, so a reload keeps it) ---------- */

// A scene that offers it: { shown, won, gone, t (s, the park), passes (the moon), at, under }.
export const newPower = () => ({ shown: false, won: false, gone: false, t: 0, passes: 0, at: null, under: [] });

// The 💥's clock: { left (s or passes), gone, warn (blinking) }.
export function powerClock(world, { passes = 0, t = 0 } = {}) {
  if (world === 'moon') { const left = POWER.passes - passes; return { left, gone: left <= 0, warn: left > 0 && left <= 1 }; }
  const left = POWER.parkS - t;
  return { left, gone: left <= 0, warn: left > 0 && left <= POWER.warnS };
}
// Its share of the clock left, 0-1 (the ring round it).
export const powerFrac = (world, p) => Math.max(0, powerClock(world, p).left / (world === 'moon' ? POWER.passes : POWER.parkS));

// Whether it's time to show it: offered, not shown yet, POWER.after own balls thrown,
// the last a while ago and the scene still (or a good while ago), not over.
export const powerDue = (r, still) => !!r.power && !r.power.shown && !r.power.won && !r.power.gone && !r.result
  && r.used >= POWER.after && (r.since == null || (r.since > POWER.settleS && (still || r.since >= POWER.stillMaxS)));

// Whether a ball thrown `since` s ago is still on its way (it still counts as the clock runs out).
export const stillFlying = (world, since) => since != null && since < (world === 'moon' ? fallTime() + POWER.moonFlyS : POWER.parkFlyS);

// A frame on while it's up: the park's clock by dt, the moon's by the ring's move
// (m) over a pass's length (so ⇄ costs nothing); won when `touched` or `knocked`; gone once
// its clock is out and no ball is on its way (`flying`). `r` the round: a win gives it
// a blast ball. Returns 'won', 'gone' or null.
export function powerStep(r, world, { dt = 0, moved = 0, passLen = 1, touched = false, knocked = false, flying = false } = {}) {
  const p = r.power;
  if (!p || !p.shown || p.won || p.gone || r.result) return null;
  if (world === 'moon') p.passes += Math.abs(moved) / passLen; else p.t += dt;
  if (touched || knocked) { p.won = true; r.blasts = (r.blasts ?? 0) + 1; return 'won'; }
  if (powerClock(world, p).gone && !flying) { p.gone = true; return 'gone'; }
  return null;
}
// The tally's words for the balls (developer, 2026-11-19: the blast ball shown as free):
// "3 balls + 💥 free" once a blast ball is won or used, else null.
export function freeWords(own, blasts) {
  if (!blasts) return null;
  return `${own} ${own === 1 ? 'ball' : 'balls'} + ${blasts === 1 ? '💥' : `${blasts} 💥`} free`;
}
