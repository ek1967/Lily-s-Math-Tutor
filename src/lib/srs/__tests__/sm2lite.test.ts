import { describe, expect, it } from 'vitest';
import { BASE_INTERVALS, MAX_EASE, MIN_EASE, schedule } from '@/lib/srs/sm2lite';
import { gradeAttempts, weakSkills } from '@/lib/srs/grading';
import { newMastery, type MasteryRecord } from '@/types/mastery';
import { asTopicId } from '@/types/curriculum';
import { asGeneratorId } from '@/types/exercise';
import type { AttemptRecord } from '@/lib/practice/engine';

const TOPIC = asTopicId('num-fractions-add-sub');
const TODAY = '2026-09-04';

const base = (over: Partial<MasteryRecord> = {}): MasteryRecord => ({
  ...newMastery(TOPIC, TODAY, 0),
  ...over,
});

const attempt = (over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  exerciseId: 'g#1',
  topicId: TOPIC,
  generatorId: asGeneratorId('num-fractions-add-sub/same-denominator'),
  seed: 1,
  skills: ['fractions.add'],
  given: '1/2',
  correct: 1,
  hintsUsed: 0,
  revealed: 0,
  msElapsed: 5000,
  at: 0,
  ...over,
});

describe('scheduling a passed review', () => {
  it('moves up one level and pushes the due date out', () => {
    const next = schedule(base(), { quality: 5, today: TODAY, now: 1 });
    expect(next.level).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.dueDate).toBe('2026-09-05');
    expect(next.lastSeen).toBe(TODAY);
  });

  it('climbs the ladder one level at a time', () => {
    let m = base();
    const seen: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      m = schedule(m, { quality: 5, today: TODAY, now: i });
      seen.push(m.level);
    }
    expect(seen).toEqual([1, 2, 3, 4, 5, 5]);
  });

  it('stretches intervals roughly along the base ladder', () => {
    let m = base();
    for (let i = 0; i < 3; i += 1) m = schedule(m, { quality: 4, today: TODAY, now: i });
    expect(m.level).toBe(3);
    // Level 3's base is 7 days; ease scales it, so allow a band.
    expect(m.intervalDays).toBeGreaterThanOrEqual(BASE_INTERVALS[3]! - 2);
    expect(m.intervalDays).toBeLessThanOrEqual(BASE_INTERVALS[3]! + 3);
  });

  it('caps at level 5', () => {
    const next = schedule(base({ level: 5, streak: 9 }), { quality: 5, today: TODAY, now: 1 });
    expect(next.level).toBe(5);
    expect(next.streak).toBe(10);
  });
});

describe('scheduling a failed review', () => {
  it('drops two levels rather than resetting to zero', () => {
    // A single distracted evening should not erase months of work.
    const next = schedule(base({ level: 4, streak: 4 }), { quality: 1, today: TODAY, now: 1 });
    expect(next.level).toBe(2);
    expect(next.streak).toBe(0);
    expect(next.lapses).toBe(1);
  });

  it('never drops below zero', () => {
    expect(schedule(base({ level: 1 }), { quality: 0, today: TODAY, now: 1 }).level).toBe(0);
  });

  it('puts the topic back in today’s queue', () => {
    const next = schedule(base({ level: 3 }), { quality: 2, today: TODAY, now: 1 });
    expect(next.dueDate).toBe(TODAY);
    expect(next.intervalDays).toBe(0);
  });

  it('treats quality 3 as a pass and 2 as a fail', () => {
    expect(schedule(base({ level: 2 }), { quality: 3, today: TODAY, now: 1 }).level).toBe(3);
    expect(schedule(base({ level: 2 }), { quality: 2, today: TODAY, now: 1 }).level).toBe(0);
  });
});

describe('ease', () => {
  it('never falls below the floor, however badly it goes', () => {
    let m = base({ level: 5 });
    for (let i = 0; i < 20; i += 1) m = schedule(m, { quality: 0, today: TODAY, now: i });
    expect(m.ease).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it('never climbs above the ceiling', () => {
    let m = base();
    for (let i = 0; i < 20; i += 1) m = schedule(m, { quality: 5, today: TODAY, now: i });
    expect(m.ease).toBeLessThanOrEqual(MAX_EASE);
  });

  it('rises on easy reviews and falls on hard ones', () => {
    expect(schedule(base(), { quality: 5, today: TODAY, now: 1 }).ease).toBeGreaterThan(2.5);
    expect(schedule(base(), { quality: 3, today: TODAY, now: 1 }).ease).toBeLessThan(2.5);
  });
});

describe('grading a session', () => {
  it('gives full marks for a clean run', () => {
    expect(gradeAttempts(Array.from({ length: 5 }, () => attempt()))).toBe(5);
  });

  it('scores zero when nothing was attempted', () => {
    expect(gradeAttempts([])).toBe(0);
  });

  it('fails a session she mostly got wrong', () => {
    const attempts = [attempt({ correct: 0 }), attempt({ correct: 0 }), attempt()];
    expect(gradeAttempts(attempts)).toBeLessThan(3);
  });

  it('charges less for hints than for wrong answers', () => {
    const withHints = Array.from({ length: 4 }, () => attempt({ hintsUsed: 2 }));
    const withErrors = [attempt(), attempt(), attempt({ correct: 0 }), attempt({ correct: 0 })];
    // Getting there with help still beats not getting there.
    expect(gradeAttempts(withHints)).toBeGreaterThan(gradeAttempts(withErrors));
  });

  it('penalises a revealed solution', () => {
    const revealed = Array.from({ length: 4 }, () => attempt({ correct: 0, revealed: 1 }));
    expect(gradeAttempts(revealed)).toBe(0);
  });

  it('stays inside 0..5', () => {
    for (const hints of [0, 1, 2, 3] as const) {
      for (const correct of [0, 1] as const) {
        const q = gradeAttempts([attempt({ hintsUsed: hints, correct })]);
        expect(q).toBeGreaterThanOrEqual(0);
        expect(q).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('weak skills', () => {
  it('names skills she gets wrong more often than right', () => {
    const attempts = [
      attempt({ skills: ['fractions.expand'], correct: 0 }),
      attempt({ skills: ['fractions.expand'], correct: 0 }),
      attempt({ skills: ['fractions.add'], correct: 1 }),
      attempt({ skills: ['fractions.add'], correct: 1 }),
    ];
    expect(weakSkills(attempts)).toEqual(['fractions.expand']);
  });

  it('ignores a single bad attempt as noise', () => {
    expect(weakSkills([attempt({ skills: ['x'], correct: 0 })])).toEqual([]);
  });
});
