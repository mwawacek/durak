import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { persistence } from '@/lib/persistence';

/**
 * One-shot redirect: when the lobby first mounts and LocalStorage still has
 * a `lastRoom`, push into /r/<id> so the user re-enters their in-progress
 * game. The single-fire guard prevents yanking the user back after they
 * explicitly leave (Leave clears `lastRoom`, so subsequent boots no-op).
 */
export const useBootReconnect = (): void => {
  const navigate = useNavigate();
  const playerName = useGameStore((s) => s.playerName);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !playerName) return;
    firedRef.current = true;
    const lastRoom = persistence.getLastRoom();
    if (lastRoom) navigate(`/r/${lastRoom}`, { replace: true });
  }, [playerName, navigate]);
};
