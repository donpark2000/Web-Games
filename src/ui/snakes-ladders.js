// Snakes and Ladders screens (setup and play), from mockup v3. The setup
// screen, scoreboard and cheers are Connect Four's; the rules live in
// src/core/snakes-ladders.js; this file only draws, keeps time and handles
// taps.

import {
  COLS, ROWS, GOAL, FACE_NAMES, FIRST_RULES, numAt, centre, boardTotals, checkFaces, createMatch, newRound, move, rollDie,
} from '../core/snakes-ladders.js';
import { endMoods } from '../core/players.js';
import { svg } from './faces.js';
import { boardArtSvg, snakePoints, dotsSvg, cubeSvg } from './snlart.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';

// Timings (mockup v3).
const THINK_MS = 800;    // the robot "is thinking..." before it rolls
const ROLL_MS = 650;     // the die tumbles
const PAUSE_MS = 600;    // after the roll shows, and before the next turn
const HOP_MS = 300;      // one square per dot
const JUMP_PAUSE_MS = 350;
const CLIMB_MS = 900;
const SLIDE_MS = 1300;
const CHEER_MS = 2800;   // the end-of-round scorecard cheer (css: .cheer-win)
const PAD = 6;           // css: --snlpad
const MIN_SQ = 36;       // smaller squares than this: the page scrolls instead
const RING = { 1: '#F2724F', 2: '#3A94D4' };   // css: --p1, --p2
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('snl', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { vsRobot: true, p1: 'bear', p2: null, firstRule: 'alt' };

let match = null;        // from createMatch, while on the play screen
let busy = false;        // a roll or a move is being shown: the die can't be tapped
let timers = [];         // every pending step, so Play again / New game can stop them
let spin = null;         // the die's tumble (an interval)
// Each piece's face: 'winner' while climbing a ladder; 'sad' after a snake,
// until that player's next turn (developer, 2026-10-05).
const pieceMood = { 1: 'normal', 2: 'normal' };
// The end of a round on the scorecard, as in the other games.
let moods = null;
let cheering = false;

const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); fn(); }, ms); timers.push(t); };
function stopAll() {
  if (timers.length) L('pending steps cancelled', { count: timers.length });
  timers.forEach(clearTimeout);
  timers = [];
  if (spin !== null) { clearInterval(spin); spin = null; }
  busy = false;
}

const WHY = {
  'p1-missing': () => (setup.vsRobot ? 'Pick your face first.' : 'Player 1 needs a face.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

/* ---------- setup screen (Connect Four's) ---------- */

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
  $('p2Panel').hidden = vs;
  fillPicker($('p1Faces'), setup.p1, vs ? null : setup.p2, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = !vs && setup.p2 ? svg(setup.p2) : '';
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code]() : '';
}

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
  fitBoard();
};

// The square size: the biggest that lets the whole page fit the screen, up
// to what the width allows (board at most 520px). The 🏠 and the die follow
// it (at least 48px).
function fitBoard() {
  const play = $('play');
  const maxSq = (Math.min(play.clientWidth, 520) - 2 * PAD) / COLS;
  const r = fitPlayScreen(px => {
    play.style.setProperty('--sq', `${px}px`);
    play.style.setProperty('--home', `${Math.max(48, px)}px`);
  }, Math.min(MIN_SQ, maxSq), maxSq);
  L('fit', r);
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitBoard(); });

/* ---------- play screen ---------- */

const faceOf = p => match.faces[p - 1];
const robotsTurn = () => match.vsRobot && match.turn === 2;
const pieces = {};
for (const p of [1, 2]) { const el = document.createElement('div'); el.className = `piece p${p}`; pieces[p] = el; }

function turnLine(chipHtml, words, pop) {
  const t = $('turn');
  t.innerHTML = (chipHtml ? `<span class="chip">${chipHtml}</span>` : '') + `<span class="say">${words}</span>`;
  t.classList.remove('pop');
  if (pop) { void t.offsetWidth; t.classList.add('pop'); }
}
function setPieceMood(p, mood) {
  pieceMood[p] = mood;
  pieces[p].innerHTML = svg(faceOf(p), mood);
}
// A piece's place, in % of the board (0-100 across and down).
function placeXY(p, x, y) { pieces[p].style.left = `${(x / COLS) * 100}%`; pieces[p].style.top = `${(y / ROWS) * 100}%`; }
function placeAt(p) {
  const c = centre(match.pos[p]), shared = match.pos[1] === match.pos[2];
  pieces[p].classList.toggle('shared', shared);
  placeXY(p, c.x + (shared ? (p === 1 ? -0.2 : 0.2) : 0), c.y + (shared ? 0.08 : 0));
}
function placeBoth() { placeAt(1); placeAt(2); }
function lit(n) { for (const s of document.querySelectorAll('.sq')) s.classList.toggle('lit', Number(s.dataset.n) === n); }

function dieCube(p) {
  const d = $('die');
  d.className = `die cube p${p}`;
  d.innerHTML = cubeSvg(RING[p]);
  d.setAttribute('aria-label', 'Roll the die');
}
function dieDots(p, n) {
  const d = $('die');
  d.className = `die p${p}`;
  d.innerHTML = dotsSvg(n);
  d.setAttribute('aria-label', `The die shows ${n}`);
}

function startCheer(winner) {
  moods = endMoods(winner);
  cheering = true;
  L('scorecard cheer', { moods: { [faceOf(1)]: moods[1], [faceOf(2)]: moods[2] } });
  later(() => { cheering = false; renderScores(); }, CHEER_MS);
}

function startRound() {
  stopAll();
  moods = null;
  cheering = false;
  const midRound = match.moves > 0 && !match.result;
  newRound(match);
  const { gain, loss } = boardTotals(match.board);
  L(midRound ? 'round restarted (not scored)' : 'round started', {
    starter: faceOf(match.starter), ladders: match.board.ladders, snakes: match.board.snakes, gain, loss, boardTries: match.board.tries,
  });
  for (const p of [1, 2]) { pieces[p].classList.remove('win', 'now'); setPieceMood(p, 'normal'); }
  renderBoard();
  placeBoth();
  renderScores();
  nextTurn();
}

// The squares, in screen order (top row first), then the ladders and
// snakes, then the pieces.
function renderBoard() {
  let html = '';
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const n = numAt(r, c);
      const corner = r === ROWS - 1 ? (c === 0 ? ' tl' : c === COLS - 1 ? ' tr' : '') : r === 0 ? (c === 0 ? ' bl' : c === COLS - 1 ? ' br' : '') : '';
      html += `<div class="sq${(r + c) % 2 ? ' alt' : ''}${n === GOAL ? ' goal' : ''}${corner}" data-n="${n}">`
        + `<span class="n">${n}</span>${n === GOAL ? '<span class="cup">🏆</span>' : ''}</div>`;
    }
  }
  const grid = document.createElement('div');
  grid.className = 'grid';
  grid.innerHTML = html + boardArtSvg(match.board, COLS);
  grid.append(pieces[1], pieces[2]);
  $('board').replaceChildren(grid);
}

// The die waits as a cube in the colour of whose turn it is. A face that
// slid down a snake is sad until its own next turn.
function nextTurn() {
  const p = match.turn;
  if (pieceMood[p] !== 'normal') setPieceMood(p, 'normal');
  for (const q of [1, 2]) pieces[q].classList.toggle('now', q === p);
  dieCube(p);
  renderScores();
  busy = robotsTurn();
  $('die').disabled = busy;
  if (robotsTurn()) {
    turnLine(svg('robot'), 'is thinking…', true);
    $('die').classList.add('think');
    later(roll, THINK_MS);
  } else {
    turnLine(svg(faceOf(p)), match.vsRobot ? 'your turn. Tap the die!' : '’s turn. Tap the die!', true);
  }
}

function tapDie() {
  if (!match || match.result) return L('die tap ignored', { why: 'round over' });
  if (busy) return L('die tap ignored', { why: robotsTurn() ? "robot's turn" : 'still moving' });
  roll();
}

// The die tumbles and lands; then the piece hops one square per dot, a dot
// going from the die each hop. Extra dots take it back from the goal.
function roll() {
  busy = true;
  $('die').disabled = true;
  const p = match.turn, from = match.pos[p], who = robotsTurn() ? 'robot' : 'person', n = rollDie();
  const r = move(match, n);
  if (!r.ok) { L('move refused', { why: r.why }); busy = false; return; }
  L('roll', { player: faceOf(p), who, roll: n, from, path: r.path, bounced: r.bounced, jump: r.jump, at: r.at });
  dieDots(p, 1);
  $('die').classList.add('rolling');
  spin = setInterval(() => { $('die').innerHTML = dotsSvg(1 + Math.floor(Math.random() * 6)); }, 90);
  later(() => {
    clearInterval(spin);
    spin = null;
    dieDots(p, n);
    turnLine(svg(faceOf(p)), `rolled <b>${n}</b>`, true);
    later(() => hop(r, 0), PAUSE_MS);
  }, ROLL_MS);
}

// The pieces are moved through the squares the rules already worked out
// (r.path), so what's shown always matches match.pos.
function hop(r, k) {
  const p = r.player;
  if (k === r.path.length) return landed(r);
  const sq = r.path[k], back = k > 0 && sq < r.path[k - 1];
  showAt(p, sq);
  pieces[p].classList.remove('hop'); void pieces[p].offsetWidth; pieces[p].classList.add('hop');
  dieDots(p, r.roll - k - 1);
  turnLine(back ? '' : svg(faceOf(p)), back ? `Too many! Back <b>${k + 1}</b>` : `<b>${k + 1}</b>`);
  later(() => hop(r, k + 1), HOP_MS);
}
// Shows piece p on square n while it moves (match.pos already holds where
// it ends up).
function showAt(p, n) {
  const other = 3 - p, shared = match.pos[other] === n;
  const c = centre(n), co = centre(match.pos[other]);
  pieces[p].classList.toggle('shared', shared);
  pieces[other].classList.toggle('shared', shared);
  placeXY(p, c.x + (shared ? (p === 1 ? -0.2 : 0.2) : 0), c.y + (shared ? 0.08 : 0));
  placeXY(other, co.x + (shared ? (other === 1 ? -0.2 : 0.2) : 0), co.y + (shared ? 0.08 : 0));
}

function landed(r) {
  const p = r.player;
  if (r.result) return won(p);
  if (r.jump?.kind === 'ladder') {
    setPieceMood(p, 'winner');
    turnLine(svg(faceOf(p), 'winner'), 'Up the ladder!', true);
    lit(r.jump.to);
    return later(() => climb(r), JUMP_PAUSE_MS);
  }
  if (r.jump?.kind === 'snake') {
    setPieceMood(p, 'sad');
    turnLine(svg(faceOf(p), 'sad'), 'Wheee! Down the snake.', true);
    lit(r.jump.to);
    return later(() => slide(r), JUMP_PAUSE_MS);
  }
  endTurn();
}
// Happy while climbing; normal again at the top.
function climb(r) {
  const p = r.player;
  pieces[p].style.transition = `left ${CLIMB_MS}ms ease-in-out, top ${CLIMB_MS}ms ease-in-out`;
  placeBoth();
  later(() => { pieces[p].style.transition = ''; setPieceMood(p, 'normal'); lit(0); endTurn(); }, CLIMB_MS + 100);
}
// Down the snake's own wavy body, head to tail, on a timer (so a hidden
// page can't stall a turn; mockup v1's requestAnimationFrame did).
function slide(r) {
  const p = r.player, pts = snakePoints(r.jump.from, r.jump.to), t0 = Date.now();
  pieces[p].style.transition = 'none';
  const step = () => {
    const t = Math.min(1, (Date.now() - t0) / SLIDE_MS), e = t * t * (3 - 2 * t);
    const o = pts[Math.round(e * (pts.length - 1))];
    placeXY(p, o.x / 100, o.y / 100);
    if (t < 1) return later(step, 16);
    pieces[p].style.transition = '';
    placeBoth();
    lit(0);
    endTurn();
  };
  step();
}
function endTurn() { later(nextTurn, PAUSE_MS); }

// The winner's piece and scorecard face cheer; the other shows "aww".
function won(p) {
  busy = true;
  $('die').disabled = true;
  placeBoth();
  L('round won', { winner: faceOf(p), moves: match.moves, scores: { ...match.scores }, nextStarter: faceOf(match.starter) });
  turnLine(svg(faceOf(p), 'winner'), 'wins!', true);
  $('turn').classList.add('won');
  setPieceMood(p, 'winner');
  pieces[p].classList.add('win');
  setPieceMood(3 - p, 'sad');
  for (const q of [1, 2]) pieces[q].classList.remove('now');
  startCheer(p);
  renderScores();
}

function renderScores() {
  const r = match.result;
  for (const p of [1, 2]) {
    const mood = moods?.[p] ?? 'normal';
    const chip = $(`s${p}Chip`);
    chip.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    const key = `${faceOf(p)}/${mood}`;
    if (chip.dataset.face !== key) { chip.innerHTML = svg(faceOf(p), mood); chip.dataset.face = key; }
  }
  $('s1').textContent = match.scores[1];
  $('s2').textContent = match.scores[2];
  $('s1Who').textContent = match.vsRobot ? 'You' : 'Player 1';
  $('s2Who').textContent = match.vsRobot ? 'Robot' : 'Player 2';
  $('side1').classList.toggle('now', !r && match.turn === 1);
  $('side2').classList.toggle('now', !r && match.turn === 2);
}

$('die').onclick = tapDie;
$('againBtn').onclick = () => { L('play again'); $('turn').classList.remove('won'); startRound(); };
$('newBtn').onclick = () => {
  stopAll();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

startLog('snakes-ladders');
renderSetup();
