import type { CommonMistake, LessonContent, RichBlock, WorkedExample } from '@/types/content';
import { asTopicId, type TopicId } from '@/types/curriculum';

/**
 * Validates a lesson the model produced.
 *
 * Model output is untrusted input, and a half-formed lesson is worse than none:
 * it looks authoritative while being wrong. So this rejects rather than
 * repairs — the caller falls back to exercises, which always work.
 */

const isString = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

/** Hebrew prose must not carry LaTeX; that is what mangles formulas in RTL. */
const cleanProse = (v: unknown): string | null =>
  isString(v) && !/[$\\]/.test(v) && !/-\s?\d/.test(v) ? v : null;

function parseBlock(raw: unknown): RichBlock | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const b = raw as Record<string, unknown>;

  switch (b['kind']) {
    case 'text': {
      const he = cleanProse(b['he']);
      return he ? { kind: 'text', he } : null;
    }
    case 'math':
      return isString(b['tex']) ? { kind: 'math', tex: b['tex'] } : null;
    case 'callout': {
      const he = cleanProse(b['he']);
      const tone = b['tone'];
      if (!he) return null;
      if (tone !== 'tip' && tone !== 'warn' && tone !== 'rule') return null;
      return { kind: 'callout', tone, he };
    }
    case 'mixed': {
      if (!isArray(b['parts'])) return null;
      const parts = b['parts']
        .map((p) => {
          if (typeof p !== 'object' || p === null) return null;
          const part = p as Record<string, unknown>;
          const he = cleanProse(part['he']);
          if (he) return { he };
          return isString(part['tex']) ? { tex: part['tex'] } : null;
        })
        .filter((p): p is { he: string } | { tex: string } => p !== null);
      return parts.length > 0 ? { kind: 'mixed', parts } : null;
    }
    default:
      return null;
  }
}

function parseExample(raw: unknown, index: number): WorkedExample | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  const promptHe = cleanProse(e['promptHe']);
  if (!promptHe || !isArray(e['steps']) || !isString(e['answerTex'])) return null;

  const steps = e['steps']
    .map((s) => {
      if (typeof s !== 'object' || s === null) return null;
      const step = s as Record<string, unknown>;
      const he = cleanProse(step['he']);
      if (!he) return null;
      return {
        he,
        ...(isString(step['tex']) ? { tex: step['tex'] } : {}),
        ...(cleanProse(step['whyHe']) ? { whyHe: step['whyHe'] as string } : {}),
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (steps.length < 2) return null;

  return {
    id: `ai-${index}`,
    promptHe,
    ...(isString(e['promptTex']) ? { promptTex: e['promptTex'] } : {}),
    steps,
    answerTex: e['answerTex'],
  };
}

function parseMistake(raw: unknown): CommonMistake | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const wrongHe = cleanProse(m['wrongHe']);
  const whyHe = cleanProse(m['whyHe']);
  const fixHe = cleanProse(m['fixHe']);
  if (!wrongHe || !whyHe || !fixHe) return null;
  return {
    wrongHe,
    whyHe,
    fixHe,
    ...(isString(m['wrongTex']) ? { wrongTex: m['wrongTex'] } : {}),
  };
}

/** Pulls the JSON object out of a reply that may be wrapped in prose or fences. */
export function extractJson(raw: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  const candidate = fenced?.[1] ?? raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseLesson(
  raw: string,
  topicId: TopicId,
  modelId: string,
): LessonContent | null {
  const data = extractJson(raw);
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;

  const hookHe = cleanProse(d['hookHe']);
  if (!hookHe) return null;

  const explanation = isArray(d['explanation'])
    ? d['explanation'].map(parseBlock).filter((b): b is RichBlock => b !== null)
    : [];
  if (explanation.length < 2) return null;

  const examples = isArray(d['examples'])
    ? d['examples'].map(parseExample).filter((e): e is WorkedExample => e !== null)
    : [];
  if (examples.length < 1) return null;

  const mistakes = isArray(d['mistakes'])
    ? d['mistakes'].map(parseMistake).filter((m): m is CommonMistake => m !== null)
    : [];

  const vocab = isArray(d['vocab'])
    ? d['vocab']
        .map((v) => {
          if (typeof v !== 'object' || v === null) return null;
          const item = v as Record<string, unknown>;
          const termHe = cleanProse(item['termHe']);
          const defHe = cleanProse(item['defHe']);
          return termHe && defHe ? { termHe, defHe } : null;
        })
        .filter((v): v is { termHe: string; defHe: string } => v !== null)
    : [];

  return {
    topicId: asTopicId(topicId),
    source: 'ai',
    version: 1,
    hookHe,
    // Cap the length: the whole point of the format is that it stays short.
    explanation: explanation.slice(0, 6),
    examples: examples.slice(0, 3),
    mistakes: mistakes.slice(0, 4),
    vocab: vocab.slice(0, 5),
    generatedAt: Date.now(),
    model: modelId,
  };
}
