/**
 * Subset of design tokens that need to be referenced from JS / inline SVG
 * (where Tailwind class names don't reach). Keep in sync with
 * `tailwind.config.ts` — these are the source of truth for SVG fills,
 * gradient stops, and any element that uses inline `style`.
 */
export const tokens = {
  bg: '#15110d',
  ink: '#1a0905',

  mahoganyDark: '#160803',
  mahogany: '#2a1108',
  mahoganyLight: '#4a2418',
  mahoganyHighlight: '#6a3a22',

  feltDark: '#07140d',
  feltMid: '#0f2317',
  felt: '#1d3826',
  feltShadow: 'rgba(0,0,0,0.45)',

  goldDeep: '#8a5a1f',
  goldDark: '#b88a3a',
  gold: '#d4a548',
  goldLight: '#e6c478',
  goldHighlight: '#f0d68f',
  goldRail: 'rgba(212,165,72,0.75)',
  goldRailFaint: 'rgba(212,165,72,0.45)',
  goldFaint: 'rgba(212,165,72,0.4)',
  goldHaloBg: 'rgba(230,196,120,0.08)',

  burgundy: '#5a1a1f',
  burgundyDark: '#2a0a0d',

  red: '#c83a36',
  redDeep: '#8a201f',
  redDarkest: '#4a0c0b',
  redPip: '#ff8a82',

  cream: '#f3e7c8',
  creamSoft: '#fff7e0',

  cardFace: '#fbf6ec',
  cardFaceShadow: '#f1e6cd',
  cardSuitRed: '#a8201f',
  cardSuitBlack: '#1a1410',

  faceJ: '#5a3a1f',
  faceQ: '#5a1a2f',
  faceK: '#1f2f5a',
  faceA: '#3a1f5a',

  defending: '#5fbd83',
  warmAlert: '#ffaa50',
  warmAlertHaze: 'rgba(255,170,80,0.06)',
} as const;
