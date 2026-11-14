// Test players for Topple! (used by tests/topple-levels.test.js; the same
// player as tests/topple-world.test.js's, kept there for level 1): a
// player that throws as a person can (Q64), from behind, only at blocks it
// can see (frontSeen), each ball a random one of the throws whose path
// first touches a standing block it can see (seeded: the same each run).
// Not a test file itself (no .test.js).
import { createWorld } from '../src/core/topple-world.js';
import { HAND, MAX_AIM, MAX_UP, R2D, STEP, launchVel, newRound, useBall, update, canThrow, rng } from '../src/core/topple.js';
import { moverAt } from '../src/core/topple-movers.js';

const DT = 1 / 60;

export function personThrows(w, power) {
  const seen = w.frontSeen(), standing = w.blocks.filter(b => !b.down);
  if (!standing.length) return [];
  const visible = new Set(w.blocks.filter((b, i) => !b.down && seen[i] > 0).map(b => b.body));
  const obs = w.obstacles(), out = [];
  const az = standing.map(b => Math.atan2(b.body.position.x - HAND.x, HAND.z - b.body.position.z) * R2D / MAX_AIM);
  const a0 = Math.max(-1, Math.min(...az) - 0.2), a1 = Math.min(1, Math.max(...az) + 0.2);
  for (let up = 0; up <= MAX_UP; up += 3) for (let a = a0; a <= a1 + 1e-9; a += 0.04) {
    const vel = launchVel(power, a, up), h = w.trace(vel.vec, 0, obs).hits[0];
    if (h?.kind === 'block' && visible.has(h.body)) out.push(vel);
  }
  return out;
}
// Whether a throw's path (pts, one a physics step, from the hand) meets
// the mover's loads, the throw made at the mover's time t0 (s): each point
// against each load's box where it is then (its lean left out: SPARE m
// round it).
const SPARE = 0.12;
export function meetsMover(m, pts, t0) {
  return pts.some((q, i) => moverAt(m, t0 + i * STEP).some(l => Math.abs(q[0] - l.p[0]) < m.load.w / 2 + SPARE && Math.abs(q[1] - l.p[1]) < m.load.h / 2 + SPARE && Math.abs(q[2] - l.p[2]) < m.load.d / 2 + SPARE));
}
// Plays scene s ({ layout, parts, mover? }) with a fresh world; `weak`
// scales every throw (to show the test can fail). With a mover (Hardest,
// Q106), it moves; `timed` (the default): the player waits (up to 15 s) for
// a moment the throw won't meet it, as a person watching it would; not
// timed: throws at a random moment, whatever it's doing. Returns { won, down, total,
// balls, stopped (balls the mover stopped), waitS (the longest wait) }.
export function personPlays(s, random, weak = 1, { timed = true } = {}) {
  const w = createWorld();
  w.setScene(s.parts);
  const m = s.mover ?? null;
  if (m) w.setMovers(m);
  const r = newRound(w.blocks.length);
  let ended = null, stopped = 0, waitS = 0;
  const run = sec => { for (let t = 0; t < sec - 1e-9 && !ended; t += DT) { const { down } = w.step(DT); ended = update(r, DT, { down, still: w.still() }).ended; } };
  while (!ended && canThrow(r).why !== 'no-balls') {
    while (!ended && !canThrow(r).ok && canThrow(r).why === 'not-ready') run(DT);
    if (ended) break;
    const c = personThrows(w, s.layout.power);
    const vec = (c.length ? c[Math.floor(random() * c.length)] : launchVel(s.layout.power, 0, 30)).vec.map(v => v * weak);
    if (m && timed) {
      const pts = w.trace(vec, 0).pts;
      let waited = 0;
      while (waited < 15 && meetsMover(m, pts, w.moverT)) { run(DT); waited += DT; }
      waitS = Math.max(waitS, waited);
      if (ended) break;
    } else if (m) {
      // a random moment, 0-4 s on (thrown as soon as it can, every player met the plan at the same moments)
      run(4 * random());
      if (ended) break;
    }
    useBall(r);
    const ball = w.throwBall(vec);
    run(3);
    if (ball.stopped) stopped++;
  }
  run(20);
  return { won: !!ended?.won, down: r.down, total: r.total, balls: r.used, stopped, waitS: +waitS.toFixed(2) };
}
// Up to `tries` players a scene, stopping at the first win.
export function canBeWon(s, seed, weak = 1, tries = 20, how = {}) {
  const random = rng(seed);
  let best = 0, total = 0, stopped = 0, waitS = 0;
  for (let k = 1; k <= tries; k++) {
    const p = personPlays(s, random, weak, how);
    best = Math.max(best, p.down); total = p.total; stopped += p.stopped; waitS = Math.max(waitS, p.waitS);
    if (p.won) return { won: true, players: k, stopped, waitS };
  }
  return { won: false, players: tries, best, total, stopped, waitS };
}
