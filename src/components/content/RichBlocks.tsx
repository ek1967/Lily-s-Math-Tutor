import type { RichBlock } from '@/types/content';
import { MathBlock, MathInline } from '@/lib/math/Katex';

const CALLOUT_STYLES = {
  tip: 'bg-primary-tint text-primary-strong',
  warn: 'bg-almost-tint text-almost',
  rule: 'bg-yes-tint text-yes border-s-4 border-yes',
} as const;

const CALLOUT_LABELS = { tip: 'טיפ', warn: 'שימי לב', rule: 'הכלל' } as const;

/** Renders lesson content. Hebrew and maths never share a string, so each is
 *  rendered in its own direction context and the bidi algorithm cannot mangle
 *  a formula. */
export function RichBlocks({ blocks }: { blocks: readonly RichBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: RichBlock }) {
  switch (block.kind) {
    case 'text':
      return <p className="leading-relaxed">{block.he}</p>;

    case 'math':
      return (
        <figure>
          <MathBlock tex={block.tex} className="text-xl" />
          {block.captionHe && (
            <figcaption className="text-center text-sm text-ink-soft">
              {block.captionHe}
            </figcaption>
          )}
        </figure>
      );

    case 'mixed':
      return (
        <p className="leading-relaxed">
          {block.parts.map((part, i) => (
            <span key={i}>
              {'he' in part ? part.he : <MathInline tex={part.tex} />}{' '}
            </span>
          ))}
        </p>
      );

    case 'callout':
      return (
        <aside className={`rounded-lg px-4 py-3 ${CALLOUT_STYLES[block.tone]}`}>
          <span className="me-2 text-sm font-semibold opacity-80">
            {CALLOUT_LABELS[block.tone]}
          </span>
          {block.he}
        </aside>
      );

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal space-y-2 ps-6">
          {block.items.map((item, i) => (
            <li key={i}>
              <Block block={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-2 ps-6">
          {block.items.map((item, i) => (
            <li key={i}>
              <Block block={item} />
            </li>
          ))}
        </ul>
      );

    case 'table':
      return (
        // Wide tables scroll inside their own box; the page never scrolls sideways.
        <div className="math-scroll -mx-1 px-1">
          <table className="w-full border-collapse text-start text-base">
            <thead>
              <tr>
                {block.headerHe.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-line pb-2 text-start font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-line/60 py-2 pe-3 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
