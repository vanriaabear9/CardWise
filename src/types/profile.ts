import type { IconName } from '.';
import type { GameResult } from './gameHistory';

/** The local player profile (stored only on this device). */
export interface PlayerProfile {
  displayName: string;
  avatarId: string;
  /** true when nothing has been saved yet and the defaults are shown. */
  isDefault: boolean;
  updatedAt: string | null;
}

export interface ProfileInput {
  displayName: string;
  avatarId: string;
}

/** Player level, from experience points (XP = total first-try points). */
export interface PlayerLevel {
  level: number;
  xp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP needed to go from this level to the next. */
  xpPerLevel: number;
}

/** Everything the Profile, My Statistics, and Achievements screens show. All from saved data. */
export interface PlayerStats {
  gamesPlayed: number;
  topicsCreated: number;
  favoritesCount: number;
  bestGame: GameResult | null;
  /** Average score as a whole percentage, null with no games. */
  averagePercent: number | null;
  mostPlayed: { title: string; count: number } | null;
  /** Sum of correct matches over games that recorded it. */
  totalCorrectMatches: number;
  /** Sum of incorrect attempts over games that recorded it. */
  totalIncorrectAttempts: number;
  /** Correct drops ÷ all drops (%), null when nothing was recorded. */
  accuracyPercent: number | null;
  /** First-try points ÷ descriptions played (%), null with no games. */
  firstTryPercent: number | null;
  totalPoints: number;
  totalDescriptionsPlayed: number;
  perfectGames: number;
  /** Some older games didn't record correct/incorrect counts. */
  hasUnrecordedGames: boolean;
  /** Up to the last 10 games, oldest first (for the chart). */
  recentGames: GameResult[];
  level: PlayerLevel;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  /** Progress so far (never above `target`). */
  current: number;
  target: number;
  unlocked: boolean;
}
