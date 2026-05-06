export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export type Suit = (typeof SUITS)[number];

// 52-card deck: 2..10, J, Q, K, A
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
export type Rank = (typeof RANKS)[number];

export const RANK_ORDER: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export interface Card {
  suit: Suit;
  rank: Rank;
  /** Stable server-assigned id, e.g. "8-hearts" — safe to reference in UI and socket payloads. */
  id: string;
}

export const cardId = (suit: Suit, rank: Rank): string => `${rank}-${suit}`;

export const DECK_SIZE = SUITS.length * RANKS.length;
export const STARTING_HAND_SIZE = 6;
