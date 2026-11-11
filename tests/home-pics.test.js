// The 3D games' home pictures' tool (tools/home-pics.js, journal Q66): what
// can be checked without a browser. Reading a WebP's size from its header
// (all three kinds), and the page that makes them making the same games the
// tool saves. Nothing written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webpSize, PICS, PIC_SIZE } from '../tools/home-pics.js';

const root = new URL('../', import.meta.url);
const riff = (kind, body) => {
  const chunk = Buffer.concat([Buffer.from(kind, 'latin1'), Buffer.alloc(4), body]);
  const head = Buffer.alloc(12);
  head.write('RIFF', 0, 'latin1'); head.writeUInt32LE(chunk.length + 4, 4); head.write('WEBP', 8, 'latin1');
  return Buffer.concat([head, chunk]);
};

test('home pictures: a WebP\'s size from its header, lossy, lossless and extended', () => {
  // lossy (VP8): 3 bytes of frame tag, the start code 9d 01 2a, then 14-bit width and height
  const vp8 = Buffer.alloc(14); vp8.set([0, 0, 0, 0x9D, 0x01, 0x2A], 0); vp8.writeUInt16LE(300, 6); vp8.writeUInt16LE(200, 8);
  assert.deepEqual(webpSize(riff('VP8 ', vp8)), { width: 300, height: 200 });
  // lossless (VP8L): a signature byte, then width-1 and height-1 in 14 bits each
  const vp8l = Buffer.alloc(14); vp8l[0] = 0x2F; vp8l.writeUInt32LE((300 - 1) | ((150 - 1) << 14), 1);
  assert.deepEqual(webpSize(riff('VP8L', vp8l)), { width: 300, height: 150 });
  // extended (VP8X): 4 bytes of flags, then width-1 and height-1 in 24 bits each
  const vp8x = Buffer.alloc(14); vp8x.writeUIntLE(1024 - 1, 4, 3); vp8x.writeUIntLE(300 - 1, 7, 3);
  assert.deepEqual(webpSize(riff('VP8X', vp8x)), { width: 1024, height: 300 });
});

test('home pictures: not a WebP, or a kind not known, is refused', () => {
  assert.throws(() => webpSize(Buffer.from('\x89PNG\r\n\x1a\n' + 'x'.repeat(40), 'latin1')), /not a WebP/);
  assert.throws(() => webpSize(Buffer.alloc(10)), /not a WebP/);
  assert.throws(() => webpSize(riff('ALPH', Buffer.alloc(14))), /not known: ALPH/);
});

test('home pictures: the page makes the games the tool saves, at its size', async () => {
  const page = await readFile(new URL('tools/home-pics-page.js', root), 'utf8');
  const games = page.match(/const GAMES = \{([^}]*)\}/)?.[1] ?? '';
  const names = [...games.matchAll(/'?([\w-]+)'?\s*:|(\btopple\b)\s*,/g)].map(m => m[1] ?? m[2]);
  assert.deepEqual(names.sort(), [...PICS].sort(), `the page's games: ${games}`);
  assert.match(page, new RegExp(`export const SIZE = ${PIC_SIZE};`));
});
