import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Small text on the right side (e.g. a score). */
  trailingText?: string;
  /** Show a ">" arrow on the right (for rows that open another page). */
  showChevron?: boolean;
  onPress?: () => void;
}

/** A tappable row with an icon badge, title, subtitle, and optional right-side info. */
export function ListItem({
  title,
  subtitle,
  icon,
  trailingText,
  showChevron = false,
  onPress,
}: ListItemProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? (
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={iconSize.md} color={colors.secondary} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailingText ? <Text style={styles.trailing}>{trailingText}</Text> : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={iconSize.md} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: typography.subheading,
  subtitle: typography.caption,
  trailing: {
    ...typography.subheading,
    color: colors.highlight,
  },
});
