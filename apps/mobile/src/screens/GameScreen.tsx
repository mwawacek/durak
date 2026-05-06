import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  SOCKET_EVENTS,
  beats,
  canRedirectWith,
  type Card as CardType,
  type PlayerPublic,
} from '@durak/shared';
import { useGameStore } from '../store/gameStore';
import { emitAckOrToast } from '../services/socket';
import { OvalTable } from '../components/OvalTable';
import { PlayerSeat } from '../components/PlayerSeat';
import { TrumpReservoir } from '../components/TrumpReservoir';
import { BattleField } from '../components/BattleField';
import { BrassButton } from '../components/BrassButton';
import { PlayerHand } from '../components/PlayerHand';
import { RingedAvatar } from '../components/RingedAvatar';
import { Toast } from '../components/Toast';
import { colors, fonts } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Selection =
  | { kind: 'none' }
  | { kind: 'card'; cardId: string }
  | { kind: 'redirect' };

const NO_SELECTION: Selection = { kind: 'none' };

/** Angles (in degrees, 0=right, -90=top) for opponents distributed across upper rim. */
const ANGLES_BY_COUNT: Record<number, number[]> = {
  1: [-90],
  2: [-110, -70],
  3: [-130, -90, -50],
  4: [-135, -90, -45, 0],
  5: [-150, -110, -70, -30, 10],
};

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  const [selection, setSelection] = useState<Selection>(NO_SELECTION);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (game?.phase === 'finished') {
      const loserName = game.players.find((p) => p.id === game.loserId)?.name ?? '—';
      const iAmLoser = game.loserId === playerId;
      Alert.alert(
        iAmLoser ? 'Du bist der Durak!' : 'Spielende',
        iAmLoser ? 'Beim nächsten Mal!' : `Durak: ${loserName}`,
        [{ text: 'Zurück zur Lobby', onPress: () => navigation.replace('Lobby') }],
      );
    }
  }, [game?.phase, game?.loserId, game?.players, playerId, navigation]);

  const isAttacker = game?.attackerId === playerId;
  const isDefender = game?.defenderId === playerId;
  const defender = game?.players.find((p) => p.id === game.defenderId);
  const redirectMode = selection.kind === 'redirect';
  const selectedCardId = selection.kind === 'card' ? selection.cardId : null;

  const canRedirect = useMemo<boolean>(() => {
    if (!game || !isDefender) return false;
    return canRedirectWith(game.you.hand, game.table);
  }, [game, isDefender]);

  const playableCardIds = useMemo<Set<string>>(() => {
    if (!game) return new Set();
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
      if (game.table.length === 0 && isAttacker) {
        for (const c of game.you.hand) ids.add(c.id);
        return ids;
      }
      const tableRanks = new Set<string>();
      for (const pair of game.table) {
        tableRanks.add(pair.attack.rank);
        if (pair.defense) tableRanks.add(pair.defense.rank);
      }
      const undefendedCount = game.table.filter((p) => !p.defense).length;
      const defenderCapacity = (defender?.handCount ?? 0) > undefendedCount;
      if (!defenderCapacity) return ids;
      for (const c of game.you.hand) if (tableRanks.has(c.rank)) ids.add(c.id);
    }

    return ids;
  }, [game, isAttacker, isDefender, defender, redirectMode]);

  const candidateAttackIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    if (!game || !isDefender || !selectedCardId || redirectMode) return ids;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return ids;
    for (const pair of game.table) {
      if (pair.defense) continue;
      if (beats(pair.attack, card, game.trumpSuit)) ids.add(pair.attack.id);
    }
    return ids;
  }, [game, isDefender, selectedCardId, redirectMode]);

  if (!game) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Warte auf Spielstart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playDefense = async (attackCardId: string, defenseCard: CardType) => {
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.DEFEND_CARD, { roomId, attackCardId, defenseCard });
    setBusy(false);
    setSelection(NO_SELECTION);
  };

  const handleCardSelect = async (card: CardType) => {
    if (busy) return;
    setError(null);

    if (isDefender && redirectMode) {
      if (!playableCardIds.has(card.id)) {
        setError('Nur Karten gleichen Wertes können weitergeschoben werden');
        return;
      }
      setBusy(true);
      await emitAckOrToast(SOCKET_EVENTS.REDIRECT_ATTACK, { roomId, card });
      setBusy(false);
      setSelection(NO_SELECTION);
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
        prev.kind === 'card' && prev.cardId === card.id ? NO_SELECTION : { kind: 'card', cardId: card.id },
      );
      return;
    }

    if (!playableCardIds.has(card.id)) {
      setError('Diese Karte kann gerade nicht gespielt werden');
      return;
    }
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.PLAY_CARD, { roomId, card });
    setBusy(false);
    setSelection(NO_SELECTION);
  };

  const handleAttackTap = async (attackCardId: string) => {
    if (!isDefender || busy || !selectedCardId) return;
    if (!candidateAttackIds.has(attackCardId)) return;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return;
    await playDefense(attackCardId, card);
  };

  const handleEndTurn = async () => {
    if (busy) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.END_TURN, { roomId });
    setBusy(false);
  };

  const handleTake = async () => {
    if (busy) return;
    setBusy(true);
    await emitAckOrToast(SOCKET_EVENTS.TAKE_CARDS, { roomId });
    setBusy(false);
  };

  const allDefended = game.table.length > 0 && game.table.every((p) => p.defense !== null);
  const canEndTurn = isAttacker && allDefended;
  const canTake = isDefender && game.table.length > 0 && !allDefended;
  const undefendedCount = game.table.filter((p) => !p.defense).length;

  const opponents: PlayerPublic[] = game.players.filter((p) => p.id !== playerId);
  const angleList =
    ANGLES_BY_COUNT[opponents.length] ?? ANGLES_BY_COUNT[5]!.slice(0, opponents.length);

  // Layout geometry — must mirror OvalTable computation.
  const screen = Dimensions.get('window');
  const tableW = screen.width;
  const tableH = screen.height * 0.62; // upper portion of screen reserved for the table
  const cx = tableW * 0.5;
  const cy = tableH * 0.42;
  const rx = tableW * 0.46;
  const ry = tableH * 0.32;

  const isFullField = game.table.length >= 5;
  const battleCardW = isFullField ? 50 : 64;

  const yourBannerLine = isAttacker
    ? game.table.length === 0
      ? 'Your attack'
      : 'Your move'
    : isDefender
      ? canRedirect
        ? 'Defend or pass on'
        : 'Your defense'
      : `${defender?.name ?? 'Opponent'} defends`;

  const yourBannerSub = isAttacker
    ? 'Ваш ход · play a card'
    : isDefender
      ? canRedirect
        ? 'Бить или Перевести'
        : 'Ваша защита · tap a card'
      : 'Ход противника';

  return (
    <View style={styles.root}>
      {/* mahogany wood backdrop */}
      <LinearGradient
        colors={[colors.woodLight, colors.woodMid, colors.woodDark]}
        style={StyleSheet.absoluteFill}
      />

      {/* Oval table layered behind everything */}
      <View style={[styles.tableLayer, { width: tableW, height: tableH }]}>
        <OvalTable width={tableW} height={tableH} cx={cx} cy={cy} rx={rx} ry={ry} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Opponents around the upper rim */}
        <View style={[styles.tableLayer, { width: tableW, height: tableH }]} pointerEvents="box-none">
          {opponents.map((opp, i) => {
            const angleDeg = angleList[i] ?? -90;
            const rad = (angleDeg * Math.PI) / 180;
            const x = cx + rx * Math.cos(rad);
            const y = cy + ry * Math.sin(rad);
            const role: 'attacker' | 'defender' | 'wait' =
              opp.id === game.attackerId
                ? 'attacker'
                : opp.id === game.defenderId
                  ? 'defender'
                  : 'wait';
            return (
              <View
                key={opp.id}
                style={{
                  position: 'absolute',
                  left: x - 50,
                  top: y - 30,
                  width: 100,
                  alignItems: 'center',
                }}
              >
                <PlayerSeat player={opp} role={role} />
              </View>
            );
          })}

          {/* Trump reservoir (left) */}
          <View
            style={{
              position: 'absolute',
              left: 14,
              top: cy - 60,
            }}
          >
            <TrumpReservoir
              trumpCard={game.trumpCard}
              trumpSuit={game.trumpSuit}
              deckCount={game.deckCount}
              cardW={42}
            />
          </View>

          {/* Discard count (right) */}
          <View
            style={{
              position: 'absolute',
              right: 14,
              top: cy - 30,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={styles.discardLabel}>Beaten · Бито</Text>
            <View style={styles.discardBadge}>
              <Text style={styles.discardCount}>{game.discardCount}</Text>
            </View>
          </View>

          {/* Battle field — center of the felt */}
          <View
            style={{
              position: 'absolute',
              left: cx - 110,
              top: cy - 80,
              width: 220,
              alignItems: 'center',
              justifyContent: 'center',
            }}
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

        {/* Status banner just below the table */}
        <View style={[styles.banner, { top: tableH - 8 }]}>
          <Text style={styles.bannerLine}>{yourBannerLine}</Text>
          <Text style={styles.bannerSub}>{yourBannerSub}</Text>
        </View>

        {/* Action buttons — placed above the hand */}
        <View style={styles.actionsRow}>
          {canEndTurn ? (
            <BrassButton
              variant="primary"
              label="Done"
              sub="Бито"
              onPress={handleEndTurn}
              disabled={busy}
            />
          ) : null}
          {canTake ? (
            <BrassButton
              variant="danger"
              label="Take"
              sub="Взять"
              badge={undefendedCount > 0 ? `+${undefendedCount}` : undefined}
              onPress={handleTake}
              disabled={busy}
            />
          ) : null}
          {canRedirect ? (
            <BrassButton
              variant={redirectMode ? 'secondary-active' : 'secondary'}
              label={redirectMode ? 'Cancel' : 'Pass on'}
              sub={redirectMode ? 'Отмена' : 'Перевести'}
              onPress={() => setSelection(redirectMode ? NO_SELECTION : { kind: 'redirect' })}
              disabled={busy}
            />
          ) : null}
        </View>

        {/* Hand at the bottom */}
        <View style={styles.handRow} pointerEvents="box-none">
          <PlayerHand
            hand={game.you.hand}
            trumpSuit={game.trumpSuit}
            selectedCardId={selectedCardId}
            onSelect={handleCardSelect}
            playableIds={playableCardIds}
          />
        </View>

        {/* You — nameplate bottom-left */}
        <View style={styles.youPlate}>
          <RingedAvatar initials={(playerName?.[0] ?? 'V').toUpperCase()} active />
          <View>
            <Text style={styles.youName}>You</Text>
            <Text style={styles.youRole}>
              {isDefender ? 'DEFENDING' : isAttacker ? 'ATTACKING' : 'WAITING'}
            </Text>
          </View>
        </View>

        <Toast message={lastError} onDismiss={() => setError(null)} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.creamDim, fontFamily: fonts.serif, fontSize: 16 },
  tableLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bannerLine: {
    fontFamily: fonts.serif,
    fontSize: 19,
    fontWeight: '700',
    color: colors.cream,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
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
  handRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
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
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: colors.goldMuted,
    backgroundColor: 'rgba(20,8,3,0.55)',
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
  discardLabel: {
    fontSize: 8,
    color: colors.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  discardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(20,8,3,0.7)',
    borderWidth: 0.5,
    borderColor: colors.goldMuted,
  },
  discardCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldLight,
    fontFamily: fonts.serif,
  },
});
