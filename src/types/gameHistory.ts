/**
 * The result of one finished game (one row of `game_history`).
 * Fields that are `null` were not recorded (e.g. games saved before that detail existed).
 */
export interface GameResult {
  id: number;
  /** null if the topic was deleted after the game was played. */
  topicId: number | null;
  /** Topic title at the time of playing (kept even if the topic is renamed or deleted). */
  topicTitle: string;
  /** First-try points. */
  score: number;
  /** Number of descriptions in the game (the maximum score). */
  totalQuestions: number;
  correctMatches: number | null;
  incorrectAttempts: number | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string; // ISO date string
}

/** One description as it was played, saved as a snapshot (independent of later topic edits). */
export interface GameAnswer {
  id: number;
  /** Order of the term in the topic at the time of playing. */
  termPosition: number;
  /** The correct term (snapshot). */
  termText: string;
  /** The description (snapshot). */
  descriptionText: string;
  /** The term the player first dropped this description on, or null if not recorded. */
  firstAttemptTermText: string | null;
  /** Whether that first drop was correct, or null if not recorded. */
  firstAttemptCorrect: boolean | null;
  /** How many drops it took to place this description, or null if not recorded. */
  attempts: number | null;
}

/** A finished game plus its answer snapshots. */
export interface GameResultDetail extends GameResult {
  answers: GameAnswer[];
}

/** One description's record, as handed to the service when saving a game. */
export interface NewGameAnswerInput {
  termPosition: number;
  termText: string;
  descriptionText: string;
  firstAttemptTermText: string | null;
  firstAttemptCorrect: boolean | null;
  attempts: number | null;
}

/** Data needed to record a finished game. */
export interface NewGameResultInput {
  /**
   * Unique id of the play-through. When given, saving the same game again returns the
   * existing record instead of creating a duplicate.
   */
  gameUid?: string;
  topicId: number | null;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  correctMatches?: number;
  incorrectAttempts?: number;
  durationMs?: number;
  startedAt?: string;
  /** Defaults to the current time. */
  completedAt?: string;
  /** Snapshot of every description in the game. When given, there must be exactly `totalQuestions`. */
  answers?: NewGameAnswerInput[];
}

/** Statistics calculated from saved game history. */
export interface HistoryStats {
  totalGames: number;
  /** Highest score by percentage (ties: higher score, then most recent). */
  bestGame: GameResult | null;
  /** Average score as a whole percentage, or null if there are no games. */
  averagePercent: number | null;
  mostPlayed: { title: string; count: number } | null;
}

/** A topic that appears in game history (for the "By Topic" filter). */
export interface HistoryTopic {
  /** Stable grouping key: the topic id if it still exists, otherwise the title. */
  key: string;
  title: string;
  count: number;
}
