// A 3D game's drawing made lighter while it plays, if the device is slow
// (src/core/drawing.js; Q99, release 10.6): the level kept on the device
// for this release is drawn from the start, the frames are watched, and a
// level too slow steps to the next, kept and logged ("drawing lighter").

import { LEVELS, KEY, watcher, keptLevel, keepLevel, levelFromParam } from '../core/drawing.js';
import { RELEASE } from '../core/release.js';

const r1 = v => Math.round(v * 10) / 10;

// game: its name in the kept value ('topple', 'tin-can-alley'); stage: its
// drawing (setDrawing); say(msg, data): the game's log.
export function drawWatch(game, stage, say) {
  let storage = null;
  try { storage = window.localStorage; } catch { /* blocked: measured again each visit */ }
  const read = () => { try { return JSON.parse(storage?.getItem(KEY) ?? 'null'); } catch { return null; } };
  // (?drawing=lightest in the address: that level for this visit, to try a device on purpose, Q109; not kept, and it is not stepped further)
  let asked = null;
  try { asked = levelFromParam(new URLSearchParams(window.location.search).get('drawing')); } catch { /* no address to read */ }
  const raw = read(), level = asked ?? keptLevel(raw, game, RELEASE), w = watcher(level);
  const cut = stage.setDrawing(LEVELS[level].cuts);
  const before = raw?.[game];
  say('drawing', {
    level: LEVELS[level].name, release: RELEASE, ...(asked !== null ? { asked: true } : {}), ...(level ? { kept: asked === null, cut } : {}),
    ...(before && before.release !== RELEASE ? { measuredAgain: before } : {}),
  });
  return {
    get level() { return LEVELS[w.level].name; },
    // warm up again (a scene made: its first frames make its shaders)
    restart() { w.restart(); },
    // each frame drawn
    frame(t) {
      const s = w.frame(t);
      if (!s || asked !== null) return;   // (a level asked for stays as it is)
      const did = stage.setDrawing(LEVELS[s.to].cuts);
      try { storage?.setItem(KEY, JSON.stringify(keepLevel(read(), game, s.to, RELEASE))); } catch (e) { say('drawing level not kept on the device', { error: String(e) }); }
      say('drawing lighter', {
        from: LEVELS[s.from].name, to: LEVELS[s.to].name, medianMs: s.medianMs, fps: r1(1000 / s.medianMs), frames: s.frames, cut: did,
      });
    },
  };
}
