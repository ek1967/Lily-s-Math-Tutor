import { useCallback, useEffect, useState } from 'react';
import { getAllMastery } from '@/lib/db/repos/masteryRepo';
import { attemptsSince } from '@/lib/db/repos/attemptRepo';
import { recentSessions } from '@/lib/db/repos/sessionRepo';
import { materialBytes } from '@/lib/db/repos/materialRepo';
import { storageEstimate } from '@/lib/db/open';
import { getSpend } from '@/lib/ai/budget';
import type { MasteryRecord } from '@/types/mastery';
import type { Attempt, StudySession } from '@/types/session';
import type { SpendRecord } from '@/lib/ai/budget';

export interface ParentData {
  loading: boolean;
  mastery: MasteryRecord[];
  weekAttempts: Attempt[];
  sessions: StudySession[];
  spend: SpendRecord;
  storage: { usage: number; quota: number; materials: number } | null;
  reload: () => void;
}

const WEEK_MS = 7 * 86_400_000;

export function useParentData(): ParentData {
  const [state, setState] = useState<Omit<ParentData, 'reload'>>({
    loading: true,
    mastery: [],
    weekAttempts: [],
    sessions: [],
    spend: { month: '', agorot: 0, requests: 0 },
    storage: null,
  });

  const load = useCallback(async () => {
    try {
      const [mastery, weekAttempts, sessions, spend, estimate, materials] = await Promise.all([
        getAllMastery(),
        attemptsSince(Date.now() - WEEK_MS),
        recentSessions(20),
        getSpend(),
        storageEstimate(),
        materialBytes(),
      ]);
      setState({
        loading: false,
        mastery,
        weekAttempts,
        sessions,
        spend,
        storage: estimate ? { ...estimate, materials } : null,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: () => void load() };
}

/** Topics worth a parent's attention: introduced, practised, and not sticking. */
export function strugglingTopics(mastery: readonly MasteryRecord[]): MasteryRecord[] {
  return mastery
    .filter((m) => m.introduced && m.totalAttempts >= 4 && m.totalCorrect / m.totalAttempts < 0.6)
    .sort((a, b) => a.totalCorrect / a.totalAttempts - b.totalCorrect / b.totalAttempts);
}

export function masteredTopics(mastery: readonly MasteryRecord[]): MasteryRecord[] {
  return mastery.filter((m) => m.level >= 4);
}

/** Rough minutes of work, from the time actually spent on questions. */
export function minutesFrom(attempts: readonly Attempt[]): number {
  const ms = attempts.reduce((sum, a) => sum + Math.min(a.msElapsed, 120_000), 0);
  return Math.round(ms / 60_000);
}
