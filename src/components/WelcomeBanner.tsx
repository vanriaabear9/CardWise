import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';

interface WelcomeBannerProps {
  playerName: string;
  message: string;
}

/** Greeting card at the top of the Home screen. Purple border, no gradients. */
export function WelcomeBanner({ playerName, message }: WelcomeBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name} numberOfLines={1}>
          {playerName}!
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.iconCircle}>
        <Ionicons name="school-outline" size={iconSize.xl} color={colors.highlight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  greeting: {
    ...typography.caption,
    color: colors.highlight,
  },
  name: typography.heading,
  message: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
});
