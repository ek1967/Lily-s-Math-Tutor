import { useState } from 'react';
import type { WorkedExample } from '@/types/content';
import { Card } from '@/components/ui';
import { MathBlock, TextWithMath } from '@/lib/math/Katex';

/**
 * A worked example, revealed a step at a time. The "why" behind each step is
 * hidden until tapped: the move and the reason are different things, and
 * showing both at once is more than one screen's worth of attention.
 */
export function WorkedExampleCard({ example, index }: { example: WorkedExample; index: number }) {
  const [shown, setShown] = useState(0);
  const [openWhy, setOpenWhy] = useState<number | null>(null);
  const done = shown >= example.steps.length;

  return (
    <Card>
      <p className="mb-1 text-sm text-ink-soft">דוגמה {index + 1}</p>
      <p className="font-medium">{example.promptHe}</p>
      {example.promptTex && <MathBlock tex={example.promptTex} className="text-xl" />}

      <ol className="mt-3 space-y-2">
        {example.steps.slice(0, shown).map((step, i) => (
          <li key={i} className="animate-pop-in rounded-lg bg-surface-2 px-4 py-3">
            <div className="flex gap-3">
              <span className="text-ink-soft">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <TextWithMath he={step.he} tex={step.tex} />
                {step.whyHe && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenWhy(openWhy === i ? null : i)}
                      className="tap mt-1 block text-sm text-primary"
                    >
                      {openWhy === i ? 'הבנתי' : 'למה?'}
                    </button>
                    {openWhy === i && (
                      <p className="animate-pop-in mt-1 text-sm text-ink-soft">{step.whyHe}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!done && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 1)}
          className="tap mt-3 w-full rounded-lg bg-primary-tint py-3 font-medium text-primary-strong"
        >
          {shown === 0 ? 'לראות איך פותרים' : 'השלב הבא'}
        </button>
      )}

      {done && (
        <p className="mt-3 text-center">
          <span className="text-ink-soft">התשובה: </span>
          <TextWithMath he="" tex={example.answerTex} />
        </p>
      )}
    </Card>
  );
}
