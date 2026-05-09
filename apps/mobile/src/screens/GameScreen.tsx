import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  SOCKET_EVENTS,
  beats,
  type Card as CardType,
  type GameStatePrivate,
} from '@durak/shared';
import { useGameStore } from '../store/gameStore';
import { emitAckOrToast } from '../services/socket';
import { OvalTable } from '../components/OvalTable';
import { PlayerSeat, type SeatSize } from '../components/PlayerSeat';
import { TrumpReservoir } from '../components/TrumpReservoir';
import { BattleField } from '../components/BattleField';
import { BrassButton } from '../components/BrassButton';
import { PlayerHand } from '../components/PlayerHand';
import { RingedAvatar } from '../components/RingedAvatar';
import { Toast } from '../components/Toast';
import { colors, fonts, presets } from '../theme/colors';
import { useGameRules } from '../hooks/useGameRules';
import { useOpponentSeats, useTableGeometry } from '../hooks/useTableLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Selection =
  | { kind: 'none' }
  | { kind: 'card'; cardId: string }
  | { kind: 'redirect' };

const NO_SELECTION: Selection = { kind: 'none' };

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const game = useGameStore((s) => s.game);
  if (!game) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.loadingText}>Warte auf Spielstart…</Text>
      </View>
    );
  }
  return <ActiveGame route={route} navigation={navigation} game={game} />;
};

interface ActiveGameProps extends Props {
  game: GameStatePrivate;
}

const ActiveGame: React.FC<ActiveGameProps> = ({ route, navigation, game }) => {
  const { roomId } = route.params;
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  // busy: useRef for the synchronous double-tap guard, useState for the visual flag.
  const busyRef = useRef(false);
  const [busyVisual, setBusyVisual] = useState(false);
  const setBusy = (b: boolean) => {
    busyRef.current = b;
    setBusyVisual(b);
  };

  const geometry = useTableGeometry();

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (game.phase === 'finished') {
      const loserName = game.players.find((p) => p.id === game.loserId)?.name ?? '—';
      const iAmLoser = game.loserId === playerId;
      Alert.alert(
        iAmLoser ? 'Du bist der Durak!' : 'Spielende',
        iAmLoser
          ? 'Beim nächsten Mal!'
          : game.loserId
            ? `Durak: ${loserName}`
            : 'Unentschieden',
        [{ text: 'Zurück zur Lobby', onPress: () => navigation.replace('Lobby') }],
      );
    }
  }, [game.phase, game.loserId, game.players, playerId, navigation]);

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

  // Clear stale selection if the selected card is no longer in our hand
  // (e.g. after a server push that mutated the hand mid-tap).
  useEffect(() => {
    if (selectedCardId && !game.you.hand.some((c) => c.id === selectedCardId)) {
      setSelection(NO_SELECTION);
    }
  }, [game.you.hand, selectedCardId]);

  const opponents = useMemo(
    () => game.players.filter((p) => p.id !== playerId),
    [game.players, playerId],
  );
  const seats = useOpponentSeats(opponents, game.attackerId, game.defenderId, geometry);

  // Seat layout adapts to opponent count. With 4-5 opponents we shrink the
  // box to keep them from overlapping on a 390 px screen.
  const seatSize: SeatSize = opponents.length >= 4 ? 'compact' : 'normal';
  const seatBoxWidth = opponents.length >= 5 ? 70 : opponents.length >= 4 ? 84 : 100;

  const isFullField = game.table.length >= 5;
  const battleCardW = isFullField ? 50 : 64;

  const playDefense = async (attackCardId: string, defenseCard: CardType) => {
    setBusy(true);
    const ok = await emitAckOrToast(SOCKET_EVENTS.DEFEND_CARD, {
      roomId,
      attackCardId,
      defenseCard,
    });
    setBusy(false);
    if (ok !== null) setSelection(NO_SELECTION);
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
      if (ok !== null) setSelection(NO_SELECTION);
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
    if (ok !== null) setSelection(NO_SELECTION);
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
  };

  const handleTake = async () => {
    if (busyRef.current) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.TAKE_CARDS, { roomId });
    setBusy(false);
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

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.woodLight, colors.woodMid, colors.woodDark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.tableLayer, { width: geometry.tableW, height: geometry.tableH }]}>
        <OvalTable cx={geometry.cx} cy={geometry.cy} rx={geometry.rx} ry={geometry.ry} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View
          style={[styles.tableLayer, { width: geometry.tableW, height: geometry.tableH }]}
          pointerEvents="box-none"
        >
          {seats.map((seat) => (
            <View
              key={seat.player.id}
              style={[
                styles.seatPos,
                { left: seat.x - seatBoxWidth / 2, top: seat.y - 30, width: seatBoxWidth },
              ]}
            >
              <PlayerSeat player={seat.player} role={seat.role} size={seatSize} />
            </View>
          ))}

          <View style={[styles.trumpPos, { top: geometry.cy - 60 }]}>
            <TrumpReservoir
              trumpCard={game.trumpCard}
              trumpSuit={game.trumpSuit}
              deckCount={game.deckCount}
              cardW={42}
            />
          </View>

          <View style={[styles.discardPos, { top: geometry.cy - 30 }]}>
            <Text style={styles.discardLabel}>Abwurf</Text>
            <View style={[presets.goldPill, styles.discardBadge]}>
              <Text style={styles.discardCount}>{game.discardCount}</Text>
            </View>
          </View>

          <View
            style={[styles.battlePos, { left: geometry.cx - 110, top: geometry.cy - 80 }]}
            pointerEvents="box-none"
          >
            <BattleField
              pairs={game.table}
              cardW={battleCardW}
              fullField={isFullField}
              onAttackPress={isDefender ? handleAttackTap : undefined}
              highlightedAttackIds={candidateAttackIds}
            />
          </View>
        </View>

        <View style={[styles.banner, { top: geometry.tableH - 8 }]}>
          <Text style={styles.bannerLine}>{banner.line}</Text>
          <Text style={styles.bannerSub}>{banner.sub}</Text>
        </View>

        <View style={styles.actionsRow}>
          {canEndTurn ? (
            <BrassButton
              variant="primary"
              label="Fertig"
              onPress={handleEndTurn}
              disabled={busyVisual}
            />
          ) : null}
          {canTake ? (
            <BrassButton
              variant="danger"
              label="Nehmen"
              badge={undefendedCount > 0 ? `+${undefendedCount}` : undefined}
              onPress={handleTake}
              disabled={busyVisual}
            />
          ) : null}
          {canRedirect ? (
            <BrassButton
              variant={redirectMode ? 'secondary-active' : 'secondary'}
              label={redirectMode ? 'Abbrechen' : 'Weiterschieben'}
              onPress={() => setSelection(redirectMode ? NO_SELECTION : { kind: 'redirect' })}
              disabled={busyVisual}
            />
          ) : null}
        </View>

        <View style={styles.handRow} pointerEvents="box-none">
          <PlayerHand
            hand={game.you.hand}
            trumpSuit={game.trumpSuit}
            selectedCardId={selectedCardId}
            onSelect={handleCardSelect}
            playableIds={playableCardIds}
          />
        </View>

        <View style={[presets.goldPill, styles.youPlate]}>
          <RingedAvatar initials={(playerName?.[0] ?? 'D').toUpperCase()} active />
          <View>
            <Text style={styles.youName}>Du</Text>
            <Text style={styles.youRole}>
              {isDefender ? 'VERTEIDIGUNG' : isAttacker ? 'ANGRIFF' : 'WARTEN'}
            </Text>
          </View>
        </View>

        <Toast message={lastError} onDismiss={() => setError(null)} />
      </SafeAreaView>
    </View>
  );
};

const buildBanner = (args: {
  isAttacker: boolean;
  isDefender: boolean;
  canRedirect: boolean;
  tableLen: number;
  defenderName: string | undefined;
  awaitingFrom: string[];
  needsMyConfirmation: boolean;
}): { line: string; sub: string } => {
  const {
    isAttacker,
    isDefender,
    canRedirect,
    tableLen,
    defenderName,
    awaitingFrom,
    needsMyConfirmation,
  } = args;

  if (needsMyConfirmation) {
    return {
      line: 'Nachlegen oder Bito',
      sub: 'Karte legen oder „Fertig" tippen',
    };
  }
  if (awaitingFrom.length > 0) {
    return {
      line: `Warte auf ${awaitingFrom.join(', ')}`,
      sub: 'Bestätigung steht aus',
    };
  }
  if (isAttacker) {
    return {
      line: tableLen === 0 ? 'Du greifst an' : 'Dein Zug',
      sub: 'Karte spielen',
    };
  }
  if (isDefender) {
    return canRedirect
      ? { line: 'Verteidigen oder Weiterschieben', sub: 'Karte tippen zum Schlagen' }
      : { line: 'Du verteidigst', sub: 'Karte tippen' };
  }
  return { line: `${defenderName ?? 'Gegner'} verteidigt`, sub: 'Bitte warten' };
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.creamDim, fontFamily: fonts.serif, fontSize: 16 },
  tableLayer: { position: 'absolute', top: 0, left: 0 },
  seatPos: {
    position: 'absolute',
    alignItems: 'center',
  },
  trumpPos: { position: 'absolute', left: 14 },
  discardPos: { position: 'absolute', right: 14, alignItems: 'center', gap: 4 },
  discardLabel: {
    fontSize: 8,
    color: colors.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  discardBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  discardCount: { fontSize: 12, fontWeight: '700', color: colors.goldLight, fontFamily: fonts.serif },
  battlePos: {
    position: 'absolute',
    width: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bannerLine: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    color: colors.cream,
    letterSpacing: -0.2,
    textShadowColor: colors.textShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerSub: {
    fontSize: 9,
    color: colors.creamDim,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 220,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  handRow: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  youPlate: {
    position: 'absolute',
    left: 12,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
  },
  youName: {
    color: colors.creamSoft,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: fonts.serif,
    lineHeight: 14,
  },
  youRole: {
    color: colors.defendingGreen,
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 2,
  },
});
