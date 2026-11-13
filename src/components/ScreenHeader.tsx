import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/** Large title + optional description shown at the top of each screen. */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  title: typography.title,
  subtitle: typography.caption,
});
