import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius } from '@/constants';
import { getAvatar } from '@/constants/avatars';

interface AvatarProps {
  avatarId: string;
  size?: number;
}

/** Round player avatar showing one of the built-in avatar icons. */
export function Avatar({ avatarId, size = 64 }: AvatarProps) {
  const avatar = getAvatar(avatarId);
  return (
    <View
      style={[styles.circle, { width: size, height: size }]}
      accessibilityLabel={`Avatar: ${avatar.label}`}
    >
      <Ionicons name={avatar.icon} size={Math.round(size * 0.5)} color={colors.highlight} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
});
