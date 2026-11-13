import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AppButton, BackHeader, EmptyState, ScreenContainer, TopicListCard } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { useUserTopics } from '@/hooks/useTopics';
import { getErrorMessage } from '@/services/errors';
import { deleteTopic } from '@/services/topicService';
import type { TopicSummary } from '@/types';

/**
 * The user's own topics, with View / Edit / Delete.
 * Built-in topics are not listed here: they can't be edited or deleted.
 */
export function ManageTopicsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data: topics, isLoading, error, reload } = useUserTopics();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  const confirmDelete = (topic: TopicSummary) => {
    Alert.alert(
      'Delete this topic?',
      `"${topic.title}" and its ${topic.cardCount} ${topic.cardCount === 1 ? 'term' : 'terms'} will be permanently deleted.\n\nYour game history for this topic will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(topic.id);
            try {
              await deleteTopic(db, topic.id);
            } catch (deleteError) {
              Alert.alert("Couldn't delete the topic", getErrorMessage(deleteError));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="Manage Topics" onBack={goBack} />
      <Text style={styles.caption}>
        Your own topics. Built-in Explore Topics are protected and can't be edited or deleted.
      </Text>

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Couldn't load your topics" message={error}>
          <AppButton label="Try Again" icon="refresh" onPress={reload} />
        </EmptyState>
      ) : isLoading && topics.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : topics.length === 0 ? (
        <EmptyState icon="create-outline" title="No topics yet" message="Topics you create will appear here.">
          <AppButton label="Create a Topic" icon="add" onPress={() => router.navigate('/create')} />
        </EmptyState>
      ) : (
        <View style={styles.list}>
          <Text style={styles.count}>
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
          </Text>
          {topics.map((topic) => (
            <TopicListCard
              key={topic.id}
              topic={topic}
              showUpdated
              onPress={() => router.push({ pathname: '/topic/[id]/details', params: { id: String(topic.id) } })}
              actions={
                <>
                  <View style={styles.action}>
                    <AppButton
                      label="Edit"
                      icon="pencil"
                      variant="secondary"
                      disabled={deletingId !== null}
                      onPress={() => router.push({ pathname: '/topic/[id]/edit', params: { id: String(topic.id) } })}
                    />
                  </View>
                  <View style={styles.action}>
                    <AppButton
                      label="Delete"
                      icon="trash-outline"
                      variant="danger"
                      loading={deletingId === topic.id}
                      disabled={deletingId !== null && deletingId !== topic.id}
                      onPress={() => confirmDelete(topic)}
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
  caption: {
    ...typography.caption,
    marginTop: -spacing.sm,
  },
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
