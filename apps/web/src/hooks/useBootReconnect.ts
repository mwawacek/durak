import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { persistence } from '@/lib/persistence';

/**
 * One-shot redirect: on the first time the user lands on `/` (the lobby
 * route) AFTER booting, if LocalStorage still has a `lastRoom`, redirect
 * them into that room so they can re-join their in-progress game.
 *
 * The redirect only fires once per page load (guarded by `firedRef`) so that
 * a user who explicitly leaves a room and returns to the lobby is not yanked
 * back into it on the next render.
 *
 * Leaving a room (via WaitingRoom's `Verlassen` button or the GameOverDialog
 * navigation) calls `setCurrentRoom(null)`, which clears LocalStorage and
 * makes this hook a no-op on subsequent boots.
 */
export const useBootReconnect = (): void => {
  const navigate = useNavigate();
  const playerName = useGameStore((s) => s.playerName);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (!playerName) return; // wait until the user has identity
    const lastRoom = persistence.getLastRoom();
    if (!lastRoom) {
      firedRef.current = true;
      return;
    }
    if (window.location.pathname !== '/') {
      firedRef.current = true;
      return;
    }
    firedRef.current = true;
    navigate(`/r/${lastRoom}`, { replace: true });
  }, [playerName, navigate]);
};
