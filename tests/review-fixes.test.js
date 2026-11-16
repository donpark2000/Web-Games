// Fixes from the 2026-11-17 code review of release 10.22. The screen code
// can't be imported without a browser, so each function is cut out of its
// file's text and run here with stand-ins for what it touches. Hermetic:
// reads source files only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFile(path.join(root, f), 'utf8');

// The text from `start` to the first line that is just "}" (CRLF or LF).
function cut(src, start) {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `not found: ${start}`);
  const m = /\r?\n\}\r?\n/.exec(src.slice(i));
  assert.ok(m, `no end for: ${start}`);
  return src.slice(i, i + m.index + m[0].length);
}

// TOP-2 / 3D-1: the resume snapshot must be taken early in a round that
// follows a longer one (the round clock restarts at 0, settledAt didn't).
async function settledRuns(file, fnStart, mk) {
  const src = await read(file);
  const body = src.slice(src.indexOf('let settledAt = 0;'), src.indexOf(fnStart)) + cut(src, fnStart);
  const makeFn = new Function('ctx', `
    const { JSON, END_WAIT, world, resume, cam } = ctx;
    let round = ctx.round, match = ctx.match, settled = null;
    ${body}
    return { run: (c) => { ${fnStart.includes('(cam)') ? 'noteSettled(c)' : 'noteSettled()'}; return settled; },
             setRound: r => { round = r; match = { round: r }; }, reset: () => { settled = null; } };
  `);
  return ctx => makeFn(ctx);
}

for (const [name, file, fnStart] of [
  ['Topple!', 'src/ui/topple.js', 'function noteSettled() {'],
  ['Tin Can Alley', 'src/ui/tin-can-alley.js', 'function noteSettled(cam) {'],
]) {
  test(`${name}: a new round after a long one is noted as settled early (review)`, async () => {
    const make = await settledRuns(file, fnStart);
    const kept = [];
    const round1 = { t: 40, since: null, result: null };
    const ctx = { JSON, END_WAIT: 2, world: { still: () => true, poses: () => [] }, resume: { keep: () => kept.push(1) },
      round: round1, match: { round: round1 }, cam: null };
    const g = make(ctx);
    const cam = { view: 'behind' };
    assert.ok(g.run(cam), 'round 1 at t=40 should be noted');
    // round 2: the clock is back near 0
    g.reset();
    g.setRound({ t: 1, since: null, result: null });
    assert.ok(g.run(cam), 'round 2 at t=1 should be noted, not skipped until t passes 40');
    // edge: within half a second of the last note, it is still skipped
    g.reset();
    g.setRound({ t: 1.2, since: null, result: null });
    assert.equal(g.run(cam), null, 'two notes within 0.5 s: the second waits');
    // failure case: not at rest, nothing noted
    ctx.world.still = () => false;
    g.setRound({ t: 3, since: null, result: null });
    assert.equal(g.run(cam), null, 'blocks moving: nothing noted');
  });
}

// PUZ-1: a shop piece tapped while a beam grows must not render (that
// cancels the beam's timers, so busy would never clear).
test('Laser Lab: tapping a shop piece while a beam is growing does nothing (review PUZ-1)', async () => {
  const src = await read('src/ui/laser-lab.js');
  const fn = cut(src, 'function pickPiece(e) {');
  const make = new Function('ctx', `
    const { $, L, sound, resume, render, ui } = ctx; let G = ctx.G;
    ${fn}
    return pickPiece;`);
  const calls = [];
  const ui = { sel: 'mirror', busy: true };
  const pick = make({ L: () => {}, sound: { play: () => calls.push('sound') }, resume: { keep: () => calls.push('keep') },
    render: () => calls.push('render'), ui, G: { result: null } });
  const ev = { target: { closest: () => ({ disabled: false, dataset: { t: 'splitter' } }) } };
  pick(ev);
  assert.deepEqual(calls, [], 'busy: no render, sound or keep');
  assert.equal(ui.sel, 'mirror', 'busy: selection unchanged');
  ui.busy = false;
  pick(ev);
  assert.equal(ui.sel, 'splitter', 'not busy: the piece is picked');
  assert.deepEqual(calls, ['sound', 'render', 'keep']);
  // edge: no piece button under the tap
  calls.length = 0;
  pick({ target: { closest: () => null } });
  assert.deepEqual(calls, []);
});
