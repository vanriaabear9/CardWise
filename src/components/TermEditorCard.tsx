import { Dispatch } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants';
import { LIMITS } from '@/services/topicService';
import type { TermDraft, TermDraftErrors, TopicDraftAction } from '@/utils/topicDraft';

import { AppButton } from './AppButton';
import { AppTextInput } from './AppTextInput';
import { Card } from './Card';
import { FieldError } from './FieldError';
import { IconButton } from './IconButton';

interface TermEditorCardProps {
  term: TermDraft;
  /** 0-based position, shown to users as "Term 1", "Term 2", ... */
  index: number;
  errors?: TermDraftErrors;
  dispatch: Dispatch<TopicDraftAction>;
  onRemove: () => void;
}

/** Editable card for one term and its list of descriptions. */
export function TermEditorCard({ term, index, errors, dispatch, onRemove }: TermEditorCardProps) {
  const termNumber = index + 1;

  return (
    <Card style={!!errors && styles.cardError}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Term {termNumber}</Text>
        <IconButton
          icon="trash-outline"
          tone="danger"
          accessibilityLabel={`Remove term ${termNumber}`}
          onPress={onRemove}
        />
      </View>

      <AppTextInput
        label="Term"
        placeholder="e.g. Photosynthesis"
        value={term.termText}
        onChangeText={(value) => dispatch({ type: 'setTermText', termKey: term.key, value })}
        maxLength={LIMITS.termText}
        error={errors?.termText}
      />

      {term.descriptions.map((description, descriptionIndex) => (
        <View key={description.key} style={styles.descriptionBlock}>
          <View style={styles.descriptionHeader}>
            <Text style={styles.descriptionLabel}>Description {descriptionIndex + 1}</Text>
            <IconButton
              icon="close"
              tone="danger"
              size={18}
              accessibilityLabel={`Remove description ${descriptionIndex + 1} of term ${termNumber}`}
              onPress={() =>
                dispatch({ type: 'removeDescription', termKey: term.key, descriptionKey: description.key })
              }
            />
          </View>
          <AppTextInput
            placeholder="e.g. How plants turn sunlight into energy"
            value={description.text}
            onChangeText={(value) =>
              dispatch({
                type: 'setDescriptionText',
                termKey: term.key,
                descriptionKey: description.key,
                value,
              })
            }
            multiline
            maxLength={LIMITS.descriptionText}
            error={errors?.byDescription[description.key]}
            accessibilityLabel={`Description ${descriptionIndex + 1} of term ${termNumber}`}
          />
        </View>
      ))}

      <FieldError message={errors?.descriptions} />

      <AppButton
        label="Add Description"
        icon="add"
        variant="secondary"
        onPress={() => dispatch({ type: 'addDescription', termKey: term.key })}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  cardError: {
    borderColor: colors.danger,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.subheading,
    color: colors.highlight,
  },
  descriptionBlock: {
    gap: spacing.xs,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  descriptionLabel: typography.label,
});
