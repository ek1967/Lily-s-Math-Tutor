import { describe, expect, it } from 'vitest';
import {
  add, cmp, div, eq, frac, gcd, hasExactDecimal, isReduced, lcm, mul, neg,
  sub, toMixed, toNumber, toPlain, toTex,
} from '@/generators/fraction';

/**
 * Answers are built from exact rationals rather than floats. A generator that
 * computes an answer in floating point eventually produces something like
 * 0.30000000000000004 and marks a correct answer wrong — a class of bug that
 * is invisible in review and unforgivable in use.
 */
describe('fraction arithmetic', () => {
  it('always reduces and keeps the sign on the numerator', () => {
    expect(toPlain(frac(6, 8))).toBe('3/4');
    expect(toPlain(frac(-6, 8))).toBe('-3/4');
    expect(toPlain(frac(6, -8))).toBe('-3/4');
    expect(toPlain(frac(-6, -8))).toBe('3/4');
    expect(frac(6, -8).d).toBeGreaterThan(0);
  });

  it('collapses to an integer when it can', () => {
    expect(toPlain(frac(8, 4))).toBe('2');
    expect(toPlain(frac(0, 7))).toBe('0');
  });

  it('refuses a zero denominator', () => {
    expect(() => frac(1, 0)).toThrow();
    expect(() => div(frac(1, 2), frac(0, 5))).toThrow();
  });

  it('refuses non-integer inputs rather than silently rounding', () => {
    expect(() => frac(1.5, 2)).toThrow();
  });

  it('adds exactly where floating point would not', () => {
    // 1/10 + 2/10 is exactly 3/10, unlike 0.1 + 0.2.
    expect(toPlain(add(frac(1, 10), frac(2, 10)))).toBe('3/10');
    expect(toPlain(add(frac(1, 3), frac(1, 6)))).toBe('1/2');
    expect(toPlain(add(frac(2, 3), frac(1, 3)))).toBe('1');
  });

  it('subtracts, multiplies and divides', () => {
    expect(toPlain(sub(frac(3, 4), frac(1, 4)))).toBe('1/2');
    expect(toPlain(sub(frac(1, 4), frac(3, 4)))).toBe('-1/2');
    expect(toPlain(mul(frac(2, 3), frac(3, 4)))).toBe('1/2');
    expect(toPlain(div(frac(1, 2), frac(1, 4)))).toBe('2');
    expect(toPlain(neg(frac(3, 4)))).toBe('-3/4');
  });

  it('compares by value, not by written form', () => {
    expect(cmp(frac(1, 2), frac(2, 4))).toBe(0);
    expect(cmp(frac(1, 3), frac(1, 2))).toBe(-1);
    expect(cmp(frac(-1, 2), frac(-3, 4))).toBe(1);
    expect(eq(frac(3, 6), frac(1, 2))).toBe(true);
  });

  it('computes gcd and lcm, including with negatives and zero', () => {
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(-12, 18)).toBe(6);
    expect(gcd(7, 0)).toBe(7);
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(3, 5)).toBe(15);
    expect(lcm(0, 5)).toBe(0);
  });

  it('splits into a mixed number, keeping the sign on the whole part', () => {
    expect(toMixed(frac(7, 3))).toEqual({ whole: 2, rest: frac(1, 3) });
    expect(toMixed(frac(-7, 3))).toEqual({ whole: -2, rest: frac(-1, 3) });
    expect(toMixed(frac(6, 3))).toEqual({ whole: 2, rest: frac(0, 1) });
  });

  it('knows which fractions terminate as decimals', () => {
    expect(hasExactDecimal(frac(1, 2))).toBe(true);
    expect(hasExactDecimal(frac(3, 20))).toBe(true);
    expect(hasExactDecimal(frac(1, 3))).toBe(false);
    expect(hasExactDecimal(frac(5, 6))).toBe(false);
  });

  it('renders TeX with the minus outside the fraction bar', () => {
    expect(toTex(frac(3, 4))).toBe('\\frac{3}{4}');
    expect(toTex(frac(-3, 4))).toBe('-\\frac{3}{4}');
    expect(toTex(frac(8, 4))).toBe('2');
  });

  it('reports whether a written pair is already in lowest terms', () => {
    expect(isReduced(3, 4)).toBe(true);
    expect(isReduced(6, 8)).toBe(false);
  });

  it('stays exact across a long chain of operations', () => {
    // 1/2 + 1/3 + 1/6 = 1, which floating point does not land on cleanly.
    const total = add(add(frac(1, 2), frac(1, 3)), frac(1, 6));
    expect(toPlain(total)).toBe('1');
    expect(toNumber(total)).toBe(1);
  });

  it('throws rather than silently losing precision on overflow', () => {
    expect(() => mul(frac(999999999, 1), frac(999999999, 1))).toThrow();
  });
});
