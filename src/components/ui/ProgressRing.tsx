interface Props {
  /** 0..1 */
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

/**
 * A ring, not a percentage bar. It shows today filling up and stops there — no
 * "12% of the whole curriculum", which is only ever discouraging.
 */
export function ProgressRing({ value, size = 92, label, sublabel }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
                className="stroke-line" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      <div className="absolute text-center leading-tight">
        {label && <div className="text-lg font-semibold">{label}</div>}
        {sublabel && <div className="text-sm text-ink-soft">{sublabel}</div>}
      </div>
    </div>
  );
}
