import type { LessonContent } from '@/types/content';
import { asTopicId } from '@/types/curriculum';

export const lesson: LessonContent = {
  topicId: asTopicId('num-fractions-mul-div'),
  source: 'authored',
  version: 1,
  hookHe:
    'זו החטיבה הקלה של השברים. בכפל אין מכנה משותף, אין הרחבות, ואין מה לחפש — פשוט כופלים.',
  explanation: [
    {
      kind: 'callout',
      tone: 'rule',
      he: 'בכפל שברים כופלים מונה במונה, ומכנה במכנה. זהו.',
    },
    { kind: 'math', tex: '\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}' },
    {
      kind: 'text',
      he: 'בחילוק יש צעד אחד נוסף: הופכים את השבר השני — המונה נעשה מכנה והמכנה נעשה מונה — ואז כופלים כרגיל.',
    },
    { kind: 'math', tex: '\\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}' },
    {
      kind: 'callout',
      tone: 'tip',
      he: 'המילה "מתוך" בשאלה מילולית כמעט תמיד אומרת כפל. שליש מתוך שישים זה שליש כפול שישים.',
    },
  ],
  examples: [
    {
      id: 'multiply',
      promptHe: 'כמה יוצא?',
      promptTex: '\\frac{2}{3} \\cdot \\frac{3}{4}',
      steps: [
        { he: 'כופלים מונה במונה', tex: '2 \\cdot 3 = 6' },
        { he: 'ומכנה במכנה', tex: '3 \\cdot 4 = 12' },
        {
          he: 'ומצמצמים',
          tex: '\\frac{6}{12} = \\frac{1}{2}',
          whyHe: 'אפשר היה גם לצמצם לפני הכפל, וזה חוסך עבודה עם מספרים גדולים.',
        },
      ],
      answerTex: '\\frac{1}{2}',
    },
    {
      id: 'divide',
      promptHe: 'כמה יוצא?',
      promptTex: '\\frac{3}{5} : \\frac{2}{7}',
      steps: [
        { he: 'הופכים את השבר השני', tex: '\\frac{2}{7} \\to \\frac{7}{2}' },
        { he: 'ועכשיו זה תרגיל כפל', tex: '\\frac{3}{5} \\cdot \\frac{7}{2}' },
        { he: 'כופלים', tex: '\\frac{21}{10}' },
      ],
      answerTex: '\\frac{21}{10}',
    },
  ],
  mistakes: [
    {
      wrongHe: 'מחפשים מכנה משותף גם בכפל',
      whyHe: 'זה מה שעושים בחיבור, וההרגל עובר.',
      fixHe: 'מכנה משותף נדרש רק בחיבור ובחיסור. בכפל ובחילוק הוא סתם עבודה מיותרת.',
    },
    {
      wrongHe: 'הופכים את השבר הראשון במקום את השני',
      whyHe: 'זוכרים ש"צריך להפוך" בלי לזכור את מי.',
      fixHe: 'הופכים תמיד את זה שמחלקים בו — השבר השני, אחרי סימן החילוק.',
    },
    {
      wrongHe: 'חושבים שכפל תמיד מגדיל',
      whyHe: 'במספרים שלמים זה נכון, וזה מרגיש כמו חוק טבע.',
      fixHe: 'כפל בשבר קטן מאחד דווקא מקטין. חצי כפול שמונה זה ארבע.',
    },
  ],
  vocab: [
    { termHe: 'שבר הופכי', defHe: 'השבר שמתקבל כשמחליפים בין המונה למכנה.' },
    { termHe: 'צמצום מוקדם', defHe: 'צמצום לפני הכפל, כדי לעבוד עם מספרים קטנים יותר.' },
  ],
};
