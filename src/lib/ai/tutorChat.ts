import type Anthropic from '@anthropic-ai/sdk';
import { getClient } from './client';
import { buildSystemPrompt, type TutorContext } from './prompts/system.he';
import { MAX_IMAGES_PER_REQUEST, recordSpend, trimHistory } from './budget';
import { describeError, type AiError } from './errors';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
  /** Base64 JPEG pages, sent only with the most recent user turn. */
  images?: string[];
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: (full: string) => void;
  onError: (error: AiError) => void;
}

/** Streams a tutor reply. Returns an abort function. */
export function streamTutorReply(
  turns: readonly ChatTurn[],
  ctx: TutorContext,
  modelId: string,
  handlers: StreamHandlers,
): () => void {
  const client = getClient();
  if (!client) {
    handlers.onError({
      he: 'עוד לא הוגדר מפתח. אפשר להוסיף אותו בהגדרות.',
      retryable: false,
      needsParent: true,
    });
    return () => {};
  }

  const controller = new AbortController();

  void (async () => {
    try {
      const messages = toMessages(trimHistory(turns));

      const stream = client.messages.stream(
        {
          model: modelId,
          max_tokens: 4096,
          // Adaptive is the current shape; budget_tokens is rejected outright
          // on these models.
          thinking: { type: 'adaptive' },
          // Medium rather than high: a tutor reply that starts appearing in a
          // second holds attention far better than a better one that takes six.
          output_config: { effort: 'medium' },
          system: [
            {
              type: 'text',
              text: buildSystemPrompt(ctx),
              // The persona is identical across every turn, so caching it is
              // free money on a long homework thread.
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages,
        },
        { signal: controller.signal },
      );

      let full = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text;
          handlers.onDelta(event.delta.text);
        }
      }

      const final = await stream.finalMessage();
      void recordSpend(modelId, final.usage.input_tokens, final.usage.output_tokens);

      if (final.stop_reason === 'refusal') {
        handlers.onError({
          he: 'לא הצלחתי לענות על זה. אפשר לנסח את השאלה אחרת?',
          retryable: false,
          needsParent: false,
        });
        return;
      }

      handlers.onDone(full);
    } catch (err) {
      if (controller.signal.aborted) return;
      handlers.onError(describeError(err));
    }
  })();

  return () => controller.abort();
}

function toMessages(turns: readonly ChatTurn[]): Anthropic.MessageParam[] {
  return turns.map((turn, i) => {
    const isLast = i === turns.length - 1;
    const images = isLast ? (turn.images ?? []).slice(0, MAX_IMAGES_PER_REQUEST) : [];

    if (images.length === 0) {
      return { role: turn.role, content: turn.text };
    }

    // Images before the text: the model reads the page, then the question.
    return {
      role: turn.role,
      content: [
        ...images.map(
          (data): Anthropic.ImageBlockParam => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data },
          }),
        ),
        { type: 'text', text: turn.text },
      ],
    };
  });
}
