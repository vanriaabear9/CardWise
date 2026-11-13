import type { NewTermInput, TermWithDescriptions } from './term';

/** A study topic (a set of flashcards). */
export interface Topic {
  id: number;
  title: string;
  description: string;
  category: string;
  /** true = preloaded with the app (Explore Topics); false = created by the user (My Topics). */
  isBuiltin: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Topic info for lists and cards, plus how many terms (flashcards) it has. */
export interface TopicSummary extends Topic {
  cardCount: number;
}

/** A topic with all of its terms and their descriptions, in display order. */
export interface TopicWithTerms extends Topic {
  terms: TermWithDescriptions[];
}

/** Data needed to create a topic, optionally together with its terms. */
export interface NewTopicInput {
  title: string;
  description?: string;
  category?: string;
  terms?: NewTermInput[];
}

/** Fields that can be changed on an existing topic. Omitted fields stay unchanged. */
export interface TopicUpdate {
  title?: string;
  description?: string;
  category?: string;
}
