import { CURRICULUM, TOPIC_BY_ID } from '@/data/curriculum';
import { deepestUnmetPrerequisite, isUnlocked } from '@/data/curriculum/graph';
import { generatorsForTopic } from '@/generators/registry';
import type { Topic, TopicId } from '@/types/curriculum';
import type { MasteryRecord } from '@/types/mastery';
import { isDue, type DayKey } from '@/lib/time';

/**
 * Decides what today looks like, so the home screen never has to ask her to
 * choose. Choosing is the failure point for someone with attention difficulties
 * and maths anxiety: she opens the app, presses one button, and starts.
 */

export interface PlanInput {
  mastery: ReadonlyMap<TopicId, MasteryRecord>;
  today: DayKey;
  showExtensionTopics: boolean;
}

export interface TodayPlan {
  /** Topics due for review — the warm-up. */
  review: TopicId[];
  /** The one topic today is actually about. */
  focus: TopicId | null;
  /** Why that topic: new material, or a gap underneath something she is stuck on. */
  reason: 'new' | 'gap' | 'review-only' | 'nothing';
  /** When `reason` is 'gap', the topic the gap is blocking. */
  blocking?: TopicId;
}

/** Mastery at level 3 or above counts as "she can build on this". */
export const KNOWN_LEVEL = 3;

const isKnown = (mastery: ReadonlyMap<TopicId, MasteryRecord>) => (id: TopicId): boolean =>
  (mastery.get(id)?.level ?? 0) >= KNOWN_LEVEL;

function teachable(topic: Topic, input: PlanInput): boolean {
  if (topic.tier === 'extension' && !input.showExtensionTopics) return false;
  // A topic with no exercises cannot carry a session yet.
  return generatorsForTopic(topic.id).length > 0;
}

export function dueTopics(input: PlanInput): TopicId[] {
  return [...input.mastery.values()]
    .filter((m) => m.introduced && isDue(m.dueDate, input.today))
    .filter((m) => {
      const topic = TOPIC_BY_ID.get(m.topicId);
      return topic ? teachable(topic, input) : false;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.level - b.level)
    .map((m) => m.topicId);
}

/**
 * The next topic to teach: the first unlocked one she has not mastered, walking
 * the curriculum in order. Where she is failing something whose prerequisite is
 * shaky, the prerequisite wins — that is the whole point of the graph.
 */
export function nextTopic(input: PlanInput): { topicId: TopicId; reason: 'new' | 'gap'; blocking?: TopicId } | null {
  const known = isKnown(input.mastery);

  // Anything she is actively struggling with (level dropped, lapses recorded)
  // gets checked for an underlying gap first.
  const struggling = [...input.mastery.values()]
    .filter((m) => m.lapses > 0 && m.level < KNOWN_LEVEL)
    .sort((a, b) => b.lapses - a.lapses);

  for (const m of struggling) {
    const gap = deepestUnmetPrerequisite(m.topicId, known);
    if (gap) {
      const topic = TOPIC_BY_ID.get(gap);
      if (topic && teachable(topic, input)) {
        return { topicId: gap, reason: 'gap', blocking: m.topicId };
      }
    }
  }

  const candidates = CURRICULUM.filter((t) => teachable(t, input) && !known(t.id));

  // Preferred: a topic whose prerequisites she already has.
  const ready = candidates.find((t) => isUnlocked(t.id, known));
  if (ready) return { topicId: ready.id, reason: 'new' };

  // Otherwise take the topic with the fewest unmet prerequisites rather than
  // stopping. She is in ח' and will not master all of ז' before touching
  // anything current — and "there is nothing for you today" is the worst
  // possible answer to give a student who did open the app.
  const byGaps = candidates
    .map((t) => ({ topic: t, gaps: t.prerequisites.filter((p) => !known(p)).length }))
    .sort((a, b) => a.gaps - b.gaps);

  const fallback = byGaps[0];
  return fallback ? { topicId: fallback.topic.id, reason: 'new' } : null;
}

export function buildTodayPlan(input: PlanInput): TodayPlan {
  const review = dueTopics(input);
  const next = nextTopic(input);

  if (!next) {
    return {
      review,
      focus: review[0] ?? null,
      reason: review.length > 0 ? 'review-only' : 'nothing',
    };
  }

  // Do not put the focus topic in the warm-up as well.
  return {
    review: review.filter((id) => id !== next.topicId).slice(0, 3),
    focus: next.topicId,
    reason: next.reason,
    ...(next.blocking ? { blocking: next.blocking } : {}),
  };
}
