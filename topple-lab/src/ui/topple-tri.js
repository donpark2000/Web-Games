// The Topple Lab's stone (2026-11-22): a photo and its normal map laid on a
// shape from three sides at once (no UVs, so no seams or stretching). It
// sticks to the thing as it moves and keeps its real size whatever the
// thing's scale. Six reads of two pictures a pixel.

import * as THREE from '../vendor/three/three.module.min.js';

// A standard material in `map` (a colour texture, repeating) and `nor` (its
// normal map, OpenGL), one copy `size` m across; bump: how deep the normal
// map looks; opts: the material's own (colour, roughness ...).
export function triplanar(map, nor, size, { bump = 1, ...opts } = {}) {
  const tex = (t, colour) => { const v = t.clone(); v.wrapS = v.wrapT = THREE.RepeatWrapping; v.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace; v.anisotropy = 4; v.needsUpdate = true; return v; };
  const m = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...opts });
  const u = { triMap: { value: tex(map, true) }, triNor: { value: tex(nor) }, triScale: { value: 1 / size }, triBump: { value: bump } };
  m.userData.tri = u;
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN; varying mat3 vTriM;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        mat4 triM = modelMatrix;
        vTriM = normalMatrix;
        #ifdef USE_INSTANCING
          triM = triM * instanceMatrix;
          vTriM = normalMatrix * mat3(normalize(instanceMatrix[0].xyz), normalize(instanceMatrix[1].xyz), normalize(instanceMatrix[2].xyz));
        #endif
        vec3 triS = vec3(length(triM[0].xyz), length(triM[1].xyz), length(triM[2].xyz));
        vTriP = position * triS; vTriN = normal;`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vTriP; varying vec3 vTriN; varying mat3 vTriM;
        uniform sampler2D triMap, triNor; uniform float triScale, triBump;`)
      .replace('#include <map_fragment>', `
        vec3 triN = normalize(vTriN), triB = pow(abs(triN), vec3(4.0)); triB /= triB.x + triB.y + triB.z;
        vec3 triP = vTriP * triScale;
        diffuseColor.rgb *= texture2D(triMap, triP.zy).rgb * triB.x + texture2D(triMap, triP.xz).rgb * triB.y + texture2D(triMap, triP.xy).rgb * triB.z;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec2 tx = (texture2D(triNor, triP.zy).xy * 2.0 - 1.0) * triB.x, ty = (texture2D(triNor, triP.xz).xy * 2.0 - 1.0) * triB.y, tz = (texture2D(triNor, triP.xy).xy * 2.0 - 1.0) * triB.z;
          vec3 d = vec3(0.0, tx.y, tx.x) + vec3(ty.x, 0.0, ty.y) + vec3(tz.x, tz.y, 0.0);
          normal = normalize(normal + vTriM * d * triBump);
        }`);
  };
  return m;
}

// A geometry's normals made smooth across corners in the same place (an
// icosahedron's triangles share none).
export function smooth(geo) {
  const p = geo.attributes.position, n = new Map(), key = i => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    const f = b.sub(a).cross(c.sub(a));
    for (let k = 0; k < 3; k++) { const q = key(i + k), v = n.get(q); if (v) v.add(f); else n.set(q, f.clone()); }
  }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const v = n.get(key(i)).clone().normalize(); out.set([v.x, v.y, v.z], i * 3); }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return geo;
}
