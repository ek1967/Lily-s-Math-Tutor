import { useCallback, useEffect, useState } from 'react';
import { getMasteryMap } from '@/lib/db/repos/masteryRepo';
import { activeDays, attemptsSince } from '@/lib/db/repos/attemptRepo';
import { getActiveSession } from '@/lib/db/repos/sessionRepo';
import { buildTodayPlan, type TodayPlan } from '@/lib/srs/planner';
import { dayKey, streakLength } from '@/lib/time';
import { useSettings } from '@/stores/settingsStore';
import type { StudySession } from '@/types/session';
import type { MasteryRecord } from '@/types/mastery';
import type { TopicId } from '@/types/curriculum';

export interface Today {
  loading: boolean;
  plan: TodayPlan;
  mastery: ReadonlyMap<TopicId, MasteryRecord>;
  streak: number;
  /** Questions answered today, and the day's target — the ring shows this
   *  rather than a streak count, which reads as "0" on the day it matters most. */
  answeredToday: number;
  targetToday: number;
  /** A session she walked away from, if there is one to resume. */
  resumable: StudySession | null;
  reload: () => void;
}

const EMPTY_PLAN: TodayPlan = { review: [], focus: null, reason: 'nothing' };

/** Questions in one session, by the daily goal — mirrors buildDaily. */
const TARGET_BY_GOAL: Record<number, number> = { 8: 6, 12: 9, 20: 14 };

/** Midnight in Asia/Jerusalem as epoch ms, for "what did she do today". */
function startOfLocalDay(): number {
  const [y, m, d] = dayKey().split('-').map(Number);
  // Israel is UTC+2 or UTC+3; starting three hours early over-counts by at most
  // one hour of yesterday evening, which is the harmless direction to be wrong.
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) - 3 * 3600_000;
}

export function useToday(): Today {
  const { settings } = useSettings();
  const [state, setState] = useState<Omit<Today, 'reload'>>({
    loading: true,
    plan: EMPTY_PLAN,
    mastery: new Map(),
    streak: 0,
    answeredToday: 0,
    targetToday: 9,
    resumable: null,
  });

  const load = useCallback(async () => {
    try {
      const startOfToday = startOfLocalDay();
      const [mastery, days, session, todaysAttempts] = await Promise.all([
        getMasteryMap(),
        activeDays(),
        getActiveSession(),
        attemptsSince(startOfToday),
      ]);
      const today = dayKey();
      setState({
        loading: false,
        mastery,
        plan: buildTodayPlan({
          mastery,
          today,
          showExtensionTopics: settings.showExtensionTopics,
        }),
        streak: streakLength(days, today),
        answeredToday: todaysAttempts.length,
        targetToday: TARGET_BY_GOAL[settings.dailyGoalMinutes] ?? 9,
        resumable: session ?? null,
      });
    } catch {
      // Storage unavailable: fall back to a plan for a brand-new student rather
      // than showing an error on the home screen.
      setState((s) => ({
        ...s,
        loading: false,
        plan: buildTodayPlan({
          mastery: new Map(),
          today: dayKey(),
          showExtensionTopics: settings.showExtensionTopics,
        }),
      }));
    }
  }, [settings.showExtensionTopics]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: () => void load() };
}
