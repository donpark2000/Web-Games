// The debug log's record (DESIGN.md "Structure"; standards §1). No DOM code:
// src/ui/debuglog.js shows it on screen with ?dev and saves it to a file.
//
// Every page logs all the time; the panel only decides whether it's shown.
// The log keeps the newest `max` lines so a long play session can't grow
// without limit.

export function createLog({ max = 2000, now = () => Date.now() } = {}) {
  const start = now();
  let lines = [];
  let dropped = 0;
  const listeners = new Set();

  function add(area, message, data) {
    const secs = ((now() - start) / 1000).toFixed(3);
    let line = `+${secs}s [${area}] ${message}`;
    if (data !== undefined) {
      try { line += ' ' + JSON.stringify(data); } catch { line += ' (data not printable)'; }
    }
    lines.push(line);
    if (lines.length > max) { lines.shift(); dropped++; }
    for (const fn of listeners) fn(line);
    return line;
  }

  return {
    add,
    lines: () => [...lines],
    dropped: () => dropped,
    clear() { lines = []; dropped = 0; },
    onLine(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

// The text of a saved log file: environment first (what support needs to
// know about the device), then every line kept.
export function formatReport(log, env) {
  const head = ['Web Games debug log', ''];
  for (const [k, v] of Object.entries(env)) head.push(`${k}: ${v}`);
  head.push('', `lines: ${log.lines().length}` + (log.dropped() ? ` (oldest ${log.dropped()} dropped)` : ''), '');
  return head.concat(log.lines()).join('\n') + '\n';
}
