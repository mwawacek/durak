import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, radii } from '../theme/colors';
import { useGameStore } from '../store/gameStore';
import { emitAck } from '../services/socket';
import {
  SOCKET_EVENTS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type AckResult,
  type CreateRoomResult,
  type JoinRoomResult,
  type RoomPublic,
} from '@durak/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'Lobby'>;

export const LobbyScreen: React.FC<Props> = ({ navigation }) => {
  const rooms = useGameStore((s) => s.rooms);
  const playerId = useGameStore((s) => s.playerId);
  const playerName = useGameStore((s) => s.playerName);
  const lastError = useGameStore((s) => s.lastError);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);

  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinPending, setJoinPending] = useState(false);

  useEffect(() => {
    // Re-enter an already-joined room (e.g. after reconnect).
    const existing = rooms.find((r) => r.players.some((p) => p.id === playerId));
    if (existing && existing.status === 'in-game') {
      setCurrentRoom(existing.id);
      navigation.replace('Game', { roomId: existing.id });
    }
  }, [rooms, playerId, navigation, setCurrentRoom]);

  const handleCreate = async () => {
    const ack = (await emitAck(SOCKET_EVENTS.CREATE_ROOM, {
      name: roomName.trim() || `${playerName}'s Tisch`,
      maxPlayers,
    })) as AckResult<CreateRoomResult>;
    if (!ack.ok) {
      useGameStore.getState().setError(ack.error.message);
      return;
    }
    setCurrentRoom(ack.data.room.id);
    setCreating(false);
    setRoomName('');
    // Stay in lobby until host taps Start.
  };

  const handleJoin = async (room: RoomPublic) => {
    if (joinPending) return;
    setJoinPending(true);
    const ack = (await emitAck(SOCKET_EVENTS.JOIN_ROOM, { roomId: room.id })) as AckResult<JoinRoomResult>;
    setJoinPending(false);
    if (!ack.ok) {
      useGameStore.getState().setError(ack.error.message);
      return;
    }
    setCurrentRoom(room.id);
  };

  const handleStart = async (room: RoomPublic) => {
    const ack = (await emitAck(SOCKET_EVENTS.START_GAME, { roomId: room.id })) as AckResult<void>;
    if (!ack.ok) {
      useGameStore.getState().setError(ack.error.message);
      return;
    }
    navigation.replace('Game', { roomId: room.id });
  };

  const myRoom = rooms.find((r) => r.players.some((p) => p.id === playerId));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Willkommen, {playerName ?? '…'}</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreating(true)}>
            <Text style={styles.createBtnText}>＋ Neuer Tisch</Text>
          </TouchableOpacity>
        </View>

        {lastError ? <Text style={styles.error}>{lastError}</Text> : null}

        {myRoom ? (
          <View style={styles.myRoom}>
            <Text style={styles.sectionTitle}>Dein Tisch: {myRoom.name}</Text>
            <Text style={styles.textDim}>
              Spieler: {myRoom.players.length}/{myRoom.maxPlayers}
            </Text>
            {myRoom.players.map((p) => (
              <Text key={p.id} style={styles.playerRow}>
                • {p.name} {p.isConnected ? '🟢' : '⚪️'} {p.id === myRoom.ownerId ? '👑' : ''}
              </Text>
            ))}
            {myRoom.ownerId === playerId && myRoom.players.length >= MIN_PLAYERS && (
              <TouchableOpacity style={styles.startBtn} onPress={() => handleStart(myRoom)}>
                <Text style={styles.startBtnText}>Spiel starten</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Offene Tische</Text>
        <FlatList
          data={rooms.filter((r) => r.status === 'lobby' && r.id !== myRoom?.id)}
          keyExtractor={(r) => r.id}
          ListEmptyComponent={<Text style={styles.textDim}>Keine offenen Tische.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomRow}
              onPress={() => handleJoin(item)}
              disabled={item.players.length >= item.maxPlayers}
            >
              <View style={styles.roomRowMain}>
                <Text style={styles.roomName}>{item.name}</Text>
                <Text style={styles.textDim}>
                  {item.players.length}/{item.maxPlayers} Spieler
                </Text>
              </View>
              <Text style={styles.joinHint}>
                {item.players.length >= item.maxPlayers ? 'voll' : 'beitreten →'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal visible={creating} animationType="slide" transparent onRequestClose={() => setCreating(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neuen Tisch erstellen</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Tischname"
              placeholderTextColor={colors.textDim}
              value={roomName}
              onChangeText={setRoomName}
              maxLength={48}
            />
            <Text style={styles.label}>Max. Spieler</Text>
            <View style={styles.pillRow}>
              {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.pill, maxPlayers === n && styles.pillActive]}
                  onPress={() => setMaxPlayers(n)}
                >
                  <Text style={[styles.pillText, maxPlayers === n && styles.pillTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCreating(false)}>
                <Text style={styles.modalBtnSecondaryText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleCreate}>
                <Text style={styles.modalBtnPrimaryText}>Erstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing(4), gap: spacing(3) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcome: { color: colors.text, fontSize: 18, fontWeight: '600' },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: radii.md,
  },
  createBtnText: { color: colors.bg, fontWeight: '700' },
  error: {
    color: colors.danger,
    backgroundColor: 'rgba(239,71,111,0.1)',
    padding: spacing(3),
    borderRadius: radii.md,
  },
  myRoom: {
    backgroundColor: colors.bgElevated,
    padding: spacing(4),
    borderRadius: radii.md,
    gap: spacing(1),
  },
  sectionTitle: { color: colors.accent, fontWeight: '700', marginTop: spacing(2) },
  textDim: { color: colors.textDim, fontSize: 14 },
  playerRow: { color: colors.text },
  startBtn: {
    backgroundColor: colors.success,
    padding: spacing(3),
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing(3),
  },
  startBtnText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(3),
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    marginBottom: spacing(2),
  },
  roomRowMain: { flex: 1 },
  roomName: { color: colors.text, fontWeight: '600', fontSize: 16 },
  joinHint: { color: colors.accent },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing(4),
  },
  modal: { backgroundColor: colors.bgElevated, borderRadius: radii.lg, padding: spacing(5), gap: spacing(3) },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  label: { color: colors.textDim, fontSize: 12 },
  input: {
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radii.md,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillRow: { flexDirection: 'row', gap: spacing(2), flexWrap: 'wrap' },
  pill: {
    minWidth: 44,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
  },
  pillActive: { backgroundColor: colors.accent },
  pillText: { color: colors.text, fontWeight: '600' },
  pillTextActive: { color: colors.bg },
  modalActions: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing(3),
    borderRadius: radii.md,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: colors.bg, fontWeight: '700' },
  modalBtnSecondary: {
    flex: 1,
    padding: spacing(3),
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnSecondaryText: { color: colors.textDim },
});
