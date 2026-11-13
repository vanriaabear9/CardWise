import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants';
import type { GameResult } from '@/types';
import { formatShortDate } from '@/utils/formatDate';
import { scorePercent } from '@/utils/performance';

interface ScoreBarChartProps {
  /** Games in time order, oldest first. */
  games: GameResult[];
}

const CHART_HEIGHT = 120;
const GRID_LINES = [100, 50, 0];

/**
 * One series (score % per recent game), one purple hue, so the title names it and no legend
 * is needed. Thin bars with rounded tops anchored to the baseline and small gaps.
 * Tap a bar to see its exact value (phones have no hover).
 */
export function ScoreBarChart({ games }: ScoreBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeIndex = selectedIndex !== null && selectedIndex < games.length ? selectedIndex : games.length - 1;
  const active = games[activeIndex];

  return (
    <View style={styles.container}>
      <View style={styles.plotRow}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          {GRID_LINES.map((line) => (
            <Text key={line} style={styles.axisText}>
              {line}%
            </Text>
          ))}
        </View>

        <View style={styles.plot}>
          {/* Recessive grid lines */}
          {GRID_LINES.map((line) => (
            <View
              key={line}
              pointerEvents="none"
              style={[styles.gridLine, { bottom: (line / 100) * CHART_HEIGHT }]}
            />
          ))}

          <View style={styles.bars}>
            {games.map((game, index) => {
              const pct = scorePercent(game.score, game.totalQuestions);
              const selected = index === activeIndex;
              return (
                <Pressable
                  key={game.id}
                  onPress={() => setSelectedIndex(index)}
                  style={styles.barSlot} // the whole column is the tap target, bigger than the bar
                  accessibilityRole="button"
                  accessibilityLabel={`${game.topicTitle}, ${pct} percent, ${formatShortDate(game.completedAt)}`}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.bar,
                      // Keep a sliver visible for 0% so the game still shows up.
                      { height: Math.max(3, (pct / 100) * CHART_HEIGHT) },
                      selected ? styles.barSelected : null,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {active ? (
        <Text style={styles.readout}>
          <Text style={styles.readoutStrong}>
            {Math.min(active.score, active.totalQuestions)}/{active.totalQuestions} (
            {scorePercent(active.score, active.totalQuestions)}%)
          </Text>
          {'  '}
          {active.topicTitle} · {formatShortDate(active.completedAt)}
        </Text>
      ) : null}
      <Text style={styles.hint}>Oldest on the left, newest on the right. Tap a bar for details.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  plotRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    marginVertical: -7, // center labels on their grid lines
  },
  axisText: {
    ...typography.caption,
    fontSize: 11,
    textAlign: 'right',
  },
  plot: {
    flex: 1,
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  bars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    maxWidth: 28,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  barSelected: {
    opacity: 1,
  },
  readout: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  readoutStrong: {
    fontWeight: '700',
  },
  hint: {
    ...typography.caption,
    fontSize: 12,
  },
});
