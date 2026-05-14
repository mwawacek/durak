import { ChevronRight, Users } from 'lucide-react';
import type { RoomPublic } from '@durak/shared';
import { cn } from '@/lib/cn';

interface Props {
  room: RoomPublic;
  onJoin: () => void;
  disabled?: boolean;
}

export const RoomRow = ({ room, onJoin, disabled }: Props): JSX.Element => {
  const full = room.players.length >= room.maxPlayers;
  return (
    <button
      type="button"
      onClick={onJoin}
      disabled={full || disabled}
      className={cn(
        'glass group flex w-full items-center gap-3 rounded-card px-4 py-4 text-left transition-all',
        'active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-bone',
        (full || disabled) && 'pointer-events-none opacity-50',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg leading-tight text-bone">{room.name}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <Users size={11} className="text-bone-ghost" strokeWidth={2.5} />
          <p className="font-mono text-[11px] text-bone-mute tnum">
            {room.players.length}/{room.maxPlayers}
          </p>
        </div>
      </div>
      {full ? (
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-bone-ghost">
          voll
        </span>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-crimson-500/15 text-crimson-400 transition-colors group-active:bg-crimson-500/30">
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
};
