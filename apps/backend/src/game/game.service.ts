import { Injectable, Logger } from '@nestjs/common';
import { Card, GameStatePrivate } from '@durak/shared';
import { DeckService } from './deck.service';
import {
  GameStateInternal,
  projectPrivate,
  projectPublic,
} from './game.types';
import {
  endTurn,
  initGame,
  markConnected,
  markDisconnected,
  playAttack,
  playDefense,
  redirectAttack,
  takeCards,
} from './game.engine';

export type GameMutation = (state: GameStateInternal) => GameStateInternal;

/**
 * GameService owns the authoritative in-memory game state per room.
 * All mutations go through pure engine functions that return new states.
 */
@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly games = new Map<string, GameStateInternal>(); // roomId -> state

  constructor(private readonly deck: DeckService) {}

  create(roomId: string, players: { id: string; name: string }[], dealerIdx = 0): GameStateInternal {
    if (this.games.has(roomId)) {
      throw new Error(`Game for room ${roomId} already exists`);
    }
    const deck = this.deck.shuffle(this.deck.buildDeck());
    const state = initGame({ roomId, players, deck, dealerIdx, now: Date.now() });
    this.games.set(roomId, state);
    this.logger.log(`Game created for room ${roomId} with ${players.length} players`);
    return state;
  }

  get(roomId: string): GameStateInternal | null {
    return this.games.get(roomId) ?? null;
  }

  remove(roomId: string): void {
    this.games.delete(roomId);
  }

  private apply(roomId: string, mutation: GameMutation): GameStateInternal {
    const current = this.games.get(roomId);
    if (!current) throw new Error(`No game for room ${roomId}`);
    const next = mutation(current);
    this.games.set(roomId, next);
    return next;
  }

  attack(roomId: string, playerId: string, card: Card): GameStateInternal {
    return this.apply(roomId, (s) => playAttack(s, playerId, card));
  }

  defend(roomId: string, playerId: string, attackCardId: string, defenseCard: Card): GameStateInternal {
    return this.apply(roomId, (s) => playDefense(s, playerId, attackCardId, defenseCard));
  }

  redirect(roomId: string, playerId: string, card: Card): GameStateInternal {
    return this.apply(roomId, (s) => redirectAttack(s, playerId, card));
  }

  endTurn(roomId: string, playerId: string): GameStateInternal {
    return this.apply(roomId, (s) => endTurn(s, playerId));
  }

  takeCards(roomId: string, playerId: string): GameStateInternal {
    return this.apply(roomId, (s) => takeCards(s, playerId));
  }

  disconnect(roomId: string, playerId: string): GameStateInternal | null {
    const current = this.games.get(roomId);
    if (!current) return null;
    const next = markDisconnected(current, playerId);
    this.games.set(roomId, next);
    return next;
  }

  reconnect(roomId: string, playerId: string): GameStateInternal | null {
    const current = this.games.get(roomId);
    if (!current) return null;
    const next = markConnected(current, playerId);
    this.games.set(roomId, next);
    return next;
  }

  /** Projection for a single player (includes their own hand, hides others'). */
  viewFor(roomId: string, playerId: string): GameStatePrivate | null {
    const s = this.games.get(roomId);
    return s ? projectPrivate(s, playerId) : null;
  }

  /** Used to derive per-player broadcasts. */
  snapshot(roomId: string): GameStateInternal | null {
    return this.games.get(roomId) ?? null;
  }

  /** Debug dump (no hands). */
  publicSnapshot(roomId: string) {
    const s = this.games.get(roomId);
    return s ? projectPublic(s) : null;
  }
}
