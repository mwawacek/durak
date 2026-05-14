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
        'flex w-full min-h-14 items-center justify-between gap-3 rounded-card border border-gold/30 bg-mahogany-dark/60 px-4 py-3 text-left transition-colors',
        'active:scale-[0.99] active:bg-mahogany-dark/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-light',
        (full || disabled) && 'pointer-events-none opacity-50',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-bold text-cream">{room.name}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-cream-dim">
          {room.players.length}/{room.maxPlayers} Spieler
        </p>
      </div>
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-gold-light">
        {full ? 'voll' : 'beitreten ›'}
      </span>
    </button>
  );
};
