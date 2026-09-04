import { useEffect, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { ModelText } from '@/components/content/ModelText';
import { useTutorChat } from './useTutorChat';
import type { TutorContext } from '@/lib/ai/prompts/system.he';

interface Props {
  threadId: string;
  ctx: TutorContext;
  modelId: string;
  /** Shown as tappable openers on an empty thread. */
  suggestionsHe?: readonly string[];
  /** Prepended to her first message, so she need not retype the question she
   *  is stuck on — describing it is often the hard part. */
  openingContextHe?: string;
  /** Creates the thread row on the first message. See `useTutorChat`. */
  ensureThread?: () => Promise<void>;
}

export function ChatView({
  threadId,
  ctx,
  modelId,
  suggestionsHe = [],
  openingContextHe,
  ensureThread,
}: Props) {
  const chat = useTutorChat(threadId, ctx, modelId, ensureThread);
  const [draft, setDraft] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.messages.length, chat.streaming]);

  const empty0 = chat.messages.length === 0;
  const withContext = (text: string): string =>
    empty0 && openingContextHe ? `התרגיל: ${openingContextHe}\n\n${text}` : text;

  const submit = () => {
    if (chat.busy) return;
    chat.send(withContext(draft));
    setDraft('');
  };

  const empty = chat.messages.length === 0 && !chat.streaming;

  return (
    <div className="flex min-h-[80dvh] flex-col gap-3">
      <div className="flex-1 space-y-3">
        {empty && (
          <Card className="text-center">
            <p className="text-lg">אפשר לשאול אותי כל דבר</p>
            <p className="mt-1 text-ink-soft">
              גם "לא הבנתי כלום" זו התחלה מצוינת.
            </p>
          </Card>
        )}

        {chat.messages.map((m, i) => (
          <Bubble key={m.id ?? i} role={m.role}>
            <ModelText text={m.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ')} />
          </Bubble>
        ))}

        {chat.streaming !== null && (
          <Bubble role="assistant">
            {chat.streaming === '' ? (
              <span className="text-ink-soft">חושבת…</span>
            ) : (
              <ModelText text={chat.streaming} />
            )}
          </Bubble>
        )}

        {chat.error && (
          <div className="rounded-lg bg-almost-tint px-4 py-3 text-almost">
            <p>{chat.error.he}</p>
            {chat.error.needsParent && (
              <p className="mt-1 text-sm text-ink-soft">כדאי לקרוא לאבא או לאמא לרגע.</p>
            )}
          </div>
        )}

        {empty && suggestionsHe.length > 0 && (
          <div className="space-y-2">
            {suggestionsHe.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => chat.send(withContext(s))}
                className="tap w-full rounded-lg bg-surface-2 px-4 py-3 text-start hover:bg-primary-tint"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottom} />
      </div>

      <div className="sticky bottom-0 space-y-2 bg-bg pb-2 pt-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="מה רוצה לשאול?"
          className="w-full resize-none rounded-lg border border-line bg-surface px-4 py-3 text-base placeholder:text-ink-soft"
        />
        {chat.busy ? (
          <Button variant="ghost" block onClick={chat.stop}>
            עצרי
          </Button>
        ) : (
          <Button block onClick={submit} disabled={draft.trim() === ''}>
            שליחה
          </Button>
        )}
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-start' : 'flex justify-end'}>
      <div
        className={[
          'max-w-[85%] rounded-lg px-4 py-3',
          isUser ? 'bg-primary text-[rgb(var(--c-primary-ink))]' : 'bg-surface border border-line',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
}
