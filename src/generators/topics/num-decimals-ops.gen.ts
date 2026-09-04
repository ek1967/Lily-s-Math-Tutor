import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';

const TOPIC = asTopicId('num-decimals-ops');

/**
 * Decimals.
 *
 * Everything here is built from integers and divided only at the end. Doing the
 * arithmetic in floating point produces answers like 0.30000000000000004, and a
 * generator whose own answer is unrepresentable fails its own exercise.
 */

/** Half a step of the last displayed place: enough slack for float noise,
 *  tight enough that a wrong digit is still wrong. */
const toleranceFor = (places: number): number => 0.5 / 10 ** (places + 1);

/** A decimal written out with its trailing zeros intact, for TeX. */
const dec = (units: number, places: number): string => (units / 10 ** places).toFixed(places);

const addSub: ExerciseGenerator = {
  id: asGeneratorId('num-decimals-ops/add-sub'),
  topicId: TOPIC,
  titleHe: 'חיבור וחיסור עשרוניים',
  difficulty: 1,
  weight: 1.3,
  skills: ['decimals.add-sub', 'decimals.place-value'],
  generate(rng) {
    const places = rng.pick([1, 2] as const);
    const scale = 10 ** places;
    const adding = rng.bool();

    // Kept in whole hundredths (or tenths) until the very last step.
    const first = rng.int(scale + 1, 99 * scale);
    const second = rng.int(scale + 1, adding ? 99 * scale : first - 1);
    const resultUnits = adding ? first + second : first - second;

    const a = dec(first, places);
    const b = dec(second, places);
    const answer = dec(resultUnits, places);

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${a} ${adding ? '+' : '-'} ${b}`,
      input: { kind: 'decimal', keypad: 'numeric', allowNegative: false },
      answer: {
        kind: 'decimal',
        value: resultUnits / scale,
        decimals: places,
        tolerance: toleranceFor(places),
      },
      solution: [
        { he: 'כותבים אחד מתחת לשני כך שהנקודות זו מעל זו' },
        {
          he: adding ? 'ומחברים ספרה מול ספרה' : 'ומחסרים ספרה מול ספרה',
          tex: `${a} ${adding ? '+' : '-'} ${b} = ${answer}`,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'הדבר היחיד שחייב להסתדר כאן הוא הנקודה. הנקודות צריכות להיות בדיוק זו מעל זו.',
        },
        {
          level: 2,
          he: 'אם לאחד המספרים יש פחות ספרות אחרי הנקודה, אפשר להוסיף לו אפסים בסוף — זה לא משנה את ערכו.',
        },
        {
          level: 3,
          he: 'זה התרגיל כשהוא מסודר. עכשיו פועלים ספרה מול ספרה כמו במספרים שלמים.',
          tex: `${a} ${adding ? '+' : '-'} ${b}`,
        },
      ],
    };
  },
};

const multiply: ExerciseGenerator = {
  id: asGeneratorId('num-decimals-ops/multiply'),
  topicId: TOPIC,
  titleHe: 'כפל עשרוניים',
  difficulty: 2,
  weight: 1.2,
  skills: ['decimals.multiply', 'decimals.place-value'],
  generate(rng) {
    // One factor carries the decimals, the other is small enough to multiply
    // in her head — the point is where the point lands, not the long multiplication.
    const places = rng.pick([1, 2] as const);
    const firstUnits = rng.int(11, 99 * 10 ** (places - 1));
    const byDecimal = rng.bool(0.4);
    const secondUnits = byDecimal ? rng.int(11, 49) : rng.int(2, 12);
    const secondPlaces = byDecimal ? 1 : 0;

    const totalPlaces = places + secondPlaces;
    const productUnits = firstUnits * secondUnits;

    const a = dec(firstUnits, places);
    const b = dec(secondUnits, secondPlaces);
    const answer = dec(productUnits, totalPlaces);

    return {
      promptHe: 'כמה יוצא?',
      promptTex: `${a} \\cdot ${b}`,
      input: { kind: 'decimal', keypad: 'numeric', allowNegative: false },
      answer: {
        kind: 'decimal',
        value: productUnits / 10 ** totalPlaces,
        decimals: totalPlaces,
        tolerance: toleranceFor(totalPlaces),
      },
      solution: [
        {
          he: 'מתעלמים מהנקודות ומכפילים כמו מספרים שלמים',
          tex: `${firstUnits} \\cdot ${secondUnits} = ${productUnits}`,
        },
        {
          he:
            totalPlaces === 1
              ? 'סופרים כמה ספרות יש אחרי הנקודות בשני הגורמים — יש ספרה אחת, ולכן זו מספר הספרות בתשובה'
              : `סופרים כמה ספרות יש אחרי הנקודות בשני הגורמים — יש ${totalPlaces}, ולכן זה מספר הספרות בתשובה`,
          tex: answer,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'בכפל אין צורך ליישר נקודות. קודם מכפילים כאילו אין נקודות בכלל.',
        },
        {
          level: 2,
          he: 'בסוף סופרים כמה ספרות יש אחרי הנקודה בשני הגורמים יחד, ומזיזים את הנקודה בתשובה באותו מספר מקומות שמאלה.',
        },
        {
          level: 3,
          he: 'זו התוצאה בלי הנקודה. נשאר רק להחזיר אותה למקום הנכון.',
          tex: String(productUnits),
        },
      ],
    };
  },
};

const divideAndRound: ExerciseGenerator = {
  id: asGeneratorId('num-decimals-ops/divide-round'),
  topicId: TOPIC,
  titleHe: 'חילוק ועיגול',
  difficulty: 3,
  weight: 1,
  skills: ['decimals.divide', 'decimals.round'],
  generate(rng) {
    const divisor = rng.int(2, 9);
    // The exact quotient has two decimal places, and she is asked for one — so
    // the division comes out clean and the rounding is the actual work.
    let quotientUnits = rng.int(105, 4999);
    // A quotient ending in 5 makes the rounding ambiguous to a 13-year-old, and
    // arguing about half-up is not what this exercise is for.
    if (quotientUnits % 10 === 5) quotientUnits += 1;

    const dividendUnits = quotientUnits * divisor;
    const roundedTenths = Math.round(quotientUnits / 10);

    const dividend = dec(dividendUnits, 2);
    const exact = dec(quotientUnits, 2);
    const answer = dec(roundedTenths, 1);
    const lastDigit = quotientUnits % 10;

    return {
      promptHe: 'כמה יוצא? מעגלים את התשובה לספרה אחת אחרי הנקודה.',
      promptTex: `${dividend} : ${divisor}`,
      input: { kind: 'decimal', keypad: 'numeric', allowNegative: false },
      answer: {
        kind: 'decimal',
        value: roundedTenths / 10,
        decimals: 1,
        tolerance: toleranceFor(1),
      },
      solution: [
        { he: 'מחלקים כרגיל, והנקודה בתשובה נשארת מול הנקודה שבמספר המחולק', tex: `${dividend} : ${divisor} = ${exact}` },
        {
          he:
            lastDigit < 5
              ? 'הספרה שאחרי מקום העיגול קטנה מחמש, ולכן משאירים את הספרה שלפניה כמו שהיא'
              : 'הספרה שאחרי מקום העיגול גדולה מחמש, ולכן מעלים את הספרה שלפניה באחת',
          tex: answer,
        },
      ],
      hints: [
        {
          level: 1,
          he: 'שני שלבים נפרדים: קודם מחלקים עד הסוף, ורק אחר כך מעגלים. לא מעגלים באמצע.',
        },
        {
          level: 2,
          he: 'כדי לעגל לספרה אחת אחרי הנקודה מסתכלים על הספרה שבאה אחריה: אם היא חמש או יותר מעלים באחת, אחרת משאירים.',
        },
        { level: 3, he: 'זו התוצאה המדויקת של החילוק. נשאר רק לעגל אותה.', tex: exact },
      ],
    };
  },
};

export const decimalsOpsGenerators = [addSub, multiply, divideAndRound];
