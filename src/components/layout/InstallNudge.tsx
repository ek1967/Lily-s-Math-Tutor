import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/ui';
import { readJson, writeJson } from '@/lib/storage';

const KEY = 'lmt.installNudge.v1';

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Asks her to add the app to the home screen — which sounds like a nicety and
 * is actually data protection. Safari evicts IndexedDB for sites unused for
 * about a week, and an installed app is far less likely to be cleared. Shown
 * once she has actually been using it, since that is when it is worth asking.
 */
export function InstallNudge({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(
    () => readJson<{ dismissed: boolean }>(KEY, { dismissed: false }).dismissed,
  );
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    setEligible(!isStandalone() && isIos());
  }, []);

  if (!show || dismissed || !eligible) return null;

  return (
    <Card className="border-primary/40 bg-primary-tint/40">
      <p className="font-medium">כדאי להוסיף את הלומדה למסך הבית</p>
      <p className="mt-1 text-sm text-ink-soft">
        ככה היא נפתחת כמו אפליקציה, עובדת בלי אינטרנט, והדפדפן לא מוחק את
        ההתקדמות שלך אחרי כמה ימים בלי שימוש.
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        בספארי: כפתור השיתוף למטה, ואז ״הוספה למסך הבית״.
      </p>
      <Button
        size="sm"
        variant="quiet"
        className="mt-2"
        onClick={() => {
          writeJson(KEY, { dismissed: true });
          setDismissed(true);
        }}
      >
        הבנתי
      </Button>
    </Card>
  );
}
