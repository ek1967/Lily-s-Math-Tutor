import { db } from '../db';

export const KV_ACTIVE_SESSION = 'activeSessionId';
export const KV_LAST_PLAN_DAY = 'lastPlanDay';
export const KV_MONTHLY_SPEND = 'monthlySpend';

export async function getKv<T>(key: string): Promise<T | undefined> {
  const row = await db.kv.get(key);
  return row?.value as T | undefined;
}

export async function setKv(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}
