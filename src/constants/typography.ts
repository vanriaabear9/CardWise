import { TextStyle } from 'react-native';

import { colors } from './colors';

/** Reusable text styles. Spread them into StyleSheet entries. */
export const typography = {
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  heading: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  subheading: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
} as const satisfies Record<string, TextStyle>;
