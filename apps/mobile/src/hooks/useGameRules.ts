import { useMemo } from 'react';
import {
  beats,
  canRedirectWith,
  MAX_TABLE_PAIRS,
  ranksOnTable,
  tableFullyDefended,
  type GameStatePrivate,
  type PlayerPublic,
} from '@durak/shared';

export interface GameRules {
  isAttacker: boolean;
  isDefender: boolean;
  defender: PlayerPublic | undefined;
  canRedirect: boolean;
  /** Card ids in your hand that are legally playable in the current context. */
  playableCardIds: Set<string>;
  /** Attacks (by id) that the currently selected hand card can defend against. Empty if no card selected. */
  candidateAttackIds: Set<string>;
  allDefended: boolean;
  undefendedCount: number;
  /** True iff this player is one of the attackers whose Bito confirmation is still pending. */
  needsMyConfirmation: boolean;
  /** Player names of attackers whose Bito is still awaited (excluding the current player). */
  awaitingFrom: string[];
}

interface Args {
  game: GameStatePrivate;
  playerId: string | null;
  selectedCardId: string | null;
  redirectMode: boolean;
}

/**
 * All client-side derivations of game state for the active player.
 * Used by GameScreen to drive button enablement, banner text, and card highlights.
 */
export const useGameRules = ({ game, playerId, selectedCardId, redirectMode }: Args): GameRules => {
  const isAttacker = game.attackerId === playerId;
  const isDefender = game.defenderId === playerId;
  const defender = game.players.find((p) => p.id === game.defenderId);

  const canRedirect = useMemo<boolean>(() => {
    if (!isDefender) return false;
    return canRedirectWith(game.you.hand, game.table);
  }, [game, isDefender]);

  const playableCardIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();

    if (isDefender && redirectMode) {
      const firstRank = game.table[0]?.attack.rank;
      if (!firstRank) return ids;
      for (const card of game.you.hand) if (card.rank === firstRank) ids.add(card.id);
      return ids;
    }

    if (isDefender) {
      for (const card of game.you.hand) {
        for (const pair of game.table) {
          if (pair.defense) continue;
          if (beats(pair.attack, card, game.trumpSuit)) {
            ids.add(card.id);
            break;
          }
        }
      }
      return ids;
    }

    if (isAttacker || (!isDefender && game.table.length > 0)) {
      if (game.table.length === 0 && isAttacker) {
        for (const c of game.you.hand) ids.add(c.id);
        return ids;
      }
      // No more pile-on once the table is full (engine cap).
      if (game.table.length >= MAX_TABLE_PAIRS) return ids;
      const tableRanks = ranksOnTable(game.table);
      const undefendedCount = game.table.filter((p) => !p.defense).length;
      const defenderCapacity = (defender?.handCount ?? 0) > undefendedCount;
      if (!defenderCapacity) return ids;
      for (const c of game.you.hand) if (tableRanks.has(c.rank)) ids.add(c.id);
    }

    return ids;
  }, [game, isAttacker, isDefender, defender, redirectMode]);

  const candidateAttackIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    if (!isDefender || !selectedCardId || redirectMode) return ids;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return ids;
    for (const pair of game.table) {
      if (pair.defense) continue;
      if (beats(pair.attack, card, game.trumpSuit)) ids.add(pair.attack.id);
    }
    return ids;
  }, [game, isDefender, selectedCardId, redirectMode]);

  const allDefended = tableFullyDefended(game.table);
  const undefendedCount = game.table.filter((p) => !p.defense).length;

  const pending = game.pendingConfirmations ?? [];
  const needsMyConfirmation = playerId !== null && pending.includes(playerId);
  const awaitingFrom = pending
    .filter((id) => id !== playerId)
    .map((id) => game.players.find((p) => p.id === id)?.name ?? '?');

  return {
    isAttacker,
    isDefender,
    defender,
    canRedirect,
    playableCardIds,
    candidateAttackIds,
    allDefended,
    undefendedCount,
    needsMyConfirmation,
    awaitingFrom,
  };
};
