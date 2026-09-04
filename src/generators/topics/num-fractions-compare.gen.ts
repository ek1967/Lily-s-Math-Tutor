import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { frac, toTex } from '../fraction';
import { fracTex } from '../tex';

const TOPIC = asTopicId('num-fractions-compare');

/** Reducing: the single most useful habit in the whole fractions strand. */
const reduce: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-compare/reduce'),
  topicId: TOPIC,
  titleHe: 'צמצום שבר',
  difficulty: 1,
  weight: 1.2,
  skills: ['fractions.reduce', 'fractions.gcd'],
  generate(rng) {
    const baseD = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 11]);
    const baseN = rng.int(1, baseD - 1);
    const factor = rng.int(2, 9);
    const n = baseN * factor;
    const d = baseD * factor;
    const reduced = frac(n, d);

    return {
      promptHe: 'לצמצם את השבר עד הסוף',
      promptTex: fracTex(n, d),
      input: { kind: 'fraction', keypad: 'fraction', allowNegative: false },
      answer: { kind: 'fraction', num: reduced.n, den: reduced.d, requireReduced: true },
      solution: [
        { he: `המספר הגדול ביותר שמחלק גם את המונה וגם את המכנה הוא ${factor}` },
        { he: 'מחלקים את שניהם בו', tex: `${n} : ${factor} = ${baseN}` },
        { he: 'וגם את המכנה', tex: `${d} : ${factor} = ${baseD}` },
        { he: 'מקבלים', tex: toTex(reduced) },
      ],
      hints: [
        { level: 1, he: 'מחפשים מספר שמחלק גם את המונה וגם את המכנה בלי שארית.' },
        { level: 2, he: 'אפשר להתחיל מלבדוק אם שניהם מתחלקים ב־2, ב־3 או ב־5.' },
        {
          level: 3,
          he: `שניהם מתחלקים במספר הזה. מה יוצא כשמחלקים בו את שני החלקים?`,
          tex: String(factor),
        },
      ],
    };
  },
};

/** Which is bigger — the question that reveals whether fractions mean anything. */
const compare: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-compare/which-is-bigger'),
  topicId: TOPIC,
  titleHe: 'איזה שבר גדול יותר',
  difficulty: 2,
  weight: 1,
  skills: ['fractions.compare', 'fractions.common-denominator'],
  generate(rng) {
    const d1 = rng.pick([2, 3, 4, 5, 6, 8]);
    const d2 = rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const n1 = rng.int(1, d1 - 1);
    let n2 = rng.int(1, d2 - 1);

    // Two equal fractions would make "which is bigger" unanswerable, so nudge
    // the second numerator until the pair genuinely differs.
    if (n1 * d2 === n2 * d1) n2 = n2 > 1 ? n2 - 1 : n2 + 1;

    const left = n1 * d2;
    const right = n2 * d1;
    const common = d1 * d2;
    const bigger = left > right ? 0 : 1;
    const options = [{ tex: fracTex(n1, d1) }, { tex: fracTex(n2, d2) }];

    return {
      promptHe: 'איזה שבר גדול יותר?',
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: { kind: 'choice', correctIndex: bigger, options },
      solution: [
        { he: `מביאים את שניהם למכנה משותף ${common}` },
        { he: 'השבר הראשון הופך ל', tex: fracTex(left, common) },
        { he: 'והשני ל', tex: fracTex(right, common) },
        {
          he: 'עכשיו קל להשוות — המונה הגדול יותר מנצח',
          tex: options[bigger]!.tex,
        },
      ],
      hints: [
        { level: 1, he: 'אי אפשר להשוות ישירות מכנים שונים. מה עושים קודם?' },
        { level: 2, he: 'מביאים את שני השברים לאותו מכנה, ואז משווים רק את המונים.' },
        {
          level: 3,
          he: 'אחרי ההשוואה למכנה משותף אלה המונים. איזה גדול יותר?',
          tex: `${left} , ${right}`,
        },
      ],
    };
  },
};

/** Expanding to a required denominator — the mechanical step before adding. */
const expand: ExerciseGenerator = {
  id: asGeneratorId('num-fractions-compare/expand'),
  topicId: TOPIC,
  titleHe: 'הרחבת שבר למכנה נתון',
  difficulty: 3,
  weight: 0.9,
  skills: ['fractions.expand', 'fractions.common-denominator'],
  generate(rng) {
    const d = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
    const n = rng.int(1, d - 1);
    const factor = rng.int(2, 9);
    const target = d * factor;
    const answer = n * factor;

    return {
      promptHe: `להרחיב את השבר כך שהמכנה יהיה ${target}. מה יהיה המונה?`,
      promptTex: fracTex(n, d),
      input: { kind: 'integer', keypad: 'numeric', allowNegative: false },
      answer: { kind: 'integer', value: answer },
      solution: [
        { he: 'בודקים פי כמה גדל המכנה', tex: `${target} : ${d} = ${factor}` },
        { he: 'מכפילים את המונה באותו מספר בדיוק', tex: `${n} \\cdot ${factor} = ${answer}` },
        { he: 'ומקבלים', tex: fracTex(answer, target) },
      ],
      hints: [
        { level: 1, he: 'הרחבה היא כפל של המונה ושל המכנה באותו מספר. השבר לא משתנה בערכו.' },
        { level: 2, he: 'קודם בודקים פי כמה גדל המכנה, ואז עושים בדיוק אותו דבר למונה.' },
        { level: 3, he: 'המכנה הוכפל במספר הזה, אז גם המונה צריך להיות מוכפל בו.', tex: String(factor) },
      ],
    };
  },
};

export const fractionsCompareGenerators = [reduce, compare, expand];
