import type { Answer, Verdict } from '@/types/exercise';
import { frac, gcd, toPlain, type Frac } from './fraction';

/**
 * Reading what she actually typed. She will not type a clean canonical form:
 * an RTL input silently injects direction marks, iOS offers a Unicode minus,
 * a comma turns up as a decimal separator, units get dragged along, and a
 * fraction arrives unreduced. Every one of those is a correct answer and must
 * be read as one — a normalisation gap presents as "the app said I was wrong".
 */

const VULGAR: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

export function normalizeInput(raw: string): string {
  let s = raw ?? '';

  // Bidi control characters: invisible, and inserted by RTL text fields.
  s = s.replace(/[‎‏‪-‮⁦-⁩؜]/g, '');
  // Every dash-like character people and keyboards produce.
  s = s.replace(/[−‒–—―﹣－]/g, '-');
  // Arabic-Indic digits, in case of a non-Hebrew keyboard.
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  // Fraction slash and vulgar fractions.
  s = s.replace(/⁄/g, '/');
  for (const [glyph, plain] of Object.entries(VULGAR)) s = s.split(glyph).join(` ${plain}`);

  s = s.replace(/\s+/g, ' ').trim();

  // A comma is a decimal separator when it sits between digits with one or two
  // digits after it; anything else is a thousands separator and gets dropped.
  s = /^-?\d+,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');

  // Trailing units and stray punctuation: "12 ס״מ", "45 מעלות", "8.5%".
  s = s.replace(/%$/, '').trim();
  s = s.replace(/[\s]*[֐-׿"'׳״.]+$/u, '').trim();

  // "+5" is just 5; "- 5" is -5.
  s = s.replace(/^\+/, '').replace(/^-\s+/, '-');

  return s;
}

/** Parses an integer, a decimal, "a/b", or a mixed "2 1/3". Null when unreadable. */
export function parseAsFraction(raw: string): Frac | null {
  const s = normalizeInput(raw);
  if (s === '') return null;

  // Mixed number: "2 1/3" or "-2 1/3".
  const mixed = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (mixed) {
    const [, sign, whole, n, d] = mixed;
    const den = Number(d);
    if (den === 0) return null;
    const value = Number(whole) * den + Number(n);
    return frac(sign === '-' ? -value : value, den);
  }

  const ratio = /^(-?\d+)\/(-?\d+)$/.exec(s);
  if (ratio) {
    const den = Number(ratio[2]);
    if (den === 0) return null;
    return frac(Number(ratio[1]), den);
  }

  if (/^-?\d+$/.test(s)) return frac(Number(s));

  const dec = /^(-?)(\d*)\.(\d+)$/.exec(s);
  if (dec) {
    const [, sign, whole, decimals] = dec;
    const den = 10 ** decimals!.length;
    const num = Number(`${whole || '0'}${decimals}`);
    return frac(sign === '-' ? -num : num, den);
  }

  return null;
}

export function parseAsNumber(raw: string): number | null {
  const f = parseAsFraction(raw);
  return f === null ? null : f.n / f.d;
}

/** Whitespace- and notation-insensitive form for comparing algebraic answers. */
export function normalizeExpression(raw: string): string {
  return normalizeInput(raw)
    .toLowerCase()
    .replace(/[×·*]/g, '')
    .replace(/\s+/g, '')
    .replace(/^\+/, '');
}

/** What a correct input looks like. The contract test feeds this back in. */
export function canonicalInput(answer: Answer): string | string[] {
  switch (answer.kind) {
    case 'integer':
      return String(answer.value);
    case 'decimal':
      return answer.value.toFixed(answer.decimals);
    case 'fraction':
      return toPlain(frac(answer.num, answer.den));
    case 'choice':
      return String(answer.correctIndex);
    case 'expression':
      return answer.canonical;
    case 'tuple':
      return answer.parts.map((p) => canonicalInput(p) as string);
  }
}

export function checkAnswer(answer: Answer, raw: string | string[]): Verdict {
  if (answer.kind === 'tuple') {
    const given = Array.isArray(raw) ? raw : [raw];
    if (given.length !== answer.parts.length) return { correct: false, unparsed: true };
    const results = answer.parts.map((p, i) => checkAnswer(p, given[i] ?? ''));
    return {
      correct: results.every((r) => r.correct),
      unparsed: results.some((r) => r.unparsed),
      needsReducing: results.some((r) => r.needsReducing),
    };
  }

  const given = Array.isArray(raw) ? (raw[0] ?? '') : raw;
  const s = normalizeInput(given);
  if (s === '') return { correct: false, unparsed: true };

  switch (answer.kind) {
    case 'integer': {
      const value = parseAsFraction(s);
      if (value === null) return { correct: false, unparsed: true };
      return { correct: value.d === 1 && value.n === answer.value };
    }

    case 'decimal': {
      const value = parseAsNumber(s);
      if (value === null) return { correct: false, unparsed: true };
      return { correct: Math.abs(value - answer.value) <= answer.tolerance };
    }

    case 'fraction': {
      const value = parseAsFraction(s);
      if (value === null) return { correct: false, unparsed: true };
      const target = frac(answer.num, answer.den);
      // Compare by value, so 3/6 and 1/2 are both right. When the topic is
      // reducing, the UI says "almost — it can be reduced further" instead of
      // marking a mathematically correct answer wrong.
      if (value.n * target.d !== target.n * value.d) return { correct: false };
      if (answer.requireReduced && !isGivenReduced(s)) {
        return { correct: false, needsReducing: true };
      }
      return { correct: true };
    }

    case 'choice': {
      const idx = Number.parseInt(s, 10);
      if (Number.isNaN(idx)) return { correct: false, unparsed: true };
      return { correct: idx === answer.correctIndex };
    }

    case 'expression': {
      const norm = normalizeExpression(s);
      const accepted = [answer.canonical, ...answer.acceptedForms].map(normalizeExpression);
      return { correct: accepted.includes(norm) };
    }
  }
}

/** Whether the literal text she typed is already in lowest terms. */
function isGivenReduced(normalized: string): boolean {
  const ratio = /^(-?\d+)\/(-?\d+)$/.exec(normalized);
  if (!ratio) return true; // an integer or decimal cannot be "unreduced"
  return gcd(Number(ratio[1]), Number(ratio[2])) === 1;
}
