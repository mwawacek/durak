import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/cn';

/**
 * Tiny corner pill — only visible while the socket isn't fully up. Once a
 * game is active and we're connected, it hides so it doesn't compete with
 * the play area.
 */
export const ConnectionBadge = (): JSX.Element | null => {
  const connected = useGameStore((s) => s.connected);
  const game = useGameStore((s) => s.game);

  if (connected && game) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-40 flex justify-end safe-pt safe-pr">
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-pill border bg-bg-card/80 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur',
          connected ? 'border-line-mid text-text-tertiary' : 'border-accent/30 text-accent',
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            connected ? 'bg-text-secondary' : 'animate-pulse-ring bg-accent',
          )}
        />
        {connected ? 'verbunden' : 'verbinde'}
      </div>
    </div>
  );
};
