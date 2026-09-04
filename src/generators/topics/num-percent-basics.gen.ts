import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';

const TOPIC = asTopicId('num-percent-basics');

/** Percentages that stay whole: she should be practising the idea, not long division. */
const NICE_PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80] as const;

const percentOfAmount: ExerciseGenerator = {
  id: asGeneratorId('num-percent-basics/percent-of'),
  topicId: TOPIC,
  titleHe: 'אחוז מתוך כמות',
  difficulty: 1,
  weight: 1.3,
  skills: ['percent.of-amount'],
  generate(rng) {
    const percent = rng.pick(NICE_PERCENTS);
    // Pick the whole so the answer lands on an integer.
    const step = 100 / (percent % 100 === 0 ? 100 : gcdOf(percent, 100));
    const total = Math.round(step * rng.int(2, 40));
    const answer = (total * percent) / 100;

    const scenarios = [
      { he: `מחיר החולצה ${total} שקלים`, unit: '₪' },
      { he: `במבחן היו ${total} שאלות`, unit: 'שאלות' },
      { he: `בבית הספר לומדים ${total} תלמידים`, unit: 'תלמידים' },
      { he: `בבקבוק יש ${total} מיליליטר`, unit: 'מ״ל' },
    ];
    const scenario = rng.pick(scenarios);

    return {
      promptHe: `${scenario.he}. כמה זה ${percent} אחוז מתוך זה?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: scenario.unit },
      answer: { kind: 'integer', value: answer },
      solution: [
        { he: 'אחוז אחד הוא המאית של השלם', tex: `${total} : 100 = ${total / 100}` },
        { he: `לוקחים ${percent} כאלה`, tex: `${total / 100} \\cdot ${percent} = ${answer}` },
      ],
      hints: [
        { level: 1, he: 'אחוז זה תמיד "מתוך מאה". כמה שווה אחוז אחד כאן?' },
        {
          level: 2,
          he: 'מחלקים את הכמות ב־100 כדי לקבל אחוז אחד, ואז מכפילים במספר האחוזים.',
        },
        {
          level: 3,
          he: 'אחוז אחד שווה למספר הזה. נשאר להכפיל אותו במספר האחוזים.',
          tex: String(total / 100),
        },
      ],
    };
  },
};

/** Going the other way: what fraction of the whole is this? */
const whatPercent: ExerciseGenerator = {
  id: asGeneratorId('num-percent-basics/what-percent'),
  topicId: TOPIC,
  titleHe: 'איזה אחוז זה',
  difficulty: 2,
  weight: 1.1,
  skills: ['percent.what-percent', 'percent.of-amount'],
  generate(rng) {
    const percent = rng.pick(NICE_PERCENTS);
    const step = 100 / gcdOf(percent, 100);
    const total = Math.round(step * rng.int(2, 30));
    const part = (total * percent) / 100;

    const scenarios = [
      `בכיתה ${total} תלמידים, ומתוכם ${part} הגיעו לטיול`,
      `במבחן היו ${total} שאלות, ולילי ענתה נכון על ${part}`,
      `בשקית ${total} סוכריות, ו־${part} מהן אדומות`,
    ];

    return {
      promptHe: `${rng.pick(scenarios)}. איזה אחוז זה?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: '%' },
      answer: { kind: 'integer', value: percent },
      solution: [
        { he: 'כותבים את החלק מתוך השלם כשבר', tex: `\\frac{${part}}{${total}}` },
        { he: 'מכפילים ב־100 כדי לקבל אחוזים', tex: `\\frac{${part}}{${total}} \\cdot 100 = ${percent}` },
      ],
      hints: [
        { level: 1, he: 'קודם כותבים את השבר: החלק למעלה, השלם למטה.' },
        { level: 2, he: 'כדי להפוך שבר לאחוזים מכפילים אותו ב־100.' },
        { level: 3, he: 'זה השבר. נשאר להכפיל ב־100.', tex: `\\frac{${part}}{${total}}` },
      ],
    };
  },
};

/** Finding the whole from a part — the direction that trips everyone up. */
const findWhole: ExerciseGenerator = {
  id: asGeneratorId('num-percent-basics/find-whole'),
  topicId: TOPIC,
  titleHe: 'מציאת השלם',
  difficulty: 3,
  weight: 1,
  skills: ['percent.find-whole'],
  generate(rng) {
    const percent = rng.pick([10, 20, 25, 40, 50, 60, 75, 80] as const);
    const step = 100 / gcdOf(percent, 100);
    const total = Math.round(step * rng.int(2, 25));
    const part = (total * percent) / 100;
    const onePercent = total / 100;

    const scenarios = [
      `${percent} אחוז מהתלמידים בכיתה הם ${part} תלמידים`,
      `${percent} אחוז מהמחיר הם ${part} שקלים`,
      `לילי ענתה נכון על ${percent} אחוז מהשאלות, שהן ${part} שאלות`,
    ];

    return {
      promptHe: `${rng.pick(scenarios)}. מה השלם?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: total },
      solution: [
        { he: `אם ${percent} אחוזים הם החלק הזה, אפשר למצוא כמה שווה אחוז אחד`, tex: `${part} : ${percent} = ${onePercent}` },
        { he: 'והשלם הוא מאה אחוזים', tex: `${onePercent} \\cdot 100 = ${total}` },
      ],
      hints: [
        { level: 1, he: 'כאן מחפשים את השלם, לא את החלק. הכיוון הפוך מהרגיל.' },
        { level: 2, he: 'הדרך הקצרה: קודם מוצאים כמה שווה אחוז אחד, ואז מכפילים ב־100.' },
        { level: 3, he: 'אחוז אחד שווה למספר הזה. מה יהיו מאה אחוזים?', tex: String(onePercent) },
      ],
    };
  },
};

function gcdOf(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export const percentBasicsGenerators = [percentOfAmount, whatPercent, findWhole];
