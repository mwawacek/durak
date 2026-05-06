import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { getSocket, emitAck, getApiUrl } from '../services/socket';
import { attachSocketHandlers } from '../services/socketHandlers';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, type JoinLobbyResult, type AckResult } from '@durak/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connected = useGameStore((s) => s.connected);
  const lastError = useGameStore((s) => s.lastError);
  const setIdentity = useGameStore((s) => s.setIdentity);

  const apiUrl = getApiUrl();

  // Start connecting as soon as the screen mounts so the user sees live status.
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
    useGameStore.getState().setRooms(ack.data.rooms);
    navigation.replace('Lobby');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.title}>Durak</Text>
        <Text style={styles.subtitle}>Russisches Kartenspiel · Online Multiplayer</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Dein Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="z. B. Anna"
            placeholderTextColor={colors.textDim}
            autoFocus
            autoCapitalize="words"
            maxLength={32}
            editable={!loading}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              (loading || name.trim().length < 2 || !connected) && styles.buttonDisabled,
            ]}
            onPress={handleJoin}
            disabled={loading || name.trim().length < 2 || !connected}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Beitreten</Text>
            )}
          </TouchableOpacity>

          <View style={styles.connectionBox}>
            <Text style={styles.connectionLine}>
              {connected ? '🟢' : '🔴'} {connected ? 'Server verbunden' : 'Keine Verbindung'}
            </Text>
            <Text style={styles.connectionUrl}>{apiUrl}</Text>
            {!connected && lastError ? <Text style={styles.error}>{lastError}</Text> : null}
            {!connected ? (
              <Text style={styles.hint}>
                Läuft `npm run dev:backend` auf diesem Rechner? Auf echten Geräten muss der
                Backend über dieselbe WLAN-IP erreichbar sein (Port 3000).
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing(6), justifyContent: 'center' },
  title: {
    color: colors.accentStrong,
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing(2),
    marginBottom: spacing(8),
  },
  form: { gap: spacing(3) },
  label: { color: colors.textDim, fontSize: 14 },
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.text,
    padding: spacing(4),
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 18,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing(4),
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing(2),
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 18 },
  error: { color: colors.danger, fontSize: 13 },
  connectionBox: {
    marginTop: spacing(4),
    padding: spacing(3),
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1),
  },
  connectionLine: { color: colors.text, fontSize: 13, fontWeight: '600' },
  connectionUrl: { color: colors.textDim, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  hint: { color: colors.textDim, fontSize: 11, lineHeight: 16 },
});
