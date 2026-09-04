/**
 * Everything date-shaped goes through here, in Asia/Jerusalem.
 *
 * Computing "due today" in UTC would flip the day at 02:00 or 03:00 local time
 * — so a review done late in the evening lands on tomorrow, and the streak she
 * has been keeping breaks for no reason she can see. DST shifts the offset
 * twice a year, which is why this uses Intl rather than a fixed +02:00.
 */

export type DayKey = string; // 'YYYY-MM-DD'

export const TIMEZONE = 'Asia/Jerusalem';

// en-CA formats as YYYY-MM-DD, which sorts and compares as a plain string.
const FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function dayKey(at: Date | number = Date.now()): DayKey {
  return FORMATTER.format(new Date(at));
}

/** Treats a day key as a calendar date, independent of any clock. */
function toUtcMillis(key: DayKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function fromUtcMillis(ms: number): DayKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: DayKey, days: number): DayKey {
  return fromUtcMillis(toUtcMillis(key) + days * 86_400_000);
}

export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / 86_400_000);
}

export const isOnOrBefore = (a: DayKey, b: DayKey): boolean => a <= b;

/** A topic is due when its date has arrived or passed. */
export const isDue = (dueDate: DayKey, today: DayKey = dayKey()): boolean => dueDate <= today;

/**
 * Consecutive days ending today, or ending yesterday — a streak is not broken
 * until a whole day has been missed, so opening the app at 22:00 and again at
 * 08:00 the next morning keeps it alive.
 */
export function streakLength(activeDays: Iterable<DayKey>, today: DayKey = dayKey()): number {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;

  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** "לפני 3 ימים" and friends, for the parent screen. */
export function relativeDayHe(key: DayKey, today: DayKey = dayKey()): string {
  const diff = daysBetween(key, today);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'אתמול';
  if (diff === 2) return 'שלשום';
  if (diff < 0) return `בעוד ${-diff} ימים`;
  if (diff < 7) return `לפני ${diff} ימים`;
  if (diff < 14) return 'לפני שבוע';
  if (diff < 31) return `לפני ${Math.round(diff / 7)} שבועות`;
  return `לפני ${Math.round(diff / 30)} חודשים`;
}
