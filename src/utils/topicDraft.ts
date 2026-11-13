/*
 * Form logic for creating/editing a topic ("draft").
 *
 * The draft lives only in component state while the user types.
 * Nothing is written to SQLite until the user taps Save.
 * This file has no UI code, so it can be tested on its own.
 */
import { LIMITS } from '@/services/topicService';
import type { NewTopicInput, TopicEditInput, TopicWithTerms } from '@/types';

// ---------- Draft shape ----------

export interface DescriptionDraft {
  /** Stable key for React lists (never shown to users). */
  key: string;
  /** Database id, set only for descriptions loaded from SQLite (edit mode). */
  id?: number;
  text: string;
}

export interface TermDraft {
  key: string;
  id?: number;
  termText: string;
  descriptions: DescriptionDraft[];
}

export interface TopicDraft {
  title: string;
  description: string;
  terms: TermDraft[];
}

let keyCounter = 0;
function newKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

export function createDescriptionDraft(text = '', id?: number): DescriptionDraft {
  return { key: newKey('d'), id, text };
}

/** A new term starts with one empty description field, ready to fill in. */
export function createTermDraft(): TermDraft {
  return { key: newKey('t'), termText: '', descriptions: [createDescriptionDraft()] };
}

/** A blank form with one empty term, so users can start typing right away. */
export function createEmptyDraft(): TopicDraft {
  return { title: '', description: '', terms: [createTermDraft()] };
}

/** Builds a draft from a saved topic (edit mode), keeping database ids. */
export function draftFromTopic(topic: TopicWithTerms): TopicDraft {
  return {
    title: topic.title,
    description: topic.description,
    terms: topic.terms.map((term) => ({
      key: newKey('t'),
      id: term.id,
      termText: term.termText,
      descriptions: term.descriptions.map((d) => createDescriptionDraft(d.descriptionText, d.id)),
    })),
  };
}

// ---------- Actions (used with React's useReducer) ----------

export type TopicDraftAction =
  | { type: 'setTitle'; value: string }
  | { type: 'setDescription'; value: string }
  | { type: 'addTerm' }
  | { type: 'removeTerm'; termKey: string }
  | { type: 'setTermText'; termKey: string; value: string }
  | { type: 'addDescription'; termKey: string }
  | { type: 'removeDescription'; termKey: string; descriptionKey: string }
  | { type: 'setDescriptionText'; termKey: string; descriptionKey: string; value: string }
  | { type: 'reset'; draft: TopicDraft };

function updateTerm(draft: TopicDraft, termKey: string, change: (term: TermDraft) => TermDraft): TopicDraft {
  return {
    ...draft,
    terms: draft.terms.map((term) => (term.key === termKey ? change(term) : term)),
  };
}

export function topicDraftReducer(draft: TopicDraft, action: TopicDraftAction): TopicDraft {
  switch (action.type) {
    case 'setTitle':
      return { ...draft, title: action.value };
    case 'setDescription':
      return { ...draft, description: action.value };
    case 'addTerm':
      return { ...draft, terms: [...draft.terms, createTermDraft()] };
    case 'removeTerm':
      return { ...draft, terms: draft.terms.filter((term) => term.key !== action.termKey) };
    case 'setTermText':
      return updateTerm(draft, action.termKey, (term) => ({ ...term, termText: action.value }));
    case 'addDescription':
      return updateTerm(draft, action.termKey, (term) => ({
        ...term,
        descriptions: [...term.descriptions, createDescriptionDraft()],
      }));
    case 'removeDescription':
      return updateTerm(draft, action.termKey, (term) => ({
        ...term,
        descriptions: term.descriptions.filter((d) => d.key !== action.descriptionKey),
      }));
    case 'setDescriptionText':
      return updateTerm(draft, action.termKey, (term) => ({
        ...term,
        descriptions: term.descriptions.map((d) =>
          d.key === action.descriptionKey ? { ...d, text: action.value } : d,
        ),
      }));
    case 'reset':
      return action.draft;
    default:
      return draft;
  }
}

// ---------- Validation ----------

export interface TermDraftErrors {
  termText?: string;
  /** Problem with the term's description list as a whole (e.g. none added). */
  descriptions?: string;
  /** Problems with individual description fields, by description key. */
  byDescription: Record<string, string>;
}

export interface TopicDraftErrors {
  title?: string;
  description?: string;
  /** Problem with the term list as a whole (e.g. no terms). */
  terms?: string;
  byTerm: Record<string, TermDraftErrors>;
  /** Total number of problems found. 0 means the draft can be saved. */
  count: number;
}

function textError(value: string, emptyMessage: string, maxLength: number, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return emptyMessage;
  }
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return undefined;
}

/** Checks every rule. Returns all problems at once so users can fix them together. */
export function validateTopicDraft(draft: TopicDraft): TopicDraftErrors {
  const errors: TopicDraftErrors = { byTerm: {}, count: 0 };

  errors.title = textError(draft.title, 'Enter a topic title.', LIMITS.topicTitle, 'Topic title');
  if (draft.description.trim().length > LIMITS.topicDescription) {
    errors.description = `Description must be ${LIMITS.topicDescription} characters or fewer.`;
  }
  if (draft.terms.length === 0) {
    errors.terms = 'Add at least one term.';
  }

  errors.count += Number(!!errors.title) + Number(!!errors.description) + Number(!!errors.terms);

  for (const term of draft.terms) {
    const termErrors: TermDraftErrors = { byDescription: {} };

    termErrors.termText = textError(term.termText, 'Enter a term.', LIMITS.termText, 'Term');
    if (term.descriptions.length === 0) {
      termErrors.descriptions = 'Add at least one description for this term.';
    }
    for (const desc of term.descriptions) {
      const message = textError(
        desc.text,
        'Enter a description or remove this field.',
        LIMITS.descriptionText,
        'Description',
      );
      if (message) {
        termErrors.byDescription[desc.key] = message;
      }
    }

    const termErrorCount =
      Number(!!termErrors.termText) +
      Number(!!termErrors.descriptions) +
      Object.keys(termErrors.byDescription).length;

    if (termErrorCount > 0) {
      errors.byTerm[term.key] = termErrors;
      errors.count += termErrorCount;
    }
  }

  return errors;
}

// ---------- Converting to service input ----------

/** For createTopic(). Assumes the draft passed validation. */
export function draftToNewTopicInput(draft: TopicDraft): NewTopicInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    terms: draft.terms.map((term) => ({
      termText: term.termText.trim(),
      descriptions: term.descriptions.map((d) => d.text.trim()),
    })),
  };
}

/** For updateTopicWithTerms(). Keeps ids so existing records are updated, not duplicated. */
export function draftToEditInput(draft: TopicDraft): TopicEditInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    terms: draft.terms.map((term) => ({
      id: term.id,
      termText: term.termText.trim(),
      descriptions: term.descriptions.map((d) => ({ id: d.id, descriptionText: d.text.trim() })),
    })),
  };
}

/** True if the user has typed anything (used to confirm before discarding). */
export function termHasContent(term: TermDraft): boolean {
  return term.termText.trim() !== '' || term.descriptions.some((d) => d.text.trim() !== '');
}
