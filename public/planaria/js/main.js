import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DAY_MAX, STAGES, focusStage, formatDay, lerp, phases, smoothstep } from "./timeline.js";
import { BODY_LIFT, Fragment, L0, W, createShared } from "./worm.js";
import { NeoblastField } from "./neoblasts.js";

const $ = (sel) => document.querySelector(sel);
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionQuery.matches;

const DAYS_PER_SECOND = 0.5;
const MIN_PIECE = 0.12;
const PRESETS = {
  three: { type: "transverse", cuts: [0.27, 0.68] },
  two: { type: "transverse", cuts: [0.36] },
  long: { type: "longitudinal", cuts: [] },
};

const state = {
  t: 0,
  playing: false,
  speed: 1,
  tool: "cut",
  cut: { type: "none", cuts: [] },
  polarity: false,
  neoblasts: true,
  labels: true,
  sep: 1,
  fragments: [],
  userCamera: false,
};

const viewport = $("#viewport");
const canvas = $("#scene");

/* ── Renderer ─────────────────────────────────────────────────────── */

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (err) {
  viewport.classList.add("is-fallback");
  $("#viewport-status").textContent =
    "This explorer needs WebGL 2, which isn't available in this browser. Try a recent Chrome, Firefox, Safari or Edge.";
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#d4cdbf");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = !reduceMotion;
controls.dampingFactor = 0.12;
controls.minDistance = 6;
controls.maxDistance = 55;
controls.maxPolarAngle = 1.35;
controls.addEventListener("start", () => {
  state.userCamera = true;
});
controls.addEventListener("change", () => {
  needsRender = true;
});

scene.add(new THREE.HemisphereLight("#f6f3ec", "#6d6458", 1.2));
const sun = new THREE.DirectionalLight("#ffffff", 1.5);
sun.position.set(-4, 10, 5);
scene.add(sun);

// Transmitted-light stereomicroscope field: a glass petri dish of water on a lit stage.
const dish = new THREE.Mesh(
  new THREE.CircleGeometry(16, 128).rotateX(-Math.PI / 2),
  new THREE.ShaderMaterial({
    uniforms: {
      uStage: { value: new THREE.Color("#d4cdbf") },
      uField: { value: new THREE.Color("#e9e7e0") },
      uFieldEdge: { value: new THREE.Color("#d9d5cb") },
      uMeniscus: { value: new THREE.Color("#b9b2a5") },
      uGlass: { value: new THREE.Color("#f7f6f2") },
      uGlassEdge: { value: new THREE.Color("#8f877a") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uStage;
      uniform vec3 uField;
      uniform vec3 uFieldEdge;
      uniform vec3 uMeniscus;
      uniform vec3 uGlass;
      uniform vec3 uGlassEdge;
      varying vec2 vP;
      const float R_IN = 12.35;
      const float R_OUT = 12.75;
      float band(float r, float a, float b) {
        float w = fwidth(r);
        return smoothstep(a - w, a + w, r) * (1.0 - smoothstep(b - w, b + w, r));
      }
      float line(float r, float c) {
        return 1.0 - smoothstep(0.0, fwidth(r) * 1.2, abs(r - c));
      }
      void main() {
        float r = length(vP);
        vec3 col = mix(uField, uFieldEdge, smoothstep(2.0, R_IN, r));
        col = mix(col, uMeniscus, smoothstep(R_IN - 1.6, R_IN, r) * 0.45);
        float wall = band(r, R_IN, R_OUT);
        float glint = smoothstep(R_IN, R_OUT, r) * (1.0 - smoothstep(R_IN, R_OUT, r)) * 4.0;
        col = mix(col, mix(uFieldEdge, uGlass, glint), wall);
        float outside = smoothstep(R_OUT - fwidth(r), R_OUT + fwidth(r), r);
        col = mix(col, uStage, outside);
        col = mix(col, uGlassEdge, (line(r, R_IN) * 0.55 + line(r, R_OUT) * 0.7));
        float grain = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
        col *= 1.0 + (grain - 0.5) * 0.025;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  }),
);
scene.add(dish);

const shared = createShared();
const field = new NeoblastField();
scene.add(field.points);

let needsRender = true;
let viewW = 1;
let viewH = 1;

function fitCamera() {
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const tan = Math.tan(halfFov);
  const dist = Math.max(6.6 / tan, 6.4 / (tan * camera.aspect));
  const dir = new THREE.Vector3(0, 0.87, 0.5).normalize();
  controls.target.set(0, 0, 0);
  camera.position.copy(dir.multiplyScalar(dist));
  camera.lookAt(controls.target);
  controls.update();
  needsRender = true;
}

new ResizeObserver(() => {
  viewW = Math.max(1, viewport.clientWidth);
  viewH = Math.max(1, viewport.clientHeight);
  renderer.setSize(viewW, viewH, false);
  camera.aspect = viewW / viewH;
  camera.updateProjectionMatrix();
  field.material.uniforms.uScale.value =
    (viewH * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  if (!state.userCamera) fitCamera();
  needsRender = true;
}).observe(viewport);

/* ── Fragments ────────────────────────────────────────────────────── */

function specsFor(cut) {
  if (cut.type === "none") return [{ kind: "intact", a: 0, b: 1, name: "Intact worm" }];
  if (cut.type === "longitudinal") {
    return [
      { kind: "left", a: 0, b: 1, name: "Left half" },
      { kind: "right", a: 0, b: 1, name: "Right half" },
    ];
  }
  const edges = [0, ...[...cut.cuts].sort((x, y) => x - y), 1];
  const names = edges.length === 4 ? ["Head fragment", "Trunk fragment", "Tail fragment"] : ["Anterior piece", "Posterior piece"];
  return edges.slice(0, -1).map((a, i) => ({ kind: "transverse", a, b: edges[i + 1], name: names[i] }));
}

function rebuildFragments() {
  for (const f of state.fragments) {
    scene.remove(f.group);
    f.dispose();
  }
  state.fragments = specsFor(state.cut).map((spec) => new Fragment(spec, shared));
  for (const f of state.fragments) scene.add(f.group);
  field.setFragments(state.fragments);
  buildFragmentList();
}

function layout() {
  const frs = state.fragments;
  const n = frs.length;
  const sep = 1 - Math.pow(1 - state.sep, 3);
  const k = state.cut.type === "none" ? 0 : smoothstep(0.4, 2.5, state.t);
  frs.forEach((f, i) => {
    const pos = f.group.position;
    if (!f.cut) {
      pos.set(0, 0, 0);
    } else if (f.side) {
      pos.set(lerp(f.side * 0.35 * sep, f.side * 1.75, k), 0, 0);
    } else {
      const st = f.st;
      const zc = -L0 / 2 + (L0 * (f.a + f.b)) / 2 + (i - (n - 1) / 2) * 0.7 * sep;
      const inlineZ = zc - (st.hA - st.hP) / 2;
      const spacing = n === 3 ? 3.1 : 3.3;
      pos.set(lerp(0, (i - (n - 1) / 2) * spacing, k), 0, lerp(inlineZ, 0, k));
    }
  });
}

let clock = 0;

function refresh() {
  for (const f of state.fragments) {
    f.update(state.t, state.polarity);
    f.rebuild();
  }
  layout();
  field.points.visible = state.neoblasts;
  if (state.neoblasts) field.update(state.t, clock, !reduceMotion);
  updatePanel();
  needsRender = true;
}

function applyCut(cut, message) {
  state.cut = cut;
  state.t = 0;
  state.playing = false;
  state.sep = reduceMotion || cut.type === "none" ? 1 : 0;
  rebuildFragments();
  refresh();
  updatePlayButton();
  updateHint();
  if (message) toast(message);
}

/* ── Cut tool ─────────────────────────────────────────────────────── */

const raycaster = new THREE.Raycaster();
const cutPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BODY_LIFT);
const cutLine = $("#cut-line");
const cutOverlay = $("#cut-overlay");
let stroke = null;

function toDish(x, y) {
  const ndc = new THREE.Vector2((x / viewW) * 2 - 1, -(y / viewH) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  return raycaster.ray.intersectPlane(cutPlane, hit) ? hit : null;
}

function drawStroke() {
  cutLine.setAttribute("x1", stroke.x0);
  cutLine.setAttribute("y1", stroke.y0);
  cutLine.setAttribute("x2", stroke.x1);
  cutLine.setAttribute("y2", stroke.y1);
}

function localPoint(e) {
  const r = canvas.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}

canvas.addEventListener("pointerdown", (e) => {
  if (state.tool !== "cut") return;
  if (stroke) {
    stroke = null;
    cutOverlay.classList.remove("is-drawing", "is-done");
    return;
  }
  if (e.button !== 0) return;
  const [x, y] = localPoint(e);
  stroke = { id: e.pointerId, x0: x, y0: y, x1: x, y1: y };
  canvas.setPointerCapture(e.pointerId);
  cutOverlay.classList.remove("is-done");
  cutOverlay.classList.add("is-drawing");
  drawStroke();
});

canvas.addEventListener("pointermove", (e) => {
  if (!stroke || e.pointerId !== stroke.id) return;
  [stroke.x1, stroke.y1] = localPoint(e);
  drawStroke();
});

canvas.addEventListener("pointerup", (e) => {
  if (!stroke || e.pointerId !== stroke.id) return;
  const s = stroke;
  stroke = null;
  cutOverlay.classList.remove("is-drawing");
  if (Math.hypot(s.x1 - s.x0, s.y1 - s.y0) < 14) return;
  cutOverlay.classList.add("is-done");
  setTimeout(() => cutOverlay.classList.remove("is-done"), 650);
  handleStroke(s);
});

canvas.addEventListener("pointercancel", () => {
  stroke = null;
  cutOverlay.classList.remove("is-drawing", "is-done");
});

function handleStroke(s) {
  const A = toDish(s.x0, s.y0);
  const B = toDish(s.x1, s.y1);
  if (!A || !B) return toast("Draw the cut over the dish.");
  const dx = B.x - A.x;
  const dz = B.z - A.z;
  if (Math.hypot(dx, dz) < 0.8) return toast("Drag a longer line across the worm.");
  const angle = (Math.atan2(Math.abs(dz), Math.abs(dx)) * 180) / Math.PI;
  return angle > 50 ? longitudinalStroke(A, B, angle) : transverseStroke(A, B, angle);
}

function transverseStroke(A, B, angle) {
  if (A.x * B.x > 0) return toast("Drag all the way across the body to cut it.");
  const zc = A.z + (-A.x / (B.x - A.x)) * (B.z - A.z);
  let s = null;
  if (state.cut.type === "transverse") {
    for (const f of state.fragments) {
      const z0 = f.group.position.z - f.st.Ltot / 2;
      if (zc >= z0 && zc <= z0 + f.st.Ltot) s = f.a + ((zc - z0) / f.st.Ltot) * (f.b - f.a);
    }
    if (s === null) return toast("That line falls in a gap between pieces.");
  } else {
    s = (zc + L0 / 2) / L0;
  }
  if (s <= 0 || s >= 1) return toast("Cut across the worm's body, not past its ends.");
  const hw = W(s) * L0;
  if (Math.min(A.x, B.x) > -0.55 * hw || Math.max(A.x, B.x) < 0.55 * hw) {
    return toast("Drag all the way across the body to cut it.");
  }
  const existing = state.cut.type === "transverse" ? state.cut.cuts : [];
  const tooClose = s < MIN_PIECE || s > 1 - MIN_PIECE || existing.some((c) => Math.abs(c - s) < MIN_PIECE);
  if (tooClose) {
    return toast(
      "Too close to an end or another cut for this model. (Real pieces as small as ~1/279 of a worm can regenerate — Morgan, 1898.)",
      5200,
    );
  }
  if (existing.length >= 2) return toast("This model stops at three pieces. Reset to start over.");
  const notes = [];
  if (state.cut.type === "longitudinal") notes.push("Replaced the lengthwise split.");
  if (angle > 12) notes.push("Oblique line snapped to a transverse cut.");
  applyCut({ type: "transverse", cuts: [...existing, s] }, notes.join(" ") || null);
}

function longitudinalStroke(A, B, angle) {
  if (Math.abs(B.z - A.z) < 0.65 * L0) return toast("Drag along most of the body to split it lengthwise.");
  const mx = (A.x + B.x) / 2;
  if (Math.abs(mx) > 1.3) return toast("Draw the lengthwise split over the worm.");
  if (state.cut.type === "longitudinal") return toast("Already split lengthwise. Reset to start over.");
  const notes = ["Split along the midline (sagittal cut)."];
  if (state.cut.type === "transverse") notes.unshift("Replaced the transverse cuts.");
  if (angle < 78 || Math.abs(mx) > 0.25) notes.push("Line snapped to the midline.");
  applyCut({ type: "longitudinal", cuts: [] }, notes.join(" "));
}

/* ── Labels ───────────────────────────────────────────────────────── */

const labelLayer = $("#labels");
const labelPool = new Map();
const tmp = new THREE.Vector3();

function collectLabels() {
  const out = [];
  const frs = state.fragments;
  const t = state.t;
  const ph = phases(t);
  const world = (f, v) => v.clone().add(f.group.position);

  if (state.cut.type === "none") {
    const f = frs[0];
    const a = f.anchors();
    out.push({ id: "head", pos: world(f, a.head), text: "anterior", sub: "head", dir: "u" });
    out.push({ id: "tail", pos: world(f, a.tail), text: "posterior", sub: "tail", dir: "d" });
    if (a.eyes[1]) out.push({ id: "eyes", pos: world(f, a.eyes[1].local), text: "eyespots", sub: "photoreceptors", dir: "r" });
    if (a.auricle) out.push({ id: "auricle", pos: world(f, a.auricle), text: "auricle", sub: "chemosensory lobe", dir: "l" });
    if (a.pharynx) out.push({ id: "pharynx", pos: world(f, a.pharynx), text: "pharynx", sub: "feeding tube", dir: "r" });
    return out;
  }

  const anchors = frs.map((f) => f.anchors());
  const done = t >= 13.5;
  const inline = smoothstep(0.4, 2.5, t) < 0.5;
  frs.forEach((f, i) => {
    const regrow = f.regrows(state.polarity);
    const sub = done ? (f.post && state.polarity ? "two-headed worm" : "complete worm") : `regrows ${regrow}`;
    let pos;
    let dir;
    if (inline) {
      const side = f.side || 1;
      const row = f.sampleRow(f.st.Ltot * 0.5, {});
      pos = world(f, new THREE.Vector3(side < 0 ? row.L : row.R, BODY_LIFT, 0));
      pos.x += side * 0.15;
      dir = side < 0 ? "l" : "r";
    } else {
      pos = world(f, anchors[i].tail);
      pos.z += 0.35;
      dir = "d";
    }
    out.push({ id: `frag-${i}`, pos, key: fragLetter(i), text: f.name, sub, dir, kind: "frag" });
  });

  const first = (key) => {
    for (let i = 0; i < frs.length; i++) if (anchors[i][key]) return world(frs[i], anchors[i][key]);
    return null;
  };

  if (t > 0 && t < 0.55) {
    const p = first("woundA") ?? first("woundL") ?? first("woundP");
    if (p) out.push({ id: "wound", pos: p, text: "wound", sub: t < 0.2 ? "fresh cut" : "closing", dir: "r" });
  }
  if (ph.blastema > 0.35 && ph.differentiate < 0.85) {
    const p = first("blastemaA") ?? first("blastemaL") ?? first("blastemaP");
    if (p) out.push({ id: "blastema", pos: p, text: "blastema", sub: "unpigmented new tissue", dir: "l" });
  }
  if (t < 9.5) {
    for (let i = 0; i < frs.length; i++) {
      const eye = anchors[i].eyes.find((e) => e.fresh && e.alpha > 0.3);
      if (eye) {
        out.push({ id: "new-eyes", pos: world(frs[i], eye.local), text: "new eyespots", dir: "r" });
        break;
      }
    }
  }
  if (ph.newPharynx > 0.3 && t < 11.5) {
    const p = first("newPharynx");
    if (p) out.push({ id: "new-pharynx", pos: p, text: "new pharynx", dir: "r" });
  }
  if (state.polarity && ph.differentiate > 0.5) {
    for (let i = 0; i < frs.length; i++) {
      if (frs[i].st.twoHead) {
        out.push({ id: "ectopic", pos: world(frs[i], anchors[i].tail), text: "ectopic head", sub: "β-catenin RNAi", dir: "l", kind: "warn" });
        break;
      }
    }
  }
  return out;
}

function updateLabels() {
  const items = state.labels ? collectLabels() : [];
  const seen = new Set();
  for (const it of items) {
    tmp.copy(it.pos).project(camera);
    if (tmp.z > 1) continue;
    let el = labelPool.get(it.id);
    if (!el) {
      el = document.createElement("div");
      el.innerHTML =
        '<span class="lbl__dot"></span><span class="lbl__tag"><strong class="lbl__key"></strong><b></b><i></i></span>';
      labelLayer.appendChild(el);
      labelPool.set(it.id, el);
    }
    const cls = `lbl lbl--${it.dir}${it.kind ? ` lbl--${it.kind}` : ""}`;
    if (el.className !== cls) el.className = cls;
    const key = `${it.key ?? ""}|${it.text}|${it.sub ?? ""}`;
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      el.querySelector(".lbl__key").textContent = it.key ?? "";
      el.querySelector("b").textContent = it.text;
      el.querySelector("i").textContent = it.sub ?? "";
    }
    const x = ((tmp.x + 1) / 2) * viewW;
    const y = ((1 - tmp.y) / 2) * viewH;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    el.hidden = false;
    seen.add(it.id);
  }
  for (const [id, el] of labelPool) if (!seen.has(id)) el.hidden = true;
}

const orientArrow = $("#orient-arrow");
const orientA = new THREE.Vector3();
const orientB = new THREE.Vector3();

function updateOrientation() {
  orientA.set(0, BODY_LIFT, 0).project(camera);
  orientB.set(0, BODY_LIFT, -1).project(camera);
  const dx = orientB.x - orientA.x;
  const dy = (orientB.y - orientA.y) / camera.aspect;
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  orientArrow.setAttribute("transform", `rotate(${deg.toFixed(1)} 17 17)`);
}

/* ── Panel & controls ─────────────────────────────────────────────── */

const scrubber = $("#scrubber");
const dayReadout = $("#day");
const panelDay = $("#panel-day");
const bands = $("#bands");
const playhead = $("#playhead");
const stageList = $("#stage-list");
const callout = $("#callout");
const fragList = $("#fragment-list");
const playBtn = $("#play");
const hint = $("#hint");
const live = $("#live");

STAGES.forEach((stage, i) => {
  const row = document.createElement("div");
  row.className = "band";
  row.dataset.stage = stage.id;
  const end = Math.min(stage.active[1], DAY_MAX);
  const bar = document.createElement("button");
  bar.type = "button";
  bar.className = "band__bar";
  bar.style.left = `${(stage.active[0] / DAY_MAX) * 100}%`;
  bar.style.width = `${((end - stage.active[0]) / DAY_MAX) * 100}%`;
  bar.title = `${stage.name} (${stage.range})`;
  bar.setAttribute("aria-label", `Jump to ${stage.name}`);
  bar.addEventListener("click", () => seek(stage.focus[0] + 0.01));
  row.appendChild(bar);
  bands.appendChild(row);

  const li = document.createElement("li");
  li.dataset.stage = stage.id;
  li.innerHTML = `<button type="button"><span class="stage__idx">${String(i + 1).padStart(2, "0")}</span><span class="stage__name">${stage.name}</span><span class="stage__range">${stage.range}</span></button>`;
  li.querySelector("button").addEventListener("click", () => seek(stage.focus[0] + 0.01));
  stageList.appendChild(li);
});

for (let d = 0; d <= DAY_MAX; d += 2) {
  const tick = document.createElement("span");
  tick.style.left = `${(d / DAY_MAX) * 100}%`;
  tick.textContent = d;
  $("#ticks").appendChild(tick);
}

const fragLetter = (i) => String.fromCharCode(97 + i);

function buildFragmentList() {
  fragList.innerHTML = "";
  state.fragments.forEach((f, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="frag__idx">${fragLetter(i)}</span><span class="frag__name">${f.name}</span><span class="frag__status"></span>`;
    fragList.appendChild(li);
  });
}

function statusOf(f, t) {
  if (!f.cut) return "intact · cut it to begin";
  const regrow = f.regrows(state.polarity);
  if (t === 0) return `fresh cut · will regrow ${regrow}`;
  if (t < 0.6) return "sealing the wound";
  if (t < 2) return "neoblasts mobilising";
  if (t < 4) return "blastema forming";
  if (t < 7.5) return `building ${regrow}`;
  if (t < 13.5) return "remodeling proportions";
  return f.post && state.polarity ? "two-headed worm" : "complete, smaller worm";
}

let lastFocus = null;
let lastCalloutKey = "";

function updatePanel() {
  const t = state.t;
  const text = formatDay(t);
  dayReadout.textContent = text;
  panelDay.textContent = text;
  scrubber.value = String(t);
  const intact = state.cut.type === "none";
  const focus = intact ? null : focusStage(t);
  scrubber.setAttribute("aria-valuetext", focus ? `${text}: ${focus.name}` : text);
  playhead.style.left = `${(t / DAY_MAX) * 100}%`;

  for (const el of [...bands.children, ...stageList.children]) {
    const stage = STAGES.find((s) => s.id === el.dataset.stage);
    if (!stage) continue;
    el.classList.toggle("is-active", !intact && t >= stage.active[0] && t <= stage.active[1]);
    el.classList.toggle("is-focus", focus?.id === stage.id);
  }

  const calloutKey = intact ? "intro" : focus.id;
  if (calloutKey !== lastCalloutKey) {
    lastCalloutKey = calloutKey;
    if (intact) {
      callout.querySelector("h2").textContent = "Cut the worm to begin";
      callout.querySelector(".callout__text").textContent =
        "Planarians can rebuild a complete body from a small piece. Drag a line across the worm (or pick a preset), then press Play to follow each fragment for about two weeks.";
    } else {
      callout.querySelector("h2").textContent = focus.name;
      callout.querySelector(".callout__text").textContent = focus.text;
    }
    callout.querySelector(".callout__range").textContent = intact ? "day 0" : focus.range;
  }
  if (focus && focus !== lastFocus && state.playing) live.textContent = `${focus.name}. ${focus.text}`;
  lastFocus = focus;

  [...fragList.children].forEach((li, i) => {
    const f = state.fragments[i];
    if (!f) return;
    const s = statusOf(f, t);
    const el = li.querySelector(".frag__status");
    if (el.textContent !== s) el.textContent = s;
  });
}

function updatePlayButton() {
  playBtn.setAttribute("aria-pressed", String(state.playing));
  playBtn.setAttribute("aria-label", state.playing ? "Pause" : "Play regeneration");
  playBtn.classList.toggle("is-playing", state.playing);
  playBtn.disabled = state.cut.type === "none";
  scrubber.disabled = state.cut.type === "none";
}

function updateHint() {
  let msg = "";
  if (state.tool === "cut" && !state.playing) {
    if (state.cut.type === "none") msg = "Drag a line across the worm to cut it — or choose a preset.";
    else if (state.cut.type === "transverse" && state.cut.cuts.length < 2) msg = "Add another cut, or press Play to regenerate.";
    else msg = "Press Play to watch every piece regenerate.";
  } else if (state.tool === "orbit" && !state.playing && state.t === 0) {
    msg = "Drag to orbit · scroll or pinch to zoom · right-drag or two fingers to pan.";
  }
  hint.textContent = msg;
  hint.hidden = !msg;
}

let toastTimer = 0;
function toast(message, ms = 3600) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), ms);
}

function setTool(tool) {
  if (tool === "cut" && state.t > 0) {
    state.t = 0;
    state.playing = false;
    updatePlayButton();
    refresh();
  }
  state.tool = tool;
  controls.enableRotate = tool === "orbit";
  controls.enablePan = tool === "orbit";
  viewport.dataset.tool = tool;
  for (const btn of document.querySelectorAll("[data-tool]")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.tool === tool));
  }
  updateHint();
}

function play() {
  if (state.cut.type === "none") return toast("Cut the worm first — drag across it or pick a preset.");
  if (state.t >= DAY_MAX - 1e-3) state.t = 0;
  state.playing = true;
  if (state.tool === "cut") setTool("orbit");
  updatePlayButton();
  updateHint();
}

function pause() {
  state.playing = false;
  updatePlayButton();
  updateHint();
}

function seek(t) {
  if (state.cut.type === "none") return toast("Cut the worm first — drag across it or pick a preset.");
  state.t = Math.min(DAY_MAX, Math.max(0, t));
  if (state.tool === "cut" && state.t > 0) setTool("orbit");
  refresh();
  updateHint();
}

playBtn.addEventListener("click", () => (state.playing ? pause() : play()));
scrubber.addEventListener("input", () => {
  pause();
  seek(parseFloat(scrubber.value));
});

for (const btn of document.querySelectorAll("[data-tool]")) {
  btn.addEventListener("click", () => setTool(btn.dataset.tool));
}
for (const btn of document.querySelectorAll("[data-preset]")) {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    applyCut({ type: preset.type, cuts: [...preset.cuts] });
    setTool("cut");
  });
}
$("#reset").addEventListener("click", () => {
  applyCut({ type: "none", cuts: [] });
  setTool("cut");
});
$("#recenter").addEventListener("click", () => {
  state.userCamera = false;
  fitCamera();
});
for (const btn of document.querySelectorAll("[data-speed]")) {
  btn.addEventListener("click", () => {
    state.speed = parseFloat(btn.dataset.speed);
    for (const b of document.querySelectorAll("[data-speed]")) b.setAttribute("aria-pressed", String(b === btn));
  });
}

$("#tg-neoblasts").addEventListener("change", (e) => {
  state.neoblasts = e.target.checked;
  refresh();
});
$("#tg-labels").addEventListener("change", (e) => {
  state.labels = e.target.checked;
  needsRender = true;
});
$("#tg-polarity").addEventListener("change", (e) => {
  state.polarity = e.target.checked;
  $("#polarity-note").hidden = !state.polarity;
  buildFragmentList();
  refresh();
});

document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, select, textarea")) return;
  if (e.key === " ") {
    if (e.target.closest("button, a, summary, label")) return;
    e.preventDefault();
    if (state.playing) pause();
    else play();
  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    pause();
    seek(state.t + (e.key === "ArrowRight" ? 0.5 : -0.5));
  }
});

motionQuery.addEventListener("change", (e) => {
  reduceMotion = e.matches;
  controls.enableDamping = !reduceMotion;
  refresh();
});

/* ── Loop ─────────────────────────────────────────────────────────── */

let last = performance.now();
let idleFrame = 0;

renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  clock += dt;
  let changed = false;
  if (state.playing) {
    state.t = Math.min(DAY_MAX, state.t + dt * DAYS_PER_SECOND * state.speed);
    if (state.t >= DAY_MAX) {
      pause();
      live.textContent = "Day 14 reached. Every fragment has rebuilt a complete worm.";
    }
    changed = true;
  }
  if (state.sep < 1) {
    state.sep = Math.min(1, state.sep + dt / 0.55);
    changed = true;
  }
  if (changed) {
    refresh();
  } else if (state.neoblasts && !reduceMotion && ++idleFrame % 2 === 0) {
    field.update(state.t, clock, true);
    needsRender = true;
  }
  if (controls.update()) needsRender = true;
  if (needsRender) {
    needsRender = false;
    renderer.render(scene, camera);
    updateLabels();
    updateOrientation();
  }
});

applyCut({ type: "none", cuts: [] });
setTool("cut");
viewport.classList.add("is-ready");
