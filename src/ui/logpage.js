// The log page (log.html): shows the lines the games kept on this device,
// saves them to a file with the device's details, copies them, or clears
// them. It reads the log; only its speed test (src/ui/speedtest.js, Q99)
// adds to it.

import { createLog, formatReport, LOG_KEY, LOG_MAX } from '../core/log.js';
import { RUNS } from '../core/speedtest.js';
import { LEVELS, KEY as DRAW_KEY, keptLevel, keepLevel } from '../core/drawing.js';
import { RELEASE } from '../core/release.js';

const $ = id => document.getElementById(id);
let storage = null;
try { storage = window.localStorage; } catch { /* blocked: nothing to show */ }
const log = createLog({ max: LOG_MAX, storage, key: LOG_KEY });

function environment() {
  const n = navigator;
  return {
    time: new Date().toISOString(),
    page: location.href,
    userAgent: n.userAgent,
    platform: n.userAgentData?.platform ?? n.platform ?? '?',
    language: n.language,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
    devicePixelRatio: devicePixelRatio,
    touchPoints: n.maxTouchPoints ?? 0,
    orientation: screen.orientation?.type ?? '?',
  };
}

function show() {
  const lines = log.lines();
  $('about').textContent = !storage ? 'This browser doesn’t let pages keep a log.'
    : lines.length ? `${lines.length} lines, kept on this device only (the newest ${LOG_MAX}). Newest at the bottom.`
      : 'Nothing logged yet. Play a game, then come back.';
  $('lines').textContent = lines.join('\n');
  $('lines').hidden = !lines.length;
  $('lines').scrollTop = $('lines').scrollHeight;
  for (const id of ['saveBtn', 'copyBtn', 'clearBtn']) $(id).disabled = !lines.length;
}
const said = text => { $('said').textContent = text; };

$('saveBtn').onclick = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([formatReport(log, environment())], { type: 'text/plain' }));
  a.download = `web-games-log_${stamp}.txt`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  said(`Saved as ${a.download}`);
};

$('copyBtn').onclick = async () => {
  try {
    await navigator.clipboard.writeText(formatReport(log, environment()));
    said('Copied. Paste it into a message or an email.');
  } catch {
    getSelection().selectAllChildren($('lines'));
    said('Couldn’t copy by itself: the lines are selected, copy them from there.');
  }
};

// The speed test (Q99): the 3D games drawn several ways, the frame rates
// added to the log under their own heading, each line kept on the device
// as it comes (a test cut short still leaves what it measured).
let testing = false;
$('speedBtn').onclick = async () => {
  if (testing) return;
  if (!confirm(`The speed test draws Topple! and Tin Can Alley in ${RUNS.length} ways, a few seconds each: about 3 minutes. Don’t touch the screen until it’s done. Start?`)) return;
  testing = true;
  $('speedBtn').disabled = true;
  log.begin(`speed test, ${innerWidth}x${innerHeight}`);
  const say = (msg, data) => { log.add('speed', msg, data); log.save(); };
  try {
    const { runSpeedTest } = await import('./speedtest.js');
    const results = await runSpeedTest({ say });
    const done = results.filter(r => r.fps != null).length;
    said(`Speed test done: ${done} of ${results.length} runs measured. Save log to send it.`);
  } catch (e) {
    say('failed', { error: String(e.message ?? e) });
    said('The speed test failed; the log says why.');
  }
  testing = false;
  $('speedBtn').disabled = false;
  show();
};

// The drawing level the 3D games start at on this device (Q109): the level
// the slow-device step-down keeps for this release (src/core/drawing.js),
// set by hand here so a tablet can be tried at "lightest" on purpose, in the
// installed app too. The games still step lighter if they are slow, never
// lighter than they are; "as drawn" is where a new release starts.
const GAMES = ['topple', 'tin-can-alley'];
function drawLevels() {
  let raw = null;
  try { raw = JSON.parse(storage?.getItem(DRAW_KEY) ?? 'null'); } catch { /* unreadable: as drawn */ }
  return { raw, levels: GAMES.map(g => keptLevel(raw, g, RELEASE)) };
}
function showDrawing() {
  const { levels } = drawLevels();
  $('drawSay').textContent = `3D games draw at: Topple! ${LEVELS[levels[0]].name}, Tin Can Alley ${LEVELS[levels[1]].name} (release ${RELEASE}). Start the game again after changing it.`;
  $('drawBtns').replaceChildren(...LEVELS.map((l, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill'; b.textContent = l.name;
    b.setAttribute('aria-pressed', String(levels.every(v => v === i)));
    b.onclick = () => {
      let out = drawLevels().raw;
      for (const g of GAMES) out = keepLevel(out, g, i, RELEASE);
      try { storage?.setItem(DRAW_KEY, JSON.stringify(out)); } catch (e) { said('Not kept on this device.'); return; }
      log.add('draw', 'drawing level set by hand', { level: l.name, release: RELEASE, games: GAMES });
      said(`The 3D games will draw ${l.name}. Open Topple! again to try it.`);
      showDrawing(); show();
    };
    return b;
  }));
}
showDrawing();

$('clearBtn').onclick = () => {
  if (!confirm('Clear the log on this device?')) return;
  log.clear();
  said('Cleared.');
  show();
};

show();
