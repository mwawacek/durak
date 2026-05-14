/**
 * Web Vibration API wrapper. Pattern is in milliseconds.
 * iOS Safari does not implement vibration — we silently no-op.
 * Android Chrome + Firefox support it. Treat it as an enhancement.
 */
export const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try {
    nav.vibrate?.(pattern);
  } catch {
    /* feature-flagged off or unsupported — ignore */
  }
};
