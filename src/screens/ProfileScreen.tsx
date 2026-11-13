import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';

import { Card, ListItem, ScreenContainer, ScreenHeader, Section, StatTile } from '@/components';
import { colors, radius, spacing, typography } from '@/constants';

/**
 * Placeholder layout for the local (offline) player profile.
 * There are no online accounts — player data will be stored on the device later.
 */
export function ProfileScreen() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" />

      <Section title="Player Information" icon="person-circle-outline">
        <Card style={styles.playerCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.secondary} />
          </View>
          <View style={styles.playerText}>
            <Text style={styles.playerName}>Player</Text>
            <Text style={styles.playerMeta}>Offline profile on this device</Text>
          </View>
        </Card>
      </Section>

      <Section title="Statistics" icon="stats-chart-outline">
        <View style={styles.statsRow}>
          <StatTile icon="albums-outline" label="Topics" value="0" />
          <StatTile icon="game-controller-outline" label="Games" value="0" />
          <StatTile icon="trophy-outline" label="Best Score" value="—" />
        </View>
      </Section>

      <View style={styles.menu}>
        <ListItem icon="heart-outline" title="My Favorites" subtitle="Topics you saved" showChevron />
        <ListItem icon="ribbon-outline" title="Achievements" subtitle="Badges you earned" showChevron />
        <ListItem
          icon="help-circle-outline"
          title="Help & Instructions"
          subtitle="How to play CardWise"
          showChevron
        />
        <ListItem
          icon="information-circle-outline"
          title="About CardWise"
          subtitle={`Version ${appVersion}`}
          showChevron
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  playerText: {
    flex: 1,
    gap: spacing.xs,
  },
  playerName: typography.heading,
  playerMeta: typography.caption,
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  menu: {
    gap: spacing.md,
  },
});
