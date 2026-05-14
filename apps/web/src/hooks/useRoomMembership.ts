import { useEffect, useRef } from 'react';
import { SOCKET_EVENTS, type JoinRoomResult } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';

/**
 * If we have an identity and we're navigated to a room route that we're not
 * a member of yet, attempt to join. Idempotent per (roomId × playerId).
 * Errors surface via the global Toast.
 */
export const useRoomMembership = (roomId: string | undefined): void => {
  const playerId = useGameStore((s) => s.playerId);
  const connected = useGameStore((s) => s.connected);
  const rooms = useGameStore((s) => s.rooms);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const lastJoinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !playerId || !connected) return;
    const inRoom = rooms.some(
      (r) => r.id === roomId && r.players.some((p) => p.id === playerId),
    );
    if (inRoom) {
      setCurrentRoom(roomId);
      return;
    }
    if (lastJoinedRef.current === roomId) return;
    lastJoinedRef.current = roomId;
    (async () => {
      const data = await emitAckOrToast<JoinRoomResult>(SOCKET_EVENTS.JOIN_ROOM, { roomId });
      if (data) setCurrentRoom(roomId);
      else lastJoinedRef.current = null; // allow retry on next render
    })();
  }, [roomId, playerId, connected, rooms, setCurrentRoom]);
};
