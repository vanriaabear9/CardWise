import { StyleSheet, Text, View } from 'react-native';

import {
  AppButton,
  AppTextInput,
  Card,
  ScreenContainer,
  ScreenHeader,
  Section,
} from '@/components';
import { spacing, typography } from '@/constants';

/**
 * Placeholder layout for creating a topic.
 * Inputs and buttons are visual only; saving will be added with the database.
 */
export function CreateScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Create Topic" subtitle="Build your own set of flashcards." />

      <Section title="Topic Title" icon="bookmark-outline">
        <AppTextInput placeholder="e.g. Biology Basics" />
      </Section>

      <Section
        title="Terms and Descriptions"
        icon="list-outline"
        description="Each term becomes one flashcard."
      >
        <Card>
          <Text style={styles.cardLabel}>Card 1</Text>
          <AppTextInput label="Term" placeholder="e.g. Photosynthesis" />
          <AppTextInput
            label="Description"
            placeholder="e.g. How plants turn light into energy"
            multiline
          />
        </Card>

        <View style={styles.actionRow}>
          <AppButton label="Add Term" icon="add" variant="secondary" style={styles.flexButton} />
          <AppButton
            label="Add Description"
            icon="document-text-outline"
            variant="secondary"
            style={styles.flexButton}
          />
        </View>
      </Section>

      <AppButton label="Save Topic" icon="checkmark" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardLabel: typography.label,
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  flexButton: {
    flexGrow: 1,
  },
});
