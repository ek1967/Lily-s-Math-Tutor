import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Icon, type IconName } from '@/components/ui';
import { deleteThread, recentThreads } from '@/lib/db/repos/chatRepo';
import { newFreeThreadId } from '@/features/chat/threadId';
import { useSettings } from '@/stores/settingsStore';
import { dayKey, relativeDayHe } from '@/lib/time';
import { paths } from '@/router';
import type { ChatKind, ChatThread } from '@/types/chat';

const KIND_ICON: Record<ChatKind, IconName> = {
  free: 'spark',
  topic: 'book',
  homework: 'camera',
};

/**
 * Past conversations.
 *
 * Threads were being written and never shown, which quietly made the tutor
 * amnesiac from her side of the screen: an explanation that finally landed
 * last week was unreachable, and the only way to ask again was to ask again.
 */
export function ChatsRoute() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(() => {
    void recentThreads()
      .then(setThreads)
      .catch(() => setThreads([]));
  }, []);

  useEffect(load, [load]);

  const remove = async (id: string) => {
    setConfirming(null);
    await deleteThread(id).catch(() => {});
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader title={`שיחות עם ${settings.tutorName}`} />

      <Button block onClick={() => navigate(paths.chat(newFreeThreadId()))}>
        שיחה חדשה
      </Button>

      {threads !== null && threads.length === 0 && (
        <Card className="text-center">
          <p className="text-lg">עוד לא דיברתן</p>
          <p className="mt-1 text-ink-soft">
            כל שיחה שתפתחי תישמר כאן, ואפשר יהיה לחזור אליה מתי שבא לך.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {(threads ?? []).map((t) => (
          <li key={t.id}>
            {confirming === t.id ? (
              <Card className="space-y-3">
                <p>למחוק את השיחה "{t.titleHe}"? מה שנכתב בה לא יחזור.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setConfirming(null)}>
                    להשאיר
                  </Button>
                  <Button className="flex-1" onClick={() => void remove(t.id)}>
                    למחוק
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="card flex items-center gap-1 p-1">
                <Link
                  to={paths.chat(t.id)}
                  className="tap flex flex-1 items-center gap-3 rounded-md px-3 py-3 hover:bg-surface-2"
                >
                  <Icon name={KIND_ICON[t.kind]} className="h-5 w-5 shrink-0 text-primary-strong" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.titleHe}</span>
                    <span className="block text-sm text-ink-soft">
                      {relativeDayHe(dayKey(t.updatedAt))}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirming(t.id)}
                  aria-label={`למחוק את השיחה ${t.titleHe}`}
                  className="tap rounded-md px-3 py-3 text-sm text-ink-soft hover:bg-surface-2"
                >
                  מחיקה
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
