import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { TopicSummary } from '@/types';

interface TopicCardProps {
  topic: TopicSummary;
  width: number;
  onPress?: () => void;
}

/** Card showing a topic's title, short description, and number of flashcards. */
export function TopicCard({ topic, width, onPress }: TopicCardProps) {
  const cardLabel = topic.cardCount === 1 ? 'card' : 'cards';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${topic.title}, ${topic.cardCount} ${cardLabel}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.iconBadge}>
        <Ionicons name="book-outline" size={iconSize.md} color={colors.secondary} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {topic.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {topic.description}
        </Text>
      </View>

      <View style={styles.footer}>
        <Ionicons name="copy-outline" size={iconSize.sm} color={colors.highlight} />
        <Text style={styles.count}>
          {topic.cardCount} {cardLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  body: {
    gap: spacing.xs,
  },
  title: typography.subheading,
  description: {
    ...typography.caption,
    // Reserve two lines so cards in a row stay the same height.
    minHeight: 36,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  count: {
    ...typography.label,
    color: colors.highlight,
  },
});
