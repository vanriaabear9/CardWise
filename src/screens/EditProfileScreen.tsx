import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AppButton, AppTextInput, Avatar, BackHeader, ScreenContainer, Section } from '@/components';
import { colors, radius, spacing, typography } from '@/constants';
import { AVATARS, MAX_PLAYER_NAME_LENGTH } from '@/constants/avatars';
import { useProfile } from '@/hooks/useProfile';
import { getErrorMessage } from '@/services/errors';
import { saveProfile } from '@/services/profileService';

/** Change the local display name and pick a built-in avatar. Saved only on this device. */
export function EditProfileScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();

  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [loaded, setLoaded] = useState(false);
  const [showError, setShowError] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fill the form once the saved profile has loaded.
  useEffect(() => {
    if (!isLoading && !loaded) {
      setName(profile.isDefault ? '' : profile.displayName);
      setAvatarId(profile.avatarId);
      setLoaded(true);
    }
  }, [isLoading, loaded, profile]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  const trimmed = name.trim();
  const nameError = trimmed.length === 0 ? 'Please enter a display name.' : null;

  const handleSave = async () => {
    if (saving) return;
    if (nameError) {
      setShowError(true);
      return;
    }
    setSaving(true);
    try {
      await saveProfile(db, { displayName: trimmed, avatarId });
      goBack();
    } catch (error) {
      Alert.alert("Couldn't save your profile", getErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="Edit Profile" onBack={goBack} />

      <View style={styles.preview}>
        <Avatar avatarId={avatarId} size={96} />
        <Text style={styles.previewName} numberOfLines={1}>
          {trimmed || profile.displayName}
        </Text>
        <Text style={styles.caption}>Saved only on this device. No account needed.</Text>
      </View>

      <Section title="Display Name" icon="person-outline">
        <AppTextInput
          placeholder="e.g. Alex"
          value={name}
          onChangeText={setName}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel="Display name"
          error={showError && nameError ? nameError : undefined}
        />
        <Text style={styles.caption}>
          {trimmed.length}/{MAX_PLAYER_NAME_LENGTH} characters
        </Text>
      </Section>

      <Section title="Avatar" icon="happy-outline">
        <View style={styles.grid}>
          {AVATARS.map((avatar) => {
            const selected = avatar.id === avatarId;
            return (
              <Pressable
                key={avatar.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Avatar ${avatar.label}`}
                onPress={() => setAvatarId(avatar.id)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Avatar avatarId={avatar.id} size={52} />
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={1}>
                  {avatar.label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.highlight} style={styles.check} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Section>

      <AppButton label="Save Profile" icon="checkmark" onPress={handleSave} loading={saving} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewName: typography.heading,
  caption: typography.caption,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionLabel: {
    ...typography.label,
    fontSize: 12,
  },
  optionLabelSelected: {
    color: colors.highlight,
  },
  check: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
});
