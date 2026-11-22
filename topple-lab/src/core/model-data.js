// The Topple Lab's photographed models (2026-11-22, journal "Topple Lab,
// levels 2-10"): a Poly Haven model cut down to a few hundred triangles
// and kept as one small JSON file (topple-lab/data/models/<name>.json):
//   { asset, size: [x, y, z] m, verts, tris, uv: [u0, v0, u1, v1],
//     p, n, u, i: base64 of Int16 x 3, Int8 x 3, Uint16 x 2, Uint16 }
// Read here, apart from the drawing, so it can be tested. No DOM, no three.js.

const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const as = (T, b64) => { const b = bytes(b64); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };

// The model's arrays: { position, normal, uv (Float32Array), index
// (Uint16Array), size }, in metres: y up, standing on y = 0, its middle over
// x = z = 0. uv's v runs up (as three.js's textures; the file's runs down).
// Throws on a file that doesn't add up.
export function decodeModel(J) {
  const p = as(Int16Array, J.p), n = as(Int8Array, J.n), u = as(Uint16Array, J.u), index = as(Uint16Array, J.i);
  if (p.length !== J.verts * 3 || n.length !== J.verts * 3 || u.length !== J.verts * 2) throw new Error(`${J.asset}: not ${J.verts} corners`);
  if (index.length !== J.tris * 3) throw new Error(`${J.asset}: not ${J.tris} triangles`);
  for (const k of index) if (k >= J.verts) throw new Error(`${J.asset}: a triangle's corner ${k} of ${J.verts}`);
  const position = new Float32Array(p.length), normal = new Float32Array(n.length), uv = new Float32Array(u.length);
  const [sx, sy, sz] = J.size, [u0, v0, u1, v1] = J.uv, at = [-sx / 2, 0, -sz / 2];
  for (let k = 0; k < J.verts; k++) {
    for (let a = 0; a < 3; a++) position[k * 3 + a] = at[a] + (p[k * 3 + a] + 32768) / 65535 * [sx, sy, sz][a];
    const [x, y, z] = [n[k * 3], n[k * 3 + 1], n[k * 3 + 2]], L = Math.hypot(x, y, z) || 1;
    normal[k * 3] = x / L; normal[k * 3 + 1] = y / L; normal[k * 3 + 2] = z / L;
    uv[k * 2] = u0 + u[k * 2] / 65535 * (u1 - u0);
    uv[k * 2 + 1] = 1 - (v0 + u[k * 2 + 1] / 65535 * (v1 - v0));
  }
  return { position, normal, uv, index, size: [sx, sy, sz] };
}
