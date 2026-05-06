import { SOCKET_EVENTS } from '@durak/shared';
import { useGameStore } from '../store/gameStore';
import { getSocket } from './socket';

let attached = false;

export const attachSocketHandlers = (): void => {
  if (attached) return;
  const socket = getSocket();
  const store = useGameStore.getState;

  // Sync initial state — the socket may already be connected by the time we attach.
  useGameStore.setState({ connected: socket.connected });

  socket.on('connect', () => {
    useGameStore.setState({ connected: true, lastError: null });
  });

  socket.on('disconnect', (reason) => {
    useGameStore.setState({ connected: false, lastError: `Verbindung getrennt (${reason})` });
  });

  socket.on('connect_error', (err) => {
    useGameStore.setState({
      connected: false,
      lastError: `Verbindungsfehler: ${err.message}`,
    });
  });

  socket.on(SOCKET_EVENTS.ROOM_LIST_UPDATE, (rooms) => {
    store().upsertRooms(rooms);
  });

  socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (state) => {
    store().setGame(state);
  });

  socket.on(SOCKET_EVENTS.ERROR_MESSAGE, (payload) => {
    store().setError(`${payload.code}: ${payload.message}`);
  });

  attached = true;
};
