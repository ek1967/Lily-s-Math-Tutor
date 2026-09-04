import type { TopicId } from './curriculum';
import type { GeneratorId } from './exercise';

export type SessionKind = 'daily' | 'practice' | 'review' | 'homework' | 'diagnostic';

/** A session is planned up front, so it can be resumed exactly after a reload. */
export type SessionStep =
  | { kind: 'lesson'; topicId: TopicId }
  | { kind: 'example'; topicId: TopicId; exampleId: string }
  | { kind: 'exercise'; topicId: TopicId; generatorId: GeneratorId; seed: number }
  | { kind: 'breather' }
  | { kind: 'summary' };

export interface StudySession {
  id: string;
  kind: SessionKind;
  /** The whole session replays from this one number plus the plan. */
  seedBase: number;
  topicIds: TopicId[];
  plan: SessionStep[];
  currentStep: number;
  startedAt: number;
  endedAt: number | null;
  outcome: 'active' | 'completed' | 'abandoned';
  stats: {
    attempted: number;
    correct: number;
    hintsUsed: number;
    revealed: number;
  };
}

export interface Attempt {
  id?: number;
  sessionId: string;
  exerciseId: string;
  topicId: TopicId;
  generatorId: GeneratorId;
  seed: number;
  skills: string[];
  given: string;
  /** A number, not a boolean — IndexedDB refuses boolean keys. */
  correct: 0 | 1;
  hintsUsed: 0 | 1 | 2 | 3;
  revealed: 0 | 1;
  msElapsed: number;
  at: number;
}
