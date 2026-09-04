import type { Exercise, ExerciseGenerator } from '@/types/exercise';
import { makeRng } from './rng';

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
