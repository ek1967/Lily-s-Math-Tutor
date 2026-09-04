import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChatView } from '@/features/chat/ChatView';
import { useTutorContext } from '@/features/chat/useTutorContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';
import { createThread, getThread } from '@/lib/db/repos/chatRepo';
import { getMasteryMap } from '@/lib/db/repos/masteryRepo';
import { hasApiKey } from '@/lib/security/apiKey';
import { useSettings } from '@/stores/settingsStore';
import { getTopic } from '@/data/curriculum';
import { exerciseFromId } from '@/generators/make';
import { registerAllGenerators } from '@/generators';
import { MathBlock } from '@/lib/math/Katex';
import { asTopicId, type TopicId } from '@/types/curriculum';
import type { MasteryRecord } from '@/types/mastery';
import { paths } from '@/router';

registerAllGenerators();

const SUGGESTIONS = [
  'לא הבנתי את הנושא הזה בכלל',
  'אפשר דוגמה נוספת?',
  'תסבירי לי את זה אחרת',
] as const;

export function ChatRoute() {
  const { threadId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [ready, setReady] = useState(false);
  const [mastery, setMastery] = useState<ReadonlyMap<TopicId, MasteryRecord>>(new Map());

  const exerciseParam = params.get('exercise');
  const exercise = exerciseParam ? exerciseFromId(exerciseParam) : null;
  const topicParam = params.get('topic') ?? exercise?.topicId ?? null;
  const topicId = topicParam ? asTopicId(topicParam) : undefined;
  const topic = topicId ? getTopic(topicId) : undefined;
  const ctx = useTutorContext(topicId, mastery);

  useEffect(() => {
    void (async () => {
      const [existing, masteryMap] = await Promise.all([
        getThread(threadId).catch(() => undefined),
        getMasteryMap().catch(() => new Map<TopicId, MasteryRecord>()),
      ]);
      setMastery(masteryMap);
      if (!existing) {
        await createThread({
          id: threadId,
          kind: topicId ? 'topic' : 'free',
          titleHe: topic ? topic.titleHe : 'שאלה מהירה',
          ...(topicId ? { topicId } : {}),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
      setReady(true);
    })();
  }, [threadId, topicId, topic]);

  if (!hasApiKey()) {
    return (
      <div>
        <PageHeader title="שאלה מהירה" />
        <Card className="text-center">
          <p className="text-lg">המורה עוד לא מחוברת.</p>
          <p className="mt-2 text-ink-soft">
            צריך להוסיף מפתח בהגדרות פעם אחת, ואז אפשר לשאול אותה כל דבר.
            התרגול עובד גם בלי זה.
          </p>
          <Button className="mt-4" onClick={() => navigate(paths.settings())}>
            להגדרות
          </Button>
        </Card>
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div>
      <PageHeader
        title={topic ? topic.titleHe : `שאלה ל${settings.tutorName}`}
        {...(topic ? { subtitle: 'אפשר לשאול כל דבר על הנושא הזה' } : {})}
      />
      {exercise && (
        <Card className="mb-3">
          <p className="text-sm text-ink-soft">התרגיל שנתקעת בו</p>
          <p className="mt-1">{exercise.promptHe}</p>
          {exercise.promptTex && <MathBlock tex={exercise.promptTex} />}
        </Card>
      )}

      <ChatView
        threadId={threadId}
        ctx={ctx}
        modelId={settings.model}
        suggestionsHe={
          exercise
            ? [
                'לא הצלחתי לפתור את זה — אפשר עזרה?',
                'מאיפה מתחילים בתרגיל כזה?',
                'אפשר דוגמה דומה יותר קלה?',
              ]
            : SUGGESTIONS
        }
        {...(exercise
          ? {
              // The tutor gets the question she is stuck on, so she does not
              // have to describe it — describing it is often the hard part.
              openingContextHe: `${exercise.promptHe}${exercise.promptTex ? ` (${exercise.promptTex})` : ''}`,
            }
          : {})}
      />
    </div>
  );
}
