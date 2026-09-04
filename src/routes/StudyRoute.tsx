import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PracticeRunner } from '@/features/practice/PracticeRunner';
import { persistPractice } from '@/features/practice/persist';
import { exercisesFromSteps } from '@/features/daily/buildDaily';
import { getSession, saveSession } from '@/lib/db/repos/sessionRepo';
import { getTopic } from '@/data/curriculum';
import { getAuthoredLesson } from '@/data/lessons';
import { LessonView } from '@/features/learn/LessonView';
import { markIntroduced } from '@/lib/db/repos/masteryRepo';
import { registerAllGenerators } from '@/generators';
import { Button, Card } from '@/components/ui';
import type { StudySession } from '@/types/session';
import type { AttemptRecord } from '@/lib/practice/engine';
import { paths } from '@/router';

registerAllGenerators();

/**
 * The daily session. The plan is stored as steps carrying a generator id and a
 * seed, so the exercises are rebuilt exactly — she resumes on the same question
 * with the same numbers, days later if need be.
 */
export function StudyRoute() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<StudySession | null | 'missing'>(null);
  const [lessonRead, setLessonRead] = useState(false);

  useEffect(() => {
    void getSession(sessionId)
      .then((s) => setSession(s ?? 'missing'))
      .catch(() => setSession('missing'));
  }, [sessionId]);

  const exercises = useMemo(
    () => (session && session !== 'missing' ? exercisesFromSteps(session.plan) : []),
    [session],
  );

  const onProgress = useCallback(
    (index: number) => {
      if (!session || session === 'missing') return;
      if (index === session.currentStep) return;
      void saveSession({ ...session, currentStep: index }).catch(() => {});
    },
    [session],
  );

  const onFinish = useCallback(
    (records: readonly AttemptRecord[]) => {
      if (!session || session === 'missing') return;
      void persistPractice(session.id, records);
      void saveSession({
        ...session,
        outcome: 'completed',
        endedAt: Date.now(),
        currentStep: session.plan.length,
        stats: {
          attempted: records.length,
          correct: records.filter((r) => r.correct === 1).length,
          hintsUsed: records.reduce((a, r) => a + r.hintsUsed, 0),
          revealed: records.filter((r) => r.revealed === 1).length,
        },
      }).catch(() => {});
    },
    [session],
  );

  if (session === null) return null;

  if (session === 'missing' || exercises.length === 0) {
    return (
      <Card className="mt-10 text-center">
        <p className="text-lg">לא מצאתי את הסשן הזה.</p>
        <Button className="mt-4" onClick={() => navigate(paths.home())}>
          חזרה לדף הבית
        </Button>
      </Card>
    );
  }

  // A brand-new topic opens with its lesson, before any question is asked.
  const lessonStep = session.plan.find((step) => step.kind === 'lesson');
  if (lessonStep && !lessonRead && session.currentStep === 0) {
    const lesson = getAuthoredLesson(lessonStep.topicId);
    const topic = getTopic(lessonStep.topicId);
    if (lesson && topic) {
      return (
        <div className="space-y-5">
          <header>
            <p className="text-sm text-ink-soft">נושא חדש</p>
            <h1 className="text-2xl">{topic.titleHe}</h1>
          </header>
          <LessonView lesson={lesson} />
          <Button
            size="hero"
            block
            onClick={() => {
              setLessonRead(true);
              void markIntroduced(lessonStep.topicId).catch(() => {});
            }}
          >
            הבנתי — בואי נתרגל
          </Button>
          <Button variant="quiet" block onClick={() => navigate(paths.home())}>
            אחר כך
          </Button>
        </div>
      );
    }
  }

  const titles = session.topicIds
    .map((id) => getTopic(id)?.titleHe)
    .filter(Boolean)
    .join(' · ');

  return (
    <PracticeRunner
      exercises={exercises}
      title={titles || 'הסשן של היום'}
      startIndex={Math.min(session.currentStep, exercises.length - 1)}
      breatherAt={breatherFor(exercises.length)}
      summaryNote={titles ? `היום עבדנו על ${titles}` : undefined}
      onProgress={onProgress}
      onFinish={onFinish}
      onExit={() => navigate(paths.home())}
    />
  );
}

/** One breath, halfway, never on the last item. */
function breatherFor(count: number): number[] {
  return count >= 6 ? [Math.floor(count / 2) - 1] : [];
}
