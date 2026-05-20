import { lazy, Suspense, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useRoomMembership } from '@/hooks/useRoomMembership';
import { persistence } from '@/lib/persistence';
import { NameEntryModal } from '@/components/NameEntryModal';
import { StatusScreen } from '@/components/StatusScreen';
import { WaitingRoom } from '@/features/waiting/WaitingRoom';

const GameTable = lazy(() =>
  import('@/features/game/GameTable').then((m) => ({ default: m.GameTable })),
);

export const RoomRoute = (): JSX.Element => {
  const { roomId } = useParams();
  const playerName = useGameStore((s) => s.playerName);
  const playerId = useGameStore((s) => s.playerId);
  const connected = useGameStore((s) => s.connected);
  const lobbyJoined = useGameStore((s) => s.lobbyJoined);
  const rooms = useGameStore((s) => s.rooms);
  const game = useGameStore((s) => s.game);

  useRoomMembership(roomId);

  // Once the lobby snapshot has arrived, decide whether the room targeted by
  // /r/:id is still reachable for us. If not, clear the persisted lastRoom so
  // a reload (or "Zur Lobby" navigation that re-triggers useBootReconnect)
  // doesn't bounce us back into a dead URL.
  const room = roomId ? rooms.find((r) => r.id === roomId) : undefined;
  const iAmInRoom = !!room && !!playerId && room.players.some((p) => p.id === playerId);
  const targetUnreachable =
    lobbyJoined && !!roomId &&
    (!room ||
      (!iAmInRoom && room.status !== 'lobby') ||
      (room.status === 'finished' &&
        (!game || game.roomId !== roomId || game.phase !== 'finished')));
  useEffect(() => {
    if (targetUnreachable) persistence.setLastRoom(null);
  }, [targetUnreachable]);

  if (!playerName) return <NameEntryModal reason="invite" />;
  if (!roomId) {
    return <StatusScreen title="Kein Raum angegeben" showLobbyLink />;
  }

  if (!connected) {
    return <StatusScreen title="Verbinde…" sub="Server wird kontaktiert" />;
  }

  if (!lobbyJoined) {
    return <StatusScreen title="Lade Lobby…" sub="Räume werden synchronisiert" />;
  }

  if (!room) {
    return (
      <StatusScreen
        title="Raum nicht gefunden"
        sub="Vielleicht ist er schon zu Ende — versuche es in der Lobby."
        showLobbyLink
      />
    );
  }

  if (!iAmInRoom && room.status !== 'lobby') {
    return (
      <StatusScreen
        title="Spiel läuft bereits"
        body="Du kannst nicht in eine laufende Partie einsteigen."
        showLobbyLink
      />
    );
  }

  if (!iAmInRoom) {
    return <StatusScreen title="Trete dem Tisch bei…" sub={room.name} />;
  }

  if (room.status === 'lobby') {
    return <WaitingRoom room={room} />;
  }

  // Abandoned mid-game (someone left or got disconnected past the grace
  // window). A clean game-over still has `game.phase === 'finished'`, so the
  // GameOverDialog inside GameTable can render — only fall through to this
  // screen when there is no proper finish state to show.
  if (
    room.status === 'finished' &&
    (!game || game.roomId !== roomId || game.phase !== 'finished')
  ) {
    return (
      <StatusScreen
        title="Tisch geschlossen"
        sub="Das Spiel wurde beendet."
        showLobbyLink
      />
    );
  }

  if (!game || game.roomId !== roomId) {
    return <StatusScreen title="Warte auf Spielstart…" sub={room.name} />;
  }

  return (
    <Suspense fallback={<StatusScreen title="Lade Spiel…" sub={room.name} />}>
      <GameTable game={game} roomId={roomId} />
    </Suspense>
  );
};
