import type { TopicId } from '@/types/curriculum';
import type { AttemptRecord } from '@/lib/practice/engine';
import { saveAttempts } from '@/lib/db/repos/attemptRepo';
import { applyAttempts } from '@/lib/db/repos/masteryRepo';
import { requestPersistentStorage } from '@/lib/db/open';

/**
 * Writes a finished set to the device and reschedules the topics it touched.
 * Attempts are grouped by topic because a review session mixes several, and
 * each one needs its own mastery update.
 *
 * Nothing here is allowed to throw into the UI: if storage is unavailable she
 * still did the work, and losing the record is not a reason to show her an
 * error at the moment she finished.
 */
export async function persistPractice(
  sessionId: string,
  records: readonly AttemptRecord[],
): Promise<void> {
  if (records.length === 0) return;
  try {
    await saveAttempts(sessionId, records);

    const byTopic = new Map<TopicId, AttemptRecord[]>();
    for (const r of records) {
      const list = byTopic.get(r.topicId) ?? [];
      list.push(r);
      byTopic.set(r.topicId, list);
    }
    for (const [topicId, group] of byTopic) {
      await applyAttempts(topicId, group);
    }
  } catch {
    /* Storage is unavailable — the session still happened. */
  } finally {
    // In `finally`, not at the end of the `try`: a write that throws is exactly
    // the case where storage is under pressure, and that is precisely when the
    // request matters most. Asked after real work rather than on first load,
    // because the browser is far likelier to grant it to an engaged origin.
    void requestPersistentStorage();
  }
}
