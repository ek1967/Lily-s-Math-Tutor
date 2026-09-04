import { beforeAll, describe, expect, it } from 'vitest';
import { KNOWN_LEVEL, buildTodayPlan, dueTopics, nextTopic } from '@/lib/srs/planner';
import { registerAllGenerators } from '@/generators';
import { newMastery, type MasteryLevel, type MasteryRecord } from '@/types/mastery';
import { asTopicId, type TopicId } from '@/types/curriculum';
import { TOPIC_BY_ID } from '@/data/curriculum';

beforeAll(() => registerAllGenerators());

const TODAY = '2026-09-04';

/** Topics that actually have generators today. */
const INTEGERS = asTopicId('num-integers-add-sub');
const FRACTIONS = asTopicId('num-fractions-add-sub');
const EQUATIONS = asTopicId('alg-linear-eq-basic');

function mastery(
  entries: Array<[TopicId, Partial<MasteryRecord>]>,
): Map<TopicId, MasteryRecord> {
  return new Map(
    entries.map(([id, over]) => [id, { ...newMastery(id, TODAY, 0), ...over }]),
  );
}

const input = (m: Map<TopicId, MasteryRecord>) => ({
  mastery: m,
  today: TODAY,
  showExtensionTopics: false,
});

describe('due topics', () => {
  it('lists topics whose date has arrived', () => {
    const m = mastery([
      [INTEGERS, { introduced: true, dueDate: '2026-09-01', level: 2 }],
      [FRACTIONS, { introduced: true, dueDate: '2026-09-20', level: 3 }],
    ]);
    expect(dueTopics(input(m))).toEqual([INTEGERS]);
  });

  it('never schedules a topic she has not been taught', () => {
    const m = mastery([[INTEGERS, { introduced: false, dueDate: '2026-01-01' }]]);
    expect(dueTopics(input(m))).toEqual([]);
  });

  it('puts the most overdue and weakest first', () => {
    const m = mastery([
      [FRACTIONS, { introduced: true, dueDate: '2026-09-03', level: 4 }],
      [INTEGERS, { introduced: true, dueDate: '2026-09-01', level: 1 }],
      [EQUATIONS, { introduced: true, dueDate: '2026-09-03', level: 1 }],
    ]);
    expect(dueTopics(input(m))[0]).toBe(INTEGERS);
  });

  it('skips topics with no exercises yet', () => {
    const noGenerators = asTopicId('geo-circle');
    const m = mastery([[noGenerators, { introduced: true, dueDate: '2026-01-01' }]]);
    expect(dueTopics(input(m))).toEqual([]);
  });
});

describe('choosing the next topic', () => {
  it('starts at the beginning for a student with no history', () => {
    const next = nextTopic(input(new Map()));
    expect(next).not.toBeNull();
    expect(next!.reason).toBe('new');
    // Whatever it picks must be teachable and have no unmet prerequisites.
    expect(TOPIC_BY_ID.get(next!.topicId)!.prerequisites).toEqual([]);
  });

  it('does not re-teach something she has mastered', () => {
    const m = mastery([[INTEGERS, { introduced: true, level: 5 as MasteryLevel }]]);
    expect(nextTopic(input(m))!.topicId).not.toBe(INTEGERS);
  });

  it('drops to the underlying gap when she keeps failing something', () => {
    // She is stuck on equations, and signed multiplication underneath is shaky.
    // The graph says fix the prerequisite, not repeat the lesson she failed.
    const m = mastery([
      [EQUATIONS, { introduced: true, level: 1, lapses: 2 }],
      [asTopicId('alg-collect-like-terms'), { introduced: true, level: 5 }],
      [asTopicId('alg-expressions-substitute'), { introduced: true, level: 5 }],
      [asTopicId('num-integers-mul-div'), { introduced: true, level: 5 }],
      [asTopicId('num-order-of-operations'), { introduced: true, level: 5 }],
      [INTEGERS, { introduced: true, level: 0, lapses: 1 }],
    ]);
    const next = nextTopic(input(m));
    expect(next!.reason).toBe('gap');
    expect(next!.topicId).toBe(INTEGERS);
    expect(next!.blocking).toBe(EQUATIONS);
  });

  it('prefers a topic whose prerequisites she already has', () => {
    const m = mastery([]);
    const next = nextTopic(input(m))!;
    const topic = TOPIC_BY_ID.get(next.topicId)!;
    for (const p of topic.prerequisites) {
      expect((m.get(p)?.level ?? 0) >= KNOWN_LEVEL, `${topic.id} needs ${p}`).toBe(true);
    }
  });

  it('offers the least-blocked topic rather than nothing when none is ready', () => {
    // She is in ח' and will not master all of ז' first. "Nothing for you today"
    // is the worst possible answer to give a student who did open the app.
    const m = mastery([[INTEGERS, { introduced: true, level: 5 }]]);
    const next = nextTopic(input(m));
    expect(next).not.toBeNull();
    expect(next!.topicId).not.toBe(INTEGERS);
  });

  it('hides extension topics unless they are switched on', () => {
    const m = new Map<TopicId, MasteryRecord>();
    for (const topic of TOPIC_BY_ID.values()) {
      if (topic.tier === 'core') {
        m.set(topic.id, { ...newMastery(topic.id, TODAY, 0), introduced: true, level: 5 });
      }
    }
    expect(nextTopic({ mastery: m, today: TODAY, showExtensionTopics: false })).toBeNull();
  });
});

describe('the day plan', () => {
  it('pairs a short review with one new topic', () => {
    // INTEGERS is mastered and due, so it is a genuine review rather than the
    // thing today is about.
    const m = mastery([[INTEGERS, { introduced: true, level: 4, dueDate: '2026-09-01' }]]);
    const plan = buildTodayPlan(input(m));
    expect(plan.focus).not.toBeNull();
    expect(plan.focus).not.toBe(INTEGERS);
    expect(plan.review).toContain(INTEGERS);
    expect(plan.reason).toBe('new');
  });

  it('never warms up with the topic it is about to teach', () => {
    const m = mastery([[INTEGERS, { introduced: true, level: 0, dueDate: '2026-09-01' }]]);
    const plan = buildTodayPlan(input(m));
    expect(plan.review).not.toContain(plan.focus);
  });

  it('caps the warm-up so a backlog cannot swallow the session', () => {
    const m = mastery([
      [INTEGERS, { introduced: true, level: 1, dueDate: '2026-08-01' }],
      [FRACTIONS, { introduced: true, level: 1, dueDate: '2026-08-02' }],
      [EQUATIONS, { introduced: true, level: 1, dueDate: '2026-08-03' }],
    ]);
    expect(buildTodayPlan(input(m)).review.length).toBeLessThanOrEqual(3);
  });

  it('falls back to review when there is nothing new to teach', () => {
    const m = new Map<TopicId, MasteryRecord>();
    for (const topic of TOPIC_BY_ID.values()) {
      m.set(topic.id, {
        ...newMastery(topic.id, TODAY, 0),
        introduced: true,
        level: 5,
        dueDate: topic.id === INTEGERS ? '2026-09-01' : '2027-01-01',
      });
    }
    const plan = buildTodayPlan({ mastery: m, today: TODAY, showExtensionTopics: false });
    expect(plan.reason).toBe('review-only');
    expect(plan.focus).toBe(INTEGERS);
  });
});
