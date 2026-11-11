// Makes the 3D games' home pictures (DESIGN.md "3D games", journal Q66): a
// still from each game, drawn by the game itself.
//   node tools/home-pics.js              -> icons/home/<game>.webp
//   node tools/home-pics.js --out <dir>  -> into another folder (to look first)
// It serves the site on this computer (tools/serve.js), opens
// tools/home-pics.html in Edge or Chrome without a window (headless; set
// BROWSER to its path if it isn't in the usual place), which plays each
// game to a set moment and cuts the picture out (tools/home-pics-page.js),
// and saves what it makes. Run it again when a game's look changes, then
// node tools/offline.js. The tests check the pictures are there, the right
// size and small enough.

import { writeFile, mkdir, mkdtemp, rm, readFile } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from './serve.js';
import { findBrowser } from './make-icons.js';

export const PICS_DIR = 'icons/home';
export const PICS = ['topple', 'tin-can-alley', 'five-dice-3d'];
export const PIC_SIZE = 300;
export const MAX_BYTES = 40 * 1024;

// A WebP's width and height, from its header (lossy VP8, lossless VP8L or
// extended VP8X).
export function webpSize(buf) {
  if (buf.length < 30 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') throw new Error('not a WebP');
  const kind = buf.toString('latin1', 12, 16);
  if (kind === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF };
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return { width: (b & 0x3FFF) + 1, height: ((b >> 14) & 0x3FFF) + 1 }; }
  if (kind === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  throw new Error(`a WebP of a kind not known: ${kind}`);
}

// A small DevTools client over the browser's WebSocket.
function devtools(url) {
  const ws = new WebSocket(url);
  let id = 0;
  const waiting = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (!m.id || !waiting.has(m.id)) return;
    const { ok, no } = waiting.get(m.id);
    waiting.delete(m.id);
    if (m.error) no(new Error(`${m.error.message}`)); else ok(m.result);
  };
  return {
    open: () => new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('could not reach the browser')); }),
    send: (method, params = {}, sessionId) => new Promise((ok, no) => {
      const m = { id: ++id, method, params, ...(sessionId ? { sessionId } : {}) };
      waiting.set(m.id, { ok, no });
      ws.send(JSON.stringify(m));
    }),
    close: () => ws.close(),
  };
}

const MAKE_MS = 120000;
const say = (...a) => console.error('home-pics:', ...a);
// A browser that couldn't be told to close (on Windows: found by its
// profile folder, which is this run's own).
function stopLeftovers(tmp) {
  if (process.platform !== 'win32') return;
  const ps = `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' or Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${tmp.replace(/'/g, "''")}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  try { execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' }); say('a browser left running was stopped'); } catch { /* nothing to stop */ }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(ok, what, ms) {
  for (const t0 = Date.now(); Date.now() - t0 < ms; await wait(100)) { const v = await ok(); if (v) return v; }
  throw new Error(`timed out: ${what}`);
}

// Makes the pictures in headless `browser` from the site at `root`; returns
// [{ name, bytes, data (Buffer), ...how it was made }].
export async function makePics(root, browser, names = PICS, opts = {}) {
  const server = createServer(root);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'home-pics-'));
  let dt = null;
  try {
    const url = `http://localhost:${server.address().port}/tools/home-pics.html?tool`;
    // twice the pixels, so a picture cut from the game is sharp at 300 px
    spawn(browser, ['--headless', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${path.join(tmp, 'profile')}`,
      '--window-size=1000,1000', '--force-device-scale-factor=2', url], { stdio: 'ignore' }).on('error', () => {});
    // Edge's launcher can hand over to another process and exit: the
    // browser says where it listens in its profile folder
    const portFile = path.join(tmp, 'profile', 'DevToolsActivePort');
    const [port, wsPath] = (await waitFor(() => readFile(portFile, 'utf8').catch(() => ''), 'the browser starting', 30000)).trim().split('\n');
    say('the browser is up, port', port);
    dt = devtools(`ws://127.0.0.1:${port}${wsPath}`);
    await dt.open();
    const page = await waitFor(async () => (await dt.send('Target.getTargets')).targetInfos.find(t => t.type === 'page' && t.url.startsWith(url)), 'the page', 20000);
    const { sessionId } = await dt.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    const run = async expression => {
      const r = await dt.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    };
    await waitFor(() => run('!!window.homePics'), 'tools/home-pics-page.js', 20000);
    say('the page is up; making', names.join(', '));
    try {
      const pics = await Promise.race([run(`homePics.make(${JSON.stringify(names)}, ${JSON.stringify(opts)})`),
        wait(MAKE_MS).then(() => { throw new Error(`not made within ${MAKE_MS / 1000} s`); })]);
      return pics.map(({ data, ...p }) => ({ ...p, data: Buffer.from(data.replace(/^data:image\/webp;base64,/, ''), 'base64') }));
    } catch (e) {
      // what the page got to (its log)
      const said = await run('document.getElementById("log").textContent').catch(() => '');
      throw new Error(`${e.message}\nthe page's log:\n${said}`);
    }
  } finally {
    let closed = false;
    if (dt) { closed = await dt.send('Browser.close').then(() => true, () => false); dt.close(); }
    if (!closed) stopLeftovers(tmp);
    server.closeAllConnections();
    await new Promise(r => server.close(r));
    // the browser lets go of its profile a moment after closing
    for (let i = 0; i < 20; i++) { try { await rm(tmp, { recursive: true, force: true }); break; } catch { await wait(250); } }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const i = process.argv.indexOf('--out');
  const dir = i > 0 ? path.resolve(process.argv[i + 1]) : path.join(root, PICS_DIR);
  await mkdir(dir, { recursive: true });
  const pics = await makePics(root, await findBrowser());
  for (const p of pics) {
    const out = path.join(dir, `${p.name}.webp`);
    const { width, height } = webpSize(p.data);
    if (width !== PIC_SIZE || height !== PIC_SIZE) throw new Error(`${p.name}: ${width}x${height}, not ${PIC_SIZE}x${PIC_SIZE}`);
    await writeFile(out, p.data);
    const { data, name, bytes, ...how } = p;
    console.log(`${path.relative(root, out).replace(/\\/g, '/')} ${width}x${height} ${(bytes / 1024).toFixed(1)} KB ${JSON.stringify(how)}`);
  }
}
