import type { Description } from './description';

/** A term (the front of a flashcard) that belongs to a topic. */
export interface Term {
  id: number;
  topicId: number;
  termText: string;
  /** Display order within the topic (0 = first). */
  position: number;
}

/** A term together with all of its descriptions, in display order. */
export interface TermWithDescriptions extends Term {
  descriptions: Description[];
}

/** A description when saving an edited topic. `id` is set for descriptions that already exist. */
export interface EditDescriptionInput {
  id?: number;
  descriptionText: string;
}

/** A term when saving an edited topic. `id` is set for terms that already exist. */
export interface EditTermInput {
  id?: number;
  termText: string;
  descriptions: EditDescriptionInput[];
}

/** Data needed to create a term (used when saving a topic). */
export interface NewTermInput {
  termText: string;
  /** One or more descriptions for this term, in display order. */
  descriptions: string[];
}
