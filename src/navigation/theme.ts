import { DarkTheme } from 'expo-router';

import { colors } from '@/constants';

/**
 * Navigation theme based on the CardWise palette.
 * Prevents white flashes between screens and keeps navigator chrome dark.
 */
export const navigationTheme: typeof DarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};
