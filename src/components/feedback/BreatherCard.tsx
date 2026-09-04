import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

/**
 * Fifteen seconds, halfway through. Working straight through a whole set means
 * the last questions get answered badly by someone who has run out of
 * attention — and a break that she chooses to end is a break, while a break she
 * has to wait out is a timer, which this app does not do. The count is there to
 * suggest a length, and "אפשר להמשיך" is live from the first second.
 */
const SUGGESTED_SECONDS = 15;

export function BreatherCard({ onContinue }: { onContinue: () => void }) {
  const [left, setLeft] = useState(SUGGESTED_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 text-center">
      <div
        aria-hidden="true"
        className="grid h-32 w-32 place-items-center rounded-full bg-primary-tint text-4xl"
      >
        {left > 0 ? left : '✓'}
      </div>
      <div>
        <h2 className="text-2xl">רגע של אוויר</h2>
        <p className="mt-2 text-ink-soft">
          נשימה עמוקה, מתיחה קטנה. חצי מהדרך מאחורייך.
        </p>
      </div>
      <Button size="hero" block onClick={onContinue}>
        אפשר להמשיך
      </Button>
    </div>
  );
}
