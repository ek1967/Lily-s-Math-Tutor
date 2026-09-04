/**
 * Small TeX builders. They exist so generators never hand-splice strings, which
 * is where "+-3" and doubled minus signs come from.
 */

/** A signed term inside an expression: 5 → "+ 5", -5 → "- 5". */
export function signed(n: number): string {
  return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
}

/** Wraps a negative number in parentheses: -5 → "(-5)", 5 → "5". */
export function paren(n: number): string {
  return n < 0 ? `\\left(${n}\\right)` : String(n);
}

export function fracTex(n: number, d: number): string {
  if (d === 1) return String(n);
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
}

export function mixedTex(whole: number, n: number, d: number): string {
  if (n === 0) return String(whole);
  const body = `${Math.abs(whole)}\\frac{${Math.abs(n)}}{${d}}`;
  return whole < 0 ? `-${body}` : body;
}

/** A coefficient in front of a variable: 1x → "x", -1x → "-x", 3x → "3x". */
export function coef(c: number, v = 'x'): string {
  if (c === 1) return v;
  if (c === -1) return `-${v}`;
  return `${c}${v}`;
}

/** A linear term as it appears after the first one: "+ 3x", "- x". */
export function signedCoef(c: number, v = 'x'): string {
  if (c === 0) return '';
  const magnitude = Math.abs(c) === 1 ? v : `${Math.abs(c)}${v}`;
  return c < 0 ? `- ${magnitude}` : `+ ${magnitude}`;
}

/** Builds `ax + b` with the awkward cases handled. */
export function linearTex(a: number, b: number, v = 'x'): string {
  if (a === 0) return String(b);
  if (b === 0) return coef(a, v);
  return `${coef(a, v)} ${signed(b)}`;
}

export const eq = (lhs: string, rhs: string): string => `${lhs} = ${rhs}`;
export const sqrtTex = (x: string | number): string => `\\sqrt{${x}}`;
export const powTex = (base: string | number, exp: string | number): string =>
  `${base}^{${exp}}`;
export const times = ' \\cdot ';
