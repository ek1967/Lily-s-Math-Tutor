import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { linearTex, signed } from '../tex';

const TOPIC = asTopicId('alg-word-problems-intro');

/**
 * Turning a story into algebra.
 *
 * The hard part of a word problem is almost never the arithmetic — it is
 * deciding what the unknown is and writing the second quantity in terms of it.
 * So these exercises stop at the equation. Solving it belongs to the previous
 * topic, and folding both into one question hides which half went wrong.
 */

/** Named pairs, so the story is about someone rather than about "a number". */
const PAIRS = [
  { a: 'לילי', b: 'נועה', unitHe: 'מדבקות' },
  { a: 'דנה', b: 'יעל', unitHe: 'שקלים' },
  { a: 'מאיה', b: 'שירה', unitHe: 'ספרים' },
  { a: 'רוני', b: 'תמר', unitHe: 'נקודות' },
] as const;

const writeExpression: ExerciseGenerator = {
  id: asGeneratorId('alg-word-problems-intro/write-expression'),
  topicId: TOPIC,
  titleHe: 'לכתוב את הנתון בעזרת המשתנה',
  difficulty: 1,
  weight: 1.3,
  skills: ['algebra.translate'],
  generate(rng) {
    const pair = rng.pick(PAIRS);
    const n = rng.int(2, 15);
    const more = rng.bool();
    const correct = linearTex(1, more ? n : -n);

    const distractors = [
      linearTex(1, more ? -n : n),
      linearTex(n, 0),
      linearTex(n, more ? n : -n),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: more
        ? `נניח שיש ל${pair.a} איקס ${pair.unitHe}. ל${pair.b} יש ${n} ${pair.unitHe} יותר. איזה ביטוי מתאים למספר ה${pair.unitHe} של ${pair.b}?`
        : `נניח שיש ל${pair.a} איקס ${pair.unitHe}. ל${pair.b} יש ${n} ${pair.unitHe} פחות. איזה ביטוי מתאים למספר ה${pair.unitHe} של ${pair.b}?`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: `מה שידוע נקרא איקס, וזה מה שיש ל${pair.a}` },
        {
          he: more ? 'המילה יותר מתורגמת לחיבור' : 'המילה פחות מתורגמת לחיסור',
          tex: correct,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'מתחילים ממי שהמשתנה מייצג, ורק אחר כך כותבים את השני ביחס אליו.',
        },
        {
          level: 2,
          he: more
            ? 'יותר פירושו להוסיף למה שכבר יש. הפעולה היא חיבור.'
            : 'פחות פירושו להוריד ממה שכבר יש. הפעולה היא חיסור.',
        },
        {
          level: 3,
          he: 'מתחילים מהמשתנה עצמו, ואז מוסיפים או מורידים את המספר שבסיפור.',
          tex: `x ${signed(more ? n : -n)}`,
        },
      ],
    };
  },
};

const buildEquation: ExerciseGenerator = {
  id: asGeneratorId('alg-word-problems-intro/build-equation'),
  topicId: TOPIC,
  titleHe: 'לבנות את המשוואה',
  difficulty: 2,
  weight: 1.2,
  skills: ['algebra.translate', 'algebra.equation'],
  generate(rng) {
    const pair = rng.pick(PAIRS);
    const diff = rng.int(2, 14);
    const each = rng.int(2, 9);
    const total = each * 2 + diff;
    const together = rng.bool();

    // Together: x plus (x + diff) equals the total.
    // Times: one has as many as the other multiplied, and the total is known.
    const correct = together
      ? `x + \\left(${linearTex(1, diff)}\\right) = ${total}`
      : `x + ${each}x = ${each * (each + 1)}`;

    const distractors = together
      ? [
          `x + ${diff} = ${total}`,
          `x - \\left(${linearTex(1, diff)}\\right) = ${total}`,
          `x \\cdot \\left(${linearTex(1, diff)}\\right) = ${total}`,
        ]
      : [
          `x + ${each} = ${each * (each + 1)}`,
          `x \\cdot ${each}x = ${each * (each + 1)}`,
          `${each}x = ${each * (each + 1)}`,
        ];
    const options = rng
      .shuffle([correct, ...distractors.filter((t) => t !== correct).slice(0, 3)])
      .map((tex) => ({ tex }));

    return {
      promptHe: together
        ? `ל${pair.b} יש ${diff} ${pair.unitHe} יותר מאשר ל${pair.a}. ביחד יש להן ${total} ${pair.unitHe}. איזו משוואה מתאימה לסיפור, כשאיקס הוא מה שיש ל${pair.a}?`
        : `ל${pair.b} יש פי ${each} ${pair.unitHe} מאשר ל${pair.a}. ביחד יש להן ${each * (each + 1)} ${pair.unitHe}. איזו משוואה מתאימה לסיפור, כשאיקס הוא מה שיש ל${pair.a}?`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: `קוראים איקס למה שיש ל${pair.a}, כי כל שאר הנתונים נמדדים לפיו` },
        {
          he: together
            ? `ומה שיש ל${pair.b} נכתב בעזרתו`
            : `ומה שיש ל${pair.b} הוא פי כמה מזה`,
          tex: together ? linearTex(1, diff) : `${each}x`,
        },
        { he: 'המילה ביחד מתורגמת לחיבור, ומה שהוא שווה לו נכתב אחרי סימן השוויון', tex: correct },
      ],
      hints: [
        {
          level: 1,
          he: `השאלה הראשונה היא תמיד מה יהיה איקס. כאן כבר אמרו לך: מה שיש ל${pair.a}.`,
        },
        {
          level: 2,
          he: 'אחרי שיש איקס, כותבים את הכמות השנייה בעזרתו — ורק אז מחברים ומשווים לסך הכול.',
        },
        {
          level: 3,
          he: 'זו הכמות השנייה. נשאר לחבר אותה לראשונה ולהשוות לסך הכול.',
          tex: together ? linearTex(1, diff) : `${each}x`,
        },
      ],
    };
  },
};

const consecutiveOrAges: ExerciseGenerator = {
  id: asGeneratorId('alg-word-problems-intro/two-step-story'),
  topicId: TOPIC,
  titleHe: 'סיפור בשני שלבים',
  difficulty: 3,
  weight: 1,
  skills: ['algebra.translate', 'algebra.equation', 'algebra.solve'],
  generate(rng) {
    // Solvable stories with whole answers, so a slip shows up as a wrong
    // equation rather than as an ugly fraction.
    const small = rng.int(3, 30);
    const gap = rng.int(2, 12);
    const kind = rng.pick(['ages', 'consecutive'] as const);

    const larger = kind === 'ages' ? small + gap : small + 1;
    const total = small + larger;

    return {
      promptHe:
        kind === 'ages'
          ? `אח גדול מאחותו ב־${gap} שנים. יחד הם בני ${total} שנים. בן כמה האח הקטן מבין השניים?`
          : `שני מספרים שלמים עוקבים. הסכום שלהם הוא ${total}. מה המספר הקטן מביניהם?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: small },
      solution: [
        { he: 'קוראים איקס לקטן מבין השניים, כי אז השני נכתב בעזרתו בקלות' },
        {
          he: kind === 'ages' ? 'הגדול הוא איקס ועוד ההפרש' : 'המספר העוקב הוא איקס ועוד אחד',
          tex: linearTex(1, kind === 'ages' ? gap : 1),
        },
        {
          he: 'הסכום שלהם ידוע, וזו המשוואה',
          tex: `x + \\left(${linearTex(1, kind === 'ages' ? gap : 1)}\\right) = ${total}`,
        },
        {
          he: 'מכנסים ומחלקים',
          tex: `2x = ${total - (kind === 'ages' ? gap : 1)} \\Rightarrow x = ${small}`,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'תמיד משתלם לקרוא איקס לקטן מבין השניים. אז השני נכתב בעזרתו בלי מינוס.',
        },
        {
          level: 2,
          he: 'אחרי שכותבים את שניהם בעזרת איקס, מחברים אותם ומשווים לסכום שנתון בסיפור.',
        },
        {
          level: 3,
          he: 'זו המשוואה. נשאר רק לפתור אותה.',
          tex: `x + \\left(${linearTex(1, kind === 'ages' ? gap : 1)}\\right) = ${total}`,
        },
      ],
    };
  },
};

export const wordProblemsIntroGenerators = [writeExpression, buildEquation, consecutiveOrAges];
