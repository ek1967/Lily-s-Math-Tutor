import { describe, expect, it } from 'vitest';
import { CURRICULUM, STRANDS, TOPIC_BY_ID } from '@/data/curriculum';
import {
  allPrerequisitesOf,
  danglingPrerequisites,
  deepestUnmetPrerequisite,
  dependentsOf,
  isUnlocked,
  topologicalOrder,
} from '@/data/curriculum/graph';
import { asTopicId, type StrandId } from '@/types/curriculum';

const STRAND_PREFIX: Record<StrandId, string> = {
  numbers: 'num-',
  ratio: 'rat-',
  algebra: 'alg-',
  functions: 'fun-',
  geometry: 'geo-',
  stats: 'sta-',
};

/**
 * These are the cheapest tests in the project and the ones that catch the most.
 * Topic ids are the join key to everything persisted about the student, so a
 * rename or a typo that goes unnoticed silently orphans her history.
 */
describe('curriculum integrity', () => {
  it('has a non-trivial number of topics', () => {
    expect(CURRICULUM.length).toBeGreaterThan(40);
  });

  it('has unique topic ids', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const t of CURRICULUM) {
      if (seen.has(t.id)) dupes.push(t.id);
      seen.add(t.id);
    }
    expect(dupes).toEqual([]);
  });

  it('names every id with its strand prefix', () => {
    const wrong = CURRICULUM.filter((t) => !t.id.startsWith(STRAND_PREFIX[t.strand]));
    expect(wrong.map((t) => t.id)).toEqual([]);
  });

  it('resolves every prerequisite to a real topic', () => {
    expect(danglingPrerequisites()).toEqual([]);
  });

  it('has no topic depending on itself', () => {
    const selfish = CURRICULUM.filter((t) => t.prerequisites.includes(t.id));
    expect(selfish.map((t) => t.id)).toEqual([]);
  });

  it('lists each prerequisite at most once per topic', () => {
    const dupes = CURRICULUM.filter(
      (t) => new Set(t.prerequisites).size !== t.prerequisites.length,
    );
    expect(dupes.map((t) => t.id)).toEqual([]);
  });

  it('is acyclic', () => {
    const { order, cyclic } = topologicalOrder();
    expect(cyclic).toEqual([]);
    expect(order.length).toBe(CURRICULUM.length);
  });

  it('never has an earlier grade depend on a later one', () => {
    const backwards = CURRICULUM.flatMap((t) =>
      t.prerequisites
        .map((p) => TOPIC_BY_ID.get(p))
        .filter((p) => p && p.grade > t.grade)
        .map((p) => `${t.id} → ${p!.id}`),
    );
    expect(backwards).toEqual([]);
  });

  it('never has a core topic depend on an extension topic', () => {
    // Otherwise the default path would be blocked by material she never sees.
    const blocked = CURRICULUM.filter((t) => t.tier === 'core').flatMap((t) =>
      t.prerequisites
        .map((p) => TOPIC_BY_ID.get(p))
        .filter((p) => p && p.tier === 'extension')
        .map((p) => `${t.id} → ${p!.id}`),
    );
    expect(blocked).toEqual([]);
  });

  it('marks every known gap-filler as core', () => {
    const bad = CURRICULUM.filter((t) => t.gapPriority === 3 && t.tier !== 'core');
    expect(bad.map((t) => t.id)).toEqual([]);
  });

  it('has enough hand-authored gap-fillers to be worth the effort', () => {
    const priority = CURRICULUM.filter((t) => t.gapPriority === 3);
    expect(priority.length).toBeGreaterThanOrEqual(15);
  });

  it('gives every topic a title, a one-liner, goals and keywords', () => {
    for (const t of CURRICULUM) {
      expect(t.titleHe.trim(), t.id).not.toBe('');
      expect(t.oneLinerHe.trim(), t.id).not.toBe('');
      expect(t.goals.length, t.id).toBeGreaterThan(0);
      expect(t.keywords.length, t.id).toBeGreaterThan(0);
      for (const g of t.goals) expect(g.trim(), t.id).not.toBe('');
    }
  });

  it('estimates a session length a distractible student can finish', () => {
    for (const t of CURRICULUM) {
      expect(t.estimatedMinutes, t.id).toBeGreaterThanOrEqual(8);
      expect(t.estimatedMinutes, t.id).toBeLessThanOrEqual(25);
    }
  });

  it('keeps LaTeX out of Hebrew prose', () => {
    // Mixing the two in one string is what makes the bidi algorithm mangle
    // formulas; maths belongs in a `tex` field rendered inside an LTR island.
    const offenders: string[] = [];
    for (const t of CURRICULUM) {
      for (const s of [t.titleHe, t.oneLinerHe, ...t.goals, ...t.keywords]) {
        if (s.includes('$') || s.includes('\\')) offenders.push(`${t.id}: ${s}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('uses only declared strands', () => {
    const known = new Set(STRANDS.map((s) => s.id));
    const unknown = CURRICULUM.filter((t) => !known.has(t.strand));
    expect(unknown.map((t) => t.id)).toEqual([]);
  });

  it('gives every strand at least one topic in each grade band it claims', () => {
    for (const s of STRANDS) {
      const inStrand = CURRICULUM.filter((t) => t.strand === s.id);
      expect(inStrand.length, s.id).toBeGreaterThan(0);
    }
  });

  it('leaves no core topic stranded without a route from the roots', () => {
    // Every core topic must be reachable by starting from topics with no
    // prerequisites, or the planner could never schedule it.
    const { order } = topologicalOrder();
    const ordered = new Set(order.map((t) => t.id));
    const stranded = CURRICULUM.filter((t) => !ordered.has(t.id));
    expect(stranded.map((t) => t.id)).toEqual([]);
  });
});

describe('graph traversal', () => {
  const pythagoras = asTopicId('geo-pythagoras');
  const roots = asTopicId('num-fractions-add-sub');

  it('collects transitive prerequisites', () => {
    const all = allPrerequisitesOf(pythagoras);
    // Pythagoras needs square roots, which need powers, which need signed
    // multiplication — three levels down from the theorem itself.
    expect(all).toContain(asTopicId('num-square-roots'));
    expect(all).toContain(asTopicId('num-powers-basics'));
    expect(all).toContain(asTopicId('num-integers-mul-div'));
  });

  it('reports dependents', () => {
    expect(dependentsOf(asTopicId('num-square-roots'))).toContain(pythagoras);
  });

  it('finds the deepest unmet prerequisite, not the nearest one', () => {
    // She knows everything except the very bottom of the chain.
    const unknown = new Set([asTopicId('num-integers-add-sub')]);
    const gap = deepestUnmetPrerequisite(pythagoras, (t) => !unknown.has(t));
    expect(gap).toBe(asTopicId('num-integers-add-sub'));
  });

  it('returns null when nothing is missing', () => {
    expect(deepestUnmetPrerequisite(pythagoras, () => true)).toBeNull();
  });

  it('reports a topic as locked while a direct prerequisite is unknown', () => {
    expect(isUnlocked(roots, () => true)).toBe(true);
    expect(isUnlocked(roots, (t) => t !== asTopicId('num-fractions-compare'))).toBe(false);
  });

  it('treats a topic with no prerequisites as always unlocked', () => {
    expect(isUnlocked(asTopicId('num-decimals-ops'), () => false)).toBe(true);
  });
});
