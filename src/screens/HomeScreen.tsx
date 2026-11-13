import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  ActionCard,
  AppTextInput,
  BrandHeader,
  EmptyState,
  ListItem,
  ScreenContainer,
  Section,
  SegmentedTabs,
  TopicCarousel,
  WelcomeBanner,
} from '@/components';
import type { SegmentOption } from '@/components';
import { spacing } from '@/constants';
import { useFavorites, useProfile } from '@/hooks/useProfile';
import { useRecentGames } from '@/hooks/useRecentGames';
import { useBuiltinTopics, useUserTopics } from '@/hooks/useTopics';
import { formatShortDate } from '@/utils/formatDate';

type TopicTab = 'explore' | 'mine';

const TOPIC_TABS: SegmentOption<TopicTab>[] = [
  { value: 'explore', label: 'Explore Topics' },
  { value: 'mine', label: 'My Topics' },
];

/** How many recent games to preview on Home; the full list lives in History. */
const RECENT_GAMES_PREVIEW_COUNT = 3;

export function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [topicTab, setTopicTab] = useState<TopicTab>('explore');

  // Live data from the local SQLite database (reloads automatically after any change).
  const builtinTopics = useBuiltinTopics();
  const userTopics = useUserTopics();
  const recentGamesQuery = useRecentGames(RECENT_GAMES_PREVIEW_COUNT);
  const profile = useProfile();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  // While searching, look through ALL topics (Explore + My Topics);
  // otherwise show only the selected tab.
  const visibleTopics = useMemo(() => {
    if (isSearching) {
      const query = trimmedQuery.toLowerCase();
      return [...builtinTopics.data, ...userTopics.data].filter((topic) =>
        topic.title.toLowerCase().includes(query),
      );
    }
    return topicTab === 'explore' ? builtinTopics.data : userTopics.data;
  }, [isSearching, trimmedQuery, topicTab, builtinTopics.data, userTopics.data]);

  const topicsLoading = builtinTopics.isLoading || userTopics.isLoading;
  const topicsError = builtinTopics.error ?? userTopics.error;

  let topicsEmptyMessage: string;
  if (topicsError) {
    topicsEmptyMessage = `Couldn't load topics. ${topicsError}`;
  } else if (topicsLoading) {
    topicsEmptyMessage = 'Loading topics…';
  } else if (isSearching) {
    topicsEmptyMessage = `No topics match "${trimmedQuery}".`;
  } else if (topicTab === 'mine') {
    topicsEmptyMessage = "You haven't created any topics yet.";
  } else {
    topicsEmptyMessage = 'No topics to explore yet.';
  }

  const recentGames = recentGamesQuery.data;

  return (
    <ScreenContainer>
      <View style={styles.topGroup}>
        {/* The gear opens Profile, where Settings (sound effects) and the profile menu live. */}
        <BrandHeader onSettingsPress={() => router.navigate('/profile')} />

        <AppTextInput
          icon="search-outline"
          placeholder="Search topics by title"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          accessibilityLabel="Search topics by title"
        />
      </View>

      <WelcomeBanner playerName={profile.data.displayName} message="Ready to sharpen your memory today?" />

      <Section
        title={isSearching ? 'Search Results' : 'Topics'}
        icon={isSearching ? 'search-outline' : 'albums-outline'}
      >
        {isSearching ? null : (
          <SegmentedTabs options={TOPIC_TABS} value={topicTab} onChange={setTopicTab} />
        )}
        <TopicCarousel
          topics={visibleTopics}
          emptyMessage={topicsEmptyMessage}
          onTopicPress={(topic) =>
            router.push({ pathname: '/game/[topicId]', params: { topicId: String(topic.id) } })
          }
          onTopicEdit={(topic) =>
            router.push({ pathname: '/topic/[id]/edit', params: { id: String(topic.id) } })
          }
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />
      </Section>

      <Section
        title="Recently Played"
        icon="play-circle-outline"
        actionLabel="See All"
        onActionPress={() => router.navigate('/history')}
      >
        {recentGames.length > 0 ? (
          <View style={styles.list}>
            {recentGames.map((game) => (
              <ListItem
                key={game.id}
                icon="game-controller-outline"
                title={game.topicTitle}
                subtitle={`Played ${formatShortDate(game.completedAt)}`}
                trailingText={`${Math.min(game.score, game.totalQuestions)}/${game.totalQuestions}`}
                showChevron
                onPress={() =>
                  router.push({ pathname: '/history/[historyId]', params: { historyId: String(game.id) } })
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="play-circle-outline"
            title="Nothing played yet"
            message="Topics you play will appear here."
          />
        )}
      </Section>

      <ActionCard
        icon="create-outline"
        title="Create a Topic"
        message="Turn your notes into flashcards in a few steps."
        actionLabel="Create Topic"
        actionIcon="add"
        onPress={() => router.navigate('/create')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topGroup: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
});
