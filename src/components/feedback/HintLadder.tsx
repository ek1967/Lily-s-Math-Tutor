import type { Hint } from '@/types/exercise';
import { TextWithMath } from '@/lib/math/Katex';
import { Button, SpeakButton } from '@/components/ui';

/**
 * Three hints, one tap each, each its own calm card. Using a hint costs her
 * nothing visible — it is recorded for the parent screen, but showing a penalty
 * would teach her that asking for help is a failure, which is the opposite of
 * what a tutor is for.
 */
export function HintLadder({
  hints,
  shown,
  canAsk,
  onAsk,
}: {
  hints: readonly [Hint, Hint, Hint];
  shown: number;
  canAsk: boolean;
  onAsk: () => void;
}) {
  return (
    <div className="space-y-2">
      {hints.slice(0, shown).map((h) => (
        <div
          key={h.level}
          className="animate-pop-in rounded-lg bg-primary-tint px-4 py-3 text-primary-strong"
        >
          <span className="me-2 text-sm opacity-75">רמז {h.level}</span>
          <TextWithMath he={h.he} tex={h.tex} />
          <SpeakButton text={h.he} />
        </div>
      ))}

      {canAsk && (
        <Button variant="soft" block onClick={onAsk}>
          {shown === 0 ? 'אפשר רמז?' : 'עוד רמז'}
        </Button>
      )}
    </div>
  );
}
