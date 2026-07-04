export type Project = {
  slug: string;
  name: string;
  description: string;
  stack: string[];
};

export type ProjectCategory = {
  id: string;
  tag: string;
  label: string;
  projects: Project[];
};

export const projectCategories: ProjectCategory[] = [
  {
    id: "software-ai",
    tag: "sw",
    label: "3D visualization & AI software",
    projects: [
      {
        slug: "earth-gps-dashboard",
        name: "Earth GPS Dashboard",
        description:
          "Interactive 3D spatial visualization for selecting global locations, verifying capital cities, and querying geographical data through a rotatable Earth model.",
        stack: ["Three.js", "React Three Fiber", "TypeScript", "WebGL"],
      },
      {
        slug: "memai",
        name: "MEMAI",
        description:
          "Dual-engine AI command center with split inference pipelines, model routing, and a native desktop shell for local and remote LLM orchestration.",
        stack: ["Python", "PyQt6", "OpenAI API", "Ollama"],
      },
      {
        slug: "hermes-wsl",
        name: "Hermes WSL",
        description:
          "Local agent runtime on Windows Subsystem for Linux — scripted tool use, filesystem access, and headless coding workflows without cloud dependency.",
        stack: ["Python", "WSL2", "Bash", "Local LLMs"],
      },
    ],
  },
  {
    id: "bio-engineering",
    tag: "bio",
    label: "Bio-engineering & healthcare",
    projects: [
      {
        slug: "biochem-pathways",
        name: "Biochem Pathways App",
        description:
          "Interactive module for glycolysis — step-through reactions, enzyme labels, and spatial layout of intermediates for study and review.",
        stack: ["React", "TypeScript", "Canvas", "SVG"],
      },
      {
        slug: "munroe-lab-lims",
        name: "Munroe Lab LIMS",
        description:
          "Laboratory information system for sample intake, experiment logging, and planaria colony tracking across Munroe Lab aging research workflows.",
        stack: ["Python", "PostgreSQL", "Flask", "REST API"],
      },
      {
        slug: "cubeflow-restraint",
        name: "Molecubes CUBEFlow Restraint",
        description:
          "CAD-designed, 3D-printed restraint for 26g mice during micro-CT imaging — minimal contact geometry, quick release, and scanner-compatible mounting.",
        stack: ["Fusion 360", "PETG", "Micro-CT", "ISO 10993"],
      },
    ],
  },
  {
    id: "hardware-embedded",
    tag: "hw",
    label: "Cybersecurity & embedded systems",
    projects: [
      {
        slug: "cyd-crayz-flasher",
        name: "CYD ESP32 CrayZ Flasher",
        description:
          "Firmware flashing utility purpose-built for Cheap Yellow Display ESP32 boards — partition mapping, serial recovery, and LVGL firmware bundles.",
        stack: ["C++", "ESP-IDF", "LVGL", "PlatformIO"],
      },
      {
        slug: "vanguard-waveform",
        name: "Project Vanguard & Project Waveform",
        description:
          "Pocket-sized security auditing and wireless intrusion detection on Raspberry Pi Zero 2 W — onboard LCD status, packet capture, and field-deployable form factor.",
        stack: ["Python", "Raspberry Pi", "SDR", "802.11"],
      },
    ],
  },
];
