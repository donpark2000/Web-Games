// Count to 9 screens (setup and play). Built from the matching-cards and
// Connect Four screens (setup, turn line, scoreboard, cheers, the robot
// "thinking"); the rules live in src/core/count-to-9.js; this file only
// draws, keeps time and handles taps.

import {
  MODES, LEVELS, FIRST_RULES, ROBOT_TUNING, checkFaces, createMatch, newRound, flip, settle, robotPick,
} from '../core/count-to-9.js';
import { FACE_NAMES, endMoods, endSound } from '../core/players.js';
import { svg } from './faces.js';
import { CARD_BACK } from './cardback.js';
import { numberSvg } from './numbercard.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

const SHOW_MISS_MS = 1500;    // the wrong number flashes red this long (developer)
const ROBOT_THINK_MS = 800;   // before each card the robot turns over
const CHEER_MS = 2800;        // the end-of-round scorecard cheer (css: .cheer-win)
const GAP = 10;               // between cards (css: .grid)
const MIN_CARD = 56;          // smaller cards than this: the page scrolls instead
const MAX_CARD = 140;         // css: --cs
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('count', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { mode: 'robot', p1: 'bear', p2: null, level: 'easy', firstRule: 'alt' };

let match = null;          // from createMatch, while on the play screen
let missTimer = null;      // a wrong card is showing; settles when it fires
let robotTimer = null;     // the robot's next card, so it can be cancelled
let just = -1;             // the card just counted (it wiggles)
// The end of a round on the scorecard: `moods` (from endMoods) are kept
// until the next round; `cheering` is the first 2.8 s, while the winner's
// face also grows and wiggles.
let moods = null;
let cheering = false;
let cheerTimer = null;

const WHY = {
  'p1-missing': () => (setup.mode === 'two' ? 'Player 1 needs a face.' : 'Pick your face first.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

/* ---------- setup screen ---------- */

function renderSetup() {
  const mode = setup.mode;
  for (const b of document.querySelectorAll('.mode')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  for (const b of document.querySelectorAll('.level')) b.setAttribute('aria-pressed', String(b.dataset.level === setup.level));
  for (const b of document.querySelectorAll('.first')) b.setAttribute('aria-pressed', String(b.dataset.rule === setup.firstRule));
  const p1Pic = setup.p1 || 'girl';
  $('pairSolo').innerHTML = svg(p1Pic);
  $('pairRobot').innerHTML = svg(p1Pic) + svg('robot');
  $('pairTwo').innerHTML = svg(p1Pic) + svg(setup.p2 && setup.p2 !== setup.p1 ? setup.p2 : (setup.p1 === 'boy' ? 'girl' : 'boy'));
  $('p1Title').textContent = mode === 'two' ? 'Player 1, pick a face' : 'Pick your face';
  // Only two players need a second face, and someone to go first.
  $('p2Panel').hidden = mode !== 'two';
  $('firstPanel').hidden = mode === 'solo';
  fillPicker($('p1Faces'), setup.p1, mode === 'two' ? setup.p2 : null, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = mode === 'two' && setup.p2 ? svg(setup.p2) : '';

  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code]() : '';
}

// One button per face. The other player's face is greyed out: two players
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

for (const b of document.querySelectorAll('.mode')) {
  b.onclick = () => {
    setup.mode = b.dataset.mode;
    if (setup.mode === 'two' && setup.p2 === setup.p1) setup.p2 = null;
    L('mode', { mode: setup.mode });
    renderSetup();
  };
}
for (const b of document.querySelectorAll('.level')) {
  b.onclick = () => { setup.level = b.dataset.level; L('level', { level: setup.level }); renderSetup(); };
}
for (const b of document.querySelectorAll('.first')) {
  b.onclick = () => { setup.firstRule = b.dataset.rule; L('first rule', { rule: setup.firstRule }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !MODES.includes(setup.mode) || !LEVELS.includes(setup.level) || !FIRST_RULES.includes(setup.firstRule)) return;
  match = createMatch(setup);
  L('match started', { mode: match.mode, faces: match.faces, level: match.level, firstRule: match.firstRule,
    ...(match.mode === 'robot' && { robotRemembers: ROBOT_TUNING.remember[match.level] }) });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startRound();
  fitGrid();
};

// The play screen's card size: the biggest that lets the whole page fit
// the screen, up to what the width allows. The 🏠 is one card.
function fitGrid() {
  const play = $('play');
  const widest = Math.min(MAX_CARD, Math.floor((Math.min(play.clientWidth, 440) - 2 * GAP) / 3));
  const r = fitPlayScreen(px => {
    play.style.setProperty('--cs', `${px}px`);
    play.style.setProperty('--home', `${px}px`);
  }, Math.min(MIN_CARD, widest), widest);
  L('fit', r);
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitGrid(); });

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
const chip = (face, mood = 'normal') => `<span class="chip">${svg(face, mood)}</span>`;
const robotThinking = () => robotTimer !== null;
const robotsTurn = () => match.mode === 'robot' && match.turn === 2;

function cancelTimers() {
  if (missTimer !== null) { clearTimeout(missTimer); missTimer = null; L('wrong card dropped'); }
  if (robotTimer !== null) { clearTimeout(robotTimer); robotTimer = null; L('robot move cancelled'); }
}

function startCheer(winner) {
  stopCheer();
  moods = endMoods(winner, { solo: match.mode === 'solo' });
  cheering = true;
  L('scorecard faces', moods);
  cheerTimer = setTimeout(() => { cheerTimer = null; cheering = false; if (match) render(); }, CHEER_MS);
}
function stopCheer() {
  if (cheerTimer !== null) clearTimeout(cheerTimer);
  cheerTimer = null;
  cheering = false;
  moods = null;
}

function startRound() {
  const midRound = match.up.some(Boolean) && !match.result;
  cancelTimers();
  stopCheer();
  newRound(match);
  just = -1;
  L(midRound ? 'round restarted (not scored)' : 'round started', {
    level: match.level, starter: match.mode === 'solo' ? null : faceOf(match.starter), deck: match.deck,
  });
  buildGrid();
  buildScoreboard();
  render();
  maybeRobot();
}

function buildGrid() {
  $('grid').replaceChildren(...match.deck.map((n, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'cardb';
    c.innerHTML = `<span class="in"><span class="back">${CARD_BACK}</span><span class="front">${numberSvg(n)}</span></span>`;
    c.onclick = () => tap(i);
    return c;
  }));
}

function buildScoreboard() {
  const solo = match.mode === 'solo';
  $('sc').classList.toggle('solo', solo);
  $('mid').hidden = solo;
  for (const p of [1, 2]) delete $(`s${p}Chip`).dataset.face;
  if (solo) {
    $('s2Chip').innerHTML = '🏆';
    $('s2Chip').dataset.face = 'trophy';
  }
}

function turnOver(i, who) {
  const player = match.turn;
  const r = flip(match, i);
  if (!r.ok) { L('flip refused', { card: i, why: r.why, who }); return; }
  L(r.correct ? 'counted' : 'wrong number', {
    card: i, number: r.number, player: match.mode === 'solo' ? 1 : faceOf(player), who,
    ...(match.mode === 'robot' ? { robotRemembers: match.seen.filter(Boolean).length } : {}),
  });
  just = r.correct ? i : -1;
  sound.play('swish');
  if (!r.result) sound.play(r.correct ? 'ding' : 'uhoh', 0.15);
  if (r.result) endRound(r.result);
  else if (!r.correct) missTimer = setTimeout(settleNow, SHOW_MISS_MS);
  render();
  if (r.correct) maybeRobot();
}

function tap(i) {
  if (!match || match.result || match.pending || robotThinking() || robotsTurn()) return;
  turnOver(i, 'person');
}

function settleNow() {
  missTimer = null;
  const r = settle(match);
  if (!r.ok) { L('settle refused', { why: r.why }); return; }
  L(r.reset ? 'all cards back, count from 1' : 'wrong card back', {
    next: match.next, turn: match.mode === 'solo' ? null : faceOf(r.turn), turns: match.turns,
  });
  just = -1;
  // The robot missed: your turn ("your turn" after the robot's steps).
  if (match.mode === 'robot' && r.turn === 1) sound.play('ping');
  render();
  maybeRobot();
}

// The robot turns its cards over one at a time, "thinking" before each.
function maybeRobot() {
  if (!match || !robotsTurn() || match.result || match.pending || robotThinking()) return;
  robotTimer = setTimeout(() => {
    robotTimer = null;
    const m = robotPick(match);
    L('robot chose', { ...m, looking: match.next });
    turnOver(m.card, 'robot');
  }, ROBOT_THINK_MS);
  render();
}

function endRound({ winner, turns }) {
  if (match.mode === 'solo') L('counted to 9', { turns, level: match.level, best: match.best[match.level] });
  else L('round won', { winner: faceOf(winner), wins: { ...match.wins }, nextStarter: faceOf(match.starter) });
  sound.play(endSound(winner, { vsRobot: match.mode === 'robot', solo: match.mode === 'solo' }), 0.15);
  startCheer(winner);
}

function render() {
  const r = match.result;
  const solo = match.mode === 'solo';
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '') + (match.pending ? ' oops' : '');
  const want = `<span class="want">${match.next}</span>`;
  if (r && solo) t.innerHTML = `${chip(faceOf(1), 'winner')} 1 to 9 in ${r.turns} ${r.turns === 1 ? 'turn' : 'turns'}!`;
  else if (r) t.innerHTML = `${chip(faceOf(r.winner), 'winner')} wins!`;
  else if (match.pending) t.textContent = 'Oops!';
  else if (robotThinking()) t.innerHTML = `${chip('robot')} is thinking…`;
  else if (solo) t.innerHTML = `Find ${want}`;
  else t.innerHTML = `${chip(faceOf(match.turn))} find ${want}`;

  const locked = !!r || !!match.pending || robotThinking() || robotsTurn();
  [...$('grid').children].forEach((c, i) => {
    const up = match.up[i];
    const bad = i === match.wrong;
    c.className = 'cardb' + (up ? ' up' : '') + (up && !bad ? ` found f${match.by[i]}` : '') + (bad ? ' bad' : '') + (i === just ? ' just' : '');
    c.disabled = up || locked;
    c.setAttribute('aria-label', up ? `card ${i + 1}: ${match.deck[i]}` : `card ${i + 1}, face down`);
  });

  for (const p of solo ? [1] : [1, 2]) {
    const mood = moods?.[p] ?? 'normal';
    const el = $(`s${p}Chip`);
    el.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    // Only redrawn when the face changes, so a running wiggle isn't restarted.
    const key = `${faceOf(p)}/${mood}`;
    if (el.dataset.face !== key) { el.innerHTML = svg(faceOf(p), mood); el.dataset.face = key; }
  }
  if (solo) {
    const best = match.best[match.level];
    $('s1').textContent = match.turns + (r ? 0 : 1);   // the turn being played counts
    $('s1Who').textContent = r ? 'turns' : 'turn';
    $('s2').textContent = best === undefined ? '—' : best;
    $('s2Who').textContent = `best (${match.level})`;
  } else {
    $('s1').textContent = match.wins[1];
    $('s2').textContent = match.wins[2];
    $('s1Who').textContent = match.mode === 'robot' ? 'You' : 'Player 1';
    $('s2Who').textContent = match.mode === 'robot' ? 'Robot' : 'Player 2';
  }
  $('side1').classList.toggle('now', !solo && !r && match.turn === 1);
  $('side2').classList.toggle('now', !solo && !r && match.turn === 2);
}

$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => {
  cancelTimers();
  stopCheer();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

startLog('count-to-9');
renderSetup();
