import { useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { backupFilename, exportAll, importAll, parseBackup } from '@/lib/db/backup';
import { daysSinceExport, markExported } from '@/lib/security/pin';

const MB = 1024 * 1024;

/**
 * Backup and restore. The most important control on this screen, for a reason
 * that is invisible until it happens: Safari evicts IndexedDB for sites unused
 * for about a week, which would silently erase months of work. The device is a
 * cache; this file is the record.
 */
export function DataTools({
  storage,
  onRestored,
}: {
  storage: { usage: number; quota: number; materials: number } | null;
  onRestored: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const sinceExport = daysSinceExport();

  const exportNow = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFilename();
      link.click();
      URL.revokeObjectURL(url);
      markExported();
      setMessage('הגיבוי נשמר. כדאי לשלוח אותו לעצמכם במייל.');
    } catch {
      setError('לא הצלחתי לייצא. אולי אין מספיק מקום פנוי.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file: File) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const parsed = parseBackup(await file.text());
      if (!parsed) {
        setError('הקובץ הזה לא נראה כמו גיבוי של הלומדה.');
        return;
      }
      const summary = await importAll(parsed);
      setMessage(
        `שוחזרו ${summary.mastery} נושאים, ${summary.attempts} תרגילים ו-${summary.materials} דפי עבודה.`,
      );
      onRestored();
    } catch {
      setError('השחזור נכשל. הקובץ אולי פגום או מגרסה אחרת.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg">גיבוי ושחזור</h2>
      <p className="mt-1 text-sm text-ink-soft">
        כל הנתונים נמצאים במכשיר הזה בלבד. אם הדפדפן ינקה אותם או שהמכשיר יתחלף —
        בלי גיבוי הכול נעלם.
      </p>

      {sinceExport !== null && sinceExport >= 30 && (
        <div className="mt-3 rounded-lg bg-almost-tint px-4 py-3 text-almost">
          עברו {sinceExport} ימים מאז הגיבוי האחרון.
        </div>
      )}
      {sinceExport === null && (
        <div className="mt-3 rounded-lg bg-almost-tint px-4 py-3 text-almost">
          עוד לא נעשה גיבוי.
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button onClick={() => void exportNow()} disabled={busy}>
          לייצא גיבוי
        </Button>
        <Button variant="ghost" onClick={() => fileInput.current?.click()} disabled={busy}>
          לשחזר מקובץ
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void restore(file);
          e.target.value = '';
        }}
      />

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
              style={{ width: `${storage.quota ? Math.min(100, (storage.usage / storage.quota) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
