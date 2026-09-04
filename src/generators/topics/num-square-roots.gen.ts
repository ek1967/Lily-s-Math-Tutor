import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { sqrtTex } from '../tex';

const TOPIC = asTopicId('num-square-roots');

const exact: ExerciseGenerator = {
  id: asGeneratorId('num-square-roots/exact'),
  topicId: TOPIC,
  titleHe: 'שורש של ריבוע שלם',
  difficulty: 1,
  weight: 1.3,
  skills: ['roots.exact', 'roots.squares'],
  generate(rng) {
    const root = rng.int(2, 30);
    const square = root * root;
    // Three framings of the same fact. A root is most useful when she can see
    // it as "the side of a square", so that reading is here from the start.
    const framing = rng.pick(['plain', 'area', 'unknown'] as const);

    const prompts = {
      plain: 'כמה יוצא?',
      area: `לריבוע יש שטח של ${square} סנטימטרים רבועים. מה אורך הצלע שלו?`,
      unknown: `איזה מספר חיובי, כשמכפילים אותו בעצמו, נותן ${square}?`,
    } as const;

    return {
      promptHe: prompts[framing],
      ...(framing === 'plain' ? { promptTex: sqrtTex(square) } : {}),
      input: {
        kind: 'integer',
        keypad: 'numeric',
        allowNegative: false,
        ...(framing === 'area' ? { unitHe: 'ס״מ' } : {}),
      },
      answer: { kind: 'integer', value: root },
      solution: [
        { he: 'שורש שואל: איזה מספר כפול עצמו נותן את המספר שבפנים?' },
        { he: 'כאן זה', tex: `${root} \\cdot ${root} = ${square}` },
        { he: 'ולכן', tex: `${sqrtTex(square)} = ${root}` },
      ],
      hints: [
        { level: 1, he: 'שורש הוא הפעולה ההפוכה להעלאה בריבוע.' },
        { level: 2, he: 'מחפשים מספר שכשמכפילים אותו בעצמו מקבלים את מה שבתוך השורש.' },
        { level: 3, he: 'המספר קטן ממה שנדמה. נסי לחשוב על המספר הזה כפול עצמו.', tex: String(root) },
      ],
    };
  },
};

/** Which two whole numbers does it sit between — the estimation skill. */
const between: ExerciseGenerator = {
  id: asGeneratorId('num-square-roots/between'),
  topicId: TOPIC,
  titleHe: 'בין אילו מספרים נמצא השורש',
  difficulty: 2,
  weight: 1,
  skills: ['roots.estimate'],
  generate(rng) {
    const lower = rng.int(2, 19);
    const upper = lower + 1;
    // Strictly between the two squares, so the answer is unambiguous.
    const value = rng.int(lower * lower + 1, upper * upper - 1);

    return {
      promptHe: 'בין אילו שני מספרים שלמים נמצא השורש? כתבי את הקטן מביניהם',
      promptTex: sqrtTex(value),
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: lower },
      solution: [
        { he: 'מחפשים את הריבועים השלמים הקרובים', tex: `${lower}^2 = ${lower * lower}` },
        { he: 'והבא אחריו', tex: `${upper}^2 = ${upper * upper}` },
        {
          he: 'המספר שבתוך השורש נמצא ביניהם, אז גם השורש נמצא ביניהם',
          tex: `${lower} < ${sqrtTex(value)} < ${upper}`,
        },
      ],
      hints: [
        { level: 1, he: 'לא צריך מחשבון. מספיק לדעת את הריבועים השלמים מסביב.' },
        { level: 2, he: 'איזה ריבוע שלם קטן מהמספר שבשורש, ואיזה כבר גדול ממנו?' },
        { level: 3, he: 'הריבוע הזה עוד קטן מהמספר שבשורש.', tex: `${lower}^2 = ${lower * lower}` },
      ],
    };
  },
};

/** Roots inside an expression, where the order of operations still applies. */
const inExpression: ExerciseGenerator = {
  id: asGeneratorId('num-square-roots/in-expression'),
  topicId: TOPIC,
  titleHe: 'שורש בתוך תרגיל',
  difficulty: 3,
  weight: 0.9,
  skills: ['roots.exact', 'roots.order-of-operations'],
  generate(rng) {
    const r1 = rng.int(2, 15);
    const r2 = rng.int(2, 12);
    const multiplier = rng.int(2, 6);
    const adding = rng.bool();
    const result = adding ? multiplier * r1 + r2 : multiplier * r1 - r2;

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${multiplier}${sqrtTex(r1 * r1)} ${adding ? '+' : '-'} ${sqrtTex(r2 * r2)}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'קודם מחשבים כל שורש בנפרד', tex: `${sqrtTex(r1 * r1)} = ${r1}` },
        { he: 'וגם', tex: `${sqrtTex(r2 * r2)} = ${r2}` },
        {
          he: 'ואז ממשיכים כרגיל, כפל לפני חיבור',
          tex: `${multiplier} \\cdot ${r1} ${adding ? '+' : '-'} ${r2} = ${result}`,
        },
      ],
      hints: [
        { level: 1, he: 'השורש הוא פעולה בפני עצמה. מחשבים אותו קודם.' },
        { level: 2, he: 'אחרי שמחליפים כל שורש במספר שלו, נשאר תרגיל חשבון רגיל.' },
        { level: 3, he: 'שני השורשים נותנים את המספרים האלה.', tex: `${r1} \\, , \\, ${r2}` },
      ],
    };
  },
};

export const squareRootsGenerators = [exact, between, inExpression];
