import type { ReactNode } from 'react';
import { Button, Card } from '@/components/ui';
import { useSettings } from '@/stores/settingsStore';

/**
 * Enforces the consent the onboarding screen asks for.
 *
 * `aiConsentAt` was being written and never read: the app said in plain Hebrew
 * that sending photographs of a minor's schoolwork to a third party needs a
 * parent's agreement, and then nothing checked. A promise about a child's data
 * that no code enforces is worse than not making it, so the AI paths now stand
 * behind it.
 *
 * Consent can be given here rather than sending anyone back through onboarding,
 * because the person who needs to give it is usually standing right there.
 */
export function ConsentGate({ children }: { children: ReactNode }) {
  const { settings, set } = useSettings();

  if (settings.aiConsentAt !== null) return <>{children}</>;

  return (
    <Card>
      <h2 className="text-lg">רגע אחד להורים</h2>
      <p className="mt-2">
        כדי לקרוא דף עבודה או לדבר עם המורה, הטקסט והתמונות נשלחים ל-Anthropic. זה
        כולל צילומים של שיעורי בית של {settings.studentName}.
      </p>
      <p className="mt-2 text-ink-soft">
        התרגול, השיעורים והחזרות עובדים לגמרי בלי זה, וגם בלי אינטרנט.
      </p>
      <Button block className="mt-3" onClick={() => set({ aiConsentAt: Date.now() })}>
        אנחנו מאשרים
      </Button>
    </Card>
  );
}
