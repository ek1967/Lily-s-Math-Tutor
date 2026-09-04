import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';

const TOPIC = asTopicId('sta-mean-median-mode');

const CONTEXTS = [
  { he: 'ציונים במבחנים', unit: '' },
  { he: 'מספר הספרים שקראה בכל חודש', unit: '' },
  { he: 'מספר ההודעות שקיבלה בכל יום', unit: '' },
  { he: 'הטמפרטורה בכל יום', unit: 'מעלות' },
] as const;

const mean: ExerciseGenerator = {
  id: asGeneratorId('sta-mean-median-mode/mean'),
  topicId: TOPIC,
  titleHe: 'חישוב ממוצע',
  difficulty: 1,
  weight: 1.3,
  skills: ['stats.mean'],
  generate(rng) {
    const count = rng.int(4, 6);
    const target = rng.int(5, 40);
    // Build values that sum to a whole multiple, so the mean stays an integer.
    const values: number[] = [];
    let remaining = target * count;
    for (let i = 0; i < count - 1; i += 1) {
      const max = Math.min(remaining - (count - 1 - i), target + rng.int(1, 10));
      const min = Math.max(1, remaining - (count - 1 - i) * (target + 10));
      const v = rng.int(Math.min(min, max), max);
      values.push(v);
      remaining -= v;
    }
    values.push(remaining);
    const sum = values.reduce((a, b) => a + b, 0);
    const context = rng.pick(CONTEXTS);

    return {
      promptHe: `אלה ה${context.he}: ${values.join(', ')}. מה הממוצע?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: context.unit },
      answer: { kind: 'integer', value: sum / count },
      solution: [
        { he: 'מחברים את כל המספרים', tex: `${values.join(' + ')} = ${sum}` },
        { he: `ומחלקים בכמה מספרים יש`, tex: `${sum} : ${count} = ${sum / count}` },
      ],
      hints: [
        { level: 1, he: 'ממוצע הוא "כמה היה יוצא לכל אחד אם היו מחלקים בשווה".' },
        { level: 2, he: 'מחברים את כל המספרים, ומחלקים בכמות המספרים.' },
        { level: 3, he: 'הסכום הוא זה. במה צריך לחלק אותו?', tex: String(sum) },
      ],
    };
  },
};

const medianAndMode: ExerciseGenerator = {
  id: asGeneratorId('sta-mean-median-mode/median'),
  topicId: TOPIC,
  titleHe: 'חציון ושכיח',
  difficulty: 2,
  weight: 1.1,
  skills: ['stats.median', 'stats.mode'],
  generate(rng) {
    // An odd count keeps the median a single value from the list.
    const count = rng.pick([5, 7]);
    const values: number[] = [];
    for (let i = 0; i < count - 1; i += 1) values.push(rng.int(1, 30));
    // Guarantee a unique mode by repeating one value once more than any other.
    const repeated = values[rng.int(0, values.length - 1)]!;
    values.push(repeated);

    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[(count - 1) / 2]!;
    const askMedian = rng.bool();
    const context = rng.pick(CONTEXTS);

    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    const mode = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];

    return {
      promptHe: askMedian
        ? `אלה ה${context.he}: ${values.join(', ')}. מה החציון?`
        : `אלה ה${context.he}: ${values.join(', ')}. מה השכיח?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: askMedian ? median : mode },
      solution: askMedian
        ? [
            { he: 'קודם מסדרים את המספרים מהקטן לגדול', tex: sorted.join(' , ') },
            { he: `יש ${count} מספרים, אז החציון הוא זה שבאמצע`, tex: String(median) },
          ]
        : [
            { he: 'השכיח הוא המספר שחוזר הכי הרבה פעמים' },
            { he: 'סופרים כמה פעמים מופיע כל מספר, והמנצח הוא', tex: String(mode) },
          ],
      hints: askMedian
        ? [
            { level: 1, he: 'חציון זה המספר שנמצא בדיוק באמצע — אבל רק אחרי שמסדרים.' },
            { level: 2, he: 'הצעד הראשון הוא תמיד לסדר את המספרים לפי הגודל.' },
            { level: 3, he: 'אחרי הסידור הרשימה נראית ככה. מי באמצע?', tex: sorted.join(' , ') },
          ]
        : [
            { level: 1, he: 'שכיח בא מהמילה "שכיח" — מה שקורה הכי הרבה.' },
            { level: 2, he: 'לא צריך לסדר. פשוט סופרים איזה מספר חוזר הכי הרבה פעמים.' },
            { level: 3, he: 'יש מספר אחד שמופיע יותר פעמים מכל השאר.', tex: String(mode) },
          ],
    };
  },
};

/** The missing value: the mean formula used backwards, which is where it clicks. */
const missingValue: ExerciseGenerator = {
  id: asGeneratorId('sta-mean-median-mode/missing-value'),
  topicId: TOPIC,
  titleHe: 'מציאת ערך חסר מהממוצע',
  difficulty: 3,
  weight: 1,
  skills: ['stats.mean', 'stats.inverse'],
  generate(rng) {
    const count = rng.int(4, 5);
    const target = rng.int(60, 95);
    const known: number[] = [];
    let sumKnown = 0;
    for (let i = 0; i < count - 1; i += 1) {
      const v = rng.int(Math.max(40, target - 20), Math.min(100, target + 15));
      known.push(v);
      sumKnown += v;
    }
    const missing = target * count - sumKnown;

    return {
      promptHe: `בלילי יש ${count} ציונים. ${count - 1} מהם: ${known.join(', ')}. הממוצע של כולם הוא ${target}. מה הציון החסר?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: missing },
      solution: [
        { he: 'אם הממוצע ידוע, אפשר למצוא את הסכום הכולל', tex: `${target} \\cdot ${count} = ${target * count}` },
        { he: 'מחברים את הציונים הידועים', tex: `${known.join(' + ')} = ${sumKnown}` },
        { he: 'ההפרש הוא הציון החסר', tex: `${target * count} - ${sumKnown} = ${missing}` },
      ],
      hints: [
        { level: 1, he: 'הכיוון כאן הפוך: הממוצע ידוע, וצריך למצוא מספר.' },
        {
          level: 2,
          he: 'ממוצע כפול כמות נותן את הסכום הכולל. משם אפשר לחסר את מה שכבר ידוע.',
        },
        { level: 3, he: 'הסכום הכולל צריך להיות זה.', tex: String(target * count) },
      ],
    };
  },
};

export const meanMedianModeGenerators = [mean, medianAndMode, missingValue];
