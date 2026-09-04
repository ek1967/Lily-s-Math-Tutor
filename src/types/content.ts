import type { TopicId } from './curriculum';

/**
 * Teaching content. Note that no variant carries Hebrew prose and LaTeX in the
 * same string: `he` is always plain Hebrew, `tex` is always maths. Interleaving
 * them is what makes the bidi algorithm reorder a formula into nonsense, so the
 * type system refuses to let it happen — use `mixed` when both are needed.
 */
export type RichBlock =
  | { kind: 'text'; he: string }
  | { kind: 'math'; tex: string; captionHe?: string }
  | { kind: 'mixed'; parts: Array<{ he: string } | { tex: string }> }
  | { kind: 'callout'; tone: 'tip' | 'warn' | 'rule'; he: string }
  | { kind: 'list'; ordered: boolean; items: RichBlock[] }
  | { kind: 'table'; headerHe: string[]; rows: string[][] };

export interface WorkedExampleStep {
  he: string;
  tex?: string;
  /** Revealed on tap: the reason, not just the move. */
  whyHe?: string;
}

export interface WorkedExample {
  id: string;
  promptHe: string;
  promptTex?: string;
  steps: WorkedExampleStep[];
  answerTex: string;
}

export interface CommonMistake {
  wrongHe: string;
  wrongTex?: string;
  /** Why it is tempting — naming that is what stops it recurring. */
  whyHe: string;
  fixHe: string;
}

export interface LessonContent {
  topicId: TopicId;
  source: 'authored' | 'ai';
  /** Bumped to invalidate a cached AI lesson or to mark authored content stale. */
  version: number;
  /** One or two sentences on why this matters outside a worksheet. */
  hookHe: string;
  /** At most five short cards — a wall of text is where attention goes to die. */
  explanation: RichBlock[];
  examples: WorkedExample[];
  mistakes: CommonMistake[];
  vocab: Array<{ termHe: string; defHe: string }>;
  generatedAt?: number;
  model?: string;
}
