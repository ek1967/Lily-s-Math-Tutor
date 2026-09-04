import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { useSettings } from '@/stores/settingsStore';
import { THEME_COLORS, type FontScale, type ThemeMode } from '@/types/settings';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
  { value: 'system', label: 'לפי המכשיר' },
];

const SCALES: { value: FontScale; label: string }[] = [
  { value: 's', label: 'רגיל' },
  { value: 'm', label: 'גדול' },
  { value: 'l', label: 'גדול מאוד' },
];

const COLOR_LABELS: Record<(typeof THEME_COLORS)[number], string> = {
  plum: 'סגול',
  teal: 'טורקיז',
  rose: 'ורוד',
  amber: 'כתום',
  forest: 'ירוק',
  indigo: 'כחול',
};

export function SettingsRoute() {
  const { settings, set } = useSettings();

  return (
    <div className="space-y-4">
      <PageHeader title="הגדרות" />

      <Card>
        <h2 className="mb-3 text-lg">הצבע שלי</h2>
        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ themeColor: c })}
              aria-label={COLOR_LABELS[c]}
              aria-pressed={settings.themeColor === c}
              data-accent={c}
              className={[
                'tap h-12 w-12 rounded-full border-2 bg-primary transition',
                settings.themeColor === c ? 'border-ink scale-105' : 'border-transparent',
              ].join(' ')}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg">תצוגה</h2>
        <Choice
          label="מצב"
          options={MODES}
          value={settings.themeMode}
          onChange={(v) => set({ themeMode: v })}
        />
        <div className="h-4" />
        <Choice
          label="גודל טקסט"
          options={SCALES}
          value={settings.fontScale}
          onChange={(v) => set({ fontScale: v })}
        />
      </Card>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm text-ink-soft">{label}</div>
      <div role="group" aria-label={label} className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={[
              'tap flex-1 rounded-md px-3 py-2 text-base transition',
              value === o.value
                ? 'bg-primary-tint font-medium text-primary-strong'
                : 'bg-surface-2 text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
