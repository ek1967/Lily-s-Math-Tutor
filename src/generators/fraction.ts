/**
 * Exact rational arithmetic. Every fraction answer is built from integers and
 * never from floating point: a generator that computes 0.1 + 0.2 eventually
 * produces 0.30000000000000004 and marks a correct answer wrong, which costs
 * far more trust than it saves effort.
 *
 * Invariant on every Frac returned from this module: `d > 0` and gcd(|n|,d) = 1.
 */
export interface Frac {
  readonly n: number;
  readonly d: number;
}

/** Numerators and denominators stay well inside exact integer arithmetic. */
const MAX_MAGNITUDE = 1e12;

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

export function frac(n: number, d = 1): Frac {
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    throw new Error(`frac(${n}, ${d}): both parts must be integers`);
  }
  if (d === 0) throw new Error('frac: denominator is zero');
  // Keep the sign in the numerator so comparisons and rendering stay simple.
  let nn = d < 0 ? -n : n;
  let dd = Math.abs(d);
  const g = gcd(nn, dd) || 1;
  nn /= g;
  dd /= g;
  if (Math.abs(nn) > MAX_MAGNITUDE || dd > MAX_MAGNITUDE) {
    throw new Error(`frac(${n}, ${d}): out of exact range`);
  }
  return { n: nn, d: dd };
}

export const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);

export function div(a: Frac, b: Frac): Frac {
  if (b.n === 0) throw new Error('div: division by zero');
  return frac(a.n * b.d, a.d * b.n);
}

export const neg = (a: Frac): Frac => ({ n: -a.n, d: a.d });
export const abs = (a: Frac): Frac => ({ n: Math.abs(a.n), d: a.d });

/** -1, 0 or 1. */
export function cmp(a: Frac, b: Frac): -1 | 0 | 1 {
  const left = a.n * b.d;
  const right = b.n * a.d;
  return left < right ? -1 : left > right ? 1 : 0;
}

export const eq = (a: Frac, b: Frac): boolean => cmp(a, b) === 0;
export const isInteger = (a: Frac): boolean => a.d === 1;
export const isReduced = (n: number, d: number): boolean => d !== 0 && gcd(n, d) === 1;
export const toNumber = (a: Frac): number => a.n / a.d;

/** Whole part and remainder, e.g. 7/3 → { whole: 2, rest: 1/3 }. Sign on `whole`. */
export function toMixed(a: Frac): { whole: number; rest: Frac } {
  const whole = Math.trunc(a.n / a.d);
  return { whole, rest: frac(a.n - whole * a.d, a.d) };
}

/** True when the fraction has an exact, terminating decimal form. */
export function hasExactDecimal(a: Frac): boolean {
  let d = a.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

export function toTex(a: Frac): string {
  if (a.d === 1) return String(a.n);
  return a.n < 0 ? `-\\frac{${-a.n}}{${a.d}}` : `\\frac{${a.n}}{${a.d}}`;
}

/** Plain text form, for hints and normalised comparison: "-3/4". */
export function toPlain(a: Frac): string {
  return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
}
