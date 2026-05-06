import { io, Socket } from 'socket.io-client';
import { NativeModules, Platform } from 'react-native';
import { type AckResult, ERROR_CODES } from '@durak/shared';
import { useGameStore } from '../store/gameStore';

/**
 * Resolve backend URL in priority order:
 *   1. EXPO_PUBLIC_API_URL (explicit override)
 *   2. Dev host from Metro's scriptURL (auto-LAN for physical devices in Expo Go)
 *   3. localhost (simulator/emulator/web fallback)
 */
const inferDevHost = (): string | null => {
  if (!__DEV__) return null;
  const scriptURL = (NativeModules.SourceCode as { getConstants?: () => { scriptURL?: string } } | undefined)
    ?.getConstants?.()?.scriptURL;
  if (!scriptURL) return null;
  const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
  return match?.[1] ?? null;
};

const BACKEND_PORT = 3000;

const resolveApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const devHost = inferDevHost();
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return `http://${devHost}:${BACKEND_PORT}`;
  }
  // Android emulator can't resolve "localhost" — the host machine is at 10.0.2.2.
  if (Platform.OS === 'android') return `http://10.0.2.2:${BACKEND_PORT}`;
  return `http://localhost:${BACKEND_PORT}`;
};

export const getApiUrl = resolveApiUrl;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket) return socket;

  socket = io(resolveApiUrl(), {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    reconnectionAttempts: 50,
    timeout: 10_000,
  });

  return socket;
};

/**
 * Emit a socket event with an ack and a 10s timeout. The server returns
 * `AckResult<T>`. Payload is typed as unknown — callers provide the right
 * shape per event (the contract lives in @durak/shared).
 */
export const emitAck = async (
  event: string,
  payload?: unknown,
): Promise<AckResult<unknown>> => {
  const s = getSocket();
  try {
    const args = payload === undefined ? [] : [payload];
    return (await s.timeout(10_000).emitWithAck(event, ...args)) as AckResult<unknown>;
  } catch (err) {
    const message = s.connected
      ? 'Server hat nicht geantwortet'
      : 'Verbindung getrennt';
    return {
      ok: false,
      error: { code: ERROR_CODES.TIMEOUT, message },
    };
  }
};

/**
 * Like emitAck, but on failure routes the error message into the global Toast
 * (via useGameStore.setError) and resolves with null. On success returns ack.data
 * cast to T.
 */
export const emitAckOrToast = async <T = unknown>(
  event: string,
  payload?: unknown,
): Promise<T | null> => {
  const ack = (await emitAck(event, payload)) as AckResult<T>;
  if (!ack.ok) {
    useGameStore.getState().setError(ack.error.message);
    return null;
  }
  return ack.data;
};
