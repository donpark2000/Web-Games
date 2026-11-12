// Topple!'s animals' walks (DESIGN.md "Topple!": the birds, the rat, the
// snow bunny, the rattlesnake; decor, out of play), with no drawing:
// src/ui/topple-sets.js draws each one and moves it along its crossing.
//
// Each crosses the view once a scene, a while after it starts, from off one
// side to off the other, and is gone till the next (developer, 2026-11-12:
// "If it just hopped across a scene once that should be plenty").
//
// Frightened (developer, 2026-11-12: "it would be cool if the animals 'acted
// frightened' when blocks fall and reverse direction and run off. Right now
// they are oblivious to it, which is unnatural"): a block falling while it
// is crossing startles it (it stops for STARTLE s, the drawing jumps), then
// it runs off, away from the block (turning back if it was heading that
// way), FLEE times as fast and without stopping, until out of sight.
import { rng } from './topple.js';

export const STARTLE = 0.3;   // s: the start, before running off
export const FLEE = 2.5;      // times its walking speed, running off

// Once across, a scene: wait 3-10 s, then from just out of sight on one
// side to just out of sight on the other (each way as likely), then done.
// It goes along y, z; margin: how far (m) past the view's edge it starts
// and ends (its length). reset(edges) for a new scene, edges(y, z) the
// view's sides there as [left x, right x] (the scene's camera; the view
// isn't centred on the middle: 9 m left was still in view), worked out
// as it sets off (the camera is placed after the scene is set). hold: s
// it stops, startled, before running off (the birds, in the air, don't).
export function crossing(seed, y, z, margin, hold = STARTLE) {
  let n = 0, r, x, x0, x1, dir, wait, done, edges = null, started = false, scared, startle;
  const reset = e => {
    edges = e ?? edges; r = rng(seed + 7919 * ++n); dir = r() < 0.5 ? 1 : -1; wait = 3 + 7 * r();
    done = false; started = false; scared = false; startle = 0;
  };
  reset();
  const on = () => wait <= 0 && !done;
  return {
    reset, rand: () => r(),
    get x() { return x; }, get dir() { return dir; },
    get on() { return on(); },
    get done() { return done; },
    // frightened (running off, or startled first)
    get scared() { return scared; },
    // 0-1 through the startle while startled, else 0
    get startled() { return startle > 0 ? 1 - startle / hold : 0; },
    // how fast, times its walking speed
    get pace() { return scared ? FLEE : 1; },
    // where it is (for the log and for checking in a browser)
    get state() { return { on: on(), done, x: x === undefined ? null : Math.round(x * 100) / 100, dir, scared, wait: Math.max(0, Math.round(wait * 100) / 100) }; },
    tick(dt) {
      if (wait > 0) wait -= dt;
      if (wait <= 0 && !started) {
        started = true;
        const [L, R] = edges ? edges(y, z) : [-12, 12];
        x0 = L - margin; x1 = R + margin; x = dir > 0 ? x0 : x1;
      }
      if (startle > 0) startle = Math.max(0, startle - dt);
    },
    // m along its way (the drawing's own steps, times pace); none while startled
    advance(m) {
      if (!on() || startle > 0) return;
      x += dir * m;
      if (dir > 0 ? x > x1 : x < x0) done = true;
    },
    // A block fell at fromX: startled, then off away from it. Only while in
    // view, and once a crossing. What happened (for the log), or null.
    fright(fromX) {
      if (!on() || scared) return null;
      const away = x === fromX ? dir : Math.sign(x - fromX), turned = away !== dir;
      scared = true; startle = hold; dir = away;
      return { x: Math.round(x * 100) / 100, from: Math.round(fromX * 100) / 100, turned };
    },
  };
}

// Star Light's owl (developer, 2026-11-12, Q87: "it can be sitting on a
// tree branch and just say 'who' once in a while"): it doesn't cross; it
// sits on its branch from the start of every scene, hooting now and then
// (the first 3-6 s in, then every HOOT_EVERY s), turning its head. A block
// falling startles it as the others (STARTLE s), then it flies off away
// from the block, climbing, out of sight; back on its branch next scene.
// at: [x, y, z] its seat (the drawing sets it each scene, at the view's
// side: setSeat), margin: how far past the view's edge it is gone.
export const HOOT_EVERY = [8, 16];
export const OWL_FLY = 3.2;    // m/s, flying off
export function perched(seed, margin = 1.2) {
  let n = 0, r, seat = [0, 0, 0], x, y, dir, nextHoot, gone, scared, startle, edges = null, flown = 0;
  const reset = e => {
    edges = e ?? edges; r = rng(seed + 7919 * ++n);
    x = seat[0]; y = seat[1]; dir = 0; nextHoot = 3 + 3 * r(); gone = false; scared = false; startle = 0; flown = 0;
  };
  reset();
  return {
    reset, rand: () => r(),
    // where it sits (it goes there now, unless it's flown off)
    setSeat(at) { seat = at.slice(); if (!scared) { x = seat[0]; y = seat[1]; } },
    get seat() { return seat; },
    get x() { return x; }, get y() { return y; }, get dir() { return dir; },
    get on() { return !gone; },
    get scared() { return scared; },
    get flying() { return scared && startle === 0 && !gone; },
    get startled() { return startle > 0 ? 1 - startle / STARTLE : 0; },
    // s flown, for the wings' beat
    get flown() { return flown; },
    get state() { return { on: !gone, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, dir, scared, hoot: Math.round(Math.max(0, nextHoot) * 100) / 100 }; },
    // dt s on; true when it hoots now (only sitting calm)
    tick(dt) {
      if (gone) return false;
      if (startle > 0) { startle = Math.max(0, startle - dt); return false; }
      if (scared) {
        flown += dt; x += dir * OWL_FLY * dt; y += 0.9 * OWL_FLY * dt * Math.min(1, flown / 0.6) * 0.5;
        const [L, R] = edges ? edges(y, seat[2]) : [-12, 12];
        if (dir > 0 ? x > R + margin : x < L - margin) gone = true;
        return false;
      }
      nextHoot -= dt;
      if (nextHoot <= 0) { nextHoot = HOOT_EVERY[0] + (HOOT_EVERY[1] - HOOT_EVERY[0]) * r(); return true; }
      return false;
    },
    // a block fell at fromX: startled, then off away from it (once a scene)
    fright(fromX) {
      if (gone || scared) return null;
      dir = x === fromX ? 1 : Math.sign(x - fromX); scared = true; startle = STARTLE;
      return { x: Math.round(x * 100) / 100, from: Math.round(fromX * 100) / 100, turned: false, flew: dir };
    },
  };
}
