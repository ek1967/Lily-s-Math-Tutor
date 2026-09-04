import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { PracticeRunner } from '@/features/practice/PracticeRunner';
import { buildDiagnostic, applyDiagnostic } from '@/lib/srs/diagnostic';
import { putMastery } from '@/lib/db/repos/masteryRepo';
import { saveAttempts } from '@/lib/db/repos/attemptRepo';
import { registerAllGenerators } from '@/generators';
import { getTopic } from '@/data/curriculum';
import { useSettings } from '@/stores/settingsStore';
import { THEME_COLORS } from '@/types/settings';
import type { AttemptRecord } from '@/lib/practice/engine';
import { paths } from '@/router';

registerAllGenerators();

const COLOR_LABELS: Record<(typeof THEME_COLORS)[number], string> = {
  plum: 'סגול',
  teal: 'טורקיז',
  rose: 'ורוד',
  amber: 'כתום',
  forest: 'ירוק',
  indigo: 'כחול',
};

type Step = 'hello' | 'colour' | 'tutor' | 'consent' | 'check' | 'result';

/**
 * First run. Three small choices that make the app hers, one piece of honesty
 * for whoever is paying and consenting, and a short placement check so the
 * first week is spent on her real gaps rather than on the start of the syllabus.
 */
export function OnboardingRoute() {
  const navigate = useNavigate();
  const { settings, set } = useSettings();
  const [step, setStep] = useState<Step>('hello');
  const [name, setName] = useState(settings.studentName);
  const [tutorName, setTutorName] = useState(settings.tutorName);
  const [outcome, setOutcome] = useState<{ known: number; gaps: string[] } | null>(null);
  const sessionId = useRef(`diagnostic-${Date.now().toString(36)}`);

  const exercises = useMemo(() => buildDiagnostic(Math.floor(Date.now() / 1000)), []);

  const finishCheck = useCallback(
    (records: readonly AttemptRecord[]) => {
      const result = applyDiagnostic(records);
      void saveAttempts(sessionId.current, records).catch(() => {});
      void Promise.all(result.records.map((r) => putMastery(r))).catch(() => {});
      setOutcome({
        known: result.known.length,
        gaps: result.gaps.map((id) => getTopic(id)?.titleHe ?? '').filter(Boolean),
      });
      setStep('result');
    },
    [],
  );

  const done = () => {
    set({ studentName: name.trim() || 'לילי', tutorName: tutorName.trim() || 'מיה', hasOnboarded: true });
    navigate(paths.home());
  };

  if (step === 'check') {
    return (
      <PracticeRunner
        exercises={exercises}
        title="בדיקה קצרה"
        onExit={() => setStep('consent')}
        onFinish={finishCheck}
      />
    );
  }

  return (
    <div className="space-y-5 py-6">
      {step === 'hello' && (
        <>
          <h1 className="text-3xl">היי</h1>
          <p className="text-lg">
            אני אלמד איתך מתמטיקה. קודם כמה דברים קטנים, ואז נתחיל.
          </p>
          <Card>
            <label className="block">
              <span className="mb-1 block text-sm text-ink-soft">איך קוראים לך?</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="tap w-full rounded-md border border-line bg-surface px-3 py-3 text-lg"
              />
            </label>
          </Card>
          <Button size="hero" block onClick={() => setStep('colour')}>
            נעים מאוד
          </Button>
        </>
      )}

      {step === 'colour' && (
        <>
          <h1 className="text-2xl">איזה צבע את אוהבת?</h1>
          <p className="text-ink-soft">אפשר להחליף מתי שבא לך.</p>
          <div className="grid grid-cols-3 gap-3">
            {THEME_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ themeColor: c })}
                aria-pressed={settings.themeColor === c}
                data-accent={c}
                className={[
                  'tap flex flex-col items-center gap-2 rounded-lg p-4 transition',
                  settings.themeColor === c ? 'bg-surface-2' : '',
                ].join(' ')}
              >
                <span className="h-12 w-12 rounded-full bg-primary" />
                <span className="text-sm">{COLOR_LABELS[c]}</span>
              </button>
            ))}
          </div>
          <Button size="hero" block onClick={() => setStep('tutor')}>
            הבא
          </Button>
        </>
      )}

      {step === 'tutor' && (
        <>
          <h1 className="text-2xl">איך לקרוא לי?</h1>
          <p className="text-ink-soft">
            אני המורה שלך. תבחרי לי שם — זה יותר נעים מ״המורה״.
          </p>
          <Card>
            <input
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              className="tap w-full rounded-md border border-line bg-surface px-3 py-3 text-lg"
            />
          </Card>
          <Button size="hero" block onClick={() => setStep('consent')}>
            יאללה
          </Button>
        </>
      )}

      {step === 'consent' && (
        <>
          <h1 className="text-2xl">רגע אחד להורים</h1>
          <Card>
            <p>
              הלומדה שומרת את הכול במכשיר הזה בלבד. אין שרת, אין חשבון, ואף אחד
              אחר לא רואה את ההתקדמות.
            </p>
            <p className="mt-3">
              יוצא מן הכלל אחד: כשמעלים צילום של דף עבודה או מדברים עם המורה,
              הטקסט והתמונות נשלחים ל-Anthropic כדי לקבל תשובה. זה כולל צילומים של
              שיעורי בית של קטינה, ולכן חשוב לנו לומר את זה במפורש.
            </p>
            <p className="mt-3 text-ink-soft">
              התרגול, השיעורים והחזרות עובדים לגמרי בלי זה, וגם בלי אינטרנט.
            </p>
          </Card>
          <Button
            size="hero"
            block
            onClick={() => {
              set({ aiConsentAt: Date.now() });
              setStep('check');
            }}
          >
            הבנתי, אפשר להמשיך
          </Button>
          <Button variant="quiet" block onClick={() => setStep('check')}>
            להחליט על זה אחר כך
          </Button>
        </>
      )}

      {step === 'result' && outcome && (
        <>
          <h1 className="text-2xl">זהו, סיימנו</h1>
          {outcome.known > 0 && (
            <p className="text-lg">
              {outcome.known} נושאים כבר בסדר גמור אצלך. לא נבזבז עליהם זמן.
            </p>
          )}
          {outcome.gaps.length > 0 ? (
            <Card>
              <p>מצאתי כמה דברים ששווה לחזק:</p>
              <ul className="mt-2 space-y-1">
                {outcome.gaps.slice(0, 5).map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
              <p className="mt-3 text-ink-soft">
                נתחיל מהם. זה בדיוק מה שיהפוך את מה שלומדים עכשיו בכיתה להרבה יותר קל.
              </p>
            </Card>
          ) : (
            <p className="text-ink-soft">בסיס טוב. נתחיל מהנושא הבא בתוכנית.</p>
          )}
          <Button size="hero" block onClick={done}>
            בואי נתחיל
          </Button>
        </>
      )}

      {step !== 'result' && step !== 'consent' && (
        <Button variant="quiet" block onClick={done}>
          לדלג
        </Button>
      )}
    </div>
  );
}
