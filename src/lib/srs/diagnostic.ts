import { CURRICULUM, TOPIC_BY_ID } from '@/data/curriculum';
import { dependentsOf } from '@/data/curriculum/graph';
import { generatorsForTopic } from '@/generators/registry';
import { createExercise } from '@/generators/make';
import { deriveSeed } from '@/generators/rng';
import { newMastery, type MasteryLevel, type MasteryRecord } from '@/types/mastery';
import type { TopicId } from '@/types/curriculum';
import type { Exercise } from '@/types/exercise';
import type { AttemptRecord } from '@/lib/practice/engine';
import { addDays, dayKey } from '@/lib/time';

/**
 * A short placement check, so the first week is spent on her actual gaps rather
 * than on the beginning of the syllabus.
 *
 * It samples the backbone of the prerequisite graph — the topics that the most
 * other topics depend on — one easy question each. Getting fractions wrong tells
 * you far more than getting one specific ח' topic wrong, because half of ח'
 * stands on it.
 */

export const QUESTIONS_PER_TOPIC = 1;
export const MAX_TOPICS = 14;

/** How many topics ultimately depend on this one. */
function reachCount(topicId: TopicId, seen = new Set<TopicId>()): number {
  let total = 0;
  for (const dep of dependentsOf(topicId)) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    total += 1 + reachCount(dep, seen);
  }
  return total;
}

/** The topics worth asking about, most load-bearing first, then in syllabus order. */
export function diagnosticTopics(showExtensionTopics = false): TopicId[] {
  const candidates = CURRICULUM.filter(
    (t) =>
      generatorsForTopic(t.id).length > 0 &&
      (showExtensionTopics || t.tier === 'core'),
  );

  return candidates
    .map((t) => ({ topic: t, reach: reachCount(t.id) }))
    .sort((a, b) => b.reach - a.reach)
    .slice(0, MAX_TOPICS)
    .map((x) => x.topic)
    // Ask in syllabus order, so it builds up rather than jumping around.
    .sort((a, b) => a.grade - b.grade || CURRICULUM.indexOf(a) - CURRICULUM.indexOf(b))
    .map((t) => t.id);
}

/** Builds the check. Always the easiest variant: this measures whether the idea
 *  is there at all, not how far it has been taken. */
export function buildDiagnostic(seedBase: number, showExtensionTopics = false): Exercise[] {
  const out: Exercise[] = [];

  diagnosticTopics(showExtensionTopics).forEach((topicId, i) => {
    const generators = generatorsForTopic(topicId);
    const easiest = [...generators].sort((a, b) => a.difficulty - b.difficulty)[0];
    if (!easiest) return;
    for (let q = 0; q < QUESTIONS_PER_TOPIC; q += 1) {
      out.push(createExercise(easiest, deriveSeed(seedBase, i * 7 + q)));
    }
  });

  return out;
}

export interface DiagnosticOutcome {
  known: TopicId[];
  gaps: TopicId[];
  records: MasteryRecord[];
}

/**
 * Filters the results down to the records it is safe to write.
 *
 * A single placement question is one data point; a mastery level built from
 * dozens of practised exercises is a far better one. So the check never
 * overwrites a topic she has actually worked on — it exists to find gaps in
 * topics nothing is known about yet.
 *
 * This also closes a data-losing path: after a restore the app can find itself
 * back in onboarding, and without this guard the placement check would write
 * over the very history that had just been recovered.
 */
export function mergeDiagnostic(
  results: readonly MasteryRecord[],
  existing: ReadonlyMap<TopicId, MasteryRecord>,
): { toWrite: MasteryRecord[]; kept: TopicId[] } {
  const toWrite: MasteryRecord[] = [];
  const kept: TopicId[] = [];

  for (const record of results) {
    const prior = existing.get(record.topicId);
    const hasHistory = prior !== undefined && (prior.introduced || prior.totalAttempts > 0);
    if (hasHistory) kept.push(record.topicId);
    else toWrite.push(record);
  }

  return { toWrite, kept };
}

/**
 * Turns the results into a starting point.
 *
 * A topic she got right is marked known and scheduled for a light review; one
 * she got wrong is left un-introduced, so the planner treats it as something to
 * teach rather than something to revise. The distinction matters: revising a
 * topic she was never taught is just failing at it again.
 */
export function applyDiagnostic(
  attempts: readonly AttemptRecord[],
  now = Date.now(),
): DiagnosticOutcome {
  const today = dayKey(now);
  const byTopic = new Map<TopicId, { correct: number; total: number }>();

  for (const a of attempts) {
    const stats = byTopic.get(a.topicId) ?? { correct: 0, total: 0 };
    stats.correct += a.correct;
    stats.total += 1;
    byTopic.set(a.topicId, stats);
  }

  const known: TopicId[] = [];
  const gaps: TopicId[] = [];
  const records: MasteryRecord[] = [];

  for (const [topicId, stats] of byTopic) {
    if (!TOPIC_BY_ID.has(topicId)) continue;
    const passed = stats.correct / stats.total >= 0.5;
    const base = newMastery(topicId, today, now);

    if (passed) {
      known.push(topicId);
      records.push({
        ...base,
        // Level 3 counts as "she can build on this" without claiming mastery.
        level: 3 as MasteryLevel,
        introduced: true,
        intervalDays: 3,
        dueDate: addDays(today, 3),
        lastSeen: today,
        totalAttempts: stats.total,
        totalCorrect: stats.correct,
      });
    } else {
      gaps.push(topicId);
      records.push({
        ...base,
        level: 0,
        // Not introduced: the planner should teach this, not test her on it again.
        introduced: false,
        dueDate: today,
        totalAttempts: stats.total,
        totalCorrect: stats.correct,
      });
    }
  }

  return { known, gaps, records };
}
