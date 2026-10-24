// Dots and Boxes screens (setup and play). Built from the Nim screens
// (same setup, turn line, robot pace and cheers) with matching cards' two
// scorecards; the rules live in src/core/dots-boxes.js; this file only
// draws and handles taps.

import {
  FACE_NAMES, FIRST_RULES, LEVELS, SIZES, checkFaces, createMatch, newRound, draw, boxCounts,
  nearestLine, robotMove,
} from '../core/dots-boxes.js';
import { endMoods, endSound, nameOf, twoPlayerFaces } from '../core/players.js';
import { mergeSetup } from '../core/resume.js';
import { svg, pickerFace } from './faces.js';
import { MARGIN, viewBox, sameLine as same, lineSvg, boardContent, miniSvg, dotsSvg } from './dbboard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';
import { resumable } from './resume.js';

// The robot at a person's pace: it thinks, shows its line faintly for a
// moment, then draws it; a little quicker when it goes again.
const ROBOT_WAIT = { think: 800, again: 600, show: 450 };
const CHEER_MS = 2800;   // the end-of-round scorecard cheer (css: .cheer-win)
const MIN_CELL = 30, MAX_CELL = 90;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('dots-boxes', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt', level: 'easy', size: 5 };

let match = null;   // from createMatch, while on the play screen
let busy = false;   // the robot moving: no taps
let timers = [];    // pending robot steps, so they can be cancelled
let aim = null;     // the line under the finger, shown faintly until it lifts
let fresh = [];     // boxes just won, as "r:c": their faces pop in once
// The end of a round on the scorecard, as in the other games.
let moods = null;
let cheering = false;
let cheerTimer = null;

// Kept on the device after every change, and picked up when the page
// opens (DESIGN.md "Coming back to a game").
const resume = resumable('dots-boxes', 1, () => ({ screen: match ? 'play' : 'setup', setup, match }));

const WHY = {
  'p1-missing': () => (setup.vsRobot ? 'Pick your face first.' : 'Player 1 needs a face.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

// The setup screen's pictures: a 3 x 3 corner of a game under way (with
// the faces picked), and the two sizes' dots.
function drawPictures() {
  const [p1, p2] = twoPlayerFaces(setup.p1, setup.vsRobot ? null : setup.p2);
  $('mini').innerHTML = miniSvg([p1, setup.vsRobot ? 'robot' : p2]);
  for (const n of SIZES) $(`size${n}`).innerHTML = dotsSvg(n);
}

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
  // Against the robot there's no player 2 to pick for; two players have no
  // robot to make easy or hard.
  $('p2Panel').hidden = vs;
  $('levelPanel').hidden = !vs;
  fillPicker($('p1Faces'), setup.p1, vs ? null : setup.p2, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = !vs && setup.p2 ? svg(setup.p2) : '';
  drawPictures();
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code]() : '';
  resume.keep();
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

// The play screen's box size: the biggest that lets the whole page fit the
// screen, up to what the width allows (at most 520px of board).
function fitBoard() {
  const play = $('play');
  const span = match.size + 2 * MARGIN;
  play.style.setProperty('--span', span);
  // The page column's width (main), not the play screen's: a board too
  // wide for the screen would stretch the play screen it's measured from.
  const width = Math.min(document.querySelector('main').clientWidth, 520);
  const maxCell = Math.min(MAX_CELL, width / span);
  const r = fitPlayScreen(px => {
    play.style.setProperty('--cell', `${px}px`);
  }, Math.min(MIN_CELL, maxCell), maxCell);
  L('fit', { ...r, size: match.size });
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitBoard(); });

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
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

function startRound() {
  cancelTimers();
  stopCheer();
  const midRound = !match.result && match.last !== null;
  newRound(match);
  busy = false;
  aim = null;
  fresh = [];
  L(midRound ? 'round restarted (not scored)' : 'round started', { starter: match.starter, starterFace: faceOf(match.starter), size: match.size });
  render();
  maybeRobot();
}

// The player whose turn it is draws a line ('person' or 'robot').
function drawLine(line, who) {
  const player = match.turn;
  const r = draw(match, line);
  if (!r.ok) { L('line refused', { line, why: r.why, who }); return; }
  const boxes = boxCounts(match.board);
  L('line', { player, face: faceOf(player), line, closed: r.closed, boxes, again: match.again, who });
  sound.play('tick');
  if (r.closed.length) sound.play('ding', 0.12);
  fresh = r.closed.map(([br, bc]) => `${br}:${bc}`);
  aim = null;
  if (match.result) {
    L('round won', { winner: faceOf(match.result.winner), boxes, scores: match.scores, nextStarter: faceOf(match.starter) });
    busy = false;
    sound.play(endSound(match.result.winner, { vsRobot: match.vsRobot }), 0.4);
    startCheer(match.result.winner);
    render();
    return;
  }
  busy = false;
  render();
  if (who === 'robot' && !robotsTurn()) sound.play('ping', 0.3);   // your turn, after the robot's
  maybeRobot();
}

function maybeRobot() {
  if (!match || !robotsTurn() || match.result) return;
  busy = true;
  renderStatus();
  later(match.again ? ROBOT_WAIT.again : ROBOT_WAIT.think, () => {
    const m = robotMove(match.board, match.level);
    L('robot chose', { line: m.line, reason: m.reason, gives: m.gives, level: match.level });
    aim = m.line;
    renderAim();
    later(ROBOT_WAIT.show, () => drawLine(m.line, 'robot'));
  });
}

/* ---------- a finger on the board ---------- */

// Where a pointer is on the board, in boxes from the top-left dot.
function boardPoint(e) {
  const rect = $('board').getBoundingClientRect();
  const span = match.size + 2 * MARGIN;
  return { x: (e.clientX - rect.left) / rect.width * span - MARGIN, y: (e.clientY - rect.top) / rect.height * span - MARGIN };
}
function aimAt(e) {
  const { x, y } = boardPoint(e);
  const l = nearestLine(match.board, x, y);
  if (!same(l, aim)) { aim = l; renderAim(); }
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
  aimAt(e);
  if (aim) drawLine(aim, 'person');
  else L('tap: no line near', boardPoint(e));
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

/* ---------- drawing the play screen ---------- */

function render() {
  renderBoard();
  renderStatus();
}

// Only the robot's last line blinks, so it's easy to see where it went
// (developer, 2026-10-24: useful for the robot's line, "not needed for
// the play": a person's own line is just drawn).
function renderBoard() {
  const r = match.result;
  const l = match.last;
  const robotLast = match.vsRobot && l && match.board[l.k][l.r][l.c] === 2 ? l : null;
  board.setAttribute('viewBox', viewBox(match.size));
  board.innerHTML = boardContent(match.board, { faces: match.faces, last: robotLast, fresh, win: r ? r.winner : 0, guides: !r });
  fresh = [];
  renderAim();
}

// The line under the finger (or the robot's, just before it draws it),
// faint, in the colour of whose turn it is.
function renderAim() {
  board.querySelector('.pv')?.remove();
  if (aim) board.insertAdjacentHTML('beforeend', lineSvg(aim, match.turn, 'pv'));
}

// The turn line and the two scorecards.
function renderStatus() {
  const r = match.result;
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '');
  const chip = (face, mood) => `<span class="chip">${svg(face, mood)}</span>`;
  if (r) t.innerHTML = `${chip(faceOf(r.winner), 'winner')} ${nameOf(faceOf(r.winner))} wins!`;
  else if (match.again) t.innerHTML = `${chip(faceOf(match.turn), 'winner')} Another turn!`;
  else if (robotsTurn()) t.innerHTML = `${chip('robot')} Robot is thinking…`;
  else t.innerHTML = `${chip(faceOf(match.turn))} ${nameOf(faceOf(match.turn))}’s turn`;

  const boxes = boxCounts(match.board);
  for (const p of [1, 2]) {
    const mood = moods?.[p] ?? 'normal';
    const el = $(`s${p}Chip`);
    el.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    // Only redrawn when the face changes, so a running wiggle isn't restarted.
    const key = `${faceOf(p)}/${mood}`;
    if (el.dataset.face !== key) { el.innerHTML = svg(faceOf(p), mood); el.dataset.face = key; }
    $(`s${p}`).textContent = boxes[p];
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
  L('new game');
  match = null;
  busy = false;
  aim = null;
  $('play').hidden = true;
  $('setup').hidden = false;
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
    if (!SIZES.includes(match.size) || match.board.n !== match.size) throw new Error('not a board');
    if (match.result) moods = endMoods(match.result.winner);
    showPlay();
    render();
    fitBoard();
    maybeRobot();
    L('resumed', { faces: match.faces, size: match.size, boxes: boxCounts(match.board), turn: match.turn, result: match.result, scores: match.scores });
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
    return false;
  }
}

startLog('dots-boxes');
restore() || renderSetup();
