import * as THREE from "three";
import { clamp, lerp, phases, smoothstep } from "./timeline.js";

/* Body-plan constants, in canonical units: s = 0 (head tip) → 1 (tail tip), lengths as fractions of L0. */
export const L0 = 10;
export const HEAD_FRAC = 0.2;
export const TAIL_FRAC = 0.25;
export const PHARYNX = [0.42, 0.64];
const EYE_S = 0.07;
const EYE_U = 0.3;
const VENTRAL = 0.4;
export const BODY_LIFT = 0.11;

const NR = 150;
const NC = 40;
const PR = 26;
const PC = 16;
const NS = 9;

function monotoneCubic(xs, ys) {
  const n = xs.length;
  const d = [];
  const m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (x) => {
    x = clamp(x, xs[0], xs[n - 1]);
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] > x) hi = mid;
      else lo = mid;
    }
    const h = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * h * m[lo] +
      (-2 * t3 + 3 * t2) * ys[hi] +
      (t3 - t2) * h * m[hi]
    );
  };
}

// Half-width envelope of a gliding Dugesia-like worm (triangular head, neck, broad trunk, pointed tail).
const envelope = monotoneCubic(
  [0, 0.025, 0.06, 0.1, 0.14, 0.22, 0.33, 0.46, 0.58, 0.7, 0.81, 0.9, 0.96, 1],
  [0.012, 0.036, 0.054, 0.052, 0.056, 0.074, 0.091, 0.1, 0.099, 0.09, 0.07, 0.046, 0.022, 0.004],
);

/** Canonical half-width including the pointed auricles. */
export function W(s) {
  return envelope(s) + 0.036 * Math.exp(-Math.abs(s - 0.075) / 0.0105);
}

/** Canonical dorsal thickness; auricles are thin flaps so they use the envelope only. */
function Tc(s) {
  return 0.026 * Math.pow(clamp(envelope(s) / 0.07, 0.18, 1), 0.75);
}

function gridIndex(rows, cols, wrap) {
  const idx = [];
  const span = wrap ? cols : cols - 1;
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < span; j++) {
      const j1 = (j + 1) % cols;
      const a = i * cols + j;
      const b = i * cols + j1;
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + j1;
      idx.push(a, b, c, b, d, c);
    }
  }
  return idx;
}

function dynamicAttr(array, size) {
  return new THREE.BufferAttribute(array, size).setUsage(THREE.DynamicDrawUsage);
}

export function createBodyMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.35, 1, 0.45).normalize() },
      uPigA: { value: new THREE.Color("#3a271c") },
      uPigB: { value: new THREE.Color("#6e4c35") },
      uPale: { value: new THREE.Color("#efe2cf") },
      uWound: { value: new THREE.Color("#d9806f") },
    },
    vertexShader: /* glsl */ `
      attribute float aPig;
      attribute float aWound;
      attribute vec2 aTex;
      varying vec3 vN;
      varying vec3 vW;
      varying float vPig;
      varying float vWound;
      varying vec2 vTex;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vPig = aPig;
        vWound = aWound;
        vTex = aTex;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightDir;
      uniform vec3 uPigA;
      uniform vec3 uPigB;
      uniform vec3 uPale;
      uniform vec3 uWound;
      varying vec3 vN;
      varying vec3 vW;
      varying float vPig;
      varying float vWound;
      varying vec2 vTex;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 L = normalize(uLightDir);

        float mottle = 0.5 * noise(vTex * 3.1) + 0.32 * noise(vTex * 7.7 + 3.0) + 0.18 * noise(vTex * 19.0 + 7.0);
        vec3 pigment = mix(uPigA, uPigB, smoothstep(0.32, 0.72, mottle));
        vec3 base = mix(uPale * (0.94 + 0.08 * mottle), pigment, vPig);
        base = mix(base, uWound, vWound * 0.8);

        float wrap = clamp((dot(N, L) + 0.45) / 1.45, 0.0, 1.0);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float rim = pow(1.0 - ndv, 2.4);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 42.0) * 0.28;

        vec3 col = base * (0.3 + 0.82 * wrap);
        col += spec * vec3(1.0, 0.97, 0.92);
        // light scattering through the thin margins
        col += rim * mix(vec3(0.95, 0.82, 0.7), base * 1.8, 0.45) * 0.42;

        float alpha = mix(0.8, 0.92, vPig);
        alpha = mix(alpha, alpha * 0.7, rim);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
}

export function createShared() {
  return {
    bodyMaterial: createBodyMaterial(),
    shadowMaterial: new THREE.MeshBasicMaterial({
      color: 0x000000,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    eyeGeometry: new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2),
  };
}

function makeEye(shared) {
  // Double-sided because posterior (ectopic) heads mirror the eye group with a negative z scale.
  const eyeOpts = { transparent: true, depthWrite: false, side: THREE.DoubleSide };
  const patchMat = new THREE.MeshBasicMaterial({ color: "#f3eadb", ...eyeOpts });
  const cupMat = new THREE.MeshBasicMaterial({ color: "#0d0a09", ...eyeOpts });
  const patch = new THREE.Mesh(shared.eyeGeometry, patchMat);
  const cup = new THREE.Mesh(shared.eyeGeometry, cupMat);
  patch.scale.set(0.115, 1, 0.09);
  cup.scale.set(0.062, 1, 0.062);
  cup.position.y = 0.002;
  patch.renderOrder = 3;
  cup.renderOrder = 4;
  const group = new THREE.Group();
  group.add(patch, cup);
  group.visible = false;
  return { group, patch, cup, materials: [patchMat, cupMat] };
}

function makeTube(rows, cols, material) {
  const count = (rows + 2) * cols;
  const geometry = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  geometry.setAttribute("position", dynamicAttr(pos, 3));
  geometry.setIndex(gridIndex(rows + 2, cols, true));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return { mesh, pos, geometry };
}

/**
 * One piece of the worm. `spec.kind` is "intact", "transverse" (covers canonical [a, b]),
 * "left" or "right" (sagittal halves).
 *
 * Regeneration is modelled as three segments laid head→tail along body coordinate z:
 * [anterior blastema | old tissue | posterior blastema]. Old tissue displays the canonical
 * profile over [oa, ob], which remodels from the cut interval [a, b] toward its slot in a
 * complete worm; blastemas grow from a rounded cap into a head or tail shape.
 */
export class Fragment {
  constructor(spec, shared) {
    const { kind, a, b } = spec;
    this.spec = spec;
    this.kind = kind;
    this.a = a;
    this.b = b;
    this.cut = kind !== "intact";
    this.ant = kind === "transverse" && a > 1e-3;
    this.post = kind === "transverse" && b < 1 - 1e-3;
    this.side = kind === "left" ? -1 : kind === "right" ? 1 : 0;
    this.Lf = !this.cut ? L0 : this.side ? 0.78 * L0 : L0 * (0.36 + 0.6 * (b - a));
    this.oldHead = a < 1e-3;

    const overlap = Math.min(b, PHARYNX[1]) - Math.max(a, PHARYNX[0]);
    const full = overlap >= PHARYNX[1] - PHARYNX[0] - 1e-6;
    this.oldPharynx = overlap <= 0 ? "none" : full && !this.side ? "full" : "partial";
    this.needsPharynx = this.cut && this.oldPharynx !== "full";

    this.st = {};
    this.row = {};
    this.ph = phases(0);
    this.eyeAnchors = [];

    this.group = new THREE.Group();

    const count = (NR + 2) * NC;
    this.pos = new Float32Array(count * 3);
    this.pig = new Float32Array(count);
    this.wnd = new Float32Array(count);
    this.tex = new Float32Array(count * 2);
    this.rowC = new Float32Array(NR);
    this.rowH = new Float32Array(NR);
    this.rowZ = new Float32Array(NR);
    const body = new THREE.BufferGeometry();
    body.setAttribute("position", dynamicAttr(this.pos, 3));
    body.setAttribute("aPig", dynamicAttr(this.pig, 1));
    body.setAttribute("aWound", dynamicAttr(this.wnd, 1));
    body.setAttribute("aTex", dynamicAttr(this.tex, 2));
    body.setIndex(gridIndex(NR + 2, NC, true));
    this.body = new THREE.Mesh(body, shared.bodyMaterial);
    this.body.frustumCulled = false;
    this.body.renderOrder = 2;
    this.body.position.y = BODY_LIFT;

    this.shadowPos = new Float32Array(NR * NS * 3);
    this.shadowCol = new Float32Array(NR * NS * 4);
    const shadow = new THREE.BufferGeometry();
    shadow.setAttribute("position", dynamicAttr(this.shadowPos, 3));
    shadow.setAttribute("color", dynamicAttr(this.shadowCol, 4));
    shadow.setIndex(gridIndex(NR, NS, false));
    this.shadow = new THREE.Mesh(shadow, shared.shadowMaterial);
    this.shadow.frustumCulled = false;
    this.shadow.renderOrder = 1;

    // Drawn over the body without depth testing so it reads as an organ seen through translucent tissue.
    const pharynxMaterial = () =>
      new THREE.MeshStandardMaterial({
        color: "#f1dcc6",
        emissive: "#4a3226",
        roughness: 0.5,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
    this.pharynxOld = makeTube(PR, PC, pharynxMaterial());
    this.pharynxNew = makeTube(PR, PC, pharynxMaterial());
    for (const p of [this.pharynxOld, this.pharynxNew]) {
      p.mesh.position.y = BODY_LIFT;
      p.mesh.renderOrder = 2.5;
    }

    this.eyes = [0, 1, 2, 3].map(() => makeEye(shared));
    const eyeRoot = new THREE.Group();
    eyeRoot.position.y = BODY_LIFT;
    for (const e of this.eyes) eyeRoot.add(e.group);

    this.group.add(this.shadow, this.pharynxOld.mesh, this.pharynxNew.mesh, this.body, eyeRoot);
  }

  get name() {
    return this.spec.name;
  }

  /** What this fragment has to rebuild, in plain words. */
  regrows(polarityBlocked) {
    if (!this.cut) return "";
    const parts = [];
    if (this.ant) parts.push("head");
    if (this.post) parts.push(polarityBlocked ? "2nd head" : "tail");
    if (this.side) parts.push(this.side < 0 ? "right side" : "left side");
    return parts.join(" + ");
  }

  update(t, polarityBlocked) {
    const ph = phases(t);
    this.ph = ph;
    const st = this.st;
    const cut = this.cut;
    const r = cut ? ph.remodel : 0;
    st.t = t;
    st.twoHead = this.post && polarityBlocked;
    st.cl = cut ? ph.closure : 1;
    st.blast = cut ? ph.blastema : 0;
    st.d = cut ? ph.differentiate : 0;
    st.pigRec = ph.pigment;
    st.aF = this.ant ? HEAD_FRAC : 0;
    st.bF = this.post ? 1 - (st.twoHead ? HEAD_FRAC : TAIL_FRAC) : 1;
    st.oa = lerp(this.a, st.aF, r);
    st.ob = lerp(this.b, st.bF, r);
    st.S = lerp(L0, this.Lf, r);
    st.Lold = (st.ob - st.oa) * st.S;
    const g = cut ? ph.growth : 0;
    st.wJa = W(st.oa) * st.S;
    st.wJp = W(st.ob) * st.S;
    st.hA = this.ant ? st.cl * 0.24 * st.wJa * (1 - g) + g * HEAD_FRAC * st.S : 0;
    const postFrac = st.twoHead ? HEAD_FRAC : TAIL_FRAC;
    st.hP = this.post ? st.cl * 0.24 * st.wJp * (1 - g) + g * postFrac * st.S : 0;
    st.Ltot = st.hA + st.Lold + st.hP;
    st.uE = this.side ? lerp(0.06 * st.cl, 1, g) : 1;
    st.oldEdge = lerp(0, 0.12, r);
  }

  /** Cross-section at body coordinate z (0 = anterior tip, Ltot = posterior tip). */
  sampleRow(z, o = this.row) {
    const st = this.st;
    if (st.hA > 1e-6 && z < st.hA) {
      const q = clamp(z / st.hA, 0, 1);
      const dome = Math.sqrt(Math.max(0, q * (2 - q)));
      const sEq = q * HEAD_FRAC;
      const hwHead = W(sEq) * st.S * (W(st.oa) / W(HEAD_FRAC));
      const tJ = Tc(st.oa) * st.S;
      o.hw = lerp(dome * st.wJa, hwHead, st.d);
      o.T = lerp(Math.pow(dome, 0.7) * tJ, Tc(sEq) * st.S * (Tc(st.oa) / Tc(HEAD_FRAC)), st.d);
      o.s = sEq;
      o.newness = st.blast * (1 - 0.55 * smoothstep(0.75, 1, q));
      o.wound = 0;
    } else if (st.hP <= 1e-6 || z <= st.hA + st.Lold) {
      const k = clamp((z - st.hA) / st.Lold, 0, 1);
      const s = lerp(st.oa, st.ob, k);
      o.hw = W(s) * st.S;
      o.T = Tc(s) * st.S;
      o.s = s;
      let n = 0;
      let w = 0;
      if (this.ant) {
        const dz = z - st.hA;
        n = Math.max(n, st.blast * 0.45 * (1 - smoothstep(0, 0.45, dz)));
        w = Math.max(w, 1 - smoothstep(0, 0.3, dz));
      }
      if (this.post) {
        const dz = st.hA + st.Lold - z;
        n = Math.max(n, st.blast * 0.45 * (1 - smoothstep(0, 0.45, dz)));
        w = Math.max(w, 1 - smoothstep(0, 0.3, dz));
      }
      o.newness = n;
      o.wound = w * (1 - st.cl);
    } else {
      const p = clamp((z - st.hA - st.Lold) / st.hP, 0, 1);
      const dome = Math.sqrt(Math.max(0, 1 - p * p));
      let sEq;
      let ratioW;
      let ratioT;
      if (st.twoHead) {
        sEq = (1 - p) * HEAD_FRAC;
        ratioW = W(st.ob) / W(HEAD_FRAC);
        ratioT = Tc(st.ob) / Tc(HEAD_FRAC);
      } else {
        sEq = st.bF + p * (1 - st.bF);
        ratioW = W(st.ob) / W(st.bF);
        ratioT = Tc(st.ob) / Tc(st.bF);
      }
      const tJ = Tc(st.ob) * st.S;
      o.hw = lerp(dome * st.wJp, W(sEq) * st.S * ratioW, st.d);
      o.T = lerp(Math.pow(dome, 0.7) * tJ, Tc(sEq) * st.S * ratioT, st.d);
      o.s = sEq;
      o.newness = st.blast * (1 - 0.55 * smoothstep(0.75, 1, 1 - p));
      o.wound = 0;
    }
    if (this.side === 0) {
      o.L = -o.hw;
      o.R = o.hw;
    } else if (this.side < 0) {
      o.L = -o.hw;
      o.R = o.hw * st.uE;
    } else {
      o.L = -o.hw * st.uE;
      o.R = o.hw;
    }
    o.c = (o.L + o.R) / 2;
    o.h = (o.R - o.L) / 2;
    return o;
  }

  /** Dorsal surface height (body-local, before BODY_LIFT) at lateral x for a sampled row. */
  surfaceY(o, x) {
    const v = o.h > 1e-6 ? clamp((x - o.c) / o.h, -1, 1) : 0;
    return o.T * Math.pow(1 - v * v, 0.65);
  }

  rebuild() {
    this.buildBody();
    this.buildShadow();
    this.buildEyes();
    this.buildPharynx(this.pharynxOld, "old");
    this.buildPharynx(this.pharynxNew, "new");
  }

  buildBody() {
    const st = this.st;
    const o = this.row;
    const half = st.Ltot / 2;
    const { pos, pig, wnd, tex } = this;
    let v = 0;
    for (let r = 0; r < NR + 2; r++) {
      const i = clamp(r - 1, 0, NR - 1);
      const z = (st.Ltot * (1 - Math.cos((Math.PI * i) / (NR - 1)))) / 2;
      this.sampleRow(z, o);
      const cap = r === 0 || r === NR + 1;
      if (!cap) {
        this.rowC[i] = o.c;
        this.rowH[i] = o.h;
        this.rowZ[i] = z;
      }
      for (let j = 0; j < NC; j++) {
        const th = (j / NC) * Math.PI * 2;
        const cs = Math.cos(th);
        const sn = Math.sin(th);
        let x;
        let y;
        if (cap) {
          x = o.c;
          y = o.T * 0.25;
        } else {
          x = o.c + o.h * cs;
          const amp = sn >= 0 ? o.T : -VENTRAL * o.T;
          y = amp * Math.pow(Math.abs(sn), 1.3);
          if (this.side) {
            const u0 = o.hw > 1e-6 ? clamp(x / o.hw, -1, 1) : 0;
            y = lerp(amp * Math.pow(1 - u0 * u0, 0.65), y, st.cl);
          }
        }
        let n = o.newness;
        let w = o.wound;
        if (this.side) {
          const u = o.hw > 1e-6 ? x / o.hw : 0;
          const e = st.oldEdge;
          const lat =
            this.side < 0 ? smoothstep(e - 0.08, e + 0.14, u) : smoothstep(-e + 0.08, -e - 0.14, u);
          n = Math.max(n, st.blast * lat);
          const edgeX = this.side < 0 ? o.R : o.L;
          w = Math.max(w, (1 - st.cl) * (1 - smoothstep(0, 0.22, Math.abs(edgeX - x))));
        }
        pos[v * 3] = x;
        pos[v * 3 + 1] = y;
        pos[v * 3 + 2] = z - half;
        pig[v] = 1 - n * (1 - st.pigRec);
        wnd[v] = w;
        tex[v * 2] = o.s * 16;
        tex[v * 2 + 1] = (x / st.S) * 16;
        v++;
      }
    }
    const g = this.body.geometry;
    for (const name of ["position", "aPig", "aWound", "aTex"]) g.attributes[name].needsUpdate = true;
    g.computeVertexNormals();
  }

  buildShadow() {
    const half = this.st.Ltot / 2;
    const { shadowPos: p, shadowCol: c } = this;
    let v = 0;
    for (let i = 0; i < NR; i++) {
      const h = this.rowH[i];
      for (let j = 0; j < NS; j++) {
        const u = -1.35 + (2.7 * j) / (NS - 1);
        p[v * 3] = this.rowC[i] + u * (h + 0.1);
        p[v * 3 + 1] = 0.004;
        p[v * 3 + 2] = this.rowZ[i] - half;
        c[v * 4] = c[v * 4 + 1] = c[v * 4 + 2] = 0;
        c[v * 4 + 3] = 0.42 * (1 - smoothstep(0.5, 1.35, Math.abs(u))) * Math.min(1, h / 0.25);
        v++;
      }
    }
    this.shadow.geometry.attributes.position.needsUpdate = true;
    this.shadow.geometry.attributes.color.needsUpdate = true;
  }

  buildEyes() {
    const st = this.st;
    const ph = this.ph;
    const half = st.Ltot / 2;
    const o = {};
    const specs = [];
    const newEye = ph.eyes * smoothstep(0.25, 0.6, st.d);
    if (this.oldHead) {
      const z = st.hA + ((EYE_S - st.oa) / (st.ob - st.oa)) * st.Lold;
      const regrown = ph.eyes * smoothstep(EYE_U + 0.1, EYE_U + 0.35, st.uE);
      specs.push({ z, sign: -1, alpha: this.side > 0 ? regrown : 1, flip: false, fresh: this.side > 0 });
      specs.push({ z, sign: 1, alpha: this.side < 0 ? regrown : 1, flip: false, fresh: this.side < 0 });
    }
    if (this.ant) {
      const z = (EYE_S / HEAD_FRAC) * st.hA;
      specs.push({ z, sign: -1, alpha: newEye, flip: false, fresh: true });
      specs.push({ z, sign: 1, alpha: newEye, flip: false, fresh: true });
    }
    if (st.twoHead) {
      const z = st.hA + st.Lold + (1 - EYE_S / HEAD_FRAC) * st.hP;
      specs.push({ z, sign: -1, alpha: newEye, flip: true, fresh: true });
      specs.push({ z, sign: 1, alpha: newEye, flip: true, fresh: true });
    }
    this.eyeAnchors.length = 0;
    this.eyes.forEach((eye, k) => {
      const sp = specs[k];
      if (!sp || sp.alpha < 0.01) {
        eye.group.visible = false;
        return;
      }
      this.sampleRow(sp.z, o);
      const x = sp.sign * EYE_U * o.hw;
      const size = clamp(o.hw / (W(EYE_S) * L0), 0.25, 1.4) * (0.45 + 0.55 * sp.alpha);
      eye.group.visible = true;
      eye.group.position.set(x, this.surfaceY(o, x) + 0.012, sp.z - half);
      eye.group.scale.set(size, 1, sp.flip ? -size : size);
      eye.cup.position.set(-sp.sign * 0.03, 0.002, -0.014);
      eye.materials[0].opacity = sp.alpha;
      eye.materials[1].opacity = sp.alpha;
      this.eyeAnchors.push({ local: eye.group.position.clone(), fresh: sp.fresh, alpha: sp.alpha });
    });
  }

  pharynxAlpha(mode) {
    if (mode === "old") {
      if (this.oldPharynx === "full") return 1;
      return this.oldPharynx === "partial" ? this.ph.oldPharynx : 0;
    }
    return this.needsPharynx ? this.ph.newPharynx : 0;
  }

  buildPharynx(tube, mode) {
    const alpha = this.pharynxAlpha(mode);
    tube.mesh.visible = alpha > 0.01;
    if (!tube.mesh.visible) return;
    tube.mesh.material.opacity = alpha * 0.5;
    const st = this.st;
    const half = st.Ltot / 2;
    const o = {};
    const s0 = mode === "old" ? Math.max(PHARYNX[0], this.a) : PHARYNX[0];
    const s1 = mode === "old" ? Math.min(PHARYNX[1], this.b) : PHARYNX[1];
    const p = tube.pos;
    let v = 0;
    for (let r = 0; r < PR + 2; r++) {
      const k = clamp(r - 1, 0, PR - 1) / (PR - 1);
      const s = lerp(s0, s1, k);
      const kFull = (s - PHARYNX[0]) / (PHARYNX[1] - PHARYNX[0]);
      const z =
        mode === "old" ? st.hA + ((s - st.oa) / (st.ob - st.oa)) * st.Lold : lerp(PHARYNX[0], PHARYNX[1], k) * st.Ltot;
      this.sampleRow(z, o);
      const env = Math.pow(Math.max(0, Math.sin(Math.PI * clamp(kFull, 0, 1))), 0.45) * (1 - 0.28 * kFull);
      let pw = 0.27 * (mode === "new" ? o.h : o.hw) * env;
      let xc = mode === "new" ? o.c : 0;
      if (mode === "old" && this.side) {
        pw /= 2;
        xc = this.side * pw;
      }
      const hh = 0.32 * o.T * Math.sqrt(env);
      const yc = 0.28 * o.T;
      const cap = r === 0 || r === PR + 1;
      for (let j = 0; j < PC; j++) {
        const th = (j / PC) * Math.PI * 2;
        p[v * 3] = cap ? xc : xc + pw * Math.cos(th);
        p[v * 3 + 1] = cap ? yc : yc + hh * Math.sin(th);
        p[v * 3 + 2] = z - half;
        v++;
      }
      if (r === Math.floor(PR / 2)) tube.center = new THREE.Vector3(xc, yc + BODY_LIFT, z - half);
    }
    tube.geometry.attributes.position.needsUpdate = true;
    tube.geometry.computeVertexNormals();
  }

  /** Label anchor points in fragment-local space. */
  anchors() {
    const st = this.st;
    const half = st.Ltot / 2;
    const o = {};
    const at = (z, xFrac = 0) => {
      this.sampleRow(z, o);
      const x = o.c + xFrac * o.h;
      return new THREE.Vector3(x, BODY_LIFT + this.surfaceY(o, x), z - half);
    };
    const out = {
      head: at(0),
      tail: at(st.Ltot),
      auricle: null,
      pharynx: null,
      newPharynx: null,
      blastemaA: null,
      blastemaP: null,
      blastemaL: null,
      woundA: null,
      woundP: null,
      woundL: null,
      eyes: this.eyeAnchors,
    };
    if (this.oldHead && !this.side) {
      const z = st.hA + ((0.075 - st.oa) / (st.ob - st.oa)) * st.Lold;
      this.sampleRow(z, o);
      out.auricle = new THREE.Vector3(-o.hw * 0.96, BODY_LIFT + 0.02, z - half);
    }
    if (this.pharynxOld.mesh.visible && this.pharynxOld.center) out.pharynx = this.pharynxOld.center;
    if (this.pharynxNew.mesh.visible && this.pharynxNew.center) out.newPharynx = this.pharynxNew.center;
    if (this.ant) {
      out.blastemaA = at(st.hA * 0.45);
      out.woundA = at(st.hA);
    }
    if (this.post) {
      out.blastemaP = at(st.Ltot - st.hP * 0.45);
      out.woundP = at(st.hA + st.Lold);
    }
    if (this.side) {
      const z = st.Ltot * 0.45;
      this.sampleRow(z, o);
      const edge = this.side < 0 ? o.R : o.L;
      const p = new THREE.Vector3(edge - this.side * 0.12, BODY_LIFT + 0.05, z - half);
      out.blastemaL = p;
      out.woundL = p;
    }
    return out;
  }

  dispose() {
    this.body.geometry.dispose();
    this.shadow.geometry.dispose();
    for (const p of [this.pharynxOld, this.pharynxNew]) {
      p.geometry.dispose();
      p.mesh.material.dispose();
    }
    for (const e of this.eyes) e.materials.forEach((m) => m.dispose());
  }
}
