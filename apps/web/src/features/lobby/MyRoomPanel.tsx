import { useNavigate } from 'react-router-dom';
import { SOCKET_EVENTS, type RoomPublic, MIN_PLAYERS } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { cn } from '@/lib/cn';

interface Props {
  room: RoomPublic;
}

export const MyRoomPanel = ({ room }: Props): JSX.Element => {
  const playerId = useGameStore((s) => s.playerId);
  const navigate = useNavigate();
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const isHost = room.ownerId === playerId;
  const canStart = isHost && room.players.length >= MIN_PLAYERS;

  const handleEnter = () => {
    setCurrentRoom(room.id);
    navigate(`/r/${room.id}`);
  };

  const handleLeave = async () => {
    const ok = await emitAckOrToast(SOCKET_EVENTS.LEAVE_ROOM, { roomId: room.id });
    if (ok !== null) setCurrentRoom(null);
  };

  return (
    <section className="relative overflow-hidden rounded-card border border-gold/45 bg-gradient-to-br from-mahogany/80 to-mahogany-dark/95 p-5 shadow-card">
      {/* Engraved double border */}
      <div className="pointer-events-none absolute inset-1.5 rounded-[0.4rem] border border-gold/20" />

      <div className="relative flex items-baseline gap-3">
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-gold-light">
          Dein Tisch
        </h2>
        <p className="flex-1 truncate font-serif text-xl italic text-cream">{room.name}</p>
        <span className="rounded-pill border border-gold/40 bg-mahogany-dark/70 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-widest text-gold-light">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <ul className="relative mt-4 flex flex-col gap-2">
        {room.players.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                'h-2 w-2 rounded-full ring-2 ring-offset-2 ring-offset-mahogany-dark',
                p.isConnected ? 'bg-defending ring-defending/30' : 'bg-cream-dim ring-cream-dim/20',
              )}
            />
            <span className="flex-1 truncate font-serif italic text-base text-cream">{p.name}</span>
            {p.id === room.ownerId ? (
              <span className="font-display text-[9px] font-bold uppercase tracking-[0.3em] text-gold-light">
                Host
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <BrassButton variant="primary" label="Zum Tisch" onClick={handleEnter} />
        <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
        {!canStart && room.players.length < MIN_PLAYERS ? (
          <p className="basis-full font-serif text-sm italic text-cream-dim">
            Mindestens {MIN_PLAYERS} Spieler nötig — teile den Link mit Freunden.
          </p>
        ) : null}
      </div>
    </section>
  );
};
