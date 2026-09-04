import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { add, frac, gcd, lcm, sub, toTex } from '../fraction';
import { fracTex } from '../tex';

const TOPIC = asTopicId('num-fractions-add-sub');

/** Same denominator: only the numerators move. */
const sameDenominator: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-add-sub/same-denominator'),
  topicId: TOPIC,
  titleHe: 'אותו מכנה',
  difficulty: 1,
  weight: 1,
  skills: ['fractions.add', 'fractions.same-denominator'],
  generate(rng) {
    const d = rng.pick([3, 4, 5, 6, 8, 10, 12]);
    const adding = rng.bool(0.6);
    let n1 = rng.int(1, d - 1);
    let n2 = rng.int(1, d - 1);
    // Keep subtraction non-negative: negative fractions belong to a later topic.
    if (!adding && n2 > n1) [n1, n2] = [n2, n1];

    const a = frac(n1, d);
    const b = frac(n2, d);
    const result = adding ? add(a, b) : sub(a, b);
    const op = adding ? '+' : '-';
    const rawNumerator = adding ? n1 + n2 : n1 - n2;

    return {
      promptHe: 'כמה יוצא? אם אפשר לצמצם — לצמצם.',
      promptTex: `${fracTex(n1, d)} ${op} ${fracTex(n2, d)}`,
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: result.n, den: result.d, requireReduced: true },
      solution: [
        { he: 'המכנה כבר משותף, אז הוא לא משתנה' },
        { he: 'עושים את הפעולה רק על המונים', tex: `${fracTex(rawNumerator, d)}` },
        { he: 'ומצמצמים אם אפשר', tex: toTex(result) },
      ],
      hints: [
        { level: 1, he: 'שימי לב שהמכנה של שני השברים כבר זהה. מה זה אומר?' },
        { level: 2, he: 'המכנה נשאר כמו שהוא, והפעולה נעשית רק על המספרים למעלה.' },
        {
          level: 3,
          he: 'זה השבר שיוצא. נשאר לבדוק אם אפשר לצמצם אותו.',
          tex: fracTex(rawNumerator, d),
        },
      ],
    };
  },
};

/** One denominator is a multiple of the other — only one fraction is expanded. */
const oneMultipleOfOther: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-add-sub/nested-denominator'),
  topicId: TOPIC,
  titleHe: 'מכנה אחד מתחלק בשני',
  difficulty: 2,
  weight: 1.2,
  skills: ['fractions.add', 'fractions.common-denominator'],
  generate(rng) {
    const small = rng.pick([2, 3, 4, 5, 6]);
    const factor = rng.int(2, 5);
    const big = small * factor;

    // Numerators may exceed the denominator: improper fractions are part of the
    // topic, and a narrow range means she meets the same question all week.
    const n1 = rng.int(1, small * 2 - 1);
    const n2 = rng.int(1, big - 1);
    const adding = rng.bool(0.65);

    const a = frac(n1, small);
    const b = frac(n2, big);
    // Order the operands so a subtraction never goes below zero.
    const [left, right] = adding || a.n * b.d >= b.n * a.d ? [a, b] : [b, a];
    const result = adding ? add(left, right) : sub(left, right);
    const op = adding ? '+' : '-';

    const leftExpanded = frac(left.n * (big / left.d), big);
    const rightExpanded = frac(right.n * (big / right.d), big);
    const combined = adding
      ? leftExpanded.n + rightExpanded.n
      : leftExpanded.n - rightExpanded.n;

    return {
      promptHe: 'כמה יוצא? אם אפשר לצמצם — לצמצם.',
      promptTex: `${fracTex(left.n, left.d)} ${op} ${fracTex(right.n, right.d)}`,
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: result.n, den: result.d, requireReduced: true },
      solution: [
        { he: `המכנה המשותף הוא ${big}, כי הוא מתחלק בשני המכנים` },
        {
          he: 'מרחיבים ומקבלים',
          tex: `${fracTex(leftExpanded.n, big)} ${op} ${fracTex(rightExpanded.n, big)}`,
        },
        { he: 'מחברים את המונים', tex: fracTex(combined, big) },
        { he: 'ומצמצמים', tex: toTex(result) },
      ],
      hints: [
        { level: 1, he: 'המכנים שונים, אז קודם צריך מכנה משותף.' },
        {
          level: 2,
          he: `כאן זה נוח: ${big} מתחלק בשני המכנים, אז אפשר להשתמש בו.`,
        },
        {
          level: 3,
          he: 'אחרי ההרחבה זה נראה ככה. נשאר רק לחבר את המונים ולצמצם.',
          tex: `${fracTex(leftExpanded.n, big)} ${op} ${fracTex(rightExpanded.n, big)}`,
        },
      ],
    };
  },
};

/**
 * Coprime denominator pairs whose common denominator stays under 40. Anything
 * larger turns a fractions exercise into a long-multiplication exercise, which
 * is not what is being practised here.
 */
const COPRIME_PAIRS: readonly (readonly [number, number])[] = (() => {
  const out: [number, number][] = [];
  for (let a = 2; a <= 9; a += 1) {
    for (let b = a + 1; b <= 12; b += 1) {
      if (a * b <= 40 && gcd(a, b) === 1) out.push([a, b]);
    }
  }
  return out;
})();

/** Coprime denominators — both fractions have to be expanded. */
const coprimeDenominators: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-add-sub/coprime-denominator'),
  topicId: TOPIC,
  titleHe: 'שני מכנים שונים',
  difficulty: 3,
  weight: 1,
  skills: ['fractions.add', 'fractions.common-denominator', 'fractions.expand'],
  generate(rng) {
    const [d1, d2] = rng.pick(COPRIME_PAIRS);
    const n1 = rng.int(1, d1 * 2 - 1);
    const n2 = rng.int(1, d2 - 1);
    const adding = rng.bool(0.6);

    const a = frac(n1, d1);
    const b = frac(n2, d2);
    const [left, right] = adding || a.n * b.d >= b.n * a.d ? [a, b] : [b, a];
    const result = adding ? add(left, right) : sub(left, right);

    const common = lcm(d1, d2);
    const leftN = left.n * (common / left.d);
    const rightN = right.n * (common / right.d);
    const combined = adding ? leftN + rightN : leftN - rightN;
    const op = adding ? '+' : '-';

    return {
      promptHe: 'כמה יוצא? אם אפשר לצמצם — לצמצם.',
      promptTex: `${fracTex(left.n, left.d)} ${op} ${fracTex(right.n, right.d)}`,
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: result.n, den: result.d, requireReduced: true },
      solution: [
        { he: `המכנה המשותף הוא ${common}` },
        {
          he: 'מרחיבים את שני השברים',
          tex: `${fracTex(leftN, common)} ${op} ${fracTex(rightN, common)}`,
        },
        { he: 'ומחברים את המונים', tex: fracTex(combined, common) },
        { he: 'התשובה אחרי צמצום', tex: toTex(result) },
      ],
      hints: [
        { level: 1, he: 'אי אפשר לחבר שברים עם מכנים שונים. מה צריך לעשות קודם?' },
        {
          level: 2,
          he: `המכנה המשותף כאן הוא ${common}. כמה צריך להכפיל כל שבר כדי להגיע אליו?`,
        },
        {
          level: 3,
          he: 'אחרי ההרחבה זה נראה ככה, ונשאר רק לחבר את המונים.',
          tex: `${fracTex(leftN, common)} ${op} ${fracTex(rightN, common)}`,
        },
      ],
    };
  },
};

export const fractionsAddSubGenerators = [
  sameDenominator,
  oneMultipleOfOther,
  coprimeDenominators,
];
