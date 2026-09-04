import katex from 'katex';
import { beforeAll, describe, expect, it } from 'vitest';
import { LESSONS, authoredLessons } from '@/data/lessons';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { generatorsForTopic, registerAllGenerators } from '@/generators';
import type { RichBlock } from '@/types/content';

beforeAll(() => registerAllGenerators());

const HEBREW = /[֐-׿]/;

/** Every Hebrew string in a lesson, however deeply nested. */
function proseOf(block: RichBlock): string[] {
  switch (block.kind) {
    case 'text':
    case 'callout':
      return [block.he];
    case 'math':
      return block.captionHe ? [block.captionHe] : [];
    case 'mixed':
      return block.parts.flatMap((p) => ('he' in p ? [p.he] : []));
    case 'list':
      return block.items.flatMap(proseOf);
    case 'table':
      return [...block.headerHe, ...block.rows.flat()];
  }
}

function texOf(block: RichBlock): string[] {
  switch (block.kind) {
    case 'math':
      return [block.tex];
    case 'mixed':
      return block.parts.flatMap((p) => ('tex' in p ? [p.tex] : []));
    case 'list':
      return block.items.flatMap(texOf);
    default:
      return [];
  }
}

describe('authored lessons', () => {
  const lessons = authoredLessons();

  it('has content for the topics that most need it', () => {
    expect(lessons.length).toBeGreaterThanOrEqual(10);
  });

  it('points every lesson at a real topic', () => {
    for (const l of lessons) expect(TOPIC_BY_ID.has(l.topicId), l.topicId).toBe(true);
  });

  it('has one lesson per topic', () => {
    expect(LESSONS.size).toBe(lessons.length);
  });

  it('covers every topic that has exercises', () => {
    // A topic she can practise but cannot read about is a topic she can only
    // fail at. Where there are generators, there must be teaching.
    const withGenerators = [...TOPIC_BY_ID.keys()].filter(
      (id) => generatorsForTopic(id).length > 0,
    );
    const missing = withGenerators.filter((id) => !LESSONS.has(id));
    expect(missing).toEqual([]);
  });

  describe.each(lessons.map((l) => [l.topicId, l] as const))('%s', (_id, lesson) => {
    it('opens with a reason to care', () => {
      expect(lesson.hookHe.trim()).not.toBe('');
      expect(HEBREW.test(lesson.hookHe)).toBe(true);
    });

    it('stays short enough to hold attention', () => {
      // A wall of text is where a distractible reader stops.
      expect(lesson.explanation.length).toBeGreaterThan(1);
      expect(lesson.explanation.length).toBeLessThanOrEqual(6);
    });

    it('keeps LaTeX out of Hebrew prose', () => {
      const prose = [
        lesson.hookHe,
        ...lesson.explanation.flatMap(proseOf),
        ...lesson.examples.flatMap((e) => [e.promptHe, ...e.steps.flatMap((s) => [s.he, s.whyHe ?? ''])]),
        ...lesson.mistakes.flatMap((m) => [m.wrongHe, m.whyHe, m.fixHe]),
        ...lesson.vocab.flatMap((v) => [v.termHe, v.defHe]),
      ];
      for (const s of prose) {
        expect(s, `${lesson.topicId}: ${s}`).not.toMatch(/[$\\]/);
        // A bare signed number in Hebrew prose is reordered by the bidi
        // algorithm and displays with the minus on the wrong side.
        expect(s, `${lesson.topicId}: ${s}`).not.toMatch(/-\s?\d/);
      }
    });

    it('emits only TeX that KaTeX can render', () => {
      const tex = [
        ...lesson.explanation.flatMap(texOf),
        ...lesson.examples.flatMap((e) => [
          e.promptTex ?? '',
          e.answerTex,
          ...e.steps.map((s) => s.tex ?? ''),
        ]),
        ...lesson.mistakes.map((m) => m.wrongTex ?? ''),
      ].filter(Boolean);
      for (const t of tex) {
        expect(
          () => katex.renderToString(t, { throwOnError: true }),
          `${lesson.topicId}: ${t}`,
        ).not.toThrow();
      }
    });

    it('works through at least two examples, with steps', () => {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(2);
      for (const e of lesson.examples) {
        expect(e.steps.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.answerTex.trim(), e.id).not.toBe('');
        expect(e.promptHe.trim(), e.id).not.toBe('');
      }
    });

    it('names the common mistakes and why they are tempting', () => {
      // Naming why an error is tempting is what stops it recurring; a list of
      // "don't do this" without the reason just adds more to remember.
      expect(lesson.mistakes.length).toBeGreaterThanOrEqual(2);
      for (const m of lesson.mistakes) {
        expect(m.wrongHe.trim()).not.toBe('');
        expect(m.whyHe.trim()).not.toBe('');
        expect(m.fixHe.trim()).not.toBe('');
      }
    });

    it('defines its vocabulary', () => {
      expect(lesson.vocab.length).toBeGreaterThanOrEqual(2);
      for (const v of lesson.vocab) {
        expect(v.termHe.trim()).not.toBe('');
        expect(v.defHe.trim()).not.toBe('');
      }
    });

    it('is marked as hand-written', () => {
      expect(lesson.source).toBe('authored');
      expect(lesson.version).toBeGreaterThanOrEqual(1);
    });
  });
});
