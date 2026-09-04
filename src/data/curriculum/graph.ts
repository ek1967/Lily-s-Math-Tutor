import type { Topic, TopicId } from '@/types/curriculum';
import { CURRICULUM, TOPIC_BY_ID } from './index';

/**
 * The prerequisite graph is the reason this app is more than a worksheet
 * generator. When she stalls on Pythagoras the cause is usually square roots
 * underneath it, and `deepestUnmetPrerequisite` is what finds that.
 */

const DEPENDENTS: ReadonlyMap<TopicId, TopicId[]> = (() => {
  const m = new Map<TopicId, TopicId[]>();
  for (const t of CURRICULUM) m.set(t.id, []);
  for (const t of CURRICULUM) {
    for (const p of t.prerequisites) {
      const list = m.get(p);
      if (list) list.push(t.id);
    }
  }
  return m;
})();

/** Topics that list `id` as a prerequisite. */
export function dependentsOf(id: TopicId): readonly TopicId[] {
  return DEPENDENTS.get(id) ?? [];
}

/** Every prerequisite reachable from `id`, transitively. Cycle-safe. */
export function allPrerequisitesOf(id: TopicId): TopicId[] {
  const seen = new Set<TopicId>();
  const stack: TopicId[] = [...(TOPIC_BY_ID.get(id)?.prerequisites ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const p of TOPIC_BY_ID.get(cur)?.prerequisites ?? []) {
      if (!seen.has(p)) stack.push(p);
    }
  }
  return [...seen];
}

/**
 * The furthest-back topic she has not mastered that `id` depends on. This is
 * what turns "I got it wrong again" into "let's go back two steps first".
 * Returns null when every prerequisite is already known.
 */
export function deepestUnmetPrerequisite(
  id: TopicId,
  isKnown: (t: TopicId) => boolean,
): TopicId | null {
  const visiting = new Set<TopicId>();

  function walk(cur: TopicId): TopicId | null {
    if (visiting.has(cur)) return null; // defensive; the graph is acyclic
    visiting.add(cur);
    for (const p of TOPIC_BY_ID.get(cur)?.prerequisites ?? []) {
      // Go as deep as possible first: the earliest gap is the one worth fixing.
      const deeper = walk(p);
      if (deeper) return deeper;
      if (!isKnown(p)) return p;
    }
    return null;
  }

  return walk(id);
}

/** True when every prerequisite of `id` is known, i.e. it is safe to teach. */
export function isUnlocked(id: TopicId, isKnown: (t: TopicId) => boolean): boolean {
  return (TOPIC_BY_ID.get(id)?.prerequisites ?? []).every(isKnown);
}

/**
 * Kahn's algorithm. Returns `order` (prerequisites always before dependents)
 * and `cyclic` — any topic that could not be ordered, which means a cycle.
 */
export function topologicalOrder(): { order: Topic[]; cyclic: TopicId[] } {
  const indegree = new Map<TopicId, number>();
  for (const t of CURRICULUM) {
    // Only count edges to prerequisites that actually exist.
    indegree.set(t.id, t.prerequisites.filter((p) => TOPIC_BY_ID.has(p)).length);
  }

  const queue: TopicId[] = [];
  for (const [id, deg] of indegree) if (deg === 0) queue.push(id);
  queue.sort();

  const order: Topic[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    const topic = TOPIC_BY_ID.get(id);
    if (topic) order.push(topic);
    for (const dep of dependentsOf(id)) {
      const next = (indegree.get(dep) ?? 0) - 1;
      indegree.set(dep, next);
      if (next === 0) queue.push(dep);
    }
  }

  const cyclic = [...indegree].filter(([, deg]) => deg > 0).map(([id]) => id);
  return { order, cyclic };
}

/** Prerequisite ids that do not resolve to a real topic — a typo, always. */
export function danglingPrerequisites(): { topic: TopicId; missing: TopicId }[] {
  const out: { topic: TopicId; missing: TopicId }[] = [];
  for (const t of CURRICULUM) {
    for (const p of t.prerequisites) {
      if (!TOPIC_BY_ID.has(p)) out.push({ topic: t.id, missing: p });
    }
  }
  return out;
}
