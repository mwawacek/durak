/**
 * Card sizes follow the spec: hand cards scale down as the hand grows,
 * the play area uses a single fixed width, mini cards (trump indicator)
 * are tighter. All heights are width × 1.42 (slightly squarer than the
 * canonical 1.45 playing-card aspect — easier to read on a phone).
 */
export const CARD_ASPECT = 1.42;

export const handCardWidth = (handSize: number): number => {
  if (handSize <= 6) return 56;
  if (handSize <= 8) return 50;
  return 46;
};

export const PLAY_CARD_W = 62;

/** Width × height for an explicit card width. */
export const cardDims = (width: number): { w: number; h: number } => ({
  w: width,
  h: Math.round(width * CARD_ASPECT),
});
