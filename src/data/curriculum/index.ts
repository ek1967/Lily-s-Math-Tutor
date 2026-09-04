import type { Topic, TopicId } from '@/types/curriculum';
import { TOPICS_G7 } from './topics.g7';
import { TOPICS_G8 } from './topics.g8';

/** The whole curriculum, frozen. Nothing mutates a topic at runtime. */
export const CURRICULUM: readonly Topic[] = Object.freeze([...TOPICS_G7, ...TOPICS_G8]);

export const TOPIC_BY_ID: ReadonlyMap<TopicId, Topic> = new Map(
  CURRICULUM.map((t) => [t.id, t]),
);

export function getTopic(id: TopicId): Topic | undefined {
  return TOPIC_BY_ID.get(id);
}

/** Throws for an unknown id — used where a missing topic is a programming error. */
export function requireTopic(id: TopicId): Topic {
  const t = TOPIC_BY_ID.get(id);
  if (!t) throw new Error(`unknown topic id: ${id}`);
  return t;
}

export { STRANDS, STRAND_BY_ID } from './strands';
