// A tiny local web server for trying the site before it's on GitHub Pages.
// No packages needed:
//   node tools/serve.js            -> http://localhost:8123/
//   node tools/serve.js 9000       -> another port
// It only listens on this computer (127.0.0.1) and only serves files inside
// the repo folder. Nothing is cached, so a browser reload shows edits.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

export function createServer(root, { log = () => {} } = {}) {
  const base = path.resolve(root);
  return http.createServer(async (req, res) => {
    const send = (code, body, type = 'text/plain; charset=utf-8') => {
      res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(body);
      log(`${code} ${req.method} ${req.url}`);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return send(400, 'Bad address');
    }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(base, '.' + rel);
    if (file !== base && !file.startsWith(base + path.sep)) return send(403, 'Outside the site folder');
    try {
      const data = await readFile(file);
      send(200, req.method === 'HEAD' ? undefined : data, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    } catch {
      send(404, 'Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.argv[2] || process.env.PORT || 8123);
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  createServer(root, { log: line => console.log(line) }).listen(port, '127.0.0.1', () => {
    console.log(`Web Games: http://localhost:${port}/  (debug log: http://localhost:${port}/log.html)`);
    console.log('Press Ctrl+C to stop.');
  });
}
