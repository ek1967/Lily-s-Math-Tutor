import type { Strand, StrandId } from '@/types/curriculum';

export const STRANDS: Strand[] = [
  { id: 'numbers', titleHe: 'מספרים ופעולות חשבון', cssVar: '--c-strand-numbers', order: 1 },
  { id: 'ratio', titleHe: 'יחס ופרופורציה', cssVar: '--c-strand-ratio', order: 2 },
  { id: 'algebra', titleHe: 'אלגברה', cssVar: '--c-strand-algebra', order: 3 },
  { id: 'functions', titleHe: 'פונקציות וגרפים', cssVar: '--c-strand-functions', order: 4 },
  { id: 'geometry', titleHe: 'גיאומטריה', cssVar: '--c-strand-geometry', order: 5 },
  { id: 'stats', titleHe: 'סטטיסטיקה והסתברות', cssVar: '--c-strand-stats', order: 6 },
];

export const STRAND_BY_ID = new Map<StrandId, Strand>(STRANDS.map((s) => [s.id, s]));
