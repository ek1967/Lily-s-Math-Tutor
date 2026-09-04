import { useMemo } from 'react';
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

  // One seed per visit, so coming back gives her a fresh set rather than the
  // same six questions she already answered. The session id is rebuilt with it:
  // it used to be a ref minted once, so attempts on a second topic were filed
  // under the first topic's session.
  const { exercises, sessionId } = useMemo(() => {
    const seed = Math.floor(Date.now() / 1000);
    return {
      exercises: topic ? buildPracticeSet(topic.id, seed, SET_SIZE) : [],
      sessionId: `practice-${topicId}-${seed.toString(36)}`,
    };
  }, [topic, topicId]);

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
      onAskTutor={(exercise) =>
        navigate(
          `${paths.chat(`stuck-${Date.now().toString(36)}`)}?exercise=${encodeURIComponent(exercise.id)}`,
        )
      }
      onFinish={(records) => void persistPractice(sessionId, records)}
    />
  );
}
