import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Button, Card, Icon } from '@/components/ui';
import { AnswerInput } from '@/components/math/AnswerInput';
import { NumberKeypad } from '@/components/math/NumberKeypad';
import { HintLadder } from '@/components/feedback/HintLadder';
import { StepReveal } from '@/components/feedback/StepReveal';
import { BreatherCard } from '@/components/feedback/BreatherCard';
import { MathBlock } from '@/lib/math/Katex';
import { ALMOST, PRAISE, RECOVERED, STUCK, pickPhrase } from '@/data/encouragement';
import {
  canHint, canReveal, currentExercise, initPractice, isStuck, partiallyAnswered,
  practiceReducer, practiceStats, type AttemptRecord, type PracticeState,
} from '@/lib/practice/engine';
import type { Exercise } from '@/types/exercise';

interface Props {
  exercises: Exercise[];
  title: string;
  onExit: () => void;
  onFinish?: (records: AttemptRecord[]) => void;
  /** Exercise indices after which to offer a short break. */
  breatherAt?: readonly number[];
  /** Rendered on the summary screen — what today was about. */
  summaryNote?: string;
  /** Resume point for a session she walked away from. */
  startIndex?: number;
  /** Called whenever she moves on, so progress can be written to storage. */
  onProgress?: (index: number) => void;
  /** Offered after three wrong answers, with the exercise as context. */
  onAskTutor?: (exercise: Exercise) => void;
}

/** How long a correct answer stays on screen before moving on. Long enough to
 *  register, short enough not to break the rhythm. */
const AUTO_ADVANCE_MS = 950;

export function PracticeRunner({
  exercises,
  title,
  onExit,
  onFinish,
  breatherAt = [],
  summaryNote,
  startIndex = 0,
  onProgress,
  onAskTutor,
}: Props) {
  const [state, dispatch] = useReducer(
    practiceReducer,
    undefined,
    () => initPractice(exercises, Date.now(), breatherAt, startIndex),
  );
  const finished = useRef(false);

  const ex = currentExercise(state);

  // Advance automatically after a correct answer; the "המשך" button is still
  // there for anyone who would rather move on immediately.
  useEffect(() => {
    if (state.phase !== 'correct') return;
    const t = setTimeout(() => dispatch({ type: 'next', now: Date.now() }), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.index]);

  // Written after every step, so closing the tab mid-question costs nothing.
  useEffect(() => {
    onProgress?.(state.index);
  }, [state.index, onProgress]);

  useEffect(() => {
    if (state.phase === 'done' && !finished.current) {
      finished.current = true;
      onFinish?.(state.records);
    }
  }, [state.phase, state.records, onFinish]);

  if (state.phase === 'done') {
    return <Summary state={state} onExit={onExit} note={summaryNote} />;
  }
  if (state.phase === 'breather') {
    return <BreatherCard onContinue={() => dispatch({ type: 'next', now: Date.now() })} />;
  }
  if (!ex) return null;

  const answered = state.phase === 'correct' || state.phase === 'revealed';

  return (
    <div className="flex min-h-[85dvh] flex-col gap-4">
      <TopBar title={title} index={state.index} total={state.exercises.length} onExit={onExit} />

      <Card>
        <p className="text-lg font-medium">{ex.promptHe}</p>
        {ex.promptTex && <MathBlock tex={ex.promptTex} className="text-2xl" />}
      </Card>

      <AnswerInput
        input={ex.input}
        answer={ex.answer}
        value={state.value}
        onChange={(v) => dispatch({ type: 'setValue', value: Array.isArray(v) ? v : [v] })}
        activePart={state.activePart}
        onActivePart={(i) => dispatch({ type: 'setActivePart', index: i })}
        disabled={answered}
        onSubmit={() => dispatch({ type: 'submit', now: Date.now() })}
      />

      <FeedbackBar state={state} />

      {!answered && (
        <HintLadder
          hints={ex.hints}
          shown={state.hintsShown}
          canAsk={canHint(state)}
          onAsk={() => dispatch({ type: 'hint' })}
        />
      )}

      {state.phase === 'revealed' && <StepReveal steps={ex.solution} />}

      <div className="mt-auto space-y-3 pt-2">
        {!answered && ex.input.kind !== 'choice' && (
          <NumberKeypad
            kind={ex.input.keypad}
            allowNegative={ex.input.allowNegative}
            onKey={(key) => dispatch({ type: 'key', key })}
            onBackspace={() => dispatch({ type: 'backspace' })}
            onSubmit={() => dispatch({ type: 'submit', now: Date.now() })}
            submitLabel={state.phase === 'almost' ? 'לנסות שוב' : 'בדיקה'}
            submitDisabled={false}
          />
        )}

        {isStuck(state) && !answered && onAskTutor && (
          // Three wrong in a row is the moment to change something, not to ask
          // a fourth time. The exercise goes with her into the conversation.
          <Button variant="ghost" block onClick={() => onAskTutor(ex)}>
            לשאול את המורה
          </Button>
        )}

        {canReveal(state) && !answered && (
          <Button variant="quiet" block onClick={() => dispatch({ type: 'reveal' })}>
            להראות לי איך פותרים
          </Button>
        )}

        {answered && (
          <Button block onClick={() => dispatch({ type: 'next', now: Date.now() })}>
            {state.index + 1 >= state.exercises.length ? 'לסיום' : 'המשך'}
          </Button>
        )}
      </div>
    </div>
  );
}

function TopBar({
  title,
  index,
  total,
  onExit,
}: {
  title: string;
  index: number;
  total: number;
  onExit: () => void;
}) {
  return (
    // Sticky: the exit route and the progress dots stay reachable however far
    // the question and keypad push the page down.
    <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-bg/95 px-4 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onExit}
        className="tap -ms-2 flex items-center gap-1 px-2 text-sm text-ink-soft hover:text-ink"
      >
        <Icon name="arrow-back" className="h-5 w-5 rotate-180" />
        יציאה
      </button>
      <span className="min-w-0 flex-1 truncate text-center text-sm text-ink-soft">{title}</span>
      {/* Dots, not a timer and not a percentage — a shrinking set of dots reads
          as progress without implying she is being timed. */}
      <div className="flex gap-1" aria-label={`שאלה ${index + 1} מתוך ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              'h-2 w-2 rounded-full transition',
              i < index ? 'bg-primary' : i === index ? 'bg-primary/60' : 'bg-line',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

function FeedbackBar({ state }: { state: PracticeState }) {
  if (state.unreadable) {
    return (
      <p className="animate-pop-in text-center text-ink-soft">
        {partiallyAnswered(state)
          ? 'צריך למלא גם את המשבצת השנייה'
          : 'רק צריך לכתוב תשובה קודם'}
      </p>
    );
  }

  if (state.phase === 'correct') {
    const recovered = state.wrongTries > 0;
    return (
      <p className="animate-pop-in text-center text-lg font-medium text-yes">
        {recovered
          ? pickPhrase(RECOVERED, state.index)
          : `${pickPhrase(PRAISE, state.index)} ✨`}
      </p>
    );
  }

  if (state.phase === 'almost') {
    if (state.needsReducing) {
      return (
        <p className="animate-pop-in text-center text-almost">
          החישוב נכון — רק אפשר לצמצם את השבר עוד
        </p>
      );
    }
    return (
      <div className="animate-pop-in space-y-1 text-center">
        <p className="text-lg text-almost">{pickPhrase(ALMOST, state.wrongTries)}</p>
        {isStuck(state) && (
          <p className="text-sm text-ink-soft">{pickPhrase(STUCK, state.index)}</p>
        )}
      </div>
    );
  }

  return null;
}

function Summary({
  state,
  onExit,
  note,
}: {
  state: PracticeState;
  onExit: () => void;
  note?: string;
}) {
  const stats = useMemo(() => practiceStats(state), [state]);
  const perfect = stats.correct === stats.attempted && stats.attempted > 0;

  return (
    <div className="space-y-5 py-8 text-center">
      <h2 className="text-2xl">
        {perfect ? 'הכול נכון' : 'סיימנו'}
      </h2>
      <p className="text-lg">
        פתרת נכון {stats.correct} מתוך {stats.attempted}
      </p>
      {note && <p className="text-ink-soft">{note}</p>}
      {stats.hintsUsed > 0 && (
        <p className="text-ink-soft">
          ולקחת {stats.hintsUsed} רמזים — זה בדיוק מה שהם שם בשבילו
        </p>
      )}
      <Button size="hero" block onClick={onExit}>
        סיימתי
      </Button>
    </div>
  );
}
