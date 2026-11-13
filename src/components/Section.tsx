import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface SectionProps {
  title: string;
  icon?: IconName;
  description?: string;
  children?: ReactNode;
}

/** A titled group of content on a screen (e.g. "My Topics"). */
export function Section({ title, icon, description, children }: SectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon ? <Ionicons name={icon} size={iconSize.md} color={colors.secondary} /> : null}
        <Text style={styles.title}>{title}</Text>
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
    gap: spacing.sm,
  },
  title: typography.heading,
  description: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
});
