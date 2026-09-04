import { useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PracticeRunner } from '@/features/practice/PracticeRunner';
import { buildPracticeSet } from '@/lib/practice/selection';
import { getTopic } from '@/data/curriculum';
import { asTopicId } from '@/types/curriculum';
import { registerAllGenerators } from '@/generators';
import { persistPractice } from '@/features/practice/persist';
import { Card, Button } from '@/components/ui';
import { paths } from '@/router';
import { NotFoundRoute } from './NotFoundRoute';

registerAllGenerators();

const SET_SIZE = 6;

export function PracticeRoute() {
  const { topicId = '' } = useParams();
  const navigate = useNavigate();
  const topic = getTopic(asTopicId(topicId));

  const sessionId = useRef(`practice-${Date.now().toString(36)}`);

  // One seed per visit, so coming back gives her a fresh set rather than the
  // same six questions she already answered.
  const exercises = useMemo(
    () => (topic ? buildPracticeSet(topic.id, Math.floor(Date.now() / 1000), SET_SIZE) : []),
    [topic],
  );

  if (!topic) return <NotFoundRoute />;

  if (exercises.length === 0) {
    return (
      <Card className="mt-8 text-center">
        <p className="text-lg">עוד לא הכנתי תרגילים לנושא הזה.</p>
        <p className="mt-2 text-ink-soft">הם בדרך. בינתיים אפשר לבחור נושא אחר.</p>
        <Button className="mt-4" onClick={() => navigate(paths.learn())}>
          למפת הנושאים
        </Button>
      </Card>
    );
  }

  return (
    <PracticeRunner
      exercises={exercises}
      title={topic.titleHe}
      onExit={() => navigate(paths.topic(topic.id))}
      onFinish={(records) => void persistPractice(sessionId.current, records)}
    />
  );
}
