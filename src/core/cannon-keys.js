// cannon-es's touch keys that can't overflow (journal Q136). cannon-es keys
// each pair of bodies (and of shapes) touching as `i << 16 | j` from their
// ids (OverlapKeeper.getKey), and the id counters (Body.idCounter,
// Shape.idCounter) count every body and shape a page or process ever makes.
// Past an id of 32767 the key goes negative, past 65535 the ids run into each
// other, and `beginContact` / `endContact` stop being reported for those
// bodies (measured: past ~33k bodies some touches lost, past ~65k all of a
// new ball's). Here a world's two keepers key a pair as i * KEY_SPAN + j,
// numbers, not bit shifts, and unpack it the same way: exact up to ids of
// KEY_SPAN (67 million) each, well inside a double's whole numbers.
// No DOM: the tests and tools run it under Node.

export const KEY_SPAN = 2 ** 26;

const unpack = (out, key) => { const i = Math.floor(key / KEY_SPAN); out.push(i, key - i * KEY_SPAN); };

function fixKeeper(k) {
  k.getKey = (i, j) => (j < i ? j * KEY_SPAN + i : i * KEY_SPAN + j);
  // (as cannon-es's getDiff, but unpacking the keys above)
  k.getDiff = (additions, removals) => {
    const a = k.current, b = k.previous;
    let j = 0;
    for (let i = 0; i < a.length; i++) {
      while (a[i] > b[j]) j++;
      if (a[i] !== b[j]) unpack(additions, a[i]);
    }
    j = 0;
    for (let i = 0; i < b.length; i++) {
      while (b[i] > a[j]) j++;
      if (a[j] !== b[i]) unpack(removals, b[i]);
    }
  };
}

// Give a cannon-es world keys that can't overflow (before its first step). Returns the world.
export function safeContactKeys(world) {
  fixKeeper(world.bodyOverlapKeeper);
  fixKeeper(world.shapeOverlapKeeper);
  world.safeKeys = true;
  return world;
}
