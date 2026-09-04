import { Link } from 'react-router-dom';
import { daysSinceExport } from '@/lib/security/pin';
import { paths } from '@/router';

/**
 * The backup reminder, where it will actually be seen.
 *
 * It used to live behind the parent PIN, two navigations deep, on a tab that is
 * not the default — which is to say it was invisible to the person who needed
 * it. A warning nobody encounters is not a warning.
 */
export function BackupBanner({ minDays = 14 }: { minDays?: number }) {
  const since = daysSinceExport();
  if (since !== null && since < minDays) return null;

  return (
    <Link
      to={paths.parent()}
      className="tap block rounded-lg bg-almost-tint px-4 py-3 text-almost transition hover:brightness-[.98]"
    >
      <p className="font-medium">
        {since === null ? 'עוד לא נעשה גיבוי' : `עברו ${since} ימים מאז הגיבוי האחרון`}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        הדפדפן עלול למחוק את ההתקדמות. גיבוי מהיר לוקח שתי שניות.
      </p>
    </Link>
  );
}
