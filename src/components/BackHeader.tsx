import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants';
import type { IconName } from '@/types';

import { IconButton } from './IconButton';

interface BackHeaderProps {
  /** Small label above the title, e.g. "Game History". */
  label: string;
  title: string;
  onBack: () => void;
  backIcon?: IconName;
  backLabel?: string;
}

/** Header for screens opened on top of the tabs: a back button, a small label, and a title. */
export function BackHeader({ label, title, onBack, backIcon = 'arrow-back', backLabel = 'Go back' }: BackHeaderProps) {
  return (
    <View style={styles.header}>
      <IconButton icon={backIcon} accessibilityLabel={backLabel} onPress={onBack} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  text: {
    flex: 1,
  },
  label: typography.label,
  title: typography.heading,
});
