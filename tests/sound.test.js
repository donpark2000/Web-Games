// The sound effects (src/ui/sounds.js) with a fake audio context and
// storage: every sound schedules real-looking audio, on/off is remembered,
// and missing Web Audio or blocked storage never breaks a game. Each game's
// sounds are checked in its screen file (the moments agreed 2026-10-09).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSound, RECIPES, SOUND_KEY } from '../src/ui/sounds.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Enough of an AudioContext for the recipes. Like the real one, a ramp to
// 0 or below throws, and so does a stop before its start.
function fakeContext({ state = 'running' } = {}) {
  const ctx = { currentTime: 10, sampleRate: 8000, state, destination: {}, nodes: 0, starts: [], ends: [] };
  const param = () => ({
    value: 0,
    setValueAtTime(v) { if (!Number.isFinite(v)) throw new TypeError(`bad value ${v}`); },
    exponentialRampToValueAtTime(v, t) { if (!(v > 0) || !Number.isFinite(t)) throw new RangeError(`bad ramp ${v} at ${t}`); },
  });
  const node = extra => { ctx.nodes++; return { connect() {}, ...extra }; };
  const playable = () => {
    let at = null;
    return { start(t) { at = t; ctx.starts.push(t); }, stop(t) { if (t < at) throw new Error('stop before start'); ctx.ends.push(t); } };
  };
  ctx.createGain = () => node({ gain: param() });
  ctx.createOscillator = () => node({ type: '', frequency: param(), ...playable() });
  ctx.createBiquadFilter = () => node({ type: '', Q: param(), frequency: param() });
  ctx.createBufferSource = () => node({ buffer: null, ...playable() });
  ctx.createBuffer = (channels, length) => ({ getChannelData: () => new Float32Array(length) });
  ctx.resume = () => { ctx.state = 'running'; return Promise.resolve(); };
  return ctx;
}
function fakeStorage(init = {}, { failGet = false, failSet = false } = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem: k => { if (failGet) throw new Error('blocked'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (failSet) throw new Error('blocked'); m.set(k, v); },
  };
}
function setupSound({ ctx = fakeContext(), storage = fakeStorage(), noAudio = false } = {}) {
  const lines = [];
  let made = 0;
  const s = createSound({
    makeContext: noAudio ? null : () => { made++; return ctx; },
    storage,
    log: (msg, data) => lines.push(data === undefined ? msg : `${msg} ${JSON.stringify(data)}`),
  });
  return { s, ctx, storage, lines, made: () => made };
}

// The developer's picks (sampler v1, 2026-10-09) plus the tie.
const NAMES = ['tick', 'thud', 'win', 'aww', 'tie', 'swish', 'shake', 'ding', 'uhoh', 'climb', 'wheee', 'ping'];

test('sound: the twelve sounds, each scheduling audio that starts now and ends within 2 s', () => {
  assert.deepEqual(Object.keys(RECIPES).sort(), [...NAMES].sort());
  for (const name of NAMES) {
    const { s, ctx } = setupSound();
    const before = ctx.nodes;
    assert.equal(s.play(name), true, name);
    assert.ok(ctx.nodes - before >= 2, `${name}: only ${ctx.nodes - before} audio nodes`);
    assert.ok(ctx.starts.length >= 1, `${name}: nothing started`);
    for (const t of ctx.starts) assert.ok(t >= ctx.currentTime && t < ctx.currentTime + 1, `${name}: starts at ${t}`);
    for (const t of ctx.ends) assert.ok(t <= ctx.currentTime + 2, `${name}: still sounding at ${t}`);
  }
});

test('sound: a delay moves the start; the log names each sound', () => {
  const { s, ctx, lines } = setupSound();
  s.play('ding', 0.5);
  assert.ok(Math.min(...ctx.starts) >= ctx.currentTime + 0.5, `starts at ${Math.min(...ctx.starts)}`);
  assert.ok(lines.includes('ding {"delay":0.5}'), lines.join(' | '));
  s.play('thud');
  assert.equal(lines.at(-1), 'thud');
});

test('sound: on when nothing is kept; "off" kept: silent, and no audio is even made', () => {
  assert.equal(setupSound().s.on, true);
  const off = setupSound({ storage: fakeStorage({ [SOUND_KEY]: 'off' }) });
  assert.equal(off.s.on, false);
  assert.equal(off.s.play('win'), false);
  off.s.unlock();
  assert.equal(off.made(), 0);
});

test('sound: turning it off and on is kept for all the games; turning on ticks', () => {
  const { s, storage, ctx, lines } = setupSound();
  s.setOn(false);
  assert.equal(storage.m.get(SOUND_KEY), 'off');
  assert.equal(s.play('tick'), false);
  const n = ctx.nodes;
  s.setOn(true);
  assert.equal(storage.m.get(SOUND_KEY), 'on');
  assert.ok(ctx.nodes > n, 'no tick when turned on');
  assert.ok(lines.includes('turned off') && lines.includes('turned on'), lines.join(' | '));
  s.follow('off');
  assert.equal(s.on, false);
});

test('sound: blocked storage: on, works, and says it is not kept', () => {
  const { s, lines } = setupSound({ storage: fakeStorage({}, { failGet: true, failSet: true }) });
  assert.equal(s.on, true);
  assert.equal(s.play('tick'), true);
  s.setOn(false);
  assert.equal(s.on, false);
  assert.ok(lines.some(l => l.startsWith('on/off not kept')), lines.join(' | '));
});

test('sound: no Web Audio: every sound quietly does nothing, logged once', () => {
  const { s, lines } = setupSound({ noAudio: true });
  assert.equal(s.play('win'), false);
  assert.equal(s.play('tick'), false);
  s.unlock();
  assert.equal(lines.filter(l => l.startsWith('no sound')).length, 1, lines.join(' | '));
});

test('sound: a pad note: that pitch, at least 0.25 s; off or bad values play nothing', () => {
  const { s, ctx, lines } = setupSound();
  const freqs = [];
  const make = ctx.createOscillator;
  ctx.createOscillator = () => {
    const o = make();
    o.frequency.setValueAtTime = v => freqs.push(v);
    return o;
  };
  assert.equal(s.note(392, 0.1), true);
  assert.deepEqual(freqs, [392, 784], 'the note and its octave');
  assert.ok(Math.max(...ctx.ends) >= ctx.currentTime + 0.25, `ends at ${Math.max(...ctx.ends)}: shorter than 0.25 s`);
  assert.ok(Math.max(...ctx.ends) <= ctx.currentTime + 0.4, `ends at ${Math.max(...ctx.ends)}`);
  assert.ok(lines.includes('note {"freq":392}'), lines.join(' | '));
  assert.equal(s.note(0, 0.5), false);
  assert.equal(s.note(440, -1), false);
  assert.ok(lines.some(l => l.startsWith('bad note')), lines.join(' | '));
  s.setOn(false);
  freqs.length = 0;
  assert.equal(s.note(440, 0.5), false);
  assert.deepEqual(freqs, []);
});

test('sound: an unknown name is logged, not thrown', () => {
  const { s, lines } = setupSound();
  assert.equal(s.play('trumpet'), false);
  assert.ok(lines.includes('unknown sound {"name":"trumpet"}'), lines.join(' | '));
});

test('sound: a suspended context is resumed on a tap; sounds before that log the state', async () => {
  const { s, ctx, lines } = setupSound({ ctx: fakeContext({ state: 'suspended' }) });
  s.play('ping');
  assert.ok(lines.some(l => l.startsWith('ping') && l.includes('"state":"suspended"')), lines.join(' | '));
  s.unlock();
  await new Promise(r => setTimeout(r, 0));
  assert.equal(ctx.state, 'running');
  assert.ok(lines.includes('resumed {"from":"suspended","now":"running"}'), lines.join(' | '));
});

// Which sounds each game plays (developer, 2026-10-09), besides the
// end-of-round one every game picks with endSound().
const GAME_SOUNDS = {
  'tic-tac-toe': ['thud'],
  'connect-four': ['thud'],
  matching: ['swish', 'ding', 'uhoh'],
  'count-to-9': ['swish', 'ding', 'uhoh', 'ping'],
  'snakes-ladders': ['shake', 'tick', 'climb', 'wheee', 'ping'],
  'five-dice': ['shake', 'tick', 'thud', 'ping'],
  nim: ['tick', 'uhoh', 'thud', 'ping'],
  'rock-paper-scissors': ['tick', 'swish', 'tie', 'ding', 'uhoh'],
  // Not the ping after the robot (developer, Follow Me mockup v1): the
  // robot's notes are the order to count. Each pad's note is sound.note().
  'follow-me': ['ding', 'uhoh'],
};

test('sound: each game plays its agreed sounds, all real ones, and the end-of-round sound', async () => {
  let checked = 0;
  for (const [game, want] of Object.entries(GAME_SOUNDS)) {
    const src = await readFile(path.join(root, 'src/ui', `${game}.js`), 'utf8');
    assert.match(src, /import \{ sound \} from '\.\/sound\.js';/, `${game}: no sound`);
    assert.match(src, /sound\.play\([^;]*endSound\(/,`${game}: no end-of-round sound`);
    // The quoted names inside each sound.play(...) call.
    const calls = [...src.matchAll(/sound\.play\(([^;]*)\);/g)].map(m => m[1]);
    // (not one compared with ===, as in r.pending === 'match')
    const used = new Set(calls.flatMap(c => [...c.matchAll(/(?<!===\s)'(\w+)'/g)].map(m => m[1])));
    for (const name of used) assert.ok(NAMES.includes(name), `${game}: plays '${name}', which isn't a sound`);
    assert.deepEqual([...used].sort(), [...want].sort(), `${game}: sounds`);
    checked += want.length;
  }
  assert.equal(checked, 29);
});
