import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { coef, eq, linearTex, signed } from '../tex';

const TOPIC = asTopicId('alg-linear-eq-basic');

/** One move: either an addition to undo, or a coefficient to divide out. */
const oneStep: ExerciseGenerator = {
  id: asGeneratorId('alg-linear-eq-basic/one-step'),
  topicId: TOPIC,
  titleHe: 'משוואה בשלב אחד',
  difficulty: 1,
  weight: 1,
  skills: ['equations.one-step', 'equations.inverse'],
  generate(rng) {
    const x = rng.nonZeroInt(-12, 15);
    const additive = rng.bool();

    if (additive) {
      const b = rng.nonZeroInt(-15, 15);
      const rhs = x + b;
      return {
        promptHe: 'מה הערך של המשתנה?',
        promptTex: eq(`x ${signed(b)}`, String(rhs)),
        input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
        answer: { kind: 'integer', value: x },
        solution: [
          { he: `כדי לבודד את x מבטלים את ${b > 0 ? 'החיבור' : 'החיסור'}` },
          { he: 'מבצעים את הפעולה ההפוכה בשני האגפים', tex: eq('x', `${rhs} ${signed(-b)}`) },
          { he: 'ומקבלים', tex: eq('x', String(x)) },
        ],
        hints: [
          { level: 1, he: 'המטרה היא להשאיר את x לבד באגף אחד. מה מפריע לו שם?' },
          {
            level: 2,
            he: `יש ${b > 0 ? 'חיבור' : 'חיסור'} של ${Math.abs(b)}. הפעולה ההפוכה תבטל אותו.`,
          },
          { level: 3, he: 'נשאר רק לחשב את הצד הימני.', tex: eq('x', `${rhs} ${signed(-b)}`) },
        ],
      };
    }

    const a = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]) * rng.sign();
    const rhs = a * x;
    return {
      promptHe: 'מה הערך של המשתנה?',
      promptTex: eq(coef(a), String(rhs)),
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: x },
      solution: [
        { he: 'המשתנה מוכפל במספר הזה', tex: String(a) },
        { he: 'מחלקים את שני האגפים באותו מספר', tex: eq('x', `\\frac{${rhs}}{${a}}`) },
        { he: 'ומקבלים', tex: eq('x', String(x)) },
      ],
      hints: [
        { level: 1, he: 'מה עושים ל-x כרגע? הפעולה ההפוכה תשחרר אותו.' },
        { level: 2, he: 'הוא מוכפל במספר הזה, אז צריך לחלק — ובשני האגפים.', tex: String(a) },
        { level: 3, he: 'נשאר רק לחשב את החילוק.', tex: `\\frac{${rhs}}{${a}}` },
      ],
    };
  },
};

/** ax + b = c — the shape most of ח' is built on. */
const twoStep: ExerciseGenerator = {
  id: asGeneratorId('alg-linear-eq-basic/two-step'),
  topicId: TOPIC,
  titleHe: 'משוואה בשני שלבים',
  difficulty: 2,
  weight: 1.3,
  skills: ['equations.two-step', 'equations.inverse'],
  generate(rng) {
    const x = rng.nonZeroInt(-10, 12);
    const a = rng.pick([2, 3, 4, 5, 6, 7]) * (rng.bool(0.75) ? 1 : -1);
    const b = rng.nonZeroInt(-14, 14);
    const c = a * x + b;
    const afterMove = c - b;

    return {
      promptHe: 'מה הערך של המשתנה?',
      promptTex: eq(linearTex(a, b), String(c)),
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: x },
      solution: [
        { he: 'קודם מעבירים את המספר החופשי לאגף השני ומשנים סימן' },
        { he: 'מקבלים', tex: eq(coef(a), `${c} ${signed(-b)}`) },
        { he: 'כלומר', tex: eq(coef(a), String(afterMove)) },
        { he: 'ואז מחלקים במקדם ומקבלים', tex: eq('x', String(x)) },
      ],
      hints: [
        { level: 1, he: 'שני שלבים: קודם להיפטר מהמספר החופשי, ואחר כך מהמקדם.' },
        {
          level: 2,
          he: 'מעבירים את המספר החופשי לאגף השני. כשמעבירים אגף — הסימן מתהפך.',
          tex: String(b),
        },
        {
          level: 3,
          he: 'הגענו לכאן. נשאר רק לחלק במקדם של המשתנה.',
          tex: eq(coef(a), String(afterMove)),
        },
      ],
    };
  },
};

/** The variable on both sides — where "collect first" has to become a habit. */
const bothSides: ExerciseGenerator = {
  id: asGeneratorId('alg-linear-eq-basic/both-sides'),
  topicId: TOPIC,
  titleHe: 'משתנה בשני האגפים',
  difficulty: 3,
  weight: 1,
  skills: ['equations.both-sides', 'equations.collect'],
  generate(rng) {
    const x = rng.nonZeroInt(-8, 10);
    // Different coefficients, so the variable does not vanish from the equation.
    const a = rng.int(3, 9);
    const c = rng.int(1, a - 1);
    const b = rng.nonZeroInt(-12, 12);
    const d = (a - c) * x + b;

    const leftCoef = a - c;
    const rhsAfter = d - b;

    return {
      promptHe: 'מה הערך של המשתנה?',
      promptTex: eq(linearTex(a, b), linearTex(c, d)),
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: x },
      solution: [
        { he: 'מכנסים את המשתנים לאגף אחד ואת המספרים לאגף השני' },
        { he: 'מעבירים את המשתנה מימין לשמאל', tex: eq(linearTex(leftCoef, b), String(d)) },
        { he: 'מעבירים את המספר החופשי ימינה', tex: eq(coef(leftCoef), String(rhsAfter)) },
        { he: `ומחלקים ב־${leftCoef}`, tex: eq('x', String(x)) },
      ],
      hints: [
        { level: 1, he: 'יש משתנה בשני הצדדים. הצעד הראשון הוא לאסוף אותם לצד אחד.' },
        {
          level: 2,
          he: 'מעבירים את המשתנה מהאגף הימני לשמאלי — וכמו תמיד, הסימן מתהפך.',
          tex: eq(linearTex(leftCoef, b), String(d)),
        },
        {
          level: 3,
          he: 'עכשיו זו כבר משוואה רגילה בשני שלבים.',
          tex: eq(coef(leftCoef), String(rhsAfter)),
        },
      ],
    };
  },
};

export const linearEqBasicGenerators = [oneStep, twoStep, bothSides];
