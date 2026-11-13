import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  /** Optional action, e.g. a button. */
  children?: ReactNode;
}

/** Placeholder shown when a list has no items yet. */
export function EmptyState({ icon, title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={iconSize.lg} color={colors.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    marginBottom: spacing.xs,
  },
  title: typography.subheading,
  message: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
