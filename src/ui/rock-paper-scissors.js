// Rock paper scissors screens (setup and play), from the agreed mockup v2.
// The rules live in src/core/rock-paper-scissors.js; this file only draws,
// keeps time (the countdown, the pauses between rounds) and handles taps.

import { PICKS, checkFaces, createMatch, newGame, newRound, unlock, choose } from '../core/rock-paper-scissors.js';
import { FACE_NAMES, endMoods, endSound, nameOf } from '../core/players.js';
import { svg, pickerFace } from './faces.js';
import { CARD_BACK } from './cardback.js';
import { PICTURES, SAYS } from './rpspics.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

const READY_MS = 1000;   // "Ready?" before a game's first round
const COUNT_MS = 700;    // per number of the 1, 2, 3
const SHOW_MS = 2500;    // a round's result before the next countdown
const SAME_MS = 1500;    // after "Same!"
const ACT_MS = 300;      // the cards turn over, then the winner acts it out
const CHEER_MS = 2800;   // the end-of-game scorecard cheer (css: .cheer-win)
const MIN_CARD = 80, MAX_CARD = 150;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('rps', msg, data);

const setup = { p1: 'bear' };
let match = null;
let timers = [];
let moods = null;        // the end of a game on the scorecard, kept until the next game
let cheering = false;    // the first 2.8 s of that

const later = (fn, ms) => timers.push(setTimeout(fn, ms));
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

/* ---------- setup screen ---------- */

const WHY = { 'p1-missing': 'Pick your face first.', 'unknown-face': 'Pick a face from the list.' };

function renderSetup() {
  $('p1Faces').replaceChildren(...FACE_NAMES.map(f => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'face';
    b.innerHTML = pickerFace(f);
    b.setAttribute('aria-label', nameOf(f));
    b.setAttribute('aria-pressed', String(f === setup.p1));
    b.onclick = () => { setup.p1 = f; L('p1 picked', { face: f }); renderSetup(); };
    return b;
  }));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('robotChip').innerHTML = svg('robot');
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code] : '';
}

$('playBtn').onclick = () => {
  if (checkFaces(setup)) return;
  match = createMatch(setup);
  L('match started', { faces: match.faces });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  for (const [id, f] of [['meFace', 0], ['botFace', 1], ['g1c', 0], ['g2c', 1]]) $(id).innerHTML = svg(match.faces[f]);
  $('meLbl').textContent = nameOf(match.faces[0]);
  $('botBack').innerHTML = CARD_BACK;
  startGame();
  fitCards();
};

// The biggest cards (and with them the picture buttons and faces) that let
// the whole page fit the screen, up to what the width allows.
function fitCards() {
  const play = $('play');
  const widest = Math.min(MAX_CARD, Math.floor((Math.min(play.clientWidth, 520) - 56 - 16) / 2));
  const r = fitPlayScreen(px => play.style.setProperty('--cs', `${px}px`), Math.min(MIN_CARD, widest), widest);
  play.style.setProperty('--home', `${Math.max(56, Math.round(r.size * 0.46))}px`);
  L('fit', r);
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitCards(); });

/* ---------- play screen ---------- */

const faceOf = p => match.faces[p - 1];
const chip = (face, mood = 'normal') => `<span class="chip">${svg(face, mood)}</span>`;

function turn(html, pop = false) {
  const t = $('turn');
  t.innerHTML = html;
  t.classList.remove('pop');
  if (pop) { void t.offsetWidth; t.classList.add('pop'); }
}
function setPicks(on, chosen = null) {
  for (const b of document.querySelectorAll('.pick')) {
    b.disabled = !on;
    b.classList.toggle('chosen', b.dataset.pick === chosen);
  }
}
function resetCards() {
  $('mySlot').className = 'slot mine empty';
  $('botSlot').className = 'slot robot';
  $('myPic').innerHTML = '';
  $('botPic').innerHTML = '';
  $('count').textContent = 'vs';
  $('botLbl').textContent = 'Robot';
  setPicks(false);
}

function renderScore(newStar = 0) {
  for (const p of [1, 2]) {
    $(`st${p}`).innerHTML = Array.from({ length: 3 }, (_, i) =>
      `<i class="${i < match.stars[p] ? 'on' : ''}${newStar === p && i === match.stars[p] - 1 ? ' new' : ''}">★</i>`).join('');
    const mood = moods?.[p] ?? 'normal';
    const el = $(`s${p}Chip`);
    el.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
    const key = `${faceOf(p)}/${mood}`;
    if (el.dataset.face !== key) { el.innerHTML = svg(faceOf(p), mood); el.dataset.face = key; }
    $(`g${p}`).textContent = match.games[p];
  }
}

// A game starts by itself: "Ready?", then the first round.
function startGame() {
  const midGame = match.rounds > 0 && !match.result;
  clearTimers();
  newGame(match);
  moods = null;
  cheering = false;
  L(midGame ? 'game restarted (not counted)' : 'game started', { games: { ...match.games } });
  resetCards();
  renderScore();
  turn(`${chip(faceOf(1))} Ready?`, true);
  later(startRound, READY_MS);
}

// The robot picks now, hidden; then 1, 2, 3, and only then can you pick.
function startRound() {
  resetCards();
  const robot = newRound(match);
  L('round', { n: match.rounds + 1, robotPicked: robot });
  $('botLbl').textContent = 'Picked! (hidden)';
  turn(`${chip('robot')} Robot has picked!`);
  [1, 2, 3].forEach((n, i) => later(() => {
    $('count').innerHTML = `<b class="tick">${n}</b>`;
    const slot = $('botSlot');
    slot.classList.remove('bob');
    void slot.offsetWidth;
    slot.classList.add('bob');
    if (n === 3) {
      unlock(match);
      setPicks(true);
      turn('Pick one!', true);
      L('pick now');
    }
  }, i * COUNT_MS));
}

// The moment you tap, the robot's card turns over.
function tap(pick) {
  if (!match) return;
  const r = choose(match, pick);
  if (!r.ok) { L('pick refused', { pick, why: r.why }); return; }
  L('picked', { mine: pick, robot: r.robot, winner: r.winner, stars: { ...match.stars } });
  sound.play('tick');
  sound.play('swish', 0.05);   // the robot's card turns over
  setPicks(false, pick);
  $('myPic').innerHTML = PICTURES[pick];
  $('botPic').innerHTML = PICTURES[r.robot];
  $('mySlot').className = 'slot mine shown';
  $('botSlot').className = 'slot robot shown';
  $('botLbl').textContent = 'Robot';
  $('count').textContent = 'vs';
  if (!r.winner) {
    turn('Same! Go again.', true);
    sound.play('tie', 0.2);
    later(startRound, SAME_MS);
    return;
  }
  later(() => {
    $(r.winner === 1 ? 'mySlot' : 'botSlot').classList.add('hit');
    $(r.winner === 1 ? 'botSlot' : 'mySlot').classList.add('hurt');
    sound.play(r.gameOver ? endSound(r.winner, { vsRobot: true }) : r.winner === 1 ? 'ding' : 'uhoh');
    if (r.gameOver) {
      moods = endMoods(r.winner);
      cheering = true;
      later(() => { cheering = false; renderScore(); }, CHEER_MS);
      turn(`${chip(faceOf(r.winner), 'winner')} ${nameOf(faceOf(r.winner))} wins!`, true);
      const w = $(`g${r.winner}w`);
      w.classList.remove('up');
      void w.offsetWidth;
      w.classList.add('up');
      L('game won', { winner: faceOf(r.winner), games: { ...match.games }, rounds: match.rounds, moods });
    } else {
      turn(SAYS[r.winner === 1 ? pick : r.robot], true);
      later(startRound, SHOW_MS);
    }
    renderScore(r.winner);
  }, ACT_MS);
}

for (const b of document.querySelectorAll('.pick')) b.onclick = () => tap(b.dataset.pick);
for (const el of document.querySelectorAll('[data-pic]')) el.innerHTML = PICTURES[el.dataset.pic];
$('againBtn').onclick = () => { L('play again'); startGame(); };
$('newBtn').onclick = () => {
  clearTimers();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

startLog('rock-paper-scissors');
renderSetup();
L('picks', { picks: PICKS });
