import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SOCKET_EVENTS,
  beats,
  type Card as CardType,
  type GameStatePrivate,
} from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { useGameRules } from '@/hooks/useGameRules';
import { vibrate } from '@/lib/vibrate';
import { OpponentRow, type SeatRole } from './OpponentRow';
import { PlayArea } from './PlayArea';
import { TrumpWell } from './TrumpWell';
import { DiscardWell } from './DiscardWell';
import { BattleField } from './BattleField';
import { PlayerHand } from './PlayerHand';
import { ActionBar } from './ActionBar';
import { GameOverDialog } from './GameOverDialog';

type Selection =
  | { kind: 'none' }
  | { kind: 'card'; cardId: string }
  | { kind: 'redirect' };

const NO_SELECTION: Selection = { kind: 'none' };

// Haptic patterns used after a successful committed action.
const VIBRATE_TAP_MS = 20;
const VIBRATE_TAKE_PATTERN_MS = [15, 30, 15];

interface Props {
  game: GameStatePrivate;
  roomId: string;
}

export const GameTable = ({ game, roomId }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const setError = useGameStore((s) => s.setError);

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
  const selectedCard = selectedCardId
    ? game.you.hand.find((c) => c.id === selectedCardId)
    : null;

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
  } = useGameRules({ game, playerId, selectedCardId, redirectMode });

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

  const seats = useMemo(
    () =>
      opponents.map((p) => {
        const role: SeatRole =
          p.id === game.attackerId
            ? 'attacker'
            : p.id === game.defenderId
              ? 'defender'
              : 'wait';
        return { player: p, role };
      }),
    [opponents, game.attackerId, game.defenderId],
  );

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
      vibrate(VIBRATE_TAP_MS);
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
        vibrate(VIBRATE_TAP_MS);
      }
      return;
    }

    if (isDefender) {
      if (!playableCardIds.has(card.id)) {
        setError('Karte schlägt nicht');
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
      setError('Karte kann gerade nicht gespielt werden');
      return;
    }
    setBusy(true);
    const ok = await emitAckOrToast(SOCKET_EVENTS.PLAY_CARD, { roomId, card });
    setBusy(false);
    if (ok !== null) {
      setSelection(NO_SELECTION);
      vibrate(VIBRATE_TAP_MS);
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
    vibrate(VIBRATE_TAP_MS);
  };

  const handleTake = async () => {
    if (busyRef.current) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.TAKE_CARDS, { roomId });
    setBusy(false);
    vibrate(VIBRATE_TAKE_PATTERN_MS);
  };

  const handleToggleRedirect = () => {
    setSelection(redirectMode ? NO_SELECTION : { kind: 'redirect' });
  };

  const headline = buildHeadline({
    isAttacker,
    isDefender,
    canRedirect,
    needsMyConfirmation,
    awaitingFrom,
    tableLength: game.table.length,
    defenderName: defender?.name,
    redirectMode,
  });

  const roleLabel = isAttacker
    ? 'Angriff'
    : isDefender
      ? 'Verteidigung'
      : needsMyConfirmation
        ? 'Bito'
        : 'Warten';

  const primary = needsMyConfirmation
    ? { label: 'Bito', onClick: handleEndTurn }
    : isDefender && game.table.length > 0 && undefendedCount > 0
      ? { label: 'Nehmen', onClick: handleTake, badge: `+${undefendedCount}` }
      : null;

  const ghost = canRedirect
    ? { label: redirectMode ? 'Abbrechen' : 'Schieben', onClick: handleToggleRedirect, toggled: redirectMode }
    : null;

  const isFinished = game.phase === 'finished';
  const loser = isFinished ? game.players.find((p) => p.id === game.loserId) : undefined;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden text-text-primary touch-game safe-pt safe-pb safe-pl safe-pr">
      <OpponentRow seats={seats} />

      <PlayArea awaitingDrop={!!selectedCard} empty={game.table.length === 0}>
        <BattleField
          pairs={game.table}
          onAttackPress={isDefender ? handleAttackTap : undefined}
          highlightedAttackIds={candidateAttackIds}
        />
      </PlayArea>

      <div className="mt-3 flex items-center justify-between border-t border-line-subtle px-4 py-3">
        <TrumpWell
          trumpCard={game.trumpCard}
          trumpSuit={game.trumpSuit}
          deckCount={game.deckCount}
        />
        <DiscardWell count={game.discardCount} />
      </div>

      <div className="mt-auto">
        <ActionBar
          playerName={playerName}
          headline={headline.line}
          subline={headline.sub}
          roleLabel={roleLabel}
          active={isAttacker || isDefender || needsMyConfirmation}
          primary={primary}
          ghost={ghost}
          busy={busy}
        />
        <PlayerHand
          hand={game.you.hand}
          trumpSuit={game.trumpSuit}
          selectedCardId={selectedCardId}
          onSelect={handleCardSelect}
          playableIds={playableCardIds}
        />
      </div>

      {isFinished ? (
        <GameOverDialog iAmLoser={game.loserId === playerId} loserName={loser?.name ?? null} />
      ) : null}
    </div>
  );
};

interface HeadlineArgs {
  isAttacker: boolean;
  isDefender: boolean;
  canRedirect: boolean;
  needsMyConfirmation: boolean;
  awaitingFrom: string[];
  tableLength: number;
  defenderName: string | undefined;
  redirectMode: boolean;
}

const buildHeadline = (a: HeadlineArgs): { line: string; sub: string } => {
  if (a.needsMyConfirmation) {
    return { line: 'Nachlegen oder Bito', sub: 'Karte legen — oder „Bito" tippen.' };
  }
  if (a.awaitingFrom.length > 0) {
    return {
      line: `Warte auf ${a.awaitingFrom.join(', ')}`,
      sub: 'Bestätigung steht aus.',
    };
  }
  if (a.isAttacker) {
    return a.tableLength === 0
      ? { line: 'Du bist am Zug', sub: 'Wähle eine Karte aus der Hand.' }
      : { line: 'Dein Zug', sub: 'Lege nach oder warte ab.' };
  }
  if (a.isDefender && a.redirectMode) {
    return { line: 'Karte zum Weiterschieben', sub: 'Nur gleicher Wert wie oben.' };
  }
  if (a.isDefender && a.canRedirect) {
    return { line: 'Schlagen oder schieben', sub: 'Karte zum Schlagen wählen.' };
  }
  if (a.isDefender) {
    return { line: 'Karte zum Schlagen wählen', sub: 'Höher in der Farbe — oder Trumpf.' };
  }
  return {
    line: `${a.defenderName ?? 'Gegner'} verteidigt`,
    sub: 'Warte, bis der Zug abgeschlossen ist.',
  };
};
