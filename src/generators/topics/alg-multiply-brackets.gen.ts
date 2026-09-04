import { asTopicId } from '@/types/curriculum';
import { asGeneratorId, type ExerciseGenerator } from '@/types/exercise';
import { linearTex, paren, signed, signedCoef } from '../tex';

const TOPIC = asTopicId('alg-multiply-brackets');

/**
 * Multiplying two brackets.
 *
 * Every wrong option below is a real slip rather than a random expression:
 * multiplying only the matching pair, losing the sign on the last product,
 * forgetting to collect the two middle terms. A distractor she would never
 * choose teaches nothing, and one she recognises as her own mistake does.
 */

/** `ax^2 + bx + c`, with the awkward coefficients handled. */
function quadraticTex(a: number, b: number, c: number): string {
  const head = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`;
  const middle = b === 0 ? '' : ` ${signedCoef(b)}`;
  const tail = c === 0 ? '' : ` ${signed(c)}`;
  return `${head}${middle}${tail}`;
}

const twoBinomials: ExerciseGenerator = {
  id: asGeneratorId('alg-multiply-brackets/two-binomials'),
  topicId: TOPIC,
  titleHe: 'כפל שני סוגריים',
  difficulty: 1,
  weight: 1.3,
  skills: ['algebra.multiply-brackets'],
  generate(rng) {
    // Both constants positive at this level: the signs are the next exercise.
    const a = rng.int(1, 9);
    const b = rng.int(1, 9);

    const correct = quadraticTex(1, a + b, a * b);
    const distractors = [
      // Only the firsts and only the lasts — the classic half-multiplication.
      quadraticTex(1, 0, a * b),
      // The middle terms multiplied instead of added.
      quadraticTex(1, a * b, a + b),
      quadraticTex(1, a + b, a + b),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים וכינוס?',
      promptTex: `\\left(${linearTex(1, a)}\\right)\\left(${linearTex(1, b)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'כל איבר בסוגריים הראשונות מוכפל בכל איבר בשניות, ארבעה מכפלים בסך הכול' },
        { he: 'שני הראשונים ושני האחרונים', tex: `x \\cdot x = x^2 \\quad ${a} \\cdot ${b} = ${a * b}` },
        { he: 'ושני האמצעיים מתכנסים לאיבר אחד', tex: `${a}x + ${b}x = ${a + b}x` },
        { he: 'וזה הביטוי המלא', tex: correct },
      ],
      hints: [
        {
          level: 1,
          he: 'ארבעה מכפלים, לא שניים. שווה לצייר ארבעה חצים ולסמן כל אחד אחרי שעשית אותו.',
        },
        { level: 2, he: 'שני המכפלים האמצעיים דומים זה לזה, ולכן אפשר לכנס אותם לאיבר אחד.' },
        { level: 3, he: 'אלה שני האיברים האמצעיים, לפני הכינוס.', tex: `${a}x + ${b}x` },
      ],
    };
  },
};

const withNegatives: ExerciseGenerator = {
  id: asGeneratorId('alg-multiply-brackets/with-negatives'),
  topicId: TOPIC,
  titleHe: 'כפל סוגריים עם מינוס',
  difficulty: 2,
  weight: 1.3,
  skills: ['algebra.multiply-brackets', 'algebra.sign'],
  generate(rng) {
    const a = rng.nonZeroInt(-9, 9);
    const b = rng.nonZeroInt(-9, 9);

    const correct = quadraticTex(1, a + b, a * b);
    const distractors = [
      // The last product with the wrong sign — where minus times minus goes.
      quadraticTex(1, a + b, -a * b),
      quadraticTex(1, a - b, a * b),
      quadraticTex(1, 0, a * b),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים וכינוס?',
      promptTex: `\\left(${linearTex(1, a)}\\right)\\left(${linearTex(1, b)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'הסימן שלפני כל מספר הוא חלק ממנו, וגם הוא נכנס לכפל' },
        {
          he: 'מכפלת שני המספרים',
          tex: `${paren(a)} \\cdot ${paren(b)} = ${a * b}`,
        },
        { he: 'וסכומם נותן את האיבר האמצעי', tex: `${a} ${signed(b)} = ${a + b}` },
        { he: 'וזה הביטוי המלא', tex: correct },
      ],
      hints: [
        {
          level: 1,
          he: 'המינוס שייך למספר שאחריו, לא לפעולה. כדאי להעתיק את המספרים עם הסימן שלהם.',
        },
        {
          level: 2,
          he: 'מינוס כפול מינוס נותן פלוס, ומינוס כפול פלוס נותן מינוס. זה נכון גם כאן.',
        },
        {
          level: 3,
          he: 'זו מכפלת שני המספרים, עם הסימן הנכון.',
          tex: String(a * b),
        },
      ],
    };
  },
};

const leadingCoefficient: ExerciseGenerator = {
  id: asGeneratorId('alg-multiply-brackets/leading-coefficient'),
  topicId: TOPIC,
  titleHe: 'כפל סוגריים עם מקדם',
  difficulty: 3,
  weight: 1,
  skills: ['algebra.multiply-brackets', 'algebra.collect'],
  generate(rng) {
    // (kx + a)(x + b): the first bracket carries a coefficient, so the two
    // middle terms are no longer symmetric and cannot be added by habit.
    const k = rng.int(2, 6);
    const a = rng.nonZeroInt(-8, 8);
    const b = rng.nonZeroInt(-8, 8);

    const middle = k * b + a;
    const correct = quadraticTex(k, middle, a * b);
    const distractors = [
      // Forgetting that the coefficient reaches the second bracket's constant.
      quadraticTex(k, a + b, a * b),
      quadraticTex(k, middle, -a * b),
      quadraticTex(1, middle, a * b),
    ].filter((t) => t !== correct);
    const options = rng.shuffle([correct, ...distractors.slice(0, 3)]).map((tex) => ({ tex }));

    return {
      promptHe: 'איך נראה הביטוי אחרי פתיחת הסוגריים וכינוס?',
      promptTex: `\\left(${linearTex(k, a)}\\right)\\left(${linearTex(1, b)}\\right)`,
      input: { kind: 'choice', keypad: 'none', allowNegative: false },
      answer: {
        kind: 'choice',
        correctIndex: options.findIndex((o) => o.tex === correct),
        options,
      },
      solution: [
        { he: 'גם כאן ארבעה מכפלים, והמקדם שלפני המשתנה נכנס לשניים מהם' },
        { he: 'האיבר המוביל', tex: `${k}x \\cdot x = ${k}x^2` },
        {
          he: 'שני האיברים האמצעיים כבר אינם שווים זה לזה',
          tex: `${k}x \\cdot ${paren(b)} = ${k * b}x \\quad , \\quad ${paren(a)} \\cdot x = ${a}x`,
        },
        { he: 'ואחרי כינוס ומכפלת המספרים', tex: correct },
      ],
      hints: [
        {
          level: 1,
          he: 'המקדם שלפני המשתנה הוא חלק מהאיבר, ולכן הוא מוכפל גם במספר שבסוגריים השניות.',
        },
        {
          level: 2,
          he: 'כאן שני האיברים האמצעיים אינם שווים, אז חייבים לחשב כל אחד מהם בנפרד לפני שמכנסים.',
        },
        { level: 3, he: 'אלה שני האיברים האמצעיים לפני הכינוס.', tex: `${k * b}x ${signedCoef(a)}` },
      ],
    };
  },
};

export const multiplyBracketsGenerators = [twoBinomials, withNegatives, leadingCoefficient];
