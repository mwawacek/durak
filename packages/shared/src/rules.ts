import { type Card, RANK_ORDER, type Rank, type Suit } from './cards';
import type { AttackPair } from './game';

export const beats = (attack: Card, defense: Card, trumpSuit: Suit | null): boolean => {
  if (defense.suit === attack.suit) {
    return RANK_ORDER[defense.rank] > RANK_ORDER[attack.rank];
  }
  if (trumpSuit && defense.suit === trumpSuit && attack.suit !== trumpSuit) return true;
  return false;
};

export const ranksOnTable = (table: AttackPair[]): Set<Rank> => {
  const ranks = new Set<Rank>();
  for (const pair of table) {
    ranks.add(pair.attack.rank);
    if (pair.defense) ranks.add(pair.defense.rank);
  }
  return ranks;
};

export const tableFullyDefended = (table: AttackPair[]): boolean =>
  table.length > 0 && table.every((p) => p.defense !== null);

export const tableIsUniformRank = (table: AttackPair[]): boolean => {
  if (table.length === 0) return false;
  const first = table[0]!.attack.rank;
  return table.every((p) => p.attack.rank === first);
};

/**
 * Defender may "pass on" (Weiterschieben) when:
 *   - nothing on the table is yet defended
 *   - all attacks share the same rank
 *   - defender holds a same-rank card
 *   - defender keeps at least one card after passing (rule check at engine level too)
 */
export const canRedirectWith = (
  hand: Card[],
  table: AttackPair[],
): boolean => {
  if (hand.length < 2) return false;
  if (!tableIsUniformRank(table)) return false;
  if (table.some((p) => p.defense !== null)) return false;
  const targetRank = table[0]!.attack.rank;
  return hand.some((c) => c.rank === targetRank);
};

/**
 * Whether a single card may legally be added to the table as a pile-on.
 * Mirrors the engine's `playAttack` capacity / rank checks (minus the
 * caller-identity check, which the engine still owns).
 *
 * Used by mobile to highlight playable pile-on cards without re-implementing
 * the rule.
 */
export const canPileOn = (
  card: Card,
  table: AttackPair[],
  defenderHandCount: number,
  maxTablePairs: number,
): boolean => {
  if (table.length === 0) return true; // first card of the round — anything goes
  if (table.length >= maxTablePairs) return false;
  const undefendedCount = table.filter((p) => !p.defense).length;
  if (undefendedCount >= defenderHandCount) return false;
  return ranksOnTable(table).has(card.rank);
};
