import type { MatchOutcome } from '@/types';

export type SoundEffect = 'correct' | 'wrong' | 'complete';

/**
 * Which sound a confirmed drop should make.
 * - Correct drop that does NOT finish the game → "correct".
 * - Correct drop that finishes the game → nothing here: the completion step plays "complete"
 *   (exactly once), so the two sounds never overlap.
 * - Wrong drop → "wrong".
 * - Ignored drop (already matched, game over, …) → nothing.
 */
export function soundForDrop(outcome: MatchOutcome, gameComplete: boolean): SoundEffect | null {
  if (outcome === 'correct') return gameComplete ? null : 'correct';
  if (outcome === 'incorrect') return 'wrong';
  return null;
}
