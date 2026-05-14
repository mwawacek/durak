import { useNavigate } from 'react-router-dom';
import { MIN_PLAYERS, SOCKET_EVENTS, type RoomPublic } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { ShareButton } from '@/components/ShareButton';
import { cn } from '@/lib/cn';

interface Props {
  room: RoomPublic;
}

/**
 * Pre-game waiting room shown while the room is in lobby status. The host
 * gets a "Spiel starten" button (active once min-players is reached). Others
 * see "Warte auf Host". The share button copies the /r/<id> URL for invites.
 */
export const WaitingRoom = ({ room }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const navigate = useNavigate();
  const isHost = room.ownerId === playerId;
  const canStart = isHost && room.players.length >= MIN_PLAYERS;

  const handleStart = async () => {
    const ok = await emitAckOrToast(SOCKET_EVENTS.START_GAME, { roomId: room.id });
    if (ok === null) return;
    // The server flips status to in-game; RoomRoute will pick up the change.
  };

  const handleLeave = async () => {
    const ok = await emitAckOrToast(SOCKET_EVENTS.LEAVE_ROOM, { roomId: room.id });
    if (ok !== null) {
      setCurrentRoom(null);
      navigate('/', { replace: true });
    }
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${room.id}`
      : `/r/${room.id}`;

  return (
    <main className="flex min-h-dvh flex-col bg-bg text-cream safe-pt safe-pb">
      <header className="flex items-center justify-between gap-3 px-5 pt-6">
        <div>
          <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold-light">
            Wartebereich
          </p>
          <h1 className="mt-1 truncate font-serif text-2xl italic text-cream">{room.name}</h1>
        </div>
        <span className="rounded-pill border border-gold/40 bg-mahogany-dark/70 px-3 py-1 text-xs font-bold text-gold-light">
          {room.players.length}/{room.maxPlayers}
        </span>
      </header>

      <section className="mt-6 flex flex-col gap-4 px-5">
        <h2 className="font-serif text-[10px] font-bold uppercase tracking-[0.3em] text-gold-light">
          Am Tisch
        </h2>
        <ul className="flex flex-col gap-2">
          {room.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-card border border-gold/30 bg-mahogany-dark/60 px-4 py-3"
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  p.isConnected ? 'bg-defending' : 'bg-cream-dim',
                )}
              />
              <span className="flex-1 truncate font-serif text-base text-cream">{p.name}</span>
              {p.id === room.ownerId ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-light">
                  Host
                </span>
              ) : null}
              {p.id === playerId ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-cream-dim">
                  Du
                </span>
              ) : null}
            </li>
          ))}
        </ul>

        {room.players.length < MIN_PLAYERS ? (
          <p className="text-sm italic text-cream-dim">
            Mindestens {MIN_PLAYERS} Spieler nötig. Lade Freunde ein:
          </p>
        ) : !isHost ? (
          <p className="text-sm italic text-cream-dim">Warte, bis der Host startet…</p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <ShareButton url={shareUrl} />
          {isHost ? (
            <BrassButton
              variant="primary"
              label="Spiel starten"
              onClick={handleStart}
              disabled={!canStart}
            />
          ) : null}
          <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
        </div>
      </section>
    </main>
  );
};
