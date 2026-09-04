import { useState } from 'react';
import type { SolutionStep } from '@/types/exercise';
import { TextWithMath } from '@/lib/math/Katex';
import { Button } from '@/components/ui';

/**
 * The worked solution, one step at a time. Dumping five steps at once is a wall
 * of text; revealing them on tap keeps her reading each one.
 */
export function StepReveal({ steps }: { steps: SolutionStep[] }) {
  const [shown, setShown] = useState(1);
  const remaining = steps.length - shown;

  return (
    <div className="space-y-2">
      <h3 className="text-sm text-ink-soft">איך פותרים</h3>
      <ol className="space-y-2">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="animate-pop-in flex gap-3 rounded-lg bg-surface-2 px-4 py-3">
            <span className="text-ink-soft">{i + 1}.</span>
            <TextWithMath he={s.he} tex={s.tex} />
          </li>
        ))}
      </ol>
      {remaining > 0 && (
        <Button variant="ghost" block onClick={() => setShown((n) => n + 1)}>
          השלב הבא
        </Button>
      )}
    </div>
  );
}
