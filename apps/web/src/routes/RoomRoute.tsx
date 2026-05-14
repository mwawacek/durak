import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useRoomMembership } from '@/hooks/useRoomMembership';
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

  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return (
      <StatusScreen
        title="Raum nicht gefunden"
        sub="Vielleicht ist er schon zu Ende — versuche es in der Lobby."
        showLobbyLink
      />
    );
  }

  const iAmInRoom = room.players.some((p) => p.id === playerId);

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

  if (!game || game.roomId !== roomId) {
    return <StatusScreen title="Warte auf Spielstart…" sub={room.name} />;
  }

  return (
    <Suspense fallback={<StatusScreen title="Lade Spiel…" sub={room.name} />}>
      <GameTable game={game} roomId={roomId} />
    </Suspense>
  );
};
