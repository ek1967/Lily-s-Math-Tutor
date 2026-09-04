import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';

const TOPIC = asTopicId('geo-area-perimeter');

/** Both at once, so the difference between them cannot be blurred. */
const rectangleBoth: ExerciseGenerator = {
  id: asGeneratorId('geo-area-perimeter/rectangle-both'),
  topicId: TOPIC,
  titleHe: 'היקף ושטח של מלבן',
  difficulty: 1,
  weight: 1.3,
  skills: ['geometry.perimeter', 'geometry.area', 'geometry.rectangle'],
  generate(rng) {
    const width = rng.int(2, 20);
    const height = rng.int(2, 20);
    const perimeter = 2 * (width + height);
    const area = width * height;

    return {
      promptHe: `למלבן יש אורך ${width} סנטימטרים ורוחב ${height} סנטימטרים. מה ההיקף ומה השטח?`,
      input: { kind: 'tuple', keypad: 'numeric', allowNegative: false },
      answer: {
        kind: 'tuple',
        labelsHe: ['היקף', 'שטח'],
        parts: [
          { kind: 'integer', value: perimeter },
          { kind: 'integer', value: area },
        ],
      },
      solution: [
        { he: 'ההיקף הוא סכום כל הצלעות', tex: `2 \\cdot (${width} + ${height}) = ${perimeter}` },
        { he: 'השטח הוא אורך כפול רוחב', tex: `${width} \\cdot ${height} = ${area}` },
      ],
      hints: [
        {
          level: 1,
          he: 'היקף זה כמה גדר צריך כדי להקיף את המלבן. שטח זה כמה צבע צריך כדי למלא אותו.',
        },
        { level: 2, he: 'להיקף מחברים את כל הצלעות, לשטח מכפילים אורך ברוחב.' },
        {
          level: 3,
          he: 'סכום שתי הצלעות השונות הוא זה — להיקף מכפילים אותו בשתיים.',
          tex: String(width + height),
        },
      ],
    };
  },
};

const triangleArea: ExerciseGenerator = {
  id: asGeneratorId('geo-area-perimeter/triangle-area'),
  topicId: TOPIC,
  titleHe: 'שטח משולש',
  difficulty: 2,
  weight: 1.1,
  skills: ['geometry.area', 'geometry.triangle'],
  generate(rng) {
    // One of the two is even, so the answer stays whole.
    const base = rng.int(2, 24);
    const height = base % 2 === 0 ? rng.int(2, 24) : rng.int(1, 12) * 2;
    const area = (base * height) / 2;

    return {
      promptHe: `במשולש הבסיס הוא ${base} סנטימטרים והגובה אליו הוא ${height} סנטימטרים. מה השטח?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: 'סמ״ר' },
      answer: { kind: 'integer', value: area },
      solution: [
        { he: 'שטח משולש הוא בסיס כפול גובה, חלקי שתיים', tex: '\\frac{a \\cdot h}{2}' },
        { he: 'מציבים', tex: `\\frac{${base} \\cdot ${height}}{2} = \\frac{${base * height}}{2} = ${area}` },
      ],
      hints: [
        { level: 1, he: 'משולש הוא בדיוק חצי ממלבן עם אותו בסיס ואותו גובה.' },
        { level: 2, he: 'מכפילים בסיס בגובה, ואז מחלקים בשתיים. אסור לשכוח את החלוקה.' },
        { level: 3, he: 'בסיס כפול גובה נותן את זה. נשאר לחלק בשתיים.', tex: String(base * height) },
      ],
    };
  },
};

/** Finding a missing side from the area — the same formula run backwards. */
const missingSide: ExerciseGenerator = {
  id: asGeneratorId('geo-area-perimeter/missing-side'),
  topicId: TOPIC,
  titleHe: 'מציאת צלע חסרה',
  difficulty: 3,
  weight: 1,
  skills: ['geometry.area', 'geometry.rectangle', 'geometry.inverse'],
  generate(rng) {
    const width = rng.int(2, 18);
    const height = rng.int(2, 18);
    const fromArea = rng.bool(0.6);

    if (fromArea) {
      const area = width * height;
      return {
        promptHe: `שטח מלבן הוא ${area} סנטימטרים רבועים, והאורך שלו ${width} סנטימטרים. מה הרוחב?`,
        input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: 'ס״מ' },
        answer: { kind: 'integer', value: height },
        solution: [
          { he: 'השטח הוא אורך כפול רוחב, אז כדי למצוא את הרוחב מחלקים' },
          { he: 'מציבים', tex: `${area} : ${width} = ${height}` },
        ],
        hints: [
          { level: 1, he: 'מכירים את הנוסחה — כאן רק צריך להשתמש בה בכיוון ההפוך.' },
          { level: 2, he: 'אם אורך כפול רוחב נותן את השטח, אז שטח חלקי אורך נותן את הרוחב.' },
          { level: 3, he: 'מחלקים את השטח באורך הידוע.', tex: `${area} : ${width}` },
        ],
      };
    }

    const perimeter = 2 * (width + height);
    return {
      promptHe: `היקף מלבן הוא ${perimeter} סנטימטרים, והאורך שלו ${width} סנטימטרים. מה הרוחב?`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false, unitHe: 'ס״מ' },
      answer: { kind: 'integer', value: height },
      solution: [
        { he: 'חצי מההיקף הוא סכום האורך והרוחב', tex: `${perimeter} : 2 = ${width + height}` },
        { he: 'מחסרים את האורך הידוע', tex: `${width + height} - ${width} = ${height}` },
      ],
      hints: [
        { level: 1, he: 'ההיקף סופר כל צלע פעמיים. מה נקבל אם נחלק אותו בשתיים?' },
        { level: 2, he: 'חצי ההיקף הוא בדיוק אורך ועוד רוחב, ואת האורך כבר יודעים.' },
        { level: 3, he: 'חצי ההיקף הוא זה. נשאר לחסר את האורך.', tex: String(width + height) },
      ],
    };
  },
};

export const areaPerimeterGenerators = [rectangleBoth, triangleArea, missingSide];
