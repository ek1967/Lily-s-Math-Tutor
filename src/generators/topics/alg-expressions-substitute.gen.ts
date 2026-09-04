import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { linearTex, paren, signed } from '../tex';

const TOPIC = asTopicId('alg-expressions-substitute');

/** Substitution: the moment a letter stops being frightening and becomes a slot. */
const substitute: ExerciseGenerator = {
  id: asGeneratorId('alg-expressions-substitute/substitute'),
  topicId: TOPIC,
  titleHe: 'הצבה בביטוי',
  difficulty: 1,
  weight: 1.3,
  skills: ['algebra.substitute'],
  generate(rng) {
    const a = rng.nonZeroInt(-6, 9);
    const b = rng.nonZeroInt(-12, 12);
    const x = rng.nonZeroInt(-8, 10);
    const product = a * x;
    const result = product + b;

    return {
      promptHe: 'כמה שווה הביטוי, כשמציבים את הערך הנתון?',
      promptTex: `${linearTex(a, b)} \\quad , \\quad x = ${x}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'מחליפים כל x במספר שנתון, בתוך סוגריים', tex: `${a} \\cdot ${paren(x)} ${signed(b)}` },
        { he: 'מחשבים קודם את הכפל', tex: String(product) },
        { he: 'ואז מחברים', tex: `${product} ${signed(b)} = ${result}` },
      ],
      hints: [
        { level: 1, he: 'ה-x הוא בסך הכול מקום שמור. מה מציבים בו כאן?' },
        {
          level: 2,
          he: 'כדאי לכתוב את המספר בתוך סוגריים במקום ה-x, כדי שהסימנים לא יתבלבלו.',
        },
        { level: 3, he: 'הכפל נתן את המספר הזה. נשאר רק לחבר את מה שנשאר.', tex: String(product) },
      ],
    };
  },
};

/** Two variables, so "substitute" cannot be mistaken for "solve". */
const twoVariables: ExerciseGenerator = {
  id: asGeneratorId('alg-expressions-substitute/two-variables'),
  topicId: TOPIC,
  titleHe: 'הצבה בשני משתנים',
  difficulty: 2,
  weight: 1,
  skills: ['algebra.substitute'],
  generate(rng) {
    const a = rng.nonZeroInt(-5, 7);
    const b = rng.nonZeroInt(-5, 7);
    const c = rng.nonZeroInt(-10, 10);
    const x = rng.nonZeroInt(-6, 8);
    const y = rng.nonZeroInt(-6, 8);
    const first = a * x;
    const second = b * y;
    const result = first + second + c;

    return {
      promptHe: 'כמה שווה הביטוי, כשמציבים את שני הערכים?',
      promptTex: `${a}x ${signed(b)}y ${signed(c)} \\quad , \\quad x = ${x} \\, , \\, y = ${y}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: result },
      solution: [
        { he: 'מציבים כל משתנה במקומו', tex: `${a} \\cdot ${paren(x)} ${signed(b)} \\cdot ${paren(y)} ${signed(c)}` },
        { he: 'מחשבים את שני הכפלים', tex: `${first} ${signed(second)} ${signed(c)}` },
        { he: 'ומסכמים', tex: String(result) },
      ],
      hints: [
        { level: 1, he: 'שני משתנים, שני מספרים. כל אחד הולך למקום שלו.' },
        { level: 2, he: 'קודם עושים את שני הכפלים, ורק אחר כך מחברים הכול.' },
        { level: 3, he: 'שני הכפלים נתנו את המספרים האלה. נשאר לסכם.', tex: `${first} \\, , \\, ${second}` },
      ],
    };
  },
};

/** Turning a sentence into an expression — the actual bottleneck in word problems. */
const translate: ExerciseGenerator = {
  id: asGeneratorId('alg-expressions-substitute/translate'),
  topicId: TOPIC,
  titleHe: 'תרגום משפט לביטוי',
  difficulty: 3,
  weight: 1,
  skills: ['algebra.translate'],
  generate(rng) {
    const k = rng.int(2, 9);
    const c = rng.int(2, 15);

    const forms = [
      {
        he: `מספר גדול פי ${k} ממספר אחר, ועוד ${c}`,
        correct: `${k}x + ${c}`,
        wrong: [`x^{${k}} + ${c}`, `${k}(x + ${c})`, `${k}x - ${c}`],
      },
      {
        he: `מספר גדול ב־${c} ממספר אחר, והכול מוכפל ב־${k}`,
        correct: `${k}(x + ${c})`,
        wrong: [`${k}x + ${c}`, `x + ${k} \\cdot ${c}`, `${k}x - ${c}`],
      },
      {
        he: `מספר קטן ב־${c} ממספר אחר`,
        correct: `x - ${c}`,
        wrong: [`${c} - x`, `x + ${c}`, `${c}x`],
      },
      {
        he: `שליש ממספר, ועוד ${c}`,
        correct: `\\frac{x}{3} + ${c}`,
        wrong: [`3x + ${c}`, `\\frac{x + ${c}}{3}`, `\\frac{3}{x} + ${c}`],
      },
    ];
    const form = rng.pick(forms);

    const options = rng.shuffle([form.correct, ...form.wrong]).map((tex) => ({ tex }));
    const correctIndex = options.findIndex((o) => o.tex === form.correct);

    return {
      promptHe: `איזה ביטוי מתאים למשפט: ${form.he}?`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex, options },
      solution: [
        { he: 'מסמנים את המספר שלא ידוע באות', tex: 'x' },
        { he: 'ומתרגמים כל מילה בנפרד: "פי" זה כפל, "ועוד" זה חיבור, "קטן ב" זה חיסור' },
        { he: 'הביטוי שמתאים הוא', tex: form.correct },
      ],
      hints: [
        { level: 1, he: 'כדאי לקרוא את המשפט לאט ולתרגם מילה־מילה, לא בבת אחת.' },
        {
          level: 2,
          he: 'שימי לב במיוחד לסוגריים: הן קובעות אם הפעולה חלה על הכול או רק על חלק.',
        },
        { level: 3, he: 'המספר הלא ידוע הוא זה, וסביבו בונים את שאר הביטוי.', tex: 'x' },
      ],
    };
  },
};

export const expressionsSubstituteGenerators = [substitute, twoVariables, translate];
