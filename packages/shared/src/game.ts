import type { Card, Suit } from './cards';

export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'attacking'
  | 'defending'
  | 'resolving'
  | 'finished';

export type RoomStatus = 'lobby' | 'in-game' | 'finished';

export interface PlayerPublic {
  id: string;
  name: string;
  handCount: number;
  isConnected: boolean;
  hasFinished: boolean;
}

export interface PlayerPrivate extends PlayerPublic {
  hand: Card[];
}

export interface AttackPair {
  attack: Card;
  defense: Card | null;
}

export interface RoomPublic {
  id: string;
  name: string;
  ownerId: string;
  players: PlayerPublic[];
  maxPlayers: number;
  status: RoomStatus;
  createdAt: number;
}

export interface GameStatePublic {
  roomId: string;
  phase: GamePhase;
  players: PlayerPublic[];
  trumpCard: Card | null;
  trumpSuit: Suit | null;
  deckCount: number;
  discardCount: number;
  table: AttackPair[];
  attackerId: string | null;
  defenderId: string | null;
  turnStartedAt: number | null;
  loserId: string | null;
}

/** Per-recipient view — includes the receiving player's own hand. */
export interface GameStatePrivate extends GameStatePublic {
  you: PlayerPrivate;
}

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
