import { create } from 'zustand';
import type { GameStatePrivate, RoomPublic } from '@durak/shared';

interface GameStoreState {
  playerId: string | null;
  playerName: string | null;
  connected: boolean;
  /** True once a JOIN_LOBBY ack has returned for the current socket session.
   *  Flips back to false on disconnect so the next reconnect waits again. */
  lobbyJoined: boolean;
  rooms: RoomPublic[];
  currentRoomId: string | null;
  game: GameStatePrivate | null;
  lastError: string | null;

  setConnected: (connected: boolean) => void;
  setIdentity: (playerId: string, playerName: string) => void;
  setLobbyJoined: (joined: boolean) => void;
  upsertRooms: (rooms: RoomPublic[]) => void;
  removeRoom: (roomId: string) => void;
  setCurrentRoom: (roomId: string | null) => void;
  setGame: (game: GameStatePrivate | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const roomsEqual = (a: RoomPublic[], b: RoomPublic[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x.id !== y.id) return false;
    if (x.status !== y.status) return false;
    if (x.ownerId !== y.ownerId) return false;
    if (x.maxPlayers !== y.maxPlayers) return false;
    if (x.players.length !== y.players.length) return false;
    for (let j = 0; j < x.players.length; j++) {
      const px = x.players[j]!;
      const py = y.players[j]!;
      if (
        px.id !== py.id ||
        px.name !== py.name ||
        px.isConnected !== py.isConnected ||
        px.hasFinished !== py.hasFinished
      ) {
        return false;
      }
    }
  }
  return true;
};

export const useGameStore = create<GameStoreState>((set) => ({
  playerId: null,
  playerName: null,
  connected: false,
  lobbyJoined: false,
  rooms: [],
  currentRoomId: null,
  game: null,
  lastError: null,

  setConnected: (connected) => set({ connected }),
  setIdentity: (playerId, playerName) => set({ playerId, playerName }),
  setLobbyJoined: (lobbyJoined) => set({ lobbyJoined }),
  upsertRooms: (incoming) =>
    set((state) => {
      const byId = new Map(state.rooms.map((r) => [r.id, r]));
      for (const r of incoming) byId.set(r.id, r);
      const next = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
      if (roomsEqual(state.rooms, next)) return state;
      return { rooms: next };
    }),
  removeRoom: (roomId) =>
    set((s) => {
      const next = s.rooms.filter((r) => r.id !== roomId);
      if (next.length === s.rooms.length) return s;
      return { rooms: next };
    }),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),
  setGame: (game) => set({ game }),
  setError: (error) => set({ lastError: error }),
  reset: () =>
    set({
      playerId: null,
      playerName: null,
      connected: false,
      lobbyJoined: false,
      rooms: [],
      currentRoomId: null,
      game: null,
      lastError: null,
    }),
}));
