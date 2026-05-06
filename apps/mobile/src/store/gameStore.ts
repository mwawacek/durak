import { create } from 'zustand';
import type { GameStatePrivate, RoomPublic } from '@durak/shared';

interface GameStoreState {
  playerId: string | null;
  playerName: string | null;
  connected: boolean;
  rooms: RoomPublic[];
  currentRoomId: string | null;
  game: GameStatePrivate | null;
  lastError: string | null;

  setConnected: (connected: boolean) => void;
  setIdentity: (playerId: string, playerName: string) => void;
  setRooms: (rooms: RoomPublic[]) => void;
  upsertRooms: (rooms: RoomPublic[]) => void;
  removeRoom: (roomId: string) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setGame: (game: GameStatePrivate | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  playerId: null,
  playerName: null,
  connected: false,
  rooms: [],
  currentRoomId: null,
  game: null,
  lastError: null,

  setConnected: (connected) => set({ connected }),
  setIdentity: (playerId, playerName) => set({ playerId, playerName }),
  setRooms: (rooms) => set({ rooms }),
  upsertRooms: (incoming) =>
    set((state) => {
      const byId = new Map(state.rooms.map((r) => [r.id, r]));
      for (const r of incoming) byId.set(r.id, r);
      return { rooms: [...byId.values()].sort((a, b) => b.createdAt - a.createdAt) };
    }),
  removeRoom: (roomId) => set((s) => ({ rooms: s.rooms.filter((r) => r.id !== roomId) })),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  setGame: (game) => set({ game }),
  setError: (error) => set({ lastError: error }),
  reset: () =>
    set({
      playerId: null,
      playerName: null,
      connected: false,
      rooms: [],
      currentRoomId: null,
      game: null,
      lastError: null,
    }),
}));
