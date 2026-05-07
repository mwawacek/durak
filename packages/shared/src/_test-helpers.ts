import { type Card, cardId, type Rank, type Suit } from './cards';
import type { AttackPair } from './game';

/** Build a Card with the canonical id derived from rank+suit. */
export const card = (rank: Rank, suit: Suit): Card => ({
  rank,
  suit,
  id: cardId(suit, rank),
});

/**
 * Build an AttackPair from a "rank+suit" shorthand.
 * Examples: pair('7s'), pair('7s', 'Jh').
 * Suits: s=spades, h=hearts, d=diamonds, c=clubs.
 */
export const pair = (attackCode: string, defenseCode?: string): AttackPair => ({
  attack: parseCode(attackCode),
  defense: defenseCode ? parseCode(defenseCode) : null,
});

const SUIT_BY_LETTER: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
};

const parseCode = (code: string): Card => {
  const suitLetter = code.slice(-1).toLowerCase();
  const rank = code.slice(0, -1) as Rank;
  const suit = SUIT_BY_LETTER[suitLetter];
  if (!suit) throw new Error(`Bad suit letter in card code: ${code}`);
  return card(rank, suit);
};
