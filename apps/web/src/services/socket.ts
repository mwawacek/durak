import { io, type Socket } from 'socket.io-client';
import {
  type AckResult,
  ERROR_CODES,
  SOCKET_ACK_TIMEOUT_MS,
  type SocketEventName,
} from '@durak/shared';
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

let socket: Socket | null = null;
let visibilityWired = false;

export const getSocket = (): Socket => {
  if (socket) return socket;

  socket = io(resolveApiUrl(), {
    autoConnect: true,
    // Pinned to websocket only: silent polling fallback turns transient
    // upgrade hiccups into long-polling sessions, which are far more
    // disconnect-prone behind mobile NAT. Browsers we care about all
    // support WS natively.
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    reconnectionAttempts: Infinity,
    // 10s wasn't enough for mobile cold-start against a freshly woken
    // Fly machine. 20s leaves headroom without users staring at a blank
    // screen.
    timeout: 20_000,
  });

  // Mobile browsers (Safari especially) freeze JS + the WS pipe when the
  // tab backgrounds. When the user returns, the socket often looks
  // "connected" but every send hangs until the heartbeat times out — by
  // then the grace window has eaten the seat. Force a fresh connect on
  // every resume so reconnection runs immediately.
  if (!visibilityWired && typeof document !== 'undefined') {
    const wake = () => {
      if (!socket || socket.connected) return;
      socket.connect();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') wake();
    });
    window.addEventListener('pageshow', wake);
    window.addEventListener('focus', wake);
    visibilityWired = true;
  }

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
    return (await s.timeout(SOCKET_ACK_TIMEOUT_MS).emitWithAck(event, ...args)) as AckResult<unknown>;
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
