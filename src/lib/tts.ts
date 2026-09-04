/**
 * Reading text aloud, in Hebrew.
 *
 * Built into every browser, so it costs nothing and works offline — and for a
 * reader whose attention slides off a paragraph, hearing it while following
 * along is often the difference between reading it and not.
 *
 * Maths is deliberately not read: "\frac{1}{2}" spoken aloud is gibberish, and
 * a speech synthesiser has no idea what to do with it.
 */
export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let current: SpeechSynthesisUtterance | null = null;

function hebrewVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'he-IL') ?? voices.find((v) => v.lang.startsWith('he'));
}

export function speak(text: string, onEnd?: () => void): void {
  if (!speechAvailable() || text.trim() === '') return;
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'he-IL';
  const voice = hebrewVoice();
  if (voice) utterance.voice = voice;
  // A little slower than default: this is explanation, not narration.
  utterance.rate = 0.95;
  utterance.onend = () => {
    current = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    current = null;
    onEnd?.();
  };

  current = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!speechAvailable()) return;
  window.speechSynthesis.cancel();
  current = null;
}

export const isSpeaking = (): boolean => current !== null;
