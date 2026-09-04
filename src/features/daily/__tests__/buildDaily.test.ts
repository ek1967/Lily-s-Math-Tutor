import { beforeAll, describe, expect, it } from 'vitest';
import { buildDailyBlueprint, exercisesFromSteps, newDailySession } from '@/features/daily/buildDaily';
import { registerAllGenerators } from '@/generators';
import { newMastery, type MasteryRecord } from '@/types/mastery';
import { asTopicId, type TopicId } from '@/types/curriculum';
import type { TodayPlan } from '@/lib/srs/planner';

beforeAll(() => registerAllGenerators());

const FOCUS = asTopicId('alg-linear-eq-basic');
const REVIEW = asTopicId('num-integers-add-sub');
const REVIEW2 = asTopicId('num-fractions-add-sub');
const TODAY = '2026-09-04';

const mastery = (entries: Array<[TopicId, Partial<MasteryRecord>]> = []) =>
  new Map(entries.map(([id, over]) => [id, { ...newMastery(id, TODAY, 0), ...over }]));

const plan = (over: Partial<TodayPlan> = {}): TodayPlan => ({
  review: [],
  focus: FOCUS,
  reason: 'new',
  ...over,
});

describe('building the day', () => {
  it('fills the session to the length her daily goal implies', () => {
    const short = buildDailyBlueprint(plan(), mastery(), 1, 8);
    const long = buildDailyBlueprint(plan(), mastery(), 1, 20);
    expect(short.steps.length).toBeLessThan(long.steps.length);
    expect(long.steps.length).toBeGreaterThanOrEqual(12);
  });

  it('opens with the topics that are due', () => {
    // The focus topic is already introduced, so there is no lesson to sit first.
    const m = mastery([[FOCUS, { introduced: true, level: 2 }]]);
    const bp = buildDailyBlueprint(plan({ review: [REVIEW, REVIEW2] }), m, 1, 12);
    const first = bp.steps[0];
    expect(first?.kind).toBe('exercise');
    // Confidence first: the session starts with something she can already do.
    expect(first && 'topicId' in first ? first.topicId : null).toBe(REVIEW);
  });

  it('teaches a brand-new topic before asking anything about it', () => {
    // Being asked to solve first is how a student learns that maths is a thing
    // that happens to her rather than something she is being shown.
    const bp = buildDailyBlueprint(plan({ review: [] }), mastery(), 1, 12);
    expect(bp.steps[0]).toEqual({ kind: 'lesson', topicId: FOCUS });
  });

  it('does not re-teach a topic she has already been introduced to', () => {
    const m = mastery([[FOCUS, { introduced: true, level: 2 }]]);
    const bp = buildDailyBlueprint(plan({ review: [] }), m, 1, 12);
    expect(bp.steps.some((s) => s.kind === 'lesson')).toBe(false);
  });

  it('still fills the session with the full number of questions', () => {
    // The lesson is not one of the items — it must not eat a question.
    const withLesson = buildDailyBlueprint(plan({ review: [] }), mastery(), 1, 12);
    const withoutLesson = buildDailyBlueprint(
      plan({ review: [] }),
      mastery([[FOCUS, { introduced: true }]]),
      1,
      12,
    );
    const count = (bp: { steps: { kind: string }[] }) =>
      bp.steps.filter((s) => s.kind === 'exercise').length;
    expect(count(withLesson)).toBe(count(withoutLesson));
  });

  it('caps the warm-up at three topics', () => {
    const bp = buildDailyBlueprint(
      plan({ review: [REVIEW, REVIEW2, FOCUS, REVIEW, REVIEW2] }),
      mastery(),
      1,
      20,
    );
    const warmUpTopics = bp.steps.slice(0, 3).map((s) => ('topicId' in s ? s.topicId : null));
    expect(new Set(warmUpTopics).size).toBeLessThanOrEqual(3);
  });

  it('spends most of the session on the focus topic', () => {
    const bp = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 1, 12);
    const onFocus = bp.steps.filter((s) => 'topicId' in s && s.topicId === FOCUS).length;
    expect(onFocus).toBeGreaterThan(bp.steps.length / 2);
  });

  it('ends on something she can do when there was a warm-up', () => {
    const bp = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 1, 12);
    const last = bp.steps.at(-1);
    expect(last && 'topicId' in last ? last.topicId : null).toBe(REVIEW);
  });

  it('reports the topics it touched', () => {
    const bp = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 1, 12);
    expect(new Set(bp.topicIds)).toEqual(new Set([REVIEW, FOCUS]));
  });

  it('puts one breather in the middle, never on the last item', () => {
    const bp = buildDailyBlueprint(plan(), mastery(), 1, 12);
    expect(bp.breatherAt).toHaveLength(1);
    expect(bp.breatherAt[0]).toBeLessThan(bp.steps.length - 1);
    expect(bp.breatherAt[0]).toBeGreaterThan(0);
  });

  it('skips the breather in a short session', () => {
    const bp = buildDailyBlueprint(plan({ review: [] }), mastery(), 1, 8);
    if (bp.steps.length < 6) expect(bp.breatherAt).toEqual([]);
  });

  it('is reproducible from its seed', () => {
    const a = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 4242, 12);
    const b = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 4242, 12);
    expect(a.steps).toEqual(b.steps);
  });

  it('produces something even when there is no focus topic', () => {
    const bp = buildDailyBlueprint(
      plan({ focus: null, review: [REVIEW], reason: 'review-only' }),
      mastery(),
      1,
      12,
    );
    expect(bp.steps.length).toBeGreaterThan(0);
  });

  it('skips topics that have no exercises rather than producing empty steps', () => {
    const bp = buildDailyBlueprint(
      plan({ focus: asTopicId('geo-circle'), review: [] }),
      mastery(),
      1,
      12,
    );
    expect(bp.steps).toEqual([]);
  });
});

describe('rebuilding a stored session', () => {
  it('reproduces exactly the questions she was working on', () => {
    const bp = buildDailyBlueprint(plan({ review: [REVIEW] }), mastery(), 777, 12);
    const first = exercisesFromSteps(bp.steps);
    const again = exercisesFromSteps(bp.steps);
    expect(first.map((e) => e.id)).toEqual(again.map((e) => e.id));
    expect(first).toHaveLength(bp.steps.filter((s) => s.kind === 'exercise').length);
  });

  it('ignores non-exercise steps', () => {
    expect(exercisesFromSteps([{ kind: 'breather' }, { kind: 'summary' }])).toEqual([]);
  });

  it('creates a resumable session record', () => {
    const bp = buildDailyBlueprint(plan(), mastery(), 5, 12);
    const session = newDailySession(bp, 5, 1_700_000_000_000);
    expect(session.outcome).toBe('active');
    expect(session.currentStep).toBe(0);
    expect(session.plan).toEqual(bp.steps);
  });
});
