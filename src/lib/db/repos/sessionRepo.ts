import { db } from '../db';
import type { StudySession } from '@/types/session';
import { KV_ACTIVE_SESSION, getKv, setKv } from './kvRepo';

export async function saveSession(session: StudySession): Promise<void> {
  await db.sessions.put(session);
  if (session.outcome === 'active') await setKv(KV_ACTIVE_SESSION, session.id);
  else if ((await getKv<string>(KV_ACTIVE_SESSION)) === session.id) {
    await setKv(KV_ACTIVE_SESSION, null);
  }
}

export async function getSession(id: string): Promise<StudySession | undefined> {
  return db.sessions.get(id);
}

/** The session she walked away from, so the home screen can offer to resume it. */
export async function getActiveSession(): Promise<StudySession | undefined> {
  const id = await getKv<string>(KV_ACTIVE_SESSION);
  if (!id) return undefined;
  const session = await db.sessions.get(id);
  return session?.outcome === 'active' ? session : undefined;
}

export async function recentSessions(limit = 30): Promise<StudySession[]> {
  return db.sessions.orderBy('startedAt').reverse().limit(limit).toArray();
}
