import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { GameProgress } from '@/utils/gameEngine';

interface GameStatsBarProps {
  progress: GameProgress;
}

/** Score, progress bar, and matched/remaining counts for the current game. */
export function GameStatsBar({ progress }: GameStatsBarProps) {
  const { score, total, matched, remaining, fraction } = progress;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.scorePill} accessibilityLabel={`Score ${score} out of ${total}`}>
          <Ionicons name="star" size={iconSize.sm} color={colors.highlight} />
          <Text style={styles.scoreText}>
            Score {score}/{total}
          </Text>
        </View>
        <Text style={styles.remaining}>{remaining} remaining</Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: matched }}
      >
        <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
      </View>

      <Text style={styles.caption}>
        {matched} of {total} descriptions matched
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scoreText: {
    ...typography.subheading,
    color: colors.highlight,
  },
  remaining: typography.label,
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  caption: typography.caption,
});
