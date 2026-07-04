/* ── Site ─────────────────────────────────────────────────────────── */

export const site = {
  name: "alexander cecena",
  tagline: "biology × compute",
  url: "https://memeh007.github.io/portfolio",
  description:
    "Portfolio of Alexander Cecena. Bioengineering researcher and software engineer working on laboratory systems, computational biochemistry, 3D visualization, and embedded hardware.",
  resume: {
    label: "download cv",
    href: "/alexander-cecena-cv.pdf",
  },
} as const;

/* ── Skills ───────────────────────────────────────────────────────── */

export type SkillLevel = "Expert" | "Pro" | "Intermediate";

export type SkillGroup = {
  level: SkillLevel;
  skills: readonly string[];
};

export const skillGroups: readonly SkillGroup[] = [
  { level: "Expert", skills: ["Python"] },
  { level: "Pro", skills: ["SQL"] },
  {
    level: "Intermediate",
    skills: ["C", "C++", "JavaScript", "Three.js", "WebGL"],
  },
] as const;

export type LabSkillCategory = {
  domain: string;
  skills: readonly string[];
};

export const labSkillCategories: readonly LabSkillCategory[] = [
  {
    domain: "Analytical Chemistry & Wet Lab",
    skills: [
      "GC-MS",
      "HPLC",
      "NMR Imaging",
      "Spectroscopic Techniques",
      "Gel Electrophoresis",
      "Chromatography",
    ],
  },
  {
    domain: "Computational Biology & Bioinformatics",
    skills: [
      "PyMol",
      "ImageJ",
      "BLAST Implementation",
      "Protein Visualization",
      "LIMS Architecture",
    ],
  },
  {
    domain: "Bioengineering & Hardware",
    skills: [
      "CT Acquisition (Molecubes CUBEFlow)",
      "Biocompatible Scaffold Design",
      "Additive Manufacturing",
      "Radiation Handling",
    ],
  },
  {
    domain: "Clinical & Research Focus",
    skills: [
      "Anti-aging Medicine",
      "Senescence (AMPK Regulation)",
      "Ethical in-vivo Modeling",
    ],
  },
] as const;

/* ── Projects ─────────────────────────────────────────────────────── */

export type BlurbSegment =
  | { type: "text"; value: string }
  | { type: "term"; value: string };

export type Project = {
  id: string;
  title: string;
  accent: string;
  tag: string;
  blurb: BlurbSegment[];
  technologies: readonly string[];
};

export const projects: readonly Project[] = [
  {
    id: "memai",
    title: "MEMAI",
    accent: "#0066ff",
    tag: "2026 / software",
    blurb: [
      { type: "text", value: "Desktop app built with " },
      { type: "term", value: "PyQt6" },
      { type: "text", value: ". It runs two " },
      { type: "term", value: "inference backends" },
      { type: "text", value: " side by side: one for " },
      { type: "term", value: "local models" },
      { type: "text", value: ", one for remote APIs. You pick which engine handles each request from a single window meant to stay open during long work sessions." },
    ],
    technologies: ["Python", "PyQt6", "OpenAI API", "Ollama", "REST"],
  },
  {
    id: "munroe-lims",
    title: "Munroe Lab LIMS",
    accent: "#ff5500",
    tag: "2025 / bioengineering",
    blurb: [
      { type: "text", value: "Lab database built for the Munroe Lab. It handles " },
      { type: "term", value: "sample tracking" },
      { type: "text", value: ", experiment records, and " },
      { type: "term", value: "planaria husbandry" },
      { type: "text", value: ". It also runs " },
      { type: "term", value: "AutoDock Vina" },
      { type: "text", value: ", the docking program from " },
      { type: "term", value: "Scripps Research" },
      { type: "text", value: ", so you can predict how small molecules bind to proteins without leaving the app." },
    ],
    technologies: [
      "Python",
      "PostgreSQL",
      "Flask",
      "AutoDock Vina",
      "REST API",
      "SQL",
    ],
  },
  {
    id: "earth-gps",
    title: "Earth GPS Dashboard",
    accent: "#00e676",
    tag: "2026 / visualization",
    blurb: [
      { type: "text", value: "Web tool with a rotatable " },
      { type: "term", value: "3D Earth" },
      { type: "text", value: " built in " },
      { type: "term", value: "Three.js" },
      { type: "text", value: ". Click a location to read its coordinates, check the capital city, and pull basic geographic data from the model." },
    ],
    technologies: ["Three.js", "React Three Fiber", "TypeScript", "WebGL", "Next.js"],
  },
  {
    id: "cubeflow",
    title: "Automated CAD Imaging (rough)",
    accent: "#7c3aed",
    tag: "2024 / bioengineering",
    blurb: [
      { type: "text", value: "Pipeline for generating " },
      { type: "term", value: "3D-printable" },
      { type: "text", value: " models from " },
      { type: "term", value: "CAD" },
      { type: "text", value: ". It combines " },
      { type: "term", value: "text-to-CAD" },
      { type: "text", value: " with models trained on " },
      { type: "term", value: "biomedical scan data" },
      { type: "text", value: " for " },
      { type: "term", value: "mouse micro-CT" },
      { type: "text", value: " imaging. Still early, but the goal is to go from a description to a printable file with less manual modeling." },
    ],
    technologies: ["CAD", "Text-to-CAD", "AI", "3D Printing", "Micro-CT", "Fusion 360"],
  },
  {
    id: "vanguard-waveform",
    title: "Project Vanguard & Waveform",
    accent: "#ff1744",
    tag: "2025 / hardware",
    blurb: [
      { type: "text", value: "Two portable security projects on a " },
      { type: "term", value: "Raspberry Pi Zero 2 W" },
      { type: "text", value: ". Vanguard handles " },
      { type: "term", value: "network auditing" },
      { type: "text", value: ". Waveform watches for " },
      { type: "term", value: "wireless intrusions" },
      { type: "text", value: ". Both use a small LCD for live status and are sized to carry outside the lab." },
    ],
    technologies: ["Python", "Raspberry Pi", "802.11", "SDR", "Linux"],
  },
  {
    id: "hermes-wsl",
    title: "Hermes WSL",
    accent: "#00bcd4",
    tag: "2026 / software",
    blurb: [
      { type: "text", value: "Built on " },
      { type: "term", value: "Hermes Agent" },
      { type: "text", value: " by " },
      { type: "term", value: "Nous Research" },
      { type: "text", value: ", their open-source agent that runs shell tools, saves skills across sessions, and works with " },
      { type: "term", value: "local LLMs" },
      { type: "text", value: ". This project sets that up on " },
      { type: "term", value: "WSL2" },
      { type: "text", value: " so the agent runs in Linux on a Windows machine without needing a separate server." },
    ],
    technologies: ["Hermes Agent", "Nous Research", "WSL2", "Python", "Bash", "Local LLMs"],
  },
  {
    id: "cyd-crayz-flasher",
    title: "CYD ESP32 CrayZ Flasher",
    accent: "#ff9100",
    tag: "2025 / embedded",
    blurb: [
      { type: "text", value: "Flash tool made for " },
      { type: "term", value: "Cheap Yellow Display" },
      { type: "text", value: " ESP32 boards. It maps flash partitions, handles " },
      { type: "term", value: "serial recovery" },
      { type: "text", value: ", and bundles " },
      { type: "term", value: "LVGL" },
      { type: "text", value: " firmware so you can reflash the board and test UI changes quickly." },
    ],
    technologies: ["C++", "ESP-IDF", "LVGL", "PlatformIO", "Serial"],
  },
] as const;
