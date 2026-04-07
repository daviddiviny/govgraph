export const typography = {
  family: {
    display: 'var(--font-display), "Iowan Old Style", Georgia, serif',
    body: 'var(--font-body), "Helvetica Neue", Arial, sans-serif',
    mono: 'var(--font-mono), "SFMono-Regular", monospace',
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  "line-height": {
    tight: "1.1",
    snug: "1.25",
    body: "1.6",
    relaxed: "1.8",
  },
  "letter-spacing": {
    tight: "-0.03em",
    normal: "0em",
    caps: "0.18em",
    eyebrow: "0.24em",
  },
  heading: {
    eyebrow: {
      size: "var(--gg-font-size-xs)",
      weight: "var(--gg-font-weight-semibold)",
      "line-height": "var(--gg-font-line-height-snug)",
      "letter-spacing": "var(--gg-font-letter-spacing-eyebrow)",
    },
    section: {
      size: "var(--gg-font-size-3xl)",
      weight: "var(--gg-font-weight-semibold)",
      "line-height": "var(--gg-font-line-height-tight)",
      "letter-spacing": "var(--gg-font-letter-spacing-tight)",
    },
    display: {
      size: "var(--gg-font-size-6xl)",
      weight: "var(--gg-font-weight-semibold)",
      "line-height": "var(--gg-font-line-height-tight)",
      "letter-spacing": "var(--gg-font-letter-spacing-tight)",
    },
  },
} as const;
