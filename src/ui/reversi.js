// Reversi screens (setup and play). Built from the Dots and Boxes screens
// (same setup, turn line, robot pace, scorecards and cheers); the rules
// live in src/core/reversi.js; this file only draws and handles taps.

import {
  FACE_NAMES, FIRST_RULES, LEVELS, SIZES, checkFaces, createMatch, newRound, play, discCounts,
  flipsFor, legalMoves, robotMove,
} from '../core/reversi.js';
import { endMoods, endSound, nameOf, twoPlayerFaces } from '../core/players.js';
import { mergeSetup } from '../core/resume.js';
import { svg, pickerFace } from './faces.js';
import { RIM, viewBox, boardContent, aimContent, rulesSvg, startSvg, chipDisc } from './rvboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen, fitEitherWay, setWide, wideRoom } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

// The robot at a person's pace: it thinks (at least until the last
// move's discs have turned over), shows its disc faintly for a moment,
// then puts it down.
const ROBOT_WAIT = { think: 800, show: 500, afterFlips: 350 };
// Discs turn over one after another, out from the disc put down.
const FLIP_STEP = 90, FLIP_MS = 280;
const CHEER_MS = 2800;   // the end-of-round scorecard cheer (css: .cheer-win)
const OOPS_MS = 2000;    // "Put it on a dot!" in the turn line
const MIN_CELL = 30, MAX_CELL = 80, MAX_CELL_WIDE = 120;
const BOARD_ID = 'rvb';
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('reversi', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt', level: 'easy', size: 6 };

let match = null;   // from createMatch, while on the play screen
let busy = false;   // the robot moving: no taps
let timers = [];    // pending robot steps, so they can be cancelled
let aim = null;     // [r, c] under the finger (or the robot's, just before it plays)
let flipping = [];  // discs just flipped, [r, c, delay]: they turn over once
let put = null;     // the disc just put down: it drops in once
let oops = null;    // a timer while the turn line says "Put it on a dot!"
let moods = null;
let cheering = false;
let cheerTimer = null;

// Kept on the device after every change, and picked up when the page
// opens (DESIGN.md "Coming back to a game").
const resume = resumable('reversi', 1, () => ({ screen: match ? 'play' : 'setup', setup, match }));

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
  for (const b of document.querySelectorAll('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === setup.level));
  for (const b of document.querySelectorAll('[data-size]')) b.setAttribute('aria-pressed', String(+b.dataset.size === setup.size));
  const [p1Pic, p2Pic] = twoPlayerFaces(setup.p1, setup.p2);
  $('pairRobot').innerHTML = svg(p1Pic) + svg('robot');
  $('pairTwo').innerHTML = svg(p1Pic) + svg(p2Pic);
  $('p1Title').textContent = vs ? 'Pick your face' : 'Player 1, pick a face';
  $('p2Panel').hidden = vs;
  $('levelPanel').hidden = !vs;
  fillPicker($('p1Faces'), setup.p1, vs ? null : setup.p2, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = !vs && setup.p2 ? svg(setup.p2) : '';
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code]() : '';
  resume.keep();
}
// The pictures don't change with the picks: drawn once.
$('mini').innerHTML = rulesSvg();
for (const n of SIZES) $(`size${n}`).innerHTML = startSvg(n);

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
for (const b of document.querySelectorAll('[data-level]')) {
  b.onclick = () => { setup.level = b.dataset.level; L('level', { level: setup.level }); renderSetup(); };
}
for (const b of document.querySelectorAll('[data-size]')) {
  b.onclick = () => { setup.size = +b.dataset.size; L('size', { size: setup.size }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !FIRST_RULES.includes(setup.firstRule) || !LEVELS.includes(setup.level) || !SIZES.includes(setup.size)) return;
  match = createMatch(setup);
  L('match started', { faces: match.faces, size: match.size, firstRule: match.firstRule, level: match.vsRobot ? match.level : null });
  showPlay();
  startRound();
  fitBoard();
};
function showPlay() {
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
}

// The play screen's square size: the biggest that lets the whole page fit
// the screen, up to what the width allows (at most 520px of board), in
// one column or, on a screen wider than tall, beside the rest (the wide
// layout, squares up to MAX_CELL_WIDE) if that gives a bigger board.
function fitBoard() {
  const play = $('play');
  const span = match.size + 2 * RIM;
  play.style.setProperty('--span', span);
  const r = fitEitherWay(wide => {
    // The page column's width (main), not the play screen's: a board too
    // wide for the screen would stretch the play screen it's measured from.
    const width = wide ? wideRoom() : Math.min(document.querySelector('main').clientWidth, 520);
    const maxCell = Math.min(wide ? MAX_CELL_WIDE : MAX_CELL, width / span);
    if (wide && maxCell < MIN_CELL) return null;
    return fitPlayScreen(px => {
      play.style.setProperty('--cell', `${px}px`);
    }, Math.min(MIN_CELL, maxCell), maxCell);
  });
  L('fit', { ...r, size: match.size });
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitBoard(); });

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
const colourOf = player => (player === match.black ? 'b' : 'w');
const robotsTurn = () => match.vsRobot && match.turn === 2;
const canTap = () => match && !match.result && !busy && !robotsTurn();
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
function stopOops() {
  if (oops !== null) clearTimeout(oops);
  oops = null;
}

function startRound() {
  cancelTimers();
  stopCheer();
  stopOops();
  const midRound = !match.result && match.last !== null;
  newRound(match);
  busy = false;
  aim = null;
  flipping = [];
  put = null;
  L(midRound ? 'round restarted (not scored)' : 'round started', { starter: match.starter, starterFace: faceOf(match.starter), black: faceOf(match.black), size: match.size });
  render();
  maybeRobot();
}

// How long a move's discs take to turn over.
const flipTime = flips => (flips.length ? (flips.length - 1) * FLIP_STEP + FLIP_MS : 0);

// The player whose turn it is puts a disc on (r, c) ('person' or 'robot').
function playAt(r, c, who) {
  const player = match.turn;
  const res = play(match, r, c);
  if (!res.ok) { L('move refused', { r, c, why: res.why, who }); return; }
  const counts = discCounts(match.board);
  L('move', { player, face: faceOf(player), colour: colourOf(player), r, c, flipped: res.flips.length, discs: counts, passed: match.passed ? faceOf(match.passed) : null, who });
  // Each line's discs turn over in order out from the disc put down
  // (flipsFor lists them that way); the lines together.
  flipping = res.flips.map(([y, x]) => [y, x, (Math.max(Math.abs(y - r), Math.abs(x - c)) - 1) * FLIP_STEP]);
  put = [r, c];
  aim = null;
  stopOops();
  sound.play('thud');
  const far = Math.max(0, ...flipping.map(f => f[2]));
  for (let ms = 0; ms <= far; ms += FLIP_STEP) sound.play('tick', ms / 1000 + 0.14);
  if (match.passed) L('pass', { face: faceOf(match.passed), next: faceOf(match.turn) });
  if (match.result) {
    L('round won', { winner: match.result.winner ? faceOf(match.result.winner) : 'tie', discs: counts, scores: match.scores, nextStarter: faceOf(match.starter) });
    busy = false;
    render();
    // The end once the last discs have turned over.
    later(flipTime(res.flips) + 200, () => {
      sound.play(endSound(match.result.winner, { vsRobot: match.vsRobot }));
      startCheer(match.result.winner);
      render();
    });
    return;
  }
  busy = false;
  render();
  if (who === 'robot' && !robotsTurn()) later(flipTime(res.flips), () => sound.play('ping'));   // your turn, after the robot's
  maybeRobot(flipTime(res.flips));
}

function maybeRobot(flipsMs = 0) {
  if (!match || !robotsTurn() || match.result) return;
  busy = true;
  renderStatus();
  later(Math.max(ROBOT_WAIT.think, flipsMs + ROBOT_WAIT.afterFlips), () => {
    const t = performance.now();
    const m = robotMove(match.board, 2, match.level);
    L('robot chose', { r: m.r, c: m.c, reason: m.reason, value: m.value, level: match.level, ms: Math.round(performance.now() - t) });
    aim = [m.r, m.c];
    renderAim();
    later(ROBOT_WAIT.show, () => playAt(m.r, m.c, 'robot'));
  });
}

/* ---------- a finger on the board ---------- */

// The square under a pointer, or null off the squares.
function squareAt(e) {
  const rect = $('board').getBoundingClientRect();
  const span = match.size + 2 * RIM;
  const x = (e.clientX - rect.left) / rect.width * span - RIM;
  const y = (e.clientY - rect.top) / rect.height * span - RIM;
  const r = Math.floor(y), c = Math.floor(x);
  return r >= 0 && r < match.size && c >= 0 && c < match.size ? [r, c] : null;
}
const same = (a, b) => (a === b) || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);
// While the finger is down, a legal square under it shows the disc faintly
// and the discs it would flip; it's played as the finger lifts there.
function aimAt(e) {
  const sq = squareAt(e);
  const ok = sq && flipsFor(match.board, sq[0], sq[1], match.turn).length ? sq : null;
  if (!same(ok, aim)) { aim = ok; renderAim(); }
  return sq;
}
const board = $('board');
board.addEventListener('pointerdown', e => {
  if (!canTap()) return;
  try { board.setPointerCapture(e.pointerId); } catch { /* not capturable: moves still come while over the board */ }
  board.dataset.aiming = '1';
  aimAt(e);
});
board.addEventListener('pointermove', e => { if (board.dataset.aiming && canTap()) aimAt(e); });
board.addEventListener('pointerup', e => {
  if (!board.dataset.aiming) return;
  delete board.dataset.aiming;
  if (!canTap()) return;
  const sq = aimAt(e);
  if (aim) playAt(aim[0], aim[1], 'person');
  else if (sq) sayOops(sq);
});
for (const type of ['pointercancel', 'lostpointercapture']) {
  board.addEventListener(type, () => {
    if (!board.dataset.aiming) return;
    delete board.dataset.aiming;
    if (canTap()) { aim = null; renderAim(); }
  });
}
// iOS zooms on a quick double tap unless the touch's end is cancelled
// (DESIGN.md "No zooming in"); the board is never redrawn, only its inside.
board.addEventListener('touchend', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });

// A tap on a square where no disc can go.
function sayOops([r, c]) {
  L('tap: not a move', { r, c, taken: !!match.board.cells[r * match.size + c] });
  sound.play('uhoh');
  stopOops();
  oops = setTimeout(() => { oops = null; if (match) renderStatus(); }, OOPS_MS);
  renderStatus();
}

/* ---------- drawing the play screen ---------- */

function render() {
  renderBoard();
  renderStatus();
}

// The dots where the person can play (not on the robot's turn, nor at the
// end); the robot's latest disc ringed until the person plays.
function renderBoard() {
  const r = match.result;
  const showMoves = !r && !robotsTurn();
  const l = match.last;
  const robotLast = match.vsRobot && !r && l && l.by === 2 && match.turn === 1 ? [l.r, l.c] : null;
  board.setAttribute('viewBox', viewBox(match.size));
  board.innerHTML = boardContent(match.board, colourOf, {
    id: BOARD_ID,
    moves: showMoves ? legalMoves(match.board, match.turn).map(m => [m.r, m.c]) : [],
    mover: match.turn,
    last: robotLast,
    flipping,
    put,
    win: r && cheering ? r.winner : 0,
  });
  flipping = [];
  put = null;
  renderAim();
}

// The disc under the finger (or the robot's, just before it plays), faint,
// with the discs it would flip spotted.
function renderAim() {
  board.querySelector('.aim')?.remove();
  if (!aim) return;
  const flips = flipsFor(match.board, aim[0], aim[1], match.turn);
  board.insertAdjacentHTML('beforeend', aimContent(BOARD_ID, aim[0], aim[1], colourOf(match.turn), flips));
}

// The turn line and the two scorecards.
function renderStatus() {
  const r = match.result;
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '');
  const chip = (face, mood) => `<span class="chip">${svg(face, mood)}</span>`;
  const me = faceOf(match.turn);
  if (r) {
    t.innerHTML = r.winner ? `${chip(faceOf(r.winner), 'winner')} ${nameOf(faceOf(r.winner))} wins!` : `${chip(faceOf(1))} It’s a tie! ${chip(faceOf(2))}`;
  } else if (oops) {
    t.innerHTML = `${chip(me)} Put it on a dot!`;
  } else if (match.passed) {
    t.innerHTML = `${chip(faceOf(match.passed), 'sad')} <span class="pass">No move for ${nameOf(faceOf(match.passed))}, so ${nameOf(me)} goes again.</span>`;
  } else if (robotsTurn()) {
    t.innerHTML = `${chip('robot')} Robot is thinking…`;
  } else {
    t.innerHTML = `${chip(me)} ${nameOf(me)}’s turn`;
  }

  const discs = discCounts(match.board);
  for (const p of [1, 2]) {
    const mood = moods?.[p] ?? 'normal';
    const el = $(`s${p}Chip`);
    el.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    // Only redrawn when the face changes, so a running wiggle isn't restarted.
    const key = `${faceOf(p)}/${mood}`;
    if (el.dataset.face !== key) { el.innerHTML = svg(faceOf(p), mood); el.dataset.face = key; }
    const d = $(`s${p}Disc`);
    if (d.dataset.colour !== colourOf(p)) { d.innerHTML = chipDisc(colourOf(p)); d.dataset.colour = colourOf(p); }
    $(`s${p}`).textContent = discs[p];
    $(`s${p}Who`).textContent = nameOf(faceOf(p));
  }
  $('side1').classList.toggle('now', !r && match.turn === 1);
  $('side2').classList.toggle('now', !r && match.turn === 2);
  $('sc2').innerHTML = `<span class="lbl">Games<br>won</span>`
    + [1, 2].map(p => `<span class="w"><span class="chip">${svg(faceOf(p))}</span>${match.scores[p]}</span>`).join('');
  resume.keep();
}

$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => {
  cancelTimers();
  stopCheer();
  stopOops();
  L('new game');
  match = null;
  busy = false;
  aim = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  setWide(false);
  renderSetup();
  scrollTo(0, 0);
};

// The game kept last time, as it was left; the robot makes its move
// again; a finished round shows its smiling and "aww" faces.
function restore() {
  const kept = resume.saved;
  if (!kept) return false;
  try {
    mergeSetup(setup, kept.setup);
    if (kept.screen !== 'play') { renderSetup(); return true; }
    match = kept.match;
    if (!SIZES.includes(match.size) || match.board.n !== match.size || match.board.cells.length !== match.size ** 2) throw new Error('not a board');
    if (match.result) moods = endMoods(match.result.winner);
    showPlay();
    render();
    fitBoard();
    maybeRobot();
    L('resumed', { faces: match.faces, size: match.size, discs: discCounts(match.board), turn: match.turn, result: match.result, scores: match.scores });
    return true;
  } catch (e) {
    L('resume failed: a new game', { error: String(e) });
    resume.clear();
    cancelTimers();
    busy = false;
    match = null;
    moods = null;
    $('play').hidden = true;
    $('setup').hidden = false;
    setWide(false);
    return false;
  }
}

startLog('reversi');
restore() || renderSetup();
