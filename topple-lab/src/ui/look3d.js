// The 3D games' camera-like look (Q139, Topple Lab change 1): tone mapping turns
// the light falling on things into screen colours as a camera does, so
// bright parts roll off instead of flattening to one colour, and exposure
// sets how bright the whole picture is. three.js r160 offers ACES (a
// film's look, more contrast) and AgX (softer, truer colours); 'none' is
// how the games were drawn before. A photo backdrop (an sRGB sky) is
// never tone mapped by three.js, so the photo stays as it was taken.
//
// For checking (the lab's topple.look hook), a look can also scale the
// scene's lights as the level set them (lights: { hemi, sun, fill, point,
// env }, each a multiplier; 1 = as now), and keep the glowing things out of
// the tone mapping (glowRaw: true: anything that glows by itself, and the
// halos added on top, drawn as they are, so they keep their glow).

import * as THREE from '../vendor/three/three.module.min.js';   // the main site's, through the import map

export const TONES = { none: THREE.NoToneMapping, aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping };
const LIGHTS = ['hemi', 'sun', 'fill', 'point', 'env'];

// Sets a renderer's look; returns it as set (for the log). An unknown tone
// is refused, so a typo in a checking hook can't pass for a choice.
export function setLook(renderer, { tone, exposure }) {
  if (!(tone in TONES)) throw new Error(`no such tone: ${tone} (${Object.keys(TONES).join(', ')})`);
  if (!(exposure > 0 && exposure < 8)) throw new Error(`exposure out of range: ${exposure}`);
  renderer.toneMapping = TONES[tone];
  renderer.toneMappingExposure = exposure;
  return { tone, exposure };
}

// Which of LIGHTS a light is: the sun casts shadows; the other directional
// one is the fill.
const kindOf = l => (l.isHemisphereLight ? 'hemi' : l.isDirectionalLight ? (l.castShadow ? 'sun' : 'fill') : l.isPointLight ? 'point' : null);

// Scales a scene's lights from what the level set (recorded the first time,
// and again whenever the game has set a light since). Returns how many of
// each it scaled.
export function scaleLights(scene, lights = {}) {
  for (const k of Object.keys(lights)) {
    if (!LIGHTS.includes(k)) throw new Error(`no such light: ${k} (${LIGHTS.join(', ')})`);
    if (!(lights[k] >= 0 && lights[k] < 10)) throw new Error(`${k} out of range: ${lights[k]}`);
  }
  const n = {};
  scene.traverse(o => {
    const k = o.isLight && kindOf(o);
    if (k) {
      if (o.intensity !== o.userData.lookSet) o.userData.lookBase = o.intensity;
      o.intensity = o.userData.lookSet = o.userData.lookBase * (lights[k] ?? 1);
      n[k] = (n[k] ?? 0) + 1;
    }
    for (const m of [o.material].flat().filter(Boolean)) {
      if (!('envMapIntensity' in m)) continue;
      if (m.userData.envBase === undefined) m.userData.envBase = m.envMapIntensity;
      m.envMapIntensity = m.userData.envBase * (lights.env ?? 1);
    }
  });
  return n;
}

// Keeps what glows by itself (emissive materials, additive halos) out of the
// tone mapping, or puts it back. Returns how many materials it set.
export function glowRaw(scene, raw) {
  const seen = new Set();
  scene.traverse(o => {
    for (const m of [o.material].flat().filter(Boolean)) {
      const glows = (m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) || m.blending === THREE.AdditiveBlending;
      if (!glows || seen.has(m)) continue;
      seen.add(m);
      if (m.toneMapped !== !raw) { m.toneMapped = !raw; m.needsUpdate = true; }
    }
  });
  return seen.size;
}
