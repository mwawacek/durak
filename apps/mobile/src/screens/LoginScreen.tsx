import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, presets, radii, spacing } from '../theme/colors';
import { getSocket, emitAck, getApiUrl } from '../services/socket';
import { attachSocketHandlers } from '../services/socketHandlers';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, type JoinLobbyResult, type AckResult } from '@durak/shared';
import { BrassButton } from '../components/BrassButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = useGameStore((s) => s.connected);
  const lastError = useGameStore((s) => s.lastError);
  const setIdentity = useGameStore((s) => s.setIdentity);

  const apiUrl = getApiUrl();

  useEffect(() => {
    attachSocketHandlers();
    getSocket();
  }, []);

  const handleJoin = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError('Name muss mindestens 2 Zeichen haben');
      return;
    }
    if (!connected) {
      setError('Keine Verbindung zum Server – bitte warten oder Server prüfen');
      return;
    }
    setLoading(true);

    const ack = (await emitAck(SOCKET_EVENTS.JOIN_LOBBY, {
      playerName: name.trim(),
    })) as AckResult<JoinLobbyResult>;

    setLoading(false);

    if (!ack.ok) {
      setError(ack.error.message);
      return;
    }

    setIdentity(ack.data.playerId, name.trim());
    useGameStore.getState().upsertRooms(ack.data.rooms);
    navigation.replace('Lobby');
  };

  const canJoin = !loading && name.trim().length >= 2 && connected;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.woodLight, colors.woodMid, colors.woodDark]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.titleBlock}>
            <Text style={styles.titleAccent}>· ♣ ♦ ·</Text>
            <Text style={styles.title}>Durak</Text>
            <Text style={styles.subtitle}>Klassisches Kartenspiel</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Dein Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="z. B. Anna"
              placeholderTextColor={colors.creamDim}
              autoFocus
              autoCapitalize="words"
              maxLength={32}
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.buttonRow}>
              {loading ? (
                <ActivityIndicator color={colors.goldLight} />
              ) : (
                <BrassButton
                  variant="primary"
                  label="Beitreten"
                  onPress={handleJoin}
                  disabled={!canJoin}
                />
              )}
            </View>

            <View style={[presets.goldPill, styles.connectionBox]}>
              <View style={styles.connectionLine}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: connected ? colors.defendingGreen : colors.redBright },
                  ]}
                />
                <Text style={styles.connectionText}>
                  {connected ? 'Server verbunden' : 'Keine Verbindung'}
                </Text>
              </View>
              <Text style={styles.connectionUrl}>{apiUrl}</Text>
              {!connected && lastError ? <Text style={styles.error}>{lastError}</Text> : null}
              {!connected ? (
                <Text style={styles.hint}>
                  Backend gestartet ({"`npm run dev:backend`"})? Auf echten Geräten muss
                  das Backend über dieselbe WLAN-IP erreichbar sein.
                </Text>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: { flex: 1, padding: spacing(6), justifyContent: 'center' },
  titleBlock: {
    alignItems: 'center',
    marginBottom: spacing(8),
  },
  titleAccent: {
    color: colors.goldMuted,
    fontSize: 16,
    letterSpacing: 8,
    fontFamily: fonts.serif,
  },
  title: {
    color: colors.goldHighlight,
    fontSize: 64,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    textShadowColor: colors.textShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginTop: spacing(1),
  },
  subtitle: {
    color: colors.creamDim,
    textAlign: 'center',
    marginTop: spacing(1),
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontFamily: fonts.serif,
  },
  form: { gap: spacing(3) },
  label: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: fonts.serif,
  },
  input: {
    backgroundColor: colors.bgPillStrong,
    color: colors.cream,
    padding: spacing(4),
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.goldFaint,
    fontSize: 18,
    fontFamily: fonts.serif,
  },
  error: { color: colors.redBright, fontSize: 13 },
  buttonRow: {
    alignItems: 'center',
    marginTop: spacing(2),
  },
  connectionBox: {
    marginTop: spacing(5),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    gap: spacing(1),
  },
  connectionLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 999 },
  connectionText: { color: colors.cream, fontSize: 13, fontWeight: '600' },
  connectionUrl: {
    color: colors.creamDim,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hint: { color: colors.creamDim, fontSize: 11, lineHeight: 16, marginTop: spacing(1) },
});
