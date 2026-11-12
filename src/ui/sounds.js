// The games' sound effects (DESIGN.md "Sound"), made in the page with Web
// Audio: no sound files, nothing from other sites. The sounds are the
// developer's picks from sampler v1 (2026-10-09). This file has no DOM
// code and takes its audio context, storage and log from the caller, so
// the tests can run it with fakes; src/ui/sound.js wires it to the page.

// On or off, kept on the device for all the games ('on' / 'off'; on when
// nothing is kept: developer, 2026-10-09).
export const SOUND_KEY = 'web-games-sound';
const LEAD = 0.02;   // seconds: a sound starts this far ahead, so its start is never in the past

const N = { E4: 329.63, G4: 392, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 };

// The building blocks, for one audio context: a note, a burst of filtered
// noise, a soft bell and a dice rattle. Every node ends up at `out`.
function kit(ctx, out, noiseBuf) {
  // A gain that rises quickly to `peak` and fades out by t + dur.
  function envelope(t, dur, peak, attack) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out);
    return g;
  }
  function tone(t, f, { type = 'sine', dur = 0.2, peak = 0.3, attack = 0.005, to = 0, vib = 0, vibRate = 6 } = {}) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    if (vib) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = vibRate;
      depth.gain.value = vib;
      lfo.connect(depth);
      depth.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    o.connect(envelope(t, dur, peak, attack));
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(t, { dur = 0.05, peak = 0.3, type = 'bandpass', f = 1500, to = 0, q = 1, attack = 0.002 } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter();
    s.buffer = noiseBuf;
    fl.type = type;
    fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t);
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    s.connect(fl);
    fl.connect(envelope(t, dur, peak, attack));
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }
  function bell(t, f, dur = 0.6, peak = 0.22) {
    tone(t, f, { dur, peak, attack: 0.003 });
    tone(t, f * 2, { dur: dur * 0.5, peak: peak * 0.3, attack: 0.003 });
    tone(t, f * 3.01, { dur: dur * 0.25, peak: peak * 0.12, attack: 0.003 });
  }
  // n clicks spread over `span` seconds, getting quieter.
  function rattle(t, n, span, lo, hi, peak) {
    const times = Array.from({ length: n }, () => Math.random() * span).sort((a, b) => a - b);
    times.forEach((dt, i) => noise(t + dt, { dur: 0.02, peak: peak * (1 - 0.5 * i / n), f: lo + Math.random() * (hi - lo), q: 6 }));
  }
  return { tone, noise, bell, rattle };
}

// The sounds, by what they're for; each picked version's sampler name in
// the comment.
export const RECIPES = {
  // Tap / pick, C "Wood tick": setup choices, a match, a die, a hop.
  tick: (k, t) => { k.noise(t, { dur: 0.025, peak: 0.5, f: 2500, q: 8 }); k.tone(t, 1200, { type: 'triangle', dur: 0.03, peak: 0.15 }); },
  // A move lands, A "Thud".
  thud: (k, t) => { k.tone(t, 160, { to: 60, dur: 0.15, peak: 0.8 }); k.noise(t, { dur: 0.04, peak: 0.2, type: 'lowpass', f: 600 }); },
  // A win, B "Sparkle".
  win: (k, t) => [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6].forEach((f, i) => k.bell(t + i * 0.07, f, 0.5, 0.16)),
  // A gentle "aww", C "Wobble down".
  aww: (k, t) => k.tone(t, 440, { to: 294, dur: 0.75, peak: 0.25, attack: 0.04, vib: 10, vibRate: 7 }),
  // A tie, A "Ding ding" (developer, 2026-10-09).
  tie: (k, t) => { k.bell(t, N.A5, 0.4); k.bell(t + 0.22, N.A5, 0.5); },
  // Card flip, A "Swish".
  swish: (k, t) => k.noise(t, { dur: 0.11, peak: 0.35, f: 600, to: 4000, q: 1.5, attack: 0.02 }),
  // Dice rolling, B "Soft shake".
  shake: (k, t) => k.rattle(t, 14, 0.7, 900, 1400, 0.3),
  // A die landing on felt and bouncing twice, softer each time (Five Dice
  // 3D; the click of the tray and play screen mockups, a bounce apart).
  clack: (k, t) => [[0, 0.5], [0.31, 0.22], [0.44, 0.1]].forEach(([dt, peak]) =>
    k.noise(t + dt, { dur: 0.045, peak, f: 1300 + Math.random() * 900, q: 1.4 })),
  // Got one!, A "Ding".
  ding: (k, t) => k.bell(t, N.E6, 0.6, 0.2),
  // Oops, B "Uh-oh".
  uhoh: (k, t) => { k.tone(t, N.G4, { type: 'triangle', dur: 0.14, peak: 0.25 }); k.tone(t + 0.17, N.E4, { type: 'triangle', dur: 0.22, peak: 0.25 }); },
  // Up the ladder, A "Climb".
  climb: (k, t) => [N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.B5, N.C6].forEach((f, i) => k.tone(t + i * 0.07, f, { type: 'triangle', dur: 0.09, peak: 0.22 })),
  // Down the snake, A "Wheee".
  wheee: (k, t) => k.tone(t, 1000, { to: 220, dur: 0.9, peak: 0.22, attack: 0.03, vib: 25, vibRate: 7 }),
  // Your turn, A "Ping".
  ping: (k, t) => k.bell(t, N.A5, 0.4, 0.14),
  // A tin can knocked (Tin Can Alley; the stall mockup's): three partials
  // of a thin can, a random pitch; `level` 0-1 for how hard (0.3 of it at
  // the least, so a soft knock is still heard).
  clink: (k, t, level = 1) => {
    const base = 820 + Math.random() * 420, peak = 0.32 * (0.3 + 0.7 * level);
    [1, 2.76, 5.4].forEach(m => k.tone(t, base * m, { dur: 0.3, peak: peak / (m * m), attack: 0.002 }));
  },
  // A throw (Tin Can Alley; the stall mockup's): noise swept up.
  whoosh: (k, t, level = 1) => k.noise(t, { dur: 0.25, peak: 0.2 + 0.25 * level, f: 500, to: 1800, q: 1.2, attack: 0.02 }),
  // A wooden block knocked (Topple!; the block game mockup's): a short
  // falling note through a band of wood, a random pitch; `level` 0-1 for how hard.
  knock: (k, t, level = 1) => {
    k.tone(t, 380 + Math.random() * 260, { type: 'triangle', to: 180, dur: 0.12, peak: 0.1 + 0.35 * level, attack: 0.002 });
    k.noise(t, { dur: 0.05, peak: 0.08 + 0.2 * level, f: 900, q: 2 });
  },
  // The ball in a bush or a tree's leaves (Topple!): a soft high rustle.
  rustle: (k, t) => k.rattle(t, 10, 0.25, 2500, 6000, 0.12),
  // The ball off the glass backboard (Topple!): a note that springs up and settles.
  boing: (k, t) => k.tone(t, 220, { to: 620, dur: 0.35, peak: 0.25, attack: 0.01, vib: 40, vibRate: 9 }),

  // Topple!'s levels 2-4: each material its own sound, `level` 0-1 for how
  // hard, each through its own gain (SITE_GAIN) so they're about as loud as
  // each other (level 2 mockup v5: some picks were up to 26 times quieter
  // than others, measured). The building site's are the developer's picks
  // from mockup v4-v6 (2026-11-11): wood C, brick B, steel C, concrete C,
  // the iron ball C.
  // A wooden beam on the tiles, C "Hollow plank".
  plank: (k, t, l = 1) => site(k, 'plank', g => { g.noise(t, { dur: 0.28, peak: 0.12 + 0.35 * l, f: 340, q: 9 }); g.noise(t, { dur: 0.18, peak: 0.08 + 0.2 * l, f: 690, q: 9 }); g.noise(t, { dur: 0.015, peak: 0.05 + 0.1 * l, type: 'highpass', f: 2500 }); }),
  // Bricks on the tiles, B "Clack and grit".
  brick: (k, t, l = 1) => site(k, 'brick', g => { g.noise(t, { dur: 0.035, peak: 0.12 + 0.3 * l, f: 1800, q: 5 }); g.rattle(t + 0.02, 12, 0.25, 3000, 6000, 0.03 + 0.07 * l); }),
  // A steel post or beam on the tiles, C "Ring (bright, long)"; the light's pole.
  ring: (k, t, l = 1) => site(k, 'ring', g => { const base = 520 + Math.random() * 80, peak = 0.12 * (0.3 + 0.7 * l); [1, 2.32, 3.86].forEach((m, i) => g.tone(t, base * m, { dur: 1.4 / (1 + i * 0.7), peak: peak / (1 + i), attack: 0.002 })); g.noise(t, { dur: 0.02, peak: 0.1 * l + 0.001, type: 'highpass', f: 4000 }); }),
  // A concrete slab crashing down, C "Thunderous crash" (developer, v4: "something more dramatic. Like a crash").
  crash: (k, t, l = 1) => site(k, 'crash', g => { [0, 0.09].forEach((dt, i) => g.tone(t + dt, 60, { to: 30, dur: 0.7, peak: (0.3 + 0.4 * l) * (i ? 0.7 : 1) })); g.noise(t, { dur: 1.2, peak: 0.15 + 0.3 * l, type: 'lowpass', f: 1800, to: 200, attack: 0.004 }); g.rattle(t + 0.06, 25, 0.9, 600, 3500, 0.05 + 0.07 * l); }),
  // The iron ball on the ground, C "Clonk and roll".
  clonk: (k, t, l = 1) => site(k, 'clonk', g => { g.tone(t, 110, { to: 70, dur: 0.14, peak: 0.25 + 0.45 * l }); g.noise(t, { dur: 0.03, peak: 0.1 + 0.2 * l, f: 1500, q: 2 }); g.rattle(t + 0.08, 14, 0.45, 250, 800, 0.04 + 0.06 * l); }),
  // The ball into the wheelbarrow's gravel (the mockup's).
  crunch: (k, t, l = 1) => site(k, 'crunch', g => g.rattle(t, 16, 0.22, 1200, 4500, 0.1 + 0.15 * l)),
  // Level 3 (Claude's, to review): ice knocked (a glassy clink), ice
  // shattering (a crack and a shower of tinkles), the ball into snow (a soft
  // muffled puff).
  iceknock: (k, t, l = 1) => site(k, 'iceknock', g => { const b = 1500 + Math.random() * 500; [1, 2.1, 3.3].forEach((m, i) => g.tone(t, b * m, { dur: 0.25 / (1 + i), peak: (0.08 + 0.2 * l) / (1 + i), attack: 0.001 })); g.noise(t, { dur: 0.02, peak: 0.08 + 0.15 * l, type: 'highpass', f: 3000 }); }),
  shatter: (k, t) => site(k, 'shatter', g => { g.noise(t, { dur: 0.08, peak: 0.4, type: 'highpass', f: 2000 }); g.noise(t, { dur: 0.35, peak: 0.18, f: 5000, to: 2500, q: 1 }); g.rattle(t + 0.03, 28, 0.6, 3000, 9000, 0.12); [0.05, 0.13, 0.22, 0.34].forEach((dt, i) => g.tone(t + dt, 2400 + i * 700 + Math.random() * 400, { dur: 0.3, peak: 0.06, attack: 0.001 })); }),
  poof: (k, t, l = 1) => site(k, 'poof', g => { g.noise(t, { dur: 0.22, peak: 0.15 + 0.3 * l, type: 'lowpass', f: 700, to: 250, attack: 0.008 }); g.tone(t, 90, { to: 60, dur: 0.12, peak: 0.1 + 0.15 * l }); }),
  // Level 4 (Claude's, to review): a full barrel knocked (a hollow wooden
  // thunk), a barrel bursting (a crack, a gush of water, drips).
  barrel: (k, t, l = 1) => site(k, 'barrel', g => { g.tone(t, 150 + Math.random() * 20, { type: 'triangle', to: 95, dur: 0.22, peak: 0.15 + 0.4 * l, attack: 0.002 }); g.noise(t, { dur: 0.16, peak: 0.1 + 0.25 * l, f: 420, q: 4 }); g.noise(t, { dur: 0.1, peak: 0.06 + 0.12 * l, f: 260, q: 6 }); }),
  splash: (k, t) => site(k, 'splash', g => { g.noise(t, { dur: 0.04, peak: 0.3, f: 1200, q: 2 }); g.tone(t, 80, { to: 45, dur: 0.2, peak: 0.25 }); g.noise(t + 0.02, { dur: 0.7, peak: 0.3, f: 2600, to: 500, q: 0.8, attack: 0.02 }); g.rattle(t + 0.15, 20, 0.7, 1500, 4500, 0.06); }),
};

// Each of the sounds above through its own gain, to bring its loudest 50 ms
// to about the same loudness (the crash and the burst a little louder, as
// they should be): measured by rendering each offline (window.topple's
// soundLevels, in the browser), as the level 2 mockup v5 did at load.
// 2026-11-11 (rendered at 0.9 through the game's 0.5 master; loudest 50 ms RMS before -> after): level 1's knock 0.046 the
// yardstick; plank 0.007, brick 0.003, ring 0.040, crash 0.179 (to 0.09, a crash), clonk 0.096 (the ball, a little
// quieter), crunch 0.005, iceknock 0.056, shatter 0.040 and splash 0.048 (to 0.07), poof 0.035, barrel 0.072.
export const SITE_GAIN = { plank: 7, brick: 16, ring: 1.2, crash: 0.5, clonk: 0.45, crunch: 8.5, iceknock: 0.9, shatter: 1.75, poof: 1.15, barrel: 0.7, splash: 1.45 };
// Runs `play` with the kit's peaks scaled by the sound's gain.
function site(k, name, play) {
  const g = SITE_GAIN[name] ?? 1;
  if (g === 1) return play(k);
  return play({
    tone: (t, f, o = {}) => k.tone(t, f, { ...o, peak: (o.peak ?? 0.3) * g }),
    noise: (t, o = {}) => k.noise(t, { ...o, peak: (o.peak ?? 0.3) * g }),
    rattle: (t, n, span, lo, hi, peak) => k.rattle(t, n, span, lo, hi, peak * g),
    bell: (t, f, dur, peak = 0.22) => k.bell(t, f, dur, peak * g),
  });
}
// The kit made for a context (for measuring a sound offline: window.topple's soundLevels).
export const kitFor = (ctx, out, noiseBuf) => kit(ctx, out, noiseBuf);

// makeContext: () => an AudioContext, or null where there is none.
// storage: localStorage or null. log(msg, data): the debug log.
export function createSound({ makeContext, storage = null, log = () => {} }) {
  let on = true;
  try { on = storage?.getItem(SOUND_KEY) !== 'off'; } catch { /* blocked: on, as when nothing is kept */ }
  let ctx = null, tools = null, broken = false;

  // The audio context, made on first use. Browsers only let sound start
  // after a tap, so the page calls unlock() on every tap (resuming a
  // context the browser suspended, e.g. after the page was hidden).
  function audio() {
    if (ctx || broken) return ctx;
    try {
      ctx = makeContext ? makeContext() : null;
      if (!ctx) throw new Error('no Web Audio in this browser');
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      tools = kit(ctx, master, buf);
      log('ready', { state: ctx.state, rate: ctx.sampleRate });
    } catch (e) {
      broken = true;
      ctx = null;
      log('no sound', { error: String(e.message ?? e) });
    }
    return ctx;
  }
  function unlock() {
    if (!on || !audio()) return;
    if (ctx.state !== 'running') {
      const before = ctx.state;
      Promise.resolve(ctx.resume?.()).then(() => log('resumed', { from: before, now: ctx.state }), e => log('resume refused', { error: String(e) }));
    }
  }
  // Plays a sound now, or `delay` seconds from now. Returns true when it
  // was scheduled. `level` (0-1) for the sounds that take one (clink,
  // whoosh); `quiet` leaves it out of the log (Tin Can Alley's many
  // clinks: the game logs the hits itself).
  function play(name, delay = 0, { level = 1, quiet = false } = {}) {
    const recipe = RECIPES[name];
    if (!recipe) { log('unknown sound', { name }); return false; }
    if (!on || !audio()) return false;
    try {
      recipe(tools, ctx.currentTime + LEAD + delay, Math.min(1, Math.max(0, level)));
    } catch (e) {
      log('sound failed', { name, error: String(e.message ?? e) });
      return false;
    }
    // The state too when it isn't running: a suspended context plays nothing.
    if (!quiet || ctx.state !== 'running') log(name, ctx.state === 'running' ? (delay ? { delay } : undefined) : { delay, state: ctx.state });
    return true;
  }
  function setOn(value) {
    on = !!value;
    try { storage?.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { log('on/off not kept on this device (storage refused)'); }
    log(on ? 'turned on' : 'turned off');
    if (on) { unlock(); play('tick'); }
  }
  // A soft note of `freq` Hz, about `seconds` long (at least 0.25 s), now
  // or `delay` seconds from now: Follow Me's pads, each with its own note.
  // Returns true when it was scheduled.
  function note(freq, seconds, delay = 0) {
    if (!(freq > 0) || !(seconds > 0)) { log('bad note', { freq, seconds }); return false; }
    if (!on || !audio()) return false;
    try {
      const t = ctx.currentTime + LEAD + delay, d = Math.max(0.25, seconds);
      tools.tone(t, freq, { type: 'triangle', dur: d, peak: 0.32, attack: 0.012 });
      tools.tone(t, freq * 2, { dur: d * 0.6, peak: 0.08, attack: 0.012 });
    } catch (e) {
      log('note failed', { freq, error: String(e.message ?? e) });
      return false;
    }
    log('note', ctx.state === 'running' ? { freq } : { freq, state: ctx.state });
    return true;
  }
  // Another tab changed it (the storage event): follow, without saving again.
  function follow(value) { on = value !== 'off'; log(on ? 'turned on (another tab)' : 'turned off (another tab)'); }
  return { play, note, unlock, setOn, follow, get on() { return on; } };
}
