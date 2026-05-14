import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useRoomMembership } from '@/hooks/useRoomMembership';
import { NameEntryModal } from '@/components/NameEntryModal';
import { BrassButton } from '@/components/BrassButton';
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
  if (!roomId) return <ErrorScreen title="Kein Raum angegeben" />;

  if (!connected) {
    return <PlaceholderScreen title="Verbinde…" sub="Server wird kontaktiert" />;
  }

  if (!lobbyJoined) {
    return <PlaceholderScreen title="Lade Lobby…" sub="Räume werden synchronisiert" />;
  }

  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return (
      <PlaceholderScreen
        title="Raum nicht gefunden"
        sub="Vielleicht ist er schon zu Ende — versuche es in der Lobby."
      />
    );
  }

  const iAmInRoom = room.players.some((p) => p.id === playerId);

  if (!iAmInRoom && room.status !== 'lobby') {
    return (
      <ErrorScreen
        title="Spiel läuft bereits"
        body="Du kannst nicht in eine laufende Partie einsteigen."
      />
    );
  }

  if (!iAmInRoom) {
    return <PlaceholderScreen title="Trete dem Tisch bei…" sub={room.name} />;
  }

  if (room.status === 'lobby') {
    return <WaitingRoom room={room} />;
  }

  if (!game || game.roomId !== roomId) {
    return <PlaceholderScreen title="Warte auf Spielstart…" sub={room.name} />;
  }

  return (
    <Suspense fallback={<PlaceholderScreen title="Lade Spiel…" sub={room.name} />}>
      <GameTable game={game} roomId={roomId} />
    </Suspense>
  );
};

interface ScreenProps {
  title: string;
  sub?: string;
  body?: string;
}

const PlaceholderScreen = ({ title, sub }: ScreenProps): JSX.Element => (
  <main className="flex h-dvh flex-col items-center justify-center gap-2 px-6 text-center text-text-primary safe-pt safe-pb">
    <h1
      className="font-serif text-2xl text-text-primary"
      style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
    >
      {title}
    </h1>
    {sub ? <p className="font-sans text-sm text-text-secondary">{sub}</p> : null}
  </main>
);

const ErrorScreen = ({ title, body }: ScreenProps): JSX.Element => (
  <main className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center text-text-primary safe-pt safe-pb">
    <h1
      className="font-serif text-2xl text-text-primary"
      style={{ fontWeight: 500, letterSpacing: '-0.015em' }}
    >
      {title}
    </h1>
    {body ? <p className="font-sans text-sm text-text-secondary">{body}</p> : null}
    <Link to="/">
      <BrassButton variant="primary" label="Zur Lobby" />
    </Link>
  </main>
);
