/**
 * Tiny dev-only console wrapper. In production builds (`import.meta.env.PROD`)
 * the methods become no-ops to keep the bundle quiet. Spec rule: no raw
 * console.log in production paths.
 */
const isProd = import.meta.env.PROD;

export const log = {
  debug: (...args: unknown[]): void => {
    if (!isProd) console.debug('[durak]', ...args);
  },
  info: (...args: unknown[]): void => {
    if (!isProd) console.info('[durak]', ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn('[durak]', ...args);
  },
  error: (...args: unknown[]): void => {
    console.error('[durak]', ...args);
  },
} as const;
