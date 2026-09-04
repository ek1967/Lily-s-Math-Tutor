import katex from 'katex';
import { useMemo } from 'react';
import { KATEX_OPTIONS } from './katexOptions';

/**
 * The only sanctioned way to put maths on screen.
 *
 * KaTeX renders left-to-right. Dropped into this RTL document it would inherit
 * `direction: rtl`, and the bidi algorithm then reorders parentheses and minus
 * signs — `3 - (x + 2)` comes out as nonsense. Both components below wrap their
 * output in an isolated LTR box, which is why no component should ever call
 * katex directly.
 */

interface Props {
  tex: string;
  className?: string;
}

export function MathInline({ tex, className = '' }: Props) {
  const html = useMemo(
    () => katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: false }),
    [tex],
  );
  return (
    <span
      dir="ltr"
      className={`ltr inline-block align-middle ${className}`}
      // KaTeX output with trust:false contains no scripts, links or handlers.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathBlock({ tex, className = '' }: Props) {
  const html = useMemo(
    () => katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: true }),
    [tex],
  );
  return (
    <div
      dir="ltr"
      className={`ltr math-scroll my-2 text-center ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Hebrew sentence plus an optional formula, each in its own direction context. */
export function TextWithMath({
  he,
  tex,
  className = '',
}: {
  he: string;
  tex?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {he}
      {tex && (
        <>
          {he ? ' ' : ''}
          <MathInline tex={tex} />
        </>
      )}
    </span>
  );
}
