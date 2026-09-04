import { db } from '../db';
import type { TopicId } from '@/types/curriculum';
import { newMastery, type MasteryRecord } from '@/types/mastery';
import type { AttemptRecord } from '@/lib/practice/engine';
import { gradeAttempts } from '@/lib/srs/grading';
import { schedule } from '@/lib/srs/sm2lite';
import { dayKey, type DayKey } from '@/lib/time';

/**
 * All database access goes through repos — no component touches `db` directly.
 * That seam is what would let a sync backend be added later without rewriting
 * any UI.
 */

export async function getMastery(topicId: TopicId): Promise<MasteryRecord | undefined> {
  return db.mastery.get(topicId);
}

export async function getAllMastery(): Promise<MasteryRecord[]> {
  return db.mastery.toArray();
}

export async function getMasteryMap(): Promise<Map<TopicId, MasteryRecord>> {
  return new Map((await getAllMastery()).map((m) => [m.topicId, m]));
}

/** Topics whose review date has arrived, soonest and weakest first. */
export async function getDueTopics(today: DayKey = dayKey()): Promise<MasteryRecord[]> {
  const rows = await db.mastery.where('dueDate').belowOrEqual(today).toArray();
  return rows
    .filter((m) => m.introduced)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.level - b.level);
}

export async function markIntroduced(
  topicId: TopicId,
  now = Date.now(),
): Promise<MasteryRecord> {
  const today = dayKey(now);
  const existing = (await getMastery(topicId)) ?? newMastery(topicId, today, now);
  const next: MasteryRecord = { ...existing, introduced: true, updatedAt: now };
  await db.mastery.put(next);
  return next;
}

/**
 * Folds a finished set of attempts into the topic's mastery record: updates the
 * counters and skill stats, then reschedules.
 */
export async function applyAttempts(
  topicId: TopicId,
  attempts: readonly AttemptRecord[],
  now = Date.now(),
): Promise<MasteryRecord | null> {
  if (attempts.length === 0) return null;
  const today = dayKey(now);
  const prev = (await getMastery(topicId)) ?? newMastery(topicId, today, now);

  const skillStats = { ...prev.skillStats };
  for (const a of attempts) {
    for (const skill of a.skills) {
      const s = skillStats[skill] ?? { attempts: 0, correct: 0 };
      skillStats[skill] = { attempts: s.attempts + 1, correct: s.correct + a.correct };
    }
  }

  const counted: MasteryRecord = {
    ...prev,
    introduced: true,
    totalAttempts: prev.totalAttempts + attempts.length,
    totalCorrect: prev.totalCorrect + attempts.filter((a) => a.correct === 1).length,
    skillStats,
  };

  const next = schedule(counted, { quality: gradeAttempts(attempts), today, now });
  await db.mastery.put(next);
  return next;
}

export async function putMastery(record: MasteryRecord): Promise<void> {
  await db.mastery.put(record);
}
