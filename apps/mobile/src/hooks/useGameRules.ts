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
  /** Attacks (by id) that the currently selected hand card can defend against. Empty if no card selected. */
  candidateAttackIds: Set<string>;
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
      const defenderHand = defender?.handCount ?? 0;
      for (const c of game.you.hand) {
        if (canPileOn(c, game.table, defenderHand, MAX_TABLE_PAIRS)) {
          // Opening attack from the main attacker is anything; pile-on must also
          // come from an eligible attacker, but the engine still validates that.
          // Highlighting "could be legal" cards even if the player isn't actually
          // eligible is acceptable — they get a toast on the rejection.
          ids.add(c.id);
        }
      }
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
    undefendedCount,
    needsMyConfirmation,
    awaitingFrom,
  };
};
