import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants';
import type { TopicSummary } from '@/types';

import { TopicCard } from './TopicCard';

interface TopicCarouselProps {
  topics: TopicSummary[];
  /** Text shown when there are no topics to display. */
  emptyMessage: string;
  onTopicPress?: (topic: TopicSummary) => void;
  /** When provided, user-created topics show an edit button. Built-in topics never do. */
  onTopicEdit?: (topic: TopicSummary) => void;
  /** When provided, every topic shows a heart button. */
  onToggleFavorite?: (topic: TopicSummary) => void;
  favoriteIds?: ReadonlySet<number>;
}

/** Card width: ~62% of the screen, kept between 200 and 280 for small and large phones. */
const CARD_WIDTH_RATIO = 0.62;
const MIN_CARD_WIDTH = 200;
const MAX_CARD_WIDTH = 280;

/**
 * Horizontally scrolling row of topic cards.
 * Extends to the screen edges so cards can scroll past the side padding.
 */
export function TopicCarousel({
  topics,
  emptyMessage,
  onTopicPress,
  onTopicEdit,
  onToggleFavorite,
  favoriteIds,
}: TopicCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(
    MAX_CARD_WIDTH,
    Math.max(MIN_CARD_WIDTH, Math.round(screenWidth * CARD_WIDTH_RATIO)),
  );

  if (topics.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={topics}
      keyExtractor={(topic) => String(topic.id)}
      extraData={favoriteIds} // re-render cards when a heart changes
      renderItem={({ item }) => (
        <TopicCard
          topic={item}
          width={cardWidth}
          onPress={onTopicPress ? () => onTopicPress(item) : undefined}
          onEditPress={onTopicEdit && !item.isBuiltin ? () => onTopicEdit(item) : undefined}
          onFavoritePress={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
          isFavorite={favoriteIds?.has(item.id) ?? false}
        />
      )}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + spacing.md}
      decelerationRate="fast"
      style={styles.list}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  list: {
    // Cancel the screen's side padding so cards scroll edge to edge.
    marginHorizontal: -spacing.lg,
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
  },
});
