// Nim screens (setup and play). Built from the Connect Four screens (same
// setup, turn line, scoreboard and cheers); the rules live in
// src/core/nim.js; this file only draws and handles taps.

import {
  FACE_NAMES, FIRST_RULES, LEVELS, START_ROWS, checkFaces, createMatch, newRound, take, counts, nimSum,
  robotMove, robotPicks,
} from '../core/nim.js';
import { endMoods, endSound, nameOf, twoPlayerFaces } from '../core/players.js';
import { svg, pickerFace } from './faces.js';
import { MATCH_SVG } from './matchstick.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

// The robot at a person's pace (agreed mockup, 2026-10-08): it thinks,
// lifts its matches one at a time, waits a moment, then takes them.
const ROBOT_WAIT = { think: 800, lift: 450, beforeTake: 700 };
const FLY_MS = 450;      // taken matches fly off (css: .m.gone)
const CHEER_MS = 2800;   // the end-of-round scorecard cheer (css: .cheer-win)
const GAP = 6, TRAY_PAD = 10;   // css: --mgap, --traypad
const MIN_SLOT = 30, MAX_SLOT = 64;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('nim', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt', level: 'easy' };

let match = null;   // from createMatch, while on the play screen
let sel = null;     // the matches picked up this turn: { row, picks: Set }
let busy = false;   // matches flying off, or the robot moving: no taps
let timers = [];    // pending robot steps and the fly-off, so they can be cancelled
// "One row at a time!" in the turn line for a moment, after a tap in
// another row (in the turn line, not a line of its own: the matches get
// that room on a phone).
let hint = null;
let hintTimer = null;
const HINT_MS = 2000;
// The end of a round on the scorecard, as in the other games: `moods`
// (from endMoods) are kept until the next round starts; `cheering` is the
// first 2.8 s, while the winner's face also grows and wiggles.
let moods = null;
let cheering = false;
let cheerTimer = null;

const WHY = {
  'p1-missing': () => (setup.vsRobot ? 'Pick your face first.' : 'Player 1 needs a face.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

/* ---------- setup screen ---------- */

function renderSetup() {
  const vs = setup.vsRobot;
  $('modeRobot').setAttribute('aria-pressed', String(vs));
  $('modeTwo').setAttribute('aria-pressed', String(!vs));
  for (const b of document.querySelectorAll('.first')) b.setAttribute('aria-pressed', String(b.dataset.rule === setup.firstRule));
  for (const b of document.querySelectorAll('.level')) b.setAttribute('aria-pressed', String(b.dataset.level === setup.level));
  const [p1Pic, p2Pic] = twoPlayerFaces(setup.p1, setup.p2);
  $('pairRobot').innerHTML = svg(p1Pic) + svg('robot');
  $('pairTwo').innerHTML = svg(p1Pic) + svg(p2Pic);
  $('p1Title').textContent = vs ? 'Pick your face' : 'Player 1, pick a face';
  // Against the robot there's no player 2 to pick for; two players have no
  // robot to make easy or hard.
  $('p2Panel').hidden = vs;
  $('levelPanel').hidden = !vs;
  fillPicker($('p1Faces'), setup.p1, vs ? null : setup.p2, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = !vs && setup.p2 ? svg(setup.p2) : '';
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code]() : '';
}

// One button per face. The other player's face is greyed out: both players
// can never have the same face (the rule itself is checkFaces in core).
function fillPicker(box, mine, theirs, onPick) {
  box.replaceChildren(...FACE_NAMES.map(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'face';
    b.innerHTML = pickerFace(f);
    b.setAttribute('aria-label', nameOf(f));
    b.setAttribute('aria-pressed', String(f === mine));
    b.disabled = f === theirs;
    b.onclick = () => onPick(f);
    return b;
  }));
}

function pick(player, face) {
  setup[player] = face;
  L(`${player} picked`, { face });
  renderSetup();
}

$('mini').innerHTML = START_ROWS.map(n => `<div>${MATCH_SVG.repeat(n)}</div>`).join('');
$('modeRobot').onclick = () => { setup.vsRobot = true; L('mode', { vsRobot: true }); renderSetup(); };
$('modeTwo').onclick = () => {
  setup.vsRobot = false;
  if (setup.p2 === setup.p1) setup.p2 = null;
  L('mode', { vsRobot: false });
  renderSetup();
};
for (const b of document.querySelectorAll('.first')) {
  b.onclick = () => { setup.firstRule = b.dataset.rule; L('first rule', { rule: setup.firstRule }); renderSetup(); };
}
for (const b of document.querySelectorAll('.level')) {
  b.onclick = () => { setup.level = b.dataset.level; L('level', { level: setup.level }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !FIRST_RULES.includes(setup.firstRule) || !LEVELS.includes(setup.level)) return;
  match = createMatch(setup);
  L('match started', { faces: match.faces, firstRule: match.firstRule, level: match.vsRobot ? match.level : null });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startRound();
  fitTray();
};

// The play screen's match size: the biggest that lets the whole page fit
// the screen, up to what the width allows (7 matches across, at most
// 520px of tray). Sets the 🏠 from it too (one match wide, at least 48px).
function fitTray() {
  const play = $('play');
  // The page column's width (main), not the play screen's: a tray too wide
  // for the screen would stretch the play screen it's measured from.
  const width = Math.min(document.querySelector('main').clientWidth, 520);
  const maxSlot = Math.min(MAX_SLOT, (width - 2 * TRAY_PAD - 6 * GAP) / 7);
  const r = fitPlayScreen(px => {
    play.style.setProperty('--slot', `${px}px`);
    play.style.setProperty('--home', `${Math.max(48, px)}px`);
  }, Math.min(MIN_SLOT, maxSlot), maxSlot);
  L('fit', r);
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitTray(); });

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
const robotsTurn = () => match.vsRobot && match.turn === 2;
function later(ms, f) {
  const id = setTimeout(() => { timers = timers.filter(t => t !== id); f(); }, ms);
  timers.push(id);
}
function cancelTimers() {
  if (timers.length) L('pending steps cancelled', { steps: timers.length });
  timers.forEach(clearTimeout);
  timers = [];
}

function startCheer(winner) {
  stopCheer();
  moods = endMoods(winner);
  cheering = true;
  L('scorecard cheer', { moods: { [faceOf(1)]: moods[1], [faceOf(2)]: moods[2] } });
  cheerTimer = setTimeout(() => { cheerTimer = null; cheering = false; if (match) renderStatus(); }, CHEER_MS);
}
function stopCheer() {
  if (cheerTimer !== null) clearTimeout(cheerTimer);
  cheerTimer = null;
  cheering = false;
  moods = null;
}

function startRound() {
  cancelTimers();
  stopCheer();
  const midRound = counts(match.taken).some((n, r) => n < START_ROWS[r]) && !match.result;
  newRound(match);
  sel = null;
  busy = false;
  clearHint();
  L(midRound ? 'round restarted (not scored)' : 'round started', { starter: match.starter, starterFace: faceOf(match.starter) });
  render();
  maybeRobot();
}

// A tap on a match: picks it up, or puts it back. A tap in another row
// drops the first row's picks (one row at a time).
function tap(row, i) {
  if (!match || match.result || busy || robotsTurn() || match.taken[row][i]) return;
  const otherRow = !!sel && sel.row !== row;
  if (!sel || sel.row !== row) {
    if (sel) {
      L('picks dropped: another row', { from: sel.row + 1, to: row + 1 });
      showHint('One row at a time!');
    }
    sel = { row, picks: new Set() };
  }
  sound.play(otherRow ? 'uhoh' : 'tick');
  if (sel.picks.has(i)) sel.picks.delete(i);
  else sel.picks.add(i);
  if (!sel.picks.size) sel = null;
  render();
}

// The player whose turn it is takes the picked matches.
function doTake(who) {
  if (!sel) return;
  const player = match.turn;
  const row = sel.row, picks = [...sel.picks];
  const r = take(match, row, picks);
  if (!r.ok) { L('take refused', { row: row + 1, picks, why: r.why, who }); return; }
  const left = counts(match.taken);
  L('take', { player, face: faceOf(player), row: row + 1, count: picks.length, left, nimSum: nimSum(left), who });
  sound.play('thud');
  clearHint();
  if (match.result) {
    L('round won', { winner: faceOf(match.result.winner), scores: match.scores, nextStarter: faceOf(match.starter) });
    sel = null;
    busy = false;
    sound.play(endSound(match.result.winner, { vsRobot: match.vsRobot }), 0.3);
    startCheer(match.result.winner);
    render();
    return;
  }
  // The taken matches fly off, then the turn passes.
  busy = true;
  render(picks.map(i => `${row}:${i}`));
  later(FLY_MS, () => {
    sel = null;
    busy = false;
    if (who === 'robot') sound.play('ping');   // your turn, after the robot's
    render();
    maybeRobot();
  });
}

function maybeRobot() {
  if (!robotsTurn() || match.result) return;
  const m = robotMove(counts(match.taken), match.level);
  const picks = robotPicks(match.taken, m.row, m.count);
  L('robot chose', { row: m.row + 1, count: m.count, reason: m.reason, level: match.level });
  busy = true;
  sel = { row: m.row, picks: new Set() };
  render();
  picks.forEach((i, n) => later(ROBOT_WAIT.think + n * ROBOT_WAIT.lift, () => { sel.picks.add(i); sound.play('tick'); render(); }));
  later(ROBOT_WAIT.think + (picks.length - 1) * ROBOT_WAIT.lift + ROBOT_WAIT.beforeTake, () => doTake('robot'));
}

function showHint(text) {
  clearTimeout(hintTimer);
  hint = text;
  hintTimer = setTimeout(() => { hintTimer = null; hint = null; if (match) renderStatus(); }, HINT_MS);
}
function clearHint() {
  clearTimeout(hintTimer);
  hintTimer = null;
  hint = null;
}

function render(flying = []) {
  renderTray(flying);
  renderStatus();
}

// The tray, rebuilt on each change (22 buttons at most). `flying`: the
// matches just taken, as "row:place", shown flying off.
function renderTray(flying) {
  const r = match.result;
  const tray = $('tray');
  tray.className = `tray p${r ? r.winner : match.turn}turn`;
  const locked = !!r || busy || robotsTurn();
  tray.replaceChildren(...match.taken.map((row, ri) => {
    const div = document.createElement('div');
    div.className = 'mrow' + (sel && sel.row === ri && !r ? ' picking' : '');
    div.append(...row.map((gone, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = MATCH_SVG;
      const last = r && r.row === ri && r.picks.includes(i);
      const fly = flying.includes(`${ri}:${i}`);
      b.className = 'm' + (last ? ` last w${r.winner}` : fly ? ' gone' : gone ? ' taken' : '')
        + (!last && !gone && sel && sel.row === ri && sel.picks.has(i) ? ' sel' : '');
      b.disabled = locked || gone;
      b.setAttribute('aria-label', `row ${ri + 1}, match ${i + 1}` + (gone ? ', taken' : sel && sel.row === ri && sel.picks.has(i) ? ', picked' : ''));
      b.onclick = () => tap(ri, i);
      return b;
    }));
    return div;
  }));
}

// The turn line, the Take button and the scoreboard.
function renderStatus() {
  const r = match.result;
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '');
  if (r) t.innerHTML = `<span class="chip">${svg(faceOf(r.winner), 'winner')}</span> ${nameOf(faceOf(r.winner))} wins!`;
  else if (hint) t.innerHTML = `<span class="chip">${svg(faceOf(match.turn))}</span> ${hint}`;
  else if (robotsTurn()) t.innerHTML = `<span class="chip">${svg('robot')}</span> Robot is thinking…`;
  else t.innerHTML = `<span class="chip">${svg(faceOf(match.turn))}</span> ${nameOf(faceOf(match.turn))}’s turn`;

  const n = sel ? sel.picks.size : 0;
  const take = $('takeBtn');
  take.textContent = n ? `Take ${n}` : 'Take';
  take.disabled = !n || !!r || busy || robotsTurn();

  for (const p of [1, 2]) {
    const mood = moods?.[p] ?? 'normal';
    const chip = $(`s${p}Chip`);
    chip.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    // Only redrawn when the face changes, so a running wiggle isn't restarted.
    const key = `${faceOf(p)}/${mood}`;
    if (chip.dataset.face !== key) { chip.innerHTML = svg(faceOf(p), mood); chip.dataset.face = key; }
  }
  $('s1').textContent = match.scores[1];
  $('s2').textContent = match.scores[2];
  $('s1Who').textContent = nameOf(faceOf(1));
  $('s2Who').textContent = nameOf(faceOf(2));
  $('side1').classList.toggle('now', !r && match.turn === 1);
  $('side2').classList.toggle('now', !r && match.turn === 2);
}

$('takeBtn').onclick = () => { if (!busy && !robotsTurn()) doTake('person'); };
$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => {
  cancelTimers();
  stopCheer();
  clearHint();
  L('new game');
  match = null;
  sel = null;
  busy = false;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

startLog('nim');
renderSetup();
