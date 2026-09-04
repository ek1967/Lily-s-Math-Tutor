import { describe, expect, it } from 'vitest';
import { allGenerators, registerAllGenerators } from '@/generators';
import { createExercise } from '@/generators/make';

registerAllGenerators();

/**
 * Snapshots of the first 25 seeds of every generator. The value is in review:
 * any change to wording or to the numbers shows up as a readable Hebrew diff,
 * so content edits cannot slip through unnoticed.
 */
describe('generator golden output', () => {
  it.each(allGenerators().map((g) => [g.id, g] as const))('%s', (_id, gen) => {
    const sample = Array.from({ length: 25 }, (_, i) => {
      const ex = createExercise(gen, i + 1);
      return {
        seed: ex.seed,
        prompt: [ex.promptHe, ex.promptTex].filter(Boolean).join('  '),
        answer: ex.answer,
        hints: ex.hints.map((h) => [h.he, h.tex].filter(Boolean).join('  ')),
        solution: ex.solution.map((s) => [s.he, s.tex].filter(Boolean).join('  ')),
      };
    });
    expect(sample).toMatchSnapshot();
  });
});
