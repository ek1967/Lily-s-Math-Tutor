/**
 * A deliberately tiny Markdown renderer for model output.
 *
 * Model text is untrusted input. It is never handed to dangerouslySetInnerHTML
 * — this returns structured tokens that React renders as elements, so there is
 * no HTML parsing path at all and nothing to escape wrongly.
 *
 * Maths is extracted rather than rendered inline: `$...$` becomes a token the
 * caller renders through the KaTeX components, which isolate direction. Leaving
 * a formula inside a Hebrew paragraph is what makes the bidi algorithm reorder
 * it into nonsense.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'math'; tex: string };

export type Block =
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'mathBlock'; tex: string }
  | { type: 'listItem'; inlines: Inline[]; ordered: boolean; index: number };

const INLINE_PATTERN = /(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*\n]+\*\*)/g;

export function parseInline(raw: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;

  for (const match of raw.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: 'text', text: raw.slice(last, index) });

    const token = match[0];
    if (token.startsWith('$$')) out.push({ type: 'math', tex: token.slice(2, -2).trim() });
    else if (token.startsWith('$')) out.push({ type: 'math', tex: token.slice(1, -1).trim() });
    else out.push({ type: 'bold', text: token.slice(2, -2) });

    last = index + token.length;
  }

  if (last < raw.length) out.push({ type: 'text', text: raw.slice(last) });
  return out.filter((i) => i.type !== 'text' || i.text !== '');
}

export function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  let orderedIndex = 0;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') {
      orderedIndex = 0;
      continue;
    }

    // A formula on a line of its own is rendered as a display block.
    const displayMath = /^\$\$?([^$]+)\$\$?$/.exec(trimmed);
    if (displayMath?.[1]) {
      blocks.push({ type: 'mathBlock', tex: displayMath[1].trim() });
      continue;
    }

    const ordered = /^(\d+)[.)]\s+(.*)$/.exec(trimmed);
    if (ordered?.[2]) {
      orderedIndex += 1;
      blocks.push({
        type: 'listItem',
        inlines: parseInline(ordered[2]),
        ordered: true,
        index: orderedIndex,
      });
      continue;
    }

    const bullet = /^[-*•]\s+(.*)$/.exec(trimmed);
    if (bullet?.[1]) {
      blocks.push({ type: 'listItem', inlines: parseInline(bullet[1]), ordered: false, index: 0 });
      continue;
    }

    // Headings are flattened to bold: a model heading inside a chat bubble is
    // visual noise, not structure.
    const heading = /^#{1,6}\s+(.*)$/.exec(trimmed);
    const text = heading?.[1] ?? trimmed;
    blocks.push({
      type: 'paragraph',
      inlines: heading ? [{ type: 'bold', text }] : parseInline(text),
    });
  }

  return blocks;
}
