import { describe, expect, it } from 'vitest';
import { parseBlocks, parseInline } from '@/lib/text/markdownLite';

/**
 * Model output is untrusted input. This renderer produces tokens, never HTML,
 * so there is no parsing path an injection could travel down — these tests pin
 * that property down along with the maths extraction.
 */
describe('inline parsing', () => {
  it('leaves plain Hebrew alone', () => {
    expect(parseInline('שלום לילי')).toEqual([{ type: 'text', text: 'שלום לילי' }]);
  });

  it('pulls maths out into its own token', () => {
    // Left inside the sentence, the bidi algorithm would reorder the formula.
    expect(parseInline('נציב $x = 5$ ונראה')).toEqual([
      { type: 'text', text: 'נציב ' },
      { type: 'math', tex: 'x = 5' },
      { type: 'text', text: ' ונראה' },
    ]);
  });

  it('handles double-dollar maths', () => {
    expect(parseInline('$$a^2 + b^2$$')).toEqual([{ type: 'math', tex: 'a^2 + b^2' }]);
  });

  it('reads bold', () => {
    expect(parseInline('זה **חשוב** מאוד')).toEqual([
      { type: 'text', text: 'זה ' },
      { type: 'bold', text: 'חשוב' },
      { type: 'text', text: ' מאוד' },
    ]);
  });

  it('never produces markup, whatever the model sends', () => {
    const hostile = '<img src=x onerror=alert(1)> <script>alert(2)</script>';
    const tokens = parseInline(hostile);
    // The angle brackets survive as literal text and are rendered by React as
    // text; there is no HTML path for them to travel down.
    expect(tokens.every((t) => t.type === 'text')).toBe(true);
    expect(tokens.map((t) => ('text' in t ? t.text : '')).join('')).toBe(hostile);
  });

  it('drops empty segments', () => {
    expect(parseInline('$x$')).toEqual([{ type: 'math', tex: 'x' }]);
  });
});

describe('block parsing', () => {
  it('splits paragraphs on blank lines', () => {
    const blocks = parseBlocks('שורה ראשונה\n\nשורה שנייה');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.type).toBe('paragraph');
  });

  it('promotes a formula on its own line to a display block', () => {
    const blocks = parseBlocks('נפתור:\n$$3x = 12$$\nוקיבלנו');
    expect(blocks[1]).toEqual({ type: 'mathBlock', tex: '3x = 12' });
  });

  it('reads numbered and bulleted lists', () => {
    const blocks = parseBlocks('1. ראשון\n2. שני\n- נקודה');
    expect(blocks.filter((b) => b.type === 'listItem')).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ ordered: true, index: 1 });
    expect(blocks[1]).toMatchObject({ ordered: true, index: 2 });
    expect(blocks[2]).toMatchObject({ ordered: false });
  });

  it('flattens headings to bold rather than shouting in a chat bubble', () => {
    const blocks = parseBlocks('## כותרת');
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      inlines: [{ type: 'bold', text: 'כותרת' }],
    });
  });

  it('ignores blank input', () => {
    expect(parseBlocks('   \n\n  ')).toEqual([]);
  });
});
