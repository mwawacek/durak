import { useEffect, useState } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

const read = (): WindowSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

/**
 * Reactive window size. Listens to `resize`. Returns CSS pixels in landscape
 * and portrait alike. iOS Safari may report different values depending on
 * whether the URL bar is collapsed — callers should pair this with
 * `min-h-dvh` for layout stability.
 */
export const useWindowSize = (): WindowSize => {
  const [size, setSize] = useState<WindowSize>(() =>
    typeof window === 'undefined' ? { width: 0, height: 0 } : read(),
  );

  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
};
