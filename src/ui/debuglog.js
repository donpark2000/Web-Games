// The on-screen debug panel (DESIGN.md "Structure"; standards §1).
// Every page logs all the time through `log`; the panel and "Save log" only
// appear when the address has ?dev (e.g. tic-tac-toe.html?dev).

import { createLog, formatReport } from '../core/log.js';

export const log = createLog();
export const devMode = new URLSearchParams(location.search).has('dev');

// Keeps ?dev on links between pages, so a test session stays in dev mode.
export const withDev = href => (devMode ? href + (href.includes('?') ? '&' : '?') + 'dev' : href);

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

function saveLog() {
  const text = formatReport(log, environment());
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = `web-games-log_${stamp}.txt`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  log.add('debug', 'log saved', { file: a.download, lines: log.lines().length });
}

// Call once per page. Records uncaught errors whether or not ?dev is on.
export function installDebugPanel(pageName) {
  addEventListener('error', e => log.add('error', e.message, { at: `${e.filename}:${e.lineno}:${e.colno}` }));
  addEventListener('unhandledrejection', e => log.add('error', 'unhandled rejection', { reason: String(e.reason) }));
  log.add('page', `${pageName} loaded`, { dev: devMode, viewport: `${innerWidth}x${innerHeight}` });
  if (!devMode) return;

  const style = document.createElement('style');
  style.textContent = `
    .dbg{position:fixed;left:8px;right:8px;bottom:8px;z-index:1000;max-width:720px;margin:0 auto;
      background:#101a22ee;color:#d8e6ee;border-radius:12px;font:12px/1.4 ui-monospace,Consolas,monospace;
      box-shadow:0 4px 16px #0006}
    .dbg header{display:flex;gap:6px;align-items:center;padding:6px 8px}
    .dbg header b{flex:1}
    .dbg button{font:inherit;color:inherit;background:#2a3a48;border:1px solid #46596a;border-radius:6px;padding:3px 8px;cursor:pointer}
    .dbg pre{margin:0;padding:0 8px 8px;max-height:30vh;overflow:auto;white-space:pre-wrap;word-break:break-word}
    .dbg.min pre{display:none}`;
  document.head.append(style);

  const panel = document.createElement('section');
  panel.className = 'dbg';
  panel.setAttribute('aria-label', 'Debug log');
  panel.innerHTML = `<header><b>Debug log</b><button type="button" data-a="save">Save log</button>
    <button type="button" data-a="clear">Clear</button><button type="button" data-a="min">Hide</button></header><pre></pre>`;
  const pre = panel.querySelector('pre');
  const show = () => { pre.textContent = log.lines().join('\n'); pre.scrollTop = pre.scrollHeight; };
  panel.addEventListener('click', e => {
    const a = e.target.dataset?.a;
    if (a === 'save') saveLog();
    if (a === 'clear') { log.clear(); show(); }
    if (a === 'min') {
      const min = panel.classList.toggle('min');
      e.target.textContent = min ? 'Show' : 'Hide';
    }
  });
  document.body.append(panel);
  // The panel floats over the page; keep room under the page so it never
  // covers a button (a tap on "Play!" once hit "Save log" instead).
  const basePad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
  new ResizeObserver(() => {
    document.body.style.paddingBottom = `${basePad + panel.offsetHeight + 16}px`;
  }).observe(panel);
  log.onLine(show);
  show();
}
