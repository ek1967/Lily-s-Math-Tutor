import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { clearPin, hasPin, setPin, verifyPin } from '@/lib/security/pin';
import { backupFilename, exportAll } from '@/lib/db/backup';
import { deliverBackup } from '@/lib/db/shareBackup';

/**
 * A convenience barrier, and honest about it: everything behind it is already
 * on the device. Its job is to stop a 13-year-old casually switching the tutor
 * into "show me the answer" mode, and it is sized for exactly that.
 */
export function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const creating = !hasPin();

  const submit = async () => {
    setError('');
    if (creating) {
      if (pin.length < 4) {
        setError('קוד של ארבע ספרות לפחות.');
        return;
      }
      if (pin !== confirm) {
        setError('שני הקודים לא זהים.');
        return;
      }
      await setPin(pin);
      onUnlock();
      return;
    }
    if (await verifyPin(pin)) onUnlock();
    else {
      setError('הקוד לא נכון.');
      setValue('');
    }
  };

  return (
    <Card className="mt-8">
      <h1 className="text-xl">{creating ? 'בחרו קוד להורים' : 'מסך הורים'}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {creating
          ? 'הקוד חוסם גישה למסך הזה ולמצב שמראה פתרונות מלאים. הוא לא סוד גדול — רק מחסום נוחות.'
          : 'צריך את הקוד כדי להיכנס.'}
      </p>

      <div className="mt-4 space-y-2">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="קוד"
          dir="ltr"
          className="ltr w-full rounded-md border border-line bg-surface px-3 py-3 text-center text-xl tracking-widest"
        />
        {creating && (
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="שוב, לאימות"
            dir="ltr"
            className="ltr w-full rounded-md border border-line bg-surface px-3 py-3 text-center text-xl tracking-widest"
          />
        )}
        {error && <p className="text-almost">{error}</p>}
        <Button block onClick={() => void submit()} disabled={pin.length < 4}>
          {creating ? 'לשמור את הקוד' : 'כניסה'}
        </Button>

        {!creating && (
          <Button
            variant="quiet"
            block
            disabled={resetting}
            onClick={() => {
              // A forgotten code used to lock the parent out of the backup
              // screen permanently — that is, out of the one tool that saves
              // the data. So the reset exports first, then clears the code.
              setResetting(true);
              void (async () => {
                try {
                  const data = await exportAll(false);
                  await deliverBackup(JSON.stringify(data), backupFilename());
                } catch {
                  /* Recovery must not depend on the export succeeding. */
                }
                clearPin();
                setError('');
                setValue('');
                setResetting(false);
                onUnlock();
              })();
            }}
          >
            {resetting ? 'שומרת גיבוי…' : 'שכחתי את הקוד'}
          </Button>
        )}
      </div>
    </Card>
  );
}
