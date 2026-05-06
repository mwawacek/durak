import type { ViewStyle } from 'react-native';

export const colors = {
  // Surfaces
  bg: '#14181a',
  bgElevated: '#1d2326',
  felt: '#1f4d3a',
  feltEdge: '#163828',

  // Text
  text: '#f3ede1',
  textDim: '#9aa39e',

  // Lines
  border: '#2a3236',

  // Accents
  accent: '#d4a85a',
  accentStrong: '#f0c674',
  danger: '#c14a4a',
  warning: '#d4a85a',
  success: '#6a9955',

  // Card faces
  cardFace: '#fbf7ee',
  cardEdge: '#d8cdb4',
  cardSuitRed: '#b71c1c',
  cardSuitBlack: '#1a1a1a',
  cardBack: '#2c4a3a',
  cardBackPattern: '#6a9955',
} as const;

export const spacing = (n: number): number => n * 4;

export const radii = { sm: 6, md: 10, lg: 16, card: 8, pill: 999 } as const;

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } satisfies ViewStyle,
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } satisfies ViewStyle,
} as const;
