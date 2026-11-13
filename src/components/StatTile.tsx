import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface StatTileProps {
  label: string;
  value: string;
  icon: IconName;
}

/** A small card showing one number (e.g. "Games Played: 0"). Use several in a row. */
export function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={iconSize.md} color={colors.secondary} />
      <Text style={styles.value}>{value}</Text>
      {/* Two lines so labels like "Topics Created" aren't cut off on narrow phones. */}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  value: {
    ...typography.heading,
    marginTop: spacing.xs,
  },
  label: typography.caption,
});
