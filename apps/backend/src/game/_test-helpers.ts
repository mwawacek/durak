import { type Card, cardId, type Rank, type Suit } from '@durak/shared';
import type { GameStateInternal, PlayerInternal } from './game.types';

const SUIT_BY_LETTER: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
};

/** Build a card from a "rank+suit" code, e.g. "7s" → 7♠. */
export const c = (code: string): Card => {
  const suitLetter = code.slice(-1).toLowerCase();
  const rank = code.slice(0, -1) as Rank;
  const suit = SUIT_BY_LETTER[suitLetter];
  if (!suit) throw new Error(`Bad suit letter in card code: ${code}`);
  return { rank, suit, id: cardId(suit, rank) };
};

interface PlayerInit {
  id?: string;
  name?: string;
  hand?: string[]; // card codes
  hasFinished?: boolean;
}

const NOW = 1_700_000_000_000;

export const player = (i: number, init: PlayerInit = {}): PlayerInternal => ({
  id: init.id ?? `p${i}`,
  name: init.name ?? `Player ${i}`,
  hand: (init.hand ?? []).map(c),
  isConnected: true,
  hasFinished: init.hasFinished ?? false,
  finishedAt: init.hasFinished ? NOW : null,
});

interface StateInit {
  roomId?: string;
  players: PlayerInit[];
  attackerIdx?: number;
  defenderIdx?: number;
  table?: { attack: string; defense?: string }[];
  deck?: string[];
  discard?: string[];
  trump?: string; // card code; trumpSuit derived
  trumpSuit?: Suit; // override if no card
  phase?: GameStateInternal['phase'];
  passConfirmations?: number[];
}

/** Build a complete `GameStateInternal` for tests. Defaults aim at a 1v1 round. */
export const state = (init: StateInit): GameStateInternal => {
  const players = init.players.map((p, i) => player(i, p));
  const trumpCard = init.trump ? c(init.trump) : null;
  const trumpSuit = init.trumpSuit ?? trumpCard?.suit ?? null;
  return {
    roomId: init.roomId ?? 'room-1',
    phase: init.phase ?? 'attacking',
    players,
    dealerIdx: 0,
    deck: (init.deck ?? []).map(c),
    discard: (init.discard ?? []).map(c),
    trumpCard,
    trumpSuit,
    table: (init.table ?? []).map((t) => ({
      attack: c(t.attack),
      defense: t.defense ? c(t.defense) : null,
    })),
    attackerIdx: init.attackerIdx ?? 0,
    defenderIdx: init.defenderIdx ?? 1,
    loserId: null,
    turnStartedAt: NOW,
    passConfirmations: new Set(init.passConfirmations ?? []),
    startedAt: NOW,
  };
};
