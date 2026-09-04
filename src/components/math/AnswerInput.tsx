import type { Answer, InputSpec } from '@/types/exercise';
import { MathInline } from '@/lib/math/Katex';

/**
 * The answer field. She never types LaTeX and never composes a fraction as
 * "1/2" — a fraction gets two boxes, a choice gets big tappable cards, and a
 * pair answer gets one labelled field per part.
 */

interface Props {
  input: InputSpec;
  answer: Answer;
  value: string | string[];
  onChange: (v: string | string[]) => void;
  /** Which sub-field the keypad is currently typing into. */
  activePart: number;
  onActivePart: (i: number) => void;
  disabled: boolean;
  onSubmit: () => void;
}

export function AnswerInput(props: Props) {
  const { input, answer } = props;

  if (input.kind === 'choice' && answer.kind === 'choice') {
    return <ChoiceGrid {...props} answer={answer} />;
  }
  if (input.kind === 'fraction') {
    const mustReduce = answer.kind === 'fraction' && answer.requireReduced;
    return (
      <div className="space-y-2">
        <FractionInput {...props} />
        {mustReduce && (
          // On the field rather than in the question: less to read up front,
          // and it is a rule about the answer, not part of the maths.
          <p className="text-center text-sm text-ink-soft">אם אפשר לצמצם — לצמצם</p>
        )}
      </div>
    );
  }
  if (input.kind === 'tuple' && answer.kind === 'tuple') {
    return <TupleInput {...props} labels={answer.labelsHe} />;
  }
  return <SingleField {...props} />;
}

function fieldClass(active: boolean, disabled: boolean): string {
  return [
    'tap flex h-14 min-w-[4.5rem] items-center justify-center rounded-lg border-2 px-4',
    'text-2xl transition',
    active ? 'border-primary bg-primary-tint' : 'border-line bg-surface',
    disabled ? 'opacity-70' : '',
  ].join(' ');
}

function SingleField({ input, value, disabled, onActivePart }: Props) {
  const text = Array.isArray(value) ? (value[0] ?? '') : value;
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onActivePart(0)}
        disabled={disabled}
        className={fieldClass(true, disabled)}
        aria-label="התשובה שלי"
      >
        {/* The value is digits and a minus, so it renders LTR. */}
        <span dir="ltr" className="ltr font-medium">
          {text || <span className="text-ink-soft">?</span>}
        </span>
      </button>
      {input.unitHe && <span className="text-lg text-ink-soft">{input.unitHe}</span>}
    </div>
  );
}

/** Numerator over denominator, each its own box — no slash to type or misread. */
function FractionInput({ value, disabled, activePart, onActivePart }: Props) {
  const parts = Array.isArray(value) ? value : [value, ''];
  return (
    <div className="flex justify-center">
      <div dir="ltr" className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => onActivePart(0)}
          disabled={disabled}
          className={fieldClass(activePart === 0, disabled)}
          aria-label="מונה"
        >
          {parts[0] || <span className="text-ink-soft">?</span>}
        </button>
        <span aria-hidden="true" className="h-0.5 w-24 rounded bg-ink" />
        <button
          type="button"
          onClick={() => onActivePart(1)}
          disabled={disabled}
          className={fieldClass(activePart === 1, disabled)}
          aria-label="מכנה"
        >
          {parts[1] || <span className="text-ink-soft">?</span>}
        </button>
      </div>
    </div>
  );
}

function TupleInput({ value, disabled, activePart, onActivePart, labels }: Props & { labels: string[] }) {
  const parts = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      {labels.map((label, i) => (
        <div key={label} className="text-center">
          <div className="mb-1 text-sm text-ink-soft">{label}</div>
          <button
            type="button"
            onClick={() => onActivePart(i)}
            disabled={disabled}
            className={fieldClass(activePart === i, disabled)}
          >
            <span dir="ltr" className="ltr">
              {parts[i] || <span className="text-ink-soft">?</span>}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function ChoiceGrid({
  answer,
  value,
  onChange,
  disabled,
  onSubmit,
}: Props & { answer: Extract<Answer, { kind: 'choice' }> }) {
  const selected = Array.isArray(value) ? value[0] : value;
  return (
    <div className="grid gap-2">
      {answer.options.map((opt, i) => {
        const isSelected = selected === String(i);
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(String(i));
              onSubmit();
            }}
            className={[
              'tap rounded-lg border-2 px-4 py-4 text-start text-lg transition',
              isSelected ? 'border-primary bg-primary-tint' : 'border-line bg-surface',
              disabled ? 'opacity-70' : 'hover:bg-surface-2',
            ].join(' ')}
          >
            {'tex' in opt ? <MathInline tex={opt.tex} /> : opt.he}
          </button>
        );
      })}
    </div>
  );
}
