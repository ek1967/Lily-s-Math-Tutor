import { readJson, removeKey, writeJson } from '@/lib/storage';

const KEY = 'lmt.apiKey.v1';

/**
 * The Anthropic key lives in localStorage on her device. That is a real
 * exposure and worth being plain about: anyone with the device, or any script
 * that reaches this origin, can read it. The mitigations are the strict CSP in
 * index.html, never rendering model output as raw HTML, and — the one that
 * actually bounds the damage — using a dedicated key with a monthly spend cap
 * set in the Anthropic console.
 *
 * There is no obfuscation here on purpose. Encoding the key would look like
 * security without being any, which is worse than being honest about it.
 */
export function getApiKey(): string | null {
  const stored = readJson<{ key: string | null }>(KEY, { key: null });
  return stored.key && stored.key.length > 10 ? stored.key : null;
}

export function setApiKey(key: string): void {
  writeJson(KEY, { key: key.trim() });
}

export function clearApiKey(): void {
  removeKey(KEY);
}

export const hasApiKey = (): boolean => getApiKey() !== null;

/** Shows enough to recognise the key, never enough to use it. */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return '••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

/** A rough shape check, so an obvious paste error is caught before a request. */
export function looksLikeApiKey(key: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}
