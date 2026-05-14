import type { PlayerPublic } from '@durak/shared';
import { cn } from '@/lib/cn';

interface Props {
  player: PlayerPublic;
  isOwner: boolean;
  isMe: boolean;
  /** "compact" drops the row padding for the lobby MyRoomPanel layout. */
  variant?: 'compact' | 'panel';
}

/**
 * One row in the at-the-table player list. Used by both `MyRoomPanel` (in
 * the lobby) and `WaitingRoom`. `variant` switches between the dense
 * lobby look and the standalone glass-panel look.
 */
export const PlayerListItem = ({
  player,
  isOwner,
  isMe,
  variant = 'compact',
}: Props): JSX.Element => {
  const wrapperClass =
    variant === 'panel'
      ? 'flex items-center gap-3 rounded-panel border border-line-subtle bg-bg-card/60 px-4 py-3.5'
      : 'flex items-center gap-2.5';
  const nameSize = variant === 'panel' ? 'text-[15px]' : 'text-[15px]';
  return (
    <div className={wrapperClass}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'panel' && 'h-2 w-2',
          player.isConnected ? 'bg-accent' : 'bg-text-tertiary',
        )}
      />
      <span className={cn('flex-1 truncate font-sans text-text-primary', nameSize)}>
        {player.name}
      </span>
      {isOwner ? <span className="label-eyebrow">Host</span> : null}
      {isMe ? <span className="label-eyebrow">Du</span> : null}
    </div>
  );
};
