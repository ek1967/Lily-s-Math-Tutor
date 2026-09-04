import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/db';
import { backupFilename, exportAll, importAll, parseBackup } from '@/lib/db/backup';
import { blobToBase64 } from '@/lib/files/imagePipeline';
import { asTopicId } from '@/types/curriculum';
import { asGeneratorId } from '@/types/exercise';
import { newMastery } from '@/types/mastery';

const TOPIC = asTopicId('num-fractions-add-sub');

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

/**
 * Safari evicts IndexedDB for sites unused for about a week. The device is a
 * cache; this file is the record — so a round trip has to be exact, including
 * the page images, which do not survive JSON without encoding.
 */
describe('backup round trip', () => {
  it('restores mastery, attempts and materials exactly', async () => {
    await db.mastery.put({ ...newMastery(TOPIC, '2026-09-04', 1), level: 3, totalAttempts: 12 });
    await db.attempts.add({
      sessionId: 's1',
      exerciseId: 'g#1',
      topicId: TOPIC,
      generatorId: asGeneratorId('num-fractions-add-sub/same-denominator'),
      seed: 1,
      skills: ['fractions.add'],
      given: '1/2',
      correct: 1,
      hintsUsed: 0,
      revealed: 0,
      msElapsed: 4000,
      at: 1_700_000_000_000,
    });

    const exported = await exportAll();
    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await db.mastery.count()).toBe(0);

    const summary = await importAll(exported);
    expect(summary.mastery).toBe(1);
    expect(summary.attempts).toBe(1);

    const restored = await db.mastery.get(TOPIC);
    expect(restored?.level).toBe(3);
    expect(restored?.totalAttempts).toBe(12);
    expect((await db.attempts.toArray())[0]!.correct).toBe(1);
  });

  it('restores material metadata and its checklist', async () => {
    await db.materials.put({
      id: 'm1',
      kind: 'image',
      titleHe: 'דף עבודה',
      createdAt: 1,
      updatedAt: 1,
      pageCount: 1,
      bytes: 5,
      status: 'working',
      detectedTopicIds: [TOPIC],
      exercises: [{ labelHe: '1', promptHe: 'תרגיל', done: true }],
      thumbDataUrl: 'data:image/jpeg;base64,AA',
    });

    const exported = await exportAll(false);
    await Promise.all(db.tables.map((t) => t.clear()));
    await importAll(exported);

    const restored = await db.materials.get('m1');
    expect(restored?.titleHe).toBe('דף עבודה');
    expect(restored?.exercises[0]?.done).toBe(true);
    expect(restored?.detectedTopicIds).toEqual([TOPIC]);
  });

  it('encodes and decodes a page image without losing a byte', async () => {
    // Exercised directly rather than through the database: fake-indexeddb's
    // structured clone hands back a Blob that jsdom will not accept as one, so
    // a round trip through storage tests the shim rather than this code.
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255]);
    const base64 = await blobToBase64(new Blob([bytes], { type: 'image/jpeg' }));
    expect(base64).toBe('AAEC+vv/');

    const decoded = atob(base64);
    expect([...decoded].map((c) => c.charCodeAt(0))).toEqual([...bytes]);
  });

  it('restores the settings, so a recovered device is not treated as new', async () => {
    // This is the bug that made the backup worthless: only the database came
    // back, `hasOnboarded` stayed false, the app redirected into onboarding,
    // and the placement check wrote over the history just recovered.
    localStorage.setItem(
      'lmt.settings.v1',
      JSON.stringify({ studentName: 'לילי', tutorName: 'מיה', hasOnboarded: true, themeColor: 'teal' }),
    );
    const exported = await exportAll(false);

    localStorage.clear();
    await importAll(exported);

    const restored = JSON.parse(localStorage.getItem('lmt.settings.v1')!);
    expect(restored.hasOnboarded).toBe(true);
    expect(restored.studentName).toBe('לילי');
    expect(restored.themeColor).toBe('teal');
  });

  it('marks a restored device as onboarded even if the file said otherwise', async () => {
    localStorage.setItem('lmt.settings.v1', JSON.stringify({ hasOnboarded: false }));
    const exported = await exportAll(false);
    localStorage.clear();
    await importAll(exported);
    expect(JSON.parse(localStorage.getItem('lmt.settings.v1')!).hasOnboarded).toBe(true);
  });

  it('carries the backup date and budget but never the PIN', async () => {
    // A hash of a four-digit code is broken in a second, and the file gets
    // sent over WhatsApp. The PIN guards nothing secret, so it is re-set.
    localStorage.setItem(
      'lmt.parent.v1',
      JSON.stringify({
        pinHash: 'deadbeef',
        pinSalt: 'cafe',
        lastExportAt: 1700000000000,
        monthlyBudgetAgorot: 7500,
      }),
    );
    const exported = await exportAll(false);
    expect(JSON.stringify(exported)).not.toContain('deadbeef');
    expect(JSON.stringify(exported)).not.toContain('cafe');
    expect(exported.parent).toEqual({ lastExportAt: 1700000000000, monthlyBudgetAgorot: 7500 });
  });

  it('keeps this device’s PIN when restoring', async () => {
    localStorage.setItem('lmt.parent.v1', JSON.stringify({ pinHash: 'x', pinSalt: 'y', lastExportAt: null, monthlyBudgetAgorot: 5000 }));
    const exported = await exportAll(false);
    await importAll(exported);
    const parent = JSON.parse(localStorage.getItem('lmt.parent.v1')!);
    expect(parent.pinHash).toBe('x');
  });

  it('still reads a backup written by the previous version', async () => {
    const exported = await exportAll(false);
    const v1 = { ...exported, version: 1 };
    delete (v1 as { parent?: unknown }).parent;
    await expect(importAll(v1)).resolves.toBeDefined();
  });

  it('leaves the API key out of the file', async () => {
    // A backup gets emailed to yourself or dropped in a shared folder; it must
    // never carry a live credential.
    localStorage.setItem('lmt.apiKey.v1', JSON.stringify({ key: 'sk-ant-secret' }));
    const exported = await exportAll();
    expect(JSON.stringify(exported)).not.toContain('sk-ant-secret');
  });

  it('replaces rather than merges', async () => {
    // Merging two divergent histories double-counts attempts and produces a
    // nonsensical schedule. "Restore my backup" means restore.
    const empty = await exportAll();
    await db.mastery.put(newMastery(TOPIC, '2026-09-04', 1));
    expect(await db.mastery.count()).toBe(1);
    await importAll(empty);
    expect(await db.mastery.count()).toBe(0);
  });

  it('can skip page images for a smaller file', async () => {
    expect((await exportAll(false)).pages).toEqual([]);
  });

  it('refuses a backup from a future version', async () => {
    const exported = await exportAll();
    await expect(importAll({ ...exported, version: 99 })).rejects.toThrow();
  });
});

describe('reading a backup file', () => {
  it('accepts a well-formed file', () => {
    const raw = JSON.stringify({ version: 1, mastery: [], attempts: [] });
    expect(parseBackup(raw)).not.toBeNull();
  });

  it('rejects anything else', () => {
    for (const raw of ['', 'not json', '{}', '[]', '{"version":"1"}', 'null']) {
      expect(parseBackup(raw), raw).toBeNull();
    }
  });

  it('names the file by date', () => {
    expect(backupFilename(Date.UTC(2026, 8, 4))).toBe('lily-math-2026-09-04.json');
  });
});
