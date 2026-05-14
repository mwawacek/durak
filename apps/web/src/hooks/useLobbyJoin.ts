import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS, type JoinLobbyResult, type AckResult } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAck } from '@/services/socket';
import { log } from '@/lib/logger';

/**
 * Emit JOIN_LOBBY once per (name × connection-generation). Re-runs on a
 * reconnect so the server's 30 s grace period can re-attach us. The ref is
 * cleared on disconnect or name removal — otherwise the reconnect's
 * connected=true edge would fail the stable-key check and never re-fire.
 */
export const useLobbyJoin = (): void => {
  const connected = useGameStore((s) => s.connected);
  const playerName = useGameStore((s) => s.playerName);
  const emittedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !playerName) {
      emittedForRef.current = null;
      return;
    }
    if (emittedForRef.current === playerName) return;
    emittedForRef.current = playerName;

    let cancelled = false;
    (async () => {
      const ack = (await emitAck(SOCKET_EVENTS.JOIN_LOBBY, {
        playerName,
      })) as AckResult<JoinLobbyResult>;
      if (cancelled) return;
      if (!ack.ok) {
        log.warn('joinLobby failed', ack.error);
        useGameStore.getState().setError(ack.error.message);
        emittedForRef.current = null;
        return;
      }
      useGameStore.getState().setIdentity(ack.data.playerId, playerName);
      useGameStore.getState().upsertRooms(ack.data.rooms);
      useGameStore.getState().setLobbyJoined(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, playerName]);
};
