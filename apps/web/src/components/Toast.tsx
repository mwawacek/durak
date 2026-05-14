import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

/**
 * Spec'd toast: a small pill anchored about 180 px above the bottom edge,
 * auto-dismissed. Quiet but legible.
 */
export const Toast = ({ durationMs = 1800 }: { durationMs?: number }): JSX.Element => {
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
      className="pointer-events-none fixed inset-x-0 bottom-[180px] z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {visible ? (
          <motion.div
            key={visible}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="rounded-pill border border-line-mid bg-[rgba(20,18,15,0.94)] px-4 py-2 font-sans text-[11.5px] font-medium leading-none text-text-primary shadow-toast"
          >
            {visible}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
