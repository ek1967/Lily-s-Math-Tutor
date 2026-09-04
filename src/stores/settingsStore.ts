import { create } from 'zustand';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';
import { readJson, writeJson } from '@/lib/storage';

const KEY = 'lmt.settings.v1';

interface SettingsState {
  settings: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: readJson<AppSettings>(KEY, DEFAULT_SETTINGS),
  set: (patch) => {
    const next = { ...get().settings, ...patch };
    writeJson(KEY, next);
    set({ settings: next });
    applyTheme(next);
  },
  reset: () => {
    writeJson(KEY, DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
    applyTheme(DEFAULT_SETTINGS);
  },
}));

/** Writes the theme onto <html> as data attributes; tokens.css does the rest. */
export function applyTheme(s: AppSettings): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = s.themeMode === 'dark' || (s.themeMode === 'system' && prefersDark);
  root.dataset['theme'] = dark ? 'dark' : 'light';
  root.dataset['accent'] = s.themeColor;
  root.dataset['font'] = s.fontScale;
}

/** Keeps "system" honest when the OS flips theme while the app is open. */
export function watchSystemTheme(): () => void {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq) return () => {};
  const onChange = () => {
    const { settings } = useSettings.getState();
    if (settings.themeMode === 'system') applyTheme(settings);
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
