import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SOCKET_EVENTS, type RoomPublic, MIN_PLAYERS } from '@durak/shared';
import { useGameStore } from '@/store/gameStore';
import { emitAckOrToast } from '@/services/socket';
import { BrassButton } from '@/components/BrassButton';
import { PlayerListItem } from './PlayerListItem';

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
    <section className="rounded-panel border border-line-mid bg-bg-card/60 p-5">
      <div className="flex items-baseline gap-3">
        <span className="label-eyebrow text-accent">Dein Tisch</span>
        <p
          className="flex-1 truncate font-serif text-lg text-text-primary"
          style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
        >
          {room.name}
        </p>
        <span className="rounded-pill border border-line-subtle bg-white/[0.04] px-2 py-0.5 font-mono text-[10.5px] text-text-secondary tnum">
          {room.players.length}/{room.maxPlayers}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {room.players.map((p) => (
          <li key={p.id}>
            <PlayerListItem
              player={p}
              isOwner={p.id === room.ownerId}
              isMe={p.id === playerId}
              variant="compact"
            />
          </li>
        ))}
      </ul>

      {!canStart && room.players.length < MIN_PLAYERS ? (
        <p className="mt-4 font-sans text-sm text-text-secondary">
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
