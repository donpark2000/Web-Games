// Matching-cards screens (setup and play), from the agreed mockup
// (version 3). The rules live in src/core/matching.js; this file only
// draws, keeps time and handles taps.

import {
  SIZES, DEFAULT_SIZE, MIN_CARD, FIRST_RULES, checkFaces, sizeKey, parseSize, fitLayout,
  createMatch, newRound, flip, settle,
} from '../core/matching.js';
import { FACE_NAMES, endMoods, endSound, nameOf, twoPlayerFaces } from '../core/players.js';
import { svg, pickerFace } from './faces.js';
import { CARD_BACK } from './cardback.js';
import { log, startLog } from './debuglog.js';
import { fitPlayScreen } from './fit.js';
import { sound } from './sound.js';

const SHOW_MATCH_MS = 600;    // "A match!" before the pair settles
const SHOW_MISS_MS = 1500;    // "Not a match": the two cards stay up this long
const PAIR_CHEER_MS = 1900;   // css: .cheer-pair
const WIN_CHEER_MS = 2800;    // css: .cheer-win / .cheer-lose
const GAP = 8;                // between cards
const PLAY_MAX_W = 680;       // css: #play.app max-width
const SC_HEIGHT = 82;         // the "This game" scorecard, before it has been shown
const $ = id => document.getElementById(id);
const L = (msg, data) => log.add('cards', msg, data);

// Setup screen picks. "New game" comes back here with the last picks kept.
const setup = { solo: false, p1: 'bear', p2: null, size: DEFAULT_SIZE, firstRule: 'alt' };

let match = null;          // from createMatch, while on the play screen
let settleTimer = null;    // two cards are showing; settles when it fires
let just = [];             // the pair just found (it wiggles)
// The scorecard faces. `moods`: the end of a round (endMoods), kept until
// the next round. `anim`: the cheer running on each face ('cheer-pair',
// 'cheer-win', 'cheer-lose' or ''), cleared by its timer.
let moods = null;
const anim = { 1: '', 2: '' };
const animTimers = { 1: null, 2: null };

const WHY = {
  'p1-missing': () => (setup.solo ? 'Pick your face first.' : 'Player 1 needs a face.'),
  'p2-missing': () => 'Player 2 needs a face.',
  'same-face': () => 'Pick two different faces.',
  'unknown-face': () => 'Pick a face from the list.',
};

/* ---------- fitting the grid to the screen ---------- */

// The play screen's grid area: the page width less its 16px margins (at
// most PLAY_MAX_W), and the screen height less what must stay on screen
// with the grid: the page's top padding, the gaps, the "This game"
// scorecard and the 🏠 row above the grid, which is one card tall
// (extraRows). This decides which sizes are greyed and whether the grid
// is turned sideways; layoutGrid() then shrinks the cards further so the
// whole page fits, when it can.
function playLayout(size) {
  const width = Math.min(innerWidth - 32, PLAY_MAX_W);
  const top = parseFloat(getComputedStyle(document.body).paddingTop) || 12;
  const sc = $('sc').offsetHeight || SC_HEIGHT;
  const height = innerHeight - top - 12 - 12 - sc - 12;
  return fitLayout(size, width, height, { gap: GAP, extraRows: 1 });
}
const setHome = px => document.documentElement.style.setProperty('--home', `${px}px`);

// The whole page should fit the screen with no scrolling: "Games won",
// the buttons and the footer too (developer, 2026-10-04, iPhone 16). Both
// ways round (upright, sideways) are tried, each with the biggest cards
// (at least MIN_CARD) that let the page fit; the bigger cards win. A grid
// with too many cards for that keeps the cards playLayout() gives, and
// the page scrolls (as before), so no size is lost.
let lastLayout = '';
function layoutGrid() {
  const g = $('grid');
  g.style.setProperty('--gap', `${GAP}px`);
  const apply = (cols, px) => {
    g.style.setProperty('--cols', cols);
    g.style.setProperty('--cs', `${px}px`);
    setHome(px);   // the 🏠 button is one card (DESIGN.md "Structure")
  };
  const width = Math.min(innerWidth - 32, PLAY_MAX_W);
  const [a, b] = match.size;
  let best = null, tries = 0;
  for (const [cols, rows] of a === b ? [[a, b]] : [[a, b], [b, a]]) {
    const widest = Math.min(Math.floor((width - GAP * (cols - 1)) / cols), 130);   // 130: fitLayout's max
    if (widest < MIN_CARD) continue;
    const fit = fitPlayScreen(px => apply(cols, px), MIN_CARD, widest);
    tries += fit.tries;
    if (fit.fitted && (!best || fit.size > best.cs)) best = { cols, rows, cs: fit.size };
  }
  let use = best;
  if (!use) {
    const lay = playLayout(match.size);
    use = { cols: lay.cols, rows: lay.rows, cs: Math.max(lay.cs, 40) };
  }
  apply(use.cols, use.cs);
  const key = `${use.cols}x${use.rows}@${use.cs}`;
  if (key !== lastLayout) {
    lastLayout = key;
    L('layout', {
      size: sizeKey(match.size), cols: use.cols, rows: use.rows, card: use.cs, wholePageFits: !!best, tries,
      viewport: `${innerWidth}x${innerHeight}`,
    });
  }
}

/* ---------- setup screen ---------- */

function renderSetup() {
  const solo = setup.solo;
  $('modeSolo').setAttribute('aria-pressed', String(solo));
  $('modeTwo').setAttribute('aria-pressed', String(!solo));
  const [p1Pic, p2Pic] = twoPlayerFaces(setup.p1, setup.p2);
  $('pairSolo').innerHTML = svg(p1Pic);
  $('pairTwo').innerHTML = svg(p1Pic) + svg(p2Pic);
  $('p1Title').textContent = solo ? 'Pick your face' : 'Player 1, pick a face';
  $('p2Panel').hidden = solo;
  $('firstPanel').hidden = solo;
  fillPicker($('p1Faces'), setup.p1, solo ? null : setup.p2, f => pick('p1', f));
  fillPicker($('p2Faces'), setup.p2, setup.p1, f => pick('p2', f));
  $('p1Chip').innerHTML = setup.p1 ? svg(setup.p1) : '';
  $('p2Chip').innerHTML = !solo && setup.p2 ? svg(setup.p2) : '';
  for (const b of document.querySelectorAll('.first')) {
    b.setAttribute('aria-pressed', String(b.dataset.rule === setup.firstRule));
  }
  renderSizes();

  const code = checkFaces({ onePlayer: solo, p1: setup.p1, p2: setup.p2 });
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
    b.innerHTML = pickerFace(f);
    b.setAttribute('aria-label', nameOf(f));
    b.setAttribute('aria-pressed', String(f === mine));
    b.disabled = f === theirs;
    b.onclick = () => onPick(f);
    return b;
  }));
}

// Sizes whose cards would be under MIN_CARD on this screen are greyed. If
// the picked size no longer fits (e.g. the phone was turned upright), the
// pick goes back to the default.
let lastGreyed = null;
function renderSizes() {
  const greyed = SIZES.filter(s => playLayout(s).cs < MIN_CARD).map(sizeKey);
  if (greyed.includes(setup.size)) {
    L('size no longer fits', { size: setup.size, now: DEFAULT_SIZE });
    setup.size = DEFAULT_SIZE;
  }
  if (greyed.join() !== lastGreyed) {
    lastGreyed = greyed.join();
    L('sizes greyed', { greyed, viewport: `${innerWidth}x${innerHeight}` });
  }
  $('sizes').replaceChildren(...SIZES.map(sz => {
    const key = sizeKey(sz);
    const [a, b] = sz;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'size';
    btn.disabled = greyed.includes(key);
    btn.setAttribute('aria-pressed', String(setup.size === key));
    btn.setAttribute('aria-label', `${a} by ${b}, ${a * b / 2} pairs`);
    btn.innerHTML = `<span class="mini" style="grid-template-columns:repeat(${a},7px)" aria-hidden="true">${'<i></i>'.repeat(a * b)}</span>`
      + `${a} × ${b}<small>${a * b / 2} pairs</small>`;
    btn.onclick = () => { setup.size = key; L('size', { size: key }); renderSetup(); };
    return btn;
  }));
  $('sizeNote').textContent = greyed.length ? "Greyed sizes don't fit this screen. Turning a phone sideways can help." : '';
  setHome(playLayout(parseSize(DEFAULT_SIZE)).cs);   // 🏠 on setup: one 4x4 card
}

function pick(player, face) {
  setup[player] = face;
  L(`${player} picked`, { face });
  renderSetup();
}

$('modeSolo').onclick = () => { setup.solo = true; L('mode', { solo: true }); renderSetup(); };
$('modeTwo').onclick = () => {
  setup.solo = false;
  if (setup.p2 === setup.p1) setup.p2 = null;
  L('mode', { solo: false });
  renderSetup();
};
for (const b of document.querySelectorAll('.first')) {
  b.onclick = () => { setup.firstRule = b.dataset.rule; L('first rule', { rule: setup.firstRule }); renderSetup(); };
}
$('playBtn').onclick = () => {
  if (checkFaces({ onePlayer: setup.solo, p1: setup.p1, p2: setup.p2 }) || !FIRST_RULES.includes(setup.firstRule)) return;
  match = createMatch(setup);
  L('match started', { solo: match.solo, faces: match.faces, size: sizeKey(match.size), firstRule: match.firstRule });
  $('setup').hidden = true;
  $('play').hidden = false;
  scrollTo(0, 0);
  startRound();
};

/* ---------- play screen ---------- */

const faceOf = player => match.faces[player - 1];
const chipSvg = (player, mood) => `<span class="chip">${svg(faceOf(player), mood)}</span>`;

function cancelSettle() {
  if (settleTimer !== null) { clearTimeout(settleTimer); settleTimer = null; L('pending cards dropped'); }
}

// Starts a cheer on one scorecard face; `cls` '' stops it. Re-applying the
// class restarts the animation (playing alone, pairs can come quickly).
function setAnim(player, cls, ms) {
  clearTimeout(animTimers[player]);
  animTimers[player] = null;
  anim[player] = cls;
  const chip = $(`s${player}Chip`);
  chip.classList.remove('cheer-pair', 'cheer-win', 'cheer-lose');
  void chip.offsetWidth;   // let the browser see the class gone, so it can restart
  if (cls) {
    animTimers[player] = setTimeout(() => {
      animTimers[player] = null;
      anim[player] = '';
      if (match) renderPlay();
    }, ms);
  }
}
function stopCheers() {
  moods = null;
  setAnim(1, '');
  setAnim(2, '');
}

function startRound() {
  cancelSettle();
  stopCheers();
  const midRound = match.state.some(s => s !== 'down') && !match.result;
  newRound(match);
  just = [];
  L(midRound ? 'round restarted (not scored)' : 'round started', {
    size: sizeKey(match.size), starter: match.solo ? null : faceOf(match.starter), deck: match.deck,
  });
  buildGrid();
  buildScorecard();
  renderPlay();
  layoutGrid();
}

function buildGrid() {
  $('grid').replaceChildren(...match.deck.map((pic, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.className = 'cardb';
    c.innerHTML = `<span class="in"><span class="back">${CARD_BACK}</span><span class="front">${svg(pic)}</span></span>`;
    c.onclick = () => tap(i);
    return c;
  }));
}

// "This game": two players, pairs each with "This game" between; alone,
// pairs found of the total and the turns taken.
function buildScorecard() {
  const solo = match.solo;
  $('sc').classList.toggle('solo', solo);
  $('mid').hidden = solo;
  $('s2Chip').hidden = solo;
  $('s1Who').innerHTML = `${nameOf(faceOf(1))}<br>${solo ? `of ${match.deck.length / 2} pairs` : 'pairs'}`;
  $('s2Who').innerHTML = solo ? 'turns' : `${nameOf(faceOf(2))}<br>pairs`;
  for (const p of [1, 2]) delete $(`s${p}Chip`).dataset.face;
}

function tap(i) {
  if (!match || settleTimer !== null) return;
  const player = match.turn;
  const r = flip(match, i);
  if (!r.ok) { L('flip refused', { card: i, why: r.why }); return; }
  just = [];
  L('flip', { card: i, picture: match.deck[i], player: match.solo ? 1 : faceOf(player) });
  sound.play('swish');
  if (r.pending) {
    sound.play(r.pending === 'match' ? 'ding' : 'uhoh', 0.15);
    L(r.pending === 'match' ? 'a match' : 'not a match', { cards: [...match.open], turns: match.turns });
    settleTimer = setTimeout(settleNow, r.pending === 'match' ? SHOW_MATCH_MS : SHOW_MISS_MS);
  }
  renderPlay();
}

function settleNow() {
  settleTimer = null;
  const open = [...match.open];
  const r = settle(match);
  if (!r.ok) { L('settle refused', { why: r.why }); return; }
  if (r.scorer) {
    just = open;
    setAnim(r.scorer, 'cheer-pair', PAIR_CHEER_MS);
    L('pair found', { player: faceOf(r.scorer), picture: match.deck[open[0]], pairs: { ...match.pairs } });
  }
  if (r.result) endRound(r.result);
  renderPlay();
}

function endRound({ winner, turns }) {
  moods = endMoods(winner, { solo: match.solo });
  sound.play(endSound(winner, { solo: match.solo }));
  for (const p of [1, 2]) {
    const mood = moods[p];
    if (mood) setAnim(p, mood === 'winner' ? 'cheer-win' : 'cheer-lose', WIN_CHEER_MS);
  }
  if (match.solo) {
    L('all found', { turns, best: match.best[sizeKey(match.size)] });
  } else {
    L(winner ? 'round won' : 'round tied', {
      winner: winner ? faceOf(winner) : null, pairs: { ...match.pairs }, wins: { ...match.wins },
      nextStarter: faceOf(match.starter),
    });
  }
  L('scorecard faces', moods);
}

function renderPlay() {
  const r = match.result;
  const t = $('turn');
  t.className = 'turn' + (r ? ' won' : '');
  if (r && match.solo) t.innerHTML = `${chipSvg(1, 'winner')} All found in ${r.turns} turns!`;
  else if (r && r.winner) t.innerHTML = `${chipSvg(r.winner, 'winner')} ${nameOf(faceOf(r.winner))} wins!`;
  else if (r) t.innerHTML = `${chipSvg(1, 'winner')}${chipSvg(2, 'winner')} It's a tie!`;
  else if (match.pending === 'match') t.textContent = 'A match!';
  else if (match.pending === 'miss') t.textContent = 'Not a match';
  else if (match.solo) t.textContent = 'Find the pairs!';
  else t.innerHTML = `${chipSvg(match.turn, 'normal')} ${nameOf(faceOf(match.turn))}’s turn`;

  [...$('grid').children].forEach((c, i) => {
    const s = match.state[i];
    c.className = 'cardb' + (s === 'up' ? ' up' : '') + (s === 'found' ? ` found f${match.foundBy[i]}` : '')
      + (match.pending === 'miss' && match.open.includes(i) ? ' miss' : '') + (just.includes(i) ? ' just' : '');
    c.disabled = s !== 'down' || !!match.pending || !!r;
    c.setAttribute('aria-label', s === 'down' ? `card ${i + 1}, face down` : `card ${i + 1}: ${match.deck[i]}`);
  });

  for (const p of match.solo ? [1] : [1, 2]) {
    const chip = $(`s${p}Chip`);
    const mood = moods?.[p] ?? (anim[p] === 'cheer-pair' ? 'winner' : 'normal');
    chip.className = 'chip' + (anim[p] ? ` ${anim[p]}` : '');
    // Only redrawn when the face changes, so a running wiggle isn't restarted.
    const key = `${faceOf(p)}/${mood}`;
    if (chip.dataset.face !== key) { chip.innerHTML = svg(faceOf(p), mood); chip.dataset.face = key; }
  }
  $('s1').textContent = match.pairs[1];
  $('s2').textContent = match.solo ? match.turns : match.pairs[2];
  $('side1').classList.toggle('now', !match.solo && !r && match.turn === 1);
  $('side2').classList.toggle('now', !match.solo && !r && match.turn === 2);

  if (match.solo) {
    const [a, b] = match.size;
    const best = match.best[sizeKey(match.size)];
    $('sc2').innerHTML = `<span class="lbl">Best for ${a} × ${b}</span><span class="w">${best === undefined ? '—' : `${best} turns`}</span>`;
  } else {
    $('sc2').innerHTML = `<span class="lbl">Games<br>won</span>`
      + `<span class="w">${chipSvg(1, 'normal')}<span class="nm">${nameOf(faceOf(1))}</span>${match.wins[1]}</span>`
      + `<span class="w">Ties ${match.wins.ties}</span>`
      + `<span class="w">${chipSvg(2, 'normal')}<span class="nm">${nameOf(faceOf(2))}</span>${match.wins[2]}</span>`;
  }
}

$('againBtn').onclick = () => { L('play again'); startRound(); };
$('newBtn').onclick = () => {
  cancelSettle();
  stopCheers();
  L('new game');
  match = null;
  $('play').hidden = true;
  $('setup').hidden = false;
  renderSetup();
  scrollTo(0, 0);
};
// Turning a phone or resizing a window: refit the grid, or re-check which
// sizes fit.
addEventListener('resize', () => {
  if (match && !$('play').hidden) layoutGrid();
  else renderSizes();
});

startLog('matching');
renderSetup();
