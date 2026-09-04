import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, useSettings } from '@/stores/settingsStore';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { readJson } from '@/lib/storage';

describe('theme application', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettings.getState().reset();
  });

  it('writes theme, accent and font scale onto <html>', () => {
    applyTheme({ ...DEFAULT_SETTINGS, themeMode: 'dark', themeColor: 'teal', fontScale: 'l' });
    const root = document.documentElement;
    expect(root.dataset['theme']).toBe('dark');
    expect(root.dataset['accent']).toBe('teal');
    expect(root.dataset['font']).toBe('l');
  });

  it('resolves "system" against the OS preference', () => {
    applyTheme({ ...DEFAULT_SETTINGS, themeMode: 'system' });
    // The test stub reports matches:false, i.e. a light OS theme.
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('persists a change and reloads it from localStorage', () => {
    useSettings.getState().set({ studentName: 'לילי', dailyGoalMinutes: 20 });
    const raw = localStorage.getItem('lmt.settings.v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ studentName: 'לילי', dailyGoalMinutes: 20 });
  });

  it('fills in fields missing from older stored settings', () => {
    localStorage.setItem('lmt.settings.v1', JSON.stringify({ studentName: 'לילי' }));
    // A settings blob written by an earlier version must not yield undefined fields.
    const loaded = readJson('lmt.settings.v1', DEFAULT_SETTINGS);
    expect(loaded.themeColor).toBe(DEFAULT_SETTINGS.themeColor);
    expect(loaded.studentName).toBe('לילי');
  });
});
