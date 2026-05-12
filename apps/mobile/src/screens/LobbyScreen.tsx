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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, presets, radii, spacing } from '../theme/colors';
import { useGameStore } from '../store/gameStore';
import { emitAckOrToast } from '../services/socket';
import {
  SOCKET_EVENTS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type CreateRoomResult,
  type JoinRoomResult,
  type RoomPublic,
} from '@durak/shared';
import { BrassButton } from '../components/BrassButton';

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
    const existing = rooms.find((r) => r.players.some((p) => p.id === playerId));
    if (existing && existing.status === 'in-game') {
      setCurrentRoom(existing.id);
      navigation.replace('Game', { roomId: existing.id });
    }
  }, [rooms, playerId, navigation, setCurrentRoom]);

  const handleCreate = async () => {
    const data = await emitAckOrToast<CreateRoomResult>(SOCKET_EVENTS.CREATE_ROOM, {
      name: roomName.trim() || `${playerName}'s Tisch`,
      maxPlayers,
    });
    if (!data) return;
    setCurrentRoom(data.room.id);
    setCreating(false);
    setRoomName('');
  };

  const handleJoin = async (room: RoomPublic) => {
    if (joinPending) return;
    setJoinPending(true);
    const data = await emitAckOrToast<JoinRoomResult>(SOCKET_EVENTS.JOIN_ROOM, { roomId: room.id });
    setJoinPending(false);
    if (!data) return;
    setCurrentRoom(room.id);
  };

  const handleStart = async (room: RoomPublic) => {
    const data = await emitAckOrToast<void>(SOCKET_EVENTS.START_GAME, { roomId: room.id });
    if (data === null) return;
    navigation.replace('Game', { roomId: room.id });
  };

  const myRoom = rooms.find((r) => r.players.some((p) => p.id === playerId));
  const openRooms = rooms.filter((r) => r.status === 'lobby' && r.id !== myRoom?.id);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.woodLight, colors.woodMid, colors.woodDark]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeLabel}>Lobby</Text>
              <Text style={styles.welcome}>{playerName ?? '…'}</Text>
            </View>
            <BrassButton variant="primary" label="Neuer Tisch" onPress={() => setCreating(true)} />
          </View>

          {lastError ? <Text style={styles.error}>{lastError}</Text> : null}

          {myRoom ? (
            <View style={styles.myRoom}>
              <View style={styles.myRoomHeader}>
                <Text style={styles.sectionTitle}>Dein Tisch</Text>
                <Text style={styles.myRoomName}>{myRoom.name}</Text>
                <View style={[presets.goldPill, styles.countBadge]}>
                  <Text style={styles.countBadgeText}>
                    {myRoom.players.length}/{myRoom.maxPlayers}
                  </Text>
                </View>
              </View>
              {myRoom.players.map((p) => (
                <View key={p.id} style={styles.playerLine}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: p.isConnected ? colors.defendingGreen : colors.creamDim },
                    ]}
                  />
                  <Text style={styles.playerName}>{p.name}</Text>
                  {p.id === myRoom.ownerId ? (
                    <Text style={styles.ownerMark}>Host</Text>
                  ) : null}
                </View>
              ))}
              {myRoom.ownerId === playerId && myRoom.players.length >= MIN_PLAYERS ? (
                <View style={{ marginTop: spacing(3), alignItems: 'flex-start' }}>
                  <BrassButton
                    variant="primary"
                    label="Spiel starten"
                    onPress={() => handleStart(myRoom)}
                  />
                </View>
              ) : (
                <Text style={styles.waitHint}>
                  {myRoom.players.length < MIN_PLAYERS
                    ? `Mindestens ${MIN_PLAYERS} Spieler nötig`
                    : 'Nur der Host kann starten'}
                </Text>
              )}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Offene Tische</Text>
          <FlatList
            data={openRooms}
            keyExtractor={(r) => r.id}
            ListEmptyComponent={<Text style={styles.empty}>Keine offenen Tische.</Text>}
            renderItem={({ item }) => {
              const full = item.players.length >= item.maxPlayers;
              return (
                <TouchableOpacity
                  style={[styles.roomRow, full && styles.roomRowDim]}
                  onPress={() => handleJoin(item)}
                  disabled={full || joinPending}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomRowMain}>
                    <Text style={styles.roomName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.roomSub}>
                      {item.players.length}/{item.maxPlayers} Spieler
                    </Text>
                  </View>
                  <Text style={[styles.joinHint, full && styles.joinHintDim]}>
                    {full ? 'voll' : 'beitreten ›'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={creating}
        animationType="slide"
        transparent
        onRequestClose={() => setCreating(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Neuen Tisch erstellen</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Tischname"
              placeholderTextColor={colors.creamDim}
              value={roomName}
              onChangeText={setRoomName}
              maxLength={48}
            />
            <Text style={styles.label}>Max. Spieler</Text>
            <View style={styles.pillRow}>
              {Array.from(
                { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                (_, i) => MIN_PLAYERS + i,
              ).map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.pill, maxPlayers === n && styles.pillActive]}
                  onPress={() => setMaxPlayers(n)}
                >
                  <Text style={[styles.pillText, maxPlayers === n && styles.pillTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <BrassButton
                variant="secondary"
                label="Abbrechen"
                onPress={() => setCreating(false)}
              />
              <BrassButton variant="primary" label="Erstellen" onPress={handleCreate} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing(4), gap: spacing(3) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  welcomeLabel: {
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  welcome: {
    color: colors.cream,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    marginTop: 2,
  },
  error: {
    color: colors.redBright,
    backgroundColor: colors.bgPillStrong,
    borderWidth: 0.5,
    borderColor: colors.goldFaint,
    padding: spacing(3),
    borderRadius: radii.md,
    fontSize: 13,
  },
  myRoom: {
    backgroundColor: colors.bgPillStrong,
    borderWidth: 1,
    borderColor: colors.goldFaint,
    padding: spacing(4),
    borderRadius: radii.md,
    gap: spacing(2),
  },
  myRoomHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  myRoomName: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    flex: 1,
  },
  countBadge: { paddingHorizontal: spacing(2), paddingVertical: 2 },
  countBadgeText: { color: colors.goldLight, fontSize: 11, fontWeight: '700' },
  sectionTitle: {
    color: colors.goldLight,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
    marginTop: spacing(2),
  },
  playerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingVertical: 2,
  },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  playerName: { color: colors.cream, fontSize: 14, flex: 1, fontFamily: fonts.serif },
  ownerMark: {
    color: colors.goldLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  waitHint: {
    color: colors.creamDim,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: spacing(2),
  },
  empty: { color: colors.creamDim, fontSize: 13, fontStyle: 'italic' },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: colors.bgPillSoft,
    borderRadius: radii.md,
    borderWidth: 0.5,
    borderColor: colors.goldFaint,
    marginBottom: spacing(2),
  },
  roomRowDim: { opacity: 0.5 },
  roomRowMain: { flex: 1, gap: 2 },
  roomName: {
    color: colors.cream,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fonts.serif,
  },
  roomSub: { color: colors.creamDim, fontSize: 11, letterSpacing: 1 },
  joinHint: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  joinHintDim: { color: colors.creamDim },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,4,2,0.78)',
    justifyContent: 'center',
    padding: spacing(4),
  },
  modal: {
    backgroundColor: colors.bgPillStrong,
    borderRadius: radii.lg,
    padding: spacing(5),
    gap: spacing(3),
    borderWidth: 1,
    borderColor: colors.goldFaint,
  },
  modalTitle: {
    color: colors.cream,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.serif,
    fontStyle: 'italic',
  },
  label: {
    color: colors.goldLight,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: fonts.serif,
  },
  input: {
    backgroundColor: colors.bg,
    color: colors.cream,
    borderRadius: radii.md,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.goldFaint,
    fontFamily: fonts.serif,
  },
  pillRow: { flexDirection: 'row', gap: spacing(2), flexWrap: 'wrap' },
  pill: {
    minWidth: 44,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radii.pill,
    backgroundColor: colors.bgPillSoft,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.goldFaint,
  },
  pillActive: { backgroundColor: colors.gold, borderColor: colors.goldHighlight },
  pillText: { color: colors.goldLight, fontWeight: '700', fontFamily: fonts.serif },
  pillTextActive: { color: colors.inkBlack },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(2),
    marginTop: spacing(2),
  },
});
