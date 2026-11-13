// The 3D games' physics stepping (Q65; DESIGN.md "3D games"): a cannon-es
// world moved on dt s in fixed steps, as cannon-es's own
// world.step(step, dt, max) does, except that the clock is only read when
// the caller hands one over.
//
// cannon-es's catch-up step reads the real clock (performance.now) and stops
// catching up once a frame's steps have taken longer than one step of real
// time, dropping the rest: a slow phone gets slow motion rather than a frame
// that never ends. The game keeps that, by passing its clock. A test passes
// none, so every step is taken whatever the machine's load, and a throw comes
// out the same on any machine (a Tin Can Alley test once failed in a busy
// full run: "throw refused: round-over").
//
// Otherwise the same as cannon-es 0.20.0's World.step: the time short of a
// whole step carries over to the next call, at most `max` steps a call (the
// rest dropped), the world's time moved on by dt once all of a call's steps
// are taken (its bodies' sleep timing reads it). Not kept: the bodies'
// in-between poses for drawing (nothing draws them).
//
// Real time on a slow device (Q99, 2026-11-13; release 10.6): cannon-es
// gives up once a call's steps have used one step's real time (8.3 ms),
// and the games took at most 0.05 s of game time a frame. On the 2019
// Galaxy Tab A, at 3-8 frames a second, that played the games at 0.15-0.43
// times real speed (falls of 10-20 s). Now a frame may move the game on up
// to MAX_FRAME_S (both games' frame()), and the steps may use up to
// BUDGET_SHARE of the frame's own time, at least one step's: at 60 frames a
// second that is 8.3 ms, as before; at 30, 16.7 ms; at 10, 50 ms. So the
// physics keeps to real time as long as it needs under half of each frame.

export const MAX_FRAME_S = 0.1;   // the most game time one frame moves on (s)
export const BUDGET_SHARE = 0.5;  // the share of a frame's time the steps may use

// A stepper for `world`: stepper(dt, clock) moves it on dt s and returns
// { steps, dropped } (whole steps taken and dropped). clock: () => ms, or
// none for every step.
export function fixedStepper(world, step, max) {
  let carry = 0;
  return function advance(dt, clock = null) {
    carry += dt;
    const t0 = clock ? clock() : 0, budget = Math.max(step, dt * BUDGET_SHARE) * 1000;
    let steps = 0;
    while (carry >= step && steps < max) {
      world.internalStep(step);
      carry -= step;
      steps++;
      if (clock && clock() - t0 > budget) break;   // out of real time: give up catching up
    }
    const dropped = Math.floor(carry / step);
    carry %= step;
    world.time += dt;
    return { steps, dropped };
  };
}
