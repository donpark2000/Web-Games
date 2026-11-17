// A test player for the moon base (DESIGN.md "Topple!", The moon): it flies
// the lander as a person would with the pad (steers to a structure's
// distance, waits for the ring to reach the block it aims at, lets go), with
// the physics and the rules the game uses. `miss` (m): how far along the
// line its drops land from where it aims (a person's timing; even balls one
// way, odd the other). Returns { cleared, balls, down, total, drops }.

import { createMoonWorld } from '../src/core/topple-moon-world.js';
import { moonScene, newLander, flyStep, steerTo, dropPath, fallTime, moonMode, LANDER_Y, DROP_BELOW } from '../src/core/topple-moon.js';
import { BALLS, READY_AFTER } from '../src/core/topple.js';

const DT = 1 / 60;

export function playMoonScene(seed, level, scene, { mode = 'normal', miss = 0, maxS = 120 } = {}) {
  const s = moonScene(seed, level, scene);
  const W = createMoonWorld();
  W.setScene(s);
  const f = newLander(s.span, moonMode(mode).speed);
  let balls = 0, t = 0, since = 99, down = 0;
  const drops = [], tried = new Map();
  const run = sec => { for (let k = 0; k < sec / DT; k++) { flyStep(f, DT, s.span); ({ down } = W.step(DT)); t += DT; since += DT; } };
  while (balls < BALLS && down < s.blocks.length && t < maxS) {
    // the target: the standing block lowest in the structure with the most still standing (a post or the bottom crate)
    const standing = W.blocks.filter(r => !r.down);
    const byS = new Map();
    for (const r of standing) { const k = s.structures.findIndex(st => st.blocks.includes(s.blocks[r.i])); byS.set(k, [...(byS.get(k) ?? []), r]); }
    const [, group] = [...byS.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    // aim at the highest of the group (the ball lands on top and pushes it over), along the line at its middle
    const aim = group.reduce((a, b) => (b.body.position.y > a.body.position.y ? b : a));
    // a block aimed at before and still standing: next at its edge (a ball squarely on top of a lone
    // crate sits there), one side then the other; kept within where the ring goes
    const n = (tried.get(aim) ?? 0); tried.set(aim, n + 1);
    const edge = [0, 1, -1][n % 3] * aim.he.x * 0.9;
    const tx = Math.min(s.span[1] + 0.79, Math.max(s.span[0] - 0.79, aim.body.position.x + edge)), tz = steerTo(f, aim.body.position.z);
    // wait for the ball, the steering, and the ring to come to the aim (from either way)
    let waited = 0, go = false, was = null;
    const off = miss * (balls % 2 ? -1 : 1);
    while (!go && waited < 40) {
      run(DT); waited += DT;
      // where the ring is (the ground under the drop, as the game's ring before it meets a block)
      const rx = dropPath([f.x, LANDER_Y - DROP_BELOW, f.z], f.vx, []).x;
      // the ring crosses the aim (+ the miss) this step, the ball ready and the steering done
      if (was !== null && since >= READY_AFTER && Math.abs(f.z - tz) <= 0.04 && (was - (tx + off)) * (rx - (tx + off)) <= 0) go = true;
      was = rx;
    }
    if (!go) break;
    const boxes = W.boxes(), lands = dropPath([f.x, LANDER_Y - DROP_BELOW, f.z], f.vx, boxes, s.ledges);
    W.dropBall([f.x, LANDER_Y - DROP_BELOW, f.z], [f.vx, 0, 0]);
    balls++; since = 0;
    drops.push({ at: [tx, tz].map(v => Math.round(v * 100) / 100), hit: lands.hit, t: Math.round(t * 10) / 10 });
    // until still (or 8 s)
    let w = 0;
    do { run(0.25); w += 0.25; } while (w < 8 && (w < fallTime() + 0.5 || !W.still()));
  }
  run(1);
  return { cleared: down >= s.blocks.length, balls, down, total: s.blocks.length, drops, structures: s.structures.map(st => st.name) };
}
