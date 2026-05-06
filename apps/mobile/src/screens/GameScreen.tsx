import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  SOCKET_EVENTS,
  RANK_ORDER,
  type Card as CardType,
  type AckResult,
} from '@durak/shared';
import { useGameStore } from '../store/gameStore';
import { emitAck } from '../services/socket';
import { Table } from '../components/Table';
import { PlayerHand } from '../components/PlayerHand';
import { PlayerBar } from '../components/PlayerBar';
import { RoleBanner, type RoleBannerKind } from '../components/RoleBanner';
import { ActionBar, type ActionDef } from '../components/ActionBar';
import { Toast } from '../components/Toast';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const beats = (attack: CardType, defense: CardType, trumpSuit: string | null): boolean => {
  if (defense.suit === attack.suit) return RANK_ORDER[defense.rank] > RANK_ORDER[attack.rank];
  if (trumpSuit && defense.suit === trumpSuit && attack.suit !== trumpSuit) return true;
  return false;
};

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { roomId } = route.params;
  const game = useGameStore((s) => s.game);
  const playerId = useGameStore((s) => s.playerId);
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [redirectMode, setRedirectMode] = useState(false);
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

  const canRedirect = useMemo<boolean>(() => {
    if (!game || !isDefender || game.you.hand.length < 2) return false;
    if (game.table.length === 0) return false;
    if (game.table.some((p) => p.defense !== null)) return false;
    const firstRank = game.table[0]!.attack.rank;
    if (!game.table.every((p) => p.attack.rank === firstRank)) return false;
    return game.you.hand.some((c) => c.rank === firstRank);
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
    const ack = (await emitAck(SOCKET_EVENTS.DEFEND_CARD, {
      roomId,
      attackCardId,
      defenseCard,
    })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
    setSelectedCardId(null);
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
      const ack = (await emitAck(SOCKET_EVENTS.REDIRECT_ATTACK, { roomId, card })) as AckResult<void>;
      setBusy(false);
      if (!ack.ok) setError(ack.error.message);
      setRedirectMode(false);
      setSelectedCardId(null);
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
      setSelectedCardId(card.id === selectedCardId ? null : card.id);
      return;
    }

    if (!playableCardIds.has(card.id)) {
      setError('Diese Karte kann gerade nicht gespielt werden');
      return;
    }
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.PLAY_CARD, { roomId, card })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
    setSelectedCardId(null);
  };

  const handleAttackTap = async (attackCardId: string) => {
    if (!isDefender || busy) return;
    if (!selectedCardId) return;
    if (!candidateAttackIds.has(attackCardId)) return;
    const card = game.you.hand.find((c) => c.id === selectedCardId);
    if (!card) return;
    await playDefense(attackCardId, card);
  };

  const handleEndTurn = async () => {
    if (busy) return;
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.END_TURN, { roomId })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
  };

  const handleTake = async () => {
    if (busy) return;
    setBusy(true);
    const ack = (await emitAck(SOCKET_EVENTS.TAKE_CARDS, { roomId })) as AckResult<void>;
    setBusy(false);
    if (!ack.ok) setError(ack.error.message);
  };

  const allDefended = game.table.length > 0 && game.table.every((p) => p.defense !== null);
  const canEndTurn = isAttacker && allDefended;
  const canTake = isDefender && game.table.length > 0 && !allDefended;

  const role: RoleBannerKind = isAttacker ? 'attacker' : isDefender ? 'defender' : 'waiting';
  const roleMessage =
    role === 'attacker'
      ? game.table.length === 0
        ? 'Du greifst an  ·  Karte spielen'
        : 'Du greifst an  ·  Nachlegen oder Bito'
      : role === 'defender'
        ? canRedirect
          ? 'Du verteidigst  ·  Schlagen oder Weiterschieben'
          : 'Du verteidigst  ·  Karte tippen'
        : `${defender?.name ?? 'Gegner'} verteidigt`;

  const actions: ActionDef[] = [];
  if (canEndTurn) {
    actions.push({ key: 'end', label: 'Bito', variant: 'success', onPress: handleEndTurn });
  }
  if (canTake) {
    actions.push({ key: 'take', label: 'Karten nehmen', variant: 'danger', onPress: handleTake });
  }
  if (canRedirect) {
    actions.push({
      key: 'redirect',
      label: redirectMode ? 'Abbrechen' : '→ Weiterschieben',
      variant: redirectMode ? 'secondary-active' : 'secondary',
      onPress: () => {
        setRedirectMode((v) => !v);
        setSelectedCardId(null);
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <PlayerBar
        players={game.players}
        attackerId={game.attackerId}
        defenderId={game.defenderId}
        youId={playerId ?? ''}
      />

      <RoleBanner kind={role} message={roleMessage} />

      <View style={styles.tableContainer}>
        <Table
          table={game.table}
          trumpCard={game.trumpCard}
          trumpSuit={game.trumpSuit}
          deckCount={game.deckCount}
          discardCount={game.discardCount}
          onAttackPress={isDefender ? handleAttackTap : undefined}
          highlightedAttackIds={candidateAttackIds}
        />
      </View>

      <ActionBar actions={actions} />

      <PlayerHand
        hand={game.you.hand}
        selectedCardId={selectedCardId}
        onSelect={handleCardSelect}
        playableIds={playableCardIds}
      />

      <Toast message={lastError} onDismiss={() => setError(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textDim },
  tableContainer: { flex: 1, padding: spacing(3) },
});
