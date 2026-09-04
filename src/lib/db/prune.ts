import { db } from './db';
import { getKv, setKv } from './repos/kvRepo';

/**
 * Keeping the device from filling up.
 *
 * Worksheet photos are the only thing here that grows without bound — measured
 * at roughly 53 MB after a term, against a few hundred KB for everything else
 * put together. They are also the only part that is genuinely replaceable: the
 * exercise checklist, the ticks, the tutor conversation about each question and
 * a thumbnail all survive. Only the full-resolution pixels go.
 *
 * A worksheet from two months ago is essentially never opened again, and losing
 * its photo costs nothing next to the app being unable to save anything new.
 */
export const PIXEL_RETENTION_DAYS = 60;

const LAST_PRUNE_KEY = 'lastPruneAt';
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface PruneResult {
  materials: number;
  pages: number;
  bytesFreed: number;
}

const EMPTY: PruneResult = { materials: 0, pages: 0, bytesFreed: 0 };

/**
 * Drops page images for worksheets older than the retention window. The
 * `materials` row stays, with `pagesPruned` set so the viewer can say what
 * happened rather than showing a broken gallery.
 */
export async function prunePixels(
  now = Date.now(),
  retentionDays = PIXEL_RETENTION_DAYS,
): Promise<PruneResult> {
  const cutoff = now - retentionDays * 86_400_000;

  try {
    const stale = (await db.materials.toArray()).filter(
      (m) => m.createdAt < cutoff && !m.pagesPruned,
    );
    if (stale.length === 0) return EMPTY;

    let pages = 0;
    let bytesFreed = 0;

    await db.transaction('rw', db.materials, db.pages, async () => {
      for (const material of stale) {
        const count = await db.pages.where('materialId').equals(material.id).count();
        pages += count;
        // The size recorded at upload, rather than re-measuring the blobs: it
        // is the same number, already known, and does not depend on the
        // storage layer handing back a blob with a readable size.
        bytesFreed += material.bytes;
        await db.pages.where('materialId').equals(material.id).delete();
        await db.materials.update(material.id, { pagesPruned: true, updatedAt: now });
      }
    });

    return { materials: stale.length, pages, bytesFreed };
  } catch {
    return EMPTY;
  }
}

/** Runs at most once a day, so start-up never pays for it twice. */
export async function prunePixelsIfDue(now = Date.now()): Promise<PruneResult> {
  try {
    const last = (await getKv<number>(LAST_PRUNE_KEY)) ?? 0;
    if (now - last < PRUNE_INTERVAL_MS) return EMPTY;
    const result = await prunePixels(now);
    await setKv(LAST_PRUNE_KEY, now);
    return result;
  } catch {
    return EMPTY;
  }
}

/** Bytes held by worksheets whose pages are still on the device. */
export async function pixelBytes(): Promise<number> {
  try {
    const materials = await db.materials.toArray();
    return materials.filter((m) => !m.pagesPruned).reduce((sum, m) => sum + m.bytes, 0);
  } catch {
    return 0;
  }
}

/**
 * True when the device is close enough to full that the next upload is likely
 * to fail. A swallowed quota error is worse than a refusal: the worksheet
 * appears in the list with no pages behind it.
 */
export async function storageUnderPressure(threshold = 0.9): Promise<boolean> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota) return false;
    return (estimate.usage ?? 0) / estimate.quota > threshold;
  } catch {
    return false;
  }
}
