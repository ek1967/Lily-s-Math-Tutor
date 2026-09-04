import { asGeneratorId, type Exercise, type ExerciseGenerator } from '@/types/exercise';
import { makeRng } from './rng';
import { getGenerator } from './registry';

/**
 * Stamps the identity fields onto a generator's payload. Generators return
 * content only, so one cannot misreport its own id, seed or topic — those come
 * from the registry entry and the seed we asked for.
 */
export function createExercise(gen: ExerciseGenerator, seed: number): Exercise {
  const payload = gen.generate(makeRng(seed));
  return Object.freeze({
    ...payload,
    id: `${gen.id}#${seed}`,
    generatorId: gen.id,
    topicId: gen.topicId,
    skills: gen.skills,
    difficulty: gen.difficulty,
    seed,
  });
}

/**
 * Rebuilds an exercise from its id. Because generators are pure functions of a
 * seed, `alg-linear-eq-basic/two-step#41` is enough to reproduce the exact
 * question — which is how an exercise can be carried into a chat, or shown on
 * the parent screen weeks later, without ever storing its text.
 */
export function exerciseFromId(id: string): Exercise | null {
  const hash = id.lastIndexOf('#');
  if (hash <= 0) return null;
  const gen = getGenerator(asGeneratorId(id.slice(0, hash)));
  const seed = Number(id.slice(hash + 1));
  if (!gen || !Number.isFinite(seed)) return null;
  return createExercise(gen, seed);
}
