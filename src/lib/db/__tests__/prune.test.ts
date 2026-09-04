import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/db';
import { PIXEL_RETENTION_DAYS, prunePixels, prunePixelsIfDue } from '@/lib/db/prune';
import { asTopicId } from '@/types/curriculum';
import type { UploadedMaterial } from '@/types/material';

const NOW = Date.UTC(2026, 8, 4, 12);
const DAY = 86_400_000;

const material = (id: string, ageDays: number): UploadedMaterial => ({
  id,
  kind: 'image',
  titleHe: `דף ${id}`,
  createdAt: NOW - ageDays * DAY,
  updatedAt: NOW - ageDays * DAY,
  pageCount: 2,
  bytes: 800_000,
  status: 'done',
  detectedTopicIds: [asTopicId('num-fractions-add-sub')],
  exercises: [{ labelHe: '1', promptHe: 'תרגיל', done: true }],
  thumbDataUrl: 'data:image/jpeg;base64,AA',
});

async function addPages(materialId: string, count: number) {
  for (let i = 0; i < count; i += 1) {
    await db.pages.put({
      id: `${materialId}:${i}`,
      materialId,
      index: i,
      width: 1200,
      height: 1600,
      blob: new Blob([new Uint8Array(1000)], { type: 'image/jpeg' }),
    });
  }
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

/**
 * Worksheet photos are the only thing that grows without bound, and the only
 * thing here that is genuinely replaceable. Everything that carries meaning —
 * the checklist, the ticks, the conversation — has to survive.
 */
describe('pruning worksheet pixels', () => {
  it('drops pages for worksheets past the retention window', async () => {
    await db.materials.put(material('old', PIXEL_RETENTION_DAYS + 5));
    await addPages('old', 3);

    const result = await prunePixels(NOW);
    expect(result.materials).toBe(1);
    expect(result.pages).toBe(3);
    expect(result.bytesFreed).toBeGreaterThan(0);
    expect(await db.pages.count()).toBe(0);
  });

  it('keeps the checklist, the ticks and the thumbnail', async () => {
    await db.materials.put(material('old', PIXEL_RETENTION_DAYS + 1));
    await addPages('old', 2);

    await prunePixels(NOW);
    const kept = await db.materials.get('old');
    expect(kept).toBeDefined();
    expect(kept!.exercises[0]!.done).toBe(true);
    expect(kept!.thumbDataUrl).not.toBe('');
    expect(kept!.pagesPruned).toBe(true);
  });

  it('leaves recent worksheets alone', async () => {
    await db.materials.put(material('recent', 10));
    await addPages('recent', 2);

    expect((await prunePixels(NOW)).materials).toBe(0);
    expect(await db.pages.count()).toBe(2);
  });

  it('never prunes the same worksheet twice', async () => {
    await db.materials.put(material('old', 90));
    await addPages('old', 2);
    await prunePixels(NOW);
    expect((await prunePixels(NOW)).materials).toBe(0);
  });

  it('does nothing when there is nothing to do', async () => {
    expect(await prunePixels(NOW)).toEqual({ materials: 0, pages: 0, bytesFreed: 0 });
  });

  it('runs at most once a day', async () => {
    await db.materials.put(material('old', 90));
    await addPages('old', 1);

    expect((await prunePixelsIfDue(NOW)).materials).toBe(1);

    await db.materials.put(material('old2', 90));
    await addPages('old2', 1);
    // Same day: skipped entirely, so start-up never pays for it twice.
    expect((await prunePixelsIfDue(NOW + 1000)).materials).toBe(0);
    expect((await prunePixelsIfDue(NOW + 2 * DAY)).materials).toBe(1);
  });
});
