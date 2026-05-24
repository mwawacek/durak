import { useMemo } from 'react';
import {
  beats,
  canPileOn,
  canRedirectWith,
  MAX_TABLE_PAIRS,
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
  /** Attacks (by id) that the currently selected hand card can defend against. */
  candidateAttackIds: Set<string>;
  undefendedCount: number;
  /** True iff this player is an attacker whose Bito confirmation is still pending. */
  needsMyConfirmation: boolean;
  /** Player names of attackers whose Bito is still awaited (excluding me). */
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
 * Drives button enablement, banner text, and card highlights.
 */
export const useGameRules = ({
  game,
  playerId,
  selectedCardId,
  redirectMode,
}: Args): GameRules => {
  const isAttacker = game.attackerId === playerId;
  const isDefender = game.defenderId === playerId;
  const defender = game.players.find((p) => p.id === game.defenderId);
  const hand = game.you.hand;
  const table = game.table;
  const trumpSuit = game.trumpSuit;
  const defenderHandCount = defender?.handCount ?? 0;

  const canRedirect = useMemo<boolean>(() => {
    if (!isDefender) return false;
    return canRedirectWith(hand, table);
  }, [hand, table, isDefender]);

  const playableCardIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();

    if (isDefender && redirectMode) {
      const firstRank = table[0]?.attack.rank;
      if (!firstRank) return ids;
      for (const card of hand) if (card.rank === firstRank) ids.add(card.id);
      return ids;
    }

    if (isDefender) {
      for (const card of hand) {
        for (const pair of table) {
          if (pair.defense) continue;
          if (beats(pair.attack, card, trumpSuit)) {
            ids.add(card.id);
            break;
          }
        }
      }
      return ids;
    }

    if (isAttacker || (!isDefender && table.length > 0)) {
      for (const c of hand) {
        if (canPileOn(c, table, defenderHandCount, MAX_TABLE_PAIRS)) {
          ids.add(c.id);
        }
      }
    }

    return ids;
  }, [hand, table, trumpSuit, defenderHandCount, isAttacker, isDefender, redirectMode]);

  const candidateAttackIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    if (!isDefender || !selectedCardId || redirectMode) return ids;
    const card = hand.find((c) => c.id === selectedCardId);
    if (!card) return ids;
    for (const pair of table) {
      if (pair.defense) continue;
      if (beats(pair.attack, card, trumpSuit)) ids.add(pair.attack.id);
    }
    return ids;
  }, [hand, table, trumpSuit, isDefender, selectedCardId, redirectMode]);

  const undefendedCount = useMemo(
    () => table.filter((p) => !p.defense).length,
    [table],
  );

  const { needsMyConfirmation, awaitingFrom } = useMemo(() => {
    const pending = game.pendingConfirmations ?? [];
    return {
      needsMyConfirmation: playerId !== null && pending.includes(playerId),
      awaitingFrom: pending
        .filter((id) => id !== playerId)
        .map((id) => game.players.find((p) => p.id === id)?.name ?? '?'),
    };
  }, [game.pendingConfirmations, game.players, playerId]);

  return {
    isAttacker,
    isDefender,
    defender,
    canRedirect,
    playableCardIds,
    candidateAttackIds,
    undefendedCount,
    needsMyConfirmation,
    awaitingFrom,
  };
};
