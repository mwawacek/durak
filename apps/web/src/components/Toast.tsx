import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

/**
 * Global, store-driven toast banner. Reads `lastError`, shows it for
 * `durationMs`, then clears. New errors interrupt the current one.
 *
 * "Midnight Velvet" look: glass card with a crimson left edge and a
 * small alert icon. Anchored below the top safe area.
 */
export const Toast = ({ durationMs = 3000 }: { durationMs?: number }): JSX.Element => {
  const message = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);
  const [visible, setVisible] = useState<string | null>(message);
  const genRef = useRef(0);

  useEffect(() => {
    if (!message) return;
    setVisible(message);
    const myGen = ++genRef.current;
    const t = window.setTimeout(() => {
      if (genRef.current !== myGen) return;
      setVisible(null);
      setError(null);
    }, durationMs);
    return () => window.clearTimeout(t);
  }, [message, durationMs, setError]);

  return (
    <div
      className="pointer-events-none fixed inset-x-3 z-50 flex justify-center safe-pt"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {visible ? (
          <motion.div
            key={visible}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass-strong mt-2 inline-flex max-w-md items-start gap-2.5 rounded-card px-4 py-3 text-sm text-bone shadow-raised"
            style={{
              borderLeft: '3px solid #ff3b5f',
            }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-crimson-400" />
            <span className="font-sans leading-snug">{visible}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
