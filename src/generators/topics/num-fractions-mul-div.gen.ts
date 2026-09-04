import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { div, frac, mul, toTex } from '../fraction';
import { fracTex } from '../tex';

const TOPIC = asTopicId('num-fractions-mul-div');

const multiply: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-mul-div/multiply'),
  topicId: TOPIC,
  titleHe: 'כפל שני שברים',
  difficulty: 1,
  weight: 1.2,
  skills: ['fractions.multiply'],
  generate(rng) {
    const d1 = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
    const d2 = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const n1 = rng.int(1, d1 * 2 - 1);
    const n2 = rng.int(1, d2 - 1);
    const result = mul(frac(n1, d1), frac(n2, d2));

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${fracTex(n1, d1)} \\cdot ${fracTex(n2, d2)}`,
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: result.n, den: result.d, requireReduced: true },
      solution: [
        { he: 'בכפל שברים אין צורך במכנה משותף' },
        { he: 'כופלים מונה במונה ומכנה במכנה', tex: fracTex(n1 * n2, d1 * d2) },
        { he: 'ומצמצמים', tex: toTex(result) },
      ],
      hints: [
        { level: 1, he: 'כפל שברים הוא הפעולה הקלה — לא צריך מכנה משותף בכלל.' },
        { level: 2, he: 'כופלים את המונים זה בזה, ואת המכנים זה בזה.' },
        {
          level: 3,
          he: 'זה השבר שיוצא לפני צמצום. נשאר רק לצמצם אותו.',
          tex: fracTex(n1 * n2, d1 * d2),
        },
      ],
    };
  },
};

const divide: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-mul-div/divide'),
  topicId: TOPIC,
  titleHe: 'חילוק שברים',
  difficulty: 2,
  weight: 1.3,
  skills: ['fractions.divide', 'fractions.reciprocal'],
  generate(rng) {
    const d1 = rng.pick([2, 3, 4, 5, 6, 7, 8]);
    const d2 = rng.pick([2, 3, 4, 5, 6, 7, 9]);
    const n1 = rng.int(1, d1 * 2 - 1);
    const n2 = rng.int(1, d2 - 1);
    const result = div(frac(n1, d1), frac(n2, d2));

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${fracTex(n1, d1)} : ${fracTex(n2, d2)}`,
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: result.n, den: result.d, requireReduced: true },
      solution: [
        { he: 'חילוק בשבר הוא כפל בשבר ההפוך שלו' },
        { he: 'הופכים את השבר השני', tex: `${fracTex(n2, d2)} \\to ${fracTex(d2, n2)}` },
        { he: 'ועכשיו זה תרגיל כפל', tex: `${fracTex(n1, d1)} \\cdot ${fracTex(d2, n2)}` },
        { he: 'התוצאה', tex: toTex(result) },
      ],
      hints: [
        { level: 1, he: 'חילוק בשבר הופך לכפל. במה כופלים?' },
        { level: 2, he: 'הופכים את השבר השני — המונה נהיה מכנה והמכנה נהיה מונה.' },
        {
          level: 3,
          he: 'אחרי ההיפוך זה כבר תרגיל כפל רגיל.',
          tex: `${fracTex(n1, d1)} \\cdot ${fracTex(d2, n2)}`,
        },
      ],
    };
  },
};

/** A fraction of a real quantity — where fractions stop being abstract. */
const fractionOfAmount: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-mul-div/of-amount'),
  topicId: TOPIC,
  titleHe: 'חלק מתוך כמות',
  difficulty: 3,
  weight: 1,
  skills: ['fractions.multiply', 'fractions.word-problem'],
  generate(rng) {
    const d = rng.pick([2, 3, 4, 5, 6, 8]);
    const n = rng.int(1, d - 1);
    const multiple = rng.int(2, 15);
    const total = d * multiple;
    const answer = n * multiple;

    const scenarios: { he: string; unit: string }[] = [
      { he: `בכיתה יש ${total} תלמידים`, unit: 'תלמידים' },
      { he: `בשקית יש ${total} סוכריות`, unit: 'סוכריות' },
      { he: `בספר יש ${total} עמודים`, unit: 'עמודים' },
      { he: `בקופסה יש ${total} עפרונות`, unit: 'עפרונות' },
    ];
    const scenario = rng.pick(scenarios);

    return {
      promptHe: `${scenario.he}. כמה זה החלק המסומן מתוכם?`,
      promptTex: fracTex(n, d),
      input: {
        kind: 'integer',
        keypad: 'numeric',
        allowNegative: false,
        unitHe: scenario.unit,
      },
      answer: { kind: 'integer', value: answer },
      solution: [
        { he: 'חלק מתוך כמות זה כפל', tex: `${fracTex(n, d)} \\cdot ${total}` },
        { he: `קודם מחלקים לחלקים שווים`, tex: `${total} : ${d} = ${multiple}` },
        { he: `ולוקחים ${n} חלקים כאלה`, tex: `${multiple} \\cdot ${n} = ${answer}` },
      ],
      hints: [
        { level: 1, he: 'המילה "מתוך" בשברים תמיד אומרת כפל.' },
        { level: 2, he: 'קודם מחלקים את הכמות למספר החלקים שהמכנה מציין.' },
        {
          level: 3,
          he: 'כל חלק כזה שווה למספר הזה. כמה חלקים צריך לקחת?',
          tex: String(multiple),
        },
      ],
    };
  },
};

export const fractionsMulDivGenerators = [multiply, divide, fractionOfAmount];
