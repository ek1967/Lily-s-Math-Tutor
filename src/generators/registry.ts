import { TOPIC_BY_ID } from '@/data/curriculum';
import type { ExerciseGenerator, GeneratorId } from '@/types/exercise';
import type { TopicId } from '@/types/curriculum';

const byId = new Map<GeneratorId, ExerciseGenerator>();
const byTopic = new Map<TopicId, ExerciseGenerator[]>();

/**
 * Registration is explicit (see ./index.ts) rather than import.meta.glob: a
 * rename then fails at compile time, and the order stays deterministic. The
 * risk of forgetting a file is covered by registry.test.ts, which reads the
 * directory from disk.
 */
export function registerGenerator(gen: ExerciseGenerator): void {
  if (byId.has(gen.id)) throw new Error(`duplicate generator id: ${gen.id}`);
  if (!TOPIC_BY_ID.has(gen.topicId)) {
    throw new Error(`generator ${gen.id} points at unknown topic ${gen.topicId}`);
  }
  byId.set(gen.id, gen);
  const list = byTopic.get(gen.topicId);
  if (list) list.push(gen);
  else byTopic.set(gen.topicId, [gen]);
}

export const getGenerator = (id: GeneratorId): ExerciseGenerator | undefined => byId.get(id);

export const generatorsForTopic = (topicId: TopicId): readonly ExerciseGenerator[] =>
  byTopic.get(topicId) ?? [];

export const allGenerators = (): readonly ExerciseGenerator[] => [...byId.values()];

export const topicsWithGenerators = (): readonly TopicId[] => [...byTopic.keys()];
