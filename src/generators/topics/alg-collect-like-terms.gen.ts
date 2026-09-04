import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { coef, linearTex, signed, signedCoef } from '../tex';

const TOPIC = asTopicId('alg-collect-like-terms');

/** One variable and a few numbers: sorting the two kinds of thing apart. */
const oneVariable: ExerciseGenerator = {
  id: asGeneratorId('alg-collect-like-terms/one-variable'),
  topicId: TOPIC,
  titleHe: 'כינוס עם משתנה אחד',
  difficulty: 1,
  weight: 1.3,
  skills: ['algebra.collect'],
  generate(rng) {
    const a1 = rng.nonZeroInt(-8, 9);
    const a2 = rng.nonZeroInt(-8, 9);
    const b1 = rng.nonZeroInt(-12, 12);
    const b2 = rng.nonZeroInt(-12, 12);
    const a = a1 + a2;
    const b = b1 + b2;

    const correct = a === 0 ? String(b) : linearTex(a, b);
    const distractors = [
      // Adding the x-count to the loose number: the classic slip.
      String(a + b),
      linearTex(a1 + b1, a2 + b2),
      linearTex(a, b1 - b2),
    ].filter((t) => t !== correct);

    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));
    const correctIndex = options.findIndex((o) => o.tex === correct);

    return {
      promptHe: 'איך נראה הביטוי אחרי כינוס איברים?',
      promptTex: `${coef(a1)} ${signed(b1)} ${signedCoef(a2)} ${signed(b2)}`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex, options },
      solution: [
        { he: 'אוספים בנפרד את האיברים עם המשתנה', tex: `${coef(a1)} ${signedCoef(a2)} = ${coef(a)}` },
        { he: 'ובנפרד את המספרים', tex: `${b1} ${signed(b2)} = ${b}` },
        { he: 'הביטוי המכונס', tex: correct },
      ],
      hints: [
        { level: 1, he: 'אפשר לחשוב על זה כמו על תפוחים ותפוזים: כל סוג נאסף לחוד.' },
        { level: 2, he: 'האיברים עם x נאספים ביחד, והמספרים לבדם. הם לא מתערבבים.' },
        { level: 3, he: 'האיברים עם המשתנה מסתכמים לזה. נשאר לצרף את המספרים.', tex: coef(a) },
      ],
    };
  },
};

/** Two variables, so "collect" cannot become "add everything". */
const twoVariables: ExerciseGenerator = {
  id: asGeneratorId('alg-collect-like-terms/two-variables'),
  topicId: TOPIC,
  titleHe: 'כינוס עם שני משתנים',
  difficulty: 2,
  weight: 1.1,
  skills: ['algebra.collect'],
  generate(rng) {
    const a1 = rng.nonZeroInt(-7, 8);
    const a2 = rng.nonZeroInt(-7, 8);
    const c1 = rng.nonZeroInt(-7, 8);
    const c2 = rng.nonZeroInt(-7, 8);
    const a = a1 + a2;
    const c = c1 + c2;

    const build = (xs: number, ys: number): string => {
      if (xs === 0 && ys === 0) return '0';
      if (xs === 0) return coef(ys, 'y');
      if (ys === 0) return coef(xs);
      return `${coef(xs)} ${signedCoef(ys, 'y')}`;
    };

    const correct = build(a, c);
    const distractors = [build(a + c, 0), build(a1 + c1, a2 + c2), build(a, c1 - c2)].filter(
      (t) => t !== correct,
    );
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));
    const correctIndex = options.findIndex((o) => o.tex === correct);

    return {
      promptHe: 'איך נראה הביטוי אחרי כינוס איברים?',
      promptTex: `${coef(a1)} ${signedCoef(c1, 'y')} ${signedCoef(a2)} ${signedCoef(c2, 'y')}`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex, options },
      solution: [
        { he: 'אוספים את איברי ה-x', tex: `${coef(a1)} ${signedCoef(a2)} = ${coef(a)}` },
        { he: 'ובנפרד את איברי ה-y', tex: `${coef(c1, 'y')} ${signedCoef(c2, 'y')} = ${coef(c, 'y')}` },
        { he: 'הביטוי המכונס', tex: correct },
      ],
      hints: [
        { level: 1, he: 'שני סוגים של איברים כאן, ואי אפשר לחבר ביניהם.' },
        { level: 2, he: 'איברי x נאספים עם איברי x בלבד, ואיברי y עם איברי y בלבד.' },
        { level: 3, he: 'איברי ה-x נותנים את זה. עכשיו אותו דבר ל-y.', tex: coef(a) },
      ],
    };
  },
};

/** The perimeter framing: collecting like terms with a reason to do it. */
const perimeter: ExerciseGenerator = {
  id: asGeneratorId('alg-collect-like-terms/perimeter'),
  topicId: TOPIC,
  titleHe: 'היקף בעזרת ביטוי',
  difficulty: 3,
  weight: 0.9,
  skills: ['algebra.collect', 'algebra.model'],
  generate(rng) {
    const a = rng.int(2, 9);
    const b = rng.int(1, 12);
    const c = rng.int(2, 9);
    const d = rng.int(1, 12);
    // Perimeter of a rectangle with sides (ax + b) and (cx + d).
    const totalX = 2 * (a + c);
    const totalConst = 2 * (b + d);
    const correct = linearTex(totalX, totalConst);

    const distractors = [
      linearTex(a + c, b + d),
      linearTex(2 * a + c, 2 * b + d),
      linearTex(totalX, b + d),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));
    const correctIndex = options.findIndex((o) => o.tex === correct);

    return {
      promptHe: 'צלעות המלבן נתונות. איזה ביטוי מתאר את ההיקף שלו?',
      promptTex: `${linearTex(a, b)} \\quad , \\quad ${linearTex(c, d)}`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex, options },
      solution: [
        { he: 'בהיקף מלבן כל צלע נספרת פעמיים' },
        {
          he: 'מחברים את שתי הצלעות',
          tex: `${linearTex(a, b)} + ${linearTex(c, d)} = ${linearTex(a + c, b + d)}`,
        },
        { he: 'ומכפילים בשתיים', tex: correct },
      ],
      hints: [
        { level: 1, he: 'ההיקף הוא סכום כל הצלעות. למלבן יש ארבע, בשני זוגות.' },
        { level: 2, he: 'קודם מחברים אורך ורוחב, ואז מכפילים את התוצאה בשתיים.' },
        { level: 3, he: 'סכום שתי הצלעות הוא זה. נשאר להכפיל בשתיים.', tex: linearTex(a + c, b + d) },
      ],
    };
  },
};

export const collectLikeTermsGenerators = [oneVariable, twoVariables, perimeter];
