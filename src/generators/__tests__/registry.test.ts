import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { allGenerators, generatorsForTopic, getGenerator, registerAllGenerators } from '@/generators';

registerAllGenerators();

const TOPICS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'topics');

/**
 * Registration is written out by hand in generators/index.ts, which is what
 * makes renames fail loudly. The cost of that choice is that a new file can be
 * forgotten, so this test reads the directory and checks nothing is orphaned.
 */
describe('generator registry', () => {
  const files = readdirSync(TOPICS_DIR).filter((f) => f.endsWith('.gen.ts'));
  const registered = allGenerators();

  it('finds generator files on disk', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('registers every generator declared in %s', (file) => {
    // Filename is the topic id: `alg-linear-eq-basic.gen.ts`.
    const topicId = file.replace(/\.gen\.ts$/, '');
    const fromFile = registered.filter((g) => g.id.startsWith(`${topicId}/`));
    expect(
      fromFile.length,
      `${file} contributes no registered generator — is it missing from generators/index.ts?`,
    ).toBeGreaterThan(0);
  });

  it('has unique generator ids', () => {
    const ids = registered.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names every generator `topicId/variant`', () => {
    for (const g of registered) {
      expect(g.id, g.id).toBe(`${g.topicId}/${g.id.split('/')[1]}`);
      expect(g.id.split('/'), g.id).toHaveLength(2);
    }
  });

  it('points every generator at a real topic', () => {
    for (const g of registered) {
      expect(TOPIC_BY_ID.has(g.topicId), g.id).toBe(true);
    }
  });

  it('gives every generator a Hebrew title, a weight and at least one skill', () => {
    for (const g of registered) {
      expect(g.titleHe.trim(), g.id).not.toBe('');
      expect(g.weight, g.id).toBeGreaterThan(0);
      expect(g.skills.length, g.id).toBeGreaterThan(0);
      expect([1, 2, 3], g.id).toContain(g.difficulty);
    }
  });

  it('covers each topic it touches across more than one difficulty', () => {
    // A topic with only difficulty-3 generators has nowhere to fall back to
    // when she gets three wrong in a row.
    const byTopic = new Map<string, Set<number>>();
    for (const g of registered) {
      const set = byTopic.get(g.topicId) ?? new Set<number>();
      set.add(g.difficulty);
      byTopic.set(g.topicId, set);
    }
    for (const [topicId, difficulties] of byTopic) {
      expect(difficulties.size, `${topicId} has only one difficulty level`).toBeGreaterThan(1);
    }
  });

  it('looks generators up by id and by topic', () => {
    const first = registered[0]!;
    expect(getGenerator(first.id)).toBe(first);
    expect(generatorsForTopic(first.topicId)).toContain(first);
  });

  it('returns an empty list for a topic with no generators yet', () => {
    const covered = new Set(registered.map((g) => g.topicId));
    const uncovered = [...TOPIC_BY_ID.keys()].find((id) => !covered.has(id));
    if (uncovered) expect(generatorsForTopic(uncovered)).toEqual([]);
  });

  it('is idempotent — registering twice does not duplicate', () => {
    const before = allGenerators().length;
    registerAllGenerators();
    expect(allGenerators().length).toBe(before);
  });
});
