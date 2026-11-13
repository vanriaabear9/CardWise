/** The result of one finished game. */
export interface GameResult {
  id: number;
  /** null if the topic was deleted after the game was played. */
  topicId: number | null;
  /** Topic title at the time of playing (kept even if the topic is renamed or deleted). */
  topicTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string; // ISO date string
}

/** Data needed to record a finished game. */
export interface NewGameResultInput {
  topicId: number | null;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  /** Defaults to the current time. */
  completedAt?: string;
}
