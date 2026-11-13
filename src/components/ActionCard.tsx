import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

import { AppButton } from './AppButton';
import { Card } from './Card';

interface ActionCardProps {
  icon: IconName;
  title: string;
  message: string;
  actionLabel: string;
  actionIcon?: IconName;
  onPress?: () => void;
}

/** Card with a short message and one primary button (e.g. the Create Topic shortcut). */
export function ActionCard({
  icon,
  title,
  message,
  actionLabel,
  actionIcon,
  onPress,
}: ActionCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={iconSize.lg} color={colors.secondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      <AppButton label={actionLabel} icon={actionIcon} onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: typography.subheading,
  message: typography.caption,
});
