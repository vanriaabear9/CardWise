import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, spacing } from '@/constants';

interface FieldErrorProps {
  message?: string;
}

/** Small red validation message with an icon. Renders nothing when there is no message. */
export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.row} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={iconSize.sm} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.danger,
  },
});
