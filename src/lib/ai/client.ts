import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '@/lib/security/apiKey';

/**
 * The Anthropic client, talking to the API straight from the browser.
 *
 * `dangerouslyAllowBrowser` is exactly as advertised: the key is in the page.
 * That is an accepted trade for a single-family app with no server, and the
 * bound on the damage is a dedicated key with a spend cap — see apiKey.ts.
 * The explicit CORS header is belt and braces; current SDKs set it themselves
 * when the browser flag is on.
 */
let cached: { key: string; client: Anthropic } | null = null;

export function getClient(): Anthropic | null {
  const key = getApiKey();
  if (!key) return null;
  if (cached?.key === key) return cached.client;

  const client = new Anthropic({
    apiKey: key,
    dangerouslyAllowBrowser: true,
    defaultHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
    maxRetries: 2,
    // Milliseconds in the TypeScript SDK. Long enough for a slow reply, short
    // enough that a hung request does not leave her staring at a spinner.
    timeout: 120_000,
  });

  cached = { key, client };
  return client;
}

/** Called when the key changes, so a stale client is never reused. */
export function resetClient(): void {
  cached = null;
}
