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
        'flex w-full items-center gap-3 rounded-panel border border-line-subtle bg-bg-card/60 px-4 py-4 text-left transition-all',
        'active:scale-[0.995] active:bg-bg-card/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        (full || disabled) && 'pointer-events-none opacity-50',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg text-text-primary" style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
          {room.name}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <Users size={11} className="text-text-tertiary" strokeWidth={2} />
          <p className="font-mono text-[11px] text-text-secondary tnum">
            {room.players.length}/{room.maxPlayers}
          </p>
        </div>
      </div>
      {full ? (
        <span className="label-eyebrow">voll</span>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-haze text-accent">
          <ChevronRight size={18} strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
};
