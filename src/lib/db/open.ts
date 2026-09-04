import { db } from './db';

/**
 * Opening the database can genuinely fail — a private window, a browser set to
 * block site data, or a corrupted store. None of that should take the app down:
 * the practice loop works from memory, and losing saved progress is worth
 * telling her about rather than crashing on.
 */
export type DbStatus = 'ok' | 'unavailable';

let status: DbStatus | null = null;

export async function openDb(): Promise<DbStatus> {
  if (status) return status;
  try {
    await db.open();
    status = 'ok';
  } catch {
    status = 'unavailable';
  }
  return status;
}

export const dbStatus = (): DbStatus | null => status;

/**
 * Asks the browser to keep this origin's storage. Safari evicts IndexedDB for
 * sites not used for about a week, which would wipe months of progress — and
 * the request is far more likely to be granted after real engagement than on
 * first load, so this is called after she finishes a session, not at start-up.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Whether the browser has agreed to keep this origin's storage.
 *
 * Read separately from requesting it, because the answer is worth showing: an
 * origin without persistence can be cleared after about a week unused, and a
 * parent who can see that is a parent who will make a backup.
 */
export async function isPersisted(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persisted) return null;
    return await navigator.storage.persisted();
  } catch {
    return null;
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est) return null;
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  } catch {
    return null;
  }
}
