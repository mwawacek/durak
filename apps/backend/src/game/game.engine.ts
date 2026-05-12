import {
  AttackPair,
  Card,
  MAX_TABLE_PAIRS,
  RANK_ORDER,
  STARTING_HAND_SIZE,
  ERROR_CODES,
  ErrorCode,
  GamePhase,
  beats,
  ranksOnTable,
  tableFullyDefended,
} from '@durak/shared';
import { GameStateInternal, PlayerInternal } from './game.types';

export class GameRuleError extends Error {
  constructor(public readonly code: ErrorCode, message: string) {
    super(message);
  }
}

const cloneState = (s: GameStateInternal): GameStateInternal => ({
  ...s,
  players: s.players.map((p) => ({ ...p, hand: [...p.hand] })),
  deck: [...s.deck],
  discard: [...s.discard],
  table: s.table.map((pair) => ({ ...pair })),
  passConfirmations: new Set(s.passConfirmations),
});

const findPlayerIdx = (s: GameStateInternal, playerId: string): number => {
  const idx = s.players.findIndex((p) => p.id === playerId);
  if (idx < 0) throw new GameRuleError(ERROR_CODES.UNAUTHORIZED, 'Player not in game');
  return idx;
};

const removeFromHand = (p: PlayerInternal, card: Card): void => {
  const i = p.hand.findIndex((c) => c.id === card.id);
  if (i < 0) throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Card not in hand');
  p.hand.splice(i, 1);
};

const nextActiveIdx = (s: GameStateInternal, startIdx: number, skipIdx?: number): number => {
  const n = s.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (startIdx + step) % n;
    if (idx === skipIdx) continue;
    if (!s.players[idx]!.hasFinished) return idx;
  }
  return startIdx;
};

const prevActiveIdx = (s: GameStateInternal, startIdx: number): number => {
  const n = s.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (startIdx - step + n) % n;
    if (!s.players[idx]!.hasFinished) return idx;
  }
  return startIdx;
};

/** Players permitted to pile on: main attacker + direct active neighbours of the defender. */
const neighborAttackers = (s: GameStateInternal): Set<number> => {
  const set = new Set<number>();
  set.add(s.attackerIdx);
  set.add(prevActiveIdx(s, s.defenderIdx));
  set.add(nextActiveIdx(s, s.defenderIdx));
  set.delete(s.defenderIdx);
  return set;
};

const playerHasPileOnCard = (player: PlayerInternal, table: AttackPair[]): boolean => {
  const ranks = ranksOnTable(table);
  return player.hand.some((c) => ranks.has(c.rank));
};

/**
 * Indices of attackers who still need to call "Bito" before the defended
 * round can commit. Returns an empty set unless the table is fully defended.
 *
 * Auto-pass: an eligible attacker is excluded from this set if they have no
 * pile-on-capable card (no rank match) — there's nothing to wait on them for.
 */
const computePendingIndices = (s: GameStateInternal): Set<number> => {
  if (s.table.length === 0 || !tableFullyDefended(s.table)) return new Set();
  if (s.table.length >= MAX_TABLE_PAIRS) return new Set(); // table full → no more pile-on possible
  const defender = s.players[s.defenderIdx];
  if (!defender || defender.hand.length === 0) return new Set(); // no defender capacity

  const eligible = neighborAttackers(s);
  const pending = new Set<number>();
  for (const idx of eligible) {
    if (s.passConfirmations.has(idx)) continue;
    const player = s.players[idx]!;
    if (player.hasFinished) continue;
    if (!playerHasPileOnCard(player, s.table)) continue;
    pending.add(idx);
  }
  return pending;
};

export const pendingConfirmationIds = (s: GameStateInternal): string[] => {
  return [...computePendingIndices(s)].map((idx) => s.players[idx]!.id);
};

const commitRoundEnd = (s: GameStateInternal): void => {
  for (const pair of s.table) {
    s.discard.push(pair.attack);
    if (pair.defense) s.discard.push(pair.defense);
  }
  s.table = [];
  refillHands(s, s.attackerIdx);
  rotateAfterSuccess(s);
  s.passConfirmations.clear();
};

const tryAutoCommit = (s: GameStateInternal): void => {
  if (s.table.length === 0 || !tableFullyDefended(s.table)) return;
  if (computePendingIndices(s).size === 0) {
    commitRoundEnd(s);
  }
};

/**
 * Indices of attackers who still hold a pile-on-capable card AND haven't
 * confirmed Bito. If empty, no more attacks can land on the table.
 */
const pileOnCapableIndices = (s: GameStateInternal): Set<number> => {
  const eligible = neighborAttackers(s);
  const out = new Set<number>();
  const defender = s.players[s.defenderIdx];
  if (!defender || defender.hand.length === 0) return out;
  if (s.table.length >= MAX_TABLE_PAIRS) return out;
  for (const idx of eligible) {
    if (s.passConfirmations.has(idx)) continue;
    const player = s.players[idx]!;
    if (player.hasFinished) continue;
    if (playerHasPileOnCard(player, s.table)) out.add(idx);
  }
  return out;
};

const defenderCanBeatAnyUndefended = (s: GameStateInternal): boolean => {
  const defender = s.players[s.defenderIdx];
  if (!defender) return false;
  for (const pair of s.table) {
    if (pair.defense) continue;
    for (const card of defender.hand) {
      if (beats(pair.attack, card, s.trumpSuit)) return true;
    }
  }
  return false;
};

const commitTake = (s: GameStateInternal): void => {
  const defender = s.players[s.defenderIdx]!;
  for (const pair of s.table) {
    defender.hand.push(pair.attack);
    if (pair.defense) defender.hand.push(pair.defense);
  }
  s.table = [];
  refillHands(s, s.attackerIdx);
  rotateAfterFailure(s);
};

/**
 * If the defender has at least one undefended attack they cannot beat AND no
 * eligible attacker can pile on more cards, the round is stuck — the defender
 * has only one legal move (Take), so the server commits it automatically.
 *
 * The defender still has agency in two cases:
 *   1. They *could* defend (just choose not to) — auto-take won't trigger.
 *   2. They could redirect — the redirect rule short-circuits this check by
 *      requiring uniform-rank table with no defenses played; once any defense
 *      lands, redirect is off the table, so this auto-take applies.
 */
const tryAutoTake = (s: GameStateInternal): void => {
  if (s.table.length === 0) return;
  const undefendedCount = s.table.filter((p) => !p.defense).length;
  if (undefendedCount === 0) return; // nothing to take
  if (defenderCanBeatAnyUndefended(s)) return; // defender still has a move
  if (pileOnCapableIndices(s).size > 0) return; // more pile-ons may still come
  commitTake(s);
};

type Role = 'attacker' | 'defender' | 'any-attacker';

const requireTurn = (
  state: GameStateInternal,
  playerId: string,
  role: Role,
  allowedPhases: GamePhase[],
): { s: GameStateInternal; playerIdx: number; me: PlayerInternal } => {
  const s = cloneState(state);
  if (!allowedPhases.includes(s.phase)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, `Wrong phase: ${s.phase}`);
  }
  const playerIdx = findPlayerIdx(s, playerId);
  if (role === 'attacker' && playerIdx !== s.attackerIdx) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Only main attacker');
  }
  if (role === 'defender' && playerIdx !== s.defenderIdx) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Only defender');
  }
  if (role === 'any-attacker' && playerIdx === s.defenderIdx) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Defender cannot attack');
  }
  return { s, playerIdx, me: s.players[playerIdx]! };
};

export interface InitArgs {
  roomId: string;
  players: { id: string; name: string }[];
  deck: Card[]; // already shuffled
  dealerIdx: number;
  now: number;
}

export const initGame = ({ roomId, players, deck, dealerIdx, now }: InitArgs): GameStateInternal => {
  const internalPlayers: PlayerInternal[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    hand: [],
    isConnected: true,
    hasFinished: false,
    finishedAt: null,
  }));

  const deckCopy = [...deck];

  for (let i = 0; i < STARTING_HAND_SIZE; i++) {
    for (const player of internalPlayers) {
      const card = deckCopy.shift();
      if (!card) break;
      player.hand.push(card);
    }
  }

  // Trump card stays at the bottom of the deck — visible, still drawable.
  const trumpCard = deckCopy.length > 0 ? deckCopy[deckCopy.length - 1]! : null;
  const trumpSuit = trumpCard ? trumpCard.suit : null;

  // Standard Russian Durak rule: first attacker holds the lowest trump.
  // Fallback (e.g. no trump dealt — exceedingly rare): player after dealer.
  let attackerIdx = -1;
  let lowestTrumpRank = Number.POSITIVE_INFINITY;
  if (trumpSuit) {
    for (let i = 0; i < internalPlayers.length; i++) {
      for (const card of internalPlayers[i]!.hand) {
        if (card.suit === trumpSuit && RANK_ORDER[card.rank] < lowestTrumpRank) {
          lowestTrumpRank = RANK_ORDER[card.rank];
          attackerIdx = i;
        }
      }
    }
  }
  if (attackerIdx < 0) attackerIdx = (dealerIdx + 1) % internalPlayers.length;
  const defenderIdx = (attackerIdx + 1) % internalPlayers.length;

  return {
    roomId,
    phase: 'attacking',
    players: internalPlayers,
    dealerIdx,
    deck: deckCopy,
    discard: [],
    trumpCard,
    trumpSuit,
    table: [],
    attackerIdx,
    defenderIdx,
    loserId: null,
    turnStartedAt: now,
    passConfirmations: new Set<number>(),
    startedAt: now,
  };
};

export const playAttack = (
  state: GameStateInternal,
  playerId: string,
  card: Card,
): GameStateInternal => {
  const { s, playerIdx, me } = requireTurn(state, playerId, 'any-attacker', ['attacking', 'defending']);
  const defender = s.players[s.defenderIdx]!;

  const undefendedCount = s.table.filter((p) => !p.defense).length;
  if (undefendedCount >= defender.hand.length) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Defender has no hand capacity');
  }
  if (s.table.length >= MAX_TABLE_PAIRS) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Table is full');
  }

  if (s.table.length === 0 && playerIdx !== s.attackerIdx) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Only main attacker opens a round');
  }
  if (s.table.length > 0 && !neighborAttackers(s).has(playerIdx)) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Only the attacker or the defender’s neighbours may pile on');
  }

  if (s.table.length > 0 && !ranksOnTable(s.table).has(card.rank)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Rank not on table');
  }

  removeFromHand(me, card);
  s.table.push({ attack: card, defense: null });
  s.phase = 'defending';
  s.turnStartedAt = Date.now();
  s.passConfirmations.clear();

  tryAutoTake(s);
  checkFinished(s);
  return s;
};

export const playDefense = (
  state: GameStateInternal,
  playerId: string,
  attackCardId: string,
  defenseCard: Card,
): GameStateInternal => {
  const { s, me } = requireTurn(state, playerId, 'defender', ['defending', 'attacking']);

  const pair = s.table.find((p) => p.attack.id === attackCardId);
  if (!pair) throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Attack card not on table');
  if (pair.defense) throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Already defended');

  if (!beats(pair.attack, defenseCard, s.trumpSuit)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Defense does not beat attack');
  }

  removeFromHand(me, defenseCard);
  pair.defense = defenseCard;
  s.phase = tableFullyDefended(s.table) ? 'attacking' : 'defending';
  s.turnStartedAt = Date.now();
  s.passConfirmations.clear();

  // If the table is now fully defended and no eligible attacker can pile on,
  // commit the round immediately — nothing to wait for.
  tryAutoCommit(s);
  // After a partial defense, the *remaining* undefended attacks may all be
  // unbeatable for the defender. If pile-on is also exhausted, auto-take.
  tryAutoTake(s);
  checkFinished(s);
  return s;
};

/**
 * Weiterschieben / pass-on: defender drops a same-rank card onto the table and
 * redirects the whole attack to the next active player. Only allowed while no
 * defense cards have been played yet in this round.
 */
export const redirectAttack = (
  state: GameStateInternal,
  playerId: string,
  card: Card,
): GameStateInternal => {
  const { s, me } = requireTurn(state, playerId, 'defender', ['defending']);

  if (s.table.length === 0) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Nothing to redirect');
  }
  if (s.table.some((p) => p.defense !== null)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Already started defending — cannot pass on');
  }

  const attackRank = s.table[0]!.attack.rank;
  if (!s.table.every((p) => p.attack.rank === attackRank)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Multiple ranks on table — cannot pass on');
  }
  if (card.rank !== attackRank) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Card rank must match table');
  }
  // Rule: cannot pass on with your last card — you must keep something to finish with.
  if (me.hand.length <= 1) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Cannot pass on with your last card');
  }

  const newDefenderIdx = nextActiveIdx(s, s.defenderIdx);
  const newDefender = s.players[newDefenderIdx]!;
  const attacksAfter = s.table.length + 1;
  if (newDefender.hand.length < attacksAfter) {
    throw new GameRuleError(
      ERROR_CODES.INVALID_MOVE,
      'Next player has too few cards to receive this attack',
    );
  }

  removeFromHand(me, card);
  s.table.push({ attack: card, defense: null });

  s.attackerIdx = s.defenderIdx;
  s.defenderIdx = newDefenderIdx;
  s.phase = 'defending';
  s.turnStartedAt = Date.now();
  s.passConfirmations.clear();

  tryAutoTake(s);
  checkFinished(s);
  return s;
};

/**
 * "Bito" — confirms that the calling attacker has nothing more to add this round.
 *
 * Any eligible attacker (main attacker + active neighbours of the defender) can
 * call this; the round only commits once everyone who could still pile on has
 * either confirmed or has nothing left to throw in.
 */
export const endTurn = (state: GameStateInternal, playerId: string): GameStateInternal => {
  const { s, playerIdx } = requireTurn(state, playerId, 'any-attacker', ['attacking', 'defending']);

  const eligible = neighborAttackers(s);
  if (!eligible.has(playerIdx)) {
    throw new GameRuleError(ERROR_CODES.NOT_YOUR_TURN, 'Not eligible to confirm this round');
  }
  if (s.table.length === 0) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Nothing to end');
  }
  if (!tableFullyDefended(s.table)) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Table not fully defended');
  }

  s.passConfirmations.add(playerIdx);
  tryAutoCommit(s);
  tryAutoTake(s);
  checkFinished(s);
  return s;
};

export const takeCards = (state: GameStateInternal, playerId: string): GameStateInternal => {
  const { s } = requireTurn(state, playerId, 'defender', ['attacking', 'defending']);

  if (s.table.length === 0) {
    throw new GameRuleError(ERROR_CODES.INVALID_MOVE, 'Table empty');
  }

  const defender = s.players[s.defenderIdx]!;
  for (const pair of s.table) {
    defender.hand.push(pair.attack);
    if (pair.defense) defender.hand.push(pair.defense);
  }
  s.table = [];

  refillHands(s, s.attackerIdx);
  rotateAfterFailure(s);
  checkFinished(s);
  return s;
};

const refillHands = (s: GameStateInternal, firstIdx: number): void => {
  // Order: attacker first, then clockwise, defender last.
  const n = s.players.length;
  const order: number[] = [];
  for (let step = 0; step < n; step++) {
    const idx = (firstIdx + step) % n;
    if (idx !== s.defenderIdx) order.push(idx);
  }
  order.push(s.defenderIdx);

  for (const idx of order) {
    const p = s.players[idx]!;
    if (p.hasFinished) continue;
    while (p.hand.length < STARTING_HAND_SIZE && s.deck.length > 0) {
      const card = s.deck.shift()!;
      p.hand.push(card);
    }
  }

  // The trump card sat at the bottom of the deck and is drawn last. Once the
  // deck is empty, the card now lives in some player's hand — null out the
  // table reference so the trump-reservoir peek disappears. `trumpSuit` stays
  // for the rest of the game.
  if (s.deck.length === 0 && s.trumpCard !== null) {
    s.trumpCard = null;
  }

  for (const p of s.players) {
    if (!p.hasFinished && s.deck.length === 0 && p.hand.length === 0) {
      p.hasFinished = true;
      p.finishedAt = Date.now();
    }
  }
};

const rotateAfterSuccess = (s: GameStateInternal): void => {
  const newAttacker = s.defenderIdx;
  if (s.players[newAttacker]!.hasFinished) {
    s.attackerIdx = nextActiveIdx(s, newAttacker);
  } else {
    s.attackerIdx = newAttacker;
  }
  s.defenderIdx = nextActiveIdx(s, s.attackerIdx);
  s.phase = 'attacking';
  s.turnStartedAt = Date.now();
};

const rotateAfterFailure = (s: GameStateInternal): void => {
  s.attackerIdx = nextActiveIdx(s, s.defenderIdx);
  s.defenderIdx = nextActiveIdx(s, s.attackerIdx);
  s.phase = 'attacking';
  s.turnStartedAt = Date.now();
};

const checkFinished = (s: GameStateInternal): void => {
  const activePlayers = s.players.filter((p) => !p.hasFinished);
  if (activePlayers.length <= 1 && s.deck.length === 0) {
    s.phase = 'finished';
    if (activePlayers.length === 1) {
      s.loserId = activePlayers[0]!.id;
    } else {
      // Edge case: everyone finished on the same step (e.g. last refill drained
      // both hands). The "natural durak" is whoever finished LAST.
      const last = s.players
        .filter((p) => p.finishedAt !== null)
        .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
      s.loserId = last?.id ?? null;
    }
  }
};

export const markDisconnected = (state: GameStateInternal, playerId: string): GameStateInternal => {
  const s = cloneState(state);
  const p = s.players.find((pl) => pl.id === playerId);
  if (p) p.isConnected = false;
  return s;
};

export const markConnected = (state: GameStateInternal, playerId: string): GameStateInternal => {
  const s = cloneState(state);
  const p = s.players.find((pl) => pl.id === playerId);
  if (p) p.isConnected = true;
  return s;
};
