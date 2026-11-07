// Five Dice 3D (DESIGN.md "3D games"): Five Dice with its dice in a 3D
// tray (src/ui/tray3d.js), the dice's colour picked on the setup screen.
// The game is Five Dice's (src/ui/five-dice-game.js). A device that can't
// draw 3D (no WebGL, or three.js won't load) is pointed to Five Dice.

import { fiveDice } from './five-dice-game.js';
import { log, startLog } from './debuglog.js';

const L = (msg, data) => log.add('dice', msg, data);

// three.js is loaded here, not imported at the top, so a browser that
// can't run it still gets this page's words and its way to Five Dice.
let tray3d = null, why = '';
try {
  tray3d = await import('./tray3d.js');
  if (!tray3d.webglOk()) why = 'no WebGL';
} catch (e) {
  why = `three.js not loaded: ${e.message ?? e}`;
}

// The setup screen's dice colours: a die showing 5 in each.
const DOTS5 = [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]];
const dieSvg = ({ body, pip }) => `<svg class="av" viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="18" fill="${body}" stroke="#1E344533" stroke-width="3"/>`
  + DOTS5.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${pip}"/>`).join('') + '</svg>';

if (!why) {
  for (const b of document.querySelectorAll('[data-colour]')) b.querySelector('.ico').innerHTML = dieSvg(tray3d.COLOURS[b.dataset.colour]);
  try {
    fiveDice({ game: 'five-dice-3d', makeTray: tray3d.makeTray3d, extraSetup: { colour: 'white' } });
  } catch (e) {
    why = `3D not started: ${e.message ?? e}`;
  }
}
if (why) {
  startLog('five-dice-3d');
  L('no 3D: pointed to Five Dice', { why, ua: navigator.userAgent });
  document.getElementById('play').hidden = true;
  document.getElementById('setup').hidden = false;
  for (const el of document.querySelectorAll('#setup > .panel, #setup > .go')) el.hidden = el.id !== 'no3d';
}
