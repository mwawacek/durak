import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const DEFAULT_DURATION_MS = 1800;
const ENTRANCE_DURATION_S = 0.16;

/**
 * Toast pill anchored ~180 px above the bottom edge, auto-dismissed.
 * The motion key uses a monotonically increasing generation token so two
 * identical-message toasts in a row still animate (the previous exit
 * doesn't collapse the next entrance).
 */
export const Toast = ({
  durationMs = DEFAULT_DURATION_MS,
}: {
  durationMs?: number;
}): JSX.Element => {
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
          <m.div
            key={genRef.current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: ENTRANCE_DURATION_S }}
            className="rounded-pill border border-line-mid bg-bg-card/95 px-4 py-2 font-sans text-[11.5px] font-medium leading-none text-text-primary shadow-toast"
          >
            {visible}
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
