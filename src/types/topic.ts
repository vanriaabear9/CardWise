import type { EditTermInput, NewTermInput, TermWithDescriptions } from './term';

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
  /** Number of terms. */
  cardCount: number;
  /** Number of descriptions across all terms. */
  descriptionCount: number;
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

/**
 * The complete new state of an edited topic.
 * Terms/descriptions with an `id` are updated, ones without are added,
 * and existing ones missing from the list are deleted.
 */
export interface TopicEditInput {
  title: string;
  description?: string;
  /** Omit to keep the current category. */
  category?: string;
  terms: EditTermInput[];
}

/** Fields that can be changed on an existing topic. Omitted fields stay unchanged. */
export interface TopicUpdate {
  title?: string;
  description?: string;
  category?: string;
}
