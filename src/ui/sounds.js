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
};

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
  // was scheduled.
  function play(name, delay = 0) {
    const recipe = RECIPES[name];
    if (!recipe) { log('unknown sound', { name }); return false; }
    if (!on || !audio()) return false;
    try {
      recipe(tools, ctx.currentTime + LEAD + delay);
    } catch (e) {
      log('sound failed', { name, error: String(e.message ?? e) });
      return false;
    }
    // The state too when it isn't running: a suspended context plays nothing.
    log(name, ctx.state === 'running' ? (delay ? { delay } : undefined) : { delay, state: ctx.state });
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
