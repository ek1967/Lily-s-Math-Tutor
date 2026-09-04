import type { Rng } from '@/types/exercise';

/**
 * mulberry32 — small, fast, and good enough for picking exercise parameters.
 * The point is not statistical quality but reproducibility: a stored
 * (generatorId, seed) pair regenerates the exact question she saw, so attempts
 * need not store question text and the parent screen can show the real thing.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number): Rng {
  const next = mulberry32(seed);

  const int = (min: number, max: number): number => {
    if (max < min) throw new Error(`int(${min}, ${max}): empty range`);
    return min + Math.floor(next() * (max - min + 1));
  };

  return {
    next,
    int,
    nonZeroInt(min, max) {
      if (min === 0 && max === 0) throw new Error('nonZeroInt(0, 0): no value possible');
      for (let i = 0; i < 50; i += 1) {
        const v = int(min, max);
        if (v !== 0) return v;
      }
      // Range is almost entirely zero; fall back to a deterministic non-zero end.
      return max !== 0 ? max : min;
    },
    pick(xs) {
      if (xs.length === 0) throw new Error('pick: empty array');
      return xs[int(0, xs.length - 1)]!;
    },
    weighted(xs, weights) {
      if (xs.length === 0) throw new Error('weighted: empty array');
      if (xs.length !== weights.length) throw new Error('weighted: length mismatch');
      const total = weights.reduce((a, b) => a + Math.max(0, b), 0);
      if (total <= 0) return xs[int(0, xs.length - 1)]!;
      let r = next() * total;
      for (let i = 0; i < xs.length; i += 1) {
        r -= Math.max(0, weights[i]!);
        if (r < 0) return xs[i]!;
      }
      return xs[xs.length - 1]!;
    },
    shuffle(xs) {
      const out = [...xs];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    bool(pTrue = 0.5) {
      return next() < pTrue;
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
  };
}

/**
 * Derives a step's seed from the session seed. A whole session replays from
 * (seedBase, plan), so an exact question can be recovered weeks later.
 * splitmix32-style avalanche, so adjacent steps are not correlated.
 */
export function deriveSeed(seedBase: number, step: number, salt = 0): number {
  let h = (seedBase ^ Math.imul(step + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97) >>> 0;
  return (h ^ (h >>> 15)) >>> 0;
}

/**
 * An Rng that returns a scripted sequence, for testing weighting logic exactly
 * rather than statistically. Runs off the end by cycling.
 */
export function makeScriptedRng(values: readonly number[]): Rng {
  if (values.length === 0) throw new Error('makeScriptedRng: no values');
  let i = 0;
  const scripted = makeRng(1);
  return {
    ...scripted,
    next: () => values[i++ % values.length]!,
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick(xs) {
      return xs[Math.min(xs.length - 1, Math.floor(this.next() * xs.length))]!;
    },
  };
}
