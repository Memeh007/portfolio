import * as THREE from "three";
import { lerp, smoothstep } from "./timeline.js";
import { BODY_LIFT, PHARYNX, W } from "./worm.js";

const MAX = 900;

/** Deterministic PRNG so the same cut always produces the same particle layout. */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class NeoblastField {
  constructor() {
    this.positions = new Float32Array(MAX * 3);
    this.alpha = new Float32Array(MAX);
    this.size = new Float32Array(MAX);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    g.setDrawRange(0, 0);
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color("#c2187a") },
        uRim: { value: new THREE.Color("#fbe7f2") },
        uScale: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        attribute float aSize;
        uniform float uScale;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uScale / -mv.z;
          vA = aAlpha;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uRim;
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          float aa = fwidth(r) * 1.5;
          float disc = 1.0 - smoothstep(0.47 - aa, 0.47, r);
          float core = 1.0 - smoothstep(0.39 - aa, 0.39, r);
          float a = disc * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(mix(uRim, uColor, core), a);
          #include <colorspace_fragment>
        }
      `,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    this.particles = [];
  }

  setFragments(fragments) {
    const rand = mulberry32(fragments.length * 7919 + Math.round(fragments[0].a * 1000));
    const list = [];
    for (const frag of fragments) {
      const wounds = [];
      if (frag.ant) wounds.push("ant");
      if (frag.post) wounds.push("post");
      if (frag.side) wounds.push("lat");
      const area = frag.side ? 0.5 : frag.b - frag.a;
      const residents = Math.round(190 * area);
      for (let n = 0, guard = 0; n < residents && guard < residents * 20; guard++) {
        const f = rand();
        const v = (rand() * 2 - 1) * 0.8;
        const s = lerp(frag.a, frag.b, f);
        // Uniform per unit area: thin regions (tail tip, neck) get proportionally fewer cells.
        if (rand() > W(s) / 0.13) continue;
        // Neoblasts are absent anterior to the eyes and from the pharynx.
        if (s < 0.1) continue;
        if (s > PHARYNX[0] && s < PHARYNX[1] && Math.abs(v) < 0.35 && !frag.side) continue;
        let wound = null;
        if (wounds.length && rand() < 0.55) {
          if (frag.side) wound = "lat";
          else if (frag.ant && frag.post) wound = f < 0.5 ? "ant" : "post";
          else wound = frag.ant ? "ant" : "post";
        }
        list.push(this.makeParticle(frag, rand, { f, v, wound, kind: "resident" }));
        n++;
      }
      for (const wound of wounds) {
        const extra = wound === "lat" ? 44 : 24;
        for (let n = 0; n < extra; n++) {
          list.push(this.makeParticle(frag, rand, { f: rand(), v: (rand() * 2 - 1) * 0.8, wound, kind: "prolif" }));
        }
      }
    }
    this.particles = list.slice(0, MAX);
    this.particles.forEach((p, i) => {
      this.size[i] = p.size;
    });
    const g = this.points.geometry;
    g.attributes.aSize.needsUpdate = true;
    g.setDrawRange(0, this.particles.length);
  }

  makeParticle(frag, rand, base) {
    return {
      frag,
      ...base,
      delay: 0.2 + rand() * 1.2,
      tz: rand(),
      tv: rand(),
      spawn: 1.6 + rand() * 1.0,
      gF: 0.13 + rand() * 0.81,
      vF: (rand() * 2 - 1) * 0.75,
      reStart: 7.5 + rand() * 1.5,
      phase: rand() * Math.PI * 2,
      size: 0.1 + rand() * 0.05,
    };
  }

  update(t, clock, motion) {
    const row = {};
    const P = this.positions;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const frag = p.frag;
      const st = frag.st;
      const zHome = st.hA + p.f * st.Lold;
      let zT = zHome;
      let vT = p.v;
      if (p.wound === "ant") {
        zT = st.hA + 0.12 + p.tz * 0.55;
        vT = p.v * 0.75;
      } else if (p.wound === "post") {
        zT = st.hA + st.Lold - 0.12 - p.tz * 0.55;
        vT = p.v * 0.75;
      } else if (p.wound === "lat") {
        vT = -frag.side * (0.5 + 0.35 * p.tv);
      }
      let z;
      let v;
      let a = 0.9;
      if (p.kind === "prolif") {
        z = zT;
        v = vT;
        a = smoothstep(p.spawn, p.spawn + 0.8, t) * 0.9;
      } else {
        const m = p.wound ? smoothstep(p.delay, p.delay + 1.6, t) : 0;
        z = lerp(zHome, zT, m);
        v = lerp(p.v, vT, m);
      }
      const re = smoothstep(p.reStart, p.reStart + 4.5, t);
      z = lerp(z, p.gF * st.Ltot, re);
      v = lerp(v, p.vF, re);
      frag.sampleRow(z, row);
      let x = row.c + v * row.h * 0.85;
      let y = BODY_LIFT + row.T * 0.35;
      if (motion) {
        x += Math.sin(clock * 1.3 + p.phase) * 0.03;
        z += Math.cos(clock * 1.1 + p.phase * 1.7) * 0.03;
        y += Math.sin(clock * 0.9 + p.phase * 0.6) * 0.01;
      }
      const g = frag.group.position;
      P[i * 3] = g.x + x;
      P[i * 3 + 1] = g.y + y;
      P[i * 3 + 2] = g.z + z - st.Ltot / 2;
      this.alpha[i] = a;
    }
    const geo = this.points.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }
}
