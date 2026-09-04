import type { MasteryLevel, MasteryRecord } from '@/types/mastery';
import { addDays, type DayKey } from '@/lib/time';

/**
 * A cut-down SM-2. Full SM-2 is tuned for flashcards answered in seconds; a
 * maths topic is worked for ten minutes and gets revisited, so the ladder is
 * shorter and the drop after a bad session is gentler than a full reset —
 * losing months of progress over one distracted evening would be both unfair
 * and demoralising.
 */

/** Base interval in days at each level. */
export const BASE_INTERVALS: readonly number[] = [0, 1, 3, 7, 16, 35];

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;

/** Quality below this counts as a failed review. */
export const PASS_THRESHOLD = 3;

export interface ReviewOutcome {
  /** 0–5, from grading.ts. */
  quality: number;
  today: DayKey;
  now: number;
}

export function schedule(prev: MasteryRecord, outcome: ReviewOutcome): MasteryRecord {
  const { quality, today, now } = outcome;
  const passed = quality >= PASS_THRESHOLD;

  // The SM-2 ease update, clamped so a run of bad days cannot bury a topic.
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const ease = Math.min(MAX_EASE, Math.max(MIN_EASE, prev.ease + delta));

  if (!passed) {
    // Drop two levels rather than to zero: she has not forgotten everything,
    // and restarting from scratch every time is what makes people quit.
    const level = Math.max(0, prev.level - 2) as MasteryLevel;
    return {
      ...prev,
      level,
      ease,
      intervalDays: 0,
      dueDate: today, // back in today's queue
      lastSeen: today,
      streak: 0,
      lapses: prev.lapses + 1,
      updatedAt: now,
    };
  }

  const level = Math.min(5, prev.level + 1) as MasteryLevel;
  const base = BASE_INTERVALS[level] ?? 35;
  // Ease stretches or compresses the ladder around its 2.5 midpoint.
  const intervalDays = level === 0 ? 0 : Math.max(1, Math.round(base * (ease / 2.5)));

  return {
    ...prev,
    level,
    ease,
    intervalDays,
    dueDate: addDays(today, intervalDays),
    lastSeen: today,
    streak: prev.streak + 1,
    updatedAt: now,
  };
}

/** How confident we are that she still knows it, as a 0–1 fraction. */
export function retentionEstimate(m: MasteryRecord): number {
  return Math.min(1, m.level / 5);
}
