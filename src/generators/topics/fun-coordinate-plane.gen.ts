import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';

const TOPIC = asTopicId('fun-coordinate-plane');

const QUADRANT_NAMES = ['הרביע הראשון', 'הרביע השני', 'הרביע השלישי', 'הרביע הרביעי'] as const;

function quadrantOf(x: number, y: number): number {
  if (x > 0 && y > 0) return 0;
  if (x < 0 && y > 0) return 1;
  if (x < 0 && y < 0) return 2;
  return 3;
}

/** Reading a pair of coordinates, in the right order. */
const readPoint: ExerciseGenerator = {
  id: asGeneratorId('fun-coordinate-plane/read-point'),
  topicId: TOPIC,
  titleHe: 'קריאת שיעורי נקודה',
  difficulty: 1,
  weight: 1.2,
  skills: ['coordinates.read'],
  generate(rng) {
    const x = rng.nonZeroInt(-9, 9);
    const y = rng.nonZeroInt(-9, 9);
    const askX = rng.bool();

    return {
      promptHe: askX
        ? 'מה שיעור ה-x של הנקודה?'
        : 'מה שיעור ה-y של הנקודה?',
      promptTex: `\\left(${x} , ${y}\\right)`,
      input: { kind: 'integer', keypad: 'numeric-signed', allowNegative: true },
      answer: { kind: 'integer', value: askX ? x : y },
      solution: [
        { he: 'בזוג שיעורים כותבים תמיד קודם את x ואחר כך את y' },
        {
          he: askX ? 'שיעור ה-x הוא המספר הראשון' : 'שיעור ה-y הוא המספר השני',
          tex: String(askX ? x : y),
        },
      ],
      hints: [
        { level: 1, he: 'הסדר קבוע ולא משתנה: קודם x, אחר כך y.' },
        { level: 2, he: 'אפשר לזכור לפי האלף־בית: x בא לפני y, גם בכתיבה.' },
        {
          level: 3,
          he: askX ? 'מחפשים את המספר הראשון בסוגריים.' : 'מחפשים את המספר השני בסוגריים.',
        },
      ],
    };
  },
};

/** Which quadrant — the reading that makes the signs mean something. */
const quadrant: ExerciseGenerator = {
  id: asGeneratorId('fun-coordinate-plane/quadrant'),
  topicId: TOPIC,
  titleHe: 'באיזה רביע נמצאת הנקודה',
  difficulty: 2,
  weight: 1.1,
  skills: ['coordinates.quadrant', 'coordinates.signs'],
  generate(rng) {
    const x = rng.nonZeroInt(-12, 12);
    const y = rng.nonZeroInt(-12, 12);
    const correct = quadrantOf(x, y);
    const options = QUADRANT_NAMES.map((he) => ({ he }));

    return {
      promptHe: 'באיזה רביע נמצאת הנקודה?',
      promptTex: `\\left(${x} , ${y}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex: correct, options },
      solution: [
        { he: 'הרביע נקבע רק לפי הסימנים של שני השיעורים' },
        {
          he: `כאן ה-x ${x > 0 ? 'חיובי' : 'שלילי'} וה-y ${y > 0 ? 'חיובי' : 'שלילי'}`,
        },
        { he: `ולכן הנקודה נמצאת ב${QUADRANT_NAMES[correct]}` },
      ],
      hints: [
        { level: 1, he: 'הגודל של המספרים לא משנה כאן — רק הסימנים שלהם.' },
        {
          level: 2,
          he: 'מונים את הרביעים נגד כיוון השעון, מהפינה שבה שני השיעורים חיוביים.',
        },
        {
          level: 3,
          he: `ה-x כאן ${x > 0 ? 'חיובי' : 'שלילי'} וה-y ${y > 0 ? 'חיובי' : 'שלילי'}. איזו פינה זו?`,
        },
      ],
    };
  },
};

/** Distance along an axis — coordinates used for something. */
const distance: ExerciseGenerator = {
  id: asGeneratorId('fun-coordinate-plane/distance'),
  topicId: TOPIC,
  titleHe: 'מרחק בין שתי נקודות על ישר',
  difficulty: 3,
  weight: 1,
  skills: ['coordinates.distance', 'integers.subtract'],
  generate(rng) {
    const horizontal = rng.bool();
    const shared = rng.nonZeroInt(-8, 8);
    const p1 = rng.nonZeroInt(-10, 10);
    let p2 = rng.nonZeroInt(-10, 10);
    if (p2 === p1) p2 = p1 + 3;
    const result = Math.abs(p2 - p1);

    const a = horizontal ? `\\left(${p1} , ${shared}\\right)` : `\\left(${shared} , ${p1}\\right)`;
    const b = horizontal ? `\\left(${p2} , ${shared}\\right)` : `\\left(${shared} , ${p2}\\right)`;

    return {
      promptHe: horizontal
        ? 'שתי הנקודות נמצאות על אותו קו אופקי. מה המרחק ביניהן?'
        : 'שתי הנקודות נמצאות על אותו קו אנכי. מה המרחק ביניהן?',
      promptTex: `${a} \\quad , \\quad ${b}`,
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: result },
      solution: [
        {
          he: horizontal
            ? 'שיעור ה-y זהה בשתיהן, אז מספיק להסתכל על ההפרש ב-x'
            : 'שיעור ה-x זהה בשתיהן, אז מספיק להסתכל על ההפרש ב-y',
        },
        { he: 'מחסרים ולוקחים את הערך החיובי', tex: `\\left|${p2} - ${p1}\\right| = ${result}` },
      ],
      hints: [
        { level: 1, he: 'שימי לב מה משותף לשתי הנקודות — זה מה שהופך את זה לקל.' },
        { level: 2, he: 'כשקו אחד משותף, המרחק הוא פשוט ההפרש בין השיעורים האחרים.' },
        { level: 3, he: 'מחסרים את שני השיעורים האלה, והמרחק תמיד חיובי.', tex: `${p1} \\, , \\, ${p2}` },
      ],
    };
  },
};

export const coordinatePlaneGenerators = [readPoint, quadrant, distance];
