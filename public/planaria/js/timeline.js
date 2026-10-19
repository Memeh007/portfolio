export const DAY_MAX = 14;

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export function smoothstep(e0, e1, x) {
  const k = clamp((x - e0) / (e1 - e0), 0, 1);
  return k * k * (3 - 2 * k);
}

/*
 * `active` windows overlap (processes run in parallel and drive the band chart);
 * `focus` windows tile the timeline and decide which callout is expanded.
 */
export const STAGES = [
  {
    id: "closure",
    name: "Wound closure",
    active: [0, 0.6],
    focus: [0, 0.5],
    range: "day 0 – 0.5",
    text:
      "Right after the cut, body-wall muscles contract to shrink the wound and neighbouring epidermal cells stretch over it. The opening is sealed within hours — before any new tissue is made.",
  },
  {
    id: "neoblasts",
    name: "Neoblasts migrate",
    active: [0.25, 3.5],
    focus: [0.5, 2],
    range: "day 0.25 – 3",
    text:
      "Neoblasts — adult pluripotent stem cells scattered through the body — respond to the injury. They divide in two waves (a body-wide burst within hours, then a wound-focused one around days 2–3) and their progeny move toward the wound.",
  },
  {
    id: "blastema",
    name: "Blastema forms",
    active: [1.5, 5],
    focus: [2, 3.25],
    range: "day 2 – 4.5",
    text:
      "New cells pile up at the wound edge and form the blastema: a pale, unpigmented cap of tissue. It is the raw material for whatever part is missing.",
  },
  {
    id: "polarity",
    name: "Patterning & polarity",
    active: [0.5, 5],
    focus: [3.25, 4.5],
    range: "day 0.5 – 5",
    text:
      "Each wound reads which way it faces. Forward-facing wounds switch off Wnt/β-catenin signalling and build a head; backward-facing wounds keep it on and build a tail. Muscle cells carry this positional map, so every fragment keeps its original head-to-tail polarity.",
  },
  {
    id: "eyes",
    name: "Eyespots reform",
    active: [4, 7.5],
    focus: [4.5, 7],
    range: "day 4 – 7",
    text:
      "Inside a new head, a brain (cephalic ganglia) and two eyespots differentiate. The dark pigment cups typically become visible about 4–7 days after cutting.",
  },
  {
    id: "remodel",
    name: "Remodeling",
    active: [5, 14],
    focus: [7, Infinity],
    range: "day 5 – 14+",
    text:
      "Old tissue is reshaped (morphallaxis) until proportions are normal again: the head shrinks to fit, a new pharynx forms where one was lost, and new tissue slowly darkens. Unfed fragments end up as smaller, complete worms.",
  },
];

export function focusStage(t) {
  return STAGES.find((s) => t >= s.focus[0] && t < s.focus[1]) ?? STAGES[STAGES.length - 1];
}

/** Normalised progress (0–1) of each modelled process at day `t`. */
export function phases(t) {
  return {
    closure: smoothstep(0, 0.6, t),
    blastema: smoothstep(1.2, 3.0, t),
    growth: smoothstep(1.5, 10, t),
    differentiate: smoothstep(2.5, 7, t),
    eyes: smoothstep(4, 6.5, t),
    remodel: smoothstep(2.5, 13.5, t),
    oldPharynx: 1 - smoothstep(0.5, 2.5, t),
    newPharynx: smoothstep(6, 10, t),
    pigment: 0.7 * smoothstep(7, 14, t),
  };
}

export function formatDay(t) {
  if (t < 1 && t > 0) return `Day ${t.toFixed(1)} · ~${Math.round(t * 24)} h`;
  return `Day ${t.toFixed(1)}`;
}
