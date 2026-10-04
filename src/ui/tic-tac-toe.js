// Tic-tac-toe screens (setup and play), from the agreed mockup v2.
// The rules live in src/core/tic-tac-toe.js; this file only draws and
// handles taps.

import {
  FACE_NAMES, FIRST_RULES, checkFaces, createMatch, newRound, place, robotMove,
} from '../core/tic-tac-toe.js';
import { svg } from './faces.js';
import { log, installDebugPanel, withDev } from './debuglog.js';

const ROBOT_THINK_MS = 800;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('ttt', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt' };

let match = null;        // from createMatch, while on the play screen
let robotTimer = null;   // the robot's pending move, so it can be cancelled
let justPlaced = null;   // the square to "pop" in

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
  for (const b of document.querySelectorAll('.first')) {
    b.setAttribute('aria-pressed', String(b.dataset.rule === setup.firstRule));
  }
  const p1Pic = setup.p1 || 'girl';
  $('pairRobot').innerHTML = svg(p1Pic) + svg('robot');
  $('pairTwo').innerHTML = svg(p1Pic) + svg(setup.p2 && setup.p2 !== setup.p1 ? setup.p2 : (setup.p1 === 'boy' ? 'girl' : 'boy'));
  $('p1Title').textContent = vs ? 'Pick your face' : 'Player 1, pick a face';
  $('p2Title').textContent = vs ? 'You play the robot' : 'Player 2, pick a face';
  $('robotFixed').hidden = !vs;
  $('p2Faces').hidden = vs;
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
    b.innerHTML = svg(f);
    b.setAttribute('aria-label', f);
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

$('robotFace').innerHTML = svg('robot');
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
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !FIRST_RULES.includes(setup.firstRule)) return;
  match = createMatch(setup);
  L('match started', { faces: match.faces, firstRule: match.firstRule });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startRound();
};

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
const robotThinking = () => robotTimer !== null;

function cancelRobot() {
  if (robotTimer !== null) { clearTimeout(robotTimer); robotTimer = null; L('robot move cancelled'); }
}

function startRound() {
  cancelRobot();
  const midRound = match.board.some(Boolean) && !match.result;
  newRound(match);
  justPlaced = null;
  L(midRound ? 'round restarted (not scored)' : 'round started', { starter: match.starter, starterFace: faceOf(match.starter) });
  renderPlay();
  maybeRobot();
}

function take(square, who) {
  const player = match.turn;
  const r = place(match, square);
  if (!r.ok) { L('move refused', { square, why: r.why, who }); return; }
  justPlaced = square;
  L('move', { player, face: faceOf(player), square, who });
  if (match.result) {
    const { winner, line } = match.result;
    L(winner ? 'round won' : 'round tied', {
      winner: winner ? faceOf(winner) : null, line, scores: match.scores, nextStarter: faceOf(match.starter),
    });
  }
  renderPlay();
  maybeRobot();
}

function tap(square) {
  if (!match || match.result || robotThinking()) return;
  if (match.vsRobot && match.turn === 2) return;
  take(square, 'person');
}

function maybeRobot() {
  if (!match.vsRobot || match.result || match.turn !== 2) return;
  robotTimer = setTimeout(() => {
    robotTimer = null;
    const m = robotMove(match.board, 2);
    L('robot chose', m);
    take(m.square, 'robot');
  }, ROBOT_THINK_MS);
  renderPlay();
}

function renderPlay() {
  const r = match.result;
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '');
  if (r && r.winner) t.innerHTML = `<span class="chip">${svg(faceOf(r.winner), 'winner')}</span> wins!`;
  else if (r) t.textContent = "It's a tie!";
  else if (robotThinking()) t.innerHTML = `<span class="chip">${svg('robot')}</span> is thinking…`;
  else t.innerHTML = `<span class="chip">${svg(faceOf(match.turn))}</span> ${match.vsRobot && match.turn === 1 ? 'your turn' : '’s turn'}`;

  const bd = $('board');
  bd.className = 'board' + (r && r.winner ? ' done' : '') + (r && !r.winner ? ' tie' : '');
  bd.replaceChildren(...match.board.map((v, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    const won = !!r && r.line.includes(i);
    c.className = 'cell' + (v ? ' o' + v : '') + (won ? ' win' : '');
    c.setAttribute('aria-label', v ? `square ${i + 1}: ${faceOf(v)}` : `square ${i + 1}, empty`);
    if (v) c.innerHTML = `<span class="mark${i === justPlaced && !won ? ' new' : ''}">${svg(faceOf(v), won ? 'winner' : 'normal')}</span>`;
    c.disabled = !!v || !!r || robotThinking() || (match.vsRobot && match.turn === 2);
    c.onclick = () => tap(i);
    return c;
  }));

  $('s1Chip').innerHTML = svg(faceOf(1));
  $('s2Chip').innerHTML = svg(faceOf(2));
  $('s1').textContent = match.scores[1];
  $('s2').textContent = match.scores[2];
  $('sT').textContent = match.scores.ties;
  $('s1Who').textContent = match.vsRobot ? 'You' : 'Player 1';
  $('s2Who').textContent = match.vsRobot ? 'Robot' : 'Player 2';
  $('side1').classList.toggle('now', !r && match.turn === 1);
  $('side2').classList.toggle('now', !r && match.turn === 2);
}

$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => {
  cancelRobot();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

for (const a of document.querySelectorAll('.homebtn')) a.href = withDev(a.getAttribute('href'));
installDebugPanel('tic-tac-toe');
renderSetup();
