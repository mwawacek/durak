import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

/**
 * Global, store-driven toast. Reads `lastError`, shows it for `durationMs`,
 * then clears it. New errors interrupt the current one. Anchored below the
 * top safe area so it never sits under the iOS notch.
 */
export const Toast = ({ durationMs = 3000 }: { durationMs?: number }): JSX.Element => {
  const message = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);
  const [visible, setVisible] = useState<string | null>(message);

  // Track the most recent message generation so a stale dismiss doesn't wipe
  // a fresh one that arrived during the previous fade-out.
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
            className="mt-2 max-w-md rounded-md border border-gold/40 border-l-4 border-l-red bg-mahogany-dark/90 px-4 py-3 text-sm text-cream shadow-card"
          >
            {visible}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
