import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

import { FieldError } from './FieldError';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  /** Validation message. When set, the field gets a red border and the message is shown below. */
  error?: string;
}

/** Rounded dark text field with an optional label above and icon inside. */
export function AppTextInput({ label, icon, error, style, multiline, ...rest }: AppTextInputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, multiline && styles.fieldMultiline, !!error && styles.fieldError]}>
        {icon ? <Ionicons name={icon} size={iconSize.md} color={colors.textSecondary} /> : null}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.secondary}
          cursorColor={colors.secondary}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: typography.label,
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.md,
  },
  inputMultiline: {
    minHeight: 72,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
});
