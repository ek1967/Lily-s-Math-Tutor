import { getClient } from './client';
import { buildLessonPrompt } from './prompts/lessonGen';
import { parseLesson } from './parseLesson';
import { recordSpend } from './budget';
import { describeError, type AiError } from './errors';
import { cacheLesson, getCachedLesson } from '@/lib/db/repos/lessonCacheRepo';
import { getAuthoredLesson } from '@/data/lessons';
import type { LessonContent } from '@/types/content';
import type { Topic } from '@/types/curriculum';

export type LessonResult =
  | { status: 'ok'; lesson: LessonContent }
  | { status: 'error'; error: AiError };

/**
 * Resolves a lesson for a topic: hand-written if one exists, then the device
 * cache, and only then a request. Anything generated is cached, so a topic
 * costs one request in its lifetime and works offline afterwards.
 */
export async function resolveLesson(
  topic: Topic,
  studentName: string,
  modelId: string,
): Promise<LessonResult> {
  const authored = getAuthoredLesson(topic.id);
  if (authored) return { status: 'ok', lesson: authored };

  try {
    const cached = await getCachedLesson(topic.id);
    if (cached) return { status: 'ok', lesson: cached };
  } catch {
    /* Cache unavailable — fall through and ask. */
  }

  const client = getClient();
  if (!client) {
    return {
      status: 'error',
      error: {
        he: 'לנושא הזה עוד אין הסבר כתוב, וכדי לייצר אחד צריך מפתח בהגדרות.',
        retryable: false,
        needsParent: true,
      },
    };
  }

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildLessonPrompt(topic, studentName) }],
    });

    void recordSpend(modelId, response.usage.input_tokens, response.usage.output_tokens);

    const text = response.content
      .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const lesson = parseLesson(text, topic.id, modelId);
    if (!lesson) {
      // Rejected rather than repaired: a half-formed lesson looks authoritative
      // while being wrong, which is worse than having none.
      return {
        status: 'error',
        error: {
          he: 'לא הצלחתי לכתוב הסבר טוב לנושא הזה. אפשר לתרגל אותו, או לשאול אותי ישירות.',
          retryable: true,
          needsParent: false,
        },
      };
    }

    void cacheLesson(lesson).catch(() => {});
    return { status: 'ok', lesson };
  } catch (err) {
    return { status: 'error', error: describeError(err) };
  }
}
