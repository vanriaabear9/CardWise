import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, ScreenContainer, ScreenHeader, Section, StatTile } from '@/components';
import { colors, spacing, typography } from '@/constants';

/**
 * Placeholder layout for game history.
 * Game results (score, date played) will come from the local database later.
 */
export function HistoryScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="History" subtitle="Review your past games and progress." />

      <View style={styles.statsRow}>
        <StatTile icon="game-controller-outline" label="Games" value="0" />
        <StatTile icon="trophy-outline" label="Best Score" value="—" />
        <StatTile icon="calendar-outline" label="Last Played" value="—" />
      </View>

      <Section title="Previous Games" icon="time-outline" description="Your scores and the dates you played.">
        <View style={styles.columnHeader}>
          <Text style={[styles.columnText, styles.topicColumn]}>Topic</Text>
          <Text style={styles.columnText}>Score</Text>
          <Text style={[styles.columnText, styles.dateColumn]}>Date Played</Text>
        </View>
        <EmptyState
          icon="time-outline"
          title="No games yet"
          message="Finish a game and your score and date will show up here."
        />
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columnHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  columnText: typography.label,
  topicColumn: {
    flex: 1,
  },
  dateColumn: {
    minWidth: 90,
    textAlign: 'right',
  },
});
