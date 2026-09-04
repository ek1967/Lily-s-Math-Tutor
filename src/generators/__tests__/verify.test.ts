import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeInput, parseAsFraction, parseAsNumber } from '@/generators/verify';
import { toPlain } from '@/generators/fraction';
import type { Answer } from '@/types/exercise';

/**
 * She will not type a canonical answer. Every row here is a form a real student
 * on a real phone produces, and every one of them is correct — a gap in this
 * table reaches her as "the app said I was wrong when I wasn't".
 */
describe('normalizeInput', () => {
  const cases: [string, string, string][] = [
    ['−5', '-5', 'Unicode minus from the iOS keyboard'],
    ['‒5', '-5', 'figure dash'],
    ['–5', '-5', 'en dash'],
    ['‏-5‎', '-5', 'bidi marks injected by an RTL input'],
    ['  7  ', '7', 'stray whitespace'],
    ['+9', '9', 'explicit plus'],
    ['- 4', '-4', 'space after the minus'],
    ['1,5', '1.5', 'comma as a decimal separator'],
    ['1,000', '1000', 'comma as a thousands separator'],
    ['8.5%', '8.5', 'percent sign left on'],
    ['12 ס״מ', '12', 'unit dragged along'],
    ['45 מעלות', '45', 'Hebrew unit word'],
    ['٣٤', '34', 'Arabic-Indic digits'],
    ['3⁄4', '3/4', 'fraction slash'],
    ['½', '1/2', 'vulgar fraction'],
    ['2 ½', '2 1/2', 'mixed number written with a vulgar fraction'],
  ];

  it.each(cases)('reads %s as %s (%s)', (input, expected) => {
    expect(normalizeInput(input)).toBe(expected);
  });
});

describe('parseAsFraction', () => {
  const cases: [string, string][] = [
    ['3/4', '3/4'],
    ['6/8', '3/4'],
    ['-3/4', '-3/4'],
    ['3/-4', '-3/4'],
    ['5', '5'],
    ['-5', '-5'],
    ['0.5', '1/2'],
    ['0.25', '1/4'],
    ['1.5', '3/2'],
    ['-0.75', '-3/4'],
    ['2 1/3', '7/3'],
    ['-2 1/3', '-7/3'],
    ['.5', '1/2'],
  ];

  it.each(cases)('parses %s as %s', (input, expected) => {
    const f = parseAsFraction(input);
    expect(f).not.toBeNull();
    expect(toPlain(f!)).toBe(expected);
  });

  it.each([['abc'], [''], ['   '], ['3/0'], ['1/2/3'], ['x']])(
    'refuses to guess at %s',
    (input) => {
      expect(parseAsFraction(input)).toBeNull();
    },
  );

  it('reads decimals exactly, without float drift', () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004; going through exact
    // rationals is what stops a correct answer being marked wrong.
    expect(toPlain(parseAsFraction('0.1')!)).toBe('1/10');
    expect(parseAsNumber('0.3')).toBeCloseTo(0.3, 12);
  });
});

describe('checkAnswer', () => {
  it('accepts an integer written any of the usual ways', () => {
    const a: Answer = { kind: 'integer', value: -7 };
    for (const given of ['-7', '−7', ' -7 ', '‏-7', '-7.0']) {
      expect(checkAnswer(a, given).correct, given).toBe(true);
    }
    expect(checkAnswer(a, '7').correct).toBe(false);
  });

  it('flags an empty answer as unreadable rather than wrong', () => {
    // The UI says "write something first" instead of marking her wrong.
    expect(checkAnswer({ kind: 'integer', value: 3 }, '')).toEqual({
      correct: false,
      unparsed: true,
    });
  });

  it('accepts an equivalent fraction when reducing is not the point', () => {
    const a: Answer = { kind: 'fraction', num: 1, den: 2, requireReduced: false };
    for (const given of ['1/2', '2/4', '50/100', '0.5']) {
      expect(checkAnswer(a, given).correct, given).toBe(true);
    }
  });

  it('marks an unreduced fraction as needing reducing, not as wrong', () => {
    const a: Answer = { kind: 'fraction', num: 1, den: 2, requireReduced: true };
    const verdict = checkAnswer(a, '2/4');
    expect(verdict.correct).toBe(false);
    // The distinction matters: she did the maths right, and the UI should say
    // "almost — it can be reduced further" rather than treat it as a failure.
    expect(verdict.needsReducing).toBe(true);
    expect(checkAnswer(a, '1/2').correct).toBe(true);
  });

  it('accepts a decimal within the declared tolerance', () => {
    const a: Answer = { kind: 'decimal', value: 3.14, decimals: 2, tolerance: 0.005 };
    expect(checkAnswer(a, '3.14').correct).toBe(true);
    expect(checkAnswer(a, '3,14').correct).toBe(true);
    expect(checkAnswer(a, '3.1').correct).toBe(false);
  });

  it('compares expressions ignoring spacing and multiplication signs', () => {
    const a: Answer = { kind: 'expression', canonical: '3x+5', acceptedForms: ['5+3x'] };
    for (const given of ['3x+5', '3x + 5', '3·x+5', '5 + 3x', '3*x+5']) {
      expect(checkAnswer(a, given).correct, given).toBe(true);
    }
    expect(checkAnswer(a, '3x-5').correct).toBe(false);
  });

  it('checks every part of a tuple answer', () => {
    const a: Answer = {
      kind: 'tuple',
      labelsHe: ['היקף', 'שטח'],
      parts: [
        { kind: 'integer', value: 20 },
        { kind: 'integer', value: 24 },
      ],
    };
    expect(checkAnswer(a, ['20', '24']).correct).toBe(true);
    expect(checkAnswer(a, ['20', '25']).correct).toBe(false);
    expect(checkAnswer(a, ['20']).unparsed).toBe(true);
  });

  it('reads a choice by index', () => {
    const a: Answer = {
      kind: 'choice',
      correctIndex: 2,
      options: [{ tex: '1' }, { tex: '2' }, { tex: '3' }],
    };
    expect(checkAnswer(a, '2').correct).toBe(true);
    expect(checkAnswer(a, '0').correct).toBe(false);
  });
});
