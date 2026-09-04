import { createExercise } from '@/generators/make';
import { deriveSeed, makeRng } from '@/generators/rng';
import { getGenerator, generatorsForTopic } from '@/generators/registry';
import { pickGenerator } from '@/lib/practice/selection';
import type { TodayPlan } from '@/lib/srs/planner';
import type { MasteryRecord } from '@/types/mastery';
import type { TopicId } from '@/types/curriculum';
import type { Exercise, GeneratorId } from '@/types/exercise';
import type { SessionStep, StudySession } from '@/types/session';
import { hasAuthoredLesson } from '@/data/lessons';

/**
 * Turns a day plan into an ordered set of steps.
 *
 * Shape: a short warm-up on topics that are due, then the day's focus topic,
 * then one easy item to finish on. The warm-up matters more than it looks —
 * opening a session with something she can already do buys the confidence to
 * attempt the part she cannot.
 */

/** Items per session, by the daily goal she chose. */
const ITEM_COUNT: Record<number, number> = { 8: 6, 12: 9, 20: 14 };

export interface DailyBlueprint {
  steps: SessionStep[];
  topicIds: TopicId[];
  breatherAt: number[];
}

/** A topic she has never been taught opens with the lesson, not with questions.
 *  Being asked to solve something first is how a student learns that maths is
 *  a thing that happens to her. */
function shouldTeachFirst(
  focus: TopicId | null,
  mastery: ReadonlyMap<TopicId, MasteryRecord>,
): boolean {
  if (!focus) return false;
  if (!hasAuthoredLesson(focus)) return false;
  return mastery.get(focus)?.introduced !== true;
}

export function buildDailyBlueprint(
  plan: TodayPlan,
  mastery: ReadonlyMap<TopicId, MasteryRecord>,
  seedBase: number,
  goalMinutes: number,
): DailyBlueprint {
  const total = ITEM_COUNT[goalMinutes] ?? 9;
  const rng = makeRng(deriveSeed(seedBase, 7919));
  const steps: SessionStep[] = [];
  const touched = new Set<TopicId>();
  const recent: GeneratorId[] = [];

  const exerciseCount = (): number => steps.filter((s) => s.kind === 'exercise').length;

  const addExercise = (topicId: TopicId, easier: boolean): boolean => {
    const candidates = generatorsForTopic(topicId);
    if (candidates.length === 0) return false;
    const m = mastery.get(topicId);
    const gen = pickGenerator(
      candidates,
      {
        // Warm-up and cool-down deliberately sit a notch below her level.
        masteryLevel: easier ? 0 : m?.level,
        ...(m ? { introduced: m.introduced } : {}),
      },
      recent,
      rng,
    );
    if (!gen) return false;
    recent.push(gen.id);
    steps.push({
      kind: 'exercise',
      topicId,
      generatorId: gen.id,
      seed: deriveSeed(seedBase, steps.length),
    });
    touched.add(topicId);
    return true;
  };

  if (shouldTeachFirst(plan.focus, mastery) && plan.focus) {
    steps.push({ kind: 'lesson', topicId: plan.focus });
    touched.add(plan.focus);
  }

  // Warm-up: one item from each due topic, up to three.
  const warmUp = plan.review.slice(0, 3);
  for (const topicId of warmUp) addExercise(topicId, true);

  // Core: the day's focus.
  const coolDownCount = warmUp.length > 0 ? 1 : 0;
  const coreCount = Math.max(3, total - exerciseCount() - coolDownCount);
  if (plan.focus) {
    for (let i = 0; i < coreCount; i += 1) addExercise(plan.focus, false);
  }

  // Cool-down: end on something she can do.
  if (coolDownCount > 0 && warmUp[0]) addExercise(warmUp[0], true);

  // One breath, halfway through, and never on the final item. Indices count
  // exercises only, since that is what the runner walks.
  const exercises = exerciseCount();
  const breatherAt = exercises >= 6 ? [Math.floor(exercises / 2) - 1] : [];

  return { steps, topicIds: [...touched], breatherAt };
}

/** Rebuilds the exercises for a stored session. Steps carry generator and seed,
 *  so this reproduces exactly the questions she was working on. */
export function exercisesFromSteps(steps: readonly SessionStep[]): Exercise[] {
  const out: Exercise[] = [];
  for (const step of steps) {
    if (step.kind !== 'exercise') continue;
    const gen = getGenerator(step.generatorId);
    if (gen) out.push(createExercise(gen, step.seed));
  }
  return out;
}

export function newDailySession(blueprint: DailyBlueprint, seedBase: number, now: number): StudySession {
  return {
    id: `daily-${now.toString(36)}`,
    kind: 'daily',
    seedBase,
    topicIds: blueprint.topicIds,
    plan: blueprint.steps,
    currentStep: 0,
    startedAt: now,
    endedAt: null,
    outcome: 'active',
    stats: { attempted: 0, correct: 0, hintsUsed: 0, revealed: 0 },
  };
}
