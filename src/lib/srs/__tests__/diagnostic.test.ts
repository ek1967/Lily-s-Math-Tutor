import { beforeAll, describe, expect, it } from 'vitest';
import { applyDiagnostic, buildDiagnostic, diagnosticTopics } from '@/lib/srs/diagnostic';
import { registerAllGenerators } from '@/generators';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { asTopicId, type TopicId } from '@/types/curriculum';
import { asGeneratorId } from '@/types/exercise';
import type { AttemptRecord } from '@/lib/practice/engine';

beforeAll(() => registerAllGenerators());

const attempt = (topicId: TopicId, correct: 0 | 1): AttemptRecord => ({
  exerciseId: 'g#1',
  topicId,
  generatorId: asGeneratorId('x/y'),
  seed: 1,
  skills: [],
  given: '',
  correct,
  hintsUsed: 0,
  revealed: 0,
  msElapsed: 1000,
  at: Date.UTC(2026, 8, 4, 9),
});

describe('choosing what to ask', () => {
  it('picks load-bearing topics', () => {
    // Getting fractions wrong says more than one specific ח' topic, because
    // half of ח' stands on it.
    const topics = diagnosticTopics();
    expect(topics).toContain(asTopicId('num-integers-add-sub'));
    expect(topics.length).toBeGreaterThan(5);
  });

  it('asks only about topics that have exercises', () => {
    for (const id of diagnosticTopics()) {
      expect(TOPIC_BY_ID.has(id), id).toBe(true);
    }
  });

  it('leaves extension topics out by default', () => {
    for (const id of diagnosticTopics()) {
      expect(TOPIC_BY_ID.get(id)!.tier, id).toBe('core');
    }
  });

  it('asks in syllabus order rather than jumping about', () => {
    const grades = diagnosticTopics().map((id) => TOPIC_BY_ID.get(id)!.grade);
    expect([...grades].sort((a, b) => a - b)).toEqual(grades);
  });

  it('stays short enough for one sitting', () => {
    expect(buildDiagnostic(1).length).toBeLessThanOrEqual(14);
  });

  it('asks the easiest variant of each topic', () => {
    // This measures whether the idea is there at all, not how far it has gone.
    for (const exercise of buildDiagnostic(1)) {
      expect(exercise.difficulty, exercise.id).toBe(1);
    }
  });

  it('is reproducible from its seed', () => {
    expect(buildDiagnostic(42).map((e) => e.id)).toEqual(buildDiagnostic(42).map((e) => e.id));
  });
});

describe('reading the results', () => {
  const FRACTIONS = asTopicId('num-fractions-add-sub');
  const INTEGERS = asTopicId('num-integers-add-sub');

  it('marks a passed topic as known and schedules a light review', () => {
    const { known, gaps, records } = applyDiagnostic([attempt(FRACTIONS, 1)]);
    expect(known).toEqual([FRACTIONS]);
    expect(gaps).toEqual([]);
    const record = records[0]!;
    expect(record.level).toBe(3);
    expect(record.introduced).toBe(true);
    expect(record.dueDate > '2026-09-04').toBe(true);
  });

  it('leaves a failed topic un-introduced, so it gets taught rather than retested', () => {
    // Revising a topic she was never taught is just failing at it again.
    const { gaps, records } = applyDiagnostic([attempt(INTEGERS, 0)]);
    expect(gaps).toEqual([INTEGERS]);
    expect(records[0]!.introduced).toBe(false);
    expect(records[0]!.level).toBe(0);
  });

  it('keeps the counts it saw', () => {
    const records = applyDiagnostic([attempt(FRACTIONS, 1), attempt(FRACTIONS, 0)]).records;
    expect(records[0]!.totalAttempts).toBe(2);
    expect(records[0]!.totalCorrect).toBe(1);
  });

  it('treats half right as a pass', () => {
    const { known } = applyDiagnostic([attempt(FRACTIONS, 1), attempt(FRACTIONS, 0)]);
    expect(known).toEqual([FRACTIONS]);
  });

  it('ignores an unknown topic id', () => {
    expect(applyDiagnostic([attempt(asTopicId('nope'), 1)]).records).toEqual([]);
  });

  it('produces nothing from nothing', () => {
    expect(applyDiagnostic([])).toEqual({ known: [], gaps: [], records: [] });
  });
});
