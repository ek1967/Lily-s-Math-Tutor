import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Icon, ProgressRing } from '@/components/ui';
import { useSettings } from '@/stores/settingsStore';
import { useToday } from '@/features/daily/useToday';
import { buildDailyBlueprint, newDailySession } from '@/features/daily/buildDaily';
import { saveSession } from '@/lib/db/repos/sessionRepo';
import { getTopic } from '@/data/curriculum';
import { registerAllGenerators } from '@/generators';
import { InstallNudge } from '@/components/layout/InstallNudge';
import { BackupBanner } from '@/components/layout/BackupBanner';
import { newFreeThreadId } from '@/features/chat/threadId';
import { paths } from '@/router';

registerAllGenerators();

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'היי';
}

/**
 * One dominant action. The home screen never asks her to choose a topic —
 * choosing is the failure point for a student with attention difficulties and
 * maths anxiety, so the planner decides and she presses one button.
 */
export function HomeRoute() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const today = useToday();

  // First run goes through onboarding, which ends by seeding her mastery from
  // a short placement check.
  useEffect(() => {
    if (!settings.hasOnboarded) navigate(paths.onboarding(), { replace: true });
  }, [settings.hasOnboarded, navigate]);

  // Once per visit, not once per render: the id is part of a link she is
  // reaching for, and it used to change underneath her.
  const [freeThreadId] = useState(newFreeThreadId);

  const focusTopic = today.plan.focus ? getTopic(today.plan.focus) : undefined;
  const blockingTopic = today.plan.blocking ? getTopic(today.plan.blocking) : undefined;

  const start = useCallback(async () => {
    if (today.resumable) {
      navigate(paths.study(today.resumable.id));
      return;
    }
    const seedBase = Math.floor(Date.now() / 1000);
    const blueprint = buildDailyBlueprint(
      today.plan,
      today.mastery,
      seedBase,
      settings.dailyGoalMinutes,
    );
    if (blueprint.steps.length === 0) return;
    const session = newDailySession(blueprint, seedBase, Date.now());
    await saveSession(session).catch(() => {});
    navigate(paths.study(session.id));
  }, [today, settings.dailyGoalMinutes, navigate]);

  const nothingToDo = !today.loading && today.plan.focus === null;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">
          {greeting()}, {settings.studentName}
        </h1>
        {today.streak > 0 && (
          <span className="inline-flex items-center gap-1 text-streak" title="ימים ברצף">
            <Icon name="flame" className="h-5 w-5" filled />
            <span className="font-semibold">{today.streak}</span>
          </span>
        )}
      </div>

      <Card padded={false} className="overflow-hidden">
        <Button
          size="hero"
          block
          className="rounded-none py-7"
          onClick={() => void start()}
          disabled={today.loading || nothingToDo}
        >
          <span className="flex flex-col items-center gap-1">
            <span>{today.resumable ? 'להמשיך מאיפה שהפסקת' : 'בואי נתחיל'}</span>
            <span className="text-base font-normal opacity-85">
              {settings.dailyGoalMinutes} דקות
            </span>
          </span>
        </Button>
        <p className="px-5 py-3 text-center text-sm text-ink-soft">
          {today.loading
            ? 'רגע, בונה לך מסלול…'
            : today.resumable
              ? 'שמרתי לך את המקום המדויק'
              : nothingToDo
                ? 'סיימת את כל מה שהיה להיום'
                : focusTopic
                  ? subtitle(today.plan.review.length, focusTopic.titleHe)
                  : 'חזרה קצרה על מה שלמדנו'}
        </p>
      </Card>

      {/* Naming the gap and what it unlocks, rather than silently going back. */}
      {today.plan.reason === 'gap' && focusTopic && blockingTopic && (
        <Card className="border-primary/40 bg-primary-tint/40">
          <p>
            נחזור רגע ל<strong>{focusTopic.titleHe}</strong> — זה מה שיהפוך את{' '}
            <strong>{blockingTopic.titleHe}</strong> להרבה יותר קל.
          </p>
        </Card>
      )}

      {/* Shown once she has actually used it — that is when it is worth asking. */}
      <InstallNudge show={today.streak >= 2 || today.answeredToday >= 5} />

      {/* Only once there is something worth losing. */}
      {today.mastery.size > 0 && <BackupBanner minDays={14} />}

      <div className="flex justify-center">
        <ProgressRing
          value={today.targetToday > 0 ? today.answeredToday / today.targetToday : 0}
          label={String(today.answeredToday)}
          sublabel={today.answeredToday === 1 ? 'שאלה היום' : 'שאלות היום'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SecondaryCard to={paths.homework()} icon="camera" label="שיעורי בית" />
        <SecondaryCard
          to={paths.review()}
          icon="check"
          label="חזרה"
          badge={today.plan.review.length}
        />
        <SecondaryCard to={paths.learn()} icon="book" label="נושא לבחירתי" />
      </div>

      <div className="grid grid-cols-1">
        <SecondaryCard
          to={paths.chat(freeThreadId)}
          icon="spark"
          label={`שאלה מהירה ל${settings.tutorName}`}
        />
        <Link
          to={paths.chats()}
          className="tap mt-2 self-center rounded-md px-3 py-2 text-center text-sm text-ink-soft hover:text-ink"
        >
          שיחות קודמות
        </Link>
      </div>
    </div>
  );
}

function subtitle(reviewCount: number, focusTitle: string): string {
  if (reviewCount === 0) return `נושא היום: ${focusTitle}`;
  return `חזרה קצרה, ואז ${focusTitle}`;
}

function SecondaryCard({
  to,
  icon,
  label,
  badge = 0,
}: {
  to: string;
  icon: 'camera' | 'book' | 'spark' | 'check';
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className="card tap relative flex flex-col items-center justify-center gap-2 p-4 text-center text-sm transition hover:bg-surface-2"
    >
      {badge > 0 && (
        <span className="absolute end-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs text-[rgb(var(--c-primary-ink))]">
          {badge}
        </span>
      )}
      <Icon name={icon} className="h-7 w-7 text-primary" />
      <span>{label}</span>
    </Link>
  );
}
