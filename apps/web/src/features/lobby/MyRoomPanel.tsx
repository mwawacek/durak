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
    <section className="rounded-card border border-gold/40 bg-mahogany-dark/70 p-4">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-light">
          Dein Tisch
        </h2>
        <p className="flex-1 truncate font-serif text-base italic text-cream">{room.name}</p>
        <span className="rounded-pill border border-gold/40 bg-mahogany-dark/70 px-2 py-0.5 text-[11px] font-bold text-gold-light">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {room.players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                p.isConnected ? 'bg-defending' : 'bg-cream-dim',
              )}
            />
            <span className="flex-1 truncate font-serif text-cream">{p.name}</span>
            {p.id === room.ownerId ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-light">
                Host
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <BrassButton variant="primary" label="Zum Tisch" onClick={handleEnter} />
        {!canStart && room.players.length < MIN_PLAYERS ? (
          <p className="basis-full text-xs italic text-cream-dim">
            Mindestens {MIN_PLAYERS} Spieler nötig — teile den Link mit Freunden.
          </p>
        ) : null}
        <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
      </div>
    </section>
  );
};
