// Five Dice screens (setup and play), from mockup v5. The setup screen is
// Count to 9's (with "How long?" and no "Who goes first?"); the dice are
// Snakes and Ladders'; the scoreboard and cheers are the other games'. The
// rules live in src/core/five-dice.js, the robot's best play in
// src/core/five-dice-best.js; this file only draws, keeps time, handles
// taps and loads the long game's values for the robot.

import {
  MODES, LENGTHS, BOXES, ROLLS, BONUS_AT, score, upper, points, openBoxes, players,
  checkFaces, createMatch, newRound, roll, toggle, pickUpAll, scoreBox, undo, endTurn, cardsShown,
} from '../core/five-dice.js';
import { bestPlay, useValues, hasValues, fromFile, gameWorth } from '../core/five-dice-best.js';
import { FACE_NAMES, endMoods } from '../core/players.js';
import { svg } from './faces.js';
import { dotsSvg, cubeSvg } from './snlart.js';
import { BOX_PICS, HELP } from './fivedice-pics.js';
import { log, installDebugPanel, withDev } from './debuglog.js';
import { fitPlayScreen } from './fit.js';

const UNDO_MS = 3000;    // after scoring, Undo shows this long, then the turn passes (css: --undo)
const SPIN_MS = 75;      // the dice tumble: a new face this often...
const SPIN_STEPS = 8;    // ...this many times
const CHEER_MS = 2800;   // the end-of-game scorecard cheer (css: .cheer-win)
// The robot shows what it does at a person's pace (developer, mockup v3):
// before its first roll, looking at a roll, between dice it picks up,
// before rolling them, showing its box before scoring, and after.
const ROBOT_WAIT = { start: 1200, look: 1600, each: 500, roll: 900, box: 1600, after: 1500 };
const MIN_ROW = 28, MAX_ROW = 64;   // score-sheet rows; smaller than MIN_ROW: the page scrolls
const MAX_DIE = 84;
const LONG_VALUES = 'data/five-dice-long.bin';   // the robot's long-game values (tools/five-dice-table.js)
const RING = { 1: '#F2724F', 2: '#3A94D4' };   // css: --p1, --p2
// The score sheet's panels: short, one; long, the 1s-6s and the bonus on
// the left, the other 7 on the right.
const LAYOUT = {
  short: [BOXES.short],
  long: [[...BOXES.long.slice(0, 6), 'bonus'], BOXES.long.slice(6)],
};
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('dice', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { mode: 'robot', p1: 'bear', p2: null, length: 'short' };

let match = null;        // from createMatch, while on the play screen
let timers = [];         // every pending step, so Play again / New game can stop them
let passTimer = null;    // the turn passing after a score (Undo cancels it)
let shown = null;        // the faces shown while the dice tumble (match.dice is already the roll)
let rolling = null;      // which dice are tumbling
let pendingBox = null;   // the robot's box, pulsing before it scores
let just = null;         // { p, box } just scored (it bounces)
let yay = false;         // five the same: the dice wiggle
// The end of a game on the scorecard, as in the other games.
let moods = null;
let cheering = false;

const later = (fn, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); fn(); }, ms); timers.push(t); return t; };
function stopAll() {
  if (timers.length) L('pending steps cancelled', { count: timers.length });
  timers.forEach(clearTimeout);
  timers = [];
  passTimer = null;
  rolling = null;
  shown = null;
}

const WHY = {
  'p1-missing': () => (setup.mode === 'two' ? 'Player 1 needs a face.' : 'Pick your face first.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

/* ---------- setup screen (Count to 9's) ---------- */

function renderSetup() {
  const mode = setup.mode;
  for (const b of document.querySelectorAll('.mode')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  for (const b of document.querySelectorAll('.level')) b.setAttribute('aria-pressed', String(b.dataset.length === setup.length));
  const p1Pic = setup.p1 || 'girl';
  $('pairSolo').innerHTML = svg(p1Pic);
  $('pairRobot').innerHTML = svg(p1Pic) + svg('robot');
  $('pairTwo').innerHTML = svg(p1Pic) + svg(setup.p2 && setup.p2 !== setup.p1 ? setup.p2 : (setup.p1 === 'boy' ? 'girl' : 'boy'));
  $('p1Title').textContent = mode === 'two' ? 'Player 1, pick a face' : 'Pick your face';
  $('p2Panel').hidden = mode !== 'two';
  fillPicker($('p1Faces'), setup.p1, mode === 'two' ? setup.p2 : null, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = mode === 'two' && setup.p2 ? svg(setup.p2) : '';
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

for (const b of document.querySelectorAll('.mode')) {
  b.onclick = () => {
    setup.mode = b.dataset.mode;
    if (setup.mode === 'two' && setup.p2 === setup.p1) setup.p2 = null;
    L('mode', { mode: setup.mode });
    renderSetup();
  };
}
for (const b of document.querySelectorAll('.level')) {
  b.onclick = () => { setup.length = b.dataset.length; L('length', { length: setup.length }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces(setup) || !MODES.includes(setup.mode) || !LENGTHS.includes(setup.length)) return;
  match = createMatch(setup);
  L('match started', { mode: match.mode, faces: match.faces, length: match.length });
  if (match.mode === 'robot' && match.length === 'long') loadLongValues();
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startRound();
};

// The row and die sizes: the biggest that let the whole page fit the
// screen (rows and dice grow together), the dice no wider than the tray
// allows. The 🏠 is one die, at least 48px.
function fit() {
  const play = $('play');
  const dieMax = Math.min(MAX_DIE, Math.floor((play.clientWidth - 6 * 5 - 64) / 5));
  const r = fitPlayScreen(px => {
    const die = Math.min(dieMax, Math.round(px * 1.2));
    play.style.setProperty('--row', `${px}px`);
    play.style.setProperty('--die', `${die}px`);
    play.style.setProperty('--home', `${Math.max(48, die)}px`);
  }, MIN_ROW, MAX_ROW);
  L('fit', { ...r, die: play.style.getPropertyValue('--die') });
}
addEventListener('resize', () => { if (match && !$('play').hidden) fit(); });

/* ---------- the robot's long-game values ---------- */

// Loaded when the first long game against the robot starts (1 MB; the
// short game's are worked out on the spot). Until they're in, the robot
// waits; if they can't be loaded, it plays for the most points each turn.
let longLoading = null;   // the load, while it runs
function loadLongValues() {
  if (hasValues('long') || longLoading) return;
  const t = performance.now();
  longLoading = fetch(LONG_VALUES)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
    .then(buf => {
      useValues('long', fromFile(new Uint16Array(buf)));
      L('robot values loaded', { bytes: buf.byteLength, ms: Math.round(performance.now() - t), gameWorth: gameWorth('long').toFixed(2) });
    })
    .catch(e => L('robot values not loaded: it plays for the most points each turn', { error: String(e) }))
    .finally(() => { longLoading = null; });
}

/* ---------- play screen ---------- */

const faceOf = p => match.faces[p - 1];
const isRobot = p => match.mode === 'robot' && p === 2;
const robotsTurn = () => isRobot(match.turn);
const who = () => (robotsTurn() ? 'robot' : 'person');
const chipOf = (p, mood = moods?.[p] ?? 'normal') => `<span class="chip">${svg(faceOf(p), mood)}</span>`;
const fiveSame = d => d.every(v => v === d[0]);

function say(html, pop) {
  const t = $('turn');
  t.innerHTML = html;
  t.classList.remove('pop');
  if (pop) { void t.offsetWidth; t.classList.add('pop'); }
}
const sayP = (p, words, pop) => say(`${chipOf(p)}<span class="say">${words}</span>`, pop);
const pickWords = () => (match.rolls < ROLLS ? 'Pick a box, or tap dice to roll again' : 'Pick a box');

function startRound() {
  const midRound = !match.result && players(match).some(p => Object.keys(match.cards[p]).length);
  stopAll();
  moods = null;
  cheering = false;
  newRound(match);
  L(midRound ? 'game restarted (not scored)' : 'game started', { starter: faceOf(match.starter), length: match.length, wins: { ...match.wins } });
  beginTurn();
  fit();
}

// The dice wait as cubes in the colour of whose turn it is.
function beginTurn() {
  closeTip('new turn');   // its "your dice now" belongs to the last turn
  pendingBox = null;
  just = null;
  yay = false;
  render();
  if (robotsTurn()) {
    sayP(2, 'is thinking…');
    later(doRoll, ROBOT_WAIT.start);
  } else {
    sayP(match.turn, match.mode === 'solo' ? 'Roll the dice!' : 'Your turn. Roll!');
  }
}

// The first Roll rolls all five; after that only the dice picked up. Roll
// with none picked up picks all five up and asks; a second Roll rolls them
// (so a stray tap can't throw good dice away).
function tapRoll() {
  if (!match || match.result) return L('roll tap ignored', { why: 'game over' });
  if (robotsTurn()) return L('roll tap ignored', { why: "robot's turn" });
  if (rolling) return L('roll tap ignored', { why: 'still rolling' });
  if (match.rolls > 0 && !match.up.some(Boolean) && !match.scored) {
    const r = pickUpAll(match);
    if (!r.ok) return L('roll tap ignored', { why: r.why });
    L('picked up all five (asks first)');
    sayP(match.turn, 'Roll them all?');
    return render();
  }
  doRoll();
}

function doRoll() {
  const p = match.turn, before = match.dice.slice();
  const r = roll(match);
  if (!r.ok) return L('roll refused', { why: r.why });
  L('roll', { player: faceOf(p), who: who(), roll: r.rolls, before, rolled: r.rolled, dice: r.dice });
  rolling = r.rolled;
  yay = false;
  let k = 0;
  const step = () => {
    shown = match.dice.map((v, i) => (rolling[i] ? 1 + Math.floor(Math.random() * 6) : v));
    render();
    if (++k < SPIN_STEPS) return later(step, SPIN_MS);
    later(() => { rolling = null; shown = null; afterRoll(); }, SPIN_MS);
  };
  step();
}

function afterRoll() {
  const p = match.turn;
  yay = fiveSame(match.dice);
  render();
  if (isRobot(p)) {
    sayP(p, yay ? 'Five the same!' : 'is thinking…', yay);
    later(robotThink, ROBOT_WAIT.look);
    return;
  }
  sayP(p, `${yay ? 'Five the same! ' : ''}${pickWords()}`, yay);
}

// A die: pick it up to roll again (tap again to put it back).
function tapDie(i) {
  if (!match) return;
  if (robotsTurn()) return L('die tap ignored', { why: "robot's turn" });
  if (rolling) return L('die tap ignored', { why: 'still rolling' });
  const r = toggle(match, i);
  if (!r.ok) return L('die tap ignored', { die: i, why: r.why });
  const n = match.up.filter(Boolean).length;
  L(r.up ? 'die picked up' : 'die put back', { die: i, shows: match.dice[i], up: n });
  sayP(match.turn, n ? `Roll ${n === 5 ? 'them all' : n === 1 ? 'that one' : `those ${n}`}?` : pickWords());
  render();
}

// A box: one tap puts the score there (developer: two taps were tedious).
// For UNDO_MS the Roll button is an Undo that takes it back out; then the
// turn passes.
function tapBox(p, box) {
  if (!match) return;
  if (p !== match.turn) return L('box tap ignored', { box, why: 'not their turn' });
  if (robotsTurn()) return L('box tap ignored', { box, why: "robot's turn" });
  if (rolling) return L('box tap ignored', { box, why: 'still rolling' });
  commit(box);
}

function commit(box) {
  const p = match.turn;
  const r = scoreBox(match, box);
  if (!r.ok) return L('score refused', { box, why: r.why });
  L('scored', { player: faceOf(p), who: who(), box, points: r.points, dice: match.dice.slice(), rolls: match.rolls,
    total: points(match.cards[p], match.length) });
  pendingBox = null;
  just = { p, box };
  sayP(p, r.points ? `<b>+${r.points}</b>` : 'Zero this time', true);
  render();
  passTimer = later(finishTurn, isRobot(p) ? ROBOT_WAIT.after : UNDO_MS);
}

function tapUndo() {
  if (!match || robotsTurn()) return L('undo ignored', { why: "robot's turn" });
  const r = undo(match);
  if (!r.ok) return L('undo ignored', { why: r.why });
  clearTimeout(passTimer);
  timers = timers.filter(t => t !== passTimer);
  passTimer = null;
  just = null;
  L('undo', { player: faceOf(match.turn), box: r.box });
  sayP(match.turn, pickWords());
  render();
}

function finishTurn() {
  passTimer = null;
  const r = endTurn(match);
  if (!r.ok) return L('end of turn refused', { why: r.why });
  if (r.result) return endRound(r.result);
  L('turn passes', { to: faceOf(r.turn) });
  beginTurn();
}

// The winner's scorecard face cheers; the other shows "aww" (both cheer on
// a tie). Playing alone: the points, and "Your best!" for a new best.
function endRound(result) {
  const solo = match.mode === 'solo';
  moods = endMoods(result.winner, { solo });
  cheering = true;
  L('game over', { winner: result.winner ? faceOf(result.winner) : 'tie', points: result.points, wins: { ...match.wins },
    best: match.best, newBest: result.best, nextStarter: faceOf(match.starter) });
  later(() => { cheering = false; renderBoard(); }, CHEER_MS);
  if (solo) sayP(1, `<b>${result.points[1]}</b> points!${result.best ? ' Your best!' : ''}`, true);
  else if (result.winner) sayP(result.winner, 'wins!', true);
  else say('<span class="say">It’s a tie!</span>', true);
  $('turn').classList.add('won');
  render();
}

// The robot: thinks, then either shows the box it picks (pulsing) and
// scores it, or picks its dice up one at a time and rolls them. It plays
// its best: the most points on average over the rest of the game.
function robotThink() {
  if (longLoading) { L('robot waits for its values'); return later(robotThink, 300); }
  const p = match.turn, open = openBoxes(match.cards[p], match.length);
  const plan = bestPlay(match.dice, match.rolls, match.cards[p], match.length);
  L('robot plan', { dice: match.dice.slice(), rolls: match.rolls, open, plan: { ...plan, worth: plan.worth.toFixed(2) } });
  if (plan.box) {
    pendingBox = plan.box;
    sayP(p, `<b>${plan.points}</b> here`);
    renderSheet();
    return later(() => commit(plan.box), ROBOT_WAIT.box);
  }
  const picks = plan.up.flatMap((u, i) => (u ? [i] : [])), n = picks.length;
  sayP(p, `Rolls ${n === 5 ? 'them all' : n === 1 ? '1 again' : `${n} again`}`);
  // All five lift at once, as when a person rolls them all (developer,
  // 2026-10-06); fewer are picked up one at a time.
  if (n === 5) {
    pickUpAll(match);
    renderTray();
    return later(doRoll, ROBOT_WAIT.roll);
  }
  picks.forEach((i, k) => later(() => { toggle(match, i); renderTray(); }, k * ROBOT_WAIT.each));
  later(doRoll, (n - 1) * ROBOT_WAIT.each + ROBOT_WAIT.roll);
}

/* ---------- drawing ---------- */

function render() { renderTray(); renderSheet(); renderBoard(); }

function renderTray() {
  const p = match.turn, human = !robotsTurn() && !match.result;
  $('play').classList.toggle('p2t', p === 2);
  const wait = match.rolls === 0 && !rolling;
  const canPick = human && !rolling && match.rolls > 0 && match.rolls < ROLLS && !match.scored;
  const canRoll = human && !rolling && match.rolls < ROLLS && !match.scored;
  const n = match.up.filter(Boolean).length;
  const showUndo = human && !!match.scored;
  const dice = shown || match.dice;
  const tray = $('tray');
  tray.innerHTML = dice.map((v, i) => {
    const cls = 'dz' + (wait ? ' cube' : '') + (match.up[i] ? ' up' : '') + (rolling?.[i] ? ' rolling' : '') + (yay ? ' yay' : '');
    const label = wait ? 'die, not rolled yet' : `die showing ${v}${match.up[i] ? ', picked up to roll again' : ''}`;
    return `<button type="button" class="${cls}" data-i="${i}"${canPick ? '' : ' disabled'} aria-label="${label}">${wait ? cubeSvg(RING[p]) : dotsSvg(v)}</button>`;
  }).join('') + (showUndo
    ? `<button type="button" class="roll undo" id="undoBtn" style="--undo:${UNDO_MS}ms">↩<small>Undo</small></button>`
    : `<button type="button" class="roll${canRoll && (match.rolls === 0 || n) ? ' nudge' : ''}" id="rollBtn"${canRoll ? '' : ' disabled'}`
      + ` aria-label="Roll, ${ROLLS - match.rolls} left">Roll<span class="pips">`
      + [0, 1, 2].map(k => `<i class="${k < match.rolls ? 'used' : ''}"></i>`).join('') + '</span></button>');
  for (const b of tray.querySelectorAll('.dz')) b.onclick = () => tapDie(Number(b.dataset.i));
  if (showUndo) $('undoBtn').onclick = tapUndo;
  else $('rollBtn').onclick = tapRoll;
}

// Pictures down the left, a column per card shown, its face on top: during
// a game only the card of whose turn it is, at the end everyone's
// (developer, 2026-10-07: two columns were small on a phone, and which was
// whose was confusing). After a roll, each empty box shows what it would
// score, faded.
let sheetShows = '';   // whose cards the sheet shows, for the debug log
function renderSheet() {
  const ps = cardsShown(match), sheet = $('sheet'), panels = LAYOUT[match.length];
  const offer = !match.result && !rolling && match.rolls > 0 && !match.scored;
  const shows = ps.map(faceOf).join(' + ');
  if (shows !== sheetShows) { sheetShows = shows; L('score card shown', { cards: shows }); }
  const hd = (p, cls = '') => `<span class="hd f${p}${cls}" aria-label="${faceOf(p)}'s card">${svg(faceOf(p))}</span>`;
  // One card on the long game's two panels: one face across both
  // (developer, 2026-10-07: both halves are one player's); otherwise a
  // face on each column.
  const across = panels.length > 1 && ps.length === 1;
  const head = across ? '' : '<span class="hd"></span>' + ps.map(p => hd(p)).join('');
  sheet.className = 'sheet' + (panels.length === 1 ? ' one' : '');
  sheet.innerHTML = (across ? hd(ps[0], ' across') : '') + panels.map(col => `<div class="half c${ps.length}${across ? ' nohd' : ''}">` + head + col.map(box => {
    const [title, rule] = HELP[box];
    const row = `<button type="button" class="pic" data-box="${box}" aria-label="${title}: ${rule}">${BOX_PICS[box]}</button>`;
    return row + ps.map(p => {
      const card = match.cards[p];
      if (box === 'bonus') {
        const u = upper(card);
        return `<div class="box bonus f${p}" aria-label="bonus: ${u} of ${BONUS_AT}">${u >= BONUS_AT ? '⭐35'
          : `<span class="bar"><i style="width:${Math.min(100, (u / BONUS_AT) * 100)}%"></i></span>`}</div>`;
      }
      if (box in card) {
        const s = card[box], j = just && just.p === p && just.box === box;
        return `<div class="box f${p}${s ? '' : ' zero'}${j ? ' just' : ''}">${s}</div>`;
      }
      if (p === match.turn && offer) {
        const s = score(box, match.dice);
        if (pendingBox === box) return `<button type="button" class="box pend" data-p="${p}" data-box="${box}">${s}</button>`;
        return `<button type="button" class="box opt${s ? '' : ' nil'}" data-p="${p}" data-box="${box}" aria-label="put ${s} here">${s}</button>`;
      }
      return '<div class="box"></div>';
    }).join('');
  }).join('') + '</div>').join('');
  for (const b of sheet.querySelectorAll('.box[data-box]')) b.onclick = () => tapBox(Number(b.dataset.p), b.dataset.box);
  for (const b of sheet.querySelectorAll('.pic')) b.onclick = () => showTip(b.dataset.box, b);
}

function setChip(el, face, mood) {
  el.className = 'chip' + (cheering && mood === 'winner' ? ' cheer-win' : cheering && mood === 'sad' ? ' cheer-lose' : '');
  // Only redrawn when the face changes, so a running wiggle isn't restarted.
  const key = `${face}/${mood}`;
  if (el.dataset.face !== key) { el.innerHTML = face === 'cup' ? '🏆' : svg(face, mood); el.dataset.face = key; }
}

// Points this game and games won; playing alone, points and the best for
// this length.
function renderBoard() {
  const solo = match.mode === 'solo', r = match.result, len = match.length === 'long' ? 'Long' : 'Short';
  for (const p of [1, 2]) $(`side${p}`).classList.toggle('now', !solo && !r && match.turn === p);
  setChip($('s1Chip'), faceOf(1), moods?.[1] ?? 'normal');
  $('s1').textContent = points(match.cards[1], match.length);
  if (solo) {
    $('s1Who').textContent = 'points';
    $('mid').textContent = len;
    setChip($('s2Chip'), 'cup', 'normal');
    $('s2').textContent = match.best[match.length] ?? '—';
    $('s2Who').textContent = 'best';
  } else {
    $('s1Who').textContent = `points · won ${match.wins[1]}`;
    $('mid').innerHTML = `Points<br>${len}`;
    setChip($('s2Chip'), faceOf(2), moods?.[2] ?? 'normal');
    $('s2').textContent = points(match.cards[2], match.length);
    $('s2Who').textContent = `points · won ${match.wins[2]}`;
  }
}

/* ---------- the pop-up for a picture ---------- */

const miniChip = p => `<span class="mini">${svg(faceOf(p))}</span>`;
function showTip(box, picEl) {
  const [title, rule, eg] = HELP[box], tip = $('tip'), p = match.turn;
  let now = '';
  if (box === 'bonus') {
    now = `<div class="now">${players(match).map(q => `<span>${miniChip(q)} <b>${upper(match.cards[q])}</b> of ${BONUS_AT}</span>`).join('')}</div>`;
  } else if (!match.result && !rolling && match.rolls > 0 && !match.scored && !robotsTurn() && !(box in match.cards[p])) {
    now = `<div class="now">Your dice now: <b>${score(box, match.dice)}</b></div>`;
  }
  tip.innerHTML = `<button type="button" class="x" aria-label="Close">✕</button><div class="head">${BOX_PICS[box]}<span>${title}</span></div><p>${rule}</p>`
    + (eg ? `<div class="eg">${eg.map(v => `<span>${dotsSvg(v)}</span>`).join('')}<b>= ${score(box, eg)}</b></div>` : '')
    + now;
  tip.hidden = false;
  tip.querySelector('.x').onclick = () => closeTip('✕');
  // Under the picture's row, or above it when that would run off the page.
  const play = $('play').getBoundingClientRect(), r = picEl.getBoundingClientRect(), h = tip.offsetHeight;
  const below = r.bottom - play.top + 6, above = r.top - play.top - h - 6;
  tip.style.top = `${below + h <= play.height - 60 || above < 0 ? below : above}px`;
  L('pop-up', { box, title });
}
function closeTip(why) {
  if ($('tip').hidden) return;
  $('tip').hidden = true;
  L('pop-up closed', { why });
}
// Only the ✕ closes the pop-up (developer, 2026-10-06: "tap anywhere to
// close" didn't work for them, and the ✕ is enough). Another picture shows
// that one; a new turn or New game closes it. Taps elsewhere work as usual.

$('againBtn').onclick = () => { L('play again'); $('turn').classList.remove('won'); startRound(); };
$('newBtn').onclick = () => {
  stopAll();
  closeTip('new game');
  L('new game');
  match = null;
  $('turn').classList.remove('won');
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};

for (const a of document.querySelectorAll('.homebtn')) a.href = withDev(a.getAttribute('href'));
installDebugPanel('five-dice');
renderSetup();
