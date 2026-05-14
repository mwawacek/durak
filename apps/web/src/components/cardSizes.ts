/**
 * Card size tokens — kept in a separate module from Card.tsx so React-Refresh
 * (Vite HMR) can hot-reload the component without invalidating the constants.
 */
export const CARD_SIZES = {
  sm: 44,
  md: 64,
  lg: 80,
} as const;

export type CardSize = keyof typeof CARD_SIZES;

/** Width × height for a given size token (1.45 aspect ratio). */
export const cardDims = (size: CardSize = 'md'): { w: number; h: number } => {
  const w = CARD_SIZES[size];
  return { w, h: Math.round(w * 1.45) };
};
