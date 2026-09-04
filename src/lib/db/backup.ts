import { db } from './db';
import { readJson } from '@/lib/storage';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';
import { blobToBase64 } from '@/lib/files/imagePipeline';

/**
 * Export and import.
 *
 * This is the single most important feature on the parent screen, and it is
 * not obvious why until it happens: Safari evicts IndexedDB for sites unused
 * for about a week, which would silently erase months of work. The device is a
 * cache; the exported file is the record.
 *
 * The API key is deliberately excluded. A backup file gets emailed to
 * yourself, dropped in a shared folder, or sent to another parent — none of
 * which should carry a live credential.
 */
export const BACKUP_VERSION = 1;

export interface BackupFile {
  version: number;
  exportedAt: number;
  settings: AppSettings;
  mastery: unknown[];
  sessions: unknown[];
  attempts: unknown[];
  threads: unknown[];
  messages: unknown[];
  lessonCache: unknown[];
  kv: unknown[];
  materials: unknown[];
  /** Page images, base64 encoded — blobs cannot survive JSON. */
  pages: { id: string; materialId: string; index: number; width: number; height: number; jpeg: string }[];
}

export async function exportAll(includePages = true): Promise<BackupFile> {
  const [mastery, sessions, attempts, threads, messages, lessonCache, kv, materials, pageRows] =
    await Promise.all([
      db.mastery.toArray(),
      db.sessions.toArray(),
      db.attempts.toArray(),
      db.threads.toArray(),
      db.messages.toArray(),
      db.lessonCache.toArray(),
      db.kv.toArray(),
      db.materials.toArray(),
      includePages ? db.pages.toArray() : Promise.resolve([]),
    ]);

  const pages = await Promise.all(
    pageRows.map(async (p) => ({
      id: p.id,
      materialId: p.materialId,
      index: p.index,
      width: p.width,
      height: p.height,
      jpeg: await blobToBase64(p.blob),
    })),
  );

  return {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    settings: readJson<AppSettings>('lmt.settings.v1', DEFAULT_SETTINGS),
    mastery,
    sessions,
    attempts,
    threads,
    messages,
    lessonCache,
    kv,
    materials,
    pages,
  };
}

function base64ToBlob(base64: string, type = 'image/jpeg'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export interface ImportSummary {
  mastery: number;
  attempts: number;
  sessions: number;
  materials: number;
  messages: number;
}

/**
 * Replaces the contents of each table. Importing is a restore, not a merge:
 * merging two divergent histories of the same student produces double-counted
 * attempts and a nonsensical schedule, and "restore my backup" is what anyone
 * doing this actually means.
 */
export async function importAll(file: BackupFile): Promise<ImportSummary> {
  if (file.version !== BACKUP_VERSION) {
    throw new Error(`unsupported backup version: ${file.version}`);
  }

  await db.transaction(
    'rw',
    [db.mastery, db.sessions, db.attempts, db.threads, db.messages, db.lessonCache, db.kv, db.materials, db.pages],
    async () => {
      await Promise.all([
        db.mastery.clear(), db.sessions.clear(), db.attempts.clear(),
        db.threads.clear(), db.messages.clear(), db.lessonCache.clear(),
        db.kv.clear(), db.materials.clear(), db.pages.clear(),
      ]);

      await db.mastery.bulkPut(file.mastery as never[]);
      await db.sessions.bulkPut(file.sessions as never[]);
      await db.attempts.bulkPut(file.attempts as never[]);
      await db.threads.bulkPut(file.threads as never[]);
      await db.messages.bulkPut(file.messages as never[]);
      await db.lessonCache.bulkPut(file.lessonCache as never[]);
      await db.kv.bulkPut(file.kv as never[]);
      await db.materials.bulkPut(file.materials as never[]);
      await db.pages.bulkPut(
        file.pages.map((p) => ({
          id: p.id,
          materialId: p.materialId,
          index: p.index,
          width: p.width,
          height: p.height,
          blob: base64ToBlob(p.jpeg),
        })),
      );
    },
  );

  return {
    mastery: file.mastery.length,
    attempts: file.attempts.length,
    sessions: file.sessions.length,
    materials: file.materials.length,
    messages: file.messages.length,
  };
}

export function backupFilename(at = Date.now()): string {
  return `lily-math-${new Date(at).toISOString().slice(0, 10)}.json`;
}

/** Validates a file well enough to refuse an obviously wrong one. */
export function parseBackup(raw: string): BackupFile | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (typeof data !== 'object' || data === null) return null;
    const d = data as Record<string, unknown>;
    if (typeof d['version'] !== 'number') return null;
    if (!Array.isArray(d['mastery']) || !Array.isArray(d['attempts'])) return null;
    return data as BackupFile;
  } catch {
    return null;
  }
}
