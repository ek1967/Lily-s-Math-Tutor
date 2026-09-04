/**
 * Turns an SDK or network failure into something she can act on. A raw stack
 * trace in the middle of homework is worse than useless — it reads as "you
 * broke it".
 */
export interface AiError {
  he: string;
  /** Whether trying the same thing again is likely to help. */
  retryable: boolean;
  /** True when the parent needs to do something (key, billing). */
  needsParent: boolean;
}

export function describeError(err: unknown): AiError {
  const status = typeof err === 'object' && err !== null && 'status' in err
    ? Number((err as { status: unknown }).status)
    : undefined;

  if (status === 401 || status === 403) {
    return {
      he: 'המפתח לא תקין או שפג תוקפו. צריך לעדכן אותו בהגדרות.',
      retryable: false,
      needsParent: true,
    };
  }
  if (status === 429) {
    return {
      he: 'יותר מדי בקשות ברצף. אפשר לחכות רגע ולנסות שוב.',
      retryable: true,
      needsParent: false,
    };
  }
  if (status === 400) {
    return {
      he: 'משהו בבקשה לא תקין. אם זו תמונה — כדאי לצלם שוב.',
      retryable: false,
      needsParent: false,
    };
  }
  if (status !== undefined && status >= 500) {
    return {
      he: 'השירות לא זמין כרגע. שווה לנסות שוב בעוד רגע.',
      retryable: true,
      needsParent: false,
    };
  }

  const message = err instanceof Error ? err.message : '';
  if (/credit|billing|quota/i.test(message)) {
    return {
      he: 'נגמר התקציב בחשבון. צריך לטפל בזה בקונסולה של Anthropic.',
      retryable: false,
      needsParent: true,
    };
  }
  if (/network|fetch|Failed to fetch/i.test(message)) {
    return {
      he: 'אין חיבור לאינטרנט. התרגול עדיין עובד גם בלי חיבור.',
      retryable: true,
      needsParent: false,
    };
  }

  return {
    he: 'משהו השתבש. אפשר לנסות שוב.',
    retryable: true,
    needsParent: false,
  };
}
