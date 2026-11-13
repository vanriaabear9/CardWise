import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing } from '@/constants';
import type { IconName } from '@/types';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  /** Greys the button out and ignores taps. */
  disabled?: boolean;
  /** Shows a spinner instead of the icon and ignores taps (e.g. while saving). */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Screen-reader label when the visible label isn't specific enough (e.g. "Remove World Capitals"). */
  accessibilityLabel?: string;
}

const CONTENT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.textPrimary,
  secondary: colors.secondary,
  danger: colors.danger,
};

/**
 * Rounded button.
 * - primary: solid purple, for the main action on a screen.
 * - secondary: outlined lavender, for supporting actions.
 * - danger: outlined red, for destructive actions (e.g. delete).
 */
export function AppButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const contentColor = CONTENT_COLOR[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <Ionicons name={icon} size={iconSize.md} color={contentColor} />
      ) : null}
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
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
