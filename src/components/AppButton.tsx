import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing } from '@/constants';
import type { IconName } from '@/types';

type ButtonVariant = 'primary' | 'secondary';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

/**
 * Rounded button.
 * - primary: solid purple, for the main action on a screen.
 * - secondary: outlined lavender, for supporting actions.
 */
export function AppButton({ label, onPress, icon, variant = 'primary', style }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const contentColor = isPrimary ? colors.textPrimary : colors.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={iconSize.md} color={contentColor} /> : null}
      <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
