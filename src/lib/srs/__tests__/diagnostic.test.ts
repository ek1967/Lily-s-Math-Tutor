import { beforeAll, describe, expect, it } from 'vitest';
import {
  applyDiagnostic,
  buildDiagnostic,
  diagnosticTopics,
  mergeDiagnostic,
  recheckDiagnostic,
} from '@/lib/srs/diagnostic';
import { registerAllGenerators } from '@/generators';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { asTopicId, type TopicId } from '@/types/curriculum';
import { asGeneratorId } from '@/types/exercise';
import type { AttemptRecord } from '@/lib/practice/engine';
import { newMastery, type MasteryRecord } from '@/types/mastery';

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

describe('merging results into existing history', () => {
  const FRACTIONS = asTopicId('num-fractions-add-sub');
  const INTEGERS = asTopicId('num-integers-add-sub');
  const TODAY = '2026-09-04';

  const record = (id: TopicId, over: Partial<MasteryRecord> = {}): MasteryRecord => ({
    ...newMastery(id, TODAY, 0),
    ...over,
  });

  it('writes everything on a device with no history', () => {
    const results = [record(FRACTIONS), record(INTEGERS)];
    const { toWrite, kept } = mergeDiagnostic(results, new Map());
    expect(toWrite).toHaveLength(2);
    expect(kept).toEqual([]);
  });

  it('never writes over a topic she has actually worked on', () => {
    // One placement question is a worse signal than dozens of practised
    // exercises — and after a restore this guard is what stops the check
    // erasing the history that was just recovered.
    const existing = new Map([
      [FRACTIONS, record(FRACTIONS, { introduced: true, level: 4, totalAttempts: 40 })],
    ]);
    const { toWrite, kept } = mergeDiagnostic([record(FRACTIONS), record(INTEGERS)], existing);
    expect(kept).toEqual([FRACTIONS]);
    expect(toWrite.map((r) => r.topicId)).toEqual([INTEGERS]);
  });

  it('treats an empty placeholder record as no history', () => {
    const existing = new Map([[FRACTIONS, record(FRACTIONS)]]);
    const { toWrite } = mergeDiagnostic([record(FRACTIONS)], existing);
    expect(toWrite).toHaveLength(1);
  });

  it('protects a topic with attempts even if never formally introduced', () => {
    const existing = new Map([[FRACTIONS, record(FRACTIONS, { totalAttempts: 6 })]]);
    expect(mergeDiagnostic([record(FRACTIONS)], existing).kept).toEqual([FRACTIONS]);
  });
});

describe('re-running the check later', () => {
  const topicId = asTopicId('num-integers-add-sub');
  const now = Date.UTC(2026, 8, 4, 9);

  /** A topic she has genuinely practised: level 4, a long interval, a streak. */
  const practised = (): MasteryRecord => ({
    ...newMastery(topicId, '2026-09-04', now),
    level: 4,
    ease: 2.5,
    intervalDays: 21,
    dueDate: '2026-09-25',
    lastSeen: '2026-09-04',
    streak: 5,
    introduced: true,
    totalAttempts: 40,
    totalCorrect: 34,
  });

  it('leaves a topic she still gets right exactly as practice left it', () => {
    const existing = new Map([[topicId, practised()]]);
    const outcome = applyDiagnostic([attempt(topicId, 1)], now);

    const { toWrite, slipped } = recheckDiagnostic(outcome, existing, now);

    // One right answer must not promote past practised evidence, nor push the
    // review further out.
    expect(toWrite).toHaveLength(0);
    expect(slipped).toHaveLength(0);
  });

  it('brings a slipped topic back into the queue without erasing its history', () => {
    const existing = new Map([[topicId, practised()]]);
    const outcome = applyDiagnostic([attempt(topicId, 0)], now);

    const { toWrite, slipped } = recheckDiagnostic(outcome, existing, now);

    expect(slipped).toEqual([topicId]);
    const written = toWrite[0]!;
    expect(written.dueDate).toBe('2026-09-04');
    expect(written.level).toBe(3);
    expect(written.lapses).toBe(1);
    expect(written.streak).toBe(0);
    // The point of the whole exercise: the history survives.
    expect(written.totalAttempts).toBe(41);
    expect(written.totalCorrect).toBe(34);
    expect(written.introduced).toBe(true);
  });

  it('never drops a taught topic back to un-introduced', () => {
    const existing = new Map([[topicId, { ...practised(), level: 1 as const }]]);
    const outcome = applyDiagnostic([attempt(topicId, 0)], now);

    const written = recheckDiagnostic(outcome, existing, now).toWrite[0]!;

    // Level 0 would make the planner teach it from scratch, which is not what
    // forgetting one question means.
    expect(written.level).toBe(1);
    expect(written.introduced).toBe(true);
  });

  it('writes a fresh record for a topic with no history at all', () => {
    const outcome = applyDiagnostic([attempt(topicId, 0)], now);

    const { toWrite, fresh } = recheckDiagnostic(outcome, new Map(), now);

    expect(fresh).toEqual([topicId]);
    expect(toWrite[0]!.totalAttempts).toBe(1);
  });
});
