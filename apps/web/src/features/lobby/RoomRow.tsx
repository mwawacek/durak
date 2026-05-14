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
        'group relative flex w-full min-h-14 items-center justify-between gap-3 overflow-hidden rounded-card border border-gold/30 bg-gradient-to-br from-mahogany/70 to-mahogany-dark/80 px-4 py-3.5 text-left transition-all',
        'active:scale-[0.99] active:from-mahogany-dark active:to-mahogany-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-light',
        (full || disabled) && 'pointer-events-none opacity-50',
      )}
    >
      {/* Left-edge gold rule */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-gold-light/0 via-gold/80 to-gold-light/0" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg italic text-cream">{room.name}</p>
        <p className="mt-0.5 font-display text-[10px] uppercase tracking-[0.3em] text-cream-dim">
          {room.players.length}/{room.maxPlayers} · Spieler
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.3em]',
          full ? 'text-cream-dim' : 'text-gold-light',
        )}
      >
        {full ? 'voll' : 'beitreten ›'}
      </span>
    </button>
  );
};
