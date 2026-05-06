import { io, Socket } from 'socket.io-client';
import { NativeModules, Platform } from 'react-native';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SOCKET_EVENTS,
  AckResult,
} from '@durak/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

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

let socket: TypedSocket | null = null;

export const getSocket = (): TypedSocket => {
  if (socket && socket.connected) return socket;
  if (socket) return socket;

  socket = io(resolveApiUrl(), {
    autoConnect: true,
    // websocket first, fall back to polling (web browsers sometimes need it).
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    reconnectionAttempts: Infinity,
    timeout: 10_000,
  }) as TypedSocket;

  return socket;
};

export const emitAck = <
  Ev extends keyof ClientToServerEvents,
  Args extends Parameters<ClientToServerEvents[Ev]>,
>(
  event: Ev,
  ...args: Args extends [...infer Payload, (ack: AckResult<infer _>) => void]
    ? Payload
    : Args
): Promise<AckResult<unknown>> => {
  return new Promise((resolve) => {
    const s = getSocket();
    // socket.io-client uses timeout().emit() for ack with timeout
    (s as unknown as {
      timeout: (ms: number) => { emit: (e: string, ...rest: unknown[]) => void };
    })
      .timeout(10_000)
      .emit(event as string, ...(args as unknown[]), (err: Error | null, ack: AckResult<unknown>) => {
        if (err) {
          resolve({ ok: false, error: { code: 'TIMEOUT', message: err.message } });
          return;
        }
        resolve(ack);
      });
  });
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export type { TypedSocket };
export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
