import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import {
  AppButton,
  EmptyState,
  ListItem,
  ScreenContainer,
  ScreenHeader,
  Section,
  SegmentedTabs,
  StatTile,
} from '@/components';
import type { SegmentOption } from '@/components';
import { colors, iconSize, radius, spacing, typography } from '@/constants';
import { useGameHistory } from '@/hooks/useGameHistory';
import { formatShortDate } from '@/utils/formatDate';
import { computeHistoryStats, groupHistoryTopics, historyTopicKey } from '@/utils/historyStats';
import { getPerformance } from '@/utils/performance';

type HistoryFilter = 'all' | 'topic';

const FILTERS: SegmentOption<HistoryFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'topic', label: 'By Topic' },
];

/** Game History dashboard: statistics and every completed game from the local database. */
export function HistoryScreen() {
  const router = useRouter();
  const { data: games, isLoading, error, reload } = useGameHistory();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);

  const stats = useMemo(() => computeHistoryStats(games), [games]);
  const topics = useMemo(() => groupHistoryTopics(games), [games]);

  // If the chosen topic disappears from the list, fall back to the most recent one.
  const activeTopic = topics.find((t) => t.key === selectedTopicKey) ?? topics[0] ?? null;
  const visibleGames =
    filter === 'topic' && activeTopic ? games.filter((g) => historyTopicKey(g) === activeTopic.key) : games;

  const openGame = (id: number) =>
    router.push({ pathname: '/history/[historyId]', params: { historyId: String(id) } });

  const best = stats.bestGame;

  return (
    <ScreenContainer>
      <ScreenHeader title="Game History" subtitle="Review your past games and progress." />

      <View style={styles.statsRow}>
        <StatTile icon="game-controller-outline" label="Games Played" value={String(stats.totalGames)} />
        <StatTile
          icon="trophy-outline"
          label="Best Score"
          value={best ? `${best.score}/${best.totalQuestions}` : '—'}
        />
        <StatTile
          icon="stats-chart-outline"
          label="Average"
          value={stats.averagePercent === null ? '—' : `${stats.averagePercent}%`}
        />
      </View>

      {stats.mostPlayed ? (
        <View style={styles.mostPlayed}>
          <View style={styles.mostPlayedIcon}>
            <Ionicons name="flame-outline" size={iconSize.md} color={colors.highlight} />
          </View>
          <View style={styles.mostPlayedText}>
            <Text style={styles.mostPlayedLabel}>Most Played Topic</Text>
            <Text style={styles.mostPlayedTitle} numberOfLines={1}>
              {stats.mostPlayed.title}
            </Text>
          </View>
          <Text style={styles.mostPlayedCount}>
            {stats.mostPlayed.count} {stats.mostPlayed.count === 1 ? 'game' : 'games'}
          </Text>
        </View>
      ) : null}

      <Section title="Completed Games" icon="time-outline">
        <SegmentedTabs options={FILTERS} value={filter} onChange={setFilter} />

        {filter === 'topic' && topics.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {topics.map((topic) => {
              const selected = topic.key === activeTopic?.key;
              return (
                <Pressable
                  key={topic.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedTopicKey(topic.key)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                    {topic.title} · {topic.count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {error ? (
          <EmptyState icon="alert-circle-outline" title="Couldn't load your history" message={error}>
            <AppButton label="Try Again" icon="refresh" onPress={reload} />
          </EmptyState>
        ) : isLoading && games.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : games.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No games yet"
            message="Completed games will appear here. Finish a topic to see your score, date, and answers."
          >
            <AppButton label="Find a Topic" icon="albums-outline" onPress={() => router.navigate('/')} />
          </EmptyState>
        ) : (
          <View style={styles.list}>
            {visibleGames.map((game) => (
              <ListItem
                key={game.id}
                icon={getPerformance(game.score, game.totalQuestions).icon}
                title={game.topicTitle}
                subtitle={`${formatShortDate(game.completedAt)} · ${getPerformance(game.score, game.totalQuestions).label}`}
                trailingText={`${Math.min(game.score, game.totalQuestions)}/${game.totalQuestions}`}
                showChevron
                onPress={() => openGame(game.id)}
              />
            ))}
          </View>
        )}
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mostPlayed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mostPlayedIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  mostPlayedText: {
    flex: 1,
    gap: 2,
  },
  mostPlayedLabel: typography.caption,
  mostPlayedTitle: typography.subheading,
  mostPlayedCount: {
    ...typography.label,
    color: colors.highlight,
  },
  chips: {
    gap: spacing.sm,
  },
  chip: {
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    ...typography.label,
  },
  chipTextSelected: {
    color: colors.highlight,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  list: {
    gap: spacing.md,
  },
});
