import { db } from '../db';
import type { MaterialPage, UploadedMaterial } from '@/types/material';
import type { TopicId } from '@/types/curriculum';

/** Blobs live only in `pages`, so the list view renders without touching them
 *  and pruning old pixels is a single-table operation. */
export async function saveMaterial(
  material: UploadedMaterial,
  pages: readonly Omit<MaterialPage, 'id' | 'materialId'>[],
): Promise<void> {
  await db.transaction('rw', db.materials, db.pages, async () => {
    await db.materials.put(material);
    await db.pages.bulkPut(
      pages.map((page, index) => ({
        ...page,
        index,
        id: `${material.id}:${index}`,
        materialId: material.id,
      })),
    );
  });
}

export async function listMaterials(limit = 50): Promise<UploadedMaterial[]> {
  return db.materials.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function getMaterial(id: string): Promise<UploadedMaterial | undefined> {
  return db.materials.get(id);
}

export async function getPages(materialId: string): Promise<MaterialPage[]> {
  const rows = await db.pages.where('materialId').equals(materialId).toArray();
  return rows.sort((a, b) => a.index - b.index);
}

export async function updateMaterial(
  id: string,
  patch: Partial<UploadedMaterial>,
): Promise<void> {
  await db.materials.update(id, { ...patch, updatedAt: Date.now() });
}

/** Takes the worksheet's conversations with it: a thread titled after a
 *  deleted worksheet is a dead link in her chat history. */
export async function deleteMaterial(id: string): Promise<void> {
  await db.transaction('rw', db.materials, db.pages, db.threads, db.messages, async () => {
    await db.pages.where('materialId').equals(id).delete();
    const threadIds = await db.threads.where('materialId').equals(id).primaryKeys();
    if (threadIds.length > 0) {
      await db.messages.where('threadId').anyOf(threadIds).delete();
      await db.threads.bulkDelete(threadIds);
    }
    await db.materials.delete(id);
  });
}

export async function materialsForTopic(topicId: TopicId): Promise<UploadedMaterial[]> {
  return db.materials.where('detectedTopicIds').equals(topicId).toArray();
}

/** Total bytes held by uploads, for the storage meter on the parent screen. */
export async function materialBytes(): Promise<number> {
  const all = await db.materials.toArray();
  return all.reduce((sum, m) => sum + m.bytes, 0);
}
