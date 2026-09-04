import type { AttemptRecord } from '@/lib/practice/engine';

/**
 * Turns what actually happened in a session into an SM-2 quality score, 0–5.
 *
 * Hints cost something, but far less than a wrong answer: asking for help is a
 * skill worth having, and pricing it like failure would teach her to guess.
 */
export function gradeAttempts(attempts: readonly AttemptRecord[]): number {
  if (attempts.length === 0) return 0;

  const correct = attempts.filter((a) => a.correct === 1).length;
  const ratio = correct / attempts.length;
  const avgHints = attempts.reduce((sum, a) => sum + a.hintsUsed, 0) / attempts.length;
  const revealedRatio = attempts.filter((a) => a.revealed === 1).length / attempts.length;

  const raw = 5 * ratio - 0.4 * avgHints - 1.2 * revealedRatio;
  return Math.max(0, Math.min(5, Math.round(raw)));
}

/** Skill tags she got wrong more often than she got right. */
export function weakSkills(attempts: readonly AttemptRecord[]): string[] {
  const stats = new Map<string, { attempts: number; correct: number }>();
  for (const a of attempts) {
    for (const skill of a.skills) {
      const s = stats.get(skill) ?? { attempts: 0, correct: 0 };
      s.attempts += 1;
      s.correct += a.correct;
      stats.set(skill, s);
    }
  }
  return [...stats.entries()]
    .filter(([, s]) => s.attempts >= 2 && s.correct / s.attempts < 0.5)
    .map(([skill]) => skill);
}
