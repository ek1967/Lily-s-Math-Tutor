import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { sqrtTex } from '../tex';

const TOPIC = asTopicId('geo-pythagoras');

/**
 * Whole-number triples only. The theorem is the thing being learned; a messy
 * root turns the exercise into a calculator drill and hides whether she
 * understood which side is which.
 */
const PRIMITIVES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41],
  [12, 35, 37], [11, 60, 61], [28, 45, 53], [33, 56, 65], [16, 63, 65], [48, 55, 73],
];

/** Every multiple of a primitive triple whose longest side stays under 100. */
const TRIPLES: readonly (readonly [number, number, number])[] = PRIMITIVES.flatMap(
  ([a, b, c]) => {
    const out: [number, number, number][] = [];
    for (let k = 1; k * c <= 100; k += 1) out.push([a * k, b * k, c * k]);
    return out;
  },
);

/** Where the theorem shows up outside a textbook. */
const SETTINGS = [
  { hypotenuse: 'סולם', leg: 'המרחק מהקיר' },
  { hypotenuse: 'מסלול קיצור באלכסון', leg: 'הצלע' },
  { hypotenuse: 'חבל מתוח', leg: 'המרחק על הקרקע' },
] as const;

const findHypotenuse: ExerciseGenerator = {
  id: asGeneratorId('geo-pythagoras/hypotenuse'),
  topicId: TOPIC,
  titleHe: 'מציאת היתר',
  difficulty: 1,
  weight: 1.3,
  skills: ['pythagoras.hypotenuse'],
  generate(rng) {
    const [rawA, rawB, c] = rng.pick(TRIPLES);
    // Which leg is named first should vary, or she learns a position not a rule.
    const [a, b] = rng.bool() ? [rawA, rawB] : [rawB, rawA];

    return {
      promptHe: rng.bool(0.65)
        ? `במשולש ישר זווית שני הניצבים הם ${a} ו־${b} סנטימטרים. מה אורך היתר?`
        : `${rng.pick(SETTINGS).hypotenuse}: שתי הצלעות סביב הזווית הישרה הן ${a} ו־${b} סנטימטרים. מה אורך הצלע שמולה?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: 'ס״מ' },
      answer: { kind: 'integer', value: c },
      solution: [
        { he: 'לפי משפט פיתגורס, סכום ריבועי הניצבים שווה לריבוע היתר', tex: 'a^2 + b^2 = c^2' },
        { he: 'מציבים', tex: `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${c * c}` },
        { he: 'ומוציאים שורש', tex: `${sqrtTex(c * c)} = ${c}` },
      ],
      hints: [
        { level: 1, he: 'היתר הוא תמיד הצלע שמול הזווית הישרה, והוא הארוך ביותר.' },
        { level: 2, he: 'מעלים כל אחד מהניצבים בריבוע, מחברים, ומוציאים שורש מהתוצאה.' },
        { level: 3, he: 'סכום הריבועים יצא זה. נשאר להוציא שורש.', tex: String(c * c) },
      ],
    };
  },
};

const findLeg: ExerciseGenerator = {
  id: asGeneratorId('geo-pythagoras/leg'),
  topicId: TOPIC,
  titleHe: 'מציאת ניצב',
  difficulty: 2,
  weight: 1.3,
  skills: ['pythagoras.leg'],
  generate(rng) {
    const [rawA, rawB, c] = rng.pick(TRIPLES);
    const [known, missing] = rng.bool() ? [rawA, rawB] : [rawB, rawA];

    return {
      promptHe: rng.bool(0.65)
        ? `במשולש ישר זווית היתר הוא ${c} סנטימטרים ואחד הניצבים הוא ${known}. מה אורך הניצב השני?`
        : `${rng.pick(SETTINGS).hypotenuse} באורך ${c} סנטימטרים, ו${rng.pick(SETTINGS).leg} הוא ${known} סנטימטרים. מה אורך הצלע השלישית?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: 'ס״מ' },
      answer: { kind: 'integer', value: missing },
      solution: [
        { he: 'כאן היתר ידוע, אז מחסרים במקום לחבר', tex: 'a^2 = c^2 - b^2' },
        { he: 'מציבים', tex: `${c}^2 - ${known}^2 = ${c * c} - ${known * known} = ${missing * missing}` },
        { he: 'ומוציאים שורש', tex: `${sqrtTex(missing * missing)} = ${missing}` },
      ],
      hints: [
        { level: 1, he: 'כאן הצלע החסרה היא ניצב, לא היתר. זה משנה את הפעולה.' },
        {
          level: 2,
          he: 'כשהיתר ידוע מחסרים: ריבוע היתר פחות ריבוע הניצב הידוע.',
        },
        { level: 3, he: 'ההפרש בין הריבועים הוא זה. נשאר להוציא שורש.', tex: String(missing * missing) },
      ],
    };
  },
};

/** Is it right-angled at all — the converse, which checks she understands the rule. */
const isRightTriangle: ExerciseGenerator = {
  id: asGeneratorId('geo-pythagoras/is-right'),
  topicId: TOPIC,
  titleHe: 'האם המשולש ישר זווית',
  difficulty: 3,
  weight: 0.9,
  skills: ['pythagoras.converse'],
  generate(rng) {
    const [a, b, c] = rng.pick(TRIPLES);
    const isRight = rng.bool(0.5);
    // Break the triple by a small amount, so it cannot be spotted by eye.
    const third = isRight ? c : c + rng.pick([-2, -1, 1, 2]);

    const options = [{ he: 'כן, המשולש ישר זווית' }, { he: 'לא, המשולש אינו ישר זווית' }];

    return {
      promptHe: `במשולש שלוש צלעות: ${a}, ${b} ו־${third} סנטימטרים. האם הוא ישר זווית?`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex: isRight ? 0 : 1, options },
      solution: [
        { he: 'בודקים אם סכום ריבועי שתי הצלעות הקצרות שווה לריבוע הארוכה' },
        { he: 'סכום הריבועים של הקצרות', tex: `${a}^2 + ${b}^2 = ${a * a + b * b}` },
        { he: 'ריבוע הצלע הארוכה', tex: `${third}^2 = ${third * third}` },
        {
          he: isRight
            ? 'שני הצדדים שווים, ולכן: כן, המשולש ישר זווית'
            : 'שני הצדדים אינם שווים, ולכן: לא, המשולש אינו ישר זווית',
        },
      ],
      hints: [
        { level: 1, he: 'אפשר לבדוק את זה בלי לשרטט — רק בעזרת החישוב.' },
        {
          level: 2,
          he: 'אם המשפט מתקיים בדיוק, המשולש ישר זווית. אם לא, הוא לא.',
        },
        {
          level: 3,
          he: 'אלה שני הצדדים של הבדיקה. האם הם שווים?',
          tex: `${a * a + b * b} \\, , \\, ${third * third}`,
        },
      ],
    };
  },
};

export const pythagorasGenerators = [findHypotenuse, findLeg, isRightTriangle];
