/**
 * Subset of design tokens that need to be referenced from JS / inline SVG
 * (where Tailwind class names don't reach). Keep in sync with
 * `tailwind.config.ts` — these are the source of truth for SVG fills,
 * gradient stops, and any element that uses inline `style`.
 *
 * Theme: "Midnight Velvet" — deep cool base, electric crimson + amber accents.
 */
export const tokens = {
  ink: {
    950: '#06080f',
    900: '#0a0e1a',
    800: '#0e1424',
    700: '#141b30',
    600: '#1b2540',
  },

  felt: {
    dark: '#031a1a',
    mid: '#072a2a',
    base: '#0d3b3b',
    light: '#0f4747',
    shadow: 'rgba(0,0,0,0.55)',
  },

  crimson: {
    400: '#ff5572',
    500: '#ff3b5f',
    600: '#e63956',
    700: '#b8243e',
    soft: 'rgba(255,59,95,0.55)',
  },

  amber: {
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    soft: 'rgba(251,191,36,0.45)',
  },

  mint: {
    300: '#6ee7b7',
    400: '#5eead4',
    500: '#34d399',
  },

  bone: '#fafaf7',
  boneDim: '#e7e5e0',
  boneMute: 'rgba(250,250,247,0.65)',

  cardFace: '#fafaf7',
  cardFaceShadow: '#eceae3',
  cardSuitRed: '#dc2626',
  cardSuitInk: '#0f172a',

  glassLine: 'rgba(255,255,255,0.10)',
  glassLineSoft: 'rgba(255,255,255,0.06)',

  warmAlert: '#fbbf24',
} as const;
