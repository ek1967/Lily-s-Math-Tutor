import type { Topic } from '@/types/curriculum';

/**
 * Asks for a lesson in the same shape as the hand-written ones, so generated
 * and authored content render identically and read alike. The constraints are
 * the ones that matter for this reader: short, feminine Hebrew, no LaTeX inside
 * Hebrew sentences, and mistakes explained rather than merely listed.
 */
export function buildLessonPrompt(topic: Topic, studentName: string): string {
  return `כתבי שיעור קצר בעברית על הנושא "${topic.titleHe}" עבור ${studentName}, תלמידת כיתה ח' בהקבצה נמוכה עם קשיי קשב.

יעדי הנושא:
${topic.goals.map((g) => `- ${g}`).join('\n')}

החזירי JSON בלבד, בלי טקסט לפניו או אחריו, במבנה הבא:

{
  "hookHe": "משפט או שניים על למה זה משנה בחיים האמיתיים",
  "explanation": [
    { "kind": "text", "he": "הסבר קצר בעברית" },
    { "kind": "math", "tex": "נוסחה ב-LaTeX" },
    { "kind": "callout", "tone": "tip", "he": "טיפ קצר" }
  ],
  "examples": [
    {
      "promptHe": "שאלת הדוגמה בעברית",
      "promptTex": "המתמטיקה של השאלה ב-LaTeX",
      "steps": [
        { "he": "מה עושים בשלב הזה", "tex": "החישוב", "whyHe": "למה עושים את זה" }
      ],
      "answerTex": "התשובה ב-LaTeX"
    }
  ],
  "mistakes": [
    { "wrongHe": "מה משתבש", "whyHe": "למה זה מפתה לטעות כך", "fixHe": "מה מונע את זה" }
  ],
  "vocab": [{ "termHe": "מונח", "defHe": "הגדרה קצרה" }]
}

כללים מחייבים:
1. כל טקסט עברי חייב להיות בלשון נקבה.
2. אסור לשלב LaTeX או סימני דולר בתוך שדות עבריים. מתמטיקה הולכת רק לשדות tex.
3. אסור לכתוב מספר שלילי בתוך משפט עברי. אם צריך מספר שלילי — הוא הולך לשדה tex.
4. בין 3 ל-5 בלוקים ב-explanation. לא יותר. משפטים קצרים.
5. לפחות דוגמה אחת, ובכל דוגמה לפחות שני שלבים.
6. ב-mistakes להסביר למה הטעות מפתה, לא רק מה אסור.
7. בלי התנשאות ובלי שפה ילדותית. היא בת 13.`;
}
