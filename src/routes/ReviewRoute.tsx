import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PracticeRunner } from '@/features/practice/PracticeRunner';
import { persistPractice } from '@/features/practice/persist';
import { buildPracticeSet } from '@/lib/practice/selection';
import { getDueTopics } from '@/lib/db/repos/masteryRepo';
import { getTopic } from '@/data/curriculum';
import { registerAllGenerators } from '@/generators';
import { Button, Card } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import type { Exercise } from '@/types/exercise';
import type { MasteryRecord } from '@/types/mastery';
import { paths } from '@/router';

registerAllGenerators();

/** Two questions per due topic: enough to tell whether it stuck, short enough
 *  that a backlog does not turn into a punishment. */
const PER_TOPIC = 2;
const MAX_TOPICS = 4;

export function ReviewRoute() {
  const navigate = useNavigate();
  const [due, setDue] = useState<MasteryRecord[] | null>(null);
  const sessionId = useRef(`review-${Date.now().toString(36)}`);

  useEffect(() => {
    void getDueTopics().then((rows) => setDue(rows.slice(0, MAX_TOPICS)));
  }, []);

  const exercises = useMemo<Exercise[]>(() => {
    if (!due) return [];
    const seedBase = Math.floor(Date.now() / 1000);
    return due.flatMap((m, i) =>
      buildPracticeSet(m.topicId, seedBase + i * 977, PER_TOPIC, {
        masteryLevel: m.level,
        introduced: m.introduced,
      }),
    );
  }, [due]);

  if (due === null) return null;

  if (exercises.length === 0) {
    return (
      <div>
        <PageHeader title="חזרה" />
        <Card className="text-center">
          <p className="text-lg">אין מה לחזור עליו כרגע.</p>
          <p className="mt-2 text-ink-soft">
            כל מה שלמדת עדיין טרי. נחזור לזה בעוד כמה ימים.
          </p>
          <Button className="mt-4" onClick={() => navigate(paths.home())}>
            חזרה לדף הבית
          </Button>
        </Card>
      </div>
    );
  }

  const titles = due
    .map((m) => getTopic(m.topicId)?.titleHe)
    .filter(Boolean)
    .join(' · ');

  return (
    <PracticeRunner
      exercises={exercises}
      title={titles || 'חזרה'}
      onExit={() => navigate(paths.home())}
      onFinish={(records) => void persistPractice(sessionId.current, records)}
    />
  );
}
