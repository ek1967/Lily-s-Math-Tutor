import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { paren, signed } from '../tex';

const TOPIC = asTopicId('num-integers-add-sub');

/** Adding a signed number: walking left or right along the number line. */
const walk: ExerciseGenerator = {
  id: asGeneratorId('num-integers-add-sub/walk'),
  topicId: TOPIC,
  titleHe: 'חיבור וחיסור על ישר המספרים',
  difficulty: 1,
  weight: 1,
  skills: ['integers.add', 'integers.number-line'],
  generate(rng) {
    const a = rng.nonZeroInt(-20, 20);
    const b = rng.nonZeroInt(-15, 15);
    const result = a + b;
    const direction = b > 0 ? 'ימינה' : 'שמאלה';

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${a} ${signed(b)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: `מתחילים במספר`, tex: String(a) },
        { he: `זזים ${Math.abs(b)} צעדים ${direction}` },
        { he: 'ומגיעים ל', tex: String(result) },
      ],
      hints: [
        {
          level: 1,
          he: 'אפשר לדמיין ישר מספרים. איפה מתחילים, ולאיזה כיוון זזים?',
        },
        {
          // The starting number can be negative, so it goes in `tex` and is
          // rendered in an LTR island — inlined into Hebrew prose the bidi
          // algorithm moves the minus sign to the wrong side of the digits.
          level: 2,
          he: `הסימן של המספר השני אומר לזוז ${direction}. מתחילים מהמספר`,
          tex: String(a),
        },
        {
          level: 3,
          he: `זזים ${Math.abs(b)} צעדים ${direction}, החל מהמספר`,
          tex: String(a),
        },
      ],
    };
  },
};

/** The double sign: subtracting a negative, where most of the errors live. */
const doubleSign: ExerciseGenerator = {
  id: asGeneratorId('num-integers-add-sub/double-sign'),
  topicId: TOPIC,
  titleHe: 'שני סימנים ברצף',
  difficulty: 2,
  weight: 1.2,
  skills: ['integers.add', 'integers.double-sign'],
  generate(rng) {
    const a = rng.nonZeroInt(-15, 18);
    const b = rng.nonZeroInt(-14, 14);
    const subtracting = rng.bool();
    const result = subtracting ? a - b : a + b;
    const op = subtracting ? '-' : '+';
    const collapsed = subtracting ? -b : b;

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${a} ${op} ${paren(b)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'קודם מאחדים את שני הסימנים לסימן אחד' },
        { he: 'התרגיל הופך ל', tex: `${a} ${signed(collapsed)}` },
        { he: 'ומחשבים', tex: String(result) },
      ],
      hints: [
        {
          level: 1,
          he: 'יש כאן שני סימנים ברצף. הצעד הראשון הוא לאחד אותם לסימן אחד.',
        },
        {
          level: 2,
          he: 'שני סימנים שונים נותנים מינוס, שני סימנים זהים נותנים פלוס.',
        },
        {
          level: 3,
          he: 'אחרי איחוד הסימנים נשאר תרגיל חיבור פשוט. מה מקבלים?',
          tex: `${a} ${signed(collapsed)}`,
        },
      ],
    };
  },
};

/** Three terms in a row — the same idea, but she has to hold order. */
const chain: ExerciseGenerator = {
  id: asGeneratorId('num-integers-add-sub/chain'),
  topicId: TOPIC,
  titleHe: 'שרשרת של חיבור וחיסור',
  difficulty: 3,
  weight: 0.8,
  skills: ['integers.add', 'integers.chain'],
  generate(rng) {
    const a = rng.nonZeroInt(-14, 14);
    const b = rng.nonZeroInt(-12, 12);
    const c = rng.nonZeroInt(-12, 12);
    const first = a + b;
    const result = first + c;

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${a} ${signed(b)} ${signed(c)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'עובדים משמאל לימין, שני מספרים בכל פעם' },
        { he: 'קודם', tex: `${a} ${signed(b)} = ${first}` },
        { he: 'ואז', tex: `${first} ${signed(c)} = ${result}` },
      ],
      hints: [
        { level: 1, he: 'לא צריך לעשות הכול בבת אחת. קחי שני מספרים בכל פעם.' },
        { level: 2, he: 'תתחילי משני המספרים הראשונים בלבד.', tex: `${a} ${signed(b)}` },
        { level: 3, he: 'עד כאן קיבלנו את המספר הזה. נשאר רק השלב האחרון.', tex: String(first) },
      ],
    };
  },
};

export const integersAddSubGenerators = [walk, doubleSign, chain];
