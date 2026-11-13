import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing } from '@/constants';

export type FeedbackKind = 'correct' | 'incorrect' | 'info';

interface MatchFeedbackBannerProps {
  kind: FeedbackKind;
  message: string;
}

const STYLE: Record<FeedbackKind, { icon: 'checkmark-circle' | 'close-circle' | 'hand-left-outline'; color: string; background: string }> = {
  correct: { icon: 'checkmark-circle', color: colors.highlight, background: colors.primaryMuted },
  incorrect: { icon: 'close-circle', color: colors.danger, background: colors.dangerMuted },
  info: { icon: 'hand-left-outline', color: colors.textSecondary, background: colors.surface },
};

/**
 * One-line feedback after each drop. Uses an icon AND text (not just color),
 * and is announced by screen readers.
 */
export function MatchFeedbackBanner({ kind, message }: MatchFeedbackBannerProps) {
  const style = STYLE[kind];
  return (
    <View
      style={[styles.banner, { backgroundColor: style.background, borderColor: style.color }]}
      accessibilityLiveRegion="polite"
      accessibilityRole={kind === 'info' ? 'text' : 'alert'}
    >
      <Ionicons name={style.icon} size={iconSize.md} color={style.color} />
      <Text style={[styles.text, { color: kind === 'info' ? colors.textSecondary : colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
