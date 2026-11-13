import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';

import { AppButton, BackHeader, Card, EmptyState, ScreenContainer, Section } from '@/components';
import { colors, iconSize, radius, spacing, typography } from '@/constants';
import { useDatabaseQuery } from '@/hooks/useDatabaseQuery';
import { useFavorites } from '@/hooks/useProfile';
import { getTopicWithTerms } from '@/services/topicService';
import { formatShortDate } from '@/utils/formatDate';

/** Route: /topic/<id>/details — a topic's terms and descriptions, with Play, Favorite, and (user topics) Edit. */
export function TopicDetailsScreen({ topicId }: { topicId: number }) {
  const router = useRouter();
  const query = useCallback((db: SQLiteDatabase) => getTopicWithTerms(db, topicId), [topicId]);
  const { data: topic, isLoading, error, reload } = useDatabaseQuery(query, null);
  const { favoriteIds, setTopicFavorite } = useFavorites();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/');
  };

  if (isLoading && !topic) {
    return (
      <ScreenContainer>
        <BackHeader label="Topic" title="Loading…" onBack={goBack} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !topic) {
    return (
      <ScreenContainer>
        <BackHeader label="Topic" title="Topic Details" onBack={goBack} />
        <EmptyState
          icon="alert-circle-outline"
          title={error ? "Couldn't load this topic" : 'Topic not found'}
          message={error ?? 'This topic may have been deleted.'}
        >
          {error ? <AppButton label="Try Again" icon="refresh" onPress={reload} /> : null}
        </EmptyState>
      </ScreenContainer>
    );
  }

  const isFavorite = favoriteIds.has(topic.id);
  const descriptionCount = topic.terms.reduce((sum, term) => sum + term.descriptions.length, 0);

  return (
    <ScreenContainer>
      <BackHeader label={topic.isBuiltin ? 'Explore Topic' : 'My Topic'} title={topic.title} onBack={goBack} />

      <Card>
        {topic.description ? <Text style={styles.description}>{topic.description}</Text> : null}
        <Text style={styles.meta}>
          {topic.category} · {topic.terms.length} {topic.terms.length === 1 ? 'term' : 'terms'} · {descriptionCount}{' '}
          {descriptionCount === 1 ? 'description' : 'descriptions'}
        </Text>
        <Text style={styles.meta}>
          {topic.isBuiltin ? 'Built-in topic (protected)' : `Updated ${formatShortDate(topic.updatedAt)}`}
        </Text>
      </Card>

      <View style={styles.actions}>
        <AppButton
          label="Play"
          icon="play"
          disabled={descriptionCount === 0}
          onPress={() => router.push({ pathname: '/game/[topicId]', params: { topicId: String(topic.id) } })}
        />
        <AppButton
          label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          icon={isFavorite ? 'heart' : 'heart-outline'}
          variant="secondary"
          onPress={() => void setTopicFavorite(topic.id, !isFavorite)}
        />
        {!topic.isBuiltin ? (
          <AppButton
            label="Edit Topic"
            icon="pencil"
            variant="secondary"
            onPress={() => router.push({ pathname: '/topic/[id]/edit', params: { id: String(topic.id) } })}
          />
        ) : null}
      </View>

      <Section title="Terms & Descriptions" icon="list-outline">
        {topic.terms.length === 0 ? (
          <EmptyState icon="document-outline" title="No terms yet" message="This topic doesn't have any terms." />
        ) : (
          topic.terms.map((term) => (
            <View key={term.id} style={styles.term}>
              <Text style={styles.termText}>{term.termText}</Text>
              {term.descriptions.length === 0 ? (
                <Text style={styles.meta}>No descriptions</Text>
              ) : (
                term.descriptions.map((description) => (
                  <View key={description.id} style={styles.descriptionRow}>
                    <Ionicons name="ellipse" size={iconSize.sm - 10} color={colors.secondary} style={styles.dot} />
                    <Text style={styles.descriptionText}>{description.descriptionText}</Text>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  description: {
    ...typography.body,
    lineHeight: 21,
  },
  meta: typography.caption,
  actions: {
    gap: spacing.md,
  },
  term: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  termText: {
    ...typography.subheading,
    color: colors.highlight,
  },
  descriptionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    marginTop: 8,
  },
  descriptionText: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
});
