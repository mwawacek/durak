import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/cn';

/**
 * Tiny glass pill in the top-right corner showing socket connection state.
 * Hidden once everything is fine and a game is active so it doesn't compete
 * with the table.
 */
export const ConnectionBadge = (): JSX.Element | null => {
  const connected = useGameStore((s) => s.connected);
  const game = useGameStore((s) => s.game);

  if (connected && game) return null;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-40 flex justify-end safe-pt safe-pr">
      <div
        className={cn(
          'glass-bare flex items-center gap-2 rounded-pill px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-[0.18em]',
          connected ? 'text-bone-mute' : 'text-crimson-400',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            connected
              ? 'bg-mint-400 shadow-[0_0_10px_rgba(94,234,212,0.7)]'
              : 'animate-pulse-ring bg-crimson-500 shadow-[0_0_10px_rgba(255,59,95,0.7)]',
          )}
        />
        {connected ? 'verbunden' : 'verbinde …'}
      </div>
    </div>
  );
};
