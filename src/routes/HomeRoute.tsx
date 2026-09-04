import { Link } from 'react-router-dom';
import { Button, Card, Icon, ProgressRing } from '@/components/ui';
import { useSettings } from '@/stores/settingsStore';
import { paths } from '@/router';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  if (h < 21) return 'ערב טוב';
  return 'היי';
}

/**
 * One dominant action. The home screen never asks her to choose a topic —
 * choosing is the failure point for a kid with attention difficulties and maths
 * anxiety, so the planner decides and she presses one button.
 */
export function HomeRoute() {
  const { settings } = useSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl">
          {greeting()}, {settings.studentName}
        </h1>
        <span className="inline-flex items-center gap-1 text-streak" title="ימים ברצף">
          <Icon name="flame" className="h-5 w-5" filled />
          <span className="font-semibold">0</span>
        </span>
      </div>

      <Card padded={false} className="overflow-hidden">
        <Button size="hero" block className="rounded-none py-7">
          <span className="flex flex-col items-center gap-1">
            <span>בואי נתחיל</span>
            <span className="text-base font-normal opacity-85">
              {settings.dailyGoalMinutes} דקות
            </span>
          </span>
        </Button>
        <p className="px-5 py-3 text-center text-sm text-ink-soft">
          נתחיל אחרי שנכיר — עוד רגע נבנה לך מסלול אישי
        </p>
      </Card>

      <div className="flex justify-center">
        <ProgressRing value={0} label="0" sublabel="דקות היום" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SecondaryCard to={paths.homework()} icon="camera" label="שיעורי בית" />
        <SecondaryCard to={paths.learn()} icon="book" label="נושא לבחירתי" />
        <SecondaryCard to={paths.learn()} icon="spark" label="שאלה מהירה" />
      </div>
    </div>
  );
}

function SecondaryCard({
  to,
  icon,
  label,
}: {
  to: string;
  icon: 'camera' | 'book' | 'spark';
  label: string;
}) {
  return (
    <Link
      to={to}
      className="card tap flex flex-col items-center justify-center gap-2 p-4 text-center text-sm transition hover:bg-surface-2"
    >
      <Icon name={icon} className="h-7 w-7 text-primary" />
      <span>{label}</span>
    </Link>
  );
}
