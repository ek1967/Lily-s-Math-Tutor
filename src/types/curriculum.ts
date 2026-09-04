/**
 * A topic id is the join key between the curriculum, the authored lessons, the
 * exercise generators and everything persisted about the student. Renaming one
 * silently orphans her history, so ids are permanent — titles are free to change.
 * The brand stops a bare string being passed where an id is expected.
 */
export type TopicId = string & { readonly __brand: 'TopicId' };
export const asTopicId = (s: string): TopicId => s as TopicId;

export type StrandId = 'numbers' | 'ratio' | 'algebra' | 'functions' | 'geometry' | 'stats';

/** Internal only. Grade labels are never shown: telling a 13-year-old she is
 *  revising "grade 7" material is humiliating and buys nothing. */
export type Grade = 7 | 8;

/** `core` is what the lowest track actually needs; `extension` is hidden by default. */
export type Tier = 'core' | 'extension';

/**
 * 3 = a known gap-filler that must have a hand-authored lesson.
 * 2 = important, authored when there is time.  1/0 = AI-generated lesson is fine.
 */
export type GapPriority = 0 | 1 | 2 | 3;

export interface Strand {
  id: StrandId;
  titleHe: string;
  /** CSS custom property holding the strand's accent, e.g. `--c-strand-numbers`.
   *  A variable rather than a Tailwind class: `bg-${dynamic}` is invisible to
   *  Tailwind's scanner and would silently produce no colour at all. */
  cssVar: string;
  order: number;
}

export interface Topic {
  id: TopicId;
  strand: StrandId;
  grade: Grade;
  titleHe: string;
  /** One short line on the card: what this is, in about eight words. */
  oneLinerHe: string;
  /** First person, the way she would say it: "אני יודעת ל...". */
  goals: string[];
  prerequisites: TopicId[];
  tier: Tier;
  gapPriority: GapPriority;
  /** Hebrew terms — used to match an uploaded worksheet to a topic, and to search. */
  keywords: string[];
  estimatedMinutes: number;
}

/** Input shape for the data files: plain strings, branded on the way out. */
export interface TopicInput extends Omit<Topic, 'id' | 'prerequisites'> {
  id: string;
  prerequisites: string[];
}

export function defineTopics(inputs: TopicInput[]): Topic[] {
  return inputs.map((t) => ({
    ...t,
    id: asTopicId(t.id),
    prerequisites: t.prerequisites.map(asTopicId),
  }));
}
