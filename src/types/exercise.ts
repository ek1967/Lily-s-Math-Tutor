import type { TopicId } from './curriculum';

export type GeneratorId = string & { readonly __brand: 'GeneratorId' };
export const asGeneratorId = (s: string): GeneratorId => s as GeneratorId;

/** Seeded random source. Generators receive one of these and nothing else. */
export interface Rng {
  /** [0, 1) */
  next(): number;
  /** Inclusive on both ends. */
  int(min: number, max: number): number;
  /** Inclusive, never returns 0. */
  nonZeroInt(min: number, max: number): number;
  pick<T>(xs: readonly T[]): T;
  weighted<T>(xs: readonly T[], weights: readonly number[]): T;
  shuffle<T>(xs: readonly T[]): T[];
  bool(pTrue?: number): boolean;
  sign(): 1 | -1;
}

/** A multiple-choice option is Hebrew or maths, never both in one string. */
export type ChoiceOption = { he: string } | { tex: string };

export type Answer =
  | { kind: 'integer'; value: number }
  | { kind: 'decimal'; value: number; decimals: number; tolerance: number }
  | { kind: 'fraction'; num: number; den: number; requireReduced: boolean }
  | { kind: 'choice'; correctIndex: number; options: ChoiceOption[] }
  | { kind: 'expression'; canonical: string; acceptedForms: string[] }
  | { kind: 'tuple'; parts: Answer[]; labelsHe: string[] };

export type AnswerKind = Answer['kind'];

/** Which on-screen keypad to show. She never types LaTeX and never sees the
 *  system keyboard, which on iOS hides half the screen and breaks the flow. */
export type KeypadKind = 'numeric' | 'numeric-signed' | 'fraction' | 'algebra' | 'none';

export interface InputSpec {
  kind: AnswerKind;
  keypad: KeypadKind;
  /** Rendered next to the field, e.g. "סמ״ר", "₪", "מעלות". */
  unitHe?: string;
  allowNegative: boolean;
  placeholderHe?: string;
}

export interface Hint {
  level: 1 | 2 | 3;
  he: string;
  tex?: string;
}

export interface SolutionStep {
  he: string;
  tex?: string;
}

/**
 * A generated exercise. `promptHe` is Hebrew prose only and `promptTex` is the
 * maths — mixing them in one string is what lets the bidi algorithm reorder a
 * formula, and the contract test rejects any generator that tries.
 */
export interface Exercise {
  /** `${generatorId}#${seed}` — stable and fully reproducible. */
  id: string;
  generatorId: GeneratorId;
  topicId: TopicId;
  skills: string[];
  difficulty: 1 | 2 | 3;
  seed: number;
  promptHe: string;
  promptTex?: string;
  input: InputSpec;
  answer: Answer;
  solution: SolutionStep[];
  hints: readonly [Hint, Hint, Hint];
}

/** What a generator returns: the content, without the identity fields. */
export type ExercisePayload = Omit<
  Exercise,
  'id' | 'seed' | 'generatorId' | 'topicId' | 'skills' | 'difficulty'
>;

export interface ExerciseGenerator {
  readonly id: GeneratorId;
  readonly topicId: TopicId;
  /** Shown in the parent dashboard and the dev gallery. */
  readonly titleHe: string;
  readonly difficulty: 1 | 2 | 3;
  /** Base sampling weight within its topic. */
  readonly weight: number;
  readonly skills: string[];
  /**
   * MUST be pure: the same rng sequence yields an identical exercise, always.
   * No Math.random, no Date.now — a lint rule enforces this, and the contract
   * test generates each exercise twice and compares.
   */
  generate(rng: Rng): ExercisePayload;
}

/** Result of checking what she typed. */
export interface Verdict {
  correct: boolean;
  /** Set when the input could not be read at all, e.g. an empty field. */
  unparsed?: boolean;
  /** Right value, not yet in lowest terms. Worth a nudge, not a cross. */
  needsReducing?: boolean;
}
