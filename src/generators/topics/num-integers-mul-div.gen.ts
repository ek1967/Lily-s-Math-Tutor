import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { paren, signed } from '../tex';

const TOPIC = asTopicId('num-integers-mul-div');

/** The sign rule, on its own, before anything else is layered on top. */
const signRule: ExerciseGenerator = {
  id: asGeneratorId('num-integers-mul-div/sign-rule'),
  topicId: TOPIC,
  titleHe: 'כלל הסימנים',
  difficulty: 1,
  weight: 1.2,
  skills: ['integers.multiply', 'integers.sign-rule'],
  generate(rng) {
    const a = rng.nonZeroInt(-12, 12);
    const b = rng.nonZeroInt(-12, 12);
    const dividing = rng.bool(0.35);

    if (dividing) {
      const product = a * b;
      const result = product / a;
      const same = (product < 0) === (a < 0);
      return {
        promptHe: 'כמה יוצא?',
        promptTex: `${paren(product)} : ${paren(a)}`,
        input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
        answer: { kind: 'integer', value: result },
        solution: [
          { he: 'מחשבים קודם את המספרים בלי הסימנים', tex: `${Math.abs(product)} : ${Math.abs(a)} = ${Math.abs(result)}` },
          {
            he: same
              ? 'שני הסימנים זהים, אז התוצאה חיובית'
              : 'הסימנים שונים, אז התוצאה שלילית',
          },
          { he: 'התוצאה', tex: String(result) },
        ],
        hints: [
          { level: 1, he: 'קודם מחשבים את המספרים, ורק אחר כך מחליטים על הסימן.' },
          { level: 2, he: 'סימנים זהים נותנים תוצאה חיובית, סימנים שונים נותנים שלילית.' },
          {
            level: 3,
            he: 'המספר עצמו הוא זה, ונשאר להחליט אם הוא חיובי או שלילי.',
            tex: String(Math.abs(result)),
          },
        ],
      };
    }

    const result = a * b;
    const same = (a < 0) === (b < 0);
    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${paren(a)} \\cdot ${paren(b)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'כופלים את המספרים בלי הסימנים', tex: `${Math.abs(a)} \\cdot ${Math.abs(b)} = ${Math.abs(result)}` },
        {
          he: same
            ? 'שני הסימנים זהים, אז התוצאה חיובית'
            : 'הסימנים שונים, אז התוצאה שלילית',
        },
        { he: 'התוצאה', tex: String(result) },
      ],
      hints: [
        { level: 1, he: 'קודם הכפל, ורק אחר כך הסימן. שני דברים נפרדים.' },
        { level: 2, he: 'סימנים זהים נותנים פלוס, סימנים שונים נותנים מינוס.' },
        {
          level: 3,
          he: 'המכפלה עצמה היא זו, ונשאר להחליט על הסימן.',
          tex: String(Math.abs(result)),
        },
      ],
    };
  },
};

/** Order of operations with signed numbers — the two rules meeting. */
const withOrder: ExerciseGenerator = {
  id: asGeneratorId('num-integers-mul-div/with-order'),
  topicId: TOPIC,
  titleHe: 'תרגיל מעורב עם שליליים',
  difficulty: 2,
  weight: 1.2,
  skills: ['integers.multiply', 'integers.order-of-operations'],
  generate(rng) {
    const a = rng.nonZeroInt(-9, 9);
    const b = rng.nonZeroInt(-8, 8);
    const c = rng.nonZeroInt(-15, 15);
    const product = a * b;
    const result = product + c;

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${paren(a)} \\cdot ${paren(b)} ${signed(c)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'כפל לפני חיבור, אז מתחילים מהכפל', tex: `${paren(a)} \\cdot ${paren(b)} = ${product}` },
        { he: 'ואז מחברים', tex: `${product} ${signed(c)} = ${result}` },
      ],
      hints: [
        { level: 1, he: 'יש כאן שתי פעולות. איזו מהן קודמת?' },
        { level: 2, he: 'כפל תמיד לפני חיבור וחיסור. אז קודם הכפל, כולל הסימן שלו.' },
        { level: 3, he: 'הכפל נתן את המספר הזה. נשאר רק לחבר.', tex: String(product) },
      ],
    };
  },
};

/**
 * Powers of negatives, with a term attached. The parenthesised and bare forms
 * are deliberately mixed: `(-3)²` is 9 and `-3²` is −9, and not seeing that
 * distinction is the single most common sign mistake in ח'.
 */
const powers: ExerciseGenerator = {
  id: asGeneratorId('num-integers-mul-div/powers'),
  topicId: TOPIC,
  titleHe: 'שלילי בחזקה',
  difficulty: 3,
  weight: 0.9,
  skills: ['integers.multiply', 'integers.powers', 'integers.sign-rule'],
  generate(rng) {
    const magnitude = rng.int(2, 12);
    const exponent = rng.pick([2, 3] as const);
    const inBrackets = rng.bool(0.6);
    const extra = rng.nonZeroInt(-20, 20);

    const power = magnitude ** exponent;
    // Inside brackets the minus is part of the base; outside, it applies after.
    const signedPower = inBrackets
      ? exponent === 2
        ? power
        : -power
      : -power;
    const result = signedPower + extra;

    const powerTex = inBrackets
      ? `\\left(-${magnitude}\\right)^{${exponent}}`
      : `-${magnitude}^{${exponent}}`;

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${powerTex} ${signed(extra)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        {
          he: inBrackets
            ? 'הסוגריים אומרות שהמינוס הוא חלק מהמספר שמועלה בחזקה'
            : 'בלי סוגריים החזקה חלה רק על המספר, והמינוס נשאר בחוץ',
        },
        { he: 'מחשבים את החזקה', tex: `${magnitude}^{${exponent}} = ${power}` },
        { he: 'עם הסימן הנכון זה', tex: String(signedPower) },
        { he: 'ומוסיפים', tex: `${signedPower} ${signed(extra)} = ${result}` },
      ],
      hints: [
        { level: 1, he: 'הכי חשוב כאן: האם המינוס נמצא בתוך הסוגריים או מחוצה להן?' },
        {
          level: 2,
          he: inBrackets
            ? 'המינוס בתוך הסוגריים, אז הוא מוכפל בעצמו יחד עם המספר.'
            : 'אין סוגריים, אז החזקה חלה רק על המספר והמינוס נשאר בסוף.',
        },
        {
          level: 3,
          he: 'עד כאן קיבלנו את המספר הזה. נשאר רק לחבר את מה שנשאר.',
          tex: String(signedPower),
        },
      ],
    };
  },
};

export const integersMulDivGenerators = [signRule, withOrder, powers];
