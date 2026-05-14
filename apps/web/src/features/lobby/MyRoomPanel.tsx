import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
    <section className="glass-strong relative overflow-hidden rounded-card p-5">
      {/* Crimson accent rail */}
      <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-crimson-400 via-crimson-500 to-amber-400" />

      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.4em] text-amber-300">
          Dein Tisch
        </h2>
        <p className="flex-1 truncate font-display text-lg leading-tight text-bone">{room.name}</p>
        <span className="rounded-pill bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-bone-mute tnum">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {room.players.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                p.isConnected
                  ? 'bg-mint-400 shadow-[0_0_8px_rgba(94,234,212,0.5)]'
                  : 'bg-bone-ghost',
              )}
            />
            <span className="flex-1 truncate font-sans text-base text-bone">{p.name}</span>
            {p.id === room.ownerId ? (
              <span className="rounded-pill bg-amber-400/15 px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Host
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {!canStart && room.players.length < MIN_PLAYERS ? (
        <p className="mt-4 font-sans text-sm text-bone-mute">
          Mindestens {MIN_PLAYERS} Spieler nötig — teile den Link.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <BrassButton
          variant="primary"
          label="Zum Tisch"
          icon={<ChevronRight size={14} strokeWidth={2.5} />}
          onClick={handleEnter}
        />
        <BrassButton variant="secondary" label="Verlassen" onClick={handleLeave} />
      </div>
    </section>
  );
};
