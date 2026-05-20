import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { persistence } from '@/lib/persistence';

// Module-scoped so it persists across LobbyRoute remounts. A component-scoped
// useRef would reset every time the user lands back on "/", which causes an
// infinite ping-pong when the stored room no longer exists server-side (e.g.
// after a backend restart) — the user clicks "Zur Lobby", we re-fire and
// shove them back to the missing room.
let bootHasFired = false;

/**
 * One-shot redirect on app load: if LocalStorage holds a `lastRoom`, push
 * into /r/<id> so the user re-enters their in-progress game. Fires at most
 * once per page load. RoomRoute clears `lastRoom` when the target turns out
 * to be unreachable, so subsequent reloads no-op cleanly.
 */
export const useBootReconnect = (): void => {
  const navigate = useNavigate();
  const playerName = useGameStore((s) => s.playerName);

  useEffect(() => {
    if (bootHasFired || !playerName) return;
    bootHasFired = true;
    const lastRoom = persistence.getLastRoom();
    if (lastRoom) navigate(`/r/${lastRoom}`, { replace: true });
  }, [playerName, navigate]);
};
