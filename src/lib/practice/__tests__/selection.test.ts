import { beforeAll, describe, expect, it } from 'vitest';
import { buildPracticeSet, pickGenerator, targetDifficulty } from '@/lib/practice/selection';
import { generatorsForTopic, registerAllGenerators } from '@/generators';
import { makeRng, makeScriptedRng } from '@/generators/rng';
import { asTopicId } from '@/types/curriculum';
import type { GeneratorId } from '@/types/exercise';

beforeAll(() => registerAllGenerators());

const TOPIC = asTopicId('alg-linear-eq-basic');

describe('difficulty targeting', () => {
  it('starts easy for a topic she has never seen', () => {
    expect(targetDifficulty(undefined)).toBe(1);
    expect(targetDifficulty(0)).toBe(1);
    expect(targetDifficulty(1)).toBe(1);
  });

  it('ramps only as mastery grows', () => {
    expect(targetDifficulty(2)).toBe(2);
    expect(targetDifficulty(3)).toBe(2);
    expect(targetDifficulty(4)).toBe(3);
    expect(targetDifficulty(5)).toBe(3);
  });
});

describe('pickGenerator', () => {
  const candidates = () => generatorsForTopic(TOPIC);

  it('returns nothing when a topic has no generators yet', () => {
    expect(pickGenerator([], {}, [], makeRng(1))).toBeUndefined();
  });

  it('favours the difficulty that matches her level', () => {
    // Scripted so the assertion is about the weighting, not about luck.
    const counts = new Map<number, number>();
    for (let seed = 1; seed <= 400; seed += 1) {
      const gen = pickGenerator(candidates(), { masteryLevel: 0 }, [], makeRng(seed))!;
      counts.set(gen.difficulty, (counts.get(gen.difficulty) ?? 0) + 1);
    }
    const easy = counts.get(1) ?? 0;
    const hard = counts.get(3) ?? 0;
    expect(easy).toBeGreaterThan(hard * 3);
  });

  it('avoids repeating what she just saw', () => {
    const all = candidates();
    const justSeen = all[0]!.id;
    let repeats = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const gen = pickGenerator(all, { masteryLevel: 2 }, [justSeen, justSeen, justSeen], makeRng(seed))!;
      if (gen.id === justSeen) repeats += 1;
    }
    expect(repeats / 300).toBeLessThan(0.2);
  });

  it('boosts generators covering a skill she keeps getting wrong', () => {
    const all = candidates();
    const weakSkill = all.find((g) => g.difficulty === 3)!.skills[0]!;
    let hits = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const gen = pickGenerator(all, { masteryLevel: 2, weakSkills: [weakSkill] }, [], makeRng(seed))!;
      if (gen.skills.includes(weakSkill)) hits += 1;
    }
    const baseline = (() => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed += 1) {
        const gen = pickGenerator(all, { masteryLevel: 2 }, [], makeRng(seed))!;
        if (gen.skills.includes(weakSkill)) n += 1;
      }
      return n;
    })();
    expect(hits).toBeGreaterThan(baseline);
  });

  it('holds back the hardest variant until the lesson has been seen', () => {
    const all = candidates();
    let hard = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const gen = pickGenerator(all, { masteryLevel: 5, introduced: false }, [], makeRng(seed))!;
      if (gen.difficulty === 3) hard += 1;
    }
    expect(hard / 300).toBeLessThan(0.5);
  });

  it('uses the rng it is handed rather than a global one', () => {
    const all = candidates();
    const a = pickGenerator(all, {}, [], makeScriptedRng([0.01]))!;
    const b = pickGenerator(all, {}, [], makeScriptedRng([0.01]))!;
    expect(a.id).toBe(b.id);
  });
});

describe('buildPracticeSet', () => {
  it('builds the requested number of exercises', () => {
    expect(buildPracticeSet(TOPIC, 12345, 6)).toHaveLength(6);
  });

  it('is fully reproducible from the seed', () => {
    const a = buildPracticeSet(TOPIC, 999, 8).map((e) => e.id);
    const b = buildPracticeSet(TOPIC, 999, 8).map((e) => e.id);
    expect(a).toEqual(b);
  });

  it('produces a different set for a different seed', () => {
    const a = buildPracticeSet(TOPIC, 1, 8).map((e) => e.id);
    const b = buildPracticeSet(TOPIC, 2, 8).map((e) => e.id);
    expect(a).not.toEqual(b);
  });

  it('never repeats the same question inside one set', () => {
    for (const seed of [1, 55, 900, 12345]) {
      const ids = buildPracticeSet(TOPIC, seed, 10).map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('returns an empty set for a topic with no generators', () => {
    expect(buildPracticeSet(asTopicId('geo-circle'), 1, 5)).toEqual([]);
  });

  it('mixes generators rather than serving one variant repeatedly', () => {
    const used = new Set<GeneratorId>(buildPracticeSet(TOPIC, 7, 10).map((e) => e.generatorId));
    expect(used.size).toBeGreaterThan(1);
  });
});
