import { db, type CachedLesson } from '../db';
import type { LessonContent } from '@/types/content';
import type { TopicId } from '@/types/curriculum';

/** A generated lesson is written once and read from the device thereafter —
 *  it costs a request the first time and nothing ever again, and it works
 *  offline once it is there. */
export async function getCachedLesson(topicId: TopicId): Promise<CachedLesson | undefined> {
  return db.lessonCache.get(topicId);
}

export async function cacheLesson(lesson: LessonContent): Promise<void> {
  await db.lessonCache.put({ ...lesson, cachedAt: Date.now() });
}

export async function clearCachedLesson(topicId: TopicId): Promise<void> {
  await db.lessonCache.delete(topicId);
}
