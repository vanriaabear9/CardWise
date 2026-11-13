/** A term on the board (a drop target). */
export interface GameTerm {
  id: number;
  termText: string;
  /** How many descriptions belong to this term. */
  totalDescriptions: number;
  /** How many of them have been matched correctly so far. */
  matchedCount: number;
}

/** A draggable description card. `termId` is the correct answer. */
export interface GameCard {
  /** The description's database id. */
  id: number;
  termId: number;
  text: string;
  matched: boolean;
  /** Position in the topic's saved order (term order, then description order). Used for the answer review. */
  order: number;
  /** How many times this card has been dropped on a term (right or wrong). */
  attempts: number;
  /** The term this card was FIRST dropped on, or null if it hasn't been dropped yet. */
  firstAttemptTermId: number | null;
}

/** Everything about one game in progress. Built from (but never modifying) a saved topic. */
export interface GameState {
  /** Unique id of this play-through. Saving the same game twice is detected with it. */
  gameId: string;
  topicId: number;
  topicTitle: string;
  /** Terms in their saved order. */
  terms: GameTerm[];
  /** Description cards in shuffled order. */
  cards: GameCard[];
  /** First-try points: 1 per description matched correctly on its FIRST drop. */
  score: number;
  /** Maximum possible score (= number of descriptions). */
  totalDescriptions: number;
  incorrectAttempts: number;
  startedAt: string; // ISO date string
  /** Set when every description has been matched. */
  completedAt: string | null;
}

/** What happened when a card was dropped on a term. */
export type MatchOutcome = 'correct' | 'incorrect' | 'ignored';

/** Final numbers of a finished game. */
export interface GameSummary {
  topicId: number;
  topicTitle: string;
  /** First-try points. */
  score: number;
  totalDescriptions: number;
  /** Descriptions placed on the right term (all of them, once the game is complete). */
  correctMatches: number;
  incorrectAttempts: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}
