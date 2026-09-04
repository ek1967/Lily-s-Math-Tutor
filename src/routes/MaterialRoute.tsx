import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { MathInline } from '@/lib/math/Katex';
import { ChatView } from '@/features/chat/ChatView';
import { useTutorContext } from '@/features/chat/useTutorContext';
import { deleteMaterial, getMaterial, getPages, updateMaterial } from '@/lib/db/repos/materialRepo';
import { buildGuidedOpening } from '@/lib/ai/prompts/homework';
import { useSettings } from '@/stores/settingsStore';
import { getTopic } from '@/data/curriculum';
import type { UploadedMaterial } from '@/types/material';
import type { DetectedExercise } from '@/lib/ai/homework';
import { paths } from '@/router';
import { NotFoundRoute } from './NotFoundRoute';

/**
 * A worksheet, as a checklist.
 *
 * A page of fifteen exercises is overwhelming as a page and manageable as
 * fifteen things with a tick next to each — and the tick is the point: it
 * shows progress on a task whose end is otherwise invisible until it arrives.
 * Work can stop anywhere and pick up another day.
 */
export function MaterialRoute() {
  const { materialId = '' } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [material, setMaterial] = useState<UploadedMaterial | null | 'missing'>(null);
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showPages, setShowPages] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let urls: string[] = [];
    void (async () => {
      const found = await getMaterial(materialId).catch(() => undefined);
      if (!found) {
        setMaterial('missing');
        return;
      }
      setMaterial(found);
      const pages = await getPages(materialId).catch(() => []);
      urls = pages.map((p) => URL.createObjectURL(p.blob));
      setPageUrls(urls);
    })();
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [materialId]);

  const toggleDone = useCallback(
    (index: number) => {
      setMaterial((current) => {
        if (!current || current === 'missing') return current;
        const exercises = current.exercises.map((e, i) =>
          i === index ? { ...e, done: !e.done } : e,
        );
        const next: UploadedMaterial = {
          ...current,
          exercises,
          status: exercises.every((e) => e.done) ? 'done' : 'working',
        };
        void updateMaterial(current.id, {
          exercises,
          status: next.status,
        }).catch(() => {});
        return next;
      });
    },
    [],
  );

  const openExercise = openIndex !== null && material && material !== 'missing'
    ? material.exercises[openIndex]
    : undefined;

  const ctx = useTutorContext(openExercise?.topicId);

  const doneCount = useMemo(
    () =>
      material && material !== 'missing'
        ? material.exercises.filter((e) => e.done).length
        : 0,
    [material],
  );

  if (material === null) return null;
  if (material === 'missing') return <NotFoundRoute />;

  if (openIndex !== null && openExercise) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenIndex(null)}
          className="tap mb-3 flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
        >
          <Icon name="arrow-back" className="h-5 w-5 rotate-180" />
          חזרה לרשימה
        </button>

        <Card className="mb-3">
          <p className="text-sm text-ink-soft">תרגיל {openExercise.labelHe}</p>
          <p className="mt-1">{openExercise.promptHe}</p>
          {openExercise.promptTex && (
            <p className="mt-1 text-xl">
              <MathInline tex={openExercise.promptTex} />
            </p>
          )}
        </Card>

        <ChatView
          threadId={`${material.id}:${openIndex}`}
          ctx={ctx}
          modelId={settings.model}
          openingContextHe={`${openExercise.promptHe}${openExercise.promptTex ? ` ${openExercise.promptTex}` : ''}`}
          suggestionsHe={[
            buildGuidedOpening(
              openExercise.labelHe,
              openExercise.promptHe,
              openExercise.promptTex,
            ),
            'איזה נושא זה בכלל?',
            'אני חושבת שהתשובה היא… אפשר לבדוק?',
          ]}
        />

        <Button
          variant={openExercise.done ? 'ghost' : 'primary'}
          block
          className="mt-4"
          onClick={() => {
            toggleDone(openIndex);
            setOpenIndex(null);
          }}
        >
          {openExercise.done ? 'לסמן שעוד לא סיימתי' : 'סיימתי את התרגיל הזה'}
        </Button>
      </div>
    );
  }

  const allDone = doneCount === material.exercises.length && material.exercises.length > 0;
  const weakTopics = [
    ...new Set(material.detectedTopicIds.map((id) => getTopic(id)?.titleHe).filter(Boolean)),
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl">{material.titleHe}</h1>
        <p className="text-ink-soft">
          {doneCount} מתוך {material.exercises.length} תרגילים
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{
              width: `${material.exercises.length ? (doneCount / material.exercises.length) * 100 : 0}%`,
            }}
          />
        </div>
      </header>

      {allDone && (
        <Card className="bg-yes-tint text-center">
          <p className="text-lg font-medium text-yes">סיימת את כל הדף</p>
          {weakTopics.length > 0 && (
            <p className="mt-2 text-ink">
              רוצה לתרגל עוד קצת {weakTopics[0]}? זה מה שהיה בדף הזה.
            </p>
          )}
          {material.detectedTopicIds[0] && (
            <Button
              className="mt-3"
              onClick={() => navigate(paths.practice(material.detectedTopicIds[0]!))}
            >
              לתרגל את הנושא
            </Button>
          )}
        </Card>
      )}

      <ul className="space-y-2">
        {material.exercises.map((exercise, i) => (
          <ExerciseRow
            key={`${exercise.labelHe}-${i}`}
            exercise={exercise}
            onOpen={() => setOpenIndex(i)}
            onToggle={() => toggleDone(i)}
          />
        ))}
      </ul>

      {material.pagesPruned ? (
        <p className="text-center text-sm text-ink-soft">
          הצילום נמחק כדי לפנות מקום במכשיר. הרשימה, הסימונים והשיחה נשמרו.
        </p>
      ) : (
        <>
          <Button variant="quiet" block onClick={() => setShowPages((v) => !v)}>
            {showPages ? 'להסתיר את הדף' : 'להראות את הדף שצילמתי'}
          </Button>

          {showPages && (
            <div className="space-y-2">
              {pageUrls.map((url, i) => (
                <img
                  key={url}
                  src={url}
                  alt={`עמוד ${i + 1}`}
                  className="w-full rounded-lg border border-line"
                />
              ))}
            </div>
          )}
        </>
      )}

      {confirmDelete ? (
        <Card className="border-almost/50">
          <p>למחוק את הדף הזה לגמרי? הרשימה, הסימונים והשיחה יימחקו איתו.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                void deleteMaterial(material.id)
                  .catch(() => {})
                  .then(() => navigate(paths.homework()));
              }}
            >
              כן, למחוק
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              ביטול
            </Button>
          </div>
        </Card>
      ) : (
        <Button variant="quiet" block onClick={() => setConfirmDelete(true)}>
          למחוק את הדף
        </Button>
      )}
    </div>
  );
}

function ExerciseRow({
  exercise,
  onOpen,
  onToggle,
}: {
  exercise: DetectedExercise;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <li className="card flex items-center gap-3 p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-label={exercise.done ? 'לסמן שעוד לא סיימתי' : 'לסמן שסיימתי'}
        aria-pressed={exercise.done}
        className={[
          'tap grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition',
          exercise.done ? 'border-yes bg-yes text-white' : 'border-line',
        ].join(' ')}
      >
        {exercise.done && <Icon name="check" className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-start"
      >
        <span className="block text-sm text-ink-soft">תרגיל {exercise.labelHe}</span>
        <span className={['block', exercise.done ? 'text-ink-soft line-through' : ''].join(' ')}>
          {exercise.promptHe}
        </span>
        {exercise.promptTex && (
          <span className="mt-1 block">
            <MathInline tex={exercise.promptTex} />
          </span>
        )}
      </button>
    </li>
  );
}
