import { StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

interface SettingSwitchProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

/** A settings row with an icon, a label, and an on/off switch in the CardWise purple. */
export function SettingSwitch({ icon, title, subtitle, value, onValueChange, disabled = false }: SettingSwitchProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={iconSize.md} color={colors.secondary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={title}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.highlight : colors.textSecondary}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: typography.subheading,
  subtitle: typography.caption,
});
