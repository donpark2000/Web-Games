// Makes the app's icons (DESIGN.md "Offline app"): the happy bear on
// sunny yellow, drawn from the site's own bear (src/ui/faces.js).
//   node tools/make-icons.js     -> icons/icon.svg and the PNGs
// The PNGs are drawn by Edge or Chrome without a window (headless); set
// BROWSER to its path if it isn't in the usual place. Run it again only if
// the icon or the bear changes; the tests check icons/icon.svg against
// iconSvg() and the PNGs' sizes.

import { writeFile, readFile, mkdir, mkdtemp, rm, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svg } from '../src/ui/faces.js';

// The PNGs: file name and size in pixels. 192 and 512 for the manifest
// (512 also as the "maskable" one, which Android trims to its own shape),
// 180 for iPhone and iPad's home screen.
export const PNGS = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

// The icon, edge to edge (each system rounds or trims the corners itself).
// The bear stays inside the middle circle (radius 40 of 100), the part
// Android keeps when it trims an icon to a circle. From mockup v1, idea A
// (developer, 2026-10-10).
export function iconSvg() {
  const bear = svg('bear', 'winner').replace(/<svg class="av" viewBox="0 0 100 100" aria-hidden="true">/,
    '<svg x="14" y="14" width="72" height="72" viewBox="0 0 100 100">');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + '<rect width="100" height="100" fill="#F7B928"/><circle cx="50" cy="52" r="40" fill="#FFD25E"/>'
    + bear + '</svg>\n';
}

// A PNG's width and height, from its header.
export function pngSize(buf) {
  if (buf.length < 24 || buf.toString('latin1', 1, 4) !== 'PNG') throw new Error('not a PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Every PNG is drawn in a window this big, scaled down to its size: a
// headless window won't go narrower than about 500 px, so a smaller one
// is cut off (2026-10-10: a 192 px window gave the icon's left edge only).
const SHOT = 512;

async function findBrowser() {
  const tries = [process.env.BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
  for (const b of tries) {
    try { await access(b); return b; } catch { /* next */ }
  }
  throw new Error('no Edge or Chrome found: set BROWSER to its path');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = path.join(root, 'icons');
  await mkdir(dir, { recursive: true });
  const icon = iconSvg();
  await writeFile(path.join(dir, 'icon.svg'), icon);
  console.log('icons/icon.svg');
  const browser = await findBrowser();
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'icons-'));
  try {
    const page = path.join(tmp, 'icon.html');
    await writeFile(page, '<!doctype html><style>html,body{margin:0;overflow:hidden;background:#F7B928}svg{display:block;width:100vw;height:100vh}</style>' + icon);
    for (const { file, size } of PNGS) {
      const out = path.join(dir, file);
      execFileSync(browser, ['--headless', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${path.join(tmp, 'profile')}`,
        `--window-size=${SHOT},${SHOT}`, `--force-device-scale-factor=${size / SHOT}`, `--screenshot=${out}`, pathToFileURL(page).href], { stdio: 'ignore' });
      const got = pngSize(await readFile(out));
      if (got.width !== size || got.height !== size) throw new Error(`${file}: ${got.width}x${got.height}, not ${size}x${size}`);
      console.log(`icons/${file} ${size}x${size}`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
