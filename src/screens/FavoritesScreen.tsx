import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton, BackHeader, EmptyState, ScreenContainer, TopicListCard } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { useFavorites, useFavoriteTopics } from '@/hooks/useProfile';

/** All favorite topics (built-in and user-created). Play directly or remove from favorites. */
export function FavoritesScreen() {
  const router = useRouter();
  const { data: topics, isLoading, error, reload } = useFavoriteTopics();
  const { setTopicFavorite } = useFavorites();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="My Favorites" onBack={goBack} />

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Couldn't load your favorites" message={error}>
          <AppButton label="Try Again" icon="refresh" onPress={reload} />
        </EmptyState>
      ) : isLoading && topics.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : topics.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favorites yet"
          message="Tap the heart on any topic card on the Home screen to save it here."
        >
          <AppButton label="Browse Topics" icon="albums-outline" onPress={() => router.navigate('/')} />
        </EmptyState>
      ) : (
        <View style={styles.list}>
          <Text style={styles.count}>
            {topics.length} {topics.length === 1 ? 'favorite' : 'favorites'}
          </Text>
          {topics.map((topic) => (
            <TopicListCard
              key={topic.id}
              topic={topic}
              onPress={() => router.push({ pathname: '/topic/[id]/details', params: { id: String(topic.id) } })}
              actions={
                <>
                  <View style={styles.action}>
                    <AppButton
                      label="Play"
                      icon="play"
                      onPress={() =>
                        router.push({ pathname: '/game/[topicId]', params: { topicId: String(topic.id) } })
                      }
                    />
                  </View>
                  <View style={styles.action}>
                    <AppButton
                      label="Remove"
                      icon="heart-dislike-outline"
                      variant="secondary"
                      accessibilityLabel={`Remove ${topic.title} from favorites`}
                      onPress={() => void setTopicFavorite(topic.id, false)}
                    />
                  </View>
                </>
              }
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  list: {
    gap: spacing.md,
  },
  count: typography.label,
  action: {
    flex: 1,
  },
});
