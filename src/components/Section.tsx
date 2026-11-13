import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface SectionProps {
  title: string;
  icon?: IconName;
  description?: string;
  /** Optional link on the right of the title, e.g. "See All". */
  actionLabel?: string;
  onActionPress?: () => void;
  children?: ReactNode;
}

/** A titled group of content on a screen (e.g. "My Topics"). */
export function Section({
  title,
  icon,
  description,
  actionLabel,
  onActionPress,
  children,
}: SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          {icon ? <Ionicons name={icon} size={iconSize.md} color={colors.secondary} /> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            onPress={onActionPress}
            hitSlop={spacing.sm}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    flexShrink: 1,
  },
  action: {
    ...typography.label,
    color: colors.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
  description: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
});
