import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { powTex } from '../tex';

const TOPIC = asTopicId('num-powers-laws');

/**
 * The laws of exponents.
 *
 * The answer asked for is almost always the exponent, not the value: two to the
 * eleventh is 2048, and computing it teaches nothing about why the exponents
 * were added. Keeping the question at the level of the exponent is what makes
 * the law visible.
 */

const BASES = [2, 3, 4, 5, 6, 7, 10] as const;

const multiplySameBase: ExerciseGenerator = {
  id: asGeneratorId('num-powers-laws/multiply-same-base'),
  topicId: TOPIC,
  titleHe: 'כפל חזקות עם אותו בסיס',
  difficulty: 1,
  weight: 1.3,
  skills: ['powers.multiply'],
  generate(rng) {
    const base = rng.pick(BASES);
    const m = rng.int(2, 9);
    const n = rng.int(2, 9);

    return {
      promptHe: 'הביטוי נכתב כחזקה אחת עם אותו בסיס. מה יהיה המעריך?',
      promptTex: `${powTex(base, m)} \\cdot ${powTex(base, n)}`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: m + n },
      solution: [
        {
          he: 'חזקה היא קיצור לכפל חוזר, אז כאן פשוט מכפילים את הבסיס עוד ועוד פעמים',
          tex: `\\underbrace{${base} \\cdots ${base}}_{${m}} \\cdot \\underbrace{${base} \\cdots ${base}}_{${n}}`,
        },
        {
          he: 'ולכן מספר הפעמים מתחבר',
          tex: `${powTex(base, m)} \\cdot ${powTex(base, n)} = ${powTex(base, m + n)}`,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'שווה לרגע לפרוש את שתי החזקות לכפל ארוך ולספור כמה פעמים הבסיס מופיע.',
        },
        { level: 2, he: 'כשמכפילים חזקות עם אותו בסיס, המעריכים מתחברים.' },
        { level: 3, he: 'זה החיבור שצריך לעשות בין המעריכים.', tex: `${m} + ${n}` },
      ],
    };
  },
};

const divideSameBase: ExerciseGenerator = {
  id: asGeneratorId('num-powers-laws/divide-same-base'),
  topicId: TOPIC,
  titleHe: 'חילוק חזקות ומעריך אפס',
  difficulty: 2,
  weight: 1.2,
  skills: ['powers.divide', 'powers.zero-exponent'],
  generate(rng) {
    const base = rng.pick(BASES);
    const n = rng.int(2, 9);
    // Sometimes exactly equal, which is where the zero exponent comes from and
    // where "it disappears" and "it becomes one" get confused.
    const equal = rng.bool(0.25);
    const m = equal ? n : n + rng.int(1, 9);

    return {
      promptHe: 'הביטוי נכתב כחזקה אחת עם אותו בסיס. מה יהיה המעריך?',
      // Written with a colon, the way Israeli textbooks write division, rather
      // than as a fraction: nesting an exponent inside \frac produces a "}}"
      // that the contract test reads as an unfilled template placeholder.
      promptTex: `${powTex(base, m)} : ${powTex(base, n)}`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: m - n },
      solution: [
        {
          he: 'בחילוק חזקות עם אותו בסיס מצמצמים את הבסיס שוב ושוב, ולכן המעריכים נחסרים',
          tex: `${powTex(base, m)} : ${powTex(base, n)} = ${powTex(base, m - n)}`,
        },
        ...(equal
          ? [
              {
                he: 'כאן שני המעריכים שווים, והתוצאה היא בסיס בחזקת אפס — שהיא תמיד אחת',
                tex: `${powTex(base, 0)} = 1`,
              },
            ]
          : []),
      ],
      hints: [
        {
          level: 1,
          he: 'זה אותו רעיון כמו בכפל, רק בכיוון ההפוך. מה קורה למעריכים כשמחלקים?',
        },
        { level: 2, he: 'בחילוק חזקות עם אותו בסיס מחסרים את המעריך של המכנה מזה של המונה.' },
        { level: 3, he: 'זה החיסור שצריך לעשות בין המעריכים.', tex: `${m} - ${n}` },
      ],
    };
  },
};

const powerOfPower: ExerciseGenerator = {
  id: asGeneratorId('num-powers-laws/power-of-power'),
  topicId: TOPIC,
  titleHe: 'חזקה של חזקה',
  difficulty: 3,
  weight: 1,
  skills: ['powers.power-of-power', 'powers.multiply', 'powers.divide'],
  generate(rng) {
    const base = rng.pick(BASES);
    const m = rng.int(2, 8);
    const n = rng.int(2, 6);
    const extra = rng.int(2, 9);
    const combined = rng.bool(0.5);

    // Either a bare power of a power, or one wrapped in a product — the case
    // where the two laws have to be applied in the right order.
    const promptTex = combined
      ? `${powTex(`\\left(${powTex(base, m)}\\right)`, n)} \\cdot ${powTex(base, extra)}`
      : powTex(`\\left(${powTex(base, m)}\\right)`, n);
    const value = combined ? m * n + extra : m * n;

    return {
      promptHe: 'הביטוי נכתב כחזקה אחת עם אותו בסיס. מה יהיה המעריך?',
      promptTex,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value },
      solution: [
        {
          he: 'חזקה של חזקה פירושה לחזור על החזקה הפנימית שוב ושוב, ולכן המעריכים מוכפלים',
          tex: `${powTex(`\\left(${powTex(base, m)}\\right)`, n)} = ${powTex(base, m * n)}`,
        },
        ...(combined
          ? [
              {
                he: 'ורק אז מגיע הכפל, שבו המעריכים מתחברים',
                tex: `${powTex(base, m * n)} \\cdot ${powTex(base, extra)} = ${powTex(base, value)}`,
              },
            ]
          : [{ he: 'וזה המעריך שמתקבל', tex: String(value) }]),
      ],
      hints: [
        {
          level: 1,
          he: 'יש כאן שני חוקים שונים, ולא כדאי להחיל אותם בבת אחת. מתחילים מהסוגריים.',
        },
        {
          level: 2,
          he: 'בחזקה של חזקה המעריכים מוכפלים; בכפל של חזקות הם מתחברים. קל להחליף ביניהם.',
        },
        {
          level: 3,
          he: 'זה המעריך שמתקבל מהסוגריים.',
          tex: `${m} \\cdot ${n} = ${m * n}`,
        },
      ],
    };
  },
};

export const powersLawsGenerators = [multiplySameBase, divideSameBase, powerOfPower];
