/**
 * Tiny typed LocalStorage wrapper for the three keys we persist:
 *   - name      → player display name across sessions
 *   - playerId  → server-assigned ID (used to detect reconnect grace-period hits)
 *   - lastRoom  → room ID for re-entering an in-progress game on reload
 *
 * Each value is stringified plain (no JSON), which keeps the storage tab in
 * devtools human-readable and avoids parse failures from old shapes.
 */

const KEYS = {
  name: 'durak.name',
  playerId: 'durak.playerId',
  lastRoom: 'durak.lastRoom',
} as const;

const safeGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string | null): void => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — silently ignored */
  }
};

export const persistence = {
  getName: () => safeGet(KEYS.name),
  setName: (v: string | null) => safeSet(KEYS.name, v),
  getPlayerId: () => safeGet(KEYS.playerId),
  setPlayerId: (v: string | null) => safeSet(KEYS.playerId, v),
  getLastRoom: () => safeGet(KEYS.lastRoom),
  setLastRoom: (v: string | null) => safeSet(KEYS.lastRoom, v),
} as const;
