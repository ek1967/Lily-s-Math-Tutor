import { useCallback, useEffect, useRef, useState } from 'react';
import { streamTutorReply, type ChatTurn } from '@/lib/ai/tutorChat';
import type { AiError } from '@/lib/ai/errors';
import type { TutorContext } from '@/lib/ai/prompts/system.he';
import { addMessage, getMessages } from '@/lib/db/repos/chatRepo';
import type { ChatMessage } from '@/types/chat';

export interface ChatState {
  messages: ChatMessage[];
  /** The reply currently arriving, token by token. */
  streaming: string | null;
  error: AiError | null;
  send: (text: string, images?: string[]) => void;
  stop: () => void;
  busy: boolean;
}

/**
 * Chat that streams. A reply that starts appearing within a second holds a
 * distractible reader; the same reply delivered whole after eight seconds has
 * already lost her.
 */
export function useTutorChat(
  threadId: string,
  ctx: TutorContext,
  modelId: string,
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const abort = useRef<(() => void) | null>(null);

  useEffect(() => {
    void getMessages(threadId).then(setMessages).catch(() => setMessages([]));
    return () => abort.current?.();
  }, [threadId]);

  const send = useCallback(
    (text: string, images?: string[]) => {
      const trimmed = text.trim();
      if (!trimmed && !images?.length) return;
      setError(null);

      const userMessage: ChatMessage = {
        threadId,
        role: 'user',
        parts: [{ type: 'text', text: trimmed }],
        createdAt: Date.now(),
      };
      const history = [...messages, userMessage];
      setMessages(history);
      void addMessage(userMessage).catch(() => {});

      const turns: ChatTurn[] = history.map((m, i) => ({
        role: m.role,
        text: m.parts.map((p) => (p.type === 'text' ? p.text : '')).join(' ').trim(),
        ...(i === history.length - 1 && images?.length ? { images } : {}),
      }));

      setStreaming('');
      abort.current = streamTutorReply(turns, ctx, modelId, {
        onDelta: (delta) => setStreaming((s) => (s ?? '') + delta),
        onDone: (full) => {
          const reply: ChatMessage = {
            threadId,
            role: 'assistant',
            parts: [{ type: 'text', text: full }],
            createdAt: Date.now(),
            model: modelId,
          };
          setMessages((prev) => [...prev, reply]);
          setStreaming(null);
          abort.current = null;
          void addMessage(reply).catch(() => {});
        },
        onError: (e) => {
          setError(e);
          setStreaming(null);
          abort.current = null;
        },
      });
    },
    [messages, threadId, ctx, modelId],
  );

  const stop = useCallback(() => {
    abort.current?.();
    abort.current = null;
    setStreaming(null);
  }, []);

  return { messages, streaming, error, send, stop, busy: streaming !== null };
}
