import { beforeAll, describe, expect, it } from 'vitest';
import {
  canHint, canReveal, currentExercise, initPractice, isStuck, practiceReducer,
  practiceStats, type PracticeAction, type PracticeState,
} from '@/lib/practice/engine';
import { getGenerator, registerAllGenerators } from '@/generators';
import { createExercise } from '@/generators/make';
import { asGeneratorId, type Exercise } from '@/types/exercise';
import { canonicalInput } from '@/generators/verify';

beforeAll(() => registerAllGenerators());

function twoStepExercises(count: number): Exercise[] {
  const gen = getGenerator(asGeneratorId('alg-linear-eq-basic/two-step'))!;
  return Array.from({ length: count }, (_, i) => createExercise(gen, i + 1));
}

const run = (state: PracticeState, ...actions: PracticeAction[]): PracticeState =>
  actions.reduce(practiceReducer, state);

function typeCorrectAnswer(s: PracticeState): PracticeState {
  const ex = currentExercise(s)!;
  const text = canonicalInput(ex.answer) as string;
  return practiceReducer(s, { type: 'setValue', value: [text] });
}

describe('practice engine', () => {
  it('starts on the first exercise, ready for an answer', () => {
    const s = initPractice(twoStepExercises(3), 1000);
    expect(s.phase).toBe('answering');
    expect(s.index).toBe(0);
    expect(s.value).toEqual(['']);
  });

  it('goes straight to done when there is nothing to practise', () => {
    expect(initPractice([], 0).phase).toBe('done');
  });

  it('builds up a typed answer and backspaces it', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = run(s, { type: 'key', key: '4' }, { type: 'key', key: '2' });
    expect(s.value).toEqual(['42']);
    s = practiceReducer(s, { type: 'backspace' });
    expect(s.value).toEqual(['4']);
  });

  it('toggles the sign instead of appending more minuses', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = run(s, { type: 'key', key: '7' }, { type: 'key', key: '-' });
    expect(s.value).toEqual(['-7']);
    s = practiceReducer(s, { type: 'key', key: '-' });
    expect(s.value).toEqual(['7']);
  });

  it('allows only one decimal point', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = run(s, { type: 'key', key: '1' }, { type: 'key', key: '.' }, { type: 'key', key: '.' }, { type: 'key', key: '5' });
    expect(s.value).toEqual(['1.5']);
  });

  it('asks her to write something rather than marking an empty answer wrong', () => {
    const s = practiceReducer(initPractice(twoStepExercises(1), 0), { type: 'submit', now: 1 });
    expect(s.unreadable).toBe(true);
    expect(s.phase).toBe('answering');
    // No wrong attempt is recorded against her for not having typed anything.
    expect(s.wrongTries).toBe(0);
  });

  it('accepts a correct answer and records it', () => {
    let s = initPractice(twoStepExercises(2), 0);
    s = typeCorrectAnswer(s);
    s = practiceReducer(s, { type: 'submit', now: 5000 });
    expect(s.phase).toBe('correct');
    expect(s.records).toHaveLength(1);
    expect(s.records[0]!.correct).toBe(1);
    expect(s.records[0]!.msElapsed).toBe(5000);
  });

  it('treats a wrong answer as "almost" and lets her try again', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = run(s, { type: 'setValue', value: ['99999'] }, { type: 'submit', now: 1 });
    expect(s.phase).toBe('almost');
    expect(s.wrongTries).toBe(1);
    // Still the same exercise, still answerable — no cross, no lockout.
    expect(s.index).toBe(0);
    s = typeCorrectAnswer(s);
    s = practiceReducer(s, { type: 'submit', now: 2 });
    expect(s.phase).toBe('correct');
  });

  it('offers hints before she has guessed', () => {
    // Asking for help first is the right instinct; gating hints behind a wrong
    // answer would teach her to guess.
    const s = initPractice(twoStepExercises(1), 0);
    expect(canHint(s)).toBe(true);
    const withHint = practiceReducer(s, { type: 'hint' });
    expect(withHint.hintsShown).toBe(1);
  });

  it('stops at three hints', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = run(s, { type: 'hint' }, { type: 'hint' }, { type: 'hint' }, { type: 'hint' });
    expect(s.hintsShown).toBe(3);
    expect(canHint(s)).toBe(false);
  });

  it('keeps the full solution locked until she has actually tried', () => {
    let s = initPractice(twoStepExercises(1), 0);
    expect(canReveal(s)).toBe(false);
    expect(practiceReducer(s, { type: 'reveal' }).phase).toBe('answering');

    s = run(s, { type: 'setValue', value: ['999'] }, { type: 'submit', now: 1 });
    expect(canReveal(s)).toBe(false);
    s = run(s, { type: 'setValue', value: ['998'] }, { type: 'submit', now: 2 });
    expect(canReveal(s)).toBe(true);
  });

  it('unlocks the solution once all three hints are spent', () => {
    const s = run(initPractice(twoStepExercises(1), 0), { type: 'hint' }, { type: 'hint' }, { type: 'hint' });
    expect(canReveal(s)).toBe(true);
  });

  it('flags being stuck after three wrong tries', () => {
    let s = initPractice(twoStepExercises(1), 0);
    expect(isStuck(s)).toBe(false);
    for (let i = 0; i < 3; i += 1) {
      s = run(s, { type: 'setValue', value: [`${90000 + i}`] }, { type: 'submit', now: i });
    }
    expect(isStuck(s)).toBe(true);
  });

  it('records a revealed exercise as not correct', () => {
    let s = initPractice(twoStepExercises(2), 0);
    s = run(
      s,
      { type: 'setValue', value: ['9991'] }, { type: 'submit', now: 1 },
      { type: 'setValue', value: ['9992'] }, { type: 'submit', now: 2 },
      { type: 'reveal' },
    );
    expect(s.phase).toBe('revealed');
    s = practiceReducer(s, { type: 'next', now: 3 });
    expect(s.records).toHaveLength(1);
    expect(s.records[0]!.correct).toBe(0);
    expect(s.records[0]!.revealed).toBe(1);
  });

  it('resets per-exercise state when moving on', () => {
    let s = initPractice(twoStepExercises(2), 0);
    s = run(s, { type: 'hint' }, { type: 'setValue', value: ['999'] }, { type: 'submit', now: 1 });
    s = practiceReducer(s, { type: 'next', now: 100 });
    expect(s.index).toBe(1);
    expect(s.phase).toBe('answering');
    expect(s.hintsShown).toBe(0);
    expect(s.wrongTries).toBe(0);
    expect(s.value).toEqual(['']);
    expect(s.startedAt).toBe(100);
  });

  it('finishes after the last exercise', () => {
    let s = initPractice(twoStepExercises(2), 0);
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 1 }, { type: 'next', now: 2 });
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 3 }, { type: 'next', now: 4 });
    expect(s.phase).toBe('done');
    expect(practiceStats(s)).toMatchObject({ attempted: 2, correct: 2 });
  });

  it('gives a fraction answer two fields and joins them on submit', () => {
    const gen = getGenerator(asGeneratorId('num-fractions-add-sub/same-denominator'))!;
    const ex = createExercise(gen, 3);
    let s = initPractice([ex], 0);
    expect(s.value).toEqual(['', '']);

    const answer = ex.answer as Extract<typeof ex.answer, { kind: 'fraction' }>;
    s = run(
      s,
      { type: 'setActivePart', index: 0 },
      { type: 'setValue', value: [String(answer.num), String(answer.den)] },
      { type: 'submit', now: 1 },
    );
    expect(s.phase).toBe('correct');
  });

  it('says a fraction needs reducing instead of calling it wrong', () => {
    const gen = getGenerator(asGeneratorId('num-fractions-add-sub/same-denominator'))!;
    // Find a seed where the reduced answer can be written unreduced.
    let target: Exercise | undefined;
    for (let seed = 1; seed <= 60 && !target; seed += 1) {
      const ex = createExercise(gen, seed);
      if (ex.answer.kind === 'fraction' && ex.answer.den > 1) target = ex;
    }
    const ex = target!;
    const answer = ex.answer as Extract<typeof ex.answer, { kind: 'fraction' }>;

    const s = run(
      initPractice([ex], 0),
      { type: 'setValue', value: [String(answer.num * 2), String(answer.den * 2)] },
      { type: 'submit', now: 1 },
    );
    expect(s.phase).toBe('almost');
    expect(s.needsReducing).toBe(true);
  });

  it('pauses for a breath where the plan asks for one', () => {
    let s = initPractice(twoStepExercises(4), 0, [1]);
    // First question: straight on to the second.
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 1 }, { type: 'next', now: 2 });
    expect(s.phase).toBe('answering');
    expect(s.index).toBe(1);

    // Second question is followed by a breather, and the attempt is recorded
    // on the way in rather than twice.
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 3 }, { type: 'next', now: 4 });
    expect(s.phase).toBe('breather');
    expect(s.index).toBe(1);
    expect(s.records).toHaveLength(2);

    s = practiceReducer(s, { type: 'next', now: 5 });
    expect(s.phase).toBe('answering');
    expect(s.index).toBe(2);
    expect(s.records).toHaveLength(2);
  });

  it('never ends a set on a breather', () => {
    // A pause after the last question would just be an extra tap.
    let s = initPractice(twoStepExercises(2), 0, [0, 1]);
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 1 }, { type: 'next', now: 2 });
    expect(s.phase).toBe('breather');
    s = run(s, { type: 'next', now: 3 });
    s = typeCorrectAnswer(s);
    s = run(s, { type: 'submit', now: 4 }, { type: 'next', now: 5 });
    expect(s.phase).toBe('done');
  });

  it('ignores input once the exercise is resolved', () => {
    let s = initPractice(twoStepExercises(1), 0);
    s = typeCorrectAnswer(s);
    s = practiceReducer(s, { type: 'submit', now: 1 });
    const after = practiceReducer(s, { type: 'key', key: '5' });
    expect(after.value).toEqual(s.value);
  });
});
