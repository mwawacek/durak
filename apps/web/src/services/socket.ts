import { io, type Socket } from 'socket.io-client';
import { type AckResult, ERROR_CODES, type SocketEventName } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';

/**
 * Resolve the backend URL.
 *
 * Priority:
 *   1. `VITE_API_URL` build-time env var (set in `.env` / `.env.local`)
 *   2. Same host as the page, port 3010 (typical Vite-on-laptop dev)
 *   3. Same origin (deployed alongside backend behind a single domain)
 *
 * In dev (`import.meta.env.DEV`) we always pin to :3010 on the same host
 * — this lets a phone on the LAN hit the laptop without env-var gymnastics.
 */
const BACKEND_PORT = 3010;

const resolveApiUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) {
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${proto}//${window.location.hostname}:${BACKEND_PORT}`;
  }
  return window.location.origin;
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
    reconnectionAttempts: Infinity,
    timeout: 10_000,
  });

  return socket;
};

/**
 * Emit a socket event with an ack and a 10 s timeout. The server returns
 * `AckResult<T>`. Restricting `event` to the SOCKET_EVENTS value union
 * gives us compile-time coverage on typos at call sites; the payload
 * stays `unknown` because each event has a different shape (the contract
 * lives in @durak/shared).
 */
export const emitAck = async (
  event: SocketEventName,
  payload?: unknown,
): Promise<AckResult<unknown>> => {
  const s = getSocket();
  try {
    const args = payload === undefined ? [] : [payload];
    // `emitWithAck` is typed as `Promise<unknown>`. The runtime always
    // returns `AckResult<unknown>` because every backend handler wraps its
    // response — this cast is the documented contract boundary.
    return (await s.timeout(10_000).emitWithAck(event, ...args)) as AckResult<unknown>;
  } catch {
    const message = s.connected ? 'Server hat nicht geantwortet' : 'Verbindung getrennt';
    return {
      ok: false,
      error: { code: ERROR_CODES.TIMEOUT, message },
    };
  }
};

/**
 * Like emitAck, but on failure routes the error message into the global Toast
 * (via useGameStore.setError) and resolves with null. On success returns
 * ack.data narrowed to T (caller-asserted, per the same contract as emitAck).
 */
export const emitAckOrToast = async <T = unknown>(
  event: SocketEventName,
  payload?: unknown,
): Promise<T | null> => {
  const ack = (await emitAck(event, payload)) as AckResult<T>;
  if (!ack.ok) {
    useGameStore.getState().setError(ack.error.message);
    return null;
  }
  return ack.data;
};
