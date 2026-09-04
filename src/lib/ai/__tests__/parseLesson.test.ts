import { describe, expect, it } from 'vitest';
import { extractJson, parseLesson } from '@/lib/ai/parseLesson';
import { asTopicId } from '@/types/curriculum';

const TOPIC = asTopicId('geo-circle');

const valid = {
  hookHe: 'מעגלים נמצאים בכל מקום, מגלגל ועד צלחת',
  explanation: [
    { kind: 'text', he: 'רדיוס הוא המרחק מהמרכז אל השפה' },
    { kind: 'math', tex: 'P = 2\\pi r' },
    { kind: 'callout', tone: 'tip', he: 'הקוטר הוא תמיד פי שניים מהרדיוס' },
  ],
  examples: [
    {
      promptHe: 'מהו היקף מעגל שהרדיוס שלו 5?',
      steps: [{ he: 'מציבים בנוסחה', tex: '2\\pi \\cdot 5' }, { he: 'ומחשבים' }],
      answerTex: '10\\pi',
    },
  ],
  mistakes: [{ wrongHe: 'מבלבלים בין רדיוס לקוטר', whyHe: 'שניהם קווים במעגל', fixHe: 'רדיוס מגיע רק עד המרכז' }],
  vocab: [{ termHe: 'רדיוס', defHe: 'המרחק מהמרכז אל השפה' }],
};

/**
 * A half-formed lesson is worse than none: it looks authoritative while being
 * wrong. Everything here rejects rather than repairs, and the caller falls back
 * to exercises, which always work.
 */
describe('extracting JSON from a reply', () => {
  it('reads a bare object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('reads an object inside a code fence', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('reads an object wrapped in prose', () => {
    expect(extractJson('בטח! הנה:\n{"a":1}\nמקווה שעזרתי')).toEqual({ a: 1 });
  });

  it('returns null for truncated JSON', () => {
    expect(extractJson('{"a":1,"b":')).toBeNull();
  });

  it('returns null when there is no object at all', () => {
    expect(extractJson('אין לי מושג')).toBeNull();
  });
});

describe('parsing a lesson', () => {
  const parse = (data: unknown) => parseLesson(JSON.stringify(data), TOPIC, 'claude-opus-5');

  it('accepts a well-formed lesson', () => {
    const lesson = parse(valid);
    expect(lesson).not.toBeNull();
    expect(lesson!.source).toBe('ai');
    expect(lesson!.topicId).toBe(TOPIC);
    expect(lesson!.explanation).toHaveLength(3);
    expect(lesson!.examples[0]!.id).toBe('ai-0');
  });

  it('rejects a lesson with no hook', () => {
    expect(parse({ ...valid, hookHe: '' })).toBeNull();
  });

  it('rejects a lesson with too little explanation', () => {
    expect(parse({ ...valid, explanation: [valid.explanation[0]] })).toBeNull();
  });

  it('rejects a lesson with no worked example', () => {
    expect(parse({ ...valid, examples: [] })).toBeNull();
  });

  it('rejects an example with a single step', () => {
    const thin = { ...valid, examples: [{ ...valid.examples[0], steps: [{ he: 'רק צעד אחד' }] }] };
    expect(parse(thin)).toBeNull();
  });

  it('drops explanation blocks that mix LaTeX into Hebrew prose', () => {
    // A formula inside a Hebrew sentence is reordered by the bidi algorithm,
    // so such a block is discarded rather than displayed mangled.
    const mixed = {
      ...valid,
      explanation: [
        { kind: 'text', he: 'הנוסחה היא $2\\pi r$ תמיד' },
        ...valid.explanation,
      ],
    };
    const lesson = parse(mixed);
    expect(lesson!.explanation).toHaveLength(3);
  });

  it('drops prose containing a bare signed number', () => {
    const signed = {
      ...valid,
      mistakes: [{ wrongHe: 'כותבים -5 במקום 5', whyHe: 'בלבול', fixHe: 'לשים לב' }],
    };
    expect(parse(signed)!.mistakes).toHaveLength(0);
  });

  it('ignores unknown block kinds instead of failing the whole lesson', () => {
    const withJunk = {
      ...valid,
      explanation: [{ kind: 'video', url: 'http://x' }, ...valid.explanation],
    };
    expect(parse(withJunk)!.explanation).toHaveLength(3);
  });

  it('rejects a callout with an invented tone', () => {
    const bad = {
      ...valid,
      explanation: [
        { kind: 'callout', tone: 'danger', he: 'זהירות' },
        ...valid.explanation,
      ],
    };
    expect(parse(bad)!.explanation).toHaveLength(3);
  });

  it('caps the length, so a generated lesson stays as short as a written one', () => {
    const long = {
      ...valid,
      explanation: Array.from({ length: 20 }, (_, i) => ({ kind: 'text', he: `בלוק ${i}` })),
      examples: Array.from({ length: 9 }, () => valid.examples[0]),
    };
    const lesson = parse(long)!;
    expect(lesson.explanation.length).toBeLessThanOrEqual(6);
    expect(lesson.examples.length).toBeLessThanOrEqual(3);
  });

  it('rejects prose, HTML and empty input outright', () => {
    for (const raw of ['', 'לא הצלחתי', '<script>alert(1)</script>', '{}']) {
      expect(parseLesson(raw, TOPIC, 'claude-opus-5'), raw).toBeNull();
    }
  });
});
