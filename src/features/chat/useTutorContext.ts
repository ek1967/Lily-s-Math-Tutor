import { useMemo } from 'react';
import { useSettings } from '@/stores/settingsStore';
import { getTopic } from '@/data/curriculum';
import type { TutorContext } from '@/lib/ai/prompts/system.he';
import type { TopicId } from '@/types/curriculum';
import type { MasteryRecord } from '@/types/mastery';

/** Builds the tutor's picture of where she is, from what is already stored. */
export function useTutorContext(
  topicId?: TopicId,
  mastery?: ReadonlyMap<TopicId, MasteryRecord>,
): TutorContext {
  const { settings } = useSettings();

  return useMemo(() => {
    const weak = mastery
      ? [...mastery.values()]
          .filter((m) => m.introduced && m.level <= 1 && m.totalAttempts >= 3)
          .sort((a, b) => a.level - b.level)
          .slice(0, 4)
          .map((m) => getTopic(m.topicId)?.titleHe)
          .filter((t): t is string => Boolean(t))
      : [];

    const topicTitle = topicId ? getTopic(topicId)?.titleHe : undefined;

    return {
      studentName: settings.studentName,
      tutorName: settings.tutorName,
      answerMode: settings.answerMode,
      ...(topicTitle ? { topicTitleHe: topicTitle } : {}),
      ...(weak.length > 0 ? { weakTopicsHe: weak } : {}),
    };
  }, [settings, topicId, mastery]);
}
