import { getKv, setKv } from '@/lib/db/repos/kvRepo';
import { costAgorot } from './models';
import { dayKey } from '@/lib/time';

/**
 * Keeps a conversation from growing without bound, and keeps a running total of
 * what it has cost. Both matter for the same reason: this runs on a parent's
 * API key, and an unbounded homework thread with six photos is both slow and
 * expensive.
 */

/** How many past turns to send. Older context is summarised into one line. */
export const MAX_HISTORY_TURNS = 12;

/** Images are the expensive part; three is enough for a worksheet page. */
export const MAX_IMAGES_PER_REQUEST = 3;

export interface SpendRecord {
  month: string; // 'YYYY-MM'
  agorot: number;
  requests: number;
}

const SPEND_KEY = 'monthlySpend';

export const currentMonth = (): string => dayKey().slice(0, 7);

export async function getSpend(): Promise<SpendRecord> {
  const stored = await getKv<SpendRecord>(SPEND_KEY);
  const month = currentMonth();
  if (!stored || stored.month !== month) return { month, agorot: 0, requests: 0 };
  return stored;
}

export async function recordSpend(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  try {
    const current = await getSpend();
    await setKv(SPEND_KEY, {
      month: current.month,
      agorot: current.agorot + costAgorot(modelId, inputTokens, outputTokens),
      requests: current.requests + 1,
    } satisfies SpendRecord);
  } catch {
    /* Cost tracking is never worth failing a reply over. */
  }
}

export const formatAgorot = (agorot: number): string =>
  `${(agorot / 100).toFixed(2)} ₪`;

/**
 * Trims a history to the last N turns, always starting on a user message —
 * the API rejects a history that opens with an assistant turn.
 */
export function trimHistory<T extends { role: 'user' | 'assistant' }>(
  messages: readonly T[],
  maxTurns = MAX_HISTORY_TURNS,
): T[] {
  const kept = messages.slice(-maxTurns);
  const firstUser = kept.findIndex((m) => m.role === 'user');
  return firstUser <= 0 ? kept : kept.slice(firstUser);
}
