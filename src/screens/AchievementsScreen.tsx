import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { AppButton, BackHeader, EmptyState, ProgressBar, ScreenContainer } from '@/components';
import { colors, iconSize, radius, spacing, typography } from '@/constants';
import { useAchievements } from '@/hooks/useProfile';
import type { Achievement } from '@/types';

/** Achievements calculated from real data (games, topics, favorites). Updates automatically. */
export function AchievementsScreen() {
  const router = useRouter();
  const { achievements, isLoading, error, reload } = useAchievements();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="Achievements" onBack={goBack} />

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Couldn't load achievements" message={error}>
          <AppButton label="Try Again" icon="refresh" onPress={reload} />
        </EmptyState>
      ) : isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryValue}>
              {unlockedCount}/{achievements.length}
            </Text>
            <Text style={styles.caption}>achievements unlocked</Text>
            <ProgressBar
              value={achievements.length ? unlockedCount / achievements.length : 0}
              accessibilityLabel={`${unlockedCount} of ${achievements.length} achievements unlocked`}
            />
          </View>
          <View style={styles.list}>
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { unlocked, current, target } = achievement;
  return (
    <View
      style={[styles.card, unlocked && styles.cardUnlocked]}
      accessible
      accessibilityLabel={`${achievement.title}. ${achievement.description} ${unlocked ? 'Unlocked' : `Locked, ${current} of ${target}`}`}
    >
      <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
        <Ionicons name={achievement.icon} size={26} color={unlocked ? colors.highlight : colors.textSecondary} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !unlocked && styles.titleLocked]}>{achievement.title}</Text>
          {/* Status is shown with an icon AND a word, never color alone. */}
          <View style={[styles.status, unlocked && styles.statusUnlocked]}>
            <Ionicons
              name={unlocked ? 'checkmark-circle' : 'lock-closed'}
              size={iconSize.sm - 4}
              color={unlocked ? colors.highlight : colors.textSecondary}
            />
            <Text style={[styles.statusText, unlocked && styles.statusTextUnlocked]}>
              {unlocked ? 'Unlocked' : 'Locked'}
            </Text>
          </View>
        </View>
        <Text style={styles.caption}>{achievement.description}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <ProgressBar value={current / target} height={6} accessibilityLabel={`${current} of ${target}`} />
          </View>
          <Text style={styles.progressText}>
            {current}/{target}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  summary: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.highlight,
  },
  caption: typography.caption,
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnlocked: {
    borderColor: colors.primary,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeUnlocked: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.subheading,
    flexShrink: 1,
  },
  titleLocked: {
    color: colors.textSecondary,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  statusUnlocked: {
    backgroundColor: colors.primaryMuted,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
  },
  statusTextUnlocked: {
    color: colors.highlight,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    ...typography.label,
    minWidth: 32,
    textAlign: 'right',
  },
});
