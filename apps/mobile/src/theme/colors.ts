import { Platform, StyleSheet, type ViewStyle } from 'react-native';

/**
 * "Classic Mahogany" palette — Russian gentleman's-club / casino feel.
 * Mahogany wood, dark forest felt, brass + gold accents, cream cards.
 *
 * Rule: components must NOT use hex/rgba literals — extend this file instead.
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
  feltShadow: 'rgba(0,0,0,0.45)',

  // Gold / brass
  gold: '#d4a548',
  goldLight: '#e6c478',
  goldHighlight: '#f0d68f',
  goldDeep: '#8a5a1f',
  goldRail: 'rgba(212,165,72,0.75)',
  goldRailFaint: 'rgba(212,165,72,0.45)',
  goldMuted: 'rgba(212,165,72,0.55)',
  goldFaint: 'rgba(212,165,72,0.4)',
  goldHaloBg: 'rgba(230,196,120,0.08)',
  goldDark: '#b88a3a',

  // Brass button gradient extras
  brassDarkest: 'rgba(15,8,4,0.95)',
  brassDarker: 'rgba(15,8,4,0.9)',
  brassWoodGrad: 'rgba(40,28,18,0.85)',

  // Burgundy / red
  burgundy: '#5a1a1f',
  burgundyDark: '#2a0a0d',
  redBright: '#c83a36',
  redDeep: '#8a201f',
  redDarkest: '#4a0c0b',
  redDarkestActive: '#3a0c0b',
  redMuted1: 'rgba(168,32,31,0.55)',
  redMuted2: 'rgba(50,8,7,0.85)',
  redOutline: 'rgba(220,80,72,0.7)',
  redCount: '#ff9a90',
  redPipLight: '#ff8a82',

  // Defender highlight
  defenderMuted1: 'rgba(212,165,72,0.4)',
  defenderMuted2: 'rgba(40,28,18,0.9)',

  // Status
  defendingGreen: '#5fbd83',
  warmAlert: '#ffaa50',
  warmAlertHaze: 'rgba(255,170,80,0.05)',

  // Text (cream tones)
  cream: '#f3e7c8',
  creamSoft: '#fff7e0',
  creamDim: 'rgba(243,231,200,0.7)',
  textShadow: 'rgba(0,0,0,0.6)',

  // Card faces (parchment)
  cardFace: '#fbf6ec',
  cardFaceShadow: '#f1e6cd',
  cardSuitRed: '#a8201f',
  cardSuitBlack: '#1a1410',

  // Avatar gradient
  avatarDarkTop: '#4a3520',
  avatarDarkBottom: '#2a1f12',
  inkBlack: '#1a0905',

  // Face card portrait backgrounds (per rank)
  faceJ: '#5a3a1f',
  faceQ: '#5a1a2f',
  faceK: '#1f2f5a',
  faceA: '#3a1f5a',

  // App background
  bg: '#15110d',
  bgPillSoft: 'rgba(20,8,3,0.55)',
  bgPillStrong: 'rgba(20,8,3,0.7)',
  bgElevated: 'rgba(20,8,3,0.7)', // alias
  border: 'rgba(212,165,72,0.4)',

  // Compatibility aliases (kept for any leftover callers in lobby/login)
  text: '#f3e7c8',
  accent: '#d4a548',
  accentStrong: '#f0d68f',
  textDim: 'rgba(230,196,120,0.55)',
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

export const fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
} as const;

/**
 * Reusable style atoms. Compose with caller-specific padding/spacing.
 */
export const presets = {
  /** Gold-rimmed dark pill (used by name plates, count badges, the "you" plate). */
  goldPill: {
    borderRadius: radii.pill,
    backgroundColor: colors.bgPillStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldFaint,
  } satisfies ViewStyle,
} as const;
