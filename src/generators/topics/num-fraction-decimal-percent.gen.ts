import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator, type Rng } from '@/types/exercise';
import { gcd } from '../fraction';
import { fracTex } from '../tex';

const TOPIC = asTopicId('num-fraction-decimal-percent');

/**
 * The same number in three languages.
 *
 * Every value is chosen as a whole number of hundredths and only then written
 * as a fraction. That guarantees all three forms exist exactly: a third written
 * as 0.333… would turn a conversion exercise into a rounding exercise, and the
 * point here is that these are three spellings of one quantity, not three
 * approximations of it.
 */

interface Trio {
  num: number;
  den: number;
  /** Hundredths — the common currency of all three forms. */
  hundredths: number;
}

function pickTrio(rng: Rng): Trio {
  const hundredths = rng.int(1, 99);
  const g = gcd(hundredths, 100);
  return { num: hundredths / g, den: 100 / g, hundredths };
}

/** How many digits the decimal form needs: 0.30 is written 0.3. */
const placesFor = (hundredths: number): 1 | 2 => (hundredths % 10 === 0 ? 1 : 2);

const decimalForm = (hundredths: number): string =>
  (hundredths / 100).toFixed(placesFor(hundredths));

const fractionToDecimal: ExerciseGenerator = {
  id: asGeneratorId('num-fraction-decimal-percent/fraction-to-decimal'),
  topicId: TOPIC,
  titleHe: 'משבר לעשרוני',
  difficulty: 1,
  weight: 1.3,
  skills: ['conversion.fraction-decimal'],
  generate(rng) {
    const { num, den, hundredths } = pickTrio(rng);
    const places = placesFor(hundredths);
    const target = places === 1 ? 10 : 100;
    const scaled = places === 1 ? hundredths / 10 : hundredths;
    const factor = target / den;
    const answer = decimalForm(hundredths);

    return {
      promptHe: 'איך כותבים את השבר הזה כמספר עשרוני?',
      promptTex: fracTex(num, den),
      input: { kind: 'decimal', keypad: 'numeric', allowNegative: false },
      answer: {
        kind: 'decimal',
        value: hundredths / 100,
        decimals: places,
        tolerance: 0.5 / 10 ** (places + 1),
      },
      solution: [
        {
          he: 'מרחיבים את השבר כך שהמכנה יהיה עשר או מאה',
          tex: `\\frac{${num}}{${den}} = \\frac{${scaled}}{${target}}`,
        },
        {
          he:
            places === 1
              ? 'שבר עם מכנה עשר נכתב עם ספרה אחת אחרי הנקודה'
              : 'שבר עם מכנה מאה נכתב עם שתי ספרות אחרי הנקודה',
          tex: `\\frac{${scaled}}{${target}} = ${answer}`,
        },
      ],
      hints: [
        { level: 1, he: 'קו השבר הוא סימן חילוק. אפשר פשוט לחלק את המונה במכנה.' },
        {
          level: 2,
          he: 'הדרך הקצרה יותר: להרחיב את השבר עד שהמכנה יהיה עשר או מאה, ואז לקרוא את המונה כעשרוני.',
        },
        {
          level: 3,
          he: den === target ? 'המכנה כבר מתאים. נשאר רק לכתוב אותו כעשרוני.' : 'צריך להכפיל את המכנה במספר הזה, וגם את המונה.',
          tex: String(factor),
        },
      ],
    };
  },
};

const toPercent: ExerciseGenerator = {
  id: asGeneratorId('num-fraction-decimal-percent/to-percent'),
  topicId: TOPIC,
  titleHe: 'לאחוזים',
  difficulty: 2,
  weight: 1.2,
  skills: ['conversion.to-percent', 'conversion.fraction-decimal'],
  generate(rng) {
    const { num, den, hundredths } = pickTrio(rng);
    const fromFraction = rng.bool();
    const decimal = decimalForm(hundredths);
    const factor = 100 / den;

    return {
      promptHe: fromFraction
        ? 'איזה אחוז מייצג השבר הזה?'
        : 'איזה אחוז מייצג המספר העשרוני הזה?',
      promptTex: fromFraction ? fracTex(num, den) : decimal,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: '%' },
      answer: { kind: 'integer', value: hundredths },
      solution: fromFraction
        ? [
            {
              he: 'אחוז הוא תמיד מתוך מאה, אז מרחיבים את השבר למכנה מאה',
              tex: `\\frac{${num}}{${den}} = \\frac{${hundredths}}{100}`,
            },
            { he: 'והמונה הוא מספר האחוזים', tex: `${hundredths}\\%` },
          ]
        : [
            {
              he: 'מספר עשרוני הופכים לאחוזים בהכפלה במאה',
              tex: `${decimal} \\cdot 100 = ${hundredths}`,
            },
            { he: 'ומוסיפים את סימן האחוז', tex: `${hundredths}\\%` },
          ],
      hints: [
        { level: 1, he: 'אחוז פירושו מתוך מאה. השאלה היא כמה חלקים מתוך מאה זה שווה.' },
        {
          level: 2,
          he: fromFraction
            ? 'מחפשים במה להכפיל את המכנה כדי לקבל מאה, ומכפילים גם את המונה באותו מספר.'
            : 'כפל במאה מזיז את הנקודה שני מקומות ימינה.',
        },
        {
          level: 3,
          he: fromFraction
            ? 'צריך להכפיל את המכנה בזה, וגם את המונה.'
            : 'כך נראה המספר אחרי שהזזנו את הנקודה.',
          tex: fromFraction ? String(factor) : String(hundredths),
        },
      ],
    };
  },
};

const compareForms: ExerciseGenerator = {
  id: asGeneratorId('num-fraction-decimal-percent/compare-forms'),
  topicId: TOPIC,
  titleHe: 'מי הגדול מבין השלושה',
  difficulty: 3,
  weight: 1,
  skills: ['conversion.compare', 'conversion.to-percent'],
  generate(rng) {
    // Three different values, one written in each language. Comparing across
    // the three forms is the only real test of whether they mean one thing.
    const values = new Set<number>();
    let guard = 0;
    while (values.size < 3 && guard < 60) {
      guard += 1;
      values.add(pickTrio(rng).hundredths);
    }
    while (values.size < 3) values.add(values.size * 25 + 7);

    const [asFraction, asDecimal, asPercent] = rng.shuffle([...values]) as [number, number, number];

    const g = gcd(asFraction, 100);
    const options = [
      { tex: fracTex(asFraction / g, 100 / g) },
      { tex: decimalForm(asDecimal) },
      { tex: `${asPercent}\\%` },
    ];
    const hundredths = [asFraction, asDecimal, asPercent];
    const correctIndex = hundredths.indexOf(Math.max(...hundredths));
    const inPercent = hundredths.map((h) => `${h}\\%`).join(' ,\\; ');

    return {
      promptHe: 'מי מהשלושה הוא הגדול ביותר?',
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex, options },
      solution: [
        { he: 'אי אפשר להשוות בין שפות שונות, אז מתרגמים את שלושתם לאחוזים' },
        { he: 'וכך הם נראים זה לצד זה', tex: inPercent },
        { he: 'הגדול ביותר הוא זה', tex: options[correctIndex]!.tex },
      ],
      hints: [
        {
          level: 1,
          he: 'שבר, עשרוני ואחוז הם שלוש דרכים לכתוב אותו סוג של מספר. כדאי להעביר את כולם לשפה אחת.',
        },
        {
          level: 2,
          he: 'הכי נוח להפוך את כולם לאחוזים, כי אז כולם מספרים שלמים מתוך מאה.',
        },
        { level: 3, he: 'אלה שלושת המספרים אחרי התרגום לאחוזים.', tex: inPercent },
      ],
    };
  },
};

export const fractionDecimalPercentGenerators = [fractionToDecimal, toPercent, compareForms];
