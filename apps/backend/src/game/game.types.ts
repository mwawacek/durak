import {
  AttackPair,
  Card,
  GamePhase,
  PlayerPrivate,
  PlayerPublic,
  Suit,
  GameStatePublic,
  GameStatePrivate,
} from '@durak/shared';

export interface PlayerInternal {
  id: string;
  name: string;
  hand: Card[];
  isConnected: boolean;
  hasFinished: boolean;
  finishedAt: number | null;
}

export interface GameStateInternal {
  roomId: string;
  phase: GamePhase;
  players: PlayerInternal[]; // seat order — index 0 is dealer+1
  dealerIdx: number;
  deck: Card[];
  discard: Card[];
  trumpCard: Card | null;
  trumpSuit: Suit | null;
  table: AttackPair[];
  attackerIdx: number;
  defenderIdx: number;
  loserId: string | null;
  turnStartedAt: number;
  /** Players (by index) who opted "pass" / signalled bito after defender covered. */
  passConfirmations: Set<number>;
  startedAt: number;
}

export const toPublicPlayer = (p: PlayerInternal): PlayerPublic => ({
  id: p.id,
  name: p.name,
  handCount: p.hand.length,
  isConnected: p.isConnected,
  hasFinished: p.hasFinished,
});

export const toPrivatePlayer = (p: PlayerInternal): PlayerPrivate => ({
  ...toPublicPlayer(p),
  hand: [...p.hand],
});

export const projectPublic = (state: GameStateInternal): GameStatePublic => ({
  roomId: state.roomId,
  phase: state.phase,
  players: state.players.map(toPublicPlayer),
  trumpCard: state.trumpCard,
  trumpSuit: state.trumpSuit,
  deckCount: state.deck.length,
  discardCount: state.discard.length,
  table: state.table.map((p) => ({ ...p })),
  attackerId: state.players[state.attackerIdx]?.id ?? null,
  defenderId: state.players[state.defenderIdx]?.id ?? null,
  turnStartedAt: state.turnStartedAt,
  loserId: state.loserId,
});

export const projectPrivate = (state: GameStateInternal, playerId: string): GameStatePrivate => {
  const me = state.players.find((p) => p.id === playerId);
  return {
    ...projectPublic(state),
    you: me
      ? toPrivatePlayer(me)
      : // Spectator fallback
        { id: playerId, name: '', handCount: 0, isConnected: false, hasFinished: false, hand: [] },
  };
};
