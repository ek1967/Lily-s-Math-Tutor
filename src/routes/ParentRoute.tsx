import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { PinGate } from '@/features/parent/PinGate';
import { DataTools } from '@/features/parent/DataTools';
import {
  masteredTopics,
  minutesFrom,
  strugglingTopics,
  useParentData,
} from '@/features/parent/useParentData';
import { getTopic } from '@/data/curriculum';
import { formatAgorot } from '@/lib/ai/budget';
import { dayKey, relativeDayHe, streakLength } from '@/lib/time';
import { useSettings } from '@/stores/settingsStore';
import { modelById } from '@/lib/ai/models';
import type { AnswerMode } from '@/types/settings';
import { paths } from '@/router';

const TABS = ['overview', 'topics', 'log', 'data'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'סקירה',
  topics: 'נושאים',
  log: 'יומן',
  data: 'נתונים',
};

const ANSWER_MODES: { value: AnswerMode; label: string; description: string }[] = [
  {
    value: 'guide',
    label: 'הכוונה בלבד',
    description: 'המורה לא נותנת תשובות סופיות, גם אם מבקשים ממנה. מומלץ.',
  },
  {
    value: 'check',
    label: 'בדיקת תשובות',
    description: 'לילי כותבת תשובה, והמורה אומרת אם היא נכונה ואיפה הטעות.',
  },
  {
    value: 'reveal',
    label: 'פתרון מלא',
    description: 'המורה מראה פתרון שלב אחר שלב. שימושי לפני מבחן, פחות ללמידה.',
  },
];

export function ParentRoute() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const navigate = useNavigate();
  const { settings, set } = useSettings();
  const data = useParentData();

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  const struggling = strugglingTopics(data.mastery);
  const mastered = masteredTopics(data.mastery);
  const minutes = minutesFrom(data.weekAttempts);
  const correct = data.weekAttempts.filter((a) => a.correct === 1).length;
  const days = [...new Set(data.weekAttempts.map((a) => dayKey(a.at)))];

  return (
    <div className="space-y-4">
      <PageHeader title="מסך הורים" subtitle={`מה ${settings.studentName} עשתה השבוע`} />

      <div role="tablist" className="flex gap-1 rounded-lg bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={[
              'tap flex-1 rounded-md py-2 text-sm transition',
              tab === t ? 'bg-surface font-medium shadow-soft' : 'text-ink-soft',
            ].join(' ')}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={String(minutes)} label="דקות השבוע" />
            <Stat value={String(days.length)} label="ימים פעילים" />
            <Stat
              value={`${data.weekAttempts.length ? Math.round((correct / data.weekAttempts.length) * 100) : 0}%`}
              label="תשובות נכונות"
            />
          </div>

          <Card>
            <h2 className="mb-2 text-lg">איפה היא מתקשה</h2>
            {struggling.length === 0 ? (
              <p className="text-ink-soft">
                אין כרגע נושא שבולט לרעה. אם היא רק התחילה, זה פשוט אומר שאין עוד מספיק נתונים.
              </p>
            ) : (
              <ul className="space-y-2">
                {struggling.slice(0, 5).map((m) => {
                  const topic = getTopic(m.topicId);
                  if (!topic) return null;
                  const rate = Math.round((m.totalCorrect / m.totalAttempts) * 100);
                  return (
                    <li key={m.topicId} className="flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{topic.titleHe}</span>
                        <span className="block text-sm text-ink-soft">
                          {rate}% נכון מתוך {m.totalAttempts} תרגילים
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => navigate(paths.practice(m.topicId))}
                      >
                        לתרגול
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 text-lg">מה המורה מותר לגלות</h2>
            <p className="mb-3 text-sm text-ink-soft">
              ההגדרה הזו קובעת כמה עזרה המורה נותנת בשיעורי בית. היא נעולה מאחורי
              הקוד הזה בכוונה.
            </p>
            <div className="space-y-2">
              {ANSWER_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={settings.answerMode === mode.value}
                  onClick={() => set({ answerMode: mode.value })}
                  className={[
                    'tap w-full rounded-md px-3 py-3 text-start transition',
                    settings.answerMode === mode.value
                      ? 'bg-primary-tint text-primary-strong'
                      : 'bg-surface-2 hover:bg-primary-tint/60',
                  ].join(' ')}
                >
                  <span className="block font-medium">{mode.label}</span>
                  <span className="block text-sm text-ink-soft">{mode.description}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-2 text-lg">עלות</h2>
            <p className="text-2xl">{formatAgorot(data.spend.agorot)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              החודש, ב-{data.spend.requests} פניות למורה. מודל: {modelById(settings.model).labelHe}.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              תרגול, שיעורים וחזרות לא עולים דבר — רק הצ׳אט ושיעורי הבית.
            </p>
          </Card>
        </>
      )}

      {tab === 'topics' && (
        <>
          <Card>
            <h2 className="mb-2 text-lg">נושאים שהיא שולטת בהם</h2>
            {mastered.length === 0 ? (
              <p className="text-ink-soft">עוד אין. זה לוקח כמה סבבים של חזרה.</p>
            ) : (
              <ul className="space-y-1">
                {mastered.map((m) => (
                  <li key={m.topicId} className="flex items-center gap-2">
                    <Icon name="check" className="h-5 w-5 shrink-0 text-yes" />
                    <span>{getTopic(m.topicId)?.titleHe}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="mb-2 text-lg">כל הנושאים שנגעה בהם</h2>
            <ul className="space-y-2">
              {data.mastery
                .filter((m) => m.introduced)
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((m) => {
                  const topic = getTopic(m.topicId);
                  if (!topic) return null;
                  return (
                    <li key={m.topicId}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate">{topic.titleHe}</span>
                        <span className="shrink-0 text-sm text-ink-soft">
                          חזרה {relativeDayHe(m.dueDate)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(m.level / 5) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </Card>
        </>
      )}

      {tab === 'log' && (
        <Card>
          <h2 className="mb-2 text-lg">יומן הסשנים</h2>
          {data.sessions.length === 0 ? (
            <p className="text-ink-soft">עוד לא היו סשנים.</p>
          ) : (
            <ul className="space-y-3">
              {data.sessions.map((s) => (
                <li key={s.id} className="border-b border-line pb-2 last:border-0">
                  <div className="flex items-baseline justify-between">
                    <span>{relativeDayHe(dayKey(s.startedAt))}</span>
                    <span className="text-sm text-ink-soft">
                      {s.outcome === 'completed'
                        ? `${s.stats.correct} מתוך ${s.stats.attempted}`
                        : s.outcome === 'active'
                          ? 'לא הסתיים'
                          : 'ננטש'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">
                    {s.topicIds.map((id) => getTopic(id)?.titleHe).filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'data' && (
        <>
          <DataTools storage={data.storage} onRestored={data.reload} />
          <Card>
            <h2 className="mb-2 text-lg">פרטיות</h2>
            <p className="text-sm text-ink-soft">
              כל מה שלילי עושה נשמר במכשיר הזה בלבד. אין שרת ואין חשבון.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              היוצא מן הכלל: כשהיא מצלמת דף עבודה או מדברת עם המורה, הטקסט והתמונות
              נשלחים ל-Anthropic כדי לקבל תשובה. אין דרך אחרת להפעיל את זה.
            </p>
          </Card>
        </>
      )}

      <p className="pb-4 text-center text-sm text-ink-soft">
        רצף נוכחי: {streakLength(days)} ימים
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-ink-soft">{label}</div>
    </div>
  );
}
