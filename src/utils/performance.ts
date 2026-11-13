import type { IconName } from '@/types';

export interface Performance {
  /** Short headline, e.g. "Perfect Score!" */
  label: string;
  /** One encouraging sentence. */
  message: string;
  icon: IconName;
}

/** Score as a whole percentage (0 when there is nothing to score). */
export function scorePercent(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(score, total) / total) * 100);
}

/** Feedback for a final score (first-try points out of the total descriptions). */
export function getPerformance(score: number, total: number): Performance {
  const percent = scorePercent(score, total);
  if (total > 0 && score >= total) {
    return { label: 'Perfect Score!', message: 'Every description matched on the first try.', icon: 'trophy' };
  }
  if (percent >= 80) {
    return { label: 'Excellent!', message: 'Almost everything on the first try. Great memory!', icon: 'ribbon' };
  }
  if (percent >= 60) {
    return { label: 'Great Job!', message: 'You know most of this topic. Review the misses to master it.', icon: 'star' };
  }
  if (percent >= 40) {
    return { label: 'Good Effort!', message: 'You are getting there. Another round will help.', icon: 'thumbs-up' };
  }
  return { label: 'Keep Practicing!', message: 'Check the answer review, then try again.', icon: 'school' };
}
