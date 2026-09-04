import { describe, expect, it } from 'vitest';
import {
  addDays, dayKey, daysBetween, isDue, relativeDayHe, streakLength,
} from '@/lib/time';

/**
 * Off-by-one-day bugs here are maddening to debug and directly visible to her:
 * a review that disappears, or a streak that breaks overnight for no reason.
 */
describe('day keys in Asia/Jerusalem', () => {
  it('formats as a sortable calendar date', () => {
    expect(dayKey(Date.UTC(2026, 8, 4, 12, 0))).toBe('2026-09-04');
  });

  it('keeps late-evening local time on the same local day', () => {
    // 22:30 in Israel during summer time is 19:30 UTC — computing in UTC would
    // still say the 4th here, but the winter case below is the one that bites.
    expect(dayKey(Date.UTC(2026, 8, 4, 19, 30))).toBe('2026-09-04');
  });

  it('rolls over at local midnight, not at UTC midnight', () => {
    // 23:30 UTC on 4 Sept is already 02:30 on 5 Sept in Israel.
    expect(dayKey(Date.UTC(2026, 8, 4, 23, 30))).toBe('2026-09-05');
    // And 21:00 UTC is 00:00 local — the first moment of the next day.
    expect(dayKey(Date.UTC(2026, 8, 4, 21, 0))).toBe('2026-09-05');
  });

  it('handles the winter offset too', () => {
    // January is UTC+2, so 22:30 UTC is 00:30 the next day.
    expect(dayKey(Date.UTC(2026, 0, 15, 22, 30))).toBe('2026-01-16');
    expect(dayKey(Date.UTC(2026, 0, 15, 21, 30))).toBe('2026-01-15');
  });

  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-09-04', 1)).toBe('2026-09-05');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-03-27', 7)).toBe('2026-04-03');
  });

  it('counts days across a DST change without drifting', () => {
    // Israel moves the clocks in late March; the day count must stay whole.
    expect(daysBetween('2026-03-25', '2026-04-01')).toBe(7);
    expect(daysBetween('2026-10-20', '2026-11-01')).toBe(12);
    expect(daysBetween('2026-09-04', '2026-09-04')).toBe(0);
  });

  it('treats a past due date as due', () => {
    expect(isDue('2026-09-01', '2026-09-04')).toBe(true);
    expect(isDue('2026-09-04', '2026-09-04')).toBe(true);
    expect(isDue('2026-09-05', '2026-09-04')).toBe(false);
  });
});

describe('streaks', () => {
  it('counts consecutive days ending today', () => {
    const days = ['2026-09-02', '2026-09-03', '2026-09-04'];
    expect(streakLength(days, '2026-09-04')).toBe(3);
  });

  it('survives until a whole day is missed', () => {
    // She worked last night but has not opened it yet today — still alive.
    const days = ['2026-09-02', '2026-09-03'];
    expect(streakLength(days, '2026-09-04')).toBe(2);
  });

  it('breaks after a missed day', () => {
    expect(streakLength(['2026-09-01', '2026-09-02'], '2026-09-04')).toBe(0);
  });

  it('is zero with no history', () => {
    expect(streakLength([], '2026-09-04')).toBe(0);
  });

  it('ignores gaps further back', () => {
    const days = ['2026-08-01', '2026-09-03', '2026-09-04'];
    expect(streakLength(days, '2026-09-04')).toBe(2);
  });
});

describe('relative day wording', () => {
  it('names the recent days', () => {
    expect(relativeDayHe('2026-09-04', '2026-09-04')).toBe('היום');
    expect(relativeDayHe('2026-09-03', '2026-09-04')).toBe('אתמול');
    expect(relativeDayHe('2026-09-02', '2026-09-04')).toBe('שלשום');
    expect(relativeDayHe('2026-08-31', '2026-09-04')).toBe('לפני 4 ימים');
  });

  it('looks forward for a future due date', () => {
    expect(relativeDayHe('2026-09-07', '2026-09-04')).toBe('בעוד 3 ימים');
  });
});
