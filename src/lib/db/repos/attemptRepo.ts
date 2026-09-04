import { db } from '../db';
import type { TopicId } from '@/types/curriculum';
import type { Attempt } from '@/types/session';
import type { AttemptRecord } from '@/lib/practice/engine';
import { dayKey, type DayKey } from '@/lib/time';

export async function saveAttempts(
  sessionId: string,
  records: readonly AttemptRecord[],
): Promise<void> {
  if (records.length === 0) return;
  await db.attempts.bulkAdd(records.map((r) => ({ ...r, sessionId })));
}

export async function recentAttemptsForTopic(
  topicId: TopicId,
  limit = 12,
): Promise<Attempt[]> {
  const rows = await db.attempts.where('topicId').equals(topicId).toArray();
  return rows.sort((a, b) => b.at - a.at).slice(0, limit);
}

/** Distinct days on which she did anything — the streak is derived from this. */
export async function activeDays(): Promise<DayKey[]> {
  const all = await db.attempts.toArray();
  return [...new Set(all.map((a) => dayKey(a.at)))].sort();
}

export async function attemptsSince(sinceMs: number): Promise<Attempt[]> {
  return db.attempts.where('at').above(sinceMs).toArray();
}

export async function totalAttempts(): Promise<number> {
  return db.attempts.count();
}
