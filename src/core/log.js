// The debug log's record (DESIGN.md "Structure"; standards §1). No DOM code:
// src/ui/debuglog.js starts it on each page, log.html shows and saves it.
//
// Every page logs all the time. With a `storage` (the browser's
// localStorage) the lines are kept on the device across pages and visits
// (developer, 2026-10-07: no panel on the game screens; a log page to look
// at afterwards). Nothing is sent anywhere. The log keeps the newest `max`
// lines so it can't grow without limit; if the storage can't be read or
// written, it still works in memory.

export const LOG_KEY = 'web-games-log';
export const LOG_MAX = 3000;   // lines kept on the device: about the last 15 games or more

export function createLog({ max = 2000, now = () => Date.now(), storage = null, key = LOG_KEY } = {}) {
  const start = now();
  let lines = load(storage, key).slice(-max);
  let dropped = 0;
  const listeners = new Set();

  function push(line) {
    lines.push(line);
    if (lines.length > max) { lines.shift(); dropped++; }
    for (const fn of listeners) fn(line);
    return line;
  }

  function add(area, message, data) {
    const secs = ((now() - start) / 1000).toFixed(3);
    let line = `+${secs}s [${area}] ${message}`;
    if (data !== undefined) {
      try { line += ' ' + JSON.stringify(data); } catch { line += ' (data not printable)'; }
    }
    return push(line);
  }

  return {
    add,
    // A heading line where a page's lines start: the local date and time,
    // then `title`. The lines under it count seconds from that moment.
    begin: title => push(`=== ${stamp(new Date(start))} ${title} ===`),
    lines: () => [...lines],
    dropped: () => dropped,
    // Writes the lines to the storage. Returns false if there's none or it
    // refused (full, or blocked in a private window).
    save() {
      if (!storage) return false;
      try { storage.setItem(key, JSON.stringify(lines)); return true; } catch { return false; }
    },
    clear() {
      lines = []; dropped = 0;
      try { storage?.removeItem(key); } catch { /* nothing kept to clear */ }
    },
    onLine(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// The lines kept by earlier pages: [] if there are none, or they can't be
// read or aren't a list of strings.
function load(storage, key) {
  try {
    const v = JSON.parse(storage?.getItem(key) ?? '[]');
    return Array.isArray(v) ? v.filter(l => typeof l === 'string') : [];
  } catch { return []; }
}

const two = n => String(n).padStart(2, '0');
const stamp = d => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;

// The text of a saved log file: environment first (what support needs to
// know about the device), then every line kept.
export function formatReport(log, env) {
  const head = ['Web Games debug log', ''];
  for (const [k, v] of Object.entries(env)) head.push(`${k}: ${v}`);
  head.push('', `lines: ${log.lines().length}` + (log.dropped() ? ` (oldest ${log.dropped()} dropped)` : ''), '');
  return head.concat(log.lines()).join('\n') + '\n';
}
