// The log page (log.html): shows the lines the games kept on this device,
// saves them to a file with the device's details, copies them, or clears
// them. It reads the log; it doesn't add to it.

import { createLog, formatReport, LOG_KEY, LOG_MAX } from '../core/log.js';

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

$('clearBtn').onclick = () => {
  if (!confirm('Clear the log on this device?')) return;
  log.clear();
  said('Cleared.');
  show();
};

show();
