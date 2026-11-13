import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AppButton, EmptyState, IconButton, ScreenContainer, TopicForm } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { useTopicDraft } from '@/hooks/useTopicDraft';
import { getErrorMessage } from '@/services/errors';
import { deleteTopic, getTopicWithTerms, updateTopicWithTerms } from '@/services/topicService';
import { createEmptyDraft, draftFromTopic, draftToEditInput } from '@/utils/topicDraft';

interface EditTopicScreenProps {
  topicId: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

/**
 * Edit a saved (user-created) topic: change the title, description, terms, and descriptions.
 * Changes are saved to the SAME topic in one transaction (no duplicate is created).
 */
export function EditTopicScreen({ topicId }: EditTopicScreenProps) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, dispatch, errors, visibleErrors, showErrors, reset } = useTopicDraft(createEmptyDraft);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Load the topic once, when the screen opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const topic = await getTopicWithTerms(db, topicId);
        if (cancelled) return;
        if (!topic) {
          setLoadState({ status: 'error', message: 'This topic no longer exists.' });
        } else if (topic.isBuiltin) {
          setLoadState({ status: 'error', message: 'Built-in topics cannot be edited.' });
        } else {
          reset(draftFromTopic(topic));
          setLoadState({ status: 'ready' });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({ status: 'error', message: getErrorMessage(error) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // `reset` is recreated each render; loading should only depend on the db and topic id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, topicId]);

  const handleSave = async () => {
    if (saving || deleting) return;
    if (errors.count > 0) {
      showErrors();
      return;
    }
    setSaving(true);
    try {
      await updateTopicWithTerms(db, topicId, draftToEditInput(draft));
      Alert.alert('Changes saved', `"${draft.title.trim()}" was updated.`, [{ text: 'OK', onPress: goBack }]);
    } catch (error) {
      Alert.alert('Could not save changes', `${getErrorMessage(error)}\n\nNothing was changed.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete this topic?',
      `"${draft.title.trim() || 'This topic'}" and all of its terms and descriptions will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteTopic(db, topicId);
              goBack();
            } catch (error) {
              Alert.alert('Could not delete topic', getErrorMessage(error));
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <IconButton icon="arrow-back" accessibilityLabel="Go back" onPress={goBack} />
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            Edit Topic
          </Text>
          <Text style={styles.subtitle}>Changes are saved when you tap Save Changes.</Text>
        </View>
      </View>

      {loadState.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadState.status === 'error' ? (
        <EmptyState icon="alert-circle-outline" title="Can't edit this topic" message={loadState.message}>
          <AppButton label="Go back" icon="arrow-back" onPress={goBack} />
        </EmptyState>
      ) : (
        <TopicForm
          draft={draft}
          dispatch={dispatch}
          errors={visibleErrors}
          onSave={handleSave}
          saving={saving}
          saveLabel="Save Changes"
          footer={
            <AppButton
              label="Delete Topic"
              icon="trash-outline"
              variant="danger"
              onPress={handleDelete}
              loading={deleting}
              disabled={saving}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: typography.title,
  subtitle: typography.caption,
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
});
