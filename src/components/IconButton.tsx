import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius } from '@/constants';
import type { IconName } from '@/types';

type IconButtonTone = 'default' | 'danger';

interface IconButtonProps {
  icon: IconName;
  /** Read aloud by screen readers, e.g. "Delete term 2". Required because there is no visible text. */
  accessibilityLabel: string;
  onPress?: () => void;
  tone?: IconButtonTone;
  size?: number;
}

/** Round icon-only button (e.g. delete, edit, back). 40×40 for an easy tap target. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = 'default',
  size = iconSize.md,
}: IconButtonProps) {
  const isDanger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        isDanger ? styles.danger : styles.default,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={size} color={isDanger ? colors.danger : colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.dangerMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
