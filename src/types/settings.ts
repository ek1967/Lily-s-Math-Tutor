/** The six accent colours she can pick from during onboarding. Ownership of the
 *  look is cheap to build and matters a lot at 13. */
export const THEME_COLORS = ['plum', 'teal', 'rose', 'amber', 'forest', 'indigo'] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScale = 's' | 'm' | 'l';

/** How much the tutor is allowed to give away on homework. `reveal` is the one
 *  setting a parent locks behind the PIN. */
export type AnswerMode = 'guide' | 'check' | 'reveal';

export interface AppSettings {
  studentName: string;
  /** She names the tutor herself in onboarding. */
  tutorName: string;
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  fontScale: FontScale;
  dailyGoalMinutes: 8 | 12 | 20;
  soundEnabled: boolean;
  speechEnabled: boolean;
  /** Off by default: הקבצה ג' should not be shown topics it does not need. */
  showExtensionTopics: boolean;
  answerMode: AnswerMode;
  model: string;
  hasOnboarded: boolean;
  /** Explicit parent consent to send photos of a minor's schoolwork to the API. */
  aiConsentAt: number | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  studentName: 'לילי',
  tutorName: 'מיה',
  themeColor: 'plum',
  themeMode: 'system',
  fontScale: 'm',
  dailyGoalMinutes: 12,
  soundEnabled: true,
  speechEnabled: true,
  showExtensionTopics: false,
  answerMode: 'guide',
  model: 'claude-opus-5',
  hasOnboarded: false,
  aiConsentAt: null,
};

export interface ParentSettings {
  pinHash: string | null;
  pinSalt: string | null;
  lastExportAt: number | null;
  /** Soft monthly ceiling, in agorot, shown as a warning — not enforced. */
  monthlyBudgetAgorot: number;
}

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  pinHash: null,
  pinSalt: null,
  lastExportAt: null,
  monthlyBudgetAgorot: 5000,
};
