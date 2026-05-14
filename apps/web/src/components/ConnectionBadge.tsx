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
          'flex items-center gap-2 rounded-pill border bg-mahogany-dark/85 px-3 py-1 font-display text-[9px] font-bold uppercase tracking-[0.3em] shadow-card backdrop-blur-sm',
          connected ? 'border-gold/40 text-cream-dim' : 'border-red/60 text-red-count',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            connected
              ? 'bg-defending shadow-[0_0_6px_rgba(95,189,131,0.7)]'
              : 'animate-pulse-outline bg-red shadow-[0_0_6px_rgba(200,58,54,0.6)]',
          )}
        />
        {connected ? 'verbunden' : 'verbinden …'}
      </div>
    </div>
  );
};
