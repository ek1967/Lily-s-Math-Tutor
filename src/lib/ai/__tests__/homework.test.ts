import { describe, expect, it } from 'vitest';
import { parseWorksheet } from '@/lib/ai/homework';
import { asTopicId } from '@/types/curriculum';

const valid = {
  titleHe: 'דף עבודה בשברים',
  exercises: [
    { labelHe: '1', promptHe: 'חשבי את הסכום', promptTex: '\\frac{1}{2} + \\frac{1}{3}', topicId: 'num-fractions-add-sub' },
    { labelHe: '2א', promptHe: 'צמצמי את השבר', promptTex: '\\frac{6}{8}', topicId: 'num-fractions-compare' },
  ],
};

describe('reading a worksheet', () => {
  const parse = (data: unknown) => parseWorksheet(JSON.stringify(data));

  it('reads a well-formed sheet', () => {
    const reading = parse(valid)!;
    expect(reading.titleHe).toBe('דף עבודה בשברים');
    expect(reading.exercises).toHaveLength(2);
    expect(reading.exercises[0]!.topicId).toBe(asTopicId('num-fractions-add-sub'));
    expect(reading.exercises[0]!.done).toBe(false);
  });

  it('drops an exercise whose Hebrew carries LaTeX', () => {
    // Left mixed, the formula would be reordered by the bidi algorithm.
    const mixed = {
      ...valid,
      exercises: [{ labelHe: '1', promptHe: 'חשבי $\\frac{1}{2}$ ועוד' }, ...valid.exercises],
    };
    expect(parse(mixed)!.exercises).toHaveLength(2);
  });

  it('ignores a topic id that does not exist', () => {
    const bogus = {
      ...valid,
      exercises: [{ labelHe: '1', promptHe: 'משהו', topicId: 'not-a-real-topic' }],
    };
    expect(parse(bogus)!.exercises[0]!.topicId).toBeUndefined();
  });

  it('substitutes a placeholder label rather than dropping the exercise', () => {
    const unlabelled = { ...valid, exercises: [{ promptHe: 'תרגיל בלי מספר' }] };
    expect(parse(unlabelled)!.exercises[0]!.labelHe).toBe('—');
  });

  it('falls back to a generic title', () => {
    expect(parse({ exercises: valid.exercises })!.titleHe).toBe('דף עבודה');
  });

  it('reports an empty sheet rather than inventing exercises', () => {
    // An unreadable photo must produce nothing, so the UI can ask for a retake.
    expect(parse({ titleHe: 'ריק', exercises: [] })!.exercises).toEqual([]);
  });

  it('rejects prose, malformed JSON and missing fields', () => {
    for (const raw of ['', 'לא הצלחתי לקרוא', '{"exercises":', '{}']) {
      expect(parseWorksheet(raw), raw).toBeNull();
    }
  });

  it('caps a very long sheet', () => {
    const many = {
      titleHe: 'ארוך',
      exercises: Array.from({ length: 90 }, (_, i) => ({ labelHe: String(i), promptHe: 'תרגיל' })),
    };
    expect(parse(many)!.exercises.length).toBeLessThanOrEqual(40);
  });
});
