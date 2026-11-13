import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppButton,
  BackHeader,
  Card,
  EmptyState,
  ProgressBar,
  ScoreBarChart,
  ScreenContainer,
  Section,
  StatTile,
} from '@/components';
import { colors, spacing, typography } from '@/constants';
import { usePlayerStats } from '@/hooks/useProfile';

/** Every statistic, calculated live from saved games and topics (updates after each change). */
export function StatisticsScreen() {
  const router = useRouter();
  const { data: stats, isLoading, error, reload } = usePlayerStats();
  const best = stats.bestGame;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  const pct = (value: number | null) => (value === null ? '—' : `${value}%`);

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="My Statistics" onBack={goBack} />

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Couldn't load your statistics" message={error}>
          <AppButton label="Try Again" icon="refresh" onPress={reload} />
        </EmptyState>
      ) : isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.row}>
              <StatTile icon="game-controller-outline" label="Games Played" value={String(stats.gamesPlayed)} />
              <StatTile icon="albums-outline" label="Topics Created" value={String(stats.topicsCreated)} />
            </View>
            <View style={styles.row}>
              <StatTile icon="trophy-outline" label="Best Score" value={best ? `${best.score}/${best.totalQuestions}` : '—'} />
              <StatTile icon="stats-chart-outline" label="Average Score" value={pct(stats.averagePercent)} />
            </View>
          </View>

          {stats.gamesPlayed === 0 ? (
            <EmptyState
              icon="bar-chart-outline"
              title="No games played yet"
              message="Finish a game and your scores, accuracy, and progress will appear here."
            >
              <AppButton label="Find a Topic" icon="albums-outline" onPress={() => router.navigate('/')} />
            </EmptyState>
          ) : (
            <>
              <Section title="Accuracy" icon="analytics-outline">
                <Card>
                  <Meter
                    label="First-try rate"
                    value={stats.firstTryPercent}
                    detail={`${stats.totalPoints} of ${stats.totalDescriptionsPlayed} descriptions right on the first try`}
                  />
                  <Meter
                    label="Overall accuracy"
                    value={stats.accuracyPercent}
                    detail={`${stats.totalCorrectMatches} correct drops out of ${stats.totalCorrectMatches + stats.totalIncorrectAttempts}`}
                  />
                </Card>
              </Section>

              <Section title="Matches" icon="git-compare-outline">
                <View style={styles.row}>
                  <StatTile icon="checkmark-circle-outline" label="Correct Matches" value={String(stats.totalCorrectMatches)} />
                  <StatTile icon="close-circle-outline" label="Incorrect Attempts" value={String(stats.totalIncorrectAttempts)} />
                </View>
                <View style={styles.row}>
                  <StatTile icon="ribbon-outline" label="Perfect Games" value={String(stats.perfectGames)} />
                  <StatTile icon="flash-outline" label="Total XP" value={String(stats.level.xp)} />
                </View>
                {stats.hasUnrecordedGames ? (
                  <Text style={styles.caption}>Some older games didn't record matches and attempts, so they aren't counted here.</Text>
                ) : null}
              </Section>

              {stats.mostPlayed ? (
                <Section title="Most Played Topic" icon="flame-outline">
                  <Card style={styles.mostPlayed}>
                    <Text style={styles.mostPlayedTitle} numberOfLines={2}>
                      {stats.mostPlayed.title}
                    </Text>
                    <Text style={styles.mostPlayedCount}>
                      {stats.mostPlayed.count} {stats.mostPlayed.count === 1 ? 'game' : 'games'}
                    </Text>
                  </Card>
                </Section>
              ) : null}

              <Section
                title="Recent Scores"
                icon="bar-chart-outline"
                description={`Score % in your last ${stats.recentGames.length} ${stats.recentGames.length === 1 ? 'game' : 'games'}.`}
              >
                <Card>
                  <ScoreBarChart games={stats.recentGames} />
                </Card>
                <AppButton
                  label="View Full History"
                  icon="time-outline"
                  variant="secondary"
                  onPress={() => router.navigate('/history')}
                />
              </Section>
            </>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

/** A labelled percentage with a progress bar. Shows "—" when there is no data. */
function Meter({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <View style={styles.meter}>
      <View style={styles.meterHeader}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterValue}>{value === null ? '—' : `${value}%`}</Text>
      </View>
      <ProgressBar value={(value ?? 0) / 100} accessibilityLabel={`${label} ${value ?? 0} percent`} />
      <Text style={styles.caption}>{value === null ? 'Not recorded yet.' : detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  grid: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  caption: typography.caption,
  meter: {
    gap: spacing.xs,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  meterLabel: typography.subheading,
  meterValue: {
    ...typography.heading,
    color: colors.highlight,
  },
  mostPlayed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mostPlayedTitle: {
    ...typography.subheading,
    flex: 1,
  },
  mostPlayedCount: {
    ...typography.label,
    color: colors.highlight,
  },
});
