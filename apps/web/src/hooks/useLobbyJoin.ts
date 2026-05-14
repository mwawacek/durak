import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS, type JoinLobbyResult, type AckResult } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAck } from '@/services/socket';
import { log } from '@/lib/logger';

/**
 * Whenever a player name is present and the socket connects, emit JOIN_LOBBY
 * to obtain a playerId and the current room list. Re-emits on reconnect so
 * the server-side 30 s grace period can re-attach us to any room we left.
 *
 * Idempotent per (name × socket-connect generation): we only emit once per
 * (connect → name-known) edge, never on every render.
 */
export const useLobbyJoin = (): void => {
  const connected = useGameStore((s) => s.connected);
  const playerName = useGameStore((s) => s.playerName);
  const lastJoinKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !playerName) return;
    const key = `${playerName}:${connected}`;
    if (lastJoinKeyRef.current === key) return;
    lastJoinKeyRef.current = key;

    let cancelled = false;
    (async () => {
      const ack = (await emitAck(SOCKET_EVENTS.JOIN_LOBBY, {
        playerName,
      })) as AckResult<JoinLobbyResult>;
      if (cancelled) return;
      if (!ack.ok) {
        log.warn('joinLobby failed', ack.error);
        useGameStore.getState().setError(ack.error.message);
        // Reset the join key so we retry next time the socket reconnects.
        lastJoinKeyRef.current = null;
        return;
      }
      useGameStore.getState().setIdentity(ack.data.playerId, playerName);
      useGameStore.getState().upsertRooms(ack.data.rooms);
      // Flip the gate so /r/:id routes can stop showing "Verbinde…" and the
      // membership hook is allowed to fire its JOIN_ROOM.
      useGameStore.getState().setLobbyJoined(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, playerName]);
};
