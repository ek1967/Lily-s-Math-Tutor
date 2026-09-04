/**
 * Feedback wording. Two rules run through all of it: never the word "wrong",
 * and never empty enthusiasm. "מעולה!!!" on every single answer stops meaning
 * anything by the third one; naming what she actually did is what lands.
 */

export const PRAISE = [
  'יופי',
  'בדיוק',
  'כל הכבוד',
  'נכון מאוד',
  'יפה',
  'זהו, בדיוק ככה',
  'מצוין',
] as const;

/** After a wrong answer. Never "wrong", never a cross, never a lost streak. */
export const ALMOST = [
  'כמעט',
  'קרוב מאוד',
  'לא נורא — בואי ננסה שוב',
  'עוד ניסיון אחד',
  'כמעט שם',
] as const;

/** After she gets it right on a second try — the most important praise there is. */
export const RECOVERED = [
  'יפה שלא ויתרת',
  'זה בדיוק מה שצריך לעשות — לנסות שוב',
  'הפעם הצלחת. ככה זה עובד',
] as const;

/** Shown when three tries have gone by, before offering a different route. */
export const STUCK = [
  'הנושא הזה מבלבל הרבה אנשים. בואי נעשה דוגמה ביחד',
  'אולי כדאי לעצור רגע ולראות את זה מזווית אחרת',
] as const;

/** Deterministic rotation — no randomness inside a render. */
export function pickPhrase(list: readonly string[], n: number): string {
  return list[Math.abs(n) % list.length]!;
}
