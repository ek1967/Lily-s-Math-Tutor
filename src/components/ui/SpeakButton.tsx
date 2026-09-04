import { useEffect, useState } from 'react';
import { speak, speechAvailable, stopSpeaking } from '@/lib/tts';
import { useSettings } from '@/stores/settingsStore';

/**
 * Reads a passage aloud. Only Hebrew prose is passed in — a formula read by a
 * speech synthesiser is noise, and hearing "backslash frac" would be worse than
 * silence.
 */
export function SpeakButton({ text, labelHe = 'להקריא' }: { text: string; labelHe?: string }) {
  const { settings } = useSettings();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!settings.speechEnabled || !speechAvailable() || text.trim() === '') return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? 'להפסיק את ההקראה' : labelHe}
      className="tap inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-primary hover:bg-primary-tint"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
        {speaking ? (
          <path d="M7 6h3v12H7zM14 6h3v12h-3z" />
        ) : (
          <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
        )}
      </svg>
      {speaking ? 'עצרי' : labelHe}
    </button>
  );
}
