// Test players for Topple! (used by tests/topple-levels.test.js; the same
// player as tests/topple-world.test.js's, kept there for level 1): a
// player that throws as a person can (Q64), from behind, only at blocks it
// can see (frontSeen), each ball a random one of the throws whose path
// first touches a standing block it can see (seeded: the same each run).
// Not a test file itself (no .test.js).
import { createWorld } from '../src/core/topple-world.js';
import { HAND, MAX_AIM, MAX_UP, R2D, launchVel, newRound, useBall, update, canThrow, rng } from '../src/core/topple.js';

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
// Plays scene s ({ layout, parts }) with a fresh world; `weak` scales every
// throw (to show the test can fail). Returns { won, down, total, balls }.
export function personPlays(s, random, weak = 1) {
  const w = createWorld();
  w.setScene(s.parts);
  const r = newRound(w.blocks.length);
  let ended = null;
  const run = sec => { for (let t = 0; t < sec - 1e-9 && !ended; t += DT) { const { down } = w.step(DT); ended = update(r, DT, { down, still: w.still() }).ended; } };
  while (!ended && canThrow(r).why !== 'no-balls') {
    while (!ended && !canThrow(r).ok && canThrow(r).why === 'not-ready') run(DT);
    if (ended) break;
    const c = personThrows(w, s.layout.power);
    useBall(r);
    const vec = (c.length ? c[Math.floor(random() * c.length)] : launchVel(s.layout.power, 0, 30)).vec;
    w.throwBall(vec.map(v => v * weak));
    run(3);
  }
  run(20);
  return { won: !!ended?.won, down: r.down, total: r.total, balls: r.used };
}
// Up to `tries` players a scene, stopping at the first win.
export function canBeWon(s, seed, weak = 1, tries = 20) {
  const random = rng(seed);
  let best = 0, total = 0;
  for (let k = 1; k <= tries; k++) {
    const p = personPlays(s, random, weak);
    best = Math.max(best, p.down); total = p.total;
    if (p.won) return { won: true, players: k };
  }
  return { won: false, players: tries, best, total };
}
