// The Topple Lab's saguaro (2026-11-22): its ribs' shape round a stem, kept
// apart from the drawing so it can be tested. No DOM, no three.js.

export const RIBS = 13;
const DEPTH = 0.1;
// At angle a round the stem: 1 on a ridge's middle, 0 in a groove.
export const rib = a => Math.abs(Math.cos(a * RIBS / 2));
// How far out the skin is there, as a share of the physics' stem.
export const ribR = a => 1 + DEPTH * (2 * Math.pow(rib(a), 0.8) - 1.25);
