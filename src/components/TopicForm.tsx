import { Dispatch, ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { spacing } from '@/constants';
import { LIMITS } from '@/services/topicService';
import {
  termHasContent,
  type TopicDraft,
  type TopicDraftAction,
  type TopicDraftErrors,
} from '@/utils/topicDraft';

import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { FieldError } from './FieldError';
import { Section } from './Section';
import { TermEditorCard } from './TermEditorCard';

interface TopicFormProps {
  draft: TopicDraft;
  dispatch: Dispatch<TopicDraftAction>;
  /** Validation errors to show, or null to hide them (before the first save attempt). */
  errors: TopicDraftErrors | null;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
  /** Optional extra content below the Save button (e.g. Delete Topic in edit mode). */
  footer?: ReactNode;
}

/** The full create/edit topic form. Used by both the Create tab and the Edit Topic screen. */
export function TopicForm({ draft, dispatch, errors, onSave, saving, saveLabel, footer }: TopicFormProps) {
  const removeTerm = (termKey: string, termNumber: number) => {
    const term = draft.terms.find((t) => t.key === termKey);
    const remove = () => dispatch({ type: 'removeTerm', termKey });

    // Ask first only if the term has content that would be lost.
    if (!term || !termHasContent(term)) {
      remove();
      return;
    }
    Alert.alert(
      `Remove term ${termNumber}?`,
      'This term and all of its descriptions will be removed from the form.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: remove },
      ],
    );
  };

  const problemCount = errors?.count ?? 0;

  return (
    <View style={styles.container}>
      <Section title="Topic Title" icon="bookmark-outline">
        <AppTextInput
          placeholder="e.g. Biology Basics"
          value={draft.title}
          onChangeText={(value) => dispatch({ type: 'setTitle', value })}
          maxLength={LIMITS.topicTitle}
          error={errors?.title}
          accessibilityLabel="Topic title"
        />
      </Section>

      <Section title="Description" icon="document-text-outline" description="Optional — what is this topic about?">
        <AppTextInput
          placeholder="e.g. Key terms for my biology midterm"
          value={draft.description}
          onChangeText={(value) => dispatch({ type: 'setDescription', value })}
          multiline
          maxLength={LIMITS.topicDescription}
          error={errors?.description}
          accessibilityLabel="Topic description"
        />
      </Section>

      <Section
        title="Terms & Descriptions"
        icon="list-outline"
        description="Each term becomes a flashcard. Add at least one description per term."
      >
        {draft.terms.map((term, index) => (
          <TermEditorCard
            key={term.key}
            term={term}
            index={index}
            errors={errors?.byTerm[term.key]}
            dispatch={dispatch}
            onRemove={() => removeTerm(term.key, index + 1)}
          />
        ))}

        <FieldError message={errors?.terms} />

        <AppButton
          label="Add Term"
          icon="add-circle-outline"
          variant="secondary"
          onPress={() => dispatch({ type: 'addTerm' })}
        />
      </Section>

      <View style={styles.actions}>
        <FieldError
          message={
            problemCount > 0
              ? `Please fix ${problemCount} ${problemCount === 1 ? 'problem' : 'problems'} above before saving.`
              : undefined
          }
        />
        <AppButton label={saveLabel} icon="checkmark" onPress={onSave} loading={saving} />
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  actions: {
    gap: spacing.md,
  },
});
