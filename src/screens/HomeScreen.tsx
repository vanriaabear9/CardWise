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
import { SAMPLE_EXPLORE_TOPICS, SAMPLE_MY_TOPICS, SAMPLE_RECENT_GAMES } from '@/data/sampleData';
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

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  // While searching, look through ALL topics (Explore + My Topics);
  // otherwise show only the selected tab.
  const visibleTopics = useMemo(() => {
    if (isSearching) {
      const query = trimmedQuery.toLowerCase();
      return [...SAMPLE_EXPLORE_TOPICS, ...SAMPLE_MY_TOPICS].filter((topic) =>
        topic.title.toLowerCase().includes(query),
      );
    }
    return topicTab === 'explore' ? SAMPLE_EXPLORE_TOPICS : SAMPLE_MY_TOPICS;
  }, [isSearching, trimmedQuery, topicTab]);

  const topicsEmptyMessage = isSearching
    ? `No topics match "${trimmedQuery}".`
    : topicTab === 'mine'
      ? "You haven't created any topics yet."
      : 'No topics to explore yet.';

  const recentGames = SAMPLE_RECENT_GAMES.slice(0, RECENT_GAMES_PREVIEW_COUNT);

  return (
    <ScreenContainer>
      <View style={styles.topGroup}>
        {/* Settings screen doesn't exist yet; the button is a placeholder. */}
        <BrandHeader />

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

      <WelcomeBanner playerName="Player" message="Ready to sharpen your memory today?" />

      <Section
        title={isSearching ? 'Search Results' : 'Topics'}
        icon={isSearching ? 'search-outline' : 'albums-outline'}
      >
        {isSearching ? null : (
          <SegmentedTabs options={TOPIC_TABS} value={topicTab} onChange={setTopicTab} />
        )}
        <TopicCarousel topics={visibleTopics} emptyMessage={topicsEmptyMessage} />
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
                subtitle={`Played ${formatShortDate(game.playedAt)}`}
                trailingText={`${game.score}/${game.totalQuestions}`}
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
