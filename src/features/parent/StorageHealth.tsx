import { Card } from '@/components/ui';
import { daysSinceExport } from '@/lib/security/pin';

interface Props {
  persisted: boolean | null;
  dbState: 'ok' | 'unavailable' | null;
}

/**
 * Turns a silent risk into a visible one.
 *
 * Every part of this can fail without the app looking any different: storage
 * can be unpersisted, the database can fail to open entirely, and a backup can
 * be months old. None of that is visible while using the app, and all of it
 * ends the same way. So it is stated plainly, with the one action that changes
 * each case.
 */
export function StorageHealth({ persisted, dbState }: Props) {
  const sinceExport = daysSinceExport();
  const backupStale = sinceExport === null || sinceExport >= 14;

  return (
    <Card>
      <h2 className="mb-3 text-lg">בטיחות הנתונים</h2>

      {dbState === 'unavailable' && (
        <Line
          tone="bad"
          title="לא הצלחתי לפתוח את מסד הנתונים"
          detail="ההתקדמות לא נשמרת כרגע. אולי הדפדפן במצב פרטי, או שחסימת נתוני אתרים מופעלת."
        />
      )}

      <Line
        tone={persisted === true ? 'good' : persisted === false ? 'warn' : 'unknown'}
        title={
          persisted === true
            ? 'הדפדפן הבטיח לשמור את הנתונים'
            : persisted === false
              ? 'הדפדפן עלול למחוק את הנתונים'
              : 'הדפדפן לא מגלה מה מצב האחסון'
        }
        detail={
          persisted === true
            ? 'זה לא מבטל את הצורך בגיבוי, אבל זה מוריד מאוד את הסיכון.'
            : 'אחסון של אתר שלא היה בשימוש כשבוע נמחק. הוספת הלומדה למסך הבית משנה את זה — לאפליקציה במסך הבית יש מונה ימי שימוש נפרד.'
        }
      />

      <Line
        tone={backupStale ? 'warn' : 'good'}
        title={
          sinceExport === null
            ? 'עוד לא נעשה גיבוי'
            : sinceExport === 0
              ? 'גיבוי אחרון: היום'
              : `גיבוי אחרון: לפני ${sinceExport} ימים`
        }
        detail={
          backupStale
            ? 'זו ההגנה היחידה שעובדת בוודאות. הגיבוי המהיר לוקח שתי שניות.'
            : 'מצוין. כדאי לחזור על זה כל שבוע־שבועיים.'
        }
      />
    </Card>
  );
}

const TONES = {
  good: 'bg-yes-tint text-yes',
  warn: 'bg-almost-tint text-almost',
  bad: 'bg-almost-tint text-almost',
  unknown: 'bg-surface-2 text-ink-soft',
} as const;

function Line({
  tone,
  title,
  detail,
}: {
  tone: keyof typeof TONES;
  title: string;
  detail: string;
}) {
  return (
    <div className={`mb-2 rounded-lg px-4 py-3 ${TONES[tone]}`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{detail}</p>
    </div>
  );
}
