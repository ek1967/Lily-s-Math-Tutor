import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { coef, linearTex, signed, signedCoef } from '../tex';

const TOPIC = asTopicId('alg-distributive');

const openBrackets: ExerciseGenerator = {
  id: asGeneratorId('alg-distributive/open'),
  topicId: TOPIC,
  titleHe: 'פתיחת סוגריים',
  difficulty: 1,
  weight: 1.3,
  skills: ['algebra.distributive'],
  generate(rng) {
    const k = rng.nonZeroInt(-9, 9);
    const a = rng.nonZeroInt(-8, 9);
    const b = rng.nonZeroInt(-12, 12);
    const correct = linearTex(k * a, k * b);

    const distractors = [
      // Multiplying only the first term — the classic slip.
      linearTex(k * a, b),
      linearTex(a, k * b),
      linearTex(k * a, -k * b),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים?',
      promptTex: `${k === 1 ? '' : k === -1 ? '-' : k}\\left(${linearTex(a, b)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'מה שמחוץ לסוגריים מוכפל בכל אחד מהאיברים שבפנים, בלי לדלג' },
        { he: 'האיבר עם המשתנה', tex: `${k} \\cdot ${coef(a)} = ${coef(k * a)}` },
        { he: 'והמספר', tex: `${k} \\cdot ${b} = ${k * b}` },
        { he: 'הביטוי הפתוח', tex: correct },
      ],
      hints: [
        { level: 1, he: 'הכפל שמחוץ לסוגריים חל על כל מה שבתוכן, לא רק על הראשון.' },
        { level: 2, he: 'כדאי לצייר חץ מהמספר שבחוץ לכל איבר בפנים, ולא לפספס אף אחד.' },
        { level: 3, he: 'האיבר עם המשתנה יוצא כך. נשאר לטפל במספר.', tex: coef(k * a) },
      ],
    };
  },
};

/** A minus in front of the brackets — where most of the errors actually live. */
const minusBeforeBrackets: ExerciseGenerator = {
  id: asGeneratorId('alg-distributive/minus-before'),
  topicId: TOPIC,
  titleHe: 'מינוס לפני הסוגריים',
  difficulty: 2,
  weight: 1.4,
  skills: ['algebra.distributive', 'algebra.sign'],
  generate(rng) {
    const outsideA = rng.nonZeroInt(-8, 9);
    const outsideB = rng.nonZeroInt(-12, 12);
    const a = rng.nonZeroInt(-7, 8);
    const b = rng.nonZeroInt(-11, 11);

    const resultA = outsideA - a;
    const resultB = outsideB - b;
    const correct = resultA === 0 ? String(resultB) : linearTex(resultA, resultB);

    const distractors = [
      // Only the first term inside had its sign flipped.
      linearTex(outsideA - a, outsideB + b),
      linearTex(outsideA + a, outsideB + b),
      linearTex(outsideA - a, outsideB - b + 1),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים וכינוס?',
      promptTex: `${linearTex(outsideA, outsideB)} - \\left(${linearTex(a, b)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'מינוס לפני סוגריים הופך את הסימן של כל איבר בפנים, בלי יוצא מן הכלל' },
        { he: 'הסוגריים נפתחות כך', tex: `${signedCoef(-a)} ${signed(-b)}` },
        { he: 'ועכשיו מכנסים', tex: correct },
      ],
      hints: [
        { level: 1, he: 'מינוס לפני סוגריים הוא בעצם כפל במינוס אחד. מה זה עושה לכל איבר?' },
        {
          level: 2,
          he: 'כל האיברים בתוך הסוגריים מחליפים סימן — גם השני, לא רק הראשון.',
        },
        { level: 3, he: 'אחרי היפוך הסימנים הסוגריים נותנות את זה.', tex: `${signedCoef(-a)} ${signed(-b)}` },
      ],
    };
  },
};

/** Two bracketed groups, so distribution and collection have to work together. */
const twoGroups: ExerciseGenerator = {
  id: asGeneratorId('alg-distributive/two-groups'),
  topicId: TOPIC,
  titleHe: 'שתי קבוצות סוגריים',
  difficulty: 3,
  weight: 1,
  skills: ['algebra.distributive', 'algebra.collect'],
  generate(rng) {
    const k1 = rng.nonZeroInt(-6, 7);
    const k2 = rng.nonZeroInt(-6, 7);
    const a1 = rng.nonZeroInt(-5, 6);
    const b1 = rng.nonZeroInt(-9, 9);
    const a2 = rng.nonZeroInt(-5, 6);
    const b2 = rng.nonZeroInt(-9, 9);

    const totalA = k1 * a1 + k2 * a2;
    const totalB = k1 * b1 + k2 * b2;
    const correct = totalA === 0 ? String(totalB) : linearTex(totalA, totalB);

    const distractors = [
      linearTex(k1 * a1 + a2, k1 * b1 + b2),
      linearTex(totalA, k1 * b1 - k2 * b2),
      linearTex(totalA + 1, totalB),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים וכינוס?',
      promptTex: `${k1}\\left(${linearTex(a1, b1)}\\right) ${k2 < 0 ? '-' : '+'} ${Math.abs(k2)}\\left(${linearTex(a2, b2)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'פותחים כל זוג סוגריים בנפרד' },
        { he: 'הראשונות', tex: linearTex(k1 * a1, k1 * b1) },
        { he: 'והשניות', tex: linearTex(k2 * a2, k2 * b2) },
        { he: 'ואז מכנסים את הכול', tex: correct },
      ],
      hints: [
        { level: 1, he: 'שני שלבים: קודם פותחים, ורק אחר כך מכנסים. לא בבת אחת.' },
        { level: 2, he: 'שימי לב לסימן שלפני הסוגריים השניות — הוא חלק מהכפל.' },
        { level: 3, he: 'הסוגריים הראשונות נותנות את זה. עכשיו אותו דבר לשניות.', tex: linearTex(k1 * a1, k1 * b1) },
      ],
    };
  },
};

export const distributiveGenerators = [openBrackets, minusBeforeBrackets, twoGroups];
