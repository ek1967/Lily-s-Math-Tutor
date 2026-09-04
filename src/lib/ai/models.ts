/** Every model id lives here, so a change is one edit rather than a search. */
export interface ModelOption {
  id: string;
  labelHe: string;
  descriptionHe: string;
  /** US dollars per million tokens. */
  inputPerMTok: number;
  outputPerMTok: number;
}

export const MODELS: readonly ModelOption[] = [
  {
    id: 'claude-opus-5',
    labelHe: 'החכם ביותר',
    descriptionHe: 'ההסברים הכי טובים והכי סבלניים. יקר יותר.',
    inputPerMTok: 5,
    outputPerMTok: 25,
  },
  {
    id: 'claude-sonnet-5',
    labelHe: 'מאוזן',
    descriptionHe: 'מהיר וזול יותר, ועדיין מסביר טוב.',
    inputPerMTok: 2,
    outputPerMTok: 10,
  },
  {
    id: 'claude-haiku-4-5',
    labelHe: 'החסכוני',
    descriptionHe: 'הזול והמהיר ביותר. מתאים לשאלות פשוטות.',
    inputPerMTok: 1,
    outputPerMTok: 5,
  },
];

export const DEFAULT_MODEL = 'claude-opus-5';

export const modelById = (id: string): ModelOption =>
  MODELS.find((m) => m.id === id) ?? MODELS[0]!;

/** Cost of one exchange, in agorot, so the parent screen can show real money. */
export function costAgorot(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = modelById(modelId);
  const usd =
    (inputTokens / 1_000_000) * model.inputPerMTok +
    (outputTokens / 1_000_000) * model.outputPerMTok;
  // Approximate; the exchange rate only needs to be close enough to be useful.
  const SHEKELS_PER_USD = 3.7;
  return Math.round(usd * SHEKELS_PER_USD * 100);
}
