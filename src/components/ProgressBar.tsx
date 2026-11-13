import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/constants';

interface ProgressBarProps {
  /** 0 to 1. */
  value: number;
  /** Read by screen readers, e.g. "Accuracy 82 percent". */
  accessibilityLabel: string;
  height?: number;
}

/** Thin purple progress bar on a dark track. */
export function ProgressBar({ value, accessibilityLabel, height = 8 }: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
