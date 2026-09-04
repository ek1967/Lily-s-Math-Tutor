import { Card } from '@/components/ui';
import { RichBlocks } from '@/components/content/RichBlocks';
import { WorkedExampleCard } from '@/components/content/WorkedExampleCard';
import { MathInline } from '@/lib/math/Katex';
import type { LessonContent } from '@/types/content';

/**
 * The lesson, in the order it is most useful: why it matters, the idea itself,
 * examples worked step by step, and only then the mistakes to avoid. Mistakes
 * come last deliberately — leading with them teaches the error first.
 */
export function LessonView({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="space-y-5">
      <Card className="bg-primary-tint/50">
        <p className="leading-relaxed">{lesson.hookHe}</p>
      </Card>

      <Card>
        <RichBlocks blocks={lesson.explanation} />
      </Card>

      {lesson.examples.map((example, i) => (
        <WorkedExampleCard key={example.id} example={example} index={i} />
      ))}

      {lesson.mistakes.length > 0 && (
        <Card>
          <h2 className="mb-1 text-lg">טעויות שקל ליפול בהן</h2>
          <p className="mb-3 text-sm text-ink-soft">
            כולן נפוצות מאוד. לדעת למה הן מפתות זה מה שמונע אותן.
          </p>
          <ul className="space-y-4">
            {lesson.mistakes.map((m, i) => (
              <li key={i} className="rounded-lg bg-almost-tint px-4 py-3">
                <p className="font-medium text-almost">{m.wrongHe}</p>
                {m.wrongTex && (
                  <p className="my-1">
                    <MathInline tex={m.wrongTex} />
                  </p>
                )}
                <p className="mt-1 text-sm text-ink-soft">{m.whyHe}</p>
                <p className="mt-2">{m.fixHe}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {lesson.vocab.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg">מילים שכדאי להכיר</h2>
          <dl className="space-y-2">
            {lesson.vocab.map((v) => (
              <div key={v.termHe}>
                <dt className="inline font-medium">{v.termHe} — </dt>
                <dd className="inline text-ink-soft">{v.defHe}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {lesson.source === 'ai' && (
        <p className="text-center text-sm text-ink-soft">
          את ההסבר הזה כתב לך המורה. אם משהו לא ברור — אפשר לבקש הסבר אחר.
        </p>
      )}
    </div>
  );
}
