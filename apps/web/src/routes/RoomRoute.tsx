import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useRoomMembership } from '@/hooks/useRoomMembership';
import { NameEntryModal } from '@/components/NameEntryModal';
import { BrassButton } from '@/components/BrassButton';
import { WaitingRoom } from '@/features/waiting/WaitingRoom';

// Code-split the game table — it pulls in Card, SVG layouts, and Framer
// Motion, none of which are needed for the lobby / waiting-room paths.
// On a fresh /r/:id deep link the user spends a few hundred ms in the
// WaitingRoom anyway, which is plenty of time to fetch the game chunk.
const GameTable = lazy(() =>
  import('@/features/game/GameTable').then((m) => ({ default: m.GameTable })),
);

/**
 * /r/:roomId — entry point for shareable room URLs.
 *
 *   - No name in store → blocking NameEntryModal.
 *   - Name + roomId, but socket not connected yet → "Verbinde…" placeholder.
 *   - Connected and joined, room.status === 'lobby' → WaitingRoom.
 *   - Connected and joined, room.status === 'in-game' → GameTable.
 *   - Connected, room exists but I'm not in it and it's already in-game →
 *     "Spiel läuft bereits" message with a link back to the lobby.
 *   - Connected and room not found → "Raum nicht gefunden".
 */
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

  // Wait for the JOIN_LOBBY ack — otherwise we'd briefly show "Raum nicht
  // gefunden" between socket connect and the first room list update.
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
    // We're trying to join — useRoomMembership has fired. Show a soft loader.
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
  <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-cream safe-pt safe-pb">
    <h1 className="font-serif text-2xl italic">{title}</h1>
    {sub ? <p className="text-sm text-cream-dim">{sub}</p> : null}
  </main>
);

const ErrorScreen = ({ title, body }: ScreenProps): JSX.Element => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-cream safe-pt safe-pb">
    <h1 className="font-serif text-2xl italic">{title}</h1>
    {body ? <p className="text-sm text-cream-dim">{body}</p> : null}
    <Link to="/">
      <BrassButton variant="primary" label="Zur Lobby" />
    </Link>
  </main>
);
