import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/db';
import { applyAttempts, getDueTopics, getMastery, getMasteryMap, markIntroduced } from '@/lib/db/repos/masteryRepo';
import { activeDays, recentAttemptsForTopic, saveAttempts, totalAttempts } from '@/lib/db/repos/attemptRepo';
import { getActiveSession, recentSessions, saveSession } from '@/lib/db/repos/sessionRepo';
import { getKv, setKv } from '@/lib/db/repos/kvRepo';
import { deleteMaterial, saveMaterial } from '@/lib/db/repos/materialRepo';
import { addMessage, createThread, getMessages, recentThreads } from '@/lib/db/repos/chatRepo';
import { asTopicId } from '@/types/curriculum';
import { asGeneratorId } from '@/types/exercise';
import type { AttemptRecord } from '@/lib/practice/engine';
import type { StudySession } from '@/types/session';

const TOPIC = asTopicId('num-fractions-add-sub');
const OTHER = asTopicId('num-integers-add-sub');

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
  msElapsed: 4000,
  at: Date.UTC(2026, 8, 4, 9, 0),
  ...over,
});

const session = (over: Partial<StudySession> = {}): StudySession => ({
  id: 's1',
  kind: 'daily',
  seedBase: 42,
  topicIds: [TOPIC],
  plan: [],
  currentStep: 0,
  startedAt: Date.UTC(2026, 8, 4, 9, 0),
  endedAt: null,
  outcome: 'active',
  stats: { attempted: 0, correct: 0, hintsUsed: 0, revealed: 0 },
  ...over,
});

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('mastery repository', () => {
  it('creates a record on first use and marks the topic introduced', async () => {
    const m = await markIntroduced(TOPIC, Date.UTC(2026, 8, 4, 9));
    expect(m.introduced).toBe(true);
    expect((await getMastery(TOPIC))?.level).toBe(0);
  });

  it('folds a good session into mastery and pushes the review out', async () => {
    const now = Date.UTC(2026, 8, 4, 9);
    const next = await applyAttempts(TOPIC, [attempt(), attempt(), attempt()], now);
    expect(next!.level).toBe(1);
    expect(next!.totalAttempts).toBe(3);
    expect(next!.totalCorrect).toBe(3);
    expect(next!.dueDate > '2026-09-04').toBe(true);
  });

  it('accumulates per-skill statistics across sessions', async () => {
    const now = Date.UTC(2026, 8, 4, 9);
    await applyAttempts(TOPIC, [attempt({ skills: ['fractions.add'] })], now);
    await applyAttempts(TOPIC, [attempt({ skills: ['fractions.add'], correct: 0 })], now);
    const m = await getMastery(TOPIC);
    expect(m!.skillStats['fractions.add']).toEqual({ attempts: 2, correct: 1 });
  });

  it('brings a topic back into today when the session went badly', async () => {
    const now = Date.UTC(2026, 8, 4, 9);
    await applyAttempts(TOPIC, [attempt(), attempt(), attempt()], now);
    const after = await applyAttempts(
      TOPIC,
      [attempt({ correct: 0 }), attempt({ correct: 0 }), attempt({ correct: 0 })],
      now,
    );
    expect(after!.dueDate).toBe('2026-09-04');
    expect(after!.lapses).toBe(1);
  });

  it('does nothing when there were no attempts', async () => {
    expect(await applyAttempts(TOPIC, [], Date.now())).toBeNull();
  });

  it('lists due topics and excludes ones not yet taught', async () => {
    const now = Date.UTC(2026, 8, 4, 9);
    await applyAttempts(TOPIC, [attempt({ correct: 0 })], now); // due today
    await db.mastery.put({
      ...(await getMastery(TOPIC))!,
      topicId: OTHER,
      introduced: false,
      dueDate: '2026-01-01',
    });
    const due = await getDueTopics('2026-09-04');
    expect(due.map((m) => m.topicId)).toEqual([TOPIC]);
  });

  it('returns a lookup map keyed by topic', async () => {
    await markIntroduced(TOPIC);
    const map = await getMasteryMap();
    expect(map.get(TOPIC)?.topicId).toBe(TOPIC);
  });
});

describe('attempt repository', () => {
  it('stores attempts against a session', async () => {
    await saveAttempts('s1', [attempt(), attempt({ correct: 0 })]);
    expect(await totalAttempts()).toBe(2);
    const rows = await recentAttemptsForTopic(TOPIC);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.sessionId).toBe('s1');
  });

  it('stores correctness as a number, because IndexedDB cannot index booleans', async () => {
    await saveAttempts('s1', [attempt()]);
    const row = (await recentAttemptsForTopic(TOPIC))[0]!;
    expect(typeof row.correct).toBe('number');
  });

  it('returns the most recent attempts first', async () => {
    await saveAttempts('s1', [
      attempt({ at: 1000, given: 'old' }),
      attempt({ at: 5000, given: 'new' }),
    ]);
    expect((await recentAttemptsForTopic(TOPIC))[0]!.given).toBe('new');
  });

  it('reports the distinct local days she worked', async () => {
    await saveAttempts('s1', [
      attempt({ at: Date.UTC(2026, 8, 4, 9) }),
      attempt({ at: Date.UTC(2026, 8, 4, 15) }),
      // 23:00 UTC is already the next day in Israel — this is the case a UTC
      // implementation would get wrong.
      attempt({ at: Date.UTC(2026, 8, 4, 23) }),
    ]);
    expect(await activeDays()).toEqual(['2026-09-04', '2026-09-05']);
  });

  it('does nothing when given no attempts', async () => {
    await saveAttempts('s1', []);
    expect(await totalAttempts()).toBe(0);
  });
});

describe('session repository', () => {
  it('remembers the session she walked away from', async () => {
    await saveSession(session());
    const active = await getActiveSession();
    expect(active?.id).toBe('s1');
  });

  it('clears the active pointer once the session ends', async () => {
    await saveSession(session());
    await saveSession(session({ outcome: 'completed', endedAt: Date.now() }));
    expect(await getActiveSession()).toBeUndefined();
  });

  it('lists recent sessions newest first', async () => {
    await saveSession(session({ id: 'a', startedAt: 1000, outcome: 'completed' }));
    await saveSession(session({ id: 'b', startedAt: 2000, outcome: 'completed' }));
    expect((await recentSessions()).map((s) => s.id)).toEqual(['b', 'a']);
  });
});

describe('key-value store', () => {
  it('round-trips a value', async () => {
    await setKv('x', { a: 1 });
    expect(await getKv<{ a: number }>('x')).toEqual({ a: 1 });
  });

  it('returns undefined for a key that was never set', async () => {
    expect(await getKv('missing')).toBeUndefined();
  });
});

describe('chat threads', () => {
  const thread = (id: string, updatedAt: number, over = {}) => ({
    id,
    kind: 'free' as const,
    titleHe: 'שאלה מהירה',
    createdAt: updatedAt,
    updatedAt,
    ...over,
  });

  it('lists the most recently used conversation first', async () => {
    await createThread(thread('a', Date.UTC(2026, 8, 1)));
    await createThread(thread('b', Date.UTC(2026, 8, 3)));
    await createThread(thread('c', Date.UTC(2026, 8, 2)));

    expect((await recentThreads()).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('takes a worksheet\'s conversations down with the worksheet', async () => {
    // A thread titled after a deleted worksheet is a dead link in her history.
    await saveMaterial(
      {
        id: 'mat-1',
        kind: 'image',
        titleHe: 'דף עבודה',
        status: 'new',
        pageCount: 0,
        bytes: 0,
        exercises: [],
        detectedTopicIds: [],
        thumbDataUrl: '',
        createdAt: Date.UTC(2026, 8, 1),
        updatedAt: Date.UTC(2026, 8, 1),
      },
      [],
    );
    await createThread(thread('mat-1:0', Date.UTC(2026, 8, 1), {
      kind: 'homework',
      materialId: 'mat-1',
    }));
    await createThread(thread('free-1', Date.UTC(2026, 8, 1)));
    await addMessage({
      threadId: 'mat-1:0',
      role: 'user',
      parts: [{ type: 'text', text: 'לא הבנתי' }],
      createdAt: Date.UTC(2026, 8, 1),
    });

    await deleteMaterial('mat-1');

    expect((await recentThreads()).map((t) => t.id)).toEqual(['free-1']);
    expect(await getMessages('mat-1:0')).toEqual([]);
  });
});
