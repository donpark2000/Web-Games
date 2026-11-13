// The speed test (log.html's "Speed test"; Q99): Topple!'s building site,
// its park and Tin Can Alley's stall drawn still on this device, each a few
// seconds in each of the ways src/core/speedtest.js lists, the frame rate
// of each written to the log. Each run gets a new canvas and drawing (so
// "no smoothing" can be tried: a canvas keeps the antialiasing it started
// with), let go of after it. The games' own code draws the scenes; the
// cuts are made to its three.js parts (stage.three).
//
// Loaded with import() by src/ui/logpage.js only when the button is
// pressed, so the log page stays light.

import * as THREE from '../vendor/three/three.module.min.js';
import { RUNS, GROUPS, SEED, WARM_S, MEASURE_S, frameStats, pixelsFor, summary } from '../core/speedtest.js';
import { applyCuts } from './drawcuts.js';

const r1 = v => Math.round(v * 10) / 10;
const frame = () => new Promise(ok => requestAnimationFrame(ok));

// Runs the test. say(msg, data): a line in the log (area "speed");
// status(text): what's running. Returns the results ([{ group, name, fps,
// ... }]); the overlay's Stop button ends it after the run under way.
export async function runSpeedTest({ say, status = () => {} }) {
  const [park3d, stall3d, toppleWorld, topple, tcaPhysics, tca] = await Promise.all([
    import('./topple-scene.js'), import('./tin-can-alley-stall.js'), import('../core/topple-world.js'),
    import('../core/topple.js'), import('../core/tin-can-alley-physics.js'), import('../core/tin-can-alley.js'),
  ]);
  if (!park3d.webglOk()) { say('no WebGL: nothing to test'); return []; }

  // the overlay: what's running, a Stop button, the canvas below
  const box = document.createElement('div');
  box.className = 'speedbox';
  box.innerHTML = '<div class="speedtop"><p class="speedsay" aria-live="polite"></p><button type="button" class="pill">Stop</button></div><div class="speedview"></div>';
  document.body.append(box);
  const sayEl = box.querySelector('.speedsay'), view = box.querySelector('.speedview');
  let stopped = false;
  box.querySelector('button').onclick = () => { stopped = true; sayEl.textContent = 'Stopping after this one…'; };
  const show = t => { sayEl.textContent = t; status(t); };

  let lock = null;
  try { lock = await navigator.wakeLock?.request('screen'); } catch { /* the screen may dim: the run says if the page was hidden */ }

  // the scenes, made once (Topple!'s building site took 5.5 s to make on the tablet)
  const scenes = {};
  async function sceneFor(g) {
    if (scenes[g.id]) return scenes[g.id];
    const t0 = performance.now();
    if (g.game === 'topple') {
      const world = toppleWorld.createWorld();
      const s = world.makeScene(SEED, g.level, g.scene);
      scenes[g.id] = { world, parts: s.parts, stack: s.layout.stack, blocks: world.blocks.length };
    } else {
      const world = tcaPhysics.createStall();
      world.setCans(g.layout);
      scenes[g.id] = { world, cans: world.cans.length };
    }
    const { world, parts, ...about } = scenes[g.id];
    say('scene made', { scene: g.title, ...about, ms: Math.round(performance.now() - t0) });
    return scenes[g.id];
  }

  const results = [];
  let gpuSaid = false;
  for (let i = 0; i < RUNS.length && !stopped; i++) {
    const run = RUNS[i], g = GROUPS.find(x => x.id === run.group), cut = run.cut;
    show(`Speed test ${i + 1} of ${RUNS.length}: ${g.title}, ${run.name}. Don’t touch the screen.`);
    await frame();
    let stage = null, canvas = null;
    try {
      const sc = await sceneFor(g);
      const t0 = performance.now();
      canvas = document.createElement('canvas');
      view.replaceChildren(canvas);
      const make = g.game === 'topple' ? park3d.makePark3d : stall3d.makeStall3d;
      stage = make(canvas, { antialias: cut.smooth !== false });
      const { renderer } = stage.three;
      if (!gpuSaid) { gpuSaid = true; say('device', gpu(renderer)); }
      renderer.setPixelRatio(pixelsFor(cut, devicePixelRatio));
      const b = view.getBoundingClientRect(), w = Math.round(b.width), h = Math.round(b.height);
      const aspect = stage.resize(w, h);
      if (g.game === 'topple') {
        const r = await stage.setLevel(g.level);
        if (g.level > 1 && !r.photos) throw new Error(`the setting's photos didn't load (${r.error ?? '?'})`);
        stage.setScene(sc.parts);
        stage.sync(sc.world.blocks, sc.world.balls);
        stage.setSling(true);
        stage.setCamera(topple.behindView(aspect, sc.parts));
      } else {
        stage.sync([...sc.world.cans, ...sc.world.balls]);
        stage.setHeld(true);
        stage.setCamera(tca.cameraAt(null, tca.views(aspect, g.layout)));
      }
      applyCuts(stage.three, cut);   // (the games' own cuts: src/ui/drawcuts.js)
      const setupMs = Math.round(performance.now() - t0);
      // the first frame by itself (three.js makes its shaders then)
      const f0 = performance.now();
      stage.render();
      const firstMs = Math.round(performance.now() - f0);
      const m = await measure(stage);
      const info = renderer.info.render, size = renderer.getDrawingBufferSize(new THREE.Vector2());
      const res = {
        group: g.id, name: run.name, ...m, setupMs, firstMs, calls: info.calls, triangles: info.triangles,
        drawn: `${size.x}x${size.y}`, pixels: r1(pixelsFor(cut, devicePixelRatio) * 100) / 100, ...(Object.keys(cut).length ? { cut } : {}),
      };
      results.push(res);
      const { group, name, ...data } = res;
      say(`${g.title}: ${run.name}`, data);
    } catch (e) {
      results.push({ group: g.id, name: run.name, fps: null, error: String(e.message ?? e) });
      say(`${g.title}: ${run.name}: failed`, { error: String(e.message ?? e) });
    } finally {
      try { stage?.dispose(); } catch { /* gone already */ }
      canvas?.remove();
    }
  }
  say(stopped ? 'stopped' : 'done', { runs: results.length, of: RUNS.length, summary: summary(results) });
  try { await lock?.release(); } catch { /* released already */ }
  box.remove();
  return results;
}

// WARM_S s drawn, then MEASURE_S s of frames counted: frameStats', and
// whether the page was hidden on the way (the numbers don't count then).
function measure(stage) {
  return new Promise(done => {
    const times = [], cpu = [];
    let first = null, last = null, hidden = document.hidden;
    const onVis = () => { if (document.hidden) hidden = true; };
    document.addEventListener('visibilitychange', onVis);
    function tick(t) {
      first ??= t;
      const dt = last === null ? 0 : Math.min(0.05, (t - last) / 1000);
      last = t;
      stage.tick?.(dt);
      const c0 = performance.now();
      stage.render();
      const c = performance.now() - c0, s = (t - first) / 1000;
      if (s >= WARM_S) { times.push(t); cpu.push(c); }
      if (s < WARM_S + MEASURE_S) { requestAnimationFrame(tick); return; }
      document.removeEventListener('visibilitychange', onVis);
      done({ ...frameStats(times, cpu), ...(hidden ? { hidden: true } : {}) });
    }
    requestAnimationFrame(tick);
  });
}

// The graphics chip's name where the browser says it.
function gpu(renderer) {
  const gl = renderer.getContext();
  let name = null;
  try { const ext = gl.getExtension('WEBGL_debug_renderer_info'); name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch { /* not told */ }
  return {
    gpu: name, webgl: renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1', maxTexture: renderer.capabilities.maxTextureSize,
    devicePixelRatio, screen: `${screen.width}x${screen.height}`, view: `${innerWidth}x${innerHeight}`, cores: navigator.hardwareConcurrency ?? null,
    memoryGB: navigator.deviceMemory ?? null,
  };
}
