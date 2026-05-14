/**
 * Subset of design tokens that need to be referenced from JS / inline SVG.
 * Mirrors tailwind.config.ts. Source of truth for SVG fills and inline
 * `style` colours.
 *
 * Theme: warm-dark with a single coral accent. No casino, no glassmorphism.
 */
export const tokens = {
  bg: {
    base: '#0a0907',
    mid: '#100e0b',
    top: '#1b1815',
    card: '#1a1714',
  },
  surface: {
    card: '#fbfaf7',
  },
  accent: {
    base: '#ff6f5e',
    light: '#ff8a7a',
    deep: '#ff5a48',
    glow: 'rgba(255,111,94,0.18)',
  },
  text: {
    primary: '#fbfaf7',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.32)',
    label: 'rgba(255,255,255,0.42)',
  },
  suit: {
    red: '#e23b46',
    black: '#15161a',
  },
  cardBackTop: '#2a2620',
  cardBackBottom: '#1a1714',
} as const;
