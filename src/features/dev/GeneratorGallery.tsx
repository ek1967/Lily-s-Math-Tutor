import { useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { MathBlock, MathInline, TextWithMath } from '@/lib/math/Katex';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { allGenerators, registerAllGenerators } from '@/generators';
import { createExercise } from '@/generators/make';
import { canonicalInput, checkAnswer } from '@/generators/verify';
import type { Answer, ExerciseGenerator } from '@/types/exercise';

registerAllGenerators();

/**
 * Every generator across live seeds: prompt, answer, all three hints and the
 * full solution. This is how the Hebrew content gets read by a human, and how a
 * wrong-answer bug is found in five minutes rather than during homework.
 * Not a debug page — it is the content QA tool.
 */
export function GeneratorGallery() {
  const generators = allGenerators();
  const [selectedId, setSelectedId] = useState<string>(generators[0]?.id ?? '');
  const [firstSeed, setFirstSeed] = useState(1);
  const count = 8;

  const gen = generators.find((g) => g.id === selectedId);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl">גלריית הגנרטורים</h1>
        <p className="text-ink-soft">
          {generators.length} גנרטורים. כלי בקרת איכות — לא מסך שלילי רואה.
        </p>
      </header>

      <Card>
        <label className="block">
          <span className="mb-2 block text-sm text-ink-soft">גנרטור</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="tap w-full rounded-md border border-line bg-surface px-3 py-2"
          >
            {generators.map((g) => (
              <option key={g.id} value={g.id}>
                {TOPIC_BY_ID.get(g.topicId)?.titleHe} · {g.titleHe} · רמה {g.difficulty}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setFirstSeed((s) => Math.max(1, s - count))}>
            הקודמים
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setFirstSeed((s) => s + count)}>
            הבאים
          </Button>
          <span className="text-sm text-ink-soft">
            seeds {firstSeed}–{firstSeed + count - 1}
          </span>
        </div>
      </Card>

      {gen &&
        Array.from({ length: count }, (_, i) => (
          <SeedCard key={firstSeed + i} gen={gen} seed={firstSeed + i} />
        ))}
    </div>
  );
}

function SeedCard({ gen, seed }: { gen: ExerciseGenerator; seed: number }) {
  const ex = useMemo(() => createExercise(gen, seed), [gen, seed]);
  const selfCheck = checkAnswer(ex.answer, canonicalInput(ex.answer));

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between text-sm text-ink-soft">
        <span>seed {seed}</span>
        <span className={selfCheck.correct ? 'text-yes' : 'text-almost'}>
          {selfCheck.correct ? 'בדיקה עצמית עברה' : 'הבדיקה העצמית נכשלה'}
        </span>
      </div>

      <p className="font-medium">{ex.promptHe}</p>
      {ex.promptTex && <MathBlock tex={ex.promptTex} />}

      <p className="mt-2">
        <span className="text-ink-soft">תשובה: </span>
        <AnswerView answer={ex.answer} />
      </p>

      <details className="mt-3">
        <summary className="tap cursor-pointer text-sm text-primary">רמזים</summary>
        <ol className="mt-2 space-y-1 ps-5 text-sm">
          {ex.hints.map((h) => (
            <li key={h.level} className="list-decimal">
              <TextWithMath he={h.he} tex={h.tex} />
            </li>
          ))}
        </ol>
      </details>

      <details className="mt-2">
        <summary className="tap cursor-pointer text-sm text-primary">פתרון</summary>
        <ol className="mt-2 space-y-1 ps-5 text-sm">
          {ex.solution.map((s, i) => (
            <li key={i} className="list-decimal">
              <TextWithMath he={s.he} tex={s.tex} />
            </li>
          ))}
        </ol>
      </details>
    </Card>
  );
}

function AnswerView({ answer }: { answer: Answer }) {
  switch (answer.kind) {
    case 'integer':
      return <MathInline tex={String(answer.value)} />;
    case 'decimal':
      return <MathInline tex={answer.value.toFixed(answer.decimals)} />;
    case 'fraction':
      return (
        <MathInline
          tex={answer.den === 1 ? String(answer.num) : `\\frac{${answer.num}}{${answer.den}}`}
        />
      );
    case 'choice': {
      const opt = answer.options[answer.correctIndex];
      if (!opt) return <span>—</span>;
      return 'tex' in opt ? <MathInline tex={opt.tex} /> : <span>{opt.he}</span>;
    }
    case 'expression':
      return <MathInline tex={answer.canonical} />;
    case 'tuple':
      return (
        <span className="inline-flex flex-wrap gap-3">
          {answer.parts.map((p, i) => (
            <span key={i}>
              <span className="text-ink-soft">{answer.labelsHe[i]}: </span>
              <AnswerView answer={p} />
            </span>
          ))}
        </span>
      );
  }
}
