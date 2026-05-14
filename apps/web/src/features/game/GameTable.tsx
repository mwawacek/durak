import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MAX_TABLE_PAIRS,
  SOCKET_EVENTS,
  beats,
  type Card as CardType,
  type GameStatePrivate,
} from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { useGameRules } from '@/hooks/useGameRules';
import {
  seatLayoutFor,
  useOpponentSeats,
  useTableGeometry,
} from '@/hooks/useTableLayout';
import { vibrate } from '@/lib/vibrate';
import { OvalTable } from './OvalTable';
import { OpponentSeat } from './OpponentSeat';
import { TrumpReservoir } from './TrumpReservoir';
import { DiscardIndicator } from './DiscardIndicator';
import { BattleField } from './BattleField';
import { PlayerHand } from './PlayerHand';
import { ActionBar } from './ActionBar';
import { GameOverDialog } from './GameOverDialog';

type Selection =
  | { kind: 'none' }
  | { kind: 'card'; cardId: string }
  | { kind: 'redirect' };

const NO_SELECTION: Selection = { kind: 'none' };

// Bottom strip layout — single source of truth so Hand height + Action row
// height + buffers add up to the geometry hook's `reservedBottom`.
const HAND_BLOCK_H = 168;
const ACTION_BLOCK_H = 64;
const BANNER_BLOCK_H = 48;

interface Props {
  game: GameStatePrivate;
  roomId: string;
}

interface BannerArgs {
  isAttacker: boolean;
  isDefender: boolean;
  canRedirect: boolean;
  tableLen: number;
  defenderName: string | undefined;
  awaitingFrom: string[];
  needsMyConfirmation: boolean;
}

const buildBanner = (args: BannerArgs): { line: string; sub: string } => {
  if (args.needsMyConfirmation) {
    return { line: 'Nachlegen oder Bito', sub: 'Karte legen oder „Fertig" tippen' };
  }
  if (args.awaitingFrom.length > 0) {
    return { line: `Warte auf ${args.awaitingFrom.join(', ')}`, sub: 'Bestätigung steht aus' };
  }
  if (args.isAttacker) {
    return { line: args.tableLen === 0 ? 'Du greifst an' : 'Dein Zug', sub: 'Karte spielen' };
  }
  if (args.isDefender) {
    return args.canRedirect
      ? { line: 'Verteidigen oder Weiterschieben', sub: 'Karte tippen zum Schlagen' }
      : { line: 'Du verteidigst', sub: 'Karte tippen' };
  }
  return { line: `${args.defenderName ?? 'Gegner'} verteidigt`, sub: 'Bitte warten' };
};

export const GameTable = ({ game, roomId }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const setError = useGameStore((s) => s.setError);

  // No safe-area inset hook on web — read CSS env() via JS as a fallback,
  // and add a sensible baseline. The Tailwind .safe-pt utility covers the
  // visual safe area; here we just need a numeric padding to subtract
  // from the table height.
  const topInset = 24;
  const reservedBottom = HAND_BLOCK_H + ACTION_BLOCK_H + BANNER_BLOCK_H + 24;
  const geometry = useTableGeometry({ topInset, reservedBottom });

  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const busyRef = useRef(false);
  const [busy, setBusyVisual] = useState(false);
  const setBusy = (b: boolean) => {
    busyRef.current = b;
    setBusyVisual(b);
  };

  useEffect(() => {
    setError(null);
  }, [setError]);

  const redirectMode = selection.kind === 'redirect';
  const selectedCardId = selection.kind === 'card' ? selection.cardId : null;

  const rules = useGameRules({ game, playerId, selectedCardId, redirectMode });
  const {
    isAttacker,
    isDefender,
    defender,
    canRedirect,
    playableCardIds,
    candidateAttackIds,
    undefendedCount,
    needsMyConfirmation,
    awaitingFrom,
  } = rules;

  // Reset stale selection state when hand changes.
  useEffect(() => {
    if (selectedCardId && !game.you.hand.some((c) => c.id === selectedCardId)) {
      setSelection(NO_SELECTION);
    } else if (redirectMode && !canRedirect) {
      setSelection(NO_SELECTION);
    }
  }, [game.you.hand, selectedCardId, redirectMode, canRedirect]);

  const opponents = useMemo(
    () => game.players.filter((p) => p.id !== playerId),
    [game.players, playerId],
  );
  const seats = useOpponentSeats(opponents, game.attackerId, game.defenderId, geometry);
  const seatLayout = seatLayoutFor(opponents.length);
  const battleSize: 'sm' | 'md' = game.table.length >= MAX_TABLE_PAIRS - 1 ? 'sm' : 'md';

  const playDefense = async (attackCardId: string, defenseCard: CardType) => {
    setBusy(true);
    const ok = await emitAckOrToast(SOCKET_EVENTS.DEFEND_CARD, {
      roomId,
      attackCardId,
      defenseCard,
    });
    setBusy(false);
    if (ok !== null) {
      setSelection(NO_SELECTION);
      vibrate(20);
    }
  };

  const handleCardSelect = async (card: CardType) => {
    if (busyRef.current) return;
    setError(null);

    if (isDefender && redirectMode) {
      if (!playableCardIds.has(card.id)) {
        setError('Nur Karten gleichen Wertes können weitergeschoben werden');
        return;
      }
      setBusy(true);
      const ok = await emitAckOrToast(SOCKET_EVENTS.REDIRECT_ATTACK, { roomId, card });
      setBusy(false);
      if (ok !== null) {
        setSelection(NO_SELECTION);
        vibrate(20);
      }
      return;
    }

    if (isDefender) {
      if (!playableCardIds.has(card.id)) {
        setError('Diese Karte schlägt keinen Angriff');
        return;
      }
      const candidates = game.table
        .filter((p) => !p.defense && beats(p.attack, card, game.trumpSuit))
        .map((p) => p.attack.id);
      if (candidates.length === 1) {
        await playDefense(candidates[0]!, card);
        return;
      }
      setSelection((prev) =>
        prev.kind === 'card' && prev.cardId === card.id
          ? NO_SELECTION
          : { kind: 'card', cardId: card.id },
      );
      return;
    }

    if (!playableCardIds.has(card.id)) {
      setError('Diese Karte kann gerade nicht gespielt werden');
      return;
    }
    setBusy(true);
    const ok = await emitAckOrToast(SOCKET_EVENTS.PLAY_CARD, { roomId, card });
    setBusy(false);
    if (ok !== null) {
      setSelection(NO_SELECTION);
      vibrate(20);
    }
  };

  const handleAttackTap = async (attackCardId: string) => {
    if (!isDefender || busyRef.current || !selectedCardId) return;
    if (!candidateAttackIds.has(attackCardId)) return;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return;
    await playDefense(attackCardId, card);
  };

  const handleEndTurn = async () => {
    if (busyRef.current) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.END_TURN, { roomId });
    setBusy(false);
    vibrate(20);
  };

  const handleTake = async () => {
    if (busyRef.current) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.TAKE_CARDS, { roomId });
    setBusy(false);
    vibrate([15, 30, 15]);
  };

  const handleToggleRedirect = () => {
    setSelection(redirectMode ? NO_SELECTION : { kind: 'redirect' });
  };

  const canEndTurn = needsMyConfirmation;
  const canTake = isDefender && game.table.length > 0 && undefendedCount > 0;
  const banner = buildBanner({
    isAttacker,
    isDefender,
    canRedirect,
    tableLen: game.table.length,
    defenderName: defender?.name,
    awaitingFrom,
    needsMyConfirmation,
  });

  // Trump and discard sit inside the bottom of the felt area so they don't
  // compete with rim seats, even at 5 opponents.
  const insideY = geometry.cy + geometry.ry - 80;

  const isFinished = game.phase === 'finished';
  const loser = isFinished ? game.players.find((p) => p.id === game.loserId) : undefined;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-cream touch-game safe-pl safe-pr">
      {/* Table layer */}
      <div
        className="pointer-events-none absolute left-0"
        style={{
          top: geometry.tableTop,
          width: geometry.tableW,
          height: geometry.tableH,
        }}
      >
        <OvalTable
          width={geometry.tableW}
          height={geometry.tableH}
          cx={geometry.cx}
          cy={geometry.cy}
          rx={geometry.rx}
          ry={geometry.ry}
        />

        {seats.map((seat) => (
          <div
            key={seat.player.id}
            className="pointer-events-auto absolute flex justify-center"
            style={{
              left: seat.x - seatLayout.boxWidth / 2,
              top: seat.y - 30,
              width: seatLayout.boxWidth,
            }}
          >
            <OpponentSeat player={seat.player} role={seat.role} size={seatLayout.size} />
          </div>
        ))}

        <div className="pointer-events-auto absolute" style={{ left: 14, top: insideY }}>
          <TrumpReservoir
            trumpCard={game.trumpCard}
            trumpSuit={game.trumpSuit}
            deckCount={game.deckCount}
            cardW={42}
          />
        </div>

        <div className="pointer-events-auto absolute" style={{ right: 14, top: insideY + 18 }}>
          <DiscardIndicator count={game.discardCount} />
        </div>

        <div
          className="pointer-events-auto absolute flex w-[220px] items-center justify-center"
          style={{ left: geometry.cx - 110, top: geometry.cy - 80 }}
        >
          <BattleField
            pairs={game.table}
            size={battleSize}
            onAttackPress={isDefender ? handleAttackTap : undefined}
            highlightedAttackIds={candidateAttackIds}
          />
        </div>
      </div>

      {/* Bottom strip — banner → action row → hand */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 safe-pb"
        style={{ height: BANNER_BLOCK_H + ACTION_BLOCK_H + HAND_BLOCK_H }}
      >
        <div className="pointer-events-auto">
          <ActionBar
            playerName={playerName}
            bannerHeight={BANNER_BLOCK_H}
            actionRowHeight={ACTION_BLOCK_H}
            banner={banner}
            isAttacker={isAttacker}
            isDefender={isDefender}
            needsConfirm={needsMyConfirmation}
            canEndTurn={canEndTurn}
            canTake={canTake}
            canRedirect={canRedirect}
            redirectMode={redirectMode}
            undefendedCount={undefendedCount}
            busy={busy}
            onEndTurn={handleEndTurn}
            onTake={handleTake}
            onToggleRedirect={handleToggleRedirect}
          />
        </div>

        <div className="pointer-events-auto" style={{ height: HAND_BLOCK_H }}>
          <PlayerHand
            hand={game.you.hand}
            trumpSuit={game.trumpSuit}
            selectedCardId={selectedCardId}
            onSelect={handleCardSelect}
            playableIds={playableCardIds}
          />
        </div>
      </div>

      {isFinished ? (
        <GameOverDialog iAmLoser={game.loserId === playerId} loserName={loser?.name ?? null} />
      ) : null}
    </div>
  );
};
