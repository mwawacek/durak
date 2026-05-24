import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { persistence } from '@/lib/persistence';

/** Hydrate identity + lastRoom from LocalStorage on mount; mirror back on change. */
export const useNamePersistence = (): void => {
  useEffect(() => {
    const name = persistence.getName();
    const id = persistence.getPlayerId();
    if (name) useGameStore.setState({ playerName: name });
    if (id) useGameStore.setState({ playerId: id });
  }, []);

  useEffect(() => {
    return useGameStore.subscribe((state, prev) => {
      if (state.playerName !== prev.playerName) persistence.setName(state.playerName);
      if (state.playerId !== prev.playerId) persistence.setPlayerId(state.playerId);
      if (state.currentRoomId !== prev.currentRoomId) {
        persistence.setLastRoom(state.currentRoomId);
      }
    });
  }, []);
};
