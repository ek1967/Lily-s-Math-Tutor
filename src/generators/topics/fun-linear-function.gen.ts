import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { linearTex, paren } from '../tex';

const TOPIC = asTopicId('fun-linear-function');

/**
 * The linear function, met through its table of values.
 *
 * A function is introduced here as a machine: a number goes in, a number comes
 * out, and the rule is always the same one. The graph is the picture of that
 * table, not a separate topic — so every exercise below is answerable from the
 * table alone, without drawing anything.
 */

const valueAtX: ExerciseGenerator = {
  id: asGeneratorId('fun-linear-function/value-at-x'),
  topicId: TOPIC,
  titleHe: 'ערך הפונקציה בנקודה',
  difficulty: 1,
  weight: 1.3,
  skills: ['functions.substitute', 'functions.linear'],
  generate(rng) {
    const a = rng.nonZeroInt(-6, 6);
    const b = rng.nonZeroInt(-12, 12);
    const x = rng.nonZeroInt(-8, 8);
    const y = a * x + b;

    return {
      promptHe: 'מה הערך של הפונקציה, כשהמשתנה מקבל את הערך שכתוב לידה?',
      promptTex: `y = ${linearTex(a, b)} \\quad , \\quad x = ${x}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: y },
      solution: [
        { he: 'מציבים את הערך במקום המשתנה, בסוגריים כדי לא לאבד את הסימן', tex: `y = ${a} \\cdot ${paren(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)}` },
        { he: 'קודם הכפל', tex: `${a} \\cdot ${paren(x)} = ${a * x}` },
        { he: 'ואז החיבור', tex: `${a * x} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${y}` },
      ],
      hints: [
        {
          level: 1,
          he: 'הפונקציה היא מתכון: מה שנכנס במקום המשתנה עובר את אותן פעולות בדיוק, תמיד באותו סדר.',
        },
        {
          level: 2,
          he: 'כדאי להציב בתוך סוגריים. זה מה ששומר על הסימן כשהמספר שלילי.',
        },
        { level: 3, he: 'זו התוצאה של הכפל. נשאר רק להוסיף את המספר החופשי.', tex: String(a * x) },
      ],
    };
  },
};

const pointOnLine: ExerciseGenerator = {
  id: asGeneratorId('fun-linear-function/point-on-line'),
  topicId: TOPIC,
  titleHe: 'האם הנקודה על הישר',
  difficulty: 2,
  weight: 1.2,
  skills: ['functions.linear', 'functions.substitute', 'coordinates.read'],
  generate(rng) {
    const a = rng.nonZeroInt(-5, 5);
    const b = rng.nonZeroInt(-10, 10);
    const x = rng.nonZeroInt(-7, 7);
    const trueY = a * x + b;
    const onLine = rng.bool();
    // A near miss, not a wild one: the whole question is whether she checked.
    const y = onLine ? trueY : trueY + rng.nonZeroInt(-4, 4);

    const options = [{ he: 'כן, הנקודה נמצאת על הישר' }, { he: 'לא, הנקודה לא נמצאת על הישר' }];

    return {
      promptHe: 'האם הנקודה נמצאת על הישר של הפונקציה?',
      promptTex: `y = ${linearTex(a, b)} \\quad , \\quad \\left(${x} , ${y}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex: y === trueY ? 0 : 1, options },
      solution: [
        { he: 'נקודה נמצאת על הישר בדיוק כאשר השיעורים שלה מקיימים את המשוואה' },
        { he: 'מציבים את השיעור הראשון ובודקים מה יוצא', tex: `${a} \\cdot ${paren(x)} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${trueY}` },
        {
          // The option text itself, so the summary line says the same words she
          // had to choose between. Hebrew never goes in a `tex` field.
          he:
            y === trueY
              ? 'זה בדיוק השיעור השני של הנקודה — כן, הנקודה נמצאת על הישר'
              : 'זה לא השיעור השני של הנקודה — לא, הנקודה לא נמצאת על הישר',
        },
      ],
      hints: [
        {
          level: 1,
          he: 'אין צורך לצייר. מספיק לבדוק אם הזוג הזה מקיים את המשוואה.',
        },
        {
          level: 2,
          he: 'מציבים את השיעור הראשון בפונקציה, ומשווים את מה שיצא לשיעור השני של הנקודה.',
        },
        { level: 3, he: 'זה מה שהפונקציה מחזירה עבור השיעור הראשון. משווים אותו לשני.', tex: String(trueY) },
      ],
    };
  },
};

const findX: ExerciseGenerator = {
  id: asGeneratorId('fun-linear-function/find-x'),
  topicId: TOPIC,
  titleHe: 'מהערך חזרה למשתנה',
  difficulty: 3,
  weight: 1,
  skills: ['functions.linear', 'functions.inverse', 'algebra.solve'],
  generate(rng) {
    // Built backwards from a whole x, so the answer never lands on a fraction.
    const a = rng.nonZeroInt(-6, 6);
    const b = rng.nonZeroInt(-12, 12);
    const x = rng.nonZeroInt(-9, 9);
    const y = a * x + b;

    return {
      promptHe: 'ידוע הערך שהפונקציה מחזירה. מה היה המשתנה שנכנס אליה?',
      promptTex: `y = ${linearTex(a, b)} \\quad , \\quad y = ${y}`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: x },
      solution: [
        { he: 'הפעם ידוע מה יצא, אז כותבים משוואה ופותרים אותה', tex: `${linearTex(a, b)} = ${y}` },
        { he: 'מעבירים את המספר החופשי לצד השני', tex: `${a}x = ${y - b}` },
        { he: 'ומחלקים במקדם', tex: `x = ${y - b} : ${a} = ${x}` },
      ],
      hints: [
        {
          level: 1,
          he: 'הכיוון כאן הפוך מהרגיל: ידוע מה יצא מהמכונה, ומחפשים מה נכנס אליה.',
        },
        {
          level: 2,
          he: 'משווים את הביטוי של הפונקציה לערך שנתון, ופותרים משוואה רגילה.',
        },
        { level: 3, he: 'זו המשוואה שצריך לפתור.', tex: `${linearTex(a, b)} = ${y}` },
      ],
    };
  },
};

export const linearFunctionGenerators = [valueAtX, pointOnLine, findX];
