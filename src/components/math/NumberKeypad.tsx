import type { KeypadKind } from '@/types/exercise';

/**
 * Our own keypad, never the system one. On iOS the software keyboard covers
 * half the screen, hides the question, and offers autocorrect and emoji — all
 * of which are ways to lose a distractible student mid-thought. This one is
 * always visible, has large targets, and offers exactly the keys the current
 * answer type needs.
 */

interface Props {
  kind: KeypadKind;
  allowNegative: boolean;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled: boolean;
}

const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

export function NumberKeypad({
  kind,
  allowNegative,
  onKey,
  onBackspace,
  onSubmit,
  submitLabel,
  submitDisabled,
}: Props) {
  if (kind === 'none') return null;

  const showDecimal = kind === 'numeric' || kind === 'numeric-signed';
  const showSign = allowNegative && kind !== 'fraction';

  return (
    // The pad itself is laid out left-to-right: a phone keypad reads the same
    // way in every language, and mirroring it would be disorienting.
    <div dir="ltr" className="select-none">
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((d) => (
          <Key key={d} onClick={() => onKey(d)} label={d} />
        ))}
        {showSign ? (
          <Key onClick={() => onKey('-')} label="−" aria="מינוס" />
        ) : showDecimal ? (
          <Key onClick={() => onKey('.')} label="." aria="נקודה עשרונית" />
        ) : (
          <span />
        )}
        <Key onClick={() => onKey('0')} label="0" />
        <Key onClick={onBackspace} label="⌫" aria="מחיקה" />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        dir="rtl"
        className="tap mt-3 w-full rounded-lg bg-primary py-4 text-lg font-medium text-[rgb(var(--c-primary-ink))] transition active:scale-[.985] disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function Key({
  label,
  onClick,
  aria,
}: {
  label: string;
  onClick: () => void;
  aria?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria ?? label}
      className="tap h-14 rounded-lg bg-surface-2 text-2xl font-medium text-ink transition active:scale-95 hover:bg-primary-tint"
    >
      {label}
    </button>
  );
}
