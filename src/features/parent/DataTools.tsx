import { useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  backupFilename,
  exportAll,
  importAll,
  parseBackup,
  type BackupFile,
} from '@/lib/db/backup';
import { deliverBackup, formatBytes } from '@/lib/db/shareBackup';
import { daysSinceExport, markExported } from '@/lib/security/pin';
import { PIXEL_RETENTION_DAYS, prunePixels } from '@/lib/db/prune';
import { formatBytes as bytes } from '@/lib/db/shareBackup';
import { dayKey, relativeDayHe } from '@/lib/time';

const MB = 1024 * 1024;

interface Props {
  storage: { usage: number; quota: number; materials: number } | null;
  onRestored: () => void;
}

/**
 * Backup and restore — the most important controls in the app, for a reason
 * that is invisible until it happens: Safari deletes a site's storage after
 * about a week without use. The device is a cache; the exported file is the
 * record, and only a copy that leaves the device is really a backup.
 *
 * The default export deliberately omits worksheet photos. Progress for a whole
 * school year is around 650 KB, small enough to send to yourself weekly without
 * thinking; the same file with the photos is tens of megabytes, which is the
 * kind of thing people stop doing. The photos are also the only part that is
 * genuinely replaceable.
 */
export function DataTools({ storage, onRestored }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ file: BackupFile; name: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sinceExport = daysSinceExport();

  const runExport = async (includePages: boolean) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await exportAll(includePages);
      const json = JSON.stringify(data);
      const result = await deliverBackup(json, backupFilename());

      if (result === 'cancelled') {
        setMessage('');
        return;
      }
      if (result === 'failed') {
        setError('לא הצלחתי לשמור את הקובץ. אולי אין מספיק מקום פנוי.');
        return;
      }

      // Recorded only once the file actually went somewhere.
      markExported();
      setMessage(
        result === 'shared'
          ? `הגיבוי נשלח (${formatBytes(json.length)}). כדאי לשמור אותו ב-iCloud או לשלוח לעצמכם.`
          : `הגיבוי ירד למכשיר (${formatBytes(json.length)}). כדאי להעתיק אותו למקום בטוח.`,
      );
    } catch {
      setError('לא הצלחתי לייצא. אם יש הרבה צילומי דפים, כדאי לנסות גיבוי מהיר.');
    } finally {
      setBusy(false);
    }
  };

  const stage = async (file: File) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const parsed = parseBackup(await file.text());
      if (!parsed) {
        setError('הקובץ הזה לא נראה כמו גיבוי של הלומדה.');
        return;
      }
      setPending({ file: parsed, name: file.name });
    } catch {
      setError('לא הצלחתי לקרוא את הקובץ.');
    } finally {
      setBusy(false);
    }
  };

  const confirmRestore = async () => {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      // A safety copy first: restore replaces everything, so a wrong file would
      // otherwise be unrecoverable.
      const safety = await exportAll(false);
      await deliverBackup(JSON.stringify(safety), `before-restore-${backupFilename()}`);

      const summary = await importAll(pending.file);
      setPending(null);
      setMessage(
        `שוחזרו ${summary.mastery} נושאים, ${summary.attempts} תרגילים ו-${summary.materials} דפי עבודה.`,
      );
      onRestored();
    } catch {
      setError('השחזור נכשל. הקובץ אולי פגום או מגרסה חדשה יותר.');
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <Card className="border-almost/50">
        <h2 className="text-lg">לאשר שחזור?</h2>
        <p className="mt-2 text-ink-soft">
          שחזור מוחק את כל מה שנמצא עכשיו במכשיר ומחליף אותו בתוכן הקובץ. זה לא מתמזג.
        </p>

        <dl className="mt-3 space-y-1 rounded-lg bg-surface-2 px-4 py-3 text-sm">
          <Row label="הקובץ" value={pending.name} />
          <Row
            label="נוצר"
            value={
              pending.file.exportedAt
                ? relativeDayHe(dayKey(pending.file.exportedAt))
                : 'לא ידוע'
            }
          />
          <Row label="נושאים" value={String(pending.file.mastery.length)} />
          <Row label="תרגילים" value={String(pending.file.attempts.length)} />
          <Row label="דפי עבודה" value={String(pending.file.materials.length)} />
        </dl>

        <p className="mt-3 text-sm text-ink-soft">
          לפני השחזור אשמור עותק של המצב הנוכחי, כדי שיהיה אפשר לחזור אחורה.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button onClick={() => void confirmRestore()} disabled={busy}>
            כן, לשחזר
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
            ביטול
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg">גיבוי ושחזור</h2>
      <p className="mt-1 text-sm text-ink-soft">
        כל הנתונים נמצאים במכשיר הזה בלבד. הדפדפן מוחק אחסון של אתר שלא היה בשימוש כשבוע,
        ולכן עותק מחוץ למכשיר הוא ההגנה היחידה הוודאית.
      </p>

      {sinceExport !== null && sinceExport >= 14 && (
        <div className="mt-3 rounded-lg bg-almost-tint px-4 py-3 text-almost">
          עברו {sinceExport} ימים מאז הגיבוי האחרון.
        </div>
      )}
      {sinceExport === null && (
        <div className="mt-3 rounded-lg bg-almost-tint px-4 py-3 text-almost">
          עוד לא נעשה גיבוי. שווה לעשות אחד עכשיו — זה לוקח שתי שניות.
        </div>
      )}

      <Button block className="mt-3" onClick={() => void runExport(false)} disabled={busy}>
        גיבוי מהיר
      </Button>
      <p className="mt-1 text-center text-sm text-ink-soft">
        כל ההתקדמות, בלי צילומי דפי העבודה. קטן מספיק לשלוח בוואטסאפ.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={() => void runExport(true)} disabled={busy}>
          ארכיון מלא
        </Button>
        <Button variant="ghost" onClick={() => fileInput.current?.click()} disabled={busy}>
          לשחזר מקובץ
        </Button>
      </div>
      {storage && storage.materials > 0 && (
        <p className="mt-1 text-center text-sm text-ink-soft">
          הארכיון המלא כולל את הצילומים — בערך {(storage.materials / MB).toFixed(0)} מגה.
        </p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void stage(file);
          e.target.value = '';
        }}
      />

      <div className="mt-4 border-t border-line pt-3">
        <h3 className="text-base">לפנות מקום</h3>
        <p className="mt-1 text-sm text-ink-soft">
          מוחק את הצילומים של דפי עבודה מלפני יותר מ־{PIXEL_RETENTION_DAYS} יום. רשימת
          התרגילים, הסימונים והשיחה על כל תרגיל נשמרים — רק התמונה עצמה נמחקת.
        </p>
        <Button
          variant="ghost"
          block
          className="mt-2"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void prunePixels()
              .then((r) =>
                setMessage(
                  r.materials === 0
                    ? 'אין כרגע צילומים ישנים מספיק כדי למחוק.'
                    : `פונו ${bytes(r.bytesFreed)} מ־${r.materials} דפי עבודה ישנים.`,
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          לפנות מקום עכשיו
        </Button>
      </div>

      {message && <p className="mt-3 text-yes">{message}</p>}
      {error && <p className="mt-3 text-almost">{error}</p>}

      {storage && (
        <div className="mt-4 border-t border-line pt-3 text-sm text-ink-soft">
          <p>
            בשימוש: {(storage.usage / MB).toFixed(1)} מגה מתוך{' '}
            {(storage.quota / MB).toFixed(0)} זמינים
          </p>
          <p>מתוכם דפי עבודה: {(storage.materials / MB).toFixed(1)} מגה</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${storage.quota ? Math.min(100, (storage.usage / storage.quota) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  );
}
