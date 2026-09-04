import type { Exercise, GeneratorId, Verdict } from '@/types/exercise';
import type { TopicId } from '@/types/curriculum';
import { checkAnswer } from '@/generators/verify';

/**
 * The practice loop as a pure reducer: no React, no IO, no clock of its own —
 * `now` arrives with the action. That keeps it directly testable, and it means
 * the whole session state can be written to storage after every step so
 * closing the tab mid-question costs nothing.
 */

export interface AttemptRecord {
  exerciseId: string;
  topicId: TopicId;
  generatorId: GeneratorId;
  seed: number;
  skills: string[];
  given: string;
  /** A number, not a boolean: IndexedDB cannot index booleans. */
  correct: 0 | 1;
  hintsUsed: 0 | 1 | 2 | 3;
  revealed: 0 | 1;
  msElapsed: number;
  at: number;
}

export type Phase = 'answering' | 'almost' | 'correct' | 'revealed' | 'breather' | 'done';

export interface PracticeState {
  exercises: Exercise[];
  index: number;
  phase: Phase;
  value: string[];
  activePart: number;
  hintsShown: 0 | 1 | 2 | 3;
  wrongTries: number;
  /** Set when the last submission could not be read at all. */
  unreadable: boolean;
  /** Right value, wrong form — worth a nudge rather than a cross. */
  needsReducing: boolean;
  startedAt: number;
  records: AttemptRecord[];
  /** Exercise indices after which to pause for a breath. A distractible
   *  student who works straight through fifteen items finishes the last five
   *  badly; a fifteen-second break costs nothing and buys the rest. */
  breatherAt: readonly number[];
}

export type PracticeAction =
  | { type: 'key'; key: string }
  | { type: 'backspace' }
  | { type: 'setValue'; value: string[] }
  | { type: 'setActivePart'; index: number }
  | { type: 'submit'; now: number }
  | { type: 'hint' }
  | { type: 'reveal' }
  | { type: 'next'; now: number };

const PART_COUNT: Record<string, number> = { fraction: 2 };

function partsFor(ex: Exercise | undefined): number {
  if (!ex) return 1;
  if (ex.answer.kind === 'tuple') return ex.answer.parts.length;
  return PART_COUNT[ex.input.kind] ?? 1;
}

export function initPractice(
  exercises: Exercise[],
  now: number,
  breatherAt: readonly number[] = [],
  /** Where to pick up — a session abandoned mid-set resumes on the same
   *  question, which is the difference between "carry on" and "start again". */
  startIndex = 0,
): PracticeState {
  const index = Math.max(0, Math.min(startIndex, exercises.length));
  return {
    exercises,
    index,
    phase: exercises.length === 0 || index >= exercises.length ? 'done' : 'answering',
    value: Array(partsFor(exercises[index])).fill(''),
    activePart: 0,
    hintsShown: 0,
    wrongTries: 0,
    unreadable: false,
    needsReducing: false,
    startedAt: now,
    records: [],
    breatherAt,
  };
}

export const currentExercise = (s: PracticeState): Exercise | undefined => s.exercises[s.index];

/** Hints are always offered. Asking for help before guessing is the right move,
 *  and gating them behind a wrong answer teaches her to guess first. */
export const canHint = (s: PracticeState): boolean =>
  s.hintsShown < 3 && (s.phase === 'answering' || s.phase === 'almost');

/** The full solution unlocks once she has genuinely tried. */
export const canReveal = (s: PracticeState): boolean =>
  (s.phase === 'answering' || s.phase === 'almost') && (s.wrongTries >= 2 || s.hintsShown === 3);

/** Three wrong in a row: stop asking, change something. */
export const isStuck = (s: PracticeState): boolean => s.wrongTries >= 3;

export const hasAnswer = (s: PracticeState): boolean =>
  s.value.length > 0 && s.value.every((v) => v.trim() !== '');

function submittedText(s: PracticeState): string | string[] {
  const ex = currentExercise(s);
  if (ex?.input.kind === 'fraction') {
    const [num = '', den = ''] = s.value;
    return `${num}/${den}`;
  }
  return s.value.length === 1 ? (s.value[0] ?? '') : s.value;
}

function record(s: PracticeState, ex: Exercise, correct: boolean, now: number): AttemptRecord {
  const given = submittedText(s);
  return {
    exerciseId: ex.id,
    topicId: ex.topicId,
    generatorId: ex.generatorId,
    seed: ex.seed,
    skills: ex.skills,
    given: Array.isArray(given) ? given.join(' | ') : given,
    correct: correct ? 1 : 0,
    hintsUsed: s.hintsShown,
    revealed: s.phase === 'revealed' ? 1 : 0,
    msElapsed: Math.max(0, now - s.startedAt),
    at: now,
  };
}

export function practiceReducer(s: PracticeState, action: PracticeAction): PracticeState {
  const ex = currentExercise(s);

  switch (action.type) {
    case 'key': {
      if (s.phase !== 'answering' && s.phase !== 'almost') return s;
      const value = [...s.value];
      const current = value[s.activePart] ?? '';
      // A minus toggles the sign rather than appending, so "--5" is impossible.
      const nextText =
        action.key === '-'
          ? current.startsWith('-')
            ? current.slice(1)
            : `-${current}`
          : action.key === '.' && current.includes('.')
            ? current
            : `${current}${action.key}`;
      value[s.activePart] = nextText.slice(0, 10);
      return { ...s, value, unreadable: false, needsReducing: false };
    }

    case 'backspace': {
      if (s.phase !== 'answering' && s.phase !== 'almost') return s;
      const value = [...s.value];
      value[s.activePart] = (value[s.activePart] ?? '').slice(0, -1);
      return { ...s, value, unreadable: false };
    }

    case 'setValue':
      return { ...s, value: action.value, unreadable: false, needsReducing: false };

    case 'setActivePart':
      return { ...s, activePart: Math.max(0, Math.min(action.index, s.value.length - 1)) };

    case 'submit': {
      if (!ex || (s.phase !== 'answering' && s.phase !== 'almost')) return s;
      if (!hasAnswer(s)) return { ...s, unreadable: true };

      const verdict: Verdict = checkAnswer(ex.answer, submittedText(s));
      if (verdict.unparsed) return { ...s, unreadable: true };

      if (verdict.correct) {
        return {
          ...s,
          phase: 'correct',
          unreadable: false,
          needsReducing: false,
          records: [...s.records, record(s, ex, true, action.now)],
        };
      }

      return {
        ...s,
        phase: 'almost',
        wrongTries: s.wrongTries + 1,
        unreadable: false,
        needsReducing: verdict.needsReducing === true,
      };
    }

    case 'hint':
      if (!canHint(s)) return s;
      return { ...s, hintsShown: Math.min(3, s.hintsShown + 1) as 0 | 1 | 2 | 3 };

    case 'reveal':
      if (!canReveal(s)) return s;
      return { ...s, phase: 'revealed', hintsShown: 3 };

    case 'next': {
      const advance = (records: AttemptRecord[]): PracticeState => {
        const index = s.index + 1;
        if (index >= s.exercises.length) {
          return { ...s, phase: 'done', records, index: s.exercises.length };
        }
        return {
          ...s,
          index,
          phase: 'answering',
          value: Array(partsFor(s.exercises[index])).fill(''),
          activePart: 0,
          hintsShown: 0,
          wrongTries: 0,
          unreadable: false,
          needsReducing: false,
          startedAt: action.now,
          records,
        };
      };

      // Leaving the breather: the exercise was already recorded on the way in.
      if (s.phase === 'breather') return advance(s.records);

      // A revealed or abandoned exercise is still recorded — the parent screen
      // and the scheduler both need to know it did not go well.
      const records =
        ex && s.phase !== 'correct'
          ? [...s.records, record(s, ex, false, action.now)]
          : s.records;

      const moreToCome = s.index + 1 < s.exercises.length;
      if (moreToCome && s.breatherAt.includes(s.index)) {
        return { ...s, phase: 'breather', records };
      }
      return advance(records);
    }
  }
}

export function practiceStats(s: PracticeState): {
  attempted: number;
  correct: number;
  hintsUsed: number;
  revealed: number;
} {
  return {
    attempted: s.records.length,
    correct: s.records.filter((r) => r.correct === 1).length,
    hintsUsed: s.records.reduce((a, r) => a + r.hintsUsed, 0),
    revealed: s.records.filter((r) => r.revealed === 1).length,
  };
}
