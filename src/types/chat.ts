import type { TopicId } from './curriculum';

export type ChatKind = 'homework' | 'topic' | 'free';

export interface ChatThread {
  id: string;
  kind: ChatKind;
  titleHe: string;
  topicId?: TopicId;
  materialId?: string;
  createdAt: number;
  updatedAt: number;
  /** Rolling summary once the history outgrows the token budget. */
  summary?: string;
}

/** Images are stored by reference, never as base64 inside a message. */
export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'image'; materialId: string; pageIndex: number }
  | { type: 'exercise'; exerciseId: string };

export interface ChatMessage {
  id?: number;
  threadId: string;
  role: 'user' | 'assistant';
  parts: ChatPart[];
  createdAt: number;
  model?: string;
  usage?: { input: number; output: number };
  errorHe?: string;
}
