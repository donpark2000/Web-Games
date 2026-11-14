// Every module under src/ (not the vendored libraries) parses as an ES
// module. Many of the page's own modules (src/ui/) need a browser to run,
// so no other test imports them, and a mistake that stops one parsing
// showed only in a browser: on 2026-11-14 a second `box` declared in
// topple-scene.js stopped the whole 3D game loading ("three.js or
// cannon-es not loaded: Identifier 'box' has already been declared"),
// with the suite all passing. Parses only (node --check); nothing is run
// or written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function modules(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'vendor') out.push(...await modules(p)); } else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

test('parse: every module under src/ parses (vendor aside)', async () => {
  const files = await modules(path.join(root, 'src'));
  assert.ok(files.length > 40, `${files.length} modules found`);
  const bad = [];
  for (const f of files) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) bad.push(`${path.relative(root, f)}: ${(r.stderr.match(/SyntaxError[^\n]*/) ?? [r.stderr.trim()])[0]}`);
  }
  assert.deepEqual(bad, [], `of ${files.length} modules`);
});
