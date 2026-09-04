import { getClient } from './client';
import { buildWorksheetPrompt } from './prompts/homework';
import { extractJson } from './parseLesson';
import { recordSpend, MAX_IMAGES_PER_REQUEST } from './budget';
import { describeError, type AiError } from './errors';
import { TOPIC_BY_ID } from '@/data/curriculum';
import { asTopicId, type TopicId } from '@/types/curriculum';

export interface DetectedExercise {
  labelHe: string;
  promptHe: string;
  promptTex?: string;
  topicId?: TopicId;
  done: boolean;
}

export interface WorksheetReading {
  titleHe: string;
  exercises: DetectedExercise[];
}

export type WorksheetResult =
  | { status: 'ok'; reading: WorksheetReading }
  | { status: 'error'; error: AiError };

/** Reads a worksheet from its page images and returns a checklist. */
export async function readWorksheet(
  pagesBase64: readonly string[],
  modelId: string,
): Promise<WorksheetResult> {
  const client = getClient();
  if (!client) {
    return {
      status: 'error',
      error: {
        he: 'כדי לקרוא דף עבודה צריך מפתח בהגדרות.',
        retryable: false,
        needsParent: true,
      },
    };
  }

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: [
            ...pagesBase64.slice(0, MAX_IMAGES_PER_REQUEST).map((data) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
            })),
            { type: 'text' as const, text: buildWorksheetPrompt() },
          ],
        },
      ],
    });

    void recordSpend(modelId, response.usage.input_tokens, response.usage.output_tokens);

    const text = response.content
      .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const reading = parseWorksheet(text);
    if (!reading || reading.exercises.length === 0) {
      return {
        status: 'error',
        error: {
          he: 'לא הצלחתי לקרוא את הדף. אולי כדאי לצלם שוב — באור טוב, והדף שטוח על השולחן.',
          retryable: true,
          needsParent: false,
        },
      };
    }

    return { status: 'ok', reading };
  } catch (err) {
    return { status: 'error', error: describeError(err) };
  }
}

/** Model output is untrusted: every field is checked, nothing is repaired. */
export function parseWorksheet(raw: string): WorksheetReading | null {
  const data = extractJson(raw);
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d['exercises'])) return null;

  const exercises = d['exercises']
    .map((item): DetectedExercise | null => {
      if (typeof item !== 'object' || item === null) return null;
      const e = item as Record<string, unknown>;
      const promptHe = typeof e['promptHe'] === 'string' ? e['promptHe'].trim() : '';
      if (promptHe === '') return null;
      // Hebrew prose must not carry LaTeX; that is what mangles it in RTL.
      if (/[$\\]/.test(promptHe)) return null;

      const rawTopic = typeof e['topicId'] === 'string' ? asTopicId(e['topicId']) : undefined;
      const topicId = rawTopic && TOPIC_BY_ID.has(rawTopic) ? rawTopic : undefined;

      return {
        labelHe: typeof e['labelHe'] === 'string' && e['labelHe'].trim() !== ''
          ? e['labelHe'].trim()
          : '—',
        promptHe,
        ...(typeof e['promptTex'] === 'string' && e['promptTex'].trim() !== ''
          ? { promptTex: e['promptTex'] }
          : {}),
        ...(topicId ? { topicId } : {}),
        done: false,
      };
    })
    .filter((e): e is DetectedExercise => e !== null);

  const titleHe =
    typeof d['titleHe'] === 'string' && d['titleHe'].trim() !== '' && !/[$\\]/.test(d['titleHe'])
      ? d['titleHe'].trim()
      : 'דף עבודה';

  return { titleHe, exercises: exercises.slice(0, 40) };
}
