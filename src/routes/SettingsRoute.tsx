import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card } from '@/components/ui';
import { useSettings } from '@/stores/settingsStore';
import { THEME_COLORS, type FontScale, type ThemeMode } from '@/types/settings';
import { clearApiKey, getApiKey, looksLikeApiKey, maskApiKey, setApiKey } from '@/lib/security/apiKey';
import { resetClient } from '@/lib/ai/client';
import { MODELS } from '@/lib/ai/models';

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

      <ApiKeyPanel />

      <Card>
        <h2 className="mb-3 text-lg">המורה</h2>
        <label className="block">
          <span className="mb-1 block text-sm text-ink-soft">שם המורה</span>
          <input
            value={settings.tutorName}
            onChange={(e) => set({ tutorName: e.target.value })}
            className="tap w-full rounded-md border border-line bg-surface px-3 py-2"
          />
        </label>
        <div className="mt-4">
          <div className="mb-2 text-sm text-ink-soft">איזה מודל להשתמש</div>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={settings.model === m.id}
                onClick={() => set({ model: m.id })}
                className={[
                  'tap w-full rounded-md px-3 py-3 text-start transition',
                  settings.model === m.id
                    ? 'bg-primary-tint text-primary-strong'
                    : 'bg-surface-2 hover:bg-primary-tint/60',
                ].join(' ')}
              >
                <span className="block font-medium">{m.labelHe}</span>
                <span className="block text-sm text-ink-soft">{m.descriptionHe}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg">לימוד</h2>
        <label className="tap flex items-center justify-between gap-4">
          <span>
            <span className="block">להציג גם נושאי העשרה</span>
            <span className="block text-sm text-ink-soft">
              נושאים מתקדמים שלא חייבים כרגע. כבוי כברירת מחדל.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.showExtensionTopics}
            onChange={(e) => set({ showExtensionTopics: e.target.checked })}
            className="h-6 w-6 shrink-0 accent-[rgb(var(--c-primary))]"
          />
        </label>
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

/**
 * The key panel. It is blunt about what storing a key in a browser means,
 * because a parent deciding whether to paste one deserves to know — and the
 * mitigation that actually bounds the risk is theirs to apply, not ours.
 */
function ApiKeyPanel() {
  const [stored, setStored] = useState(() => getApiKey());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (!looksLikeApiKey(draft)) {
      setError('המפתח אמור להתחיל ב-sk-ant. כדאי להעתיק אותו שוב.');
      return;
    }
    setApiKey(draft);
    resetClient();
    setStored(getApiKey());
    setDraft('');
    setError('');
  };

  const remove = () => {
    clearApiKey();
    resetClient();
    setStored(null);
  };

  return (
    <Card>
      <h2 className="mb-1 text-lg">חיבור המורה</h2>
      <p className="mb-3 text-sm text-ink-soft">
        התרגול והשיעורים עובדים בלי זה. המפתח נדרש רק לצ׳אט עם המורה ולעזרה
        בשיעורי בית.
      </p>

      {stored ? (
        <div className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-3">
          <span dir="ltr" className="ltr truncate font-mono text-sm">
            {maskApiKey(stored)}
          </span>
          <Button size="sm" variant="ghost" onClick={remove}>
            הסרה
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="password"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
            }}
            dir="ltr"
            placeholder="sk-ant-..."
            autoComplete="off"
            className="ltr w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm"
          />
          {error && <p className="text-sm text-almost">{error}</p>}
          <Button block onClick={save} disabled={draft.trim() === ''}>
            שמירה
          </Button>
        </div>
      )}

      <details className="mt-3">
        <summary className="tap cursor-pointer text-sm text-primary">
          איפה משיגים מפתח, ומה חשוב לדעת
        </summary>
        <div className="mt-2 space-y-2 text-sm text-ink-soft">
          <p>
            נכנסים לקונסולה של Anthropic, יוצרים מפתח חדש, ומעתיקים אותו לכאן.
          </p>
          <p>
            המפתח נשמר בדפדפן של המכשיר הזה בלבד ולא נשלח לשום מקום חוץ מ-Anthropic.
            עם זאת — מי שיש לו גישה למכשיר יכול לקרוא אותו.
          </p>
          <p>
            לכן כדאי ליצור מפתח ייעודי לאפליקציה הזו ולהגדיר לו תקרת הוצאה חודשית
            בקונסולה. כך המקרה הגרוע ביותר הוא חשבון שנעצר, ולא הפתעה בסוף החודש.
          </p>
        </div>
      </details>
    </Card>
  );
}
