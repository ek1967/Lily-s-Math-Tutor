import type { TopicId } from './curriculum';
import type { DayKey } from '@/lib/time';

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MasteryRecord {
  topicId: TopicId;
  level: MasteryLevel;
  /** SM-2 style ease factor, 1.3–2.8. Higher means she finds it easy. */
  ease: number;
  intervalDays: number;
  dueDate: DayKey;
  lastSeen: DayKey | null;
  /** Consecutive successful reviews. */
  streak: number;
  /** Times she has dropped back after knowing it. */
  lapses: number;
  totalAttempts: number;
  totalCorrect: number;
  skillStats: Record<string, { attempts: number; correct: number }>;
  /** Has she actually been taught this, or only met it in a diagnostic? */
  introduced: boolean;
  updatedAt: number;
}

export function newMastery(topicId: TopicId, today: DayKey, now: number): MasteryRecord {
  return {
    topicId,
    level: 0,
    ease: 2.5,
    intervalDays: 0,
    dueDate: today,
    lastSeen: null,
    streak: 0,
    lapses: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    skillStats: {},
    introduced: false,
    updatedAt: now,
  };
}
