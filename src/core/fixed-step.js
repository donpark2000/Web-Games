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

// A stepper for `world`: stepper(dt, clock) moves it on dt s and returns
// { steps, dropped } (whole steps taken and dropped). clock: () => ms, or
// none for every step.
export function fixedStepper(world, step, max) {
  let carry = 0;
  return function advance(dt, clock = null) {
    carry += dt;
    const t0 = clock ? clock() : 0;
    let steps = 0;
    while (carry >= step && steps < max) {
      world.internalStep(step);
      carry -= step;
      steps++;
      if (clock && clock() - t0 > step * 1000) break;   // out of real time: give up catching up
    }
    const dropped = Math.floor(carry / step);
    carry %= step;
    world.time += dt;
    return { steps, dropped };
  };
}
