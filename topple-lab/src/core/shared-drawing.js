// The Topple Lab: one drawing level for both worlds (Q142, 2026-11-22;
// developer: "retain the need for lighter drawing on the same device at all
// levels and worlds"). src/ui/drawwatch.js watches the frames of whichever
// world is shown and sets the cuts here; they're made to every world's
// drawing there is, and to one made later as it's made. No DOM.

// drawings(): the worlds' drawings made so far (each with setDrawing(cuts),
// which returns what it changed); null ones are left out.
export function sharedDrawing(drawings) {
  let cuts = {};
  const made = () => drawings().filter(Boolean);
  return {
    // the cuts for every world from now on; returns what they changed, each once
    setDrawing(c) { cuts = { ...c }; return [...new Set(made().flatMap(d => d.setDrawing(cuts)))]; },
    // a world's drawing just made: the cuts so far
    catchUp(d) { return d.setDrawing(cuts); },
    get cuts() { return { ...cuts }; },
  };
}
