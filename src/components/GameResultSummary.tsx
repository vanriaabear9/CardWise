import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing, typography } from '@/constants';
import type { GameResult } from '@/types';
import { formatDateTime } from '@/utils/formatDate';
import { getPerformance, scorePercent } from '@/utils/performance';
import { formatDuration } from '@/utils/time';

import { Card } from './Card';
import { StatTile } from './StatTile';

interface GameResultSummaryProps {
  /** Only the numbers are used here, so a saved record or an unsaved summary both work. */
  result: Pick<
    GameResult,
    'topicTitle' | 'score' | 'totalQuestions' | 'correctMatches' | 'incorrectAttempts' | 'durationMs' | 'completedAt'
  >;
  /** Headline, e.g. "Topic Completed!" */
  heading: string;
}

const NOT_RECORDED = '—';

/** Score card + statistics for one finished game. Used by Results and History Details. */
export function GameResultSummary({ result, heading }: GameResultSummaryProps) {
  // Never show more points than descriptions.
  const score = Math.min(result.score, result.totalQuestions);
  const performance = getPerformance(score, result.totalQuestions);
  const percent = scorePercent(score, result.totalQuestions);
  const completed = formatDateTime(result.completedAt);

  return (
    <View style={styles.container}>
      <Card style={styles.hero}>
        <View style={styles.badge}>
          <Ionicons name={performance.icon} size={34} color={colors.highlight} />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          {heading}
        </Text>
        <Text style={styles.topic} numberOfLines={2}>
          {result.topicTitle}
        </Text>

        <Text style={styles.scoreLabel}>Final Score</Text>
        <Text
          style={styles.score}
          accessibilityLabel={`Final score ${score} out of ${result.totalQuestions}, ${percent} percent`}
        >
          {score}/{result.totalQuestions}
        </Text>
        <Text style={styles.caption}>{percent}% correct on the first try</Text>

        <View style={styles.performance}>
          <Text style={styles.performanceLabel}>{performance.label}</Text>
          <Text style={styles.performanceMessage}>{performance.message}</Text>
        </View>
      </Card>

      <View style={styles.grid}>
        <View style={styles.row}>
          <StatTile icon="layers-outline" label="Total Descriptions" value={String(result.totalQuestions)} />
          <StatTile
            icon="checkmark-circle-outline"
            label="Correct Matches"
            value={result.correctMatches === null ? NOT_RECORDED : String(result.correctMatches)}
          />
        </View>
        <View style={styles.row}>
          <StatTile
            icon="close-circle-outline"
            label="Incorrect Attempts"
            value={result.incorrectAttempts === null ? NOT_RECORDED : String(result.incorrectAttempts)}
          />
          <StatTile
            icon="time-outline"
            label="Time"
            value={result.durationMs === null ? NOT_RECORDED : formatDuration(result.durationMs)}
          />
        </View>
      </View>

      {completed ? (
        <View style={styles.completedRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.caption}>Completed {completed}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.xs,
  },
  heading: {
    ...typography.title,
    textAlign: 'center',
  },
  topic: {
    ...typography.subheading,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scoreLabel: {
    ...typography.label,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: '800',
    color: colors.highlight,
  },
  caption: typography.caption,
  performance: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  performanceLabel: {
    ...typography.heading,
    color: colors.highlight,
  },
  performanceMessage: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
