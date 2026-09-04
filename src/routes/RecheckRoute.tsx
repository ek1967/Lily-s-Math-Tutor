import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { PracticeRunner } from '@/features/practice/PracticeRunner';
import { applyDiagnostic, buildDiagnostic, recheckDiagnostic } from '@/lib/srs/diagnostic';
import { getMasteryMap, putMastery } from '@/lib/db/repos/masteryRepo';
import { saveAttempts } from '@/lib/db/repos/attemptRepo';
import { registerAllGenerators } from '@/generators';
import { getTopic } from '@/data/curriculum';
import { useSettings } from '@/stores/settingsStore';
import type { AttemptRecord } from '@/lib/practice/engine';
import { paths } from '@/router';

registerAllGenerators();

type Step = 'intro' | 'check' | 'result';

/**
 * The placement check, run again.
 *
 * Useful at the start of a term, after a long break, or when a parent suspects
 * something has quietly slipped. It is deliberately not destructive: a topic
 * she answers correctly is left exactly as practice left it, and one she misses
 * comes back into the queue without losing its history. See `recheckDiagnostic`.
 *
 * She is the one answering, so the screen is written to her, not to a parent.
 */
export function RecheckRoute() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [step, setStep] = useState<Step>('intro');
  const [slipped, setSlipped] = useState<string[]>([]);
  const sessionId = useRef(`recheck-${Date.now().toString(36)}`);

  const exercises = useMemo(
    () => buildDiagnostic(Math.floor(Date.now() / 1000), settings.showExtensionTopics),
    [settings.showExtensionTopics],
  );

  const finish = useCallback((records: readonly AttemptRecord[]) => {
    const outcome = applyDiagnostic(records);

    void (async () => {
      try {
        await saveAttempts(sessionId.current, records);
        const existing = await getMasteryMap();
        const { toWrite } = recheckDiagnostic(outcome, existing);
        await Promise.all(toWrite.map((r) => putMastery(r)));
      } catch {
        /* Storage unavailable — the summary still shows on screen. */
      }
    })();

    setSlipped(outcome.gaps.map((id) => getTopic(id)?.titleHe ?? '').filter(Boolean));
    setStep('result');
  }, []);

  if (step === 'check') {
    return (
      <PracticeRunner
        exercises={exercises}
        title="בדיקה קצרה"
        onExit={() => setStep('intro')}
        onFinish={finish}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="בדיקה קצרה" />

      {step === 'intro' ? (
        <Card className="space-y-3">
          <p className="text-lg">כמה שאלות קצרות, אחת מכל נושא.</p>
          <p className="text-ink-soft">
            זה לא מבחן ואף אחד לא רואה את זה. זו דרך שלי לראות מה כדאי לרענן, כדי שלא
            נבזבז זמן על מה שכבר הולך לך טוב. אם משהו לא ייצא — זה בדיוק מה שחיפשנו.
          </p>
          <p className="text-ink-soft">
            כל מה שכבר עשית נשמר. הבדיקה הזאת רק מזיזה דברים בתור, היא לא מוחקת כלום.
          </p>
          <Button block onClick={() => setStep('check')}>
            אפשר להתחיל
          </Button>
          <Button variant="ghost" block onClick={() => navigate(paths.home())}>
            לא עכשיו
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3">
          <p className="text-lg">סיימת. תודה שעברת על זה.</p>
          {slipped.length === 0 ? (
            <p className="text-ink-soft">
              הכול נשאר במקום. ממשיכות מאיפה שהיינו.
            </p>
          ) : (
            <>
              <p className="text-ink-soft">
                {slipped.length === 1
                  ? 'יש נושא אחד ששווה לרענן, ושמתי אותו בתור לימים הקרובים:'
                  : `יש ${slipped.length} נושאים ששווה לרענן, ושמתי אותם בתור לימים הקרובים:`}
              </p>
              <ul className="space-y-1">
                {slipped.map((title) => (
                  <li key={title} className="rounded-md bg-surface-2 px-3 py-2">
                    {title}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button block onClick={() => navigate(paths.home())}>
            למסך הבית
          </Button>
        </Card>
      )}
    </div>
  );
}
