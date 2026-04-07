export const colors = {
  paper: "#f6f1e6",
  "paper-strong": "#fffaf1",
  ink: "#0e2c24",
  deep: "#163e35",
  accent: "#b94a37",
  border: "rgba(14, 44, 36, 0.14)",
  "border-strong": "rgba(14, 44, 36, 0.24)",
  muted: "#5a675f",
  wash: "#edf1eb",
  "wash-strong": "#dfe8dc",
  white: "#ffffff",
  semantic: {
    surface: "rgba(255, 250, 241, 0.88)",
    "surface-strong": "rgba(255, 255, 255, 0.94)",
    "surface-muted": "rgba(237, 241, 235, 0.82)",
    "text-primary": "var(--gg-color-ink)",
    "text-secondary": "var(--gg-color-muted)",
    "text-link": "var(--gg-color-deep)",
    "focus-ring": "rgba(14, 44, 36, 0.16)",
    danger: "#9f3f32",
    success: "#2f6b57",
    warning: "#8a6821",
  },
  node: {
    person: {
      bg: "#e7f0ec",
      border: "#bfd2ca",
      text: "#28483d",
    },
    ministry: {
      bg: "#f1ece2",
      border: "#d9cdb9",
      text: "#4b3d22",
    },
    ministerial_office: {
      bg: "#f4e4dd",
      border: "#debaa9",
      text: "#6f3b2f",
    },
    department: {
      bg: "#e6edee",
      border: "#bbcdd0",
      text: "#26494f",
    },
    administrative_office: {
      bg: "#ece8f1",
      border: "#c9bfd7",
      text: "#493764",
    },
    public_entity: {
      bg: "#edf0e4",
      border: "#c9d3b2",
      text: "#4e5d2d",
    },
    program_output: {
      bg: "#f6e8d8",
      border: "#e2c59d",
      text: "#7b5523",
    },
    capital_project: {
      bg: "#f3e2d6",
      border: "#dfbba4",
      text: "#744630",
    },
    performance_measure: {
      bg: "#e2eeeb",
      border: "#b4d0c6",
      text: "#2d5d52",
    },
    budget_document: {
      bg: "#f2ead5",
      border: "#dbcaa0",
      text: "#6c5523",
    },
    source_document: {
      bg: "#ebe8e2",
      border: "#ccc4b7",
      text: "#52473a",
    },
    organisation_group: {
      bg: "#ede4df",
      border: "#cfbeb2",
      text: "#5c4438",
    },
  },
} as const;

export const legacyGovGraphAliases = {
  paper: "var(--gg-color-paper)",
  ink: "var(--gg-color-ink)",
  deep: "var(--gg-color-deep)",
  accent: "var(--gg-color-accent)",
  border: "var(--gg-color-border)",
  muted: "var(--gg-color-muted)",
  wash: "var(--gg-color-wash)",
} as const;
