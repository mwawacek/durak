import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/cn';

/**
 * Tiny pill in the top-right corner showing socket connection state.
 * Sits inside the safe area; hidden once everything is fine and a game is
 * active (so it doesn't compete with the table).
 */
export const ConnectionBadge = (): JSX.Element | null => {
  const connected = useGameStore((s) => s.connected);
  const game = useGameStore((s) => s.game);

  // If everything is OK and we're mid-game, hide.
  if (connected && game) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-40 flex justify-end safe-pt safe-pr">
      <div
        className={cn(
          'flex items-center gap-2 rounded-pill border bg-mahogany-dark/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-cream shadow-card',
          connected ? 'border-gold/40' : 'border-red/60',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            connected ? 'bg-defending' : 'animate-pulse-outline bg-red',
          )}
        />
        {connected ? 'verbunden' : 'verbinden…'}
      </div>
    </div>
  );
};
