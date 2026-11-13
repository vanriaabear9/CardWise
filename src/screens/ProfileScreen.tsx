import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import {
  Avatar,
  Card,
  IconButton,
  ListItem,
  ProgressBar,
  ScreenContainer,
  ScreenHeader,
  Section,
  SettingSwitch,
  StatTile,
} from '@/components';
import { colors, spacing, typography } from '@/constants';
import { usePlayerStats, useProfile } from '@/hooks/useProfile';
import { useSoundSetting } from '@/hooks/useSoundEffects';
import { getErrorMessage } from '@/services/errors';
import type { IconName } from '@/types';

interface MenuEntry {
  icon: IconName;
  title: string;
  subtitle: string;
  href: Href;
}

const MENU: MenuEntry[] = [
  { icon: 'stats-chart-outline', title: 'My Statistics', subtitle: 'Scores, accuracy, and progress', href: '/profile/statistics' },
  { icon: 'albums-outline', title: 'Manage Topics', subtitle: 'Edit or delete your topics', href: '/profile/topics' },
  { icon: 'heart-outline', title: 'My Favorites', subtitle: 'Topics you saved', href: '/profile/favorites' },
  { icon: 'ribbon-outline', title: 'Achievements', subtitle: 'Badges you can earn', href: '/profile/achievements' },
  { icon: 'help-circle-outline', title: 'Help & Instructions', subtitle: 'How to use CardWise', href: '/profile/help' },
  { icon: 'information-circle-outline', title: 'About CardWise', subtitle: 'App information', href: '/profile/about' },
];

/** Profile dashboard: local player profile, key statistics, and the profile menu. No accounts, no log out. */
export function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: stats, error: statsError } = usePlayerStats();
  const sound = useSoundSetting();
  const { level } = stats;
  const best = stats.bestGame;

  const changeSound = (enabled: boolean) => {
    sound.setEnabled(enabled).catch((error) =>
      Alert.alert("Couldn't save the sound setting", getErrorMessage(error)),
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" />

      <Card style={styles.playerCard}>
        <View style={styles.playerRow}>
          <Avatar avatarId={profile.avatarId} size={68} />
          <View style={styles.playerText}>
            <Text style={styles.playerName} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text style={styles.level}>Level {level.level}</Text>
          </View>
          <IconButton icon="pencil" accessibilityLabel="Edit profile" onPress={() => router.push('/profile/edit')} />
        </View>
        <View style={styles.xp}>
          <ProgressBar
            value={level.xpIntoLevel / level.xpPerLevel}
            accessibilityLabel={`${level.xpIntoLevel} of ${level.xpPerLevel} XP to level ${level.level + 1}`}
          />
          <Text style={styles.caption}>
            {level.xpIntoLevel}/{level.xpPerLevel} XP to Level {level.level + 1} · earn 1 XP per first-try point
          </Text>
        </View>
      </Card>

      <View style={styles.statsRow}>
        <StatTile icon="game-controller-outline" label="Games Played" value={String(stats.gamesPlayed)} />
        <StatTile icon="trophy-outline" label="Best Score" value={best ? `${best.score}/${best.totalQuestions}` : '—'} />
        <StatTile icon="albums-outline" label="Topics Created" value={String(stats.topicsCreated)} />
      </View>
      {statsError ? <Text style={styles.error}>Couldn't load statistics. {statsError}</Text> : null}

      <Section title="Settings" icon="settings-outline">
        <SettingSwitch
          icon={sound.enabled ? 'volume-high-outline' : 'volume-mute-outline'}
          title="Sound Effects"
          subtitle={sound.enabled ? 'Sounds play during games' : 'Games are silent'}
          value={sound.enabled}
          onValueChange={changeSound}
          disabled={sound.isLoading}
        />
      </Section>

      <View style={styles.menu}>
        {MENU.map((entry) => (
          <ListItem
            key={entry.title}
            icon={entry.icon}
            title={entry.title}
            subtitle={entry.subtitle}
            showChevron
            onPress={() => router.push(entry.href)}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    gap: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  playerText: {
    flex: 1,
    gap: spacing.xs,
  },
  playerName: typography.heading,
  level: {
    ...typography.label,
    color: colors.highlight,
  },
  xp: {
    gap: spacing.xs,
  },
  caption: typography.caption,
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  menu: {
    gap: spacing.md,
  },
});
