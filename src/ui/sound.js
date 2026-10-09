// Sound on a game page: the shared `sound` (src/ui/sounds.js) wired to
// this browser, a 🔊/🔇 button top-right on the setup and play screens
// (on or off for all the games, remembered on the device), and a tick for
// every choice on the setup screen. A game imports `sound` and plays its
// own moments with sound.play(name).

import { createSound, SOUND_KEY } from './sounds.js';
import { log } from './debuglog.js';

let storage = null;
try { storage = window.localStorage; } catch { /* blocked: on, not remembered */ }
const AC = window.AudioContext || window.webkitAudioContext;

export const sound = createSound({
  makeContext: AC ? () => new AC() : null,
  storage,
  log: (msg, data) => log.add('sound', msg, data),
});

// iPhone and iPad: the sounds follow the silent switch, as other things on
// the phone do (developer, 2026-10-09). 'ambient' also leaves any music
// that is playing alone.
try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch { /* older Safari: ambient anyway */ }

// Sound can only start after a tap, so every tap lets it (capture: before
// the game's own handler plays anything).
for (const type of ['pointerup', 'touchend', 'click', 'keydown']) {
  addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
}

const buttons = [];
function show() {
  for (const b of buttons) {
    b.textContent = sound.on ? '🔊' : '🔇';
    b.setAttribute('aria-pressed', String(sound.on));
    b.setAttribute('aria-label', sound.on ? 'Sound on' : 'Sound off');
    b.classList.toggle('off', !sound.on);
  }
}
for (const top of document.querySelectorAll('#setup > .top, #play > .top')) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'soundbtn';
  b.onclick = () => { sound.setOn(!sound.on); show(); };
  top.classList.add('with-sound');
  top.append(b);
  buttons.push(b);
}
show();
addEventListener('storage', e => { if (e.key === SOUND_KEY) { sound.follow(e.newValue); show(); } });

// A tick for each choice on the setup screen (faces, who's playing, how
// hard, who goes first, Play!). Disabled buttons send no click.
document.getElementById('setup')?.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b && !b.classList.contains('soundbtn')) sound.play('tick');
});
log.add('sound', sound.on ? 'on' : 'off', { webAudio: !!AC, buttons: buttons.length });
