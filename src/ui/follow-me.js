// Follow Me screens (setup and play), from the agreed mockup (v1-v2) and
// the grid sizes agreed for v3 (2026-10-09). The rules live in
// src/core/follow-me.js; this file only draws, keeps time (the robot
// showing the order, the pauses) and handles taps.

import {
  FACE_NAMES, SIZES, DEFAULT_SIZE, LEVELS, ARRANGEMENTS, padsFor, speed, bestKey, checkFaces,
  createMatch, newGame, addStep, showAgain, yourTurn, tap,
} from '../core/follow-me.js';
import { endMoods, endSound, nameOf } from '../core/players.js';
import { svg, pickerFace } from './faces.js';
import { padStyle } from './fmpads.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

const READY_MS = 1000;    // "Ready?" before the first step
// After a right order, 3 s of quiet from your last note to the robot's
// first: "Yes! 3!" 2 s, then "Watch me!" 1 s, a clear "get ready" each
// time the robot starts (developer, 2026-10-09; 2 s still felt fast).
const LEAD_MS = 1000;     // "Watch me!", then the first pad lights
const YES_MS = 2000;      // "Yes! 3!" before the robot adds a step
const AGAIN_MS = 2000;    // a miss (shake, the right pad blinks) before the robot shows it again
const OVER_MS = 1300;     // a miss, then the end of the game
const BANNER_MS = 2000;   // a miss, then the "Game over" banner (after the right pad's blink)
const TAP_LIT_MS = 260;   // a tapped pad stays lit this long
const MISS_MS = 1800;     // the shake and the blink (css: .miss, .hint)
const CHEER_MS = 2800;    // the end-of-game scorecard cheer (css: .cheer-win)
const PAD_GAP = 12;       // css: --pgap
const MIN_PAD = 56, MAX_PAD = 200;
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('follow-me', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { p1: 'bear', size: DEFAULT_SIZE, level: 'easy' };
// The best scores for this visit, per size and level (src/core: bestKey).
const best = {};

let match = null;        // from createMatch, while on the play screen
let timers = [];         // the robot's steps and the pauses, so Play again / New game can stop them
const padTimers = new Map();   // pad -> the timer that puts out its light
let lastLayout = '';

const later = (fn, ms) => timers.push(setTimeout(fn, ms));
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
  padTimers.forEach(clearTimeout);
  padTimers.clear();
}
const levelWord = level => (level === 'easy' ? 'Easy' : 'Hard');

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
  // The 4 pads in small, as they'll be (never your own face).
  $('mini4').innerHTML = padsFor(4, setup.p1).map(p => `<span style="${padStyle(p.color)}">${svg(p.face)}</span>`).join('');
  for (const b of document.querySelectorAll('.size')) b.setAttribute('aria-pressed', String(Number(b.dataset.size) === setup.size));
  for (const b of document.querySelectorAll('.level')) b.setAttribute('aria-pressed', String(b.dataset.level === setup.level));
  const code = checkFaces(setup);
  $('playBtn').disabled = !!code;
  $('why').textContent = code ? WHY[code] : '';
}

// Each "How many faces?" button: a small grid of that many pads, laid out
// as on an upright phone.
for (const el of document.querySelectorAll('.sgrid')) {
  const n = Number(el.dataset.grid);
  const [cols] = ARRANGEMENTS[n][0];
  el.style.gridTemplateColumns = `repeat(${cols}, 14px)`;
  el.innerHTML = padsFor(n, null).map(p => `<i style="${padStyle(p.color)}"></i>`).join('');
}
for (const b of document.querySelectorAll('.size')) {
  b.onclick = () => { setup.size = Number(b.dataset.size); L('size', { size: setup.size }); renderSetup(); };
}
for (const b of document.querySelectorAll('.level')) {
  b.onclick = () => { setup.level = b.dataset.level; L('level', { level: setup.level }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !SIZES.includes(setup.size) || !Object.hasOwn(LEVELS, setup.level)) return;
  match = createMatch(setup, best);
  L('match started', { face: match.face, size: match.size, level: match.level, pads: match.pads.map(p => p.face), best: { ...best } });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  buildPads();
  lastLayout = '';
  fitPads();
  startGame();
};

/* ---------- fitting the pads to the screen ---------- */

// The biggest pads that let the whole page fit the screen with no
// scrolling, trying each way to lay them out (6: 2 across and 3 down, or
// 3x2) and keeping the one with the bigger pads. The 🏠 follows the pads
// (at least 48px).
function fitPads() {
  const play = $('play');
  const apply = (cols, px) => {
    play.style.setProperty('--cols', cols);
    play.style.setProperty('--pad', `${px}px`);
    play.style.setProperty('--home', `${Math.min(64, Math.max(48, Math.round(px * 0.4)))}px`);
  };
  // The page column's width (main), not the play screen's (nim.js).
  const width = Math.min(document.querySelector('main').clientWidth, 520);
  let use = null, tries = 0;
  for (const [cols, rows] of ARRANGEMENTS[match.size]) {
    const widest = Math.min(MAX_PAD, Math.floor((width - PAD_GAP * (cols - 1)) / cols));
    if (widest < MIN_PAD) continue;
    const fit = fitPlayScreen(px => apply(cols, px), MIN_PAD, widest);
    tries += fit.tries;
    if (fit.fitted && (!use || fit.size > use.pad)) use = { cols, rows, pad: fit.size, fitted: true };
  }
  // Nothing fits (a phone held sideways): the smallest pads, in the layout
  // with the fewest rows (the least scrolling), and the page scrolls.
  if (!use) {
    const [cols, rows] = ARRANGEMENTS[match.size].reduce((a, b) => (b[1] < a[1] ? b : a));
    use = { cols, rows, pad: MIN_PAD, fitted: false };
  }
  apply(use.cols, use.pad);
  const key = `${use.cols}x${use.rows}@${use.pad}`;
  if (key !== lastLayout) {
    lastLayout = key;
    L('fit', { size: match.size, ...use, tries, screen: `${innerWidth}x${innerHeight}` });
  }
}
addEventListener('resize', () => { if (match && !$('play').hidden) fitPads(); });

/* ---------- play screen ---------- */

const name = () => nameOf(match.face);
const chip = (face, mood = 'normal') => `<span class="chip">${svg(face, mood)}</span>`;

function say(html, pop = false) {
  const t = $('turn');
  t.innerHTML = html;
  t.classList.remove('pop');
  if (pop) { void t.offsetWidth; t.classList.add('pop'); }
}

function buildPads() {
  $('pads').replaceChildren(...match.pads.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'padb';
    b.style.cssText = padStyle(p.color);
    b.innerHTML = svg(p.face);
    b.setAttribute('aria-label', nameOf(p.face));
    // On touch, as the finger lands (a click comes only when it lifts).
    b.onpointerdown = e => { e.preventDefault(); onTap(i); };
    b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(i); } };
    return b;
  }));
}
const padEl = i => $('pads').children[i];

// Lights pad i for `ms` (its smiling face) and plays its note.
function light(i, ms) {
  const b = padEl(i);
  clearTimeout(padTimers.get(i));
  b.classList.remove('lit');
  void b.offsetWidth;
  b.classList.add('lit');
  b.innerHTML = svg(match.pads[i].face, 'winner');
  sound.note(match.pads[i].note, ms / 1000);
  padTimers.set(i, setTimeout(() => {
    padTimers.delete(i);
    b.classList.remove('lit');
    b.innerHTML = svg(match.pads[i].face);
  }, ms));
}

function setWait(on) { $('pads').classList.toggle('wait', on); }

function startGame() {
  const midGame = match.seq.length > 0 && !match.result;
  clearTimers();
  hideBanner();
  newGame(match);
  L(midGame ? 'game restarted (not counted)' : 'game started', { size: match.size, level: match.level });
  for (let i = 0; i < match.size; i++) { const b = padEl(i); b.className = 'padb'; b.innerHTML = svg(match.pads[i].face); }
  $('s1Chip').className = 'chip';
  setWait(true);
  renderBoard();
  renderDots();
  say(`${chip(match.face)}<span class="say">Ready?</span>`, true);
  later(nextRound, READY_MS);
}

function nextRound() {
  const p = addStep(match);
  L('round', { n: match.seq.length, added: match.pads[p].face, seq: match.seq.join('') });
  show();
}

// The robot shows the whole order, one pad at a time. No sound after it
// (developer, mockup v1: a "your turn" ping made one sound more than the
// faces shown, which made the order hard to count); the turn line
// changing is the cue.
function show() {
  setWait(true);
  say(`${chip('robot')}<span class="say">Watch me!</span>`);
  renderDots(-1);
  const { on, gap } = speed(match.level, match.seq.length);
  match.seq.forEach((p, i) => later(() => { light(p, on); renderDots(i); }, LEAD_MS + i * (on + gap)));
  later(() => {
    yourTurn(match);
    setWait(false);
    renderDots();
    say(`${chip(match.face)}<span class="say">${name()}’s turn!</span>`, true);
  }, LEAD_MS + match.seq.length * (on + gap));
}

function onTap(i) {
  if (!match) return;
  sound.unlock();
  const r = tap(match, i);
  if (!r.ok) {
    if (r.why !== 'not-your-turn') L('tap refused', { pad: i, why: r.why });
    return;
  }
  light(i, TAP_LIT_MS);
  if (r.right) {
    renderDots();
    if (r.complete) {
      L('order right', { length: match.seq.length });
      setWait(true);
      renderBoard();
      // No ding (developer, 2026-10-09): it covered your last note, and in
      // this game the notes are the only sounds while you play.
      say(`${chip(match.face, 'winner')}<span class="say">Yes! ${match.done}!</span>`, true);
      later(nextRound, YES_MS);
    }
    return;
  }
  // A miss: the tapped pad shakes, the right one blinks twice.
  L('miss', { tapped: match.pads[i].face, wanted: match.pads[r.want].face, at: match.pos + 1, of: match.seq.length, hearts: match.hearts });
  setWait(true);
  sound.play('uhoh', 0.1);
  const tapped = padEl(i), right = padEl(r.want);
  tapped.classList.add('miss');
  right.classList.add('hint');
  later(() => { tapped.classList.remove('miss'); right.classList.remove('hint'); }, MISS_MS);
  renderBoard();
  if (r.gameOver) {
    later(gameOver, OVER_MS);
    later(showBanner, BANNER_MS);
  } else {
    say(`${chip(match.face, 'sad')}<span class="say">Oops! Watch again.</span>`, true);
    later(() => { showAgain(match); show(); }, AGAIN_MS);
  }
}

// The end: "Leo got 5!", the sparkle and the scorecard cheer; the smiling
// face stays until the next game. A game that ends at 0: "Try again!",
// no sparkle.
function gameOver() {
  const { score, newBest } = match.result;
  L('game over', { score, newBest, best: { ...best } });
  renderBoard();
  if (!score) {
    say(`${chip(match.face, 'sad')}<span class="say">Try again!</span>`, true);
    return;
  }
  sound.play(endSound(1, { solo: true }));
  say(`${chip(match.face, 'winner')}<span class="say">${name()} got ${score}!${newBest ? ' New best!' : ''}</span>`, true);
  const c1 = $('s1Chip');
  c1.innerHTML = svg(match.face, endMoods(1, { solo: true })[1]);
  c1.className = 'chip cheer-win';
  later(() => { c1.className = 'chip'; }, CHEER_MS);
  if (newBest) { const c = $('cup'); c.classList.remove('up'); void c.offsetWidth; c.classList.add('up'); }
}

// The "Game over" banner over the dimmed pads, with Play again and New
// game: the only buttons on the play screen (developer, 2026-10-09).
function showBanner() {
  $('pads').classList.add('done');
  $('over').hidden = false;
  $('againBtn').focus({ preventScroll: true });
  L('game over banner');
}
function hideBanner() {
  $('pads').classList.remove('done');
  $('over').hidden = true;
}

// One dot per step: while the robot shows, the step it's on; on your
// turn, the steps you've tapped.
function renderDots(showing = null) {
  $('dots').innerHTML = match.seq.map((_, i) => {
    const cls = showing !== null ? (i === showing ? 'now' : i < showing ? 'on' : '') : (i < match.pos ? 'on' : '');
    return `<i class="${cls}"></i>`;
  }).join('');
}

function renderBoard() {
  if (!$('s1Chip').classList.contains('cheer-win') && !match.result) $('s1Chip').innerHTML = svg(match.face);
  $('s1').textContent = match.done;
  $('s1Who').innerHTML = `${name()}<br>in a row`;
  $('s2').textContent = best[bestKey(match.size, match.level)] ?? 0;
  $('s2Who').innerHTML = `best<br>(${match.size}, ${levelWord(match.level)})`;
  const full = LEVELS[match.level].hearts, left = Math.max(0, match.hearts);
  $('mid').innerHTML = `<span class="hearts" aria-label="${left} of ${full} tries left">${'❤️'.repeat(left)}${'🤍'.repeat(full - left)}</span>${levelWord(match.level)}`;
}

$('againBtn').onclick = () => { L('play again'); startGame(); };
$('newBtn').onclick = () => {
  clearTimers();
  hideBanner();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

startLog('follow-me');
renderSetup();
