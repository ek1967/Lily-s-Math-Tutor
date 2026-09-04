import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { allGenerators, registerAllGenerators } from '@/generators';
import { createExercise } from '@/generators/make';
import { canonicalInput, checkAnswer } from '@/generators/verify';
import { frac, gcd, toPlain, toTex } from '@/generators/fraction';
import type { Answer, Exercise } from '@/types/exercise';

registerAllGenerators();

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const HEBREW = /[֐-׿]/;

/** Every rendered form of the answer that a solution might legitimately show. */
function answerForms(a: Answer): string[] {
  switch (a.kind) {
    case 'integer':
      return [String(a.value)];
    case 'decimal':
      return [a.value.toFixed(a.decimals), String(a.value)];
    case 'fraction': {
      const f = frac(a.num, a.den);
      return [toTex(f), toPlain(f), String(f.n), `\\frac{${Math.abs(f.n)}}{${f.d}}`];
    }
    case 'expression':
      return [a.canonical, ...a.acceptedForms];
    case 'choice':
      return a.options.flatMap((o) => ('tex' in o ? [o.tex] : [o.he]));
    case 'tuple':
      return a.parts.flatMap(answerForms);
  }
}

function everyString(ex: Exercise): string[] {
  return [
    ex.promptHe,
    ex.promptTex ?? '',
    ...ex.hints.flatMap((h) => [h.he, h.tex ?? '']),
    ...ex.solution.flatMap((s) => [s.he, s.tex ?? '']),
  ];
}

function everyTex(ex: Exercise): string[] {
  const out: string[] = [];
  if (ex.promptTex) out.push(ex.promptTex);
  for (const h of ex.hints) if (h.tex) out.push(h.tex);
  for (const s of ex.solution) if (s.tex) out.push(s.tex);
  if (ex.answer.kind === 'choice') {
    for (const o of ex.answer.options) if ('tex' in o) out.push(o.tex);
  }
  return out;
}

const MAX_INTEGER_ANSWER: Record<1 | 2 | 3, number> = { 1: 200, 2: 500, 3: 2000 };

describe('generator contract', () => {
  const generators = allGenerators();

  it('registers at least one generator', () => {
    expect(generators.length).toBeGreaterThan(0);
  });

  describe.each(generators.map((g) => [g.id, g] as const))('%s', (_id, gen) => {
    const exercises = SEEDS.map((seed) => createExercise(gen, seed));

    it('points at a real topic', () => {
      expect(TOPIC_BY_ID.has(gen.topicId)).toBe(true);
    });

    it('is pure — the same seed produces an identical exercise', () => {
      for (const seed of [1, 7, 42, 199]) {
        expect(createExercise(gen, seed)).toEqual(createExercise(gen, seed));
      }
    });

    it('stamps a stable, reproducible id', () => {
      for (const ex of exercises.slice(0, 20)) {
        expect(ex.id).toBe(`${gen.id}#${ex.seed}`);
        expect(ex.generatorId).toBe(gen.id);
        expect(ex.topicId).toBe(gen.topicId);
      }
    });

    // The one that matters most: an exercise whose own correct answer is
    // rejected would tell her she is wrong when she is right.
    it('accepts its own answer', () => {
      for (const ex of exercises) {
        const verdict = checkAnswer(ex.answer, canonicalInput(ex.answer));
        expect(verdict.correct, `seed ${ex.seed}: ${ex.promptTex ?? ex.promptHe}`).toBe(true);
      }
    });

    it('rejects an empty answer rather than accepting it', () => {
      for (const ex of exercises.slice(0, 30)) {
        expect(checkAnswer(ex.answer, '').correct).toBe(false);
      }
    });

    it('produces no NaN, undefined or unfilled placeholder', () => {
      for (const ex of exercises) {
        for (const s of everyString(ex)) {
          expect(s, `seed ${ex.seed}`).not.toMatch(/NaN|undefined|null|\{\{|\}\}/);
        }
      }
    });

    it('writes Hebrew prose without LaTeX in it', () => {
      // Mixing the two in one string is what lets the bidi algorithm reorder a
      // formula; maths goes in `tex` and is rendered in an isolated LTR box.
      for (const ex of exercises) {
        expect(ex.promptHe.trim()).not.toBe('');
        expect(HEBREW.test(ex.promptHe), `seed ${ex.seed}: ${ex.promptHe}`).toBe(true);
        for (const he of [ex.promptHe, ...ex.hints.map((h) => h.he), ...ex.solution.map((s) => s.he)]) {
          expect(he, `seed ${ex.seed}: ${he}`).not.toMatch(/[$\\]/);
        }
      }
    });

    it('keeps signed numbers out of Hebrew prose', () => {
      // A bare "-20" inside a Hebrew sentence is reordered by the bidi
      // algorithm and displays as "20-", which reads as a subtraction. Signed
      // values belong in `tex`, where they render inside an isolated LTR box.
      for (const ex of exercises) {
        const prose = [
          ex.promptHe,
          ...ex.hints.map((h) => h.he),
          ...ex.solution.map((s) => s.he),
        ];
        for (const he of prose) {
          expect(he, `seed ${ex.seed}: signed number in Hebrew prose — "${he}"`).not.toMatch(
            /-\s?\d/,
          );
        }
      }
    });

    it('gives exactly three distinct, non-empty hints', () => {
      for (const ex of exercises) {
        expect(ex.hints).toHaveLength(3);
        expect(ex.hints.map((h) => h.level)).toEqual([1, 2, 3]);
        const texts = ex.hints.map((h) => `${h.he}|${h.tex ?? ''}`);
        for (const h of ex.hints) expect(h.he.trim(), `seed ${ex.seed}`).not.toBe('');
        expect(new Set(texts).size, `seed ${ex.seed}: duplicate hints`).toBe(3);
      }
    });

    it('shows a solution that actually reaches the answer', () => {
      for (const ex of exercises) {
        expect(ex.solution.length, `seed ${ex.seed}`).toBeGreaterThan(0);
        const shown = ex.solution.map((s) => `${s.he} ${s.tex ?? ''}`).join(' ');
        const forms = answerForms(ex.answer);
        expect(
          forms.some((f) => shown.includes(f)),
          `seed ${ex.seed}: solution never shows the answer (${forms[0]})`,
        ).toBe(true);
      }
    });

    it('emits only TeX that KaTeX can render', () => {
      for (const ex of exercises) {
        for (const tex of everyTex(ex)) {
          expect(
            () => katex.renderToString(tex, { throwOnError: true, displayMode: false }),
            `seed ${ex.seed}: ${tex}`,
          ).not.toThrow();
        }
      }
    });

    it('keeps answers within a sane magnitude for its difficulty', () => {
      const limit = MAX_INTEGER_ANSWER[gen.difficulty];
      for (const ex of exercises) {
        if (ex.answer.kind === 'integer') {
          expect(Math.abs(ex.answer.value), `seed ${ex.seed}`).toBeLessThanOrEqual(limit);
        }
        if (ex.answer.kind === 'fraction') {
          expect(ex.answer.den, `seed ${ex.seed}`).not.toBe(0);
          expect(ex.answer.den, `seed ${ex.seed}`).toBeGreaterThan(0);
          // A stored fraction answer is always already in lowest terms.
          expect(gcd(ex.answer.num, ex.answer.den), `seed ${ex.seed}`).toBe(1);
        }
        if (ex.answer.kind === 'decimal') {
          expect(Number.isFinite(ex.answer.value)).toBe(true);
          expect(ex.answer.tolerance).toBeGreaterThan(0);
        }
      }
    });

    it('declares an input that matches the answer it expects', () => {
      for (const ex of exercises.slice(0, 30)) {
        expect(ex.input.kind).toBe(ex.answer.kind);
        if (ex.answer.kind === 'integer' && ex.answer.value < 0) {
          expect(ex.input.allowNegative, `seed ${ex.seed}`).toBe(true);
        }
      }
    });

    it('varies enough across seeds to not feel repetitive', () => {
      // A degenerate parameter space means she sees the same question all week.
      const distinct = new Set(exercises.map((e) => `${e.promptHe}|${e.promptTex ?? ''}`));
      expect(distinct.size / exercises.length).toBeGreaterThan(0.6);
    });
  });
});
