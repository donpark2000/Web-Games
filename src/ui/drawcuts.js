// The cuts to the 3D games' drawing (src/core/drawing.js's levels, and the
// speed test's runs: src/core/speedtest.js lists what each means), made to
// a drawing's three.js parts ({ renderer, scene, sun }: a stage's `three`).
// Safe to make again: after a scene or setting is added, its new materials
// and sky get them too.

import * as THREE from '../vendor/three/three.module.min.js';

// Returns what it changed (for the log), [] if nothing.
export function applyCuts({ renderer, scene, sun }, cut) {
  const did = [];
  if (cut.pixels && renderer.getPixelRatio() !== cut.pixels) { renderer.setPixelRatio(cut.pixels); did.push('pixels'); }
  // shadows: a change of kind or on/off needs every material's shader made again
  let remake = false;
  const on = cut.shadows !== 'off';
  if (renderer.shadowMap.enabled !== on) { renderer.shadowMap.enabled = on; remake = true; }
  const type = cut.shadows === 'basic' ? THREE.BasicShadowMap : cut.shadows === 'hard' ? THREE.PCFShadowMap : null;
  if (type !== null && renderer.shadowMap.type !== type) { renderer.shadowMap.type = type; remake = true; }
  if (remake) did.push('shadows');
  if (cut.shadowSize && sun.shadow.mapSize.x !== cut.shadowSize) {
    sun.shadow.mapSize.set(cut.shadowSize, cut.shadowSize);
    sun.shadow.map?.dispose(); sun.shadow.map = null;   // made again at the new size
    did.push('shadowSize');
  }
  if (cut.reflections === false && scene.environment) { scene.environment = null; did.push('reflections'); }
  if (cut.sky === 'plain' && !scene.background?.isColor) { scene.background = new THREE.Color(scene.fog?.color ?? '#CFE7F0'); did.push('sky'); }
  let far = 0, plain = 0;
  scene.traverse(o => {
    if (cut.farTrees === false && o.userData.far && o.visible) { o.visible = false; far++; }
    for (const m of [o.material].flat()) {
      if (!m) continue;
      if (cut.surfaces === 'plain' && m.isMeshStandardMaterial && (m.normalMap || m.roughnessMap || m.aoMap || m.metalnessMap)) {
        m.normalMap = m.roughnessMap = m.aoMap = m.metalnessMap = null;
        m.needsUpdate = true;
        plain++;
      } else if (remake) m.needsUpdate = true;
    }
  });
  if (far) did.push('farTrees');
  if (plain) did.push('surfaces');
  return did;
}
