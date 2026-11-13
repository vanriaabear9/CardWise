import { useMemo, useReducer, useState } from 'react';

import { topicDraftReducer, validateTopicDraft, type TopicDraft } from '@/utils/topicDraft';

/**
 * Holds a topic form's draft in local component state (not SQLite).
 *
 * Validation messages are hidden until the user first tries to save,
 * then update live as they fix each problem.
 */
export function useTopicDraft(createInitialDraft: () => TopicDraft) {
  const [draft, dispatch] = useReducer(topicDraftReducer, undefined, createInitialDraft);
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => validateTopicDraft(draft), [draft]);

  return {
    draft,
    dispatch,
    errors,
    /** Errors to display (null until the user has tried to save). */
    visibleErrors: showErrors ? errors : null,
    showErrors: () => setShowErrors(true),
    /** Replaces the draft (e.g. clear after save, or load a topic) and hides errors. */
    reset: (next: TopicDraft) => {
      dispatch({ type: 'reset', draft: next });
      setShowErrors(false);
    },
  };
}
