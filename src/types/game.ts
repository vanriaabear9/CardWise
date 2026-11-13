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
}

/** Everything about one game in progress. Built from (but never modifying) a saved topic. */
export interface GameState {
  topicId: number;
  topicTitle: string;
  /** Terms in their saved order. */
  terms: GameTerm[];
  /** Description cards in shuffled order. */
  cards: GameCard[];
  /** 1 point per correctly matched description. */
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

/** Final numbers of a finished game, handed to the Results screen (and, in Phase 6, saved to history). */
export interface GameSummary {
  topicId: number;
  topicTitle: string;
  score: number;
  totalDescriptions: number;
  correctMatches: number;
  incorrectAttempts: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}
