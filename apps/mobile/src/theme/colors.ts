import type { ViewStyle } from 'react-native';

/**
 * "Classic Mahogany" palette — Russian gentleman's-club / casino feel.
 * Mahogany wood, dark forest felt, brass + gold accents, cream cards.
 */
export const colors = {
  // Wood backdrop
  woodDark: '#160803',
  woodMid: '#2a1108',
  woodLight: '#4a2418',
  woodHighlight: '#6a3a22',

  // Felt (table center)
  felt: '#1d3826',
  feltMid: '#0f2317',
  feltDark: '#07140d',

  // Gold / brass
  gold: '#d4a548',
  goldLight: '#e6c478',
  goldHighlight: '#f0d68f',
  goldMuted: 'rgba(212,165,72,0.55)',

  // Burgundy / red
  burgundy: '#5a1a1f',
  burgundyDark: '#2a0a0d',
  redBright: '#c83a36',
  redDeep: '#8a201f',
  redDarkest: '#4a0c0b',

  // Status
  defendingGreen: '#5fbd83',
  warmAlert: '#ffaa50',

  // Text (cream tones)
  cream: '#f3e7c8',
  creamSoft: '#fff7e0',
  creamDim: 'rgba(243,231,200,0.7)',
  textDim: 'rgba(230,196,120,0.55)',

  // Card faces (parchment)
  cardFace: '#fbf6ec',
  cardFaceShadow: '#f1e6cd',
  cardSuitRed: '#a8201f',
  cardSuitBlack: '#1a1410',

  // Face card portrait backgrounds (per rank)
  faceJ: '#5a3a1f', // Jack — brown
  faceQ: '#5a1a2f', // Queen — burgundy
  faceK: '#1f2f5a', // King — royal blue
  faceA: '#3a1f5a', // Ace — purple

  // App background
  bg: '#15110d',
  bgElevated: 'rgba(20,8,3,0.7)',
  border: 'rgba(212,165,72,0.4)',

  // Compatibility aliases (kept for any leftover callers in lobby/login)
  text: '#f3e7c8',
  accent: '#d4a548',
  accentStrong: '#f0d68f',
  danger: '#c83a36',
  success: '#5fbd83',
  warning: '#e6c478',
  feltEdge: '#163828',
  cardBack: '#5a1a1f',
  cardEdge: '#d8cdb4',
  cardBackPattern: '#d4a548',
} as const;

export const spacing = (n: number): number => n * 4;

export const radii = { sm: 6, md: 10, lg: 16, card: 8, pill: 999, oval: 9999 } as const;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  } satisfies ViewStyle,
  brass: {
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } satisfies ViewStyle,
} as const;

import { Platform } from 'react-native';

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
} as const;
