import type { TopicId } from '@/types/curriculum';
import type { Exercise, ExerciseGenerator, GeneratorId, Rng } from '@/types/exercise';
import { generatorsForTopic } from '@/generators/registry';
import { createExercise } from '@/generators/make';
import { deriveSeed, makeRng } from '@/generators/rng';

/**
 * Choosing which exercise comes next. The rules are deliberately conservative:
 * start below where she thinks she is, ramp only on success, and never show the
 * same generator twice in a row if there is any alternative — repetition is
 * what makes a practice set feel like a punishment.
 */

export interface SelectionContext {
  /** 0–5 mastery; absent means the topic is new to her. */
  masteryLevel?: number;
  /** Skill tags she has recently got wrong — worth more practice. */
  weakSkills?: readonly string[];
  /** Whether she has seen the lesson yet. */
  introduced?: boolean;
}

/** Mastery level maps to a target difficulty, mixed with its neighbours. */
export function targetDifficulty(level: number | undefined): 1 | 2 | 3 {
  if (level === undefined || level <= 1) return 1;
  if (level <= 3) return 2;
  return 3;
}

function score(
  gen: ExerciseGenerator,
  ctx: SelectionContext,
  recent: readonly GeneratorId[],
): number {
  const target = targetDifficulty(ctx.masteryLevel);
  const distance = Math.abs(gen.difficulty - target);
  // Mostly on target, sometimes one step away, almost never two.
  const difficultyFit = distance === 0 ? 1 : distance === 1 ? 0.35 : 0.05;

  const weak = new Set(ctx.weakSkills ?? []);
  const skillBoost = gen.skills.some((s) => weak.has(s)) ? 2.5 : 1;

  const lastThree = recent.slice(-3);
  const lastSix = recent.slice(-6);
  const repetitionDamp = lastThree.includes(gen.id) ? 0.25 : lastSix.includes(gen.id) ? 0.6 : 1;

  // Do not open with the hardest variant of a topic she has not been taught.
  const introDamp = ctx.introduced === false && gen.difficulty === 3 ? 0.2 : 1;

  return gen.weight * difficultyFit * skillBoost * repetitionDamp * introDamp;
}

export function pickGenerator(
  candidates: readonly ExerciseGenerator[],
  ctx: SelectionContext,
  recent: readonly GeneratorId[],
  rng: Rng,
): ExerciseGenerator | undefined {
  if (candidates.length === 0) return undefined;
  const weights = candidates.map((g) => score(g, ctx, recent));
  return rng.weighted(candidates, weights);
}

/**
 * Builds a whole practice set up front, so the session is reproducible from
 * (topicId, seedBase, count) alone and can be resumed exactly after a reload.
 */
export function buildPracticeSet(
  topicId: TopicId,
  seedBase: number,
  count: number,
  ctx: SelectionContext = {},
): Exercise[] {
  const candidates = generatorsForTopic(topicId);
  if (candidates.length === 0) return [];

  const picker = makeRng(deriveSeed(seedBase, 0));
  const recent: GeneratorId[] = [];
  const out: Exercise[] = [];
  const seen = new Set<string>();

  for (let step = 0; step < count; step += 1) {
    const gen = pickGenerator(candidates, ctx, recent, picker);
    if (!gen) break;
    recent.push(gen.id);

    // Re-derive the seed a few times rather than repeat a question verbatim.
    let exercise = createExercise(gen, deriveSeed(seedBase, step));
    for (let salt = 1; salt <= 5 && seen.has(exercise.id); salt += 1) {
      exercise = createExercise(gen, deriveSeed(seedBase, step, salt));
    }
    seen.add(exercise.id);
    out.push(exercise);
  }

  return out;
}
