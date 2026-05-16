/**
 * Shared motion primitives. The codebase had ~7 inline copies of the same
 * cubic-bezier and stagger constants — centralised here so a designer can
 * retune the feel by editing one file.
 */
export const EASE_OUT_EXPO = [0.2, 0.7, 0.2, 1] as const;
export const STAGGER_STEP = 0.05;
