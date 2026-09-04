import { parseBlocks, type Inline } from '@/lib/text/markdownLite';
import { MathBlock, MathInline } from '@/lib/math/Katex';

/**
 * Renders tutor output. The text is parsed into tokens and rendered as React
 * elements — it never touches dangerouslySetInnerHTML, so there is no HTML path
 * for model output to travel down. Maths is pulled out and rendered through the
 * KaTeX components, which isolate direction.
 */
export function ModelText({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'mathBlock') {
          return <MathBlock key={i} tex={block.tex} />;
        }
        if (block.type === 'listItem') {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-ink-soft">{block.ordered ? `${block.index}.` : '•'}</span>
              <p className="min-w-0 flex-1">
                <Inlines inlines={block.inlines} />
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            <Inlines inlines={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((inline, i) => {
        if (inline.type === 'math') return <MathInline key={i} tex={inline.tex} />;
        if (inline.type === 'bold') return <strong key={i}>{inline.text}</strong>;
        return <span key={i}>{inline.text}</span>;
      })}
    </>
  );
}
