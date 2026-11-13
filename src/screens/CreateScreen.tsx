import { useState } from 'react';
import { Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { ScreenContainer, ScreenHeader, TopicForm } from '@/components';
import { useTopicDraft } from '@/hooks/useTopicDraft';
import { getErrorMessage } from '@/services/errors';
import { createTopic } from '@/services/topicService';
import { createEmptyDraft, draftToNewTopicInput } from '@/utils/topicDraft';

/**
 * Create a new topic with terms and descriptions.
 * The form is kept in local state; it is saved to SQLite (in one transaction) only on "Save Topic".
 */
export function CreateScreen() {
  const db = useSQLiteContext();
  const { draft, dispatch, errors, visibleErrors, showErrors, reset } = useTopicDraft(createEmptyDraft);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (saving) {
      return;
    }
    if (errors.count > 0) {
      showErrors();
      return;
    }

    setSaving(true);
    try {
      const input = draftToNewTopicInput(draft);
      await createTopic(db, input);
      reset(createEmptyDraft());
      Alert.alert('Topic saved', `"${input.title}" was added to My Topics on the Home screen.`);
    } catch (error) {
      Alert.alert('Could not save topic', `${getErrorMessage(error)}\n\nYour entries are still here, so you can try again.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Create Topic" subtitle="Build your own set of flashcards." />
      <TopicForm
        draft={draft}
        dispatch={dispatch}
        errors={visibleErrors}
        onSave={handleSave}
        saving={saving}
        saveLabel="Save Topic"
      />
    </ScreenContainer>
  );
}
