/**
 * localStorage with the sharp edges removed. Reads can throw outright in
 * private windows and when a browser is set to block site data, so every access
 * is guarded and falls back to the supplied default rather than taking the app
 * down on start-up.
 */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object') return fallback;
    // Merge over the default so a field added in a later version is never undefined.
    return { ...fallback, ...(parsed as object) } as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota or blocked storage — the app keeps working with in-memory state. */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
