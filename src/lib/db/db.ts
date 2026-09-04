import Dexie, { type Table } from 'dexie';
import type { TopicId } from '@/types/curriculum';
import type { LessonContent } from '@/types/content';
import type { MasteryRecord } from '@/types/mastery';
import type { Attempt, StudySession } from '@/types/session';
import type { MaterialPage, UploadedMaterial } from '@/types/material';
import type { ChatMessage, ChatThread } from '@/types/chat';

export interface CachedLesson extends LessonContent {
  cachedAt: number;
}

export interface KvRow {
  key: string;
  value: unknown;
}

/**
 * Everything she does lives here, on her device. There is no server.
 *
 * Two rules that are easy to break and painful to find later:
 *   - Never index a boolean. IndexedDB throws on boolean keys, which is why
 *     Attempt.correct is 0 | 1.
 *   - Schema versions are additive only. A version() block that has shipped is
 *     never edited — a new one is added with an upgrade function.
 */
export class TutorDB extends Dexie {
  mastery!: Table<MasteryRecord, TopicId>;
  sessions!: Table<StudySession, string>;
  attempts!: Table<Attempt, number>;
  materials!: Table<UploadedMaterial, string>;
  pages!: Table<MaterialPage, string>;
  threads!: Table<ChatThread, string>;
  messages!: Table<ChatMessage, number>;
  lessonCache!: Table<CachedLesson, TopicId>;
  kv!: Table<KvRow, string>;

  constructor(name = 'lily-math-tutor') {
    super(name);
    this.version(1).stores({
      mastery: 'topicId, dueDate, level, updatedAt, [dueDate+level]',
      sessions: 'id, startedAt, kind, outcome, [kind+startedAt]',
      attempts: '++id, sessionId, topicId, at, generatorId, [topicId+at], *skills',
      // The only table holding blobs, so pruning is a single-table operation.
      materials: 'id, createdAt, status, *detectedTopicIds',
      pages: 'id, materialId, [materialId+index]',
      threads: 'id, updatedAt, kind, topicId, materialId',
      messages: '++id, threadId, [threadId+createdAt]',
      lessonCache: 'topicId, cachedAt',
      kv: 'key',
    });
  }
}

export const db = new TutorDB();
