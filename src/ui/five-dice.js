// Five Dice (from mockup v5): its row of flat dice, Snakes and Ladders',
// and the fit of its play screen. Everything else is shared with Five Dice
// 3D in src/ui/five-dice-game.js (2026-11-07; until then all in this file).

import { fiveDice, UNDO_MS } from './five-dice-game.js';
import { dotsSvg, cubeSvg } from './snlart.js';
import { fitPlayScreen, fitEitherWay, wideRoom } from './fit.js';
import { sound } from './sound.js';

const SPIN_MS = 75;      // the dice tumble: a new face this often...
const SPIN_STEPS = 8;    // ...this many times
const MIN_ROW = 28, MAX_ROW = 64;   // score-sheet rows; smaller than MIN_ROW: the page scrolls
const MAX_DIE = 84;
const RING = { 1: '#F2724F', 2: '#3A94D4' };   // css: --p1, --p2
const $ = id => document.getElementById(id);

function flatTray({ tapDie, tapRoll, tapUndo, later }) {
  let shown = null;   // the faces shown while the dice tumble (match.dice is already the roll)
  let view = null;    // the last view drawn
  let spin = 0;       // which roll is tumbling, so a stopped one doesn't carry on

  // The dice wait as cubes in the colour of whose turn it is.
  function render(v) {
    view = v;
    const { turn: p, wait, canPick, canRoll, showUndo, yay, rolling } = v;
    const n = v.up.filter(Boolean).length;
    const dice = shown || v.dice;
    const tray = $('tray');
    tray.innerHTML = dice.map((d, i) => {
      const cls = 'dz' + (wait ? ' cube' : '') + (v.up[i] ? ' up' : '') + (rolling?.[i] ? ' rolling' : '') + (yay ? ' yay' : '');
      const label = wait ? 'die, not rolled yet' : `die showing ${d}${v.up[i] ? ', picked up to roll again' : ''}`;
      return `<button type="button" class="${cls}" data-i="${i}"${canPick ? '' : ' disabled'} aria-label="${label}">${wait ? cubeSvg(RING[p]) : dotsSvg(d)}</button>`;
    }).join('') + (showUndo
      ? `<button type="button" class="roll undo" id="undoBtn" style="--undo:${UNDO_MS}ms">↩<small>Undo</small></button>`
      : `<button type="button" class="roll${canRoll && (v.rolls === 0 || n) ? ' nudge' : ''}" id="rollBtn"${canRoll ? '' : ' disabled'}`
        + ` aria-label="Roll, ${v.left} left">Roll<span class="pips">`
        + [0, 1, 2].map(k => `<i class="${k < v.rolls ? 'used' : ''}"></i>`).join('') + '</span></button>');
    for (const b of tray.querySelectorAll('.dz')) b.onclick = () => tapDie(Number(b.dataset.i));
    if (showUndo) $('undoBtn').onclick = tapUndo;
    else $('rollBtn').onclick = tapRoll;
  }

  // The dice picked up tumble through random faces, then show the roll.
  function roll(rolled, done) {
    sound.play('shake');
    const mine = ++spin;
    let k = 0;
    const step = () => {
      if (mine !== spin) return;
      shown = view.dice.map((v, i) => (rolled[i] ? 1 + Math.floor(Math.random() * 6) : v));
      render(view);
      if (++k < SPIN_STEPS) return later(step, SPIN_MS);
      later(() => { if (mine !== spin) return; shown = null; done(); }, SPIN_MS);
    };
    step();
  }
  function stop() { spin++; shown = null; }

  return { render, roll, stop, fit, newTurn() {}, show() {} };
}

// The row and die sizes: the biggest that let the whole page fit the
// screen (rows and dice grow together), the dice no wider than the tray
// allows. The turn line is one die tall, at least 48px. On a screen wider
// than tall, the dice and the sheet beside the rest if that gives bigger
// rows (DESIGN.md "Sideways screens"), a column at most WIDE_W wide: the
// dice and Roll standing beside the sheet (6.3), so the dice can be
// WIDE_DIE rows tall (their column about the sheet's height), the sheet
// at least WIDE_SHEET wide. Returns the debug log's fit line (logged by
// five-dice-game.js: L('fit', { ...r, die })).
const WIDE_W = 600, WIDE_DIE = 1.3, WIDE_SHEET = 240;
function fit() {
  const play = $('play');
  const r = fitEitherWay(wide => {
    const width = wide ? Math.min(wideRoom(), WIDE_W) : play.clientWidth;
    const dieMax = wide
      ? Math.min(MAX_DIE, width - 10 - WIDE_SHEET)   // 10: the stage's gap
      : Math.min(MAX_DIE, Math.floor((width - 6 * 5 - 64) / 5));
    if (wide && dieMax < MIN_ROW) return null;
    play.style.setProperty('--stagew', `${width}px`);
    return fitPlayScreen(px => {
      const die = Math.min(dieMax, Math.round(px * (wide ? WIDE_DIE : 1.2)));
      play.style.setProperty('--row', `${px}px`);
      play.style.setProperty('--die', `${die}px`);
      play.style.setProperty('--topsq', `${Math.max(48, die)}px`);
    }, MIN_ROW, MAX_ROW);
  });
  return { ...r, die: play.style.getPropertyValue('--die') };
}

fiveDice({ game: 'five-dice', makeTray: flatTray });
