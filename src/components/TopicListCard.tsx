import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { TopicSummary } from '@/types';
import { formatShortDate } from '@/utils/formatDate';

interface TopicListCardProps {
  topic: TopicSummary;
  /** Tapping the card body (e.g. open details). */
  onPress?: () => void;
  /** Buttons shown along the bottom of the card. */
  actions?: ReactNode;
  /** Show the "Updated <date>" line (Manage Topics). */
  showUpdated?: boolean;
}

/** Full-width topic row: title, built-in tag, term/description counts, and actions. */
export function TopicListCard({ topic, onPress, actions, showUpdated = false }: TopicListCardProps) {
  const terms = `${topic.cardCount} ${topic.cardCount === 1 ? 'term' : 'terms'}`;
  const descriptions = `${topic.descriptionCount} ${topic.descriptionCount === 1 ? 'description' : 'descriptions'}`;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${topic.title}, ${terms}, ${descriptions}`}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.iconBadge}>
          <Ionicons name={topic.isBuiltin ? 'library-outline' : 'book-outline'} size={iconSize.md} color={colors.secondary} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {topic.title}
            </Text>
            {topic.isBuiltin ? (
              <View style={styles.tag}>
                <Ionicons name="lock-closed" size={11} color={colors.highlight} />
                <Text style={styles.tagText}>Built-in</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {terms} · {descriptions}
          </Text>
          {showUpdated ? (
            <Text style={styles.meta}>
              Updated {formatShortDate(topic.updatedAt)} · Created {formatShortDate(topic.createdAt)}
            </Text>
          ) : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={iconSize.md} color={colors.textSecondary} /> : null}
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.subheading,
    flexShrink: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryMuted,
  },
  tagText: {
    ...typography.label,
    fontSize: 11,
    color: colors.highlight,
  },
  meta: typography.caption,
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
